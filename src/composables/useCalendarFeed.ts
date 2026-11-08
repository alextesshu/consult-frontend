import { computed, getCurrentScope, onScopeDispose, ref, shallowRef, watch, type Ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import { apiGet, fetchAvailabilityExceptions, fetchExternalSessions, getCabinetSchedule } from '../lib/api'
import { buildCalendarItems, type CalendarSessionRow, type CalendarSources } from '../lib/calendarItems'
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

// Request sharing belongs to one Pinia auth store and one authenticated session.
// Replacing a scope also makes pending promises from that scope ineligible for publication.
const SHARE_WINDOW_MS = 5000
type SharedScope = {
  identity: string | null
  recent: Map<string, { promise: Promise<PromiseSettledResult<unknown>[]>; startedAt: number }>
}
let sharedScopes = new WeakMap<ReturnType<typeof useAuthStore>, SharedScope>()

function getSharedScope(auth: ReturnType<typeof useAuthStore>, identity: string | null) {
  let scope = sharedScopes.get(auth)
  if (!scope || scope.identity !== identity) {
    scope?.recent.clear()
    scope = { identity, recent: new Map() }
    sharedScopes.set(auth, scope)
  }
  return scope
}

function loadSources(scope: SharedScope, range: Range, force: boolean): Promise<PromiseSettledResult<unknown>[]> {
  const key = `${range.start}:${range.end}`
  const entry = scope.recent.get(key)
  if (!force && entry && Date.now() - entry.startedAt < SHARE_WINDOW_MS) return entry.promise
  const promise = requestSources(range)
  scope.recent.set(key, { promise, startedAt: Date.now() })
  return promise
}

/** Invalidate request sharing, including pending results, without retaining auth stores. */
export function clearCalendarFeedShare() {
  sharedScopes = new WeakMap()
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
export function useCalendarFeed(range: Ref<Range>, options: { now?: () => number; nowValue?: Ref<number> } = {}) {
  const auth = useAuthStore()
  const identity = computed(() => {
    const id = auth.user?.id
    if (!auth.authResolved || !auth.accessToken || !Number.isSafeInteger(id) || !id || id <= 0) return null
    return `${auth.authEpoch}:${id}`
  })
  const now = options.now ?? (() => Date.now())
  const snapshot = shallowRef<{ sources: Partial<CalendarSources>; range: Range } | null>(null)
  const items = computed(() => snapshot.value ? buildCalendarItems(snapshot.value.sources, snapshot.value.range, options.nowValue?.value ?? now()) : [])
  const status = ref<CalendarFeedStatus>('idle')
  const failedSources = ref<CalendarFeedSource[]>([])
  const cache = new Map<string, { sources: Partial<CalendarSources>; failed: CalendarFeedSource[] }>()
  let sequence = 0

  async function load({ force = false } = {}) {
    const account = identity.value
    const scope = getSharedScope(auth, account)
    if (!account) return
    const current = range.value
    const key = `${current.start}:${current.end}`
    const request = ++sequence
    const cached = cache.get(key)
    if (cached && !force) {
      snapshot.value = { sources: cached.sources, range: current }
      failedSources.value = cached.failed
      status.value = 'ready'
    } else if (!cached) {
      snapshot.value = null
      status.value = 'loading'
    }

    const results = await loadSources(scope, current, force)
    if (request !== sequence || identity.value !== account || sharedScopes.get(auth) !== scope) return

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
    cache.set(key, { sources, failed })
    snapshot.value = { sources, range: current }
    failedSources.value = failed
    status.value = 'ready'
  }

  const stop = watch([identity, range], ([account], previous) => {
    const invalidation = ++sequence
    if (!previous || account !== previous[0]) {
      cache.clear()
      snapshot.value = null
      failedSources.value = []
      status.value = 'idle'
      getSharedScope(auth, account)
    }
    // Clear synchronously, then start only the latest request after a multi-field auth action.
    // beginAuthEpoch() changes the epoch before clearing authResolved. A generation check
    // also handles A -> B -> A or a range round-trip within the same synchronous action.
    if (!previous?.length) void load()
    else queueMicrotask(() => {
      if (invalidation === sequence) void load()
    })
  }, { immediate: true, flush: 'sync' })
  if (getCurrentScope()) onScopeDispose(() => {
    sequence += 1
    stop()
  })

  return { items, status, failedSources, retry: () => load({ force: true }) }
}
