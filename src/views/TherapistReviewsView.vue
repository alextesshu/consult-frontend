<template>
  <section class="reviews">
    <header class="reviews__hero">
      <div>
        <h1 class="title reviews__title">Відгуки</h1>
        <p class="muted reviews__subtitle">
          Тут зібрані приватні відгуки від клієнтів. Вони доступні тільки у вашому кабінеті.
        </p>
      </div>
      <RouterLink class="btn btn--ghost" to="/cabinet">Назад до кабінету</RouterLink>
    </header>

    <section class="reviews__filters" aria-label="Фільтр відгуків">
      <button
        v-for="item in filterOptions"
        :key="item.key"
        class="reviews__filter-btn"
        :class="{ 'is-active': activeFilter === item.key }"
        type="button"
        @click="applyFilter(item.key)"
      >
        {{ item.label }}
      </button>
    </section>

    <div v-if="loading" class="muted">Завантажуємо відгуки…</div>
    <div v-else-if="error" class="empty-state">
      <p>{{ error }}</p>
      <button class="btn btn--ghost btn--sm" type="button" @click="loadReviews">Спробувати ще раз</button>
    </div>
    <div v-else-if="reviews.length === 0" class="empty-state">
      <p v-if="activeFilter === 'ALL'">Відгуків поки немає.</p>
      <p v-else>Немає відгуків із цим статусом.</p>
      <p v-if="activeFilter === 'ALL'" class="muted">
        Коли клієнти залишать відгуки після сесій, вони з’являться тут.
      </p>
    </div>
    <div v-else class="reviews__list">
      <article v-for="review in reviews" :key="review.review_uid" class="review-card">
        <div class="review-card__head">
          <div class="review-card__author">Відгук від: {{ review.author_display_name }}</div>
          <span class="review-card__status" :class="statusClass(review.status)">{{ statusLabel(review.status) }}</span>
        </div>
        <p class="review-card__text">{{ review.text }}</p>
        <div class="review-card__permission">{{ permissionLabel(review) }}</div>
        <div class="review-card__meta">
          <span>{{ formatDate(review.created_at) }}</span>
          <div class="review-card__actions">
            <button
              v-if="canCreateShareCard(review)"
              class="btn btn--sm"
              type="button"
              @click="openShareCard(review)"
            >
              Створити картку
            </button>
            <RouterLink
              v-if="review.session_id"
              class="btn btn--ghost btn--sm"
              :to="`/cabinet/sessions/${review.session_id}`"
            >
              Перейти до сесії
            </RouterLink>
            <button
              v-for="action in triageActions(review.status)"
              :key="`${review.review_uid}:${action.next}`"
              class="btn btn--ghost btn--sm"
              type="button"
              :disabled="Boolean(statusActionLoadingByReviewUid[review.review_uid])"
              @click="applyReviewStatus(review, action.next)"
            >
              {{ action.label }}
            </button>
          </div>
        </div>
        <div v-if="statusActionErrorByReviewUid[review.review_uid]" class="form-error">
          {{ statusActionErrorByReviewUid[review.review_uid] }}
        </div>
      </article>
    </div>

    <ReviewShareCardModal
      v-if="selectedReview"
      :open="Boolean(selectedReview)"
      :review-text="selectedReview.text"
      :review-uid="selectedReview.review_uid"
      :specialist-display-name="specialistDisplayName"
      :profile-url="specialistProfileUrl"
      @close="closeShareCard"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import {
  fetchCabinetReviews,
  fetchSpecialistProfile,
  updateCabinetReviewStatus,
  type CabinetReview,
  type CabinetReviewStatus,
} from '../lib/api'
import { formatUkDateTimeCompact } from '../lib/dateTime'
import ReviewShareCardModal from '../components/reviews/ReviewShareCardModal.vue'

type FilterKey = 'ALL' | CabinetReviewStatus

const REVIEW_STATUS_LABELS: Record<CabinetReviewStatus, string> = {
  PENDING: 'Новий',
  APPROVED: 'Переглянуто',
  REJECTED: 'Спам / приховано',
}

const filterOptions: Array<{ key: FilterKey; label: string }> = [
  { key: 'ALL', label: 'Усі' },
  { key: 'PENDING', label: 'Нові' },
  { key: 'APPROVED', label: 'Переглянуті' },
  { key: 'REJECTED', label: 'Спам / приховані' },
]

const reviews = ref<CabinetReview[]>([])
const loading = ref(false)
const error = ref('')
const activeFilter = ref<FilterKey>('ALL')
const selectedReview = ref<CabinetReview | null>(null)
const statusActionLoadingByReviewUid = ref<Record<string, boolean>>({})
const statusActionErrorByReviewUid = ref<Record<string, string>>({})
const specialistProfileDisplayName = ref('')
const auth = useAuthStore()

const specialistDisplayName = computed(() => {
  const specialistProfileName = String(specialistProfileDisplayName.value || '').trim()
  if (specialistProfileName) return specialistProfileName
  const mePayload = auth.me as any
  const profileDisplayName = String(mePayload?.display_name || '').trim()
  if (profileDisplayName) return profileDisplayName
  const meDisplayName = String(mePayload?.user?.display_name || '').trim()
  if (meDisplayName) return meDisplayName
  const authDisplayName = String((auth.user as any)?.display_name || '').trim()
  if (authDisplayName) return authDisplayName
  const firstName = String(mePayload?.user?.first_name || '').trim()
  const lastName = String(mePayload?.user?.last_name || '').trim()
  const fullName = `${firstName} ${lastName}`.trim()
  if (fullName) return fullName
  return 'Спеціаліст'
})

async function loadSpecialistDisplayName() {
  try {
    const profile = await fetchSpecialistProfile()
    specialistProfileDisplayName.value = String(profile?.display_name || '').trim()
  } catch {
    specialistProfileDisplayName.value = ''
  }
}

function normalizePublicProfilePath(value: unknown): string {
  const raw = String(value || '').trim()
  if (!raw) return ''
  if (raw.startsWith('/s/')) return raw
  if (/^https?:\/\//i.test(raw)) {
    try {
      const url = new URL(raw)
      if (url.pathname.startsWith('/s/')) return url.pathname
    } catch {
      return ''
    }
  }
  return ''
}

const specialistProfileUrl = computed(() => {
  const mePayload = auth.me as any
  const path =
    normalizePublicProfilePath(mePayload?.public_profile_path) ||
    normalizePublicProfilePath(mePayload?.user?.public_profile_path) ||
    normalizePublicProfilePath(mePayload?.public_profile_url) ||
    normalizePublicProfilePath(mePayload?.user?.public_profile_url)
  if (!path) return ''
  return `${window.location.origin}${path}`
})

function statusLabel(status: CabinetReviewStatus): string {
  return REVIEW_STATUS_LABELS[status] || status
}

function statusClass(status: CabinetReviewStatus): string {
  if (status === 'APPROVED') return 'review-card__status--approved'
  if (status === 'REJECTED') return 'review-card__status--rejected'
  return 'review-card__status--pending'
}

function formatDate(value: string): string {
  return formatUkDateTimeCompact(value)
}

function mapError(err: unknown): string {
  const code = String((err as any)?.response?.data?.code || '').trim().toUpperCase()
  if (code === 'REVIEW_INVALID_STATUS') return 'Некоректний статус відгуків.'
  return 'Не вдалося завантажити відгуки. Спробуйте ще раз.'
}

function permissionLabel(review: CabinetReview): string {
  const permission = review.share_card_permission
  if (permission?.status === 'GRANTED_ANONYMOUS') {
    return 'Використання поза платформою: дозволено анонімно'
  }
  if (permission?.status === 'REVOKED') return 'Дозвіл відкликано'
  if (permission?.status === 'UNSUPPORTED_REVIEW_SOURCE') {
    return 'Картки доступні лише для анонімних відгуків'
  }
  return 'Використання поза платформою: не дозволено'
}

function canCreateShareCard(review: CabinetReview): boolean {
  const permission = review.share_card_permission
  return (
    review.source === 'practice' &&
    permission?.can_create === true &&
    permission?.status === 'GRANTED_ANONYMOUS' &&
    permission?.mode === 'anonymous'
  )
}

function triageActions(status: CabinetReviewStatus): Array<{ label: string; next: CabinetReviewStatus }> {
  if (status === 'PENDING') {
    return [
      { label: 'Позначити як переглянутий', next: 'APPROVED' },
      { label: 'Помітити як спам', next: 'REJECTED' },
    ]
  }
  if (status === 'APPROVED') {
    return [
      { label: 'Повернути до нових', next: 'PENDING' },
      { label: 'Помітити як спам', next: 'REJECTED' },
    ]
  }
  return [{ label: 'Повернути до нових', next: 'PENDING' }]
}

function openShareCard(review: CabinetReview) {
  selectedReview.value = review
}

function closeShareCard() {
  selectedReview.value = null
}

async function applyReviewStatus(review: CabinetReview, nextStatus: CabinetReviewStatus) {
  statusActionLoadingByReviewUid.value[review.review_uid] = true
  statusActionErrorByReviewUid.value[review.review_uid] = ''
  try {
    await updateCabinetReviewStatus({
      source: review.source,
      id: review.id,
      status: nextStatus,
    })
    await loadReviews()
  } catch {
    statusActionErrorByReviewUid.value[review.review_uid] =
      'Не вдалося оновити статус відгуку. Спробуйте ще раз.'
  } finally {
    statusActionLoadingByReviewUid.value[review.review_uid] = false
  }
}

async function loadReviews() {
  loading.value = true
  error.value = ''
  try {
    const status = activeFilter.value === 'ALL' ? undefined : activeFilter.value
    reviews.value = await fetchCabinetReviews(status ? { status } : undefined)
  } catch (err) {
    error.value = mapError(err)
    reviews.value = []
  } finally {
    loading.value = false
  }
}

async function applyFilter(next: FilterKey) {
  if (activeFilter.value === next) return
  activeFilter.value = next
  await loadReviews()
}

onMounted(() => {
  void loadSpecialistDisplayName()
  void loadReviews()
})
</script>

<style scoped>
.reviews {
  display: grid;
  gap: 16px;
}

.reviews__hero {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 16px;
  border: 1px solid var(--pc-border);
  border-radius: var(--pc-radius-card);
  background: color-mix(in srgb, var(--pc-bg-card) 94%, #ffffff);
  padding: 18px;
}

.reviews__title {
  margin: 6px 0;
}

.reviews__subtitle {
  margin: 0;
  max-width: 640px;
}

.reviews__filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.reviews__filter-btn {
  min-height: 36px;
  border: 1px solid var(--pc-border);
  border-radius: 10px;
  padding: 7px 12px;
  background: #fff;
  color: var(--pc-navy-900);
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

.reviews__filter-btn.is-active {
  border-color: var(--pc-navy-900);
  background: var(--pc-navy-900);
  color: #fff;
}

.reviews__list {
  display: grid;
  gap: 10px;
}

.review-card {
  border: 1px solid var(--pc-border);
  border-radius: var(--pc-radius-card);
  background: #fff;
  padding: 12px;
  display: grid;
  gap: 8px;
}

.review-card__head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
}

.review-card__author {
  font-weight: 700;
}

.review-card__status {
  border-radius: 999px;
  border: 1px solid transparent;
  padding: 4px 9px;
  font-size: 12px;
  font-weight: 700;
}

.review-card__status--pending {
  background: color-mix(in srgb, var(--pc-yellow-soft) 84%, #fff);
  border-color: color-mix(in srgb, var(--pc-warning) 36%, var(--pc-border));
  color: var(--pc-warning);
}

.review-card__status--approved {
  background: color-mix(in srgb, var(--pc-teal-500) 14%, #fff);
  border-color: color-mix(in srgb, var(--pc-teal-500) 36%, var(--pc-border));
  color: var(--pc-teal-700, #0f766e);
}

.review-card__status--rejected {
  background: color-mix(in srgb, var(--pc-bg-main) 84%, #fff);
  border-color: color-mix(in srgb, var(--pc-navy-900) 20%, var(--pc-border));
  color: var(--pc-text-muted);
}

.review-card__text {
  margin: 0;
  white-space: pre-wrap;
}

.review-card__permission {
  color: var(--pc-text-muted);
  font-size: 13px;
}

.review-card__meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  color: var(--pc-text-muted);
  font-size: 13px;
}

.review-card__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.form-error {
  color: #b3261e;
  background: #fdecea;
  border: 1px solid #f5c2c0;
  border-radius: 10px;
  padding: 8px 10px;
}

@media (max-width: 760px) {
  .reviews__hero {
    flex-direction: column;
    align-items: flex-start;
  }

  .review-card__head {
    flex-direction: column;
  }
}
</style>
