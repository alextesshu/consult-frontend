import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/vue'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { defineComponent, nextTick } from 'vue'
import * as api from '../../lib/api'
import { PRESET_LAYERS } from '../../lib/calendarItems'
import { useAuthStore } from '../../stores/auth'
import { useCalendarPreferencesStore } from '../../stores/calendarPreferences'
import ServerCalendarV2 from './ServerCalendarV2.vue'

vi.mock('../../lib/api', () => ({ apiGet: vi.fn(), apiPatch: vi.fn(), apiPost: vi.fn(),
  getCabinetSchedule: vi.fn(), fetchAvailabilityExceptions: vi.fn(), fetchExternalSessions: vi.fn(), fetchCabinetGuestBookingRequests: vi.fn(),
  getApiErrorMessage: (_error: unknown, fallback: string) => fallback,
}))
vi.mock('../../lib/specialistSessions', () => ({ fetchSpecialistRescheduleRequests: vi.fn(() => Promise.resolve([])) }))
const pending: { owner: number; release: () => void }[] = []
let pausePreferences = false, pauseSources = false
const name = (id: number) => `Synthetic ${id === 101 ? 'A' : 'B'}`
const payload = (id: number, revision = 0) => ({ mode: id === 101 ? 'workday' : 'availability',
  view: 'week', regular_view: 'week', preset: id === 101 ? 'workday' : 'availability',
  layers: { ...PRESET_LAYERS.workday }, timezone: 'Europe/Kyiv', revision, updated_at: null })
function rows(id: number) { return [{ id, status: 'SCHEDULED', slot_start_at: new Date(Date.now() + 3600000).toISOString(),
  slot_end_at: new Date(Date.now() + 6600000).toISOString(), client_display_name: name(id) }] }
function authenticate(id: number) {
  useAuthStore().$patch({ accessToken: 'synthetic', authResolved: true, user: { id, username: `synthetic-${id}`, email: null } })
}
async function open(authenticated = true) {
  const pinia = createPinia(); setActivePinia(pinia)
  if (authenticated) authenticate(101)
  const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/:pathMatch(.*)*', component: defineComponent({ template: '<div />' }) }] })
  await router.push('/cabinet/sessions?ui=v2')
  return render(ServerCalendarV2, { global: { plugins: [pinia, router] } })
}
beforeEach(() => {
  vi.clearAllMocks(); pending.length = 0; pausePreferences = false; pauseSources = false
  vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible')
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true)
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })))
  vi.mocked(api.apiGet).mockImplementation((async (url: string) => {
    const id = useAuthStore().user!.id
    if (url === '/cabinet/settings/calendar/') {
      if (id === 101 && pausePreferences) return new Promise<unknown>((resolve) => pending.push({ owner: id, release: () => resolve(payload(id, 99)) }))
      return payload(id)
    }
    if (url === '/booking/sessions/') {
      if (id === 101 && pauseSources) return new Promise<unknown>((resolve) => pending.push({ owner: id, release: () => resolve(rows(id)) }))
      return rows(id)
    }
    throw new Error(`Unexpected private GET: ${url}`)
  }) as typeof api.apiGet)
  vi.mocked(api.getCabinetSchedule).mockResolvedValue({ events: [] })
  vi.mocked(api.fetchAvailabilityExceptions).mockResolvedValue([])
  vi.mocked(api.fetchExternalSessions).mockResolvedValue([])
  vi.mocked(api.fetchCabinetGuestBookingRequests).mockResolvedValue([])
})
afterEach(() => vi.unstubAllGlobals())

describe('server calendar with real feed/actions composables', () => {
  it('isolates preferences and rendered names across identity-only A -> B and a late background GET', async () => {
    await open()
    await screen.findByRole('heading', { name: 'Synthetic A' })
    const epoch = useAuthStore().authEpoch
    await waitFor(() => expect(document.querySelector('.pc2-cal-server > p[role="status"]')?.textContent).toBe(''))
    pausePreferences = true
    window.dispatchEvent(new Event('focus'))
    await waitFor(() => expect(pending.length).toBe(1))
    authenticate(202)
    expect(useAuthStore().authEpoch).toBe(epoch)
    expect(useCalendarPreferencesStore().preferences).toBeNull()
    await nextTick()
    expect(screen.queryAllByText('Synthetic A')).toHaveLength(0)
    await screen.findByRole('heading', { name: 'Synthetic B' })
    pending.splice(0).forEach((request) => request.release())
    await nextTick(); await nextTick()
    expect(screen.queryAllByText('Synthetic A')).toHaveLength(0)
    expect(useCalendarPreferencesStore().preferences).toMatchObject({ mode: 'availability', revision: 0 })
    expect(api.apiPatch).not.toHaveBeenCalled()
    expect(api.apiPost).not.toHaveBeenCalled()
  })

  it('rejects pending A calendar and global-action results after B mounts', async () => {
    pauseSources = true
    await open()
    await waitFor(() => expect(pending.length).toBeGreaterThanOrEqual(2))
    useAuthStore().logout(); authenticate(202)
    await screen.findByRole('heading', { name: 'Synthetic B' })
    pending.splice(0).forEach((request) => request.release())
    await nextTick(); await nextTick()
    expect(screen.queryAllByText('Synthetic A')).toHaveLength(0)
    expect(screen.getByRole('heading', { name: 'Synthetic B' })).toBeInTheDocument()
  })

  it('does not issue private GETs before identity is resolved', async () => {
    await open(false)
    await nextTick()
    expect(api.apiGet).not.toHaveBeenCalled()
    expect(api.getCabinetSchedule).not.toHaveBeenCalled()
    expect(api.fetchCabinetGuestBookingRequests).not.toHaveBeenCalled()
  })
})
