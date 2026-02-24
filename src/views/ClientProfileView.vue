<template>
  <section class="client-profile">
    <header class="profile-hero">
      <div>
        <div class="badge">Профіль клієнта</div>
        <h1 class="title profile-title">Мій щоденник</h1>
        <p class="muted profile-subtitle">
          Додайте ім'я, контакти та фото, щоб спеціалісту було зручніше з вами працювати.
        </p>
      </div>
      <RouterLink class="btn btn--ghost" to="/client">Назад</RouterLink>
    </header>

    <div v-if="error" class="form-error">{{ error }}</div>
    <div v-if="loading" class="muted" style="margin-top: 12px;">Завантаження...</div>

    <section v-else class="profile-card">
      <div class="profile-media">
        <div class="profile-photo">
          <img v-if="photoPreview || profile.photo_url" :src="photoPreview || profile.photo_url" alt="Фото клієнта" />
          <div v-else class="profile-photo__placeholder">Фото</div>
        </div>
        <div class="profile-media__actions">
          <div v-if="photoUploading" class="muted">Завантаження фото...</div>
          <button class="btn btn--ghost btn--sm" type="button" @click="triggerPhotoSelect">
            Додати фото
          </button>
          <input
            ref="photoInput"
            class="input input--file is-hidden"
            type="file"
            accept="image/*"
            @change="onPhotoSelected"
          />
        </div>
      </div>

      <form class="profile-form" @submit.prevent="onSave">
        <label class="field">
          <span>Ім'я</span>
          <input v-model="profile.display_name" class="input" type="text" placeholder="Ваше ім'я" />
        </label>
        <label class="field">
          <span>Контактний email</span>
          <input v-model="profile.contact_email" class="input" type="email" placeholder="name@example.com" />
        </label>
        <label class="field">
          <span>Контактний телефон</span>
          <input v-model="profile.contact_phone" class="input" type="tel" placeholder="+380..." />
        </label>
        <div class="profile-actions">
          <button class="btn" type="submit" :disabled="saving">
            {{ saving ? 'Збереження...' : 'Зберегти' }}
          </button>
        </div>
      </form>
    </section>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { fetchClientProfile, updateClientProfile, uploadClientPhoto, type ClientProfile } from '../lib/api'
import { getApiErrorMessage } from '../lib/errors'
import { useToast } from '../composables/useToast'

const profile = ref<ClientProfile>({
  id: 0,
  display_name: '',
  contact_email: '',
  contact_phone: '',
  photo_url: '',
  created_at: '',
  updated_at: '',
})
const loading = ref(true)
const saving = ref(false)
const error = ref('')
const photoUploading = ref(false)
const photoPreview = ref('')
const photoInput = ref<HTMLInputElement | null>(null)
const router = useRouter()
const toast = useToast()

function triggerPhotoSelect() {
  photoInput.value?.click()
}

function setPreview(file: File | null) {
  if (!file) {
    photoPreview.value = ''
    return
  }
  const reader = new FileReader()
  reader.onload = (evt) => {
    photoPreview.value = String(evt.target?.result || '')
  }
  reader.readAsDataURL(file)
}

async function onPhotoSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  photoUploading.value = true
  error.value = ''
  try {
    setPreview(file)
    const data = await uploadClientPhoto(file)
    profile.value = data
    photoPreview.value = ''
  } catch (err) {
    error.value = getApiErrorMessage(err, 'Не вдалося завантажити фото')
  } finally {
    photoUploading.value = false
    if (input) input.value = ''
  }
}

async function loadProfile() {
  loading.value = true
  error.value = ''
  try {
    const data = await fetchClientProfile()
    profile.value = data
  } catch (err) {
    error.value = getApiErrorMessage(err, 'Не вдалося завантажити профіль')
  } finally {
    loading.value = false
  }
}

async function onSave() {
  saving.value = true
  error.value = ''
  try {
    profile.value = await updateClientProfile(profile.value)
    toast.success('Профіль збережено.')
    await router.push('/client')
  } catch (err) {
    error.value = getApiErrorMessage(err, 'Не вдалося зберегти профіль')
  } finally {
    saving.value = false
  }
}

onMounted(loadProfile)
</script>

<style scoped>
.client-profile {
  display: grid;
  gap: 18px;
}

.profile-hero {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  background: linear-gradient(135deg, rgba(8, 113, 201, 0.16), rgba(7, 47, 71, 0.06));
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 22px 24px;
  box-shadow: var(--shadow);
}

.profile-title {
  font-size: 32px;
}

.profile-subtitle {
  max-width: 520px;
}

.profile-card {
  border: 1px solid var(--line);
  border-radius: 18px;
  padding: 20px;
  background: #fff;
  display: grid;
  gap: 18px;
}

.profile-media {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.profile-photo {
  width: 120px;
  height: 120px;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid var(--line);
  background: #f1f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
}

.profile-photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-photo__placeholder {
  color: var(--muted);
}

.profile-form {
  display: grid;
  gap: 12px;
  max-width: 520px;
}

.profile-actions {
  margin-top: 8px;
}

.form-error {
  color: #b3261e;
  background: #fdecea;
  border: 1px solid #f5c2c0;
  border-radius: 10px;
  padding: 8px 10px;
}

@media (max-width: 860px) {
  .profile-hero {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
