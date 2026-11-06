import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/vue'
import { nextTick } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { applyUiVersion } from '../lib/uiVersion'
import SpecialistSessionsEntryView from './SpecialistSessionsEntryView.vue'

vi.mock('../components/calendar-v2/ServerCalendarV2.vue', () => ({ default: { name: 'ServerCalendarV2', template: '<div data-testid="calendar-v2" />' } }))
vi.mock('./TherapistSessionsView.vue', () => ({ default: { name: 'TherapistSessionsView', template: '<div data-testid="legacy-sessions" />' } }))

async function renderEntry() {
  const router = createRouter({ history: createMemoryHistory(), routes: [
    { path: '/:pathMatch(.*)*', component: { template: '<div />' } },
  ] })
  await router.push('/cabinet/sessions')
  return { router, ...render(SpecialistSessionsEntryView, { global: { plugins: [router] } }) }
}

describe('/cabinet/sessions entry', () => {
  afterEach(() => applyUiVersion('v1'))

  it('keeps the existing sessions page in UI v1', async () => {
    applyUiVersion('v1')
    await renderEntry()
    expect(screen.getByTestId('legacy-sessions')).toBeInTheDocument()
    expect(screen.queryByTestId('calendar-v2')).toBeNull()
    expect(screen.queryByRole('navigation', { name: 'Керування календарем' })).toBeNull()
  })

  it('shows the unified calendar in UI v2 and follows a version switch', async () => {
    applyUiVersion('v2')
    await renderEntry()
    expect(screen.getByTestId('calendar-v2')).toBeInTheDocument()
    const links = screen.getByRole('navigation', { name: 'Керування календарем' })
    expect(links.querySelectorAll('a')).toHaveLength(4)
    expect(screen.getByRole('link', { name: '+ Нова сесія' })).toHaveAttribute('href', '/cabinet/slots?action=create-session')
    expect(screen.getByRole('link', { name: 'Керування розкладом' })).toHaveAttribute('href', '/cabinet/slots?tab=availability')
    expect(screen.getByRole('link', { name: 'Керування сесіями' })).toHaveAttribute('href', '/cabinet/schedule')
    expect(screen.getByRole('link', { name: 'Запис і запити' })).toHaveAttribute('href', '/cabinet/slots?tab=settings')
    applyUiVersion('v1')
    await nextTick()
    expect(screen.getByTestId('legacy-sessions')).toBeInTheDocument()
  })
})
