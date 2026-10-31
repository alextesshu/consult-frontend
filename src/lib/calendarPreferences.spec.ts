import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiGet, apiPatch } from './api'
import {
  CALENDAR_LAYER_KEYS,
  CALENDAR_MODES,
  CALENDAR_PREFERENCES_URL,
  CALENDAR_SELECTABLE_PRESETS,
  CALENDAR_VIEWS,
  displayRegularView,
  normalizeCalendarPreferences,
  type CalendarPreferencesResponse,
  calendarPreferencesErrorCode,
  fetchCalendarPreferences,
  updateCalendarPreferences,
} from './calendarPreferences'

vi.mock('./api', () => ({
  apiGet: vi.fn(),
  apiPatch: vi.fn(),
}))

const mockedGet = vi.mocked(apiGet)
const mockedPatch = vi.mocked(apiPatch)

describe('calendar preferences API client (UC-00 contract)', () => {
  beforeEach(() => {
    mockedGet.mockReset()
    mockedPatch.mockReset()
  })

  it('uses the specialist settings endpoint for read and partial update', async () => {
    mockedGet.mockResolvedValue({ revision: 0 })
    mockedPatch.mockResolvedValue({ revision: 1 })

    await fetchCalendarPreferences()
    await updateCalendarPreferences({ layers: { free_slots: false }, expected_revision: 0 })
    await updateCalendarPreferences({ preset: 'needs_action', expected_revision: 1 })

    expect(CALENDAR_PREFERENCES_URL).toBe('/cabinet/settings/calendar/')
    expect(mockedGet).toHaveBeenCalledWith('/cabinet/settings/calendar/')
    expect(mockedPatch).toHaveBeenNthCalledWith(1, '/cabinet/settings/calendar/', { layers: { free_slots: false }, expected_revision: 0 })
    expect(mockedPatch).toHaveBeenNthCalledWith(2, '/cabinet/settings/calendar/', { preset: 'needs_action', expected_revision: 1 })
  })

  it('mirrors the documented backend vocabulary', () => {
    expect(CALENDAR_VIEWS).toEqual(['week', 'day', 'list'])
    expect(CALENDAR_LAYER_KEYS).toEqual([
      'sessions',
      'past',
      'free_slots',
      'guest_requests',
      'absences',
      'external_guest_sessions',
    ])
    expect(CALENDAR_SELECTABLE_PRESETS).toEqual(['all', 'workday', 'availability', 'needs_action'])
  })

  it('extracts backend error codes only when present', () => {
    expect(calendarPreferencesErrorCode({ response: { data: { code: 'CALENDAR_LAYERS_EMPTY' } } })).toBe(
      'CALENDAR_LAYERS_EMPTY'
    )
    expect(calendarPreferencesErrorCode(new Error('Network Error'))).toBeNull()
    expect(calendarPreferencesErrorCode({ response: { data: { code: 7 } } })).toBeNull()
  })

  it.each(['workday', 'availability', 'needs_action', 'all', 'custom'] as const)(
    'normalizes legacy preset %s without modifying layers', (preset) => {
      const legacy = { preset, layers: { free_slots: true }, revision: 3 } as CalendarPreferencesResponse
      const normalized = normalizeCalendarPreferences(legacy)
      expect(normalized.mode).toBe(preset === 'all' || preset === 'custom' ? 'workday' : preset)
      expect(normalized.layers).toBe(legacy.layers)
      expect(legacy).not.toHaveProperty('mode')
    },
  )

  it('keeps explicit mode independently of custom preset in GET and PATCH replies', async () => {
    const reply = { mode: 'availability', preset: 'custom', revision: 5 }
    mockedGet.mockResolvedValue(reply)
    mockedPatch.mockResolvedValue(reply)
    expect(await fetchCalendarPreferences()).toMatchObject(reply)
    expect(await updateCalendarPreferences({ mode: 'availability', expected_revision: 4 })).toMatchObject(reply)
    expect(mockedPatch).toHaveBeenCalledWith(CALENDAR_PREFERENCES_URL, { mode: 'availability', expected_revision: 4 })
  })
})

describe('calendar preferences regular_view contract (backend #64, migration 0098)', () => {
  beforeEach(() => {
    mockedGet.mockReset()
    mockedPatch.mockReset()
  })

  it.each(CALENDAR_VIEWS)('keeps a server regular_view %s as the persisted value', (regular) => {
    for (const mode of CALENDAR_MODES) {
      const normalized = normalizeCalendarPreferences({ mode, view: mode === 'needs_action' ? 'list' : 'week', regular_view: regular } as CalendarPreferencesResponse)
      expect(normalized.regular_view).toBe(regular)
      expect(displayRegularView(normalized)).toBe(regular)
    }
  })

  it('keeps regular_view unknown (null) for an older backend and derives a display-only fallback', () => {
    const workday = normalizeCalendarPreferences({ mode: 'workday', view: 'day' } as CalendarPreferencesResponse)
    const availability = normalizeCalendarPreferences({ mode: 'availability', view: 'list' } as CalendarPreferencesResponse)
    const actions = normalizeCalendarPreferences({ mode: 'needs_action', view: 'list' } as CalendarPreferencesResponse)
    const legacyPreset = normalizeCalendarPreferences({ preset: 'needs_action', view: 'list' } as CalendarPreferencesResponse)
    expect([workday, availability, actions, legacyPreset].map((item) => item.regular_view)).toEqual([null, null, null, null])
    expect(displayRegularView(workday)).toBe('day')
    expect(displayRegularView(availability)).toBe('list')
    expect(displayRegularView(actions)).toBe('week')
    expect(displayRegularView(legacyPreset)).toBe('week')
    expect(normalizeCalendarPreferences({ mode: 'workday', view: 'day', regular_view: null } as CalendarPreferencesResponse).regular_view).toBeNull()
  })

  it('rejects an invalid regular_view from the server', () => {
    expect(() => normalizeCalendarPreferences({ mode: 'workday', view: 'week', regular_view: 'month' } as unknown as CalendarPreferencesResponse)).toThrow(
      'Invalid calendar regular view'
    )
  })

  it('sends regular_view as its own guarded PATCH and normalizes the reply', async () => {
    mockedPatch.mockResolvedValue({ mode: 'needs_action', view: 'list', regular_view: 'day', revision: 4 })
    const reply = await updateCalendarPreferences({ regular_view: 'day', expected_revision: 3 })
    expect(mockedPatch).toHaveBeenCalledWith(CALENDAR_PREFERENCES_URL, { regular_view: 'day', expected_revision: 3 })
    expect(reply).toMatchObject({ mode: 'needs_action', view: 'list', regular_view: 'day', revision: 4 })
  })
})
