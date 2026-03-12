<template>
  <section class="settings-hub">
    <header class="panel settings-hub__hero">
      <div class="badge badge--soft">Налаштування</div>
      <h1 class="title">Усі налаштування</h1>
      <p class="muted">Оберіть розділ, який хочете відкрити.</p>
      <SettingsSubnav active="hub" />
    </header>

    <section class="settings-hub__grid">
      <RouterLink class="panel settings-card" to="/cabinet/profile">
        <h2 class="settings-card__title">Профіль</h2>
        <p class="muted">Дані публічного профілю, контакти та видимість.</p>
      </RouterLink>

      <RouterLink class="panel settings-card" to="/cabinet/settings/notifications">
        <h2 class="settings-card__title">Сповіщення</h2>
        <p class="muted">Керуйте in-app подіями для нагадувань і бронювань.</p>
      </RouterLink>

      <RouterLink class="panel settings-card" to="/cabinet/billing">
        <h2 class="settings-card__title">Плани та доступ</h2>
        <p class="muted">Поточний план, обмеження та запит на розширення.</p>
      </RouterLink>
    </section>
  </section>
</template>

<script setup lang="ts">
import SettingsSubnav from '../components/SettingsSubnav.vue'
</script>

<style scoped>
.settings-hub {
  display: grid;
  gap: 16px;
}

.panel {
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 16px;
  background: #fff;
}

.settings-hub__hero {
  display: grid;
  gap: 10px;
}

.badge--soft {
  width: fit-content;
  background: rgba(8, 113, 201, 0.12);
}

.settings-hub__grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.settings-card {
  text-decoration: none;
  color: inherit;
  display: grid;
  gap: 6px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.settings-card:hover {
  border-color: color-mix(in srgb, var(--primary) 35%, var(--line));
  box-shadow: 0 10px 22px rgba(31, 74, 96, 0.12);
}

.settings-card__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 22px;
}
</style>
