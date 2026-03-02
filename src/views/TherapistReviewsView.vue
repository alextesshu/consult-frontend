<template>
  <section class="reviews">
    <header class="reviews__hero">
      <div>
        <div class="badge">Відгуки</div>
        <h1 class="title reviews__title">Огляд відгуків</h1>
        <p class="muted reviews__subtitle">
          Приватні анонімні відгуки від клієнтів. Тут немає публічного рейтингу.
        </p>
      </div>
      <RouterLink class="btn btn--ghost" to="/cabinet">Назад до кабінету</RouterLink>
    </header>

    <AnonymousReviewList
      :reviews="reviews"
      :loading="loading"
      :error="error"
      empty-action-text="Відкрити профіль"
      empty-action-to="/cabinet/profile"
    />
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { apiGet } from '../lib/api'
import { getApiErrorMessage } from '../lib/errors'
import AnonymousReviewList from '../components/AnonymousReviewList.vue'

type Review = {
  id: number
  review_text: string
  created_at: string
}

const reviews = ref<Review[]>([])
const loading = ref(false)
const error = ref('')

async function loadReviews() {
  loading.value = true
  error.value = ''
  try {
    const resp = await apiGet<Review[]>('/cabinet/reviews/')
    reviews.value = resp || []
  } catch (err: any) {
    const message = getApiErrorMessage(err, 'Не вдалося завантажити відгуки')
    error.value = message
  } finally {
    loading.value = false
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

@media (max-width: 860px) {
  .reviews__hero {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
