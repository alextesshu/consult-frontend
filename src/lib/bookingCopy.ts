import { getApiErrorMessage } from './errors'

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
  workbookSaved: 'Приватний зошит збережено.',
} as const

export const BOOKING_ERROR_FALLBACKS = {
  loadSession: 'Не вдалося завантажити сесію.',
  loadSessions: 'Не вдалося завантажити сесії.',
  loadGroupEvents: 'Не вдалося завантажити групові події.',
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
  loadWorkbook: 'Не вдалося завантажити приватний зошит.',
  saveWorkbook: 'Не вдалося зберегти приватний зошит.',
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

const BOOKING_ERROR_CODE_MESSAGES: Record<string, string> = {
  SLOT_OVERLAP: '\u0412\u0456\u043b\u044c\u043d\u0435 \u0432\u0456\u043a\u043d\u043e \u043f\u0435\u0440\u0435\u0442\u0438\u043d\u0430\u0454\u0442\u044c\u0441\u044f \u0437 \u0443\u0436\u0435 \u0456\u0441\u043d\u0443\u044e\u0447\u0438\u043c.',
  SLOT_NOT_FOUND: '\u0412\u0456\u043b\u044c\u043d\u0435 \u0432\u0456\u043a\u043d\u043e \u043d\u0435 \u0437\u043d\u0430\u0439\u0434\u0435\u043d\u043e.',
  SLOT_LOCKED_BOOKED:
    '\u0426\u0435 \u0432\u0456\u043b\u044c\u043d\u0435 \u0432\u0456\u043a\u043d\u043e \u0432\u0436\u0435 \u0437\u0430\u0431\u0440\u043e\u043d\u044c\u043e\u0432\u0430\u043d\u0435 \u0456 \u043d\u0435 \u043c\u043e\u0436\u0435 \u0431\u0443\u0442\u0438 \u0437\u043c\u0456\u043d\u0435\u043d\u0435.',
  SLOT_ALREADY_BOOKED: '\u0426\u0435 \u0432\u0456\u043b\u044c\u043d\u0435 \u0432\u0456\u043a\u043d\u043e \u0432\u0436\u0435 \u0437\u0430\u0439\u043d\u044f\u0442\u0435.',
  SLOT_IN_PAST: '\u041d\u0435\u043c\u043e\u0436\u043b\u0438\u0432\u043e \u043e\u0431\u0440\u0430\u0442\u0438 \u0432\u0456\u043a\u043d\u043e \u0432 \u043c\u0438\u043d\u0443\u043b\u043e\u043c\u0443.',
  SLOT_SPECIALIST_MISMATCH:
    '\u0412\u0456\u043b\u044c\u043d\u0435 \u0432\u0456\u043a\u043d\u043e \u043d\u0430\u043b\u0435\u0436\u0438\u0442\u044c \u0456\u043d\u0448\u043e\u043c\u0443 \u0441\u043f\u0435\u0446\u0456\u0430\u043b\u0456\u0441\u0442\u0443.',
  SESSION_NOT_FOUND: '\u0421\u0435\u0441\u0456\u044e \u043d\u0435 \u0437\u043d\u0430\u0439\u0434\u0435\u043d\u043e.',
  REQUEST_NOT_FOUND: '\u0417\u0430\u043f\u0438\u0442 \u043d\u0435 \u0437\u043d\u0430\u0439\u0434\u0435\u043d\u043e.',
  REQUEST_ALREADY_PENDING:
    '\u0417\u0430\u043f\u0438\u0442 \u043d\u0430 \u043f\u0435\u0440\u0435\u043d\u0435\u0441\u0435\u043d\u043d\u044f \u0432\u0436\u0435 \u043e\u0447\u0456\u043a\u0443\u0454 \u0440\u043e\u0437\u0433\u043b\u044f\u0434\u0443.',
  SESSION_OVERLAP:
    '\u041e\u0431\u0440\u0430\u043d\u0438\u0439 \u0447\u0430\u0441 \u043f\u0435\u0440\u0435\u0442\u0438\u043d\u0430\u0454\u0442\u044c\u0441\u044f \u0437 \u0456\u043d\u0448\u043e\u044e \u0441\u0435\u0441\u0456\u0454\u044e.',
  TIME_CONFLICT: '\u041d\u0430 \u0446\u0435\u0439 \u0447\u0430\u0441 \u0443 \u0432\u0430\u0441 \u0432\u0436\u0435 \u0454 \u0456\u043d\u0448\u0430 \u0441\u0435\u0441\u0456\u044f.',
  NOT_YOUR_SESSION: '\u0426\u044f \u0441\u0435\u0441\u0456\u044f \u043d\u0435\u0434\u043e\u0441\u0442\u0443\u043f\u043d\u0430 \u0434\u043b\u044f \u0432\u0430\u0441.',
  NOT_YOUR_CLIENT: '\u041a\u043b\u0456\u0454\u043d\u0442 \u043d\u0435\u0430\u043a\u0442\u0438\u0432\u043d\u0438\u0439 \u0434\u043b\u044f \u0446\u044c\u043e\u0433\u043e \u0441\u043f\u0435\u0446\u0456\u0430\u043b\u0456\u0441\u0442\u0430.',
  CLIENT_BLOCKED:
    '\u0412\u0437\u0430\u0454\u043c\u043e\u0434\u0456\u044e \u0437\u0430\u0431\u043b\u043e\u043a\u043e\u0432\u0430\u043d\u043e \u0434\u043b\u044f \u0446\u0456\u0454\u0457 \u043f\u0430\u0440\u0438 \u043a\u043b\u0456\u0454\u043d\u0442-\u0441\u043f\u0435\u0446\u0456\u0430\u043b\u0456\u0441\u0442.',
  PERMISSION_DENIED: '\u041d\u0435\u0434\u043e\u0441\u0442\u0430\u0442\u043d\u044c\u043e \u043f\u0440\u0430\u0432 \u0434\u043b\u044f \u0446\u0456\u0454\u0457 \u0434\u0456\u0457.',
  PRACTICE_BOARD_NOT_FOUND:
    '\u041d\u0435 \u0432\u0434\u0430\u043b\u043e\u0441\u044f \u0432\u0456\u0434\u043a\u0440\u0438\u0442\u0438 \u043f\u043e\u0442\u0440\u0456\u0431\u043d\u0443 \u0434\u043e\u0448\u043a\u0443 \u043f\u0440\u0430\u043a\u0442\u0438\u043a\u0438. \u0421\u043f\u0440\u043e\u0431\u0443\u0439\u0442\u0435 \u0449\u0435 \u0440\u0430\u0437.',
  OVER_LIMIT:
    '\u0414\u0456\u044f \u043d\u0435\u0434\u043e\u0441\u0442\u0443\u043f\u043d\u0430 \u0447\u0435\u0440\u0435\u0437 \u043e\u0431\u043c\u0435\u0436\u0435\u043d\u043d\u044f \u043f\u043b\u0430\u043d\u0443. \u041f\u0435\u0440\u0435\u0432\u0456\u0440\u0442\u0435 \u0434\u043e\u0441\u0442\u0443\u043f \u0443 Billing.',
  INVALID_DURATION: '\u041d\u0435\u043a\u043e\u0440\u0435\u043a\u0442\u043d\u0430 \u0442\u0440\u0438\u0432\u0430\u043b\u0456\u0441\u0442\u044c. \u0412\u043a\u0430\u0436\u0456\u0442\u044c 1\u2013480 \u0445\u0432.',
  SESSION_FORMAT_REQUIRED:
    '\u041e\u0431\u0435\u0440\u0456\u0442\u044c \u0444\u043e\u0440\u043c\u0430\u0442 \u0441\u0435\u0441\u0456\u0457 \u043f\u0435\u0440\u0435\u0434 \u0431\u0440\u043e\u043d\u044e\u0432\u0430\u043d\u043d\u044f\u043c.',
  SESSION_FORMAT_INVALID:
    '\u041e\u0431\u0440\u0430\u043d\u0438\u0439 \u0444\u043e\u0440\u043c\u0430\u0442 \u0441\u0435\u0441\u0456\u0457 \u043d\u0435\u0434\u043e\u0441\u0442\u0443\u043f\u043d\u0438\u0439 \u0434\u043b\u044f \u0446\u044c\u043e\u0433\u043e \u0441\u043f\u0435\u0446\u0456\u0430\u043b\u0456\u0441\u0442\u0430.',
  SPECIALIST_PROFILE_INVALID:
    '\u041f\u0440\u043e\u0444\u0456\u043b\u044c \u0441\u043f\u0435\u0446\u0456\u0430\u043b\u0456\u0441\u0442\u0430 \u043d\u0430\u043b\u0430\u0448\u0442\u043e\u0432\u0430\u043d\u043e \u043d\u0435\u043a\u043e\u0440\u0435\u043a\u0442\u043d\u043e. \u0421\u043f\u0440\u043e\u0431\u0443\u0439\u0442\u0435 \u0456\u043d\u0448\u0438\u0439 \u0441\u043b\u043e\u0442 \u0430\u0431\u043e \u0437\u0430\u043f\u0438\u0448\u0456\u0442\u044c\u0441\u044f \u043f\u0456\u0437\u043d\u0456\u0448\u0435.',
  BILLING_RESTRICTED:
    '\u0410\u043a\u0430\u0443\u043d\u0442 \u0442\u0438\u043c\u0447\u0430\u0441\u043e\u0432\u043e \u043e\u0431\u043c\u0435\u0436\u0435\u043d\u043e. \u041d\u043e\u0432\u0456 \u0434\u0456\u0457 \u043d\u0435\u0434\u043e\u0441\u0442\u0443\u043f\u043d\u0456.',
  BILLING_GRACE:
    '\u041e\u043f\u043b\u0430\u0442\u0430 \u043f\u043e\u0442\u0440\u0435\u0431\u0443\u0454 \u0443\u0432\u0430\u0433\u0438. \u0414\u043e\u0441\u0442\u0443\u043f \u0442\u0438\u043c\u0447\u0430\u0441\u043e\u0432\u043e \u0437\u0431\u0435\u0440\u0435\u0436\u0435\u043d\u043e.',
  SUSPENDED:
    '\u0410\u043a\u0430\u0443\u043d\u0442 \u043f\u0440\u0438\u0437\u0443\u043f\u0438\u043d\u0435\u043d\u043e. \u0417\u0432\u0435\u0440\u043d\u0456\u0442\u044c\u0441\u044f \u0434\u043e \u043f\u0456\u0434\u0442\u0440\u0438\u043c\u043a\u0438, \u044f\u043a\u0449\u043e \u0446\u0435 \u043f\u043e\u043c\u0438\u043b\u043a\u0430.',
} as const

const BOOKING_ERROR_REASON_MESSAGES: Record<string, string> = {
  SESSION_STATUS_INVALID:
    '\u0426\u044e \u0434\u0456\u044e \u043d\u0435\u043c\u043e\u0436\u043b\u0438\u0432\u043e \u0432\u0438\u043a\u043e\u043d\u0430\u0442\u0438 \u0434\u043b\u044f \u043f\u043e\u0442\u043e\u0447\u043d\u043e\u0433\u043e \u0441\u0442\u0430\u0442\u0443\u0441\u0443 \u0441\u0435\u0441\u0456\u0457.',
  CANCEL_AFTER_START_FORBIDDEN:
    '\u041d\u0435\u043c\u043e\u0436\u043b\u0438\u0432\u043e \u0441\u043a\u0430\u0441\u0443\u0432\u0430\u0442\u0438 \u0441\u0435\u0441\u0456\u044e \u043f\u0456\u0441\u043b\u044f \u0457\u0457 \u043f\u043e\u0447\u0430\u0442\u043a\u0443.',
  RESCHEDULE_AFTER_START_FORBIDDEN:
    '\u041d\u0435\u043c\u043e\u0436\u043b\u0438\u0432\u043e \u043f\u0435\u0440\u0435\u043d\u0435\u0441\u0442\u0438 \u0441\u0435\u0441\u0456\u044e \u043f\u0456\u0441\u043b\u044f \u0457\u0457 \u043f\u043e\u0447\u0430\u0442\u043a\u0443.',
  RESCHEDULE_WITHIN_12H_FORBIDDEN:
    '\u041d\u0435\u043c\u043e\u0436\u043b\u0438\u0432\u043e \u043f\u0435\u0440\u0435\u043d\u0435\u0441\u0442\u0438 \u0441\u0435\u0441\u0456\u044e \u043c\u0435\u043d\u0448 \u043d\u0456\u0436 \u0437\u0430 12 \u0433\u043e\u0434\u0438\u043d \u0434\u043e \u043f\u043e\u0447\u0430\u0442\u043a\u0443.',
  RESCHEDULE_TO_EARLIER_FORBIDDEN:
    '\u041d\u0435\u043c\u043e\u0436\u043b\u0438\u0432\u043e \u043f\u0435\u0440\u0435\u043d\u0435\u0441\u0442\u0438 \u0441\u0435\u0441\u0456\u044e \u043d\u0430 \u0440\u0430\u043d\u0456\u0448\u0438\u0439 \u0447\u0430\u0441.',
  RESCHEDULE_CONFIRMED_ONLY:
    '\u0417\u0430\u043f\u0438\u0442 \u043d\u0430 \u043f\u0435\u0440\u0435\u043d\u0435\u0441\u0435\u043d\u043d\u044f \u0434\u043e\u0441\u0442\u0443\u043f\u043d\u0438\u0439 \u043b\u0438\u0448\u0435 \u0434\u043b\u044f \u043f\u0456\u0434\u0442\u0432\u0435\u0440\u0434\u0436\u0435\u043d\u0438\u0445 \u0441\u0435\u0441\u0456\u0439.',
  REQUEST_NOT_PENDING: '\u0426\u0435\u0439 \u0437\u0430\u043f\u0438\u0442 \u0432\u0436\u0435 \u043e\u0431\u0440\u043e\u0431\u043b\u0435\u043d\u043e.',
  RESCHEDULE_TARGET_SESSION_STATUS_INVALID:
    '\u041d\u0435\u043c\u043e\u0436\u043b\u0438\u0432\u043e \u0437\u0430\u0441\u0442\u043e\u0441\u0443\u0432\u0430\u0442\u0438 \u043f\u0435\u0440\u0435\u043d\u0435\u0441\u0435\u043d\u043d\u044f \u0434\u043b\u044f \u043f\u043e\u0442\u043e\u0447\u043d\u043e\u0433\u043e \u0441\u0442\u0430\u0442\u0443\u0441\u0443 \u0441\u0435\u0441\u0456\u0457.',
} as const

export function getBookingErrorCode(err: unknown): string | null {
  const code = (err as { response?: { data?: { code?: unknown } } })?.response?.data?.code
  return typeof code === 'string' && code.trim() ? code : null
}

export function getBookingErrorReasonCode(err: unknown): string | null {
  const reasonCode = (err as { response?: { data?: { reason_code?: unknown } } })?.response?.data?.reason_code
  return typeof reasonCode === 'string' && reasonCode.trim() ? reasonCode : null
}

export function getBookingErrorMessage(err: unknown, fallback: string): string {
  const reasonCode = getBookingErrorReasonCode(err)
  if (reasonCode && BOOKING_ERROR_REASON_MESSAGES[reasonCode]) {
    return BOOKING_ERROR_REASON_MESSAGES[reasonCode]
  }

  const code = getBookingErrorCode(err)
  if (code && BOOKING_ERROR_CODE_MESSAGES[code]) {
    return BOOKING_ERROR_CODE_MESSAGES[code]
  }

  const detail = (err as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail
  if (detail === 'Slot not found.') {
    return BOOKING_ERROR_CODE_MESSAGES.SLOT_NOT_FOUND!
  }

  return getApiErrorMessage(err, fallback)
}
