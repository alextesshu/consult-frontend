import { afterEach, describe, expect, it, vi } from 'vitest'
import { effectScope, nextTick, ref } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '../stores/auth'
import { apiGet, getCabinetSchedule, fetchAvailabilityExceptions, fetchExternalSessions, fetchCabinetGuestBookingRequests } from '../lib/api'
import { fetchSpecialistRescheduleRequests } from '../lib/specialistSessions'
import { clearCalendarFeedShare, useCalendarFeed } from './useCalendarFeed'
import { useCalendarActions } from './useCalendarActions'
import { useCalendarClock } from './useCalendarClock'
import { pickNextAction } from '../lib/calendarActions'

vi.mock('../lib/api', () => ({ apiGet: vi.fn(), getCabinetSchedule: vi.fn(), fetchAvailabilityExceptions: vi.fn(), fetchExternalSessions: vi.fn(), fetchCabinetGuestBookingRequests: vi.fn() }))
vi.mock('../lib/specialistSessions', () => ({ fetchSpecialistRescheduleRequests: vi.fn() }))
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks() })

describe('calendar local boundary clock', () => {
  it('updates feed, global badge/list and next card through start/end with one request per source', async () => {
    vi.useFakeTimers()
    const start = Date.parse('2026-11-08T14:00:00Z'), end = start + 1800000
    vi.setSystemTime(start - 1000)
    setActivePinia(createPinia())
    useAuthStore().$patch({ accessToken: 'synthetic', authResolved: true, user: { id: 123, username: 'synthetic', email: null } })
    clearCalendarFeedShare()
    const row = { id: 42, status: 'CONFIRMED', session_format: 'online', meeting_link_ready: false, slot_start_at: new Date(start).toISOString(), slot_end_at: new Date(end).toISOString() }
    vi.mocked(apiGet).mockResolvedValue([row, row])
    vi.mocked(getCabinetSchedule).mockResolvedValue({ events: [] } as never)
    vi.mocked(fetchAvailabilityExceptions).mockResolvedValue([])
    vi.mocked(fetchExternalSessions).mockResolvedValue([])
    vi.mocked(fetchCabinetGuestBookingRequests).mockResolvedValue([])
    vi.mocked(fetchSpecialistRescheduleRequests).mockResolvedValue([])
    const scope = effectScope()
    const state = scope.run(() => {
      const now = useCalendarClock(ref([start, end]))
      const feed = useCalendarFeed(ref({ start: start - 86400000, end: end + 86400000 }), { nowValue: now })
      const attention = useCalendarActions(ref('Europe/Kyiv'), now)
      return { now, feed, attention }
    })!
    try {
      await vi.advanceTimersByTimeAsync(0)
      for (const instant of [start - 1000, start, start + 600000, end - 1000, end]) {
        await vi.advanceTimersByTimeAsync(instant - Date.now())
        const expected = instant < end ? 1 : 0
        expect(state.attention.complete.value).toBe(true)
        expect(state.attention.actions.value).toHaveLength(expected)
        expect(state.feed.items.value[0]?.missingLink).toBe(Boolean(expected))
        expect(pickNextAction({ actions: state.attention.actions.value, upcomingSessions: state.attention.upcomingSessions.value, now: state.now.value, timeZone: 'Europe/Kyiv' }).kind).toBe(expected ? 'action' : 'none')
      }
      expect(apiGet).toHaveBeenCalledTimes(2) // one week feed, one global action set
      expect(fetchCabinetGuestBookingRequests).toHaveBeenCalledTimes(1)
      expect(getCabinetSchedule).toHaveBeenCalledTimes(1)
    } finally { scope.stop() }
    expect(vi.getTimerCount()).toBe(0)
  })

  it('reschedules loaded boundaries and catches up after a background tab without network calls', async () => {
    vi.useFakeTimers(); vi.setSystemTime(1000)
    const boundaries = ref<number[]>([])
    const scope = effectScope()
    const now = scope.run(() => useCalendarClock(boundaries))!
    try {
      boundaries.value = [1500, 1700]
      await nextTick()
      await vi.advanceTimersByTimeAsync(500)
      expect(now.value).toBe(1500)
      await vi.advanceTimersByTimeAsync(200)
      expect(now.value).toBe(1700)
      vi.setSystemTime(99999)
      vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible')
      document.dispatchEvent(new Event('visibilitychange'))
      expect(now.value).toBe(99999)
    } finally { scope.stop() }
    expect(vi.getTimerCount()).toBe(0)
  })
})
