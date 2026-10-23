import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { parse } from '@vue/compiler-sfc'
import postcss from 'postcss'
import { describe, expect, it } from 'vitest'
const styles = [
  ['src/views/PublicTherapistsView.vue', '.pc2-discovery'],
  ['src/components/PublicSpecialistCard.vue', '.pc2-specialist-card'],
].map(([path, root]) => {
  const { descriptor } = parse(readFileSync(path!, 'utf8'))
  return { path: path!, root: `html[data-ui="v2"] ${root}`, descriptor, css: postcss.parse(descriptor.styles.find(s => !s.scoped)!.content) }
})
describe('Discovery Claude v5 CSS and v1 isolation', () => {
  it.each(styles)('isolates selectors and animation names in $path', ({ css, root }) => {
    css.walkRules(rule => {
      if (rule.parent?.type === 'atrule' && (rule.parent as postcss.AtRule).name === 'keyframes') return
      for (const selector of rule.selectors) expect(selector.startsWith(root), selector).toBe(true)
    })
    css.walkAtRules('keyframes', rule => { expect(rule.params).toMatch(/^pc2Discovery/) })
    expect(css.toString()).not.toMatch(/@import|url\(|!important/)
    const tokens = readFileSync('src/styles/tokens-v2.css', 'utf8')
    for (const match of css.toString().matchAll(/var\((--pc-[\w-]+)\)/g)) expect(tokens).toContain(`${match[1]}:`)
  })
  it.each(styles)('preserves the complete v1 scoped stylesheet in $path', ({ path, descriptor }) => {
    const hashes: Record<string, string> = { 'src/views/PublicTherapistsView.vue': '6e5c7c4475a77d0c11b3b536e5f4426591a995bcc84602154e7ed50678d159cb', 'src/components/PublicSpecialistCard.vue': '2d0000702d8e8f3ea05ffd1842df6e93de0eb3cc9d087e4f8f82023a0bd9ff7e' }
    expect(createHash('sha256').update(descriptor.styles.find(s => s.scoped)!.content).digest('hex')).toBe(hashes[path])
  })
  it('preserves exact source transitions, responsive card geometry and neutral contract row', () => {
    const view = styles[0]!.css.toString(), card = styles[1]!.css.toString()
    for (const text of ['opacity .4s ease, transform .4s ease', 'opacity .3s ease, transform .3s ease', 'opacity .45s ease', 'transform .55s cubic-bezier(.2,.8,.2,1)', 'grid-template-rows .4s ease', '1.8s cubic-bezier(.2,.6,.3,1)', '3.2s ease-in-out']) expect(view).toContain(text)
    expect(view).toContain('repeat(auto-fill,minmax(min(100%,520px),1fr))')
    expect(card).toContain('grid-template-columns: 112px minmax(0,1fr)')
    expect(card).toContain('grid-template-columns: 72px minmax(0,1fr)')
    expect(card).toContain('border-radius: 24px')
    expect(styles[1]!.descriptor.template!.content).toContain('У профілі спеціаліста')
    expect(styles[1]!.descriptor.template!.content).not.toMatch(/Найближче вікно|Найкращий|рейтинг/)
  })
  it('provides local reduced motion, readable placeholders and keyboard focus', () => {
    for (const { css } of styles) { expect(css.toString()).toContain('prefers-reduced-motion: reduce'); expect(css.toString()).toContain(':focus-visible') }
    expect(styles[0]!.css.toString()).toContain('color: var(--pc-text-muted); pointer-events: none')
    expect(styles[0]!.css.toString()).toContain('.pc2-discovery.is-reduced *')
    expect(styles[0]!.css.toString()).toContain('.pc2-specialist-card:focus-visible { opacity: 1; transform: none; transition: none; }')
    expect(styles[0]!.css.toString()).not.toContain('IntersectionObserver')
  })
})
