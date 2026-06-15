<template>
  <section class="panel profile-content-section" v-if="workStyleText">
    <div class="panel__header">
      <div>
        <h2 class="panel__title">Формат роботи</h2>
      </div>
    </div>
    <div class="scope-blocks">
      <template v-for="(block, index) in workStyleBlocks" :key="`work-style-block-${index}`">
        <ul v-if="block.kind === 'list'" class="scope-list">
          <li v-for="(item, itemIndex) in block.items" :key="`work-style-${index}-${itemIndex}`">{{ item }}</li>
        </ul>
        <p v-else class="scope-text">{{ block.text }}</p>
      </template>
    </div>
  </section>

  <section class="panel profile-content-section" v-if="workWithText || workWithChips.length">
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
    <div v-if="workWithBlocks.length" class="scope-blocks">
      <template v-for="(block, index) in workWithBlocks" :key="`work-with-block-${index}`">
        <ul v-if="block.kind === 'list'" class="scope-list">
          <li v-for="(item, itemIndex) in block.items" :key="`work-with-${index}-${itemIndex}`">{{ item }}</li>
        </ul>
        <p v-else class="scope-text">{{ block.text }}</p>
      </template>
    </div>
  </section>

  <section class="panel profile-content-section" v-if="whoIsNotSuitableText">
    <div class="panel__header">
      <div>
        <h2 class="panel__title">З чим я не працюю</h2>
      </div>
    </div>
    <div v-if="whoIsNotSuitableBlocks.length" class="scope-blocks">
      <template v-for="(block, index) in whoIsNotSuitableBlocks" :key="`not-suitable-block-${index}`">
        <ul v-if="block.kind === 'list'" class="scope-list scope-list--warning">
          <li v-for="(item, itemIndex) in block.items" :key="`not-suitable-${index}-${itemIndex}`">
            {{ item }}
          </li>
        </ul>
        <p v-else class="scope-text">{{ block.text }}</p>
      </template>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type Props = {
  workStyleText: string
  workWithText: string
  workWithChips: string[]
  whoIsNotSuitableText: string
}

const props = defineProps<Props>()

type AuthoredTextBlock =
  | { kind: 'list'; items: string[] }
  | { kind: 'paragraph'; text: string }

function normalizeAuthoredText(rawValue: string): string {
  return String(rawValue || '')
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function parseBulletLine(line: string): string | null {
  const match = line.match(/^\s*[-*\u2022]\s+(.+)$/)
  return match?.[1]?.trim() || null
}

function parseAuthoredTextBlocks(rawValue: string): AuthoredTextBlock[] {
  const normalized = normalizeAuthoredText(rawValue)
  if (!normalized) return []

  const blocks: AuthoredTextBlock[] = []
  let paragraphLines: string[] = []
  let listItems: string[] = []

  function flushParagraph() {
    if (!paragraphLines.length) return
    blocks.push({ kind: 'paragraph', text: paragraphLines.join(' ').trim() })
    paragraphLines = []
  }

  function flushList() {
    if (!listItems.length) return
    blocks.push({ kind: 'list', items: [...listItems] })
    listItems = []
  }

  normalized.split('\n').forEach((line) => {
    const trimmed = line.trim()
    if (!trimmed) {
      flushParagraph()
      flushList()
      return
    }

    const bulletText = parseBulletLine(line)
    if (bulletText) {
      flushParagraph()
      listItems.push(bulletText)
      return
    }

    flushList()
    paragraphLines.push(trimmed)
  })

  flushParagraph()
  flushList()

  return blocks
}

const workStyleBlocks = computed(() => parseAuthoredTextBlocks(props.workStyleText))
const workWithBlocks = computed(() => parseAuthoredTextBlocks(props.workWithText))
const whoIsNotSuitableBlocks = computed(() => parseAuthoredTextBlocks(props.whoIsNotSuitableText))
</script>

<style scoped>
.profile-content-section {
  grid-column: 1 / -1;
}

.panel {
  border: 1px solid color-mix(in srgb, var(--line) 82%, #ffffff);
  border-radius: var(--radius-lg);
  padding: 14px 16px;
  background: color-mix(in srgb, #ffffff 94%, var(--surface));
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

.narrative-list {
  gap: 5px;
  font-size: 13px;
  line-height: 1.46;
}

.scope-blocks {
  display: grid;
  gap: 8px;
}

.scope-list li::marker {
  color: color-mix(in srgb, var(--primary) 58%, #5c6f63);
}

.scope-text {
  margin: 0;
  max-width: 72ch;
  color: color-mix(in srgb, var(--text) 90%, var(--muted));
  font-size: 14px;
  line-height: 1.55;
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

  .panel__title {
    font-size: 19px;
  }
}
</style>
