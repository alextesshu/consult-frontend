import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/vue'
import { nextTick } from 'vue'
import { applyUiVersion } from '../lib/uiVersion'
import SpecialistSessionsEntryView from './SpecialistSessionsEntryView.vue'

vi.mock('../components/calendar-v2/ServerCalendarV2.vue', () => ({ default: { name: 'ServerCalendarV2', template: '<div data-testid="calendar-v2" />' } }))
vi.mock('./TherapistSessionsView.vue', () => ({ default: { name: 'TherapistSessionsView', template: '<div data-testid="legacy-sessions" />' } }))

describe('/cabinet/sessions entry', () => {
  afterEach(() => applyUiVersion('v1'))

  it('keeps the existing sessions page in UI v1', () => {
    applyUiVersion('v1')
    render(SpecialistSessionsEntryView)
    expect(screen.getByTestId('legacy-sessions')).toBeInTheDocument()
    expect(screen.queryByTestId('calendar-v2')).toBeNull()
  })

  it('shows the unified calendar in UI v2 and follows a version switch', async () => {
    applyUiVersion('v2')
    render(SpecialistSessionsEntryView)
    expect(screen.getByTestId('calendar-v2')).toBeInTheDocument()
    applyUiVersion('v1')
    await nextTick()
    expect(screen.getByTestId('legacy-sessions')).toBeInTheDocument()
  })
})
