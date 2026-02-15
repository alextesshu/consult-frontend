<template>
  <section class="status-page">
    <div class="status-card">
      <div class="badge">403</div>
      <h1 class="title">Доступ заборонено</h1>
      <p class="muted">
        У вас немає прав для перегляду цієї сторінки. Перевірте роль або увійдіть в інший
        акаунт.
      </p>
      <div class="status-actions">
        <RouterLink class="btn btn--ghost" to="/">На головну</RouterLink>
        <RouterLink class="btn btn--ghost" to="/login">Увійти</RouterLink>
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
  background: linear-gradient(135deg, #ffffff 0%, #f7f1f1 100%);
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
