import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { gridHeightCap, hourPixels, visibleHours } from './calendarGridScale'

describe('calendar grid scale', () => {
  it('shows at least 4 hours of context around sparse events', () => {
    expect(visibleHours(10 * 60, 10 * 60 + 50)).toEqual({ start: 9, end: 13 })
    expect(visibleHours(10 * 60, 12 * 60)).toEqual({ start: 9, end: 13 })
    expect(visibleHours(9 * 60, 14 * 60)).toEqual({ start: 9, end: 14 })
  })

  it('keeps early and late events inside the day while adding context', () => {
    expect(visibleHours(30, 80)).toEqual({ start: 0, end: 4 })
    expect(visibleHours(23 * 60, 23 * 60 + 50)).toEqual({ start: 20, end: 24 })
    expect(visibleHours(6 * 60, 21 * 60 + 50)).toEqual({ start: 6, end: 22 })
  })

  it('draws 52–80px hours: compact sparse weeks, full dense weeks, scrolling only past the cap', () => {
    const cap = gridHeightCap(900)
    expect(cap).toBe(630)
    expect(hourPixels(4, cap) * 4).toBe(320)
    expect(hourPixels(5, cap) * 5).toBe(400)
    expect(hourPixels(9, cap)).toBe(70)
    expect(hourPixels(12, cap)).toBe(52.5)
    expect(hourPixels(16, cap)).toBe(52)
    expect(hourPixels(24, cap) * 24).toBe(1248)
    // A 50-minute session at 80px/h is 67px, not most of the grid.
    expect(Math.round((hourPixels(4, cap) * 50) / 60)).toBe(67)
  })
})

describe('calendar timeline scrolling (calendarV2.css)', () => {
  const css = readFileSync('src/styles/calendarV2.css', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
  // Declarations of every rule whose selector list contains exactly `selector`.
  const rule = (selector: string) =>
    [...css.matchAll(/([^{}]+)\{([^}]*)\}/g)]
      .filter((match) => match[1]!.split(',').some((part) => part.trim() === selector))
      .map((match) => match[2])
      .join(';')

  it('lets the wheel and touch scroll chain to the page at the timeline edges or when it fits', () => {
    const scroll = rule('html[data-ui="v2"] .pc2-cal-grid__scroll')
    expect(scroll).toContain('overflow-y: auto')
    expect(scroll).not.toMatch(/overscroll-behavior/)
    expect(css).not.toMatch(/pc2-cal-grid[^{]*\{[^}]*overscroll-behavior/)
  })

  it('clips the grid body so a fitting timeline never overflows by its last line', () => {
    expect(rule('html[data-ui="v2"] .pc2-cal-grid__body')).toMatch(/overflow: clip/)
  })
})
