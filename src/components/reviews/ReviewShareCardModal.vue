<template>
  <div v-if="open" class="share-card-modal" role="dialog" aria-modal="true" aria-label="Створити картку відгуку">
    <div class="share-card-modal__backdrop" @click="emit('close')"></div>
    <div class="share-card-modal__panel">
      <header class="share-card-modal__header">
        <h2>Створити картку</h2>
        <button class="btn btn--ghost btn--sm" type="button" @click="emit('close')">Закрити</button>
      </header>

      <div class="share-card-modal__controls">
        <label class="field">
          <span>Формат</span>
          <select v-model="format" class="input input--select">
            <option value="square">Квадрат 1080×1080</option>
            <option value="story">Stories 1080×1920</option>
          </select>
        </label>

        <label class="field">
          <span>Тема</span>
          <select v-model="theme" class="input input--select">
            <option value="light">Світла</option>
            <option value="dark">Темна</option>
          </select>
        </label>

        <label class="share-card-modal__toggle">
          <input v-model="showSpecialistName" type="checkbox" />
          <span>Показувати ім’я спеціаліста</span>
        </label>

        <label v-if="hasProfileUrl" class="share-card-modal__toggle">
          <input v-model="showProfileUrl" type="checkbox" />
          <span>Показувати посилання на профіль</span>
        </label>
      </div>

      <div class="share-card-modal__preview-wrap">
        <article class="share-card-preview" :class="[`is-${format}`, `is-${theme}`]">
          <div class="share-card-preview__content share-card-preview__content--compact">
            <div class="share-card-preview__title">Відгук клієнта через Pro Consult</div>
            <blockquote class="share-card-preview__text">“{{ previewText }}”</blockquote>
            <div class="share-card-preview__author">— Анонімний клієнт</div>
            <div v-if="showSpecialistName" class="share-card-preview__specialist">{{ safeSpecialistDisplayName }}</div>
            <div v-if="showProfileUrl && profileUrl" class="share-card-preview__profile">{{ profileUrl }}</div>
            <div class="share-card-preview__footer">Використано зі згоди клієнта</div>
          </div>
        </article>
      </div>

      <div class="share-card-modal__actions">
        <button class="btn" type="button" :disabled="downloading" @click="downloadPng">
          {{ downloading ? 'Готуємо PNG…' : 'Завантажити PNG' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

export type ShareCardFormat = 'square' | 'story'
export type ShareCardTheme = 'light' | 'dark'

const props = defineProps<{
  open: boolean
  reviewText: string
  reviewUid: string
  specialistDisplayName?: string | null
  profileUrl?: string | null
}>()

const emit = defineEmits<{
  close: []
}>()

const format = ref<ShareCardFormat>('square')
const theme = ref<ShareCardTheme>('light')
const showSpecialistName = ref(false)
const showProfileUrl = ref(false)
const downloading = ref(false)

const hasProfileUrl = computed(() => Boolean(String(props.profileUrl || '').trim()))
const profileUrl = computed(() => String(props.profileUrl || '').trim())
const safeSpecialistDisplayName = computed(() => {
  const value = String(props.specialistDisplayName || '').trim()
  return value || 'Спеціаліст'
})

const previewText = computed(() => {
  const source = String(props.reviewText || '').trim()
  const maxLen = format.value === 'story' ? 560 : 320
  if (source.length <= maxLen) return source
  return `${source.slice(0, maxLen - 1).trim()}…`
})

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function wrapSvgText(text: string, maxCharsPerLine: number): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let line = ''
  for (const word of words) {
    const next = line ? `${line} ${word}` : word
    if (next.length > maxCharsPerLine) {
      if (line) lines.push(line)
      line = word
    } else {
      line = next
    }
  }
  if (line) lines.push(line)
  return lines
}

function sanitizeReviewUid(uid: string): string {
  return uid.replace(/[^a-zA-Z0-9_-]+/g, '-')
}

function buildFileName(uid: string): string {
  return `proconsult-review-card-${sanitizeReviewUid(uid)}.png`
}

function buildSvg(): string {
  const width = 1080
  const height = format.value === 'story' ? 1920 : 1080
  const isDark = theme.value === 'dark'
  const bg = isDark ? '#0f172a' : '#f8f6f1'
  const cardBg = isDark ? '#111827' : '#ffffff'
  const cardBorder = isDark ? '#1f2937' : '#e2e8f0'
  const fg = isDark ? '#f8fafc' : '#0f172a'
  const muted = isDark ? '#cbd5e1' : '#334155'
  const accent = '#0f766e'

  const textLines = wrapSvgText(previewText.value, format.value === 'story' ? 36 : 42)
  const maxLines = format.value === 'story' ? 12 : 8
  const visibleLines = textLines.slice(0, maxLines)
  const lineHeight = 64
  const quoteStartY = 320

  const quoteBlock = visibleLines
    .map((line, index) => `<tspan x="90" y="${quoteStartY + index * lineHeight}">${escapeXml(line)}</tspan>`)
    .join('')

  const quoteLastY = quoteStartY + Math.max(visibleLines.length - 1, 0) * lineHeight
  let cursorY = quoteLastY + 86

  const optionalBlocks: string[] = [
    `<text x="90" y="${cursorY}" fill="${fg}" font-size="36" font-family="Arial, sans-serif">— Анонімний клієнт</text>`,
  ]
  cursorY += 54

  if (showSpecialistName.value) {
    optionalBlocks.push(
      `<text x="90" y="${cursorY}" fill="${muted}" font-size="32" font-family="Arial, sans-serif">${escapeXml(safeSpecialistDisplayName.value)}</text>`
    )
    cursorY += 48
  }

  if (showProfileUrl.value && profileUrl.value) {
    optionalBlocks.push(
      `<text x="90" y="${cursorY}" fill="${muted}" font-size="28" font-family="Arial, sans-serif">${escapeXml(profileUrl.value)}</text>`
    )
    cursorY += 44
  }

  optionalBlocks.push(
    `<text x="90" y="${cursorY}" fill="${muted}" font-size="26" font-family="Arial, sans-serif">Використано зі згоди клієнта</text>`
  )

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" fill="${bg}"/>
  <rect x="70" y="70" width="940" height="${height - 140}" rx="28" fill="${cardBg}" stroke="${cardBorder}"/>
  <text x="90" y="170" fill="${accent}" font-size="42" font-weight="700" font-family="Arial, sans-serif">Відгук клієнта через Pro Consult</text>
  <text x="90" y="250" fill="${fg}" font-size="48" font-family="Arial, sans-serif">${quoteBlock}</text>
  ${optionalBlocks.join('')}
</svg>`.trim()
}

async function downloadPng() {
  downloading.value = true
  try {
    const svg = buildSvg()
    const svgDataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`

    const img = new Image()
    img.crossOrigin = 'anonymous'

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('Failed to render image'))
      img.src = svgDataUrl
    })

    const width = 1080
    const height = format.value === 'story' ? 1920 : 1080
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas context unavailable')
    ctx.drawImage(img, 0, 0, width, height)

    const href = canvas.toDataURL('image/png')
    const anchor = document.createElement('a')
    anchor.href = href
    anchor.download = buildFileName(props.reviewUid)
    anchor.click()
  } finally {
    downloading.value = false
  }
}
</script>

<style scoped>
.share-card-modal {
  position: fixed;
  inset: 0;
  z-index: 1200;
  display: grid;
  place-items: center;
}

.share-card-modal__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.52);
}

.share-card-modal__panel {
  position: relative;
  width: min(920px, calc(100vw - 24px));
  max-height: calc(100vh - 24px);
  overflow: auto;
  background: #fff;
  border-radius: 14px;
  border: 1px solid var(--pc-border);
  padding: 16px;
  display: grid;
  gap: 14px;
}

.share-card-modal__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.share-card-modal__header h2 {
  margin: 0;
}

.share-card-modal__controls {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.share-card-modal__toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  grid-column: 1 / -1;
}

.share-card-modal__preview-wrap {
  border: 1px dashed var(--pc-border);
  border-radius: 12px;
  padding: 12px;
  overflow: auto;
}

.share-card-preview {
  margin: 0 auto;
  border-radius: 16px;
  border: 1px solid var(--pc-border);
  padding: 18px;
}

.share-card-preview.is-square {
  width: min(100%, 420px);
  min-height: 420px;
}

.share-card-preview.is-story {
  width: min(100%, 420px);
  min-height: 640px;
}

.share-card-preview.is-light {
  background: #f8f6f1;
  color: #0f172a;
}

.share-card-preview.is-dark {
  background: #0f172a;
  color: #f8fafc;
}

.share-card-preview__content {
  display: grid;
}

.share-card-preview__content--compact {
  gap: 8px;
  align-content: start;
}

.share-card-preview__title {
  font-weight: 700;
  color: #0f766e;
}

.share-card-preview__text {
  margin: 0;
  white-space: pre-wrap;
  line-height: 1.45;
}

.share-card-preview__author {
  font-weight: 600;
}

.share-card-preview__specialist,
.share-card-preview__profile,
.share-card-preview__footer {
  color: var(--pc-text-muted);
  font-size: 13px;
}

.share-card-modal__actions {
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 760px) {
  .share-card-modal__controls {
    grid-template-columns: 1fr;
  }
}
</style>
