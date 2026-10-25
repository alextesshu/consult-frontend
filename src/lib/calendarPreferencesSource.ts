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
import { CALENDAR_MODES, type CalendarMode } from './calendarModes'

export type CalendarPreferencesState = {
  view: CalendarView
  preset: CalendarPreset
  /**
   * Calendar 3a mode: the last selected mode preset. It survives individual layer changes
   * (which make `preset` = `custom` under the UC-00 rules) so deviations can be shown as chips.
   */
  mode: CalendarMode
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
  /** Selects a 3a mode: applies its preset collection and clears deviations. */
  setMode(mode: CalendarMode): void
  setLayer(layer: CalendarLayer, visible: boolean): void
}

/** Documented backend default timezone (TherapistProfile.timezone default). */
export const DEFAULT_CALENDAR_TIMEZONE = 'Europe/Kyiv'

/** Calendar 3a default: «Робочий день» (UC-00 preset `workday`). */
export function defaultCalendarPreferences(): CalendarPreferencesState {
  return { view: 'week', preset: 'workday', mode: 'workday', layers: { ...PRESET_LAYERS.workday }, timezone: DEFAULT_CALENDAR_TIMEZONE }
}

/** UC-00 presets that are not 3a modes (`all`, `custom`) fall back to «Робочий день». */
export function modeForPreset(preset: CalendarPreset): CalendarMode {
  return CALENDAR_MODES.includes(preset as CalendarMode) ? (preset as CalendarMode) : 'workday'
}

/**
 * TEMPORARY fallback until UC-00 is deployed: in-memory preferences with the UC-00 rules
 * (a preset sets its layer collection, `needs_action` also the list view, an individual layer
 * change makes the preset `custom`, at least one layer stays visible). Nothing is stored in
 * the browser; a reload returns to the defaults.
 */
export function createLocalCalendarPreferences(initial: CalendarPreferencesState = defaultCalendarPreferences()): CalendarPreferencesSource {
  const current = ref<CalendarPreferencesState>({ ...initial, layers: { ...initial.layers } })
  function setPreset(preset: CalendarSelectablePreset) {
    current.value = {
      ...current.value,
      preset,
      mode: CALENDAR_MODES.includes(preset as CalendarMode) ? (preset as CalendarMode) : current.value.mode,
      layers: { ...PRESET_LAYERS[preset] },
      view: PRESET_VIEW[preset] ?? (current.value.view === 'list' ? 'week' : current.value.view),
    }
  }
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
    setPreset,
    setMode(mode) {
      setPreset(mode)
    },
    setLayer(layer, visible) {
      if (current.value.layers[layer] === visible) return
      const layers = { ...current.value.layers, [layer]: visible }
      if (!Object.values(layers).some(Boolean)) return
      current.value = { ...current.value, layers, preset: 'custom' }
    },
  }
}
