<template>
  <section class="panel panel--about" v-if="aboutSections.length">
    <div class="panel__header">
      <div>
        <div class="badge badge--soft">Про спеціаліста</div>
        <h2 class="panel__title">Про спеціаліста</h2>
        <p class="panel__lead">Познайомтеся з підходом та стилем роботи перед першою консультацією.</p>
      </div>
    </div>
    <div class="about-grid">
      <article
        v-for="(section, index) in aboutSections"
        :key="`${section.title}-${index}`"
        class="bio-section"
        :class="{ 'bio-section--expanded': isSectionExpanded(index) }"
      >
        <div class="bio-title">{{ section.title }}</div>
        <div
          class="bio-copy"
          :class="{ 'bio-copy--collapsed': isSectionCollapsible(section.body) && !isSectionExpanded(index) }"
        >
          {{ section.body }}
        </div>
        <button
          v-if="isSectionCollapsible(section.body)"
          class="bio-toggle"
          type="button"
          @click="toggleSection(index)"
        >
          {{ isSectionExpanded(index) ? 'Згорнути' : 'Читати повністю' }}
        </button>
      </article>
    </div>
  </section>

  <section class="panel panel--who" v-if="whoIsNotSuitableText">
    <div class="panel__header">
      <div>
        <div class="badge badge--soft">Фокус роботи</div>
        <h2 class="panel__title">Запити, з якими я не працюю</h2>
      </div>
    </div>
    <div class="who-text">{{ whoIsNotSuitableText }}</div>
  </section>

  <section class="panel panel--contacts" v-if="showDirectContactActions">
    <div class="panel__header">
      <div>
        <div class="badge badge--soft">Зв’язок</div>
        <h2 class="panel__title">Зв’язок зі спеціалістом</h2>
        <p class="panel__lead">
          Оберіть зручний канал. Якщо застосунок не відкриється, контакт можна скопіювати й продовжити вручну.
        </p>
      </div>
    </div>
    <div class="contact-actions">
      <a
        v-for="item in contactActions"
        :key="item.id"
        class="contact-action"
        :href="item.actionUrl"
        target="_blank"
        rel="noopener noreferrer"
        @click.prevent="$emit('direct-contact-action', item)"
      >
        <span class="contact-action__label">{{ item.channelLabel }}</span>
        <span class="contact-action__value">{{ item.valueText }}</span>
      </a>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'

type AboutSection = {
  title: string
  body: string
}

type ContactAction = {
  id: string
  channelLabel: string
  valueText: string
  actionUrl: string
}

type Props = {
  aboutSections: AboutSection[]
  whoIsNotSuitableText: string
  showDirectContactActions: boolean
  contactActions: ContactAction[]
}

defineProps<Props>()

const expandedIndexes = ref<Set<number>>(new Set())

function isSectionCollapsible(body: string): boolean {
  return body.length > 340 || body.split('\n').length > 7
}

function isSectionExpanded(index: number): boolean {
  return expandedIndexes.value.has(index)
}

function toggleSection(index: number) {
  const next = new Set(expandedIndexes.value)
  if (next.has(index)) {
    next.delete(index)
  } else {
    next.add(index)
  }
  expandedIndexes.value = next
}

defineEmits<{
  (event: 'direct-contact-action', item: any): void
}>()
</script>

<style scoped>
.panel--about,
.panel--who,
.panel--contacts {
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

.panel__lead {
  margin: 0;
  color: var(--muted);
  font-size: 14px;
  line-height: 1.55;
  max-width: 78ch;
}

.panel--about {
  padding: 16px;
  gap: 10px;
}

.panel--about .panel__header {
  margin-bottom: 2px;
}

.panel--about .panel__header > div {
  gap: 4px;
}

.panel--about .panel__title {
  font-size: 18px;
  line-height: 1.2;
}

.panel--about .panel__lead {
  font-size: 13px;
  line-height: 1.45;
}

.about-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px 12px;
  align-items: stretch;
  grid-auto-rows: 1fr;
}

.bio-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
  border: 1px solid color-mix(in srgb, var(--line) 84%, #ffffff);
  border-radius: var(--radius-sm);
  padding: 10px 12px;
  background: color-mix(in srgb, #ffffff 78%, var(--surface));
  min-height: 260px;
}

.bio-section--expanded {
  min-height: auto;
}

.bio-title {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--deep);
  font-weight: 600;
}

.bio-copy {
  color: color-mix(in srgb, var(--text) 88%, var(--muted));
  font-size: 14px;
  line-height: 1.58;
  white-space: pre-line;
}

.bio-copy--collapsed {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 8;
  overflow: hidden;
}

.bio-toggle {
  margin-top: auto;
  border: none;
  background: transparent;
  color: color-mix(in srgb, var(--primary) 85%, var(--text));
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  padding: 4px 0 0;
  text-align: left;
}

.bio-toggle:hover {
  text-decoration: underline;
}

.who-text {
  white-space: pre-line;
  font-size: 15px;
  line-height: 1.55;
  color: var(--deep);
}

.contact-actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 10px;
}

.contact-action {
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 10px 12px;
  display: grid;
  gap: 4px;
  text-decoration: none;
  color: inherit;
  background: #fff;
}

.contact-action:hover {
  border-color: color-mix(in srgb, var(--primary) 32%, var(--line));
  background: color-mix(in srgb, #eef2e8 56%, #ffffff);
}

.contact-action__label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--muted);
}

.contact-action__value {
  font-weight: 600;
}

.badge--soft {
  background: color-mix(in srgb, #e4e9dc 62%, #f8f3e9);
  border-color: color-mix(in srgb, #6f8b73 26%, var(--line));
  color: color-mix(in srgb, #3f5945 82%, var(--text));
}

@media (max-width: 1380px) {
  .about-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 960px) {
  .about-grid,
  .contact-actions {
    grid-template-columns: 1fr;
  }

  .bio-section {
    min-height: auto;
  }
}
</style>
