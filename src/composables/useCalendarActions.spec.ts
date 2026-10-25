import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { apiGet, fetchCabinetGuestBookingRequests } from '../lib/api'
import { fetchSpecialistRescheduleRequests } from '../lib/specialistSessions'
import { useCalendarActions } from './useCalendarActions'

vi.mock('../lib/api', () => ({ apiGet: vi.fn(), fetchCabinetGuestBookingRequests: vi.fn() }))
vi.mock('../lib/specialistSessions', () => ({ fetchSpecialistRescheduleRequests: vi.fn() }))

const mocked = {
  apiGet: vi.mocked(apiGet),
  guests: vi.mocked(fetchCabinetGuestBookingRequests),
  reschedule: vi.mocked(fetchSpecialistRescheduleRequests),
}
const flush = () => new Promise((resolve) => setTimeout(resolve, 0))

describe('useCalendarActions', () => {
  beforeEach(() => {
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
})
