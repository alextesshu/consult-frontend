<template>
  <section class="reviews">
    <header class="reviews__hero">
      <div>
        <div class="badge">Відгуки</div>
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
        <div class="review-card__meta">
          <span>{{ formatDate(review.created_at) }}</span>
          <RouterLink
            v-if="review.session_id"
            class="btn btn--ghost btn--sm"
            :to="`/cabinet/sessions/${review.session_id}`"
          >
            Перейти до сесії
          </RouterLink>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import {
  fetchCabinetReviews,
  type CabinetReview,
  type CabinetReviewStatus,
} from '../lib/api'
import { formatUkDateTimeCompact } from '../lib/dateTime'

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

.review-card__meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  color: var(--pc-text-muted);
  font-size: 13px;
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
