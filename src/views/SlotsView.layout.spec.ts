import { readFileSync } from 'node:fs'
import postcss from 'postcss'
import { describe, expect, it } from 'vitest'

const source = readFileSync('src/views/SlotsView.vue', 'utf8')
const css = postcss.parse(source.slice(source.indexOf('<style scoped>') + '<style scoped>'.length, source.indexOf('</style>')))

// jsdom has no layout engine: resolve this local cascade, then measure actual
// document/button bounds and calendar scrolling in the Chromium acceptance.
function declarations(selector: string, width: number) {
  const values: Record<string, string> = {}
  css.walkRules(rule => {
    if (!rule.selectors.includes(selector)) return
    let parent = rule.parent
    while (parent && parent.type !== 'root') {
      if (parent.type === 'atrule' && parent.name === 'media') {
        for (const match of parent.params.matchAll(/(max|min)-width:\s*(\d+)px/g)) {
          if (match[1] === 'max' ? width > Number(match[2]) : width < Number(match[2])) return
        }
      }
      parent = parent.parent
    }
    rule.walkDecls(declaration => { values[declaration.prop] = declaration.value })
  })
  return values
}

describe('schedule mobile containment', () => {
  it.each([375, 380, 390, 520])('keeps seven full-width day buttons inside shrinkable grid tracks at %ipx', width => {
    const days = declarations('.day-list', width)
    expect(days.display).toBe('grid')
    expect(days['grid-template-columns']).toBe('repeat(7, minmax(0, 1fr))')
    expect(declarations('.day-list .btn', width)['min-width']).toBe('0')
  })

  it('preserves the wider mobile day scroller and desktop calendar scroll container', () => {
    expect(declarations('.day-list', 640)['overflow-x']).toBe('auto')
    expect(declarations('.day-list', 768)['overflow-x']).toBe('auto')
    expect(declarations('.calendar-scroll', 1280).overflow).toBe('auto')
    expect(declarations('.week-calendar', 1280)['min-width']).toBe('700px')
  })
})
