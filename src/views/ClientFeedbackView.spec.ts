import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/vue'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { reactive } from 'vue'
import { useRoute } from 'vue-router'
import { apiGet, createPracticeReview, fetchPublicSpecialistProfile } from '../lib/api'
import { useAuthStore } from '../stores/auth'
import ClientFeedbackView from './ClientFeedbackView.vue'

vi.mock('../lib/api', async () => {
  const actual = await vi.importActual<typeof import('../lib/api')>('../lib/api')
  return {
    ...actual,
    fetchPublicSpecialistProfile: vi.fn(),
    createPracticeReview: vi.fn(),
    apiGet: vi.fn(),
  }
})

vi.mock('vue-router', () => ({
  RouterLink: {
    props: ['to'],
    template: '<a><slot /></a>',
  },
  useRoute: vi.fn(),
}))

const mockedFetchProfile = vi.mocked(fetchPublicSpecialistProfile)
const mockedCreatePracticeReview = vi.mocked(createPracticeReview)
const mockedApiGet = vi.mocked(apiGet)
const mockedUseRoute = vi.mocked(useRoute)

const routeState = reactive({
  params: { slug: 'spec-slug' },
})

function renderView() {
  const pinia = createPinia()
  setActivePinia(pinia)
  const auth = useAuthStore()
  auth.$reset()
  auth.setToken('access')
  auth.setMe({
    user: {
      id: 10,
      username: 'client-user',
      email: 'client@example.com',
      role: 'CLIENT',
      roles: ['CLIENT'],
    },
    access_state: null,
    effective_entitlements: null,
    counts: null,
    server_time: '2026-05-02T00:00:00Z',
  })

  return render(ClientFeedbackView, {
    global: {
      plugins: [pinia],
      stubs: {
        RouterLink: {
          props: ['to'],
          template: '<a><slot /></a>',
        },
      },
    },
  })
}

describe('ClientFeedbackView', () => {
  beforeEach(() => {
    cleanup()
    mockedUseRoute.mockReturnValue(routeState as any)
    mockedFetchProfile.mockReset()
    mockedCreatePracticeReview.mockReset()
    mockedApiGet.mockReset()

    mockedFetchProfile.mockResolvedValue({
      therapist_id: 77,
      display_name: 'Олена Коваль',
      public_slug: 'olena-koval',
      slug: 'olena-koval',
    } as any)
    mockedApiGet.mockResolvedValue([] as any)
    mockedCreatePracticeReview.mockResolvedValue({ id: 1 } as any)
  })

  it('renders consent checkbox and helper text', async () => {
    renderView()
    await screen.findByPlaceholderText('Опишіть свій досвід співпраці.')
    const checkbox = await screen.findByRole('checkbox')
    expect(checkbox).toBeInTheDocument()
    expect(
      screen.getByText(/Спеціаліст зможе використати лише текст відгуку без вашого імені/)
    ).toBeInTheDocument()
  })

  it('consent checkbox is unchecked by default', async () => {
    renderView()
    await screen.findByPlaceholderText('Опишіть свій досвід співпраці.')
    const checkbox = await screen.findByRole('checkbox')
    expect(checkbox).toBeInTheDocument()
    expect(checkbox).not.toBeChecked()
  })

  it('submit unchecked sends allow_anonymous_external_use=false', async () => {
    renderView()
    await fireEvent.update(await screen.findByPlaceholderText('Опишіть свій досвід співпраці.'), 'Дякую')
    await fireEvent.click(screen.getByRole('button', { name: 'Надіслати відгук' }))

    await waitFor(() => {
      expect(mockedCreatePracticeReview).toHaveBeenCalledWith(77, 'Дякую', false)
    })
  })

  it('submit checked sends allow_anonymous_external_use=true', async () => {
    renderView()
    await fireEvent.update(await screen.findByPlaceholderText('Опишіть свій досвід співпраці.'), 'Дякую')
    await fireEvent.click(screen.getByRole('checkbox'))
    await fireEvent.click(screen.getByRole('button', { name: 'Надіслати відгук' }))

    await waitFor(() => {
      expect(mockedCreatePracticeReview).toHaveBeenCalledWith(77, 'Дякую', true)
    })
  })

  it('keeps existing success behavior', async () => {
    renderView()
    await fireEvent.update(await screen.findByPlaceholderText('Опишіть свій досвід співпраці.'), 'Дякую')
    await fireEvent.click(screen.getByRole('button', { name: 'Надіслати відгук' }))

    expect(await screen.findByText('Дякуємо! Ваш відгук для Олена К. збережено.')).toBeInTheDocument()
  })

  it('keeps SPECIALIST_FEEDBACK_LIMIT_REACHED handling', async () => {
    mockedCreatePracticeReview.mockRejectedValueOnce({
      response: { data: { code: 'SPECIALIST_FEEDBACK_LIMIT_REACHED' } },
    } as any)

    renderView()
    await fireEvent.update(await screen.findByPlaceholderText('Опишіть свій досвід співпраці.'), 'Дякую')
    await fireEvent.click(screen.getByRole('button', { name: 'Надіслати відгук' }))

    expect(
      (await screen.findAllByText('Ви вже залишили максимальну кількість відгуків для цього спеціаліста.')).length
    ).toBeGreaterThan(0)
  })

})
