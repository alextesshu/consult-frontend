<template>
  <section class="public">
    <header class="public__hero">
      <div>
        <div class="badge">Профіль спеціаліста</div>
        <h1 class="title public__title">{{ publicName || 'Профіль спеціаліста' }}</h1>
        <p class="muted public__subtitle">
          {{ profile ? 'Публічна картка з описом і доступними віконцями.' : 'Завантаження профілю…' }}
        </p>
      </div>
      <div class="public__actions">
        <RouterLink class="btn btn--ghost" to="/specialists">
          Повернутись до списку
        </RouterLink>
        <RouterLink v-if="canManageProfile" class="btn btn--ghost" to="/cabinet/profile">
          Керувати профілем
        </RouterLink>
        <RouterLink class="btn btn--ghost" to="/">На головну</RouterLink>
      </div>
    </header>

    <div v-if="loading" class="muted">Завантаження...</div>
    <div v-else-if="error" class="form-error">{{ error }}</div>

    <section v-else-if="profile" class="public__grid">
      <div class="panel panel--profile">
        <div class="profile-card">
          <div class="profile-card__media">
            <img v-if="profile.photo_url" :src="profile.photo_url" alt="Фото спеціаліста" />
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
          <div class="profile-card__title">{{ publicName }}</div>
            <div class="profile-card__meta">
              <span v-if="profile.specializations">{{ profile.specializations }}</span>
              <span v-if="languagesDisplay">{{ languagesDisplay }}</span>
              <span v-if="profile.experience_years !== undefined && profile.experience_years !== null">
                Досвід: {{ formatExperience(profile.experience_years) }}
              </span>
              <span v-if="profile.location">{{ profile.location }}</span>
            </div>
            <div class="profile-card__price" v-if="priceDisplay">
              {{ priceDisplay }}
            </div>
            <div class="profile-card__price" v-if="introPriceDisplay">
              Ознайомча сесія: {{ introPriceDisplay }}
              <span v-if="introDurationLabel">· {{ introDurationLabel }}</span>
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
            <div class="badge badge--soft">Доступні віконця</div>
            <h2 class="panel__title">Найближчі дати</h2>
          </div>
          <div class="setting-bar" v-if="isAuthenticated && isClient">
            <button class="btn btn--ghost btn--sm" type="button" @click="openSettingModal">
              Сетінг
            </button>
            <label class="setting-check">
              <input type="checkbox" v-model="settingAccepted" />
              <span>Погоджуюсь</span>
            </label>
          </div>
        </div>

        <div class="slot-filter">
          <div class="slot-week">
            <button
              v-for="day in weekDays"
              :key="day.date"
              class="slot-day"
              :class="{ 'slot-day--active': day.date === selectedDate }"
              type="button"
              @click="selectDay(day.date)"
            >
              <span class="slot-day__label">{{ day.label }}</span>
              <span class="slot-day__date">{{ day.dateLabel }}</span>
            </button>
          </div>
          <label class="slot-filter__label" for="slotDate">Оберіть дату</label>
          <input
            id="slotDate"
            class="input slot-filter__input"
            type="date"
            v-model="selectedDate"
            :min="todayInputValue"
            ref="slotDateInput"
            @click="openDatePicker"
            @focus="openDatePicker"
          />
          <div class="muted slot-filter__hint">
            Оберіть дату, щоб переглянути доступні віконця.
          </div>
        </div>

        <div v-if="!isAuthenticated" class="hint">
          Щоб забронювати сесію, увійдіть у свій акаунт клієнта.
          <RouterLink class="btn btn--ghost" to="/login">Увійти</RouterLink>
        </div>
        <div v-else-if="!isClient" class="hint">Бронювання доступне лише для клієнтів.</div>

        <div v-if="bookingSuccess" class="success">{{ bookingSuccess }}</div>
        <div v-if="bookingError" class="form-error">{{ bookingError }}</div>
        <div v-if="upcomingConfirmed.length" class="confirmed-block">
          <div class="confirmed-title">Підтверджені сесії з цим спеціалістом</div>
          <div class="confirmed-list">
            <div v-for="session in upcomingConfirmed" :key="session.id" class="confirmed-item">
              <div class="confirmed-time">{{ formatDate(session.start_at) }}</div>
              <div class="muted">{{ formatDuration(session.start_at, session.end_at) }}</div>
            </div>
          </div>
        </div>

        <div v-if="slotsLoading" class="muted">Завантаження віконець…</div>
        <div v-else-if="slotsError" class="form-error">{{ slotsError }}</div>
        <div v-else-if="slots.length === 0" class="muted">
          {{ noSlotsAvailable ? 'Наразі вільних віконець немає.' : 'На жаль, в цей день вільних віконець немає.' }}
        </div>
          <div v-else class="slot-list">
          <div v-for="slot in slots" :key="slot.id" class="slot-card">
            <div>
              <div class="slot-time">{{ formatDate(slot.start_at) }}</div>
              <div class="muted">{{ formatDuration(slot.start_at, slot.end_at) }}</div>
            </div>
            <button
              class="btn btn--ghost"
              type="button"
              :disabled="!canBook || bookingSlotId === slot.id || !settingAccepted"
              @click="bookSlot(slot.id)"
            >
              {{ bookingSlotId === slot.id ? 'Бронювання…' : 'Записатися' }}
            </button>
          </div>
        </div>
      </div>

      <div class="panel panel--reviews">
        <div class="panel__header">
          <div>
            <div class="badge badge--soft">Відгуки</div>
            <h2 class="panel__title">Оцінки клієнтів</h2>
          </div>
          <div v-if="averageRating" class="rating-pill">{{ averageRating }} / 5</div>
        </div>

        <div v-if="reviewsLoading" class="muted">Завантаження відгуків…</div>
        <div v-else-if="reviewsError" class="form-error">{{ reviewsError }}</div>
        <div v-else-if="reviews.length === 0" class="muted">Поки що немає відгуків.</div>
        <div v-else class="review-list">
          <article v-for="review in reviews" :key="review.id" class="review-card">
            <div class="review-head">
              <div class="review-rating">{{ review.rating }} / 5</div>
              <div class="muted">{{ formatDate(review.created_at) }}</div>
            </div>
            <div class="review-text" v-if="review.review_text">{{ review.review_text }}</div>
          </article>
        </div>
      </div>
    </section>

    <div v-if="showBookingModal" class="setting-modal">
      <div class="setting-modal__backdrop" @click="closeBookingModal"></div>
      <div class="setting-modal__content">
        <div class="setting-modal__header">
          <h3>Сесію створено</h3>
          <button class="btn btn--ghost btn--sm" type="button" @click="closeBookingModal">
            Закрити
          </button>
        </div>
        <div class="setting-modal__body">
          <div class="booking-checklist">
            <div class="booking-checklist__item">1. Сесія заброньована</div>
            <div class="booking-checklist__item">2. Спеціаліст має підтвердити</div>
            <div class="booking-checklist__item">3. Перевіряйте статус у кабінеті</div>
          </div>
          <div v-if="lastBookedSlot" class="booking-slot">
            <div class="muted">Ваш слот:</div>
            <div class="booking-slot__time">{{ formatDate(lastBookedSlot.start_at) }}</div>
            <div class="muted">{{ formatDuration(lastBookedSlot.start_at, lastBookedSlot.end_at) }}</div>
          </div>
        </div>
        <div class="setting-modal__footer">
          <RouterLink class="btn" to="/client">Перейти в кабінет</RouterLink>
          <button class="btn btn--ghost" type="button" @click="closeBookingModal">
            Закрити
          </button>
        </div>
      </div>
    </div>

    <div v-if="showSettingModal" class="setting-modal">
      <div class="setting-modal__backdrop" @click="closeSettingModal"></div>
      <div class="setting-modal__content">
        <div class="setting-modal__header">
          <h3>Сетінг</h3>
          <button class="btn btn--ghost btn--sm" type="button" @click="closeSettingModal">Закрити</button>
        </div>
        <div class="setting-modal__body">
          <div class="setting-section" v-if="platformSettingText">
            <div class="setting-title">Загальні правила простору</div>
            <div class="muted">{{ platformSettingText }}</div>
          </div>
          <div class="setting-section" v-if="therapistSettingText">
            <div class="setting-title">Сетінг спеціаліста</div>
            <div class="muted">{{ therapistSettingText }}</div>
          </div>
          <div v-if="!platformSettingText && !therapistSettingText" class="muted">
            Сетінг ще не додано.
          </div>
          <label class="setting-check setting-check--modal">
            <input type="checkbox" v-model="settingAccepted" />
            <span>Погоджуюсь з умовами</span>
          </label>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getApiErrorMessage } from '../lib/errors'
import { apiGet, apiPost } from '../lib/api'
import { toLocalDate } from '../lib/dates'
import {
  fetchPublicTherapistProfile,
  fetchPublicTherapistReviews,
  type PublicTherapistProfile,
  type SessionReview,
} from '../lib/api'
import { useAuthStore } from '../stores/auth'
import { useToast } from '../composables/useToast'

type PublicSlot = {
  id: number
  start_at: string
  end_at: string
}

type ClientSession = {
  id: number
  status: string
  therapist?: number
  therapist_public_slug?: string | null
  slot?: { start_at: string; end_at: string } | null
  slot_start_at?: string | null
  slot_end_at?: string | null
}

const route = useRoute()
const auth = useAuthStore()
const toast = useToast()
const profile = ref<PublicTherapistProfile | null>(null)
const slots = ref<PublicSlot[]>([])
const loading = ref(false)
const slotsLoading = ref(false)
const error = ref('')
const slotsError = ref('')
const noSlotsAvailable = ref(false)
const bookingError = ref('')
const bookingSuccess = ref('')
const bookingSlotId = ref<number | null>(null)
const showBookingModal = ref(false)
const lastBookedSlot = ref<PublicSlot | null>(null)
const settingAccepted = ref(false)
const showSettingModal = ref(false)
const clientSessions = ref<ClientSession[]>([])
const reviews = ref<SessionReview[]>([])
const reviewsLoading = ref(false)
const reviewsError = ref('')
const selectedDate = ref('')
const slotDateInput = ref<HTMLInputElement | null>(null)

const slug = computed(() => String(route.params.slug || '').trim())
const roles = computed(() => auth.me?.user.roles ?? auth.user?.roles ?? [])
const isAuthenticated = computed(() => Boolean(auth.accessToken))
const isClient = computed(() => roles.value.includes('CLIENT'))
const canManageProfile = computed(
  () => roles.value.includes('SPECIALIST') || roles.value.includes('THERAPIST')
)
const canBook = computed(() => isAuthenticated.value && isClient.value)
const upcomingConfirmed = computed(() => {
  if (!profile.value) return []
  return clientSessions.value
    .filter((session) => {
      const status = session.status || ''
      if (status !== 'CONFIRMED') return false
      const therapistId = profile.value?.therapist_id
      const sessionTherapist = session.therapist
      if (therapistId && sessionTherapist) {
        return therapistId === sessionTherapist
      }
      if (profile.value?.public_slug && session.therapist_public_slug) {
        return profile.value.public_slug === session.therapist_public_slug
      }
      return false
    })
    .map((session) => {
      const slot = session.slot || null
      return {
        id: session.id,
        start_at: slot?.start_at || session.slot_start_at || '',
        end_at: slot?.end_at || session.slot_end_at || '',
      }
    })
    .filter((item) => item.start_at && item.end_at)
    .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime())
})

const weekDays = computed(() => {
  const base = new Date()
  const days: Array<{ date: string; label: string; dateLabel: string }> = []
  for (let i = 0; i < 10; i += 1) {
    const d = new Date(base)
    d.setDate(base.getDate() + i)
    const date = toLocalDate(d)
    const label = d.toLocaleDateString('uk-UA', { weekday: 'short' })
    const dateLabel = d.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit' })
    days.push({ date, label, dateLabel })
  }
  return days
})
const platformSettingText = computed(() => profile.value?.platform_setting_text || '')
const therapistSettingText = computed(() => profile.value?.setting_text || '')

const languagesDisplay = computed(() => {
  const value = profile.value?.languages
  if (!value) return ''
  if (Array.isArray(value)) return value.join(', ')
  return value
})

const publicName = computed(() => formatPublicName(profile.value?.display_name) || profile.value?.display_name || '')

const priceDisplay = computed(() => {
  const price = profile.value?.price
  if (!price) return ''
  const currency = profile.value?.price_currency || 'UAH'
  if (currency === 'UAH') return `${price} грн`
  if (currency === 'USD') return `$${price}`
  if (currency === 'EUR') return `€${price}`
  return `${price} ${currency}`
})

const introPriceDisplay = computed(() => {
  const price = profile.value?.intro_price
  if (!price) return ''
  const currency = profile.value?.intro_price_currency || 'UAH'
  if (currency === 'UAH') return `${price} грн`
  if (currency === 'USD') return `$${price}`
  if (currency === 'EUR') return `€${price}`
  return `${price} ${currency}`
})

const introDurationLabel = computed(() => {
  const minutes = profile.value?.intro_duration_minutes
  if (!minutes) return ''
  return `${minutes} хв`
})

function formatPublicName(value?: string) {
  if (!value) return ''
  const parts = value.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 1) return parts[0]
  const first = parts[0]
  const last = parts[parts.length - 1]
  if (!last) return first
  const initial = last.charAt(0).toUpperCase()
  return `${first} ${initial}.`
}

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

const averageRating = computed(() => {
  if (!reviews.value.length) return ''
  const total = reviews.value.reduce((sum, item) => sum + item.rating, 0)
  return (total / reviews.value.length).toFixed(1)
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

function formatDuration(start: string, end: string) {
  const startDt = new Date(start)
  const endDt = new Date(end)
  if (Number.isNaN(startDt.getTime()) || Number.isNaN(endDt.getTime())) return ''
  const minutes = Math.max(0, Math.round((endDt.getTime() - startDt.getTime()) / 60000))
  if (!minutes) return '\u0422\u0440\u0438\u0432\u0430\u043b\u0456\u0441\u0442\u044c: 0 \u0445\u0432'
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  const parts = []
  if (hours) parts.push(`${hours} \u0433\u043e\u0434`)
  if (mins) parts.push(`${mins} \u0445\u0432`)
  return `\u0422\u0440\u0438\u0432\u0430\u043b\u0456\u0441\u0442\u044c: ${parts.join(' ')}`
}

function toDateInputValue(date: Date) {
  const offset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offset).toISOString().slice(0, 10)
}

const todayInputValue = toDateInputValue(new Date())

function openDatePicker() {
  const input = slotDateInput.value
  if (!input) return
  if (typeof input.showPicker === 'function') {
    input.showPicker()
  } else {
    input.focus()
  }
}

function selectDay(date: string) {
  selectedDate.value = date
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
    if (profile.value) {
      saveViewedTherapist(profile.value)
    }
  } catch (err: any) {
    error.value = getApiErrorMessage(err, '\u041f\u0440\u043e\u0444\u0456\u043b\u044c \u043d\u0435 \u0437\u043d\u0430\u0439\u0434\u0435\u043d\u043e.')
  } finally {
    loading.value = false
  }
}

async function loadSlots() {
  if (!profile.value?.therapist_id) return
  slotsLoading.value = true
  slotsError.value = ''
  noSlotsAvailable.value = false
  try {
    const dateFrom = selectedDate.value || toLocalDate(new Date())
    const resp = await apiGet<PublicSlot[]>('/booking/slots/', {
      params: { therapist_id: profile.value.therapist_id, date: dateFrom },
    })
    const list = resp || []
    slots.value = list
    if (!list.length) {
      const anyResp = await apiGet<PublicSlot[]>('/booking/slots/', {
        params: { therapist_id: profile.value.therapist_id },
      })
      noSlotsAvailable.value = !(anyResp && anyResp.length)
    }
  } catch {
    slots.value = []
    slotsError.value = 'Не вдалося завантажити віконця.'
  } finally {
    slotsLoading.value = false
  }
}

function formatExperience(value: number) {
  if (value === 0) return 'до року'
  if (value === 1) return '1 рік'
  if (value >= 2 && value <= 4) return `${value} роки`
  return `${value} років`
}

async function loadReviews() {
  if (!slug.value) return
  reviewsLoading.value = true
  reviewsError.value = ''
  try {
    reviews.value = await fetchPublicTherapistReviews(slug.value, 20)
  } catch {
    reviews.value = []
    reviewsError.value = 'Не вдалося завантажити відгуки.'
  } finally {
    reviewsLoading.value = false
  }
}

async function loadClientSessions() {
  if (!isAuthenticated.value || !isClient.value) return
  try {
    const resp = await apiGet<ClientSession[]>('/booking/sessions/', {
      params: { upcoming: true },
    })
    clientSessions.value = resp || []
  } catch {
    clientSessions.value = []
  }
}

async function bookSlot(slotId: number) {
  bookingError.value = ''
  bookingSuccess.value = ''
  if (!canBook.value) {
    bookingError.value = 'Бронювання доступне лише для клієнтів.'
    return
  }
  if (!settingAccepted.value) {
    bookingError.value = 'Погодьтеся з сетінгом перед бронюванням.'
    openSettingModal()
    return
  }
  bookingSlotId.value = slotId
  const bookedSlot = slots.value.find((slot) => slot.id === slotId) || null
  try {
    await apiPost('/booking/sessions/', { slot_id: slotId, setting_accepted: true })
    bookingSuccess.value = 'Сесію заброньовано. Перевірте ваш кабінет.'
    toast.success(bookingSuccess.value)
    lastBookedSlot.value = bookedSlot
    showBookingModal.value = true
    slots.value = slots.value.filter((slot) => slot.id !== slotId)
    if (profile.value) {
      const entry = pickTherapist(profile.value)
      const raw = localStorage.getItem('selectedTherapists')
      const legacy = localStorage.getItem('selectedTherapist')
      let items: any[] = []
      try {
        if (raw) {
          items = JSON.parse(raw)
        } else if (legacy) {
          items = [JSON.parse(legacy)]
        }
      } catch {
        items = []
      }
      const filtered = items.filter((item) => item.public_slug !== entry.public_slug)
      filtered.unshift(entry)
      localStorage.setItem('selectedTherapists', JSON.stringify(filtered))
    }
  } catch (err: any) {
    bookingError.value = err?.response?.data?.detail || 'Не вдалося забронювати віконце.'
    toast.error(bookingError.value)
  } finally {
    bookingSlotId.value = null
  }
}

function closeBookingModal() {
  showBookingModal.value = false
}

function openSettingModal() {
  showSettingModal.value = true
}

function closeSettingModal() {
  showSettingModal.value = false
}

function pickTherapist(data: PublicTherapistProfile) {
  return {
    therapist_id: data.therapist_id,
    public_slug: data.public_slug,
    display_name: data.display_name,
    location: data.location,
    languages: data.languages,
    price: data.price,
    price_currency: data.price_currency,
    photo_url: data.photo_url,
  }
}

function saveViewedTherapist(data: PublicTherapistProfile) {
  if (!data.public_slug) return
  const raw = localStorage.getItem('viewedTherapists')
  let items: any[] = []
  try {
    items = raw ? JSON.parse(raw) : []
  } catch {
    items = []
  }
  const entry = pickTherapist(data)
  const filtered = items.filter((item) => item.public_slug !== entry.public_slug)
  filtered.unshift(entry)
  localStorage.setItem('viewedTherapists', JSON.stringify(filtered.slice(0, 8)))
}

watch(slug, () => {
  profile.value = null
  slots.value = []
  selectedDate.value = toLocalDate(new Date())
  loadProfile().then(loadSlots)
  loadClientSessions()
})

watch(selectedDate, () => {
  slots.value = []
  loadSlots()
})

watch([isAuthenticated, isClient], () => {
  loadClientSessions()
})

onMounted(async () => {
  if (!selectedDate.value) {
    selectedDate.value = toLocalDate(new Date())
  }
  await loadProfile()
  await loadSlots()
  await loadReviews()
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

.public__actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  flex-wrap: wrap;
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
  margin-bottom: 12px;
}

.panel__header > div {
  display: grid;
  gap: 8px;
}

.panel__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 22px;
}

.slot-filter {
  display: grid;
  gap: 6px;
  padding: 12px;
  border-radius: 14px;
  border: 1px dashed rgba(47, 63, 73, 0.18);
  background: rgba(7, 47, 71, 0.03);
}

.slot-week {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
}

.slot-day {
  border: 1px solid var(--line);
  background: #fff;
  border-radius: 12px;
  padding: 6px 10px;
  display: grid;
  gap: 2px;
  min-width: 64px;
  text-align: center;
  cursor: pointer;
  color: var(--ink);
  font-weight: 400;
}

.slot-day__label {
  text-transform: uppercase;
  font-size: 10px;
  letter-spacing: 0.08em;
  color: var(--muted);
}

.slot-day__date {
  font-size: 12px;
}

.slot-day--active {
  border-color: color-mix(in srgb, var(--primary) 40%, var(--border));
  background: color-mix(in srgb, var(--primary) 12%, transparent);
}

.slot-filter__label {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--muted);
  font-weight: 600;
}

.slot-filter__input {
  max-width: 240px;
}

.slot-filter__hint {
  font-size: 12px;
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

  .panel--reviews {
    display: grid;
    gap: 12px;
  }

  .rating-pill {
    padding: 6px 10px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 600;
    background: rgba(31, 122, 76, 0.16);
    color: #1f7a4c;
  }

  .review-list {
    display: grid;
    gap: 10px;
  }

  .confirmed-block {
    margin-top: 14px;
    border: 1px dashed rgba(47, 63, 73, 0.18);
    border-radius: 12px;
    padding: 12px;
    background: rgba(7, 47, 71, 0.04);
    display: grid;
    gap: 8px;
  }

  .confirmed-title {
    font-weight: 600;
    font-size: 13px;
  }

  .confirmed-list {
    display: grid;
    gap: 8px;
  }

  .confirmed-item {
    display: grid;
    gap: 2px;
    padding: 8px 10px;
    border-radius: 10px;
    background: #fff;
    border: 1px solid var(--line);
  }

  .confirmed-time {
    font-weight: 600;
  }

  .setting-bar {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }

  .setting-check {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: var(--muted);
  }

  .setting-check input {
    width: 16px;
    height: 16px;
  }

  .setting-check--modal {
    margin-top: 16px;
  }

  .setting-modal {
    position: fixed;
    inset: 0;
    z-index: 60;
    display: grid;
    place-items: center;
  }

  .setting-modal__backdrop {
    position: absolute;
    inset: 0;
    background: rgba(7, 24, 33, 0.45);
  }

  .setting-modal__content {
    position: relative;
    z-index: 1;
    width: min(640px, 92vw);
    background: #fff;
    border-radius: 16px;
    border: 1px solid var(--line);
    padding: 20px;
    display: grid;
    gap: 16px;
    box-shadow: 0 18px 40px rgba(15, 35, 48, 0.2);
  }

  .setting-modal__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .setting-modal__body {
    display: grid;
    gap: 12px;
  }

  .booking-checklist {
    display: grid;
    gap: 6px;
    padding: 10px 12px;
    border-radius: 12px;
    background: rgba(8, 113, 201, 0.08);
    border: 1px solid var(--line);
  }

  .booking-checklist__item {
    font-weight: 500;
  }

  .booking-slot {
    display: grid;
    gap: 4px;
    padding: 10px 12px;
    border-radius: 12px;
    border: 1px solid var(--line);
    background: #fff;
  }

  .booking-slot__time {
    font-weight: 600;
  }

  .setting-section {
    display: grid;
    gap: 6px;
  }

  .setting-title {
    font-weight: 600;
  }

  .review-card {
    border: 1px solid var(--line);
    border-radius: 12px;
    padding: 10px 12px;
    background: #fff;
    display: grid;
    gap: 8px;
  }

  .review-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }

  .review-rating {
    font-weight: 600;
  }

  .review-text {
    color: var(--deep);
    white-space: pre-line;
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
