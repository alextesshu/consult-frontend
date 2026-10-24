// UI v2 feature flag.
// Priority: ?ui=v1|v2 (persisted) → localStorage → VITE_UI_V2 build default.
// Pages that are not migrated yet still render correctly under v2: tokens-v2.css bridges legacy variables.
const KEY = 'pc.ui'

export type UiVersion = 'v1' | 'v2'

export function resolveUiVersion(): UiVersion {
  const q = new URLSearchParams(window.location.search).get('ui')
  if (q === 'v1' || q === 'v2') {
    localStorage.setItem(KEY, q)
    return q
  }
  const stored = localStorage.getItem(KEY)
  if (stored === 'v1' || stored === 'v2') return stored
  return String(import.meta.env.VITE_UI_V2 || '').trim() === 'true' ? 'v2' : 'v1'
}

export function applyUiVersion(v: UiVersion = resolveUiVersion()): UiVersion {
  document.documentElement.dataset.ui = v
  return v
}

export const isUiV2 = () => document.documentElement.dataset.ui === 'v2'
