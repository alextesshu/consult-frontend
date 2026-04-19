import { getApiErrorMessage } from './errors'

export const BOOKING_SUCCESS_MESSAGES = {
  sessionBooked: 'РЎРµСЃС–СЋ Р·Р°Р±СЂРѕРЅСЊРѕРІР°РЅРѕ. РџРµСЂРµРІС–СЂС‚Рµ СЃС‚Р°С‚СѓСЃ Сѓ РєР°Р±С–РЅРµС‚С–.',
  sessionConfirmed: 'РЎРµСЃС–СЋ РїС–РґС‚РІРµСЂРґР¶РµРЅРѕ.',
  sessionCompleted: 'РЎРµСЃС–СЋ Р·Р°РІРµСЂС€РµРЅРѕ.',
  sessionCancelled: 'РЎРµСЃС–СЋ СЃРєР°СЃРѕРІР°РЅРѕ.',
  sessionRescheduled: 'РЎРµСЃС–СЋ РїРµСЂРµРЅРµСЃРµРЅРѕ.',
  recurringSeriesCreated: 'РЎРµСЂС–СЋ СЃРµСЃС–Р№ СЃС‚РІРѕСЂРµРЅРѕ.',
  rescheduleRequestSent: 'Р—Р°РїРёС‚ РЅР° РїРµСЂРµРЅРµСЃРµРЅРЅСЏ РЅР°РґС–СЃР»Р°РЅРѕ.',
  rescheduleRequestApproved: 'Р—Р°РїРёС‚ РЅР° РїРµСЂРµРЅРµСЃРµРЅРЅСЏ РїРѕРіРѕРґР¶РµРЅРѕ.',
  rescheduleRequestDeclined: 'Р—Р°РїРёС‚ РЅР° РїРµСЂРµРЅРµСЃРµРЅРЅСЏ РІС–РґС…РёР»РµРЅРѕ.',
  noteSaved: 'Нотатку збережено.',
  workbookSaved: 'Робочий зошит збережено.',
} as const

export const BOOKING_ERROR_FALLBACKS = {
  loadSession: 'РќРµ РІРґР°Р»РѕСЃСЏ Р·Р°РІР°РЅС‚Р°Р¶РёС‚Рё СЃРµСЃС–СЋ.',
  loadSessions: 'РќРµ РІРґР°Р»РѕСЃСЏ Р·Р°РІР°РЅС‚Р°Р¶РёС‚Рё СЃРµСЃС–С—.',
  loadGroupEvents: 'РќРµ РІРґР°Р»РѕСЃСЏ Р·Р°РІР°РЅС‚Р°Р¶РёС‚Рё РіСЂСѓРїРѕРІС– РїРѕРґС–С—.',
  bookSlot: 'РќРµ РІРґР°Р»РѕСЃСЏ Р·Р°Р±СЂРѕРЅСЋРІР°С‚Рё РІС–Р»СЊРЅРµ РІС–РєРЅРѕ.',
  confirmSession: 'РќРµ РІРґР°Р»РѕСЃСЏ РїС–РґС‚РІРµСЂРґРёС‚Рё СЃРµСЃС–СЋ.',
  completeSession: 'РќРµ РІРґР°Р»РѕСЃСЏ Р·Р°РІРµСЂС€РёС‚Рё СЃРµСЃС–СЋ.',
  cancelSession: 'РќРµ РІРґР°Р»РѕСЃСЏ СЃРєР°СЃСѓРІР°С‚Рё СЃРµСЃС–СЋ.',
  rescheduleSession: 'РќРµ РІРґР°Р»РѕСЃСЏ РїРµСЂРµРЅРµСЃС‚Рё СЃРµСЃС–СЋ.',
  createRecurringSession: 'РќРµ РІРґР°Р»РѕСЃСЏ СЃС‚РІРѕСЂРёС‚Рё СЃРµСЂС–СЋ СЃРµСЃС–Р№.',
  sendRescheduleRequest: 'РќРµ РІРґР°Р»РѕСЃСЏ РЅР°РґС–СЃР»Р°С‚Рё Р·Р°РїРёС‚ РЅР° РїРµСЂРµРЅРµСЃРµРЅРЅСЏ.',
  approveRescheduleRequest: 'РќРµ РІРґР°Р»РѕСЃСЏ РїРѕРіРѕРґРёС‚Рё Р·Р°РїРёС‚ РЅР° РїРµСЂРµРЅРµСЃРµРЅРЅСЏ.',
  declineRescheduleRequest: 'РќРµ РІРґР°Р»РѕСЃСЏ РІС–РґС…РёР»РёС‚Рё Р·Р°РїРёС‚ РЅР° РїРµСЂРµРЅРµСЃРµРЅРЅСЏ.',
  loadSessionNote: 'РќРµ РІРґР°Р»РѕСЃСЏ Р·Р°РІР°РЅС‚Р°Р¶РёС‚Рё РЅРѕС‚Р°С‚РєСѓ.',
  saveSessionNote: 'Не вдалося зберегти нотатку.',
  loadWorkbook: 'Не вдалося завантажити робочий зошит.',
  saveWorkbook: 'Не вдалося зберегти робочий зошит.',
} as const

export const BOOKING_UI_MESSAGES = {
  onlyClientsCanBook: 'Р‘СЂРѕРЅСЋРІР°РЅРЅСЏ РґРѕСЃС‚СѓРїРЅРµ Р»РёС€Рµ РґР»СЏ РєР»С–С”РЅС‚С–РІ.',
  acceptSettingBeforeBooking: 'РџС–РґС‚РІРµСЂРґСЊС‚Рµ РїСЂР°РІРёР»Р° РїРµСЂРµРґ Р±СЂРѕРЅСЋРІР°РЅРЅСЏРј.',
  invalidDuration: 'РќРµРєРѕСЂРµРєС‚РЅР° С‚СЂРёРІР°Р»С–СЃС‚СЊ. Р’РєР°Р¶С–С‚СЊ 1вЂ“480 С…РІ.',
} as const

export const BOOKING_RESCHEDULE_SUGGESTION_REASON_LABELS = {
  nearby_days: 'РќР°Р№Р±Р»РёР¶С‡С– РґРЅС–',
  same_time_next_days: 'РўРѕР№ СЃР°РјРёР№ С‡Р°СЃ Сѓ РЅР°Р№Р±Р»РёР¶С‡С– РґРЅС–',
  same_weekday_next_week: 'РўРѕР№ СЃР°РјРёР№ РґРµРЅСЊ С‚РёР¶РЅСЏ РЅР°СЃС‚СѓРїРЅРѕРіРѕ С‚РёР¶РЅСЏ',
  nearest_available: 'РќР°Р№Р±Р»РёР¶С‡Рµ РґРѕСЃС‚СѓРїРЅРµ РІС–РєРЅРѕ',
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

  return getApiErrorMessage(err, fallback)
}

