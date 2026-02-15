<template>
  <section class="profile">
    <header class="profile__hero">
      <div>
        <div class="badge">Кабінет терапевта</div>
        <h1 class="title profile__title">Керування публічним профілем</h1>
        <p class="muted profile__subtitle">
          Налаштовуйте видимість, тексти й контакти. Прев’ю показує, як вас бачать клієнти.
        </p>
      </div>
      <div class="profile__actions">
        <div class="toggle-chip" :class="profile.public_profile_enabled ? 'toggle-chip--on' : 'toggle-chip--off'">
          {{ profile.public_profile_enabled ? 'Публічний профіль увімкнено' : 'Публічний профіль вимкнено' }}
        </div>
        <button class="btn" type="button" :disabled="shareLoading" @click="onShareProfile">
          {{ shareLoading ? 'Підготовка...' : 'Поділитись профілем' }}
        </button>
        <RouterLink class="btn btn--ghost" to="/cabinet">Назад до кабінету</RouterLink>
        <div v-if="shareStatus" class="muted" style="margin-top: 6px;">{{ shareStatus }}</div>
      </div>
    </header>

    <div v-if="loading" class="muted" style="margin-top: 12px;">Завантаження профілю...</div>
    <div v-else-if="error" class="form-error" style="margin-top: 12px;">{{ error }}</div>

    <form v-else class="profile-grid" @submit.prevent="onSave">
      <section class="panel preview">
        <div class="panel__header">
          <div>
            <div class="badge badge--soft">Публічний перегляд</div>
            <h2 class="panel__title">Превʼю картки</h2>
          </div>
          <div class="panel__meta">{{ profile.public_slug || 'slug ще не створено' }}</div>
        </div>
        <div class="preview-card">
          <div class="preview-content">
            <div class="preview-info">
              <div class="preview-title">
                {{ profile.display_name || "Ваше публічне ім'я" }}
              </div>
              <div class="preview-sections" v-if="hasAnyBioSection">
                <div v-if="profile.show_bio_about && profile.bio_about" class="preview-section">
                  <div class="preview-label">Про себе</div>
                  <div class="muted preview-bio">{{ profile.bio_about }}</div>
                </div>
                <div v-if="profile.show_bio_work && profile.bio_work" class="preview-section">
                  <div class="preview-label">Як я працюю</div>
                  <div class="muted preview-bio">{{ profile.bio_work }}</div>
                </div>
                <div v-if="profile.show_bio_approach && profile.bio_approach" class="preview-section">
                  <div class="preview-label">Мій підхід</div>
                  <div class="muted preview-bio">{{ profile.bio_approach }}</div>
                </div>
                <div v-if="profile.show_bio_for_whom && profile.bio_for_whom" class="preview-section">
                  <div class="preview-label">Для кого це може бути</div>
                  <div class="muted preview-bio">{{ profile.bio_for_whom }}</div>
                </div>
                <div v-if="profile.show_bio_other && profile.bio_other" class="preview-section">
                  <div class="preview-label">Інше</div>
                  <div class="muted preview-bio">{{ profile.bio_other }}</div>
                </div>
              </div>
              <div class="meta">
                <span v-if="profile.specializations">{{ profile.specializations }}</span>
                <span v-if="languagesDisplay">{{ languagesDisplay }}</span>
                <span v-if="profile.show_location && profile.location">{{ profile.location }}</span>
              </div>
              <div class="meta">
                <span v-if="profile.show_price && profile.price">{{ priceDisplay }}</span>
              </div>
              <div class="contact">
                <div v-if="profile.show_email && profile.contact_email">
                  Ел. пошта: {{ profile.contact_email }}
                </div>
                <div v-if="profile.show_phone && profile.contact_phone">
                  Телефон: {{ profile.contact_phone }}
                </div>
                <div v-if="profile.show_telegram && profile.telegram">
                  Telegram: {{ profile.telegram }}
                </div>
                <div v-if="profile.show_viber && profile.viber">
                  Viber: {{ profile.viber }}
                </div>
              </div>
            </div>
            <div class="preview-media">
              <img
                v-if="profile.show_photo && profile.photo_url"
                class="preview-photo"
                :src="profile.photo_url"
                alt="Фото профілю"
              />
              <video
                v-if="profile.show_video && profile.video_url"
                class="preview-video"
                :src="profile.video_url"
                controls
                preload="metadata"
              ></video>
            </div>
          </div>
        </div>
      </section>

      <section class="panel">
        <div class="panel__header">
          <div>
            <div class="badge badge--soft">Профіль</div>
            <h2 class="panel__title">Основні дані</h2>
          </div>
        </div>
        <div class="form" style="margin-top: 12px;">
          <label class="field">
            Публічне ім’я
            <input v-model="profile.display_name" class="input" type="text" />
          </label>
          <label class="field">
            <div class="field-head">
              <span>Про себе</span>
              <label class="inline-check">
                <input v-model="profile.show_bio_about" type="checkbox" />
                Показувати
              </label>
            </div>
            <textarea v-model="profile.bio_about" class="input" rows="4"></textarea>
          </label>
          <label class="field">
            <div class="field-head">
              <span>Як я працюю</span>
              <label class="inline-check">
                <input v-model="profile.show_bio_work" type="checkbox" />
                Показувати
              </label>
            </div>
            <textarea v-model="profile.bio_work" class="input" rows="4"></textarea>
          </label>
          <label class="field">
            <div class="field-head">
              <span>Мій підхід</span>
              <label class="inline-check">
                <input v-model="profile.show_bio_approach" type="checkbox" />
                Показувати
              </label>
            </div>
            <textarea v-model="profile.bio_approach" class="input" rows="4"></textarea>
          </label>
          <label class="field">
            <div class="field-head">
              <span>Для кого це може бути</span>
              <label class="inline-check">
                <input v-model="profile.show_bio_for_whom" type="checkbox" />
                Показувати
              </label>
            </div>
            <textarea v-model="profile.bio_for_whom" class="input" rows="4"></textarea>
          </label>
          <label class="field">
            <div class="field-head">
              <span>Інше</span>
              <label class="inline-check">
                <input v-model="profile.show_bio_other" type="checkbox" />
                Показувати
              </label>
            </div>
            <textarea v-model="profile.bio_other" class="input" rows="4"></textarea>
          </label>
          <label class="field">
            Спеціалізації
            <input v-model="profile.specializations" class="input" type="text" />
          </label>
          <label class="field">
            Мови
            <div class="chip-field">
              <div class="chip" v-for="language in languageList" :key="language">
                <span>{{ language }}</span>
                <button type="button" class="chip-remove" @click="removeLanguage(language)">×</button>
              </div>
              <input
                v-model="languageInput"
                class="input chip-input"
                type="text"
                list="languageOptions"
                placeholder="введіть мову"
                @keydown.enter.prevent="addLanguage()"
                @keydown="onLanguageKeydown"
              />
              <datalist id="languageOptions">
                <option v-for="language in languageOptions" :key="language" :value="language" />
              </datalist>
            </div>
            <div class="muted" style="font-size: 12px;">
              Можна додавати скільки завгодно мов. Підказки працюють за першими літерами.
            </div>
          </label>
          <label class="field">
            Локація
            <input v-model="profile.location" class="input" type="text" />
          </label>
          <label class="field">
            Ціна за одну консультацію
            <div class="field-row">
              <input v-model="profile.price" class="input" type="text" />
              <select v-model="profile.price_currency" class="input input--select">
                <option value="UAH">грн</option>
                <option value="USD">$</option>
                <option value="EUR">€</option>
              </select>
            </div>
          </label>
        </div>
      </section>

      <section class="panel">
        <div class="panel__header">
          <div>
            <div class="badge badge--soft">Контакти</div>
            <h2 class="panel__title">Звʼязок</h2>
          </div>
        </div>
        <div class="contacts-grid" style="margin-top: 12px;">
          <div class="form">
            <label class="field">
              Ел. пошта для зв’язку
              <input v-model="profile.contact_email" class="input" type="email" />
            </label>
            <label class="field">
              Телефон для зв’язку
              <input v-model="profile.contact_phone" class="input" type="text" />
            </label>
            <div class="field-row">
              <label class="field field--half">
                Telegram
                <input v-model="profile.telegram" class="input" type="text" placeholder="@username або номер" />
              </label>
              <label class="field field--half">
                Viber
                <input v-model="profile.viber" class="input" type="text" placeholder="номер телефону" />
              </label>
            </div>
          </div>
          <div class="media-preview media-preview--side">
            <div
              class="media-card"
              role="button"
              tabindex="0"
              @click="triggerPhotoSelect"
              @keydown.enter.prevent="triggerPhotoSelect"
              @keydown.space.prevent="triggerPhotoSelect"
            >
              <div class="media-title">Фото превʼю</div>
              <div class="media-frame">
                <img
                  v-if="photoPreviewUrl || profile.photo_url"
                  :src="photoPreviewUrl || profile.photo_url"
                  alt="Фото профілю"
                />
                <div v-else class="media-empty">Фото ще не завантажено</div>
              </div>
              <div class="media-status" v-if="photoUploading">Завантаження фото...</div>
              <input
                ref="photoInput"
                class="input input--file is-hidden"
                type="file"
                accept="image/*"
                @change="onPhotoSelected"
              />
            </div>
            <div
              class="media-card"
              role="button"
              tabindex="0"
              @click="triggerVideoSelect"
              @keydown.enter.prevent="triggerVideoSelect"
              @keydown.space.prevent="triggerVideoSelect"
            >
              <div class="media-title">Відео превʼю</div>
              <div class="media-frame">
                <video
                  v-if="videoPreviewUrl || profile.video_url"
                  :src="videoPreviewUrl || profile.video_url"
                  preload="metadata"
                  controls
                  @click.stop
                ></video>
                <div v-else class="media-empty">Відео ще не завантажено</div>
              </div>
              <div class="media-status" v-if="videoUploading">Завантаження відео...</div>
              <input
                ref="videoInput"
                class="input input--file is-hidden"
                type="file"
                accept="video/*"
                @change="onVideoSelected"
              />
            </div>
          </div>
        </div>
      </section>

      <section class="panel">
        <div class="panel__header">
          <div>
            <div class="badge badge--soft">Видимість</div>
            <h2 class="panel__title">Що показувати</h2>
          </div>
        </div>
        <div class="form" style="margin-top: 12px;">
          <label class="check">
            <input v-model="profile.public_profile_enabled" type="checkbox" />
            Публічний профіль увімкнено
          </label>
          <label class="check">
            <input v-model="profile.show_email" type="checkbox" />
            Показувати ел. пошту
          </label>
          <label class="check">
            <input v-model="profile.show_phone" type="checkbox" />
            Показувати телефон
          </label>
          <label class="check">
            <input v-model="profile.show_telegram" type="checkbox" />
            Показувати Telegram
          </label>
          <label class="check">
            <input v-model="profile.show_viber" type="checkbox" />
            Показувати Viber
          </label>
          <label class="check">
            <input v-model="profile.show_video" type="checkbox" />
            Показувати відео
          </label>
          <label class="check">
            <input v-model="profile.show_price" type="checkbox" />
            Показувати ціну
          </label>
          <label class="check">
            <input v-model="profile.show_location" type="checkbox" />
            Показувати локацію
          </label>
          <label class="check">
            <input v-model="profile.show_photo" type="checkbox" />
            Показувати фото
          </label>
        </div>
      </section>

      <section class="panel">
        <div class="panel__header">
          <div>
            <div class="badge badge--soft">Публічне посилання</div>
            <h2 class="panel__title">URL та slug</h2>
          </div>
        </div>
        <div class="form" style="margin-top: 12px;">
          <div class="field">
            <div class="muted">Публічний slug</div>
            <div class="slug-row">
              <code class="slug">{{ profile.public_slug }}</code>
              <button class="btn btn--ghost" type="button" @click="onRotateSlug">
                Оновити
              </button>
            </div>
            <div class="muted" style="font-size: 12px;">
              Остання ротація: {{ profile.last_slug_rotated_at || 'ніколи' }}
            </div>
          </div>
          <div class="field">
            <div class="muted">Публічний URL</div>
            <div class="slug-row">
              <code class="slug">{{ publicUrl }}</code>
              <button class="btn btn--ghost" type="button" @click="onCopyLink">
                Копіювати
              </button>
              <a class="btn btn--ghost" :href="publicUrl" target="_blank" rel="noreferrer">
                Відкрити
              </a>
            </div>
            <div v-if="copyStatus" class="muted" style="font-size: 12px;">
              {{ copyStatus }}
            </div>
          </div>
          <p class="muted" style="font-size: 12px;">
            Ротація slug робить старе посилання недійсним. Можна оновлювати раз на місяць.
          </p>
        </div>
      </section>

      <div class="profile-footer">
        <button class="btn" type="submit" :disabled="saving">
          {{ saving ? 'Збереження...' : 'Зберегти зміни' }}
        </button>
        <div v-if="success" class="muted">{{ success }}</div>
      </div>
    </form>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import {
  fetchTherapistProfile,
  rotateTherapistProfileSlug,
  updateTherapistProfile,
  uploadProfilePhoto,
  uploadProfileVideo,
  type TherapistProfile,
} from '../lib/api'

const loading = ref(true)
const saving = ref(false)
const error = ref('')
const success = ref('')
const copyStatus = ref('')
const shareStatus = ref('')
const shareLoading = ref(false)
const photoUploading = ref(false)
const videoUploading = ref(false)
const photoPreviewUrl = ref('')
const videoPreviewUrl = ref('')
const photoInput = ref<HTMLInputElement | null>(null)
const videoInput = ref<HTMLInputElement | null>(null)
const languageOptions = [
  'Українська',
  'Російська',
  'English',
  'Polski',
  'Deutsch',
  'Français',
  'Español',
  'Italiano',
  'Português',
  'Čeština',
  'Slovenčina',
]

const languageInput = ref('')
const languageList = ref<string[]>([])
const disallowedLanguages = new Set(['російська', 'русский', 'russian'])

function setPreviewUrl(target: { value: string }, file?: File | null) {
  if (target.value) {
    URL.revokeObjectURL(target.value)
  }
  target.value = file ? URL.createObjectURL(file) : ''
}

function triggerPhotoSelect() {
  photoInput.value?.click()
}

function triggerVideoSelect() {
  videoInput.value?.click()
}

function getApiErrorMessage(err: unknown, fallback: string) {
  if (err && typeof err === 'object') {
    const status = (err as { response?: { status?: number } }).response?.status
    if (status === 401) {
      return 'Сесія завершилась. Увійдіть знову.'
    }
    const data = (err as { response?: { data?: unknown } }).response?.data
    if (data && typeof data === 'object' && 'detail' in data) {
      const detail = (data as { detail?: string }).detail
      if (detail) return detail
    }
    if (typeof data === 'string' && data.trim()) {
      const text = data.trim()
      if (text.startsWith('<!DOCTYPE') || text.startsWith('<html')) {
        return 'Помилка сервера. Спробуйте пізніше.'
      }
      return text
    }
    if (data && typeof data === 'object') {
      const [field, messages] = Object.entries(data as Record<string, unknown>)[0] || []
      if (field && Array.isArray(messages) && messages[0]) {
        return `${field}: ${messages[0]}`
      }
      if (field && typeof messages === 'string') {
        return `${field}: ${messages}`
      }
    }
    const message = (err as { message?: string }).message
    if (message) return message
  }
  return fallback
}

function normalizeDecimal(value: string | number | null | undefined): string | null {
  if (value === null || value === undefined) return null
  const text = String(value).trim()
  return text ? text : null
}

function buildProfilePayload() {
  return {
    public_profile_enabled: profile.public_profile_enabled,
    display_name: profile.display_name,
    bio_about: profile.bio_about,
    bio_work: profile.bio_work,
    bio_approach: profile.bio_approach,
    bio_for_whom: profile.bio_for_whom,
    bio_other: profile.bio_other,
    show_bio_about: profile.show_bio_about,
    show_bio_work: profile.show_bio_work,
    show_bio_approach: profile.show_bio_approach,
    show_bio_for_whom: profile.show_bio_for_whom,
    show_bio_other: profile.show_bio_other,
    specializations: toList(profile.specializations),
    languages: languageList.value,
    location: profile.location,
    price: normalizeDecimal(profile.price),
    price_currency: profile.price_currency || 'UAH',
    contact_email: profile.contact_email,
    contact_phone: profile.contact_phone,
    telegram: profile.telegram,
    viber: profile.viber,
    show_email: profile.show_email,
    show_phone: profile.show_phone,
    show_messenger: profile.show_messenger,
    show_telegram: profile.show_telegram,
    show_viber: profile.show_viber,
    show_video: profile.show_video,
    show_price: profile.show_price,
    show_location: profile.show_location,
    show_photo: profile.show_photo,
  }
}

const profile = reactive<TherapistProfile>({
  id: 0,
  public_profile_enabled: false,
  public_slug: '',
  last_slug_rotated_at: null,
  display_name: '',
  bio_about: '',
  bio_work: '',
  bio_approach: '',
  bio_for_whom: '',
  bio_other: '',
  show_bio_about: true,
  show_bio_work: true,
  show_bio_approach: true,
  show_bio_for_whom: true,
  show_bio_other: true,
  specializations: '',
  languages: '',
  location: '',
  price: '',
  price_currency: 'UAH',
  contact_email: '',
  contact_phone: '',
  messenger: '',
  telegram: '',
  viber: '',
  whatsapp: '',
  photo_url: '',
  video_url: '',
  show_email: false,
  show_phone: false,
  show_messenger: false,
  show_telegram: false,
  show_viber: false,
  show_whatsapp: false,
  show_video: false,
  show_price: false,
  show_location: false,
  show_photo: false,
})

const publicUrl = computed(() => {
  if (!profile.public_slug) return ''
  return `${window.location.origin}/t/${profile.public_slug}`
})

const languagesDisplay = computed(() => languageList.value.join(', '))
const priceDisplay = computed(() => {
  if (!profile.price) return ''
  const currency = profile.price_currency || 'UAH'
  if (currency === 'UAH') return `${profile.price} грн`
  if (currency === 'USD') return `$${profile.price}`
  if (currency === 'EUR') return `€${profile.price}`
  return `${profile.price} ${currency}`
})
const hasAnyBioSection = computed(
  () =>
    (profile.show_bio_about && Boolean(profile.bio_about)) ||
    (profile.show_bio_work && Boolean(profile.bio_work)) ||
    (profile.show_bio_approach && Boolean(profile.bio_approach)) ||
    (profile.show_bio_for_whom && Boolean(profile.bio_for_whom)) ||
    (profile.show_bio_other && Boolean(profile.bio_other))
)

async function loadProfile() {
  loading.value = true
  error.value = ''
  try {
    const data = await fetchTherapistProfile()
    Object.assign(profile, normalizeProfile(data))
    languageList.value = sanitizeLanguages(toList(profile.languages))
    languageInput.value = ''
    setPreviewUrl(photoPreviewUrl, null)
    setPreviewUrl(videoPreviewUrl, null)
  } catch (err) {
    error.value = getApiErrorMessage(err, 'Не вдалося завантажити профіль')
  } finally {
    loading.value = false
  }
}

async function onSave() {
  saving.value = true
  success.value = ''
  error.value = ''
  try {
    const data = await updateTherapistProfile(buildProfilePayload())
    Object.assign(profile, normalizeProfile(data))
    languageList.value = sanitizeLanguages(toList(profile.languages))
    languageInput.value = ''
    success.value = 'Збережено.'
  } catch (err) {
    error.value = getApiErrorMessage(err, 'Не вдалося зберегти')
  } finally {
    saving.value = false
  }
}

async function onRotateSlug() {
  error.value = ''
  success.value = ''
  try {
    const data = await rotateTherapistProfileSlug()
    Object.assign(profile, normalizeProfile(data))
    success.value = 'Публічне посилання оновлено.'
  } catch (err) {
    error.value = getApiErrorMessage(err, 'Не вдалося оновити посилання')
  }
}

async function onCopyLink() {
  copyStatus.value = ''
  if (!publicUrl.value) {
    copyStatus.value = 'Публічного посилання ще немає.'
    return
  }
  try {
    await navigator.clipboard.writeText(publicUrl.value)
    copyStatus.value = 'Скопійовано.'
  } catch {
    copyStatus.value = 'Не вдалося скопіювати.'
  }
}

async function onShareProfile() {
  shareStatus.value = ''
  if (!publicUrl.value) {
    shareStatus.value = 'Публічного посилання ще немає.'
    return
  }
  shareLoading.value = true
  try {
    if (navigator.share) {
      await navigator.share({ title: 'Профіль терапевта', url: publicUrl.value })
      shareStatus.value = 'Посилання на профіль надіслано.'
      return
    }
    await navigator.clipboard.writeText(publicUrl.value)
    shareStatus.value = 'Посилання скопійовано.'
  } catch {
    shareStatus.value = 'Не вдалося поділитись посиланням.'
  } finally {
    shareLoading.value = false
  }
}

async function onPhotoSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  setPreviewUrl(photoPreviewUrl, file)
  photoUploading.value = true
  error.value = ''
  try {
    const data = await uploadProfilePhoto(file)
    Object.assign(profile, normalizeProfile(data))
    setPreviewUrl(photoPreviewUrl, null)
    success.value = 'Фото завантажено.'
  } catch (err) {
    error.value = getApiErrorMessage(err, 'Не вдалося завантажити фото')
  } finally {
    photoUploading.value = false
    input.value = ''
  }
}

async function onVideoSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  setPreviewUrl(videoPreviewUrl, file)
  videoUploading.value = true
  error.value = ''
  try {
    const data = await uploadProfileVideo(file)
    Object.assign(profile, normalizeProfile(data))
    setPreviewUrl(videoPreviewUrl, null)
    success.value = 'Відео завантажено.'
  } catch (err) {
    error.value = getApiErrorMessage(err, 'Не вдалося завантажити відео')
  } finally {
    videoUploading.value = false
    input.value = ''
  }
}

function normalizeProfile(data: TherapistProfile): TherapistProfile {
  return {
    ...data,
    display_name: data.display_name || '',
    bio_about: data.bio_about || '',
    bio_work: data.bio_work || '',
    bio_approach: data.bio_approach || '',
    bio_for_whom: data.bio_for_whom || '',
    bio_other: data.bio_other || '',
    show_bio_about: data.show_bio_about ?? true,
    show_bio_work: data.show_bio_work ?? true,
    show_bio_approach: data.show_bio_approach ?? true,
    show_bio_for_whom: data.show_bio_for_whom ?? true,
    show_bio_other: data.show_bio_other ?? true,
    specializations: toStringValue(data.specializations),
    languages: toStringValue(data.languages),
    location: data.location || '',
    price: data.price || '',
    price_currency: data.price_currency || 'UAH',
    contact_email: data.contact_email || '',
    contact_phone: data.contact_phone || '',
    messenger: data.messenger || '',
    telegram: data.telegram || '',
    viber: data.viber || '',
    whatsapp: data.whatsapp || '',
    photo_url: data.photo_url || '',
    video_url: data.video_url || '',
    show_telegram: data.show_telegram ?? false,
    show_viber: data.show_viber ?? false,
    show_whatsapp: data.show_whatsapp ?? false,
  }
}

function addLanguage() {
  const raw = languageInput.value.trim()
  if (!raw) return
  const cleaned = raw.replace(/,+$/, '').trim()
  if (!cleaned) {
    languageInput.value = ''
    return
  }
  const existing = new Set(languageList.value.map((item) => item.toLowerCase()))
  if (disallowedLanguages.has(cleaned.toLowerCase())) {
    languageInput.value = ''
    return
  }
  if (!existing.has(cleaned.toLowerCase())) {
    languageList.value = [...languageList.value, cleaned]
  }
  languageInput.value = ''
}

function removeLanguage(language: string) {
  languageList.value = languageList.value.filter((item) => item !== language)
}

function onLanguageKeydown(event: KeyboardEvent) {
  if (event.key === ',') {
    event.preventDefault()
    addLanguage()
  }
}

function toStringValue(value: string | string[] | null | undefined): string {
  if (!value) return ''
  if (Array.isArray(value)) return value.join(', ')
  if (value === '[]') return ''
  return String(value)
}

function toList(value: string | string[] | null | undefined): string[] {
  if (!value) return []
  if (Array.isArray(value)) return value.map((item) => item.trim()).filter(Boolean)
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function sanitizeLanguages(list: string[]): string[] {
  return list.filter((item) => !disallowedLanguages.has(item.trim().toLowerCase()))
}

onMounted(loadProfile)
</script>

<style scoped>
.profile {
  display: grid;
  gap: 18px;
}

.profile__hero {
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

.profile__title {
  font-size: 32px;
}

.profile__subtitle {
  max-width: 560px;
}

.profile__actions {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.toggle-chip {
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.toggle-chip--on {
  background: rgba(31, 122, 76, 0.16);
  color: #1f7a4c;
}

.toggle-chip--off {
  background: rgba(194, 75, 75, 0.2);
  color: #a03838;
}

.profile-grid {
  display: grid;
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

.panel__meta {
  font-size: 12px;
  color: var(--muted);
}

.badge--soft {
  background: rgba(8, 113, 201, 0.12);
}

.preview {
  background: linear-gradient(135deg, #ffffff 0%, #f5f1ea 100%);
}

.preview-card {
  margin-top: 12px;
  display: grid;
  gap: 10px;
  border-radius: 16px;
  padding: 16px;
  background: #fff;
  border: 1px solid var(--line);
}

.preview-content {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 340px);
  gap: 16px;
  align-items: start;
}

.preview-info {
  display: grid;
  gap: 10px;
}

.preview-title {
  font-family: var(--font-display);
  font-size: 22px;
}

.preview-bio {
  white-space: pre-line;
}

.field-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.inline-check {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--muted);
}

.preview-sections {
  display: grid;
  gap: 12px;
}

.preview-section {
  display: grid;
  gap: 6px;
}

.preview-label {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--muted);
}

.meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 13px;
  color: var(--muted);
}

.contact {
  display: grid;
  gap: 6px;
  font-size: 13px;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.preview-media {
  display: grid;
  gap: 10px;
}

.preview-photo {
  width: 100%;
  max-width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 12px;
  border: 1px solid var(--line);
  background: #0f2b3a;
  object-fit: cover;
  display: block;
}

.preview-video {
  width: 100%;
  max-width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 12px;
  border: 1px solid var(--line);
  background: #0f2b3a;
  display: block;
}

.profile-footer {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 8px;
}

.contacts-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 520px);
  gap: 16px;
  align-items: start;
}

.media-preview {
  display: grid;
  gap: 16px;
  width: 100%;
}

.media-preview--side {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: stretch;
}

.media-preview--side .media-card {
  width: 100%;
}

.media-card {
  border: 1px dashed var(--line);
  border-radius: 16px;
  padding: 12px;
  background: #fdfaf6;
  display: grid;
  gap: 10px;
  grid-template-rows: auto 1fr auto;
  min-height: 360px;
}

.media-title {
  font-size: 13px;
  color: var(--muted);
}

.media-frame {
  width: 100%;
  aspect-ratio: 3 / 4;
  height: 260px;
  border-radius: 14px;
  border: 1px solid var(--line);
  background: #fff;
  display: grid;
  place-items: center;
  overflow: hidden;
}

.media-frame img,
.media-frame video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  border-radius: 12px;
}

.media-empty {
  font-size: 12px;
  color: var(--muted);
  text-align: center;
  padding: 12px;
}

.media-status {
  font-size: 12px;
  color: var(--muted);
}

.field-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.field--half {
  margin: 0;
}

.input--file {
  padding: 10px 12px;
}

.input--select {
  min-width: 120px;
}

.is-hidden {
  display: none;
}

.chip-field {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 999px;
  background: #f7f4ef;
  border: 1px solid var(--line);
  font-size: 12px;
}

.chip-remove {
  background: transparent;
  border: none;
  padding: 0;
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  color: var(--muted);
}

.chip-input {
  min-width: 220px;
  flex: 1;
}

.slug-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.slug {
  display: inline-flex;
  padding: 8px 12px;
  border-radius: 12px;
  background: #f7f4ef;
  border: 1px dashed var(--line);
  font-size: 13px;
}

.form-error {
  color: #b3261e;
  background: #fdecea;
  border: 1px solid #f5c2c0;
  border-radius: 10px;
  padding: 8px 10px;
}

@media (max-width: 980px) {
  .contacts-grid {
    grid-template-columns: 1fr;
  }

  .media-preview--side {
    grid-template-columns: 1fr;
  }

  .field-row {
    grid-template-columns: 1fr;
  }

  .preview-content {
    grid-template-columns: 1fr;
  }

  .profile__hero {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
