<template>
  <section
    id="about-me"
    class="panel panel--about text-section text-section--about text-section--compact"
    v-if="aboutNarrativeText"
  >
    <div class="panel__header">
      <div>
        <h2 class="panel__title">Про мене</h2>
      </div>
    </div>
    <div class="text-section__content">
      <p class="narrative-text">{{ aboutNarrativeText }}</p>
    </div>
  </section>

  <section class="panel panel--approach text-section text-section--approach text-section--compact" v-if="workStyleText">
    <div class="panel__header">
      <div>
        <h2 class="panel__title">Формат роботи</h2>
      </div>
    </div>
    <div class="text-section__content">
      <p class="narrative-text">{{ workStyleText }}</p>
    </div>
  </section>

  <section class="panel panel--work-with structured-section" v-if="workWithText || workWithChips.length">
    <div class="panel__header">
      <div>
        <h2 class="panel__title">Основні запити</h2>
      </div>
    </div>
    <div v-if="workWithChips.length" class="work-with__chips">
      <span
        v-for="(chip, index) in workWithChips"
        :key="`${chip}-${index}`"
        class="work-with__chip"
      >
        {{ chip }}
      </span>
    </div>
    <ul v-if="workWithItems.length" class="scope-list">
      <li v-for="(item, index) in workWithItems" :key="`work-with-${index}`">{{ item }}</li>
    </ul>
  </section>

  <section class="panel panel--who structured-section structured-section--soft" v-if="whoIsNotSuitableText">
    <div class="panel__header">
      <div>
        <h2 class="panel__title">З чим я не працюю</h2>
        <p class="panel__lead">
          Тут спеціаліст пояснює, у яких випадках краще звернутися до іншого фахівця або отримати медичну допомогу.
        </p>
      </div>
    </div>
    <ul v-if="whoIsNotSuitableItems.length" class="scope-list scope-list--warning">
      <li v-for="(item, index) in whoIsNotSuitableItems" :key="`not-suitable-${index}`">{{ item }}</li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type Props = {
  aboutNarrativeText: string
  workStyleText: string
  workWithText: string
  workWithChips: string[]
  whoIsNotSuitableText: string
}

const props = defineProps<Props>()

function splitScopeText(rawValue: string): string[] {
  const normalized = String(rawValue || '')
    .replace(/\r/g, '\n')
    .trim()
  if (!normalized) return []
  const splitByMarkers = normalized
    .split(/\n|[;вЂў]+/g)
    .map((item) => item.replace(/^[\s\-вЂ“вЂ”]+/, '').trim())
    .filter(Boolean)
  if (splitByMarkers.length > 0) {
    return Array.from(new Set(splitByMarkers))
  }
  return [normalized]
}

const workWithItems = computed(() => splitScopeText(props.workWithText))
const whoIsNotSuitableItems = computed(() => splitScopeText(props.whoIsNotSuitableText))
</script>

<style scoped>
.panel--about,
.panel--approach,
.panel--work-with,
.panel--who {
  grid-column: 1 / -1;
}

#about-me {
  scroll-margin-top: 92px;
}

.panel {
  border: 1px solid color-mix(in srgb, var(--line) 82%, #ffffff);
  border-radius: var(--radius-lg);
  padding: 14px 16px;
  background: color-mix(in srgb, #ffffff 92%, var(--surface));
  display: grid;
  gap: 10px;
}

.panel__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 0;
}

.panel__header > div {
  display: grid;
  gap: 4px;
}

.panel__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 20px;
  line-height: 1.25;
}

.text-section {
  gap: 8px;
  padding: 13px 16px 14px;
  border-color: color-mix(in srgb, var(--line) 72%, #ffffff);
}

.text-section.panel {
  padding: 9px 12px 10px;
  gap: 4px;
  border-color: color-mix(in srgb, var(--line) 62%, #ffffff);
  border-radius: 12px;
  background: color-mix(in srgb, #fcfcf9 88%, #ffffff);
  box-shadow: none;
}

.text-section--about {
  background: linear-gradient(
    180deg,
    color-mix(in srgb, #f8f4ec 20%, #ffffff),
    #ffffff
  );
}

.text-section--approach {
  background: linear-gradient(
    180deg,
    color-mix(in srgb, #eef4eb 18%, #ffffff),
    #ffffff
  );
}

.text-section--terms {
  background: linear-gradient(
    180deg,
    color-mix(in srgb, #f8f0de 34%, #ffffff),
    #ffffff
  );
}

.text-section__content {
  max-width: 72ch;
}

.text-section--compact {
  padding: 10px 14px 11px;
  gap: 5px;
  border-color: color-mix(in srgb, var(--line) 68%, #ffffff);
  box-shadow: none;
}

.text-section--compact.panel {
  padding: 8px 11px 9px;
  gap: 3px;
}

.text-section--compact .panel__header {
  margin-bottom: 0;
}

.text-section--compact .panel__header > div {
  gap: 2px;
}

.text-section--compact .panel__title {
  font-size: 17px;
  line-height: 1.22;
}

.text-section--compact .text-section__content {
  max-width: 62ch;
}

.text-section--compact .narrative-text {
  font-size: 13px;
  line-height: 1.46;
}

.text-section--about.panel {
  background: linear-gradient(
    180deg,
    color-mix(in srgb, #f7f3ea 16%, #ffffff),
    #ffffff
  );
}

.text-section--approach.panel {
  background: linear-gradient(
    180deg,
    color-mix(in srgb, #edf3ea 12%, #ffffff),
    #ffffff
  );
}

.narrative-text,
.terms-text {
  margin: 0;
  white-space: pre-line;
  color: color-mix(in srgb, var(--text) 88%, var(--muted));
  font-size: 15px;
  line-height: 1.64;
}

.structured-section {
  padding: 13px 14px;
  gap: 10px;
  border-color: color-mix(in srgb, var(--line) 76%, #ffffff);
}

.structured-section--soft {
  background: color-mix(in srgb, #f7f3eb 40%, #ffffff);
}

.work-with__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.work-with__chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 5px 10px;
  border-radius: 10px;
  border: 1px solid color-mix(in srgb, var(--line) 84%, #ffffff);
  background: color-mix(in srgb, #eef3ea 56%, #ffffff);
  font-size: 12px;
  font-weight: 600;
  color: color-mix(in srgb, #325446 88%, var(--text));
}

.scope-list {
  margin: 0;
  padding-left: 18px;
  display: grid;
  gap: 6px;
  color: color-mix(in srgb, var(--text) 90%, var(--muted));
  font-size: 14px;
  line-height: 1.5;
}

.scope-list li::marker {
  color: color-mix(in srgb, var(--primary) 58%, #5c6f63);
}

.scope-list--warning li::marker {
  color: color-mix(in srgb, #b27843 74%, var(--muted));
}

.badge--soft {
  background: color-mix(in srgb, #eff3eb 52%, #ffffff);
  border-color: color-mix(in srgb, #7a8d7c 18%, var(--line));
  color: color-mix(in srgb, #4f6555 72%, var(--muted));
  font-size: 10px;
  letter-spacing: 0.05em;
}

@media (max-width: 960px) {
  .panel {
    padding: 12px 13px;
  }

  .text-section--compact {
    padding: 9px 11px 10px;
    gap: 4px;
  }

  .text-section.panel,
  .text-section--compact.panel {
    padding: 8px 10px 9px;
    gap: 3px;
  }

  .text-section--compact .text-section__content {
    max-width: none;
  }

  .panel__title {
    font-size: 19px;
  }

  .text-section--compact .panel__title {
    font-size: 16px;
  }
}
</style>

