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
      <RouterLink class="btn" to="/client/therapists">Обрати терапевта</RouterLink>
    </header>

    <div class="card">
      <div class="card__title">Обраний терапевт</div>
      <div v-if="selectedTherapist" class="selected-therapist">
        <img
          v-if="selectedTherapist.photo_url"
          :src="selectedTherapist.photo_url"
          :alt="selectedTherapist.display_name"
          class="therapist-photo"
        />
        <div v-else class="therapist-photo therapist-photo--empty">Фото</div>
        <div class="therapist-info">
          <div class="therapist-name">{{ selectedTherapist.display_name }}</div>
          <div class="muted meta-line">
            <span v-if="selectedTherapist.location">{{ selectedTherapist.location }}</span>
            <span v-if="languageLabel(selectedTherapist.languages)">
              {{ languageLabel(selectedTherapist.languages) }}
            </span>
          </div>
          <div v-if="priceLabel(selectedTherapist)" class="therapist-price">
            {{ priceLabel(selectedTherapist) }}
          </div>
          <div class="selected-actions">
            <RouterLink class="btn btn--ghost" :to="`/t/${selectedTherapist.public_slug}`">
              Відкрити профіль
            </RouterLink>
            <RouterLink class="btn" to="/client/therapists">Змінити терапевта</RouterLink>
            <RouterLink class="btn btn--ghost" to="/client/therapists">Додати терапевта</RouterLink>
          </div>
        </div>
      </div>
      <div v-else class="muted">
        Ви ще не обрали терапевта. Натисніть “Обрати терапевта”, щоб переглянути список.
      </div>
    </div>

    <div class="card">
      <div class="card__title">Переглянуті терапевти</div>
      <div v-if="viewedTherapists.length === 0" class="muted">
        Ви ще не переглядали профілі терапевтів.
      </div>
      <div v-else class="therapist-grid" :class="{ 'therapist-grid--compact': viewedTherapists.length === 1 }">
        <div v-for="therapist in viewedTherapists" :key="therapist.public_slug" class="therapist-card">
          <RouterLink class="therapist-photo-link" :to="`/t/${therapist.public_slug}`">
            <img
              v-if="therapist.photo_url"
              :src="therapist.photo_url"
              :alt="therapist.display_name"
              class="therapist-photo"
            />
            <div v-else class="therapist-photo therapist-photo--empty">Фото</div>
          </RouterLink>
          <div class="therapist-info">
            <div class="therapist-name">{{ therapist.display_name }}</div>
            <div class="muted meta-line">
              <span v-if="therapist.location">{{ therapist.location }}</span>
              <span v-if="languageLabel(therapist.languages)">
                {{ languageLabel(therapist.languages) }}
              </span>
            </div>
          <div v-if="priceLabel(therapist)" class="therapist-price">{{ priceLabel(therapist) }}</div>
        </div>
        </div>
      </div>
    </div>

    <div class="client__grid">
      <div class="card">
        <div class="card__title">Найближчі</div>
        <div v-if="loading" class="muted">Завантаження...</div>
        <div v-else-if="upcoming.length === 0" class="muted">Немає запланованих сесій.</div>
        <ul v-else class="session-list">
          <li v-for="session in upcoming" :key="session.id" class="session-item">
            <div>
              <div class="session-time">{{ formatDateTime(session.slot?.start_at || session.slot_start_at) }}</div>
              <div class="muted">Статус: {{ statusLabel(session.status) }}</div>
            </div>
            <div class="pill">{{ statusLabel(session.status) }}</div>
          </li>
        </ul>
      </div>

      <div class="card">
        <div class="card__title">Минулі</div>
        <div v-if="loading" class="muted">Завантаження...</div>
        <div v-else-if="past.length === 0" class="muted">Ще немає історії.</div>
        <ul v-else class="session-list">
          <li v-for="session in past" :key="session.id" class="session-item">
            <div>
              <div class="session-time">{{ formatDateTime(session.slot?.start_at || session.slot_start_at) }}</div>
              <div class="muted">Статус: {{ statusLabel(session.status) }}</div>
            </div>
            <div class="pill pill--ghost">{{ statusLabel(session.status) }}</div>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { http } from '../lib/http'

type Slot = {
  start_at: string
  end_at: string
}

type Session = {
  id: number
  status: string
  slot: Slot | null
  slot_start_at?: string | null
  slot_end_at?: string | null
}

type SelectedTherapist = {
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
const selectedTherapist = ref<SelectedTherapist | null>(null)
const viewedTherapists = ref<SelectedTherapist[]>([])

const statusMap: Record<string, string> = {
  SCHEDULED: 'Заплановано',
  CONFIRMED: 'Підтверджено',
  COMPLETED: 'Завершено',
  CANCELLED: 'Скасовано',
  NO_SHOW: 'Не відбулося',
  DRAFT: 'Чернетка',
}

const statusLabel = (status: string) => statusMap[status] || status

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

async function loadSessions() {
  loading.value = true
  try {
    const [upcomingResp, pastResp] = await Promise.all([
      http.get<Session[]>('/booking/sessions/', { params: { upcoming: true } }),
      http.get<Session[]>('/booking/sessions/', { params: { upcoming: false } }),
    ])
    upcoming.value = upcomingResp.data
    past.value = pastResp.data
  } finally {
    loading.value = false
  }
}

function loadSelectedTherapist() {
  const raw = localStorage.getItem('selectedTherapist')
  if (!raw) return
  try {
    selectedTherapist.value = JSON.parse(raw)
  } catch {
    selectedTherapist.value = null
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

onMounted(() => {
  loadSessions()
  loadSelectedTherapist()
  loadViewedTherapists()
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

.selected-therapist {
  display: grid;
  gap: 14px;
  grid-template-columns: 140px 1fr;
  align-items: center;
}

.therapist-photo-link {
  width: 140px;
  height: 140px;
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
  grid-template-columns: repeat(auto-fit, minmax(220px, 280px));
}

.therapist-grid--compact .therapist-card {
  max-width: 320px;
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

.session-time {
  font-weight: 600;
}

.pill {
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 12px;
  background: rgba(111, 142, 151, 0.2);
}

.pill--ghost {
  background: rgba(111, 142, 151, 0.12);
}

@media (max-width: 860px) {
  .client__hero {
    flex-direction: column;
    align-items: flex-start;
  }

  .selected-therapist {
    grid-template-columns: 1fr;
  }
}
</style>
