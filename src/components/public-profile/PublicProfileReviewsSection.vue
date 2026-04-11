<template>
  <section class="panel panel--reviews" v-if="reviews.length">
    <div class="panel__header">
      <div>
        <div class="badge badge--soft">Відгуки</div>
        <h2 class="panel__title">Що кажуть клієнти</h2>
      </div>
      <RouterLink class="btn btn--ghost btn--sm" :to="feedbackLink">Усі відгуки</RouterLink>
    </div>
    <div class="reviews-list">
      <article v-for="review in reviews" :key="review.id" class="review-card">
        <div class="review-card__text">{{ review.review_text }}</div>
        <div v-if="review.created_at" class="review-card__meta">{{ formatDate(review.created_at) }}</div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
type PublicReview = {
  id: number | string
  review_text: string
  created_at?: string
}

type Props = {
  reviews: PublicReview[]
  feedbackLink: string | Record<string, unknown>
  formatDate: (value: string) => string
}

defineProps<Props>()
</script>

<style scoped>
.panel--reviews {
  grid-column: 1 / -1;
}

.panel {
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  padding: 18px 18px 20px;
  background: color-mix(in srgb, #ffffff 90%, var(--surface));
  display: grid;
  gap: 14px;
}

.panel__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 6px;
}

.panel__header > div {
  display: grid;
  gap: 6px;
}

.panel__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 22px;
}

.reviews-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 12px;
}

.review-card {
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 12px;
  background: #fff;
  display: grid;
  gap: 10px;
}

.review-card__text {
  line-height: 1.5;
}

.review-card__meta {
  color: var(--muted);
  font-size: 12px;
}

.badge--soft {
  background: color-mix(in srgb, #e4e9dc 62%, #f8f3e9);
  border-color: color-mix(in srgb, #6f8b73 26%, var(--line));
  color: color-mix(in srgb, #3f5945 82%, var(--text));
}

@media (max-width: 960px) {
  .reviews-list {
    grid-template-columns: 1fr;
  }
}
</style>
