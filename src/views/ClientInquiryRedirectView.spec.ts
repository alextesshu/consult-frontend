import { render, screen, waitFor } from '@testing-library/vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ClientInquiryRedirectView from './ClientInquiryRedirectView.vue'
import { fetchPublicSpecialists } from '../lib/api'

vi.mock('../lib/api', async () => {
  const actual = await vi.importActual<typeof import('../lib/api')>('../lib/api')

  return {
    ...actual,
    fetchPublicSpecialists: vi.fn(),
  }
})

const mockedFetchPublicSpecialists = vi.mocked(fetchPublicSpecialists)

async function renderView(initialPath = '/client/inquiries/12') {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/client/inquiries/:specialistId',
        name: 'client-inquiry-redirect',
        component: ClientInquiryRedirectView,
      },
      {
        path: '/specialist/:slug',
        name: 'public-profile',
        component: { template: '<div>Public Profile</div>' },
      },
      {
        path: '/specialists',
        component: { template: '<div>Catalog</div>' },
      },
    ],
  })

  await router.push(initialPath)
  await router.isReady()

  render(ClientInquiryRedirectView, {
    global: {
      plugins: [router],
    },
  })

  return { router }
}

describe('ClientInquiryRedirectView', () => {
  beforeEach(() => {
    mockedFetchPublicSpecialists.mockReset()
  })

  it('resolves the specialist slug and redirects to the public inquiry surface', async () => {
    mockedFetchPublicSpecialists.mockResolvedValue({
      results: [
        {
          therapist_id: 12,
          public_slug: 'olena',
          display_name: 'Олена',
        } as any,
      ],
      page: 1,
      page_size: 100,
      total: 1,
      total_pages: 1,
    })

    const { router } = await renderView()

    await waitFor(() => {
      expect(router.currentRoute.value.fullPath).toBe('/specialist/olena#inquiry')
    })
  })

  it('shows a fallback message when the specialist cannot be resolved', async () => {
    mockedFetchPublicSpecialists.mockResolvedValue({
      results: [],
      page: 1,
      page_size: 100,
      total: 0,
      total_pages: 1,
    })

    await renderView()

    expect(await screen.findByText('Не вдалося відкрити профіль спеціаліста для цього запиту.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Перейти до каталогу' })).toHaveAttribute('href', '/specialists')
  })
})
