<template>
  <section class="panel panel--faq" v-if="faqItems.length">
    <div class="panel__header">
      <div>
        <div class="badge badge--soft">FAQ</div>
        <h2 class="panel__title">Поширені запитання</h2>
      </div>
    </div>
    <div v-if="uiV2" class="pc2-profile-faq">
      <article v-for="(item, index) in faqItems" :key="item.id" class="pc2-profile-faq__item">
        <button :id="`pc2-faq-question-${index}`" type="button" :aria-expanded="active === index" :aria-controls="`pc2-faq-answer-${index}`" @click="active = active === index ? null : index">{{ item.question }}<span aria-hidden="true" :class="{ 'is-open': active === index }">+</span></button>
        <div :id="`pc2-faq-answer-${index}`" class="pc2-profile-faq__answer" :class="{ 'is-open': active === index }" :aria-hidden="active !== index" :inert="active !== index ? true : undefined" role="region" :aria-labelledby="`pc2-faq-question-${index}`"><div><p>{{ item.answer }}</p></div></div>
      </article>
    </div>
    <div v-else class="faq-list">
      <details v-for="(item, index) in faqItems" :key="item.id" class="faq-item" :open="index === 0">
        <summary>{{ item.question }}</summary>
        <p>{{ item.answer }}</p>
      </details>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
type FaqItem = {
  id: string
  question: string
  answer: string
}

type Props = {
  uiV2?: boolean
  compact?: boolean
  faqItems: FaqItem[]
}

const props = defineProps<Props>()
const active = ref<number | null>(props.compact ? null : 0)
watch(() => props.compact, compact => { active.value = compact ? null : 0 })
</script>

<style scoped>
.panel--faq {
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

.faq-list {
  display: grid;
  gap: 10px;
}

.faq-item {
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 10px 12px;
  background: #fff;
}

.faq-item summary {
  font-weight: 600;
  cursor: pointer;
}

.faq-item p {
  margin: 10px 0 0;
  color: var(--muted);
  line-height: 1.55;
  white-space: pre-line;
}

.badge--soft {
  background: color-mix(in srgb, #e4e9dc 62%, #f8f3e9);
  border-color: color-mix(in srgb, #6f8b73 26%, var(--line));
  color: color-mix(in srgb, #3f5945 82%, var(--text));
}
</style>
