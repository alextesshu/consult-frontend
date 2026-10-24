import { readFileSync } from 'node:fs'
import postcss from 'postcss'
import { describe, expect, it } from 'vitest'

const css = readFileSync('src/styles/cabinetShellV2.css', 'utf8')
const mockups = 'docs/ui-v2/snapshots/2026-10-23-4ff7cedd/handoff/mockups/'
const dashboard = readFileSync(`${mockups}Cabinet-Dashboard.dc.html`, 'utf8')
const mobile = readFileSync(`${mockups}Cabinet-Mobile.dc.html`, 'utf8')
const drawer = readFileSync(`${mockups}Cabinet-Drawer.dc.html`, 'utf8')
function media(query: string) {
  let text = ''
  postcss.parse(css).walkAtRules('media', (at) => { if (at.params === query) text += at.toString() })
  return text
}

describe('Specialist cabinet shell v2 CSS contract', () => {
  it('copies sidebar values from Cabinet-Dashboard.dc.html', () => {
    for (const value of ['grid-template-columns:220px minmax(0,1fr)', 'padding:20px 12px;border-right:1px solid #EDE7DE', 'padding:8px 12px;border-radius:12px;font-size:14px', 'transition:box-shadow .2s" style-hover="box-shadow:inset 0 0 0 1px #D4CCC2', 'background:#F7B77E;color:#12233A;font-size:11px;font-weight:600']) expect(dashboard).toContain(value)
    expect(css).toContain('grid-template-columns: 220px minmax(0, 1fr)')
    expect(css).toContain('padding: 20px 12px; overflow-y: auto; border-right: 1px solid var(--pc-border-hair)')
    expect(css).toContain('padding: 8px 12px; border-radius: 12px; color: var(--pc-text-body); font-size: 14px; text-decoration: none; transition: box-shadow .2s')
    expect(css).toContain('box-shadow: inset 0 0 0 1px var(--pc-border-strong)')
    expect(css).toContain('background: var(--pc-peach-500); color: var(--pc-text-main); font-size: 11px; font-weight: 600')
  })

  it('copies M1 tab bar and M2 sheet geometry and the drawer motion', () => {
    expect(mobile).toContain('height:80px;padding:8px 8px 22px;background:#fff;border-top:1px solid #EDE7DE;display:grid;grid-template-columns:repeat(5,1fr)')
    expect(mobile).toContain('border-radius:24px 24px 0 0;background:#FBF9F5;padding:10px 16px 30px')
    expect(drawer).toContain('background:rgba(18,35,58,.28);opacity:{{ bo }};transition:opacity .32s ease')
    expect(drawer).toContain('transition:transform .4s cubic-bezier(.2,.8,.2,1)')
    const m = media('(max-width: 767px)')
    for (const value of ['grid-template-columns: repeat(5, 1fr); padding: 8px 8px max(22px, env(safe-area-inset-bottom))', 'border-radius: 24px 24px 0 0', 'padding: 10px 16px calc(30px + env(safe-area-inset-bottom))',
      'background: rgb(18 35 58 / 28%); opacity: 0; transition: opacity .32s ease', 'transform: translateY(105%); transition: transform .4s cubic-bezier(.2,.8,.2,1)', 'grid-template-columns: 1fr 1fr; gap: 8px', 'min-height: 52px', 'min-height: 48px',
      '--pc2-cab-header-h: 52px', 'width: 36px; height: 36px']) expect(m).toContain(value)
  })

  it('keeps the fixed tab bar off content, sticky save bars and the scroll-to-top button', () => {
    const m = media('(max-width: 767px)')
    expect(m).toContain('padding: 4px 16px calc(var(--pc2-cab-tabbar-h) + env(safe-area-inset-bottom) + 24px)')
    expect(m).toContain('.shell--cabinet-v2 .sticky-save-bar { bottom: calc(var(--pc2-cab-tabbar-h)')
    expect(m).toContain('.shell--cabinet-v2 .scroll-top-btn { bottom: calc(var(--pc2-cab-tabbar-h)')
    // Below existing modals (z-index 50–1000), above page content.
    expect(m).toContain('z-index: 40; display: grid')
    expect(m).toContain('z-index: 48; display: block')
  })

  it('gates every selector to UI v2 cabinet chrome and supports reduced motion', () => {
    postcss.parse(css).walkRules((rule) => {
      for (const selector of rule.selectors) expect(selector, selector).toMatch(/^html\[data-ui="v2"\] (\.shell--cabinet-v2|\.pc2-cabinet-)/)
    })
    expect(css).toContain('@media (prefers-reduced-motion: reduce)')
    expect(css).not.toMatch(/@import|url\(|!important/)
    const tokens = readFileSync('src/styles/tokens-v2.css', 'utf8')
    for (const match of css.matchAll(/var\((--pc-[\w-]+)\)/g)) expect(tokens).toContain(`${match[1]}:`)
  })
})
