<template>
  <div :class="['shell', { 'shell--home': isHome }]">
    <header :class="topbarClass">
      <div class="topbar__inner">
        <RouterLink class="brand" to="/">
          <div class="brand__mark">Pro Consult</div>
          <div class="brand__tagline">Простір для вашої справи</div>
        </RouterLink>
        <nav class="nav">
        <RouterLink v-if="isAuthenticated" class="nav__primary-action" :to="cabinetRoute">{{ cabinetLabel }}</RouterLink>
        <RouterLink v-if="showCatalogNav" class="nav__desktop-only" to="/specialists">Каталог</RouterLink>
        <RouterLink
          v-if="isAuthenticated && isSpecialist"
          class="nav__desktop-only"
          to="/public"
          :class="{ 'nav-link--active': isPublicRoute }"
        >
          Публічний профіль
        </RouterLink>
        <RouterLink v-if="!isAuthenticated" class="nav__desktop-only" :to="{ path: '/', hash: '#features' }">
          Можливості
        </RouterLink>
        <RouterLink v-if="!isAuthenticated" class="nav__desktop-only" :to="{ path: '/', hash: '#pricing' }">
          Тарифи
        </RouterLink>
        <RouterLink v-if="!isAuthenticated" to="/login">Вхід</RouterLink>
        <RouterLink v-if="!isAuthenticated" to="/signup">Реєстрація</RouterLink>
        <RouterLink
          v-if="isAuthenticated"
          class="icon-btn nav__desktop-only"
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
        <div v-if="isAuthenticated && isSpecialist" class="nav__settings nav__desktop-only">
          <button
            ref="settingsButtonRef"
            class="icon-btn"
            type="button"
            aria-label="Налаштування"
            aria-haspopup="menu"
            :aria-expanded="showSettings ? 'true' : 'false'"
            @click="toggleSettings"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M19.14 12.94a7.9 7.9 0 0 0 .06-.94 7.9 7.9 0 0 0-.06-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.2 7.2 0 0 0-1.63-.94L14.4 2.8a.5.5 0 0 0-.5-.4h-3.8a.5.5 0 0 0-.5.4L9.25 5.32a7.2 7.2 0 0 0-1.63.94l-2.39-.96a.5.5 0 0 0-.6.22L2.71 8.84a.5.5 0 0 0 .12.64l2.03 1.58a7.9 7.9 0 0 0-.06.94 7.9 7.9 0 0 0 .06.94L2.83 14.52a.5.5 0 0 0-.12.64l1.92 3.32c.13.22.39.31.6.22l2.39-.96c.5.39 1.05.7 1.63.94l.35 2.52c.04.24.25.4.5.4h3.8c.25 0 .46-.16.5-.4l.35-2.52c.58-.24 1.13-.55 1.63-.94l2.39.96c.22.09.47 0 .6-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58zM12 15.5A3.5 3.5 0 1 1 12 8.5a3.5 3.5 0 0 1 0 7z"
                fill="currentColor"
              />
            </svg>
          </button>
          <div v-if="showSettings" ref="settingsPanelRef" class="settings-menu" role="menu">
            <RouterLink class="settings-menu__item" to="/cabinet/settings" @click="showSettings = false">
              Усі налаштування
            </RouterLink>
            <RouterLink class="settings-menu__item" to="/cabinet/profile" @click="showSettings = false">
              Профіль
            </RouterLink>
            <RouterLink
              class="settings-menu__item"
              to="/cabinet/settings/notifications"
              @click="showSettings = false"
            >
              Сповіщення
            </RouterLink>
            <RouterLink class="settings-menu__item" to="/cabinet/billing" @click="showSettings = false">
              Плани та доступ
            </RouterLink>
          </div>
        </div>
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
            <div class="notif-panel__header">
              <div class="notif-panel__title">Сповіщення</div>
              <button
                v-if="notificationCount"
                class="btn btn--ghost btn--sm notif-panel__action"
                type="button"
                :disabled="notifs.readAllPending.value"
                @click="notifs.markAllRead"
              >
                {{ notifs.readAllPending.value ? 'Оновлюємо...' : 'Прочитати все' }}
              </button>
            </div>
            <div v-if="notifs.loading.value && !notifs.loaded.value" class="muted">Завантаження...</div>
            <div v-else-if="notifications.length === 0" class="muted">Немає нових сповіщень.</div>
            <div v-else class="notif-list">
              <article
                v-for="item in notifications"
                :key="item.id"
                class="notif-item-shell"
              >
                <RouterLink
                  class="notif-item"
                  :class="{ 'notif-item--read': !item.unread }"
                  :to="item.to"
                  @click="onMarkNotificationRead(item)"
                >
                  <span class="notif-item__dot" :class="`notif-item__dot--${item.tone}`"></span>
                  <div>
                    <div class="notif-item__text">{{ item.text }}</div>
                    <div class="muted notif-item__hint">{{ item.hint }}</div>
                  </div>
                </RouterLink>
                <div v-if="item.join_url" class="notif-item__actions">
                  <a
                    class="btn btn--ghost btn--sm"
                    :href="item.join_url"
                    target="_blank"
                    rel="noopener noreferrer"
                    @click.stop="onMarkNotificationRead(item)"
                  >
                    Приєднатися
                  </a>
                </div>
              </article>
            </div>
          </div>
        </div>
        <button
          v-if="isAuthenticated"
          ref="mobileMenuButtonRef"
          class="icon-btn nav__mobile-only"
          type="button"
          aria-label="Меню"
          aria-haspopup="menu"
          :aria-expanded="showMobileMenu ? 'true' : 'false'"
          @click="toggleMobileMenu"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M4 7h16M4 12h16M4 17h16"
              fill="none"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-width="2"
            />
          </svg>
        </button>
        <button v-if="isAuthenticated" class="btn btn--ghost nav__desktop-only" type="button" @click="onLogout">
          Вийти
        </button>
        <div v-if="isAuthenticated && showMobileMenu" ref="mobileMenuPanelRef" class="mobile-menu" role="menu">
          <RouterLink class="mobile-menu__item" :to="cabinetRoute" @click="closeMobileMenu">{{ cabinetLabel }}</RouterLink>
          <RouterLink v-if="isSpecialist" class="mobile-menu__item" to="/public" @click="closeMobileMenu">
            Публічний профіль
          </RouterLink>
          <button
            v-if="isSpecialist"
            type="button"
            class="mobile-menu__item mobile-menu__item--button"
            @click="openSettingsSheetFromMenu"
          >
            Налаштування
          </button>
          <RouterLink class="mobile-menu__item" :to="chatRoute" @click="closeMobileMenu">Чат</RouterLink>
          <button type="button" class="mobile-menu__item mobile-menu__item--button" @click="onLogoutFromMenu">
            Вийти
          </button>
        </div>
        </nav>
        <div
          v-if="isAuthenticated && isSpecialist && showSettings"
          ref="settingsSheetRef"
          class="settings-sheet nav__mobile-only"
        >
          <RouterLink class="settings-sheet__item" to="/cabinet/settings" @click="showSettings = false">
            Усі налаштування
          </RouterLink>
          <RouterLink class="settings-sheet__item" to="/cabinet/profile" @click="showSettings = false">
            Профіль
          </RouterLink>
          <RouterLink class="settings-sheet__item" to="/cabinet/settings/notifications" @click="showSettings = false">
            Сповіщення
          </RouterLink>
          <RouterLink class="settings-sheet__item" to="/cabinet/billing" @click="showSettings = false">
            Плани та доступ
          </RouterLink>
        </div>
      </div>
    </header>

    <main :class="['main', { 'main--home': isHome }]">
      <RouterView :key="route.fullPath" />
    </main>
    <ToastHost />
    <footer class="footer">
      <div class="footer__brand">
        <span>Pro Consult — Простір для вашої справи</span>
        <RouterLink class="footer__link" to="/faq">FAQ</RouterLink>
      </div>
      <div class="footer__meta">
        <span>Без комісій. Без посередників. З повагою до практики.</span>
      </div>
      <div class="footer__legal">
        <RouterLink class="footer__link" to="/terms">Умови користування</RouterLink>
        <RouterLink class="footer__link" to="/privacy">Політика конфіденційності</RouterLink>
        <RouterLink class="footer__link" to="/disclaimer">Дисклеймер</RouterLink>
        <RouterLink class="footer__link" to="/support-and-data-requests">Підтримка та запити щодо даних</RouterLink>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from './stores/auth'
import ToastHost from './components/ToastHost.vue'
import { apiGet, fetchChatUnreadCount } from './lib/api'
import { normalizeMeetingUrl, canJoinExternalMeeting } from './lib/sessionExecution'
import { useToast } from './composables/useToast'
import { useNotifications, type BellNotification } from './composables/useNotifications'
import type { ToastAction } from './stores/toast'

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
  if (isClient.value) return 'Кабінет'
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

type UpcomingSessionReminder = {
  id: number
  status: string
  meeting_url?: string | null
  join_available?: boolean
  slot?: { start_at?: string | null } | number | null
  slot_start_at?: string | null
}

const PRE_SESSION_TOAST_WINDOW_MS = 5 * 60 * 1000
const PRE_SESSION_TOAST_POLL_MS = 60 * 1000
const PRE_SESSION_TOAST_STORAGE_KEY = 'consult.pre_session_toast_shown.v1'

const showNotifications = ref(false)
const showSettings = ref(false)
const showMobileMenu = ref(false)
const notificationsButtonRef = ref<HTMLButtonElement | null>(null)
const notificationsPanelRef = ref<HTMLDivElement | null>(null)
const settingsButtonRef = ref<HTMLButtonElement | null>(null)
const settingsPanelRef = ref<HTMLDivElement | null>(null)
const settingsSheetRef = ref<HTMLDivElement | null>(null)
const mobileMenuButtonRef = ref<HTMLButtonElement | null>(null)
const mobileMenuPanelRef = ref<HTMLDivElement | null>(null)
const refreshIntervalId = ref<number | null>(null)
const chatIntervalId = ref<number | null>(null)
const preSessionToastIntervalId = ref<number | null>(null)
const chatUnreadCount = ref(0)
const toast = useToast()
const notifs = useNotifications({ isClient, isSpecialist })
const shownPreSessionToastKeys = ref<Set<string>>(loadShownPreSessionToastKeys())

const upcomingCount = computed(() => auth.me?.counts?.upcoming_sessions_count ?? 0)

function loadShownPreSessionToastKeys() {
  try {
    const raw = sessionStorage.getItem(PRE_SESSION_TOAST_STORAGE_KEY)
    if (!raw) return new Set<string>()
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return new Set<string>()
    return new Set(parsed.filter((item): item is string => typeof item === 'string'))
  } catch {
    return new Set<string>()
  }
}

function saveShownPreSessionToastKeys(next: Set<string>) {
  try {
    sessionStorage.setItem(PRE_SESSION_TOAST_STORAGE_KEY, JSON.stringify(Array.from(next)))
  } catch {
    // ignore storage errors
  }
}

function reminderSessionStartAt(session: UpcomingSessionReminder) {
  if (session.slot && typeof session.slot === 'object') {
    return session.slot.start_at || session.slot_start_at || null
  }
  return session.slot_start_at || null
}

function reminderKey(session: UpcomingSessionReminder) {
  const rolePrefix = isSpecialist.value ? 'specialist' : isClient.value ? 'client' : 'user'
  const startRaw = reminderSessionStartAt(session)
  const startTimestamp = startRaw ? new Date(startRaw).getTime() : Number.NaN
  const startPart =
    Number.isFinite(startTimestamp) && !Number.isNaN(startTimestamp)
      ? String(startTimestamp)
      : startRaw || 'no-start'
  return `${rolePrefix}:${session.id}:${startPart}`
}

function reminderDetailsRoute(sessionId: number) {
  if (isSpecialist.value) return `/cabinet/sessions/${sessionId}`
  return `/client/sessions/${sessionId}`
}

function reminderMessage() {
  if (isSpecialist.value) return 'За 5 хвилин починається сесія з клієнтом.'
  return 'За 5 хвилин починається ваша сесія.'
}

function reminderJoinAction(session: UpcomingSessionReminder) {
  const url = normalizeMeetingUrl(session.meeting_url)
  if (!url) return null
  if (session.join_available === false) return null
  if (!canJoinExternalMeeting({ status: session.status, meeting_url: url })) return null
  return {
    label: 'Приєднатися',
    href: url,
    target: '_blank' as const,
  }
}

function shouldShowSessionReminder(session: UpcomingSessionReminder, now: number) {
  if (!['SCHEDULED', 'CONFIRMED'].includes(session.status)) return false
  const startRaw = reminderSessionStartAt(session)
  if (!startRaw) return false
  const start = new Date(startRaw).getTime()
  if (Number.isNaN(start)) return false
  const diff = start - now
  return diff > 0 && diff <= PRE_SESSION_TOAST_WINDOW_MS
}

async function checkUpcomingSessionReminders() {
  if (!isAuthenticated.value) return
  if (!isSpecialist.value && !isClient.value) return

  try {
    const sessions = await apiGet<UpcomingSessionReminder[]>('/booking/sessions/', {
      params: { upcoming: true },
    })
    const now = Date.now()
    const eligible = (sessions || [])
      .filter((session) => shouldShowSessionReminder(session, now))
      .sort((a, b) => {
        const aStart = new Date(reminderSessionStartAt(a) || '').getTime()
        const bStart = new Date(reminderSessionStartAt(b) || '').getTime()
        return aStart - bStart
      })

    eligible.forEach((session) => {
      const key = reminderKey(session)
      if (shownPreSessionToastKeys.value.has(key)) return

      const actions: ToastAction[] = [
        {
          label: 'Відкрити деталі',
          to: reminderDetailsRoute(session.id),
        },
      ]
      const joinAction = reminderJoinAction(session)
      if (joinAction) {
        actions.push(joinAction)
      }

      toast.show({
        type: 'info',
        title: 'Нагадування',
        message: reminderMessage(),
        actions,
        duration: 10000,
      })

      const next = new Set(shownPreSessionToastKeys.value)
      next.add(key)
      shownPreSessionToastKeys.value = next
      saveShownPreSessionToastKeys(next)
    })
  } catch {
    // silent: reminder polling should not block shell behavior
  }
}

// Transitional behavior: until backend emits these as dedicated notifications,
// entitlement and counts-based hints still come from /api/me.
const supplementalNotifications = computed<BellNotification[]>(() => {
  const items: BellNotification[] = []
  const accessState = auth.me?.access_state
  const activeCount = auth.me?.counts?.active_clients ?? 0
  const activeLimit = auth.me?.effective_entitlements?.active_client_limit
  if (accessState === 'GRACE') {
    items.push({
      id: 'hint-access-grace',
      text: 'Оплата потребує уваги',
      hint: 'Доступ тимчасово збережено.',
      to: '/cabinet/billing',
      join_url: null,
      tone: 'warn',
      unread: false,
      source_kind: null,
      source_id: null,
    })
  }
  if (accessState === 'RESTRICTED') {
    items.push({
      id: 'hint-access-restricted',
      text: 'Обмежений режим доступу',
      hint: 'Нові дії заблоковані.',
      to: '/cabinet/billing',
      join_url: null,
      tone: 'warn',
      unread: false,
      source_kind: null,
      source_id: null,
    })
  }
  if (typeof activeLimit === 'number' && activeCount > activeLimit) {
    items.push({
      id: 'hint-over-limit',
      text: 'Перевищено ліміт активних клієнтів',
      hint: 'Нові підтвердження тимчасово заблоковані.',
      to: '/cabinet/billing',
      join_url: null,
      tone: 'warn',
      unread: false,
      source_kind: null,
      source_id: null,
    })
  }
  if (isSpecialist.value && upcomingCount.value > 0) {
    items.push({
      id: 'hint-upcoming-sessions',
      text: 'Є заплановані сесії',
      hint: 'Перевірте список найближчих сесій.',
      to: '/cabinet/sessions',
      join_url: null,
      tone: 'ok',
      unread: false,
      source_kind: null,
      source_id: null,
    })
  }
  return items
})

const notifications = computed(() => [
  ...notifs.items.value.filter((item) => item.unread),
  ...supplementalNotifications.value,
])
const notificationCount = notifs.unreadCount

function toggleNotifications() {
  showSettings.value = false
  showMobileMenu.value = false
  showNotifications.value = !showNotifications.value
}

function toggleSettings() {
  showNotifications.value = false
  showMobileMenu.value = false
  showSettings.value = !showSettings.value
}

function toggleMobileMenu() {
  showNotifications.value = false
  showSettings.value = false
  showMobileMenu.value = !showMobileMenu.value
}

function closeMobileMenu() {
  showMobileMenu.value = false
}

function openSettingsSheetFromMenu() {
  showMobileMenu.value = false
  showSettings.value = true
}

function onLogoutFromMenu() {
  closeMobileMenu()
  onLogout()
}

function onMarkNotificationRead(item: BellNotification) {
  showNotifications.value = false
  notifs.markRead(item)
}

function onLogout() {
  auth.logout()
  router.push('/')
}

watch(
  () => route.fullPath,
  () => {
    showNotifications.value = false
    showSettings.value = false
    showMobileMenu.value = false
  }
)

watch(showNotifications, (value) => {
  if (value) {
    refreshMe()
    notifs.refresh()
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

function startPreSessionToastPolling() {
  if (preSessionToastIntervalId.value !== null) return
  checkUpcomingSessionReminders()
  preSessionToastIntervalId.value = window.setInterval(() => {
    checkUpcomingSessionReminders()
  }, PRE_SESSION_TOAST_POLL_MS)
}

function stopPreSessionToastPolling() {
  if (preSessionToastIntervalId.value === null) return
  window.clearInterval(preSessionToastIntervalId.value)
  preSessionToastIntervalId.value = null
}

function handleVisibilityChange() {
  if (document.visibilityState === 'visible') {
    refreshMe()
    notifs.refresh()
    checkUpcomingSessionReminders()
  }
}


function handleGlobalClick(event: MouseEvent) {
  const target = event.target as Node
  if (showNotifications.value) {
    const button = notificationsButtonRef.value
    const panel = notificationsPanelRef.value
    if (button && button.contains(target)) return
    if (panel && panel.contains(target)) return
    showNotifications.value = false
  }
  if (showSettings.value) {
    const button = settingsButtonRef.value
    const panel = settingsPanelRef.value
    const sheet = settingsSheetRef.value
    if (button && button.contains(target)) return
    if (panel && panel.contains(target)) return
    if (sheet && sheet.contains(target)) return
    showSettings.value = false
  }
  if (showMobileMenu.value) {
    const button = mobileMenuButtonRef.value
    const panel = mobileMenuPanelRef.value
    if (button && button.contains(target)) return
    if (panel && panel.contains(target)) return
    showMobileMenu.value = false
  }
}

function handleGlobalKeydown(event: KeyboardEvent) {
  if (event.key !== 'Escape') return
  showNotifications.value = false
  showSettings.value = false
  showMobileMenu.value = false
}

onMounted(() => {
  if (isAuthenticated.value) {
    startMePolling()
    notifs.startPolling()
    startChatPolling()
    startPreSessionToastPolling()
  }
  document.addEventListener('click', handleGlobalClick)
  document.addEventListener('keydown', handleGlobalKeydown)
  document.addEventListener('visibilitychange', handleVisibilityChange)
})

onBeforeUnmount(() => {
  stopMePolling()
  notifs.stopPolling()
  stopChatPolling()
  stopPreSessionToastPolling()
  document.removeEventListener('click', handleGlobalClick)
  document.removeEventListener('keydown', handleGlobalKeydown)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})

watch(isAuthenticated, (value) => {
  if (value) {
    startMePolling()
    notifs.startPolling()
    startChatPolling()
    startPreSessionToastPolling()
  } else {
    stopMePolling()
    notifs.stopPolling()
    stopChatPolling()
    stopPreSessionToastPolling()
    notifs.reset()
  }
})
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
  position: relative;
  isolation: isolate;
  z-index: 10;
  background:
    radial-gradient(120% 140% at 50% -30%, rgba(255, 255, 255, 0.09), transparent 65%),
    linear-gradient(
      180deg,
      color-mix(in srgb, var(--topbar-bg) 94%, #1d5a4c) 0%,
      color-mix(in srgb, var(--topbar-bg) 98%, #0c2f28) 100%
    );
  backdrop-filter: blur(10px);
  border-bottom: 1px solid color-mix(in srgb, var(--topbar-text) 16%, transparent);
  color: var(--topbar-text);
  width: 100%;
  max-width: none;
  margin: 0;
  border-radius: 0;
  padding: 0;
  box-shadow: 0 10px 24px rgba(8, 24, 20, 0.14);
}

.topbar::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 1px;
  background: linear-gradient(
    90deg,
    color-mix(in srgb, var(--topbar-text) 0%, transparent) 0%,
    color-mix(in srgb, var(--topbar-text) 26%, transparent) 50%,
    color-mix(in srgb, var(--topbar-text) 0%, transparent) 100%
  );
  opacity: 0.55;
  pointer-events: none;
}

.topbar__inner {
  width: 80vw;
  margin: 0 auto;
  min-height: 66px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 13px 0;
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

.topbar--overlay .topbar__inner {
  width: min(1200px, 92vw);
}

.brand {
  display: grid;
  gap: 3px;
  color: inherit;
}

.brand__mark {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 23px;
  letter-spacing: 0.35px;
  line-height: 1;
}

.brand__tagline {
  font-size: 11.5px;
  letter-spacing: 0.16em;
  font-weight: 500;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--topbar-text) 76%, transparent);
  line-height: 1.2;
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

.nav__primary-action {
  font-weight: 540;
}

.nav__desktop-only {
  display: inline-flex;
}

.nav__mobile-only {
  display: none;
}

.icon-btn.nav__mobile-only {
  display: none;
}

.nav a {
  padding: 4px 11px;
  min-height: 32px;
  border-radius: 6px;
  border: 1px solid color-mix(in srgb, var(--topbar-text) 24%, transparent);
  color: var(--topbar-text);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  background:
    linear-gradient(
      180deg,
      color-mix(in srgb, var(--topbar-text) 8%, transparent) 0%,
      color-mix(in srgb, var(--topbar-text) 4%, transparent) 100%
    );
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.07);
  transition: border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}

.nav a.icon-btn {
  padding: 0;
}

.nav a.router-link-active {
  border-color: color-mix(in srgb, var(--topbar-text) 42%, transparent);
  background: color-mix(in srgb, var(--topbar-text) 17%, transparent);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.11),
    0 6px 12px rgba(9, 24, 20, 0.16);
}

.nav :deep(a.nav-link--active) {
  border-color: color-mix(in srgb, var(--topbar-text) 42%, transparent);
  background: color-mix(in srgb, var(--topbar-text) 17%, transparent);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.11),
    0 6px 12px rgba(9, 24, 20, 0.16);
}

.nav a:hover {
  border-color: color-mix(in srgb, var(--topbar-text) 52%, transparent);
  background: color-mix(in srgb, var(--topbar-text) 21%, transparent);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.12),
    0 6px 12px rgba(9, 24, 20, 0.16);
}

.nav a:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--topbar-text) 45%, transparent);
  outline-offset: 2px;
}

.nav__notifications {
  position: relative;
}

.nav__settings {
  position: relative;
}

.mobile-menu {
  display: none;
}

.icon-btn {
  position: relative;
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  border-radius: 6px;
  border: 1px solid color-mix(in srgb, var(--topbar-text) 26%, transparent);
  color: var(--topbar-text);
  background:
    linear-gradient(
      180deg,
      color-mix(in srgb, var(--topbar-text) 8%, transparent) 0%,
      color-mix(in srgb, var(--topbar-text) 4%, transparent) 100%
    );
  cursor: pointer;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.07);
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease, transform 0.2s ease;
}

.icon-btn svg {
  width: 16px;
  height: 16px;
}

.icon-btn:hover,
.icon-btn:focus-visible {
  border-color: color-mix(in srgb, var(--topbar-text) 50%, transparent);
  background: color-mix(in srgb, var(--topbar-text) 15%, transparent);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.12),
    0 6px 12px rgba(12, 26, 36, 0.18);
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
  min-height: 32px;
  padding: 4px 12px;
  border-radius: 6px;
  color: var(--topbar-text);
  border-color: color-mix(in srgb, var(--topbar-text) 30%, transparent);
  background:
    linear-gradient(
      180deg,
      color-mix(in srgb, var(--topbar-text) 10%, transparent) 0%,
      color-mix(in srgb, var(--topbar-text) 5%, transparent) 100%
    );
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.topbar .btn--ghost:hover,
.topbar .btn--ghost:focus-visible {
  border-color: color-mix(in srgb, var(--topbar-text) 50%, transparent);
  background: color-mix(in srgb, var(--topbar-text) 16%, transparent);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.12),
    0 6px 12px rgba(9, 24, 20, 0.14);
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

.settings-menu {
  position: absolute;
  right: 0;
  top: calc(100% + 8px);
  width: 210px;
  background: #fff;
  color: var(--ink);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  box-shadow: 0 18px 32px rgba(16, 33, 50, 0.16);
  padding: 6px;
  z-index: 20;
  display: grid;
  gap: 2px;
}

.settings-menu__item {
  display: block;
  border-radius: 8px;
  padding: 8px 10px;
  text-decoration: none;
  color: var(--text);
  border: 1px solid transparent;
}

.nav .settings-menu__item {
  min-height: auto;
  justify-content: flex-start;
  font-weight: 500;
  color: var(--text);
  background: #fff;
  border: 1px solid transparent;
  padding: 8px 10px;
}

.settings-menu__item:hover {
  background: color-mix(in srgb, var(--primary) 8%, transparent);
  border-color: color-mix(in srgb, var(--primary) 24%, transparent);
}

.nav .settings-menu__item:hover {
  color: var(--text);
  background: color-mix(in srgb, var(--primary) 8%, transparent);
  border-color: color-mix(in srgb, var(--primary) 24%, transparent);
}

.settings-menu__item.router-link-active {
  background: color-mix(in srgb, var(--primary) 12%, transparent);
  border-color: color-mix(in srgb, var(--primary) 30%, transparent);
}

.nav .settings-menu__item.router-link-active {
  color: var(--text);
}

.settings-sheet {
  display: none;
}

.notif-panel__title {
  font-weight: 600;
}

.notif-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
}

.notif-panel .notif-panel__action.btn--ghost {
  flex-shrink: 0;
  color: var(--text);
  border-color: color-mix(in srgb, var(--primary) 22%, var(--border));
  background: color-mix(in srgb, var(--primary) 6%, #ffffff);
}

.notif-panel .notif-panel__action.btn--ghost:hover,
.notif-panel .notif-panel__action.btn--ghost:focus-visible {
  color: var(--text);
  border-color: color-mix(in srgb, var(--primary) 38%, var(--border));
  background: color-mix(in srgb, var(--primary) 12%, #ffffff);
}

.notif-panel .notif-panel__action.btn--ghost:disabled,
.notif-panel .notif-panel__action.btn--ghost[disabled] {
  color: var(--muted);
  border-color: var(--border);
  background: color-mix(in srgb, var(--surface) 85%, #ffffff);
}

.notif-panel .muted {
  color: var(--muted);
}

.notif-list {
  display: grid;
  gap: 8px;
}

.notif-item-shell {
  display: grid;
  gap: 6px;
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

.notif-item__actions {
  display: flex;
  justify-content: flex-end;
}

.notif-panel .notif-item__actions .btn--ghost {
  color: var(--text);
  border-color: color-mix(in srgb, var(--primary) 22%, var(--border));
  background: color-mix(in srgb, var(--primary) 6%, #ffffff);
}

.notif-panel .notif-item__actions .btn--ghost:hover,
.notif-panel .notif-item__actions .btn--ghost:focus-visible {
  color: var(--text);
  border-color: color-mix(in srgb, var(--primary) 38%, var(--border));
  background: color-mix(in srgb, var(--primary) 12%, #ffffff);
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
  color: var(--text-2);
  font-size: 13px;
  font-weight: 400;
  line-height: 1.45;
}

.footer {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--border);
  color: var(--text-2);
  font-size: 13px;
  font-weight: 400;
  line-height: 1.45;
  flex-wrap: wrap;
}

.footer__brand {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.footer__meta {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.footer__legal {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}
.footer__link {
  color: var(--text);
  font-weight: 500;
  text-decoration: underline;
  text-decoration-color: color-mix(in srgb, var(--text) 55%, transparent);
  text-underline-offset: 2px;
}

.footer__link:hover {
  text-decoration-color: color-mix(in srgb, var(--text) 80%, transparent);
}

@media (max-width: 1024px) {
  .topbar__inner {
    align-items: flex-start;
    gap: 10px;
    padding: 12px 0;
  }

  .nav {
    gap: 10px;
  }
}

@media (max-width: 640px) {
  .topbar {
    position: sticky;
    top: 0;
  }

  .topbar__inner {
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    min-height: auto;
    padding: 10px 0 9px;
  }

  .nav__desktop-only {
    display: none !important;
  }

  .nav__mobile-only {
    display: inline-flex;
  }

  .icon-btn.nav__mobile-only {
    display: inline-flex;
  }

  .brand__mark {
    font-size: 20px;
  }

  .brand__tagline {
    font-size: 11px;
    letter-spacing: 0.14em;
  }

  .nav {
    margin-left: auto;
    width: auto;
    justify-content: flex-end;
    gap: 8px;
    flex-wrap: nowrap;
    align-items: center;
  }

  .nav a.nav__primary-action {
    max-width: 124px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .mobile-menu {
    display: grid;
    position: absolute;
    right: 12px;
    top: calc(100% + 8px);
    width: min(280px, calc(100vw - 24px));
    background: #fff;
    border: 1px solid var(--line);
    border-radius: 12px;
    box-shadow: 0 18px 32px rgba(16, 33, 50, 0.18);
    padding: 6px;
    z-index: 24;
  }

  .mobile-menu__item {
    text-decoration: none;
    color: var(--text);
    border: 1px solid transparent;
    border-radius: 8px;
    padding: 8px 10px;
    text-align: left;
    background: #fff;
    font: inherit;
    cursor: pointer;
  }

  .nav .mobile-menu__item {
    min-height: auto;
    justify-content: flex-start;
    color: var(--text);
    background: #fff;
    border: 1px solid transparent;
    padding: 8px 10px;
    font-weight: 500;
  }

  .mobile-menu__item:hover {
    background: color-mix(in srgb, var(--primary) 8%, transparent);
    border-color: color-mix(in srgb, var(--primary) 24%, transparent);
  }

  .nav .mobile-menu__item:hover {
    color: var(--text);
    background: color-mix(in srgb, var(--primary) 8%, transparent);
    border-color: color-mix(in srgb, var(--primary) 24%, transparent);
  }

  .nav .mobile-menu__item.router-link-active {
    color: var(--text);
    background: color-mix(in srgb, var(--primary) 10%, transparent);
    border-color: color-mix(in srgb, var(--primary) 26%, transparent);
  }

  .settings-sheet {
    display: grid;
    gap: 4px;
    margin-top: 6px;
    width: 100%;
    border: 1px solid var(--line);
    border-radius: 12px;
    background: #fff;
    box-shadow: 0 14px 26px rgba(16, 33, 50, 0.14);
    padding: 8px;
  }

  .settings-sheet__item {
    text-decoration: none;
    color: var(--text);
    border: 1px solid transparent;
    border-radius: 8px;
    padding: 8px 10px;
    font-weight: 500;
    background: #fff;
  }

  .settings-sheet__item:hover {
    background: color-mix(in srgb, var(--primary) 8%, transparent);
    border-color: color-mix(in srgb, var(--primary) 24%, transparent);
  }
}
</style>
