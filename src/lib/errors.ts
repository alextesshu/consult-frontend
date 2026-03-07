export function getApiErrorMessage(err: unknown, fallback: string) {
  const fieldLabel = (field: string): string => {
    if (field === 'non_field_errors') return ''
    if (field === 'start_time') return 'Час початку'
    if (field === 'end_time') return 'Час завершення'
    if (field === 'date_from') return 'Дата початку'
    if (field === 'date_to') return 'Дата завершення'
    if (field === 'starts_at') return 'Початок'
    if (field === 'ends_at') return 'Завершення'
    return field
  }

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
      const label = field ? fieldLabel(field) : ''
      if (field && Array.isArray(messages) && messages[0]) {
        return label ? `${label}: ${messages[0]}` : String(messages[0])
      }
      if (field && typeof messages === 'string') {
        return label ? `${label}: ${messages}` : messages
      }
    }

    const message = (err as { message?: string }).message
    if (message) return message
  }
  return fallback
}
