import { defineStore } from 'pinia'
import { getApiErrorMessage } from '../lib/api'
import {
  calendarPreferencesErrorCode,
  fetchCalendarPreferences,
  updateCalendarPreferences,
  type CalendarPreferences,
  type CalendarPreferencesPatch,
} from '../lib/calendarPreferences'
import { useAuthStore } from './auth'

type LoadStatus = 'idle' | 'loading' | 'ready' | 'error'

// One GET in flight per auth epoch, shared by every calendar component.
let loadInFlight: { epoch: number; promise: Promise<CalendarPreferences | null> } | null = null

const LOAD_ERROR = 'Не вдалося завантажити налаштування календаря.'
const SAVE_ERROR = 'Не вдалося зберегти налаштування календаря.'

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
          this.applyServer(epoch, data)
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
    async update(patch: CalendarPreferencesPatch): Promise<CalendarPreferences | null> {
      const epoch = this.syncEpoch()
      this.savingCount += 1
      try {
        const data = await updateCalendarPreferences(patch)
        this.error = ''
        this.errorCode = null
        this.applyServer(epoch, data)
        return this.epoch === epoch ? this.preferences : null
      } catch (err) {
        if (epoch === this.epoch && useAuthStore().isEpochActive(epoch)) {
          this.error = getApiErrorMessage(err, SAVE_ERROR)
          this.errorCode = calendarPreferencesErrorCode(err)
          // The outcome of a failed request is unknown on the client: re-read the server.
          void this.reload().catch(() => undefined)
        }
        throw err
      } finally {
        this.savingCount = Math.max(0, this.savingCount - 1)
      }
    },
  },
})
