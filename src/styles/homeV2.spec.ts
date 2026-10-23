import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { parse } from '@vue/compiler-sfc'
import postcss from 'postcss'
import { describe, expect, it } from 'vitest'

const source = readFileSync('src/views/HomeView.vue', 'utf8')
const { descriptor } = parse(source)
const style = descriptor.styles.find((block) => !block.scoped)!
const css = postcss.parse(style.content)
const tokens = readFileSync('src/styles/tokens-v2.css', 'utf8')

describe('Home v2 CSS isolation', () => {
  it('keeps the supplied page decorations byte-identical to the verified snapshot', () => {
    const manifest = JSON.parse(readFileSync('docs/ui-v2/SNAPSHOT_MANIFEST.json', 'utf8')) as {
      sha256: string; files: Array<{ path: string; sha256: string }>
    }
    expect(manifest.sha256).toBe('265f221a95ac9fc521a33138b06376b51ad4a822c79fd05e30f7303ef6b10948')
    for (const name of ['mark-navy.png', 'mark-band.png']) {
      const digest = createHash('sha256').update(readFileSync(`src/assets/home-v2/${name}`)).digest('hex')
      expect(manifest.files.some((file) => file.path.endsWith(`/public/brand/${name}`) && file.sha256 === digest)).toBe(true)
    }
  })

  it('uses a single responsive bento and compact client strip with readable mint and peach text', () => {
    expect(style.content).toContain('grid-template-columns: repeat(4, minmax(0, 1fr))')
    expect(style.content).toContain('.pc2-home__feature--requests h3,')
    expect(style.content).toContain('.pc2-home__feature--requests .pc2-home__eyebrow { color: var(--pc-teal-ink); }')
    expect(style.content).toContain('.pc2-home__feature--payments .pc2-home__eyebrow { color: var(--pc-peach-ink); }')
    expect(style.content).not.toContain('var(--pc-text-soft)')
    expect(style.content).toContain('scroll-margin-top: var(--pc-header-anchor-offset)')
  })

  it('gates every selector, including responsive and reduced-motion branches, behind v2 and Home', () => {
    expect(style).toBeDefined()
    let count = 0
    css.walkRules((rule) => {
      for (const selector of rule.selectors) {
        expect(selector).toMatch(/^html\[data-ui="v2"\] \.pc2-home(?:[ _:.>#[]|$)/)
        count++
      }
    })
    expect(count).toBeGreaterThan(50)
    expect(style.content).not.toMatch(/@import|url\(|:root|!important/)
  })

  it('uses approved tokens for colors, typography, spacing and radii', () => {
    expect(style.content).not.toMatch(/#[a-f\d]{3,8}\b|rgba?\(/i)
    for (const match of style.content.matchAll(/var\((--pc-[a-z0-9-]+)\)/g)) expect(tokens).toContain(match[1] + ':')
    css.walkDecls((decl) => {
      if (['font-size', 'font-weight', 'border-radius', 'color', 'background'].includes(decl.prop)) expect(decl.value).toMatch(/var\(--pc-|inherit|none/)
    })
  })

  it('provides focus and reduced-motion rules without hiding Home sections', () => {
    expect(style.content).toContain(':focus-visible')
    expect(style.content).toContain('@media (prefers-reduced-motion: reduce)')
    expect(style.content).toContain('animation: none')
    expect(style.content).toContain('transition: none')
    css.walkDecls((decl) => {
      expect(decl.prop === 'opacity' && decl.value === '0').toBe(false)
      expect(decl.prop === 'visibility' && decl.value === 'hidden').toBe(false)
    })
    expect(descriptor.template!.content.split('<section v-else class="home-lite">')[0]).not.toContain('class="reveal')
  })
})
