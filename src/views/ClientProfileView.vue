<template>
  <section class="client-profile">
    <header class="profile-hero">
      <div>
        <div class="badge">Профіль клієнта</div>
        <h1 class="title profile-title">Мій щоденник</h1>
        <p class="muted profile-subtitle">
          Додайте ім'я, контакти та фото, щоб спеціалісту було зручніше з вами працювати.
        </p>
        <div v-if="profile.client_code" class="muted profile-code">
          {{ clientCodeLabel }}: <span class="client-code">{{ profile.client_code }}</span>
        </div>
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

    <section v-if="!loading" class="profile-card account-data-card">
      <div class="account-data-card__header">
        <div>
          <h2 class="account-data-card__title">Акаунт і дані</h2>
          <p class="muted account-data-card__copy">
            Тут можна видалити акаунт і пов’язані персональні дані з Pro Consult.
          </p>
        </div>
        <span
          v-if="dataDeletionRequest"
          class="account-data-status"
          :class="dataDeletionStatusClass(dataDeletionRequest.status)"
        >
          {{ dataDeletionStatusLabel(dataDeletionRequest.status) }}
        </span>
      </div>

      <div v-if="dataDeletionLoading" class="muted">Завантаження...</div>
      <div v-else class="account-data-card__body">
        <div v-if="dataDeletionError" class="form-error">{{ dataDeletionError }}</div>
        <ul v-if="dataDeletionBlockerLabels.length" class="account-data-blockers">
          <li v-for="label in dataDeletionBlockerLabels" :key="label">{{ label }}</li>
        </ul>

        <div v-if="dataDeletionRequest" class="account-data-request">
          <p class="account-data-request__meta">
            Створено:
            <strong>{{ formatDateTime(dataDeletionRequest.submitted_at) }}</strong>
          </p>
        </div>

        <div class="account-data-actions">
          <button
            v-if="canSubmitDataDeletionRequest"
            class="btn btn--danger"
            type="button"
            :disabled="dataDeletionSubmitting"
            @click="openDataDeletionConfirm"
          >
            {{ dataDeletionSubmitting ? 'Видаляємо...' : 'Видалити акаунт' }}
          </button>

          <button
            v-if="canCancelDataDeletionRequest"
            class="btn btn--ghost"
            type="button"
            :disabled="dataDeletionCancelling"
            @click="onCancelDataDeletionRequest"
          >
            {{ dataDeletionCancelling ? 'Скасовуємо...' : 'Скасувати видалення' }}
          </button>
        </div>
      </div>
    </section>

    <ConfirmModal
      :open="dataDeletionConfirmOpen"
      title="Видалити акаунт?"
      message="Акаунт і пов’язані персональні дані буде видалено з Pro Consult. Після цього доступ до акаунта буде закрито."
      confirm-text="Видалити акаунт"
      cancel-text="Залишити акаунт"
      tone="danger"
      @confirm="confirmCreateDataDeletionRequest"
      @cancel="closeDataDeletionConfirm"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import ConfirmModal from '../components/ConfirmModal.vue'
import {
  type AccountDeletionBlockedPayload,
  cancelDataDeletionRequest,
  createDataDeletionRequest,
  fetchClientProfile,
  fetchCurrentDataDeletionRequest,
  updateClientProfile,
  uploadClientPhoto,
  type ClientProfile,
  type DataDeletionRequest,
} from '../lib/api'
import { getApiErrorMessage } from '../lib/errors'
import { useToast } from '../composables/useToast'
import { useAuthStore } from '../stores/auth'

type DataDeletionRequestStatus =
  | 'SUBMITTED'
  | 'IN_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'EXECUTED'

const DATA_DELETION_STATUS_LABELS: Record<DataDeletionRequestStatus, string> = {
  SUBMITTED: 'Видалення акаунта розпочато',
  IN_REVIEW: 'Видалення акаунта в обробці',
  APPROVED: 'Видалення акаунта в обробці',
  REJECTED: 'Не вдалося завершити видалення акаунта',
  CANCELLED: 'Видалення акаунта скасовано',
  EXECUTED: 'Акаунт видалено',
}

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
const dataDeletionLoading = ref(false)
const dataDeletionSubmitting = ref(false)
const dataDeletionCancelling = ref(false)
const dataDeletionError = ref('')
const dataDeletionBlockerLabels = ref<string[]>([])
const dataDeletionRequest = ref<DataDeletionRequest | null>(null)
const dataDeletionConfirmOpen = ref(false)
const router = useRouter()
const toast = useToast()
const auth = useAuthStore()
const clientCodeLabel = '\u041a\u043e\u0434 \u043a\u043b\u0456\u0454\u043d\u0442\u0430'
const canSubmitDataDeletionRequest = computed(() =>
  !dataDeletionRequest.value ||
  ['REJECTED', 'CANCELLED', 'EXECUTED'].includes(dataDeletionRequest.value.status)
)
const canCancelDataDeletionRequest = computed(() =>
  Boolean(
    dataDeletionRequest.value &&
      ['SUBMITTED', 'IN_REVIEW'].includes(dataDeletionRequest.value.status)
  )
)

function triggerPhotoSelect() {
  photoInput.value?.click()
}

function dataDeletionStatusLabel(status: string) {
  return DATA_DELETION_STATUS_LABELS[status as DataDeletionRequestStatus] || status
}

function dataDeletionStatusClass(status: string) {
  if (status === 'REJECTED') return 'account-data-status--rejected'
  if (status === 'CANCELLED') return 'account-data-status--muted'
  if (status === 'EXECUTED') return 'account-data-status--ok'
  return 'account-data-status--pending'
}

function formatDateTime(value: string) {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return new Intl.DateTimeFormat('uk-UA', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsed)
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

async function loadDataDeletionRequest() {
  dataDeletionLoading.value = true
  dataDeletionError.value = ''
  dataDeletionBlockerLabels.value = []
  try {
    dataDeletionRequest.value = await fetchCurrentDataDeletionRequest()
  } catch (err) {
    dataDeletionError.value = getApiErrorMessage(
      err,
      'Не вдалося завантажити стан видалення акаунта.'
    )
  } finally {
    dataDeletionLoading.value = false
  }
}

function openDataDeletionConfirm() {
  dataDeletionError.value = ''
  dataDeletionBlockerLabels.value = []
  dataDeletionConfirmOpen.value = true
}

function closeDataDeletionConfirm() {
  dataDeletionConfirmOpen.value = false
}

async function confirmCreateDataDeletionRequest() {
  dataDeletionConfirmOpen.value = false
  dataDeletionSubmitting.value = true
  dataDeletionError.value = ''
  dataDeletionBlockerLabels.value = []
  try {
    const request = await createDataDeletionRequest()
    if (request.status === 'EXECUTED') {
      toast.success('Акаунт видалено.')
      auth.logout()
      await router.push('/login')
      return
    }
    dataDeletionRequest.value = request
    toast.success('Видалення акаунта розпочато.')
  } catch (err) {
    const payload = (err as { response?: { data?: AccountDeletionBlockedPayload } })?.response?.data
    if (payload?.code === 'ACCOUNT_DELETION_BLOCKED') {
      dataDeletionError.value =
        'Зараз видалення акаунта не завершено. Завершіть активні дії в акаунті та спробуйте ще раз.'
      dataDeletionBlockerLabels.value = Array.isArray(payload.blockers?.items)
        ? payload.blockers.items
            .map((item) => item?.label || '')
            .filter((label): label is string => Boolean(label))
        : []
    } else {
      dataDeletionError.value = getApiErrorMessage(
        err,
        'Не вдалося розпочати видалення акаунта.'
      )
    }
  } finally {
    dataDeletionSubmitting.value = false
  }
}

async function onCancelDataDeletionRequest() {
  if (!dataDeletionRequest.value) return
  dataDeletionCancelling.value = true
  dataDeletionError.value = ''
  dataDeletionBlockerLabels.value = []
  try {
    dataDeletionRequest.value = await cancelDataDeletionRequest(dataDeletionRequest.value.id)
    toast.success('Видалення акаунта скасовано.')
  } catch (err) {
    dataDeletionError.value = getApiErrorMessage(err, 'Не вдалося скасувати видалення акаунта.')
  } finally {
    dataDeletionCancelling.value = false
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

onMounted(() => {
  void loadProfile()
  void loadDataDeletionRequest()
})
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


.profile-code {
  margin-top: 8px;
  font-size: 13px;
}

.client-code {
  font-weight: 600;
  letter-spacing: 0.06em;
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

.account-data-card {
  gap: 14px;
}

.account-data-card__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.account-data-card__title {
  margin: 0 0 6px;
  font-size: 24px;
}

.account-data-card__copy {
  margin: 0;
  max-width: 720px;
  line-height: 1.55;
}

.account-data-card__body {
  display: grid;
  gap: 12px;
}

.account-data-request {
  display: grid;
  gap: 6px;
  padding: 12px 14px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: rgba(8, 113, 201, 0.06);
}

.account-data-request__meta,
.account-data-request__reason {
  margin: 0;
}

.account-data-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.account-data-blockers {
  margin: 0;
  padding-left: 18px;
  color: var(--muted);
  display: grid;
  gap: 6px;
}

.account-data-status {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 32px;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.35;
}

.account-data-status--pending {
  background: rgba(8, 113, 201, 0.1);
  color: #0c4a6e;
  border: 1px solid rgba(8, 113, 201, 0.16);
}

.account-data-status--ok {
  background: rgba(30, 106, 59, 0.12);
  color: #1e6a3b;
  border: 1px solid rgba(30, 106, 59, 0.16);
}

.account-data-status--rejected,
.account-data-status--muted {
  background: #f3f4f6;
  color: var(--muted);
  border: 1px solid var(--line);
}

.account-data-modal__field {
  margin-top: 8px;
}

.input--file.is-hidden {
  display: none;
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

  .account-data-card__header {
    flex-direction: column;
  }
}
</style>
