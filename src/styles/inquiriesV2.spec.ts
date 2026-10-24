import { readFileSync } from 'node:fs'
import postcss from 'postcss'
import { describe, expect, it } from 'vitest'

const css = readFileSync('src/styles/inquiriesV2.css', 'utf8')
describe('inquiry v2 isolation and source motion', () => {
  it('scopes every presentation rule to the opt-in page and never hides shared navigation', () => {
    postcss.parse(css).walkRules(rule => {
      if (rule.parent?.type === 'atrule' && rule.parent.name === 'keyframes') return
      for (const selector of rule.selectors) expect(selector.startsWith('html[data-ui="v2"] .pc2-inquiries')).toBe(true)
    })
    expect(css).not.toMatch(/\.pc2-cabinet|\.shell--|\.footer|(?:^|})\s*(?:html|body)\s*\{/m)
  })
  it('preserves source breakpoints, internal scrolling, timing and reduced-motion support', () => {
    for (const value of ['max-width: 1023px', 'max-width: 767px', 'minmax(280px,360px) minmax(0,1fr)', 'overflow: auto', 'max-height .4s ease .35s,opacity .3s ease .3s', '.35s cubic-bezier(.2,.8,.2,1)', 'prefers-reduced-motion: reduce', 'transition: none; animation: none']) expect(css).toContain(value)
    const toastSelector = 'html[data-ui="v2"] .pc2-inquiries .pc2-inquiries__toast'
    let reducedToastAnimation: string | undefined
    postcss.parse(css).walkRules(rule => {
      if (rule.parent?.type === 'atrule' && rule.parent.params.includes('prefers-reduced-motion') && rule.selectors.includes(toastSelector)) {
        rule.walkDecls('animation', declaration => { reducedToastAnimation = declaration.value })
      }
    })
    expect(reducedToastAnimation).toBe('none')
  })
})
