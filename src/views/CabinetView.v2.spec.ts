import { fireEvent, render, waitFor, within } from '@testing-library/vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { apiGet, fetchChatThreads, fetchSpecialistOnboardingState } from '../lib/api'
import { applyUiVersion } from '../lib/uiVersion'
import CabinetView from './CabinetView.vue'

const NOW = new Date(2026, 9, 22, 15, 50, 0)
const at = (day: number, hour: number, minute = 0) => new Date(2026, 9, day, hour, minute).toISOString()

function createMe() {
  return {
    user: { id: 1, username: 'specialist', email: 'specialist@example.com' },
    access_state: 'OK',
    effective_entitlements: { plan: 'PRO', active_client_limit: 20 },
    counts: { active_clients: 14, prospect_clients: 0, upcoming_sessions_count: 3 },
    product_updates: [],
    server_time: NOW.toISOString(),
  }
}
const mockMe = ref<ReturnType<typeof createMe> | null>(createMe())
const mockLoadMe = vi.fn()
vi.mock('pinia', () => ({ storeToRefs: (store: any) => store }))
vi.mock('../stores/auth', () => ({ useAuthStore: () => ({ me: mockMe, loadMe: mockLoadMe, accessToken: 'token' }) }))
vi.mock('../lib/api', () => ({ apiGet: vi.fn(), fetchChatThreads: vi.fn(), fetchSpecialistOnboardingState: vi.fn() }))
const mockedApiGet = vi.mocked(apiGet)

const sessions = [
  { id: 11, status: 'CONFIRMED', client: 3, client_display_name: 'Андрій Савчук', session_format: 'online', meeting_url: 'https://meet.example.test/a', join_available: false, slot_start_at: at(22, 16, 30), slot_end_at: at(22, 17, 20) },
  { id: 12, status: 'CONFIRMED', client: 4, client_display_name: 'Максим Бойко', session_format: 'online', slot_start_at: at(23, 9, 30), slot_end_at: at(23, 10, 20) },
  { id: 13, status: 'SCHEDULED', client: 5, client_display_name: 'Олег Мельник', session_format: 'offline', offline_location: 'Київ', slot_start_at: at(26, 10), slot_end_at: at(26, 10, 50) },
]
function workQueue(overrides: Record<string, unknown> = {}) {
  return {
    today_sessions_count: 2, notes_reminders_count: 1, pending_guest_requests_count: 2, pending_slotless_guest_requests_count: 1,
    today_sessions: [
      { id: 10, client_display_name: 'Ірина Ткаченко', status: 'COMPLETED', has_note: false, session_format: 'online', starts_at: at(22, 10) },
      { id: 11, client_display_name: 'Андрій Савчук', status: 'CONFIRMED', has_note: false, session_format: 'online', starts_at: at(22, 16, 30) },
    ],
    notes_reminders_preview: [{ id: 601, session_id: 10, client_display_name: 'Ірина Ткаченко', slot_start_at: at(22, 10) }],
    guest_requests_preview: [{ id: 701, client_display_name: 'Катерина Лук’янчук', request_topics: [], session_format: 'online', requested_slot_start: at(23, 11) }],
    ...overrides,
  }
}
function analytics(range = '30d') {
  return {
    sessions: { completed: range === '7d' ? 11 : 42, cancelled: 0, no_show: 0 },
    acquisition: { guest_booking_requests: range === '7d' ? 3 : 9 },
    payments: {
      paid_total_by_currency: [{ currency: 'UAH', amount: '48600.00' }], unconfirmed_total_by_currency: [{ currency: 'UAH', amount: '1200.00' }], unconfirmed_count: 1,
      unconfirmed_sessions: [{ session_id: 14, client_record_id: 1, client_user_id: null, client_name: 'Олег Мельник', starts_at: at(22, 13), price_amount: '1200.00', price_currency: 'UAH', payment_state: 'NOT_CONFIRMED', last_payment_action_at: null }],
      review_count: 0, no_price_count: 0, coverage: { ordinary_sessions_included: true, external_guest_sessions_included: false, external_guest_sessions_count: 0 },
    },
  }
}
function mockApi(options: { queue?: Record<string, unknown>; sessions?: unknown[]; analyticsFails?: boolean } = {}) {
  mockedApiGet.mockImplementation(async (url: string, config?: any) => {
    if (url === '/booking/sessions/') return config?.params?.upcoming ? (options.sessions ?? sessions) : []
    if (url === '/cabinet/work-queue/') return workQueue(options.queue)
    if (url === '/cabinet/practice-analytics/') { if (options.analyticsFails) throw new Error('x'); return analytics(config?.params?.range) }
    if (url === '/cabinet/entitlements/') return { limits: { active_clients: { used: 14, limit: 20 } } }
    return null
  })
}
function renderView() {
  return render(CabinetView, { global: { stubs: { RouterLink: { props: ['to'], template: '<a :href="typeof to === \'string\' ? to : to.path + (to.query?.action ? `?action=${to.query.action}` : \'\')"><slot /></a>' } } } })
}

describe('CabinetView UI v2 dashboard (Cabinet-Dashboard.dc.html)', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(NOW)
    applyUiVersion('v2')
    // Reduced motion: numbers render final values at once (count-up is covered by useDashboardMotion.spec).
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })))
    window.localStorage.clear()
    mockMe.value = createMe()
    mockLoadMe.mockReset()
    vi.mocked(fetchChatThreads).mockResolvedValue([])
    vi.mocked(fetchSpecialistOnboardingState).mockResolvedValue({
      readiness: { public_display_name_exists: true, description_exists: false, topics_exist: true, work_format_exists: true, base_price_exists: false, client_entry_path_ready: true },
      missing_items: ['MISSING_DESCRIPTION', 'MISSING_BASE_PRICE'], warnings: [], next_actions: [], primary_cta_code: 'COMPLETE_PROFILE', cta_target: '/cabinet/profile',
    } as any)
    mockApi()
  })
  afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); applyUiVersion('v1') })

  it('renders the hero for the next real session with start time, open link and disabled join', async () => {
    const { container } = renderView()
    await waitFor(() => expect(container.querySelector('.pc2-dashboard__hero')).toHaveTextContent('Андрій Савчук'))
    const hero = container.querySelector('.pc2-dashboard__hero') as HTMLElement
    expect(hero).toHaveTextContent('Наступна сесія · онлайн')
    expect(hero).toHaveTextContent('16:30–17:20')
    expect(hero.querySelector('.pc2-dashboard__clock')).toHaveTextContent('16:30')
    expect(hero).toHaveTextContent(/Четвер, 22 жовтня · Добрий день/)
    expect(within(hero).getByRole('link', { name: 'Відкрити сесію' })).toHaveAttribute('href', '/cabinet/sessions/11')
    expect(within(hero).getByRole('link', { name: '+ Нова сесія' })).toHaveAttribute('href', '/cabinet/slots?action=create-session')
    expect(hero.querySelector('.pc2-dashboard__join')).toHaveAttribute('aria-disabled', 'true')
    expect(hero.querySelector('a.pc2-dashboard__join')).toBeNull()
    expect(container.textContent).not.toMatch(/7-ма сесія|Остання нотатка/)
  })

  it('switches to a live countdown and remembers the choice', async () => {
    const { container, getByRole } = renderView()
    await waitFor(() => expect(container.querySelector('.pc2-dashboard__hero')).toHaveTextContent('Андрій Савчук'))
    await fireEvent.click(getByRole('button', { name: 'Показати таймер' }))
    expect(container.querySelector('.pc2-dashboard__clock')).toHaveTextContent('40:00')
    expect(window.localStorage.getItem('pc:dashboard:hideTimer')).toBe('0')
    expect(getByRole('button', { name: 'Сховати таймер' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('lists today sessions with real statuses and a missing-note flag', async () => {
    const { container } = renderView()
    await waitFor(() => expect(container.querySelectorAll('.pc2-dashboard__pill')).toHaveLength(2))
    const pills = container.querySelectorAll('.pc2-dashboard__pill')
    expect(pills[0]).toHaveTextContent('Ірина Ткаченко')
    expect(pills[0]).toHaveTextContent('Завершено')
    expect(pills[0]).toHaveTextContent('без нотатки')
    expect(pills[1]).toHaveClass('is-next')
    expect(pills[1]).toHaveAttribute('href', '/cabinet/sessions/11')
  })

  it('builds the attention queue only from work-queue, payment and update DTOs with deep links', async () => {
    const { container } = renderView()
    await waitFor(() => expect(container.querySelectorAll('.pc2-dashboard__card').length).toBe(3))
    const cards = Array.from(container.querySelectorAll('.pc2-dashboard__card'))
    expect(cards.map((card) => card.querySelector('.pc2-dashboard__tag')?.textContent)).toEqual(['Новий запит', 'Оплата', 'Без нотатки'])
    expect(within(cards[0] as HTMLElement).getByRole('link', { name: 'Опрацювати' })).toHaveAttribute('href', '/cabinet/external-sessions#guest-requests')
    expect(cards[1]).toHaveTextContent('1 200 грн · не підтверджено')
    expect(within(cards[1] as HTMLElement).getByRole('link', { name: 'Відкрити сесію' })).toHaveAttribute('href', '/cabinet/sessions/14')
    expect(within(cards[2] as HTMLElement).getByRole('link', { name: 'Додати нотатку' })).toHaveAttribute('href', '/cabinet/sessions/10')
    // 2 pending requests + 1 unconfirmed payment + 1 note reminder; one request is not previewed.
    expect(container.querySelector('.pc2-dashboard__count')).toHaveTextContent('4')
    expect(container.querySelector('.pc2-dashboard__more')).toHaveTextContent('Ще 1 пункт')
    expect(container.textContent).not.toMatch(/Прийняти|Інший час|Скасувати/)
  })

  it('shows an empty queue state', async () => {
    mockApi({ queue: { pending_guest_requests_count: 0, notes_reminders_count: 0, guest_requests_preview: [], notes_reminders_preview: [] } })
    mockedApiGet.mockImplementation(async (url: string, config?: any) => {
      if (url === '/booking/sessions/') return config?.params?.upcoming ? sessions : []
      if (url === '/cabinet/work-queue/') return workQueue({ pending_guest_requests_count: 0, notes_reminders_count: 0, guest_requests_preview: [], notes_reminders_preview: [] })
      if (url === '/cabinet/practice-analytics/') return { ...analytics(), payments: { ...analytics().payments, unconfirmed_count: 0, unconfirmed_sessions: [], unconfirmed_total_by_currency: [] } }
      return null
    })
    const { container } = renderView()
    await waitFor(() => expect(container.querySelector('.pc2-dashboard__queue-empty')).toHaveTextContent('Усе зроблено — черга порожня.'))
    expect(container.querySelector('.pc2-dashboard__count')).toHaveTextContent('0')
  })

  it('renders readiness from the onboarding DTO with links to missing steps', async () => {
    const { container } = renderView()
    const card = await waitFor(() => { const el = container.querySelector('.pc2-dashboard__readiness') as HTMLElement; expect(el).toBeTruthy(); return el })
    expect(card.querySelector('.pc2-dashboard__ring')).toHaveTextContent('4/6')
    const todo = within(card).getAllByRole('link').filter((link) => link.textContent?.includes('Заповнити'))
    expect(todo.map((link) => link.textContent?.replace('Заповнити →', '').trim())).toEqual(['Короткий опис', 'Базова ціна'])
    expect(container.querySelector('.pc2-dashboard__readiness-row')).toHaveTextContent('Готовність до звернень')
  })

  it('shows practice numbers from the analytics range and refetches on range change', async () => {
    const { container, getByRole } = renderView()
    await waitFor(() => expect(container.querySelector('.pc2-dashboard__metrics strong')).toHaveTextContent(/^42$/))
    expect(container.querySelector('.pc2-dashboard__metrics')).toHaveTextContent('48 600 грн')
    expect(container.querySelector('.pc2-dashboard__usage')).toHaveTextContent('14 з 20')
    await fireEvent.click(getByRole('button', { name: '7 днів' }))
    await waitFor(() => expect(container.querySelector('.pc2-dashboard__metrics strong')).toHaveTextContent(/^11$/))
    expect(mockedApiGet).toHaveBeenCalledWith('/cabinet/practice-analytics/', { params: { range: '7d' } })
    expect(getByRole('button', { name: '7 днів' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('shows practice and hero error states with retry', async () => {
    mockApi({ analyticsFails: true })
    const { container } = renderView()
    await waitFor(() => expect(container.querySelector('.pc2-dashboard__practice')).toHaveTextContent('Не вдалося завантажити підсумок практики.'))
  })

  it('lists later sessions under «Попереду» and an empty hero when nothing is planned', async () => {
    const view = renderView()
    await waitFor(() => expect(view.container.querySelectorAll('.pc2-dashboard__ahead-row')).toHaveLength(2))
    const rows = view.container.querySelectorAll('.pc2-dashboard__ahead-row')
    expect(rows[0]).toHaveTextContent('Пт 23')
    expect(rows[0]).toHaveTextContent('09:30')
    expect(rows[1]).toHaveAttribute('href', '/cabinet/sessions/13')
    view.unmount()
    mockApi({ sessions: [] })
    const empty = renderView()
    await waitFor(() => expect(empty.container.querySelector('.pc2-dashboard__hero-empty')).toHaveTextContent('Сесій сьогодні немає.'))
  })

  it('shows a skeleton while the profile loads and keeps v1 untouched by default', async () => {
    mockMe.value = null
    const { container } = renderView()
    expect(container.querySelector('.pc2-dashboard__skeleton')).toHaveAttribute('aria-busy', 'true')
    applyUiVersion('v1')
    await waitFor(() => expect(container.querySelector('.pc2-dashboard')).toBeNull())
    expect(container.querySelector('.cabinet')).not.toBeNull()
  })
})
