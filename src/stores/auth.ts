import { defineStore } from 'pinia'
import { fetchMe, loginWithIdentifier, logoutSession, refreshToken, signupClient, signupSpecialist } from '../lib/api'

type AuthUser = {
  id: number
  username: string
  email: string | null
  roles: string[]
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
  server_time: string
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    accessToken: '' as string,
    user: null as AuthUser | null,
    me: null as MePayload | null,
    loading: false as boolean,
    error: '' as string,
    authEpoch: 0 as number,
  }),
  actions: {
    beginAuthEpoch() {
      this.authEpoch += 1
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
      }
    },
    async loadMe() {
      if (!this.accessToken) return
      const me = await fetchMe(this.accessToken)
      this.setMe(me)
    },
    async refreshAccessToken(epoch: number = this.authEpoch): Promise<string | null> {
      try {
        const tokens = await refreshToken()
        if (!this.isEpochActive(epoch)) return null
        this.setToken(tokens.access)
        return tokens.access
      } catch {
        if (!this.isEpochActive(epoch)) return null
        this.logout()
        return null
      }
    },
    async restoreSession(): Promise<boolean> {
      const epoch = this.beginAuthEpoch()
      const access = await this.refreshAccessToken(epoch)
      if (!access) return false
      if (!this.isEpochActive(epoch)) return false
      const me = await fetchMe(access)
      if (!this.isEpochActive(epoch)) return false
      this.setMe(me)
      return true
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
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
    },
  },
})
