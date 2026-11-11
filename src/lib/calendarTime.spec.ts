import { describe, expect, it } from 'vitest'
import {
  addDays,
  dayBounds,
  dayKeyOf,
  dayLabels,
  formatTime,
  rangeLabel,
  utcQueryDates,
  wallMinutes,
  weekStartOf,
  zonedTimeToUtc,
} from './calendarTime'

const KYIV = 'Europe/Kyiv'
const HOUR = 60 * 60 * 1000

describe('calendar time in the specialist timezone', () => {
  it('builds real day bounds across the autumn DST change (25.10.2026 has 25 hours)', () => {
    const { start, end } = dayBounds('2026-10-25', KYIV)
    expect(new Date(start).toISOString()).toBe('2026-10-24T21:00:00.000Z')
    expect(new Date(end).toISOString()).toBe('2026-10-25T22:00:00.000Z')
    expect((end - start) / HOUR).toBe(25)
    expect((dayBounds('2026-10-24', KYIV).end - dayBounds('2026-10-24', KYIV).start) / HOUR).toBe(24)
  })

  it('handles the spring DST change (29.03.2026 has 23 hours)', () => {
    const { start, end } = dayBounds('2026-03-29', KYIV)
    expect(new Date(start).toISOString()).toBe('2026-03-28T22:00:00.000Z')
    expect((end - start) / HOUR).toBe(23)
  })

  it('places instants on the local wall clock before and after the change', () => {
    const beforeChange = Date.parse('2026-10-24T08:00:00Z')
    const afterChange = Date.parse('2026-10-25T08:00:00Z')
    expect(formatTime(beforeChange, KYIV)).toBe('11:00')
    expect(formatTime(afterChange, KYIV)).toBe('10:00')
    expect(wallMinutes(afterChange, KYIV)).toBe(600)
    expect(zonedTimeToUtc(2026, 10, 25, 10, 0, KYIV)).toBe(afterChange)
  })

  it('assigns UTC-late instants to the next local day', () => {
    const lateUtc = Date.parse('2026-10-21T22:30:00Z')
    expect(dayKeyOf(lateUtc, KYIV)).toBe('2026-10-22')
    expect(dayKeyOf(lateUtc, 'UTC')).toBe('2026-10-21')
  })

  it('pads UTC query dates so a UTC-day-filtered API covers the local week', () => {
    const range = { start: dayBounds('2026-10-19', KYIV).start, end: dayBounds('2026-10-25', KYIV).end }
    expect(new Date(range.start).toISOString()).toBe('2026-10-18T21:00:00.000Z')
    expect(utcQueryDates(range.start, range.end)).toEqual({ dateFrom: '2026-10-17', dateTo: '2026-10-26' })
  })

  it('does day-key arithmetic without timezones and starts weeks on Monday', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01')
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31')
    expect(weekStartOf('2026-10-25')).toBe('2026-10-19')
    expect(weekStartOf('2026-10-19')).toBe('2026-10-19')
  })

  it('formats Ukrainian day and range labels', () => {
    expect(dayLabels('2026-10-22')).toMatchObject({ short: 'Чт', full: 'Четвер, 22 жовтня' })
    expect(rangeLabel('2026-10-19', '2026-10-25')).toBe('19 – 25 жовтня')
    expect(rangeLabel('2026-10-26', '2026-11-01')).toBe('26 жовтня – 1 листопада')
  })
})
