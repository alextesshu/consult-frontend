<template>
  <section class="client">
    <header class="client__hero card">
      <div>
        <div class="eyebrow">Клієнтський кабінет</div>
        <h1 class="title">Ваші сесії</h1>
        <p class="muted">
          Тут зібрані всі заплановані та минулі сесії. Для нового запису відкрийте профіль спеціаліста.
        </p>
      </div>
      <div class="client-hero-actions">
        <RouterLink
          v-if="prioritySession"
          class="btn"
          :class="isPriorityLive ? 'btn--live' : 'btn--ghost'"
          :to="`/client/sessions/${prioritySession.id}`"
        >
          {{ isPriorityLive ? 'Сесія триває' : 'Найближча сесія' }}
        </RouterLink>
        <button v-else class="btn btn--ghost btn--disabled" type="button" disabled>
          Найближча сесія
        </button>
        <RouterLink class="btn" to="/specialists">Додати спеціаліста</RouterLink>
        <RouterLink class="btn btn--ghost" to="/client/profile">Мій профіль</RouterLink>
      </div>
    </header>

    <div id="selected-specialists" class="card">
      <div class="card__title">Обрані спеціалісти</div>
      <div v-if="selectedSpecialistsWithSessions.length === 0" class="muted">
        Ви ще не обрали спеціалістів. Натисніть "Обрати спеціаліста", щоб перейти в каталог.
      </div>
      <div
        v-else
        class="therapist-grid"
        :class="{ 'therapist-grid--compact': selectedSpecialistsWithSessions.length === 1 }"
      >
        <RouterLink
          v-for="therapist in selectedSpecialistsWithSessions"
          :key="therapist.public_slug"
          class="therapist-card"
          :to="`/s/${therapist.public_slug}`"
        >
          <div class="therapist-photo-link">
            <img
              v-if="therapist.photo_url"
              :src="therapist.photo_url"
              :alt="publicName(therapist.display_name)"
              @error="onPhotoError(therapist)"
              class="therapist-photo"
            />
            <div v-else class="therapist-photo therapist-photo--empty">Фото</div>
          </div>
          <div class="therapist-info">
            <div class="therapist-name">{{ publicName(therapist.display_name) }}</div>
            <div class="muted meta-line">
              <span v-if="therapist.location">{{ therapist.location }}</span>
              <span v-if="languageLabel(therapist.languages)">
                {{ languageLabel(therapist.languages) }}
              </span>
            </div>
            <div v-if="priceLabel(therapist)" class="therapist-price">{{ priceLabel(therapist) }}</div>
            <div v-if="introPriceLabel(therapist)" class="therapist-price therapist-price--intro">
              Ознайомча: {{ introPriceLabel(therapist) }}
            </div>
            <div class="therapist-sessions">
              <div>
                <span class="session-label">Підтверджена:</span>
                <span class="session-value">
                  {{ formatSession(nextSession(therapist.therapist_id, 'CONFIRMED') || nextSession(therapist.therapist_id, 'CONFIRMED')) }}
                </span>
              </div>
              <div>
                <span class="session-label">Запланована:</span>
                <span class="session-value">
                  {{ formatSession(nextSession(therapist.therapist_id, 'SCHEDULED') || nextSession(therapist.therapist_id, 'SCHEDULED')) }}
                </span>
              </div>
              <button
                class="btn btn--ghost btn--sm"
                type="button"
                @click.stop.prevent="requestStopCollaboration(therapist)"
              >
                Припинити співпрацю
              </button>
            </div>
          </div>
        </RouterLink>
      </div>
      <div v-if="selectedSpecialists.length > 0" class="selected-actions">
        <RouterLink class="btn btn--ghost" to="/specialists">Додати спеціаліста</RouterLink>
      </div>
    </div>

    <div class="card priority-card">
      <div class="card__title">{{ isPriorityLive ? 'Сесія триває' : 'Найближча сесія' }}</div>
      <LoadingSkeleton v-if="loading" variant="card" :count="1" height="112px" />
      <EmptyState
        v-else-if="sessionsError"
        title="Не вдалося завантажити найближчу сесію"
        :description="sessionsError"
      >
        <template #actions>
          <button class="btn btn--ghost" type="button" @click="loadSessions">Спробувати ще раз</button>
        </template>
      </EmptyState>
      <div v-else-if="prioritySession" class="priority-body">
        <div class="priority-content">
          <RouterLink class="priority-main priority-main--clickable" :to="`/client/sessions/${prioritySession.id}`">
            <div class="priority-time">{{ formatDateTime(sessionStartAt(prioritySession)) }}</div>
            <div class="muted">{{ specialistLabel(prioritySession) }}</div>
            <div class="muted">{{ sessionFormatBadge(prioritySession) }}</div>
            <div v-if="meetingBadge(prioritySession)" class="muted">{{ meetingBadge(prioritySession) }}</div>
            <div v-if="isPriorityLive" class="status-pill status-pill--danger">Сесія триває</div>
            <div
              v-else
              class="status-pill"
              :class="{ 'status-pill--warn': prioritySession.status === 'SCHEDULED' }"
            >
              {{ sessionStatusLabel(prioritySession) }}
            </div>
            <div v-if="timeUntilLabel(prioritySession)" class="status-pill status-pill--warn">
              Початок через {{ timeUntilLabel(prioritySession) }}
            </div>
          </RouterLink>
          <div v-if="hasPrioritySecondarySummary" class="priority-secondary">
            <div v-if="priorityAdditionalHint" class="priority-secondary__hint">{{ priorityAdditionalHint }}</div>
            <RouterLink
              v-if="prioritySecondarySession"
              class="priority-secondary__row"
              :to="`/client/sessions/${prioritySecondarySession.id}`"
            >
              {{ compactPrioritySessionLabel(prioritySecondarySession) }}
            </RouterLink>
            <a class="priority-secondary__link" href="#upcoming-sessions">Усі найближчі</a>
          </div>
        </div>
        <div class="priority-actions">
          <a
            v-if="canJoinMeeting(prioritySession)"
            class="btn"
            :href="meetingUrl(prioritySession)"
            target="_blank"
            rel="noopener noreferrer"
          >
            Приєднатися
          </a>
          <RouterLink
            v-if="prioritySession.specialist_public_slug"
            class="btn btn--ghost"
            :to="`/s/${prioritySession.specialist_public_slug}`"
          >
            Профіль спеціаліста
          </RouterLink>
        </div>
      </div>
      <EmptyState
        v-else
        title="Майбутніх сесій поки немає"
        description="Коли у вас з'явиться нова сесія, вона відобразиться тут."
        action-text="Обрати спеціаліста"
        action-to="/specialists"
      />
    </div>

    <div class="card tips-card">
      <div class="card__title">Підказки</div>
      <ul class="tips-list">
        <li>
          <RouterLink class="tips-link" to="/specialists">Обрати спеціаліста</RouterLink>
          <span class="muted">Перегляньте профіль і доступні слоти.</span>
        </li>
        <li>
          <RouterLink class="tips-link" to="/specialists">Каталог спеціалістів</RouterLink>
          <span class="muted">Щоб знайти інших спеціалістів, відкрийте меню "Каталог".</span>
        </li>
        <li>
          <span class="tips-link">Забронювати слот</span>
          <span class="muted">Натисніть "Записатися" у профілі спеціаліста.</span>
        </li>
        <li>
          <span class="tips-link">Слідкувати за статусами</span>
          <span class="muted">Підтвердження та перенесення відобразяться у списку сесій.</span>
        </li>
        <li>
          <span class="tips-link">Приєднатися до онлайн-зустрічі</span>
          <span class="muted">
            Кнопка з'явиться в деталях сесії, на дашборді та в нагадуванні, коли спеціаліст додасть зовнішнє
            посилання.
          </span>
        </li>
      </ul>
    </div>

    <div class="card inquiry-card">
      <div class="card__title">Запити до бронювання</div>
      <LoadingSkeleton v-if="inquiryLoading" variant="list" :count="2" />
      <EmptyState
        v-else-if="inquiryError"
        title="Не вдалося завантажити запити до бронювання"
        :description="inquiryError"
      >
        <template #actions>
          <button class="btn btn--ghost" type="button" @click="loadInquiryDiscoverability">
            Спробувати ще раз
          </button>
        </template>
      </EmptyState>
      <EmptyState
        v-else-if="inquiryEntries.length === 0"
        title="Запити до бронювання поки недоступні"
        description="Оберіть спеціаліста, щоб поставити коротке уточнювальне запитання перед бронюванням."
        action-text="Каталог спеціалістів"
        action-to="/specialists"
      />
      <ul v-else class="session-list">
        <li
          v-for="entry in inquiryEntries"
          :key="entry.specialist_id"
          class="session-item"
          :class="`inquiry-item--${entry.tone}`"
        >
          <div>
            <div class="session-time">{{ entry.specialist_name }}</div>
            <div class="muted">{{ entry.status_label }}</div>
            <div class="muted">{{ entry.description }}</div>
          </div>
          <div class="session-actions">
            <RouterLink
              v-if="entry.action_to && entry.action_label"
              class="btn btn--ghost btn--sm"
              :to="entry.action_to"
            >
              {{ entry.action_label }}
            </RouterLink>
          </div>
        </li>
      </ul>
    </div>
    <div class="card">
      <div class="card__title">Переглянуті спеціалісти</div>
      <div v-if="viewedSpecialists.length === 0" class="muted">
        Ви ще не переглядали профілі спеціалістів.
      </div>
      <div v-else class="therapist-grid" :class="{ 'therapist-grid--compact': viewedSpecialists.length === 1 }">
        <RouterLink
          v-for="therapist in viewedSpecialists"
          :key="therapist.public_slug"
          class="therapist-card"
          :to="`/s/${therapist.public_slug}`"
        >
          <div class="therapist-photo-link">
            <img
              v-if="therapist.photo_url"
              :src="therapist.photo_url"
              :alt="publicName(therapist.display_name)"
              @error="onPhotoError(therapist)"
              class="therapist-photo"
            />
            <div v-else class="therapist-photo therapist-photo--empty">Фото</div>
          </div>
          <div class="therapist-info">
            <div class="therapist-name">{{ publicName(therapist.display_name) }}</div>
            <div class="muted meta-line">
              <span v-if="therapist.location">{{ therapist.location }}</span>
              <span v-if="languageLabel(therapist.languages)">
                {{ languageLabel(therapist.languages) }}
              </span>
            </div>
          <div v-if="priceLabel(therapist)" class="therapist-price">{{ priceLabel(therapist) }}</div>
        </div>
        </RouterLink>
      </div>
    </div>

    <div class="card">
      <div class="card__title">Ваші групові події</div>
      <LoadingSkeleton v-if="groupEventsLoading" variant="list" :count="2" />
      <EmptyState
        v-else-if="groupEventsError"
        title="Не вдалося завантажити групові події"
        :description="groupEventsError"
      >
        <template #actions>
          <button class="btn btn--ghost" type="button" @click="loadGroupEvents">Спробувати ще раз</button>
        </template>
      </EmptyState>
      <EmptyState
        v-else-if="groupEvents.length === 0"
        title="Групових подій поки немає"
        description="Коли ви приєднаєтесь до групової події, вона з'явиться тут."
      />
      <ul v-else class="session-list">
        <li v-for="event in groupEvents" :key="event.id" class="session-item">
          <div>
            <div class="session-time">
              {{ formatDateTime(event.starts_at) }} · {{ eventModeLabel(event.mode) }}
            </div>
            <div class="muted">Статус: {{ statusLabel(event.state) }}</div>
          </div>
          <RouterLink class="btn btn--ghost btn--sm" :to="`/client/group-events/${event.id}`">
            Деталі
          </RouterLink>
        </li>
      </ul>
    </div>

    <div class="client__grid">
      <div id="upcoming-sessions" class="card">
        <div class="card__title">Найближчі</div>
        <LoadingSkeleton v-if="loading" variant="list" :count="2" />
        <EmptyState
          v-else-if="sessionsError"
          title="Не вдалося завантажити заплановані сесії"
          :description="sessionsError"
        >
          <template #actions>
            <button class="btn btn--ghost" type="button" @click="loadSessions">Спробувати ще раз</button>
          </template>
        </EmptyState>
        <EmptyState
          v-else-if="upcoming.length === 0"
          title="Запланованих сесій поки немає"
          description="Коли запис буде створено або підтверджено, він з'явиться тут."
        />
        <ul v-else class="session-list">
          <li
            v-for="session in upcoming"
            :key="session.id"
            class="session-item"
            :class="{ 'session-item--confirmed': session.status === 'CONFIRMED' }"
          >
            <div>
              <div class="session-time">{{ formatDateTime(session.slot?.start_at || session.slot_start_at) }}</div>
              <div class="muted">{{ specialistLabel(session) }}</div>
              <div class="muted">{{ sessionFormatBadge(session) }}</div>
              <div v-if="meetingBadge(session)" class="muted">{{ meetingBadge(session) }}</div>
              <div class="muted">Статус: {{ sessionStatusLabel(session) }}</div>
            </div>
            <div class="session-actions">
              <a
                v-if="canJoinMeeting(session)"
                class="btn btn--sm"
                :href="meetingUrl(session)"
                target="_blank"
                rel="noopener noreferrer"
              >
                Приєднатися
              </a>
              <RouterLink class="btn btn--ghost btn--sm" :to="`/client/sessions/${session.id}`">
                Деталі
              </RouterLink>
              <RouterLink
                v-if="session.specialist_public_slug"
                class="btn btn--ghost btn--sm"
                :to="`/s/${session.specialist_public_slug}`"
              >
                Профіль
              </RouterLink>
            </div>
          </li>
        </ul>
      </div>

      <div class="card">
        <div class="card__title">Минулі</div>
        <LoadingSkeleton v-if="loading" variant="list" :count="2" />
        <EmptyState
          v-else-if="sessionsError"
          title="Не вдалося завантажити історію сесій"
          :description="sessionsError"
        >
          <template #actions>
            <button class="btn btn--ghost" type="button" @click="loadSessions">Спробувати ще раз</button>
          </template>
        </EmptyState>
        <EmptyState
          v-else-if="past.length === 0"
          title="Історія сесій поки порожня"
          description="Після завершених або скасованих сесій історія з'явиться тут."
        />
        <ul v-else class="session-list">
          <li
            v-for="session in past"
            :key="session.id"
            class="session-item"
            :class="{ 'session-item--confirmed': session.status === 'CONFIRMED' }"
          >
            <div>
              <div class="session-time">{{ formatDateTime(session.slot?.start_at || session.slot_start_at) }}</div>
              <div class="muted">{{ specialistLabel(session) }}</div>
              <div class="muted">{{ sessionFormatBadge(session) }}</div>
              <div class="muted">Статус: {{ sessionStatusLabel(session) }}</div>
            </div>
            <div class="session-actions">
              <RouterLink class="btn btn--ghost btn--sm" :to="`/client/sessions/${session.id}`">
                Деталі
              </RouterLink>
              <RouterLink
                v-if="session.specialist_public_slug"
                class="btn btn--ghost btn--sm"
                :to="`/s/${session.specialist_public_slug}`"
              >
                Профіль
              </RouterLink>
            </div>
          </li>
        </ul>
      </div>
    </div>

    <ConfirmModal
      :open="confirmModal.open"
      :title="confirmModal.title"
      :message="confirmModal.message"
      :confirm-text="confirmModal.confirmText"
      :cancel-text="confirmModal.cancelText"
      :tone="confirmModal.tone"
      @confirm="confirmModal.confirm"
      @cancel="confirmModal.closeConfirm"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import {
  apiGet,
  fetchInquiryState,
  fetchPublicSpecialistProfile,
  type InquiryState,
  type PublicSpecialistProfile,
  type SessionFormat,
} from '../lib/api'
import { BOOKING_ERROR_FALLBACKS, getBookingErrorMessage } from '../lib/bookingCopy'
import EmptyState from '../components/EmptyState.vue'
import ConfirmModal from '../components/ConfirmModal.vue'
import LoadingSkeleton from '../components/LoadingSkeleton.vue'
import { useConfirmModal } from '../composables/useConfirmModal'
import { formatUkDateTimeCompact, formatUkTime } from '../lib/dateTime'
import { mapInquiryStateToUi, type InquiryUiTone } from '../lib/inquiryCopy'
import {
  canJoinExternalMeeting,
  externalMeetingProviderLabel,
  normalizeMeetingUrl,
} from '../lib/sessionExecution'

type Slot = {
  start_at: string
  end_at: string
}

type Session = {
  id: number
  status: string
  specialist?: number | any
  specialist_id?: number
  specialist_name?: string | null
  specialist_username?: string | null
  specialist_email?: string | null
  specialist_public_slug?: string | null
  session_format?: SessionFormat | null
  meeting_mode?: 'ONLINE' | 'OFFLINE' | null
  offline_location?: string | null
  meeting_url?: string | null
  meeting_provider?: string | null
  join_available?: boolean
  join_starts_at?: string | null
  join_ends_at?: string | null
  slot: Slot | null
  slot_start_at?: string | null
  slot_end_at?: string | null
}

type TimedUpcomingSession = {
  session: Session
  startTs: number
}

type SelectedSpecialist = {
  therapist_id?: number
  public_slug: string
  display_name: string
  location?: string
  languages?: string | string[]
  price?: string
  price_currency?: string
  intro_price?: string
  intro_price_currency?: string
  photo_url?: string
}

type InquiryCandidate = {
  specialist_id: number
  specialist_name: string
}

type InquiryDashboardEntry = {
  specialist_id: number
  specialist_name: string
  status_label: string
  description: string
  tone: InquiryUiTone
  action_label: string | null
  action_to: string | null
}

const upcoming = ref<Session[]>([])
const past = ref<Session[]>([])
const loading = ref(false)
const sessionsError = ref('')
const selectedSpecialists = ref<SelectedSpecialist[]>([])
const stoppedSpecialists = ref<string[]>([])
const viewedSpecialists = ref<SelectedSpecialist[]>([])
const inquiryEntries = ref<InquiryDashboardEntry[]>([])
const inquiryLoading = ref(false)
const inquiryError = ref('')
const groupEvents = ref<GroupEvent[]>([])
const groupEventsLoading = ref(false)
const groupEventsError = ref('')
const confirmModal = useConfirmModal()
const nowTs = ref(Date.now())
const LIVE_STATUS_REFRESH_MS = 30 * 1000
const SECONDARY_NEAR_TERM_WINDOW_MS = 36 * 60 * 60 * 1000
let nowIntervalId: number | null = null

type GroupEvent = {
  id: number
  mode: 'MEETING' | 'BROADCAST'
  state: 'DRAFT' | 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED'
  starts_at: string | null
  ends_at: string | null
  host_username: string | null
  my_role: string | null
  my_status: string | null
}

const selectedSpecialistsWithSessions = computed(() => selectedSpecialists.value)

const statusMap: Record<string, string> = {
  SCHEDULED: 'Заплановано',
  CONFIRMED: 'Підтверджено',
  COMPLETED: 'Завершено',
  CANCELLED: 'Скасовано',
  NO_SHOW: 'Не відбулося',
  DRAFT: 'Чернетка',
}

const statusLabel = (status: string) => statusMap[status] || status

const sessionStatusLabel = (session: Session) => {
  if (isSessionInProgress(session)) return 'В процесі'
  return statusMap[session.status] || session.status
}

const eventModeLabel = (mode: GroupEvent['mode']) => {
  if (mode === 'MEETING') return 'Зустріч'
  if (mode === 'BROADCAST') return 'Трансляція'
  return mode
}

const formatDateTime = (value?: string | null) => {
  return formatUkDateTimeCompact(value)
}

const languageLabel = (value?: string | string[]) => {
  if (!value) return ''
  if (Array.isArray(value)) return value.join(', ')
  return value
}

const priceLabel = (specialist: SelectedSpecialist) => {
  if (!specialist.price) return ''
  if (specialist.price_currency === 'USD') return `$${specialist.price}`
  if (specialist.price_currency === 'EUR') return `€${specialist.price}`
  return `${specialist.price} грн`
}

const introPriceLabel = (specialist: SelectedSpecialist) => {
  if (!specialist.intro_price) return ''
  if (specialist.intro_price_currency === 'USD') return `$${specialist.intro_price}`
  if (specialist.intro_price_currency === 'EUR') return `€${specialist.intro_price}`
  return `${specialist.intro_price} грн`
}

const sessionStartAt = (session: Session) => session.slot?.start_at || session.slot_start_at || null
const sessionEndAt = (session: Session) => session.slot?.end_at || session.slot_end_at || null

function toTimestamp(value?: string | null) {
  if (!value) return null
  const timestamp = new Date(value).getTime()
  return Number.isNaN(timestamp) ? null : timestamp
}

function sessionStartTs(session: Session) {
  return toTimestamp(sessionStartAt(session))
}

function localDayStartTs(timestamp: number) {
  const value = new Date(timestamp)
  value.setHours(0, 0, 0, 0)
  return value.getTime()
}

function isTodayTimestamp(timestamp: number) {
  return localDayStartTs(timestamp) === localDayStartTs(nowTs.value)
}

function isTomorrowTimestamp(timestamp: number) {
  const tomorrow = new Date(nowTs.value)
  tomorrow.setHours(0, 0, 0, 0)
  tomorrow.setDate(tomorrow.getDate() + 1)
  return localDayStartTs(timestamp) === tomorrow.getTime()
}

function isSessionInProgress(session: Session) {
  if (!['SCHEDULED', 'CONFIRMED'].includes(session.status)) return false
  const startRaw = sessionStartAt(session) || session.join_starts_at
  const endRaw = sessionEndAt(session) || session.join_ends_at
  if (!startRaw || !endRaw) return false
  const start = new Date(startRaw).getTime()
  const end = new Date(endRaw).getTime()
  if (Number.isNaN(start) || Number.isNaN(end)) return false
  const now = nowTs.value
  return now >= start && now <= end
}

const sortedUpcoming = computed<TimedUpcomingSession[]>(() =>
  upcoming.value
    .map((session) => ({ session, startTs: sessionStartTs(session) }))
    .filter((item): item is TimedUpcomingSession => item.startTs !== null)
    .sort((a, b) => a.startTs - b.startTs)
)

const nextUpcoming = computed(() => {
  return sortedUpcoming.value[0]?.session || null
})

const livePrioritySession = computed(() => {
  const items = [...upcoming.value, ...past.value]
    .filter((session, index, arr) => arr.findIndex((other) => other.id === session.id) === index)
    .filter((session) => isSessionInProgress(session))
    .slice()
    .sort((a, b) => (sessionStartTs(a) || 0) - (sessionStartTs(b) || 0))
  return items[0] || null
})

const prioritySession = computed(() => livePrioritySession.value || nextUpcoming.value)
const isPriorityLive = computed(() =>
  prioritySession.value ? isSessionInProgress(prioritySession.value) : false
)
const priorityAdditionalTodaySessions = computed(() => {
  const primary = prioritySession.value
  if (!primary) return []
  const primaryStartTs = sessionStartTs(primary)
  if (primaryStartTs === null || !isTodayTimestamp(primaryStartTs)) return []
  return sortedUpcoming.value
    .filter((item) => item.session.id !== primary.id && isTodayTimestamp(item.startTs))
    .map((item) => item.session)
})
const priorityAdditionalTodayCount = computed(() => priorityAdditionalTodaySessions.value.length)
const prioritySecondarySession = computed(() => {
  const primary = prioritySession.value
  if (!primary) return null

  if (priorityAdditionalTodaySessions.value.length > 0) {
    return priorityAdditionalTodaySessions.value[0]
  }

  const primaryStartTs = sessionStartTs(primary)
  if (primaryStartTs === null) return null

  const baselineTs = Math.max(primaryStartTs, nowTs.value)
  const nextNearSession = sortedUpcoming.value.find(
    (item) => item.session.id !== primary.id && item.startTs >= baselineTs
  )
  if (!nextNearSession) return null
  if (nextNearSession.startTs - baselineTs > SECONDARY_NEAR_TERM_WINDOW_MS) return null
  return nextNearSession.session
})

function meetingWord(count: number) {
  const mod10 = count % 10
  const mod100 = count % 100
  if (mod10 === 1 && mod100 !== 11) return 'зустріч'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'зустрічі'
  return 'зустрічей'
}

const priorityAdditionalHint = computed(() => {
  const additionalToday = priorityAdditionalTodayCount.value
  if (additionalToday > 0) {
    return `Сьогодні ще ${additionalToday} ${meetingWord(additionalToday)}`
  }

  const secondary = prioritySecondarySession.value
  if (!secondary) return ''
  const secondaryStartAt = sessionStartAt(secondary)
  const secondaryStartTs = sessionStartTs(secondary)
  if (!secondaryStartAt || secondaryStartTs === null) return ''
  if (isTomorrowTimestamp(secondaryStartTs)) {
    return `Далі: завтра о ${formatUkTime(secondaryStartAt)}`
  }
  return 'Далі ще 1 найближча сесія'
})

const hasPrioritySecondarySummary = computed(() =>
  Boolean(priorityAdditionalHint.value || prioritySecondarySession.value)
)

function timeUntilLabel(session: Session) {
  const startRaw = sessionStartAt(session)
  if (!startRaw) return ''
  const start = new Date(startRaw).getTime()
  if (Number.isNaN(start)) return ''
  const diffMs = start - nowTs.value
  if (diffMs <= 0) return ''
  const diffMin = Math.round(diffMs / 60000)
  if (diffMin > 120) return ''
  if (diffMin < 60) return `${diffMin} хв`
  const hours = Math.floor(diffMin / 60)
  const mins = diffMin % 60
  return mins ? `${hours} год ${mins} хв` : `${hours} год`
}

function nextSession(therapistId: number | undefined, status: string) {
  if (!therapistId) return null
  const items = upcoming.value
    // Check both specialist (legacy/object) and specialist_id (from serializer)
    .filter((session) => (session.specialist_id === therapistId || session.specialist === therapistId) && session.status === status)
    .map((session) => ({ session, startAt: sessionStartAt(session) }))
    .filter((item) => item.startAt)
    .sort((a, b) => new Date(a.startAt as string).getTime() - new Date(b.startAt as string).getTime())
  return items[0]?.session ?? null
}

function formatSession(session: Session | null) {
  if (!session) return 'Немає'
  return formatDateTime(sessionStartAt(session))
}

function specialistLabel(session: Session) {
  const name = session.specialist_name || session.specialist_username
  if (name) return `Спеціаліст: ${name}`
  if (session.specialist_id) return `Спеціаліст: #${session.specialist_id}`
  return 'Спеціаліст: —'
}

function compactPrioritySessionLabel(session: Session) {
  const startAt = sessionStartAt(session)
  const time = formatUkTime(startAt)
  const specialist = session.specialist_name || session.specialist_username
  if (specialist) return `${time} · ${specialist}`
  if (session.specialist_id) return `${time} · Спеціаліст #${session.specialist_id}`
  return `${time} · Спеціаліст`
}

function resolveSessionFormat(session: Session): SessionFormat {
  if (session.session_format === 'offline') return 'offline'
  if (session.session_format === 'online') return 'online'
  if (session.meeting_mode === 'OFFLINE') return 'offline'
  return 'online'
}

function isOfflineSession(session: Session) {
  return resolveSessionFormat(session) === 'offline'
}

function sessionFormatBadge(session: Session) {
  return `Формат: ${isOfflineSession(session) ? 'Офлайн' : 'Онлайн'}`
}

function meetingUrl(session: Session) {
  return normalizeMeetingUrl(session.meeting_url)
}

function canJoinMeeting(session: Session) {
  if (isOfflineSession(session)) return false
  return canJoinExternalMeeting(session) && session.join_available !== false
}

function meetingBadge(session: Session) {
  if (isOfflineSession(session)) {
    if (session.offline_location) {
      return `Офлайн-сесія: ${session.offline_location}`
    }
    return ''
  }
  const url = meetingUrl(session)
  if (!url) {
    if (['SCHEDULED', 'CONFIRMED'].includes(session.status)) {
      return 'Онлайн-зустріч: посилання ще не додано'
    }
    return ''
  }
  const provider = externalMeetingProviderLabel(session.meeting_provider, url)
  if (['SCHEDULED', 'CONFIRMED'].includes(session.status) && session.join_available === false) {
    return `Онлайн-зустріч: ${provider} · приєднання стане доступним ближче до часу сесії`
  }
  return `Онлайн-зустріч: ${provider}`
}


function inquiryReasonCode(state: InquiryState) {
  if (state.inquiry_exists) {
    return state.can_client_send ? null : state.client_send_reason_code
  }
  return state.can_create_inquiry ? null : state.create_reason_code
}

function inquiryCandidates(): InquiryCandidate[] {
  const merged = [...selectedSpecialists.value, ...viewedSpecialists.value]
  const byId = new Map<number, InquiryCandidate>()
  for (const specialist of merged) {
    const specialistId = Number(specialist.therapist_id)
    if (!Number.isInteger(specialistId) || specialistId <= 0) continue
    if (byId.has(specialistId)) continue
    byId.set(specialistId, {
      specialist_id: specialistId,
      specialist_name: publicName(specialist.display_name) || `Спеціаліст #${specialistId}`,
    })
  }
  return Array.from(byId.values()).slice(0, 6)
}

function mapInquiryEntry(candidate: InquiryCandidate, state: InquiryState): InquiryDashboardEntry {
  const uiCopy = mapInquiryStateToUi({
    status: state.inquiry_status,
    reasonCode: inquiryReasonCode(state),
    actor: 'client',
    mode: state.inquiry_exists ? 'thread' : 'entry',
  })

  if (state.inquiry_status === 'ACTIVE_CLIENT') {
    return {
      ...candidate,
      status_label: 'Доступний повний чат',
      description: uiCopy.body,
      tone: uiCopy.tone,
      action_label: 'Відкрити повний чат',
      action_to: `/client/chat?therapist_id=${candidate.specialist_id}`,
    }
  }

  if (state.inquiry_exists) {
    return {
      ...candidate,
      status_label: 'Запит уже створено',
      description: uiCopy.body,
      tone: uiCopy.tone,
      action_label: 'Відкрити запит',
      action_to: `/client/inquiries/${candidate.specialist_id}`,
    }
  }

  if (state.can_create_inquiry) {
    return {
      ...candidate,
      status_label: 'Запит доступний',
      description: uiCopy.body,
      tone: uiCopy.tone,
      action_label: 'Поставити запитання',
      action_to: `/client/inquiries/${candidate.specialist_id}`,
    }
  }

  return {
    ...candidate,
    status_label: 'Запит недоступний',
    description: uiCopy.body,
    tone: uiCopy.tone,
    action_label: null,
    action_to: null,
  }
}

function publicName(value?: string) {
  if (!value) return ''
  const parts = value.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return ''
  if (parts.length === 1) return parts[0]
  const first = parts[0]
  const last = parts[parts.length - 1]
  if (!last) return first
  const initial = last.charAt(0).toUpperCase()
  return `${first} ${initial}.`
}


async function loadInquiryDiscoverability() {
  inquiryLoading.value = true
  inquiryError.value = ''
  try {
    const candidates = inquiryCandidates()
    if (!candidates.length) {
      inquiryEntries.value = []
      return
    }

    const settled = await Promise.allSettled(
      candidates.map(async (candidate) => {
        const state = await fetchInquiryState(candidate.specialist_id)
        return mapInquiryEntry(candidate, state)
      })
    )

    const loaded: InquiryDashboardEntry[] = []
    let failed = 0
    for (const item of settled) {
      if (item.status === 'fulfilled') {
        loaded.push(item.value)
      } else {
        failed += 1
      }
    }

    inquiryEntries.value = loaded
    if (failed > 0 && loaded.length === 0) {
      inquiryError.value = 'Не вдалося завантажити стан запитів до бронювання.'
    }
  } catch {
    inquiryEntries.value = []
    inquiryError.value = 'Не вдалося завантажити стан запитів до бронювання.'
  } finally {
    inquiryLoading.value = false
  }
}

async function loadSessions() {
  loading.value = true
  sessionsError.value = ''
  try {
    const [upcomingResp, pastResp] = await Promise.all([
      apiGet<Session[]>('/booking/sessions/', { params: { upcoming: true } }),
      apiGet<Session[]>('/booking/sessions/', { params: { upcoming: false } }),
    ])
    upcoming.value = upcomingResp
    past.value = pastResp
  } catch (err: any) {
    sessionsError.value = getBookingErrorMessage(err, BOOKING_ERROR_FALLBACKS.loadSessions)
  } finally {
    loading.value = false
  }
}

async function loadGroupEvents() {
  groupEventsLoading.value = true
  groupEventsError.value = ''
  try {
    const resp = await apiGet<GroupEvent[]>('/booking/group-events/')
    groupEvents.value = resp || []
  } catch (err: any) {
    groupEvents.value = []
    groupEventsError.value = getBookingErrorMessage(err, BOOKING_ERROR_FALLBACKS.loadGroupEvents)
  } finally {
    groupEventsLoading.value = false
  }
}

function loadSelectedSpecialists() {
  const rawList = localStorage.getItem('selectedSpecialists')
  if (rawList) {
    try {
      selectedSpecialists.value = JSON.parse(rawList)
      return
    } catch {
      selectedSpecialists.value = []
    }
  }
  const legacyList = localStorage.getItem('selectedTherapists')
  if (legacyList) {
    try {
      selectedSpecialists.value = JSON.parse(legacyList)
      persistSpecialists()
      return
    } catch {
      selectedSpecialists.value = []
    }
  }
  const legacySingle = localStorage.getItem('selectedTherapist')
  if (!legacySingle) return
  try {
    const parsed = JSON.parse(legacySingle)
    if (parsed?.public_slug) {
      selectedSpecialists.value = [parsed]
      persistSpecialists()
    }
  } catch {
    selectedSpecialists.value = []
  }
}

function loadViewedSpecialists() {
  const raw = localStorage.getItem('viewedSpecialists')
  if (!raw) return
  try {
    viewedSpecialists.value = JSON.parse(raw)
  } catch {
    viewedSpecialists.value = []
  }
  if (viewedSpecialists.value.length) return
  const legacy = localStorage.getItem('viewedTherapists')
  if (!legacy) return
  try {
    viewedSpecialists.value = JSON.parse(legacy)
    persistSpecialists()
  } catch {
    viewedSpecialists.value = []
  }
}


function loadStoppedSpecialists() {
  const raw = localStorage.getItem('stoppedSpecialists')
  if (!raw) return
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) stoppedSpecialists.value = parsed
  } catch {
    stoppedSpecialists.value = []
  }
}

function persistStoppedSpecialists() {
  localStorage.setItem('stoppedSpecialists', JSON.stringify(stoppedSpecialists.value))
}

function requestStopCollaboration(specialist: SelectedSpecialist) {
  const name = specialist.display_name
  const message = name
    ? `Спеціаліст "${name}" зникне з обраних, але історія сесій залишиться.`
    : 'Спеціаліст зникне з обраних, але історія сесій залишиться.'
  confirmModal.openConfirm({
    title: 'Припинити співпрацю?',
    message,
    confirmText: 'Припинити',
    cancelText: 'Скасувати',
    tone: 'danger',
    onConfirm: () => stopCollaboration(specialist),
  })
}

function stopCollaboration(specialist: SelectedSpecialist) {
  if (!specialist.public_slug) return
  if (!stoppedSpecialists.value.includes(specialist.public_slug)) {
    stoppedSpecialists.value.push(specialist.public_slug)
    persistStoppedSpecialists()
  }
  selectedSpecialists.value = selectedSpecialists.value.filter(
    (item) => item.public_slug !== specialist.public_slug
  )
  persistSpecialists()
  void loadInquiryDiscoverability()
}

function persistSpecialists() {
  localStorage.setItem('selectedSpecialists', JSON.stringify(selectedSpecialists.value))
  localStorage.setItem('selectedTherapists', JSON.stringify(selectedSpecialists.value))
  const first = selectedSpecialists.value[0] ?? null
  if (first) {
    localStorage.setItem('selectedTherapist', JSON.stringify(first))
  } else {
    localStorage.removeItem('selectedTherapist')
  }
  localStorage.setItem('viewedSpecialists', JSON.stringify(viewedSpecialists.value))
  localStorage.setItem('viewedTherapists', JSON.stringify(viewedSpecialists.value))
}

function syncSelectedSpecialists() {
  const viewedBySlug = new Map(
    viewedSpecialists.value.map((specialist) => [specialist.public_slug, specialist])
  )
  const recentMap = new Map<string, SelectedSpecialist>()
  const stopped = new Set(stoppedSpecialists.value)
  for (const session of past.value) {
    if (session.status !== 'COMPLETED') continue
    const endRaw = sessionEndAt(session) || sessionStartAt(session)
    if (!endRaw) continue
    const endTs = new Date(endRaw).getTime()
    if (Number.isNaN(endTs)) continue
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000
    if (endTs < cutoff) continue
    const slug = session.specialist_public_slug
    if (!slug || stopped.has(slug)) continue
    if (recentMap.has(slug)) continue
    recentMap.set(slug, {
      therapist_id: session.specialist_id,
      public_slug: slug,
      display_name: session.specialist_name || session.specialist_username || 'Спеціаліст',
    })
  }

  let changed = false
  const filtered = selectedSpecialists.value.filter((specialist) => !stopped.has(specialist.public_slug))
  if (filtered.length !== selectedSpecialists.value.length) {
    selectedSpecialists.value = filtered
    changed = true
  }

  const existingSlugs = new Set(selectedSpecialists.value.map((t) => t.public_slug))
  for (const [slug, seed] of recentMap.entries()) {
    if (existingSlugs.has(slug)) continue
    const enriched = viewedBySlug.get(slug)
    selectedSpecialists.value.push(enriched ?? seed)
    existingSlugs.add(slug)
    changed = true
  }

  if (changed) {
    persistSpecialists()
  }
}

async function hydrateSpecialistProfiles() {
  const all = [...selectedSpecialists.value, ...viewedSpecialists.value]
    .filter((specialist) => specialist.public_slug)
    .map((specialist) => specialist.public_slug)
  const uniqueSlugs = Array.from(new Set(all))
  if (!uniqueSlugs.length) return

  const responses = (await Promise.allSettled(
    uniqueSlugs.map((slug) => fetchPublicSpecialistProfile(slug))
  )) as PromiseSettledResult<PublicSpecialistProfile>[]
  const bySlug = new Map<string, SelectedSpecialist>()
  responses.forEach((res, index) => {
    if (res.status !== 'fulfilled') return
    const data = res.value
    const slug = data.public_slug || data.slug || uniqueSlugs[index]
    if (!slug) return
    bySlug.set(slug, {
      therapist_id: data.therapist_id,
      public_slug: slug,
      display_name: data.display_name,
      location: data.location,
      languages: data.languages,
      price: data.price,
      price_currency: data.price_currency,
      intro_price: data.intro_price,
      intro_price_currency: data.intro_price_currency,
      photo_url: data.photo_url || '',
    })
  })
  if (!bySlug.size) return

  let changed = false
  const mergeSpecialist = (specialist: SelectedSpecialist) => {
    const fresh = bySlug.get(specialist.public_slug)
    if (!fresh) return specialist
    const merged: SelectedSpecialist = {
      ...specialist,
      therapist_id: fresh.therapist_id ?? specialist.therapist_id,
      display_name: fresh.display_name || specialist.display_name,
      location: fresh.location ?? specialist.location,
      languages: fresh.languages ?? specialist.languages,
      price: fresh.price ?? specialist.price,
      price_currency: fresh.price_currency ?? specialist.price_currency,
      intro_price: fresh.intro_price ?? specialist.intro_price,
      intro_price_currency: fresh.intro_price_currency ?? specialist.intro_price_currency,
      photo_url: fresh.photo_url || '',
    }
    if (JSON.stringify(merged) !== JSON.stringify(specialist)) {
      changed = true
      return merged
    }
    return specialist
  }

  selectedSpecialists.value = selectedSpecialists.value.map(mergeSpecialist)
  viewedSpecialists.value = viewedSpecialists.value.map(mergeSpecialist)

  if (changed) {
    persistSpecialists()
  }
}

function onPhotoError(specialist: SelectedSpecialist) {
  if (!specialist.photo_url) return
  specialist.photo_url = ''
  persistSpecialists()
}

onMounted(async () => {
  loadStoppedSpecialists()
  loadSelectedSpecialists()
  loadViewedSpecialists()
  await Promise.all([loadSessions(), loadGroupEvents()])
  syncSelectedSpecialists()
  await hydrateSpecialistProfiles()
  await loadInquiryDiscoverability()
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
.client {
  display: grid;
  gap: 20px;
}

  .client__hero {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
  }

  .client-hero-actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  .client__grid {
    display: grid;
    gap: 20px;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  }

.priority-card {
  display: grid;
  gap: 12px;
}

  .priority-body {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
  }

  .priority-content {
    display: grid;
    gap: 8px;
    min-width: 0;
  }

  .priority-main {
    display: grid;
    gap: 6px;
  }

  .priority-main--clickable {
    color: inherit;
    text-decoration: none;
    border-radius: 10px;
    padding: 2px;
  }

  .priority-main--clickable:hover {
    background: rgba(8, 113, 201, 0.05);
  }

  .priority-main--clickable:focus-visible {
    outline: 2px solid rgba(31, 74, 96, 0.35);
    outline-offset: 2px;
  }

  .priority-time {
    font-family: var(--font-display);
    font-size: 22px;
  }

  .priority-actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  .priority-secondary {
    display: grid;
    gap: 6px;
    padding-left: 2px;
  }

  .priority-secondary__hint {
    font-size: 13px;
    font-weight: 600;
    color: #1f4a60;
  }

  .priority-secondary__row {
    width: fit-content;
    font-size: 13px;
    color: var(--muted);
    text-decoration: none;
  }

  .priority-secondary__row:hover {
    text-decoration: underline;
  }

  .priority-secondary__link {
    width: fit-content;
    font-size: 13px;
    color: var(--muted);
  }

.status-pill {
  width: fit-content;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  background: rgba(7, 47, 71, 0.08);
  color: #13455e;
}

.status-pill--warn {
  background: rgba(217, 164, 65, 0.18);
  color: #a57011;
}

.status-pill--danger {
  background: linear-gradient(135deg, #ea3e3e, #c01717);
  color: #fff;
  border: 1px solid rgba(154, 9, 9, 0.7);
  box-shadow: 0 6px 14px rgba(194, 23, 23, 0.26);
}

.eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.16em;
  font-size: 11px;
  color: var(--muted);
}

.tips-card {
  display: grid;
  gap: 10px;
}

.tips-list {
  margin: 0;
  padding-left: 18px;
  display: grid;
  gap: 10px;
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

.therapist-card {
  display: grid;
  gap: 16px;
  grid-template-columns: 140px 1fr;
  align-items: start;
  padding: 14px;
  border-radius: 16px;
  border: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.9);
  width: 100%;
  text-decoration: none;
  color: inherit;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.therapist-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 16px 24px rgba(16, 33, 50, 0.12);
  border-color: rgba(31, 74, 96, 0.25);
}

.therapist-card:focus-visible {
  outline: 2px solid rgba(31, 74, 96, 0.35);
  outline-offset: 2px;
}

.therapist-photo-link {
  width: 140px;
  aspect-ratio: 1 / 1;
  display: block;
}

.therapist-photo {
  width: 100%;
  height: 100%;
  border-radius: 14px;
  object-fit: cover;
  border: 1px solid var(--line);
}

.therapist-photo--empty {
  display: grid;
  place-items: center;
  background: rgba(7, 47, 71, 0.06);
  color: var(--muted);
  width: 100%;
  height: 100%;
  font-size: 14px;
}

.therapist-info {
  display: grid;
  gap: 6px;
}

.therapist-name {
  font-weight: 600;
}

.meta-line {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.meta-line span + span::before {
  content: " · ";
  color: var(--muted);
}

.therapist-price {
  font-weight: 600;
}

.therapist-price--intro {
  font-weight: 500;
  color: #4c5d6b;
}

.therapist-actions {
  margin-top: 8px;
}

.therapist-sessions {
  display: grid;
  gap: 4px;
  font-size: 13px;
  color: var(--muted);
}

.session-label {
  font-weight: 600;
  color: var(--text);
}

.session-value {
  margin-left: 6px;
}

.selected-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 6px;
}

.therapist-grid {
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.therapist-grid--compact {
  grid-template-columns: minmax(360px, 520px);
}

.therapist-grid--compact .therapist-card {
  max-width: 520px;
}

.session-list {
  list-style: none;
  padding: 0;
  margin: 12px 0 0;
  display: grid;
  gap: 10px;
}

.session-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(111, 142, 151, 0.12);
}

.inquiry-item--info {
  border: 1px solid rgba(29, 91, 138, 0.24);
}

.inquiry-item--warning {
  border: 1px solid rgba(186, 121, 27, 0.3);
  background: rgba(255, 244, 223, 0.55);
}

.session-item--confirmed {
  border: 1px solid rgba(39, 122, 82, 0.35);
  background: linear-gradient(135deg, rgba(212, 243, 225, 0.7), rgba(247, 252, 249, 0.95));
  box-shadow: 0 8px 18px rgba(39, 122, 82, 0.12);
}

.session-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.session-time {
  font-weight: 600;
}

.form-error {
  color: #b3261e;
  background: #fdecea;
  border: 1px solid #f5c2c0;
  border-radius: 10px;
  padding: 8px 10px;
  margin-top: 8px;
}

.btn--sm {
  padding: 6px 10px;
  font-size: 13px;
}

.btn--live {
  background: linear-gradient(135deg, #ea3e3e, #c01717);
  border-color: rgba(154, 9, 9, 0.7);
  color: #fff;
  box-shadow: 0 8px 16px rgba(194, 23, 23, 0.26);
}

.btn--live:hover {
  filter: brightness(1.05);
}

@media (max-width: 860px) {
  .client__hero {
    flex-direction: column;
    align-items: flex-start;
  }

  .client__hero > div:first-child {
    width: 100%;
    min-width: 0;
  }

  .client-hero-actions {
    width: 100%;
  }

  .therapist-card {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .client-hero-actions {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }

  .client-hero-actions .btn,
  .client-hero-actions .btn.btn--ghost,
  .client-hero-actions .btn.btn--live {
    width: 100%;
    max-width: 100%;
    white-space: normal;
    overflow-wrap: anywhere;
  }
}
</style>
