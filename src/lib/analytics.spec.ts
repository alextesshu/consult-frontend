import { describe, expect, it } from 'vitest'
import { isLeaderAnalyticsLevel } from './analytics'

describe('isLeaderAnalyticsLevel', () => {
  it('returns true for LEADER', () => {
    expect(isLeaderAnalyticsLevel('LEADER')).toBe(true)
  })

  it('returns true for leader', () => {
    expect(isLeaderAnalyticsLevel('leader')).toBe(true)
  })

  it('returns false for ADVANCED', () => {
    expect(isLeaderAnalyticsLevel('ADVANCED')).toBe(false)
  })

  it('returns false for NONE', () => {
    expect(isLeaderAnalyticsLevel('NONE')).toBe(false)
  })
})