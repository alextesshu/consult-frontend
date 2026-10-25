import { defineStore } from 'pinia'
import { getApiErrorMessage } from '../lib/api'
import {
  calendarPreferencesErrorCode,
  fetchCalendarPreferences,
  updateCalendarPreferences,
  type CalendarPreferences,
  type CalendarPreferencesChange,
} from '../lib/calendarPreferences'
import { useAuthStore } from './auth'

type LoadStatus = 'idle' | 'loading' | 'ready' | 'error'

// One GET in flight per auth epoch, shared by every calendar component.
let loadInFlight: { epoch: number; promise: Promise<CalendarPreferences | null> } | null = null
// Per-store and per-login queues: an old account's request never blocks a new login.
const updateQueues = new WeakMap<object, { epoch: number; tail: Promise<void> }>()

const LOAD_ERROR = 'Не вдалося завантажити налаштування календаря.'
const SAVE_ERROR = 'Не вдалося зберегти налаштування календаря.'
const CONFLICT_ERROR = 'Налаштування календаря змінилися на іншому пристрої. Перевірте актуальний стан і повторіть зміну.'

/**
 * Server-authoritative calendar preferences (UC-00).
 *
 * Values only ever come from server responses: nothing is persisted in or restored
 * from browser storage, and there are no optimistic writes. Responses are dropped
 * when they belong to a previous login (auth epoch) or carry an older revision than
 * the one already applied, so out-of-order responses cannot roll the state back.
 */
export const useCalendarPreferencesStore = defineStore('calendarPreferences', {
  state: () => ({
    preferences: null as CalendarPreferences | null,
    status: 'idle' as LoadStatus,
    error: '' as string,
    errorCode: null as string | null,
    savingCount: 0 as number,
    requiresReload: false,
    epoch: -1 as number,
  }),
  getters: {
    saving: (state) => state.savingCount > 0,
  },
  actions: {
    syncEpoch() {
      const epoch = useAuthStore().authEpoch
      if (epoch !== this.epoch) {
        this.preferences = null
        this.status = 'idle'
        this.error = ''
        this.errorCode = null
        this.epoch = epoch
        this.savingCount = 0
        this.requiresReload = false
      }
      return epoch
    },
    applyServer(epoch: number, next: CalendarPreferences) {
      if (!useAuthStore().isEpochActive(epoch) || epoch !== this.epoch) return false
      if (this.preferences && next.revision < this.preferences.revision) return false
      this.preferences = next
      this.status = 'ready'
      return true
    },
    /** Loads once per login; concurrent callers share the same request. */
    ensureLoaded(): Promise<CalendarPreferences | null> {
      const epoch = this.syncEpoch()
      if (this.status === 'ready' && this.preferences) return Promise.resolve(this.preferences)
      if (loadInFlight && loadInFlight.epoch === epoch) return loadInFlight.promise
      return this.reload()
    },
    reload(): Promise<CalendarPreferences | null> {
      const epoch = this.syncEpoch()
      if (!this.preferences) this.status = 'loading'
      const promise = fetchCalendarPreferences()
        .then((data) => {
          if (this.applyServer(epoch, data)) this.requiresReload = false
          return this.epoch === epoch ? this.preferences : null
        })
        .catch((err) => {
          if (epoch === this.epoch && useAuthStore().isEpochActive(epoch)) {
            this.error = getApiErrorMessage(err, LOAD_ERROR)
            this.errorCode = calendarPreferencesErrorCode(err)
            if (!this.preferences) this.status = 'error'
          }
          throw err
        })
        .finally(() => {
          if (loadInFlight?.promise === promise) loadInFlight = null
        })
      loadInFlight = { epoch, promise }
      return promise
    },
    update(patch: CalendarPreferencesChange): Promise<CalendarPreferences | null> {
      const epoch = this.syncEpoch()
      // Snapshot the intent now; callers must not mutate an enqueued layer object.
      const intent = { ...patch, ...('layers' in patch && patch.layers ? { layers: { ...patch.layers } } : {}) } as CalendarPreferencesChange
      const previous = updateQueues.get(this)
      const tail = previous?.epoch === epoch ? previous.tail : Promise.resolve()
      this.savingCount += 1
      const active = () => epoch === this.epoch && useAuthStore().isEpochActive(epoch)
      const request = tail.then(async () => {
        if (!active()) return null
        try {
          // Revision is captured at dispatch, after preceding writes and recovery GETs.
          if (this.requiresReload) await this.reload()
          else if (!this.preferences) await this.ensureLoaded()
          if (!active() || !this.preferences) return null
          const data = await updateCalendarPreferences({ ...intent, expected_revision: this.preferences.revision })
          if (!active()) return null
          this.error = ''
          this.errorCode = null
          this.applyServer(epoch, data)
          return this.preferences
        } catch (err) {
          if (active()) {
            this.requiresReload = true
            const code = calendarPreferencesErrorCode(err)
            const message = code === 'CALENDAR_PREFERENCES_STALE' ? CONFLICT_ERROR : getApiErrorMessage(err, SAVE_ERROR)
            // Await recovery before releasing the queue; never replay the rejected intent.
            await this.reload().catch(() => undefined)
            if (active()) {
              this.error = message
              this.errorCode = code
            }
          }
          throw err
        } finally {
          if (active()) this.savingCount = Math.max(0, this.savingCount - 1)
        }
      })
      updateQueues.set(this, { epoch, tail: request.then(() => undefined, () => undefined) })
      return request
    },
  },
})
