import { fireEvent, render, screen, waitFor } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import TherapistReviewsView from './TherapistReviewsView.vue'
import { fetchCabinetReviews } from '../lib/api'

vi.mock('../lib/api', async () => {
  const actual = await vi.importActual<typeof import('../lib/api')>('../lib/api')
  return {
    ...actual,
    fetchCabinetReviews: vi.fn(),
  }
})

const mockedFetchCabinetReviews = vi.mocked(fetchCabinetReviews)

function renderView() {
  return render(TherapistReviewsView, {
    global: {
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
  })

  it('renders page title', async () => {
    mockedFetchCabinetReviews.mockResolvedValue([])
    renderView()
    expect(await screen.findByRole('heading', { name: 'Відгуки' })).toBeInTheDocument()
    expect(
      screen.getByText('Тут зібрані приватні відгуки від клієнтів. Вони доступні тільки у вашому кабінеті.')
    ).toBeInTheDocument()
  })

  it('loads reviews from cabinet endpoint', async () => {
    mockedFetchCabinetReviews.mockResolvedValue([])
    renderView()
    await waitFor(() => {
      expect(mockedFetchCabinetReviews).toHaveBeenCalledWith(undefined)
    })
  })

  it('renders review fields and status labels without published wording', async () => {
    mockedFetchCabinetReviews.mockResolvedValue([
      {
        id: 1,
        source: 'session',
        review_uid: 'session:1',
        author_display_name: 'Олена',
        rating: 1,
        text: 'Дякую за консультацію...',
        status: 'PENDING',
        created_at: '2026-05-02T10:00:00Z',
        session_id: 123,
      },
      {
        id: 2,
        source: 'practice',
        review_uid: 'practice:2',
        author_display_name: 'Олена',
        rating: 1,
        text: 'Було корисно',
        status: 'APPROVED',
        created_at: '2026-05-02T11:00:00Z',
        session_id: null,
      },
      {
        id: 3,
        source: 'session',
        review_uid: 'session:3',
        author_display_name: 'Марія',
        rating: 1,
        text: 'Дякую',
        status: 'REJECTED',
        created_at: '2026-05-02T12:00:00Z',
        session_id: null,
      },
    ] as any)

    const { container } = renderView()
    expect((await screen.findAllByText('Відгук від: Олена')).length).toBe(2)
    expect(screen.getByText('Дякую за консультацію...')).toBeInTheDocument()
    expect(container.textContent || '').toContain('02.05.2026')
    expect(screen.getAllByText('Новий').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Переглянуто').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Спам / приховано').length).toBeGreaterThan(0)
    expect(container.textContent || '').not.toContain('Опубліковано')
    expect(container.textContent || '').not.toContain('Очікує перевірки')
    expect(container.textContent || '').not.toContain('Підтверджено')
    expect(container.textContent || '').not.toContain('Затверджено')
    expect(container.textContent || '').not.toContain('Не враховано')
    expect(container.textContent || '').not.toContain('client_username')
    expect(container.textContent || '').not.toContain('review_text')
  })

  it('renders session link when session_id exists and hides when null', async () => {
    mockedFetchCabinetReviews.mockResolvedValue([
      {
        id: 1,
        source: 'session',
        review_uid: 'session:1',
        author_display_name: 'Олена',
        rating: 1,
        text: 'Дякую',
        status: 'PENDING',
        created_at: '2026-05-02T10:00:00Z',
        session_id: 123,
      },
      {
        id: 2,
        source: 'practice',
        review_uid: 'practice:2',
        author_display_name: 'Ірина',
        rating: 1,
        text: 'Текст',
        status: 'APPROVED',
        created_at: '2026-05-02T10:00:00Z',
        session_id: null,
      },
    ] as any)

    renderView()
    const links = await screen.findAllByRole('link', { name: 'Перейти до сесії' })
    expect(links).toHaveLength(1)
    expect(links[0]).toHaveAttribute('href', '/cabinet/sessions/123')
  })

  it('applies status filters with expected API params', async () => {
    mockedFetchCabinetReviews.mockResolvedValue([])
    renderView()
    await screen.findByRole('button', { name: 'Усі' })
    expect(screen.getByRole('button', { name: 'Нові' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Переглянуті' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Спам / приховані' })).toBeInTheDocument()

    await fireEvent.click(screen.getByRole('button', { name: 'Нові' }))
    expect(mockedFetchCabinetReviews).toHaveBeenLastCalledWith({ status: 'PENDING' })

    await fireEvent.click(screen.getByRole('button', { name: 'Переглянуті' }))
    expect(mockedFetchCabinetReviews).toHaveBeenLastCalledWith({ status: 'APPROVED' })

    await fireEvent.click(screen.getByRole('button', { name: 'Спам / приховані' }))
    expect(mockedFetchCabinetReviews).toHaveBeenLastCalledWith({ status: 'REJECTED' })
  })

  it('renders empty states', async () => {
    mockedFetchCabinetReviews.mockResolvedValue([])
    const { container } = renderView()
    await waitFor(() => {
      expect(container.textContent || '').toContain('Відгуків поки немає.')
    })

    await fireEvent.click(screen.getByRole('button', { name: 'Переглянуті' }))
    await waitFor(() => {
      expect(container.textContent || '').toContain('Немає відгуків із цим статусом.')
    })
  })

  it('renders generic and invalid-status errors', async () => {
    mockedFetchCabinetReviews.mockRejectedValueOnce(new Error('network'))
    renderView()
    expect(await screen.findByText('Не вдалося завантажити відгуки. Спробуйте ще раз.')).toBeInTheDocument()

    mockedFetchCabinetReviews.mockRejectedValueOnce({ response: { data: { code: 'REVIEW_INVALID_STATUS' } } } as any)
    await fireEvent.click(screen.getByRole('button', { name: 'Спробувати ще раз' }))
    expect(await screen.findByText('Некоректний статус відгуків.')).toBeInTheDocument()
  })

  it('accepts aggregated rows keyed by review_uid', async () => {
    mockedFetchCabinetReviews.mockResolvedValue([
      {
        id: 1,
        source: 'session',
        review_uid: 'session:1',
        author_display_name: 'Олена',
        rating: 1,
        text: 'Відгук із сесії',
        status: 'PENDING',
        created_at: '2026-05-02T10:00:00Z',
        session_id: 123,
      },
      {
        id: 1,
        source: 'practice',
        review_uid: 'practice:1',
        author_display_name: 'Олена',
        rating: 1,
        text: 'Відгук із практики',
        status: 'APPROVED',
        created_at: '2026-05-02T11:00:00Z',
        session_id: null,
      },
    ] as any)

    renderView()
    expect(await screen.findByText('Відгук із сесії')).toBeInTheDocument()
    expect(screen.getByText('Відгук із практики')).toBeInTheDocument()
  })
})

