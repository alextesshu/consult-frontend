export function getApiErrorMessage(err: unknown, fallback: string) {
  if (err && typeof err === 'object') {
    const status = (err as { response?: { status?: number } }).response?.status
    const data = (err as { response?: { data?: unknown } }).response?.data

    if (status === 401) {
      return 'Сесія завершилась. Увійдіть знову.'
    }

    if (data && typeof data === 'object' && 'detail' in data) {
      const detail = (data as { detail?: string }).detail
      if (detail) return detail
    }

    if (typeof data === 'string' && data.trim()) {
      const text = data.trim()
      if (text.startsWith('<!DOCTYPE') || text.startsWith('<html')) {
        return 'Помилка сервера. Спробуйте пізніше.'
      }
      return text
    }

    if (data && typeof data === 'object') {
      const [field, messages] = Object.entries(data as Record<string, unknown>)[0] || []
      if (field && Array.isArray(messages) && messages[0]) {
        return `${field}: ${messages[0]}`
      }
      if (field && typeof messages === 'string') {
        return `${field}: ${messages}`
      }
    }

    const message = (err as { message?: string }).message
    if (message) return message
  }
  return fallback
}
