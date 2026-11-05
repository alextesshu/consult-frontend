import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope, ref } from 'vue'
import { apiGet, fetchCabinetGuestBookingRequests } from '../lib/api'
import { fetchSpecialistRescheduleRequests } from '../lib/specialistSessions'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '../stores/auth'
import { useCalendarActions as createActions } from './useCalendarActions'

vi.mock('../lib/api', () => ({ apiGet: vi.fn(), fetchCabinetGuestBookingRequests: vi.fn() }))
vi.mock('../lib/specialistSessions', () => ({ fetchSpecialistRescheduleRequests: vi.fn() }))

const mocked = {
  apiGet: vi.mocked(apiGet),
  guests: vi.mocked(fetchCabinetGuestBookingRequests),
  reschedule: vi.mocked(fetchSpecialistRescheduleRequests),
}
const flush = () => new Promise((resolve) => setTimeout(resolve, 0))

const scopes: ReturnType<typeof effectScope>[] = []
function useCalendarActions(...args: Parameters<typeof createActions>) {
  const scope = effectScope()
  scopes.push(scope)
  return scope.run(() => createActions(...args))!
}
function signIn(id: number) {
  useAuthStore().$patch({ accessToken: 'synthetic', authResolved: true, user: { id, username: `synthetic-${id}`, email: null } })
}
const session = (id: number) => ({ id, status: 'SCHEDULED', slot_start_at: '2026-10-30T09:00:00Z', slot_end_at: '2026-10-30T09:50:00Z', client_display_name: `Synthetic-${id}` })
function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason: Error) => void
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no })
  return { promise, resolve, reject }
}
afterEach(() => scopes.splice(0).forEach((scope) => scope.stop()))

describe('useCalendarActions', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    signIn(101)
    Object.values(mocked).forEach((mock) => mock.mockReset())
    mocked.apiGet.mockResolvedValue([{ id: 1, status: 'SCHEDULED', slot_start_at: '2026-10-30T09:00:00Z', slot_end_at: '2026-10-30T09:50:00Z', client_display_name: 'Ірина' }])
    mocked.reschedule.mockResolvedValue([])
    mocked.guests.mockResolvedValue([{ id: 5, status: 'PENDING', requested_slot_start: null, guest_name: 'Гість' }] as never)
  })

  it('reads every upcoming session in one GET and reports a complete global set', async () => {
    const result = useCalendarActions(ref('Europe/Kyiv'))
    await flush()
    expect(mocked.apiGet).toHaveBeenCalledWith('/booking/sessions/', { params: { upcoming: true } })
    expect(result.complete.value).toBe(true)
    expect(result.actions.value.map((action) => action.key)).toEqual(['confirm:1', 'request:5'])
  })

  it('keeps what loaded but marks the set incomplete when a source fails', async () => {
    mocked.guests.mockRejectedValue(new Error('500'))
    const result = useCalendarActions(ref('Europe/Kyiv'))
    await flush()
    expect(result.complete.value).toBe(false)
    expect(result.failedSources.value).toEqual(['guestRequests'])
    expect(result.actions.value.map((action) => action.key)).toEqual(['confirm:1'])

    mocked.guests.mockResolvedValue([])
    await result.retry()
    expect(result.complete.value).toBe(true)
  })
  it('clears every action source and starts B requests without remounting', async () => {
    const result = useCalendarActions(ref('Europe/Kyiv'))
    await flush()
    expect(result.complete.value).toBe(true)
    mocked.apiGet.mockResolvedValue([session(202)])
    mocked.guests.mockResolvedValue([])
    signIn(202)
    expect(result.actions.value).toEqual([])
    expect(result.upcomingSessions.value).toBeNull()
    expect(result.failedSources.value).toEqual([])
    expect(result.status.value).toBe('idle')
    expect(result.complete.value).toBe(false)
    await flush()
    expect(result.actions.value.map((a) => a.who)).toEqual(['Synthetic-202'])
    expect(mocked.apiGet).toHaveBeenCalledTimes(2)
  })

  it('clears on logout and fetches only the next authenticated account on login', async () => {
    const result = useCalendarActions(ref('Europe/Kyiv'))
    await flush()
    useAuthStore().logout()
    expect(result.actions.value).toEqual([])
    expect(result.status.value).toBe('idle')
    await result.retry()
    expect(mocked.apiGet).toHaveBeenCalledTimes(1)
    mocked.apiGet.mockResolvedValue([session(202)])
    mocked.guests.mockResolvedValue([])
    signIn(202)
    await flush()
    expect(result.actions.value.map((a) => a.who)).toEqual(['Synthetic-202'])
  })

  it('discards a late A response after B has finished loading', async () => {
    const a = deferred<unknown[]>()
    mocked.apiGet.mockReturnValueOnce(a.promise)
    const result = useCalendarActions(ref('Europe/Kyiv'))
    mocked.apiGet.mockResolvedValue([session(202)])
    mocked.guests.mockResolvedValue([])
    signIn(202)
    await flush()
    a.resolve([session(101)])
    await flush()
    expect(result.upcomingSessions.value?.map((row) => row.id)).toEqual([202])
    expect(result.actions.value.map((row) => row.who)).toEqual(['Synthetic-202'])
    expect(result.complete.value).toBe(true)
  })

  it('does not let late A failures change B loading/error/complete state', async () => {
    const a = deferred<unknown[]>()
    const b = deferred<unknown[]>()
    mocked.apiGet.mockReturnValueOnce(a.promise).mockReturnValueOnce(b.promise)
    const result = useCalendarActions(ref('Europe/Kyiv'))
    signIn(202)
    await flush()
    a.reject(new Error('synthetic A failure'))
    await flush()
    expect(result.status.value).toBe('loading')
    expect(result.failedSources.value).toEqual([])
    expect(result.complete.value).toBe(false)
    expect(result.actions.value).toEqual([])
    b.resolve([session(202)])
    await flush()
    expect(result.complete.value).toBe(true)
  })

  it('fences responses and resets loading immediately on logout', async () => {
    const a = deferred<unknown[]>()
    mocked.apiGet.mockReturnValueOnce(a.promise)
    const result = useCalendarActions(ref('Europe/Kyiv'))
    useAuthStore().logout()
    expect(result.status.value).toBe('idle')
    a.resolve([session(101)])
    await flush()
    expect(result.actions.value).toEqual([])
    expect(result.upcomingSessions.value).toBeNull()
    expect(result.complete.value).toBe(false)
  })

  it('requires a resolved authenticated identity and does not send anonymous requests', async () => {
    const auth = useAuthStore()
    auth.authResolved = false
    const result = useCalendarActions(ref('Europe/Kyiv'))
    await result.retry()
    expect(mocked.apiGet).not.toHaveBeenCalled()
    auth.user = null
    auth.authResolved = true
    await flush()
    expect(mocked.guests).not.toHaveBeenCalled()
    auth.user = { id: Number.NaN, username: 'invalid', email: null }
    await flush()
    expect(mocked.reschedule).not.toHaveBeenCalled()
    auth.accessToken = ''
    auth.user = { id: 101, username: 'synthetic', email: null }
    await result.retry()
    expect(mocked.apiGet).not.toHaveBeenCalled()
  })

  it('clears old partial errors at the next account boundary', async () => {
    mocked.guests.mockRejectedValueOnce(new Error('synthetic A failure'))
    const result = useCalendarActions(ref('Europe/Kyiv'))
    await flush()
    expect(result.failedSources.value).toEqual(['guestRequests'])
    signIn(202)
    expect(result.failedSources.value).toEqual([])
    expect(result.actions.value).toEqual([])
    await flush()
    expect(result.complete.value).toBe(true)
  })

  it('uses authEpoch to fence an in-flight response from the same account before a new login', async () => {
    const a = deferred<unknown[]>()
    mocked.apiGet.mockReturnValueOnce(a.promise)
    const result = useCalendarActions(ref('Europe/Kyiv'))
    useAuthStore().beginAuthEpoch()
    a.resolve([session(101)])
    await flush()
    expect(result.actions.value).toEqual([])
    expect(result.status.value).toBe('idle')
    expect(mocked.apiGet).toHaveBeenCalledTimes(1)
    mocked.apiGet.mockResolvedValue([session(303)])
    signIn(101)
    await flush()
    expect(result.upcomingSessions.value?.[0]?.id).toBe(303)
  })

  it('fences late results and retries after unmount', async () => {
    const a = deferred<unknown[]>()
    mocked.apiGet.mockReturnValueOnce(a.promise)
    const result = useCalendarActions(ref('Europe/Kyiv'))
    scopes[scopes.length - 1]!.stop()
    a.resolve([session(101)])
    await flush()
    await result.retry()
    expect(result.actions.value).toEqual([])
    expect(result.status.value).toBe('idle')
    expect(mocked.apiGet).toHaveBeenCalledTimes(1)
  })

  it('retries the same account with a new request and fences the previous generation', async () => {
    const old = deferred<unknown[]>()
    mocked.apiGet.mockReturnValueOnce(old.promise)
    const result = useCalendarActions(ref('Europe/Kyiv'))
    mocked.apiGet.mockResolvedValue([session(202)])
    await result.retry()
    old.resolve([session(101)])
    await flush()
    expect(result.upcomingSessions.value?.[0]?.id).toBe(202)
    expect(mocked.apiGet).toHaveBeenCalledTimes(2)
  })

})
