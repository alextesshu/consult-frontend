import type { InquiryReasonCode, InquiryStatus } from './api'
import { getApiErrorMessage } from './errors'

export type InquiryUiTone = 'neutral' | 'info' | 'warning'

export type InquiryUiCopy = {
  title: string
  body: string
  tone: InquiryUiTone
}

type InquiryActor = 'client' | 'specialist'
type InquiryMode = 'entry' | 'thread'

const DEFAULT_ENTRY_COPY: InquiryUiCopy = {
  title: 'Коротке запитання до бронювання',
  body: 'Ви можете поставити коротке уточнювальне запитання перед бронюванням. Це обмежений запит, а не повноцінний чат.',
  tone: 'info',
}

const DEFAULT_THREAD_COPY: InquiryUiCopy = {
  title: 'Запит до бронювання',
  body: 'Історія короткого запиту збережена тут. Відповідь спеціаліста або ваше уточнення з’являться в цьому блоці.',
  tone: 'neutral',
}

function reasonCopy(
  reasonCode: InquiryReasonCode | string | null | undefined,
  actor: InquiryActor
): InquiryUiCopy | null {
  switch (reasonCode) {
    case 'ACTIVE_CLIENT_USE_CHAT':
      return {
        title: 'Повний чат уже доступний',
        body: 'Для цієї пари вже діє звичайний чат активного клієнта. Подальше спілкування продовжується там.',
        tone: 'info',
      }
    case 'INQUIRY_ALREADY_EXISTS':
      return {
        title: 'Запит уже створено',
        body: 'Для цього спеціаліста вже є один активний запит до бронювання. Продовжуйте його в цьому ж блоці.',
        tone: 'neutral',
      }
    case 'RELATION_BLOCKED':
      return {
        title: 'Запит недоступний',
        body: 'Для заблокованої взаємодії короткий запит до бронювання недоступний.',
        tone: 'warning',
      }
    case 'RELATION_ARCHIVED':
      return {
        title: 'Запит недоступний',
        body: 'Для архівної взаємодії короткий запит до бронювання недоступний.',
        tone: 'warning',
      }
    case 'THREAD_CLOSED':
      return {
        title: 'Запит завершено',
        body: 'Цей запит до бронювання вже завершено. Якщо співпраця почнеться, подальше спілкування продовжиться у звичайному чаті.',
        tone: 'warning',
      }
    case 'INQUIRY_NOT_FOUND':
      return {
        title: 'Запит не знайдено',
        body: 'Для цього спеціаліста ще немає запиту до бронювання.',
        tone: 'neutral',
      }
    case 'FOLLOW_UP_REQUIRES_SPECIALIST_REPLY':
      return {
        title: 'Очікується відповідь спеціаліста',
        body: 'Ви вже надіслали стартове запитання. Наступне уточнення стане доступним після відповіді спеціаліста.',
        tone: 'info',
      }
    case 'CLIENT_MESSAGE_LIMIT_REACHED':
      return {
        title: 'Ліміт повідомлень вичерпано',
        body: 'У межах цього запиту клієнт уже використав доступні короткі повідомлення.',
        tone: 'warning',
      }
    case 'REPLY_REQUIRES_CLIENT_MESSAGE':
      return {
        title: 'Ще немає повідомлення клієнта',
        body: 'Відповідь стане доступною після першого запиту від клієнта.',
        tone: 'neutral',
      }
    case 'WAIT_FOR_CLIENT_MESSAGE':
      return {
        title: 'Очікується клієнт',
        body: actor === 'specialist'
          ? 'Ви вже відповіли на останнє повідомлення. Подальша відповідь стане доступною, коли клієнт напише знову.'
          : 'Спеціаліст уже відповів. Якщо follow-up ще доступний, він з’явиться нижче.',
        tone: 'neutral',
      }
    case 'ONLY_CLIENT_CAN_CREATE':
      return {
        title: 'Запит створює клієнт',
        body: 'Стартовий запит до бронювання може створити лише клієнт.',
        tone: 'warning',
      }
    case 'SPECIALIST_NOT_FOUND':
      return {
        title: 'Спеціаліста не знайдено',
        body: 'Не вдалося знайти спеціаліста для цього запиту.',
        tone: 'warning',
      }
    case 'ACCESS_DENIED':
      return {
        title: 'Доступ обмежено',
        body: 'Цей запит недоступний для поточного користувача.',
        tone: 'warning',
      }
    case 'EMPTY_BODY':
      return {
        title: 'Потрібен текст запиту',
        body: 'Додайте короткий текст повідомлення перед відправленням.',
        tone: 'warning',
      }
    default:
      return null
  }
}

export function mapInquiryStateToUi(options: {
  status: InquiryStatus | null | undefined
  reasonCode?: InquiryReasonCode | string | null
  actor: InquiryActor
  mode: InquiryMode
}): InquiryUiCopy {
  const mappedReason = reasonCopy(options.reasonCode, options.actor)
  const status = options.status

  if (status === 'ACTIVE_CLIENT') {
    return mappedReason || {
      title: 'Повний чат уже доступний',
      body: 'У вас уже активна співпраця. Для подальшого спілкування використовуйте звичайний чат.',
      tone: 'info',
    }
  }

  if (status === 'BLOCKED' || status === 'ARCHIVED' || status === 'CLOSED') {
    return mappedReason || {
      title: 'Запит недоступний',
      body: 'Зараз цей запит до бронювання недоступний.',
      tone: 'warning',
    }
  }

  if (mappedReason) {
    return mappedReason
  }

  if (status === 'OPEN') {
    return DEFAULT_THREAD_COPY
  }

  if (status === 'NOT_CREATED') {
    return DEFAULT_ENTRY_COPY
  }

  return options.mode === 'thread' ? DEFAULT_THREAD_COPY : DEFAULT_ENTRY_COPY
}

export function getInquiryActionErrorMessage(
  err: unknown,
  actor: InquiryActor,
  fallback: string
): string {
  const reasonCode =
    (err as { response?: { data?: { reason_code?: InquiryReasonCode | string } } })?.response?.data
      ?.reason_code || null

  const mapped = reasonCopy(reasonCode, actor)
  if (mapped) return mapped.body

  return getApiErrorMessage(err, fallback)
}
