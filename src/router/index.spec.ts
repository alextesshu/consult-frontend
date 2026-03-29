import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import router from './index'
import { useAuthStore } from '../stores/auth'

describe('router specialist session routes', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    const auth = useAuthStore()
    auth.$reset()
    localStorage.clear()
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

  it('redirects unauthenticated users away from specialist session routes', async () => {
    await router.push('/cabinet/sessions/42')

    expect(router.currentRoute.value.name).toBe('login')
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

  it('does not force redirect to login on transient me bootstrap failure when token exists', async () => {
    const auth = useAuthStore()
    auth.setToken('test-token')
    const loadMeSpy = vi.spyOn(auth, 'loadMe').mockRejectedValueOnce(new Error('transient me failure'))

    await router.push('/cabinet/sessions/42')

    expect(router.currentRoute.value.name).toBe('cabinet-session-detail')
    expect(loadMeSpy).toHaveBeenCalledTimes(1)
  })

  it('matches the specialist client workbook route for numeric ids', () => {
    const resolved = router.resolve('/cabinet/clients/44/workbook')

    expect(resolved.name).toBe('cabinet-client-workbook')
    expect(resolved.params).toEqual({ clientId: '44' })
    expect(resolved.matched.at(-1)?.path).toBe('/cabinet/clients/:clientId(\\d+)/workbook')
  })
})
