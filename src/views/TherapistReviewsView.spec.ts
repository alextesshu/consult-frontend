import { fireEvent, render, screen, waitFor } from '@testing-library/vue'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuthStore } from '../stores/auth'
import TherapistReviewsView from './TherapistReviewsView.vue'
import { fetchCabinetReviews, updateCabinetReviewStatus } from '../lib/api'

vi.mock('../lib/api', async () => {
  const actual = await vi.importActual<typeof import('../lib/api')>('../lib/api')
  return {
    ...actual,
    fetchCabinetReviews: vi.fn(),
    updateCabinetReviewStatus: vi.fn(),
  }
})

const mockedFetchCabinetReviews = vi.mocked(fetchCabinetReviews)
const mockedUpdateCabinetReviewStatus = vi.mocked(updateCabinetReviewStatus)

function review(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    source: 'practice',
    review_uid: 'practice:1',
    author_display_name: 'Олена',
    rating: null,
    text: 'Дякую за консультацію...',
    status: 'PENDING',
    created_at: '2026-05-02T10:00:00Z',
    session_id: null,
    share_card_permission: {
      can_create: true,
      status: 'GRANTED_ANONYMOUS',
      mode: 'anonymous',
    },
    ...overrides,
  }
}

function renderView(withDisplayName = true) {
  const pinia = createPinia()
  setActivePinia(pinia)
  const auth = useAuthStore()
  auth.$reset()
  auth.setMe({
    user: {
      id: 42,
      username: 'therapist_slug',
      email: 'spec@example.com',
      display_name: withDisplayName ? 'Олена Коваль' : '',
      first_name: withDisplayName ? '' : '',
      last_name: withDisplayName ? '' : '',
      public_profile_path: '/s/anna-kupriyan',
      role: 'SPECIALIST',
      roles: ['SPECIALIST'],
    },
    access_state: null,
    effective_entitlements: null,
    counts: null,
    server_time: '2026-05-02T00:00:00Z',
  } as any)

  return render(TherapistReviewsView, {
    global: {
      plugins: [pinia],
      stubs: {
        RouterLink: {
          props: ['to'],
          template: '<a :href="typeof to === \'string\' ? to : to.path"><slot /></a>',
        },
      },
    },
  })
}

describe('TherapistReviewsView', () => {
  beforeEach(() => {
    mockedFetchCabinetReviews.mockReset()
    mockedUpdateCabinetReviewStatus.mockReset()
  })

  it('renders page title and private subtitle', async () => {
    mockedFetchCabinetReviews.mockResolvedValue([])
    renderView()
    expect(await screen.findByRole('heading', { name: 'Відгуки' })).toBeInTheDocument()
    expect(
      screen.getByText('Тут зібрані приватні відгуки від клієнтів. Вони доступні тільки у вашому кабінеті.')
    ).toBeInTheDocument()
  })

  it('applies status filters with expected API params', async () => {
    mockedFetchCabinetReviews.mockResolvedValue([])
    renderView()
    await screen.findByRole('button', { name: 'Усі' })

    await fireEvent.click(screen.getByRole('button', { name: 'Нові' }))
    expect(mockedFetchCabinetReviews).toHaveBeenLastCalledWith({ status: 'PENDING' })

    await fireEvent.click(screen.getByRole('button', { name: 'Переглянуті' }))
    expect(mockedFetchCabinetReviews).toHaveBeenLastCalledWith({ status: 'APPROVED' })

    await fireEvent.click(screen.getByRole('button', { name: 'Спам / приховані' }))
    expect(mockedFetchCabinetReviews).toHaveBeenLastCalledWith({ status: 'REJECTED' })
  })

  it('shows create card button only for granted anonymous practice feedback', async () => {
    mockedFetchCabinetReviews.mockResolvedValue([
      review({ id: 1, source: 'practice', review_uid: 'practice:1', share_card_permission: { can_create: true, status: 'GRANTED_ANONYMOUS', mode: 'anonymous' } }),
      review({ id: 2, source: 'practice', review_uid: 'practice:2', share_card_permission: { can_create: false, status: 'NOT_GRANTED', mode: null } }),
      review({ id: 3, source: 'practice', review_uid: 'practice:3', share_card_permission: { can_create: false, status: 'REVOKED', mode: null } }),
      review({ id: 4, source: 'session', review_uid: 'session:4', share_card_permission: { can_create: false, status: 'UNSUPPORTED_REVIEW_SOURCE', mode: null } }),
    ] as any)

    const { container } = renderView()
    expect((await screen.findAllByRole('button', { name: 'Створити картку' })).length).toBe(1)

    expect(container.textContent || '').toContain('Використання поза платформою: дозволено анонімно')
    expect(container.textContent || '').toContain('Використання поза платформою: не дозволено')
    expect(container.textContent || '').toContain('Дозвіл відкликано')
    expect(container.textContent || '').toContain('Картки доступні лише для анонімних відгуків')
  })

  it('triage actions for pending review call status update', async () => {
    mockedFetchCabinetReviews.mockResolvedValue([review({ status: 'PENDING', review_uid: 'practice:10', id: 10 })] as any)
    mockedUpdateCabinetReviewStatus.mockResolvedValue({
      id: 10,
      source: 'practice',
      review_uid: 'practice:10',
      status: 'APPROVED',
    } as any)

    renderView()
    expect(await screen.findByRole('button', { name: 'Позначити як переглянутий' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Помітити як спам' })).toBeInTheDocument()

    await fireEvent.click(screen.getByRole('button', { name: 'Позначити як переглянутий' }))
    expect(mockedUpdateCabinetReviewStatus).toHaveBeenCalledWith({
      source: 'practice',
      id: 10,
      status: 'APPROVED',
    })
  })

  it('triage action for pending review can send rejected status', async () => {
    mockedFetchCabinetReviews.mockResolvedValue([review({ status: 'PENDING', review_uid: 'practice:10', id: 10 })] as any)
    mockedUpdateCabinetReviewStatus.mockResolvedValue({
      id: 10,
      source: 'practice',
      review_uid: 'practice:10',
      status: 'REJECTED',
    } as any)

    renderView()
    await fireEvent.click(await screen.findByRole('button', { name: 'Помітити як спам' }))
    expect(mockedUpdateCabinetReviewStatus).toHaveBeenCalledWith({
      source: 'practice',
      id: 10,
      status: 'REJECTED',
    })
  })

  it('triage actions for approved and rejected review call expected statuses', async () => {
    mockedFetchCabinetReviews.mockResolvedValue([
      review({ status: 'APPROVED', review_uid: 'practice:11', id: 11 }),
      review({ status: 'REJECTED', review_uid: 'practice:12', id: 12 }),
    ] as any)
    mockedUpdateCabinetReviewStatus.mockResolvedValue({ id: 11, source: 'practice', review_uid: 'practice:11', status: 'PENDING' } as any)

    renderView()
    expect((await screen.findAllByText('Дякую за консультацію...')).length).toBeGreaterThan(0)

    const resetButtons = screen.getAllByRole('button', { name: 'Повернути до нових' })
    expect(resetButtons.length).toBeGreaterThan(0)
    const [firstResetButton] = resetButtons
    expect(firstResetButton).toBeDefined()
    await fireEvent.click(firstResetButton as HTMLElement)
    expect(mockedUpdateCabinetReviewStatus).toHaveBeenCalledWith({ source: 'practice', id: 11, status: 'PENDING' })
  })

  it('refetches current filter after status update', async () => {
    mockedFetchCabinetReviews
      .mockResolvedValueOnce([review({ status: 'PENDING', review_uid: 'practice:13', id: 13 })] as any)
      .mockResolvedValueOnce([] as any)
    mockedUpdateCabinetReviewStatus.mockResolvedValue({ id: 13, source: 'practice', review_uid: 'practice:13', status: 'APPROVED' } as any)

    renderView()
    await fireEvent.click(await screen.findByRole('button', { name: 'Позначити як переглянутий' }))

    await waitFor(() => {
      expect(mockedFetchCabinetReviews).toHaveBeenCalledTimes(2)
    })
  })

  it('shows scoped error when status update fails', async () => {
    mockedFetchCabinetReviews.mockResolvedValue([review({ status: 'PENDING', review_uid: 'practice:14', id: 14 })] as any)
    mockedUpdateCabinetReviewStatus.mockRejectedValueOnce(new Error('failed'))

    renderView()
    await fireEvent.click(await screen.findByRole('button', { name: 'Позначити як переглянутий' }))
    expect(await screen.findByText('Не вдалося оновити статус відгуку. Спробуйте ще раз.')).toBeInTheDocument()
  })

  it('passes safe specialistDisplayName to modal and not username fallback', async () => {
    mockedFetchCabinetReviews.mockResolvedValue([review()] as any)
    renderView(true)
    await fireEvent.click(await screen.findByRole('button', { name: 'Створити картку' }))
    await fireEvent.click(screen.getByLabelText('Показувати ім’я спеціаліста'))
    expect(screen.getByText('Олена Коваль')).toBeInTheDocument()
    expect(screen.queryByText('therapist_slug')).not.toBeInTheDocument()
  })

  it('falls back to "Спеціаліст" when only username exists', async () => {
    mockedFetchCabinetReviews.mockResolvedValue([review()] as any)
    renderView(false)
    await fireEvent.click(await screen.findByRole('button', { name: 'Створити картку' }))
    await fireEvent.click(screen.getByLabelText('Показувати ім’я спеціаліста'))
    expect(screen.getByText('Спеціаліст')).toBeInTheDocument()
    expect(screen.queryByText('therapist_slug')).not.toBeInTheDocument()
  })

  it('does not render deprecated status wording', async () => {
    mockedFetchCabinetReviews.mockResolvedValue([review()] as any)
    const { container } = renderView()
    await screen.findByText('Дякую за консультацію...')
    expect(container.textContent || '').not.toContain('Підтверджено')
    expect(container.textContent || '').not.toContain('Затверджено')
    expect(container.textContent || '').not.toContain('Опубліковано')
  })
})
