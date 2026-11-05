import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope, nextTick, ref } from 'vue'
import { apiGet, fetchAvailabilityExceptions, fetchExternalSessions, getCabinetSchedule } from '../lib/api'
import { fetchSpecialistRescheduleRequests } from '../lib/specialistSessions'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '../stores/auth'
import { clearCalendarFeedShare, useCalendarFeed as createFeed } from './useCalendarFeed'

vi.mock('../lib/api', () => ({
  apiGet: vi.fn(),
  getCabinetSchedule: vi.fn(),
  fetchAvailabilityExceptions: vi.fn(),
  fetchExternalSessions: vi.fn(),
}))
vi.mock('../lib/specialistSessions', () => ({ fetchSpecialistRescheduleRequests: vi.fn() }))

const mocked = {
  apiGet: vi.mocked(apiGet),
  schedule: vi.mocked(getCabinetSchedule),
  absences: vi.mocked(fetchAvailabilityExceptions),
  external: vi.mocked(fetchExternalSessions),
  reschedule: vi.mocked(fetchSpecialistRescheduleRequests),
}

const NOW = Date.parse('2026-10-22T13:50:00Z')
const WEEK = { start: Date.parse('2026-10-18T21:00:00Z'), end: Date.parse('2026-10-25T22:00:00Z') }
const NEXT_WEEK = { start: Date.parse('2026-10-25T22:00:00Z'), end: Date.parse('2026-11-01T22:00:00Z') }
const sessionRow = (id: number, start = '2026-10-23T07:00:00Z') => ({
  id,
  status: 'CONFIRMED',
  slot_start_at: start,
  slot_end_at: new Date(Date.parse(start) + 50 * 60000).toISOString(),
  client_display_name: `Клієнт ${id}`,
})

const scopes: ReturnType<typeof effectScope>[] = []
function useCalendarFeed(...args: Parameters<typeof createFeed>) {
  const scope = effectScope()
  scopes.push(scope)
  return scope.run(() => createFeed(...args))!
}
function signIn(id: number) {
  const auth = useAuthStore()
  auth.$patch({ accessToken: 'synthetic-token', authResolved: true, user: { id, username: `specialist-${id}`, email: null, roles: ['specialist'] } })
}
afterEach(() => scopes.splice(0).forEach((scope) => scope.stop()))

async function settle() {
  for (let i = 0; i < 5; i += 1) await nextTick()
  await new Promise((resolve) => setTimeout(resolve, 0))
}

describe('useCalendarFeed', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    signIn(101)
    clearCalendarFeedShare()
    Object.values(mocked).forEach((mock) => mock.mockReset())
    mocked.schedule.mockResolvedValue({ events: [] })
    mocked.apiGet.mockResolvedValue([sessionRow(1)])
    mocked.absences.mockResolvedValue([])
    mocked.external.mockResolvedValue([])
    mocked.reschedule.mockResolvedValue([])
  })

  it('reads five existing GET endpoints with UTC-padded dates and builds items', async () => {
    const feed = useCalendarFeed(ref(WEEK), { now: () => NOW })
    expect(feed.status.value).toBe('loading')
    await settle()

    expect(mocked.schedule).toHaveBeenCalledWith('2026-10-17', '2026-10-26')
    expect(mocked.apiGet).toHaveBeenCalledWith('/booking/sessions/', { params: { date_from: '2026-10-17', date_to: '2026-10-26' } })
    expect(mocked.reschedule).toHaveBeenCalledTimes(1)
    expect(mocked.absences).toHaveBeenCalledTimes(1)
    expect(mocked.external).toHaveBeenCalledTimes(1)
    expect(feed.status.value).toBe('ready')
    expect(feed.items.value.map((item) => item.key)).toEqual(['session:1'])
    expect(feed.failedSources.value).toEqual([])
  })

  it('shows what loaded and names the sources that failed', async () => {
    mocked.absences.mockRejectedValue(new Error('500'))
    mocked.external.mockRejectedValue(new Error('500'))
    const feed = useCalendarFeed(ref(WEEK), { now: () => NOW })
    await settle()

    expect(feed.status.value).toBe('ready')
    expect(feed.items.value).toHaveLength(1)
    expect(feed.failedSources.value).toEqual(['absences', 'externalSessions'])
  })

  it('reports an error when both core sources fail and recovers on retry', async () => {
    mocked.schedule.mockRejectedValueOnce(new Error('down'))
    mocked.apiGet.mockRejectedValueOnce(new Error('down'))
    const feed = useCalendarFeed(ref(WEEK), { now: () => NOW })
    await settle()
    expect(feed.status.value).toBe('error')
    expect(feed.items.value).toEqual([])

    await feed.retry()
    expect(feed.status.value).toBe('ready')
    expect(feed.items.value).toHaveLength(1)
  })

  it('discards a slow response for a range that is no longer shown', async () => {
    let releaseFirst: (rows: unknown[]) => void = () => undefined
    mocked.apiGet
      .mockImplementationOnce(() => new Promise((resolve) => { releaseFirst = resolve }))
      .mockResolvedValueOnce([sessionRow(2, '2026-10-27T07:00:00Z')])
    const range = ref(WEEK)
    const feed = useCalendarFeed(range, { now: () => NOW })
    range.value = NEXT_WEEK
    await settle()
    releaseFirst([sessionRow(1)])
    await settle()

    expect(feed.items.value.map((item) => item.key)).toEqual(['session:2'])
  })

  it('shares one set of requests between instances loading the same range concurrently', async () => {
    const first = useCalendarFeed(ref(WEEK), { now: () => NOW })
    const second = useCalendarFeed(ref({ ...WEEK }), { now: () => NOW })
    await settle()

    expect(mocked.schedule).toHaveBeenCalledTimes(1)
    expect(mocked.apiGet).toHaveBeenCalledTimes(1)
    expect(first.items.value.map((item) => item.key)).toEqual(['session:1'])
    expect(second.items.value.map((item) => item.key)).toEqual(['session:1'])
  })

  it('never shares resolved results with another specialist within the sharing window', async () => {
    const first = useCalendarFeed(ref(WEEK), { now: () => NOW })
    await settle()
    mocked.apiGet.mockResolvedValue([sessionRow(2)])
    signIn(202)
    expect(first.items.value).toEqual([])
    const second = useCalendarFeed(ref(WEEK), { now: () => NOW })
    await settle()
    expect(first.items.value.map((item) => item.key)).toEqual(['session:2'])
    expect(second.items.value.map((item) => item.key)).toEqual(['session:2'])
    expect(mocked.apiGet).toHaveBeenCalledTimes(2)
  })

  it('discards an in-flight response after switching accounts in a mounted feed', async () => {
    let release!: (rows: unknown[]) => void
    mocked.apiGet.mockImplementationOnce(() => new Promise((resolve) => { release = resolve }))
    const feed = useCalendarFeed(ref(WEEK), { now: () => NOW })
    mocked.apiGet.mockResolvedValue([sessionRow(2)])
    signIn(202)
    await settle()
    release([sessionRow(1)])
    await settle()
    expect(feed.items.value.map((item) => item.key)).toEqual(['session:2'])
    expect(feed.failedSources.value).toEqual([])
    expect(feed.status.value).toBe('ready')
  })

  it('clears rendered data synchronously on logout and never reuses it after another login', async () => {
    const feed = useCalendarFeed(ref(WEEK), { now: () => NOW })
    await settle()
    useAuthStore().logout()
    expect(feed.items.value).toEqual([])
    expect(feed.status.value).toBe('idle')
    expect(feed.failedSources.value).toEqual([])
    await feed.retry()
    expect(mocked.apiGet).toHaveBeenCalledTimes(1)
    mocked.apiGet.mockResolvedValue([sessionRow(2)])
    signIn(202)
    await settle()
    expect(feed.items.value.map((item) => item.key)).toEqual(['session:2'])
    expect(mocked.apiGet).toHaveBeenCalledTimes(2)
  })

  it('invalidates shared and per-range caches even when the same account signs back in', async () => {
    const range = ref(WEEK)
    const feed = useCalendarFeed(range, { now: () => NOW })
    await settle()
    range.value = NEXT_WEEK
    await settle()
    useAuthStore().logout()
    mocked.apiGet.mockResolvedValue([])
    signIn(101)
    await settle()
    range.value = WEEK
    expect(feed.items.value).toEqual([])
    await settle()
    expect(feed.items.value).toEqual([])
    expect(mocked.apiGet).toHaveBeenCalledTimes(4)
  })

  it('fences pending responses and clears loading state on logout', async () => {
    let release!: (rows: unknown[]) => void
    mocked.apiGet.mockImplementationOnce(() => new Promise((resolve) => { release = resolve }))
    const feed = useCalendarFeed(ref(WEEK), { now: () => NOW })
    useAuthStore().logout()
    expect(feed.status.value).toBe('idle')
    release([sessionRow(1)])
    await settle()
    expect(feed.items.value).toEqual([])
    expect(feed.status.value).toBe('idle')
    expect(feed.failedSources.value).toEqual([])
  })

  it.each(['partial', 'error'] as const)('isolates %s results and errors across auth transitions', async (failure) => {
    mocked.absences.mockRejectedValue(new Error('synthetic failure'))
    if (failure === 'error') {
      mocked.schedule.mockRejectedValue(new Error('synthetic failure'))
      mocked.apiGet.mockRejectedValue(new Error('synthetic failure'))
    }
    const feed = useCalendarFeed(ref(WEEK), { now: () => NOW })
    await settle()
    expect(feed.failedSources.value).not.toEqual([])
    useAuthStore().logout()
    expect(feed.failedSources.value).toEqual([])
    expect(feed.status.value).toBe('idle')
    mocked.schedule.mockResolvedValue({ events: [] })
    mocked.apiGet.mockResolvedValue([sessionRow(2)])
    mocked.absences.mockResolvedValue([])
    signIn(202)
    await settle()
    expect(feed.failedSources.value).toEqual([])
    expect(feed.items.value.map((item) => item.key)).toEqual(['session:2'])
  })

  it('does not publish old failures over the new account while its request is pending', async () => {
    let rejectA!: (reason: Error) => void
    let resolveB!: (rows: unknown[]) => void
    mocked.schedule.mockRejectedValueOnce(new Error('synthetic A failure'))
    mocked.apiGet
      .mockImplementationOnce(() => new Promise((_resolve, reject) => { rejectA = reject }))
      .mockImplementationOnce(() => new Promise((resolve) => { resolveB = resolve }))
    const feed = useCalendarFeed(ref(WEEK), { now: () => NOW })
    signIn(202)
    await nextTick()
    rejectA(new Error('synthetic A failure'))
    await settle()
    expect(feed.status.value).toBe('loading')
    expect(feed.failedSources.value).toEqual([])
    expect(feed.items.value).toEqual([])
    resolveB([sessionRow(2)])
    await settle()
    expect(feed.status.value).toBe('ready')
    expect(feed.items.value.map((item) => item.key)).toEqual(['session:2'])
  })

  it('does not publish results after the consumer scope is disposed', async () => {
    let release!: (rows: unknown[]) => void
    mocked.apiGet.mockImplementationOnce(() => new Promise((resolve) => { release = resolve }))
    const feed = useCalendarFeed(ref(WEEK), { now: () => NOW })
    scopes[scopes.length - 1]!.stop()
    release([sessionRow(1)])
    await settle()
    expect(feed.items.value).toEqual([])
    expect(feed.status.value).toBe('loading')
  })

  it('forces a fresh request on retry, including inside the sharing window', async () => {
    const feed = useCalendarFeed(ref(WEEK), { now: () => NOW })
    await settle()
    mocked.apiGet.mockResolvedValue([sessionRow(2)])
    await feed.retry()
    expect(mocked.apiGet).toHaveBeenCalledTimes(2)
    expect(feed.items.value.map((item) => item.key)).toEqual(['session:2'])
  })

  it('fails closed without a reliable resolved authenticated identity', async () => {
    const auth = useAuthStore()
    auth.user = null
    const feed = useCalendarFeed(ref(WEEK), { now: () => NOW })
    await feed.retry()
    expect(mocked.apiGet).not.toHaveBeenCalled()
    auth.user = { id: Number.NaN, username: 'invalid', email: null }
    await settle()
    expect(mocked.apiGet).not.toHaveBeenCalled()
    auth.user = { id: 101, username: 'unresolved', email: null }
    auth.authResolved = false
    await settle()
    await feed.retry()
    expect(mocked.apiGet).not.toHaveBeenCalled()
    auth.accessToken = ''
    auth.authResolved = true
    await settle()
    await feed.retry()
    expect(feed.items.value).toEqual([])
    expect(feed.status.value).toBe('idle')
    expect(mocked.apiGet).not.toHaveBeenCalled()
  })

  it('invalidates pending results at the beginning of a new auth epoch', async () => {
    let release!: (rows: unknown[]) => void
    mocked.apiGet.mockImplementationOnce(() => new Promise((resolve) => { release = resolve }))
    const feed = useCalendarFeed(ref(WEEK), { now: () => NOW })
    useAuthStore().beginAuthEpoch()
    release([sessionRow(1)])
    await settle()
    expect(feed.items.value).toEqual([])
    expect(feed.status.value).toBe('idle')
    mocked.apiGet.mockResolvedValue([sessionRow(2)])
    signIn(101)
    await settle()
    expect(feed.items.value.map((item) => item.key)).toEqual(['session:2'])
    expect(mocked.apiGet).toHaveBeenCalledTimes(2)
  })

  it('reloads after an account round-trip in one synchronous action instead of reviving the old cache', async () => {
    const feed = useCalendarFeed(ref(WEEK), { now: () => NOW })
    await settle()
    mocked.apiGet.mockResolvedValue([sessionRow(3)])
    signIn(202)
    signIn(101)
    expect(feed.items.value).toEqual([])
    await settle()
    expect(feed.items.value.map((item) => item.key)).toEqual(['session:3'])
    expect(mocked.apiGet).toHaveBeenCalledTimes(2)
  })

  it('scopes sharing after the previous consumer has unmounted', async () => {
    useCalendarFeed(ref(WEEK), { now: () => NOW })
    await settle()
    scopes[scopes.length - 1]!.stop()
    useAuthStore().logout()
    signIn(202)
    mocked.apiGet.mockResolvedValue([sessionRow(2)])
    const feed = useCalendarFeed(ref(WEEK), { now: () => NOW })
    await settle()
    expect(feed.items.value.map((item) => item.key)).toEqual(['session:2'])
    expect(mocked.apiGet).toHaveBeenCalledTimes(2)
  })

  it('does not share results between independent auth stores with the same account and epoch', async () => {
    const first = useCalendarFeed(ref(WEEK), { now: () => NOW })
    await settle()
    setActivePinia(createPinia())
    signIn(101)
    mocked.apiGet.mockResolvedValue([sessionRow(2)])
    const second = useCalendarFeed(ref(WEEK), { now: () => NOW })
    await settle()
    expect(first.items.value.map((item) => item.key)).toEqual(['session:1'])
    expect(second.items.value.map((item) => item.key)).toEqual(['session:2'])
    expect(mocked.apiGet).toHaveBeenCalledTimes(2)
  })

  it('shows a cached range immediately while it refreshes', async () => {
    const range = ref(WEEK)
    const feed = useCalendarFeed(range, { now: () => NOW })
    await settle()
    range.value = NEXT_WEEK
    await settle()
    mocked.apiGet.mockImplementation(() => new Promise(() => undefined))
    range.value = { ...WEEK }
    await nextTick()

    expect(feed.status.value).toBe('ready')
    expect(feed.items.value.map((item) => item.key)).toEqual(['session:1'])
  })
})
