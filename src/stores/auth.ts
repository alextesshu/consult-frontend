import { defineStore } from 'pinia'
import { fetchMe, loginWithIdentifier, logoutSession, refreshToken, signupClient, signupSpecialist } from '../lib/api'

type AuthUser = {
  id: number
  username: string
  email: string | null
  role?: string | null
  roles?: string[]
}

type Entitlements = {
  plan: string
  active_client_limit: number | null
  pair_enabled: boolean
  group_room_enabled: boolean
  group_room_meeting_limit: number | null
  group_room_broadcast_enabled: boolean
  default_technical_cap: number
}

type Counts = {
  active_clients: number
  prospect_clients: number
  upcoming_sessions_count: number
  latest_upcoming_session_created_at?: string | null
}

type MePayload = {
  user: AuthUser
  access_state: string | null
  effective_entitlements: Entitlements | null
  counts: Counts | null
  onboarding_summary?: unknown
  server_time: string
}

type InFlight<T> = { epoch: number; promise: Promise<T> }

let refreshInFlight: InFlight<string | null> | null = null
let restoreInFlight: InFlight<boolean> | null = null
let resolveInFlight: InFlight<boolean> | null = null
const AUTH_REFRESH_RETRY_ATTEMPTS = 2
const AUTH_ME_RETRY_ATTEMPTS = 2
const AUTH_RETRY_DELAY_MS = 150

function sleep(ms: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, ms))
}

function isTerminalRefreshFailure(err: unknown) {
  const status = (err as any)?.response?.status
  return status === 401 || status === 403
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    accessToken: '' as string,
    user: null as AuthUser | null,
    me: null as MePayload | null,
    loading: false as boolean,
    error: '' as string,
    authResolved: false as boolean,
    authEpoch: 0 as number,
  }),
  actions: {
    beginAuthEpoch() {
      this.authEpoch += 1
      this.authResolved = false
      refreshInFlight = null
      restoreInFlight = null
      resolveInFlight = null
      return this.authEpoch
    },
    isEpochActive(epoch: number) {
      return epoch === this.authEpoch
    },
    clearAuthState() {
      this.accessToken = ''
      this.user = null
      this.me = null
    },
    initFromStorage() {
      // Security hardening: do not restore tokens from localStorage.
      // Keep cleanup for legacy keys left by older builds.
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
    },
    setToken(token: string) {
      this.accessToken = token
    },
    setUser(user: AuthUser | null) {
      this.user = user
    },
    setMe(payload: MePayload | null) {
      this.me = payload
      this.user = payload ? payload.user : null
      this.authResolved = true
    },
    async login(identifier: string, password: string) {
      const epoch = this.beginAuthEpoch()
      this.loading = true
      this.error = ''
      this.clearAuthState()
      try {
        const tokens = await loginWithIdentifier(identifier, password)
        if (!this.isEpochActive(epoch)) return
        this.setToken(tokens.access)
        const me = await fetchMe(tokens.access)
        if (!this.isEpochActive(epoch)) return
        this.setMe(me)
      } catch (err) {
        if (!this.isEpochActive(epoch)) return
        this.error = err instanceof Error ? err.message : 'Не вдалося увійти'
        throw err
      } finally {
        if (!this.isEpochActive(epoch)) return
        this.loading = false
        this.authResolved = true
      }
    },
    async signup(email: string, password: string, passwordConfirm: string) {
      const epoch = this.beginAuthEpoch()
      this.loading = true
      this.error = ''
      this.clearAuthState()
      try {
        const tokens = await signupSpecialist(email, password, passwordConfirm)
        if (!this.isEpochActive(epoch)) return
        this.setToken(tokens.access)
        const me = await fetchMe(tokens.access)
        if (!this.isEpochActive(epoch)) return
        this.setMe(me)
      } catch (err) {
        if (!this.isEpochActive(epoch)) return
        this.error = err instanceof Error ? err.message : 'Не вдалося зареєструватися'
        throw err
      } finally {
        if (!this.isEpochActive(epoch)) return
        this.loading = false
        this.authResolved = true
      }
    },
    async signupClient(email: string, password: string, passwordConfirm: string) {
      const epoch = this.beginAuthEpoch()
      this.loading = true
      this.error = ''
      this.clearAuthState()
      try {
        const tokens = await signupClient(email, password, passwordConfirm)
        if (!this.isEpochActive(epoch)) return
        this.setToken(tokens.access)
        const me = await fetchMe(tokens.access)
        if (!this.isEpochActive(epoch)) return
        this.setMe(me)
      } catch (err) {
        if (!this.isEpochActive(epoch)) return
        this.error = err instanceof Error ? err.message : 'Не вдалося зареєструватися'
        throw err
      } finally {
        if (!this.isEpochActive(epoch)) return
        this.loading = false
        this.authResolved = true
      }
    },
    async loadMe() {
      if (!this.accessToken) return
      const me = await fetchMe(this.accessToken)
      this.setMe(me)
    },
    async ensureAuthResolved(options?: { force?: boolean }): Promise<boolean> {
      const force = Boolean(options?.force)
      if (!force && this.authResolved) return Boolean(this.accessToken)
      if (!force && resolveInFlight && resolveInFlight.epoch === this.authEpoch) {
        return resolveInFlight.promise
      }

      const epoch = this.authEpoch
      resolveInFlight = {
        epoch,
        promise: (async () => {
        if (!this.accessToken) {
          const restored = await this.restoreSession().catch(() => false)
          if (!this.isEpochActive(epoch)) return false
          this.authResolved = true
          return restored
        }

        if (!this.me) {
          try {
            await this.loadMe()
            if (!this.isEpochActive(epoch)) return false
            this.authResolved = true
            return true
          } catch {
            // Keep route pending decisions tolerant to transient me failures when token exists.
          }
        }

        if (!this.isEpochActive(epoch)) return false
        this.authResolved = true
        return Boolean(this.accessToken)
      })().finally(() => {
        if (resolveInFlight?.epoch === epoch) {
          resolveInFlight = null
        }
      }),
      }

      return resolveInFlight.promise
    },
    async refreshAccessToken(epoch?: number): Promise<string | null> {
      const effectiveEpoch = epoch ?? this.authEpoch
      if (refreshInFlight && refreshInFlight.epoch === effectiveEpoch) {
        return refreshInFlight.promise
      }

      refreshInFlight = {
        epoch: effectiveEpoch,
        promise: (async () => {
        try {
          const tokens = await refreshToken()
          if (!this.isEpochActive(effectiveEpoch)) return null
          this.setToken(tokens.access)
          return tokens.access
        } catch (err) {
          if (!this.isEpochActive(effectiveEpoch)) return null
          if (isTerminalRefreshFailure(err)) {
            this.logout()
          }
          return null
        }
      })().finally(() => {
        if (refreshInFlight?.epoch === effectiveEpoch) {
          refreshInFlight = null
        }
      }),
      }

      return refreshInFlight.promise
    },

    async restoreSession(): Promise<boolean> {
      const epoch = this.authEpoch
      if (restoreInFlight && restoreInFlight.epoch === epoch) {
        return restoreInFlight.promise
      }

      restoreInFlight = {
        epoch,
        promise: (async () => {
        let access: string | null = null
        for (let attempt = 0; attempt < AUTH_REFRESH_RETRY_ATTEMPTS; attempt += 1) {
          access = await this.refreshAccessToken(epoch)
          if (access) break
          if (!this.isEpochActive(epoch)) return false
          if (attempt < AUTH_REFRESH_RETRY_ATTEMPTS - 1) {
            await sleep(AUTH_RETRY_DELAY_MS)
          }
        }
        if (!access) return false
        if (!this.isEpochActive(epoch)) return false

        for (let attempt = 0; attempt < AUTH_ME_RETRY_ATTEMPTS; attempt += 1) {
          try {
            const me = await fetchMe(access)
            if (!this.isEpochActive(epoch)) return false
            this.setMe(me)
            return true
          } catch {
            if (!this.isEpochActive(epoch)) return false
            if (attempt < AUTH_ME_RETRY_ATTEMPTS - 1) {
              await sleep(AUTH_RETRY_DELAY_MS)
            }
          }
        }
        return false
      })().finally(() => {
        if (restoreInFlight?.epoch === epoch) {
          restoreInFlight = null
        }
      }),
      }

      return restoreInFlight.promise.finally(() => {
        if (!this.isEpochActive(epoch)) return
        this.authResolved = true
      })
    },
    async logoutWithServer() {
      try {
        await logoutSession()
      } finally {
        this.logout()
      }
    },
    logout() {
      this.beginAuthEpoch()
      this.clearAuthState()
      this.authResolved = false
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
    },
  },
})
