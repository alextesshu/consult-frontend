import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import postcss from 'postcss'
import { describe, expect, it } from 'vitest'

const source = readFileSync(resolve(process.cwd(), 'src/views/ForClientsView.vue'), 'utf8')
const css = source.match(/<style scoped>([\s\S]*?)<\/style>/)![1]!

describe('For Clients CSS isolation', () => {
  it('gates every selector including responsive branches under html[data-ui=v2]', () => {
    postcss.parse(css).walkRules((rule) => {
      for (const selector of rule.selectors) expect(selector.trim()).toMatch(/^html\[data-ui="v2"\] \.pc2-for-clients/)
    })
  })
  it('reuses tokens and contains no prototype fonts, colors, scripts or hidden reveal states', () => {
    expect(css).not.toMatch(/#[0-9a-f]{3,8}\b|@import|opacity:\s*0|animation:|transition:/i)
    expect(source).not.toMatch(/support\.js|brand-listen\.js|<script src/)
    expect(css).toContain('var(--pc-font)')
    expect(css).toContain('var(--pc-teal-ink)')
    expect(css).toContain('outline-color: var(--pc-bg-card)')
  })
  it('stacks content without fixed heights or overflow concealment', () => {
    expect(css).toContain('@media (max-width: 767px)')
    expect(css).toContain('grid-template-columns: 1fr')
    postcss.parse(css).walkRules((rule) => {
      if (!rule.selector.includes('__sr')) expect(rule.toString()).not.toMatch(/overflow:\s*hidden/)
      if (rule.selector.includes('__hero') || rule.selector.includes('__profile-card')) {
        expect(rule.nodes.some((node) => node.type === 'decl' && node.prop === 'height')).toBe(false)
      }
    })
  })
  it('retains the approved avatar/detail/availability card structure and mobile slot row', () => {
    expect(css).toContain('grid-template-columns: 52px minmax(0, 1fr) auto')
    expect(css).toContain('@media (max-width: 639px)')
    expect(css).toContain('grid-column: 1 / -1')
    expect(css).toContain('minmax(min(100%, 400px), 1fr)')
    expect(css).toContain('var(--pc-header-row-h)')
  })
})
