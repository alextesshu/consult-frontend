import { describe, expect, it } from 'vitest'
import { getDefaultAnalyticsMetrics, isLeaderAnalyticsLevel } from './analytics'

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

describe('getDefaultAnalyticsMetrics', () => {
  it('returns zeroed metrics shape', () => {
    expect(getDefaultAnalyticsMetrics()).toEqual({
      bookings_count: 0,
      scheduled_count: 0,
      confirmed_count: 0,
      completed_count: 0,
      cancelled_count: 0,
      rescheduled_count: 0,
      confirmation_rate: null,
      completion_rate: null,
      cancellation_rate: null,
    })
  })
})
