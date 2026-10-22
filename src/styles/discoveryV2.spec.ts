import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { parse } from '@vue/compiler-sfc'
import postcss from 'postcss'
import { describe, expect, it } from 'vitest'

const gate = 'html[data-ui="v2"]'
const files = [
  ['src/views/PublicTherapistsView.vue', '.pc2-discovery'],
  ['src/components/PublicSpecialistCard.vue', '.pc2-specialist-card'],
] as const
const tokens = readFileSync('src/styles/tokens-v2.css', 'utf8')
const styles = files.map(([path, root]) => {
  const { descriptor } = parse(readFileSync(path, 'utf8'))
  return { path, root: `${gate} ${root}`, descriptor, css: postcss.parse(descriptor.styles.find((s) => !s.scoped)!.content) }
})
function declarations(index: number, selector: string) {
  const result: Record<string, string> = {}
  styles[index]!.css.walkRules((rule) => {
    if (rule.parent?.type !== 'atrule' && rule.selectors.includes(selector)) rule.walkDecls((decl) => { result[decl.prop] = decl.value })
  })
  return result
}

describe('Discovery v2 CSS contract', () => {
  it.each(styles)('isolates every selector and uses existing tokens in $path', ({ css, root }) => {
    let count = 0
    css.walkRules((rule) => {
      for (const selector of rule.selectors) { expect(selector.startsWith(root), selector).toBe(true); count++ }
    })
    expect(count).toBeGreaterThan(10)
    expect(css.toString()).not.toMatch(/@import|url\(|#[a-f\d]{3,8}\b|rgba?\(|gradient\(|!important/i)
    for (const match of css.toString().matchAll(/var\((--pc-[\w-]+)\)/g)) expect(tokens).toContain(`${match[1]}:`)
  })

  it.each(styles)('preserves the complete v1 scoped stylesheet in $path', ({ path, descriptor }) => {
    const baselineHashes: Record<string, string> = {"src/views/PublicTherapistsView.vue": "6e5c7c4475a77d0c11b3b536e5f4426591a995bcc84602154e7ed50678d159cb", "src/components/PublicSpecialistCard.vue": "2d0000702d8e8f3ea05ffd1842df6e93de0eb3cc9d087e4f8f82023a0bd9ff7e"}
    const legacy = descriptor.styles.find((s) => s.scoped)!.content
    expect(createHash('sha256').update(legacy).digest('hex')).toBe(baselineHashes[path])
  })

  it('uses approved typography, interactive 16px cards and mint ink', () => {
    const card = styles[1]!.root
    expect(declarations(1, card)).toMatchObject({
      'border-radius': 'var(--pc-radius-md)', 'box-shadow': 'none', 'font-family': 'var(--pc-font)',
      padding: 'var(--pc-space-6)',
    })
    expect(declarations(1, `${card}:hover`)).toMatchObject({ transform: 'none', 'box-shadow': 'var(--pc-shadow-sm)' })
    expect(declarations(1, `${card} .result-card__name`)['font-weight']).toBe('var(--pc-fw-medium)')
    expect(declarations(1, `${card} .result-card__topics li`)).toMatchObject({ background: 'var(--pc-teal-100)', color: 'var(--pc-teal-ink)' })
    expect(declarations(0, `${styles[0]!.root} .pc2-discovery__guide`)).toMatchObject({ background: 'var(--pc-teal-100)', color: 'var(--pc-teal-ink)' })
  })

  it('keeps visible focus, readable placeholders and wrapping layouts', () => {
    expect(declarations(1, `${styles[1]!.root}:focus-visible`).outline).toBe('var(--pc-focus-width) solid var(--pc-navy-900)')
    expect(declarations(0, `${styles[0]!.root} .input::placeholder`).color).toBe('var(--pc-text-muted)')
    expect(declarations(0, `${styles[0]!.root} .result-list`)['grid-template-columns']).toContain('min(100%')
    expect(declarations(0, `${styles[0]!.root} .request-group-controls__mobile`).display).toBe('none')
    expect(tokens).toContain('@media (prefers-reduced-motion: reduce)')
  })
})
