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
          v-if="nextUpcoming"
          class="btn btn--ghost"
          :to="`/client/sessions/${nextUpcoming.id}`"
        >
          Найближча сесія
        </RouterLink>
        <button v-else class="btn btn--ghost btn--disabled" type="button" disabled>
          Найближча сесія
        </button>
        <RouterLink class="btn" to="/specialists">Обрати спеціаліста</RouterLink>
        <RouterLink class="btn btn--ghost" to="/client/profile">Мій профіль</RouterLink>
      </div>
    </header>

    <div class="card profile-card">
      <div>
        <div class="card__title">Профіль клієнта</div>
        <p class="muted">
          Додайте ім'я, контакти та фото, щоб спеціалістам було легше з вами працювати.
        </p>
      </div>
      <RouterLink class="btn btn--ghost" to="/client/profile">Редагувати профіль</RouterLink>
    </div>

    <div class="card priority-card">
      <div class="card__title">Найближча сесія</div>
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
      <div v-else-if="nextUpcoming" class="priority-body">
        <div class="priority-main">
          <div class="priority-time">{{ formatDateTime(sessionStartAt(nextUpcoming)) }}</div>
          <div class="muted">{{ specialistLabel(nextUpcoming) }}</div>
          <div class="status-pill" :class="{ 'status-pill--warn': nextUpcoming.status === 'SCHEDULED' }">
            {{ sessionStatusLabel(nextUpcoming) }}
          </div>
          <div v-if="timeUntilLabel(nextUpcoming)" class="status-pill status-pill--warn">
            Початок через {{ timeUntilLabel(nextUpcoming) }}
          </div>
        </div>
        <div class="priority-actions">
          <RouterLink class="btn btn--ghost" :to="`/client/sessions/${nextUpcoming.id}`">
            Деталі
          </RouterLink>
          <RouterLink
            v-if="nextUpcoming.therapist_public_slug"
            class="btn btn--ghost"
            :to="`/specialist/${nextUpcoming.therapist_public_slug}`"
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
          <span class="tips-link">Забронювати слот</span>
          <span class="muted">Натисніть "Записатися" у профілі спеціаліста.</span>
        </li>
        <li>
          <span class="tips-link">Слідкувати за статусами</span>
          <span class="muted">Підтвердження та перенесення відобразяться у списку сесій.</span>
        </li>
      </ul>
    </div>

    <div class="card">
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
          :to="`/specialist/${therapist.public_slug}`"
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
                  {{ formatSession(nextSession(therapist.therapist_id, 'CONFIRMED')) }}
                </span>
              </div>
              <div>
                <span class="session-label">Запланована:</span>
                <span class="session-value">
                  {{ formatSession(nextSession(therapist.therapist_id, 'SCHEDULED')) }}
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
          :to="`/specialist/${therapist.public_slug}`"
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
      <div class="card">
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
              <div class="muted">Статус: {{ sessionStatusLabel(session) }}</div>
            </div>
            <div class="session-actions">
              <RouterLink class="btn btn--ghost btn--sm" :to="`/client/sessions/${session.id}`">
                Деталі
              </RouterLink>
              <RouterLink
                v-if="session.therapist_public_slug"
                class="btn btn--ghost btn--sm"
                :to="`/specialist/${session.therapist_public_slug}`"
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
              <div class="muted">Статус: {{ sessionStatusLabel(session) }}</div>
            </div>
            <div class="session-actions">
              <RouterLink class="btn btn--ghost btn--sm" :to="`/client/sessions/${session.id}`">
                Деталі
              </RouterLink>
              <RouterLink
                v-if="session.therapist_public_slug"
                class="btn btn--ghost btn--sm"
                :to="`/specialist/${session.therapist_public_slug}`"
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
import { computed, onMounted, ref } from 'vue'
import { fetchPublicSpecialistProfile, type PublicSpecialistProfile } from '../lib/api'
import { apiGet } from '../lib/api'
import EmptyState from '../components/EmptyState.vue'
import ConfirmModal from '../components/ConfirmModal.vue'
import LoadingSkeleton from '../components/LoadingSkeleton.vue'
import { useConfirmModal } from '../composables/useConfirmModal'
import { formatUkDateTimeCompact } from '../lib/dateTime'

type Slot = {
  start_at: string
  end_at: string
}

type Session = {
  id: number
  status: string
  specialist?: number
  therapist_name?: string | null
  therapist_username?: string | null
  therapist_email?: string | null
  therapist_public_slug?: string | null
  slot: Slot | null
  slot_start_at?: string | null
  slot_end_at?: string | null
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

const upcoming = ref<Session[]>([])
const past = ref<Session[]>([])
const loading = ref(false)
const sessionsError = ref('')
const selectedSpecialists = ref<SelectedSpecialist[]>([])
const stoppedSpecialists = ref<string[]>([])
const viewedSpecialists = ref<SelectedSpecialist[]>([])
const groupEvents = ref<GroupEvent[]>([])
const groupEventsLoading = ref(false)
const groupEventsError = ref('')
const confirmModal = useConfirmModal()

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

const recentSpecialistSlugs = computed(() => {
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000
  const stopped = new Set(stoppedSpecialists.value)
  const slugs = new Set<string>()
  for (const session of past.value) {
    if (session.status !== 'COMPLETED') continue
    const endRaw = sessionEndAt(session) || sessionStartAt(session)
    if (!endRaw) continue
    const endTs = new Date(endRaw).getTime()
    if (Number.isNaN(endTs) || endTs < cutoff) continue
    const slug = session.therapist_public_slug
    if (!slug || stopped.has(slug)) continue
    slugs.add(slug)
  }
  return slugs
})

const selectedSpecialistsWithSessions = computed(() =>
  selectedSpecialists.value.filter((specialist) =>
    recentSpecialistSlugs.value.has(specialist.public_slug)
  )
)

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

function isSessionInProgress(session: Session) {
  if (session.status !== 'CONFIRMED') return false
  const startRaw = sessionStartAt(session)
  const endRaw = sessionEndAt(session)
  if (!startRaw || !endRaw) return false
  const start = new Date(startRaw).getTime()
  const end = new Date(endRaw).getTime()
  if (Number.isNaN(start) || Number.isNaN(end)) return false
  const now = Date.now()
  return now >= start && now <= end
}

const nextUpcoming = computed(() => {
  const items = upcoming.value
    .filter((session) => sessionStartAt(session))
    .slice()
    .sort(
      (a, b) =>
        new Date(sessionStartAt(a) || '').getTime() -
        new Date(sessionStartAt(b) || '').getTime()
    )
  return items[0] || null
})

function timeUntilLabel(session: Session) {
  const startRaw = sessionStartAt(session)
  if (!startRaw) return ''
  const start = new Date(startRaw).getTime()
  if (Number.isNaN(start)) return ''
  const diffMs = start - Date.now()
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
    .filter((session) => session.specialist === therapistId && session.status === status)
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
  const name = session.therapist_name || session.therapist_username
  if (name) return `Спеціаліст: ${name}`
  if (session.specialist) return `Спеціаліст: #${session.specialist}`
  return 'Спеціаліст: —'
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
  } catch {
    sessionsError.value = 'Не вдалося завантажити сесії.'
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
  } catch {
    groupEvents.value = []
    groupEventsError.value = 'Не вдалося завантажити групові події.'
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
    const slug = session.therapist_public_slug
    if (!slug || stopped.has(slug)) continue
    if (recentMap.has(slug)) continue
    recentMap.set(slug, {
      therapist_id: session.specialist,
      public_slug: slug,
      display_name: session.therapist_name || session.therapist_username || 'Спеціаліст',
    })
  }

  let changed = false
  selectedSpecialists.value = selectedSpecialists.value.filter(
    (specialist) => recentMap.has(specialist.public_slug) && !stopped.has(specialist.public_slug)
  )

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
    const slug = data.public_slug || uniqueSlugs[index]
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

.profile-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

  .priority-body {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
  }

  .priority-main {
    display: grid;
    gap: 6px;
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

@media (max-width: 860px) {
  .client__hero {
    flex-direction: column;
    align-items: flex-start;
  }

  .therapist-card {
    grid-template-columns: 1fr;
  }
}
</style>
