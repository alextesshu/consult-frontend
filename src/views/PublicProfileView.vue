<template>
  <section class="public">
    <header class="public__hero">
      <div>
        <div class="badge">Публічний профіль</div>
        <h1 class="title public__title">Сторінка терапевта</h1>
        <p class="muted public__subtitle">
          Тут зʼявиться публічна картка з описом, контактами та вільними слотами.
        </p>
      </div>
      <RouterLink class="btn btn--ghost" to="/">На головну</RouterLink>
    </header>

    <section class="panel">
      <div class="panel__header">
        <div>
          <div class="badge badge--soft">Статус</div>
          <h2 class="panel__title">Сторінка ще у підготовці</h2>
        </div>
      </div>
      <div class="placeholder">
        <div class="placeholder__left">
          <div class="placeholder__avatar"></div>
          <div class="placeholder__lines">
            <div class="placeholder__line"></div>
            <div class="placeholder__line placeholder__line--short"></div>
          </div>
        </div>
        <div class="placeholder__right">
          <div class="placeholder__chip"></div>
          <div class="placeholder__chip"></div>
          <div class="placeholder__chip"></div>
        </div>
      </div>
      <p class="muted">
        Ми готуємо цей екран для SEO-профілю. Він буде показувати активні слоти та опис
        практики без зайвого шуму.
      </p>
    </section>
  </section>
</template>

<script setup lang="ts"></script>

<style scoped>
.public {
  display: grid;
  gap: 18px;
}

.public__hero {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 20px;
  background: linear-gradient(135deg, rgba(8, 113, 201, 0.16), rgba(7, 47, 71, 0.06));
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 22px 24px;
  box-shadow: var(--shadow);
}

.public__title {
  font-size: 32px;
}

.public__subtitle {
  max-width: 520px;
}

.panel {
  border: 1px solid var(--line);
  border-radius: 18px;
  padding: 18px;
  background: #fff;
  display: grid;
  gap: 14px;
}

.panel__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.panel__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 22px;
}

.badge--soft {
  background: rgba(8, 113, 201, 0.12);
}

.placeholder {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 16px;
  border-radius: 14px;
  background: rgba(7, 47, 71, 0.04);
  border: 1px dashed rgba(7, 47, 71, 0.14);
}

.placeholder__left {
  display: flex;
  gap: 14px;
  align-items: center;
}

.placeholder__avatar {
  width: 56px;
  height: 56px;
  border-radius: 18px;
  background: linear-gradient(135deg, #e6eef4, #cddbe5);
}

.placeholder__lines {
  display: grid;
  gap: 8px;
}

.placeholder__line {
  width: 180px;
  height: 10px;
  border-radius: 999px;
  background: rgba(7, 47, 71, 0.14);
}

.placeholder__line--short {
  width: 120px;
}

.placeholder__right {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
}

.placeholder__chip {
  width: 78px;
  height: 24px;
  border-radius: 999px;
  background: rgba(7, 47, 71, 0.12);
}

@media (max-width: 820px) {
  .public__hero {
    flex-direction: column;
    align-items: flex-start;
  }

  .placeholder {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
