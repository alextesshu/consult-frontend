import { readFileSync } from 'node:fs'
import postcss from 'postcss'
import { describe, expect, it } from 'vitest'
const all = readFileSync('src/styles/components-v2.css', 'utf8')
const text = all.slice(all.indexOf('/* Stage 2.1:'))
const css = postcss.parse(text)
const root = 'html[data-ui="v2"] .pc2-public-profile'
const tokens = readFileSync('src/styles/tokens-v2.css', 'utf8')
function declarations(selector: string) {
  const result: Record<string, string> = {}
  css.walkRules(rule => { if (rule.selectors.includes(selector)) rule.walkDecls(decl => { result[decl.prop] = decl.value }) })
  return result
}
describe('public profile v2 CSS contract', () => {
  it('isolates every new selector including mobile, hover and reduced motion', () => {
    css.walkRules(rule => { for (const selector of rule.selectors) expect(selector.startsWith(root)).toBe(true) })
    expect(text).not.toMatch(/@import|url\(|#[a-f\d]{3,8}\b|font-weight:\s*[789]00|gradient\(/i)
    for (const match of text.matchAll(/var\((--pc-[a-z0-9-]+)\)/g)) expect(tokens + text).toContain(match[1] + ':')
  })
  it('uses a 380px flat sticky request panel with token spacing', () => {
    expect(declarations(root + '.public')['--pc-profile-request-width']).toBe('380px')
    expect(declarations(root + ' .public__layout')['grid-template-columns']).toBe('minmax(0, 1fr)')
    expect(text).toContain('grid-template-columns: minmax(0, 1fr) var(--pc-profile-request-width)')
    expect(text).toContain('top: var(--pc-space-24)')
    expect(declarations(root + ' .public__sidebar.pc2-request-panel')['box-shadow']).toBe('none')
    expect(declarations(root + ' .pc2-profile-inline > .setting-modal__backdrop').display).toBe('none')
  })
  it('keeps keyboard focus, readable button states, safe areas and reduced motion', () => {
    expect(declarations(root + ' :focus-visible').outline).toBe('var(--pc-focus-width) solid var(--pc-navy-900)')
    expect(text).toContain('@media (max-width: 859px)')
    expect(text).toContain('max-height: calc(100dvh - var(--pc-space-8))')
    expect(text).toContain('@media (prefers-reduced-motion: reduce)')
    expect(text).toContain('animation: none; transition: none; scroll-behavior: auto')
    expect(declarations(root + ' :is(.public__sidebar, .setting-modal, .public__grid) .btn--primary:hover:not(:disabled)')).toMatchObject({ background: 'var(--pc-navy-950)', color: 'var(--pc-bg-card)' })
  })
})
