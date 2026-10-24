import { createApp, ref } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useProfileMotion } from './useProfileMotion'

describe('profile presentation timing lifecycle', () => {
 let change: () => void, hidden: boolean, media: { matches: boolean; addEventListener: ReturnType<typeof vi.fn>; removeEventListener: ReturnType<typeof vi.fn> }
 let dispose = () => {}
 const originalHidden = Object.getOwnPropertyDescriptor(document, 'hidden')
 beforeEach(() => {
  vi.useFakeTimers(); vi.spyOn(performance, 'now').mockImplementation(() => Date.now()); hidden = false
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden })
  media = { matches: false, addEventListener: vi.fn((_name, fn) => { change = fn }), removeEventListener: vi.fn() }
  vi.stubGlobal('matchMedia', vi.fn(() => media))
 })
 afterEach(() => { dispose(); vi.restoreAllMocks(); vi.useRealTimers(); vi.unstubAllGlobals(); if (originalHidden) Object.defineProperty(document, 'hidden', originalHidden); else Reflect.deleteProperty(document, 'hidden') })
 function mount() {
  const enabled = ref(true)
  let motion!: ReturnType<typeof useProfileMotion>
  const node = document.createElement('div'); document.body.append(node)
  const app = createApp({ setup() { motion = useProfileMotion(enabled); return () => null } }); app.mount(node)
  dispose = () => { app.unmount(); node.remove() }
  return { motion, enabled }
 }
 it('holds the exact 1400ms highlight and disposes its timer', () => {
  const { motion } = mount(); motion.highlight(); expect(motion.highlighted.value).toBe(true)
  vi.advanceTimersByTime(1399); expect(motion.highlighted.value).toBe(true)
  vi.advanceTimersByTime(1); expect(motion.highlighted.value).toBe(false); expect(vi.getTimerCount()).toBe(0)
 })
 it('pauses remaining time while hidden without catch-up', () => {
  const { motion } = mount(); motion.highlight(); vi.advanceTimersByTime(400)
  hidden = true; document.dispatchEvent(new Event('visibilitychange')); vi.advanceTimersByTime(9000)
  expect(motion.highlighted.value).toBe(true); expect(vi.getTimerCount()).toBe(0)
  hidden = false; document.dispatchEvent(new Event('visibilitychange')); vi.advanceTimersByTime(999); expect(motion.highlighted.value).toBe(true)
  vi.advanceTimersByTime(1); expect(motion.highlighted.value).toBe(false)
 })
 it('settles pending work immediately when reduced motion changes', () => {
  const { motion } = mount(); const callback = vi.fn(); motion.schedule(callback, 400)
  media.matches = true; change(); expect(callback).toHaveBeenCalledTimes(1); expect(vi.getTimerCount()).toBe(0)
  motion.highlight(); expect(motion.highlighted.value).toBe(false)
 })
 it('cancels pending callbacks on unmount and removes listeners', () => {
  const { motion } = mount(); const callback = vi.fn(); motion.schedule(callback, 400); dispose(); dispose = () => {}
  vi.runAllTimers(); expect(callback).not.toHaveBeenCalled(); expect(media.removeEventListener).toHaveBeenCalled()
 })
 it('does not schedule automatic work when disabled', async () => {
  const { motion, enabled } = mount(); motion.highlight(); enabled.value = false
  await Promise.resolve(); expect(vi.getTimerCount()).toBe(0); expect(motion.highlighted.value).toBe(false)
 })
})
