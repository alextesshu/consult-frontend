import { describe, expect, it } from 'vitest'
import { getCompletedSessionsBadge } from './completedSessionsBadge'

describe('getCompletedSessionsBadge', () => {
  it('returns null for missing values and counts below 50', () => {
    expect(getCompletedSessionsBadge(undefined)).toBeNull()
    expect(getCompletedSessionsBadge(null)).toBeNull()
    expect(getCompletedSessionsBadge(0)).toBeNull()
    expect(getCompletedSessionsBadge(34)).toBeNull()
    expect(getCompletedSessionsBadge(49)).toBeNull()
  })

  it('returns 50+ bucket for 50-99', () => {
    expect(getCompletedSessionsBadge(50)).toBe('50+')
    expect(getCompletedSessionsBadge(99)).toBe('50+')
  })

  it('returns 100+ bucket for 100-499', () => {
    expect(getCompletedSessionsBadge(100)).toBe('100+')
    expect(getCompletedSessionsBadge(499)).toBe('100+')
  })

  it('returns 500+ bucket for 500-999', () => {
    expect(getCompletedSessionsBadge(500)).toBe('500+')
    expect(getCompletedSessionsBadge(999)).toBe('500+')
  })

  it('returns 1000+ bucket for 1000 and above', () => {
    expect(getCompletedSessionsBadge(1000)).toBe('1000+')
    expect(getCompletedSessionsBadge(1200)).toBe('1000+')
  })
})
