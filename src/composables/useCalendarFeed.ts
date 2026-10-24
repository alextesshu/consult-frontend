import { ref, shallowRef, watch, type Ref } from 'vue'
import { apiGet, fetchAvailabilityExceptions, fetchExternalSessions, getCabinetSchedule } from '../lib/api'
import { buildCalendarItems, type CalendarItem, type CalendarSessionRow, type CalendarSources } from '../lib/calendarItems'
import { fetchSpecialistRescheduleRequests } from '../lib/specialistSessions'
import { utcQueryDates } from '../lib/calendarTime'

export type CalendarFeedSource = keyof CalendarSources
export type CalendarFeedStatus = 'idle' | 'loading' | 'ready' | 'error'

export const CALENDAR_SOURCE_LABELS: Record<CalendarFeedSource, string> = {
  schedule: 'розклад і вільні вікна',
  sessions: 'список сесій',
  rescheduleRequests: 'запити на перенесення',
  absences: 'відсутності',
  externalSessions: 'зовнішні гостьові сесії',
}

// Without both of these the calendar has nothing trustworthy to show.
const CORE_SOURCES: CalendarFeedSource[] = ['schedule', 'sessions']

type Range = { start: number; end: number }

// Loads of the same range within a few seconds share one set of requests, e.g. when the cabinet
// shell remounts the route view right after /me/ resolves. Retry always goes to the network.
const SHARE_WINDOW_MS = 5000
const recent = new Map<string, { promise: Promise<PromiseSettledResult<unknown>[]>; startedAt: number }>()

function loadSources(range: Range, force: boolean): Promise<PromiseSettledResult<unknown>[]> {
  const key = `${range.start}:${range.end}`
  const entry = recent.get(key)
  if (!force && entry && Date.now() - entry.startedAt < SHARE_WINDOW_MS) return entry.promise
  const promise = requestSources(range)
  recent.set(key, { promise, startedAt: Date.now() })
  return promise
}

/** Forget shared results (tests, or after an explicit sign-out). */
export function clearCalendarFeedShare() {
  recent.clear()
}

function requestSources(range: Range): Promise<PromiseSettledResult<unknown>[]> {
  const { dateFrom, dateTo } = utcQueryDates(range.start, range.end)
  return Promise.allSettled([
    getCabinetSchedule(dateFrom, dateTo).then((resp) => resp.events || []),
    apiGet<CalendarSessionRow[]>('/booking/sessions/', { params: { date_from: dateFrom, date_to: dateTo } }).then(
      (rows) => (Array.isArray(rows) ? rows : [])
    ),
    fetchSpecialistRescheduleRequests(),
    fetchAvailabilityExceptions(),
    fetchExternalSessions(),
  ])
}

const SOURCE_ORDER: CalendarFeedSource[] = ['schedule', 'sessions', 'rescheduleRequests', 'absences', 'externalSessions']

/**
 * Read-only calendar feed (UC-01): five existing APIs normalized into CalendarItem[].
 * Responses for a range that is no longer current are discarded; a range that was
 * loaded before is shown from memory while it refreshes. No writes of any kind.
 */
export function useCalendarFeed(range: Ref<Range>, options: { now?: () => number } = {}) {
  const now = options.now ?? (() => Date.now())
  const items = shallowRef<CalendarItem[]>([])
  const status = ref<CalendarFeedStatus>('idle')
  const failedSources = ref<CalendarFeedSource[]>([])
  const cache = new Map<string, { items: CalendarItem[]; failed: CalendarFeedSource[] }>()
  let sequence = 0

  async function load({ force = false } = {}) {
    const current = range.value
    const key = `${current.start}:${current.end}`
    const request = ++sequence
    const cached = cache.get(key)
    if (cached && !force) {
      items.value = cached.items
      failedSources.value = cached.failed
      status.value = 'ready'
    } else if (!cached) {
      items.value = []
      status.value = 'loading'
    }

    const results = await loadSources(current, force)
    if (request !== sequence) return

    const sources: Partial<CalendarSources> = {}
    const failed: CalendarFeedSource[] = []
    results.forEach((result, index) => {
      const source = SOURCE_ORDER[index] as CalendarFeedSource
      if (result.status === 'fulfilled') (sources as Record<string, unknown>)[source] = result.value
      else failed.push(source)
    })
    if (CORE_SOURCES.every((source) => failed.includes(source))) {
      failedSources.value = failed
      status.value = cached ? 'ready' : 'error'
      return
    }
    const built = buildCalendarItems(sources, current, now())
    cache.set(key, { items: built, failed })
    items.value = built
    failedSources.value = failed
    status.value = 'ready'
  }

  watch(range, () => void load(), { immediate: true })

  return { items, status, failedSources, retry: () => load({ force: true }) }
}
