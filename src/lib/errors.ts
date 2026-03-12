export function getApiErrorMessage(err: unknown, fallback: string) {
  const detailLabel = (detail: string): string => {
    const mapped: Record<string, string> = {
      'Authentication required.': 'Потрібна авторизація.',
      'Session not found.': 'Сесію не знайдено.',
      'Session context required.': 'Контекст сесії відсутній.',
      'Slot not found.': 'Вільне вікно не знайдено.',
      'Slot already booked.': 'Це вільне вікно вже зайняте.',
      'Slot already booked and cannot be changed.':
        'Це вільне вікно вже заброньоване і не може бути змінене.',
      'Slot is in the past.': 'Неможливо обрати вікно в минулому.',
      'Slot belongs to a different specialist.': 'Вільне вікно належить іншому спеціалісту.',
      'Invalid status transition.': 'Цю дію неможливо виконати для поточного статусу сесії.',
      'Cannot cancel after start time.': 'Неможливо скасувати сесію після її початку.',
      'Cannot reschedule after start time.': 'Неможливо перенести сесію після її початку.',
      'Cannot reschedule within 12 hours of start time.':
        'Неможливо перенести сесію менш ніж за 12 годин до початку.',
      'Cannot reschedule to an earlier slot.': 'Неможливо перенести сесію на раніший час.',
      'Session overlaps with another booking.': 'Обраний час перетинається з іншою сесією.',
      'Reschedule request already pending.': 'Запит на перенесення вже очікує підтвердження.',
      'Request not found.': 'Запит не знайдено.',
      'Request is not pending.': 'Цей запит вже оброблено.',
      'Note not found.': 'Нотатку не знайдено.',
      'Review not found.': 'Відгук не знайдено.',
      'Invalid status.': 'Некоректний статус.',
      'No fields to update.': 'Немає полів для оновлення.',
      'Invalid session status.': 'Для цього статусу сесії дія недоступна.',
      'Reschedule requests are allowed only for confirmed sessions.':
        'Запит на перенесення доступний лише для підтверджених сесій.',
      'Use specialist_id or therapist_id, not both.':
        'Передайте або specialist_id, або therapist_id.',
      'Not allowed.': 'Недостатньо прав для цієї дії.',
      'Only clients can book sessions.': 'Бронювання доступне лише клієнтам.',
      'Clients only.': 'Ця дія доступна лише клієнту.',
      'Invalid status filter.': 'Некоректний фільтр статусу.',
      'Invalid date_from format. Use YYYY-MM-DD.':
        'Некоректний формат date_from. Використайте YYYY-MM-DD.',
      'Invalid date_to format. Use YYYY-MM-DD.':
        'Некоректний формат date_to. Використайте YYYY-MM-DD.',
      'actual_duration_minutes must be an integer.':
        'Тривалість має бути цілим числом хвилин.',
      'actual_duration_minutes must be between 1 and 480.':
        'Тривалість має бути в діапазоні 1–480 хвилин.',
      'Reviews allowed only for completed sessions.':
        'Відгук можна залишити лише після завершеної сесії.',
      'Review already exists.': 'Відгук для цієї сесії вже існує.',
      'Review text is required.': 'Текст відгуку є обовʼязковим.',
      'You already left a review for this specialist.':
        'Ви вже залишили відгук для цього спеціаліста.',
    }
    return mapped[detail] || detail
  }

  const fieldLabel = (field: string): string => {
    if (field === 'non_field_errors') return ''
    if (field === 'slot_id') return 'Вільне вікно'
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
      if (detail) return detailLabel(detail)
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
        const text = detailLabel(String(messages[0]))
        return label ? `${label}: ${text}` : text
      }
      if (field && typeof messages === 'string') {
        const text = detailLabel(messages)
        return label ? `${label}: ${text}` : text
      }
    }

    const message = (err as { message?: string }).message
    if (message) return message
  }
  return fallback
}
