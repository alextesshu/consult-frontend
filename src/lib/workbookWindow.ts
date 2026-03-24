export function openClientWorkbookWindow(clientId: number) {
  if (!clientId || !Number.isFinite(clientId)) return

  const width = 1200
  const height = 900
  const left = Math.max(0, Math.round((window.screen.width - width) / 2))
  const top = Math.max(0, Math.round((window.screen.height - height) / 2))

  const href = `/cabinet/clients/${clientId}/workbook`
  const features = [
    `width=${width}`,
    `height=${height}`,
    `left=${left}`,
    `top=${top}`,
    'resizable=yes',
    'scrollbars=yes',
    'noopener=yes',
    'noreferrer=yes',
  ].join(',')

  const popup = window.open(href, `workbook-client-${clientId}`, features)
  if (popup) {
    popup.focus()
    return
  }

  window.open(href, '_blank', 'noopener,noreferrer')
}
