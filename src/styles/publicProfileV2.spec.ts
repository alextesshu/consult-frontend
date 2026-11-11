import { readFileSync } from 'node:fs'
import postcss, { type Rule } from 'postcss'
import { describe, expect, it } from 'vitest'
const text = readFileSync('src/styles/publicProfileV2.css', 'utf8')
const overlay = readFileSync('src/components/public-profile/PublicProfileOverlay.vue', 'utf8').split('<style>')[1]!.split('</style>')[0]!

describe('public profile v6.6 presentation boundaries', () => {
 it('uses list separators and retains 44px copy targets plus a narrow-card full-value fallback', () => {
  const sheet = postcss.parse(text)
  const row = sheet.nodes.find((node): node is Rule => node.type === 'rule' && node.selector.endsWith(' .pc2-profile-contacts__row'))!
  expect(row.nodes).toEqual(expect.arrayContaining([
    expect.objectContaining({ prop: 'border', value: '0' }),
    expect.objectContaining({ prop: 'border-radius', value: '0' }),
    expect.objectContaining({ prop: 'background', value: 'transparent' }),
  ]))
  const action = sheet.nodes.find((node): node is Rule => node.type === 'rule' && node.selector === 'html[data-ui="v2"] .pc2-public-profile .pc2-profile-contacts__action')!
  expect(action.nodes).toContainEqual(expect.objectContaining({ prop: 'min-height', value: '44px' }))
  expect(text).toContain('.pc2-profile-contacts__row + .pc2-profile-contacts__row { border-top: 1px solid')
  expect(text).toContain('@container pc2-profile-contacts (max-width: 340px)')
 })
 it('keeps selected offer text readable independently of legacy child colors and disabled opacity', () => {
  const sheet = postcss.parse(text)
  const activeText = sheet.nodes.filter((node): node is Rule => node.type === 'rule' && node.selector.includes('.guest-offer-option--active') && node.selector.includes('.guest-offer-option__label'))
  expect(activeText).toHaveLength(1)
  expect(activeText[0]!.selector).toContain('.guest-offer-option__meta')
  expect(activeText[0]!.nodes).toEqual(expect.arrayContaining([expect.objectContaining({ prop: 'color', value: 'var(--pc-bg-card)' })]))
  const disabled = sheet.nodes.find((node): node is Rule => node.type === 'rule' && node.selector.endsWith('.guest-offer-option:disabled'))!
  expect(disabled.nodes).toEqual(expect.arrayContaining([expect.objectContaining({ prop: 'opacity', value: '1' }), expect.objectContaining({ prop: 'border-style', value: 'dashed' })]))
  const summary = sheet.nodes.find((node): node is Rule => node.type === 'rule' && node.selector.includes('.guest-offer-summary__eyebrow') && node.selector.includes('.guest-offer-summary__meta'))!
  expect(summary.nodes).toEqual(expect.arrayContaining([expect.objectContaining({ prop: 'color', value: 'var(--pc-text-body)' })]))
 })
 it('isolates all page and overlay rules behind v2 profile selectors', () => {
  for (const sheet of [text, overlay]) postcss.parse(sheet).walkRules(rule => {
   for (const selector of rule.selectors) expect(selector.startsWith('html[data-ui="v2"] .pc2-')).toBe(true)
  })
  expect(readFileSync('src/styles/components-v2.css', 'utf8')).not.toContain('.pc2-public-profile')
 })
 it('shows the full short description and keeps the contacts card out of the contact step in UI v2', () => {
  const sheet = postcss.parse(text)
  const lead = sheet.nodes.find((node): node is Rule => node.type === 'rule' && node.selector === 'html[data-ui="v2"] .pc2-public-profile .hero-main__lead--teaser')!
  expect(lead.nodes).toEqual(expect.arrayContaining([
    expect.objectContaining({ prop: '-webkit-line-clamp', value: 'unset' }),
    expect.objectContaining({ prop: 'overflow', value: 'visible' }),
  ]))
  expect(text).not.toContain('.pc2-request-panel--contact > .pc2-profile-contacts')
  expect(text).toContain('.pc2-profile-booking-column > .pc2-profile-contacts')
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
