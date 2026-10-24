import { onBeforeUnmount, ref, type Ref } from 'vue'

// Public-Mobile.dc.html P1: horizontal snap cards with pagination dots.
// The active dot follows the real scroll position; dots scroll to a card.
export function useSnapStrip(track: Ref<HTMLElement | null>) {
  const index = ref(0)
  let frame: number | undefined

  function cards() {
    return Array.from(track.value?.children ?? []) as HTMLElement[]
  }
  function measure() {
    frame = undefined
    const el = track.value
    if (!el) return
    const items = cards()
    if (!items.length) return
    const start = items[0]!.offsetLeft
    let nearest = 0
    let distance = Infinity
    items.forEach((item, i) => {
      const delta = Math.abs(item.offsetLeft - start - el.scrollLeft)
      if (delta < distance) { distance = delta; nearest = i }
    })
    // The last card cannot reach the start edge; at the scroll end it is the active one.
    if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 2) nearest = items.length - 1
    index.value = nearest
  }
  function onScroll() {
    if (frame !== undefined) return
    frame = requestAnimationFrame(measure)
  }
  function scrollTo(next: number) {
    const el = track.value
    const item = cards()[next]
    if (!el || !item) return
    const reduced = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollTo({ left: item.offsetLeft - cards()[0]!.offsetLeft, behavior: reduced ? 'auto' : 'smooth' })
    index.value = next
  }
  onBeforeUnmount(() => {
    if (frame !== undefined) cancelAnimationFrame(frame)
    frame = undefined
  })
  return { index, onScroll, scrollTo, measure }
}
