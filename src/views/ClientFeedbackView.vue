<template>
  <section class="feedback">
    <header class="feedback__hero">
      <div>
        <div class="badge">{{ heroBadgeLabel }}</div>
        <h1 class="title feedback__title">{{ heroTitle }}</h1>
        <p class="muted feedback__subtitle">
          {{ heroSubtitle }}
        </p>
      </div>
      <div class="feedback__actions">
        <RouterLink class="btn btn--ghost" to="/policy/feedback">Політика відгуків</RouterLink>
        <RouterLink class="btn btn--ghost" to="/specialists">До каталогу</RouterLink>
      </div>
    </header>

    <div v-if="loading" class="muted">Завантаження...</div>
    <div v-else-if="error" class="form-error">{{ error }}</div>

    <section v-else class="panel">
      <template v-if="isSpecialist">
        <div v-if="!isOwner" class="form-error">
          Перегляд відгуків доступний лише для власного профілю.
        </div>
        <template v-else>
          <div class="notice">
            Відгуки відображаються лише спеціалісту. Вони анонімні й містять лише текст.
          </div>
          <AnonymousReviewList
            :reviews="reviews"
            :loading="reviewsLoading"
            :error="reviewsError"
            :show-count="true"
            empty-title="Поки що немає відгуків"
            empty-description="Коли клієнти залишать відгук після співпраці, він з’явиться тут."
            empty-action-text="Відкрити профіль"
            :empty-action-to="profileLink"
          />
        </template>
      </template>

      <template v-else>
        <div class="notice">
          Ваш відгук анонімний: спеціаліст бачить лише текст, без імені та профілю автора. Відгук
          можна залишати лише спеціалістам, з якими ви працюєте або працювали. Це допомагає
          покращити роботу спеціаліста.
        </div>
        <div class="notice notice--alt">
          Ми не публікуємо відгуки, щоб уникнути оцінювання чи порівнянь між спеціалістами та
          зберегти приватність клієнтів. Якщо хочете подякувати спеціалісту чи порадити його іншим
          людям — поділіться його профілем у соцмережах.
        </div>
        <div v-if="!isAuthenticated" class="hint">
          Щоб залишити відгук, увійдіть у свій кабінет клієнта.
          <RouterLink class="btn btn--ghost" :to="loginLink">Увійти</RouterLink>
        </div>

        <div v-if="submitSuccess" class="success">{{ submitSuccess }}</div>
        <div v-if="submitError" class="form-error">{{ submitError }}</div>

        <label class="field">
          <span>Ваш відгук</span>
          <textarea
            v-model="reviewText"
            rows="6"
            placeholder="Опишіть свій досвід співпраці."
            :disabled="!isAuthenticated || submitLoading || reviewLocked"
          ></textarea>
        </label>

        <div class="field__hint">Текст бачить лише спеціаліст. Ім’я не передається.</div>
        <div v-if="reviewLocked" class="hint">
          Ви вже залишили відгук для цього спеціаліста.
        </div>

        <div class="actions">
          <button
            class="btn"
            type="button"
            :disabled="submitLoading || !isAuthenticated || reviewLocked"
            @click="submitReview"
          >
            {{ submitLoading ? 'Надсилаємо...' : 'Надіслати відгук' }}
          </button>
          <RouterLink v-if="profile?.public_slug" class="btn btn--ghost" :to="profileLink">
            Повернутись до профілю
          </RouterLink>
        </div>
      </template>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { createPracticeReview, fetchPublicSpecialistProfile, type PublicSpecialistProfile } from '../lib/api'
import { getApiErrorMessage } from '../lib/errors'
import { apiGet } from '../lib/api'
import { useAuthStore } from '../stores/auth'
import AnonymousReviewList from '../components/AnonymousReviewList.vue'

const route = useRoute()
const auth = useAuthStore()
const profile = ref<PublicSpecialistProfile | null>(null)
const loading = ref(false)
const error = ref('')
const reviewText = ref('')
const submitLoading = ref(false)
const submitError = ref('')
const submitSuccess = ref('')
const reviewLocked = ref(false)
const reviews = ref<Array<{ id: number; review_text: string; created_at: string }>>([])
const reviewsLoading = ref(false)
const reviewsError = ref('')

const slug = computed(() => String(route.params.slug || '').trim())
const publicName = computed(() => profile.value?.display_name || 'спеціаліста')
const profileLink = computed(() => `/specialist/${profile.value?.public_slug || slug.value}`)
const loginLink = computed(() => ({
  name: 'login',
  query: { redirect: `/specialist/${profile.value?.public_slug || slug.value}/feedback` },
}))
const roles = computed(() => auth.me?.user.roles ?? auth.user?.roles ?? [])
const isAuthenticated = computed(() => Boolean(auth.accessToken))
const isSpecialist = computed(() => roles.value.includes('SPECIALIST') || roles.value.includes('THERAPIST'))
const isOwner = computed(() => Boolean(profile.value?.therapist_id && auth.user?.id === profile.value?.therapist_id))
const isSpecialistOwnerView = computed(() => isSpecialist.value && isOwner.value)

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

const publicNameShort = computed(() => formatPublicName(profile.value?.display_name) || publicName.value)
const heroBadgeLabel = computed(() => (isSpecialistOwnerView.value ? 'Відгуки клієнтів' : 'Відгук клієнта'))
const heroTitle = computed(() => (isSpecialistOwnerView.value ? 'Огляд відгуків' : 'Залишити відгук'))
const heroSubtitle = computed(() => {
  if (!profile.value) return 'Завантаження профілю спеціаліста...'
  if (isSpecialistOwnerView.value) {
    return 'Приватні анонімні відгуки від клієнтів. Тут немає публічного рейтингу.'
  }
  return `Для спеціаліста ${publicName.value}`
})

async function loadProfile() {
  if (!slug.value) {
    error.value = 'Потрібен slug профілю.'
    return
  }
  loading.value = true
  error.value = ''
  try {
    profile.value = await fetchPublicSpecialistProfile(slug.value)
  } catch (err: any) {
    error.value = getApiErrorMessage(err, 'Профіль спеціаліста не знайдено.')
  } finally {
    loading.value = false
  }
}

async function loadReviews() {
  if (!isAuthenticated.value || !isSpecialist.value || !isOwner.value) return
  reviewsLoading.value = true
  reviewsError.value = ''
  try {
    const resp = await apiGet<Array<{ id: number; review_text: string; created_at: string }>>(
      '/cabinet/reviews/'
    )
    reviews.value = resp || []
  } catch (err: any) {
    reviewsError.value = getApiErrorMessage(err, 'Не вдалося завантажити відгуки.')
  } finally {
    reviewsLoading.value = false
  }
}

async function submitReview() {
  submitError.value = ''
  submitSuccess.value = ''
  if (reviewLocked.value) {
    submitError.value = 'Ви вже залишили відгук для цього спеціаліста.'
    return
  }
  if (!isAuthenticated.value) {
    submitError.value = 'Увійдіть, щоб залишити відгук.'
    return
  }
  const text = reviewText.value.trim()
  if (!text) {
    submitError.value = 'Напишіть короткий відгук.'
    return
  }
  if (!profile.value?.therapist_id) {
    submitError.value = 'Не вдалося визначити спеціаліста.'
    return
  }
  submitLoading.value = true
  try {
    await createPracticeReview(profile.value.therapist_id, text)
    submitSuccess.value = `Дякуємо! Ваш відгук для ${publicNameShort.value} збережено.`
    reviewText.value = ''
  } catch (err: any) {
    const status = err?.response?.status
    const backendDetail = String(err?.response?.data?.detail || '')
    const duplicateReview =
      backendDetail === 'You already left a review for this specialist.'
    if (status === 403) {
      submitError.value =
        'Відгук можна залишити лише спеціалісту, з яким ви працюєте або працювали.'
    } else if (duplicateReview) {
      reviewLocked.value = true
      submitError.value = 'Ви вже залишили відгук для цього спеціаліста.'
    } else {
      submitError.value = getApiErrorMessage(err, 'Не вдалося надіслати відгук.')
    }
  } finally {
    submitLoading.value = false
  }
}

onMounted(async () => {
  await loadProfile()
  await loadReviews()
})
</script>

<style scoped>
.feedback {
  display: grid;
  gap: 18px;
}

.feedback__hero {
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

.feedback__title {
  font-size: 32px;
}

.feedback__subtitle {
  max-width: 520px;
}

.feedback__actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.panel {
  border: 1px solid var(--line);
  border-radius: 18px;
  padding: 18px;
  background: #fff;
  display: grid;
  gap: 14px;
}

.notice {
  padding: 12px 14px;
  border-radius: 12px;
  background: rgba(8, 113, 201, 0.08);
  border: 1px solid var(--line);
  color: var(--deep);
  line-height: 1.5;
}

.notice--alt {
  background: rgba(7, 47, 71, 0.04);
}

.field {
  display: grid;
  gap: 6px;
  font-size: 13px;
  color: var(--muted);
}

.field textarea {
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 10px 12px;
  font-family: inherit;
  font-size: 14px;
  color: var(--ink);
  background: #fff;
  min-height: 140px;
  resize: vertical;
}

.field__hint {
  font-size: 12px;
  color: var(--muted);
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

.actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
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

@media (max-width: 860px) {
  .feedback__hero {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
