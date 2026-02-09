import { defineStore } from 'pinia'
import { fetchMe, loginWithIdentifier, refreshToken } from '../lib/api'

type AuthUser = {
  id: number
  username: string
  email: string | null
  roles: string[]
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    accessToken: '' as string,
    refreshToken: '' as string,
    user: null as AuthUser | null,
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
    async login(identifier: string, password: string) {
      this.loading = true
      this.error = ''
      try {
        const tokens = await loginWithIdentifier(identifier, password)
        this.setToken(tokens.access)
        this.setRefreshToken(tokens.refresh)
        const me = await fetchMe(tokens.access)
        this.setUser(me.user)
      } catch (err) {
        this.error = err instanceof Error ? err.message : 'Login failed'
        throw err
      } finally {
        this.loading = false
      }
    },
    async loadMe() {
      if (!this.accessToken) return
      const me = await fetchMe(this.accessToken)
      this.setUser(me.user)
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
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
    },
  },
})
