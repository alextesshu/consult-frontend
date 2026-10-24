import { readFileSync } from 'node:fs'
import postcss from 'postcss'
import { describe, expect, it } from 'vitest'
const text = readFileSync('src/styles/publicProfileV2.css', 'utf8')
const overlay = readFileSync('src/components/public-profile/PublicProfileOverlay.vue', 'utf8').split('<style>')[1]!.split('</style>')[0]!

describe('public profile v6.6 presentation boundaries', () => {
 it('isolates all page and overlay rules behind v2 profile selectors', () => {
  for (const sheet of [text, overlay]) postcss.parse(sheet).walkRules(rule => {
   for (const selector of rule.selectors) expect(selector.startsWith('html[data-ui="v2"] .pc2-')).toBe(true)
  })
  expect(readFileSync('src/styles/components-v2.css', 'utf8')).not.toContain('.pc2-public-profile')
 })
 it('preserves the independently scrolling desktop request panel and source highlight', () => {
  expect(text).toContain('max-height: calc(100dvh - 112px)')
  expect(text).toContain('overscroll-behavior: contain')
  expect(text).toContain('transition: box-shadow .6s ease')
  expect(text).toContain('0 0 0 4px rgba(143,203,200,.45)')
 })
 it('retains source mobile sheet, backdrop and About motion rather than generic fades', () => {
  expect(overlay).toContain('height: 86dvh')
  expect(overlay).toContain('transform .4s cubic-bezier(.2,.8,.2,1)')
  expect(overlay).toContain('transition: background .3s')
  expect(overlay).toContain('height: 100dvh')
 })
 it('keeps source accordion timings and mobile safe areas', () => {
  expect(text).toContain('grid-template-rows .45s ease')
  expect(text).toContain('grid-template-rows .4s ease')
  expect(text).toContain('transform .3s,background .3s')
  expect(text).toContain('env(safe-area-inset-bottom)')
  expect(text).toContain('scroll-snap-type: x mandatory')
 })
 it('preserves reduced-motion and keyboard overrides without public asset imports', () => {
  expect(text).toContain('@media (prefers-reduced-motion: reduce)')
  expect(overlay).toContain('outline: 2px solid #12345A')
  expect(text + overlay).not.toMatch(/@import|url\(/)
 })
})
