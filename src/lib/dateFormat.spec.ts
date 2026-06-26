import { describe, expect, it } from 'vitest'
import {
  buildDatePickerDays,
  formatDatePickerMonth,
  formatIsoDateForDisplay,
  isoDateToLocalDate,
  isValidDisplayDate,
  localDateToIsoDate,
  normalizeDisplayDate,
  parseDisplayDateToIso,
} from './dateFormat'

describe('dateFormat scheduling helpers', () => {
  it('formats ISO dates for Ukrainian visible display', () => {
    expect(formatIsoDateForDisplay('2026-06-26')).toBe('26.06.2026')
    expect(formatIsoDateForDisplay('')).toBe('')
    expect(formatIsoDateForDisplay('2026-02-31')).toBe('')
  })

  it('parses display dates to ISO dates and rejects impossible dates', () => {
    expect(parseDisplayDateToIso('26.06.2026')).toBe('2026-06-26')
    expect(parseDisplayDateToIso('5.6.2026')).toBe('2026-06-05')
    expect(parseDisplayDateToIso('32.01.2026')).toBeNull()
    expect(parseDisplayDateToIso('31.02.2026')).toBeNull()
    expect(parseDisplayDateToIso('00.12.2026')).toBeNull()
    expect(parseDisplayDateToIso('25.13.2026')).toBeNull()
    expect(parseDisplayDateToIso('25.06')).toBeNull()
  })

  it('normalizes real display dates without making impossible dates valid', () => {
    expect(normalizeDisplayDate('5.6.2026')).toBe('05.06.2026')
    expect(normalizeDisplayDate('25.6.2026')).toBe('25.06.2026')
    expect(normalizeDisplayDate('26.06.2026')).toBe('26.06.2026')
    expect(normalizeDisplayDate('31.02.2026')).toBe('31.02.2026')
    expect(isValidDisplayDate('5.6.2026')).toBe(true)
    expect(isValidDisplayDate('31.02.2026')).toBe(false)
  })

  it('handles leap years', () => {
    expect(parseDisplayDateToIso('29.02.2024')).toBe('2024-02-29')
    expect(parseDisplayDateToIso('29.02.2026')).toBeNull()
  })

  it('converts ISO date as a local calendar date without timezone shift', () => {
    const date = isoDateToLocalDate('2026-06-26')
    expect(date).not.toBeNull()
    expect(date?.getFullYear()).toBe(2026)
    expect(date?.getMonth()).toBe(5)
    expect(date?.getDate()).toBe(26)
    expect(localDateToIsoDate(date as Date)).toBe('2026-06-26')
  })

  it('builds a Monday-first 42-day calendar grid with filler days', () => {
    const days = buildDatePickerDays(new Date(2026, 5, 15))
    expect(days).toHaveLength(42)
    expect(days[0]).toMatchObject({ isoDate: '2026-06-01', day: 1, inCurrentMonth: true })
    expect(days[6]).toMatchObject({ isoDate: '2026-06-07', day: 7, inCurrentMonth: true })
    expect(days[35]).toMatchObject({ isoDate: '2026-07-06', day: 6, inCurrentMonth: false })
  })

  it('formats Ukrainian month labels', () => {
    const label = formatDatePickerMonth(new Date(2026, 5, 1))
    expect(label).toContain('2026')
    expect(label.toLowerCase()).toContain('черв')
  })
})
