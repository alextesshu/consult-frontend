import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { defineComponent } from 'vue'
import * as api from '../../lib/api'
import { apiGet, fetchAvailabilityExceptions, fetchCabinetGuestBookingRequests, fetchExternalSessions, getCabinetSchedule } from '../../lib/api'
import { fetchSpecialistRescheduleRequests } from '../../lib/specialistSessions'
import { clearCalendarFeedShare } from '../../composables/useCalendarFeed'
import CalendarV2 from './CalendarV2.vue'

vi.mock('../../lib/api', () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPatch: vi.fn(),
  getCabinetSchedule: vi.fn(),
  fetchAvailabilityExceptions: vi.fn(),
  fetchExternalSessions: vi.fn(),
  fetchCabinetGuestBookingRequests: vi.fn(),
}))
vi.mock('../../lib/specialistSessions', () => ({ fetchSpecialistRescheduleRequests: vi.fn() }))

const mocked = {
  apiGet: vi.mocked(apiGet),
  schedule: vi.mocked(getCabinetSchedule),
  absences: vi.mocked(fetchAvailabilityExceptions),
  external: vi.mocked(fetchExternalSessions),
  guests: vi.mocked(fetchCabinetGuestBookingRequests),
  reschedule: vi.mocked(fetchSpecialistRescheduleRequests),
}

// Thursday 22 October 2026, 16:50 Kyiv (EEST, UTC+3).
const NOW = Date.parse('2026-10-22T13:50:00Z')
const row = (id: number, status: string, start: string, name: string, extra: Record<string, unknown> = {}) => ({
  id,
  status,
  slot_start_at: start,
  slot_end_at: new Date(Date.parse(start) + 50 * 60000).toISOString(),
  client_display_name: name,
  client_has_account: true,
  session_format: 'online',
  meeting_link_ready: true,
  ...extra,
})
const WEEK_SESSIONS = [
  row(1, 'CONFIRMED', '2026-10-23T07:00:00Z', 'Ірина Ткаченко'),
  row(2, 'SCHEDULED', '2026-10-24T08:00:00Z', 'Ганна С.', { client_has_account: false }),
  row(3, 'NO_SHOW', '2026-10-20T08:00:00Z', 'Олег Мельник'),
  row(4, 'CONFIRMED', '2026-10-21T03:00:00Z', 'Рання Сесія'),
]
const UPCOMING = [row(1, 'CONFIRMED', '2026-10-23T07:00:00Z', 'Ірина Ткаченко'), row(2, 'SCHEDULED', '2026-10-24T08:00:00Z', 'Ганна С.'), row(9, 'SCHEDULED', '2026-11-03T08:00:00Z', 'Поза Тижнем')]
const slot = (id: number, start: string, minutes = 50) => ({
  type: 'available_slot', id: `slot-${id}`, slot_id: id, session_id: null, start_at: start,
  end_at: new Date(Date.parse(start) + minutes * 60000).toISOString(), status: 'available', title: 'Вільний час', client_display_name: null, client_kind: null,
})
const SCHEDULE = [
  slot(21, '2026-10-23T10:00:00Z'),
  slot(22, '2026-10-23T11:00:00Z'),
  slot(23, '2026-10-23T14:00:00Z'),
  { type: 'booked_slot', id: 'pending-requests-slot-24', slot_id: 24, session_id: null, start_at: '2026-10-23T12:00:00Z', end_at: '2026-10-23T12:50:00Z', title: 'Запит', status: 'pending', client_display_name: null, client_kind: null, requests_count: 1, request_ids: [301] },
]
const GUESTS = [
  { id: 301, status: 'PENDING', requested_slot_start: '2026-10-23T12:00:00Z', guest_name: 'Катерина', client_name: null },
  { id: 302, status: 'PENDING', requested_slot_start: null, guest_name: 'Дмитро', client_name: null },
]

function stubViewport(width: number) {
  vi.stubGlobal('matchMedia', vi.fn((query: string) => {
    const max = Number(/max-width:\s*(\d+)px/.exec(query)?.[1] ?? Infinity)
    return { matches: width <= max, addEventListener: vi.fn(), removeEventListener: vi.fn() }
  }))
}

function makeRouter() {
  const Blank = defineComponent({ template: '<div />' })
  return createRouter({
    history: createMemoryHistory(),
    routes: ['/cabinet/sessions', '/cabinet/sessions/:id', '/cabinet/slots', '/cabinet/external-sessions', '/cabinet/external-sessions/:id', '/cabinet/availability-exceptions'].map((path) => ({ path, component: Blank })),
  })
}

async function renderCalendar(path = '/cabinet/sessions?ui=v2') {
  const router = makeRouter()
  await router.push(path)
  const result = render(CalendarV2, { props: { now: () => NOW }, global: { plugins: [router] } })
  return { ...result, router }
}

function resetMocks() {
  clearCalendarFeedShare()
  Object.values(mocked).forEach((mock) => mock.mockReset())
  mocked.schedule.mockResolvedValue({ events: SCHEDULE as never })
  mocked.apiGet.mockImplementation((async (_url: string, config?: { params?: Record<string, unknown> }) =>
    config?.params?.upcoming ? UPCOMING : WEEK_SESSIONS) as never)
  mocked.absences.mockResolvedValue([])
  mocked.external.mockResolvedValue([])
  mocked.reschedule.mockResolvedValue([])
  mocked.guests.mockResolvedValue(GUESTS as never)
}

describe('CalendarV2 3a on desktop', () => {
  beforeEach(() => {
    resetMocks()
    stubViewport(1440)
  })
  afterEach(() => vi.unstubAllGlobals())

  it('shows the next-action card, navigation and «Робочий день» without single free slots', async () => {
    await renderCalendar()
    // Nearest action: tomorrow's guest request (15:00) comes before Saturday's confirmation.
    expect(await screen.findByRole('heading', { level: 2, name: 'Катерина' })).toBeInTheDocument()
    expect(screen.getByText(/^Найближча з усіх дій · завтра 15:00 · через \d/)).not.toHaveTextContent('поза вибраним тижнем')
    expect(screen.getByRole('link', { name: 'Відкрити запит →' })).toHaveAttribute('href', '/cabinet/external-sessions#guest-requests')
    expect(screen.getByRole('heading', { level: 2, name: '19 – 25 жовтня' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Робочий день' })).toHaveAttribute('aria-selected', 'true')
    await screen.findByRole('link', { name: /Ірина Ткаченко/ })
    expect(screen.queryByRole('button', { name: /Вільне вікно/ })).toBeNull()
    expect(screen.getByRole('region', { name: /П’ятниця, 23 жовтня: 1 сесія · 1 запит, 2 вільні вікна/ })).toBeInTheDocument()
    expect(screen.getByText(/Тимчасово: режим і вигляд діють лише в цій вкладці/)).toBeInTheDocument()
  })

  it('says the next action comes from all weeks, also when another week is on screen', async () => {
    await renderCalendar()
    await screen.findByRole('heading', { level: 2, name: 'Катерина' })
    await fireEvent.click(screen.getByRole('button', { name: 'Наступний тиждень' }))
    expect(screen.getByRole('heading', { level: 2, name: 'Катерина' })).toBeInTheDocument()
    expect(screen.getByText(/^Найближча з усіх дій · завтра 15:00/)).toHaveTextContent('поза вибраним тижнем')
  })

  it('never hides events outside working hours', async () => {
    await renderCalendar()
    expect(await screen.findByRole('link', { name: /06:00–06:50, Сесія, Рання Сесія/ })).toBeInTheDocument()
    expect(screen.getByText(/Показано 06:00–/)).toBeInTheDocument()
    await fireEvent.click(screen.getByRole('button', { name: 'Показати всю добу' }))
    expect(screen.getByText('Показано 00:00–24:00')).toBeInTheDocument()
  })

  it('switches to «Доступність»: windows of adjacent slots, sessions only as «Зайнято», announced and in the URL', async () => {
    const { router } = await renderCalendar()
    await screen.findByRole('link', { name: /Ірина Ткаченко/ })
    await fireEvent.click(screen.getByRole('tab', { name: 'Доступність' }))

    expect(screen.getByText('Режим: Доступність')).toBeInTheDocument()
    await waitFor(() => expect(router.currentRoute.value.query.mode).toBe('availability'))
    expect(screen.getByRole('button', { name: 'Вільне вікно 13:00–14:50, 2 слоти' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Вільне вікно 17:00–17:50, 1 слот' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '10:00–10:50, Зайнято' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Ірина Ткаченко/ })).toBeNull()
    expect(screen.getByRole('region', { name: /П’ятниця, 23 жовтня: 3 слоти вільно, 2 вікна/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Запит на час/ })).toBeInTheDocument()
  })

  it('never calls a day with a real session empty, even when the session layer is hidden', async () => {
    await renderCalendar('/cabinet/sessions?ui=v2&mode=availability')
    // Wed 21: a past confirmed session (the «Минулі сесії» layer is off in «Доступність»), no slots.
    const wednesday = await screen.findByRole('region', { name: /Середа, 21 жовтня/ })
    expect(within(wednesday).getByText('Немає вільних слотів · є зайняті події')).toBeInTheDocument()
    // Tue 20 only has a «не підтверджено вчасно» session (not busy); Mon 19 has nothing.
    expect(within(screen.getByRole('region', { name: /Понеділок, 19 жовтня/ })).getByText('Порожній день')).toBeInTheDocument()
    expect(within(screen.getByRole('region', { name: /П’ятниця, 23 жовтня/ })).queryByText(/Порожній|Немає вільних/)).toBeNull()

    await fireEvent.click(screen.getByRole('tab', { name: 'Робочий день' }))
    await fireEvent.click(screen.getByRole('button', { name: 'Вигляд ▾' }))
    await fireEvent.click(within(screen.getByRole('dialog')).getByRole('checkbox', { name: /Минулі сесії/ }))
    expect(within(screen.getByRole('region', { name: /Середа, 21 жовтня/ })).getByText('Є зайняті події — приховані у «Вигляді»')).toBeInTheDocument()
  })

  it('moves between mode tabs with the arrow keys (roving tabindex)', async () => {
    await renderCalendar()
    const workday = await screen.findByRole('tab', { name: 'Робочий день' })
    expect(workday).toHaveAttribute('tabindex', '0')
    expect(screen.getByRole('tab', { name: 'Доступність' })).toHaveAttribute('tabindex', '-1')
    workday.focus()
    await fireEvent.keyDown(workday, { key: 'ArrowRight' })
    await waitFor(() => expect(screen.getByRole('tab', { name: 'Доступність' })).toHaveFocus())
    expect(screen.getByRole('tab', { name: 'Доступність' })).toHaveAttribute('aria-selected', 'true')
    await fireEvent.keyDown(screen.getByRole('tab', { name: 'Доступність' }), { key: 'End' })
    await waitFor(() => expect(screen.getByRole('tab', { name: /Потребує дії/ })).toHaveFocus())
  })

  it('lists actions for this week and outside it; the badge is the global total', async () => {
    await renderCalendar()
    const actionsTab = await screen.findByRole('tab', { name: /Потребує дії/ })
    await waitFor(() => expect(within(actionsTab).getByLabelText('4 дій')).toHaveTextContent('4'))
    await fireEvent.click(actionsTab)

    const week = screen.getByRole('region', { name: /Цей тиждень/ })
    expect(within(week).getByText('2 дії')).toBeInTheDocument()
    expect(within(week).getByRole('link', { name: 'Підтвердити: Ганна С.' })).toHaveAttribute('href', '/cabinet/sessions/2')
    expect(within(week).getByRole('link', { name: 'Відкрити запит: Катерина' })).toHaveAttribute('href', '/cabinet/external-sessions#guest-requests')
    const elsewhere = screen.getByRole('region', { name: /Поза цим тижнем/ })
    expect(within(elsewhere).getByText('2 дії')).toBeInTheDocument()
    expect(within(elsewhere).getByText('Без часу')).toBeInTheDocument()
    expect(screen.getByText(/Лічильник вкладки — 4: усе, що чекає на вас, незалежно від тижня. Тут — 2 у вибраному тижні й 2 поза ним/)).toBeInTheDocument()

    await fireEvent.click(screen.getByRole('tab', { name: /Робочий день/ }))
    await fireEvent.click(screen.getByRole('button', { name: 'Наступний тиждень' }))
    await fireEvent.click(screen.getByRole('button', { name: 'Наступний тиждень' }))
    await fireEvent.click(screen.getByRole('tab', { name: /Потребує дії/ }))
    expect(within(screen.getByRole('region', { name: /Цей тиждень/ })).getByText('1 дія')).toBeInTheDocument()
    expect(within(screen.getByRole('region', { name: /Поза цим тижнем/ })).getByText('3 дії')).toBeInTheDocument()
  })

  it('does not show a global badge when an action source failed', async () => {
    mocked.guests.mockRejectedValue(new Error('500'))
    await renderCalendar('/cabinet/sessions?ui=v2&mode=actions')
    expect(await screen.findByText(/Не вдалося завантажити: запити на сесію. Загальну кількість не показуємо/)).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Потребує дії' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.queryByLabelText(/дій$/)).toBeNull()
  })

  it('replaces layers with «Вигляд»: counts, deviation chips, reset, Esc and focus return', async () => {
    await renderCalendar()
    await screen.findByRole('link', { name: /Ірина Ткаченко/ })
    const viewButton = screen.getByRole('button', { name: 'Вигляд ▾' })
    await fireEvent.click(viewButton)
    const menu = screen.getByRole('dialog', { name: 'Вигляд · Робочий день' })
    expect(within(menu).getByText('Видимість не змінює доступність і правила запису. Лічильники — за вибраний період.')).toBeInTheDocument()
    expect(within(menu).getByText('Що означають позначки')).toBeInTheDocument()
    await fireEvent.click(within(menu).getByRole('checkbox', { name: /Зовнішні гостьові сесії/ }))
    expect(within(menu).getByText('змінено')).toBeInTheDocument()
    await fireEvent.keyDown(menu, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(viewButton).toHaveFocus()

    const chip = screen.getByRole('button', { name: 'Повернути «зовнішні гостьові» до режиму' })
    expect(chip).toHaveTextContent('+ зовнішні гостьові')
    await fireEvent.click(chip)
    expect(screen.queryByRole('button', { name: /Повернути/ })).toBeNull()

    await fireEvent.click(viewButton)
    await fireEvent.click(within(screen.getByRole('dialog')).getByRole('checkbox', { name: /Минулі сесії/ }))
    expect(screen.getByRole('button', { name: 'Повернути «минулі сесії» до режиму' })).toHaveTextContent('− минулі сесії')
    await fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Скинути до режиму' }))
    expect(screen.queryByRole('button', { name: /Повернути/ })).toBeNull()
  })

  it('opens the actions mode from the deep link and never mutates', async () => {
    await renderCalendar('/cabinet/sessions?ui=v2&mode=actions')
    expect(await screen.findByRole('region', { name: /Поза цим тижнем/ })).toBeInTheDocument()
    for (const name of [/^Підтвердити$/, /^Скасувати$/, /^Перенести$/, /^Відхилити$/, /^Видалити$/]) {
      expect(screen.queryByRole('button', { name })).toBeNull()
    }
    expect(vi.mocked(api.apiPost)).not.toHaveBeenCalled()
    expect(vi.mocked(api.apiPatch)).not.toHaveBeenCalled()
  })

  it('shows a quiet card when nothing needs action and today has no sessions', async () => {
    mocked.guests.mockResolvedValue([])
    mocked.apiGet.mockImplementation((async (_url: string, config?: { params?: Record<string, unknown> }) =>
      config?.params?.upcoming ? [row(5, 'CONFIRMED', '2026-10-30T09:00:00Z', 'Андрій Л.')] : []) as never)
    await renderCalendar()
    expect(await screen.findByText('Сьогодні сесій немає')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Найближча — Пт, 30 жовтня · 11:00' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Відкрити сесію →' })).toHaveAttribute('href', '/cabinet/sessions/5')
  })
})

describe('CalendarV2 3a week grid height', () => {
  const kyiv = (hour: number, minute = 0) => new Date(Date.UTC(2026, 9, 23, hour - 3, minute)).toISOString()
  const bodyHeight = () => parseFloat((document.querySelector('.pc2-cal-grid__body') as HTMLElement).style.height)

  beforeEach(() => {
    resetMocks()
    stubViewport(1440)
    // Usable grid height = min(70% of 900, 720) = 630px.
    vi.stubGlobal('innerHeight', 900)
    mocked.schedule.mockResolvedValue({ events: [] })
  })
  afterEach(() => vi.unstubAllGlobals())

  async function renderSessions(starts: string[]) {
    mocked.apiGet.mockImplementation((async (_url: string, config?: { params?: Record<string, unknown> }) =>
      config?.params?.upcoming ? [] : starts.map((start, index) => row(40 + index, 'CONFIRMED', start, `Клієнт ${index}`))) as never)
    await renderCalendar()
    await screen.findByRole('link', { name: /Клієнт 0/ })
  }

  it('stretches a 1-hour range to the usable height without adding hours', async () => {
    await renderSessions([kyiv(10)])
    expect(screen.getByText(/Показано 10:00–11:00/)).toBeInTheDocument()
    expect(bodyHeight()).toBe(630)
    expect(document.querySelectorAll('.pc2-cal-grid__hours span')).toHaveLength(2)
    expect(document.querySelector('.pc2-cal-grid__line.is-half')).not.toBeNull()
  })

  it('stretches a 5-hour range and keeps 52px hours for 12 hours and the full day', async () => {
    await renderSessions([kyiv(9), kyiv(13)])
    expect(screen.getByText(/Показано 09:00–14:00/)).toBeInTheDocument()
    expect(bodyHeight()).toBe(630)
    await fireEvent.click(screen.getByRole('button', { name: 'Показати всю добу' }))
    expect(bodyHeight()).toBe(24 * 52)
  })

  it('fills the height with 12 hours and keeps the 52px minimum (scrolling) beyond that', async () => {
    await renderSessions([kyiv(7), kyiv(18)])
    expect(screen.getByText(/Показано 07:00–19:00/)).toBeInTheDocument()
    expect(bodyHeight()).toBe(630)
    expect(screen.getByRole('link', { name: /18:00–18:50, Сесія, Клієнт 1/ })).toBeInTheDocument()
  })

  it('keeps 52px hours for 13 hours, never hiding early or late sessions', async () => {
    await renderSessions([kyiv(6), kyiv(18)])
    expect(screen.getByText(/Показано 06:00–19:00/)).toBeInTheDocument()
    expect(bodyHeight()).toBe(13 * 52)
    expect(screen.getByRole('link', { name: /06:00–06:50, Сесія, Клієнт 0/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /18:00–18:50, Сесія, Клієнт 1/ })).toBeInTheDocument()
  })
})

describe('CalendarV2 3a on tablets and phones', () => {
  beforeEach(resetMocks)
  afterEach(() => vi.unstubAllGlobals())

  it('folds the weekend into one column on tablets', async () => {
    stubViewport(1024)
    await renderCalendar()
    await screen.findByRole('link', { name: /Ірина Ткаченко/ })
    expect(screen.getByRole('region', { name: 'Вихідні, 24–25' })).toBeInTheDocument()
    expect(within(screen.getByRole('region', { name: 'Вихідні, 24–25' })).getByRole('link', { name: /Сб 11:00–11:50/ })).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: /Субота, 24 жовтня/ })).toBeNull()
  })

  it('shows a day with a date strip, a compact segment and the view menu as a sheet on phones', async () => {
    stubViewport(375)
    await renderCalendar()
    expect(await screen.findByRole('heading', { level: 1, name: 'Календар' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Дії' })).toBeInTheDocument()
    expect(within(screen.getByRole('group', { name: 'Дні тижня' })).getAllByRole('button')).toHaveLength(7)
    expect(document.querySelector('.pc2-cal-grid')).toBeNull()

    await fireEvent.click(within(screen.getByRole('group', { name: 'Дні тижня' })).getByRole('button', { name: /П’ятниця, 23 жовтня/ }))
    expect(await screen.findByRole('link', { name: /Ірина Ткаченко/ })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: /Пт, 23 жовтня/ })).toHaveTextContent('2 вільні вікна')

    await fireEvent.click(screen.getByRole('tab', { name: 'Доступність' }))
    const window = screen.getByRole('button', { name: /13:00–14:50/ })
    expect(window).toHaveAttribute('aria-expanded', 'false')
    await fireEvent.click(window)
    expect(window).toHaveAttribute('aria-expanded', 'true')

    const menuButton = screen.getByRole('button', { name: 'Вигляд календаря' })
    await fireEvent.click(menuButton)
    expect(document.querySelector('.pc2-cal-view.is-sheet')).not.toBeNull()
    expect(document.documentElement.style.overflow).toBe('hidden')
    await fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
    expect(menuButton).toHaveFocus()
    expect(document.documentElement.style.overflow).toBe('')

    // The sheet header keeps a close control next to the title.
    await fireEvent.click(menuButton)
    const sheet = screen.getByRole('dialog', { name: 'Вигляд · Доступність' })
    await fireEvent.click(within(sheet).getByRole('button', { name: 'Закрити вигляд' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(menuButton).toHaveFocus()
  })

  it('names a phone day with only busy, hidden time correctly', async () => {
    stubViewport(375)
    await renderCalendar('/cabinet/sessions?ui=v2&mode=availability')
    await fireEvent.click(within(await screen.findByRole('group', { name: 'Дні тижня' })).getByRole('button', { name: /Середа, 21 жовтня/ }))
    expect(await screen.findByText('Немає вільних слотів · є зайняті події')).toBeInTheDocument()
    await fireEvent.click(within(screen.getByRole('group', { name: 'Дні тижня' })).getByRole('button', { name: /Понеділок, 19 жовтня/ }))
    expect(screen.getByText('Порожній день')).toBeInTheDocument()
  })
})
