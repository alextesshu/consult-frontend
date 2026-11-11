/** Reveal only the profile panel's contents; never scroll ancestor documents. */
export function revealProfilePanelTarget(panel: HTMLElement, target: HTMLElement) {
  const bounds = panel.getBoundingClientRect()
  const rect = (target.closest<HTMLElement>('.setting-label') ?? target).getBoundingClientRect()
  const top = bounds.top + panel.clientTop + 12
  const bottom = bounds.top + panel.clientTop + panel.clientHeight - 12
  if (rect.top < top || rect.height > bottom - top) panel.scrollTop += rect.top - top
  else if (rect.bottom > bottom) panel.scrollTop += rect.bottom - bottom
}

export function focusProfilePanelTarget(panel: HTMLElement, target: HTMLElement) {
  target.focus({ preventScroll: true })
  revealProfilePanelTarget(panel, target)
}

/** Use local focus scrolling between form controls; retain normal Tab exit. */
export function handleProfilePanelTab(panel: HTMLElement, event: KeyboardEvent) {
  if (event.key !== 'Tab' || event.altKey || event.ctrlKey || event.metaKey) return
  const current = event.target instanceof HTMLElement ? event.target : null
  const form = current?.closest<HTMLElement>('.pc2-profile-inline')
  if (!form) return
  const candidates = Array.from(form.querySelectorAll<HTMLElement>('button,input,select,textarea,a[href],[tabindex]'))
    .filter(el => el.tabIndex >= 0 && !el.matches(':disabled') && !el.closest('[inert],[hidden]') && el.getClientRects().length)
  const controls = candidates.filter(el => {
    if (!(el instanceof HTMLInputElement) || el.type !== 'radio' || !el.name) return true
    const group = candidates.filter((item): item is HTMLInputElement => item instanceof HTMLInputElement && item.type === 'radio' && item.name === el.name)
    return el === (group.find(item => item.checked) ?? group[0])
  })
  const index = controls.indexOf(current!)
  const next = controls[index + (event.shiftKey ? -1 : 1)]
  if (!next) return
  event.preventDefault()
  focusProfilePanelTarget(panel, next)
}
