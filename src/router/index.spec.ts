import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import router from './index'
import { useAuthStore } from '../stores/auth'
import { fetchSpecialistProfile } from '../lib/api'

vi.mock('../lib/api', async () => {
  const actual = await vi.importActual<typeof import('../lib/api')>('../lib/api')
  return {
    ...actual,
    fetchSpecialistProfile: vi.fn(),
  }
})

const mockedFetchSpecialistProfile = vi.mocked(fetchSpecialistProfile)

describe('router specialist session routes', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    const auth = useAuthStore()
    auth.$reset()
    localStorage.clear()
    mockedFetchSpecialistProfile.mockReset()
    await router.push('/')
  })

  it('matches the specialist session detail route for numeric ids', () => {
    const resolved = router.resolve('/cabinet/sessions/42')

    expect(resolved.name).toBe('cabinet-session-detail')
    expect(resolved.params).toEqual({ id: '42' })
    expect(resolved.matched.at(-1)?.path).toBe('/cabinet/sessions/:id(\\d+)')
  })

  it('keeps the list route distinct and rejects non-numeric specialist session ids', () => {
    const list = router.resolve('/cabinet/sessions')
    const invalidDetail = router.resolve('/cabinet/sessions/not-a-number')

    expect(list.name).toBe('cabinet-sessions')
    expect(list.params).toEqual({})
    expect(invalidDetail.name).not.toBe('cabinet-session-detail')
    expect(invalidDetail.matched.some((record) => record.name === 'cabinet-session-detail')).toBe(false)
  })

  it('matches external sessions routes and rejects non-numeric detail id', () => {
    const list = router.resolve('/cabinet/external-sessions')
    const detail = router.resolve('/cabinet/external-sessions/21')
    const invalidDetail = router.resolve('/cabinet/external-sessions/not-a-number')

    expect(list.name).toBe('cabinet-external-sessions')
    expect(detail.name).toBe('cabinet-external-session-detail')
    expect(detail.params).toEqual({ id: '21' })
    expect(invalidDetail.name).not.toBe('cabinet-external-session-detail')
  })

  it('matches client account invite route as public preview', () => {
    const resolved = router.resolve('/client/invite/manual-token')

    expect(resolved.name).toBe('client-record-account-invite')
    expect(resolved.params).toEqual({ token: 'manual-token' })
    expect(resolved.meta.requiresAuth).toBeUndefined()
    expect(resolved.meta.minimalShell).toBe(true)
  })

  it('matches client materials route and requires client role', () => {
    const resolved = router.resolve('/client/materials')
    expect(resolved.name).toBe('client-materials')
    expect(resolved.meta.requiresAuth).toBe(true)
    expect(resolved.meta.requiresRole).toBe('CLIENT')
  })

  it('matches specialist reviews route and requires specialist role', () => {
    const resolved = router.resolve('/cabinet/reviews')
    expect(resolved.name).toBe('cabinet-reviews')
    expect(resolved.meta.requiresAuth).toBe(true)
    expect(resolved.meta.requiresRole).toBe('SPECIALIST')
  })

  it('matches admin billing request routes and rejects non-numeric detail id', () => {
    const list = router.resolve('/admin/billing-access-requests')
    const detail = router.resolve('/admin/billing-access-requests/33')
    const invalidDetail = router.resolve('/admin/billing-access-requests/nope')

    expect(list.name).toBe('admin-billing-access-requests')
    expect(detail.name).toBe('admin-billing-access-request-detail')
    expect(detail.params).toEqual({ id: '33' })
    expect(invalidDetail.name).not.toBe('admin-billing-access-request-detail')
  })

  it('matches admin work queue route and requires admin role', () => {
    const resolved = router.resolve('/admin/work-queue')

    expect(resolved.name).toBe('admin-work-queue')
    expect(resolved.meta.requiresAuth).toBe(true)
    expect(resolved.meta.requiresRole).toBe('ADMIN')
  })

  it('matches admin specialist detail route and rejects non-numeric id', () => {
    const list = router.resolve('/admin/specialists')
    const detail = router.resolve('/admin/specialists/77')
    const invalid = router.resolve('/admin/specialists/not-a-number')

    expect(list.name).toBe('admin-specialists')
    expect(detail.name).toBe('admin-specialist-detail')
    expect(detail.params).toEqual({ id: '77' })
    expect(invalid.name).not.toBe('admin-specialist-detail')
  })

  it('matches specialist practice board route', () => {
    const resolved = router.resolve('/cabinet/practice-board')

    expect(resolved.name).toBe('cabinet-practice-board')
    expect(resolved.params).toEqual({})
  })

  it('redirects unauthenticated users away from specialist session routes', async () => {
    await router.push('/cabinet/sessions/42')

    expect(router.currentRoute.value.name).toBe('login')
  })

  it('redirects unauthenticated users away from external specialist routes', async () => {
    await router.push('/cabinet/external-sessions/21')

    expect(router.currentRoute.value.name).toBe('login')
  })

  it('waits auth bootstrap for admin route and avoids forbidden redirect for ADMIN', async () => {
    const auth = useAuthStore()
    vi.spyOn(auth, 'restoreSession').mockImplementation(async () => {
      auth.setToken('admin-token')
      auth.setMe({
        user: {
          id: 99,
          username: 'admin',
          email: 'admin@example.com',
          roles: ['ADMIN'],
        },
        access_state: null,
        effective_entitlements: null,
        counts: null,
        server_time: '2026-03-31T00:00:00Z',
      })
      return true
    })

    await router.push('/admin/work-queue')

    expect(router.currentRoute.value.name).toBe('admin-work-queue')
  })

  it('treats singular role=ADMIN as admin access for route guard', async () => {
    const auth = useAuthStore()
    auth.setToken('admin-token')
    auth.setMe({
      user: {
        id: 100,
        username: 'admin-role-only',
        email: 'admin@example.com',
        role: 'ADMIN',
        roles: [],
      },
      access_state: null,
      effective_entitlements: null,
      counts: null,
      server_time: '2026-03-31T00:00:00Z',
    })

    await router.push('/admin/inbox')

    expect(router.currentRoute.value.name).toBe('admin-inbox')
  })

  it('allows authenticated specialists to open the session detail route', async () => {
    const auth = useAuthStore()
    auth.setToken('test-token')
    auth.setUser({
      id: 1,
      username: 'specialist',
      email: 'specialist@example.com',
      roles: ['SPECIALIST'],
    })

    await router.push('/cabinet/sessions/42')

    expect(router.currentRoute.value.name).toBe('cabinet-session-detail')
    expect(router.currentRoute.value.params).toEqual({ id: '42' })
  })

  it('allows authenticated specialists to open the external session detail route', async () => {
    const auth = useAuthStore()
    auth.setToken('test-token')
    auth.setUser({
      id: 1,
      username: 'specialist',
      email: 'specialist@example.com',
      roles: ['SPECIALIST'],
    })

    await router.push('/cabinet/external-sessions/21')

    expect(router.currentRoute.value.name).toBe('cabinet-external-session-detail')
    expect(router.currentRoute.value.params).toEqual({ id: '21' })
  })

  it('allows unauthenticated access to public external guest session route', async () => {
    await router.push('/guest/external-session/test-token')

    expect(router.currentRoute.value.name).toBe('guest-external-session')
    expect(router.currentRoute.value.params).toEqual({ token: 'test-token' })
  })

  it('does not force redirect to login on transient me bootstrap failure when token exists', async () => {
    const auth = useAuthStore()
    auth.setToken('test-token')
    const loadMeSpy = vi.spyOn(auth, 'loadMe').mockRejectedValueOnce(new Error('transient me failure'))

    await router.push('/cabinet/sessions/42')

    expect(router.currentRoute.value.name).toBe('cabinet-session-detail')
    expect(loadMeSpy).toHaveBeenCalledTimes(1)
  })

  it('triggers one-shot me reconcile on critical specialist routes', async () => {
    const auth = useAuthStore()
    auth.setToken('test-token')
    auth.setMe({
      user: {
        id: 1,
        username: 'specialist',
        email: 'specialist@example.com',
        roles: ['SPECIALIST'],
      },
      access_state: null,
      effective_entitlements: null,
      counts: null,
      server_time: '2026-03-31T00:00:00Z',
    })
    const loadMeSpy = vi.spyOn(auth, 'loadMe').mockResolvedValue(undefined)

    await router.push('/cabinet')

    expect(router.currentRoute.value.name).toBe('cabinet')
    expect(loadMeSpy).toHaveBeenCalledTimes(1)
  })

  it('applies cooldown for rapid critical-route reconcile calls', async () => {
    vi.useFakeTimers()
    try {
      vi.setSystemTime(new Date('2035-03-31T10:00:00Z'))

      const auth = useAuthStore()
      auth.setToken('test-token')
      auth.setMe({
        user: {
          id: 1,
          username: 'specialist',
          email: 'specialist@example.com',
          roles: ['SPECIALIST'],
        },
        access_state: null,
        effective_entitlements: null,
        counts: null,
        server_time: '2026-03-31T00:00:00Z',
      })
      const loadMeSpy = vi.spyOn(auth, 'loadMe').mockResolvedValue(undefined)

      await router.push('/cabinet')
      await router.push('/cabinet/billing')

      expect(loadMeSpy).toHaveBeenCalledTimes(1)

      vi.setSystemTime(new Date('2035-03-31T10:00:20Z'))
      await router.push('/cabinet/group-events')

      expect(loadMeSpy).toHaveBeenCalledTimes(2)
    } finally {
      vi.useRealTimers()
    }
  })

  it('does not run specialist reconcile on non-critical routes', async () => {
    const auth = useAuthStore()
    auth.setToken('test-token')
    auth.setMe({
      user: {
        id: 1,
        username: 'specialist',
        email: 'specialist@example.com',
        roles: ['SPECIALIST'],
      },
      access_state: null,
      effective_entitlements: null,
      counts: null,
      server_time: '2026-03-31T00:00:00Z',
    })
    const loadMeSpy = vi.spyOn(auth, 'loadMe').mockResolvedValue(undefined)

    await router.push('/cabinet/sessions')

    expect(router.currentRoute.value.name).toBe('cabinet-sessions')
    expect(loadMeSpy).not.toHaveBeenCalled()
  })

  it('does not run specialist reconcile for non-specialist users', async () => {
    const auth = useAuthStore()
    auth.setToken('test-token')
    auth.setMe({
      user: {
        id: 2,
        username: 'client',
        email: 'client@example.com',
        roles: ['CLIENT'],
      },
      access_state: null,
      effective_entitlements: null,
      counts: null,
      server_time: '2026-03-31T00:00:00Z',
    })
    const loadMeSpy = vi.spyOn(auth, 'loadMe').mockResolvedValue(undefined)

    await router.push('/client')

    expect(router.currentRoute.value.name).toBe('client-dashboard')
    expect(loadMeSpy).not.toHaveBeenCalled()
  })

  it('matches the specialist client workbook route for numeric ids', () => {
    const resolved = router.resolve('/cabinet/clients/44/workbook')

    expect(resolved.name).toBe('cabinet-client-workbook')
    expect(resolved.params).toEqual({ clientId: '44' })
    expect(resolved.matched.at(-1)?.path).toBe('/cabinet/clients/:clientId(\\d+)/workbook')
  })

  it('redirects specialist to public profile when profile is published', async () => {
    const auth = useAuthStore()
    auth.setToken('test-token')
    auth.setMe({
      user: {
        id: 1,
        username: 'specialist',
        email: 'specialist@example.com',
        roles: ['SPECIALIST'],
      },
      access_state: null,
      effective_entitlements: null,
      counts: null,
      server_time: '2026-03-31T00:00:00Z',
    })
    mockedFetchSpecialistProfile.mockResolvedValue({
      slug: 'olena',
      public_profile_path: '/s/olena',
      public_slug: 'olena',
      public_profile_enabled: true,
    } as Awaited<ReturnType<typeof fetchSpecialistProfile>>)

    await router.push('/public')

    expect(router.currentRoute.value.name).toBe('public-profile')
    expect(router.currentRoute.value.params).toEqual({ slug: 'olena' })
  })

  it('keeps specialist in cabinet profile when public profile is not published', async () => {
    const auth = useAuthStore()
    auth.setToken('test-token')
    auth.setMe({
      user: {
        id: 1,
        username: 'specialist',
        email: 'specialist@example.com',
        roles: ['SPECIALIST'],
      },
      access_state: null,
      effective_entitlements: null,
      counts: null,
      server_time: '2026-03-31T00:00:00Z',
    })
    mockedFetchSpecialistProfile.mockResolvedValue({
      slug: 'olena',
      public_profile_path: '/s/olena',
      public_slug: 'olena',
      public_profile_enabled: false,
    } as Awaited<ReturnType<typeof fetchSpecialistProfile>>)

    await router.push('/public')

    expect(router.currentRoute.value.name).toBe('cabinet-profile')
    expect(router.currentRoute.value.query).toEqual({ public_profile: 'unpublished' })
  })
})
