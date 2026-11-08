import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import type { CalendarItem } from '../../lib/calendarItems'
import CalendarEventChip from './CalendarEventChip.vue'

const item: CalendarItem = { key: 'session:1', kind: 'session', sourceId: 1, layer: 'sessions', start: Date.parse('2026-11-09T16:00Z'), end: Date.parse('2026-11-09T16:30Z'), allDay: false, status: 'SCHEDULED', statusLabel: 'Чекає підтвердження', title: 'Олександра-Марія Константинопольська', guest: false, marker: '? Підтвердити', missingLink: false, needsAction: true, actionReasons: ['Потрібне ваше підтвердження'], rescheduleRequestIds: [], requestIds: [], conflicts: [], href: '/cabinet/sessions/1' }
async function mount(props: Partial<InstanceType<typeof CalendarEventChip>['$props']> = {}) {
  const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/:pathMatch(.*)*', component: { template: '<div />' } }] })
  await router.push('/cabinet/sessions')
  return { router, ...render(CalendarEventChip, { props: { item, timeZone: 'UTC', compact: true, ...props }, global: { plugins: [router] } }) }
}
describe('CalendarEventChip density', () => {
  it.each(['micro', 'short'] as const)('keeps full accessible details and the existing session link in %s layout', async density => {
    const { container, router } = await mount({ density })
    const link = screen.getByRole('link', { name: /16:00–16:30, Сесія, Олександра-Марія Константинопольська, Чекає підтвердження/ })
    expect(link).toHaveAttribute('title', link.getAttribute('aria-label'))
    expect(link).toHaveClass(`pc2-cal-event--density-${density}`)
    expect(screen.getByText('16:00')).toBeInTheDocument()
    expect(screen.getByText('Очікує')).toBeInTheDocument()
    expect(container.querySelector('.pc2-cal-event__marker')).toBeNull()
    expect(container.querySelector('.pc2-cal-event__title') !== null).toBe(density === 'short')
    await fireEvent.click(link)
    await waitFor(() => expect(router.currentRoute.value.path).toBe('/cabinet/sessions/1'))
  })
  it.each([['CONFIRMED', 'Підтверджено', 'Підтв.'], ['CANCELLED', 'Скасовано', 'Скасовано']])('keeps %s status explicit and accessible', async (status, statusLabel, label) => {
    await mount({ item: { ...item, status, statusLabel }, density: 'micro' })
    expect(screen.getByText(label)).toBeInTheDocument()
    expect(screen.getByRole('link')).toHaveAccessibleName(new RegExp(statusLabel))
  })
  it('does not expose names, status or action reasons in availability mode', async () => {
    const { container } = await mount({ density: 'short', muted: true })
    expect(screen.getByRole('link')).toHaveAccessibleName('16:00–16:30, Зайнято')
    expect(container).not.toHaveTextContent(item.title)
    expect(container).not.toHaveTextContent('Очікує')
    expect(screen.getByRole('link')).toHaveAttribute('title', '16:00–16:30, Зайнято')
  })
  it('keeps the full agenda layout when density is not supplied', async () => {
    const { container } = await mount({ compact: false })
    expect(screen.getByText('16:00–16:30')).toBeInTheDocument()
    expect(screen.getByText(item.title)).toBeInTheDocument()
    expect(screen.getByText('? Підтвердити')).toBeInTheDocument()
    expect(screen.getByText('Чекає підтвердження')).toBeInTheDocument()
    expect(container.querySelector('.pc2-cal-event__compact-status')).toBeNull()
  })
})
