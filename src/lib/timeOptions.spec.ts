import { describe, expect, it } from 'vitest'
import { buildTenMinuteTimeOptions } from './timeOptions'

describe('timeOptions scheduling helpers', () => {
  it('builds default 10-minute options from 07:00 to 23:50', () => {
    const options = buildTenMinuteTimeOptions()
    expect(options[0]).toBe('07:00')
    expect(options).toContain('09:10')
    expect(options).not.toContain('09:25')
    expect(options[options.length - 1]).toBe('23:50')
  })

  it('does not include AM/PM strings', () => {
    expect(buildTenMinuteTimeOptions().join(' ')).not.toMatch(/\b(?:AM|PM)\b/)
  })

  it('supports custom inclusive ranges', () => {
    expect(buildTenMinuteTimeOptions('09:00', '09:30')).toEqual(['09:00', '09:10', '09:20', '09:30'])
  })
})
