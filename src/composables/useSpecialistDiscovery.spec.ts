import { defineComponent, nextTick, unref } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getPublicSpecialistDiscoveryError } from '../lib/api'
import { fetchRotatedPublicSpecialistDiscovery } from '../lib/specialistDiscoveryApi'
import { createSpecialistDiscoveryShuffleSeed } from '../lib/specialistDiscoveryRotation'
import { useSpecialistDiscovery } from './useSpecialistDiscovery'

vi.mock('../lib/api', () => ({
  getPublicSpecialistDiscoveryError: vi.fn(),
}))
vi.mock('../lib/specialistDiscoveryApi', () => ({
  fetchRotatedPublicSpecialistDiscovery: vi.fn(),
}))
vi.mock('../lib/specialistDiscoveryRotation', () => ({
  createSpecialistDiscoveryShuffleSeed: vi.fn(),
}))

const mockedFetch = vi.mocked(fetchRotatedPublicSpecialistDiscovery)
const mockedError = vi.mocked(getPublicSpecialistDiscoveryError)
const mockedSeed = vi.mocked(createSpecialistDiscoveryShuffleSeed)
const DEFAULT_SEED = 'seed-a'

function withSeed(params: Record<string, unknown> = {}) {
  return { shuffle_seed: DEFAULT_SEED, ...params }
}

function directoryResponse(overrides: Record<string, unknown> = {}) {
  return {
    query: null,
    resolved_request_groups: [],
    applied_filters: { request_group: null, direction: null, format: null },
    groups: [{ code: 'all_specialists', label: 'Усі спеціалісти Pro Consult', total: 0, items: [] }],
    page: 1,
    page_size: 12,
    total: 0,
    total_pages: 0,
    ...overrides,
  } as any
}

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, resolve, reject }
}

async function settle() {
  await nextTick()
  await Promise.resolve()
  await nextTick()
}

async function mountComposable(path = '/specialists') {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/specialists', component: { template: '<div />' } },
      {
        path: '/specialists/psychological-support',
        component: { template: '<div />' },
        meta: { discoveryLanding: 'psychological_support' },
      },
    ],
  })
  await router.push(path)
  await router.isReady()
  let state: ReturnType<typeof useSpecialistDiscovery> | null = null
  mount(defineComponent({ setup() { state = useSpecialistDiscovery(); return () => null } }), {
    global: { plugins: [router] },
  })
  await settle()
  return { router, state: state! }
}

describe('useSpecialistDiscovery', () => {
  beforeEach(() => {
    mockedFetch.mockReset()
    mockedFetch.mockResolvedValue(directoryResponse())
    mockedError.mockReset()
    mockedError.mockReturnValue(null)
    mockedSeed.mockReset()
    mockedSeed.mockReturnValue(DEFAULT_SEED)
  })

  it('loads the default and format-only open directory with an ephemeral seed', async () => {
    const first = await mountComposable()
    expect(mockedFetch).toHaveBeenCalledWith(withSeed())
    expect(first.router.currentRoute.value.query).toEqual({})

    mockedFetch.mockClear()
    const second = await mountComposable('/specialists?format=online')
    expect(mockedFetch).toHaveBeenCalledWith(withSeed({ format: 'online' }))
    expect(second.router.currentRoute.value.fullPath).toBe('/specialists?format=online')
  })

  it('restores the approved landing preset and keeps format variants on its pathname', async () => {
    const { router, state } = await mountComposable('/specialists/psychological-support?format=online')

    expect(state.direction.value).toBe('psychological_support')
    expect(state.mode.value).toBe('direction')
    expect(mockedFetch).toHaveBeenLastCalledWith(withSeed({ direction: 'psychological_support', format: 'online' }))
    expect(router.currentRoute.value.fullPath).toBe('/specialists/psychological-support?format=online')
  })

  it('leaves the landing pathname when its primary direction or request changes', async () => {
    const { router, state } = await mountComposable('/specialists/psychological-support')

    await state.setDirection('development_guidance')
    await vi.waitFor(() => expect(router.currentRoute.value.fullPath).toBe('/specialists?mode=direction&direction=development_guidance'))

    await router.push('/specialists/psychological-support')
    await state.setMode('request')
    await vi.waitFor(() => expect(router.currentRoute.value.fullPath).toBe('/specialists'))
  })

  it('builds q plus request_group while keeping draft text out of group and page changes', async () => {
    const { state } = await mountComposable('/specialists?q=тривога&request_group=emotional_state')
    state.queryDraft.value = 'вигорання'
    await state.setRequestGroup('relationships_family')
    await vi.waitFor(() => expect(mockedFetch).toHaveBeenLastCalledWith(withSeed({ q: 'тривога', request_group: 'relationships_family' })))

    await state.setPage(2)
    await vi.waitFor(() => expect(mockedFetch).toHaveBeenLastCalledWith(withSeed({ q: 'тривога', request_group: 'relationships_family', page: 2 })))
  })

  it('validates short and long local queries without requests', async () => {
    const { state } = await mountComposable()
    mockedFetch.mockClear()
    state.queryDraft.value = 'тр'
    await state.submitQuery()
    expect(state.fieldError.value?.code).toBe('QUERY_TOO_SHORT')
    expect(mockedFetch).not.toHaveBeenCalled()

    state.queryDraft.value = 'а'.repeat(241)
    await state.submitQuery()
    expect(state.fieldError.value?.code).toBe('QUERY_TOO_LONG')
    expect(mockedFetch).not.toHaveBeenCalled()
  })

  it('submits an applied query and enters pending direction mode without a request', async () => {
    const { state } = await mountComposable()
    state.queryDraft.value = 'тривога'
    await state.submitQuery()
    await vi.waitFor(() => expect(mockedFetch).toHaveBeenLastCalledWith(withSeed({ q: 'тривога' })))

    await state.setMode('direction')
    await settle()
    expect(mockedFetch).toHaveBeenLastCalledWith(withSeed({ q: 'тривога' }))
    expect(state.appliedQuery.value).toBe('')
    expect(state.requestGroup.value).toBeNull()
    expect(unref(state.mode)).toBe('direction')
    expect(state.isPendingDirection.value).toBe(true)
  })

  it('resets to the empty canonical query', async () => {
    const { router, state } = await mountComposable('/specialists?q=тривога&format=online&page=2')
    await state.reset()
    await vi.waitFor(() => expect(router.currentRoute.value.fullPath).toBe('/specialists'))
    expect(mockedFetch).toHaveBeenLastCalledWith(withSeed())
  })

  it.each([
    ['/specialists?request_group=bad', {}],
    ['/specialists?direction=bad', { mode: 'direction' }, 0],
    ['/specialists?format=bad', {}],
    ['/specialists?page=invalid', {}],
    ['/specialists?page=0', {}],
    ['/specialists?page=-2', {}],
  ])('canonicalizes invalid route values for %s before the expected fetch count', async (path, expectedQuery, expectedFetchCount = 1) => {
    mockedFetch.mockClear()
    const { router } = await mountComposable(path)
    await vi.waitFor(() => expect(router.currentRoute.value.query).toEqual(expectedQuery))
    expect(mockedFetch).toHaveBeenCalledTimes(expectedFetchCount)
    if (expectedFetchCount) expect(mockedFetch).toHaveBeenLastCalledWith(withSeed())
  })

  it('preserves format while pending, fetches once after direction selection, and returns to open directory', async () => {
    const { router, state } = await mountComposable()
    mockedFetch.mockClear()

    await state.setMode('direction')
    await state.setFormat('online')
    expect(router.currentRoute.value.query).toEqual({ mode: 'direction', format: 'online' })
    expect(state.isPendingDirection.value).toBe(true)
    expect(mockedFetch).not.toHaveBeenCalled()

    await state.setDirection('psychological_support')
    await vi.waitFor(() => expect(mockedFetch).toHaveBeenCalledTimes(1))
    expect(mockedFetch).toHaveBeenLastCalledWith(withSeed({ direction: 'psychological_support', format: 'online' }))

    await state.setMode('request')
    await vi.waitFor(() => expect(mockedFetch).toHaveBeenLastCalledWith(withSeed({ format: 'online' })))
  })

  it('clears stale responses in pending direction and reset restores the open directory', async () => {
    const stale = deferred<any>()
    mockedFetch.mockReset()
    mockedFetch.mockReturnValueOnce(stale.promise).mockResolvedValueOnce(directoryResponse())
    const { router, state } = await mountComposable()

    await state.setMode('direction')
    expect(state.response.value).toBeNull()
    expect(mockedFetch).toHaveBeenCalledTimes(1)
    stale.resolve(directoryResponse({ total: 8 }))
    await settle()
    expect(state.response.value).toBeNull()

    await state.reset()
    await vi.waitFor(() => expect(router.currentRoute.value.fullPath).toBe('/specialists'))
    expect(mockedFetch).toHaveBeenLastCalledWith(withSeed())
  })

  it('uses the same request-group transition for selection and clearing without applying the draft', async () => {
    const { state } = await mountComposable('/specialists?q=тривога&request_group=emotional_state')
    state.queryDraft.value = 'вигорання'

    await state.setRequestGroup('relationships_family')
    await vi.waitFor(() => expect(mockedFetch).toHaveBeenLastCalledWith(withSeed({ q: 'тривога', request_group: 'relationships_family' })))
    expect(state.appliedQuery.value).toBe('тривога')

    await state.setRequestGroup(null)
    await vi.waitFor(() => expect(mockedFetch).toHaveBeenLastCalledWith(withSeed({ q: 'тривога' })))
    expect(state.queryDraft.value).toBe('вигорання')
  })

  it('restores state and fetches once for browser-style route changes', async () => {
    const { router, state } = await mountComposable()
    mockedFetch.mockClear()
    await router.push('/specialists?q=тривога&format=online')
    await vi.waitFor(() => expect(mockedFetch).toHaveBeenCalledWith(withSeed({ q: 'тривога', format: 'online' })))
    expect(state.appliedQuery.value).toBe('тривога')

    mockedFetch.mockClear()
    await router.push('/specialists?direction=psychological_support')
    await vi.waitFor(() => expect(mockedFetch).toHaveBeenLastCalledWith(withSeed({ direction: 'psychological_support' })))
    expect(unref(state.mode)).toBe('direction')
  })

  it('does not allow stale response A to overwrite response, loading, or error from B', async () => {
    const first = deferred<any>()
    const second = deferred<any>()
    mockedFetch.mockReset()
    mockedFetch.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise)
    const { state } = await mountComposable()
    await state.setFormat('online')
    await vi.waitFor(() => expect(mockedFetch).toHaveBeenCalledTimes(2))

    second.resolve(directoryResponse({ total: 2, applied_filters: { request_group: null, direction: null, format: 'online' } }))
    await settle()
    first.resolve(directoryResponse({ total: 1 }))
    await settle()

    expect(state.response.value?.total).toBe(2)
    expect(state.loading.value).toBe(false)
    expect(state.requestError.value).toBe('')
  })

  it('handles structured q errors, malformed errors, and retry against applied state', async () => {
    mockedFetch.mockRejectedValueOnce(new Error('structured'))
    mockedError.mockReturnValueOnce({ code: 'QUERY_TOO_SHORT', detail: 'Короткий запит.', field: 'q' })
    const { state } = await mountComposable()
    await vi.waitFor(() => expect(state.fieldError.value?.code).toBe('QUERY_TOO_SHORT'))

    mockedFetch.mockRejectedValueOnce(new Error('malformed'))
    mockedError.mockReturnValueOnce(null)
    await state.retry()
    expect(state.requestError.value).toContain('Не вдалося')

    mockedFetch.mockResolvedValueOnce(directoryResponse({ total: 3 }))
    await state.retry()
    expect(mockedFetch).toHaveBeenLastCalledWith(withSeed())
    expect(state.response.value?.total).toBe(3)
  })

  it('corrects out-of-range pages and removes page when total_pages is zero', async () => {
    mockedFetch.mockReset()
    mockedFetch
      .mockResolvedValueOnce(directoryResponse({ page: 3, total: 13, total_pages: 2 }))
      .mockResolvedValueOnce(directoryResponse({ page: 2, total: 13, total_pages: 2 }))
    const { router } = await mountComposable('/specialists?q=тривога&page=3')
    await vi.waitFor(() => expect(router.currentRoute.value.query).toEqual({ q: 'тривога', page: '2' }))
    expect(mockedFetch).toHaveBeenLastCalledWith(withSeed({ q: 'тривога', page: 2 }))

    mockedFetch.mockReset()
    mockedFetch
      .mockResolvedValueOnce(directoryResponse({ page: 4, total: 0, total_pages: 0 }))
      .mockResolvedValueOnce(directoryResponse())
    await router.push('/specialists?page=4')
    await vi.waitFor(() => expect(router.currentRoute.value.fullPath).toBe('/specialists'))
    expect(mockedFetch).toHaveBeenLastCalledWith(withSeed())
  })

  it('raises focus only for an explicit pagination action', async () => {
    mockedFetch.mockReset()
    mockedFetch
      .mockResolvedValueOnce(directoryResponse({ total: 24, total_pages: 2 }))
      .mockResolvedValueOnce(directoryResponse({ page: 2, total: 24, total_pages: 2 }))
    const { state } = await mountComposable()
    await state.setPage(2)
    await vi.waitFor(() => expect(state.focusResultsAfterPagination.value).toBe(true))
    expect(mockedFetch).toHaveBeenLastCalledWith(withSeed({ page: 2 }))
    state.consumeFocusResultsAfterPagination()
    expect(state.focusResultsAfterPagination.value).toBe(false)

    await state.setFormat('online')
    await settle()
    expect(state.focusResultsAfterPagination.value).toBe(false)
  })

  it('reuses the same seed for retry and route-driven filter changes', async () => {
    const { router, state } = await mountComposable()
    mockedFetch.mockClear()

    await state.retry()
    await state.setFormat('online')
    await state.setPage(2)

    expect(mockedFetch.mock.calls.every(([params]) => params.shuffle_seed === DEFAULT_SEED)).toBe(true)
    expect(router.currentRoute.value.query).toEqual({ format: 'online', page: '2' })
    expect('shuffle_seed' in router.currentRoute.value.query).toBe(false)
  })

  it('generates a fresh seed for each composable instance', async () => {
    mockedSeed.mockReset()
    mockedSeed.mockReturnValueOnce('seed-first').mockReturnValueOnce('seed-second')
    mockedFetch.mockClear()

    await mountComposable()
    await mountComposable()

    expect(mockedFetch.mock.calls[0]?.[0].shuffle_seed).toBe('seed-first')
    expect(mockedFetch.mock.calls[1]?.[0].shuffle_seed).toBe('seed-second')
  })
})
