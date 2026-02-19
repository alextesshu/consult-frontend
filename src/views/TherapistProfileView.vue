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
      <section class="panel panel--highlight">
        <div class="panel__header">
          <div>
            <div class="badge badge--soft">Крок 1</div>
            <h2 class="panel__title">Публічний профіль</h2>
            <p class="panel__hint">
              Якщо ви вже знайшли клієнта і хочете почати співпрацю — поділіться з ним посиланням
              на ваш профіль. Для цього натисніть “Поділитись профілем” або скопіюйте посилання нижче.
            </p>
          </div>
        </div>
        <div class="form" style="margin-top: 12px;">
          <label class="check" title="Якщо вимкнено — профіль не буде видно у каталозі.">
            <input v-model="profile.public_profile_enabled" type="checkbox" />
            Публічний профіль увімкнено
          </label>
          <div class="field">
            <div class="muted">Код посилання</div>
            <div class="slug-row">
              <code
                class="slug"
                title="Це унікальний код, з якого формується посилання на ваш профіль. Якщо оновити код — попереднє посилання перестане працювати."
              >
                {{ profile.public_slug }}
              </code>
              <button
                class="btn btn--ghost"
                type="button"
                title="Згенерувати новий код. Старе посилання стане недійсним."
                @click="onRotateSlug"
              >
                Оновити
              </button>
            </div>
            <div class="muted" style="font-size: 12px;">
              Останнє оновлення: {{ profile.last_slug_rotated_at || 'ніколи' }}
            </div>
            <div class="muted" style="font-size: 12px;">
              Це службовий код. Він потрібен, щоб оновлювати публічне посилання або відкривати профіль вручну.
            </div>
          </div>
          <div class="field">
            <div class="muted">Публічне посилання</div>
            <div class="slug-row">
              <code class="slug" title="Повне посилання, яким можна ділитися з клієнтами.">{{ publicUrl }}</code>
              <button
                class="btn btn--ghost"
                type="button"
                title="Скопіювати посилання в буфер обміну."
                @click="onCopyLink"
              >
                Копіювати
              </button>
              <a
                class="btn btn--ghost"
                :href="publicUrl"
                target="_blank"
                rel="noreferrer"
                title="Відкрити публічний профіль у новій вкладці."
              >
                Відкрити
              </a>
            </div>
            <div v-if="copyStatus" class="muted" style="font-size: 12px;">
              {{ copyStatus }}
            </div>
          </div>
        </div>
      </section>

      <section class="panel">
        <div class="panel__header">
          <div>
            <div class="badge badge--soft">Крок 2</div>
            <h2 class="panel__title">Основні дані</h2>
            <p class="panel__hint">Ці поля формують перше враження в каталозі та публічному профілі.</p>
          </div>
        </div>
        <div class="form" style="margin-top: 12px;">
          <label class="field">
            Публічне ім'я
            <input v-model="profile.display_name" class="input" type="text" placeholder="Напр. Олена Коваль" />
          </label>
          <label class="field">
            Спеціалізації
            <div class="chip-field">
              <div class="chip" v-for="(spec, index) in specializationList" :key="`${spec}-${index}`">
                <span>{{ spec }}</span>
                <button type="button" class="chip-remove" @click.stop.prevent="removeSpecialization(index)">×</button>
              </div>
              <input
                v-model="specializationInput"
                class="input chip-input"
                type="text"
                list="specializationOptions"
                placeholder="введіть спеціалізацію"
                @input="onSpecializationInput"
                @keydown.enter.prevent="addSpecialization()"
                @keydown="onSpecializationKeydown"
              />
              <datalist id="specializationOptions">
                <option v-for="option in specializationOptions" :key="option" :value="option" />
              </datalist>
            </div>
            <div v-if="showOtherSpecialization" class="chip-field" style="margin-top: 8px;">
              <input
                v-model="otherSpecializationInput"
                class="input chip-input"
                type="text"
                placeholder="Впишіть спеціалізацію"
                @keydown.enter.prevent="addOtherSpecialization"
              />
              <button class="btn btn--ghost btn--sm" type="button" @click="addOtherSpecialization">
                Додати
              </button>
            </div>
          </label>

          <div class="field">
            <label for="language-input">Мови</label>
            <div class="chip-field">
              <div class="chip" v-for="(language, index) in languageList" :key="`${language}-${index}`">
                <span>{{ language }}</span>
                <button
                  type="button"
                  class="chip-remove"
                  @mousedown.stop
                  @click.stop="removeLanguage(language, index)"
                >
                  ×
                </button>
              </div>
              <input
                id="language-input"
                v-model="languageInput"
                class="input chip-input"
                type="text"
                list="languageOptions"
                placeholder="введіть мову"
                @input="onLanguageInput"
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
          </div>
            <label class="field">
              Локація
              <input v-model="profile.location" class="input" type="text" placeholder="Місто / країна" />
            </label>
            <label class="field">
              Досвід роботи
              <select v-model.number="profile.experience_years" class="input input--select" required>
                <option v-for="option in experienceOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
              <div class="muted" style="font-size: 12px;">
                Це поле обов’язкове і відображається у публічному профілі.
              </div>
            </label>
            <label class="field">
              Ціна за одну консультацію
              <div class="field-row">
              <input v-model="profile.price" class="input" type="text" placeholder="500" />
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
            <div class="badge badge--soft">Крок 3</div>
            <h2 class="panel__title">Про вас</h2>
            <p class="panel__hint">Короткі блоки тексту. У кожного є перемикач “показувати”.</p>
          </div>
        </div>
        <div class="details-stack">
          <details class="details" open>
            <summary>Коротко про мене</summary>
            <label class="field">
              <div class="field-head">
                <span>Текст</span>
                <label class="inline-check">
                  <input v-model="profile.show_bio_about" type="checkbox" />
                  Показувати
                </label>
              </div>
              <textarea v-model="profile.bio_about" class="input" rows="4"></textarea>
            </label>
          </details>
          <details class="details">
            <summary>Як проходить консультація</summary>
            <label class="field">
              <div class="field-head">
                <span>Текст</span>
                <label class="inline-check">
                  <input v-model="profile.show_bio_work" type="checkbox" />
                  Показувати
                </label>
              </div>
              <textarea v-model="profile.bio_work" class="input" rows="4"></textarea>
            </label>
          </details>
          <details class="details">
            <summary>Методи та підхід</summary>
            <label class="field">
              <div class="field-head">
                <span>Текст</span>
                <label class="inline-check">
                  <input v-model="profile.show_bio_approach" type="checkbox" />
                  Показувати
                </label>
              </div>
              <textarea v-model="profile.bio_approach" class="input" rows="4"></textarea>
            </label>
          </details>
          <details class="details">
            <summary>Запити, з якими я працюю</summary>
            <label class="field">
              <div class="field-head">
                <span>Текст</span>
                <label class="inline-check">
                  <input v-model="profile.show_bio_for_whom" type="checkbox" />
                  Показувати
                </label>
              </div>
              <textarea v-model="profile.bio_for_whom" class="input" rows="4"></textarea>
            </label>
          </details>
          <details class="details">
            <summary>Додаткова інформація</summary>
            <label class="field">
              <div class="field-head">
                <span>Текст</span>
                <label class="inline-check">
                  <input v-model="profile.show_bio_other" type="checkbox" />
                  Показувати
                </label>
              </div>
              <textarea v-model="profile.bio_other" class="input" rows="4"></textarea>
            </label>
          </details>
        </div>
      </section>

      <section class="panel">
        <div class="panel__header">
          <div>
            <div class="badge badge--soft">Крок 4</div>
            <h2 class="panel__title">Контакти</h2>
            <p class="panel__hint">Заповніть те, що готові показати. Видимість налаштовується нижче.</p>
          </div>
        </div>
        <div class="form" style="margin-top: 12px;">
          <label class="field">
            Email для зв'язку
            <input v-model="profile.contact_email" class="input" type="email" placeholder="hello@example.com" />
          </label>
          <label class="field">
            Телефон для зв'язку
            <input v-model="profile.contact_phone" class="input" type="text" placeholder="+380" />
          </label>
          <div class="field-row">
            <label class="field field--half">
              Messenger / Signal
              <input v-model="profile.messenger" class="input" type="text" placeholder="username або посилання" />
            </label>
            <label class="field field--half">
              Telegram
              <input v-model="profile.telegram" class="input" type="text" placeholder="@username або посилання" />
            </label>
          </div>
          <div class="field-row">
            <label class="field field--half">
              Viber
              <input v-model="profile.viber" class="input" type="text" placeholder="номер телефону" />
            </label>
            <label class="field field--half">
              WhatsApp
              <input v-model="profile.whatsapp" class="input" type="text" placeholder="номер телефону" />
            </label>
          </div>
        </div>
      </section>

      <section class="panel">
        <div class="panel__header">
          <div>
            <div class="badge badge--soft">Крок 5</div>
            <h2 class="panel__title">Видимість</h2>
            <p class="panel__hint">Вмикайте тільки те, що має бути видно клієнтам у публічному профілі.</p>
          </div>
        </div>
        <div class="form" style="margin-top: 12px;">
          <label class="check">
            <input v-model="profile.show_email" type="checkbox" />
            Показувати email
          </label>
          <label class="check">
            <input v-model="profile.show_phone" type="checkbox" />
            Показувати телефон
          </label>
          <label class="check">
            <input v-model="profile.show_messenger" type="checkbox" />
            Показувати Messenger / Signal
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
      </section>

      <section class="panel">
        <div class="panel__header">
          <div>
            <div class="badge badge--soft">Крок 6</div>
            <h2 class="panel__title">Фото та відео</h2>
            <p class="panel__hint">Завантажте обкладинку профілю та (за потреби) відео-прев'ю.</p>
          </div>
        </div>
        <div class="media-preview media-preview--side" style="margin-top: 12px;">
          <div
            class="media-card"
            role="button"
            tabindex="0"
            @click="triggerPhotoSelect"
            @keydown.enter.prevent="triggerPhotoSelect"
            @keydown.space.prevent="triggerPhotoSelect"
          >
            <div class="media-title">Фото прев'ю</div>
            <div class="media-frame">
              <img
                v-if="photoPreviewUrl || profile.photo_url"
                :src="photoPreviewUrl || profile.photo_url"
                alt="Фото профілю"
              />
              <div v-else class="media-empty">Фото ще не завантажено</div>
            </div>
            <div class="media-status" v-if="photoUploading">Завантаження фото...</div>
            <button
              class="btn btn--ghost btn--sm"
              type="button"
              @click.stop="triggerPhotoSelect"
            >
              Змінити фото
            </button>
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
            <div class="media-title">Відео прев'ю</div>
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
            <button
              class="btn btn--ghost btn--sm"
              type="button"
              @click.stop="triggerVideoSelect"
            >
              Змінити відео
            </button>
            <input
              ref="videoInput"
              class="input input--file is-hidden"
              type="file"
              accept="video/*"
              @change="onVideoSelected"
            />
          </div>
        </div>
      </section>

      <section class="panel preview">
        <div class="panel__header">
          <div>
            <div class="badge badge--soft">Крок 7</div>
            <h2 class="panel__title">Перевірте публічний вигляд</h2>
            <p class="panel__hint">Попередній перегляд вашої картки в каталозі.</p>
          </div>
          <div class="panel__meta">{{ profile.public_slug || 'slug ще не створено' }}</div>
        </div>
        <details class="details details--preview">
          <summary>Показати прев'ю</summary>
          <div class="preview-card">
            <div class="preview-content">
              <div class="preview-info">
                <div class="preview-header">
                  <div class="preview-title">
                    {{ profile.display_name || "Ваше публічне ім'я" }}
                  </div>
                  <div v-if="profile.show_price && profile.price" class="preview-price">
                    {{ priceDisplay }}
                  </div>
                </div>
                <div
                  v-if="specializationList.length || languageList.length || (profile.show_location && profile.location)"
                  class="preview-tags"
                >
                  <span v-for="(spec, index) in specializationList" :key="`${spec}-${index}`" class="preview-tag">
                    {{ spec }}
                  </span>
                    <span v-for="language in languageList" :key="language" class="preview-tag preview-tag--ghost">
                      {{ language }}
                    </span>
                    <span v-if="profile.show_location && profile.location" class="preview-tag preview-tag--muted">
                      {{ profile.location }}
                    </span>
                    <span class="preview-tag preview-tag--muted">
                      Досвід: {{ experienceLabel(profile.experience_years) }}
                    </span>
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
                <div v-if="hasAnyContact" class="preview-contact">
                  <div class="preview-label">Контакти</div>
                  <div class="contact">
                    <div v-if="profile.show_email && profile.contact_email">
                      Email: {{ profile.contact_email }}
                    </div>
                    <div v-if="profile.show_phone && profile.contact_phone">
                      Телефон: {{ profile.contact_phone }}
                    </div>
                    <div v-if="profile.show_messenger && profile.messenger">
                      Messenger / Signal: {{ profile.messenger }}
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
                  </div>
                </div>
              </div>
              <div class="preview-media">
                <div v-if="profile.show_photo && profile.photo_url" class="preview-media-card">
                  <img
                    class="preview-photo"
                    :src="profile.photo_url"
                    alt="Фото профілю"
                  />
                </div>
                <div v-if="profile.show_video && profile.video_url" class="preview-media-card">
                  <video
                    class="preview-video"
                    :src="profile.video_url"
                    controls
                    preload="metadata"
                  ></video>
                </div>
              </div>
            </div>
          </div>
        </details>
      </section>

      <div class="profile-footer">
        <button class="btn btn--primary" type="submit" :disabled="saving">
          {{ saving ? 'Збереження...' : 'Зберегти зміни' }}
        </button>
        <div v-if="success" class="muted">{{ success }}</div>
      </div>
    </form>

    <div v-if="cropperOpen" class="cropper-overlay">
      <div class="cropper-modal">
        <div class="cropper-header">
          <div class="cropper-title">Обрізка фото</div>
          <button class="btn btn--ghost btn--sm" type="button" @click="closeCropper">
            Скасувати
          </button>
        </div>
        <div class="cropper-body">
          <Cropper
            ref="cropperRef"
            class="cropper"
            :src="cropperSrc"
            :stencil-props="{ aspectRatio: 1 }"
            :auto-zoom="true"
          />
        </div>
        <div class="cropper-actions">
          <button class="btn btn--ghost" type="button" @click="closeCropper">
            Скасувати
          </button>
          <button class="btn" type="button" :disabled="cropSaving" @click="applyCrop">
            {{ cropSaving ? 'Збереження...' : 'Зберегти фото' }}
          </button>
        </div>
      </div>
    </div>

  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { Cropper } from 'vue-advanced-cropper'
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
const cropperOpen = ref(false)
const cropperSrc = ref('')
const cropperRef = ref<any>(null)
const cropSaving = ref(false)
const cropFileName = ref('profile-photo.jpg')
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

const experienceLabel = (value: number) => {
  if (value === 0) return 'до року'
  if (value === 1) return '1 рік'
  if (value >= 2 && value <= 4) return `${value} роки`
  return `${value} років`
}

const experienceOptions = Array.from({ length: 31 }, (_, value) => ({
  value,
  label: experienceLabel(value),
}))

const specializationOptions = [
  'Гештальт терапія',
  'Екзистенційна терапія',
  'Клієнт-центрована терапія',
  'Когнітивно-поведінкова терапія',
  'Терапія прийняття і відповідальності (ACT)',
  'Позитивна психотерапія',
  'Психоаналіз',
  'Психодрама',
  'Символдрама',
  'Схема-терапія',
  'Транзакційний аналіз',
  'Арттерапія',
  'Інше',
]

const languageInput = ref('')
const languageList = ref<string[]>([])
const specializationInput = ref('')
const specializationList = ref<string[]>([])
const showOtherSpecialization = ref(false)
const otherSpecializationInput = ref('')
const disallowedLanguages = new Set<string>()

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

function openCropper(file: File) {
  if (cropperSrc.value) {
    URL.revokeObjectURL(cropperSrc.value)
  }
  cropperSrc.value = URL.createObjectURL(file)
  cropFileName.value = file.name || 'profile-photo.jpg'
  cropperOpen.value = true
}

function closeCropper() {
  cropperOpen.value = false
  if (cropperSrc.value) {
    URL.revokeObjectURL(cropperSrc.value)
  }
  cropperSrc.value = ''
}

function getCroppedFile(): Promise<File> {
  const result = cropperRef.value?.getResult?.()
  const canvas = result?.canvas
  if (!canvas) {
    return Promise.reject(new Error('Cropper not ready'))
  }
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob: Blob | null) => {
        if (!blob) {
          reject(new Error('Не вдалося обрізати фото'))
          return
        }
        resolve(
          new File([blob], cropFileName.value || 'profile-photo.jpg', {
            type: blob.type || 'image/jpeg',
          })
        )
      },
      'image/jpeg',
      0.92
    )
  })
}

async function applyCrop() {
  cropSaving.value = true
  photoUploading.value = true
  error.value = ''
  try {
    const file = await getCroppedFile()
    setPreviewUrl(photoPreviewUrl, file)
    const data = await uploadProfilePhoto(file)
    Object.assign(profile, normalizeProfile(data))
    setPreviewUrl(photoPreviewUrl, null)
    success.value = 'Фото завантажено.'
    closeCropper()
  } catch (err) {
    error.value = getApiErrorMessage(err, 'Не вдалося завантажити фото')
  } finally {
    cropSaving.value = false
    photoUploading.value = false
  }
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
      experience_years: profile.experience_years,
      specializations: specializationList.value,
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
  experience_years: 0,
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
const hasAnyContact = computed(
  () =>
    (profile.show_email && Boolean(profile.contact_email)) ||
    (profile.show_phone && Boolean(profile.contact_phone)) ||
    (profile.show_messenger && Boolean(profile.messenger)) ||
    (profile.show_telegram && Boolean(profile.telegram)) ||
    (profile.show_viber && Boolean(profile.viber)) ||
    (profile.show_whatsapp && Boolean(profile.whatsapp))
)

async function loadProfile() {
  loading.value = true
  error.value = ''
  try {
    const data = await fetchTherapistProfile()
    Object.assign(profile, normalizeProfile(data))
    languageList.value = sanitizeLanguages(toList(profile.languages))
    specializationList.value = toList(profile.specializations)
    specializationInput.value = ''
    showOtherSpecialization.value = false
    otherSpecializationInput.value = ''
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
    if (showOtherSpecialization.value && otherSpecializationInput.value.trim()) {
      addOtherSpecialization()
    }
    const data = await updateTherapistProfile(buildProfilePayload())
    Object.assign(profile, normalizeProfile(data))
    languageList.value = sanitizeLanguages(toList(profile.languages))
    specializationList.value = toList(profile.specializations)
    specializationInput.value = ''
    showOtherSpecialization.value = false
    otherSpecializationInput.value = ''
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
  error.value = ''
  openCropper(file)
  input.value = ''
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
    experience_years: typeof data.experience_years === 'number' ? data.experience_years : 0,
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

function removeLanguage(language: string, index: number) {
  if (index >= 0 && index < languageList.value.length && languageList.value[index] === language) {
    languageList.value.splice(index, 1)
    return
  }
  const fallbackIndex = languageList.value.findIndex((item) => item === language)
  if (fallbackIndex >= 0) {
    languageList.value.splice(fallbackIndex, 1)
  }
}

function onLanguageKeydown(event: KeyboardEvent) {
  if (event.key === ',') {
    event.preventDefault()
    addLanguage()
  }
}

function onLanguageInput() {
  const value = languageInput.value.trim()
  if (!value) return
  if (languageOptions.includes(value)) {
    addLanguage()
  }
}

function addSpecialization() {
  const value = specializationInput.value.trim()
  if (!value) return
  if (value.toLowerCase() === 'інше') {
    showOtherSpecialization.value = true
    specializationInput.value = ''
    otherSpecializationInput.value = ''
    return
  }
  if (!specializationList.value.includes(value)) {
    specializationList.value.push(value)
  }
  specializationInput.value = ''
}

function addOtherSpecialization() {
  const value = otherSpecializationInput.value.trim()
  if (!value) return
  if (!specializationList.value.includes(value)) {
    specializationList.value.push(value)
  }
  otherSpecializationInput.value = ''
  showOtherSpecialization.value = false
}

function removeSpecialization(index: number) {
  if (index < 0 || index >= specializationList.value.length) return
  specializationList.value.splice(index, 1)
}

function onSpecializationKeydown(event: KeyboardEvent) {
  if (event.key === ',') {
    event.preventDefault()
    addSpecialization()
  }
}

function onSpecializationInput() {
  const value = specializationInput.value.trim()
  if (!value) return
  if (value.toLowerCase() === 'інше') {
    addSpecialization()
    return
  }
  if (specializationOptions.includes(value)) {
    addSpecialization()
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

.panel__hint {
  margin: 6px 0 0;
  font-size: 13px;
  color: var(--muted);
  max-width: 640px;
}

.panel__meta {
  font-size: 12px;
  color: var(--muted);
}

.badge--soft {
  background: rgba(8, 113, 201, 0.12);
}

.panel--highlight {
  background: linear-gradient(135deg, #ffffff 0%, #f1f7ff 100%);
}

.details-stack {
  display: grid;
  gap: 10px;
}

.details {
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 10px 12px;
  background: #fdfaf6;
}

.details summary {
  cursor: pointer;
  font-weight: 600;
}

.details[open] summary {
  margin-bottom: 10px;
}

.details--preview {
  background: #fff;
}

.preview {
  background: linear-gradient(135deg, #ffffff 0%, #f1f7ff 100%);
}

.preview-card {
  margin-top: 12px;
  display: grid;
  gap: 16px;
  border-radius: 18px;
  padding: 18px 20px;
  background: #ffffff;
  border: 1px solid var(--line);
  box-shadow: 0 18px 40px rgba(15, 31, 38, 0.08);
}

.preview-content {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 320px);
  gap: 20px;
  align-items: start;
}

.preview-info {
  display: grid;
  gap: 14px;
}

.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.preview-title {
  font-family: var(--font-display);
  font-size: 24px;
  font-weight: 600;
  line-height: 1.2;
}

.preview-price {
  padding: 6px 14px;
  border-radius: 999px;
  border: 1px solid rgba(20, 92, 140, 0.2);
  background: rgba(20, 92, 140, 0.12);
  color: #103247;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
}

.preview-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.preview-tag {
  padding: 6px 10px;
  border-radius: 999px;
  background: #f3f6fb;
  border: 1px solid #e1e8f0;
  font-size: 12px;
  color: #405161;
}

.preview-tag--ghost {
  background: #f7f4ef;
  border-color: #ebe1d4;
  color: #6a5d4f;
}

.preview-tag--muted {
  background: #eef2f6;
  border-color: #dde3ea;
  color: #5b6774;
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
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid #e9eef4;
  background: #f9fbff;
}

.preview-label {
  font-size: 11px;
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

.preview-contact {
  display: grid;
  gap: 8px;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid #efe7dd;
  background: #fdfaf6;
}

.preview-media {
  display: grid;
  gap: 12px;
}

.preview-media-card {
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 18px;
  border: 1px solid var(--line);
  background: #0f2b3a;
  overflow: hidden;
  display: block;
  box-shadow: 0 16px 36px rgba(15, 31, 38, 0.16);
}

.preview-photo {
  width: 100%;
  max-width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.preview-video {
  width: 100%;
  max-width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
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
  grid-template-columns: repeat(2, minmax(0, 240px));
  align-items: stretch;
  justify-content: start;
}

.media-preview--side .media-card {
  width: 100%;
}

.media-card {
  border: 1px dashed var(--line);
  border-radius: 16px;
  padding: 10px;
  background: #fdfaf6;
  display: grid;
  gap: 10px;
  grid-template-rows: auto 1fr auto;
  min-height: 200px;
}

.media-title {
  font-size: 13px;
  color: var(--muted);
}

.media-frame {
  width: 100%;
  aspect-ratio: 1 / 1;
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

.cropper-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 27, 43, 0.55);
  display: grid;
  place-items: center;
  padding: 24px;
  z-index: 80;
}

.cropper-modal {
  width: min(720px, 92vw);
  background: #fff;
  border-radius: 18px;
  box-shadow: var(--shadow);
  display: grid;
  gap: 12px;
  padding: 16px;
  max-height: min(90vh, 820px);
}

.cropper-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.cropper-title {
  font-weight: 600;
}

.cropper-body {
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 12px;
  overflow: hidden;
  background: #f3f6f7;
  max-height: 60vh;
}

.cropper {
  width: 100%;
  height: 100%;
}

.cropper-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
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
