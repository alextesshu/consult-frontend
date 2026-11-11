import { computed, onScopeDispose, ref, shallowRef, watch } from 'vue'
import { defineStore } from 'pinia'
import { getApiErrorMessage } from '../lib/api'
import {
  CALENDAR_VIEWS,
  CalendarRegularViewUnsupportedError,
  calendarPreferencesErrorCode,
  displayRegularView,
  fetchCalendarPreferences,
  updateCalendarPreferences,
  type CalendarPreferences,
  type CalendarPreferencesChange,
  type CalendarView,
} from '../lib/calendarPreferences'
import { useAuthStore } from './auth'

type LoadStatus = 'idle' | 'loading' | 'ready' | 'error'

const LOAD_ERROR = 'Не вдалося завантажити налаштування календаря.'
const SAVE_ERROR = 'Не вдалося зберегти налаштування календаря.'
const CONFLICT_ERROR = 'Налаштування календаря змінилися на іншому пристрої. Перевірте актуальний стан і повторіть зміну.'
const REGULAR_VIEW_UNSUPPORTED_ERROR = 'Збереження вигляду календаря ще недоступне на сервері.'

type AuthScope = Readonly<{ identity: string; epoch: number }>

/** Server-authoritative state, isolated by account, login and store lifetime. */
export const useCalendarPreferencesStore = defineStore('calendarPreferences', () => {
  const auth = useAuthStore()
  const authIdentity = computed(() => {
    const id = auth.user?.id
    if (!auth.authResolved || !auth.accessToken || !Number.isSafeInteger(id) || !id || id <= 0) return null
    return `${auth.authEpoch}:${id}`
  })
  const preferences = shallowRef<CalendarPreferences | null>(null)
  const status = ref<LoadStatus>('idle')
  const error = ref('')
  const errorCode = ref<string | null>(null)
  const savingCount = ref(0)
  const requiresReload = ref(false)
  const readGeneration = ref(0)
  const epoch = ref(auth.authEpoch)
  const scope = shallowRef<AuthScope | null>(null)
  let disposed = false
  let loadInFlight: { scope: AuthScope; promise: Promise<CalendarPreferences | null> } | null = null
  let updateQueue: { scope: AuthScope; tail: Promise<void> } | null = null

  function clear() {
    preferences.value = null
    status.value = 'idle'
    error.value = ''
    errorCode.value = null
    savingCount.value = 0
    requiresReload.value = false
    readGeneration.value += 1
    loadInFlight = null
    updateQueue = null
  }
  watch([authIdentity, () => auth.authEpoch], ([identity, nextEpoch]) => {
    clear()
    epoch.value = nextEpoch
    // Object identity also fences A -> B -> A within the same auth epoch.
    scope.value = identity ? Object.freeze({ identity, epoch: nextEpoch }) : null
  }, { immediate: true, flush: 'sync' })
  onScopeDispose(() => { disposed = true; clear(); scope.value = null })
  const active = (owner: AuthScope | null): owner is AuthScope =>
    !disposed && owner !== null && owner === scope.value && owner.identity === authIdentity.value

  const saving = computed(() => savingCount.value > 0)
  const regularView = computed(() => preferences.value ? displayRegularView(preferences.value) : null)
  const regularViewPersisted = computed(() => preferences.value?.regular_view ?? null)
  const canWriteRegularView = computed(() => preferences.value !== null && preferences.value.regular_view !== null)
  const syncEpoch = () => epoch.value

  function applyServer(owner: AuthScope, next: CalendarPreferences) {
    if (!active(owner) || (preferences.value && next.revision < preferences.value.revision)) return false
    preferences.value = next
    status.value = 'ready'
    return true
  }
  function ensureLoaded(): Promise<CalendarPreferences | null> {
    const owner = scope.value
    if (!active(owner)) return Promise.resolve(null)
    if (status.value === 'ready' && preferences.value) return Promise.resolve(preferences.value)
    if (loadInFlight?.scope === owner) return loadInFlight.promise
    return reload()
  }
  function reload(): Promise<CalendarPreferences | null> {
    const owner = scope.value
    if (!active(owner)) return Promise.resolve(null)
    const generation = readGeneration.value
    const activeRead = () => active(owner) && generation === readGeneration.value
    if (!preferences.value) status.value = 'loading'
    const promise = fetchCalendarPreferences().then((data) => {
      if (!activeRead()) return active(owner) ? preferences.value : null
      if (applyServer(owner, data)) requiresReload.value = false
      return active(owner) ? preferences.value : null
    }).catch((err) => {
      if (!activeRead()) return active(owner) ? preferences.value : null
      error.value = getApiErrorMessage(err, LOAD_ERROR)
      errorCode.value = calendarPreferencesErrorCode(err)
      if (!preferences.value) status.value = 'error'
      throw err
    }).finally(() => {
      if (loadInFlight?.promise === promise) loadInFlight = null
    })
    loadInFlight = { scope: owner, promise }
    return promise
  }
  function setRegularView(view: CalendarView): Promise<CalendarPreferences | null> {
    if (!CALENDAR_VIEWS.includes(view)) return Promise.reject(new TypeError(`Unknown calendar view: ${String(view)}`))
    return update({ regular_view: view })
  }
  function update(patch: CalendarPreferencesChange): Promise<CalendarPreferences | null> {
    if ('regular_view' in patch && Object.keys(patch).some((key) => key !== 'regular_view')) {
      return Promise.reject(new TypeError('regular_view must be sent alone'))
    }
    const owner = scope.value
    if (!active(owner)) return Promise.resolve(null)
    const intent = { ...patch, ...('layers' in patch && patch.layers ? { layers: { ...patch.layers } } : {}) } as CalendarPreferencesChange
    const tail = updateQueue?.scope === owner ? updateQueue.tail : Promise.resolve()
    savingCount.value += 1
    const request = tail.then(async () => {
      if (!active(owner)) return null
      try {
        if (requiresReload.value) await reload()
        else if (!preferences.value) await ensureLoaded()
        if (!active(owner) || !preferences.value) return null
        if ('regular_view' in intent && preferences.value.regular_view === null) throw new CalendarRegularViewUnsupportedError()
        readGeneration.value += 1
        const data = await updateCalendarPreferences({ ...intent, expected_revision: preferences.value.revision })
        if (!active(owner)) return null
        readGeneration.value += 1
        error.value = ''
        errorCode.value = null
        applyServer(owner, data)
        return preferences.value
      } catch (err) {
        if (err instanceof CalendarRegularViewUnsupportedError) {
          if (active(owner)) { error.value = REGULAR_VIEW_UNSUPPORTED_ERROR; errorCode.value = err.code }
          throw err
        }
        if (active(owner)) {
          readGeneration.value += 1
          requiresReload.value = true
          const code = calendarPreferencesErrorCode(err)
          const message = code === 'CALENDAR_PREFERENCES_STALE' ? CONFLICT_ERROR : getApiErrorMessage(err, SAVE_ERROR)
          // Recovery is authoritative; the rejected intent is never replayed.
          await reload().catch(() => undefined)
          if (active(owner)) { error.value = message; errorCode.value = code }
        }
        throw err
      } finally {
        if (active(owner)) savingCount.value = Math.max(0, savingCount.value - 1)
      }
    })
    updateQueue = { scope: owner, tail: request.then(() => undefined, () => undefined) }
    return request
  }
  return { preferences, status, error, errorCode, savingCount, requiresReload, readGeneration,
    epoch, scope, authIdentity, saving, regularView, regularViewPersisted, canWriteRegularView,
    syncEpoch, ensureLoaded, reload, setRegularView, update }
})
