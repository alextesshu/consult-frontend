import { describe, expect, it } from 'vitest'
import { countdownLabel, dashboardDateLine, easeOutCubic, greetingFor, pluralUk, ringOffset, shortDayLabel, timeHHMM, tween } from './specialistDashboardV2'

describe('specialist dashboard v2 helpers', () => {
  it('formats the date line with a time-of-day greeting and no invented name', () => {
    expect(dashboardDateLine(new Date(2026, 9, 22, 15, 50))).toBe('Четвер, 22 жовтня · Добрий день')
    expect(greetingFor(new Date(2026, 9, 22, 8))).toBe('Добрий ранок')
    expect(greetingFor(new Date(2026, 9, 22, 21))).toBe('Добрий вечір')
  })
  it('formats times, short day labels and countdowns', () => {
    expect(timeHHMM(new Date(2026, 9, 22, 9, 5))).toBe('09:05')
    expect(timeHHMM('not-a-date')).toBe('')
    expect(shortDayLabel(new Date(2026, 9, 23, 9).toISOString())).toBe('Пт 23')
    expect(countdownLabel(37 * 60 * 1000 + 42 * 1000)).toBe('37:42')
    expect(countdownLabel(2 * 3600 * 1000 + 5 * 60 * 1000)).toBe('2:05:00')
    expect(countdownLabel(-500)).toBe('00:00')
  })
  it('uses Ukrainian plural forms', () => {
    expect([1, 2, 5, 11, 21, 22].map((n) => pluralUk(n, ['сесію', 'сесії', 'сесій']))).toEqual(['сесію', 'сесії', 'сесій', 'сесій', 'сесію', 'сесії'])
  })
  it('matches the source ring geometry and easeOutCubic count-up', () => {
    expect(ringOffset(4, 6)).toBe('37.70')
    expect(ringOffset(6, 6)).toBe('0.00')
    expect(ringOffset(3, 6, 0)).toBe('113.10')
    expect(easeOutCubic(0.5)).toBeCloseTo(0.875)
    expect(tween(42, 1)).toBe(42)
    expect(tween(42, 0)).toBe(0)
  })
})
