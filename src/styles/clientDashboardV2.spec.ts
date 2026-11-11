import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { parse } from '@vue/compiler-sfc'
import postcss from 'postcss'
import { describe, expect, it } from 'vitest'

const source = readFileSync('src/views/ClientDashboardView.vue', 'utf8')
const { descriptor } = parse(source)
const text = descriptor.styles.find((s) => !s.scoped)!.content
const css = postcss.parse(text)
const root = 'html[data-ui="v2"] .pc2-client-dashboard'
const tokens = readFileSync('src/styles/tokens-v2.css', 'utf8')
function declarations(selector: string) {
  const result: Record<string, string> = {}
  css.walkRules((rule) => {
    if (rule.parent?.type !== 'atrule' && rule.selectors.includes(selector)) rule.walkDecls((decl) => { result[decl.prop] = decl.value })
  })
  return result
}

describe('Client dashboard v2 CSS contract', () => {
  it('gates every selector and nested media branch, using only existing tokens', () => {
    let count = 0
    css.walkRules((rule) => { for (const selector of rule.selectors) { expect(selector.startsWith(root), selector).toBe(true); count++ } })
    expect(count).toBeGreaterThan(40)
    expect(text).not.toMatch(/@import|url\(|#[a-f\d]{3,8}\b|rgba?\(|gradient\(|!important/i)
    for (const match of text.matchAll(/var\((--pc-[\w-]+)\)/g)) expect(tokens).toContain(`${match[1]}:`)
  })

  it('preserves the complete v1 scoped stylesheet', () => {
    expect(createHash('sha256').update(descriptor.styles.find((s) => s.scoped)!.content).digest('hex')).toBe('51a830028fc91373411a87881bc54038ce6f30ccc8535beef15697d5c082971f')
  })

  it('uses a 24px hero, 16px interactive material cards and Onest', () => {
    expect(declarations(root)['align-items']).toBe('start')
    expect(declarations(`${root} .therapist-photo-link--viewed`).width).toBe('var(--pc-control-h)')
    expect(declarations(root)['font-family']).toBe('var(--pc-font)')
    expect(declarations(`${root} .client__hero`)['border-radius']).toBe('var(--pc-radius-lg)')
    expect(declarations(`${root} .pc2-client-dashboard__material`)['border-radius']).toBe('var(--pc-radius-md)')
    expect(declarations(`${root} .title`)['font-weight']).toBe('var(--pc-fw-medium)')
    expect(declarations(`${root} .pc2-client-dashboard__material:hover`)['box-shadow']).toBe('var(--pc-shadow-sm)')
  })

  it('keeps session/payment tones separate and avoids the low-contrast warning text token', () => {
    expect(declarations(`${root} .pc2-tag--warning`).color).toBe('var(--pc-peach-ink)')
    expect(declarations(`${root} .pc2-tag--success`).color).toBe('var(--pc-success)')
    expect(declarations(`${root} .pc2-tag--info`).color).toBe('var(--pc-info)')
    expect(declarations(`${root} .pc2-tag`)['text-transform']).toBe('none')
  })

  it('provides visible keyboard focus, responsive grids and reduced-motion support', () => {
    expect(declarations(`${root} :is(a, button):focus-visible`).outline).toBe('var(--pc-focus-width) solid var(--pc-navy-900)')
    expect(declarations(`${root} .pc2-client-dashboard__hero--session a:focus-visible`)['outline-color']).toBe('var(--pc-bg-card)')
    expect(declarations(`${root} .pc2-client-dashboard__material-grid`)['grid-template-columns']).toContain('min(100%')
    expect(tokens).toContain('@media (prefers-reduced-motion: reduce)')
    expect(text).not.toMatch(/\border\s*:/)
  })
})
