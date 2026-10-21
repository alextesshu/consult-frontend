import { shallowRef } from 'vue'

// Query overrides storage and the build default. Memory substitutes failed persistence
// for this document only; a reload still needs query, storage, or the build default.
const KEY = 'pc.ui'

export type UiVersion = 'v1' | 'v2'

const currentVersion = shallowRef<UiVersion>('v1')
let rememberedVersion: UiVersion | undefined
let pendingPersistence: UiVersion | undefined

function validVersion(value: unknown): value is UiVersion {
  return value === 'v1' || value === 'v2'
}

function defaultVersion(): UiVersion {
  return import.meta.env.VITE_UI_V2 === 'true' ? 'v2' : 'v1'
}

export function resolveUiVersion(): UiVersion {
  const q = new URLSearchParams(window.location.search).get('ui')
  if (validVersion(q)) {
    rememberedVersion = q
    pendingPersistence = q
    try {
      window.localStorage.setItem(KEY, q)
      pendingPersistence = undefined
    } catch {
      // A failed write must not prevent the explicit query from taking effect.
    }
    return q
  }
  if (pendingPersistence) return pendingPersistence
  try {
    const stored = window.localStorage.getItem(KEY)
    if (validVersion(stored)) {
      rememberedVersion = stored
      return stored
    }
  } catch {
    return rememberedVersion ?? defaultVersion()
  }
  return defaultVersion()
}

export function applyUiVersion(v: UiVersion = resolveUiVersion()): UiVersion {
  document.documentElement.dataset.ui = v
  currentVersion.value = v
  rememberedVersion = v
  return v
}

export const isUiV2 = () => currentVersion.value === 'v2'
