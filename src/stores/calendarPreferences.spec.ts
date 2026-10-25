import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { fetchCalendarPreferences, updateCalendarPreferences, type CalendarPreferences } from '../lib/calendarPreferences'
import { useAuthStore } from './auth'
import { useCalendarPreferencesStore } from './calendarPreferences'
import { useCalendarPreferences } from '../composables/useCalendarPreferences'

vi.mock('../lib/calendarPreferences', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/calendarPreferences')>()
  return { ...actual, fetchCalendarPreferences: vi.fn(), updateCalendarPreferences: vi.fn() }
})

const mockedFetch = vi.mocked(fetchCalendarPreferences)
const mockedUpdate = vi.mocked(updateCalendarPreferences)

function prefs(overrides: Partial<CalendarPreferences> = {}): CalendarPreferences {
  return {
    mode: 'workday',
    view: 'week',
    preset: 'all',
    layers: {
      sessions: true,
      past: true,
      free_slots: true,
      guest_requests: true,
      absences: true,
      external_guest_sessions: false,
    },
    revision: 0,
    updated_at: null,
    timezone: 'Europe/Kyiv',
    ...overrides,
  }
}

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

function httpError(status: number, code?: string) {
  return Object.assign(new Error(`Request failed with status code ${status}`), {
    response: { status, data: code ? { code, detail: 'Відхилено сервером.' } : {} },
  })
}

describe('calendar preferences store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    mockedFetch.mockReset()
    mockedUpdate.mockReset()
    window.localStorage.clear()
  })

  it('loads once and shares the request between components', async () => {
    const pending = deferred<CalendarPreferences>()
    mockedFetch.mockReturnValue(pending.promise)
    const store = useCalendarPreferencesStore()

    const first = store.ensureLoaded()
    const second = store.ensureLoaded()
    const fromComposable = useCalendarPreferences()
    expect(store.status).toBe('loading')
    expect(fromComposable.layers.value).toBeNull()
    pending.resolve(prefs({ view: 'day', revision: 3 }))

    await expect(first).resolves.toMatchObject({ view: 'day', revision: 3 })
    await expect(second).resolves.toMatchObject({ view: 'day' })
    expect(mockedFetch).toHaveBeenCalledTimes(1)
    expect(store.status).toBe('ready')
    expect(fromComposable.view.value).toBe('day')
    expect(fromComposable.isLayerVisible('external_guest_sessions')).toBe(false)
    await store.ensureLoaded()
    expect(mockedFetch).toHaveBeenCalledTimes(1)
  })

  it('reports a load error without inventing values', async () => {
    mockedFetch.mockRejectedValue(httpError(503))
    const store = useCalendarPreferencesStore()

    await expect(store.ensureLoaded()).rejects.toThrow()

    expect(store.status).toBe('error')
    expect(store.preferences).toBeNull()
    expect(store.error).toBeTruthy()
  })

  it('applies only server responses and never reads or writes localStorage', async () => {
    window.localStorage.setItem('calendar.preferences', JSON.stringify(prefs({ view: 'list' })))
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    const getItem = vi.spyOn(Storage.prototype, 'getItem')
    mockedFetch.mockResolvedValue(prefs({ view: 'week' }))
    mockedUpdate.mockResolvedValue(prefs({ view: 'day', revision: 1 }))
    const store = useCalendarPreferencesStore()

    await store.ensureLoaded()
    expect(store.preferences?.view).toBe('week')
    await store.update({ view: 'day' })

    expect(store.preferences).toMatchObject({ view: 'day', revision: 1 })
    expect(mockedUpdate).toHaveBeenCalledWith({ view: 'day', expected_revision: 0 })
    expect(setItem).not.toHaveBeenCalled()
    expect(getItem).not.toHaveBeenCalled()
    setItem.mockRestore()
    getItem.mockRestore()
  })

  it('does not change state before the server answers an update', async () => {
    mockedFetch.mockResolvedValue(prefs())
    const pending = deferred<CalendarPreferences>()
    mockedUpdate.mockReturnValue(pending.promise)
    const store = useCalendarPreferencesStore()
    await store.ensureLoaded()

    const saving = store.update({ layers: { free_slots: false } })
    expect(store.saving).toBe(true)
    expect(store.preferences?.layers.free_slots).toBe(true)
    pending.resolve(prefs({ preset: 'custom', layers: { ...prefs().layers, free_slots: false }, revision: 1 }))
    await saving

    expect(store.saving).toBe(false)
    expect(store.preferences).toMatchObject({ preset: 'custom', revision: 1 })
    expect(store.preferences?.layers.free_slots).toBe(false)
  })

  it('serializes rapid updates and captures each latest revision at dispatch', async () => {
    mockedFetch.mockResolvedValue(prefs())
    const firstReply = deferred<CalendarPreferences>()
    const secondReply = deferred<CalendarPreferences>()
    mockedUpdate.mockReturnValueOnce(firstReply.promise).mockReturnValueOnce(secondReply.promise)
    const store = useCalendarPreferencesStore()
    await store.ensureLoaded()

    const first = store.update({ layers: { free_slots: false } })
    const second = store.update({ view: 'day' })
    await vi.waitFor(() => expect(mockedUpdate).toHaveBeenCalledTimes(1))
    expect(mockedUpdate).toHaveBeenNthCalledWith(1, { layers: { free_slots: false }, expected_revision: 0 })
    firstReply.resolve(prefs({ view: 'week', preset: 'custom', revision: 1 }))
    await first
    await vi.waitFor(() => expect(mockedUpdate).toHaveBeenCalledTimes(2))
    expect(mockedUpdate).toHaveBeenNthCalledWith(2, { view: 'day', expected_revision: 1 })
    secondReply.resolve(prefs({ view: 'day', preset: 'custom', revision: 2 }))
    await second

    expect(store.preferences).toMatchObject({ view: 'day', revision: 2 })
  })

  it('drops a slow reload that resolves after a newer update', async () => {
    const slowRead = deferred<CalendarPreferences>()
    mockedFetch.mockResolvedValueOnce(prefs({ revision: 2 })).mockReturnValueOnce(slowRead.promise)
    mockedUpdate.mockResolvedValue(prefs({ view: 'list', revision: 4 }))
    const store = useCalendarPreferencesStore()

    await store.ensureLoaded()
    const loading = store.reload()
    await store.update({ view: 'list' })
    slowRead.resolve(prefs({ view: 'week', revision: 3 }))
    await loading

    expect(store.preferences).toMatchObject({ view: 'list', revision: 4 })
  })

  it('keeps server values and re-reads the server after a rejected update', async () => {
    mockedFetch
      .mockResolvedValueOnce(prefs({ revision: 2 }))
      .mockResolvedValueOnce(prefs({ revision: 2 }))
    mockedUpdate.mockRejectedValue(httpError(400, 'CALENDAR_LAYERS_EMPTY'))
    const store = useCalendarPreferencesStore()
    await store.ensureLoaded()

    await expect(store.update({ layers: { sessions: false } })).rejects.toThrow()

    expect(store.errorCode).toBe('CALENDAR_LAYERS_EMPTY')
    expect(store.error).toBe('Відхилено сервером.')
    expect(store.preferences).toMatchObject({ revision: 2 })
    await vi.waitFor(() => expect(mockedFetch).toHaveBeenCalledTimes(2))
    expect(store.status).toBe('ready')
  })

  it('discards data and late responses from a previous login', async () => {
    const lateRead = deferred<CalendarPreferences>()
    mockedFetch.mockReturnValueOnce(lateRead.promise)
    const store = useCalendarPreferencesStore()
    const auth = useAuthStore()

    const stale = store.ensureLoaded()
    auth.beginAuthEpoch()
    lateRead.resolve(prefs({ view: 'list', revision: 9 }))
    await expect(stale).resolves.toBeNull()
    expect(store.preferences).toBeNull()

    mockedFetch.mockResolvedValueOnce(prefs({ view: 'day', revision: 1 }))
    await store.ensureLoaded()
    expect(store.preferences).toMatchObject({ view: 'day', revision: 1 })
  })

  it('loads the server revision before the first write', async () => {
    const read = deferred<CalendarPreferences>()
    mockedFetch.mockReturnValue(read.promise)
    mockedUpdate.mockResolvedValue(prefs({ mode: 'availability', revision: 9 }))
    const store = useCalendarPreferencesStore()
    const update = store.update({ mode: 'availability' })
    await vi.waitFor(() => expect(mockedFetch).toHaveBeenCalledTimes(1))
    expect(mockedUpdate).not.toHaveBeenCalled()
    read.resolve(prefs({ revision: 8 }))
    await update
    expect(mockedUpdate).toHaveBeenCalledWith({ mode: 'availability', expected_revision: 8 })
    expect(useCalendarPreferences({ autoload: false }).mode.value).toBe('availability')
  })

  it('preserves a custom mode, resets it explicitly, and leaves no-op revisions to the server', async () => {
    mockedFetch.mockResolvedValue(prefs({ mode: 'availability', preset: 'availability', revision: 2 }))
    mockedUpdate
      .mockResolvedValueOnce(prefs({ mode: 'availability', preset: 'custom', revision: 3 }))
      .mockResolvedValueOnce(prefs({ mode: 'availability', preset: 'availability', revision: 4 }))
      .mockResolvedValueOnce(prefs({ mode: 'availability', preset: 'availability', revision: 4 }))
    const store = useCalendarPreferencesStore()
    await store.ensureLoaded()
    await store.update({ layers: { past: true } })
    expect(store.preferences).toMatchObject({ mode: 'availability', preset: 'custom' })
    await store.update({ mode: 'availability' })
    await store.update({ mode: 'availability' })
    expect(mockedUpdate).toHaveBeenLastCalledWith({ mode: 'availability', expected_revision: 4 })
    expect(store.preferences?.revision).toBe(4)
  })

  it('awaits 409 recovery, reports the conflict, and never replays the rejected intent', async () => {
    const refresh = deferred<CalendarPreferences>()
    mockedFetch.mockResolvedValueOnce(prefs({ revision: 2 })).mockReturnValueOnce(refresh.promise)
    mockedUpdate.mockRejectedValue(httpError(409, 'CALENDAR_PREFERENCES_STALE'))
    const store = useCalendarPreferencesStore()
    await store.ensureLoaded()
    const rejected = expect(store.update({ mode: 'availability' })).rejects.toThrow()
    await vi.waitFor(() => expect(mockedFetch).toHaveBeenCalledTimes(2))
    expect(store.saving).toBe(true)
    refresh.resolve(prefs({ mode: 'needs_action', preset: 'custom', revision: 5 }))
    await rejected
    expect(store.preferences).toMatchObject({ mode: 'needs_action', revision: 5 })
    expect(store.errorCode).toBe('CALENDAR_PREFERENCES_STALE')
    expect(store.error).toContain('іншому пристрої')
    expect(store.saving).toBe(false)
    expect(mockedUpdate).toHaveBeenCalledTimes(1)
  })

  it('releases the queue after recovery and uses the recovered revision for a distinct intent', async () => {
    const refresh = deferred<CalendarPreferences>()
    mockedFetch.mockResolvedValueOnce(prefs({ revision: 2 })).mockReturnValueOnce(refresh.promise)
    mockedUpdate
      .mockRejectedValueOnce(httpError(409, 'CALENDAR_PREFERENCES_STALE'))
      .mockResolvedValueOnce(prefs({ view: 'day', revision: 7 }))
    const store = useCalendarPreferencesStore()
    await store.ensureLoaded()
    const rejected = expect(store.update({ mode: 'availability' })).rejects.toThrow()
    const second = store.update({ view: 'day' })
    await vi.waitFor(() => expect(mockedFetch).toHaveBeenCalledTimes(2))
    expect(mockedUpdate).toHaveBeenCalledTimes(1)
    refresh.resolve(prefs({ revision: 6 }))
    await rejected
    await second
    expect(mockedUpdate).toHaveBeenNthCalledWith(2, { view: 'day', expected_revision: 6 })
    expect(mockedUpdate).toHaveBeenCalledTimes(2)
  })

  it('requires a successful refresh before writing again after recovery fails', async () => {
    mockedFetch
      .mockResolvedValueOnce(prefs({ revision: 2 }))
      .mockRejectedValueOnce(httpError(503))
      .mockResolvedValueOnce(prefs({ revision: 8 }))
    mockedUpdate
      .mockRejectedValueOnce(httpError(409, 'CALENDAR_PREFERENCES_STALE'))
      .mockResolvedValueOnce(prefs({ revision: 9 }))
    const store = useCalendarPreferencesStore()
    await store.ensureLoaded()
    await expect(store.update({ mode: 'availability' })).rejects.toThrow()
    expect(store.preferences?.revision).toBe(2)
    await store.update({ view: 'day' })
    expect(mockedFetch).toHaveBeenCalledTimes(3)
    expect(mockedUpdate).toHaveBeenLastCalledWith({ view: 'day', expected_revision: 8 })
  })

  it.each([false, true])('isolates active and queued writes across login changes (reject=%s)', async (reject) => {
    const oldReply = deferred<CalendarPreferences>()
    mockedFetch.mockResolvedValueOnce(prefs({ revision: 2 })).mockResolvedValueOnce(prefs({ revision: 0 }))
    mockedUpdate.mockReturnValueOnce(oldReply.promise).mockResolvedValueOnce(prefs({ view: 'day', revision: 1 }))
    const store = useCalendarPreferencesStore()
    await store.ensureLoaded()
    const old = store.update({ mode: 'availability' })
    const oldOutcome = reject ? expect(old).rejects.toThrow() : expect(old).resolves.toBeNull()
    const queued = store.update({ mode: 'needs_action' })
    await vi.waitFor(() => expect(mockedUpdate).toHaveBeenCalledTimes(1))
    useAuthStore().beginAuthEpoch()
    await store.ensureLoaded()
    await store.update({ view: 'day' })
    if (reject) oldReply.reject(httpError(409, 'CALENDAR_PREFERENCES_STALE'))
    else oldReply.resolve(prefs({ mode: 'availability', revision: 90 }))
    await oldOutcome
    await expect(queued).resolves.toBeNull()
    expect(mockedUpdate).toHaveBeenCalledTimes(2)
    expect(store.preferences).toMatchObject({ mode: 'workday', view: 'day', revision: 1 })
    expect(store.error).toBe('')
    expect(store.saving).toBe(false)
    expect(mockedFetch).toHaveBeenCalledTimes(2)
  })

  it('snapshots queued layers and drops late server revisions', async () => {
    mockedFetch.mockResolvedValue(prefs({ revision: 3 }))
    mockedUpdate.mockResolvedValue(prefs({ revision: 2, mode: 'needs_action' }))
    const store = useCalendarPreferencesStore()
    await store.ensureLoaded()
    const layers = { past: false }
    const update = store.update({ layers })
    layers.past = true
    await update
    expect(mockedUpdate).toHaveBeenCalledWith({ layers: { past: false }, expected_revision: 3 })
    expect(store.preferences).toMatchObject({ mode: 'workday', revision: 3 })
  })
})
