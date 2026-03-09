import { defineStore } from 'pinia'
import { fetchMe, loginWithIdentifier, refreshToken, signupClient, signupSpecialist } from '../lib/api'

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

type SessionNotification = {
  id: number
  event: 'BOOKED' | 'CONFIRMED' | 'CANCELLED'
  session_id: number
  client_id: number
  client_name: string
  client_email: string | null
  slot_start_at: string | null
  created_at: string
}

type ReminderNotification = {
  id: number
  event_type: 'session_starts_24h' | 'session_starts_1h' | string
  session_id: number
  client_id: number
  client_name: string
  slot_start_at: string | null
  scheduled_for: string
  delivered_at: string | null
}

type NotificationsPayload = {
  session_events?: SessionNotification[]
  reminder_events?: ReminderNotification[]
}

type MePayload = {
  user: AuthUser
  access_state: string | null
  effective_entitlements: Entitlements | null
  counts: Counts | null
  notifications?: NotificationsPayload | null
  server_time: string
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    accessToken: '' as string,
    refreshToken: '' as string,
    user: null as AuthUser | null,
    me: null as MePayload | null,
    loading: false as boolean,
    error: '' as string,
  }),
  actions: {
    initFromStorage() {
      const token = localStorage.getItem('accessToken') || ''
      const refresh = localStorage.getItem('refreshToken') || ''
      if (token) {
        this.accessToken = token
      }
      if (refresh) {
        this.refreshToken = refresh
      }
    },
    setToken(token: string) {
      this.accessToken = token
      localStorage.setItem('accessToken', token)
    },
    setRefreshToken(token: string) {
      this.refreshToken = token
      localStorage.setItem('refreshToken', token)
    },
    setUser(user: AuthUser | null) {
      this.user = user
    },
    setMe(payload: MePayload | null) {
      this.me = payload
      this.user = payload ? payload.user : null
    },
    async login(identifier: string, password: string) {
      this.loading = true
      this.error = ''
      try {
        const tokens = await loginWithIdentifier(identifier, password)
        this.setToken(tokens.access)
        this.setRefreshToken(tokens.refresh)
        const me = await fetchMe(tokens.access)
        this.setMe(me)
      } catch (err) {
        this.error = err instanceof Error ? err.message : 'Не вдалося увійти'
        throw err
      } finally {
        this.loading = false
      }
    },
    async signup(email: string, password: string, passwordConfirm: string) {
      this.loading = true
      this.error = ''
      try {
        const tokens = await signupSpecialist(email, password, passwordConfirm)
        this.setToken(tokens.access)
        this.setRefreshToken(tokens.refresh)
        const me = await fetchMe(tokens.access)
        this.setMe(me)
      } catch (err) {
        this.error = err instanceof Error ? err.message : 'Не вдалося зареєструватися'
        throw err
      } finally {
        this.loading = false
      }
    },
    async signupClient(email: string, password: string, passwordConfirm: string) {
      this.loading = true
      this.error = ''
      try {
        const tokens = await signupClient(email, password, passwordConfirm)
        this.setToken(tokens.access)
        this.setRefreshToken(tokens.refresh)
        const me = await fetchMe(tokens.access)
        this.setMe(me)
      } catch (err) {
        this.error = err instanceof Error ? err.message : 'Не вдалося зареєструватися'
        throw err
      } finally {
        this.loading = false
      }
    },
    async loadMe() {
      if (!this.accessToken) return
      const me = await fetchMe(this.accessToken)
      this.setMe(me)
    },
    async refreshAccessToken(): Promise<string | null> {
      if (!this.refreshToken) return null
      try {
        const tokens = await refreshToken(this.refreshToken)
        this.setToken(tokens.access)
        return tokens.access
      } catch {
        this.logout()
        return null
      }
    },
    logout() {
      this.accessToken = ''
      this.refreshToken = ''
      this.user = null
      this.me = null
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
    },
  },
})
