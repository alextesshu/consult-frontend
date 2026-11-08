import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import type { CalendarItem } from '../../lib/calendarItems'
import type { DayKey } from '../../lib/calendarTime'
import CalendarTimeGrid from './CalendarTimeGrid.vue'

const absence = (start: string, end: string, allDay = false): CalendarItem => ({
  key: 'absence:1', kind: 'absence', sourceId: 1, layer: 'absences',
  start: Date.parse(start), end: Date.parse(end), allDay,
  status: 'absence', statusLabel: 'Synthetic absence', title: 'Synthetic absence',
  guest: false, marker: null, missingLink: false, needsAction: false, actionReasons: [], rescheduleRequestIds: [], requestIds: [], conflicts: [], href: null,
})

const session = (id: number, start: string, minutes: number, status = 'SCHEDULED'): CalendarItem => ({
  ...absence(start, new Date(Date.parse(start) + minutes * 60000).toISOString()),
  key: `session:${id}`, kind: 'session', sourceId: id, layer: 'sessions', status,
  statusLabel: status === 'SCHEDULED' ? 'Чекає підтвердження' : status === 'CANCELLED' ? 'Скасовано' : 'Підтверджено',
  title: 'Довге синтетичне ім’я клієнта', href: `/cabinet/sessions/${id}`,
  marker: status === 'SCHEDULED' ? '? Підтвердити' : null,
})
async function fullDay(items: CalendarItem[], days: DayKey[] = ['2026-11-09']) {
  const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/:pathMatch(.*)*', component: { template: '<div />' } }] })
  const result = render(CalendarTimeGrid, { props: { days: [...days], items, summaryItems: items, windows: [], summaryWindows: [], mode: 'workday', timeZone: 'UTC', todayKey: '2026-11-09', now: Date.parse('2026-11-09T12:00Z') }, global: { plugins: [router] } })
  await fireEvent.click(screen.getByRole('button', { name: 'Показати всю добу' }))
  return result.container
}
describe('CalendarTimeGrid short-event geometry', () => {
  it.each(['SCHEDULED', 'CONFIRMED', 'CANCELLED'].flatMap(status => [15, 30, 45, 60].map(minutes => ({ status, minutes }))))('keeps $status $minutes-minute events in their exact time interval', async ({ status, minutes }) => {
    const container = await fullDay([session(1, '2026-11-09T16:00Z', minutes, status)])
    const slot = container.querySelector<HTMLElement>('.pc2-cal-grid__slot')!
    expect(parseFloat(slot.style.top)).toBe(16 * 52)
    expect(parseFloat(slot.style.height)).toBeCloseTo(minutes * 52 / 60)
    expect(slot.querySelector('a')).toHaveAttribute('href', '/cabinet/sessions/1')
    expect(slot.querySelector('a')).toHaveAccessibleName(/Довге синтетичне ім’я клієнта/)
    const density = minutes <= 30 ? 'micro' : minutes === 45 ? 'short' : undefined
    if (density) expect(slot.querySelector('a')).toHaveClass(`pc2-cal-event--density-${density}`)
    else expect(slot.querySelector('a')!.className).not.toContain('--density-')
  })
  it('does not expand adjacent 15-minute sessions into each other', async () => {
    const container = await fullDay([session(1, '2026-11-09T16:00Z', 15), session(2, '2026-11-09T16:15Z', 15), session(3, '2026-11-09T16:30Z', 30)])
    const slots = [...container.querySelectorAll<HTMLElement>('.pc2-cal-grid__slot')]
    for (let i = 0; i < slots.length - 1; i++) {
      expect(parseFloat(slots[i]!.style.top) + parseFloat(slots[i]!.style.height)).toBeLessThanOrEqual(parseFloat(slots[i + 1]!.style.top))
    }
    expect(new Set(slots.map(slot => slot.style.left)).size).toBe(1)
  })
  it('keeps the final short event at its true day boundary instead of moving it upward', async () => {
    const container = await fullDay([session(1, '2026-11-09T23:45Z', 15)])
    const slot = container.querySelector<HTMLElement>('.pc2-cal-grid__slot')!
    expect(parseFloat(slot.style.top)).toBe(23.75 * 52)
    expect(parseFloat(slot.style.top) + parseFloat(slot.style.height)).toBe(24 * 52)
  })
  it('splits an overnight session at midnight without enlarging either segment', async () => {
    const container = await fullDay([session(1, '2026-11-09T23:45Z', 30)], ['2026-11-09', '2026-11-10'])
    const slots = [...container.querySelectorAll<HTMLElement>('.pc2-cal-grid__slot')]
    expect(slots).toHaveLength(2)
    expect(slots.map(slot => parseFloat(slot.style.height))).toEqual([13, 13])
    expect(slots.map(slot => parseFloat(slot.style.top))).toEqual([23.75 * 52, 0])
  })
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
