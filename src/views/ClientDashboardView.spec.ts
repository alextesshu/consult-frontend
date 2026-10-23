import { fireEvent, render, screen, waitFor, within } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiGet, fetchClientMaterials, fetchClientSpecialists, fetchInquiryState, fetchInquiryThreads, type InquiryThread } from '../lib/api'
import { applyUiVersion } from '../lib/uiVersion'
import ClientDashboardView from './ClientDashboardView.vue'

vi.mock('../lib/api', () => ({
  apiGet: vi.fn(),
  fetchClientMaterials: vi.fn(),
  fetchClientSpecialists: vi.fn(),
  fetchInquiryState: vi.fn(),
  fetchInquiryThreads: vi.fn(),
  fetchPublicSpecialistProfile: vi.fn(),
}))

vi.mock('../composables/useConfirmModal', () => ({
  useConfirmModal: () => ({
    open: false, title: '', message: '', confirmText: '', cancelText: '', tone: 'default',
    confirm: vi.fn(), closeConfirm: vi.fn(), openConfirm: vi.fn(),
  }),
}))

const mockedApiGet = vi.mocked(apiGet)
const mockedFetchClientSpecialists = vi.mocked(fetchClientSpecialists)
const mockedFetchInquiryState = vi.mocked(fetchInquiryState)
const mockedFetchInquiryThreads = vi.mocked(fetchInquiryThreads)

function renderView() {
  return render(ClientDashboardView, {
    global: {
      stubs: {
        ConfirmModal: true,
        RouterLink: { props: ['to'], template: '<a :href="typeof to === \'string\' ? to : \'\'"><slot /></a>' },
      },
    },
  })
}

function mockDashboard({ upcoming = [], past = [], groups = [] }: { upcoming?: unknown[]; past?: unknown[]; groups?: unknown[] } = {}) {
  mockedApiGet.mockImplementation(async (url, config) => {
    if (url === '/booking/sessions/' && config?.params?.upcoming === true) return upcoming
    if (url === '/booking/sessions/' && config?.params?.upcoming === false) return past
    if (url === '/booking/group-events/') return groups
    throw new Error(`Unexpected apiGet call: ${url} ${JSON.stringify(config)}`)
  })
}

function session(overrides: Record<string, unknown> = {}) {
  return {
    id: 101, status: 'CONFIRMED', specialist: 14, specialist_name: 'Олена Коваль',
    specialist_public_slug: 'olena-koval', session_format: 'online', meeting_url: null,
    meeting_provider: null, join_available: false, slot: null,
    slot_start_at: '2099-06-15T10:00:00Z', slot_end_at: '2099-06-15T11:00:00Z', ...overrides,
  }
}

function inquiry(overrides: Record<string, unknown> = {}): InquiryThread {
  return {
    id: 501, specialist_id: 14, created_at: '2026-08-01T10:00:00Z', last_message_at: '2026-08-02T10:00:00Z',
    inquiry_status: 'OPEN', closed_reason: null,
    other_user: { id: 14, role: 'SPECIALIST', display_name: 'Олена Коваль' },
    last_message_preview: 'Домовимося про час', unread_count: 1, can_client_send: true,
    client_send_reason_code: null, can_specialist_reply: true, specialist_reply_reason_code: null, ...overrides,
  } as InquiryThread
}

describe('ClientDashboardView', () => {
  beforeEach(() => {
    applyUiVersion('v1')
    vi.mocked(fetchClientMaterials).mockReset()
    vi.mocked(fetchClientMaterials).mockResolvedValue({ results: [], next_cursor: null })
    vi.useRealTimers()
    mockedApiGet.mockReset()
    mockedFetchClientSpecialists.mockReset()
    mockedFetchInquiryState.mockReset()
    mockedFetchInquiryThreads.mockReset()
    localStorage.clear()
    mockedFetchClientSpecialists.mockResolvedValue([])
    mockedFetchInquiryThreads.mockResolvedValue([])
  })

  it('keeps v1 markup, API calls and styles isolated and loads materials only after opting in', async () => {
    mockDashboard({ upcoming: [session()] })
    const { container } = renderView()
    await screen.findByRole('heading', { name: 'Найближча сесія' })
    const before = container.innerHTML
    expect(fetchClientMaterials).not.toHaveBeenCalled()
    expect(container.querySelector('.pc2-client-dashboard')).toBeNull()
    applyUiVersion('v2')
    await screen.findByText('Поки що матеріалів немає.')
    expect(fetchClientMaterials).toHaveBeenCalledTimes(1)
    applyUiVersion('v1')
    await waitFor(() => expect(container.innerHTML).toBe(before))
    applyUiVersion('v2')
    await screen.findByText('Поки що матеріалів немає.')
    expect(fetchClientMaterials).toHaveBeenCalledTimes(1)
  })

  it('shows only client-published previews, never private content or direct attachment URLs', async () => {
    applyUiVersion('v2')
    mockDashboard()
    vi.mocked(fetchClientMaterials).mockResolvedValue({ results: [
      { id: 1, title: 'Опублікована вправа', content_preview: 'Короткий опис', content: 'FULL CONTENT NOT IN PREVIEW', url: 'https://example.test/private-attachment', session_id: null, material_type: 'exercise', published_at: '2026-10-01T10:00:00Z', private_notes: 'SECRET PRIVATE NOTE' },
      { id: 2, title: 'Без публікації', content_preview: 'HIDDEN PREVIEW', published_at: '' },
    ] as any, next_cursor: null })
    const { container } = renderView()
    const link = await screen.findByRole('link', { name: 'Матеріали: Опублікована вправа' })
    expect(link).toHaveAttribute('href', '/client/materials')
    expect(link).toHaveClass('pc2-card--interactive')
    expect(screen.getByText('Короткий опис')).toBeInTheDocument()
    expect(container).not.toHaveTextContent('SECRET PRIVATE NOTE')
    expect(container).not.toHaveTextContent('FULL CONTENT NOT IN PREVIEW')
    expect(container).not.toHaveTextContent('HIDDEN PREVIEW')
    expect(container.querySelector('a[href*="private-attachment"]')).toBeNull()
    expect(mockedApiGet.mock.calls.every(([url]) => !/notes|workbook/.test(url))).toBe(true)
    link.focus()
    expect(link).toHaveFocus()
  })

  it.each(['paid', 'awaiting_confirmation', 'unpaid', null])('keeps confirmation independent from payment %s in the v2 hero', async (payment) => {
    applyUiVersion('v2')
    mockDashboard({ upcoming: [session({ status: 'SCHEDULED', payment_badge_state: payment })] })
    const { container } = renderView()
    const hero = container.querySelector('.client__hero') as HTMLElement
    expect(await within(hero).findByText('Заплановано')).toHaveClass('pc2-tag--info')
    expect(within(hero).queryByText('Підтверджено')).not.toBeInTheDocument()
    if (payment === 'paid') expect(within(hero).getByText('Оплачено')).toHaveClass('pc2-tag--success')
    if (payment === 'awaiting_confirmation') expect(within(hero).getByText('Очікує підтвердження оплати')).toHaveClass('pc2-tag--warning')
    if (payment === 'unpaid') expect(within(hero).getByText('Не оплачено')).toHaveClass('pc2-tag--neutral')
    if (payment === null) expect(hero.querySelectorAll('.pc2-tag')).toHaveLength(1)
    expect(within(hero).queryByRole('link', { name: 'Приєднатися' })).not.toBeInTheDocument()
  })

  it('handles materials loading, denied access and retry without exposing stale data', async () => {
    applyUiVersion('v2')
    mockDashboard()
    let reject!: (reason: Error) => void
    vi.mocked(fetchClientMaterials).mockReturnValueOnce(new Promise((_, fail) => { reject = fail }))
    const { container } = renderView()
    expect(container.querySelector('.pc2-client-dashboard__materials')).toHaveAttribute('aria-busy', 'true')
    reject(new Error('403 restricted private payload'))
    const error = await screen.findByRole('alert')
    expect(error).toHaveTextContent('Не вдалося завантажити матеріали.')
    expect(container).not.toHaveTextContent('restricted private payload')
    await fireEvent.click(within(error).getByRole('button', { name: 'Спробувати ще раз' }))
    expect(await screen.findByText('Поки що матеріалів немає.')).toBeInTheDocument()
    expect(fetchClientMaterials).toHaveBeenCalledTimes(2)
  })

  it('presents v2 no-session, session loading and session error states without inventing a booking', async () => {
    applyUiVersion('v2')
    let resolveUpcoming!: (value: unknown[]) => void
    mockedApiGet.mockImplementation(async (url, config) => {
      if (url === '/booking/sessions/' && config?.params?.upcoming === true) return new Promise((resolve) => { resolveUpcoming = resolve })
      return []
    })
    const { container, unmount } = renderView()
    await waitFor(() => expect(container.querySelector('.client__hero')).toHaveAttribute('aria-busy', 'true'))
    resolveUpcoming([])
    expect(await screen.findByText('Наступної сесії поки не заплановано.')).toBeInTheDocument()
    expect(container.querySelector('.client__hero a[href^="/client/sessions/"]')).toBeNull()
    unmount()
    mockedApiGet.mockRejectedValue(new Error('fixture failure'))
    const failed = renderView()
    expect(await within(failed.container.querySelector('.client__hero') as HTMLElement).findByRole('heading', { name: 'Не вдалося завантажити найближчу сесію' })).toBeInTheDocument()
  })

  it('keeps a live session as the hero over upcoming, inquiry, and relationship states', async () => {
    const live = session({ id: 101, meeting_url: 'https://meet.google.com/live-room', meeting_provider: 'google_meet', join_available: true, slot_start_at: '2000-01-01T00:00:00Z', slot_end_at: '2100-01-01T00:00:00Z' })
    mockDashboard({ upcoming: [session({ id: 102 })], past: [live] })
    mockedFetchInquiryThreads.mockResolvedValue([inquiry()])
    mockedFetchClientSpecialists.mockResolvedValue([{ specialist_id: 14, display_name: 'Олена Коваль', public_slug: 'olena-koval', photo_url: null, relation_state: 'ACTIVE' }])

    const view = renderView()
    const hero = view.container.querySelector('.client__hero') as HTMLElement

    expect(await screen.findByRole('heading', { name: 'Сесія триває' })).toBeInTheDocument()
    expect(within(hero).getByText('Спеціаліст: Олена Коваль')).toBeInTheDocument()
    expect(within(hero).getByText('Сесія триває', { selector: '.status-pill' })).toBeInTheDocument()
    expect(within(hero).getByRole('link', { name: 'Приєднатися' })).toHaveAttribute('href', 'https://meet.google.com/live-room')
    expect(within(hero).getByRole('link', { name: 'Деталі сесії' })).toHaveAttribute('href', '/client/sessions/101')
    for (const legacyCard of view.container.querySelectorAll('.priority-card, .inquiry-card, .tips-card')) {
      expect(legacyCard).not.toBeVisible()
    }
  })

  it('uses the earliest upcoming session as the hero when no session is live', async () => {
    mockDashboard({ upcoming: [session({ id: 202, specialist_name: 'Марія', slot_start_at: '2099-06-16T10:00:00Z' }), session({ id: 201, specialist_name: 'Іван', status: 'SCHEDULED', slot_start_at: '2099-06-15T10:00:00Z' })] })
    mockedFetchInquiryThreads.mockResolvedValue([inquiry()])
    mockedFetchClientSpecialists.mockResolvedValue([{ specialist_id: 15, display_name: 'Активний спеціаліст', public_slug: 'active', photo_url: null, relation_state: 'ACTIVE' }])

    const view = renderView()
    const hero = view.container.querySelector('.client__hero') as HTMLElement

    expect(await screen.findByRole('heading', { name: 'Найближча сесія' })).toBeInTheDocument()
    expect(within(hero).getByText('Спеціаліст: Іван')).toBeInTheDocument()
    expect(within(hero).getByText('Заплановано', { selector: '.status-pill' })).toBeInTheDocument()
    expect(within(hero).getByRole('link', { name: 'Деталі сесії' })).toHaveAttribute('href', '/client/sessions/201')
  })

  it('uses an OPEN inquiry as the hero and routes to its canonical inquiry page', async () => {
    mockDashboard()
    mockedFetchInquiryThreads.mockResolvedValue([inquiry()])
    const view = renderView()
    const hero = view.container.querySelector('.client__hero') as HTMLElement

    expect(await screen.findByRole('heading', { name: 'Ваш запит' })).toBeInTheDocument()
    expect(within(hero).getByText('Олена К.')).toBeInTheDocument()
    expect(within(hero).getByText('Домовимося про час')).toBeInTheDocument()
    expect(within(hero).getByRole('link', { name: 'Відкрити запит' })).toHaveAttribute('href', '/client/inquiries/14')
    for (const legacyCard of view.container.querySelectorAll('.priority-card, .inquiry-card')) {
      expect(legacyCard).not.toBeVisible()
    }
  })

  it('routes an ACTIVE_CLIENT inquiry to the canonical chat flow', async () => {
    mockDashboard()
    mockedFetchInquiryThreads.mockResolvedValue([inquiry({ inquiry_status: 'ACTIVE_CLIENT', specialist_id: 17 })])
    renderView()

    expect(await screen.findByRole('heading', { name: 'Ваш запит' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Відкрити повний чат' })).toHaveAttribute('href', '/client/chat?therapist_id=17')
  })

  it('uses the canonical active relationship as the hero and keeps viewed specialists secondary', async () => {
    localStorage.setItem('viewedSpecialists', JSON.stringify([{ public_slug: 'viewed', display_name: 'Переглянутий спеціаліст' }]))
    mockDashboard()
    mockedFetchClientSpecialists.mockResolvedValue([{ specialist_id: 15, display_name: 'Активний спеціаліст', public_slug: 'active', photo_url: null, relation_state: 'ACTIVE' }])
    const view = renderView()
    const hero = view.container.querySelector('.client__hero') as HTMLElement

    expect(await screen.findByRole('heading', { name: 'Продовжити роботу з Активний С.' })).toBeInTheDocument()
    expect(within(hero).getByRole('link', { name: 'Відкрити профіль' })).toHaveAttribute('href', '/s/active')
    expect(screen.getByText('Мої спеціалісти')).toBeInTheDocument()
    expect(screen.getByText('Переглянуті спеціалісти')).toBeInTheDocument()
  })

  it('shows the discovery hero when no canonical primary state exists', async () => {
    mockDashboard()
    const view = renderView()

    expect(await screen.findByRole('heading', { name: 'Знайдіть спеціаліста для вашого запиту' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Знайти спеціаліста' })).toHaveAttribute('href', '/specialists')
    for (const legacyCard of view.container.querySelectorAll('.priority-card, .inquiry-card, .tips-card')) {
      expect(legacyCard).not.toBeVisible()
    }
  })

  it('does not promote viewed specialists to a primary relationship and limits their preview to three', async () => {
    localStorage.setItem('viewedSpecialists', JSON.stringify([
      { public_slug: 'viewed-1', display_name: 'Переглянутий один' },
      { public_slug: 'viewed-2', display_name: 'Переглянутий два' },
      { public_slug: 'viewed-3', display_name: 'Переглянутий три' },
      { public_slug: 'viewed-4', display_name: 'Переглянутий чотири' },
    ]))
    mockDashboard()
    const view = renderView()

    expect(await screen.findByRole('heading', { name: 'Знайдіть спеціаліста для вашого запиту' })).toBeInTheDocument()
    expect(view.container.querySelectorAll('.therapist-card--viewed')).toHaveLength(3)
    expect(view.container.querySelector('a[href="/s/viewed-4"]')).toBeNull()
  })

  it('keeps upcoming and past sessions visible, limits past sessions to three, and hides an empty group-events section', async () => {
    mockDashboard({ upcoming: [session({ id: 301, specialist_name: 'Майбутня сесія' })], past: [session({ id: 302, specialist_name: 'Минуле 1' }), session({ id: 303, specialist_name: 'Минуле 2' }), session({ id: 304, specialist_name: 'Минуле 3' }), session({ id: 305, specialist_name: 'Минуле 4' })] })
    const view = renderView()

    expect((await screen.findAllByText('Спеціаліст: Майбутня сесія')).length).toBeGreaterThan(0)
    expect(screen.getByText('Спеціаліст: Минуле 1')).toBeInTheDocument()
    expect(screen.getByText('Спеціаліст: Минуле 2')).toBeInTheDocument()
    expect(screen.getByText('Спеціаліст: Минуле 3')).toBeInTheDocument()
    expect(screen.queryByText('Спеціаліст: Минуле 4')).not.toBeInTheDocument()
    expect(view.container).not.toHaveTextContent('Ваші групові події')
  })

  it('renders the canonical active-specialists error without failing the dashboard', async () => {
    mockDashboard()
    mockedFetchClientSpecialists.mockRejectedValue(new Error('specialists unavailable'))
    renderView()

    expect(await screen.findByRole('heading', { name: 'Не вдалося завантажити дані' })).toBeInTheDocument()
    expect(screen.getByText('Не вдалося завантажити спеціалістів')).toBeInTheDocument()
    expect(screen.getAllByText('Не вдалося завантажити активних спеціалістів.')).not.toHaveLength(0)
  })

  it('keeps usable session data as the hero when the secondary specialists request fails', async () => {
    mockDashboard({ upcoming: [session({ id: 401, specialist_name: 'Олена' })] })
    mockedFetchClientSpecialists.mockRejectedValue(new Error('specialists unavailable'))

    renderView()

    expect(await screen.findByRole('heading', { name: 'Найближча сесія' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Деталі сесії' })).toHaveAttribute('href', '/client/sessions/401')
  })

  it('loads canonical specialists and inquiry threads without requesting legacy inferred inquiry state', async () => {
    mockDashboard()
    renderView()

    await screen.findByRole('heading', { name: 'Знайдіть спеціаліста для вашого запиту' })
    expect(mockedFetchClientSpecialists).toHaveBeenCalledTimes(1)
    expect(mockedFetchInquiryThreads).toHaveBeenCalledTimes(1)
    expect(mockedFetchInquiryState).not.toHaveBeenCalled()
  })
})
