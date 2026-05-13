<template>
  <section class="cabinet">
    <header class="cabinet__hero">
      <div>
        <h1 class="title cabinet__title">Робоча панель</h1>
        <p class="muted cabinet__subtitle">
          Тут зібрано короткий огляд вашої практики: сесії, клієнти, нотатки, запити та стан профілю.
        </p>
      </div>
      <RouterLink
        v-if="dashboardHeroSignal"
        :class="[
          'hero-signal',
          `hero-signal--${dashboardHeroSignal.type}`,
          `hero-signal--${dashboardHeroSignal.tone}`,
        ]"
        :to="dashboardHeroSignal.to"
      >
        <div class="hero-signal__title">{{ dashboardHeroSignal.title }}</div>
        <div class="hero-signal__meta">
          {{ sessionClientLabel(dashboardHeroSignal.session) }}
        </div>
        <div v-if="dashboardHeroSignal.message" class="hero-signal__hint">
          {{ dashboardHeroSignal.message }}
        </div>
        <a
          v-if="canShowHeroJoinAction && heroMeetingUrl"
          class="btn btn--sm hero-signal__join"
          :href="heroMeetingUrl"
          target="_blank"
          rel="noopener noreferrer"
          @click.stop
        >
          Приєднатися
        </a>
      </RouterLink>
      <div v-else-if="heroSessionsLoading" class="hero-status hero-status--loading">
        Завантажуємо статус найближчої сесії...
      </div>
      <div v-else-if="heroSessionsError" class="hero-status hero-status--error">
        <span>{{ heroSessionsError }}</span>
        <button class="btn btn--ghost btn--sm" type="button" :disabled="heroSessionsLoading" @click="retryHeroSessionsLoad">
          Повторити
        </button>
      </div>
    </header>

    <div v-if="me && hasCabinetDataSnapshot" class="cabinet__grid">
      <section class="panel panel--wide panel--work-queue">
        <div class="panel__header">
          <div>
            <h2 class="panel__title">Робочий огляд</h2>
          </div>
        </div>

        <div v-if="workQueueLoading && !workQueueLoaded" class="work-queue__state work-queue__state--loading">
          Завантаження щоденного огляду...
        </div>

        <div v-else-if="workQueueError && !workQueueLoaded" class="work-queue__state work-queue__state--error">
          <span>{{ workQueueError }}</span>
          <button
            class="btn btn--ghost btn--sm work-queue__retry"
            type="button"
            :disabled="workQueueLoading"
            @click="retryWorkQueueLoad"
          >
            Повторити
          </button>
        </div>

        <div v-else class="work-queue">
          <div v-if="workQueueError" class="work-queue__inline-error">
            <span>{{ workQueueError }}</span>
            <button
              class="btn btn--ghost btn--sm work-queue__retry"
              type="button"
              :disabled="workQueueLoading"
              @click="retryWorkQueueLoad"
            >
              Повторити
            </button>
          </div>

          <div class="work-queue__summary">
            <RouterLink class="work-queue-summary-card" data-kind="sessions" to="/cabinet/sessions">
              <div class="work-queue-summary-card__label">Сесії сьогодні</div>
              <div class="work-queue-summary-card__value">{{ workQueue.todaySessionsCount }}</div>
              <div class="work-queue-summary-card__cta">Перейти до сесій</div>
            </RouterLink>

            <RouterLink class="work-queue-summary-card" data-kind="notes" to="/cabinet/clients">
              <div class="work-queue-summary-card__label">Нотатки до завершення</div>
              <div class="work-queue-summary-card__value">{{ workQueue.notesRemindersCount }}</div>
              <div class="work-queue-summary-card__cta">Перейти до клієнтів</div>
            </RouterLink>

            <RouterLink class="work-queue-summary-card" data-kind="guest" to="/cabinet/external-sessions">
              <div class="work-queue-summary-card__label">Гостьові заявки</div>
              <div class="work-queue-summary-card__value">{{ workQueue.pendingGuestRequestsCount }}</div>
              <div class="work-queue-summary-card__cta">Перейти до гостьових сесій</div>
            </RouterLink>
          </div>

          <div class="work-queue__preview-grid">
            <section class="work-queue-list" data-kind="today-sessions">
              <div class="work-queue-list__header">
                <h3 class="work-queue-list__title">Сьогоднішні сесії</h3>
                <RouterLink class="btn btn--ghost btn--sm" to="/cabinet/sessions">Усі сесії</RouterLink>
              </div>
              <ul v-if="workQueue.todaySessions.length > 0" class="work-queue-list__items">
                <li v-for="item in workQueue.todaySessions" :key="workQueueSessionKey(item)" class="work-queue-list__item">
                  <div class="work-queue-list__row">
                    <div class="work-queue-list__time">{{ workQueueSessionTimeLabel(item) }}</div>
                    <div class="work-queue-list__status">{{ workQueueSessionStatusLabel(item.status) }}</div>
                  </div>
                  <div class="work-queue-list__client">{{ workQueueSessionClientLabel(item) }}</div>
                  <div class="work-queue-list__meta">
                    <span>Нотатка: {{ item.has_note ? 'є' : 'немає' }}</span>
                    <span v-if="workQueueSessionFormatLabel(item)">{{ workQueueSessionFormatLabel(item) }}</span>
                  </div>
                  <RouterLink class="work-queue-list__link" :to="workQueueSessionTo(item)">Відкрити</RouterLink>
                </li>
              </ul>
              <p v-else class="muted work-queue-list__empty">
                На сьогодні сесій немає. Перевірте розклад або відкрийте список сесій, щоб спланувати наступні зустрічі.
              </p>
            </section>

            <section class="work-queue-list" data-kind="notes-reminders">
              <div class="work-queue-list__header">
                <h3 class="work-queue-list__title">Нагадування по нотатках</h3>
                <RouterLink class="btn btn--ghost btn--sm" to="/cabinet/clients">До нотаток</RouterLink>
              </div>
              <ul v-if="workQueue.notesRemindersPreview.length > 0" class="work-queue-list__items">
                <li
                  v-for="item in workQueue.notesRemindersPreview"
                  :key="workQueueReminderKey(item)"
                  class="work-queue-list__item"
                >
                  <div class="work-queue-list__time">{{ workQueueReminderTimeLabel(item) }}</div>
                  <div class="work-queue-list__client">{{ workQueueReminderClientLabel(item) }}</div>
                  <div class="work-queue-list__meta">
                    <span>Потрібно зафіксувати нотатку</span>
                  </div>
                  <RouterLink class="work-queue-list__link" :to="workQueueReminderTo(item)">Продовжити</RouterLink>
                </li>
              </ul>
              <p v-else class="muted work-queue-list__empty">
                Нотатки не потребують уваги. Коли після сесії треба буде доповнити запис, він з’явиться тут.
              </p>
            </section>

            <section class="work-queue-list" data-kind="guest-requests">
              <div class="work-queue-list__header">
                <h3 class="work-queue-list__title">Гостьові запити</h3>
                <RouterLink class="btn btn--ghost btn--sm" to="/cabinet/external-sessions">Усі заявки</RouterLink>
              </div>
              <ul v-if="workQueue.guestRequestsPreview.length > 0" class="work-queue-list__items">
                <li
                  v-for="item in workQueue.guestRequestsPreview"
                  :key="workQueueGuestRequestKey(item)"
                  class="work-queue-list__item"
                >
                  <div class="work-queue-list__row">
                    <div class="work-queue-list__time">{{ workQueueGuestRequestTimeLabel(item) }}</div>
                    <div class="work-queue-list__status">{{ workQueueGuestRequestStatusLabel(item.status) }}</div>
                  </div>
                  <div class="work-queue-list__client">{{ workQueueGuestRequestClientLabel(item) }}</div>
                  <div v-if="workQueueSessionFormatLabel(item)" class="work-queue-list__meta">
                    <span>Формат: {{ workQueueSessionFormatLabel(item) }}</span>
                  </div>
                  <RouterLink class="work-queue-list__link" to="/cabinet/external-sessions">Опрацювати</RouterLink>
                </li>
              </ul>
              <p v-else class="muted work-queue-list__empty">
                Немає гостьових заявок на розгляд. Нові заявки з публічного профілю з’являться в цьому блоці.
              </p>
            </section>

            <section v-if="activeClientsCount === 0" class="work-queue-list" data-kind="clients-empty">
              <div class="work-queue-list__header">
                <h3 class="work-queue-list__title">Клієнти</h3>
                <RouterLink class="btn btn--ghost btn--sm" to="/cabinet/clients">Додати клієнта</RouterLink>
              </div>
              <p class="muted work-queue-list__empty">
                Клієнтів ще немає. Ви можете додати клієнта вручну без створення кабінету для нього або запросити клієнтів через публічний профіль і відкриті слоти.
              </p>
            </section>
          </div>
        </div>
      </section>

      <section class="panel panel--wide panel--action-hub">
        <div class="panel__header">
          <div>
            <h2 class="panel__title">Робота на сьогодні</h2>
          </div>
        </div>
        <div class="action-hub" :class="{ 'action-hub--fallback': !nearestUpcomingSession }">
          <section
            class="panel panel--nearest-session action-hub__nearest"
            :class="{ 'action-hub__nearest--compact': !nearestUpcomingSession }"
          >
            <div class="panel__header">
              <div>
                <h3 class="panel__title action-hub__title">Що у вас далі</h3>
              </div>
              <div v-if="nearestUpcomingSession" class="nearest-session__status" :class="nearestSessionStatusClass">
                {{ nearestSessionStatusLabel }}
              </div>
            </div>
            <template v-if="nearestUpcomingSession">
              <div class="nearest-session__grid">
                <div class="nearest-session__item">
                  <div class="nearest-session__label">Дата і час</div>
                  <div class="nearest-session__value">{{ formatDateTime(sessionJoinStartAt(nearestUpcomingSession)) }}</div>
                </div>
                <div class="nearest-session__item">
                  <div class="nearest-session__label">Клієнт</div>
                  <div class="nearest-session__value">
                    {{ sessionClientLabel(nearestUpcomingSession) }}
                  </div>
                </div>
                <div class="nearest-session__item">
                  <div class="nearest-session__label">Формат</div>
                  <div class="nearest-session__value">{{ nearestSessionFormatLabel }}</div>
                  <div v-if="isNearestSessionOffline && nearestSessionOfflineLocation" class="muted nearest-session__meta">
                    Локація: {{ nearestSessionOfflineLocation }}
                  </div>
                </div>
              </div>
              <div v-if="isNearestSessionOffline" class="muted nearest-session__hint">
                {{ nearestSessionOfflineLocation ? 'Офлайн-сесія без посилання для входу.' : 'Офлайн-сесія. Локацію уточнено у деталях.' }}
              </div>
              <div v-else class="muted nearest-session__hint">
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
                <RouterLink v-else class="btn btn--ghost btn--sm" to="/cabinet/sessions">
                  Усі сесії
                </RouterLink>
              </div>
            </template>
            <template v-else>
              <p class="muted action-hub__empty">
                Немає майбутніх сесій. Перейдіть до сесій, щоб запланувати або перевірити нові запити.
              </p>
              <div class="nearest-session__actions">
                <RouterLink class="btn btn--sm" to="/cabinet/sessions">
                  Перейти до сесій
                </RouterLink>
              </div>
            </template>
          </section>

          <section class="action-hub__workflows">
            <div class="panel__meta action-hub__meta">Оберіть розділ, з яким хочете працювати далі.</div>
            <div class="cabinet-actions">
              <section class="action-group">
                <h3 class="action-group__title">Куди перейти далі</h3>
                <div class="action-group__items">
                  <RouterLink class="action-tile" to="/cabinet/slots">Створити слоти / Розклад</RouterLink>
                  <RouterLink class="action-tile" to="/cabinet/sessions">Перейти до сесій</RouterLink>
                  <RouterLink class="action-tile" to="/cabinet/clients">Перейти до клієнтів</RouterLink>
                  <RouterLink class="action-tile" to="/cabinet/external-sessions">Гостьові сесії</RouterLink>
                  <RouterLink class="action-tile" to="/cabinet/journal">Авторський журнал</RouterLink>
                  <RouterLink class="action-tile" to="/cabinet/billing">Тарифи і доступ</RouterLink>
                </div>
              </section>
            </div>
          </section>
        </div>
      </section>
      <section class="panel panel--wide panel--plan">
        <div class="panel__header">
          <div>
            <h2 class="panel__title panel__title--compact">Короткий стан доступу</h2>
          </div>
          <RouterLink
            class="btn btn--ghost btn--sm"
            to="/cabinet/billing"
          >
            Відкрити тарифи і доступ
          </RouterLink>
        </div>
        <div class="plan-row">
          <div class="plan-badges">
            <span class="badge badge--outline">{{ planCodeLabel }}</span>
            <span v-if="planCodeLabel === 'PRO'" class="badge badge--soft">Рекомендовано</span>
          </div>
          <div class="muted plan-hint">Доступ до практики без комісій за сесію</div>
        </div>
        <div class="plan-metrics">
          <div class="plan-metrics__line">
            Активні клієнти: <strong>{{ activeClientsCount }}</strong> з
            <strong>{{ activeClientLimitLabel }}</strong>
          </div>
          <div v-if="guestSessionsUsage" class="plan-metrics__line">
            Гостьові сесії: <strong>{{ guestSessionsUsage.used }} / {{ guestSessionsUsage.limit }}</strong>
          </div>
          <div v-if="isNearLimit" class="plan-warning">Ви наближаєтесь до ліміту плану</div>
        </div>
      </section>
      <section class="panel panel--wide panel--onboarding">
        <div class="panel__header">
          <div>
            <div class="panel__meta">Шлях спеціаліста PRO CONSULT</div>
          </div>
          <div class="onboarding-status" :class="onboardingReady ? 'onboarding-status--ready' : 'onboarding-status--pending'">
            {{ onboardingReady ? 'Готово' : 'Потрібні дії' }}
          </div>
        </div>

        <div v-if="onboardingLoading && !onboardingViewModel" class="onboarding-loading">
          Завантаження стану онбордингу...
        </div>

        <div v-else-if="onboardingViewModel" class="onboarding-layout">
          <ol class="onboarding-steps">
            <li
              v-for="step in onboardingViewModel.steps"
              :key="step.key"
              class="onboarding-step-item"
            >
              <RouterLink
                class="onboarding-step onboarding-step--link"
                :class="step.done ? 'onboarding-step--done' : 'onboarding-step--pending'"
                :to="onboardingStepTo(step)"
              >
                <div class="onboarding-step__title">{{ step.title }}</div>
                <div class="onboarding-step__hint">{{ step.hint }}</div>
                <div class="onboarding-step__action">{{ onboardingStepActionLabel(step) }}</div>
              </RouterLink>
            </li>
          </ol>

          <div v-if="onboardingViewModel.missingItems.length > 0" class="onboarding-list-wrap">
            <h3 class="onboarding-list-title">Що потрібно заповнити</h3>
            <ul class="onboarding-list">
              <li v-for="item in onboardingViewModel.missingItems" :key="item">{{ item }}</li>
            </ul>
          </div>

          <div v-if="onboardingViewModel.warnings.length > 0" class="onboarding-list-wrap onboarding-list-wrap--warning">
            <h3 class="onboarding-list-title">Попередження</h3>
            <ul class="onboarding-list">
              <li v-for="item in onboardingViewModel.warnings" :key="item">{{ item }}</li>
            </ul>
          </div>

          <div class="onboarding-actions">
            <RouterLink
              v-if="onboardingViewModel.primaryCta"
              class="btn"
              :to="onboardingViewModel.primaryCta.to"
            >
              {{ onboardingViewModel.primaryCta.label }}
            </RouterLink>
            <RouterLink
              v-for="action in onboardingViewModel.nextActions"
              :key="`${action.code}-${action.to}`"
              class="btn btn--ghost btn--sm"
              :to="action.to"
            >
              {{ action.label }}
            </RouterLink>
          </div>
        </div>

        <div v-else-if="onboardingLoadError" class="onboarding-error">
          <span>{{ onboardingLoadError }}</span>
          <button class="btn btn--ghost btn--sm" type="button" :disabled="onboardingLoading" @click="retryOnboardingStateLoad">
            Повторити
          </button>
        </div>
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
  type ChatThread,
  type SessionFormat,
} from '../lib/api'
import { formatUkDateTimeCompact, formatUkTime } from '../lib/dateTime'
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
  today_sessions?: WorkQueueSessionPreviewItem[] | null
  notes_reminders_preview?: WorkQueueNoteReminderPreviewItem[] | null
  guest_requests_preview?: WorkQueueGuestRequestPreviewItem[] | null
}

type CabinetWorkQueue = {
  todaySessionsCount: number
  notesRemindersCount: number
  pendingGuestRequestsCount: number
  todaySessions: WorkQueueSessionPreviewItem[]
  notesRemindersPreview: WorkQueueNoteReminderPreviewItem[]
  guestRequestsPreview: WorkQueueGuestRequestPreviewItem[]
}

function createEmptyWorkQueue(): CabinetWorkQueue {
  return {
    todaySessionsCount: 0,
    notesRemindersCount: 0,
    pendingGuestRequestsCount: 0,
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
const WORK_QUEUE_LOAD_ERROR = 'Не вдалося завантажити блок "Сьогодні / До уваги".'

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

const onboardingReady = computed(() => onboardingViewModel.value?.readiness ?? false)
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
  if (step.key === 'profile_core') return '/cabinet/profile'
  if (step.key === 'availability') return '/cabinet/availability-rules'
  if (step.key === 'public_profile') return onboardingPublicProfilePath.value
  if (step.key === 'inbound_readiness') return '/cabinet/inquiries'
  return step.to
}

function onboardingStepActionLabel(step: OnboardingStep) {
  if (step.key === 'profile_core') return 'Керувати профілем'
  if (step.key === 'availability') return 'Налаштувати доступність'
  if (step.key === 'public_profile') return 'Відкрити публічний профіль'
  if (step.key === 'inbound_readiness') return 'Перейти до звернень'
  return 'Відкрити'
}

const planCodeLabel = computed(() => {
  const raw = me.value?.effective_entitlements?.plan
  if (raw === 'START' || raw === 'PRO' || raw === 'LEADER') return raw
  return 'START'
})

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
    todaySessions: normalizePreviewList<WorkQueueSessionPreviewItem>(source.today_sessions, 5),
    notesRemindersPreview: normalizePreviewList<WorkQueueNoteReminderPreviewItem>(source.notes_reminders_preview, 3),
    guestRequestsPreview: normalizePreviewList<WorkQueueGuestRequestPreviewItem>(source.guest_requests_preview, 3),
  }
}

function workQueueSessionKey(item: WorkQueueSessionPreviewItem) {
  const id = Number(item.id ?? item.session_id ?? 0)
  if (id > 0) return `session-${id}`
  return `session-${item.starts_at || item.slot_start_at || item.scheduled_at || 'unknown'}`
}

function workQueueReminderKey(item: WorkQueueNoteReminderPreviewItem) {
  const id = Number(item.id ?? item.session_id ?? 0)
  if (id > 0) return `reminder-${id}`
  return `reminder-${item.reminder_at || item.slot_start_at || item.starts_at || item.created_at || 'unknown'}`
}

function workQueueGuestRequestKey(item: WorkQueueGuestRequestPreviewItem) {
  const id = Number(item.id ?? 0)
  if (id > 0) return `guest-${id}`
  return `guest-${item.requested_slot_start || item.starts_at || item.created_at || 'unknown'}`
}

function workQueueSessionClientLabel(item: WorkQueueSessionPreviewItem) {
  const fromDisplayName = normalizeClientName(item.client_display_name)
  if (fromDisplayName) return fromDisplayName
  const fromClientNameParts = fullName(item.client_first_name, item.client_last_name)
  if (fromClientNameParts) return fromClientNameParts
  const fromNameParts = fullName(item.first_name, item.last_name)
  if (fromNameParts) return fromNameParts
  return 'Клієнт без імені'
}

function workQueueReminderClientLabel(item: WorkQueueNoteReminderPreviewItem) {
  const fromDisplayName = normalizeClientName(item.client_display_name)
  if (fromDisplayName) return fromDisplayName
  const fromClientNameParts = fullName(item.client_first_name, item.client_last_name)
  if (fromClientNameParts) return fromClientNameParts
  const fromNameParts = fullName(item.first_name, item.last_name)
  if (fromNameParts) return fromNameParts
  return 'Клієнт без імені'
}

function workQueueGuestRequestClientLabel(item: WorkQueueGuestRequestPreviewItem) {
  const fromDisplayName = normalizeClientName(item.client_display_name)
  if (fromDisplayName) return fromDisplayName
  const fromGuestName = normalizeClientName(item.guest_name)
  if (fromGuestName) return fromGuestName
  return 'Гість без імені'
}

function workQueueSessionTimeLabel(item: WorkQueueSessionPreviewItem) {
  const value = item.slot_start_at || item.starts_at || item.scheduled_at || null
  return formatUkTime(value)
}

function workQueueReminderTimeLabel(item: WorkQueueNoteReminderPreviewItem) {
  const value = item.reminder_at || item.slot_start_at || item.starts_at || item.created_at || null
  return formatUkDateTimeCompact(value)
}

function workQueueGuestRequestTimeLabel(item: WorkQueueGuestRequestPreviewItem) {
  const value = item.requested_slot_start || item.starts_at || item.created_at || null
  return formatUkDateTimeCompact(value)
}

function workQueueSessionStatusLabel(status?: string | null) {
  if (status === 'SCHEDULED') return 'Заплановано'
  if (status === 'CONFIRMED') return 'Підтверджено'
  if (status === 'COMPLETED') return 'Завершено'
  if (status === 'CANCELLED') return 'Скасовано'
  if (status === 'NO_SHOW') return 'Не відбулося'
  return status || '—'
}

function workQueueGuestRequestStatusLabel(status?: string | null) {
  const normalized = (status || '').trim().toLowerCase()
  if (normalized === 'pending') return 'Очікує'
  if (normalized === 'approved') return 'Погоджено'
  if (normalized === 'declined') return 'Відхилено'
  if (normalized === 'cancelled') return 'Скасовано'
  return status || '—'
}

function workQueueSessionFormatLabel(
  item: Pick<WorkQueueSessionPreviewItem, 'session_format' | 'meeting_mode'>
): string {
  if (item.session_format === 'offline' || item.meeting_mode === 'OFFLINE') return 'Офлайн'
  if (item.session_format === 'online' || item.meeting_mode === 'ONLINE') return 'Онлайн'
  return ''
}

function workQueueSessionTo(item: WorkQueueSessionPreviewItem) {
  const id = Number(item.id ?? item.session_id ?? 0)
  if (id > 0) return `/cabinet/sessions/${id}`
  return '/cabinet/sessions'
}

function workQueueReminderTo(item: WorkQueueNoteReminderPreviewItem) {
  const sessionId = Number(item.session_id ?? 0)
  if (sessionId > 0) return `/cabinet/sessions/${sessionId}`
  const clientId = Number(item.client_id ?? 0)
  if (clientId > 0) return `/cabinet/clients?client=${clientId}&autoOpen=1`
  return '/cabinet/clients'
}

function preferredSessionClientName(session: CabinetSession) {
  const candidates = [
    session.client_display_name,
    session.display_name,
    fullName(session.client_first_name, session.client_last_name),
    fullName(session.first_name, session.last_name),
    session.client_name,
    session.client_username,
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

const nearestUpcomingSession = computed(() => upcomingSorted.value[0] || null)

const nearestSessionMeetingUrl = computed(() => {
  if (!nearestUpcomingSession.value) return ''
  return normalizeMeetingUrl(nearestUpcomingSession.value.meeting_url)
})

const isNearestSessionOffline = computed(() => {
  if (!nearestUpcomingSession.value) return false
  return isOfflineSession(nearestUpcomingSession.value)
})

const nearestSessionOfflineLocation = computed(() => {
  if (!isNearestSessionOffline.value || !nearestUpcomingSession.value) return ''
  return (nearestUpcomingSession.value.offline_location || '').trim()
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

const nearestSessionFormatLabel = computed(() => {
  if (!nearestUpcomingSession.value) return '—'
  return isOfflineSession(nearestUpcomingSession.value) ? 'Офлайн' : 'Онлайн'
})

const nearestSessionStatusLabel = computed(() => {
  if (!nearestUpcomingSession.value) return ''
  if (nearestUpcomingSession.value.status === 'SCHEDULED') return 'Потрібне підтвердження'
  if (nearestUpcomingSession.value.status === 'CONFIRMED') return 'Підтверджено'
  return nearestUpcomingSession.value.status
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

function formatDateTime(value?: string | null) {
  return formatUkDateTimeCompact(value)
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
  gap: 24px;
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
  gap: 18px;
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(circle at 92% 70%, color-mix(in srgb, var(--pc-peach-100) 70%, transparent) 0 120px, transparent 121px),
    linear-gradient(135deg, #ffffff 0%, color-mix(in srgb, var(--pc-primary-soft) 70%, #ffffff) 54%, color-mix(in srgb, var(--pc-yellow-soft) 45%, #ffffff) 100%);
  border: 1px solid var(--pc-border);
  border-radius: var(--pc-radius-panel);
  padding: clamp(18px, 2.2vw, 28px);
  box-shadow: var(--pc-shadow-soft);
  min-width: 0;
  max-width: 100%;
}

.cabinet__hero > div {
  min-width: 0;
  position: relative;
  z-index: 1;
}

.cabinet__hero::after {
  content: "";
  position: absolute;
  right: -44px;
  bottom: -58px;
  width: 180px;
  height: 180px;
  border-radius: 999px;
  background: rgba(247, 183, 126, 0.18);
  pointer-events: none;
}

.cabinet__title {
  margin: 8px 0 8px;
  font-size: 32px;
  line-height: 1.15;
  color: var(--pc-navy-950);
  letter-spacing: 0;
}

.cabinet__subtitle {
  max-width: 520px;
  font-size: 16px;
  line-height: 1.55;
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

.panel--action-hub {
  gap: 16px;
  border-color: var(--pc-border);
  background: linear-gradient(
    165deg,
    color-mix(in srgb, var(--pc-bg-card) 92%, var(--pc-blue-soft)),
    color-mix(in srgb, var(--pc-bg-card) 88%, var(--pc-teal-100))
  );
  box-shadow: var(--pc-shadow-soft);
}

.panel--work-queue {
  gap: 16px;
  border-color: var(--pc-border);
  background: linear-gradient(
    165deg,
    color-mix(in srgb, var(--pc-bg-card) 94%, var(--pc-teal-100)),
    color-mix(in srgb, var(--pc-bg-card) 90%, var(--pc-peach-100))
  );
  box-shadow: var(--pc-shadow-soft);
}

.work-queue {
  display: grid;
  gap: 14px;
  min-width: 0;
}

.work-queue__state {
  border: 1px solid var(--line);
  border-radius: var(--pc-radius-panel);
  padding: 12px;
  display: grid;
  gap: 10px;
}

.work-queue__state--loading {
  background: rgba(8, 113, 201, 0.08);
  color: #11445d;
}

.work-queue__state--error,
.work-queue__inline-error {
  border: 1px solid rgba(179, 29, 29, 0.35);
  background: rgba(250, 232, 232, 0.9);
  color: #7d1f1f;
}

.work-queue__inline-error {
  border-radius: var(--pc-radius-control);
  padding: 10px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.work-queue__summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
  min-width: 0;
}

.work-queue-summary-card {
  border: 1px solid var(--pc-border);
  border-radius: var(--pc-radius-panel);
  background: var(--pc-bg-card);
  padding: 14px 16px;
  text-decoration: none;
  color: inherit;
  display: grid;
  gap: 6px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  min-width: 0;
}

.work-queue-summary-card:hover {
  border-color: color-mix(in srgb, var(--pc-navy-900) 28%, var(--pc-border));
  box-shadow: var(--pc-shadow-soft);
}

.work-queue-summary-card:focus-visible {
  outline: 2px solid rgba(31, 74, 96, 0.35);
  outline-offset: 1px;
}

.work-queue-summary-card__label {
  font-size: 13px;
  color: var(--pc-text-muted);
}

.work-queue-summary-card__value {
  font-size: 32px;
  font-family: var(--font-display);
  font-weight: 700;
  line-height: 1.1;
  color: var(--pc-navy-950);
}

.work-queue-summary-card__cta {
  font-size: 13px;
  font-weight: 600;
  color: var(--pc-navy-900);
}

.work-queue-summary-card[data-kind="sessions"] {
  background: color-mix(in srgb, var(--pc-bg-card) 86%, var(--pc-blue-soft));
}

.work-queue-summary-card[data-kind="notes"] {
  background: color-mix(in srgb, var(--pc-bg-card) 86%, var(--pc-peach-100));
}

.work-queue-summary-card[data-kind="guest"] {
  background: color-mix(in srgb, var(--pc-bg-card) 86%, var(--pc-teal-100));
}

.work-queue__preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
  min-width: 0;
}

.work-queue-list {
  border: 1px solid rgba(7, 47, 71, 0.12);
  border-radius: var(--pc-radius-panel);
  background: #fff;
  padding: 14px;
  display: grid;
  gap: 10px;
  min-width: 0;
}

.work-queue-list__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.work-queue-list__title {
  margin: 0;
  font-size: 16px;
}

.work-queue-list__items {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 10px;
}

.work-queue-list__item {
  border: 1px solid rgba(7, 47, 71, 0.1);
  border-radius: var(--pc-radius-control);
  padding: 10px;
  display: grid;
  gap: 6px;
}

.work-queue-list__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.work-queue-list__time {
  font-size: 14px;
  color: var(--muted);
}

.work-queue-list__status {
  font-size: 13px;
  font-weight: 600;
  color: #1f4a60;
}

.work-queue-list__client {
  font-size: 15px;
  font-weight: 600;
}

.work-queue-list__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 13px;
  color: var(--muted);
}

.work-queue-list__link {
  width: fit-content;
  font-size: 13px;
  font-weight: 600;
  color: #1f4a60;
  text-decoration: none;
}

.work-queue-list__link:hover {
  text-decoration: underline;
}

.work-queue-list__empty {
  margin: 0;
  font-size: 13px;
  line-height: 1.4;
}

.action-hub {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
  gap: 16px;
  align-items: start;
  min-width: 0;
}

.action-hub--fallback {
  grid-template-columns: minmax(0, 0.78fr) minmax(0, 1.22fr);
}

.action-hub__nearest {
  margin: 0;
  min-width: 0;
}

.action-hub__nearest--compact {
  padding: 12px;
  gap: 8px;
  background: #fff;
}

.action-hub__nearest--compact .action-hub__title {
  font-size: 17px;
}

.action-hub__workflows {
  display: grid;
  gap: 12px;
  min-width: 0;
}

.action-hub__title {
  font-size: 22px;
}

.action-hub__meta {
  font-size: 14px;
}

.action-hub__empty {
  margin: 0;
  line-height: 1.45;
}

.panel--nearest-session {
  gap: 12px;
  background: linear-gradient(145deg, rgba(7, 47, 71, 0.03), rgba(8, 113, 201, 0.08));
}

.nearest-session__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
  min-width: 0;
}

.nearest-session__item {
  border: 1px solid rgba(7, 47, 71, 0.12);
  border-radius: var(--pc-radius-panel);
  background: #fff;
  padding: 12px 14px;
  display: grid;
  gap: 5px;
}

.nearest-session__label {
  font-size: 13px;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.nearest-session__value {
  font-weight: 600;
}

.nearest-session__meta {
  font-size: 13px;
}

.nearest-session__hint {
  font-size: 15px;
  line-height: 1.5;
}

.nearest-session__actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.nearest-session__status {
  width: fit-content;
  padding: 6px 10px;
  border-radius: var(--radius-pill);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
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

.panel--plan {
  display: grid;
  gap: 12px;
}

.panel--onboarding {
  display: grid;
  gap: 12px;
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

.onboarding-loading {
  font-size: 14px;
  color: var(--muted);
}

.onboarding-layout {
  display: grid;
  gap: 14px;
}

.onboarding-steps {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.onboarding-step-item {
  min-height: 100%;
}

.onboarding-step {
  border: 1px solid var(--line);
  border-radius: var(--pc-radius-panel);
  padding: 12px 14px;
  display: grid;
  gap: 8px;
}

.onboarding-step--link {
  text-decoration: none;
  color: inherit;
  min-height: 100%;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}

.onboarding-step--link:hover {
  border-color: rgba(31, 74, 96, 0.35);
  box-shadow: 0 10px 18px rgba(16, 33, 50, 0.1);
  transform: translateY(-1px);
}

.onboarding-step--link:active {
  transform: translateY(0);
  box-shadow: 0 4px 10px rgba(16, 33, 50, 0.12);
}

.onboarding-step--link:focus-visible {
  outline: 2px solid rgba(31, 74, 96, 0.35);
  outline-offset: 1px;
}

.onboarding-step--done {
  border-color: rgba(31, 122, 76, 0.28);
  background: rgba(31, 122, 76, 0.06);
}

.onboarding-step--pending {
  border-color: rgba(217, 164, 65, 0.35);
  background: rgba(217, 164, 65, 0.09);
}

.onboarding-step__title {
  font-size: 15px;
  font-weight: 600;
}

.onboarding-step__hint {
  font-size: 13px;
  color: var(--muted);
}

.onboarding-step__action {
  margin-top: 2px;
  font-size: 13px;
  font-weight: 600;
  color: #1f4a60;
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

.plan-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.plan-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.badge--outline {
  border: 1px solid rgba(31, 74, 96, 0.25);
  background: transparent;
  color: var(--ink);
}

.plan-hint {
  font-size: 14px;
}

.plan-metrics {
  display: grid;
  gap: 10px;
}

.plan-metrics__line {
  font-size: 15px;
}

.progress {
  width: 100%;
  height: 8px;
  border-radius: var(--radius-pill);
  background: color-mix(in srgb, var(--primary) 15%, #ffffff);
  overflow: hidden;
}

.progress__bar {
  height: 100%;
  border-radius: inherit;
  background: color-mix(in srgb, var(--primary) 75%, #ffffff);
}

.plan-warning {
  color: #8a6b2f;
  font-size: 14px;
}

.plan-nudge {
  font-size: 14px;
  color: var(--muted);
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

.badge--soft {
  background: rgba(8, 113, 201, 0.12);
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

.cabinet-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  min-width: 0;
}

.action-group {
  border: 1px solid var(--line);
  border-radius: var(--pc-radius-panel);
  padding: 12px;
  display: grid;
  gap: 10px;
  background: rgba(7, 47, 71, 0.02);
  min-width: 0;
}

.action-group__title {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
}

.action-group__items {
  display: grid;
  gap: 8px;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  min-width: 0;
}

.action-tile {
  min-height: 48px;
  padding: 12px 14px;
  border-radius: var(--pc-radius-panel);
  border: 1px solid var(--pc-border);
  background: var(--pc-bg-card);
  text-decoration: none;
  color: var(--pc-navy-900);
  font-weight: 600;
  display: flex;
  align-items: center;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
  min-width: 0;
}

.action-tile:hover {
  border-color: color-mix(in srgb, var(--pc-navy-900) 30%, var(--pc-border));
  box-shadow: var(--pc-shadow-soft);
  transform: translateY(-1px);
}

.action-tile:active {
  transform: translateY(0);
  box-shadow: 0 4px 10px rgba(16, 33, 50, 0.12);
}

.action-tile:focus-visible {
  outline: 2px solid rgba(31, 74, 96, 0.35);
  outline-offset: 1px;
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

  .action-hub {
    grid-template-columns: 1fr;
  }

  .work-queue__inline-error {
    flex-direction: column;
    align-items: flex-start;
  }

  .cabinet-actions {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 900px) {
  .cabinet {
    gap: 16px;
    padding: 12px;
  }

  .cabinet__hero {
    padding: 14px 16px;
    gap: 10px;
    border-radius: var(--pc-radius-panel);
  }

  .cabinet__hero::after {
    display: none;
  }

  .cabinet__title {
    font-size: 28px;
    line-height: 1.14;
    margin: 2px 0;
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
    gap: 14px;
    padding: 10px;
  }

  .cabinet__hero {
    padding: 12px;
    gap: 10px;
    border-radius: var(--pc-radius-panel);
  }

  .cabinet__title {
    font-size: 24px;
    line-height: 1.16;
    margin: 4px 0;
  }

  .cabinet__subtitle {
    font-size: 13px;
    line-height: 1.35;
    max-width: 100%;
    margin: 0;
    display: -webkit-box;
    -webkit-line-clamp: 2;
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
