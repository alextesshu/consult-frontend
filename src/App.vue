<template>
  <div :class="['shell', { 'shell--home': isHome }]">
    <header :class="topbarClass">
      <RouterLink class="brand" to="/">
        <div class="brand__mark">Pro Consult</div>
        <div class="brand__tagline">Простір для спеціалістів</div>
      </RouterLink>
      <nav class="nav">
        <RouterLink v-if="isAuthenticated" :to="cabinetRoute">{{ cabinetLabel }}</RouterLink>
        <RouterLink v-if="showCatalogNav" to="/specialists">Каталог</RouterLink>
        <RouterLink
          v-if="isAuthenticated && isSpecialist"
          to="/public"
          :class="{ 'nav-link--active': isPublicRoute }"
        >
          Публічний профіль
        </RouterLink>
        <RouterLink to="/faq">FAQ</RouterLink>
        <RouterLink v-if="!isAuthenticated" to="/login">Вхід</RouterLink>
        <RouterLink v-if="!isAuthenticated" to="/signup">Реєстрація</RouterLink>
        <RouterLink
          v-if="isAuthenticated"
          class="icon-btn"
          :to="chatRoute"
          aria-label="Чат"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M4 4h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H8l-4 4v-4H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"
              fill="currentColor"
            />
          </svg>
          <span v-if="chatUnreadCount" class="icon-btn__badge">{{ chatUnreadCount }}</span>
        </RouterLink>
        <RouterLink
          v-if="isAuthenticated && isSpecialist"
          class="icon-btn"
          to="/cabinet/settings"
          aria-label="Налаштування"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M19.14 12.94a7.9 7.9 0 0 0 .06-.94 7.9 7.9 0 0 0-.06-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.2 7.2 0 0 0-1.63-.94L14.4 2.8a.5.5 0 0 0-.5-.4h-3.8a.5.5 0 0 0-.5.4L9.25 5.32a7.2 7.2 0 0 0-1.63.94l-2.39-.96a.5.5 0 0 0-.6.22L2.71 8.84a.5.5 0 0 0 .12.64l2.03 1.58a7.9 7.9 0 0 0-.06.94 7.9 7.9 0 0 0 .06.94L2.83 14.52a.5.5 0 0 0-.12.64l1.92 3.32c.13.22.39.31.6.22l2.39-.96c.5.39 1.05.7 1.63.94l.35 2.52c.04.24.25.4.5.4h3.8c.25 0 .46-.16.5-.4l.35-2.52c.58-.24 1.13-.55 1.63-.94l2.39.96c.22.09.47 0 .6-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58zM12 15.5A3.5 3.5 0 1 1 12 8.5a3.5 3.5 0 0 1 0 7z"
              fill="currentColor"
            />
          </svg>
        </RouterLink>
        <div v-if="isAuthenticated" class="nav__notifications">
          <button
            ref="notificationsButtonRef"
            class="icon-btn"
            type="button"
            @click="toggleNotifications"
            aria-label="Сповіщення"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22zm7-6V11a7 7 0 1 0-14 0v5l-2 2v1h18v-1l-2-2z"
                fill="currentColor"
              />
            </svg>
            <span v-if="notificationCount" class="icon-btn__badge">{{ notificationCount }}</span>
          </button>
          <div v-if="showNotifications" ref="notificationsPanelRef" class="notif-panel">
            <div class="notif-panel__title">Сповіщення</div>
            <div v-if="notifications.length === 0" class="muted">Немає нових сповіщень.</div>
            <div v-else class="notif-list">
              <RouterLink
                v-for="item in notifications"
                :key="item.id"
                class="notif-item"
                :class="{ 'notif-item--read': !item.unread }"
                :to="item.to"
                @click="markNotificationRead(item.id)"
              >
                <span class="notif-item__dot" :class="`notif-item__dot--${item.tone}`"></span>
                <div>
                  <div class="notif-item__text">{{ item.text }}</div>
                  <div class="muted notif-item__hint">{{ item.hint }}</div>
                </div>
              </RouterLink>
            </div>
          </div>
        </div>
        <button v-if="isAuthenticated" class="btn btn--ghost" type="button" @click="onLogout">
          Вийти
        </button>
      </nav>
    </header>

    <main :class="['main', { 'main--home': isHome }]">
      <RouterView :key="route.fullPath" />
    </main>
    <ToastHost />

    <footer class="footer">
      <div>Pro Consult — Простір для спеціалістів · <RouterLink class="footer__link" to="/faq">FAQ</RouterLink></div>
      <div class="footer__meta">
        <span>Без комісій. Без посередників. З повагою до практики.</span>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from './stores/auth'
import ToastHost from './components/ToastHost.vue'
import { fetchChatUnreadCount } from './lib/api'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const isAuthenticated = computed(() => Boolean(auth.accessToken))
const isHome = computed(() => route.path === '/')

watchEffect(() => {
  document.body.classList.toggle('body--home', isHome.value)
})
const roles = computed(() => auth.me?.user.roles ?? [])
const isSpecialist = computed(() => roles.value.includes('SPECIALIST') || roles.value.includes('THERAPIST'))
const isClient = computed(() => roles.value.includes('CLIENT'))
watchEffect(() => {
  const path = route.path || ''
  const role =
    isSpecialist.value && (path.startsWith('/cabinet') || path.startsWith('/public'))
      ? 'specialist'
      : 'client'
  document.documentElement.setAttribute('data-role', role)
})
const cabinetRoute = computed(() => {
  if (isSpecialist.value) return '/cabinet'
  if (isClient.value) return '/client'
  return '/login'
})
const cabinetLabel = computed(() => {
  if (isSpecialist.value) return 'Мій кабінет'
  if (isClient.value) return 'Мій щоденник'
  return 'Кабінет'
})
const showCatalogNav = computed(() => isClient.value)
const chatRoute = computed(() => (isSpecialist.value ? '/cabinet/chat' : '/client/chat'))
const isPublicRoute = computed(
  () => route.path.startsWith('/public') || route.path.startsWith('/specialist/')
)

const topbarClass = computed(() => [
  'topbar',
  {
    'topbar--specialist': isSpecialist.value,
    'topbar--client': isClient.value,
    'topbar--overlay': isHome.value,
  },
])

const showNotifications = ref(false)
const readNotificationIds = ref<Set<string>>(new Set())
const notificationsButtonRef = ref<HTMLButtonElement | null>(null)
const notificationsPanelRef = ref<HTMLDivElement | null>(null)
const lastNotificationIds = ref<Set<string>>(new Set())
const lastUpcomingCount = ref<number>(0)
const lastReadUpcomingAt = ref<string>('')
const refreshIntervalId = ref<number | null>(null)
const chatIntervalId = ref<number | null>(null)
const chatUnreadCount = ref(0)

function loadReadNotifications() {
  try {
    const raw = localStorage.getItem('readNotifications')
    if (!raw) return
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      readNotificationIds.value = new Set(parsed.filter((id) => typeof id === 'string'))
    }
  } catch {
    readNotificationIds.value = new Set()
  }
}

function persistReadNotifications() {
  localStorage.setItem('readNotifications', JSON.stringify([...readNotificationIds.value]))
}

const upcomingCount = computed(() => auth.me?.counts?.upcoming_sessions_count ?? 0)
const latestUpcomingCreatedAt = computed(
  () => auth.me?.counts?.latest_upcoming_session_created_at ?? null
)
const sessionEvents = computed(() => auth.me?.notifications?.session_events ?? [])
const upcomingUnread = computed(() => {
  const latest = latestUpcomingCreatedAt.value
  if (!isSpecialist.value || !latest) return false
  if (!lastReadUpcomingAt.value) return true
  return new Date(latest).getTime() > new Date(lastReadUpcomingAt.value).getTime()
})

function formatDateTime(value?: string | null) {
  if (!value) return ''
  const dt = new Date(value)
  if (Number.isNaN(dt.getTime())) return value
  return dt.toLocaleString('uk-UA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

const notifications = computed(() => {
  const items: Array<{ id: string; text: string; hint: string; to: string; tone: 'info' | 'warn' | 'ok'; unread: boolean }> = []
  if (isSpecialist.value && sessionEvents.value.length) {
    sessionEvents.value.forEach((event) => {
      const id = `session-event-${event.id}`
      const name = event.client_name || `#${event.client_id}`
      const time = formatDateTime(event.slot_start_at)
      const email = event.client_email ? ` · ${event.client_email}` : ''
      items.push({
        id,
        text: event.event === 'CANCELLED'
          ? `Скасування сесії від ${name}`
          : `Нове бронювання від ${name}`,
        hint: time ? `Сесія: ${time}${email}` : `Перевірте деталі сесії${email}`,
        to: `/cabinet/sessions#session-${event.session_id}`,
        tone: event.event === 'CANCELLED' ? 'warn' : 'ok',
        unread: !readNotificationIds.value.has(id),
      })
    })
  }
  const accessState = auth.me?.access_state
  const activeCount = auth.me?.counts?.active_clients ?? 0
  const activeLimit = auth.me?.effective_entitlements?.active_client_limit
  if (accessState === 'GRACE') {
    items.push({
      id: 'access-grace',
      text: 'Оплата потребує уваги',
      hint: 'Доступ тимчасово збережено.',
      to: '/cabinet/billing',
      tone: 'warn',
      unread: !readNotificationIds.value.has('access-grace'),
    })
  }
  if (accessState === 'RESTRICTED') {
    items.push({
      id: 'access-restricted',
      text: 'Обмежений режим доступу',
      hint: 'Нові дії заблоковані.',
      to: '/cabinet/billing',
      tone: 'warn',
      unread: !readNotificationIds.value.has('access-restricted'),
    })
  }
  if (typeof activeLimit === 'number' && activeCount > activeLimit) {
      items.push({
        id: 'over-limit',
        text: 'Перевищено ліміт активних клієнтів',
        hint: 'Нові підтвердження тимчасово заблоковані.',
        to: '/cabinet/billing',
        tone: 'warn',
        unread: !readNotificationIds.value.has('over-limit'),
      })
  }
  if (isSpecialist.value && upcomingCount.value > 0) {
    items.push({
      id: 'upcoming-sessions',
      text: 'Є заплановані сесії',
      hint: 'Перевірте список найближчих сесій.',
      to: '/cabinet/sessions',
      tone: 'ok',
      unread: upcomingUnread.value,
    })
  }
  return items
})

const unreadNotifications = computed(() => notifications.value.filter((item) => item.unread))
const notificationCount = computed(() => unreadNotifications.value.length)

function toggleNotifications() {
  showNotifications.value = !showNotifications.value
}

function markNotificationRead(id: string) {
  if (!id) return
  if (id === 'upcoming-sessions') {
    const latest = latestUpcomingCreatedAt.value
    lastReadUpcomingAt.value = latest || new Date().toISOString()
    persistUpcomingReadAt()
  }
  const next = new Set(readNotificationIds.value)
  next.add(id)
  readNotificationIds.value = next
  persistReadNotifications()
  showNotifications.value = false
}

function onLogout() {
  auth.logout()
  router.push('/')
}

watch(
  () => route.fullPath,
  () => {
    showNotifications.value = false
  }
)

watch(showNotifications, (value) => {
  if (value) {
    refreshMe()
  }
})

async function refreshMe() {
  if (!isAuthenticated.value) return
  try {
    await auth.loadMe()
  } catch {
    // ignore refresh errors
  }
}

async function refreshChatUnread() {
  if (!isAuthenticated.value) return
  try {
    const resp = await fetchChatUnreadCount()
    chatUnreadCount.value = resp.unread_count ?? 0
  } catch {
    chatUnreadCount.value = 0
  }
}

function startMePolling() {
  if (refreshIntervalId.value !== null) return
  refreshMe()
  refreshIntervalId.value = window.setInterval(() => {
    refreshMe()
  }, 60000)
}

function stopMePolling() {
  if (refreshIntervalId.value === null) return
  window.clearInterval(refreshIntervalId.value)
  refreshIntervalId.value = null
}

function startChatPolling() {
  if (chatIntervalId.value !== null) return
  refreshChatUnread()
  chatIntervalId.value = window.setInterval(() => {
    refreshChatUnread()
  }, 5000)
}

function stopChatPolling() {
  if (chatIntervalId.value === null) return
  window.clearInterval(chatIntervalId.value)
  chatIntervalId.value = null
}

function handleVisibilityChange() {
  if (document.visibilityState === 'visible') {
    refreshMe()
  }
}

watch(
  notifications,
  (items) => {
    const ids = new Set(items.map((item) => item.id))
    if (lastNotificationIds.value.size === 0) {
      lastNotificationIds.value = ids
      return
    }
    let hasNew = false
    ids.forEach((id) => {
      if (!lastNotificationIds.value.has(id)) {
        hasNew = true
      }
    })
    if (hasNew) {
      const next = new Set(readNotificationIds.value)
      ids.forEach((id) => {
        if (!lastNotificationIds.value.has(id)) {
          next.delete(id)
        }
      })
      readNotificationIds.value = next
      persistReadNotifications()
    }
    lastNotificationIds.value = ids
  },
  { immediate: true }
)


function handleGlobalClick(event: MouseEvent) {
  if (!showNotifications.value) return
  const target = event.target as Node
  const button = notificationsButtonRef.value
  const panel = notificationsPanelRef.value
  if (button && button.contains(target)) return
  if (panel && panel.contains(target)) return
  showNotifications.value = false
}

onMounted(() => {
  if (isAuthenticated.value) {
    startMePolling()
    startChatPolling()
  }
  document.addEventListener('click', handleGlobalClick)
  document.addEventListener('visibilitychange', handleVisibilityChange)
})

onBeforeUnmount(() => {
  stopMePolling()
  stopChatPolling()
  document.removeEventListener('click', handleGlobalClick)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})

watch(isAuthenticated, (value) => {
  if (value) {
    startMePolling()
    startChatPolling()
  } else {
    stopMePolling()
    stopChatPolling()
  }
})

function loadUpcomingCount() {
  const raw = localStorage.getItem('lastUpcomingSessionsCount')
  const value = raw ? Number(raw) : 0
  lastUpcomingCount.value = Number.isFinite(value) ? value : 0
}

function persistUpcomingCount(value: number) {
  localStorage.setItem('lastUpcomingSessionsCount', String(value))
}

function loadUpcomingReadAt() {
  const raw = localStorage.getItem('lastReadUpcomingSessionAt')
  lastReadUpcomingAt.value = raw || ''
}

function persistUpcomingReadAt() {
  localStorage.setItem('lastReadUpcomingSessionAt', lastReadUpcomingAt.value)
}

watch(
  upcomingCount,
  (value) => {
    const previous = lastUpcomingCount.value
    if (value > previous) {
      const next = new Set(readNotificationIds.value)
      next.delete('upcoming-sessions')
      readNotificationIds.value = next
      persistReadNotifications()
    }
    lastUpcomingCount.value = value
    persistUpcomingCount(value)
  },
  { immediate: true }
)

loadReadNotifications()
loadUpcomingCount()
loadUpcomingReadAt()
</script>

<style scoped>
.shell {
  max-width: none;
  margin: 0 auto;
  padding: 0 24px 48px;
  display: grid;
  gap: 24px;
}

.shell--home {
  max-width: none;
  padding: 0;
  display: block;
  height: auto;
  overflow: visible;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  position: relative;
  z-index: 10;
  background: var(--topbar-bg);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--topbar-border);
  color: var(--topbar-text);
  width: 100%;
  padding: 12px 24px;
}

.topbar--specialist,
.topbar--therapist {
  background: var(--topbar-bg);
  border-bottom-color: var(--topbar-border);
}

.topbar--client {
  background: var(--topbar-bg);
  border-bottom-color: var(--topbar-border);
}

.topbar--overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
}

.brand {
  display: grid;
  gap: 2px;
  color: inherit;
}

.brand__mark {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 22px;
  letter-spacing: 0.4px;
}

.brand__tagline {
  font-size: 12px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--topbar-text) 70%, transparent);
}

.topbar--overlay .brand {
  position: static;
  transform: none;
  text-align: left;
}

.nav {
  display: flex;
  gap: 10px;
  font-weight: 300;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.nav a {
  padding: 3px 9px;
  min-height: 28px;
  border-radius: 6px;
  border: 1px solid color-mix(in srgb, var(--topbar-text) 22%, transparent);
  color: var(--topbar-text);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  background: color-mix(in srgb, var(--topbar-text) 6%, transparent);
  transition: border-color 0.2s ease, background 0.2s ease;
}

.nav a.icon-btn {
  padding: 0;
}

.nav a.router-link-active {
  border-color: color-mix(in srgb, var(--topbar-text) 48%, transparent);
  background: color-mix(in srgb, var(--topbar-text) 20%, transparent);
}

.nav :deep(a.nav-link--active) {
  border-color: color-mix(in srgb, var(--topbar-text) 48%, transparent);
  background: color-mix(in srgb, var(--topbar-text) 20%, transparent);
}

.nav a:hover {
  border-color: color-mix(in srgb, var(--topbar-text) 55%, transparent);
  background: color-mix(in srgb, var(--topbar-text) 24%, transparent);
}

.nav__notifications {
  position: relative;
}

.icon-btn {
  position: relative;
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  border-radius: 6px;
  border: 1px solid color-mix(in srgb, var(--topbar-text) 25%, transparent);
  color: var(--topbar-text);
  background: color-mix(in srgb, var(--topbar-text) 8%, transparent);
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}

.icon-btn svg {
  width: 14px;
  height: 14px;
}

.icon-btn:hover,
.icon-btn:focus-visible {
  border-color: color-mix(in srgb, var(--topbar-text) 55%, transparent);
  background: color-mix(in srgb, var(--topbar-text) 16%, transparent);
  box-shadow: 0 6px 12px rgba(12, 26, 36, 0.18);
}

.icon-btn__badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: #e56b6f;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  min-width: 16px;
  height: 16px;
  display: grid;
  place-items: center;
  border-radius: var(--radius-pill);
}

.topbar .btn--ghost {
  min-height: 28px;
  padding: 3px 9px;
  border-radius: 6px;
  color: var(--topbar-text);
  border-color: color-mix(in srgb, var(--topbar-text) 35%, transparent);
  background: color-mix(in srgb, var(--topbar-text) 10%, transparent);
}

.topbar .btn--ghost:hover,
.topbar .btn--ghost:focus-visible {
  border-color: color-mix(in srgb, var(--topbar-text) 55%, transparent);
  background: color-mix(in srgb, var(--topbar-text) 18%, transparent);
}

.topbar .btn--ghost:active {
  background: color-mix(in srgb, var(--topbar-text) 24%, transparent);
}

.notif-panel {
  position: absolute;
  right: 0;
  top: calc(100% + 8px);
  width: 270px;
  background: #fff;
  color: var(--ink);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  box-shadow: 0 18px 32px rgba(16, 33, 50, 0.16);
  padding: 10px;
  z-index: 20;
}

.notif-panel__title {
  font-weight: 600;
  margin-bottom: 8px;
}

.notif-panel .muted {
  color: var(--muted);
}

.notif-list {
  display: grid;
  gap: 8px;
}

.notif-item {
  display: grid;
  grid-template-columns: 10px 1fr;
  gap: 10px;
  text-decoration: none;
  color: inherit;
  padding: 8px;
  border-radius: var(--radius-sm);
  background: color-mix(in srgb, var(--primary) 6%, transparent);
}

.notif-item:hover {
  background: color-mix(in srgb, var(--primary) 10%, transparent);
}

.notif-item--read .notif-item__text {
  color: color-mix(in srgb, var(--text) 75%, transparent);
  font-weight: 500;
}

.notif-item--read .notif-item__dot {
  background: color-mix(in srgb, var(--text) 35%, transparent);
}

.notif-item__dot {
  width: 8px;
  height: 8px;
  border-radius: var(--radius-pill);
  margin-top: 6px;
  background: #7a8d9c;
}

.notif-item__dot--warn {
  background: #d9a441;
}

.notif-item__dot--ok {
  background: #1f7a4c;
}

.notif-item__dot--info {
  background: #3b7db6;
}

.notif-item__text {
  font-weight: 600;
  font-size: 13px;
  color: var(--text);
}

.notif-item__hint {
  font-size: 12px;
  color: var(--muted);
}

.main {
  min-height: 320px;
  width: 80%;
  margin: 0 auto;
}

.main--home {
  min-height: 100vh;
  width: 100%;
  margin: 0;
  height: auto;
  overflow: visible;
}

body.body--home .footer {
  position: static;
  margin: 0;
  padding: 12px 24px 0;
  z-index: auto;
  border-top: 1px solid var(--border);
  background: transparent;
  backdrop-filter: none;
  color: var(--muted);
  font-size: 12px;
}

.footer {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--border);
  color: var(--muted);
  font-size: 12px;
  flex-wrap: wrap;
}

.footer__meta {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.footer__link {
  color: inherit;
  text-decoration: underline;
  text-decoration-color: color-mix(in srgb, var(--text) 35%, transparent);
}

.footer__link:hover {
  text-decoration-color: color-mix(in srgb, var(--text) 70%, transparent);
}
</style>
