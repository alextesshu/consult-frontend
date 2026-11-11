import { describe, expect, it, vi } from 'vitest'
import { focusProfilePanelTarget, handleProfilePanelTab, revealProfilePanelTarget } from './profilePanelScroll'

function elements(top: number, bottom: number) {
  const panel = document.createElement('aside')
  const field = document.createElement('input')
  panel.append(field)
  Object.defineProperty(panel, 'clientHeight', { value: 400 })
  vi.spyOn(panel, 'getBoundingClientRect').mockReturnValue({ top: 96 } as DOMRect)
  vi.spyOn(field, 'getBoundingClientRect').mockReturnValue({ top, bottom, height: bottom - top } as DOMRect)
  return { panel, field }
}

describe('profile panel scroll ownership', () => {
  it('moves between controls with local focus but does not trap Tab at the end', () => {
    const { panel, field } = elements(200, 248)
    const region = document.createElement('div')
    region.className = 'pc2-profile-inline'
    panel.append(region)
    region.append(field)
    const button = document.createElement('button')
    region.append(button)
    vi.spyOn(field, 'getClientRects').mockReturnValue([{}] as unknown as DOMRectList)
    vi.spyOn(button, 'getClientRects').mockReturnValue([{}] as unknown as DOMRectList)
    const focus = vi.spyOn(button, 'focus')
    panel.addEventListener('keydown', event => handleProfilePanelTab(panel, event))
    const tab = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true })
    field.dispatchEvent(tab)
    expect(tab.defaultPrevented).toBe(true)
    expect(focus).toHaveBeenCalledWith({ preventScroll: true })
    const exit = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true })
    button.dispatchEvent(exit)
    expect(exit.defaultPrevented).toBe(false)
  })
  it('reveals below-panel content without scrolling document ancestors', () => {
    const { panel, field } = elements(500, 548)
    const focus = vi.spyOn(field, 'focus')
    const documentScroll = vi.spyOn(window, 'scrollTo')
    focusProfilePanelTarget(panel, field)
    expect(focus).toHaveBeenCalledWith({ preventScroll: true })
    expect(panel.scrollTop).toBe(64)
    expect(documentScroll).not.toHaveBeenCalled()
    documentScroll.mockRestore()
  })
  it('reveals content above the panel and leaves an already visible field alone', () => {
    const { panel, field } = elements(50, 98)
    panel.scrollTop = 200
    revealProfilePanelTarget(panel, field)
    expect(panel.scrollTop).toBe(142)
    const visible = elements(200, 248)
    visible.panel.scrollTop = 100
    revealProfilePanelTarget(visible.panel, visible.field)
    expect(visible.panel.scrollTop).toBe(100)
  })
  it('includes the field label and validation message in the visible region', () => {
    const { panel, field } = elements(400, 448)
    const label = document.createElement('label')
    label.className = 'setting-label'
    panel.append(label)
    label.append(field)
    vi.spyOn(label, 'getBoundingClientRect').mockReturnValue({ top: 380, bottom: 540, height: 160 } as DOMRect)
    revealProfilePanelTarget(panel, field)
    expect(panel.scrollTop).toBe(56)
  })
})
