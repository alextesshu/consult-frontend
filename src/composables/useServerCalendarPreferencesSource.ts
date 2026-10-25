import { computed, onActivated, onMounted, onScopeDispose, ref, shallowRef, watch } from 'vue'
import { displayRegularView, type CalendarPreferences } from '../lib/calendarPreferences'
import type { CalendarPreferencesSource, CalendarPreferencesState } from '../lib/calendarPreferencesSource'
import { useAuthStore } from '../stores/auth'
import { useCalendarPreferencesStore } from '../stores/calendarPreferences'
import { useCalendarPreferences } from './useCalendarPreferences'
import { clearCalendarFeedShare } from './useCalendarFeed'

const feedEpochs = new WeakMap<object, number>()

function project(data: CalendarPreferences): CalendarPreferencesState {
  return { mode: data.mode, view: displayRegularView(data), preset: data.preset, layers: data.layers, timezone: data.timezone }
}

/** Lifecycle/shape adapter only. UC-00 owns normalization, revisions, writes and conflict recovery. */
export function useServerCalendarPreferencesSource() {
  const auth = useAuthStore()
  const store = useCalendarPreferencesStore()
  const api = useCalendarPreferences({ autoload: false })
  const online = ref(typeof navigator === 'undefined' || navigator.onLine)
  const refreshing = ref(false)
  const readError = ref('')
  const forbiddenRead = ref(false)
  const forbiddenWrite = ref(false)
  const dismissedError = ref<string | null>(null)
  const instance = shallowRef<CalendarPreferencesSource | null>(null)
  let inFlight: { epoch: number; promise: Promise<void> } | null = null
  let disposed = false
  const current = computed(() => auth.user !== null && store.epoch === auth.authEpoch)
  const error = computed(() => !online.value ? 'Немає з’єднання. Показано останні завантажені налаштування без можливості збереження.' : readError.value || (api.error.value !== dismissedError.value ? api.error.value : ''))
  const status = computed(() => readError.value || forbiddenRead.value ? 'error' : api.status.value)
  const canWrite = computed(() => current.value && api.status.value === 'ready' && api.canWriteRegularView.value && online.value && !refreshing.value && !api.saving.value && !readError.value && !forbiddenRead.value && !forbiddenWrite.value && !store.requiresReload)

  async function execute(write: () => Promise<CalendarPreferences | null>): Promise<boolean> {
    if (!canWrite.value) return false
    dismissedError.value = null
    const epoch = auth.authEpoch
    try {
      const response = await write()
      return response !== null && auth.isEpochActive(epoch) && !disposed
    } catch (err) {
      if (auth.isEpochActive(epoch) && !disposed) {
        const httpStatus = (err as { response?: { status?: number } }).response?.status
        if (httpStatus === 403 || httpStatus === 401) forbiddenWrite.value = true
      }
      return false
    }
  }

  watch(() => auth.authEpoch, (epoch) => {
    if (feedEpochs.get(auth) !== epoch) {
      clearCalendarFeedShare()
      feedEpochs.set(auth, epoch)
    }
    instance.value = null
    readError.value = ''
    forbiddenRead.value = false
    forbiddenWrite.value = false
    dismissedError.value = null
    store.syncEpoch()
  }, { immediate: true, flush: 'sync' })

  watch(() => api.preferences.value, (snapshot) => {
    if (!snapshot || !current.value || instance.value) return
    const epoch = auth.authEpoch
    // Initial snapshot is used only during unmount. The wrapper hides this instance
    // synchronously on auth change; a new specialist gets a separate calendar/feed.
    instance.value = {
      state: computed(() => project(auth.isEpochActive(epoch) && store.preferences ? store.preferences : snapshot)),
      get synced() { return canWrite.value && !api.error.value },
      timezoneSource: 'server',
      get canWrite() { return canWrite.value },
      get saving() { return api.saving.value || refreshing.value },
      get error() { return error.value },
      get errorCode() { return api.errorCode.value },
      setMode: (mode) => execute(() => api.update({ mode })),
      setPreset: (preset) => execute(() => api.update({ preset })),
      setView: (view) => api.canWriteRegularView.value ? execute(() => api.setRegularView(view)) : Promise.resolve(false),
      setLayer: (layer, visible) => {
        if (!store.preferences || store.preferences.layers[layer] === visible) return Promise.resolve(true)
        if (!Object.values({ ...store.preferences.layers, [layer]: visible }).some(Boolean)) return Promise.resolve(false)
        return execute(() => api.update({ layers: { [layer]: visible } }))
      },
      reset: () => execute(() => api.update({ mode: store.preferences!.mode })),
    }
  }, { immediate: true, flush: 'sync' })

  function reload(): Promise<void> {
    const epoch = auth.authEpoch
    if (disposed || !auth.user || !online.value || api.saving.value) return Promise.resolve()
    if (inFlight?.epoch === epoch) return inFlight.promise
    refreshing.value = true
    const promise = api.reload().then(() => {
      if (!auth.isEpochActive(epoch) || disposed) return
      readError.value = ''
      forbiddenRead.value = false
      forbiddenWrite.value = false
      dismissedError.value = api.error.value
    }).catch((err) => {
      if (!auth.isEpochActive(epoch) || disposed) return
      readError.value = 'Не вдалося оновити налаштування календаря. Збереження вимкнено. Спробуйте ще раз.'
      const httpStatus = (err as { response?: { status?: number } }).response?.status
      forbiddenRead.value = httpStatus === 401 || httpStatus === 403
    }).finally(() => {
      if (inFlight?.promise === promise) {
        inFlight = null
        refreshing.value = false
      }
    })
    inFlight = { epoch, promise }
    return promise
  }
  const source = computed(() => current.value && !forbiddenRead.value ? instance.value : null)
  const visibility = () => { if (document.visibilityState === 'visible') void reload() }
  const reconnect = () => { online.value = navigator.onLine; if (online.value) void reload() }
  const focus = () => { if (document.visibilityState === 'visible') void reload() }
  watch(() => auth.user, (user) => { if (user) void reload() })
  onMounted(() => {
    window.addEventListener('focus', focus)
    window.addEventListener('online', reconnect)
    window.addEventListener('offline', reconnect)
    document.addEventListener('visibilitychange', visibility)
    void reload()
  })
  onActivated(() => void reload())
  onScopeDispose(() => {
    disposed = true
    window.removeEventListener('focus', focus)
    window.removeEventListener('online', reconnect)
    window.removeEventListener('offline', reconnect)
    document.removeEventListener('visibilitychange', visibility)
  })
  return { source, status, saving: api.saving, error, errorCode: api.errorCode, canWrite, reload, refreshing, regularViewSupported: api.canWriteRegularView }
}
