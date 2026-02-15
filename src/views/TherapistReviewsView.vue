<template>
  <section class="reviews">
    <header class="reviews__hero">
      <div>
        <div class="badge">Відгуки</div>
        <h1 class="title reviews__title">Модерація відгуків</h1>
        <p class="muted reviews__subtitle">
          Підтверджуй або приховуй відгуки, відповідай клієнтам та керуй якістю публічного профілю.
        </p>
      </div>
      <RouterLink class="btn btn--ghost" to="/cabinet">Назад до кабінету</RouterLink>
    </header>

    <section class="panel">
      <div class="panel__header">
        <div>
          <div class="badge badge--soft">Фільтри</div>
          <h2 class="panel__title">Пошук і статуси</h2>
        </div>
        <button class="btn btn--ghost btn--sm" type="button" @click="resetFilters">
          Скинути
        </button>
      </div>
      <div class="filters">
        <label class="field">
          <span>Статус</span>
          <select v-model="filters.status">
            <option value="">Усі</option>
            <option value="PENDING">Очікує</option>
            <option value="APPROVED">Підтверджено</option>
            <option value="REJECTED">Приховано</option>
          </select>
        </label>
        <label class="field">
          <span>Оцінка</span>
          <select v-model="filters.rating">
            <option value="">Усі</option>
            <option value="5">5</option>
            <option value="4">4</option>
            <option value="3">3</option>
            <option value="2">2</option>
            <option value="1">1</option>
          </select>
        </label>
        <button class="btn" type="button" @click="loadReviews">
          Застосувати
        </button>
      </div>
    </section>

    <div v-if="loading" class="muted" style="margin-top: 12px;">Завантаження...</div>

    <section v-else class="review-list">
      <EmptyState
        v-if="reviews.length === 0"
        title="???? ????? ????????"
        description="????????? ???????? ???????? ?????? ????? ????? ? ???? ?????????? ???."
        action-text="????????? ????????"
        action-to="/cabinet/profile"
      />
      <article v-for="review in reviews" :key="review.id" class="review-card">
        <div class="review-card__header">
          <div>
            <div class="review-card__name">{{ review.client_username }}</div>
            <div class="muted">
              Сесія: {{ formatDate(review.session_start_at) }} — {{ formatDate(review.session_end_at) }}
            </div>
          </div>
          <div class="review-meta">
            <div class="rating-chip">{{ review.rating }} / 5</div>
            <div class="status-pill" :class="statusClass(review.status)">
              {{ statusLabel(review.status) }}
            </div>
          </div>
        </div>

        <div class="review-text">
          {{ review.review_text ? review.review_text : 'Без тексту відгуку.' }}
        </div>

        <div class="review-actions">
          <button
            class="btn btn--sm"
            type="button"
            :disabled="isActionLoading(review.id) || review.status === 'APPROVED'"
            @click="updateStatus(review, 'APPROVED')"
          >
            Підтвердити
          </button>
          <button
            class="btn btn--ghost btn--sm"
            type="button"
            :disabled="isActionLoading(review.id) || review.status === 'REJECTED'"
            @click="updateStatus(review, 'REJECTED')"
          >
            Приховати
          </button>
        </div>

        <div class="response">
          <label class="field">
            <span>Відповідь терапевта</span>
            <textarea v-model="responseDrafts[review.id]" rows="3"></textarea>
          </label>
          <div class="response__meta" v-if="review.therapist_response_at">
            Остання відповідь: {{ formatDate(review.therapist_response_at) }}
          </div>
          <button
            class="btn btn--ghost btn--sm"
            type="button"
            :disabled="isActionLoading(review.id)"
            @click="saveResponse(review)"
          >
            Зберегти відповідь
          </button>
        </div>
      </article>
    </section>
  </section>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { http } from '../lib/http'
import { useToast } from '../composables/useToast'
import { getApiErrorMessage } from '../lib/errors'
import EmptyState from '../components/EmptyState.vue'

type Review = {
  id: number
  session: number
  client_username: string
  session_start_at: string
  session_end_at: string
  rating: number
  review_text: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  therapist_response: string
  therapist_response_at: string | null
  created_at: string
  updated_at: string
}

const reviews = ref<Review[]>([])
const loading = ref(false)
const actionLoading = ref<Record<number, boolean>>({})
const responseDrafts = reactive<Record<number, string>>({})
const toast = useToast()

const filters = reactive({
  status: '',
  rating: '',
})

function statusClass(status: Review['status']) {
  if (status === 'APPROVED') return 'status-pill--approved'
  if (status === 'REJECTED') return 'status-pill--rejected'
  return 'status-pill--pending'
}

function statusLabel(status: Review['status']) {
  if (status === 'APPROVED') return 'Підтверджено'
  if (status === 'REJECTED') return 'Приховано'
  return 'Очікує'
}

function formatDate(value: string | null) {
  if (!value) return ''
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

function isActionLoading(reviewId: number) {
  return !!actionLoading.value[reviewId]
}

function setActionLoading(reviewId: number, value: boolean) {
  actionLoading.value = { ...actionLoading.value, [reviewId]: value }
}

function resetFilters() {
  filters.status = ''
  filters.rating = ''
  loadReviews()
}

async function loadReviews() {
  loading.value = true
  error.value = ''
  try {
    const params: Record<string, string> = {}
    if (filters.status) params.status = filters.status
    if (filters.rating) params.rating = filters.rating
    const resp = await http.get<Review[]>('/cabinet/reviews/', { params })
    reviews.value = resp.data || []
    reviews.value.forEach((review) => {
      responseDrafts[review.id] = review.therapist_response || ''
    })
  } catch (err: any) {
    toast.error(getApiErrorMessage(err, 'Не вдалося завантажити відгуки'))
  } finally {
    loading.value = false
  }
}

async function updateStatus(review: Review, status: Review['status']) {
  setActionLoading(review.id, true)
  try {
    const resp = await http.patch<Review>(`/cabinet/reviews/${review.id}/`, { status })
    reviews.value = reviews.value.map((item) => (item.id === review.id ? resp.data : item))
  } catch (err: any) {
    toast.error(getApiErrorMessage(err, 'Не вдалося оновити статус'))
  } finally {
    setActionLoading(review.id, false)
  }
}

async function saveResponse(review: Review) {
  setActionLoading(review.id, true)
  try {
    const resp = await http.patch<Review>(`/cabinet/reviews/${review.id}/`, {
      therapist_response: responseDrafts[review.id] || '',
    })
    reviews.value = reviews.value.map((item) => (item.id === review.id ? resp.data : item))
  } catch (err: any) {
    toast.error(getApiErrorMessage(err, 'Не вдалося зберегти відповідь'))
  } finally {
    setActionLoading(review.id, false)
  }
}

onMounted(loadReviews)
</script>

<style scoped>
.reviews {
  display: grid;
  gap: 18px;
}

.reviews__hero {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 20px;
  background: linear-gradient(135deg, rgba(15, 85, 140, 0.16), rgba(12, 39, 54, 0.06));
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 22px 24px;
  box-shadow: var(--shadow);
}

.reviews__title {
  font-size: 32px;
}

.reviews__subtitle {
  max-width: 520px;
}

.panel {
  border: 1px solid var(--line);
  border-radius: 18px;
  padding: 18px;
  background: #fff;
  display: grid;
  gap: 16px;
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

.badge--soft {
  background: rgba(15, 85, 140, 0.12);
}

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: end;
}

.field {
  display: grid;
  gap: 6px;
  font-size: 13px;
}

.field select,
.field textarea {
  border-radius: 10px;
  border: 1px solid var(--line);
  padding: 8px 10px;
  font-size: 14px;
}

.review-list {
  display: grid;
  gap: 12px;
}

.review-card {
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 16px;
  background: #fff;
  display: grid;
  gap: 12px;
}

.review-card__header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.review-card__name {
  font-weight: 600;
}

.review-meta {
  display: flex;
  gap: 8px;
  align-items: center;
}

.rating-chip {
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(15, 85, 140, 0.12);
  color: #0f558c;
  font-size: 12px;
  font-weight: 600;
}

.status-pill {
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 6px 10px;
  border-radius: 999px;
}

.status-pill--pending {
  background: rgba(217, 164, 65, 0.18);
  color: #a57011;
}

.status-pill--approved {
  background: rgba(31, 122, 76, 0.18);
  color: #1f7a4c;
}

.status-pill--rejected {
  background: rgba(194, 75, 75, 0.18);
  color: #a03838;
}

.review-text {
  line-height: 1.5;
}

.review-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.response {
  display: grid;
  gap: 8px;
}

.response textarea {
  min-height: 80px;
  resize: vertical;
}

.response__meta {
  color: var(--muted);
  font-size: 12px;
}

.btn--sm {
  padding: 6px 10px;
  font-size: 13px;
}


@media (max-width: 860px) {
  .reviews__hero {
    flex-direction: column;
    align-items: flex-start;
  }

  .review-card__header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
