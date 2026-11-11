import { nextTick, onScopeDispose, watch, type Ref } from 'vue'

// Calendar-only modal lifecycle. Other project overlays keep their existing utilities.
const FOCUSABLE = 'a[href],button,input,select,textarea,[tabindex]'
const inertOwners = new Map<HTMLElement, { count: number; original: string | null }>()
const panels: HTMLElement[] = []
let scrollLocks = 0
let htmlOverflow = ''
let bodyOverflow = ''

export function useCalendarDialog(options: {
  open: Readonly<Ref<boolean>>
  panel: Readonly<Ref<HTMLElement | null>>
  close: () => void
  trigger?: () => HTMLElement | null
  initialFocus?: () => HTMLElement | null
  restoreFocus?: () => boolean
}) {
  let generation = 0
  let lockedPanel: HTMLElement | null = null
  let trigger: HTMLElement | null = null
  let inert: HTMLElement[] = []
  const top = () => lockedPanel !== null && panels[panels.length - 1] === lockedPanel
  function focusables() {
    return Array.from(lockedPanel?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []).filter((el) => {
      if (el.tabIndex < 0 || el.matches(':disabled') || el.closest('[inert],[hidden],[aria-hidden="true"]')) return false
      for (let node: HTMLElement | null = el; node; node = node.parentElement) {
        const style = getComputedStyle(node)
        if (style.display === 'none' || style.visibility === 'hidden') return false
        if (node === lockedPanel) break
      }
      return true
    })
  }
  function focusFirst() { (options.initialFocus?.() ?? focusables()[0] ?? lockedPanel)?.focus({ preventScroll: true }) }
  function keydown(event: KeyboardEvent) {
    if (!top()) return
    if (event.key === 'Escape') {
      event.preventDefault(); event.stopPropagation(); options.close(); return
    }
    if (event.key !== 'Tab') return
    const items = focusables(), first = items[0], last = items[items.length - 1]
    const active = document.activeElement
    if (!first || !last) { event.preventDefault(); lockedPanel?.focus(); return }
    if (event.shiftKey && (active === first || !lockedPanel?.contains(active) || active === lockedPanel)) {
      event.preventDefault(); last.focus()
    } else if (!event.shiftKey && (active === last || !lockedPanel?.contains(active) || active === lockedPanel)) {
      event.preventDefault(); first.focus()
    }
  }
  function focusin(event: FocusEvent) {
    if (top() && event.target instanceof Node && !lockedPanel?.contains(event.target)) focusFirst()
  }
  function unlock() {
    if (!lockedPanel) return
    document.removeEventListener('keydown', keydown, true)
    document.removeEventListener('focusin', focusin)
    const index = panels.indexOf(lockedPanel)
    if (index !== -1) panels.splice(index, 1)
    for (const el of inert) {
      const owner = inertOwners.get(el)
      if (!owner) continue
      owner.count -= 1
      if (!owner.count) {
        if (owner.original === null) el.removeAttribute('inert')
        else el.setAttribute('inert', owner.original)
        inertOwners.delete(el)
      }
    }
    inert = []
    lockedPanel = null
    scrollLocks -= 1
    if (!scrollLocks) {
      document.documentElement.style.overflow = htmlOverflow
      document.body.style.overflow = bodyOverflow
    }
    const target = options.trigger?.() ?? trigger
    if (options.restoreFocus?.() !== false && target?.isConnected && !target.closest('[inert]')) target.focus({ preventScroll: true })
    trigger = null
  }
  async function lock() {
    const ticket = ++generation
    trigger = options.trigger?.() ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null)
    await nextTick()
    if (ticket !== generation || !options.open.value || !options.panel.value) return
    lockedPanel = options.panel.value
    panels.push(lockedPanel)
    if (scrollLocks++ === 0) {
      htmlOverflow = document.documentElement.style.overflow
      bodyOverflow = document.body.style.overflow
      document.documentElement.style.overflow = 'hidden'
      document.body.style.overflow = 'hidden'
    }
    // Inert sibling subtrees at every ancestor; keep this dialog's backdrop clickable.
    const backdrop = lockedPanel.previousElementSibling?.matches('.pc2-cal__backdrop') ? lockedPanel.previousElementSibling : null
    for (let node: HTMLElement | null = lockedPanel; node && node !== document.body; node = node.parentElement) {
      for (const sibling of Array.from(node.parentElement?.children ?? [])) {
        if (!(sibling instanceof HTMLElement) || sibling === node || sibling === backdrop) continue
        const owner = inertOwners.get(sibling)
        if (owner) owner.count += 1
        else { inertOwners.set(sibling, { count: 1, original: sibling.getAttribute('inert') }); sibling.setAttribute('inert', '') }
        inert.push(sibling)
      }
    }
    document.addEventListener('keydown', keydown, true)
    document.addEventListener('focusin', focusin)
    focusFirst()
  }
  watch(options.open, (open) => {
    if (open) void lock()
    else { generation += 1; unlock() }
  }, { immediate: true, flush: 'post' })
  onScopeDispose(() => { generation += 1; unlock() })
}
