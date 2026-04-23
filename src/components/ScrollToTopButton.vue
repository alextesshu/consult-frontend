<template>
  <button
    v-if="isVisible"
    class="scroll-top-btn"
    type="button"
    aria-label="Вгору"
    @click="scrollToTop"
  >
    Вгору
  </button>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

const props = withDefaults(
  defineProps<{
    threshold?: number
  }>(),
  {
    threshold: 520,
  }
)

const route = useRoute()
const isVisible = ref(false)

function updateVisibility() {
  if (typeof window === 'undefined') return
  const dynamicThreshold = Math.max(window.innerHeight * 0.85, props.threshold)
  isVisible.value = window.scrollY > dynamicThreshold
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(() => {
  window.addEventListener('scroll', updateVisibility, { passive: true })
  updateVisibility()
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', updateVisibility)
})

watch(
  () => route.fullPath,
  async () => {
    await nextTick()
    updateVisibility()
  }
)
</script>

<style scoped>
.scroll-top-btn {
  position: fixed;
  right: 20px;
  bottom: 24px;
  z-index: 25;
  border: 1px solid color-mix(in srgb, var(--line) 88%, #ffffff);
  border-radius: var(--radius-pill);
  background: color-mix(in srgb, #ffffff 92%, var(--surface));
  color: var(--text);
  font-size: 13px;
  font-weight: 600;
  line-height: 1;
  padding: 10px 14px;
  cursor: pointer;
  box-shadow: 0 10px 22px rgba(16, 24, 40, 0.16);
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}

.scroll-top-btn:hover {
  border-color: color-mix(in srgb, var(--primary) 24%, var(--line));
  box-shadow: 0 12px 24px rgba(16, 24, 40, 0.18);
  transform: translateY(-1px);
}

.scroll-top-btn:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--primary) 42%, transparent);
  outline-offset: 2px;
}

@media (max-width: 640px) {
  .scroll-top-btn {
    right: 10px;
    bottom: max(10px, env(safe-area-inset-bottom) + 10px);
    padding: 8px 11px;
    font-size: 12px;
    z-index: 14;
  }
}
</style>
