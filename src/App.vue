<template>
  <div :class="['shell', { 'shell--home': isHome }]">
    <header :class="topbarClass">
      <RouterLink class="brand" to="/">
        <div class="brand__mark">Pro Consult</div>
        <div class="brand__tagline">Простір для спеціалістів</div>
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
                :disabled="notificationsReadAllPending"
                @click="markAllNotificationsRead"
              >
                {{ notificationsReadAllPending ? 'Оновлюємо...' : 'Прочитати все' }}
              </button>
            </div>
            <div v-if="notificationsLoading && !notificationsLoaded" class="muted">Завантаження...</div>
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
                  @click="markNotificationRead(item)"
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
                    @click.stop="markNotificationRead(item)"
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
    </header>

    <main :class="['main', { 'main--home': isHome }]">
      <RouterView :key="route.fullPath" />
    </main>
    <ToastHost />
    <footer class="footer">
      <div class="footer__brand">
        <span>Pro Consult — Простір для спеціалістів</span>
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
import {
  apiGet,
  fetchChatUnreadCount,
  fetchNotifications,
  markAllNotificationsRead as markAllNotificationsReadApi,
  markNotificationRead as markNotificationReadApi,
  type NotificationFeedItem,
} from './lib/api'
import { formatUkDateTimeCompact } from './lib/dateTime'
import { canJoinExternalMeeting, normalizeMeetingUrl } from './lib/sessionExecution'
import { useToast } from './composables/useToast'

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

type BellNotification = {
  id: string
  text: string
  hint: string
  to: string
  join_url: string | null
  tone: 'info' | 'warn' | 'ok'
  unread: boolean
  source_kind: string | null
  source_id: number | null
}

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
const notificationsFeed = ref<NotificationFeedItem[]>([])
const notificationsLoaded = ref(false)
const notificationsLoading = ref(false)
const notificationsReadAllPending = ref(false)
const notificationsPendingIds = ref<Set<string>>(new Set())
const refreshIntervalId = ref<number | null>(null)
const notificationsIntervalId = ref<number | null>(null)
const chatIntervalId = ref<number | null>(null)
const preSessionToastIntervalId = ref<number | null>(null)
const chatUnreadCount = ref(0)
const toast = useToast()
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

      const actions = [
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

function formatDateTime(value?: string | null) {
  return formatUkDateTimeCompact(value, '')
}

function notificationClientLabel(item: NotificationFeedItem) {
  if (item.client_name) return item.client_name
  if (item.client_id !== null && item.client_id !== undefined) return `#${item.client_id}`
  return 'клієнта'
}

function notificationCounterpartyLabel(item: NotificationFeedItem) {
  if (item.counterparty_name) return item.counterparty_name
  if (item.counterparty_id !== null && item.counterparty_id !== undefined) return `#${item.counterparty_id}`
  if (item.specialist_name) return item.specialist_name
  if (item.client_name) return item.client_name
  return isClient.value ? 'спеціаліста' : 'клієнта'
}

function notificationPreview(item: NotificationFeedItem) {
  const preview = item.preview?.trim()
  return preview || 'Відкрийте запит, щоб переглянути деталі.'
}

function notificationJoinUrl(item: NotificationFeedItem) {
  const url = normalizeMeetingUrl(item.meeting_url)
  if (!url) return null
  if (item.source_kind === 'inquiry_message' || item.source_kind === 'reschedule_request') return null
  if (item.source_kind === 'session_event' && item.code === 'CANCELLED') return null
  return url
}

function notificationTone(item: NotificationFeedItem): BellNotification['tone'] {
  if (item.source_kind === 'inquiry_message') return 'info'
  if (item.source_kind === 'reschedule_request' || item.code === 'RESCHEDULE_REQUESTED') return 'warn'
  if (item.source_kind === 'session_event' && item.code === 'RESCHEDULED') return 'ok'
  if (item.source_kind === 'session_event' && item.code === 'CANCELLED') return 'warn'
  if (item.source_kind === 'session_event' && item.code === 'BOOKED') return 'ok'
  return 'info'
}

function notificationText(item: NotificationFeedItem) {
  const clientLabel = notificationClientLabel(item)
  const counterpartyLabel = notificationCounterpartyLabel(item)
  if (item.source_kind === 'inquiry_message') {
    if (item.code === 'INQUIRY_CREATED') return `Запит до бронювання від ${counterpartyLabel}`
    if (item.code === 'INQUIRY_REPLIED') return `Відповідь на запит від ${counterpartyLabel}`
    if (item.code === 'INQUIRY_FOLLOWED_UP') return `Уточнення до запиту від ${counterpartyLabel}`
    return `Оновлення запиту до бронювання від ${counterpartyLabel}`
  }
  if (item.source_kind === 'reschedule_request' || item.code === 'RESCHEDULE_REQUESTED') {
    return `Перенесення: ${clientLabel} просить змінити час сесії`
  }
  if (item.source_kind === 'session_event') {
    if (item.code === 'CANCELLED') return `Бронювання: скасування сесії від ${clientLabel}`
    if (item.code === 'CONFIRMED') return `Бронювання: сесію з ${clientLabel} підтверджено`
    if (item.code === 'BOOKED') return `Бронювання: нова сесія від ${clientLabel}`
    if (item.code === 'RESCHEDULED') return 'Перенесення: новий час сесії підтверджено'
    return `Оновлення по сесії від ${clientLabel}`
  }
  if (item.code === 'session_starts_1h') {
    if (notificationJoinUrl(item)) {
      return `РќР°РіР°РґСѓРІР°РЅРЅСЏ: РѕРЅР»Р°Р№РЅ-Р·СѓСЃС‚СЂС–С‡ Р· ${clientLabel} РїРѕС‡РёРЅР°С”С‚СЊСЃСЏ Р·Р° 1 РіРѕРґРёРЅСѓ`
    }
    return `Нагадування: сесія з ${clientLabel} починається за 1 годину`
  }
  if (item.code === 'session_starts_24h') {
    if (notificationJoinUrl(item)) {
      return `РќР°РіР°РґСѓРІР°РЅРЅСЏ: РѕРЅР»Р°Р№РЅ-Р·СѓСЃС‚СЂС–С‡ Р· ${clientLabel} РїРѕС‡РёРЅР°С”С‚СЊСЃСЏ Р·Р° 24 РіРѕРґРёРЅРё`
    }
    return `Нагадування: сесія з ${clientLabel} починається за 24 години`
  }
  return `Нагадування про сесію з ${clientLabel}`
}

function notificationHint(item: NotificationFeedItem) {
  const email = item.client_email ? ` · ${item.client_email}` : ''
  const time = formatDateTime(item.slot_start_at)
  if (item.source_kind === 'inquiry_message') {
    return notificationPreview(item)
  }
  if (item.source_kind === 'reschedule_request' || item.code === 'RESCHEDULE_REQUESTED') {
    return time ? `Запитаний час: ${time}${email}` : `Перевірте деталі запиту на перенесення${email}`
  }
  if (item.source_kind === 'session_event' && item.code === 'RESCHEDULED') {
    return time ? `Новий час: ${time}${email}` : `Перевірте оновлений час сесії${email}`
  }
  if (item.source_kind === 'session_event') {
    return time ? `Сесія: ${time}${email}` : `Перевірте деталі сесії${email}`
  }
  return time ? `Час сесії: ${time}${email}` : `Перевірте деталі сесії${email}`
}

function notificationTarget(item: NotificationFeedItem) {
  if (item.source_kind === 'inquiry_message') {
    if (isClient.value) {
      return item.specialist_id ? `/client/inquiries/${item.specialist_id}` : '/specialists'
    }
    const query = item.thread_id ? `?thread_id=${item.thread_id}` : ''
    return `/cabinet/inquiries${query}`
  }
  if (isClient.value) {
    return item.session_id ? `/client/sessions/${item.session_id}` : '/client'
  }
  return item.session_id ? `/cabinet/sessions/${item.session_id}` : '/cabinet/sessions'
}

const serverNotifications = computed<BellNotification[]>(() =>
  notificationsFeed.value.map((item) => ({
    id: item.id,
    text: notificationText(item),
    hint: notificationHint(item),
    to: notificationTarget(item),
    join_url: notificationJoinUrl(item),
    tone: notificationTone(item),
    unread: !item.read_at,
    source_kind: item.source_kind,
    source_id: item.source_id,
  }))
)

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

const notifications = computed(() => [...serverNotifications.value, ...supplementalNotifications.value])
const unreadNotifications = computed(() => serverNotifications.value.filter((item) => item.unread))
const notificationCount = computed(() => unreadNotifications.value.length)

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

async function markNotificationRead(item: BellNotification) {
  if (!item.source_kind || item.source_id === null) {
    showNotifications.value = false
    return
  }
  if (notificationsPendingIds.value.has(item.id)) return
  notificationsFeed.value = notificationsFeed.value.map((entry) =>
    entry.id === item.id ? { ...entry, read_at: entry.read_at || new Date().toISOString() } : entry
  )
  notificationsPendingIds.value = new Set(notificationsPendingIds.value).add(item.id)
  showNotifications.value = false
  try {
    const resp = await markNotificationReadApi({
      source_kind: item.source_kind,
      source_id: item.source_id,
    })
    notificationsFeed.value = notificationsFeed.value.map((entry) =>
      entry.source_kind === resp.source_kind && entry.source_id === resp.source_id
        ? { ...entry, read_at: resp.read_at }
        : entry
    )
  } catch {
    await refreshNotifications()
    toast.error('Не вдалося позначити сповіщення як прочитане.')
  } finally {
    const next = new Set(notificationsPendingIds.value)
    next.delete(item.id)
    notificationsPendingIds.value = next
  }
}

async function markAllNotificationsRead() {
  if (!notificationCount.value || notificationsReadAllPending.value) return
  notificationsReadAllPending.value = true
  const optimisticReadAt = new Date().toISOString()
  notificationsFeed.value = notificationsFeed.value.map((entry) => ({
    ...entry,
    read_at: entry.read_at || optimisticReadAt,
  }))
  try {
    await markAllNotificationsReadApi()
    await refreshNotifications()
  } catch {
    await refreshNotifications()
    toast.error('Не вдалося позначити всі сповіщення як прочитані.')
  } finally {
    notificationsReadAllPending.value = false
  }
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
    refreshNotifications()
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

async function refreshNotifications() {
  if (!isAuthenticated.value) return
  notificationsLoading.value = true
  try {
    const resp = await fetchNotifications({ limit: 20 })
    notificationsFeed.value = resp.results || []
    notificationsLoaded.value = true
  } catch {
    if (!notificationsLoaded.value) {
      notificationsFeed.value = []
    }
  } finally {
    notificationsLoading.value = false
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

function startNotificationsPolling() {
  if (notificationsIntervalId.value !== null) return
  refreshNotifications()
  notificationsIntervalId.value = window.setInterval(() => {
    refreshNotifications()
  }, 60000)
}

function stopNotificationsPolling() {
  if (notificationsIntervalId.value === null) return
  window.clearInterval(notificationsIntervalId.value)
  notificationsIntervalId.value = null
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
    refreshNotifications()
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
    startNotificationsPolling()
    startChatPolling()
    startPreSessionToastPolling()
  }
  document.addEventListener('click', handleGlobalClick)
  document.addEventListener('keydown', handleGlobalKeydown)
  document.addEventListener('visibilitychange', handleVisibilityChange)
})

onBeforeUnmount(() => {
  stopMePolling()
  stopNotificationsPolling()
  stopChatPolling()
  stopPreSessionToastPolling()
  document.removeEventListener('click', handleGlobalClick)
  document.removeEventListener('keydown', handleGlobalKeydown)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})

watch(isAuthenticated, (value) => {
  if (value) {
    startMePolling()
    startNotificationsPolling()
    startChatPolling()
    startPreSessionToastPolling()
  } else {
    stopMePolling()
    stopNotificationsPolling()
    stopChatPolling()
    stopPreSessionToastPolling()
    notificationsFeed.value = []
    notificationsLoaded.value = false
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
  gap: 12px;
  font-weight: 300;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.nav__primary-action {
  font-weight: 500;
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
  padding: 4px 12px;
  min-height: 32px;
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
  border: 1px solid color-mix(in srgb, var(--topbar-text) 25%, transparent);
  color: var(--topbar-text);
  background: color-mix(in srgb, var(--topbar-text) 8%, transparent);
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}

.icon-btn svg {
  width: 16px;
  height: 16px;
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
  min-height: 32px;
  padding: 4px 12px;
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
  .topbar {
    align-items: flex-start;
    gap: 10px;
  }

  .nav {
    gap: 10px;
  }
}

@media (max-width: 640px) {
  .topbar {
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    position: sticky;
    top: 0;
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

  .topbar {
    padding: 10px 12px;
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

