import { computed, onActivated, onMounted, onScopeDispose, ref, shallowRef, watch } from 'vue'
import { displayRegularView, type CalendarPreferences } from '../lib/calendarPreferences'
import type { CalendarPreferencesSource, CalendarPreferencesState } from '../lib/calendarPreferencesSource'
import { useCalendarPreferencesStore } from '../stores/calendarPreferences'
import { useCalendarPreferences } from './useCalendarPreferences'

function project(data: CalendarPreferences): CalendarPreferencesState {
  return { mode: data.mode, view: displayRegularView(data), preset: data.preset, layers: data.layers, timezone: data.timezone }
}

/** Lifecycle/shape adapter only. UC-00 owns normalization, revisions, writes and conflict recovery. */
export function useServerCalendarPreferencesSource() {
  const store = useCalendarPreferencesStore()
  const api = useCalendarPreferences({ autoload: false })
  const online = ref(typeof navigator === 'undefined' || navigator.onLine)
  const refreshing = ref(false)
  const blockingRefresh = ref(false)
  const readError = ref('')
  const forbiddenRead = ref(false)
  const forbiddenWrite = ref(false)
  const dismissedError = ref<string | null>(null)
  const instance = shallowRef<CalendarPreferencesSource | null>(null)
  let inFlight: { scope: typeof store.scope; promise: Promise<void> } | null = null
  let disposed = false
  let operation = 0
  const current = computed(() => store.scope !== null && store.scope.identity === store.authIdentity)
  const error = computed(() => !online.value ? 'Немає з’єднання. Показано останні завантажені налаштування без можливості збереження.' : readError.value || (api.error.value !== dismissedError.value ? api.error.value : ''))
  const status = computed(() => readError.value || forbiddenRead.value ? 'error' : api.status.value)
  const canWrite = computed(() => current.value && api.status.value === 'ready' && api.canWriteRegularView.value && online.value && !blockingRefresh.value && !api.saving.value && !readError.value && !forbiddenRead.value && !forbiddenWrite.value && !store.requiresReload)

  async function execute(write: () => Promise<CalendarPreferences | null>, owner: typeof store.scope): Promise<boolean> {
    if (!owner || store.scope !== owner || !canWrite.value) return false
    // Invalidate adapter callbacks too: an old GET must not dismiss a PATCH conflict.
    operation += 1
    // Retire background ownership, so explicit recovery can start a fresh GET.
    inFlight = null
    refreshing.value = false
    dismissedError.value = null
    try {
      const response = await write()
      return response !== null && store.scope === owner && !disposed
    } catch (err) {
      if (store.scope === owner && !disposed) {
        const httpStatus = (err as { response?: { status?: number } }).response?.status
        if (httpStatus === 403 || httpStatus === 401) forbiddenWrite.value = true
      }
      return false
    }
  }

  watch(() => store.scope, () => {
    operation += 1
    inFlight = null
    refreshing.value = false
    blockingRefresh.value = false
    instance.value = null
    readError.value = ''
    forbiddenRead.value = false
    forbiddenWrite.value = false
    dismissedError.value = null
  }, { immediate: true, flush: 'sync' })

  watch(() => api.preferences.value, (snapshot) => {
    if (!snapshot || !current.value || instance.value) return
    const owner = store.scope
    // Initial snapshot is used only during unmount. The wrapper hides this instance
    // synchronously on auth change; a new specialist gets a separate calendar/feed.
    instance.value = {
      state: computed(() => project(store.scope === owner && store.preferences ? store.preferences : snapshot)),
      get synced() { return canWrite.value && !api.error.value },
      timezoneSource: 'server',
      get canWrite() { return canWrite.value },
      get saving() { return api.saving.value || blockingRefresh.value },
      get error() { return error.value },
      get errorCode() { return api.errorCode.value },
      setMode: (mode) => execute(() => api.update({ mode }), owner),
      setPreset: (preset) => execute(() => api.update({ preset }), owner),
      setView: (view) => api.canWriteRegularView.value ? execute(() => api.setRegularView(view), owner) : Promise.resolve(false),
      setLayer: (layer, visible) => {
        if (store.scope !== owner) return Promise.resolve(false)
        if (!store.preferences || store.preferences.layers[layer] === visible) return Promise.resolve(true)
        if (!Object.values({ ...store.preferences.layers, [layer]: visible }).some(Boolean)) return Promise.resolve(false)
        return execute(() => api.update({ layers: { [layer]: visible } }), owner)
      },
      reset: () => execute(() => api.update({ mode: store.preferences!.mode }), owner),
    }
  }, { immediate: true, flush: 'sync' })

  function refresh(kind: 'background' | 'blocking'): Promise<void> {
    const owner = store.scope
    if (disposed || !current.value || !owner || !online.value || api.saving.value) return Promise.resolve()
    if (inFlight?.scope === owner) {
      if (kind === 'blocking') blockingRefresh.value = true
      return inFlight.promise
    }
    const ticket = ++operation
    refreshing.value = true
    blockingRefresh.value = kind === 'blocking' || !api.preferences.value
    const promise = api.reload().then(() => {
      if (store.scope !== owner || disposed || ticket !== operation) return
      readError.value = ''
      forbiddenRead.value = false
      forbiddenWrite.value = false
      dismissedError.value = api.error.value
    }).catch((err) => {
      if (store.scope !== owner || disposed || ticket !== operation) return
      readError.value = 'Не вдалося оновити налаштування календаря. Збереження вимкнено. Спробуйте ще раз.'
      const httpStatus = (err as { response?: { status?: number } }).response?.status
      forbiddenRead.value = httpStatus === 401 || httpStatus === 403
    }).finally(() => {
      if (inFlight?.promise === promise) {
        inFlight = null
        refreshing.value = false
        blockingRefresh.value = false
      }
    })
    inFlight = { scope: owner, promise }
    return promise
  }
  const reload = () => refresh('blocking')
  const source = computed(() => current.value && !forbiddenRead.value ? instance.value : null)
  const visibility = () => { if (document.visibilityState === 'visible') void refresh('background') }
  const reconnect = () => { online.value = navigator.onLine; if (online.value) void reload() }
  const focus = () => { if (document.visibilityState === 'visible') void refresh('background') }
  watch(() => store.scope, (owner) => { if (owner) void refresh('background') })
  onMounted(() => {
    window.addEventListener('focus', focus)
    window.addEventListener('online', reconnect)
    window.addEventListener('offline', reconnect)
    document.addEventListener('visibilitychange', visibility)
    void refresh('background')
  })
  onActivated(() => void refresh('background'))
  onScopeDispose(() => {
    disposed = true
    window.removeEventListener('focus', focus)
    window.removeEventListener('online', reconnect)
    window.removeEventListener('offline', reconnect)
    document.removeEventListener('visibilitychange', visibility)
  })
  return { source, status, saving: api.saving, error, errorCode: api.errorCode, canWrite, reload, refreshing, regularViewSupported: api.canWriteRegularView }
}
