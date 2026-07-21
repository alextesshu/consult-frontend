import { computed, ref, watch } from 'vue'
import { useRoute, useRouter, type LocationQuery, type LocationQueryRaw } from 'vue-router'
import {
  fetchPublicSpecialistDiscovery,
  getPublicSpecialistDiscoveryError,
  type PublicSpecialistDiscoveryError,
  type PublicSpecialistDiscoveryResponse,
  type SpecialistDiscoveryDirection,
  type SpecialistDiscoveryFormat,
  type SpecialistDiscoveryMode,
  type SpecialistDiscoveryRequestGroup,
} from '../lib/api'

export const REQUEST_GROUP_OPTIONS: ReadonlyArray<{
  code: SpecialistDiscoveryRequestGroup
  label: string
}> = [
  { code: 'emotional_state', label: 'Емоційний стан' },
  { code: 'relationships_family', label: 'Стосунки та сім’я' },
  { code: 'self_esteem_change', label: 'Самооцінка та особисті зміни' },
  { code: 'work_career_burnout', label: 'Робота, кар’єра та вигорання' },
  { code: 'loss_life_changes', label: 'Втрата та життєві зміни' },
  { code: 'professional_development', label: 'Професійний розвиток і навчання' },
  { code: 'other_request', label: 'Інший запит' },
]

export const DIRECTION_OPTIONS: ReadonlyArray<{
  code: SpecialistDiscoveryDirection
  label: string
}> = [
  { code: 'psychological_support', label: 'Психологічна допомога' },
  { code: 'development_guidance', label: 'Наставництво та розвиток' },
  { code: 'education_supervision', label: 'Навчання та професійний супровід' },
]

const requestGroupCodes = new Set(REQUEST_GROUP_OPTIONS.map((option) => option.code))
const directionCodes = new Set(DIRECTION_OPTIONS.map((option) => option.code))

type DiscoveryRouteState = {
  mode: SpecialistDiscoveryMode
  query: string
  requestGroup: SpecialistDiscoveryRequestGroup | null
  direction: SpecialistDiscoveryDirection | null
  format: SpecialistDiscoveryFormat | null
  page: number
  queryErrorCode: Extract<PublicSpecialistDiscoveryError['code'], 'QUERY_TOO_SHORT' | 'QUERY_TOO_LONG'> | null
}

function firstQueryValue(value: LocationQuery[string] | undefined): string {
  if (Array.isArray(value)) return String(value[0] || '').trim()
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeQuery(value: string): string {
  return value.normalize('NFKC').trim()
}

function parsePositivePage(value: string): number {
  return /^[1-9][0-9]*$/.test(value) ? Number(value) : 1
}

function parseRouteState(query: LocationQuery): DiscoveryRouteState {
  const rawDirection = firstQueryValue(query.direction)
  const rawMode = firstQueryValue(query.mode)
  const mode: SpecialistDiscoveryMode = rawMode === 'direction' || rawDirection ? 'direction' : 'request'
  const rawQuery = normalizeQuery(firstQueryValue(query.q))
  const queryErrorCode = rawQuery.length > 240
    ? 'QUERY_TOO_LONG'
    : rawQuery.length > 0 && rawQuery.length < 3
      ? 'QUERY_TOO_SHORT'
      : null
  const requestGroup = requestGroupCodes.has(firstQueryValue(query.request_group) as SpecialistDiscoveryRequestGroup)
    ? (firstQueryValue(query.request_group) as SpecialistDiscoveryRequestGroup)
    : null
  const direction = directionCodes.has(rawDirection as SpecialistDiscoveryDirection)
    ? (rawDirection as SpecialistDiscoveryDirection)
    : null
  const rawFormat = firstQueryValue(query.format)

  return {
    mode,
    query: mode === 'request' && !queryErrorCode ? rawQuery : '',
    requestGroup: mode === 'request' ? requestGroup : null,
    direction: mode === 'direction' ? direction : null,
    format: rawFormat === 'online' || rawFormat === 'offline' ? rawFormat : null,
    page: parsePositivePage(firstQueryValue(query.page)),
    queryErrorCode,
  }
}

function toQuery(state: DiscoveryRouteState): LocationQueryRaw {
  const query: LocationQueryRaw = {}
  if (state.mode === 'direction') {
    query.mode = 'direction'
    if (state.direction) query.direction = state.direction
  } else {
    if (state.query) query.q = state.query
    if (state.requestGroup) query.request_group = state.requestGroup
  }
  if (state.format) query.format = state.format
  if (state.page > 1) query.page = String(state.page)
  return query
}

function queryMatches(left: LocationQuery, right: LocationQueryRaw): boolean {
  const leftEntries = Object.entries(left)
    .map(([key, value]) => [key, firstQueryValue(value)] as const)
    .filter(([, value]) => value)
    .sort(([a], [b]) => a.localeCompare(b))
  const rightEntries = Object.entries(right)
    .map(([key, value]) => [key, String(value)] as const)
    .sort(([a], [b]) => a.localeCompare(b))
  return JSON.stringify(leftEntries) === JSON.stringify(rightEntries)
}

export function useSpecialistDiscovery() {
  const route = useRoute()
  const router = useRouter()
  const mode = ref<SpecialistDiscoveryMode>('request')
  const queryDraft = ref('')
  const appliedQuery = ref('')
  const requestGroup = ref<SpecialistDiscoveryRequestGroup | null>(null)
  const direction = ref<SpecialistDiscoveryDirection | null>(null)
  const format = ref<SpecialistDiscoveryFormat | null>(null)
  const page = ref(1)
  const response = ref<PublicSpecialistDiscoveryResponse | null>(null)
  const loading = ref(false)
  const fieldError = ref<PublicSpecialistDiscoveryError | null>(null)
  const requestError = ref('')
  const focusResultsAfterPagination = ref(false)
  let requestSequence = 0
  let pendingFocusPage: number | null = null

  const isPendingDirection = computed(
    () => mode.value === 'direction' && direction.value === null
  )
  const hasActiveSearch = computed(
    () => Boolean(appliedQuery.value || requestGroup.value || direction.value || format.value)
  )
  const requestParams = computed(() => ({
    ...(mode.value === 'request' && appliedQuery.value ? { q: appliedQuery.value } : {}),
    ...(mode.value === 'request' && requestGroup.value ? { request_group: requestGroup.value } : {}),
    ...(mode.value === 'direction' && direction.value ? { direction: direction.value } : {}),
    ...(format.value ? { format: format.value } : {}),
    ...(page.value > 1 ? { page: page.value } : {}),
  }))

  function currentState(): DiscoveryRouteState {
    return {
      mode: mode.value,
      query: appliedQuery.value,
      requestGroup: requestGroup.value,
      direction: direction.value,
      format: format.value,
      page: page.value,
      queryErrorCode: null,
    }
  }

  async function load() {
    if (isPendingDirection.value) {
      requestSequence += 1
      pendingFocusPage = null
      focusResultsAfterPagination.value = false
      response.value = null
      loading.value = false
      fieldError.value = null
      requestError.value = ''
      return
    }
    const sequence = ++requestSequence
    loading.value = true
    requestError.value = ''
    fieldError.value = null
    try {
      const nextResponse = await fetchPublicSpecialistDiscovery(requestParams.value)
      if (sequence !== requestSequence) return
      if (nextResponse.total_pages === 0 && page.value !== 1) {
        await replaceState({ ...currentState(), page: 1 })
        return
      }
      if (nextResponse.total_pages > 0 && nextResponse.page > nextResponse.total_pages) {
        await replaceState({ ...currentState(), page: nextResponse.total_pages })
        return
      }
      response.value = nextResponse
      if (pendingFocusPage === page.value && nextResponse.page === page.value) {
        pendingFocusPage = null
        focusResultsAfterPagination.value = true
      }
    } catch (error) {
      if (sequence !== requestSequence) return
      pendingFocusPage = null
      const structuredError = getPublicSpecialistDiscoveryError(error)
      if (structuredError) {
        fieldError.value = structuredError
      } else {
        requestError.value = 'Не вдалося завантажити спеціалістів. Спробуйте ще раз трохи пізніше.'
      }
    } finally {
      if (sequence === requestSequence) loading.value = false
    }
  }

  async function syncFromRoute() {
    const state = parseRouteState(route.query)
    mode.value = state.mode
    queryDraft.value = state.query
    appliedQuery.value = state.query
    requestGroup.value = state.requestGroup
    direction.value = state.direction
    format.value = state.format
    page.value = state.page
    fieldError.value = state.queryErrorCode
      ? {
          code: state.queryErrorCode,
          detail: state.queryErrorCode === 'QUERY_TOO_SHORT'
            ? 'Запит має містити щонайменше 3 символи.'
            : 'Запит має містити не більше 240 символів.',
          field: 'q',
        }
      : null
    const canonical = toQuery(state)
    if (!queryMatches(route.query, canonical)) {
      await router.replace({ query: canonical })
      return
    }
    await load()
  }

  async function pushState(state: DiscoveryRouteState, options: { focusAfterPagination?: boolean } = {}) {
    if (!options.focusAfterPagination) {
      pendingFocusPage = null
      focusResultsAfterPagination.value = false
    }
    await router.push({ query: toQuery(state) })
  }

  async function replaceState(state: DiscoveryRouteState) {
    pendingFocusPage = null
    focusResultsAfterPagination.value = false
    await router.replace({ query: toQuery(state) })
  }

  async function submitQuery() {
    const normalized = normalizeQuery(queryDraft.value)
    if (normalized && normalized.length < 3) {
      fieldError.value = { code: 'QUERY_TOO_SHORT', detail: 'Запит має містити щонайменше 3 символи.', field: 'q' }
      return
    }
    if (normalized.length > 240) {
      fieldError.value = { code: 'QUERY_TOO_LONG', detail: 'Запит має містити не більше 240 символів.', field: 'q' }
      return
    }
    fieldError.value = null
    queryDraft.value = normalized
    await pushState({ ...currentState(), mode: 'request', query: normalized, direction: null, page: 1 })
  }

  async function setMode(nextMode: SpecialistDiscoveryMode) {
    if (nextMode === 'direction') {
      queryDraft.value = ''
      await pushState({ ...currentState(), mode: 'direction', query: '', requestGroup: null, direction: null, page: 1 })
      return
    }
    await pushState({ ...currentState(), mode: 'request', direction: null, page: 1 })
  }

  async function setRequestGroup(nextGroup: SpecialistDiscoveryRequestGroup | null) {
    const draft = queryDraft.value
    await pushState({ ...currentState(), mode: 'request', requestGroup: nextGroup, direction: null, page: 1 })
    queryDraft.value = draft
  }

  async function setDirection(nextDirection: SpecialistDiscoveryDirection) {
    queryDraft.value = ''
    await pushState({ ...currentState(), mode: 'direction', query: '', requestGroup: null, direction: nextDirection, page: 1 })
  }

  async function setFormat(nextFormat: SpecialistDiscoveryFormat | null) {
    await pushState({ ...currentState(), format: nextFormat, page: 1 })
  }

  async function setPage(nextPage: number) {
    if (!Number.isInteger(nextPage) || nextPage < 1 || nextPage === page.value) return
    pendingFocusPage = nextPage
    await pushState({ ...currentState(), page: nextPage }, { focusAfterPagination: true })
  }

  async function reset() {
    queryDraft.value = ''
    await pushState({
      mode: 'request',
      query: '',
      requestGroup: null,
      direction: null,
      format: null,
      page: 1,
      queryErrorCode: null,
    })
  }

  async function retry() {
    await load()
  }

  function consumeFocusResultsAfterPagination() {
    focusResultsAfterPagination.value = false
  }

  watch(
    () => route.fullPath,
    () => {
      void syncFromRoute()
    },
    { immediate: true }
  )

  return {
    mode,
    queryDraft,
    appliedQuery,
    requestGroup,
    direction,
    format,
    page,
    response,
    loading,
    fieldError,
    requestError,
    focusResultsAfterPagination,
    isPendingDirection,
    hasActiveSearch,
    requestParams,
    submitQuery,
    setMode,
    setRequestGroup,
    setDirection,
    setFormat,
    setPage,
    reset,
    retry,
    consumeFocusResultsAfterPagination,
  }
}
