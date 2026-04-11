<template>
  <section class="panel panel--media" v-if="mediaItems.length">
    <div class="panel__header">
      <div>
        <div class="badge badge--soft">Медіа</div>
        <h2 class="panel__title">Додаткові матеріали</h2>
      </div>
    </div>
    <div class="media-grid">
      <article v-for="item in mediaItems" :key="item.id" class="media-card">
        <div class="media-card__top">
          <div class="media-card__title">{{ item.title }}</div>
          <div v-if="item.kindLabel" class="media-card__kind">{{ item.kindLabel }}</div>
        </div>
        <p v-if="item.description" class="media-card__description">{{ item.description }}</p>
        <a
          class="btn btn--ghost btn--sm"
          :href="item.url"
          target="_blank"
          rel="noopener noreferrer"
        >
          Відкрити
        </a>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
type MediaItem = {
  id: string
  title: string
  description: string
  kindLabel: string
  url: string
}

type Props = {
  mediaItems: MediaItem[]
}

defineProps<Props>()
</script>

<style scoped>
.panel--media {
  grid-column: 1 / -1;
}

.panel {
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  padding: 18px 18px 20px;
  background: color-mix(in srgb, #ffffff 90%, var(--surface));
  display: grid;
  gap: 14px;
}

.panel__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 6px;
}

.panel__header > div {
  display: grid;
  gap: 6px;
}

.panel__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 22px;
}

.media-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 10px;
}

.media-card {
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 10px 12px;
  background: #fff;
  display: grid;
  gap: 8px;
}

.media-card__top {
  display: grid;
  gap: 4px;
}

.media-card__title {
  font-weight: 600;
  line-height: 1.35;
}

.media-card__kind {
  width: fit-content;
  padding: 3px 8px;
  border-radius: 999px;
  border: 1px solid var(--line);
  font-size: 11px;
  text-transform: uppercase;
  color: var(--muted);
}

.media-card__description {
  margin: 0;
  color: var(--muted);
  font-size: 13px;
  line-height: 1.5;
  white-space: pre-line;
}

.badge--soft {
  background: color-mix(in srgb, #e4e9dc 62%, #f8f3e9);
  border-color: color-mix(in srgb, #6f8b73 26%, var(--line));
  color: color-mix(in srgb, #3f5945 82%, var(--text));
}

@media (max-width: 960px) {
  .media-grid {
    grid-template-columns: 1fr;
  }
}
</style>
