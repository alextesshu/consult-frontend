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
    expect(mockedUpdate).toHaveBeenCalledWith({ view: 'day' })
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

  it('keeps the newest revision when rapid update responses arrive out of order', async () => {
    mockedFetch.mockResolvedValue(prefs())
    const firstReply = deferred<CalendarPreferences>()
    const secondReply = deferred<CalendarPreferences>()
    mockedUpdate.mockReturnValueOnce(firstReply.promise).mockReturnValueOnce(secondReply.promise)
    const store = useCalendarPreferencesStore()
    await store.ensureLoaded()

    const first = store.update({ layers: { free_slots: false } })
    const second = store.update({ view: 'day' })
    secondReply.resolve(prefs({ view: 'day', preset: 'custom', revision: 2 }))
    await second
    firstReply.resolve(prefs({ view: 'week', preset: 'custom', revision: 1 }))
    await first

    expect(store.preferences).toMatchObject({ view: 'day', revision: 2 })
  })

  it('drops a slow initial read that resolves after a newer update', async () => {
    const slowRead = deferred<CalendarPreferences>()
    mockedFetch.mockReturnValue(slowRead.promise)
    mockedUpdate.mockResolvedValue(prefs({ view: 'list', revision: 4 }))
    const store = useCalendarPreferencesStore()

    const loading = store.ensureLoaded()
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
})
