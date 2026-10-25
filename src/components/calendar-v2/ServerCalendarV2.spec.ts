import { readFileSync } from 'node:fs'
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

  it('accepts a mode click immediately after focus and fences the late GET', async () => {
    const background = deferred<CalendarPreferences>()
    await open(); await ready()
    get.mockReturnValueOnce(background.promise)
    patch.mockResolvedValueOnce(prefs({ mode: 'availability', revision: 4 }))
    window.dispatchEvent(new Event('focus'))
    await fireEvent.click(screen.getByRole('tab', { name: 'Доступність' }))
    await waitFor(() => expect(patch).toHaveBeenCalledTimes(1))
    expect(patch).toHaveBeenCalledWith({ mode: 'availability', expected_revision: 3 })
    background.resolve(prefs({ revision: 3 }))
    await waitFor(() => expect(screen.getByRole('tab', { name: 'Доступність' })).toHaveAttribute('aria-selected', 'true'))
    expect(patch).toHaveBeenCalledTimes(1)
  })

  it('accepts a layer click immediately after visibility refresh', async () => {
    const background = deferred<CalendarPreferences>()
    await open(); await ready()
    const controls = await menu()
    get.mockReturnValueOnce(background.promise)
    patch.mockResolvedValueOnce(prefs({ preset: 'custom', layers: { ...PRESET_LAYERS.workday, external_guest_sessions: true }, revision: 4 }))
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible')
    document.dispatchEvent(new Event('visibilitychange'))
    await fireEvent.click(controls.getByRole('checkbox', { name: /Зовнішні гостьові/ }))
    await waitFor(() => expect(patch).toHaveBeenCalledTimes(1))
    background.resolve(prefs())
    await waitFor(() => expect(controls.getByRole('checkbox', { name: /Зовнішні гостьові/ })).toBeChecked())
  })

  it('keeps the 409 recovery and message when an older background GET finishes last', async () => {
    const background = deferred<CalendarPreferences>()
    await open(); await ready()
    get.mockReturnValueOnce(background.promise).mockResolvedValueOnce(prefs({ mode: 'needs_action', revision: 5 }))
    patch.mockRejectedValueOnce(httpError(409, 'CALENDAR_PREFERENCES_STALE'))
    window.dispatchEvent(new Event('focus'))
    await fireEvent.click(screen.getByRole('tab', { name: 'Доступність' }))
    await screen.findByText(/Налаштування календаря змінилися на іншому пристрої/)
    background.resolve(prefs({ revision: 3 }))
    await waitFor(() => expect(screen.queryByText('Оновлюємо налаштування…')).toBeNull())
    expect(screen.getByText(/Налаштування календаря змінилися на іншому пристрої/)).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Потребує дії/ })).toHaveAttribute('aria-selected', 'true')
    expect(patch).toHaveBeenCalledTimes(1)
  })

  it('isolates a late background GET across logout and specialist login', async () => {
    const background = deferred<CalendarPreferences>()
    const { auth } = await open(); await ready()
    get.mockReturnValueOnce(background.promise)
    window.dispatchEvent(new Event('focus'))
    auth.logout()
    get.mockResolvedValueOnce(prefs({ mode: 'needs_action', revision: 0 }))
    auth.user = { id: 2, username: 'second-specialist', roles: ['SPECIALIST'] } as NonNullable<typeof auth.user>
    await waitFor(() => expect(screen.getByRole('tab', { name: /Потребує дії/ })).toHaveAttribute('aria-selected', 'true'))
    background.resolve(prefs({ mode: 'availability', revision: 99 }))
    await waitFor(() => expect(screen.queryByText('Оновлюємо налаштування…')).toBeNull())
    expect(screen.getByRole('tab', { name: /Потребує дії/ })).toHaveAttribute('aria-selected', 'true')
    expect(patch).not.toHaveBeenCalled()
  })

  it('starts explicit recovery instead of reusing a retired background request', async () => {
    const background = deferred<CalendarPreferences>()
    await open(); await ready()
    get.mockReturnValueOnce(background.promise).mockResolvedValueOnce(prefs({ revision: 5 })).mockResolvedValueOnce(prefs({ revision: 5 }))
    patch.mockRejectedValueOnce(httpError(409, 'CALENDAR_PREFERENCES_STALE'))
    window.dispatchEvent(new Event('focus'))
    await fireEvent.click(screen.getByRole('tab', { name: 'Доступність' }))
    await screen.findByText(/Налаштування календаря змінилися на іншому пристрої/)
    const retry = screen.getByRole('button', { name: 'Оновити налаштування' })
    expect(retry).toBeEnabled()
    await fireEvent.click(retry)
    await waitFor(() => expect(get).toHaveBeenCalledTimes(4))
    await waitFor(() => expect(screen.queryByText(/Налаштування календаря змінилися на іншому пристрої/)).toBeNull())
    background.resolve(prefs())
    expect(patch).toHaveBeenCalledTimes(1)
  })

  it('does not adopt the selected preview tab and preserves query/hash during explicit return', async () => {
    const { router } = await open('/cabinet/sessions?ui=v2&mode=availability&keep=yes#calendar')
    await ready()
    await fireEvent.click(screen.getByRole('tab', { name: 'Доступність' }))
    expect(patch).not.toHaveBeenCalled()
    expect(router.currentRoute.value.query.mode).toBe('availability')
    await fireEvent.click(screen.getByRole('button', { name: 'Повернути збережений' }))
    await waitFor(() => expect(router.currentRoute.value.query.mode).toBeUndefined())
    expect(router.currentRoute.value.query.keep).toBe('yes')
    expect(router.currentRoute.value.hash).toBe('#calendar')
    expect(patch).not.toHaveBeenCalled()
  })

  it('does not replace newer history state when preview adoption finishes late', async () => {
    const response = deferred<CalendarPreferences>()
    patch.mockReturnValueOnce(response.promise)
    const { router } = await open('/cabinet/sessions?ui=v2&mode=availability')
    await ready()
    await fireEvent.click(screen.getByRole('button', { name: 'Зберегти цей режим' }))
    await waitFor(() => expect(patch).toHaveBeenCalledTimes(1))
    await router.push('/cabinet/sessions?ui=v2&mode=actions&keep=new#new')
    response.resolve(prefs({ mode: 'availability', revision: 4 }))
    await waitFor(() => expect(screen.queryByText('Зберігаємо налаштування…')).toBeNull())
    expect(router.currentRoute.value.fullPath).toBe('/cabinet/sessions?ui=v2&mode=actions&keep=new#new')
  })

  it.each([375, 390])('offers only Day/List on a %spx phone without writing its Week projection', async (width) => {
    vi.stubGlobal('matchMedia', vi.fn((query: string) => ({ matches: width <= Number(/max-width:\s*(\d+)px/.exec(query)?.[1] ?? 0), addEventListener: vi.fn(), removeEventListener: vi.fn() })))
    await open(); await ready()
    await fireEvent.click(screen.getByRole('button', { name: 'Вигляд календаря' }))
    const controls = within(screen.getByRole('dialog'))
    expect(controls.queryByRole('button', { name: 'Тиждень' })).toBeNull()
    expect(controls.getByRole('button', { name: 'День' })).toHaveAttribute('aria-pressed', 'true')
    expect(controls.getByRole('group', { name: 'Звичайний вигляд' })).toBeInTheDocument()
    expect(controls.getByRole('group', { name: 'Видимість шарів' })).toBeInTheDocument()
    expect(patch).not.toHaveBeenCalled()
  })
})

describe('regular view controls (final P2)', () => {
  const phone = (width: number) => vi.stubGlobal('matchMedia', vi.fn((query: string) => ({ matches: width <= Number(/max-width:\s*(\d+)px/.exec(query)?.[1] ?? 0), addEventListener: vi.fn(), removeEventListener: vi.fn() })))
  async function viewButton(name: string) {
    await fireEvent.click(screen.getByRole('button', { name: /^Вигляд/ }))
    return within(screen.getByRole('dialog')).getByRole('button', { name })
  }

  describe.each([375, 390])('%spx phone', (width) => {
    it.each([
      ['week', 'День', 'День', null],
      ['day', 'День', 'День', null],
      ['list', 'Список', 'День', 'day'],
      ['week', 'День', 'Список', 'list'],
    ] as const)('saved %s shows %s; pressing %s writes %s', async (saved, shown, pressed, written) => {
      phone(width)
      get.mockResolvedValue(prefs({ regular_view: saved, view: saved }))
      patch.mockImplementation(async (change) => prefs({ regular_view: change.regular_view!, view: change.regular_view!, revision: 4 }))
      await open(); await ready()
      const button = await viewButton(pressed)
      expect(within(screen.getByRole('dialog')).getByRole('button', { name: shown })).toHaveAttribute('aria-pressed', 'true')
      await fireEvent.click(button)
      await new Promise((resolve) => setTimeout(resolve, 0))
      if (written) {
        await waitFor(() => expect(patch).toHaveBeenCalledTimes(1))
        expect(patch).toHaveBeenCalledWith({ regular_view: written, expected_revision: 3 })
      } else {
        expect(patch).not.toHaveBeenCalled()
      }
    })
  })

  it('keeps desktop Week/Day/List: the selected view is a no-op, another view writes once', async () => {
    patch.mockImplementation(async (change) => prefs({ regular_view: change.regular_view!, view: change.regular_view!, revision: 4 }))
    await open(); await ready()
    const week = await viewButton('Тиждень')
    expect(week).toHaveAttribute('aria-pressed', 'true')
    await fireEvent.click(week)
    expect(patch).not.toHaveBeenCalled()
    await fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'День' }))
    await waitFor(() => expect(patch).toHaveBeenCalledTimes(1))
    expect(patch).toHaveBeenCalledWith({ regular_view: 'day', expected_revision: 3 })
  })

  it('styles the selected view with its own fill that hover and disabled states do not remove', () => {
    const css = readFileSync('src/styles/calendarV2.css', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
    const rule = (selector: string) => [...css.matchAll(/([^{}]+)\{([^}]*)\}/g)]
      .filter((match) => match[1]!.split(',').some((part) => part.trim() === selector)).map((match) => match[2]).join(';')
    const pressed = rule('html[data-ui="v2"] .pc2-cal__views > button[aria-pressed="true"]')
    expect(pressed).toMatch(/background:\s*var\(--pc-navy-900\)/)
    expect(pressed).toMatch(/color:\s*var\(--pc-bg-card\)/)
    // Specificity (0,3,2) beats .pc2-cal__btn:hover / :disabled and the quiet transparent background (0,3,1)/(0,2,1).
    expect(rule('html[data-ui="v2"] .pc2-cal__btn:hover')).toMatch(/background/)
    expect(rule('html[data-ui="v2"] .pc2-cal__views > button:focus-visible')).toMatch(/outline:\s*var\(--pc-focus-width\)/)
  })
})
