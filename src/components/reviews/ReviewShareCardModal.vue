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

        <div v-if="showExcerptControls" class="share-card-modal__excerpt">
          <p class="share-card-modal__excerpt-title">Текст для картки</p>
          <label class="share-card-modal__toggle">
            <input v-model="textMode" type="radio" value="full" name="text-mode" />
            <span>Повний текст</span>
          </label>
          <label class="share-card-modal__toggle">
            <input v-model="textMode" type="radio" value="excerpt" name="text-mode" />
            <span>Короткий фрагмент</span>
          </label>
          <label v-if="textMode === 'excerpt'" class="field share-card-modal__excerpt-field">
            <span>Фрагмент відгуку</span>
            <textarea
              v-model="excerptDraft"
              class="input"
              rows="4"
              :aria-invalid="excerptError ? 'true' : 'false'"
            />
            <small class="share-card-modal__excerpt-help">Можна скоротити відгук, але не змінювати його зміст.</small>
            <small class="share-card-modal__excerpt-help">
              Рекомендована довжина для цього формату: до {{ recommendedExcerptLimit }} символів.
            </small>
            <small v-if="excerptWarning" class="share-card-modal__excerpt-warning">{{ excerptWarning }}</small>
            <small v-if="excerptError" class="share-card-modal__excerpt-error">{{ excerptError }}</small>
          </label>
        </div>
      </div>

      <div class="share-card-modal__preview-wrap">
        <article class="share-card-preview" :class="[`is-${format}`, `is-${theme}`]">
          <div class="share-card-preview__svg" v-html="previewSvgMarkup"></div>
        </article>
      </div>

      <div class="share-card-modal__actions">
        <p class="share-card-modal__safety-note">
          Перед публікацією перевірте, що у відгуку немає чутливих деталей клієнта.
        </p>
        <button class="btn" type="button" :disabled="downloading || Boolean(excerptError)" @click="downloadPng">
          {{ downloading ? 'Готуємо картку…' : 'Завантажити картку' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import proconsultLogoDark from '../../assets/consult-logo_2026-02-24-2135_black.png?inline'

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
const textMode = ref<'full' | 'excerpt'>('full')
const excerptDraft = ref('')

const hasProfileUrl = computed(() => Boolean(String(props.profileUrl || '').trim()))
const profileUrl = computed(() => String(props.profileUrl || '').trim())
const logoSrc = computed(() => String(proconsultLogoDark || ''))
const exportLogoHref = ref('')
const safeSpecialistDisplayName = computed(() => {
  const value = String(props.specialistDisplayName || '').trim()
  return value || 'Спеціаліст'
})

function stripOuterQuotes(value: string): string {
  return value.replace(/^["“”«»]+|["“”«»]+$/g, '').trim()
}

function formatReviewQuote(text: string, suffixEllipsis = false): string {
  const cleaned = stripOuterQuotes(String(text || '').trim())
  const body = suffixEllipsis && cleaned ? `${cleaned}…` : cleaned
  return `“${body}”`
}

const originalReviewText = computed(() => String(props.reviewText || '').trim())
const recommendedExcerptLimit = computed(() => (format.value === 'story' ? 550 : 320))
const EXCERPT_CONTROL_THRESHOLD = 240
const showExcerptControls = computed(() => originalReviewText.value.length > EXCERPT_CONTROL_THRESHOLD)

function normalizeForContains(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

function buildInitialExcerpt(source: string, limit: number): string {
  const safe = source.trim()
  if (safe.length <= limit) return safe
  const head = safe.slice(0, limit)
  const punctIndex = Math.max(head.lastIndexOf('.'), head.lastIndexOf('!'), head.lastIndexOf('?'))
  if (punctIndex >= Math.floor(limit * 0.55)) return head.slice(0, punctIndex + 1).trim()
  const spaceIndex = head.lastIndexOf(' ')
  if (spaceIndex >= Math.floor(limit * 0.65)) return head.slice(0, spaceIndex).trim()
  return head.trim()
}

watch(
  [showExcerptControls, originalReviewText, recommendedExcerptLimit],
  ([enabled, source, limit]) => {
    if (!enabled) {
      textMode.value = 'full'
      excerptDraft.value = source
      return
    }
    textMode.value = 'excerpt'
    excerptDraft.value = buildInitialExcerpt(source, Math.max(140, Math.floor(limit * 0.8)))
  },
  { immediate: true }
)

const excerptError = computed(() => {
  if (!showExcerptControls.value || textMode.value !== 'excerpt') return ''
  const candidate = excerptDraft.value.trim()
  if (!candidate) return 'Фрагмент має бути частиною оригінального відгуку.'
  const base = normalizeForContains(originalReviewText.value)
  const probe = normalizeForContains(candidate)
  return base.includes(probe) ? '' : 'Фрагмент має бути частиною оригінального відгуку.'
})

const excerptWarning = computed(() => {
  if (!showExcerptControls.value || textMode.value !== 'excerpt' || excerptError.value) return ''
  return excerptDraft.value.trim().length > recommendedExcerptLimit.value
    ? 'Фрагмент може не вміститися красиво. Скоротіть текст або оберіть формат Stories.'
    : ''
})

const effectiveQuoteSource = computed(() => {
  if (showExcerptControls.value && textMode.value === 'excerpt' && !excerptError.value) return excerptDraft.value.trim()
  return originalReviewText.value
})

const previewQuoteText = computed(() => {
  const text = effectiveQuoteSource.value
  const shouldEllipsis =
    showExcerptControls.value && textMode.value === 'excerpt' && !excerptError.value && normalizeForContains(text) !== normalizeForContains(originalReviewText.value)
  return formatReviewQuote(text, shouldEllipsis)
})

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function normalizeLineBreaks(value: string): string {
  return String(value || '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
}

function wrapSingleParagraph(paragraph: string, maxCharsPerLine: number): string[] {
  const words = paragraph.split(/[ \t]+/).filter(Boolean)
  const lines: string[] = []
  let line = ''

  for (const word of words) {
    const next = line ? `${line} ${word}` : word

    if (next.length > maxCharsPerLine) {
      if (line) {
        lines.push(line)
        line = word
      } else {
        lines.push(word)
        line = ''
      }
    } else {
      line = next
    }
  }

  if (line) lines.push(line)

  return lines.length ? lines : ['']
}

function wrapSvgText(text: string, maxCharsPerLine: number): string[] {
  const paragraphs = normalizeLineBreaks(text).split('\n')
  const lines: string[] = []

  for (const paragraph of paragraphs) {
    const trimmedParagraph = paragraph.trim()

    if (!trimmedParagraph) {
      lines.push('')
      continue
    }

    lines.push(...wrapSingleParagraph(trimmedParagraph, maxCharsPerLine))
  }

  return lines
}

function sanitizeReviewUid(uid: string): string {
  return uid.replace(/[^a-zA-Z0-9_-]+/g, '-')
}

function buildFileName(uid: string): string {
  return `proconsult-review-card-${sanitizeReviewUid(uid)}.png`
}

async function toDataUrlIfNeeded(src: string): Promise<string> {
  const raw = String(src || '').trim()
  if (!raw) return ''
  if (raw.startsWith('data:image/')) return raw
  try {
    const response = await fetch(raw)
    if (!response.ok) return raw
    const blob = await response.blob()
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result || raw))
      reader.onerror = () => reject(new Error('Failed to read logo blob'))
      reader.readAsDataURL(blob)
    })
    return dataUrl
  } catch {
    return raw
  }
}

watch(
  logoSrc,
  async (src) => {
    exportLogoHref.value = await toDataUrlIfNeeded(src)
  },
  { immediate: true }
)

function buildSvg(): string {
  const width = 1080
  const isStory = format.value === 'story'
  const height = isStory ? 1920 : 1080
  const isDark = theme.value === 'dark'
  const bg = isDark ? '#0f172a' : '#f8f6f1'
  const cardBg = isDark ? '#111827' : '#ffffff'
  const cardBorder = isDark ? '#1f2937' : '#e2e8f0'
  const fg = isDark ? '#f8fafc' : '#0f172a'
  const muted = isDark ? '#cbd5e1' : '#334155'
  const accent = '#0f766e'

  const layout = isStory
    ? {
        maxCharsPerLine: 30,
        maxQuoteLines: 12,
        lineHeight: 66,
        quoteX: 110,
        quoteStartY: 660,
        compactQuoteStartY: 700,
        headerY: 250,
        footerY: height - 340,
        authorGap: 88,
        authorBlockHeight: 58,
        specialistBlockHeight: showSpecialistName.value ? 92 : 0,
        profileBlockHeight: showProfileUrl.value && profileUrl.value ? 48 : 0,
        gapBeforeFooter: 100,
        quoteFontSize: 50,
        headerFontSize: 46,
        authorFontSize: 36,
        specialistLabelFontSize: 24,
        specialistNameFontSize: 30,
        consentFontSize: 34,
        domainFontSize: 30,
        logoWidth: 210,
        logoHeight: 50,
      }
    : {
        maxCharsPerLine: 32,
        maxQuoteLines: 8,
        lineHeight: 64,
        quoteX: 110,
        quoteStartY: 320,
        compactQuoteStartY: 340,
        headerY: 170,
        footerY: height - 200,
        authorGap: 82,
        authorBlockHeight: 54,
        specialistBlockHeight: showSpecialistName.value ? 88 : 0,
        profileBlockHeight: showProfileUrl.value && profileUrl.value ? 44 : 0,
        gapBeforeFooter: 86,
        quoteFontSize: 44,
        headerFontSize: 42,
        authorFontSize: 36,
        specialistLabelFontSize: 24,
        specialistNameFontSize: 30,
        consentFontSize: 30,
        domainFontSize: 28,
        logoWidth: 185,
        logoHeight: 44,
      }

  const textLines = wrapSvgText(previewQuoteText.value, layout.maxCharsPerLine)
  const nonEmptyQuoteLines = textLines.filter((line) => line.trim()).length
  const isCompactQuote = nonEmptyQuoteLines <= 4

  const lineHeight = layout.lineHeight
  const quoteStartY = isCompactQuote ? layout.compactQuoteStartY : layout.quoteStartY
  const quoteX = layout.quoteX
  const footerY = layout.footerY

  const authorBlockHeight = layout.authorBlockHeight
  const specialistBlockHeight = layout.specialistBlockHeight
  const profileBlockHeight = layout.profileBlockHeight
  const gapBeforeFooter = layout.gapBeforeFooter

  const reservedBottomHeight =
    authorBlockHeight + specialistBlockHeight + profileBlockHeight + gapBeforeFooter

  const maxQuoteLastY = footerY - reservedBottomHeight
  const maxLinesBySpace = Math.max(1, Math.floor((maxQuoteLastY - quoteStartY) / lineHeight) + 1)
  const maxLinesByFormat = layout.maxQuoteLines
  const allowedLines = Math.max(1, Math.min(maxLinesByFormat, maxLinesBySpace))

  const visibleLines = textLines.slice(0, allowedLines)
  const wasTruncatedBySpace = textLines.length > visibleLines.length

  if (wasTruncatedBySpace && visibleLines.length > 0) {
    const lastIndex = visibleLines.length - 1
    const currentLastLine = visibleLines[lastIndex] ?? ''
    const lastLine = currentLastLine.replace(/[.…\s]+$/g, '')

    visibleLines[lastIndex] = `${lastLine || currentLastLine}…`
  }

  const quoteBlock = visibleLines
    .map((line, index) => `<tspan x="${quoteX}" y="${quoteStartY + index * lineHeight}">${escapeXml(line)}</tspan>`)
    .join('')

  const quoteLastY = quoteStartY + Math.max(visibleLines.length - 1, 0) * lineHeight
  let cursorY = quoteLastY + (isCompactQuote ? Math.round(layout.authorGap * 0.72) : layout.authorGap)

  const optionalBlocks: string[] = [
    `<text x="90" y="${cursorY}" fill="${fg}" font-size="${layout.authorFontSize}" font-family="Arial, sans-serif">— Анонімний клієнт</text>`,
  ]
  cursorY += isStory ? 58 : 54

  if (showSpecialistName.value) {
    optionalBlocks.push(
      `<text x="90" y="${cursorY}" fill="${muted}" font-size="${layout.specialistLabelFontSize}" font-family="Arial, sans-serif">Спеціаліст</text>`
    )
    cursorY += 38
    optionalBlocks.push(
      `<text x="90" y="${cursorY}" fill="${fg}" font-size="${layout.specialistNameFontSize}" font-family="Arial, sans-serif">${escapeXml(safeSpecialistDisplayName.value)}</text>`
    )
    cursorY += 44
  }

  if (showProfileUrl.value && profileUrl.value) {
    optionalBlocks.push(
      `<text x="90" y="${cursorY}" fill="${muted}" font-size="28" font-family="Arial, sans-serif">${escapeXml(profileUrl.value)}</text>`
    )
    cursorY += 44
  }

  optionalBlocks.push(
    `<text x="90" y="${footerY}" fill="${muted}" font-size="${layout.consentFontSize}" font-family="Arial, sans-serif">Використано зі згоди клієнта</text>`
  )
  const logoWidth = layout.logoWidth
  const logoHeight = layout.logoHeight
  const logoFilter = theme.value === 'dark' ? ' filter="url(#logoLighten)"' : ''
  const logoY = footerY + 24
  optionalBlocks.push(
    `<image x="90" y="${logoY}" width="${logoWidth}" height="${logoHeight}" href="${escapeXml(exportLogoHref.value || logoSrc.value)}"${logoFilter} preserveAspectRatio="xMinYMin meet" />`
  )
  optionalBlocks.push(
    `<text x="920" y="${logoY + logoHeight - 2}" text-anchor="end" fill="${muted}" font-size="${layout.domainFontSize}" font-family="Arial, sans-serif">proconsult.space</text>`
  )

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" data-layout="${isStory ? 'story-v1' : 'square-v1'}" data-density="${isCompactQuote ? 'compact' : 'regular'}">
  <defs>
    <filter id="logoLighten" color-interpolation-filters="sRGB">
      <feColorMatrix type="matrix" values="-1 0 0 0 1  0 -1 0 0 1  0 0 -1 0 1  0 0 0 1 0" />
    </filter>
  </defs>
  <rect width="100%" height="100%" fill="${bg}"/>
  <ellipse cx="${isStory ? 160 : 150}" cy="${isStory ? 230 : 180}" rx="${isStory ? 160 : 120}" ry="${isStory ? 90 : 68}" fill="${isDark ? '#1e293b' : '#dbeafe'}" opacity="${isDark ? '0.42' : '0.55'}"/>
  <ellipse cx="${isStory ? 960 : 930}" cy="${isStory ? 1710 : 900}" rx="${isStory ? 180 : 130}" ry="${isStory ? 104 : 74}" fill="${isDark ? '#134e4a' : '#ccfbf1'}" opacity="${isDark ? '0.36' : '0.58'}"/>
  <path d="${isStory ? 'M830 180 C905 136, 990 148, 1030 220 C970 256, 905 274, 840 248 Z' : 'M760 146 C825 112, 892 118, 930 174 C876 204, 820 218, 770 198 Z'}" fill="${isDark ? '#0b3a35' : '#dcfce7'}" opacity="${isDark ? '0.42' : '0.58'}"/>
  <rect x="70" y="70" width="940" height="${height - 140}" rx="28" fill="${cardBg}" stroke="${cardBorder}"/>
  <text x="90" y="${layout.headerY}" fill="${accent}" font-size="${layout.headerFontSize}" font-weight="700" font-family="Arial, sans-serif">Відгук через Pro Consult</text>
  <text x="${quoteX}" y="${quoteStartY}" fill="${fg}" font-size="${layout.quoteFontSize}" font-family="Arial, sans-serif">${quoteBlock}</text>
  ${optionalBlocks.join('')}
</svg>`.trim()
}

const previewSvgMarkup = computed(() => buildSvg())

async function downloadPng() {
  downloading.value = true
  try {
    const svg = previewSvgMarkup.value
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

.share-card-modal__excerpt {
  grid-column: 1 / -1;
  border: 1px solid var(--pc-border);
  border-radius: 10px;
  padding: 10px;
  display: grid;
  gap: 8px;
}

.share-card-modal__excerpt-title {
  margin: 0;
  font-weight: 600;
}

.share-card-modal__excerpt-field {
  display: grid;
  gap: 6px;
}

.share-card-modal__excerpt-help {
  color: var(--pc-muted, #475569);
}

.share-card-modal__excerpt-warning {
  color: #9a6a00;
}

.share-card-modal__excerpt-error {
  color: #b91c1c;
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
  padding: 12px;
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

.share-card-preview__svg :deep(svg) {
  display: block;
  width: 100%;
  height: auto;
  border-radius: 12px;
}

.share-card-modal__actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  position: sticky;
  bottom: 0;
  z-index: 2;
  padding-top: 10px;
  background: linear-gradient(to top, #fff 72%, rgba(255, 255, 255, 0));
}

.share-card-modal__safety-note {
  margin: 0;
  color: var(--pc-muted, #64748b);
  font-size: 0.86rem;
  line-height: 1.35;
}

@media (max-width: 760px) {
  .share-card-modal__controls {
    grid-template-columns: 1fr;
  }
  .share-card-modal__actions {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
