<template>
  <section class="cabinet">
    <header class="cabinet__hero">
      <div>
        <h1 class="title cabinet__title">Робоча панель</h1>
        <p class="muted cabinet__subtitle">
          Тут видно найближчі сесії, нові запити та підказки для роботи з практикою.
        </p>
      </div>
      <div v-if="heroSessionsLoading" class="hero-status hero-status--loading">
        Завантажуємо статус найближчої сесії...
      </div>
      <div v-else-if="heroSessionsError" class="hero-status hero-status--error">
        <span>{{ heroSessionsError }}</span>
        <button class="btn btn--ghost btn--sm" type="button" :disabled="heroSessionsLoading" @click="retryHeroSessionsLoad">
          Повторити
        </button>
      </div>
      <RouterLink class="btn cabinet__hero-cta" :to="{ path: '/cabinet/slots', query: { action: 'create-session' } }">
        Створити сесію
      </RouterLink>
    </header>

    <div v-if="me && hasCabinetDataSnapshot" class="cabinet__grid">
      <section v-if="attentionItems.length" class="panel panel--wide panel--attention" aria-label="Потребує уваги">
        <div class="panel__header panel__header--compact">
          <div>
            <h2 class="panel__title panel__title--compact">Потребує уваги</h2>
          </div>
        </div>

        <div class="attention-list">
          <RouterLink
            v-for="item in attentionItems"
            :key="item.key"
            :class="[
              'attention-row',
              `attention-row--${item.tone}`,
              item.heroType ? 'hero-signal' : '',
              item.heroType ? `hero-signal--${item.heroType}` : '',
              item.heroTone ? `hero-signal--${item.heroTone}` : '',
            ]"
            :to="item.to"
          >
            <div class="attention-row__content">
              <div class="attention-row__title">{{ item.title }}</div>
              <div class="attention-row__body">{{ item.body }}</div>
              <div v-if="item.topics.length" class="attention-row__topics" aria-label="Теми запиту">
                <span v-for="topic in item.topics" :key="topic" class="attention-topic">{{ topic }}</span>
              </div>
            </div>
            <a
              v-if="item.key === 'hero-signal' && canShowHeroJoinAction && heroMeetingUrl"
              class="btn btn--sm hero-signal__join"
              :href="heroMeetingUrl"
              target="_blank"
              rel="noopener noreferrer"
              @click.stop
            >
              Приєднатися
            </a>
            <span class="btn btn--sm attention-row__cta">{{ item.label }}</span>
          </RouterLink>
        </div>
      </section>

      <div class="cabinet__work-grid">
        <section class="panel panel--today">
          <div class="panel__header">
            <div>
              <h2 class="panel__title">Сьогодні</h2>
            </div>
          </div>

          <div v-if="workQueueLoading && !workQueueLoaded" class="today-panel__state today-panel__state--loading">
            Завантаження орієнтирів на сьогодні...
          </div>

          <div v-else-if="workQueueError && !workQueueLoaded" class="today-panel__state today-panel__state--error">
            <span>{{ workQueueError }}</span>
            <button
              class="btn btn--ghost btn--sm today-panel__retry"
              type="button"
              :disabled="workQueueLoading"
              @click="retryWorkQueueLoad"
            >
              Повторити
            </button>
          </div>

          <div v-else class="today-panel">
            <div v-if="workQueueError" class="today-panel__inline-error">
              <span>{{ workQueueError }}</span>
              <button
                class="btn btn--ghost btn--sm today-panel__retry"
                type="button"
                :disabled="workQueueLoading"
                @click="retryWorkQueueLoad"
              >
                Повторити
              </button>
            </div>

            <section
              class="today-card today-card--primary"
              :class="{ 'today-card--compact': !nearestUpcomingSession }"
            >
              <div class="today-card__header">
                <div>
                  <h3 class="today-card__title">Найближча сесія сьогодні</h3>
                </div>
                <div v-if="nearestUpcomingSession" class="nearest-session__status" :class="nearestSessionStatusClass">
                  {{ nearestSessionStatusLabel }}
                </div>
              </div>
              <template v-if="nearestUpcomingSession">
                <div class="nearest-session__summary">
                  {{ nearestSessionSummary }}
                </div>
                <div v-if="nearestSessionSecondaryLine" class="muted nearest-session__hint">
                  {{ nearestSessionSecondaryLine }}
                </div>
                <div v-else-if="!isNearestSessionOffline" class="muted nearest-session__hint">
                  {{ nearestSessionOnlineHint }}
                </div>
                <div class="nearest-session__actions">
                  <RouterLink class="btn btn--sm" :to="`/cabinet/sessions/${nearestUpcomingSession.id}`">
                    Відкрити сесію
                  </RouterLink>
                  <a
                    v-if="canJoinNearestSession"
                    class="btn btn--ghost btn--sm"
                    :href="nearestSessionMeetingUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Приєднатися
                  </a>
                  <RouterLink
                    v-else-if="shouldShowAddMeetingLinkAction"
                    class="btn btn--ghost btn--sm"
                    :to="`/cabinet/sessions/${nearestUpcomingSession.id}?focus=meeting_link`"
                  >
                    Додати посилання
                  </RouterLink>
                </div>
              </template>
              <template v-else>
                <h3 class="today-card__title">Сесій сьогодні немає.</h3>
                <p class="muted today-card__empty">
                  Можна перейти до розкладу або створити сесію з верхньої дії.
                </p>
                <div class="nearest-session__actions">
                  <RouterLink class="btn btn--ghost btn--sm" to="/cabinet/slots">
                    Перейти до розкладу
                  </RouterLink>
                </div>
              </template>
            </section>
          </div>
        </section>

        <section class="panel panel--tomorrow">
          <div class="panel__header">
            <div>
              <h2 class="panel__title">Завтра</h2>
            </div>
          </div>

          <div v-if="heroSessionsLoading" class="today-panel__state today-panel__state--loading">
            Завантаження сесій на завтра...
          </div>
          <div v-else-if="heroSessionsError" class="today-panel__state today-panel__state--error">
            {{ heroSessionsError }}
          </div>
          <div v-else-if="tomorrowSessions.length" class="tomorrow-list">
            <RouterLink
              v-for="session in tomorrowSessions"
              :key="session.id"
              class="tomorrow-session"
              :to="`/cabinet/sessions/${session.id}`"
            >
              <div class="tomorrow-session__summary">{{ sessionSummary(session) }}</div>
              <div v-if="sessionSecondaryLine(session)" class="muted tomorrow-session__hint">
                {{ sessionSecondaryLine(session) }}
              </div>
            </RouterLink>
          </div>
          <p v-else class="muted tomorrow-empty">На завтра сесій немає.</p>
        </section>
      </div>
      <section v-if="shouldShowOnboardingBlock" class="panel panel--wide panel--onboarding">
        <div class="panel__header">
          <div>
            <h2 class="panel__title panel__title--compact">Готовність до звернень</h2>
            <div class="panel__meta">{{ readinessCompactStatusLine }}</div>
          </div>
          <div
            class="onboarding-status"
            :class="{
              'onboarding-status--ready': onboardingViewModel?.status === 'ready',
              'onboarding-status--pending': onboardingViewModel?.status === 'closed',
              'onboarding-status--warn': onboardingViewModel?.status === 'needs_completion',
            }"
          >
            {{ onboardingViewModel?.statusLabel }}
          </div>
        </div>

        <div v-if="onboardingLoading && !onboardingViewModel" class="onboarding-loading">
          Завантаження стану профілю...
        </div>

        <div v-else-if="onboardingViewModel" class="onboarding-layout">
          <p v-if="onboardingViewModel.missingSummary" class="onboarding-missing-summary">
            {{ onboardingViewModel.missingSummary }}
          </p>

          <div class="onboarding-details">
            <ol class="onboarding-steps">
              <li
                v-for="step in onboardingViewModel.steps"
                :key="step.key"
                class="onboarding-step-item"
              >
                <RouterLink
                  class="onboarding-check-item"
                  :class="step.done ? 'onboarding-step--done' : 'onboarding-step--pending'"
                  :to="onboardingStepTo(step)"
                >
                  <span class="onboarding-check-item__label">{{ compactOnboardingStepTitle(step) }}</span>
                  <span class="onboarding-step__state">{{ step.done ? 'Готово' : 'Потрібно доповнити' }}</span>
                </RouterLink>
              </li>
            </ol>

            <p class="onboarding-publication-summary">
              {{ onboardingViewModel.publicationSummary }}
            </p>

            <div v-if="onboardingViewModel.warnings.length > 0" class="onboarding-list-wrap onboarding-list-wrap--warning">
              <h3 class="onboarding-list-title">Попередження</h3>
              <ul class="onboarding-list">
                <li v-for="item in onboardingViewModel.warnings" :key="item">{{ item }}</li>
              </ul>
            </div>
          </div>

          <div class="onboarding-actions onboarding-actions--summary">
            <RouterLink
              v-if="onboardingViewModel.primaryCta"
              class="btn"
              :to="onboardingViewModel.primaryCta.to"
            >
              {{ compactPrimaryCtaLabel }}
            </RouterLink>
            <a
              v-if="onboardingViewModel.publicProfileLinkAvailable"
              class="btn btn--ghost btn--sm"
              :href="onboardingPublicProfilePath"
              target="_blank"
              rel="noopener noreferrer"
            >
              Переглянути публічний профіль
            </a>
          </div>
        </div>

        <div v-else-if="onboardingLoadError" class="onboarding-error">
          <span>{{ onboardingLoadError }}</span>
          <button class="btn btn--ghost btn--sm" type="button" :disabled="onboardingLoading" @click="retryOnboardingStateLoad">
            Повторити
          </button>
        </div>
      </section>
      <section class="usage-strip" aria-label="Використання лімітів">
        <div class="usage-strip__item">
          Активні клієнти:
          <strong>{{ activeClientsCount }} використано з {{ activeClientLimitLabel }}</strong>
        </div>
        <div v-if="guestSessionsUsage" class="usage-strip__item">
          Сесії без реєстрації:
          <strong>{{ guestSessionsUsage.used }} використано з {{ guestSessionsUsage.limit }} за поточний період</strong>
        </div>
        <div v-if="isNearLimit" class="usage-strip__warning">Ви наближаєтесь до ліміту плану</div>
        <RouterLink class="btn btn--ghost btn--sm usage-strip__link" to="/cabinet/billing">
          Тарифи і доступ
        </RouterLink>
      </section>
    </div>

    <div v-else-if="me && cabinetDataLoading" class="card cabinet__loading cabinet__details-state">
      Завантаження даних доступу...
    </div>
    <div
      v-else-if="me && cabinetDataError"
      class="card cabinet__loading cabinet__loading--error cabinet__details-state cabinet__details-state--error"
    >
      <p>{{ cabinetDataError }}</p>
      <button
        class="btn btn--ghost btn--sm cabinet__loading-action cabinet__details-action"
        type="button"
        :disabled="cabinetDataLoading"
        @click="retryCabinetDataLoad"
      >
        Повторити
      </button>
    </div>
    <div v-else-if="me" class="card cabinet__loading cabinet__details-state">
      Дані доступу кабінету тимчасово недоступні.
    </div>
    <div v-else-if="profileLoading" class="card cabinet__loading">
      Завантаження профілю...
    </div>
    <div v-else-if="profileError" class="card cabinet__loading cabinet__loading--error">
      <p>{{ profileError }}</p>
      <button
        class="btn btn--ghost btn--sm cabinet__loading-action"
        type="button"
        :disabled="profileLoading"
        @click="retryCabinetProfileLoad"
      >
        Повторити
      </button>
    </div>
    <div v-else class="card cabinet__loading">
      Профіль кабінету тимчасово недоступний.
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import {
  apiGet,
  fetchChatThreads,
  fetchSpecialistOnboardingState,
  requestTopicLabel,
  type ChatThread,
  type SessionFormat,
} from '../lib/api'
import { formatUkDateTimeCompact } from '../lib/dateTime'
import { canJoinExternalMeeting, normalizeMeetingUrl } from '../lib/sessionExecution'
import {
  buildSpecialistOnboardingViewModel,
  normalizeOnboardingState,
  type SpecialistOnboardingViewModel,
} from '../lib/specialistOnboarding'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const { me } = storeToRefs(auth)

type CabinetSession = {
  id: number
  status: string
  client: number
  client_name?: string | null
  client_username?: string | null
  client_display_name?: string | null
  display_name?: string | null
  client_first_name?: string | null
  client_last_name?: string | null
  first_name?: string | null
  last_name?: string | null
  session_format?: SessionFormat | null
  meeting_mode?: 'ONLINE' | 'OFFLINE' | null
  offline_location?: string | null
  meeting_url?: string | null
  join_available?: boolean
  join_starts_at?: string | null
  join_ends_at?: string | null
  slot_start_at?: string | null
  slot_end_at?: string | null
}

type DashboardHeroSignalType =
  | 'live'
  | 'needs_confirmation_now'
  | 'needs_confirmation_soon'
  | 'missing_meeting_link'
  | 'confirmed_soon'

type DashboardHeroSignal = {
  type: DashboardHeroSignalType
  session: CabinetSession
  title: string
  message?: string
  tone: 'live' | 'warning' | 'info'
  to: string
}

type AttentionItem = {
  key: string
  title: string
  label: string
  body: string
  to: string
  tone: 'warning' | 'info' | 'live'
  topics: string[]
  heroType?: DashboardHeroSignalType
  heroTone?: DashboardHeroSignal['tone']
}

type CabinetEntitlementsSnapshot = {
  plan?: string | null
  effective_plan?: string | null
  active_client_limit?: number | null
  active_clients?: number | null
  limits?: {
    active_clients?: {
      used?: number | null
      limit?: number | null
    } | null
  } | null
  guest_sessions_enabled?: boolean | null
  guest_sessions_limit_per_period?: number | null
  guest_sessions_used_in_period?: number | null
}

type WorkQueueSessionPreviewItem = {
  id?: number | null
  session_id?: number | null
  client?: number | null
  client_display_name?: string | null
  client_first_name?: string | null
  client_last_name?: string | null
  first_name?: string | null
  last_name?: string | null
  status?: string | null
  has_note?: boolean | null
  session_format?: SessionFormat | null
  meeting_mode?: 'ONLINE' | 'OFFLINE' | null
  starts_at?: string | null
  slot_start_at?: string | null
  scheduled_at?: string | null
}

type WorkQueueNoteReminderPreviewItem = {
  id?: number | null
  session_id?: number | null
  client_id?: number | null
  client_display_name?: string | null
  client_first_name?: string | null
  client_last_name?: string | null
  first_name?: string | null
  last_name?: string | null
  reminder_at?: string | null
  starts_at?: string | null
  slot_start_at?: string | null
  created_at?: string | null
}

type WorkQueueGuestRequestPreviewItem = {
  id?: number | null
  status?: string | null
  client_display_name?: string | null
  guest_name?: string | null
  request_topics?: string[] | null
  session_format?: SessionFormat | null
  meeting_mode?: 'ONLINE' | 'OFFLINE' | null
  requested_slot_start?: string | null
  starts_at?: string | null
  created_at?: string | null
}

type CabinetWorkQueuePayload = {
  today_sessions_count?: number | null
  notes_reminders_count?: number | null
  pending_guest_requests_count?: number | null
  pending_slotless_guest_requests_count?: number | null
  today_sessions?: WorkQueueSessionPreviewItem[] | null
  notes_reminders_preview?: WorkQueueNoteReminderPreviewItem[] | null
  guest_requests_preview?: WorkQueueGuestRequestPreviewItem[] | null
}

type CabinetWorkQueue = {
  todaySessionsCount: number
  notesRemindersCount: number
  pendingGuestRequestsCount: number
  pendingSlotlessGuestRequestsCount: number
  todaySessions: WorkQueueSessionPreviewItem[]
  notesRemindersPreview: WorkQueueNoteReminderPreviewItem[]
  guestRequestsPreview: WorkQueueGuestRequestPreviewItem[]
}

function createEmptyWorkQueue(): CabinetWorkQueue {
  return {
    todaySessionsCount: 0,
    notesRemindersCount: 0,
    pendingGuestRequestsCount: 0,
    pendingSlotlessGuestRequestsCount: 0,
    todaySessions: [],
    notesRemindersPreview: [],
    guestRequestsPreview: [],
  }
}

const allSessions = ref<CabinetSession[]>([])
const chatClientNames = ref<Record<number, string>>({})
const entitlementsSnapshot = ref<CabinetEntitlementsSnapshot | null>(null)
const workQueue = ref<CabinetWorkQueue>(createEmptyWorkQueue())
const workQueueLoading = ref(false)
const workQueueError = ref('')
const workQueueLoaded = ref(false)
const heroSessionsLoading = ref(false)
const heroSessionsError = ref('')
const profileLoading = ref(false)
const profileError = ref('')
const cabinetDataLoading = ref(false)
const cabinetDataError = ref('')
const nowTs = ref(Date.now())
const LIVE_STATUS_REFRESH_MS = 30 * 1000
const HERO_SIGNAL_SOON_WINDOW_MS = 60 * 60 * 1000
const HERO_SIGNAL_CONFIRMED_SOON_WINDOW_MS = 30 * 60 * 1000
let nowIntervalId: number | null = null
const CABINET_DATA_LOAD_ERROR = 'Не вдалося завантажити дані доступу кабінету.'
const ONBOARDING_LOAD_ERROR = 'Не вдалося завантажити стан онбордингу.'
const WORK_QUEUE_LOAD_ERROR = 'Не вдалося завантажити орієнтири на сьогодні.'

const onboardingState = ref<unknown | null>(null)
const onboardingLoading = ref(false)
const onboardingLoadError = ref('')
const onboardingCanonicalLoaded = ref(false)

type MeWithOnboardingSummary = {
  onboarding_summary?: unknown
  slug?: string | null
  public_slug?: string | null
  public_profile_path?: string | null
  public_profile_url?: string | null
}

const hasCabinetDataSnapshot = computed(() => {
  return Boolean(me.value?.effective_entitlements && me.value?.counts)
})

const onboardingSummaryFallback = computed(() => {
  const summary = (me.value as MeWithOnboardingSummary | null)?.onboarding_summary
  return normalizeOnboardingState(summary ?? null)
})

const normalizedCanonicalOnboardingState = computed(() => {
  return normalizeOnboardingState(onboardingState.value)
})

const onboardingShellState = computed(() => {
  if (onboardingCanonicalLoaded.value) return null
  return onboardingSummaryFallback.value
})

const onboardingRenderableState = computed(() => {
  if (normalizedCanonicalOnboardingState.value) return normalizedCanonicalOnboardingState.value
  return onboardingShellState.value
})

const onboardingViewModel = computed<SpecialistOnboardingViewModel | null>(() => {
  if (!onboardingRenderableState.value) return null
  return buildSpecialistOnboardingViewModel(onboardingRenderableState.value)
})

const shouldShowOnboardingBlock = computed(() => {
  const viewModel = onboardingViewModel.value
  return Boolean(viewModel)
})
type OnboardingStep = SpecialistOnboardingViewModel['steps'][number]

function normalizePublicProfilePath(raw: string | null | undefined) {
  const value = String(raw || '').trim()
  if (!value) return ''
  if (/^https?:\/\//i.test(value)) {
    try {
      const parsed = new URL(value)
      const path = `${parsed.pathname || ''}${parsed.search || ''}${parsed.hash || ''}`.trim()
      return path
    } catch {
      return ''
    }
  }
  return value.startsWith('/') ? value : `/${value}`
}

const onboardingPublicProfilePath = computed(() => {
  const profileData = me.value as MeWithOnboardingSummary | null
  const fromPath = normalizePublicProfilePath(profileData?.public_profile_path)
  if (fromPath) return fromPath
  const fromUrl = normalizePublicProfilePath(profileData?.public_profile_url)
  if (fromUrl) return fromUrl
  const slug = String(profileData?.slug || profileData?.public_slug || '').trim()
  if (slug) return `/s/${slug}`
  return '/public'
})

function onboardingStepTo(step: OnboardingStep) {
  return step.to
}

const activeClientsCount = computed(() => {
  const used =
    entitlementsSnapshot.value?.limits?.active_clients?.used ??
    entitlementsSnapshot.value?.active_clients
  if (typeof used === 'number' && Number.isFinite(used) && used >= 0) return used
  return me.value?.counts?.active_clients ?? 0
})

const activeClientLimit = computed(() => {
  const plan =
    entitlementsSnapshot.value?.effective_plan ||
    entitlementsSnapshot.value?.plan ||
    me.value?.effective_entitlements?.plan
  const summaryLimit =
    entitlementsSnapshot.value?.limits?.active_clients?.limit ??
    entitlementsSnapshot.value?.active_client_limit
  if (typeof summaryLimit === 'number') return summaryLimit
  if (plan === 'START' || !plan) return 3
  const legacyLimit = me.value?.effective_entitlements?.active_client_limit
  if (typeof legacyLimit === 'number') return legacyLimit
  return Number.POSITIVE_INFINITY
})

const activeClientLimitLabel = computed(() => {
  return Number.isFinite(activeClientLimit.value) ? String(activeClientLimit.value) : '∞'
})

const isNearLimit = computed(() => {
  if (!Number.isFinite(activeClientLimit.value) || activeClientLimit.value === 0) return false
  return activeClientsCount.value / activeClientLimit.value >= 0.8
})

const guestSessionsUsage = computed<{ used: number; limit: number } | null>(() => {
  const snapshot = entitlementsSnapshot.value
  if (!snapshot || snapshot.guest_sessions_enabled !== true) return null
  const used = snapshot.guest_sessions_used_in_period
  const limit = snapshot.guest_sessions_limit_per_period
  if (typeof used !== 'number' || !Number.isFinite(used) || used < 0) return null
  if (typeof limit !== 'number' || !Number.isFinite(limit) || limit < 0) return null
  return { used, limit }
})

function normalizeClientName(value?: string | null) {
  const name = value?.trim() || ''
  if (!name) return ''
  if (/^#?\d+$/i.test(name)) return ''
  if (/^(client|\u043a\u043b\u0456\u0454\u043d\u0442)\s*#?\d+$/i.test(name)) return ''
  return name
}

function fullName(first?: string | null, last?: string | null) {
  const merged = [first?.trim() || '', last?.trim() || ''].filter(Boolean).join(' ')
  return normalizeClientName(merged)
}

function normalizeCount(value: unknown) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return 0
  return Math.floor(value)
}

function normalizePreviewList<T>(value: unknown, limit: number): T[] {
  if (!Array.isArray(value)) return []
  return value.slice(0, limit)
}

function normalizeWorkQueuePayload(payload: unknown): CabinetWorkQueue {
  if (!payload || typeof payload !== 'object') return createEmptyWorkQueue()
  const source = payload as CabinetWorkQueuePayload
  return {
    todaySessionsCount: normalizeCount(source.today_sessions_count),
    notesRemindersCount: normalizeCount(source.notes_reminders_count),
    pendingGuestRequestsCount: normalizeCount(source.pending_guest_requests_count),
    pendingSlotlessGuestRequestsCount: normalizeCount(source.pending_slotless_guest_requests_count),
    todaySessions: normalizePreviewList<WorkQueueSessionPreviewItem>(source.today_sessions, 5),
    notesRemindersPreview: normalizePreviewList<WorkQueueNoteReminderPreviewItem>(source.notes_reminders_preview, 3),
    guestRequestsPreview: normalizePreviewList<WorkQueueGuestRequestPreviewItem>(source.guest_requests_preview, 3),
  }
}

function preferredSessionClientName(session: CabinetSession) {
  const candidates = [
    session.client_display_name,
    session.display_name,
    fullName(session.client_first_name, session.client_last_name),
    fullName(session.first_name, session.last_name),
    session.client_name,
  ]
  for (const candidate of candidates) {
    const normalized = normalizeClientName(candidate)
    if (normalized) return normalized
  }
  return ''
}

function rememberChatClientNames(threads: ChatThread[]) {
  const next = { ...chatClientNames.value }
  threads.forEach((thread) => {
    const clientId = Number(thread.client_id || 0)
    const normalized = normalizeClientName(thread.other_user?.display_name || '')
    if (!clientId || !normalized) return
    next[clientId] = normalized
  })
  chatClientNames.value = next
}

function sessionClientLabel(session?: CabinetSession | null) {
  if (!session) return ''
  const fromChat = chatClientNames.value[Number(session.client || 0)]
  if (fromChat) return fromChat
  const preferred = preferredSessionClientName(session)
  if (preferred) return preferred
  return `Клієнт #${session.client}`
}

function sessionJoinStartAt(session: CabinetSession) {
  return session.slot_start_at || session.join_starts_at || null
}

function sessionJoinEndAt(session: CabinetSession) {
  return session.slot_end_at || session.join_ends_at || null
}

function resolveSessionFormat(session: CabinetSession): SessionFormat {
  if (session.session_format === 'offline') return 'offline'
  if (session.session_format === 'online') return 'online'
  if (session.meeting_mode === 'OFFLINE') return 'offline'
  return 'online'
}

function isOfflineSession(session: CabinetSession) {
  return resolveSessionFormat(session) === 'offline'
}

function getSessionStartMs(session: CabinetSession) {
  const raw = sessionJoinStartAt(session)
  if (!raw) return null
  const value = new Date(raw).getTime()
  return Number.isNaN(value) ? null : value
}

function getSessionEndMs(session: CabinetSession) {
  const raw = sessionJoinEndAt(session)
  if (!raw) return null
  const value = new Date(raw).getTime()
  return Number.isNaN(value) ? null : value
}

function startOfLocalDayMs(timestamp: number) {
  const date = new Date(timestamp)
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
}

function isSessionOnDay(session: CabinetSession, dayOffset: number) {
  const start = getSessionStartMs(session)
  if (start === null) return false
  const targetStart = startOfLocalDayMs(nowTs.value) + dayOffset * 24 * 60 * 60 * 1000
  return start >= targetStart && start < targetStart + 24 * 60 * 60 * 1000
}

function isInsideSessionWindow(session: CabinetSession) {
  const start = getSessionStartMs(session)
  const end = getSessionEndMs(session)
  if (start === null || end === null) return false
  const now = nowTs.value
  return now >= start && now <= end
}

function startsWithinHeroSignalWindow(session: CabinetSession) {
  const start = getSessionStartMs(session)
  if (start === null) return false
  const now = nowTs.value
  return start > now && start <= now + HERO_SIGNAL_SOON_WINDOW_MS
}

function startsWithinConfirmedSoonWindow(session: CabinetSession) {
  const start = getSessionStartMs(session)
  if (start === null) return false
  const now = nowTs.value
  return start > now && start <= now + HERO_SIGNAL_CONFIRMED_SOON_WINDOW_MS
}

function sortBySessionStart(a: CabinetSession, b: CabinetSession) {
  return (getSessionStartMs(a) ?? Number.POSITIVE_INFINITY) - (getSessionStartMs(b) ?? Number.POSITIVE_INFINITY)
}

function firstSessionMatching(predicate: (session: CabinetSession) => boolean) {
  return allSessions.value.filter(predicate).slice().sort(sortBySessionStart)[0] || null
}

const dashboardHeroSignal = computed<DashboardHeroSignal | null>(() => {
  const liveSession = firstSessionMatching(
    (session) => session.status === 'CONFIRMED' && isInsideSessionWindow(session)
  )
  if (liveSession) {
    return {
      type: 'live',
      session: liveSession,
      title: 'Сесія триває',
      tone: 'live',
      to: `/cabinet/sessions/${liveSession.id}`,
    }
  }

  const scheduledStartedSession = firstSessionMatching(
    (session) => session.status === 'SCHEDULED' && isInsideSessionWindow(session)
  )
  if (scheduledStartedSession) {
    return {
      type: 'needs_confirmation_now',
      session: scheduledStartedSession,
      title: 'Потрібне підтвердження',
      message: 'Час сесії настав, але її ще не підтверджено.',
      tone: 'warning',
      to: `/cabinet/sessions/${scheduledStartedSession.id}`,
    }
  }

  const scheduledSoonSession = firstSessionMatching(
    (session) => session.status === 'SCHEDULED' && startsWithinHeroSignalWindow(session)
  )
  if (scheduledSoonSession) {
    return {
      type: 'needs_confirmation_soon',
      session: scheduledSoonSession,
      title: 'Потрібне підтвердження',
      message: 'Сесія починається скоро, але її ще не підтверджено.',
      tone: 'warning',
      to: `/cabinet/sessions/${scheduledSoonSession.id}`,
    }
  }

  const missingMeetingLinkSession = firstSessionMatching((session) => {
    if (session.status !== 'CONFIRMED') return false
    if (isOfflineSession(session)) return false
    if (normalizeMeetingUrl(session.meeting_url)) return false
    return startsWithinHeroSignalWindow(session)
  })
  if (missingMeetingLinkSession) {
    return {
      type: 'missing_meeting_link',
      session: missingMeetingLinkSession,
      title: 'Потрібно додати посилання',
      message: 'Онлайн-сесія скоро почнеться, але посилання ще не додано.',
      tone: 'warning',
      to: `/cabinet/sessions/${missingMeetingLinkSession.id}`,
    }
  }

  const confirmedSoonSession = firstSessionMatching(
    (session) => session.status === 'CONFIRMED' && startsWithinConfirmedSoonWindow(session)
  )
  if (confirmedSoonSession) {
    return {
      type: 'confirmed_soon',
      session: confirmedSoonSession,
      title: 'Сесія скоро почнеться',
      message: isOfflineSession(confirmedSoonSession)
        ? 'Підготуйтеся до сесії.'
        : 'Посилання додано. Підготуйтеся до сесії.',
      tone: 'info',
      to: `/cabinet/sessions/${confirmedSoonSession.id}`,
    }
  }

  return null
})

const heroMeetingUrl = computed(() => {
  if (!dashboardHeroSignal.value || !['live', 'confirmed_soon'].includes(dashboardHeroSignal.value.type)) return ''
  return normalizeMeetingUrl(dashboardHeroSignal.value.session.meeting_url)
})

const canShowHeroJoinAction = computed(() => {
  const signal = dashboardHeroSignal.value
  if (!signal || !['live', 'confirmed_soon'].includes(signal.type)) return false
  return signal.session.join_available === true
})

const upcomingSorted = computed(() => {
  return allSessions.value
    .filter((session) => {
      if (!['SCHEDULED', 'CONFIRMED'].includes(session.status)) return false
      const start = getSessionStartMs(session)
      if (start === null) return false
      return start >= nowTs.value
    })
    .slice()
    .sort(sortBySessionStart)
})

const todaySessions = computed(() => upcomingSorted.value.filter((session) => isSessionOnDay(session, 0)))
const tomorrowSessions = computed(() => upcomingSorted.value.filter((session) => isSessionOnDay(session, 1)))
const nearestUpcomingSession = computed(() => todaySessions.value[0] || null)

const pendingGuestRequestsCount = computed(() => workQueue.value.pendingGuestRequestsCount)
const pendingSlotlessGuestRequestsCount = computed(() => workQueue.value.pendingSlotlessGuestRequestsCount)
const visiblePendingGuestRequestsCount = computed(() =>
  pendingSlotlessGuestRequestsCount.value > 0 ? pendingSlotlessGuestRequestsCount.value : pendingGuestRequestsCount.value
)
const hasPendingSlotlessGuestRequests = computed(() => pendingSlotlessGuestRequestsCount.value > 0)

const firstGuestRequestPreview = computed(() => workQueue.value.guestRequestsPreview[0] || null)

function guestRequestTopicLabels(request: WorkQueueGuestRequestPreviewItem | null) {
  return (request?.request_topics || []).map((topic) => requestTopicLabel(topic)).filter(Boolean)
}

const firstGuestRequestTopicLabels = computed(() => guestRequestTopicLabels(firstGuestRequestPreview.value))

const pendingGuestRequestsCta = computed(() => {
  return 'Опрацювати запити'
})

const pendingGuestRequestsTitle = computed(() => {
  if (hasPendingSlotlessGuestRequests.value) {
    return 'Запити без обраного часу'
  }
  return 'Запити без реєстрації'
})

const pendingGuestRequestsSummary = computed(() => {
  const count = visiblePendingGuestRequestsCount.value
  if (count <= 0) return ''
  if (count === 1) return '1 запит очікує рішення'
  const lastDigit = count % 10
  const lastTwoDigits = count % 100
  const noun = lastDigit >= 2 && lastDigit <= 4 && (lastTwoDigits < 12 || lastTwoDigits > 14) ? 'запити' : 'запитів'
  return `${count} ${noun} очікують рішення`
})

const readinessCompactStatusLine = computed(() => {
  const viewModel = onboardingViewModel.value
  if (!viewModel) return ''
  if (!viewModel.readiness) return viewModel.helper
  return viewModel.publicationSummary
})

const compactPrimaryCtaLabel = computed(() => {
  const cta = onboardingViewModel.value?.primaryCta
  if (!cta) return ''
  if (cta.code === 'COMPLETE_PROFILE') return 'Доповнити профіль'
  return cta.label
})

function compactOnboardingStepTitle(step: OnboardingStep) {
  if (step.key === 'display_name') return 'Публічне ім’я'
  if (step.key === 'description') return 'Короткий опис'
  if (step.key === 'topics') return 'Теми й запити'
  if (step.key === 'work_format') return 'Формат роботи'
  if (step.key === 'base_price') return 'Базова ціна'
  if (step.key === 'client_entry_path') return 'Спосіб першого звернення'
  return step.title
}

const attentionItems = computed<AttentionItem[]>(() => {
  const items: AttentionItem[] = []
  const signal = dashboardHeroSignal.value
  if (signal) {
    items.push({
      key: 'hero-signal',
      title: signal.title,
      body: [sessionClientLabel(signal.session), signal.message].filter(Boolean).join(' · '),
      label: signal.type === 'missing_meeting_link' ? 'Відкрити сесію' : 'Відкрити сесію',
      to: signal.to,
      tone: signal.tone === 'live' ? 'live' : signal.tone === 'warning' ? 'warning' : 'info',
      topics: [],
      heroType: signal.type,
      heroTone: signal.tone,
    })
  }

  if (visiblePendingGuestRequestsCount.value > 0) {
    items.push({
      key: 'guest-requests',
      title: pendingGuestRequestsTitle.value,
      body: pendingGuestRequestsSummary.value,
      label: pendingGuestRequestsCta.value,
      to: '/cabinet/external-sessions#guest-requests',
      tone: 'warning',
      topics: firstGuestRequestTopicLabels.value,
    })
  }

  return items.slice(0, 3)
})

const nearestSessionMeetingUrl = computed(() => {
  if (!nearestUpcomingSession.value) return ''
  return normalizeMeetingUrl(nearestUpcomingSession.value.meeting_url)
})

const isNearestSessionOffline = computed(() => {
  if (!nearestUpcomingSession.value) return false
  return isOfflineSession(nearestUpcomingSession.value)
})

const canJoinNearestSession = computed(() => {
  if (!nearestUpcomingSession.value || isNearestSessionOffline.value) return false
  if (!nearestUpcomingSession.value.join_available || !nearestSessionMeetingUrl.value) return false
  return canJoinExternalMeeting({
    status: nearestUpcomingSession.value.status,
    session_format: nearestUpcomingSession.value.session_format,
    meeting_mode: nearestUpcomingSession.value.meeting_mode,
    meeting_url: nearestUpcomingSession.value.meeting_url,
  })
})

const nearestSessionStatusLabel = computed(() => {
  if (!nearestUpcomingSession.value) return ''
  return sessionStatusLabel(nearestUpcomingSession.value)
})

const nearestSessionStatusClass = computed(() => {
  if (!nearestUpcomingSession.value) return ''
  if (nearestUpcomingSession.value.status === 'SCHEDULED') return 'nearest-session__status--warn'
  if (nearestUpcomingSession.value.status === 'CONFIRMED') return 'nearest-session__status--ok'
  return ''
})

const nearestSessionOnlineHint = computed(() => {
  if (!nearestUpcomingSession.value || isNearestSessionOffline.value) return ''
  if (!nearestSessionMeetingUrl.value) {
    return 'Додайте посилання на онлайн-зустріч у деталях сесії.'
  }
  if (canJoinNearestSession.value) {
    return 'Приєднання доступне. Можна перейти у зустріч.'
  }
  return 'Посилання на зустріч додано. Приєднання стане доступним ближче до початку.'
})

const shouldShowAddMeetingLinkAction = computed(() => {
  return Boolean(nearestUpcomingSession.value && !isNearestSessionOffline.value && !nearestSessionMeetingUrl.value)
})

const nearestSessionSummary = computed(() => {
  const session = nearestUpcomingSession.value
  if (!session) return ''
  return sessionSummary(session)
})

const nearestSessionSecondaryLine = computed(() => {
  if (!nearestUpcomingSession.value) return ''
  return sessionSecondaryLine(nearestUpcomingSession.value)
})

function formatDateTime(value?: string | null) {
  return formatUkDateTimeCompact(value)
}

function sessionFormatLabel(session: CabinetSession) {
  return isOfflineSession(session) ? 'Офлайн' : 'Онлайн'
}

function sessionStatusLabel(session: CabinetSession) {
  if (session.status === 'SCHEDULED') return 'Потрібне підтвердження'
  if (session.status === 'CONFIRMED') return 'Підтверджено'
  return session.status
}

function sessionSummary(session: CabinetSession) {
  return [
    formatDateTime(sessionJoinStartAt(session)),
    sessionClientLabel(session),
    sessionFormatLabel(session),
    sessionStatusLabel(session),
  ].filter(Boolean).join(' · ')
}

function sessionSecondaryLine(session: CabinetSession) {
  if (!isOfflineSession(session)) return ''
  const location = (session.offline_location || '').trim()
  return location ? `Локація: ${location}` : 'Офлайн-сесія. Локацію уточнено у деталях.'
}

async function loadChatClientNames() {
  try {
    const threads = await fetchChatThreads()
    rememberChatClientNames(Array.isArray(threads) ? threads : [])
  } catch {
    chatClientNames.value = {}
  }
}

async function loadSessionsForHero() {
  heroSessionsLoading.value = true
  heroSessionsError.value = ''
  try {
    const [upcomingResp, pastResp] = await Promise.all([
      apiGet<CabinetSession[]>('/booking/sessions/', { params: { upcoming: true } }),
      apiGet<CabinetSession[]>('/booking/sessions/', { params: { upcoming: false } }),
    ])
    const upcoming = Array.isArray(upcomingResp) ? upcomingResp : []
    const past = Array.isArray(pastResp) ? pastResp : []
    allSessions.value = [...upcoming, ...past]
  } catch {
    allSessions.value = []
    heroSessionsError.value = 'Не вдалося завантажити статус найближчої сесії.'
  } finally {
    heroSessionsLoading.value = false
  }
}

function retryHeroSessionsLoad() {
  void loadSessionsForHero()
}

async function ensureCabinetProfile() {
  if (me.value || !auth.accessToken) return
  profileLoading.value = true
  profileError.value = ''
  try {
    await auth.loadMe()
    if (!me.value) {
      profileError.value = 'Профіль кабінету тимчасово недоступний.'
    }
  } catch {
    profileError.value = 'Не вдалося завантажити профіль кабінету.'
  } finally {
    profileLoading.value = false
  }
}

function retryCabinetProfileLoad() {
  void ensureCabinetProfile().then(() => ensureCabinetData())
}

async function ensureCabinetData() {
  if (!me.value || !auth.accessToken || hasCabinetDataSnapshot.value) return
  cabinetDataLoading.value = true
  cabinetDataError.value = ''
  try {
    await auth.loadMe()
    if (!hasCabinetDataSnapshot.value) {
      cabinetDataError.value = CABINET_DATA_LOAD_ERROR
    }
  } catch {
    cabinetDataError.value = CABINET_DATA_LOAD_ERROR
  } finally {
    cabinetDataLoading.value = false
  }
}

async function loadWorkQueue() {
  if (!auth.accessToken) {
    workQueue.value = createEmptyWorkQueue()
    workQueueLoaded.value = false
    workQueueError.value = ''
    return
  }
  workQueueLoading.value = true
  workQueueError.value = ''
  try {
    const payload = await apiGet<CabinetWorkQueuePayload | null>('/cabinet/work-queue/')
    workQueue.value = normalizeWorkQueuePayload(payload)
    workQueueLoaded.value = true
  } catch {
    if (!workQueueLoaded.value) {
      workQueue.value = createEmptyWorkQueue()
    }
    workQueueError.value = WORK_QUEUE_LOAD_ERROR
  } finally {
    workQueueLoading.value = false
  }
}

function retryCabinetDataLoad() {
  void Promise.all([ensureCabinetData(), loadCabinetEntitlementsSnapshot(), loadWorkQueue()])
}

function retryWorkQueueLoad() {
  void loadWorkQueue()
}

async function loadCabinetEntitlementsSnapshot() {
  if (!auth.accessToken) {
    entitlementsSnapshot.value = null
    return
  }
  try {
    const payload = await apiGet<CabinetEntitlementsSnapshot | null>(
      '/cabinet/entitlements/'
    )
    if (!payload || typeof payload !== 'object') {
      entitlementsSnapshot.value = null
      return
    }
    entitlementsSnapshot.value = payload
  } catch {
    entitlementsSnapshot.value = null
  }
}

async function loadOnboardingState() {
  if (!auth.accessToken) return
  onboardingLoading.value = true
  onboardingLoadError.value = ''
  try {
    onboardingState.value = await fetchSpecialistOnboardingState()
  } catch {
    onboardingLoadError.value = ONBOARDING_LOAD_ERROR
    onboardingState.value = null
  } finally {
    onboardingCanonicalLoaded.value = true
    onboardingLoading.value = false
  }
}

function retryOnboardingStateLoad() {
  void loadOnboardingState()
}

onMounted(async () => {
  await Promise.all([ensureCabinetProfile(), loadSessionsForHero(), loadChatClientNames()])
  await Promise.all([
    ensureCabinetData(),
    loadOnboardingState(),
    loadCabinetEntitlementsSnapshot(),
    loadWorkQueue(),
  ])
  nowIntervalId = window.setInterval(() => {
    nowTs.value = Date.now()
  }, LIVE_STATUS_REFRESH_MS)
})

onBeforeUnmount(() => {
  if (nowIntervalId !== null) {
    window.clearInterval(nowIntervalId)
    nowIntervalId = null
  }
})
</script>

<style scoped>
.cabinet {
  display: grid;
  gap: 14px;
  background:
    radial-gradient(880px 420px at 8% -4%, color-mix(in srgb, var(--pc-teal-100) 76%, transparent), transparent 68%),
    radial-gradient(720px 380px at 92% 2%, color-mix(in srgb, var(--pc-peach-100) 78%, transparent), transparent 70%),
    var(--pc-bg-main);
  border-radius: var(--pc-radius-panel);
  padding: clamp(14px, 2vw, 22px);
  color: var(--pc-text-main);
  min-width: 0;
  max-width: 100%;
}

.cabinet__hero {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  position: relative;
  overflow: hidden;
  background: #fff;
  border: 1px solid var(--pc-border);
  border-radius: var(--pc-radius-panel);
  padding: 14px 18px;
  box-shadow: 0 8px 20px rgba(16, 33, 50, 0.06);
  min-width: 0;
  max-width: 100%;
}

.cabinet__hero > div {
  min-width: 0;
  position: relative;
  z-index: 1;
}

.cabinet__hero-cta {
  position: relative;
  z-index: 1;
  flex: 0 0 auto;
  white-space: nowrap;
}

.cabinet__hero::after {
  display: none;
}

.cabinet__title {
  margin: 0 0 4px;
  font-size: clamp(26px, 2vw, 32px);
  line-height: 1.15;
  color: var(--pc-navy-950);
  letter-spacing: 0;
}

.cabinet__subtitle {
  max-width: 680px;
  margin: 0;
  font-size: 14px;
  line-height: 1.4;
  color: var(--pc-text-muted);
}


.hero-signal {
  min-width: min(260px, 100%);
  max-width: 100%;
  border-radius: var(--pc-radius-panel);
  padding: 12px 14px;
  display: grid;
  gap: 8px;
  text-decoration: none;
}

.hero-signal--live {
  border: 1px solid color-mix(in srgb, var(--pc-danger) 34%, var(--pc-border));
  background: linear-gradient(
    145deg,
    color-mix(in srgb, var(--pc-danger) 92%, #ffffff),
    color-mix(in srgb, var(--pc-navy-950) 24%, var(--pc-danger))
  );
  color: #fff;
  box-shadow: 0 14px 28px rgba(201, 68, 68, 0.2);
}

.hero-signal--warning {
  border: 1px solid color-mix(in srgb, var(--pc-warning) 45%, var(--pc-border));
  border-left: 4px solid var(--pc-warning);
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--pc-yellow-soft) 80%, #ffffff),
    color-mix(in srgb, var(--pc-peach-100) 56%, #ffffff)
  );
  color: var(--pc-navy-900);
  box-shadow: 0 12px 24px rgba(122, 78, 20, 0.08);
}

.hero-signal--info {
  border: 1px solid color-mix(in srgb, var(--pc-navy-900) 24%, var(--pc-border));
  border-left: 4px solid var(--pc-navy-900);
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--pc-blue-soft) 86%, #ffffff),
    color-mix(in srgb, var(--pc-primary-soft) 72%, #ffffff)
  );
  color: var(--pc-navy-900);
  box-shadow: 0 12px 24px rgba(18, 52, 90, 0.08);
}

.hero-signal__title {
  color: inherit;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  font-size: 12px;
}

.hero-signal__meta {
  font-weight: 600;
  opacity: 0.95;
}

.hero-signal__hint {
  font-size: 13px;
  line-height: 1.35;
}

.hero-signal__join {
  width: fit-content;
}

.hero-status {
  min-width: min(260px, 100%);
  max-width: 100%;
  border-radius: var(--pc-radius-panel);
  padding: 12px 14px;
  display: grid;
  gap: 10px;
}

.hero-status--loading {
  border: 1px solid color-mix(in srgb, var(--pc-info) 26%, var(--pc-border));
  background: var(--pc-blue-soft);
  color: var(--pc-navy-900);
}

.hero-status--error {
  border: 1px solid color-mix(in srgb, var(--pc-danger) 34%, var(--pc-border));
  background: var(--pc-red-soft);
  color: var(--pc-danger);
}

.cabinet__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 18px;
  min-width: 0;
  max-width: 100%;
}

.cabinet__work-grid {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: start;
  gap: 18px;
  min-width: 0;
}

.panel {
  border: 1px solid var(--line);
  border-radius: var(--pc-radius-panel);
  padding: clamp(18px, 1.2vw, 24px);
  background: #fff;
  display: grid;
  gap: 14px;
  min-width: 0;
  max-width: 100%;
}

.panel--clickable {
  text-decoration: none;
  color: inherit;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.panel--clickable:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 24px rgba(16, 33, 50, 0.12);
  border-color: rgba(31, 74, 96, 0.25);
}

.panel--clickable:focus-visible {
  outline: 2px solid rgba(31, 74, 96, 0.35);
  outline-offset: 2px;
}

.panel--accent {
  background: linear-gradient(160deg, #ffffff, #eef6fb);
}

.panel--wide {
  grid-column: 1 / -1;
}

.panel--tips {
  background: rgba(7, 47, 71, 0.03);
}

.panel--today {
  align-content: start;
  gap: 12px;
  border-color: var(--pc-border);
  background: #fff;
  box-shadow: none;
}

.panel--tomorrow {
  align-content: start;
  gap: 12px;
  border-color: var(--pc-border);
  background: #fff;
  box-shadow: none;
}

.panel--attention {
  gap: 10px;
  padding: 14px;
  border-color: color-mix(in srgb, var(--pc-warning) 24%, var(--pc-border));
  box-shadow: var(--pc-shadow-soft);
}

.attention-list {
  display: grid;
  gap: 8px;
}

.attention-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
  padding: 10px 12px;
  border: 1px solid var(--pc-border);
  border-left-width: 4px;
  border-radius: var(--pc-radius-control);
  background: #fff;
  color: var(--pc-navy-900);
  text-decoration: none;
  box-shadow: none;
}

.attention-row--warning {
  border-left-color: var(--pc-warning);
  background: color-mix(in srgb, var(--pc-yellow-soft) 55%, #ffffff);
}

.attention-row--info {
  border-left-color: var(--pc-navy-900);
  background: color-mix(in srgb, var(--pc-blue-soft) 62%, #ffffff);
}

.attention-row--live {
  border-left-color: var(--pc-danger);
  background: color-mix(in srgb, var(--pc-red-soft) 72%, #ffffff);
}

.attention-row:hover,
.attention-row:focus-visible {
  border-color: color-mix(in srgb, var(--pc-navy-900) 28%, var(--pc-border));
  color: var(--pc-navy-900);
}

.attention-row__content {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.attention-row__title {
  font-weight: 700;
}

.attention-row__body {
  color: var(--pc-text-muted);
  font-size: 14px;
  line-height: 1.35;
}

.attention-row__topics,
.today-topic-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.attention-topic,
.today-topic-chip {
  padding: 3px 7px;
  border: 1px solid color-mix(in srgb, var(--pc-navy-900) 14%, var(--pc-border));
  border-radius: var(--pc-radius-control);
  background: #fff;
  color: var(--pc-navy-900);
  font-size: 12px;
  font-weight: 700;
}

.attention-row__cta,
.hero-signal__join {
  flex: 0 0 auto;
}

.today-panel {
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;
  align-items: stretch;
  min-width: 0;
}

.today-card {
  border: 1px solid rgba(7, 47, 71, 0.12);
  border-radius: var(--pc-radius-control);
  background: #fff;
  padding: 12px;
  display: grid;
  gap: 8px;
  min-width: 0;
}

.today-card--primary {
  background: color-mix(in srgb, var(--pc-bg-card) 94%, var(--pc-blue-soft));
}

.today-card--soft {
  background: rgba(255, 255, 255, 0.86);
}

.today-card__title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  min-width: 0;
}

.today-card__count {
  flex: 0 0 auto;
  min-width: 28px;
  border: 1px solid color-mix(in srgb, var(--pc-warning) 45%, var(--pc-border));
  border-radius: var(--pc-radius-control);
  padding: 3px 8px;
  background: #ffffff;
  color: var(--pc-navy-900);
  font-size: 13px;
  font-weight: 800;
  line-height: 1.2;
  text-align: center;
}

.today-card--compact {
  align-content: center;
}

.today-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.today-card__title {
  margin: 0;
  font-size: 16px;
}

.today-card__copy,
.today-card__empty {
  margin: 0;
  line-height: 1.5;
}

.today-panel__state {
  border: 1px solid var(--line);
  border-radius: var(--pc-radius-panel);
  padding: 12px;
  display: grid;
  gap: 10px;
}

.today-panel__state--loading {
  background: rgba(8, 113, 201, 0.08);
  color: #11445d;
}

.today-panel__state--error,
.today-panel__inline-error {
  border: 1px solid rgba(179, 29, 29, 0.35);
  background: rgba(250, 232, 232, 0.9);
  color: #7d1f1f;
}

.today-panel__inline-error {
  grid-column: 1 / -1;
  border-radius: var(--pc-radius-control);
  padding: 10px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.nearest-session__summary {
  font-weight: 600;
  line-height: 1.45;
  overflow-wrap: anywhere;
}

.nearest-session__meta {
  font-size: 13px;
}

.nearest-session__hint {
  font-size: 14px;
  line-height: 1.4;
}

.nearest-session__actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.nearest-session__status {
  width: fit-content;
  padding: 5px 8px;
  border-radius: var(--pc-radius-control);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0;
  text-transform: uppercase;
  background: rgba(7, 47, 71, 0.08);
  color: #1c4c66;
}

.nearest-session__status--warn {
  background: rgba(217, 164, 65, 0.2);
  color: #9b6c0b;
}

.nearest-session__status--ok {
  background: rgba(31, 122, 76, 0.14);
  color: #1f7a4c;
}

.tomorrow-list {
  display: grid;
  gap: 10px;
}

.tomorrow-session {
  display: grid;
  gap: 5px;
  min-width: 0;
  border: 1px solid var(--pc-border);
  border-radius: var(--pc-radius-control);
  padding: 10px 12px;
  background: color-mix(in srgb, var(--pc-bg-card) 96%, var(--pc-blue-soft));
  color: var(--pc-navy-900);
  text-decoration: none;
}

.tomorrow-session:hover,
.tomorrow-session:focus-visible {
  border-color: color-mix(in srgb, var(--pc-navy-900) 28%, var(--pc-border));
  background: #fff;
  outline: none;
}

.tomorrow-session__summary {
  font-weight: 600;
  line-height: 1.45;
  overflow-wrap: anywhere;
}

.tomorrow-session__hint,
.tomorrow-empty {
  margin: 0;
  line-height: 1.45;
}

.usage-strip {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  min-width: 0;
  border: 1px solid var(--pc-border);
  border-radius: var(--pc-radius-panel);
  padding: 12px 14px;
  background: #fff;
}

.usage-strip__item {
  color: var(--pc-text-muted);
  font-size: 14px;
  line-height: 1.4;
}

.usage-strip__item strong {
  color: var(--pc-navy-900);
  font-weight: 700;
}

.usage-strip__warning {
  color: #8a6b2f;
  font-size: 14px;
}

.usage-strip__link {
  margin-left: auto;
}

.panel--onboarding {
  display: grid;
  gap: 10px;
  padding: 14px;
}

.onboarding-status {
  padding: 6px 10px;
  border-radius: var(--radius-pill);
  font-size: 12px;
  font-weight: 600;
}

.onboarding-status--ready {
  background: rgba(31, 122, 76, 0.14);
  color: #1f7a4c;
}

.onboarding-status--pending {
  background: rgba(217, 164, 65, 0.2);
  color: #9b6c0b;
}

.onboarding-status--warn {
  background: rgba(8, 113, 201, 0.11);
  color: #1f4a60;
}

.onboarding-loading {
  font-size: 14px;
  color: var(--muted);
}

.onboarding-layout {
  display: grid;
  gap: 10px;
}

.onboarding-missing-summary {
  margin: 0;
  color: var(--pc-text-muted);
  font-size: 14px;
  line-height: 1.45;
}

.onboarding-publication-summary {
  margin: 0;
  color: var(--pc-text-muted);
  font-size: 14px;
  line-height: 1.45;
}

.onboarding-details {
  display: grid;
  gap: 10px;
}

.onboarding-steps {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.onboarding-step-item {
  min-width: 0;
}

.onboarding-check-item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 34px;
  border: 1px solid var(--pc-border);
  border-radius: var(--pc-radius-control);
  padding: 6px 9px;
  background: #fff;
  color: inherit;
  text-decoration: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.onboarding-check-item:hover,
.onboarding-check-item:focus-visible {
  border-color: rgba(31, 74, 96, 0.32);
  box-shadow: 0 8px 16px rgba(16, 33, 50, 0.08);
}

.onboarding-check-item__label {
  font-size: 13px;
  font-weight: 700;
}

.onboarding-step--done {
  border-color: rgba(31, 122, 76, 0.28);
  background: rgba(31, 122, 76, 0.06);
}

.onboarding-step--pending {
  border-color: rgba(217, 164, 65, 0.35);
  background: rgba(217, 164, 65, 0.09);
}

.onboarding-step__state {
  width: fit-content;
  padding: 2px 6px;
  border-radius: var(--pc-radius-control);
  background: rgba(7, 47, 71, 0.08);
  color: var(--pc-navy-900);
  font-size: 11px;
  font-weight: 700;
}

.onboarding-step--done .onboarding-step__state {
  background: rgba(31, 122, 76, 0.14);
  color: #1f7a4c;
}

.onboarding-step--pending .onboarding-step__state {
  background: rgba(217, 164, 65, 0.18);
  color: #8a5c0a;
}

.onboarding-list-wrap {
  display: grid;
  gap: 8px;
}

.onboarding-list-wrap--warning {
  padding: 10px 12px;
  border-radius: var(--pc-radius-control);
  border: 1px solid rgba(179, 29, 29, 0.24);
  background: rgba(250, 232, 232, 0.6);
}

.onboarding-list-title {
  margin: 0;
  font-size: 14px;
}

.onboarding-list {
  margin: 0;
  padding-left: 18px;
  display: grid;
  gap: 5px;
}

.onboarding-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.onboarding-error {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #7d1f1f;
}

.btn--sm {
  padding: 6px 10px;
  font-size: 12px;
  border-radius: var(--pc-radius-control);
}

.tips-list {
  margin: 0;
  padding-left: 18px;
  display: grid;
  gap: 8px;
}

.tips-list li {
  display: grid;
  gap: 4px;
}

.tips-link {
  font-weight: 600;
  color: var(--ink);
  text-decoration: none;
}

.tips-link:hover {
  text-decoration: underline;
}

.panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.panel__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(24px, 1.8vw, 30px);
  line-height: 1.2;
}

.panel__meta {
  font-size: 14px;
  color: var(--muted);
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: var(--radius-pill);
  background: #1f4a60;
}

.status-dot--ok {
  background: #1f7a4c;
}

.status-dot--warn {
  background: #d9a441;
}

.status-dot--danger {
  background: #c24b4b;
}

.access-pill {
  padding: 6px 12px;
  border-radius: var(--radius-pill);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  background: rgba(31, 122, 76, 0.16);
  color: #1f7a4c;
}

.access-pill--warn {
  background: rgba(217, 164, 65, 0.2);
  color: #a57011;
}

.access-pill--danger {
  background: rgba(194, 75, 75, 0.2);
  color: #a03838;
}

.stat {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.stat__value {
  font-size: 28px;
  font-weight: 700;
  font-family: var(--font-display);
}

.stat__label {
  color: var(--muted);
}

.stat--secondary {
  opacity: 0.85;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 10px;
}

.feature {
  padding: 10px 12px;
  border-radius: var(--pc-radius-panel);
  background: rgba(7, 47, 71, 0.04);
  border: 1px solid rgba(7, 47, 71, 0.08);
}

.feature__title {
  font-size: 12px;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.12em;
}

.feature__value {
  margin-top: 6px;
  font-weight: 600;
}

.alert {
  margin-top: 8px;
  padding: 10px 12px;
  border-radius: var(--pc-radius-control);
  background: rgba(194, 75, 75, 0.1);
  color: #8b3030;
  font-size: 13px;
}

.cabinet__loading {
  text-align: center;
  padding: 32px;
}

.cabinet__loading--error {
  display: grid;
  gap: 10px;
  justify-items: center;
  color: #7d1f1f;
  border-color: rgba(179, 29, 29, 0.35);
  background: rgba(250, 232, 232, 0.9);
}

.cabinet__loading-action {
  justify-self: center;
}

@media (max-width: 780px) {
  .cabinet__hero {
    flex-direction: column;
    align-items: flex-start;
  }

  .cabinet__work-grid {
    grid-template-columns: 1fr;
  }

  .today-panel {
    grid-template-columns: 1fr;
  }

  .attention-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .attention-row__cta,
  .hero-signal__join {
    width: 100%;
  }

  .today-panel__inline-error {
    flex-direction: column;
    align-items: flex-start;
  }

  .usage-strip {
    align-items: flex-start;
    flex-direction: column;
  }

  .usage-strip__link {
    margin-left: 0;
  }

}

@media (max-width: 900px) {
  .cabinet {
    gap: 12px;
    padding: 12px;
  }

  .cabinet__hero {
    padding: 12px 14px;
    gap: 8px;
    border-radius: var(--pc-radius-panel);
  }

  .cabinet__hero::after {
    display: none;
  }

  .cabinet__title {
    font-size: 26px;
    line-height: 1.14;
    margin: 0 0 3px;
  }

  .cabinet__subtitle {
    margin: 0;
    max-width: 100%;
    font-size: 14px;
    line-height: 1.36;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .hero-signal,
  .hero-status {
    min-width: 0;
    width: 100%;
    padding: 10px 12px;
    gap: 6px;
  }
}

@media (max-width: 520px) {
  .cabinet {
    gap: 10px;
    padding: 10px;
  }

  .cabinet__hero {
    padding: 10px 12px;
    gap: 8px;
    border-radius: var(--pc-radius-panel);
  }

  .cabinet__title {
    font-size: 23px;
    line-height: 1.16;
    margin: 0 0 3px;
  }

  .cabinet__subtitle {
    font-size: 13px;
    line-height: 1.35;
    max-width: 100%;
    margin: 0;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .hero-signal,
  .hero-status {
    min-width: 0;
    width: 100%;
    padding: 10px 12px;
    gap: 6px;
  }

  .panel {
    padding: 14px;
    gap: 12px;
    border-radius: var(--pc-radius-panel);
  }
}
</style>
