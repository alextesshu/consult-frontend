import { readFileSync } from 'node:fs'
import { parse } from '@vue/compiler-sfc'
import postcss from 'postcss'
import { describe, expect, it } from 'vitest'

// Contract against Public-Mobile.dc.html (snapshot claude-design-2026-10-23-4ff7cedd).
const SOURCE = 'docs/ui-v2/snapshots/2026-10-23-4ff7cedd/handoff/mockups/Public-Mobile.dc.html'
const source = readFileSync(SOURCE, 'utf8')
function sfc(path: string) {
  const { descriptor } = parse(readFileSync(path, 'utf8'))
  const global = descriptor.styles.filter((s) => !s.scoped).map((s) => s.content).join('\n')
  const scoped = descriptor.styles.filter((s) => s.scoped).map((s) => s.content).join('\n')
  return { descriptor, global, scoped, template: descriptor.template!.content }
}
// Collects declarations of rules nested in the < 768px media query.
function mobileRules(css: string) {
  const rules: string[] = []
  postcss.parse(css).walkAtRules('media', (at) => {
    if (at.params.replace(/\s/g, '') === '(max-width:767px)') at.walkRules((rule) => { rules.push(rule.toString()) })
  })
  return rules.join('\n')
}
const home = sfc('src/views/HomeView.vue')
const clients = sfc('src/views/ForClientsView.vue')
const discovery = sfc('src/views/PublicTherapistsView.vue')
const card = sfc('src/components/PublicSpecialistCard.vue')
const login = sfc('src/views/LoginView.vue')
const menu = sfc('src/components/PublicMobileMenuV2.vue')

describe('Public Mobile P1–P6 source contract', () => {
  it('reads the frozen v6.7 source rather than a copy', () => {
    expect(source).toContain('Пошук + лист фільтрів')
    for (const value of ['height:72%', 'transition:opacity .3s', 'transition:transform .4s cubic-bezier(.2,.8,.2,1)', "fY: S.f ? '0' : '105%'", 'width:72px;height:72px', 'width:44px', 'flex:0 0 82%', 'scroll-snap-type:x mandatory']) expect(source).toContain(value)
  })

  it('P1 hero mark, actions and snap strip use the source geometry below 768px', () => {
    const css = mobileRules(home.global)
    expect(css).toMatch(/\.pc2-home__listen \{ width: 72px; height: 72px;/)
    expect(css).toMatch(/\.pc2-home__hero-mark \{ inset: 14px; width: 44px; height: 44px; \}/)
    expect(css).toContain('scroll-snap-type: x mandatory')
    expect(css).toContain('flex: 0 0 82%; scroll-snap-align: start')
    expect(css).toMatch(/button\[aria-current="step"\] > span \{ width: 18px;/)
    expect(css).toContain('.pc2-home__actions { flex-direction: column')
    expect(home.template).toContain('Створити простір безкоштовно')
    expect(home.template).toContain(":to=\"{ hash: '#how-it-works' }\"")
    // The existing hero fennec is reused; no new image is introduced.
    expect(home.descriptor.scriptSetup!.content).not.toMatch(/mark-navy\.png['"]\s*\n?.*hero/)
  })

  it('P3 search card, topic strip and numbered steps follow the source', () => {
    const css = mobileRules(clients.scoped)
    expect(css).toContain('flex-direction: column; align-items: stretch; gap: 8px; min-height: 0; padding: 8px;')
    expect(css).toContain('border-radius: 22px')
    expect(css).toContain('flex-wrap: nowrap; gap: 6px; overflow-x: auto')
    expect(css).toContain('grid-template-columns: 32px minmax(0, 1fr)')
    expect(clients.template).toContain('Знайти спеціаліста')
  })

  it('P4 sheet keeps the exact source motion, height and backdrop', () => {
    const css = mobileRules(discovery.global)
    expect(css).toContain('height: 72%')
    expect(css).toContain('transform: translateY(105%); transition: transform .4s cubic-bezier(.2,.8,.2,1)')
    expect(css).toContain('background: rgb(18 35 58 / 42%); opacity: 0; transition: opacity .3s')
    expect(css).toContain('border-radius: 28px 28px 0 0')
    expect(css).toContain('transition: visibility 0s .4s')
    expect(css).toContain('position: sticky; top: var(--pc-header-h)')
    expect(discovery.global).toMatch(/@media \(max-width: 767px\) and \(prefers-reduced-motion: reduce\)/)
    expect(discovery.template).not.toMatch(/Ціна за сесію|Мова|Цього тижня|Найближче/)
  })

  it('P4 card is compact (64px photo, two topics) and P5 fields are 54px', () => {
    const cardCss = mobileRules(card.global)
    expect(cardCss).toContain('grid-template-columns: 64px minmax(0,1fr)')
    expect(cardCss).toContain('li:nth-child(n+3) { display: none; }')
    expect(card.template).not.toMatch(/Найближче/)
    expect(login.global).toContain('height: 54px')
    expect(mobileRules(login.global)).toContain('grid-template-columns: 1fr 1fr')
  })

  it('P2 menu uses 56px rows, 44px close target and bottom actions', () => {
    expect(menu.global).toContain('min-height: 56px')
    expect(menu.global).toContain('width: 44px; height: 44px')
    expect(menu.global).toContain('margin-top: auto')
  })

  it('P2 shell header is 60px with a 30px logo, one context action and a 44px burger below 768px only', () => {
    const shell = mobileRules(readFileSync('src/styles/components-v2.css', 'utf8'))
    expect(shell).toContain('.shell.shell--public-header-v2 { --pc-header-h: 60px; }')
    expect(shell).toContain('.pc2-brand-lockup { height: 30px; }')
    expect(shell).toContain('.nav > a:not(.pc2-header__mobile-action) { display: none; }')
    expect(shell).toContain('height: 40px; padding: 0 14px;')
    expect(shell).toContain('width: 44px; height: 44px;')
    // KAN-158 profile section nav follows the shell header height (76px desktop, 60px mobile guest v2).
    const profile = readFileSync('src/styles/publicProfileV2.css', 'utf8')
    expect(profile).not.toMatch(/pc2-profile-nav \{[^}]*top: 76px/)
    expect(profile.match(/\.pc2-profile-nav \{[^}]*top: var\(--pc-header-h\)/g)).toHaveLength(2)
    const app = readFileSync('src/App.vue', 'utf8')
    expect(app).toContain('<PublicMobileMenuV2')
    expect(app).toContain("PUBLIC_MOBILE_QUERY = '(max-width: 767px)'")
  })

  it('isolates every new global selector under html[data-ui="v2"] and keeps v1 scoped styles', () => {
    for (const [css, root] of [[login.global, '.pc2-login'], [menu.global, '.pc2-mobile-menu'], [discovery.global, '.pc2-discovery'], [card.global, '.pc2-specialist-card']] as const) {
      postcss.parse(css).walkRules((rule) => {
        if (rule.parent?.type === 'atrule' && (rule.parent as postcss.AtRule).name === 'keyframes') return
        for (const selector of rule.selectors) expect(selector.startsWith(`html[data-ui="v2"] ${root}`), selector).toBe(true)
      })
    }
    expect(login.scoped).toContain('.auth {')
    expect(login.global).toContain('@media (prefers-reduced-motion: reduce)')
  })

  it('links only to sections that exist on the target pages', () => {
    for (const id of ['how-it-works', 'features', 'pricing']) expect(home.template).toContain(`id="${id}"`)
    for (const id of ['clients-journey-title', 'clients-faq-title']) expect(clients.template).toContain(`id="${id}"`)
  })
})
