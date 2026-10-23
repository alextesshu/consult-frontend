import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { parse } from '@vue/compiler-sfc'
import postcss from 'postcss'
import { describe, expect, it } from 'vitest'
const { descriptor } = parse(readFileSync('src/views/HomeView.vue', 'utf8'))
const style = descriptor.styles.find(block => !block.scoped)!
const css = postcss.parse(style.content)

describe('Home v5 motion and CSS isolation', () => {
  it('preserves the source decoration and approved symbol bytes', () => {
    for (const name of ['mark-navy.png', 'mark-band.png']) {
      const digest = (path: string) => createHash('sha256').update(readFileSync(path)).digest('hex')
      expect(digest(`src/assets/home-v2/${name}`)).toBe(digest(`docs/ui-v2/snapshots/2026-10-23-7570f1ad/handoff/mockups/public/brand/${name}`))
    }
    expect(descriptor.scriptSetup!.content).toContain("../assets/brand-v2/proconsult-fennec-symbol-blue.svg")
  })
  it('isolates all normal selectors and owns uniquely named keyframes', () => {
    css.walkRules(rule => {
      if (rule.parent?.type === 'atrule' && (rule.parent as postcss.AtRule).name === 'keyframes') return
      for (const selector of rule.selectors) expect(selector).toMatch(/^html\[data-ui="v2"\] \.pc2-home(?:[ _:.>#[]|$)/)
    })
    css.walkAtRules('keyframes', rule => { expect(rule.params).toMatch(/^pc2Home/) })
    expect(style.content).not.toMatch(/@import|url\(|:root|!important/)
  })
  it('preserves exact source motion curves and readable token colors', () => {
    for (const motion of ['3.2s cubic-bezier(.2,.6,.3,1)', '3.2s ease-in-out', 'width 1s cubic-bezier(.4,0,.2,1)', 'all .6s cubic-bezier(.2,.7,.2,1)', 'all .8s cubic-bezier(.2,.7,.2,1)', 'grid-template-rows .6s ease', 'width .9s ease', 'opacity .8s ease, transform .8s ease', 'transform .35s ease', 'transform .3s ease']) expect(style.content).toContain(motion)
    expect(style.content).not.toMatch(/#[a-f\d]{3,8}\b|var\(--pc-text-soft\)/i)
    const tokens = readFileSync('src/styles/tokens-v2.css', 'utf8')
    for (const match of style.content.matchAll(/var\((--pc-[a-z0-9-]+)\)/g)) expect(tokens).toContain(match[1] + ':')
  })
  it('provides local reduced motion, focus and reveal fallbacks', () => {
    expect(style.content).toContain(':focus-visible')
    expect(style.content).toContain('@media (prefers-reduced-motion: reduce)')
    expect(style.content).toContain('.pc2-home.is-reduced *')
    expect(style.content).toContain('.pc2-home__reveal.is-seen { opacity: 1; transform: translateY(0); }')
    expect(style.content).toContain('scroll-margin-top: var(--pc-header-anchor-offset)')
  })
})
