<template>
  <section class="card">
    <div class="profile-header">
      <div>
        <h1 class="title" style="font-size: 28px;">Профіль терапевта</h1>
        <p class="muted">Керуйте профілем кабінету та тим, що видно публічно.</p>
      </div>
      <div class="profile-actions">
        <RouterLink class="btn btn--ghost" to="/cabinet">Назад до кабінету</RouterLink>
      </div>
    </div>

    <div v-if="loading" class="muted" style="margin-top: 12px;">Завантаження профілю...</div>
    <div v-else-if="error" class="muted" style="margin-top: 12px;">{{ error }}</div>

    <form v-else class="profile-grid" @submit.prevent="onSave">
      <div class="panel preview">
        <div class="badge">Публічний перегляд</div>
        <div class="preview-card">
          <div class="preview-title">
            {{ profile.display_name || 'Ваше публічне ім’я' }}
          </div>
          <div class="muted" v-if="profile.bio">{{ profile.bio }}</div>
          <div class="meta">
            <span v-if="profile.specializations">{{ profile.specializations }}</span>
            <span v-if="languagesDisplay">{{ languagesDisplay }}</span>
            <span v-if="profile.show_location && profile.location">{{ profile.location }}</span>
          </div>
          <div class="meta">
            <span v-if="profile.show_price && profile.price">{{ profile.price }}</span>
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
            <div v-if="profile.show_whatsapp && profile.whatsapp">
              WhatsApp: {{ profile.whatsapp }}
            </div>
            <div v-if="profile.show_video && profile.video_url">
              Відео: {{ profile.video_url }}
            </div>
          </div>
          <div class="muted" style="font-size: 12px; margin-top: 8px;">
            {{ profile.public_profile_enabled ? 'Публічний профіль увімкнено.' : 'Публічний профіль приховано.' }}
          </div>
        </div>
      </div>

      <div class="panel">
        <div class="badge">Профіль</div>
        <div class="form" style="margin-top: 12px;">
          <label class="field">
            Публічне ім’я
            <input v-model="profile.display_name" class="input" type="text" />
          </label>
          <label class="field">
            Про себе
            <textarea v-model="profile.bio" class="input" rows="4"></textarea>
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
            <input v-model="profile.price" class="input" type="text" />
          </label>
        </div>
      </div>

      <div class="panel">
        <div class="badge">Контакти</div>
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
            <label class="field">
              Telegram
              <input v-model="profile.telegram" class="input" type="text" placeholder="@username або номер" />
            </label>
            <label class="field">
              Viber
              <input v-model="profile.viber" class="input" type="text" placeholder="номер телефону" />
            </label>
            <label class="field">
              WhatsApp
              <input v-model="profile.whatsapp" class="input" type="text" placeholder="номер телефону" />
            </label>
            <label class="field">
              Фото
              <div class="file-row">
                <input class="input input--file" type="file" accept="image/*" @change="onPhotoSelected" />
                <span class="muted" v-if="photoUploading">Завантаження...</span>
                <a v-if="profile.photo_url" class="btn btn--ghost" :href="profile.photo_url" target="_blank" rel="noreferrer">
                  Переглянути
                </a>
              </div>
            </label>
            <label class="field">
              Відео
              <div class="file-row">
                <input class="input input--file" type="file" accept="video/*" @change="onVideoSelected" />
                <span class="muted" v-if="videoUploading">Завантаження...</span>
                <a v-if="profile.video_url" class="btn btn--ghost" :href="profile.video_url" target="_blank" rel="noreferrer">
                  Переглянути
                </a>
              </div>
            </label>
          </div>
          <div class="media-preview">
            <div class="media-card">
              <div class="media-title">Фото превʼю</div>
              <div class="media-frame">
                <img v-if="profile.photo_url" :src="profile.photo_url" alt="Фото профілю" />
                <div v-else class="media-empty">Фото ще не завантажено</div>
              </div>
              <div class="muted" style="font-size: 12px;">
                Фото зʼявиться тут одразу після завантаження.
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="panel">
        <div class="badge">Видимість</div>
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
            <input v-model="profile.show_whatsapp" type="checkbox" />
            Показувати WhatsApp
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
      </div>

      <div class="panel">
        <div class="badge">Публічне посилання</div>
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
              Остання ротація:
              {{ profile.last_slug_rotated_at || 'ніколи' }}
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
      </div>

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
const photoUploading = ref(false)
const videoUploading = ref(false)
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

const profile = reactive<TherapistProfile>({
  id: 0,
  public_profile_enabled: false,
  public_slug: '',
  last_slug_rotated_at: null,
  display_name: '',
  bio: '',
  specializations: '',
  languages: '',
  location: '',
  price: '',
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

async function loadProfile() {
  loading.value = true
  error.value = ''
  try {
      const data = await fetchTherapistProfile()
      Object.assign(profile, normalizeProfile(data))
      languageList.value = sanitizeLanguages(toList(profile.languages))
      languageInput.value = ''
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Не вдалося завантажити профіль'
  } finally {
    loading.value = false
  }
}

async function onSave() {
  saving.value = true
  success.value = ''
  error.value = ''
  try {
    const data = await updateTherapistProfile({
      ...profile,
      specializations: toList(profile.specializations),
      languages: languageList.value,
      })
      Object.assign(profile, normalizeProfile(data))
      languageList.value = sanitizeLanguages(toList(profile.languages))
      languageInput.value = ''
      success.value = 'Збережено.'
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Не вдалося зберегти'
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
    error.value = err instanceof Error ? err.message : 'Не вдалося оновити посилання'
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

async function onPhotoSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  photoUploading.value = true
  error.value = ''
  try {
    const data = await uploadProfilePhoto(file)
    Object.assign(profile, normalizeProfile(data))
    success.value = 'Фото завантажено.'
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Не вдалося завантажити фото'
  } finally {
    photoUploading.value = false
    input.value = ''
  }
}

async function onVideoSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  videoUploading.value = true
  error.value = ''
  try {
    const data = await uploadProfileVideo(file)
    Object.assign(profile, normalizeProfile(data))
    success.value = 'Відео завантажено.'
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Не вдалося завантажити відео'
  } finally {
    videoUploading.value = false
    input.value = ''
  }
}

function normalizeProfile(data: TherapistProfile): TherapistProfile {
  return {
    ...data,
    display_name: data.display_name || '',
    bio: data.bio || '',
    specializations: toStringValue(data.specializations),
    languages: toStringValue(data.languages),
    location: data.location || '',
    price: data.price || '',
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
.profile-grid {
  display: grid;
  gap: 16px;
  margin-top: 16px;
}

.panel {
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 16px;
  background: #fff;
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

.preview-title {
  font-family: var(--font-serif);
  font-size: 22px;
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
}

.profile-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.profile-actions {
  display: flex;
  gap: 12px;
}

.check {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
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

.profile-footer {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 8px;
}

.contacts-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 260px;
  gap: 16px;
  align-items: start;
}

.media-preview {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.media-card {
  border: 1px dashed var(--line);
  border-radius: 16px;
  padding: 12px;
  background: #fdfaf6;
  display: grid;
  gap: 10px;
}

.media-title {
  font-size: 13px;
  color: var(--muted);
}

.media-frame {
  width: 100%;
  aspect-ratio: 3 / 4;
  border-radius: 14px;
  border: 1px solid var(--line);
  background: #fff;
  display: grid;
  place-items: center;
  overflow: hidden;
}

.media-frame img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.media-empty {
  font-size: 12px;
  color: var(--muted);
  text-align: center;
  padding: 12px;
}

.file-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.input--file {
  padding: 10px 12px;
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

@media (max-width: 900px) {
  .contacts-grid {
    grid-template-columns: 1fr;
  }
}
</style>
