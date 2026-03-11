<template>
  <nav class="schedule-subnav" aria-label="Розділи розкладу">
    <RouterLink class="schedule-subnav__link" :class="{ 'is-active': active === 'rules' }" to="/cabinet/availability-rules">
      Налаштування
    </RouterLink>
    <RouterLink class="schedule-subnav__link" :class="{ 'is-active': active === 'slots' }" to="/cabinet/slots">
      Вільні вікна
    </RouterLink>
    <RouterLink
      class="schedule-subnav__link"
      :class="{ 'is-active': active === 'vacation' }"
      to="/cabinet/availability-exceptions"
    >
      Відпустка
    </RouterLink>
  </nav>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    active?: 'rules' | 'slots' | 'vacation'
  }>(),
  {
    active: 'rules',
  }
)
</script>

<style scoped>
.schedule-subnav {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.schedule-subnav__link {
  text-decoration: none;
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 6px 10px;
  font-size: 13px;
  color: var(--ink);
  background: #fff;
}

.schedule-subnav__link:hover {
  background: rgba(7, 47, 71, 0.05);
}

.schedule-subnav__link.is-active {
  border-color: rgba(8, 113, 201, 0.45);
  background: rgba(8, 113, 201, 0.1);
}
</style>
