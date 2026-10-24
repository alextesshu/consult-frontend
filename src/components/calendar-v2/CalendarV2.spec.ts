import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { defineComponent } from 'vue'
import { apiGet, fetchAvailabilityExceptions, fetchExternalSessions, getCabinetSchedule } from '../../lib/api'
import { fetchSpecialistRescheduleRequests } from '../../lib/specialistSessions'
import * as api from '../../lib/api'
import CalendarV2 from './CalendarV2.vue'
import { clearCalendarFeedShare } from '../../composables/useCalendarFeed'

vi.mock('../../lib/api', () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPatch: vi.fn(),
  getCabinetSchedule: vi.fn(),
  fetchAvailabilityExceptions: vi.fn(),
  fetchExternalSessions: vi.fn(),
}))
vi.mock('../../lib/specialistSessions', () => ({ fetchSpecialistRescheduleRequests: vi.fn() }))

const mocked = {
  apiGet: vi.mocked(apiGet),
  schedule: vi.mocked(getCabinetSchedule),
  absences: vi.mocked(fetchAvailabilityExceptions),
  external: vi.mocked(fetchExternalSessions),
  reschedule: vi.mocked(fetchSpecialistRescheduleRequests),
}

// Thursday 22 October 2026, 16:50 in Kyiv.
const NOW = Date.parse('2026-10-22T13:50:00Z')

const SESSIONS = [
  { id: 1, status: 'CONFIRMED', slot_start_at: '2026-10-23T07:00:00Z', slot_end_at: '2026-10-23T07:50:00Z', client_display_name: 'Ірина Ткаченко', client_has_account: true },
  { id: 2, status: 'SCHEDULED', slot_start_at: '2026-10-24T08:00:00Z', slot_end_at: '2026-10-24T08:50:00Z', client_display_name: 'Ганна С.', client_has_account: false },
  { id: 3, status: 'NO_SHOW', slot_start_at: '2026-10-20T08:00:00Z', slot_end_at: '2026-10-20T08:50:00Z', client_display_name: 'Олег Мельник', client_has_account: true },
]
const SCHEDULE = [
  { type: 'available_slot', id: 'slot-21', slot_id: 21, session_id: null, start_at: '2026-10-23T10:00:00Z', end_at: '2026-10-23T10:50:00Z', title: 'Вільний час', client_display_name: null, client_kind: null },
  { type: 'booked_slot', id: 'pending-requests-slot-22', slot_id: 22, session_id: null, start_at: '2026-10-23T12:00:00Z', end_at: '2026-10-23T12:50:00Z', title: 'Запит на сесію', status: 'pending', client_display_name: null, client_kind: null, requests_count: 1, request_ids: [301] },
]

function stubViewport(mobile: boolean) {
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: mobile, addEventListener: vi.fn(), removeEventListener: vi.fn() })))
}

function makeRouter() {
  const Blank = defineComponent({ template: '<div />' })
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/cabinet/sessions', component: Blank },
      { path: '/cabinet/sessions/:id', component: Blank },
      { path: '/cabinet/slots', component: Blank },
      { path: '/cabinet/external-sessions', component: Blank },
      { path: '/cabinet/external-sessions/:id', component: Blank },
      { path: '/cabinet/availability-exceptions', component: Blank },
    ],
  })
}

async function renderCalendar() {
  const router = makeRouter()
  await router.push('/cabinet/sessions')
  const result = render(CalendarV2, { props: { now: () => NOW }, global: { plugins: [router] } })
  return { ...result, router }
}

describe('CalendarV2 (read-only unified calendar)', () => {
  beforeEach(() => {
    clearCalendarFeedShare()
    Object.values(mocked).forEach((mock) => mock.mockReset())
    mocked.schedule.mockResolvedValue({ events: SCHEDULE as never })
    mocked.apiGet.mockResolvedValue(SESSIONS)
    mocked.absences.mockResolvedValue([])
    mocked.external.mockResolvedValue([])
    mocked.reschedule.mockResolvedValue([])
    stubViewport(false)
  })
  afterEach(() => vi.unstubAllGlobals())

  it('shows the current week on desktop with sessions linked to their existing detail page', async () => {
    await renderCalendar()

    expect(await screen.findByRole('heading', { level: 1, name: '19 – 25 жовтня' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Тиждень' })).toHaveAttribute('aria-pressed', 'true')
    const session = await screen.findByRole('link', { name: /Ірина Ткаченко, Підтверджено/ })
    expect(session).toHaveAttribute('href', '/cabinet/sessions/1')
    expect(screen.getByRole('link', { name: /Ганна С\., Чекає підтвердження, без реєстрації, Потрібне ваше підтвердження/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Олег Мельник, Не підтверджено вчасно/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Вільне вікно/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Заявка на час, Заявка на цей час, Заявка чекає на розгляд/ })).toBeInTheDocument()
    expect(screen.getAllByRole('region').length).toBeGreaterThanOrEqual(7)
    expect(screen.getByText(/не синхронізуються між пристроями. Час показано за Europe\/Kyiv/)).toBeInTheDocument()
    expect(within(screen.getByRole('list', { name: 'Легенда' })).getByText('Скасовано / Не підтверджено вчасно')).toBeInTheDocument()
  })

  it('switches between week, day and list and navigates dates', async () => {
    await renderCalendar()
    await screen.findByRole('link', { name: /Ірина Ткаченко/ })

    await fireEvent.click(screen.getByRole('button', { name: 'День' }))
    expect(screen.getByRole('heading', { level: 1, name: 'Четвер, 22 жовтня' })).toBeInTheDocument()
    await fireEvent.click(screen.getByRole('button', { name: 'Наступний день' }))
    expect(screen.getByRole('heading', { level: 1, name: 'П’ятниця, 23 жовтня' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Ірина Ткаченко/ })).toBeInTheDocument()
    await fireEvent.click(screen.getByRole('button', { name: 'Сьогодні' }))
    expect(screen.getByRole('heading', { level: 1, name: 'Четвер, 22 жовтня' })).toBeInTheDocument()

    await fireEvent.click(screen.getByRole('button', { name: 'Список' }))
    expect(screen.getByRole('heading', { level: 2, name: 'П’ятниця, 23 жовтня' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { level: 2, name: /Середа, 21 жовтня/ })).toBeNull()

    await fireEvent.click(screen.getByRole('button', { name: 'Наступний тиждень' }))
    expect(screen.getByRole('heading', { level: 1, name: '26 жовтня – 1 листопада' })).toBeInTheDocument()
    await waitFor(() => expect(mocked.schedule).toHaveBeenLastCalledWith('2026-10-24', '2026-11-02'))
  })

  it('applies presets, including the needs-action list that replaces the board', async () => {
    await renderCalendar()
    await screen.findByRole('link', { name: /Ірина Ткаченко/ })

    await fireEvent.click(screen.getByRole('button', { name: 'Потребує дії' }))
    expect(screen.getByRole('button', { name: 'Список' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('link', { name: /Ганна С\./ })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Ірина Ткаченко/ })).toBeNull()

    await fireEvent.click(screen.getByRole('button', { name: 'Робочий день' }))
    expect(screen.getByRole('button', { name: 'Робочий день' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.queryByRole('button', { name: /Вільне вікно/ })).toBeNull()
  })

  it('toggles layers, keeps hidden actionable items visible as a count and explains hiding', async () => {
    await renderCalendar()
    await screen.findByRole('link', { name: /Ірина Ткаченко/ })
    const layersButton = screen.getByRole('button', { name: 'Шари' })

    await fireEvent.click(layersButton)
    const panel = screen.getByRole('dialog', { name: 'Шари календаря' })
    expect(within(panel).getByText(/зайнятість не змінюється/)).toBeInTheDocument()
    await fireEvent.click(within(panel).getByRole('checkbox', { name: 'Заявки на час' }))
    expect(screen.getByText('Власний набір')).toBeInTheDocument()
    await fireEvent.keyDown(panel, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(layersButton).toHaveFocus()

    expect(screen.queryByRole('button', { name: /Заявка на час/ })).toBeNull()
    const banner = screen.getByText(/Заявки на час — 1, потребують дії: 1/)
    expect(screen.getByLabelText('у прихованих шарах є записи, що потребують дії')).toBeInTheDocument()
    await fireEvent.click(within(banner).getByRole('button', { name: 'Показати' }))
    expect(screen.getByRole('button', { name: /Заявка на час/ })).toBeInTheDocument()
  })

  it('keeps the last visible layer switched on', async () => {
    await renderCalendar()
    await screen.findByRole('link', { name: /Ірина Ткаченко/ })
    await fireEvent.click(screen.getByRole('button', { name: 'Шари' }))
    const panel = screen.getByRole('dialog', { name: 'Шари календаря' })
    for (const name of ['Минулі сесії', 'Вільні вікна', 'Заявки на час', 'Відсутності']) {
      await fireEvent.click(within(panel).getByRole('checkbox', { name }))
    }
    expect(within(panel).getByRole('checkbox', { name: 'Заплановані сесії' })).toBeDisabled()
  })

  it('opens read-only details for non-session items and returns focus on close', async () => {
    await renderCalendar()
    const slot = await screen.findByRole('button', { name: /Вільне вікно/ })
    slot.focus()
    await fireEvent.click(slot)

    const dialog = screen.getByRole('dialog', { name: 'Вільне вікно' })
    expect(within(dialog).getByText('Тут лише перегляд. Змінити цей запис можна на його сторінці.')).toBeInTheDocument()
    expect(within(dialog).getByRole('link', { name: 'Керувати вікнами в розкладі' })).toHaveAttribute('href', '/cabinet/slots?tab=availability')
    await fireEvent.keyDown(dialog, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(slot).toHaveFocus()
  })

  it('never offers mutations and only reads data', async () => {
    await renderCalendar()
    await screen.findByRole('link', { name: /Ірина Ткаченко/ })
    await fireEvent.click(screen.getByRole('button', { name: /Заявка на час/ }))

    for (const name of [/^Підтвердити/, /^Скасувати/, /^Перенести/, /^Відхилити/, /^Створити/, /^Видалити/]) {
      expect(screen.queryByRole('button', { name })).toBeNull()
    }
    expect(vi.mocked(api.apiPost)).not.toHaveBeenCalled()
    expect(vi.mocked(api.apiPatch)).not.toHaveBeenCalled()
  })

  it('shows loading, error with retry and empty states', async () => {
    mocked.schedule.mockRejectedValueOnce(new Error('down'))
    mocked.apiGet.mockRejectedValueOnce(new Error('down'))
    await renderCalendar()
    expect(screen.getByText('Завантажуємо календар…')).toBeInTheDocument()
    expect(await screen.findByRole('alert')).toHaveTextContent('Не вдалося завантажити календар. Дані не змінено.')

    mocked.schedule.mockResolvedValueOnce({ events: [] })
    mocked.apiGet.mockResolvedValueOnce([])
    await fireEvent.click(screen.getByRole('button', { name: 'Спробувати ще раз' }))
    expect(await screen.findByText('За цей період у видимих шарах подій немає.')).toBeInTheDocument()
  })

  it('names partially failed sources and still shows the rest', async () => {
    mocked.absences.mockRejectedValue(new Error('500'))
    await renderCalendar()
    expect(await screen.findByText(/Не вдалося завантажити: відсутності\. Показано решту\./)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Ірина Ткаченко/ })).toBeInTheDocument()
  })
})

describe('CalendarV2 on phones', () => {
  beforeEach(() => {
    clearCalendarFeedShare()
    Object.values(mocked).forEach((mock) => mock.mockReset())
    mocked.schedule.mockResolvedValue({ events: SCHEDULE as never })
    mocked.apiGet.mockResolvedValue(SESSIONS)
    mocked.absences.mockResolvedValue([])
    mocked.external.mockResolvedValue([])
    mocked.reschedule.mockResolvedValue([])
    stubViewport(true)
  })
  afterEach(() => vi.unstubAllGlobals())

  it('defaults to Day with a date strip and offers only Day and List', async () => {
    await renderCalendar()
    expect(await screen.findByRole('heading', { level: 1, name: 'Четвер, 22 жовтня' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Тиждень' })).toBeNull()
    expect(screen.getByRole('button', { name: 'День' })).toHaveAttribute('aria-pressed', 'true')
    const strip = screen.getByRole('group', { name: 'Дні тижня' })
    expect(within(strip).getAllByRole('button')).toHaveLength(7)

    await fireEvent.click(within(strip).getByRole('button', { name: /П’ятниця, 23 жовтня/ }))
    expect(screen.getByRole('heading', { level: 1, name: 'П’ятниця, 23 жовтня' })).toBeInTheDocument()
    expect(await screen.findByRole('link', { name: /Ірина Ткаченко/ })).toBeInTheDocument()
    expect(document.querySelector('.pc2-cal-grid')).toBeNull()
  })
})
