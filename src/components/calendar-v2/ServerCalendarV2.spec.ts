import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/vue'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { defineComponent } from 'vue'
import { fetchCalendarPreferences, updateCalendarPreferences, type CalendarPreferences } from '../../lib/calendarPreferences'
import { PRESET_LAYERS } from '../../lib/calendarItems'
import { useAuthStore } from '../../stores/auth'
import ServerCalendarV2 from './ServerCalendarV2.vue'
import { clearCalendarFeedShare } from '../../composables/useCalendarFeed'

vi.mock('../../lib/calendarPreferences', async (original) => ({
  ...await original<typeof import('../../lib/calendarPreferences')>(),
  fetchCalendarPreferences: vi.fn(), updateCalendarPreferences: vi.fn(),
}))
vi.mock('../../composables/useCalendarFeed', async () => {
  const { ref } = await import('vue')
  return { clearCalendarFeedShare: vi.fn(), useCalendarFeed: () => ({ items: ref([]), status: ref('ready'), failedSources: ref([]), retry: vi.fn() }) }
})
vi.mock('../../composables/useCalendarActions', async () => {
  const { ref } = await import('vue')
  return {
    CALENDAR_ACTION_SOURCE_LABELS: {},
    useCalendarActions: () => ({ actions: ref([]), upcomingSessions: ref([]), status: ref('ready'), failedSources: ref([]), complete: ref(true), retry: vi.fn() }),
  }
})

const get = vi.mocked(fetchCalendarPreferences)
const patch = vi.mocked(updateCalendarPreferences)
function prefs(overrides: Partial<CalendarPreferences> = {}): CalendarPreferences {
  return { mode: 'workday', view: 'week', regular_view: 'week', preset: 'workday', layers: { ...PRESET_LAYERS.workday }, revision: 3, timezone: 'Europe/Kyiv', updated_at: null, ...overrides }
}
function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((done) => { resolve = done })
  return { resolve, promise }
}
function httpError(status: number, code = 'TEST_ERROR') {
  return Object.assign(new Error('Test response'), { response: { status, data: { code, detail: 'Тестова помилка.' } } })
}
async function open(path = '/cabinet/sessions?ui=v2') {
  const pinia = createPinia()
  setActivePinia(pinia)
  const auth = useAuthStore()
  auth.user = { id: 1, username: 'synthetic-specialist', roles: ['SPECIALIST'] } as NonNullable<typeof auth.user>
  const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/:pathMatch(.*)*', component: defineComponent({ template: '<div />' }) }] })
  await router.push(path)
  const rendered = render(ServerCalendarV2, { global: { plugins: [pinia, router] } })
  return { ...rendered, router, auth }
}
async function menu() {
  await fireEvent.click(await screen.findByRole('button', { name: 'Вигляд ▾' }))
  return within(screen.getByRole('dialog'))
}
async function ready() {
  await screen.findByRole('heading', { name: 'Календар' })
  await waitFor(() => expect(screen.queryByText('Оновлюємо налаштування…')).toBeNull())
}
beforeEach(() => {
  vi.mocked(clearCalendarFeedShare).mockClear()
  get.mockReset().mockResolvedValue(prefs())
  patch.mockReset()
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true)
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })))
})

describe('server-backed calendar integration (isolated API fixtures)', () => {
  it('does not mount an active calendar until authoritative preferences arrive', async () => {
    const response = deferred<CalendarPreferences>()
    get.mockReturnValue(response.promise)
    await open()
    expect(screen.getByText('Завантажуємо налаштування календаря…')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Календар' })).toBeNull()
    response.resolve(prefs({ regular_view: 'day' }))
    await screen.findByRole('heading', { name: 'Календар' })
    expect(document.querySelectorAll('.pc2-cal-grid__col')).toHaveLength(1)
    expect(patch).not.toHaveBeenCalled()
  })

  it('writes regular_view, mode and reset only through the guarded UC-00 store', async () => {
    let server = prefs({ regular_view: 'day', view: 'day' })
    get.mockImplementation(async () => server)
    patch.mockImplementation(async (change) => {
      expect(change.expected_revision).toBe(server.revision)
      if ('regular_view' in change) server = { ...server, regular_view: change.regular_view!, revision: server.revision + 1 }
      if (change.mode) server = { ...server, mode: change.mode, preset: change.mode, layers: { ...PRESET_LAYERS[change.mode] }, view: change.mode === 'needs_action' ? 'list' : server.view, revision: server.revision + 1 }
      if (change.layers) server = { ...server, layers: { ...server.layers, ...change.layers }, preset: 'custom', revision: server.revision + 1 }
      return server
    })
    await open()
    await ready()
    await fireEvent.click(screen.getByRole('tab', { name: /Потребує дії/ }))
    await waitFor(() => expect(screen.getByRole('tab', { name: /Потребує дії/ })).toHaveAttribute('aria-selected', 'true'))
    await fireEvent.click(screen.getByRole('tab', { name: 'Робочий день' }))
    await waitFor(() => expect(document.querySelectorAll('.pc2-cal-grid__col')).toHaveLength(1))
    const controls = await menu()
    expect(controls.getByRole('button', { name: 'День' })).toHaveAttribute('aria-pressed', 'true')
    await fireEvent.click(controls.getByRole('button', { name: 'Список' }))
    await screen.findByText('У цьому тижні подій немає.')
    await fireEvent.click(controls.getByRole('button', { name: 'Тиждень' }))
    await waitFor(() => expect(document.querySelectorAll('.pc2-cal-grid__col')).toHaveLength(7))
    await fireEvent.click(controls.getByRole('checkbox', { name: /Зовнішні гостьові/ }))
    await waitFor(() => expect(server.preset).toBe('custom'))
    expect(server.mode).toBe('workday')
    await fireEvent.click(controls.getByRole('button', { name: 'Скинути до режиму' }))
    await waitFor(() => expect(server.preset).toBe('workday'))
    expect(server.regular_view).toBe('week')
    expect(patch).toHaveBeenCalledTimes(6)
  })

  it('treats URL changes, history and refresh as previews without PATCH', async () => {
    const { router } = await open('/cabinet/sessions?ui=v2&mode=actions')
    await screen.findByTestId('calendar-mode-preview')
    expect(screen.getByRole('tab', { name: /Потребує дії/ })).toHaveAttribute('aria-selected', 'true')
    await router.push('/cabinet/sessions?ui=v2&mode=availability')
    await waitFor(() => expect(screen.getByRole('tab', { name: 'Доступність' })).toHaveAttribute('aria-selected', 'true'))
    const controls = await menu()
    expect(controls.getByRole('button', { name: 'День' })).toBeDisabled()
    expect(controls.getByRole('checkbox', { name: /Заплановані сесії/ })).toBeDisabled()
    await fireEvent.click(controls.getByRole('button', { name: 'Готово' }))
    router.back()
    await waitFor(() => expect(router.currentRoute.value.query.mode).toBe('actions'))
    await fireEvent.click(screen.getByRole('button', { name: 'Повернути збережений' }))
    await waitFor(() => expect(router.currentRoute.value.query.mode).toBeUndefined())
    expect(patch).not.toHaveBeenCalled()
  })

  it('persists a preview only on explicit confirmation, once', async () => {
    patch.mockResolvedValue(prefs({ mode: 'availability', preset: 'availability', revision: 4 }))
    const { router } = await open('/cabinet/sessions?ui=v2&mode=availability')
    await ready()
    await fireEvent.click(await screen.findByRole('button', { name: 'Зберегти цей режим' }))
    await waitFor(() => expect(router.currentRoute.value.query.mode).toBeUndefined())
    expect(patch).toHaveBeenCalledTimes(1)
    expect(patch).toHaveBeenCalledWith({ mode: 'availability', expected_revision: 3 })
  })

  it('shows 409 recovery state and does not retry or clear the preview', async () => {
    get.mockResolvedValueOnce(prefs()).mockResolvedValueOnce(prefs({ mode: 'needs_action', revision: 4 }))
    patch.mockRejectedValue(httpError(409, 'CALENDAR_PREFERENCES_STALE'))
    const { router } = await open('/cabinet/sessions?ui=v2&mode=availability')
    await ready()
    await fireEvent.click(await screen.findByRole('button', { name: 'Зберегти цей режим' }))
    await screen.findByText(/Налаштування календаря змінилися на іншому пристрої/)
    expect(get).toHaveBeenCalledTimes(2)
    expect(patch).toHaveBeenCalledTimes(1)
    expect(router.currentRoute.value.query.mode).toBe('availability')
    await fireEvent.click(screen.getByRole('button', { name: 'Повернути збережений' }))
    await waitFor(() => expect(screen.getByRole('tab', { name: /Потребує дії/ })).toHaveAttribute('aria-selected', 'true'))
  })

  it.each([401, 403, 503])('handles initial HTTP %s with explicit retry and no default upload', async (status) => {
    get.mockRejectedValueOnce(httpError(status)).mockResolvedValueOnce(prefs())
    await open()
    const retry = await screen.findByRole('button', { name: 'Спробувати ще раз' })
    await waitFor(() => expect(retry).toBeEnabled())
    expect(screen.queryByRole('heading', { name: 'Календар' })).toBeNull()
    await fireEvent.click(retry)
    await waitFor(() => expect(get).toHaveBeenCalledTimes(2))
    await screen.findByRole('heading', { name: 'Календар' })
    await waitFor(() => expect(screen.queryByText(/Не вдалося оновити налаштування/)).toBeNull())
    expect(patch).not.toHaveBeenCalled()
  })

  it('keeps the confirmed snapshot read-only offline and only GETs on reconnect/focus', async () => {
    await open()
    await ready()
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    window.dispatchEvent(new Event('offline'))
    await screen.findByText(/Немає з’єднання/)
    await fireEvent.click(screen.getByRole('tab', { name: 'Доступність' }))
    expect(patch).not.toHaveBeenCalled()
    get.mockResolvedValue(prefs({ mode: 'availability', revision: 5 }))
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true)
    window.dispatchEvent(new Event('online'))
    window.dispatchEvent(new Event('focus'))
    await waitFor(() => expect(screen.getByRole('tab', { name: 'Доступність' })).toHaveAttribute('aria-selected', 'true'))
    expect(get).toHaveBeenCalledTimes(2)
    expect(patch).not.toHaveBeenCalled()
  })

  it('gates legacy responses with unknown regular_view without writing a fallback', async () => {
    get.mockResolvedValue(prefs({ regular_view: null }))
    await open()
    await screen.findByText(/Сервер ще не підтримує/)
    expect((await menu()).getByRole('button', { name: 'День' })).toBeDisabled()
    expect(patch).not.toHaveBeenCalled()
  })

  it('removes the old calendar on logout and loads a separate specialist epoch', async () => {
    const { auth } = await open()
    await screen.findByRole('heading', { name: 'Календар' })
    auth.logout()
    await waitFor(() => expect(screen.queryByRole('heading', { name: 'Календар' })).toBeNull())
    get.mockResolvedValue(prefs({ mode: 'availability', regular_view: 'day', revision: 0 }))
    auth.user = { id: 2, username: 'other-synthetic-specialist', roles: ['SPECIALIST'] } as NonNullable<typeof auth.user>
    await waitFor(() => expect(screen.getByRole('tab', { name: 'Доступність' })).toHaveAttribute('aria-selected', 'true'))
    expect(document.querySelectorAll('.pc2-cal-grid__col')).toHaveLength(1)
    expect(patch).not.toHaveBeenCalled()
    expect(clearCalendarFeedShare).toHaveBeenCalledTimes(2)
  })

  it('keeps a confirmed snapshot read-only after a failed refresh', async () => {
    await open()
    await ready()
    get.mockRejectedValueOnce(httpError(503))
    window.dispatchEvent(new Event('focus'))
    await screen.findByText(/Не вдалося оновити налаштування/)
    expect(screen.getByRole('tab', { name: 'Робочий день' })).toHaveAttribute('aria-disabled', 'true')
    expect(document.querySelector('.pc2-cal-grid')).not.toBeNull()
    expect(patch).not.toHaveBeenCalled()
  })

  it('shows a write permission error and keeps the readable snapshot', async () => {
    patch.mockRejectedValueOnce(httpError(403, 'SUSPENDED'))
    await open()
    await ready()
    await fireEvent.click(screen.getByRole('tab', { name: 'Доступність' }))
    await screen.findByText('Тестова помилка.')
    await waitFor(() => expect(screen.getByRole('tab', { name: 'Робочий день' })).toHaveAttribute('aria-disabled', 'true'))
    expect(document.querySelector('.pc2-cal-grid')).not.toBeNull()
    expect(patch).toHaveBeenCalledTimes(1)
  })

  it('keeps keyboard focus on the confirmed tab until the server accepts a mode', async () => {
    const response = deferred<CalendarPreferences>()
    patch.mockReturnValueOnce(response.promise)
    await open()
    await ready()
    const workday = screen.getByRole('tab', { name: 'Робочий день' })
    workday.focus()
    await fireEvent.keyDown(workday, { key: 'ArrowRight' })
    expect(workday).toHaveFocus()
    response.resolve(prefs({ mode: 'availability', revision: 4 }))
    await waitFor(() => expect(screen.getByRole('tab', { name: 'Доступність' })).toHaveFocus())
    get.mockResolvedValueOnce(prefs({ mode: 'workday', revision: 5 }))
    patch.mockRejectedValueOnce(httpError(409, 'CALENDAR_PREFERENCES_STALE'))
    await fireEvent.keyDown(screen.getByRole('tab', { name: 'Доступність' }), { key: 'End' })
    await screen.findByText(/Налаштування календаря змінилися на іншому пристрої/)
    await waitFor(() => expect(workday).toHaveFocus())
  })

  it('focuses an accessible close control when a preview disables the settings', async () => {
    await open('/cabinet/sessions?ui=v2&mode=availability')
    await ready()
    const controls = await menu()
    await waitFor(() => expect(controls.getByRole('button', { name: 'Закрити вигляд' })).toHaveFocus())
  })
})
