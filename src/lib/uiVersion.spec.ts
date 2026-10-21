import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

beforeEach(() => {
  vi.resetModules()
  vi.stubEnv('VITE_UI_V2', '')
  window.localStorage.clear()
  window.history.replaceState({}, '', '/')
  delete document.documentElement.dataset.ui
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
  window.localStorage.clear()
  window.history.replaceState({}, '', '/')
  delete document.documentElement.dataset.ui
})

describe('UI version selection', () => {
  it.each([
    ['?ui=v1', 'v2', 'true', 'v1'],
    ['?ui=v2', 'v1', '', 'v2'],
    ['?ui=invalid', 'v2', '', 'v2'],
    ['?ui=V2', 'invalid', '', 'v1'],
    ['?ui=', 'v1', 'true', 'v1'],
    ['', 'v1', 'true', 'v1'],
    ['', 'v2', '', 'v2'],
    ['', 'invalid', 'true', 'v2'],
    ['', '', '', 'v1'],
    ['', '', 'false', 'v1'],
    ['', '', '1', 'v1'],
    ['', '', ' true ', 'v1'],
  ])('resolves query %s / storage %s / env %s as %s', async (query, stored, env, expected) => {
    window.history.replaceState({}, '', `/${query}`)
    window.localStorage.setItem('pc.ui', stored)
    vi.stubEnv('VITE_UI_V2', env)
    const { resolveUiVersion } = await import('./uiVersion')
    expect(resolveUiVersion()).toBe(expected)
    if (query === '?ui=v1' || query === '?ui=v2') {
      expect(window.localStorage.getItem('pc.ui')).toBe(expected)
    } else {
      expect(window.localStorage.getItem('pc.ui')).toBe(stored)
    }
  })

  it('restores the persisted selection in a fresh module after refresh', async () => {
    window.history.replaceState({}, '', '/?ui=v2')
    const first = await import('./uiVersion')
    expect(first.applyUiVersion()).toBe('v2')
    window.history.replaceState({}, '', '/')
    vi.resetModules()
    const refreshed = await import('./uiVersion')
    expect(refreshed.applyUiVersion()).toBe('v2')
    expect(document.documentElement.dataset.ui).toBe('v2')
  })

  it('ignores later invalid query values without overwriting persistence', async () => {
    window.history.replaceState({}, '', '/?ui=v2')
    const ui = await import('./uiVersion')
    ui.applyUiVersion()
    window.history.replaceState({}, '', '/login?ui=invalid')
    expect(ui.applyUiVersion()).toBe('v2')
    expect(window.localStorage.getItem('pc.ui')).toBe('v2')
  })

  it('keeps a failed write in memory ahead of a stale readable preference', async () => {
    window.localStorage.setItem('pc.ui', 'v1')
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Blocked', 'SecurityError')
    })
    window.history.replaceState({}, '', '/?ui=v2')
    const ui = await import('./uiVersion')
    expect(ui.applyUiVersion()).toBe('v2')
    window.history.replaceState({}, '', '/login')
    expect(ui.applyUiVersion()).toBe('v2')
    expect(window.localStorage.getItem('pc.ui')).toBe('v1')
    window.history.replaceState({}, '', '/?ui=v1')
    expect(ui.applyUiVersion()).toBe('v1')
  })

  it('reads storage even when writes are independently denied', async () => {
    window.localStorage.setItem('pc.ui', 'v2')
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Denied') })
    const ui = await import('./uiVersion')
    expect(ui.applyUiVersion()).toBe('v2')
  })

  it('writes an explicit query even when reads are independently denied', async () => {
    const write = vi.spyOn(Storage.prototype, 'setItem')
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('Denied') })
    window.history.replaceState({}, '', '/?ui=v1')
    vi.stubEnv('VITE_UI_V2', 'true')
    const ui = await import('./uiVersion')
    expect(ui.applyUiVersion()).toBe('v1')
    expect(write).toHaveBeenCalledWith('pc.ui', 'v1')
    window.history.replaceState({}, '', '/login')
    expect(ui.applyUiVersion()).toBe('v1')
  })

  it.each(['', 'true'])('survives an unavailable storage accessor with env %s', async (env) => {
    vi.stubEnv('VITE_UI_V2', env)
    vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
      throw new DOMException('Blocked', 'SecurityError')
    })
    const ui = await import('./uiVersion')
    expect(ui.applyUiVersion()).toBe(env === 'true' ? 'v2' : 'v1')
    window.history.replaceState({}, '', '/?ui=v2')
    expect(ui.applyUiVersion()).toBe('v2')
    window.history.replaceState({}, '', '/login')
    expect(ui.applyUiVersion()).toBe('v2')
  })

  it('does not promise persistence across refresh when storage is unavailable', async () => {
    vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => { throw new Error('Denied') })
    window.history.replaceState({}, '', '/?ui=v2')
    const ui = await import('./uiVersion')
    ui.applyUiVersion()
    window.history.replaceState({}, '', '/')
    vi.resetModules()
    const refreshed = await import('./uiVersion')
    expect(refreshed.applyUiVersion()).toBe('v1')
  })

  it('updates Vue consumers and html together without a Pinia store', async () => {
    const ui = await import('./uiVersion')
    const { createApp, h, nextTick } = await import('vue')
    const host = document.createElement('div')
    const app = createApp({ render: () => h('p', ui.isUiV2() ? 'v2' : 'v1') })
    app.mount(host)
    try {
      expect(host.textContent).toBe('v1')
      ui.applyUiVersion('v2')
      await nextTick()
      expect(host.textContent).toBe('v2')
      expect(document.documentElement.dataset.ui).toBe('v2')
      ui.applyUiVersion('v1')
      await nextTick()
      expect(host.textContent).toBe('v1')
      expect(document.documentElement.dataset.ui).toBe('v1')
    } finally {
      app.unmount()
    }
  })
})
