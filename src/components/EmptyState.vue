<template>
  <div class="empty-state">
    <div v-if="badge" class="badge">{{ badge }}</div>
    <h3 class="empty-state__title">{{ title }}</h3>
    <p v-if="description" class="muted empty-state__description">{{ description }}</p>
    <div v-if="hasActions" class="empty-state__actions">
      <RouterLink v-if="actionTo && actionText" class="btn btn--ghost" :to="actionTo">
        {{ actionText }}
      </RouterLink>
      <RouterLink v-if="secondaryTo && secondaryText" class="btn btn--ghost" :to="secondaryTo">
        {{ secondaryText }}
      </RouterLink>
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  title: string
  description?: string
  actionText?: string
  actionTo?: string
  secondaryText?: string
  secondaryTo?: string
  badge?: string
}>()

const hasActions = computed(
  () => Boolean(props.actionTo && props.actionText) || Boolean(props.secondaryTo && props.secondaryText)
)
</script>

<style scoped>
.empty-state {
  display: grid;
  gap: 8px;
  padding: 16px;
  border-radius: 14px;
  border: 1px dashed rgba(47, 63, 73, 0.2);
  background: rgba(7, 47, 71, 0.03);
}

.empty-state__title {
  margin: 0;
  font-size: 18px;
  font-family: var(--font-display);
}

.empty-state__description {
  max-width: 520px;
}

.empty-state__actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 4px;
}
</style>
