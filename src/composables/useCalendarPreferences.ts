import { computed } from 'vue'
import type { CalendarLayerKey, CalendarPreferencesChange, CalendarView } from '../lib/calendarPreferences'
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
    mode: computed(() => preferences.value?.mode ?? null),
    /** Legacy rendered view; ordinary-mode layout reads `regularView`. */
    view: computed(() => preferences.value?.view ?? null),
    /** Week/Day/List for ordinary modes (persisted value or read-only fallback). */
    regularView: computed(() => store.regularView),
    /** True only when the server reported `regular_view` (not the fallback). */
    regularViewPersisted: computed(() => store.regularViewPersisted !== null),
    canWriteRegularView: computed(() => store.canWriteRegularView),
    preset: computed(() => preferences.value?.preset ?? null),
    layers: computed(() => preferences.value?.layers ?? null),
    timezone: computed(() => preferences.value?.timezone ?? null),
    status: computed(() => store.status),
    saving: computed(() => store.saving),
    error: computed(() => store.error),
    errorCode: computed(() => store.errorCode),
    /** Unknown until the server answers; callers decide how to render that state. */
    isLayerVisible: (key: CalendarLayerKey) => preferences.value?.layers[key] ?? null,
    update: (patch: CalendarPreferencesChange) => store.update(patch),
    setRegularView: (view: CalendarView) => store.setRegularView(view),
    reload: () => store.reload(),
  }
}
