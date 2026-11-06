<template>
  <Teleport to="body">
    <dialog ref="dialog" class="pc2-schedule-dialog" :aria-label="label" @cancel.prevent="$emit('close')" @click="backdrop" @keydown="trap">
      <slot />
    </dialog>
  </Teleport>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
defineProps<{ label: string }>()
const emit = defineEmits<{ close: [] }>()
const dialog = ref<HTMLDialogElement | null>(null)
let opener: HTMLElement | null = null
let overflow: string | undefined
let alive = true
function trap(event: KeyboardEvent) {
  if (event.key !== 'Tab') return
  const controls = Array.from(dialog.value?.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href],[tabindex="0"]') || []).filter(el => !el.closest('[hidden],[inert]') && el.getClientRects().length)
  const first = controls[0], last = controls.at(-1)
  if (!first || !last) { event.preventDefault(); dialog.value?.focus(); return }
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
}
function backdrop(event: MouseEvent) {
  const el = dialog.value
  if (!el || event.target !== el) return
  const r = el.getBoundingClientRect()
  if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) emit('close')
}
onMounted(async () => {
  opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
  await nextTick()
  if (!alive || !dialog.value) return
  overflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
  dialog.value.showModal()
  dialog.value.querySelector<HTMLElement>('button[aria-label="Закрити"]')?.focus({ preventScroll: true })
  dialog.value.scrollTop = 0
})
onBeforeUnmount(() => {
  alive = false
  if (dialog.value?.open) dialog.value.close()
  if (overflow !== undefined) document.body.style.overflow = overflow
  if (opener?.isConnected) opener.focus({ preventScroll: true })
})
</script>

<style>
html[data-ui="v2"] dialog.pc2-schedule-dialog { position: fixed; inset: 0; margin: auto; width: min(560px,calc(100% - 32px)); height: fit-content; max-height: calc(100dvh - 32px); padding: 24px; border: 1px solid var(--pc-border-hair); border-radius: 24px; background: var(--pc-bg-card); color: var(--pc-text-main); overflow-y: auto; overscroll-behavior: contain; box-shadow: 0 24px 60px #12233a2e; }
html[data-ui="v2"] .pc2-schedule-dialog::backdrop { background: #12233a6b; }
html[data-ui="v2"] .pc2-schedule-dialog .pc2-schedule-dialog__close { min-width: 44px; height: 44px; flex-shrink: 0; border: 0; border-radius: 50%; color: var(--pc-text-main); background: var(--pc-bg-soft); font-size: 22px; cursor: pointer; }
html[data-ui="v2"] .pc2-schedule-dialog :focus-visible { outline: 3px solid var(--pc-navy-900); outline-offset: 3px; }
html[data-ui="v2"] .pc2-schedule-dialog .regular-sessions-modal__content { width: 100%; max-height: none; overflow: visible; padding: 0; border: 0; box-shadow: none; }
html[data-ui="v2"] .pc2-schedule-dialog > .pc2-schedule-dialog__close { float: right; margin-left: 8px; }
html[data-ui="v2"] .pc2-schedule-dialog .slot-form--create { display: flex; flex-direction: column; gap: 14px; }
html[data-ui="v2"] .pc2-schedule-dialog .input, html[data-ui="v2"] .pc2-schedule-dialog .btn, html[data-ui="v2"] .pc2-schedule-dialog .date-picker-trigger { min-height: 44px; }
html[data-ui="v2"] .pc2-schedule-dialog .date-picker-trigger { min-width: 44px; }
html[data-ui="v2"] .pc2-schedule-dialog .btn:not(.btn--ghost) { background: var(--pc-navy-900); color: #fff; box-shadow: none; }
html[data-ui="v2"] .pc2-schedule-dialog .date-picker-popover { width: 344px; max-width: calc(100vw - 32px); }
html[data-ui="v2"] .pc2-schedule-dialog .date-picker-grid { gap: 2px; }
html[data-ui="v2"] .pc2-schedule-dialog .date-picker-day { min-height: 44px; }
@media (max-width: 767px) { html[data-ui="v2"] dialog.pc2-schedule-dialog { inset: auto 0 0; margin: 0; width: 100%; max-width: none; max-height: 90dvh; padding: 18px 16px calc(24px + env(safe-area-inset-bottom)); border-radius: 28px 28px 0 0; } }
@media (prefers-reduced-motion: no-preference) { html[data-ui="v2"] .pc2-schedule-dialog[open] { animation: pc2-schedule-sheet-in .25s ease; } @keyframes pc2-schedule-sheet-in { from { opacity: 0; translate: 0 16px; } to { opacity: 1; translate: 0 0; } } }
</style>
