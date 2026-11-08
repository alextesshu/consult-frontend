import { describe, expect, it } from 'vitest'
import { formatSpecialistSessionDateTime, needsMeetingLink, sessionTimePhase } from './sessionTime'
import { buildCalendarActions, pickNextAction, splitActionsByWeek } from './calendarActions'
import { buildCalendarItems, type CalendarSessionRow } from './calendarItems'
import { dayBounds, formatTime } from './calendarTime'

const zone = 'Europe/Kyiv'
const start = Date.parse('2026-11-08T14:00:00Z')
const end = start + 30 * 60_000
const row: CalendarSessionRow = { id: 42, status: 'CONFIRMED', slot_start_at: new Date(start).toISOString(), slot_end_at: new Date(end).toISOString(), session_format: 'online', meeting_link_ready: false }
const range = { start: start - 86400000, end: end + 86400000 }

describe('one exclusive time model for calendar attention', () => {
  it.each([
    ['15:59:59', start - 1000, 'upcoming', 1],
    ['16:00:00', start, 'ongoing', 1],
    ['16:10:00', start + 10 * 60000, 'ongoing', 1],
    ['16:29:59', end - 1000, 'ongoing', 1],
    ['16:30:00', end, 'ended', 0],
  ] as const)('%s: phase, grid marker, count, week list and card agree', (_label, now, phase, count) => {
    const actions = buildCalendarActions({ upcomingSessions: [row, row], rescheduleRequests: [], guestRequests: [] }, zone, now)
    const items = buildCalendarItems({ sessions: [row] }, range, now)
    expect(sessionTimePhase(start, end, now)).toBe(phase)
    expect(actions).toHaveLength(count)
    expect(items[0]?.missingLink).toBe(Boolean(count))
    expect(items[0]?.statusLabel).toBe('Підтверджено')
    expect(pickNextAction({ actions, upcomingSessions: [row], now, timeZone: zone }).kind).toBe(count ? 'action' : 'none')
    // A different selected week changes grouping, never global eligibility.
    const groups = splitActionsByWeek(actions, { start: end + 1, end: end + 86400000 })
    expect(groups.thisWeek.length + groups.elsewhere.length).toBe(count)
    expect(groups.elsewhere).toHaveLength(count)
  })

  it.each(['SCHEDULED', 'CONFIRMED', 'CANCELLED', 'COMPLETED'])('%s: only confirmed online sessions missing a link remain actionable while ongoing', (status) => {
    for (const ready of [true, false]) {
      expect(needsMeetingLink(status, 'online', ready, start, end, start + 1)).toBe(status === 'CONFIRMED' && !ready)
    }
    expect(needsMeetingLink(status, 'offline', false, start, end, start)).toBe(false)
  })

  it('keeps pending confirmation before start only and rejects invalid intervals', () => {
    const sources = { upcomingSessions: [{ ...row, status: 'SCHEDULED' }], rescheduleRequests: [], guestRequests: [] }
    expect(buildCalendarActions(sources, zone, start - 1)[0]?.kind).toBe('confirm')
    expect(buildCalendarActions(sources, zone, start)).toEqual([])
    expect(sessionTimePhase(end, start, start)).toBe('unknown')
    expect(needsMeetingLink('CONFIRMED', 'online', false, NaN, end, start)).toBe(false)
  })

  it('keeps a linked overnight session current after specialist midnight', () => {
    const overnight = { ...row, meeting_link_ready: true, slot_start_at: '2026-11-08T21:45:00Z', slot_end_at: '2026-11-08T22:15:00Z' }
    const input = { actions: [], upcomingSessions: [overnight], now: Date.parse('2026-11-08T22:05:00Z'), timeZone: zone }
    expect(pickNextAction(input)).toMatchObject({ kind: 'session', today: true })
    expect(pickNextAction({ ...input, now: Date.parse(overnight.slot_end_at) })).toEqual({ kind: 'none' })
  })

  it('uses specialist timezone rather than browser UTC, including midnight and both DST boundaries', () => {
    expect(new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', hour: '2-digit', minute: '2-digit' }).format(start)).toBe('14:00')
    expect(formatSpecialistSessionDateTime(row.slot_start_at, zone)).toContain('16:00')
    for (const instant of ['2026-03-29T00:30:00Z', '2026-03-29T01:30:00Z', '2026-10-25T00:30:00Z', '2026-10-25T01:30:00Z', '2026-11-08T22:30:00Z']) {
      const ms = Date.parse(instant)
      expect(formatSpecialistSessionDateTime(instant, zone)).toContain(formatTime(ms, zone))
      expect(sessionTimePhase(ms, ms + 1800000, ms + 1799999)).toBe('ongoing')
      expect(sessionTimePhase(ms, ms + 1800000, ms + 1800000)).toBe('ended')
    }
    expect(formatSpecialistSessionDateTime('2026-11-08T22:30:00Z', zone)).toContain('09.11.2026')
    expect(dayBounds('2026-03-29', zone).end - dayBounds('2026-03-29', zone).start).toBe(23 * 3600000)
    expect(dayBounds('2026-10-25', zone).end - dayBounds('2026-10-25', zone).start).toBe(25 * 3600000)
    expect(formatSpecialistSessionDateTime(row.slot_start_at, null)).toBe('—')
    expect(formatSpecialistSessionDateTime(row.slot_start_at, 'invalid')).toBe('—')
  })
})
