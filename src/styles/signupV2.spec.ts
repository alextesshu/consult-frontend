import { readFileSync } from 'node:fs'
import { parse } from '@vue/compiler-sfc'
import postcss from 'postcss'
import { describe, expect, it } from 'vitest'

const { descriptor } = parse(readFileSync('src/views/SignupView.vue', 'utf8'))
const cssText = descriptor.styles.find((style) => !style.scoped)!.content
const css = postcss.parse(cssText)
const tokens = readFileSync('src/styles/tokens-v2.css', 'utf8')
function declarations(selector: string) {
  const result: Record<string, string> = {}
  css.walkRules((rule) => { if (rule.selectors.includes(selector)) rule.walkDecls((decl) => { result[decl.prop] = decl.value }) })
  return result
}
const root = 'html[data-ui="v2"] .pc2-signup'

describe('Signup v2 CSS contract', () => {
  it('isolates every selector, including media branches, to the opted-in signup page', () => {
    let count = 0
    css.walkRules((rule) => {
      for (const selector of rule.selectors) { expect(selector.startsWith(root)).toBe(true); count++ }
    })
    expect(count).toBeGreaterThan(30)
    expect(cssText).not.toMatch(/@import|url\(|!important|#[a-f\d]{3,8}\b|rgba?\(/i)
    for (const match of cssText.matchAll(/var\((--pc-[a-z0-9-]+)\)/g)) expect(tokens).toContain(match[1] + ':')
  })

  it('uses 54px auth controls, approved radii and a flat cream/navy composition', () => {
    expect(declarations(root + ' .pc2-input')).toMatchObject({ height: 'var(--pc-control-h-lg)', 'border-radius': 'var(--pc-radius-sm)', background: 'var(--pc-bg-card)' })
    expect(declarations(root + ' .btn')).toMatchObject({ 'min-height': 'var(--pc-control-h-lg)', background: 'var(--pc-navy-900)', color: 'var(--pc-bg-card)' })
    expect(declarations(root + ' .auth__card')['box-shadow']).toBe('none')
    expect(declarations(root + ' .auth__title')['font-weight']).toBe('var(--pc-fw-medium)')
    expect(declarations(root + '.auth').background).toBe('var(--pc-bg-main)')
    expect(cssText).not.toContain('gradient(')
  })

  it('keeps information cards top-aligned with content-driven height and no outer panel', () => {
    expect(declarations(root + '.auth')['align-items']).toBe('start')
    const aside = declarations(root + ' .auth__aside')
    expect(aside['justify-content']).toBe('flex-start')
    expect(aside.padding).toBe('0')
    expect(aside.background).toBe('transparent')
    for (const selector of [root + '.auth', root + ' .auth__aside']) {
      const values = declarations(selector)
      expect(values.height).toBeUndefined()
      expect(values['min-height']).toBeUndefined()
    }
  })

  it('provides navy keyboard focus, readable legal text, wrapping actions and reduced motion', () => {
    expect(declarations(root + ' :focus-visible')).toMatchObject({ outline: 'var(--pc-focus-width) solid var(--pc-navy-900)', 'outline-offset': 'var(--pc-focus-offset)' })
    expect(declarations(root + ' .auth__legal')).toMatchObject({ color: 'var(--pc-text-muted)', 'font-size': 'var(--pc-fs-small)' })
    expect(declarations(root + ' .btn')['white-space']).toBe('normal')
    expect(declarations(root + ' :is(input, button, a)')['scroll-margin-top']).toBe('var(--pc-header-anchor-offset)')
    expect(cssText).toContain('@media (prefers-reduced-motion: reduce)')
    expect(cssText).toContain('animation: none; transition: none')
    expect(cssText).toContain('grid-template-columns: minmax(0, 1fr)')
  })

  it('gives both account choices the same typography and dimensions on both pages', () => {
    const client = parse(readFileSync('src/views/ClientSignupView.vue', 'utf8')).descriptor
    const clientCss = postcss.parse(client.styles.find((style) => !style.scoped)!.content)
    const normalize = (sheet: typeof css, prefix: string) => {
      const values: Array<[string, string]> = []
      sheet.walkRules((rule) => {
        if (rule.selector.includes('pc2-account-types')) values.push([rule.selector.replace(prefix, 'PAGE'), rule.nodes.map((node) => node.toString()).join(';')])
      })
      return values
    }
    expect(normalize(css, root)).toEqual(normalize(clientCss, 'html[data-ui="v2"] .pc2-client-signup'))
    clientCss.walkRules((rule) => {
      for (const selector of rule.selectors) expect(selector.startsWith('html[data-ui="v2"] .pc2-client-signup')).toBe(true)
    })
    const selected = declarations(root + ' .pc2-account-types__option[aria-current="page"]')
    expect(Object.keys(selected).sort()).toEqual(['background', 'border-color'])
    expect(declarations(root + ' .pc2-account-types')['grid-template-columns']).toBe('repeat(2, minmax(0, 1fr))')
    expect(declarations(root + ' .pc2-account-types__option:focus-visible').outline).toBe('var(--pc-focus-width) solid var(--pc-navy-900)')
  })


  it('keeps account descriptions readable on both selected and unselected surfaces', () => {
    expect(declarations(root + ' .pc2-account-types__description').color).toBe('var(--pc-text-body)')
    const palette: Record<string, string> = {}
    postcss.parse(tokens).walkDecls((decl) => { if (decl.prop.startsWith('--pc-')) palette[decl.prop] = decl.value })
    const luminance = (hex: string) => {
      const channels = hex.slice(1).match(/../g)!.map((part) => {
        const value = parseInt(part, 16) / 255
        return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
      })
      return channels[0]! * 0.2126 + channels[1]! * 0.7152 + channels[2]! * 0.0722
    }
    const text = luminance(palette['--pc-text-body']!)
    for (const surface of ['--pc-bg-card', '--pc-bg-soft']) {
      const background = luminance(palette[surface]!)
      expect((Math.max(text, background) + 0.05) / (Math.min(text, background) + 0.05)).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('isolates the split client composition and uses approved controls, surfaces and motion', () => {
    const client = parse(readFileSync('src/views/ClientSignupView.vue', 'utf8')).descriptor
    const text = client.styles.find(style => !style.scoped)!.content
    const sheet = postcss.parse(text)
    const prefix = 'html[data-ui="v2"] .pc2-client-signup'
    sheet.walkRules(rule => { for (const selector of rule.selectors) expect(selector.startsWith(prefix)).toBe(true) })
    expect(text).not.toMatch(/@import|url\(|!important|#[a-f\d]{3,8}\b|rgba?\(/i)
    for (const match of text.matchAll(/var\((--pc-[a-z0-9-]+)\)/g)) expect(tokens).toContain(match[1] + ':')
    expect(text).toContain('height: var(--pc-control-h-lg)')
    expect(text).toContain('background: var(--pc-teal-100)')
    const previewText = ['.pc2-client-preview h2', '.pc2-client-preview__note', '.pc2-client-preview__disclaimer']
    for (const selector of previewText) {
      let color: string | undefined
      sheet.walkRules(rule => {
        if (rule.selectors.includes(prefix + ' ' + selector)) rule.walkDecls('color', decl => { color = decl.value })
      })
      expect(color).toBe('var(--pc-teal-ink)')
    }
    expect(text).toContain('grid-template-columns: repeat(2, minmax(0, 1fr))')
    expect(text).toContain('grid-template-columns: minmax(0, 1fr)')
    expect(text).toContain('@media (prefers-reduced-motion: reduce)')
    expect(text).toContain('outline: var(--pc-focus-width) solid var(--pc-navy-900)')
  })

})
