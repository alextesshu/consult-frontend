<template>
  <section class="public">
    <header class="public__hero">
      <div>
        <div class="badge">Профіль спеціаліста</div>
        <h1 class="title public__title">{{ publicName || 'Профіль спеціаліста' }}</h1>
        <p class="muted public__subtitle">
          {{ profile ? 'Публічна картка з описом і доступними віконцями.' : 'Завантаження профілю' }}
        </p>
      </div>
      <div class="public__actions">
        <a class="btn btn--ghost" href="#journal">Авторський журнал</a>
        <RouterLink
          v-if="canManageProfile"
          class="btn btn--ghost"
          to="/cabinet/journal"
        >
          Мій журнал
        </RouterLink>
        <RouterLink class="btn" :to="feedbackLink">
          Відгуки
          <span v-if="isAuthenticated && isClient && canLeaveFeedback" class="badge badge--soft">
            Доступно
          </span>
        </RouterLink>
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
      <div class="panel panel--slots">
        <div class="panel__header">
          <div>
            <div class="badge badge--soft">Доступні віконця</div>
            <h2 class="panel__title">Найближчі дати</h2>
          </div>
          <div class="setting-bar" v-if="isAuthenticated && isClient">
            <button
              class="btn btn--ghost btn--sm"
              :class="{ 'btn--pulse': settingAttention }"
              type="button"
              ref="settingButtonRef"
              @click="openSettingModal"
            >
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
          Щоб забронювати час, увійдіть у свій кабінет клієнта.
          <RouterLink class="btn btn--ghost" to="/login">Увійти</RouterLink>
        </div>
        <div v-else-if="!isClient" class="hint">Бронювання доступне лише для клієнтів.</div>

        <div v-if="bookingSuccess" class="success">{{ bookingSuccess }}</div>
        <div v-if="bookingError" class="form-error">{{ bookingError }}</div>
        <div v-if="upcomingConfirmed.length" class="confirmed-block">
          <div class="confirmed-title">Підтверджені сесії у вас заплановані</div>
          <div class="confirmed-list">
            <div v-for="session in upcomingConfirmed" :key="session.id" class="confirmed-item">
              <div class="confirmed-time">{{ formatDate(session.start_at) }}</div>
              <div class="muted">{{ formatDuration(session.start_at, session.end_at) }}</div>
            </div>
          </div>
        </div>

        <div v-if="slotsLoading" class="muted">Завантажуємо віконця</div>
        <div v-else-if="slotsError" class="form-error">{{ slotsError }}</div>
        <div v-else-if="slots.length === 0" class="muted">
          {{ noSlotsAvailable ? 'Наразі вільних віконець немає.' : 'На жаль, у цей день вільних віконець немає.' }}
        </div>
        <div v-else class="slot-list">
          <div v-for="slot in slots" :key="slot.id" class="slot-card">
            <div>
              <div class="slot-time">{{ formatDate(slot.start_at) }}</div>
              <div class="muted">{{ formatDuration(slot.start_at, slot.end_at) }}</div>
            </div>
            <button
              class="btn btn--ghost"
              :class="{ 'btn--disabled': isBookingDisabled(slot.id) }"
              type="button"
              :aria-disabled="isBookingDisabled(slot.id)"
              @click="handleBookingClick(slot.id)"
            >
              {{ bookingSlotId === slot.id ? 'Бронюємо...' : 'Записатися' }}
            </button>
          </div>
        </div>
      </div>

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
              Пробна сесія: {{ introPriceDisplay }}
              <span v-if="introDurationLabel">• {{ introDurationLabel }}</span>
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
        <div v-else class="muted">Поки що немає опису.</div>
      </div>

      <div class="panel panel--journal" id="journal">
        <div class="panel__header">
          <div>
            <div class="badge badge--soft">Авторський журнал</div>
            <h2 class="panel__title">Статті спеціаліста</h2>
          </div>
          <div class="panel__header-actions">
            <RouterLink class="btn btn--ghost btn--sm" :to="`/t/${slug}/journal`">
              Всі статті
            </RouterLink>
          </div>
        </div>

        <div v-if="journalLoading" class="muted">Завантажуємо журнал...</div>
        <div v-else-if="journalError" class="form-error">{{ journalError }}</div>
        <div v-else>
          <section v-if="previewCollections.length" class="profile-collections">
            <div class="profile-collections__head">
              <div class="profile-collections__title">Добірки</div>
              <RouterLink class="btn btn--ghost btn--sm" :to="`/${slug}/journal`">
                Переглянути всі
              </RouterLink>
            </div>
            <div class="profile-collections__list">
              <RouterLink
                v-for="collection in previewCollections"
                :key="collection.slug"
                class="profile-collection-item"
                :to="`/${slug}/journal/collections/${collection.slug}`"
              >
                <div class="profile-collection-item__left">
                  <div v-if="collectionCoverUrl(collection)" class="profile-collection-item__cover">
                    <img :src="collectionCoverUrl(collection)" :alt="collection.title" />
                  </div>
                  <span class="profile-collection-item__name">{{ collection.title }}</span>
                </div>
                <span class="profile-collection-item__meta">{{ collection.posts_count }} статті</span>
              </RouterLink>
            </div>
          </section>

          <div v-if="filteredJournalPosts.length === 0" class="empty">
            <div class="empty-title">Немає статей у цій категорії</div>
            <div class="muted">Спробуйте інший фільтр або поверніться до всіх статей.</div>
            <button class="btn btn--ghost btn--sm" type="button" @click="activeCategory = 'ALL'">
              Повернути всі статті
            </button>
          </div>
          <div v-else class="journal-list">
            <div class="journal-filters" role="tablist" aria-label="Фільтр статей">
              <button
                v-for="opt in categoryOptions"
                :key="opt.key"
                type="button"
                class="filter-chip"
                :class="{ 'is-active': activeCategory === opt.key }"
                @click="activeCategory = opt.key"
              >
                {{ opt.label }}
              </button>
            </div>
            <article
              v-if="featuredPost"
              :class="[
                'journal-card',
                'journal-card--feature',
                featuredPost.is_featured ? 'journal-card--pinned' : '',
                'journal-card--closed',
              ]"
              role="button"
              tabindex="0"
              @click="navigateToPost(featuredPost)"
              @keydown.enter="navigateToPost(featuredPost)"
              @keydown.space.prevent="navigateToPost(featuredPost)"
            >
              <div class="journal-body">
                <span class="post-tag" :style="{ '--cat': categoryColor(featuredPost.category) }">
                  {{ categoryLabel(featuredPost.category) }}
                </span>
                <span v-if="featuredPost.is_featured" class="pin-badge">Закріплено</span>
                <div class="journal-title">{{ featuredPost.title }}</div>
                <div class="journal-meta">
                  {{ formatDate(featuredPost.published_at || featuredPost.created_at) }}
                  · {{ readingTime(featuredPost.summary) }} хв читання
                </div>
                <div class="journal-summary" v-if="featuredPost.summary" v-html="renderMarkdown(featuredPost.summary)"></div>
                <RouterLink class="read-more" :to="`/${slug}/journal/${featuredPost.slug}`" @click.stop>
                  Читати статтю →
                </RouterLink>
              </div>
              <div v-if="featuredPost.cover_image_url" class="journal-cover">
                <img :src="featuredPost.cover_image_url" alt="Обкладинка статті" />
              </div>
            </article>

            <div class="journal-grid">
              <article
                v-for="post in gridPosts"
                :key="post.id"
                :class="[
                  'journal-card',
                  post.is_featured ? 'journal-card--pinned' : '',
                  'journal-card--closed',
                ]"
                role="button"
                tabindex="0"
                @click="navigateToPost(post)"
                @keydown.enter="navigateToPost(post)"
                @keydown.space.prevent="navigateToPost(post)"
              >
                <div class="journal-body">
                  <span class="post-tag" :style="{ '--cat': categoryColor(post.category) }">
                    {{ categoryLabel(post.category) }}
                  </span>
                  <span v-if="post.is_featured" class="pin-badge">Закріплено</span>
                  <div class="journal-title">{{ post.title }}</div>
                  <div class="journal-meta">
                    {{ formatDate(post.published_at || post.created_at) }}
                    · {{ readingTime(post.summary) }} хв читання
                  </div>
                  <div
                    class="journal-summary"
                    v-if="post.summary"
                    v-html="renderMarkdown(post.summary)"
                  ></div>
                  <RouterLink class="read-more" :to="`/${slug}/journal/${post.slug}`" @click.stop>
                    Читати статтю →
                  </RouterLink>
                </div>
                <div v-if="post.cover_image_url" class="journal-cover">
                  <img :src="post.cover_image_url" alt="Обкладинка статті" />
                </div>
              </article>
            </div>
          </div>
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
import DOMPurify from 'dompurify'
import { marked } from 'marked'
import { useRoute, useRouter } from 'vue-router'
import { getApiErrorMessage } from '../lib/errors'
import { apiGet, apiPost } from '../lib/api'
import { toLocalDate } from '../lib/dates'
import {
  fetchPublicSpecialistProfile,
  fetchPublicAuthorJournalPosts,
  fetchPublicJournalCollections,
  type PublicSpecialistProfile,
  type PublicAuthorJournalPost,
  type PublicJournalCollectionListItem,
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
const router = useRouter()
const auth = useAuthStore()
const toast = useToast()
const profile = ref<PublicSpecialistProfile | null>(null)
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
const settingAttention = ref(false)
const settingButtonRef = ref<HTMLElement | null>(null)
let settingAttentionTimer: number | null = null
const clientSessions = ref<ClientSession[]>([])
const pastClientSessions = ref<ClientSession[]>([])
const journalPosts = ref<PublicAuthorJournalPost[]>([])
const journalCollections = ref<PublicJournalCollectionListItem[]>([])
const journalLoading = ref(false)
const journalError = ref('')
type JournalCategory = 'ALL' | 'TIP' | 'EXPLAIN' | 'FAQ' | 'RESEARCH' | 'PRACTICE'
const activeCategory = ref<JournalCategory>('ALL')
const categoryOptions: { key: JournalCategory; label: string }[] = [
  { key: 'ALL', label: 'Усі' },
  { key: 'TIP', label: 'Порада' },
  { key: 'EXPLAIN', label: 'Пояснення' },
  { key: 'PRACTICE', label: 'Практика' },
  { key: 'RESEARCH', label: 'Дослідження' },
  { key: 'FAQ', label: 'FAQ' },
]
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
const isBookingDisabled = (slotId: number) =>
  !canBook.value || bookingSlotId.value === slotId || !settingAccepted.value
const upcomingConfirmed = computed(() => {
  if (!profile.value) return []
  return clientSessions.value
    .filter((session) => {
      const status = session.status || ''
      if (status !== 'CONFIRMED') return false
      const specialistId = profile.value?.therapist_id
      const sessionSpecialist = session.therapist
      if (specialistId && sessionSpecialist) {
        return specialistId === sessionSpecialist
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
const canLeaveFeedback = computed(() => {
  if (!isAuthenticated.value || !isClient.value || !profile.value) return false
  const specialistId = profile.value.therapist_id
  const slugValue = profile.value.public_slug
  const matchesSpecialist = (session: ClientSession) => {
    if (specialistId && session.therapist) return specialistId === session.therapist
    if (slugValue && session.therapist_public_slug) return slugValue === session.therapist_public_slug
    return false
  }
  return clientSessions.value.some(matchesSpecialist) || pastClientSessions.value.some(matchesSpecialist)
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
const feedbackLink = computed(() => ({
  name: 'specialist-feedback',
  params: { slug: profile.value?.public_slug || slug.value },
}))

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
    profile.value = await fetchPublicSpecialistProfile(slug.value)
    if (profile.value) {
      saveViewedSpecialist(profile.value)
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

async function loadJournal() {
  if (!slug.value) return
  journalLoading.value = true
  journalError.value = ''
  try {
    const [posts, collections] = await Promise.all([
      fetchPublicAuthorJournalPosts(slug.value),
      fetchPublicJournalCollections(slug.value),
    ])
    journalPosts.value = posts
    journalCollections.value = collections
  } catch {
    journalPosts.value = []
    journalCollections.value = []
    journalError.value = 'Не вдалося завантажити авторський журнал.'
  } finally {
    journalLoading.value = false
  }
}

function postCategory(post: PublicAuthorJournalPost): Exclude<JournalCategory, 'ALL'> | null {
  const v = (post as { category?: string })?.category
  if (v === 'TIP' || v === 'EXPLAIN' || v === 'FAQ' || v === 'RESEARCH' || v === 'PRACTICE') return v
  return null
}

function categoryLabel(cat?: string) {
  switch (cat) {
    case 'TIP':
      return 'Порада'
    case 'EXPLAIN':
      return 'Пояснення'
    case 'FAQ':
      return 'FAQ'
    case 'RESEARCH':
      return 'Дослідження'
    case 'PRACTICE':
      return 'Практика'
    default:
      return 'Порада'
  }
}

function categoryColor(cat?: string) {
  switch (cat) {
    case 'TIP':
      return '#2b7a6f'
    case 'EXPLAIN':
      return '#355c7d'
    case 'FAQ':
      return '#6b5b95'
    case 'RESEARCH':
      return '#9c6b2f'
    case 'PRACTICE':
      return '#2f6f9c'
    default:
      return '#2b7a6f'
  }
}

function readingTime(text: string | null | undefined): number {
  if (!text) return 1
  const words = text.trim().split(/\s+/).length
  const minutes = Math.ceil(words / 200)
  return Math.max(1, minutes)
}

function renderMarkdown(text?: string | null) {
  if (!text) return ''
  const raw = marked.parse(text, { breaks: true }) as string
  return DOMPurify.sanitize(raw)
}

const filteredJournalPosts = computed(() => {
  if (activeCategory.value === 'ALL') return journalPosts.value
  return journalPosts.value.filter((p) => postCategory(p) === activeCategory.value)
})

const featuredPost = computed(() => filteredJournalPosts.value.find((p) => p.is_featured) || null)

function navigateToPost(post: PublicAuthorJournalPost) {
  if (!slug.value || !post.slug) return
  router.push({
    name: 'public-journal-post',
    params: { slug: slug.value, postSlug: post.slug },
    query: {
      from: 'profile',
      cat: activeCategory.value,
      open: String(post.id),
    },
  })
}

const gridPosts = computed(() =>
  featuredPost.value
    ? filteredJournalPosts.value.filter((p) => p.id !== featuredPost.value?.id)
    : filteredJournalPosts.value
)
const previewCollections = computed(() => journalCollections.value.slice(0, 3))

function collectionCoverUrl(collection: PublicJournalCollectionListItem): string {
  if (collection.cover_image_url) return collection.cover_image_url
  const firstPreviewSlug = collection.preview_posts?.[0]?.slug
  if (!firstPreviewSlug) return ''
  return journalPosts.value.find((post) => post.slug === firstPreviewSlug)?.cover_image_url || ''
}

async function loadClientSessions() {
  if (!isAuthenticated.value || !isClient.value) return
  try {
    const resp = await apiGet<ClientSession[]>('/booking/sessions/', {
      params: { upcoming: true },
    })
    clientSessions.value = resp || []
    const pastResp = await apiGet<ClientSession[]>('/booking/sessions/', {
      params: { upcoming: false },
    })
    pastClientSessions.value = pastResp || []
  } catch {
    clientSessions.value = []
    pastClientSessions.value = []
  }
}

async function shareProfile() {
  if (!profile.value?.public_slug) return
  const url = `${window.location.origin}/specialist/${profile.value.public_slug}`
  const title = publicName.value || 'Профіль спеціаліста'
  const text = `Профіль спеціаліста ${title}`
  try {
    if (navigator.share) {
      await navigator.share({ title, text, url })
      toast.success('Профіль надіслано.')
      return
    }
  } catch {
    // ignore and fallback
  }
  try {
    await navigator.clipboard.writeText(url)
    toast.success('Посилання скопійовано.')
  } catch {
    toast.error('Не вдалося скопіювати посилання.')
  }
}

function flashSettingButton() {
  settingAttention.value = false
  if (settingAttentionTimer) {
    window.clearTimeout(settingAttentionTimer)
  }
  settingAttention.value = true
  settingButtonRef.value?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  settingAttentionTimer = window.setTimeout(() => {
    settingAttention.value = false
    settingAttentionTimer = null
  }, 900)
}

function handleBookingClick(slotId: number) {
  if (!canBook.value) {
    bookSlot(slotId)
    return
  }
  if (bookingSlotId.value === slotId) return
  if (!settingAccepted.value) {
    bookingError.value = 'Погодьтеся з сетінгом перед бронюванням.'
    flashSettingButton()
    return
  }
  bookSlot(slotId)
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
      const entry = pickSpecialist(profile.value)
      const items = getStoredSelectedSpecialists()
      const filtered = items.filter((item) => item.public_slug !== entry.public_slug)
      filtered.unshift(entry)
      persistSelectedSpecialists(filtered)
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

function pickSpecialist(data: PublicSpecialistProfile) {
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

function getStoredSelectedSpecialists() {
  const raw =
    localStorage.getItem('selectedSpecialists') || localStorage.getItem('selectedTherapists')
  const legacy = localStorage.getItem('selectedTherapist')
  try {
    if (raw) return JSON.parse(raw)
    if (legacy) return [JSON.parse(legacy)]
  } catch {
    return []
  }
  return []
}

function persistSelectedSpecialists(items: any[]) {
  localStorage.setItem('selectedSpecialists', JSON.stringify(items))
  localStorage.setItem('selectedTherapists', JSON.stringify(items))
  const first = items[0] ?? null
  if (first) {
    localStorage.setItem('selectedTherapist', JSON.stringify(first))
  } else {
    localStorage.removeItem('selectedTherapist')
  }
}

function getStoredViewedSpecialists() {
  const raw = localStorage.getItem('viewedSpecialists') || localStorage.getItem('viewedTherapists')
  try {
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function persistViewedSpecialists(items: any[]) {
  localStorage.setItem('viewedSpecialists', JSON.stringify(items))
  localStorage.setItem('viewedTherapists', JSON.stringify(items))
}

function saveViewedSpecialist(data: PublicSpecialistProfile) {
  if (!data.public_slug) return
  const items = getStoredViewedSpecialists()
  const entry = pickSpecialist(data)
  const filtered = items.filter((item) => item.public_slug !== entry.public_slug)
  filtered.unshift(entry)
  persistViewedSpecialists(filtered.slice(0, 8))
}

watch(slug, () => {
  profile.value = null
  slots.value = []
  selectedDate.value = toLocalDate(new Date())
  loadProfile().then(loadSlots)
  loadClientSessions()
  loadJournal()
})

watch(selectedDate, () => {
  slots.value = []
  loadSlots()
})

watch([isAuthenticated, isClient], () => {
  loadClientSessions()
})

watch(
  () => route.query.cat,
  (value) => {
    const key = String(value || 'ALL')
    if (['ALL', 'TIP', 'EXPLAIN', 'FAQ', 'RESEARCH', 'PRACTICE'].includes(key)) {
      activeCategory.value = key as JournalCategory
    }
  },
  { immediate: true }
)

onMounted(async () => {
  if (!selectedDate.value) {
    selectedDate.value = toLocalDate(new Date())
  }
  await loadProfile()
  await loadSlots()
  await loadClientSessions()
  await loadJournal()
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
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--color-primary-100) 70%, #ffffff),
    color-mix(in srgb, var(--color-neutral-100) 60%, #ffffff)
  );
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

.public__actions .btn--ghost {
  background: rgba(255, 255, 255, 0.78);
  border-color: var(--color-neutral-200);
  color: var(--color-neutral-800);
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.08);
}

.public__actions .btn--ghost:hover,
.public__actions .btn--ghost:focus-visible {
  background: #ffffff;
  border-color: color-mix(in srgb, var(--color-neutral-500) 45%, transparent);
  box-shadow: 0 10px 22px rgba(0, 0, 0, 0.12);
}

.public__grid {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr);
  gap: 16px;
}

.panel--slots {
  grid-column: 1 / -1;
}

.panel--profile {
  grid-column: 1;
}

.panel--journal {
  grid-column: 1 / -1;
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

  .panel__header-actions {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
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

  .panel--journal {
    display: grid;
    gap: 12px;
  }

  .profile-collections {
    border: 1px solid var(--line);
    border-radius: 12px;
    padding: 10px 12px;
    background: #fff;
    display: grid;
    gap: 10px;
  }

  .profile-collections__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }

  .profile-collections__title {
    font-size: 16px;
    font-weight: 700;
  }

  .profile-collections__list {
    display: grid;
    gap: 8px;
  }

  .profile-collection-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    border: 1px solid var(--line);
    border-radius: 10px;
    padding: 8px 10px;
    color: inherit;
    text-decoration: none;
    background: rgba(255, 255, 255, 0.85);
  }

  .profile-collection-item__left {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
  }

  .profile-collection-item__cover {
    width: 42px;
    height: 30px;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid var(--line);
    background: var(--color-neutral-50, #f7f8f9);
    flex-shrink: 0;
  }

  .profile-collection-item__cover img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .profile-collection-item:hover {
    border-color: rgba(43, 122, 111, 0.35);
    background: rgba(43, 122, 111, 0.06);
  }

  .profile-collection-item__name {
    font-size: 14px;
    font-weight: 600;
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .profile-collection-item__meta {
    font-size: 12px;
    color: var(--muted);
    white-space: nowrap;
  }

  .journal-list {
    display: grid;
    gap: 12px;
    grid-template-columns: 1fr;
  }

  .journal-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
    align-items: start;
    grid-auto-rows: 1fr;
  }

  .journal-filters {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin: 6px 0 14px;
  }

  .filter-chip {
    border: 1px solid var(--line);
    background: rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(10px);
    border-radius: 999px;
    padding: 8px 12px;
    font-size: 13px;
    cursor: pointer;
    transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
  }

  .filter-chip:hover {
    transform: translateY(-1px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.06);
  }

  .filter-chip.is-active {
    background: rgba(43, 122, 111, 0.12);
    border-color: rgba(43, 122, 111, 0.35);
  }

  .empty {
    display: grid;
    gap: 10px;
    padding: 16px 18px;
    border-radius: 12px;
    border: 1px dashed var(--line);
    background: #fff;
  }

  .empty-title {
    font-weight: 600;
  }

  .post-tag {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    padding: 6px 10px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.85);
    border: 1px solid rgba(0, 0, 0, 0.06);
    backdrop-filter: blur(8px);
    color: var(--cat, #2b7a6f);
  }

  .post-tag::before {
    content: '';
    width: 8px;
    height: 8px;
    border-radius: 999px;
    background: currentColor;
    opacity: 0.9;
  }

  .pin-badge {
    display: inline-flex;
    align-items: center;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    padding: 6px 10px;
    border-radius: 999px;
    background: rgba(43, 122, 111, 0.12);
    border: 1px solid rgba(43, 122, 111, 0.25);
    color: #2b7a6f;
    width: fit-content;
    margin-top: 8px;
  }

  .journal-card--pinned {
    border-color: rgba(43, 122, 111, 0.35);
    box-shadow: 0 10px 30px rgba(43, 122, 111, 0.1);
  }

  .journal-card {
    display: grid;
    border: 1px solid var(--line);
    border-radius: 14px;
    padding: 24px;
    background: #fff;
    overflow: hidden;
    gap: 24px;
    border-left: 4px solid #9ad7c8;
    transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
    height: auto;
    align-items: start;
    animation: journalFade 0.35s ease;
  }

  .journal-card:hover {
    transform: translateY(-4px);
    border-color: #2b7a6f;
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.06), 0 2px 6px rgba(0, 0, 0, 0.04);
  }

  .journal-card--feature {
    grid-template-columns: 1fr 360px;
    padding: 34px 34px 34px 28px;
    border-left-width: 6px;
    grid-column: 1 / -1;
  }

  .journal-card--feature .journal-cover img {
    max-height: none;
  }

  .journal-card--feature .journal-title {
    font-size: 30px;
    line-height: 1.25;
  }

  .journal-card--feature .journal-summary {
    font-size: 17px;
    -webkit-line-clamp: 3;
  }

  .journal-cover {
    background: var(--color-neutral-50, #f7f8f9);
    display: flex;
    justify-content: center;
    align-items: flex-start;
    padding: 12px;
    border-radius: 12px;
    position: relative;
    aspect-ratio: 3 / 2;
    overflow: hidden;
  }

  .journal-cover img {
    width: 100%;
    height: auto;
    display: block;
    height: 100%;
    object-fit: cover;
    object-position: 50% 35%;
    transition: transform 0.4s ease;
  }

  .journal-card:hover .journal-cover img {
    transform: scale(1.04);
  }

  .journal-body {
    display: grid;
    gap: 10px;
    padding: 0;
  }

  .journal-title {
    font-weight: 600;
    font-size: 22px;
    line-height: 1.35;
  }

  .journal-meta {
    font-size: 14px;
    color: #8a8a8a;
  }

  .journal-summary {
    font-size: 16px;
    line-height: 1.6;
    color: #555;
    max-width: 540px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .journal-full {
    margin-top: 10px;
    white-space: pre-wrap;
    color: var(--color-neutral-800);
  }

  .read-more {
    margin-top: 10px;
    align-self: flex-start;
    font-size: 15px;
    font-weight: 500;
    color: #2b7a6f;
    background: transparent;
    border: none;
    padding: 0;
    cursor: pointer;
  }

  .read-more:hover {
    text-decoration: underline;
  }

  .journal-card--closed {
    grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
    align-items: start;
  }

  .journal-card--closed .journal-cover {
    grid-column: 2;
    grid-row: 1;
  }

  .journal-card--closed .journal-body {
    grid-column: 1;
    grid-row: 1;
  }

  .journal-card--closed .journal-cover img {
    max-height: none;
  }

  .journal-card--open {
    grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
    align-items: start;
  }

  .journal-grid .journal-card {
    grid-template-columns: 1fr 180px;
    padding: 18px 18px 18px 16px;
    height: 100%;
    align-content: start;
  }

  .journal-grid .journal-cover {
    height: 100%;
    align-items: center;
    aspect-ratio: auto;
  }

  .journal-grid .journal-cover img {
    height: 100%;
    object-fit: contain;
  }

  .journal-grid .journal-cover img {
    max-height: 140px;
  }

  .journal-grid .journal-title {
    font-size: 20px;
    line-height: 1.3;
  }

  .journal-grid .journal-summary {
    -webkit-line-clamp: 2;
  }

  .journal-card--open .journal-cover {
    grid-column: 2;
    grid-row: 1;
  }

  .journal-card--open .journal-body {
    grid-column: 1;
    grid-row: 1;
    padding-right: 6px;
  }

  .journal-card--open .journal-cover {
    aspect-ratio: auto;
    align-items: flex-start;
  }

  .journal-card--open .journal-cover img {
    height: auto;
    max-height: 600px;
    object-fit: contain;
  }

  .journal-card--open .journal-body {
    padding-right: 18px;
  }

  .journal-card--open .journal-readmore {
    margin-top: 16px;
  }

  @media (max-width: 900px) {
    .journal-grid {
      grid-template-columns: 1fr;
    }

    .journal-grid .journal-card {
      grid-template-columns: 1fr;
    }

    .journal-grid .journal-cover img {
      max-height: 200px;
    }

    .journal-card--open,
    .journal-card--closed,
    .journal-card--feature {
      grid-template-columns: 1fr;
      padding: 18px;
    }

    .journal-card--open .journal-cover,
    .journal-card--closed .journal-cover {
      padding: 10px 12px;
    }

    .journal-card--feature .journal-cover img {
      max-height: 220px;
    }
  }

  @keyframes journalFade {
    from {
      opacity: 0;
      transform: translateY(10px);
    }

    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .rating-pill {
    padding: 6px 10px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 600;
    background: rgba(31, 122, 76, 0.16);
    color: #1f7a4c;
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

  .btn--disabled {
    opacity: 0.55;
    cursor: not-allowed;
    pointer-events: auto;
  }

  .btn--disabled:hover {
    transform: none;
  }

  .btn--pulse {
    animation: pulse-attention 0.9s ease-in-out;
    box-shadow: 0 0 0 0 rgba(42, 129, 168, 0.35);
  }

  @keyframes pulse-attention {
    0% {
      transform: scale(1);
      box-shadow: 0 0 0 0 rgba(42, 129, 168, 0.35);
    }
    50% {
      transform: scale(1.02);
      box-shadow: 0 0 0 10px rgba(42, 129, 168, 0);
    }
    100% {
      transform: scale(1);
      box-shadow: 0 0 0 0 rgba(42, 129, 168, 0);
    }
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

  .setting-label {
    display: grid;
    gap: 6px;
    font-size: 13px;
    color: var(--muted);
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
