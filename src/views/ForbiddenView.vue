<template>
  <section class="status-page">
    <div class="status-card">
      <div class="badge">403</div>
      <h1 class="title">Доступ заборонено</h1>
      <p class="muted">
        У вас немає прав для перегляду цієї сторінки. Перевірте роль або увійдіть в інший акаунт.
      </p>
      <RouterLink class="btn btn--ghost" to="/">На головну</RouterLink>
    </div>
  </section>
</template>

<style scoped>
.status-page {
  min-height: 60vh;
  display: grid;
  place-items: center;
}

.status-card {
  border: 1px solid var(--line);
  border-radius: 18px;
  padding: 28px;
  background: #fff;
  display: grid;
  gap: 12px;
  max-width: 520px;
  text-align: center;
}
</style>
