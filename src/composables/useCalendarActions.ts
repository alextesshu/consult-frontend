import { computed, ref, shallowRef, type Ref } from 'vue'
import { apiGet, fetchCabinetGuestBookingRequests, type GuestBookingRequestRecord } from '../lib/api'
import { buildCalendarActions, type CalendarAction, type UpcomingSessionRow } from '../lib/calendarActions'
import type { CalendarRescheduleRequestRow } from '../lib/calendarItems'
import { fetchSpecialistRescheduleRequests } from '../lib/specialistSessions'

export type CalendarActionSource = 'upcomingSessions' | 'rescheduleRequests' | 'guestRequests'

export const CALENDAR_ACTION_SOURCE_LABELS: Record<CalendarActionSource, string> = {
  upcomingSessions: 'майбутні сесії',
  rescheduleRequests: 'запити на перенесення',
  guestRequests: 'запити на сесію',
}

/**
 * Global actions for «Потребує дії» and the next-action card. Read-only; three existing GET
 * endpoints that each return their complete set. The total is only reported as complete
 * (`complete === true`) when all three loaded.
 */
export function useCalendarActions(timeZone: Ref<string>) {
  const upcomingSessions = shallowRef<UpcomingSessionRow[] | null>(null)
  const rescheduleRequests = shallowRef<CalendarRescheduleRequestRow[] | null>(null)
  const guestRequests = shallowRef<GuestBookingRequestRecord[] | null>(null)
  const status = ref<'loading' | 'ready'>('loading')
  const failedSources = ref<CalendarActionSource[]>([])
  let sequence = 0

  async function load() {
    const request = ++sequence
    status.value = 'loading'
    const [sessions, reschedules, guests] = await Promise.allSettled([
      apiGet<UpcomingSessionRow[]>('/booking/sessions/', { params: { upcoming: true } }).then((rows) => (Array.isArray(rows) ? rows : [])),
      fetchSpecialistRescheduleRequests(),
      fetchCabinetGuestBookingRequests(),
    ])
    if (request !== sequence) return
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
      timeZone.value
    )
  )
  const complete = computed(() => status.value === 'ready' && failedSources.value.length === 0)

  void load()
  return { actions, upcomingSessions, status, failedSources, complete, retry: load }
}
