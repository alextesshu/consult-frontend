import { readFileSync } from 'node:fs'
import postcss from 'postcss'
import { describe, expect, it } from 'vitest'
const text = readFileSync('src/styles/registrationP6.css', 'utf8')
describe('registration-owned P6 CSS', () => {
  it('cannot reach the public shell or v1 and retains the exact P6 dimensions', () => {
    postcss.parse(text).walkRules(rule => {
      expect(rule.selector.startsWith('html[data-ui="v2"] :is(.pc2-signup,.pc2-client-signup)')).toBe(true)
    })
    for (const required of ['height: 56px', 'height: 4px', 'gap: 6px', 'min-height: 44px', 'min-height: 54px', 'padding: 24px 20px 120px', 'font-size: 32px', 'position: fixed', 'env(safe-area-inset-bottom)', '.6s cubic-bezier(.4,0,.2,1)', 'prefers-reduced-motion']) expect(text).toContain(required)
  })
})
