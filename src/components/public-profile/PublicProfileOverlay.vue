<template>
  <dialog ref="dialog" class="pc2-profile-overlay" :class="[`pc2-profile-overlay--${kind}`, { 'is-shown': shown, 'is-reduced': reduced }]"
    :aria-labelledby="titleId" :aria-modal="kind === 'video' ? true : undefined" @cancel.prevent="requestClose" @click="backdrop" @close="nativeClosed" @keydown="trap">
    <header v-if="kind !== 'video'" class="pc2-profile-overlay__header" @touchstart.passive="touchStart" @touchend.passive="touchEnd">
      <h2 :id="titleId">{{ title }}</h2>
      <button type="button" class="pc2-profile-overlay__close" :disabled="locked" aria-label="Закрити" @click="requestClose">×</button>
    </header>
    <span v-if="kind === 'video'" class="pc2-profile-video-boundary" tabindex="0" @focus="focusVideoBoundary(true)"></span>
    <slot />
    <span v-if="kind === 'video'" class="pc2-profile-video-boundary" tabindex="0" @focus="focusVideoBoundary(false)"></span>
  </dialog>
</template>
<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useProfileMotion } from '../../composables/useProfileMotion'
const props = defineProps<{ open: boolean; title: string; titleId: string; kind: 'request' | 'about' | 'share' | 'video'; locked?: boolean; anchor?: HTMLElement | null; initialFocusSelector?: string }>()
const emit = defineEmits<{ 'update:open': [value: boolean]; closed: [] }>()
const dialog = ref<HTMLDialogElement | null>(null)
const shown = ref(false)
const enabled = computed(() => true)
const { reduced, schedule, cancel } = useProfileMotion(enabled)
let returnFocus: HTMLElement | null = null
let previousOverflow: string | undefined
let previousHtmlOverflow: string | undefined
let returnFallback: HTMLElement | null = null
let videoScroll: { x: number; y: number } | null = null
let generation = 0
let touchY: number | null = null
let pausedAnimations: Animation[] = []
function visibility() {
  if (document.hidden) {
    pausedAnimations = (dialog.value?.getAnimations?.({ subtree: true }) ?? []).filter(animation => animation.playState === 'running')
    pausedAnimations.forEach(animation => animation.pause())
  } else {
    pausedAnimations.forEach(animation => { if (animation.playState === 'paused') animation.play() })
    pausedAnimations = []
  }
}
onMounted(() => document.addEventListener('visibilitychange', visibility))
function restore() {
  if (previousOverflow !== undefined) { document.body.style.overflow = previousOverflow; previousOverflow = undefined }
  if (previousHtmlOverflow !== undefined) { document.documentElement.style.overflow = previousHtmlOverflow; previousHtmlOverflow = undefined }
  const target = returnFocus; returnFocus = null
  if (target?.isConnected) target.focus({ preventScroll: true })
  else if (returnFallback?.isConnected) returnFallback.focus({ preventScroll: true })
  returnFallback = null
  if (videoScroll) { window.scrollTo({ left: videoScroll.x, top: videoScroll.y, behavior: 'instant' }); videoScroll = null }
}
function finish() {
  cancel(); shown.value = false
  if (dialog.value?.open) dialog.value.close()
  restore(); emit('closed')
}
function requestClose() { if (!props.locked) emit('update:open', false) }
function nativeClosed() { if (props.open) emit('update:open', false) }
function backdrop(event: MouseEvent) {
  const el = dialog.value
  if (!el || event.target !== el) return
  const r = el.getBoundingClientRect()
  if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) requestClose()
}
function touchStart(event: TouchEvent) { touchY = event.touches[0]?.clientY ?? null }
function touchEnd(event: TouchEvent) {
  if (touchY !== null && (event.changedTouches[0]?.clientY ?? touchY) - touchY > 64) requestClose()
  touchY = null
}
function focusVideoBoundary(last: boolean) {
  const selector = last ? 'video[controls]' : '[data-video-initial-focus]'
  dialog.value?.querySelector<HTMLElement>(selector)?.focus({ preventScroll: true })
}
function trap(event: KeyboardEvent) {
  // Native modal containment includes the video's browser-owned shadow controls.
  // A light-DOM trap would skip or trap users inside those playback controls.
  if (props.kind === 'video') return
  if (event.key !== 'Tab') return
  const controls = Array.from(dialog.value?.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href],[tabindex="0"]') ?? []).filter(el => !el.closest('[inert],[hidden]') && el.getClientRects().length)
  const first = controls[0], last = controls.at(-1)
  if (!first || !last) { event.preventDefault(); dialog.value?.focus(); return }
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
}
watch(() => props.open, async open => {
  const token = ++generation
  cancel()
  if (!open) { shown.value = false; if (dialog.value?.open) schedule(finish, props.kind !== 'video' && (props.kind === 'request' || window.matchMedia?.('(max-width: 859px)').matches) ? 400 : 0); return }
  if (!dialog.value?.open) {
    returnFocus = props.kind === 'video' && props.anchor ? props.anchor : document.activeElement instanceof HTMLElement ? document.activeElement : null
    if (props.kind === 'video') {
      returnFallback = returnFocus?.closest('.public')?.querySelector<HTMLElement>('.pc2-profile-hero-share') ?? null
      videoScroll = { x: window.scrollX, y: window.scrollY }
    }
  }
  await nextTick()
  if (token !== generation || !dialog.value) return
  if (previousOverflow === undefined) {
    previousOverflow = document.body.style.overflow
    // Lock the document scroller for video without turning the full-height body
    // into a second scroll container (which would snap the document to zero).
    if (props.kind !== 'video') document.body.style.overflow = 'hidden'
  }
  if (props.kind === 'video' && previousHtmlOverflow === undefined) {
    previousHtmlOverflow = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
  }
  if (props.kind === 'share' && props.anchor) {
    const rect = props.anchor.getBoundingClientRect()
    dialog.value.style.setProperty('--profile-share-left', `${Math.max(16, Math.min(rect.left, window.innerWidth - 396))}px`)
    dialog.value.style.setProperty('--profile-share-top', `${Math.max(16, Math.min(rect.bottom + 10, window.innerHeight - 360))}px`)
  }
  if (!dialog.value.open) dialog.value.showModal()
  if (props.kind === 'video') {
    dialog.value.querySelector<HTMLElement>('[data-video-initial-focus]')?.focus({ preventScroll: true })
    // Native showModal focus steps can scroll the document to an off-screen trigger.
    if (videoScroll) window.scrollTo({ left: videoScroll.x, top: videoScroll.y, behavior: 'instant' })
  }
  // Commit the initial transform before starting the exact source transition.
  void dialog.value.offsetHeight
  shown.value = true
  if (props.kind === 'request' && props.initialFocusSelector) {
    // Reveal availability in the sheet's own scroller after its transform resets.
    await nextTick()
    const sheet = dialog.value
    if (token !== generation || !props.open || !sheet?.open) return
    const target = Array.from(sheet.querySelectorAll<HTMLElement>(props.initialFocusSelector)).find(el => el.getClientRects().length && !el.closest('[hidden],[inert]'))
    if (target) {
      target.focus({ preventScroll: true })
      const top = target.getBoundingClientRect().top - sheet.getBoundingClientRect().top + sheet.scrollTop
      sheet.scrollTop = Math.max(0, top - (sheet.clientHeight - target.offsetHeight) / 2)
    }
  }
}, { immediate: true, flush: 'post' })
onBeforeUnmount(() => { document.removeEventListener('visibilitychange', visibility); pausedAnimations.forEach(animation => animation.cancel()); pausedAnimations = []; generation++; cancel(); if (dialog.value?.open) dialog.value.close(); restore() })
defineExpose({ dialog, finish })
</script>
<style>
html[data-ui="v2"] .pc2-profile-overlay { position: fixed; inset: auto 0 0; margin: 0; width: 100%; max-width: none; height: 86dvh; max-height: 86dvh; padding: 16px; border: 0; border-radius: 28px 28px 0 0; color: #12233A; background: #fff; overflow-y: auto; overscroll-behavior: contain; transform: translateY(105%); transition: transform .4s cubic-bezier(.2,.8,.2,1); }
html[data-ui="v2"] .pc2-profile-overlay.is-shown { transform: translateY(0); }
/* Keep the existing video composition; only the shell becomes a native modal. */
html[data-ui="v2"] .pc2-profile-overlay--video,
html[data-ui="v2"] .pc2-profile-overlay--video.is-shown { inset: 0; width: 100%; height: 100dvh; max-height: none; margin: 0; border: 0; border-radius: 0; padding: max(16px, env(safe-area-inset-top)) 16px max(16px, env(safe-area-inset-bottom)); background: transparent; color: inherit; transform: none; transition: none; }
html[data-ui="v2"] .pc2-profile-overlay--video:not([open]) { display: none; }
html[data-ui="v2"] .pc2-profile-video-boundary { position: fixed; width: 1px; height: 1px; padding: 0; overflow: hidden; clip-path: inset(50%); }
html[data-ui="v2"] .pc2-profile-overlay::backdrop { background: rgba(18,35,58,0); transition: background .3s; }
html[data-ui="v2"] .pc2-profile-overlay.is-shown::backdrop { background: rgba(18,35,58,.42); }
html[data-ui="v2"] .pc2-profile-overlay--video::backdrop,
html[data-ui="v2"] .pc2-profile-overlay--video.is-shown::backdrop { background: transparent; transition: none; }
@media (max-width: 640px) {
 html[data-ui="v2"] .pc2-profile-overlay--video,
 html[data-ui="v2"] .pc2-profile-overlay--video.is-shown { padding: max(12px, env(safe-area-inset-top)) 12px max(12px, env(safe-area-inset-bottom)); }
}
html[data-ui="v2"] .pc2-profile-overlay__header { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 20px; touch-action: pan-x; }
html[data-ui="v2"] .pc2-profile-overlay--request > .pc2-profile-overlay__header { position: sticky; top: 0; z-index: 2; background: #fff; }
html[data-ui="v2"] .pc2-profile-overlay__header h2 { margin: 0; font-size: 19px; font-weight: 500; letter-spacing: -.03em; }
html[data-ui="v2"] .pc2-profile-overlay__close { width: 44px; height: 44px; border: 0; border-radius: 50%; background: #F6F1EA; color: #12233A; font-size: 22px; cursor: pointer; }
html[data-ui="v2"] .pc2-profile-overlay--about { height: 100dvh; max-height: 100dvh; border-radius: 0; padding: 20px 16px calc(20px + env(safe-area-inset-bottom)); }
html[data-ui="v2"] .pc2-profile-overlay--share { height: auto; max-height: 90dvh; padding-bottom: calc(30px + env(safe-area-inset-bottom)); }
html[data-ui="v2"] .pc2-profile-overlay :focus-visible { outline: 2px solid #12345A; outline-offset: 3px; }
@media (min-width: 860px) {
 html[data-ui="v2"] .pc2-profile-overlay--about.is-shown, html[data-ui="v2"] .pc2-profile-overlay--about { inset: 50% auto auto 50%; margin: 0; width: min(640px,calc(100% - 40px)); height: auto; max-height: calc(100dvh - 40px); border-radius: 28px; padding: clamp(24px,4vw,40px); transform: translate(-50%,-50%); transition: none; box-shadow: 0 24px 60px rgba(18,35,58,.18); }
 html[data-ui="v2"] .pc2-profile-overlay--share { inset: var(--profile-share-top,120px) auto auto var(--profile-share-left,48px); width: min(380px,calc(100% - 32px)); max-height: calc(100dvh - 32px); border: 1px solid #EDE7DE; border-radius: 20px; padding: 18px; transform: none; transition: none; box-shadow: 0 16px 40px rgba(18,35,58,.1); }
 html[data-ui="v2"] .pc2-profile-overlay--share::backdrop { background: transparent; }
}
html[data-ui="v2"] .pc2-profile-overlay.is-reduced, html[data-ui="v2"] .pc2-profile-overlay.is-reduced::backdrop { transition: none; }
@media (prefers-reduced-motion: reduce) { html[data-ui="v2"] .pc2-profile-overlay, html[data-ui="v2"] .pc2-profile-overlay::backdrop { transition: none; } }
</style>
