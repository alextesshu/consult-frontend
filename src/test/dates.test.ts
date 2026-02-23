import { describe, expect, it } from 'vitest'
import { toLocalDate, toUtcDate, toUtcRange } from '../lib/dates'

function formatLocal(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

describe('dates helpers', () => {
  it('formats UTC and local dates near midnight', () => {
    const date = new Date(Date.UTC(2026, 1, 23, 23, 30, 0))

    expect(toUtcDate(date)).toBe('2026-02-23')
    expect(toLocalDate(date)).toBe(formatLocal(date))

    if (date.getTimezoneOffset() !== 0) {
      expect(toLocalDate(date)).not.toBe(toUtcDate(date))
    }
  })

  it('formats UTC ranges', () => {
    const from = new Date(Date.UTC(2026, 1, 23, 23, 30, 0))
    const to = new Date(Date.UTC(2026, 1, 24, 0, 15, 0))

    expect(toUtcRange(from, to)).toEqual({
      date_from: '2026-02-23',
      date_to: '2026-02-24',
    })
  })
})
