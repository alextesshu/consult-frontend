import { computed } from 'vue'
import type { CalendarLayerKey, CalendarPreferencesPatch } from '../lib/calendarPreferences'
import { useCalendarPreferencesStore } from '../stores/calendarPreferences'

/**
 * Shared calendar preferences for calendar components (future useCalendarFeed()).
 * Every caller reads the same server-backed store; the first caller triggers the load.
 */
export function useCalendarPreferences({ autoload = true }: { autoload?: boolean } = {}) {
  const store = useCalendarPreferencesStore()
  if (autoload) void store.ensureLoaded().catch(() => undefined)

  const preferences = computed(() => store.preferences)
  return {
    preferences,
    view: computed(() => preferences.value?.view ?? null),
    preset: computed(() => preferences.value?.preset ?? null),
    layers: computed(() => preferences.value?.layers ?? null),
    timezone: computed(() => preferences.value?.timezone ?? null),
    status: computed(() => store.status),
    saving: computed(() => store.saving),
    error: computed(() => store.error),
    errorCode: computed(() => store.errorCode),
    /** Unknown until the server answers; callers decide how to render that state. */
    isLayerVisible: (key: CalendarLayerKey) => preferences.value?.layers[key] ?? null,
    update: (patch: CalendarPreferencesPatch) => store.update(patch),
    reload: () => store.reload(),
  }
}
