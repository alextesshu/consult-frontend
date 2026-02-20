<template>
  <section class="status-page">
    <div class="status-card">
      <div class="badge">404</div>
      <h1 class="title">Сторінку не знайдено</h1>
      <p class="muted">
        Схоже, цієї сторінки не існує або посилання застаріло. Перевірте адресу або перейдіть
        до корисних розділів.
      </p>
      <div class="status-actions">
        <RouterLink class="btn btn--ghost" to="/">На головну</RouterLink>
        <RouterLink class="btn btn--ghost" to="/therapists">Пошук спеціалістів</RouterLink>
        <RouterLink class="btn btn--ghost" to="/login">Вхід</RouterLink>
      </div>
    </div>
  </section>
</template>

<style scoped>
.status-page {
  min-height: 60vh;
  display: grid;
  place-items: center;
  padding: 24px;
}

.status-card {
  border: 1px solid var(--line);
  border-radius: 18px;
  padding: 28px 32px;
  background: linear-gradient(135deg, #ffffff 0%, #f3f7fb 100%);
  display: grid;
  gap: 12px;
  max-width: 520px;
  text-align: center;
  box-shadow: var(--shadow);
}

.status-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
  flex-wrap: wrap;
}
</style>
