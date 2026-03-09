export const BOOKING_SUCCESS_MESSAGES = {
  sessionBooked: 'Сесію заброньовано. Перевірте статус у кабінеті.',
  sessionConfirmed: 'Сесію підтверджено.',
  sessionCompleted: 'Сесію завершено.',
  sessionCancelled: 'Сесію скасовано.',
  sessionRescheduled: 'Сесію перенесено.',
  recurringSeriesCreated: 'Серію сесій створено.',
  rescheduleRequestSent: 'Запит на перенесення надіслано.',
  rescheduleRequestApproved: 'Запит на перенесення погоджено.',
  rescheduleRequestDeclined: 'Запит на перенесення відхилено.',
  noteSaved: 'Нотатку збережено.',
} as const

export const BOOKING_ERROR_FALLBACKS = {
  loadSession: 'Не вдалося завантажити сесію.',
  loadSessions: 'Не вдалося завантажити сесії.',
  bookSlot: 'Не вдалося забронювати вільне вікно.',
  confirmSession: 'Не вдалося підтвердити сесію.',
  completeSession: 'Не вдалося завершити сесію.',
  cancelSession: 'Не вдалося скасувати сесію.',
  rescheduleSession: 'Не вдалося перенести сесію.',
  createRecurringSession: 'Не вдалося створити серію сесій.',
  sendRescheduleRequest: 'Не вдалося надіслати запит на перенесення.',
  approveRescheduleRequest: 'Не вдалося погодити запит на перенесення.',
  declineRescheduleRequest: 'Не вдалося відхилити запит на перенесення.',
  loadSessionNote: 'Не вдалося завантажити нотатку.',
  saveSessionNote: 'Не вдалося зберегти нотатку.',
} as const

export const BOOKING_UI_MESSAGES = {
  onlyClientsCanBook: 'Бронювання доступне лише для клієнтів.',
  acceptSettingBeforeBooking: 'Підтвердьте правила перед бронюванням.',
  invalidDuration: 'Некоректна тривалість. Вкажіть 1–480 хв.',
} as const

export const BOOKING_RESCHEDULE_SUGGESTION_REASON_LABELS = {
  nearby_days: 'Найближчі дні',
  same_time_next_days: 'Той самий час у найближчі дні',
  same_weekday_next_week: 'Той самий день тижня наступного тижня',
  nearest_available: 'Найближче доступне вікно',
} as const

export function getSuggestionReasonLabel(reasonTag?: string | null) {
  if (!reasonTag) return ''
  return BOOKING_RESCHEDULE_SUGGESTION_REASON_LABELS[reasonTag as keyof typeof BOOKING_RESCHEDULE_SUGGESTION_REASON_LABELS] || reasonTag
}
