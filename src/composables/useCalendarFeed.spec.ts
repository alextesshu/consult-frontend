import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import { apiGet, fetchAvailabilityExceptions, fetchExternalSessions, getCabinetSchedule } from '../lib/api'
import { fetchSpecialistRescheduleRequests } from '../lib/specialistSessions'
import { clearCalendarFeedShare, useCalendarFeed } from './useCalendarFeed'

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

async function settle() {
  for (let i = 0; i < 5; i += 1) await nextTick()
  await new Promise((resolve) => setTimeout(resolve, 0))
}

describe('useCalendarFeed', () => {
  beforeEach(() => {
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
