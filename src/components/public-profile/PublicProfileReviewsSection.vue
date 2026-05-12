<template>
  <section class="panel panel--reviews" v-if="reviews.length">
    <div class="panel__header">
      <div>
        <p class="panel__eyebrow">Відгуки</p>
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

.panel__eyebrow {
  margin: 0;
  width: fit-content;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 700;
  color: color-mix(in srgb, var(--pc-navy-900) 78%, var(--pc-text-muted));
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
  gap: 8px;
}

.review-card__text {
  line-height: 1.5;
  position: relative;
  padding-left: 14px;
}

.review-card__text::before {
  content: '“';
  position: absolute;
  left: 0;
  top: 0;
  color: var(--pc-teal-500);
  font-weight: 700;
}

.review-card__meta {
  color: var(--muted);
  font-size: 12px;
}

@media (max-width: 960px) {
  .reviews-list {
    grid-template-columns: 1fr;
  }
}
</style>
