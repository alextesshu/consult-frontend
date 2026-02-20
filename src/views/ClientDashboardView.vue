<template>
  <section class="client">
    <header class="client__hero card">
      <div>
        <div class="eyebrow">Клієнтський кабінет</div>
        <h1 class="title">Ваші сесії</h1>
        <p class="muted">
          Тут зібрані всі заплановані та минулі сесії. Для нового запису відкрийте профіль терапевта.
        </p>
      </div>
      <RouterLink class="btn" to="/therapists">Обрати терапевта</RouterLink>
    </header>

    <div class="card tips-card">
      <div class="card__title">Підказки</div>
      <ul class="tips-list">
        <li>
          <RouterLink class="tips-link" to="/therapists">Обрати спеціаліста</RouterLink>
          <span class="muted">Перегляньте профіль і доступні слоти.</span>
        </li>
        <li>
          <span class="tips-link">Забронювати слот</span>
          <span class="muted">Натисніть “Записатися” у профілі терапевта.</span>
        </li>
        <li>
          <span class="tips-link">Слідкувати за статусами</span>
          <span class="muted">Підтвердження та перенесення відобразяться у списку сесій.</span>
        </li>
      </ul>
    </div>

    <div class="card">
      <div class="card__title">Обрані терапевти</div>
      <div v-if="selectedTherapistsWithSessions.length === 0" class="muted">
        Ви ще не обрали терапевтів. Натисніть “Обрати терапевта”, щоб перейти в каталог.
      </div>
      <div
        v-else
        class="therapist-grid"
        :class="{ 'therapist-grid--compact': selectedTherapistsWithSessions.length === 1 }"
      >
        <RouterLink
          v-for="therapist in selectedTherapistsWithSessions"
          :key="therapist.public_slug"
          class="therapist-card"
          :to="`/t/${therapist.public_slug}`"
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
            </div>
          </div>
        </RouterLink>
      </div>
      <div v-if="selectedTherapists.length > 0" class="selected-actions">
        <RouterLink class="btn btn--ghost" to="/therapists">Додати терапевта</RouterLink>
      </div>
    </div>

    <div class="card">
      <div class="card__title">Переглянуті терапевти</div>
      <div v-if="viewedTherapists.length === 0" class="muted">
        Ви ще не переглядали профілі терапевтів.
      </div>
      <div v-else class="therapist-grid" :class="{ 'therapist-grid--compact': viewedTherapists.length === 1 }">
        <RouterLink
          v-for="therapist in viewedTherapists"
          :key="therapist.public_slug"
          class="therapist-card"
          :to="`/t/${therapist.public_slug}`"
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
      <div v-if="groupEventsLoading" class="muted">Завантаження...</div>
      <div v-else-if="groupEventsError" class="form-error">{{ groupEventsError }}</div>
      <div v-else-if="groupEvents.length === 0" class="muted">
        Поки що немає групових подій.
      </div>
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
        <div v-if="loading" class="muted">Завантаження...</div>
        <div v-else-if="sessionsError" class="form-error">{{ sessionsError }}</div>
        <div v-else-if="upcoming.length === 0" class="muted">Немає запланованих сесій.</div>
        <ul v-else class="session-list">
          <li
            v-for="session in upcoming"
            :key="session.id"
            class="session-item"
            :class="{ 'session-item--confirmed': session.status === 'CONFIRMED' }"
          >
            <div>
              <div class="session-time">{{ formatDateTime(session.slot?.start_at || session.slot_start_at) }}</div>
              <div class="muted">{{ therapistLabel(session) }}</div>
              <div class="muted">Статус: {{ statusLabel(session.status) }}</div>
            </div>
            <div class="session-actions">
              <RouterLink class="btn btn--ghost btn--sm" :to="`/client/sessions/${session.id}`">
                Деталі
              </RouterLink>
              <RouterLink
                v-if="session.therapist_public_slug"
                class="btn btn--ghost btn--sm"
                :to="`/t/${session.therapist_public_slug}`"
              >
                Профіль
              </RouterLink>
            </div>
          </li>
        </ul>
      </div>

      <div class="card">
        <div class="card__title">Минулі</div>
        <div v-if="loading" class="muted">Завантаження...</div>
        <div v-else-if="sessionsError" class="form-error">{{ sessionsError }}</div>
        <div v-else-if="past.length === 0" class="muted">Ще немає історії.</div>
        <ul v-else class="session-list">
          <li
            v-for="session in past"
            :key="session.id"
            class="session-item"
            :class="{ 'session-item--confirmed': session.status === 'CONFIRMED' }"
          >
            <div>
              <div class="session-time">{{ formatDateTime(session.slot?.start_at || session.slot_start_at) }}</div>
              <div class="muted">{{ therapistLabel(session) }}</div>
              <div class="muted">Статус: {{ statusLabel(session.status) }}</div>
            </div>
            <div class="session-actions">
              <RouterLink class="btn btn--ghost btn--sm" :to="`/client/sessions/${session.id}`">
                Деталі
              </RouterLink>
              <RouterLink
                v-if="session.therapist_public_slug"
                class="btn btn--ghost btn--sm"
                :to="`/t/${session.therapist_public_slug}`"
              >
                Профіль
              </RouterLink>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { fetchPublicTherapistProfile } from '../lib/api'
import { http } from '../lib/http'

type Slot = {
  start_at: string
  end_at: string
}

type Session = {
  id: number
  status: string
  therapist?: number
  therapist_name?: string | null
  therapist_username?: string | null
  therapist_email?: string | null
  therapist_public_slug?: string | null
  slot: Slot | null
  slot_start_at?: string | null
  slot_end_at?: string | null
}

type SelectedTherapist = {
  therapist_id?: number
  public_slug: string
  display_name: string
  location?: string
  languages?: string | string[]
  price?: string
  price_currency?: string
  photo_url?: string
}

const upcoming = ref<Session[]>([])
const past = ref<Session[]>([])
const loading = ref(false)
const sessionsError = ref('')
const selectedTherapists = ref<SelectedTherapist[]>([])
const viewedTherapists = ref<SelectedTherapist[]>([])
const activeStatuses = new Set(['SCHEDULED', 'CONFIRMED'])
const groupEvents = ref<GroupEvent[]>([])
const groupEventsLoading = ref(false)
const groupEventsError = ref('')

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

const selectedTherapistsWithSessions = computed(() =>
  selectedTherapists.value.filter((therapist) =>
    upcoming.value.some(
      (session) =>
        session.therapist === therapist.therapist_id &&
        activeStatuses.has(session.status)
    )
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

const eventModeLabel = (mode: GroupEvent['mode']) => {
  if (mode === 'MEETING') return 'Зустріч'
  if (mode === 'BROADCAST') return 'Трансляція'
  return mode
}

const formatDateTime = (value?: string | null) => {
  if (!value) return '—'
  const dt = new Date(value)
  if (Number.isNaN(dt.getTime())) return value
  return dt.toLocaleString('uk-UA', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const languageLabel = (value?: string | string[]) => {
  if (!value) return ''
  if (Array.isArray(value)) return value.join(', ')
  return value
}

const priceLabel = (therapist: SelectedTherapist) => {
  if (!therapist.price) return ''
  if (therapist.price_currency === 'USD') return `$${therapist.price}`
  if (therapist.price_currency === 'EUR') return `€${therapist.price}`
  return `${therapist.price} грн`
}

const sessionStartAt = (session: Session) => session.slot?.start_at || session.slot_start_at || null

function nextSession(therapistId: number | undefined, status: string) {
  if (!therapistId) return null
  const items = upcoming.value
    .filter((session) => session.therapist === therapistId && session.status === status)
    .map((session) => ({ session, startAt: sessionStartAt(session) }))
    .filter((item) => item.startAt)
    .sort((a, b) => new Date(a.startAt as string).getTime() - new Date(b.startAt as string).getTime())
  return items[0]?.session ?? null
}

function formatSession(session: Session | null) {
  if (!session) return 'Немає'
  return formatDateTime(sessionStartAt(session))
}

function therapistLabel(session: Session) {
  const name = session.therapist_name || session.therapist_username
  if (name) return `Терапевт: ${name}`
  if (session.therapist) return `Терапевт: #${session.therapist}`
  return 'Терапевт: —'
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
      http.get<Session[]>('/booking/sessions/', { params: { upcoming: true } }),
      http.get<Session[]>('/booking/sessions/', { params: { upcoming: false } }),
    ])
    upcoming.value = upcomingResp.data
    past.value = pastResp.data
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
    const resp = await http.get<GroupEvent[]>('/booking/group-events/')
    groupEvents.value = resp.data || []
  } catch {
    groupEvents.value = []
    groupEventsError.value = 'Не вдалося завантажити групові події.'
  } finally {
    groupEventsLoading.value = false
  }
}

function loadSelectedTherapists() {
  const rawList = localStorage.getItem('selectedTherapists')
  if (rawList) {
    try {
      selectedTherapists.value = JSON.parse(rawList)
      return
    } catch {
      selectedTherapists.value = []
    }
  }
  const legacy = localStorage.getItem('selectedTherapist')
  if (!legacy) return
  try {
    const parsed = JSON.parse(legacy)
    if (parsed?.public_slug) {
      selectedTherapists.value = [parsed]
      localStorage.setItem('selectedTherapists', JSON.stringify(selectedTherapists.value))
    }
  } catch {
    selectedTherapists.value = []
  }
}

function loadViewedTherapists() {
  const raw = localStorage.getItem('viewedTherapists')
  if (!raw) return
  try {
    viewedTherapists.value = JSON.parse(raw)
  } catch {
    viewedTherapists.value = []
  }
}

function persistTherapists() {
  localStorage.setItem('selectedTherapists', JSON.stringify(selectedTherapists.value))
  localStorage.setItem('viewedTherapists', JSON.stringify(viewedTherapists.value))
}

function syncSelectedTherapists() {
  const viewedBySlug = new Map(
    viewedTherapists.value.map((therapist) => [therapist.public_slug, therapist])
  )
  let changed = false
  selectedTherapists.value = selectedTherapists.value.map((therapist) => {
    if (therapist.therapist_id) return therapist
    const enriched = viewedBySlug.get(therapist.public_slug)
    if (enriched?.therapist_id) {
      changed = true
      return enriched
    }
    return therapist
  })

  const therapistIds = new Set(
    upcoming.value
      .map((session) => session.therapist)
      .filter((value): value is number => typeof value === 'number')
  )
  if (therapistIds.size) {
    const existingIds = new Set<number>()
    const existingSlugs = new Set<string>()
    for (const therapist of selectedTherapists.value) {
      if (therapist.therapist_id) existingIds.add(therapist.therapist_id)
      existingSlugs.add(therapist.public_slug)
    }
    for (const therapist of viewedTherapists.value) {
      if (!therapist.therapist_id) continue
      if (!therapistIds.has(therapist.therapist_id)) continue
      if (existingIds.has(therapist.therapist_id) || existingSlugs.has(therapist.public_slug)) {
        continue
      }
      selectedTherapists.value.push(therapist)
      existingIds.add(therapist.therapist_id)
      existingSlugs.add(therapist.public_slug)
      changed = true
    }
  }

  if (changed) {
    localStorage.setItem('selectedTherapists', JSON.stringify(selectedTherapists.value))
  }
}

async function hydrateTherapistProfiles() {
  const all = [...selectedTherapists.value, ...viewedTherapists.value]
    .filter((therapist) => therapist.public_slug)
    .map((therapist) => therapist.public_slug)
  const uniqueSlugs = Array.from(new Set(all))
  if (!uniqueSlugs.length) return

  const responses = await Promise.allSettled(
    uniqueSlugs.map((slug) => fetchPublicTherapistProfile(slug))
  )
  const bySlug = new Map<string, SelectedTherapist>()
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
      photo_url: data.photo_url || '',
    })
  })
  if (!bySlug.size) return

  let changed = false
  const mergeTherapist = (therapist: SelectedTherapist) => {
    const fresh = bySlug.get(therapist.public_slug)
    if (!fresh) return therapist
    const merged: SelectedTherapist = {
      ...therapist,
      therapist_id: fresh.therapist_id ?? therapist.therapist_id,
      display_name: fresh.display_name || therapist.display_name,
      location: fresh.location ?? therapist.location,
      languages: fresh.languages ?? therapist.languages,
      price: fresh.price ?? therapist.price,
      price_currency: fresh.price_currency ?? therapist.price_currency,
      photo_url: fresh.photo_url || '',
    }
    if (JSON.stringify(merged) !== JSON.stringify(therapist)) {
      changed = true
      return merged
    }
    return therapist
  }

  selectedTherapists.value = selectedTherapists.value.map(mergeTherapist)
  viewedTherapists.value = viewedTherapists.value.map(mergeTherapist)

  if (changed) {
    persistTherapists()
  }
}

function onPhotoError(therapist: SelectedTherapist) {
  if (!therapist.photo_url) return
  therapist.photo_url = ''
  persistTherapists()
}

onMounted(async () => {
  loadSelectedTherapists()
  loadViewedTherapists()
  await Promise.all([loadSessions(), loadGroupEvents()])
  syncSelectedTherapists()
  await hydrateTherapistProfiles()
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

.client__grid {
  display: grid;
  gap: 20px;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
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
