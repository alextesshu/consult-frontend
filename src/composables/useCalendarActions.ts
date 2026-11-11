import { computed, getCurrentScope, onScopeDispose, ref, shallowRef, watch, type Ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import { apiGet, fetchCabinetGuestBookingRequests, type GuestBookingRequestRecord } from '../lib/api'
import { buildCalendarActions, type CalendarAction, type UpcomingSessionRow } from '../lib/calendarActions'
import type { CalendarRescheduleRequestRow } from '../lib/calendarItems'
import { fetchSpecialistRescheduleRequests } from '../lib/specialistSessions'

export type CalendarActionSource = 'upcomingSessions' | 'rescheduleRequests' | 'guestRequests'

export const CALENDAR_ACTION_SOURCE_LABELS: Record<CalendarActionSource, string> = {
  upcomingSessions: 'заплановані сесії',
  rescheduleRequests: 'запити на перенесення',
  guestRequests: 'запити на сесію',
}

/**
 * Global actions for «Потребує дії» and the next-action card. Read-only; three existing GET
 * endpoints that each return their complete set. The total is only reported as complete
 * (`complete === true`) when all three loaded.
 */
export function useCalendarActions(timeZone: Ref<string>, now?: Ref<number>) {
  const auth = useAuthStore()
  const identity = computed(() => {
    const id = auth.user?.id
    if (!auth.authResolved || !auth.accessToken || !Number.isSafeInteger(id) || !id || id <= 0) return null
    return `${auth.authEpoch}:${id}`
  })
  const upcomingSessions = shallowRef<UpcomingSessionRow[] | null>(null)
  const rescheduleRequests = shallowRef<CalendarRescheduleRequestRow[] | null>(null)
  const guestRequests = shallowRef<GuestBookingRequestRecord[] | null>(null)
  const status = ref<'idle' | 'loading' | 'ready'>('idle')
  const failedSources = ref<CalendarActionSource[]>([])
  let sequence = 0
  let disposed = false
  function clear() {
    upcomingSessions.value = null
    rescheduleRequests.value = null
    guestRequests.value = null
    failedSources.value = []
    status.value = 'idle'
  }

  async function load() {
    const account = identity.value
    if (!account || disposed) return
    const request = ++sequence
    status.value = 'loading'
    const [sessions, reschedules, guests] = await Promise.allSettled([
      apiGet<UpcomingSessionRow[]>('/booking/sessions/', { params: { status: 'SCHEDULED,CONFIRMED' } }).then((rows) => (Array.isArray(rows) ? rows : [])),
      fetchSpecialistRescheduleRequests(),
      fetchCabinetGuestBookingRequests(),
    ])
    if (disposed || request !== sequence || identity.value !== account) return
    const failed: CalendarActionSource[] = []
    upcomingSessions.value = sessions.status === 'fulfilled' ? sessions.value : (failed.push('upcomingSessions'), null)
    rescheduleRequests.value = reschedules.status === 'fulfilled' ? reschedules.value : (failed.push('rescheduleRequests'), null)
    guestRequests.value = guests.status === 'fulfilled' ? guests.value : (failed.push('guestRequests'), null)
    failedSources.value = failed
    status.value = 'ready'
  }

  // Each kind only from a source that actually loaded; a failed source never yields guesses.
  const actions = computed<CalendarAction[]>(() =>
    buildCalendarActions(
      {
        upcomingSessions: upcomingSessions.value || [],
        rescheduleRequests: rescheduleRequests.value || [],
        guestRequests: guestRequests.value || [],
      },
      timeZone.value,
      now?.value ?? Date.now()
    )
  )
  const complete = computed(() => status.value === 'ready' && failedSources.value.length === 0)

  const stop = watch(identity, (_account, previous) => {
    const invalidation = ++sequence
    clear()
    // Auth actions update several fields. Invalidate now and load only their final identity.
    if (previous === undefined) void load()
    else queueMicrotask(() => {
      if (invalidation === sequence) void load()
    })
  }, { immediate: true, flush: 'sync' })
  if (getCurrentScope()) onScopeDispose(() => {
    disposed = true
    sequence += 1
    stop()
    clear()
  })
  return { actions, upcomingSessions, status, failedSources, complete, retry: load, authIdentity: identity }
}
