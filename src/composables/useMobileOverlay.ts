import { nextTick, onBeforeUnmount, watch, type Ref } from 'vue'

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

type Options = {
  open: Ref<boolean>
  panel: Ref<HTMLElement | null>
  trigger?: Ref<HTMLElement | null>
  // Element focused on open; defaults to the first focusable control in the panel.
  initialFocus?: Ref<HTMLElement | null>
  // Public-Mobile.dc.html overlays exist only below 768px; wider viewports close them.
  mobileQuery?: string
}

// Modal behaviour shared by the mobile filter sheet and the public menu:
// scroll lock, Escape, focus trap, focus return, and cleanup on unmount.
export function useMobileOverlay({ open, panel, trigger, initialFocus, mobileQuery = '(max-width: 767px)' }: Options) {
  let locked = false
  let previousHtmlOverflow = ''
  let previousBodyOverflow = ''
  let media: MediaQueryList | undefined

  function close() { open.value = false }
  function focusables() {
    return Array.from(panel.value?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])
      .filter((el) => !el.closest('[inert]') && el.getAttribute('aria-hidden') !== 'true')
  }
  function onKeydown(event: KeyboardEvent) {
    if (!open.value) return
    if (event.key === 'Escape') {
      event.preventDefault()
      close()
      return
    }
    if (event.key !== 'Tab') return
    const items = focusables()
    if (!items.length) { event.preventDefault(); panel.value?.focus(); return }
    const first = items[0]!
    const last = items[items.length - 1]!
    const active = document.activeElement as HTMLElement | null
    if (event.shiftKey && (active === first || !panel.value?.contains(active))) { event.preventDefault(); last.focus() }
    else if (!event.shiftKey && (active === last || !panel.value?.contains(active))) { event.preventDefault(); first.focus() }
  }
  function onMedia() { if (media && !media.matches) close() }
  function lock() {
    if (locked) return
    locked = true
    previousHtmlOverflow = document.documentElement.style.overflow
    previousBodyOverflow = document.body.style.overflow
    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKeydown)
    media = typeof window.matchMedia === 'function' ? window.matchMedia(mobileQuery) : undefined
    media?.addEventListener('change', onMedia)
  }
  function unlock() {
    if (!locked) return
    locked = false
    document.documentElement.style.overflow = previousHtmlOverflow
    document.body.style.overflow = previousBodyOverflow
    document.removeEventListener('keydown', onKeydown)
    media?.removeEventListener('change', onMedia)
    media = undefined
  }
  watch(open, async (value, previous) => {
    if (value) {
      lock()
      await nextTick()
      ;(initialFocus?.value ?? focusables()[0] ?? panel.value)?.focus()
    } else {
      unlock()
      if (previous) trigger?.value?.focus()
    }
  })
  onBeforeUnmount(unlock)
  return { close }
}
