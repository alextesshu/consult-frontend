<template>
  <section class="legal-doc">
    <header class="legal-doc__hero">
      <div>
        <div class="badge">{{ badge }}</div>
        <h1 class="title legal-doc__title">{{ title }}</h1>
        <p class="muted legal-doc__subtitle">{{ subtitle }}</p>
      </div>
      <RouterLink class="btn btn--ghost" to="/">На головну</RouterLink>
    </header>

    <article class="legal-doc__body">
      <slot />
    </article>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  badge: string
  title: string
  subtitle: string
}>()
</script>

<style scoped>
.legal-doc {
  display: grid;
  gap: 18px;
}

.legal-doc__hero {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  background: linear-gradient(135deg, rgba(8, 113, 201, 0.12), rgba(7, 47, 71, 0.04));
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 22px 24px;
  box-shadow: var(--shadow);
}

.legal-doc__title {
  font-size: 32px;
}

.legal-doc__subtitle {
  max-width: 720px;
}

.legal-doc__body {
  border: 1px solid var(--line);
  border-radius: 18px;
  padding: 20px;
  background: #fff;
  display: grid;
  gap: 14px;
  line-height: 1.65;
}

.legal-doc__body :deep(h2) {
  margin: 10px 0 0;
  font-size: 20px;
}

.legal-doc__body :deep(p),
.legal-doc__body :deep(li) {
  margin: 0;
  color: var(--muted);
}

.legal-doc__body :deep(ul) {
  margin: 0;
  padding-left: 20px;
  display: grid;
  gap: 6px;
}

.legal-doc__body :deep(strong) {
  color: var(--text);
}

@media (max-width: 860px) {
  .legal-doc__hero {
    flex-direction: column;
    align-items: flex-start;
  }

  .legal-doc__title {
    font-size: 28px;
  }
}
</style>
