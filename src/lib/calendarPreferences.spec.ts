import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiGet, apiPatch } from './api'
import {
  CALENDAR_LAYER_KEYS,
  CALENDAR_PREFERENCES_URL,
  CALENDAR_SELECTABLE_PRESETS,
  CALENDAR_VIEWS,
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
    await updateCalendarPreferences({ layers: { free_slots: false } })
    await updateCalendarPreferences({ preset: 'needs_action' })

    expect(CALENDAR_PREFERENCES_URL).toBe('/cabinet/settings/calendar/')
    expect(mockedGet).toHaveBeenCalledWith('/cabinet/settings/calendar/')
    expect(mockedPatch).toHaveBeenNthCalledWith(1, '/cabinet/settings/calendar/', { layers: { free_slots: false } })
    expect(mockedPatch).toHaveBeenNthCalledWith(2, '/cabinet/settings/calendar/', { preset: 'needs_action' })
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
})
