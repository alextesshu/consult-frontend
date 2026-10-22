import { readFileSync } from 'node:fs'
import postcss, { type Rule } from 'postcss'
import { describe, expect, it } from 'vitest'

const gate = 'html[data-ui="v2"]'
const read = (path: string) => readFileSync(path, 'utf8')
const tokens = postcss.parse(read('src/styles/tokens-v2.css'))
const components = postcss.parse(read('src/styles/components-v2.css'))
function declarations(selector: string) {
  const values: Record<string, string> = {}
  for (const root of [tokens, components]) {
    root.walkRules((rule) => {
      if (rule.selectors.includes(selector)) rule.walkDecls((decl) => { values[decl.prop] = decl.value })
    })
  }
  return values
}
const vars = declarations(gate)
const resolve = (value: string): string => value.replace(/var\((--[\w-]+)\)/g, (_, key: string) => vars[key] ?? '')
function luminance(hex: string) {
  const channels = hex.replace('#', '').match(/../g)!.map((part) => {
    const value = parseInt(part, 16) / 255
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  })
  return channels[0]! * 0.2126 + channels[1]! * 0.7152 + channels[2]! * 0.0722
}
function contrast(a: string, b: string) {
  const [low, high] = [luminance(a), luminance(b)].sort((x, y) => x - y)
  return (high! + 0.05) / (low! + 0.05)
}

describe('UI v2 CSS contract', () => {
  it('uses approved header dimensions and guest-only resets for legacy chrome', () => {
    expect(vars['--pc-header-h']).toBe('76px')
    expect(vars['--pc-header-logo-h']).toBe('40px')
    expect(vars['--pc-header-row-h']).toBe('44px')
    const guest = declarations(`${gate} .pc2-header.topbar--guest`)
    expect(guest.background).toBe('var(--pc-bg-main)')
    expect(guest['box-shadow']).toBe('none')
    expect(guest['backdrop-filter']).toBe('none')
    expect(declarations(`${gate} .pc2-header.topbar--guest::after`).display).toBe('none')
    const focus = declarations(`${gate} .pc2-header.topbar--guest a:focus-visible`)
    expect(resolve(focus.outline!)).toBe('2px solid #12345a')
    expect(resolve(focus['outline-offset']!)).toBe('2px')
  })

  it('preserves accessible CTA colors despite legacy guest navigation selectors', () => {
    const selector = `${gate} .pc2-header.topbar--guest .nav a.pc2-btn--primary`
    for (const state of ['', ':hover', ':active']) {
      const style = { ...declarations(selector), ...declarations(`${selector}${state}`) }
      expect(contrast(resolve(style.color!), resolve(style.background!))).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('gates every selector branch, including nested media queries, away from v1', () => {
    let count = 0
    for (const root of [tokens, components]) {
      root.walkRules((rule) => {
        for (const selector of rule.selectors) {
          expect(selector.startsWith(gate), selector).toBe(true)
          count++
        }
      })
    }
    expect(count).toBeGreaterThan(60)
    document.documentElement.dataset.ui = 'v1'
    document.body.innerHTML = '<a class="pc2-btn pc2-btn--primary">Action</a><input class="pc2-input">'
    try {
      for (const root of [tokens, components]) {
        root.walkRules((rule) => {
          for (const selector of rule.selectors) expect(document.querySelector(selector)).toBeNull()
        })
      }
    } finally {
      document.body.innerHTML = ''
      delete document.documentElement.dataset.ui
    }
  })

  it('does not globally repaint existing anchors or introduce external CSS dependencies', () => {
    for (const root of [tokens, components]) {
      root.walkRules((rule) => {
        expect(rule.selectors).not.toContain(`${gate} a`)
        expect(rule.selectors).not.toContain(`${gate} a:hover`)
      })
      expect(root.toString()).not.toMatch(/@import|url\(/)
    }
  })

  it('keeps primary/secondary button-link colors legible in their interactive states', () => {
    for (const state of ['', ':hover', ':active']) {
      const base = declarations(`${gate} .pc2-btn--primary`)
      const style = { ...base, ...declarations(`${gate} .pc2-btn--primary${state}`) }
      expect(contrast(resolve(style.color!), resolve(style.background!))).toBeGreaterThanOrEqual(4.5)
    }
    const secondary = declarations(`${gate} .pc2-btn--secondary`)
    expect(contrast(resolve(secondary.color!), vars['--pc-bg-main']!)).toBeGreaterThanOrEqual(4.5)
    const hover = declarations(`${gate} .pc2-btn--secondary:hover`)
    expect(contrast(resolve(hover.color!), resolve(hover.background!))).toBeGreaterThanOrEqual(4.5)
  })

  it('preserves the keyboard outline after input outline resets', () => {
    expect(declarations(`${gate} :focus-visible`).outline).toContain('var(--pc-navy-900)')
    const input = declarations(`${gate} .pc2-input:focus-visible`)
    expect(resolve(input.outline!)).toBe('2px solid #12345a')
    expect(resolve(input['outline-offset']!)).toBe('2px')
    expect(declarations(`${gate} .pc2-input:focus`)['box-shadow']).toBe('var(--pc-ring)')
  })

  it('uses readable existing tokens for placeholders, kickers and inactive navigation', () => {
    for (const selector of ['.pc2-input::placeholder', '.pc2-kicker', '.pc2-header__link']) {
      const color = resolve(declarations(`${gate} ${selector}`).color!)
      for (const bg of ['--pc-bg-main', '--pc-bg-card']) {
        expect(contrast(color, vars[bg]!)).toBeGreaterThanOrEqual(4.5)
      }
    }
  })

  it('limits reduced motion overrides to v2, including pseudo-elements', () => {
    const rules: Rule[] = []
    tokens.walkAtRules('media', (media) => {
      if (media.params === '(prefers-reduced-motion: reduce)') media.walkRules((rule) => { rules.push(rule) })
    })
    expect(rules).toHaveLength(1)
    expect(rules[0]!.selectors).toEqual([`${gate} *`, `${gate} *::before`, `${gate} *::after`])
    for (const property of ['animation-duration', 'transition-duration']) {
      expect(rules[0]!.nodes.some((node) => node.type === 'decl' && node.prop === property && node.value === '1ms' && node.important)).toBe(true)
    }
  })

  it('imports v2 styles after legacy CSS, preserves Inter and uses a non-blocking font fallback', () => {
    const main = read('src/main.ts')
    expect(main.indexOf("import './style.css'")).toBeLessThan(main.indexOf("import './styles/tokens-v2.css'"))
    expect(main.indexOf("import './styles/tokens-v2.css'")).toBeLessThan(main.indexOf("import './styles/components-v2.css'"))
    expect(read('src/style.css')).toContain('family=Inter:')
    const html = read('index.html')
    expect(html.match(/family=Onest:/g)).toHaveLength(1)
    expect(html).toContain('Onest:wght@400;500;600&display=swap')
    expect(vars['--pc-font']).toContain('system-ui')
    expect(read('.env.example')).toMatch(/^VITE_UI_V2=$/m)
  })
})
