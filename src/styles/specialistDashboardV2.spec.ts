import { readFileSync } from 'node:fs'
import postcss from 'postcss'
import { describe, expect, it } from 'vitest'

const css = readFileSync('src/styles/specialistDashboardV2.css', 'utf8')
const source = readFileSync('docs/ui-v2/snapshots/2026-10-23-4ff7cedd/handoff/mockups/Cabinet-Dashboard.dc.html', 'utf8')
const mobile = readFileSync('docs/ui-v2/snapshots/2026-10-23-4ff7cedd/handoff/mockups/Cabinet-Mobile.dc.html', 'utf8')
const view = readFileSync('src/views/CabinetView.vue', 'utf8')

describe('Specialist dashboard v2 CSS contract (Cabinet-Dashboard.dc.html)', () => {
  it('reads the frozen source for the values it copies', () => {
    for (const value of ['transition:opacity .6s ease,transform .8s cubic-bezier(.2,.7,.2,1)', 'transition:opacity .6s ease .15s', 'transition:opacity .6s ease .25s', 'font-size:88px', 'stroke-dasharray:113.10', 'transition:opacity .9s ease', 'minmax(min(100%,380px),1fr)']) expect(source).toContain(value)
    expect(mobile).toContain('width:118px')
  })
  it('keeps the source motion: reveal, delays, ring, pulse and skeleton', () => {
    expect(css).toContain('transition: opacity .6s ease, transform .8s var(--pc2-dash-ease), background .6s ease')
    expect(css).toContain('--pc2-dash-ease: cubic-bezier(.2,.7,.2,1)')
    expect(css).toContain('transition: opacity .6s ease .15s, transform .8s var(--pc2-dash-ease) .15s')
    expect(css).toContain('transition: opacity .6s ease .25s, transform .8s var(--pc2-dash-ease) .25s')
    expect(css).toContain('transform: translateY(16px) scale(.985)')
    expect(css).toContain('stroke-dasharray: 113.10; transition: stroke-dashoffset .8s var(--pc2-dash-ease)')
    expect(css).toContain('.pc2-dashboard__pulse.is-dim { opacity: .3; }')
    expect(css).toContain('.pc2-dashboard__skeleton.is-dim { opacity: .55; }')
  })
  it('keeps the source geometry on desktop and the M1 composition below 768px', () => {
    expect(css).toContain('font-size: 88px')
    expect(css).toContain('grid-template-columns: repeat(auto-fit, minmax(min(100%, 380px), 1fr))')
    expect(css).toContain('grid-template-columns: repeat(auto-fit, minmax(150px, 1fr))')
    let mobileRules = ''
    postcss.parse(css).walkAtRules('media', (at) => { if (at.params === '(max-width: 767px)') mobileRules = at.toString() })
    for (const value of ['font-size: 26px', 'font-size: 40px', 'grid-template-columns: 1fr 1fr', 'width: 118px', 'height: 44px', 'overflow-x: auto']) expect(mobileRules).toContain(value)
  })
  it('gates every selector behind html[data-ui="v2"] .pc2-dashboard and supports reduced motion', () => {
    postcss.parse(css).walkRules((rule) => {
      for (const selector of rule.selectors) expect(selector.startsWith('html[data-ui="v2"] .pc2-dashboard'), selector).toBe(true)
    })
    expect(css).toContain('@media (prefers-reduced-motion: reduce)')
    expect(css).not.toMatch(/@import|url\(|!important/)
    const tokens = readFileSync('src/styles/tokens-v2.css', 'utf8')
    for (const match of css.matchAll(/var\((--pc-[\w-]+)\)/g)) expect(tokens).toContain(`${match[1]}:`)
  })
  it('never renders unsupported source data or in-place mutations', () => {
    const template = view.slice(0, view.indexOf('<section v-else class="cabinet">'))
    expect(template).not.toMatch(/7-ма сесія|Остання нотатка|Скасувати|Прийняти|Інший час|Опублікувати профіль|maria-koval/)
    expect(view).toContain("import fennecSymbol from '../assets/brand-v2/proconsult-fennec-symbol-blue.svg'")
  })
})
