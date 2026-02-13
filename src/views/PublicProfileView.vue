<template>
  <section class="public">
    <header class="public__hero">
      <div>
        <div class="badge">Публічний профіль</div>
        <h1 class="title public__title">{{ profile?.display_name || 'Сторінка терапевта' }}</h1>
        <p class="muted public__subtitle">
          {{ profile ? 'Публічна картка з описом і доступними слотами.' : 'Завантаження профілю…' }}
        </p>
      </div>
      <RouterLink class="btn btn--ghost" to="/">На головну</RouterLink>
    </header>

    <div v-if="loading" class="muted">Завантаження...</div>
    <div v-else-if="error" class="form-error">{{ error }}</div>

    <section v-else-if="profile" class="public__grid">
      <div class="panel panel--profile">
        <div class="profile-card">
          <div class="profile-card__media">
            <img v-if="profile.photo_url" :src="profile.photo_url" alt="Фото терапевта" />
            <div v-else class="media-placeholder">Фото ще не додано</div>
            <video
              v-if="profile.video_url"
              class="profile-video"
              :src="profile.video_url"
              controls
              preload="metadata"
            ></video>
          </div>
          <div class="profile-card__info">
            <div class="profile-card__title">{{ profile.display_name }}</div>
            <div class="profile-card__meta">
              <span v-if="profile.specializations">{{ profile.specializations }}</span>
              <span v-if="languagesDisplay">{{ languagesDisplay }}</span>
              <span v-if="profile.location">{{ profile.location }}</span>
            </div>
            <div class="profile-card__price" v-if="priceDisplay">
              {{ priceDisplay }}
            </div>
            <div class="profile-card__contact">
              <div v-if="profile.contact_email">Ел. пошта: {{ profile.contact_email }}</div>
              <div v-if="profile.contact_phone">Телефон: {{ profile.contact_phone }}</div>
              <div v-if="profile.messenger">Messenger: {{ profile.messenger }}</div>
            </div>
          </div>
        </div>
        <div class="profile-bio" v-if="bioSections.length">
          <div v-for="section in bioSections" :key="section.title" class="bio-section">
            <div class="bio-title">{{ section.title }}</div>
            <div class="muted">{{ section.body }}</div>
          </div>
        </div>
        <div v-else class="muted">Опис буде додано пізніше.</div>
      </div>

      <div class="panel panel--slots">
        <div class="panel__header">
          <div>
            <div class="badge badge--soft">Доступні слоти</div>
            <h2 class="panel__title">Найближчі дати</h2>
          </div>
        </div>

        <div v-if="!isAuthenticated" class="hint">
          Щоб забронювати сесію, увійдіть у свій акаунт клієнта.
          <RouterLink class="btn btn--ghost" to="/login">Увійти</RouterLink>
        </div>
        <div v-else-if="!isClient" class="hint">Бронювання доступне лише для клієнтів.</div>

        <div v-if="bookingSuccess" class="success">{{ bookingSuccess }}</div>
        <div v-if="bookingError" class="form-error">{{ bookingError }}</div>

        <div v-if="slotsLoading" class="muted">Завантаження слотів…</div>
        <div v-else-if="slots.length === 0" class="muted">Наразі вільних слотів немає.</div>
        <div v-else class="slot-list">
          <div v-for="slot in slots" :key="slot.id" class="slot-card">
            <div>
              <div class="slot-time">{{ formatDate(slot.start_at) }}</div>
              <div class="muted">{{ formatDate(slot.end_at) }}</div>
            </div>
            <button
              class="btn btn--ghost"
              type="button"
              :disabled="!canBook || bookingSlotId === slot.id"
              @click="bookSlot(slot.id)"
            >
              {{ bookingSlotId === slot.id ? 'Бронювання…' : 'Записатися' }}
            </button>
          </div>
        </div>
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { http } from '../lib/http'
import { fetchPublicTherapistProfile, type PublicTherapistProfile } from '../lib/api'
import { useAuthStore } from '../stores/auth'

type PublicSlot = {
  id: number
  start_at: string
  end_at: string
}

const route = useRoute()
const auth = useAuthStore()
const profile = ref<PublicTherapistProfile | null>(null)
const slots = ref<PublicSlot[]>([])
const loading = ref(false)
const slotsLoading = ref(false)
const error = ref('')
const bookingError = ref('')
const bookingSuccess = ref('')
const bookingSlotId = ref<number | null>(null)

const slug = computed(() => String(route.params.slug || '').trim())
const roles = computed(() => auth.me?.user.roles ?? auth.user?.roles ?? [])
const isAuthenticated = computed(() => Boolean(auth.accessToken))
const isClient = computed(() => roles.value.includes('CLIENT'))
const canBook = computed(() => isAuthenticated.value && isClient.value)

const languagesDisplay = computed(() => {
  const value = profile.value?.languages
  if (!value) return ''
  if (Array.isArray(value)) return value.join(', ')
  return value
})

const priceDisplay = computed(() => {
  const price = profile.value?.price
  if (!price) return ''
  const currency = profile.value?.price_currency || 'UAH'
  if (currency === 'UAH') return `${price} грн`
  if (currency === 'USD') return `$${price}`
  if (currency === 'EUR') return `€${price}`
  return `${price} ${currency}`
})

const bioSections = computed(() => {
  if (!profile.value) return []
  const sections = [
    { title: 'Про себе', body: profile.value.bio_about || profile.value.bio || '' },
    { title: 'Як я працюю', body: profile.value.bio_work || '' },
    { title: 'Мій підхід', body: profile.value.bio_approach || '' },
    { title: 'Для кого це може бути', body: profile.value.bio_for_whom || '' },
    { title: 'Інше', body: profile.value.bio_other || '' },
  ]
  return sections.filter((section) => section.body)
})

function formatDate(value: string) {
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

function toDateInputValue(date: Date) {
  const offset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offset).toISOString().slice(0, 10)
}

async function loadProfile() {
  if (!slug.value) {
    error.value = 'Потрібен slug профілю.'
    return
  }
  loading.value = true
  error.value = ''
  try {
    profile.value = await fetchPublicTherapistProfile(slug.value)
  } catch (err: any) {
    error.value = err?.response?.data?.detail || 'Профіль не знайдено.'
  } finally {
    loading.value = false
  }
}

async function loadSlots() {
  if (!profile.value?.therapist_id) return
  slotsLoading.value = true
  try {
    const dateFrom = toDateInputValue(new Date())
    const resp = await http.get<PublicSlot[]>('/booking/slots/', {
      params: { therapist_id: profile.value.therapist_id, date_from: dateFrom },
    })
    slots.value = (resp.data || []).slice(0, 6)
  } catch {
    slots.value = []
  } finally {
    slotsLoading.value = false
  }
}

async function bookSlot(slotId: number) {
  bookingError.value = ''
  bookingSuccess.value = ''
  if (!canBook.value) {
    bookingError.value = 'Бронювання доступне лише для клієнтів.'
    return
  }
  bookingSlotId.value = slotId
  try {
    await http.post('/booking/sessions/', { slot_id: slotId })
    bookingSuccess.value = 'Сесію заброньовано. Перевірте ваш кабінет.'
    slots.value = slots.value.filter((slot) => slot.id !== slotId)
  } catch (err: any) {
    bookingError.value = err?.response?.data?.detail || 'Не вдалося забронювати слот.'
  } finally {
    bookingSlotId.value = null
  }
}

watch(slug, () => {
  profile.value = null
  slots.value = []
  loadProfile().then(loadSlots)
})

onMounted(async () => {
  await loadProfile()
  await loadSlots()
})
</script>

<style scoped>
.public {
  display: grid;
  gap: 18px;
}

.public__hero {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 20px;
  background: linear-gradient(135deg, rgba(8, 113, 201, 0.16), rgba(7, 47, 71, 0.06));
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 22px 24px;
  box-shadow: var(--shadow);
}

.public__title {
  font-size: 32px;
}

.public__subtitle {
  max-width: 520px;
}

.public__grid {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 0.8fr);
  gap: 16px;
}

.panel {
  border: 1px solid var(--line);
  border-radius: 18px;
  padding: 18px;
  background: #fff;
  display: grid;
  gap: 14px;
}

.panel__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.panel__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 22px;
}

.badge--soft {
  background: rgba(8, 113, 201, 0.12);
}

.profile-card {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 16px;
  align-items: start;
}

.profile-card__media img {
  width: 100%;
  max-width: 180px;
  height: 180px;
  border-radius: 18px;
  border: 1px solid var(--line);
  object-fit: cover;
}

.profile-video {
  width: 100%;
  max-width: 240px;
  margin-top: 12px;
  border-radius: 14px;
  border: 1px solid var(--line);
  background: #0f2b3a;
  display: block;
}

.media-placeholder {
  width: 180px;
  height: 180px;
  border-radius: 14px;
  border: 1px dashed rgba(47, 63, 73, 0.2);
  display: grid;
  place-items: center;
  color: var(--muted);
  font-size: 12px;
}

.profile-card__title {
  font-family: var(--font-display);
  font-size: 22px;
  color: var(--ink);
  font-weight: 700;
}

.profile-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 13px;
  color: var(--muted);
}

.profile-card__price {
  margin-top: 8px;
  font-weight: 600;
}

.profile-card__contact {
  margin-top: 10px;
  display: grid;
  gap: 6px;
  font-size: 13px;
  color: var(--muted);
}

.profile-bio {
  display: grid;
  gap: 12px;
}

.bio-section {
  display: grid;
  gap: 6px;
}

.bio-title {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--deep);
  font-weight: 600;
}

.slot-list {
  display: grid;
  gap: 10px;
}

.slot-card {
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 10px 12px;
  background: rgba(7, 47, 71, 0.04);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.slot-time {
  font-weight: 600;
}

.form-error {
  color: #b3261e;
  background: #fdecea;
  border: 1px solid #f5c2c0;
  border-radius: 10px;
  padding: 8px 10px;
}

.success {
  color: #0f5132;
  background: #d1e7dd;
  border: 1px solid #badbcc;
  border-radius: 10px;
  padding: 8px 10px;
}

.hint {
  display: grid;
  gap: 10px;
  padding: 12px;
  border-radius: 12px;
  border: 1px dashed rgba(47, 63, 73, 0.2);
  color: var(--muted);
  background: rgba(7, 47, 71, 0.04);
}

@media (max-width: 960px) {
  .public__hero {
    flex-direction: column;
    align-items: flex-start;
  }

  .public__grid {
    grid-template-columns: 1fr;
  }

  .profile-card {
    grid-template-columns: 1fr;
  }

  .profile-card__media img,
  .media-placeholder {
    width: 100%;
    max-width: 240px;
    height: 240px;
  }

  .profile-video {
    max-width: 100%;
  }
}
</style>
