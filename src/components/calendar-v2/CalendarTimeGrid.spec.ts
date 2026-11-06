import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/vue'
import type { CalendarItem } from '../../lib/calendarItems'
import CalendarTimeGrid from './CalendarTimeGrid.vue'

const absence = (start: string, end: string, allDay = false): CalendarItem => ({
  key: 'absence:1', kind: 'absence', sourceId: 1, layer: 'absences',
  start: Date.parse(start), end: Date.parse(end), allDay,
  status: 'absence', statusLabel: 'Synthetic absence', title: 'Synthetic absence',
  guest: false, marker: null, missingLink: false, needsAction: false, actionReasons: [], rescheduleRequestIds: [], requestIds: [], conflicts: [], href: null,
})
function grid(item: CalendarItem) {
  return render(CalendarTimeGrid, { props: {
    days: ['2026-10-22'], items: [item], windows: [], summaryItems: [item], summaryWindows: [], mode: 'workday', timeZone: 'UTC', todayKey: '2026-10-22', now: Date.parse('2026-10-22T12:00:00Z'),
  } }).container
}

describe('CalendarTimeGrid absence bounds', () => {
  it.each([
    ['06:00', '07:00', '06:00', 4 * 80],
    ['21:00', '22:00', '22:00', 4 * 80],
    ['10:00', '11:00', '09:00', 4 * 80],
  ])('keeps a partial-day absence %s–%s visible', (start, end, hour, height) => {
    const container = grid(absence(`2026-10-22T${start}:00Z`, `2026-10-22T${end}:00Z`))
    expect(container.querySelector('.pc2-cal-grid__hours')).toHaveTextContent(hour)
    const body = container.querySelector<HTMLElement>('.pc2-cal-grid__body')!
    const band = container.querySelector<HTMLElement>('.pc2-cal-grid__absence')!
    expect(body.style.height).toBe(`${height}px`)
    expect(band.style.height).toBe('80px')
    expect(parseFloat(band.style.top)).toBeGreaterThanOrEqual(0)
    expect(parseFloat(band.style.top) + parseFloat(band.style.height)).toBeLessThanOrEqual(height)
  })

  it('keeps the default hours for all-day absence shading', () => {
    const container = grid(absence('2026-10-22T00:00:00Z', '2026-10-23T00:00:00Z', true))
    expect(container.querySelector<HTMLElement>('.pc2-cal-grid__body')!.style.height).toBe(`${Math.min(window.innerHeight * 0.7, 720)}px`)
    expect(container.querySelector<HTMLElement>('.pc2-cal-grid__absence')!.style.height).toBe(`${Math.min(window.innerHeight * 0.7, 720)}px`)
  })

  it('clips an overnight partial absence to the displayed day', () => {
    const container = grid(absence('2026-10-21T23:00:00Z', '2026-10-22T01:00:00Z'))
    const band = container.querySelector<HTMLElement>('.pc2-cal-grid__absence')!
    expect(band.style.top).toBe('0px')
    expect(band.style.height).toBe('80px')
    expect(container.querySelector<HTMLElement>('.pc2-cal-grid__body')!.style.height).toBe('320px')
  })
})
