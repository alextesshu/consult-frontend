<template>
  <div class="skeleton" :class="variantClass">
    <div
      v-for="i in count"
      :key="i"
      class="skeleton__card"
      :style="{ height: computedHeight }"
    >
      <div class="skeleton__line skeleton__line--wide"></div>
      <div class="skeleton__line"></div>
      <div class="skeleton__line skeleton__line--short"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    count?: number
    variant?: 'card' | 'list'
    height?: string
  }>(),
  {
    count: 3,
    variant: 'card',
    height: '120px',
  }
)

const variantClass = computed(() => `skeleton--${props.variant}`)
const computedHeight = computed(() => (props.variant === 'list' ? '72px' : props.height))
</script>

<style scoped>
.skeleton {
  display: grid;
  gap: 12px;
}

.skeleton--card {
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.skeleton--list {
  grid-template-columns: 1fr;
}

.skeleton__card {
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 14px;
  background: #fff;
  display: grid;
  gap: 10px;
  overflow: hidden;
  position: relative;
}

.skeleton__card::after {
  content: '';
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background: linear-gradient(90deg, transparent, rgba(9, 36, 52, 0.06), transparent);
  animation: skeleton-shimmer 1.2s infinite;
}

.skeleton__line {
  height: 10px;
  border-radius: 999px;
  background: rgba(7, 47, 71, 0.08);
  width: 70%;
}

.skeleton__line--wide {
  width: 90%;
  height: 14px;
}

.skeleton__line--short {
  width: 40%;
}

@keyframes skeleton-shimmer {
  to {
    transform: translateX(100%);
  }
}
</style>
