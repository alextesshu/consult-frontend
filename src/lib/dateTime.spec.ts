import { describe, expect, it } from 'vitest'
import {
  formatUkDateCompact,
  formatUkDateLong,
  formatUkDateTime,
  formatUkDateTimeCompact,
  formatUkDayMonth,
  formatUkTime,
  formatUkWeekdayShort,
} from './dateTime'

describe('dateTime helpers', () => {
  const value = new Date(2026, 2, 12, 14, 5, 0)

  it('formats time in 24-hour format for uk-UA', () => {
    const formatted = formatUkTime(value)

    expect(formatted).toContain('14:05')
    expect(formatted.toUpperCase()).not.toContain('AM')
    expect(formatted.toUpperCase()).not.toContain('PM')
  })

  it('formats compact date time in 24-hour format for uk-UA', () => {
    const formatted = formatUkDateTimeCompact(value)

    expect(formatted).toContain('12.03.2026')
    expect(formatted).toContain('14:05')
    expect(formatted.toUpperCase()).not.toContain('AM')
    expect(formatted.toUpperCase()).not.toContain('PM')
  })

  it('keeps custom uk-UA date-time options on the shared formatter', () => {
    const formatted = formatUkDateTime(value, {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })

    expect(formatted).toContain('12.03')
    expect(formatted).toContain('14:05')
    expect(formatted.toUpperCase()).not.toContain('AM')
    expect(formatted.toUpperCase()).not.toContain('PM')
  })

  it('formats compact and long dates through shared helpers', () => {
    expect(formatUkDateCompact(value)).toBe('12.03.2026')
    expect(formatUkDayMonth(value)).toBe('12.03')
    expect(formatUkDateLong(value)).toContain('2026')
    expect(formatUkWeekdayShort(value)).not.toBe('')
  })
})
