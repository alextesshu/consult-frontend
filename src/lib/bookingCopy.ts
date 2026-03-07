export const BOOKING_SUCCESS_MESSAGES = {
  sessionBooked: 'Сесію заброньовано. Перевірте статус у кабінеті.',
  sessionConfirmed: 'Сесію підтверджено.',
  sessionCompleted: 'Сесію завершено.',
  sessionCancelled: 'Сесію скасовано.',
  sessionRescheduled: 'Сесію перенесено.',
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
