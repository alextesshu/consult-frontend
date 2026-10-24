import { apiGet, apiPatch } from './api'

// UC-00 contract: GET/PATCH /api/cabinet/settings/calendar/ (backend docs/AI_CONTRACT.md,
// «Unified Calendar Preferences»). Display state only; the server is the source of truth.
export const CALENDAR_PREFERENCES_URL = '/cabinet/settings/calendar/'

export const CALENDAR_VIEWS = ['week', 'day', 'list'] as const
export type CalendarView = (typeof CALENDAR_VIEWS)[number]

export const CALENDAR_LAYER_KEYS = [
  'sessions',
  'past',
  'free_slots',
  'guest_requests',
  'absences',
  'external_guest_sessions',
] as const
export type CalendarLayerKey = (typeof CALENDAR_LAYER_KEYS)[number]
export type CalendarLayers = Record<CalendarLayerKey, boolean>

export const CALENDAR_SELECTABLE_PRESETS = ['all', 'workday', 'availability', 'needs_action'] as const
export type CalendarSelectablePreset = (typeof CALENDAR_SELECTABLE_PRESETS)[number]
// `custom` is response-only: the server sets it after an individual layer change.
export type CalendarPreset = CalendarSelectablePreset | 'custom'

export type CalendarPreferences = {
  view: CalendarView
  preset: CalendarPreset
  layers: CalendarLayers
  revision: number
  updated_at: string | null
  /** Read-only, from the specialist profile. */
  timezone: string
}

/** Either a preset or individual layers, never both (the server rejects the mix). */
export type CalendarPreferencesPatch =
  | { view?: CalendarView; preset: CalendarSelectablePreset; layers?: never }
  | { view?: CalendarView; layers?: Partial<CalendarLayers>; preset?: never }

export function fetchCalendarPreferences(): Promise<CalendarPreferences> {
  return apiGet<CalendarPreferences>(CALENDAR_PREFERENCES_URL)
}

export function updateCalendarPreferences(patch: CalendarPreferencesPatch): Promise<CalendarPreferences> {
  return apiPatch<CalendarPreferences>(CALENDAR_PREFERENCES_URL, patch)
}

/** Backend error code (e.g. CALENDAR_LAYERS_EMPTY, SUSPENDED) when present. */
export function calendarPreferencesErrorCode(err: unknown): string | null {
  const code = (err as { response?: { data?: { code?: unknown } } })?.response?.data?.code
  return typeof code === 'string' ? code : null
}
