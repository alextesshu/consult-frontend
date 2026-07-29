<template>
  <div
    v-if="open"
    class="article-share-dialog"
    @keydown.esc.prevent.stop="emit('close')"
  >
    <div class="article-share-dialog__backdrop" aria-hidden="true" @click="emit('close')"></div>
    <section
      ref="dialogRef"
      class="article-share-dialog__panel"
      role="dialog"
      aria-modal="true"
      aria-labelledby="article-share-dialog-title"
      @keydown="trapFocus"
    >
      <header class="article-share-dialog__header">
        <h2 id="article-share-dialog-title">Поділитися дописом</h2>
        <button class="btn btn--ghost btn--sm" type="button" @click="emit('close')">
          Закрити
        </button>
      </header>

      <div class="article-share-dialog__actions">
        <button ref="copyButtonRef" class="btn article-share-dialog__copy" type="button" @click="copyLink">
          <span aria-hidden="true">⧉</span>
          Скопіювати посилання
        </button>

        <a
          class="btn btn--ghost article-share-dialog__target"
          :href="telegramUrl"
          target="_blank"
          rel="noopener noreferrer"
        >
          Telegram
        </a>
        <a
          class="btn btn--ghost article-share-dialog__target"
          :href="facebookUrl"
          target="_blank"
          rel="noopener noreferrer"
        >
          Facebook
        </a>
        <button class="btn btn--ghost article-share-dialog__target" type="button" @click="shareToThreads">
          Threads
        </button>
      </div>

      <div class="article-share-dialog__feedback" aria-live="polite" aria-atomic="true">
        <p v-if="feedbackMessage" :class="feedbackTone === 'error' ? 'is-error' : 'is-success'">
          <span v-if="feedbackTone === 'success'" aria-hidden="true">✓</span>
          {{ feedbackMessage }}
        </p>
        <a
          v-if="threadsPopupBlocked"
          class="article-share-dialog__threads-fallback"
          href="https://www.threads.com/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Відкрити Threads
        </a>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'

const props = defineProps<{
  open: boolean
  canonicalUrl: string
  title: string
}>()

const emit = defineEmits<{
  close: []
}>()

const dialogRef = ref<HTMLElement | null>(null)
const copyButtonRef = ref<HTMLButtonElement | null>(null)
const feedbackMessage = ref('')
const feedbackTone = ref<'success' | 'error'>('success')
const threadsPopupBlocked = ref(false)

const encodedUrl = computed(() => encodeURIComponent(props.canonicalUrl))
const encodedTitle = computed(() => encodeURIComponent(props.title))
const telegramUrl = computed(
  () => `https://t.me/share/url?url=${encodedUrl.value}&text=${encodedTitle.value}`
)
const facebookUrl = computed(
  () => `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl.value}`
)

const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

function focusableElements(): HTMLElement[] {
  if (!dialogRef.value) return []
  return Array.from(dialogRef.value.querySelectorAll<HTMLElement>(focusableSelector)).filter(
    (element) => element.getAttribute('aria-hidden') !== 'true'
  )
}

function trapFocus(event: KeyboardEvent) {
  if (event.key !== 'Tab') return
  const elements = focusableElements()
  const first = elements[0]
  const last = elements[elements.length - 1]
  if (!first || !last) return
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
    return
  }
  if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

function fallbackCopy(value: string): boolean {
  const textarea = document.createElement('textarea')
  textarea.value = value
  textarea.setAttribute('readonly', '')
  textarea.setAttribute('data-article-share-fallback', 'true')
  textarea.style.position = 'fixed'
  textarea.style.left = '-9999px'
  document.body.appendChild(textarea)
  try {
    textarea.focus()
    textarea.select()
    return typeof document.execCommand === 'function' && document.execCommand('copy')
  } catch {
    return false
  } finally {
    textarea.remove()
  }
}

async function copyText(value: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value)
      return true
    }
  } catch {
    // Continue to the DOM fallback without exposing browser errors.
  }
  return fallbackCopy(value)
}

async function copyLink() {
  threadsPopupBlocked.value = false
  const copied = await copyText(props.canonicalUrl)
  feedbackTone.value = copied ? 'success' : 'error'
  feedbackMessage.value = copied
    ? 'Посилання скопійовано'
    : 'Не вдалося скопіювати посилання. Спробуйте ще раз.'
  await nextTick()
  copyButtonRef.value?.focus()
}

async function shareToThreads() {
  threadsPopupBlocked.value = false
  const threadsWindow = window.open(
    'https://www.threads.com/',
    '_blank',
    'noopener,noreferrer'
  )
  if (threadsWindow) threadsWindow.opener = null

  const copied = await copyText(`${props.title}\n${props.canonicalUrl}`)
  if (!copied) {
    feedbackTone.value = 'error'
    feedbackMessage.value = 'Не вдалося підготувати текст для Threads. Скопіюйте посилання окремо.'
    threadsPopupBlocked.value = !threadsWindow
    return
  }

  feedbackTone.value = 'success'
  feedbackMessage.value = 'Текст скопійовано. Вставте його у новий допис Threads'
  threadsPopupBlocked.value = !threadsWindow
}

watch(
  () => props.open,
  async (isOpen) => {
    if (!isOpen) return
    feedbackMessage.value = ''
    feedbackTone.value = 'success'
    threadsPopupBlocked.value = false
    await nextTick()
    copyButtonRef.value?.focus()
  },
  { immediate: true }
)
</script>

<style scoped>
.article-share-dialog {
  position: fixed;
  inset: 0;
  z-index: 80;
  display: grid;
  place-items: center;
  padding: 16px;
}

.article-share-dialog__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(7, 24, 33, 0.52);
}

.article-share-dialog__panel {
  position: relative;
  z-index: 1;
  box-sizing: border-box;
  width: min(520px, calc(100vw - 32px));
  max-height: calc(100vh - 32px);
  overflow: auto;
  padding: 22px;
  border: 1px solid var(--line);
  border-radius: 18px;
  background: #fff;
  box-shadow: 0 20px 50px rgba(15, 35, 48, 0.24);
}

.article-share-dialog__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.article-share-dialog__header h2 {
  margin: 0;
  font-size: 22px;
}

.article-share-dialog__actions {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-top: 20px;
}

.article-share-dialog__copy {
  grid-column: 1 / -1;
  min-height: 46px;
  gap: 8px;
}

.article-share-dialog__target {
  min-width: 0;
}

.article-share-dialog__feedback {
  min-height: 44px;
  margin-top: 14px;
  overflow-wrap: anywhere;
}

.article-share-dialog__feedback p {
  margin: 0;
  font-weight: 600;
}

.article-share-dialog__feedback .is-success {
  color: #1f6b55;
}

.article-share-dialog__feedback .is-error {
  color: #b3261e;
}

.article-share-dialog__threads-fallback {
  display: inline-flex;
  margin-top: 10px;
  color: var(--primary);
  font-weight: 700;
}

@media (max-width: 560px) {
  .article-share-dialog {
    padding: 12px;
  }

  .article-share-dialog__panel {
    width: calc(100vw - 24px);
    max-height: calc(100vh - 24px);
    padding: 18px;
  }

  .article-share-dialog__header {
    align-items: flex-start;
  }

  .article-share-dialog__actions {
    grid-template-columns: 1fr;
  }

  .article-share-dialog__copy {
    grid-column: auto;
  }

  .article-share-dialog__target,
  .article-share-dialog__copy {
    width: 100%;
  }
}
</style>
