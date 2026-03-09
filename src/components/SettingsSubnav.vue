<template>
  <nav class="settings-subnav" aria-label="Розділи налаштувань">
    <RouterLink class="settings-subnav__link" :class="{ 'is-active': active === 'hub' }" to="/cabinet/settings">
      Усі налаштування
    </RouterLink>
    <RouterLink
      class="settings-subnav__link"
      :class="{ 'is-active': active === 'profile' }"
      to="/cabinet/profile"
    >
      Профіль
    </RouterLink>
    <RouterLink
      class="settings-subnav__link"
      :class="{ 'is-active': active === 'notifications' }"
      to="/cabinet/settings/notifications"
    >
      Сповіщення
    </RouterLink>
    <RouterLink class="settings-subnav__link" :class="{ 'is-active': active === 'billing' }" to="/cabinet/billing">
      Плани та доступ
    </RouterLink>
  </nav>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    active?: 'hub' | 'profile' | 'notifications' | 'billing'
  }>(),
  {
    active: 'hub',
  }
)
</script>

<style scoped>
.settings-subnav {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.settings-subnav__link {
  text-decoration: none;
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 6px 10px;
  font-size: 13px;
  color: var(--ink);
  background: #fff;
}

.settings-subnav__link:hover {
  background: rgba(7, 47, 71, 0.05);
}

.settings-subnav__link.is-active {
  border-color: rgba(8, 113, 201, 0.45);
  background: rgba(8, 113, 201, 0.1);
}
</style>
