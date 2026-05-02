<template>
  <div>
    <div v-if="loading" class="muted" style="margin-top: 12px;">Р—Р°РІР°РЅС‚Р°Р¶РµРЅРЅСЏ...</div>
    <div v-else-if="error" class="form-error" style="margin-top: 12px;">{{ error }}</div>

    <section v-else class="review-list">
      <div v-if="showCount && reviews.length > 0" class="review-stats">
        <div class="stat-chip">
          РЈСЃСЊРѕРіРѕ: <strong>{{ reviews.length }}</strong>
        </div>
      </div>
      <EmptyState
        v-if="reviews.length === 0"
        :title="emptyTitle"
        :description="emptyDescription"
        :action-text="emptyActionText"
        :action-to="emptyActionTo"
      />
      <article v-for="review in reviews" :key="review.id" class="review-card">
        <div class="review-card__header">
          <div class="muted">
            {{ formatDate(review.created_at) }}
          </div>
        </div>

        <div class="review-text">
          {{ review.text ? review.text : (review.review_text ? review.review_text : 'Без тексту відгуку.') }}
        </div>
      </article>
    </section>
  </div>
</template>

<script setup lang="ts">
import EmptyState from './EmptyState.vue'
import { formatUkDateTimeCompact } from '../lib/dateTime'

type ReviewItem = {
  id: number
  text?: string
  review_text?: string
  created_at: string
}

type Props = {
  reviews: ReviewItem[]
  loading?: boolean
  error?: string
  showCount?: boolean
  emptyTitle?: string
  emptyDescription?: string
  emptyActionText?: string
  emptyActionTo?: string
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  error: '',
  showCount: true,
  emptyTitle: 'РџРѕРєРё РЅРµРјР°С” РІС–РґРіСѓРєС–РІ',
  emptyDescription: 'РљРѕР»Рё РєР»С–С”РЅС‚Рё Р·Р°Р»РёС€Р°С‚СЊ РІС–РґРіСѓРє РїС–СЃР»СЏ СЃРїС–РІРїСЂР°С†С–, РІС–РЅ Р·вЂ™СЏРІРёС‚СЊСЃСЏ С‚СѓС‚.',
  emptyActionText: 'Р’С–РґРєСЂРёС‚Рё РїСЂРѕС„С–Р»СЊ',
  emptyActionTo: '/cabinet/profile',
})

function formatDate(value: string) {
  return formatUkDateTimeCompact(value, value)
}
</script>

<style scoped>
.review-list {
  display: grid;
  gap: 12px;
}

.review-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.stat-chip {
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(15, 85, 140, 0.08);
  color: #0f558c;
  font-size: 12px;
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

.review-text {
  line-height: 1.5;
}

@media (max-width: 860px) {
  .review-card__header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>

