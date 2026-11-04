import { computed, ref, type ComputedRef } from 'vue'
import {
  PRESET_LAYERS,
  PRESET_VIEW,
  type CalendarLayer,
  type CalendarLayers,
  type CalendarPreset,
  type CalendarSelectablePreset,
  type CalendarView,
} from './calendarItems'

export type CalendarPreferencesState = {
  view: CalendarView
  preset: CalendarPreset
  layers: CalendarLayers
  /** Specialist profile timezone; `default` until a server source provides it. */
  timezone: string
}

/**
 * What the calendar needs from preferences. UC-00 (`/cabinet/settings/calendar/`, PR #71)
 * will provide a server-backed implementation; until it is deployed the calendar uses
 * `createLocalCalendarPreferences()` and says so (`synced === false`).
 */
export interface CalendarPreferencesSource {
  readonly state: ComputedRef<CalendarPreferencesState>
  /** True only when values come from and are saved to the server. */
  readonly synced: boolean
  readonly timezoneSource: 'server' | 'default'
  setView(view: CalendarView): void
  setPreset(preset: CalendarSelectablePreset): void
  setLayer(layer: CalendarLayer, visible: boolean): void
}

/** Documented backend default timezone (TherapistProfile.timezone default). */
export const DEFAULT_CALENDAR_TIMEZONE = 'Europe/Kyiv'

export function defaultCalendarPreferences(): CalendarPreferencesState {
  return { view: 'week', preset: 'all', layers: { ...PRESET_LAYERS.all }, timezone: DEFAULT_CALENDAR_TIMEZONE }
}

/**
 * In-memory preferences with the UC-00 rules: a preset sets its layer collection
 * (`needs_action` also the list view), any individual layer change makes the preset
 * `custom`, and at least one layer stays visible. Nothing is stored in the browser.
 */
export function createLocalCalendarPreferences(initial: CalendarPreferencesState = defaultCalendarPreferences()): CalendarPreferencesSource {
  const current = ref<CalendarPreferencesState>({ ...initial, layers: { ...initial.layers } })
  return {
    state: computed(() => current.value),
    synced: false,
    timezoneSource: 'default',
    setView(view) {
      const required = current.value.preset !== 'custom' ? PRESET_VIEW[current.value.preset] : undefined
      current.value = {
        ...current.value,
        view,
        preset: required && required !== view ? 'custom' : current.value.preset,
      }
    },
    setPreset(preset) {
      current.value = {
        ...current.value,
        preset,
        layers: { ...PRESET_LAYERS[preset] },
        view: PRESET_VIEW[preset] ?? current.value.view,
      }
    },
    setLayer(layer, visible) {
      if (current.value.layers[layer] === visible) return
      const layers = { ...current.value.layers, [layer]: visible }
      if (!Object.values(layers).some(Boolean)) return
      current.value = { ...current.value, layers, preset: 'custom' }
    },
  }
}
