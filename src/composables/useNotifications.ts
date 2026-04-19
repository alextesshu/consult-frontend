import { computed, ref } from 'vue'
import type { ComputedRef } from 'vue'
import {
  fetchNotifications,
  markAllNotificationsRead as markAllNotificationsReadApi,
  markNotificationRead as markNotificationReadApi,
  type NotificationFeedItem,
} from '../lib/api'
import { formatUkDateTimeCompact } from '../lib/dateTime'
import { normalizeMeetingUrl } from '../lib/sessionExecution'
import { useToast } from './useToast'

export type BellNotification = {
  id: string
  text: string
  hint: string
  to: string
  join_url: string | null
  tone: 'info' | 'warn' | 'ok'
  unread: boolean
  source_kind: string | null
  source_id: number | null
}

export function useNotifications({
  isClient,
}: {
  isClient: ComputedRef<boolean>
  isSpecialist: ComputedRef<boolean>
}) {
  const toast = useToast()

  const feed = ref<NotificationFeedItem[]>([])
  const loaded = ref(false)
  const loading = ref(false)
  const readAllPending = ref(false)
  const pendingIds = ref<Set<string>>(new Set())
  const intervalId = ref<number | null>(null)

  function formatDateTime(value?: string | null) {
    return formatUkDateTimeCompact(value, '')
  }

  function notificationClientLabel(item: NotificationFeedItem) {
    if (item.client_name) return item.client_name
    if (item.client_id !== null && item.client_id !== undefined) return `#${item.client_id}`
    return 'клієнта'
  }

  function notificationCounterpartyLabel(item: NotificationFeedItem) {
    if (item.counterparty_name) return item.counterparty_name
    if (item.counterparty_id !== null && item.counterparty_id !== undefined) return `#${item.counterparty_id}`
    if (item.specialist_name) return item.specialist_name
    if (item.client_name) return item.client_name
    return isClient.value ? 'спеціаліста' : 'клієнта'
  }

  function notificationPreview(item: NotificationFeedItem) {
    const preview = item.preview?.trim()
    return preview || 'Відкрийте запит, щоб переглянути деталі.'
  }

  function isPaymentProofRequested(item: NotificationFeedItem) {
    const code = String(item.code || '').trim().toUpperCase()
    if (code) return code === 'PAYMENT_PROOF_REQUESTED'
    return item.source_kind === 'payment_proof_event'
  }

  function notificationJoinUrl(item: NotificationFeedItem) {
    const url = normalizeMeetingUrl(item.meeting_url)
    if (!url) return null
    if (item.source_kind === 'inquiry_message' || item.source_kind === 'reschedule_request') return null
    if (item.source_kind === 'session_event' && item.code === 'CANCELLED') return null
    if (isPaymentProofRequested(item)) return null
    return url
  }

  function notificationTone(item: NotificationFeedItem): BellNotification['tone'] {
    if (item.source_kind === 'inquiry_message') return 'info'
    if (item.source_kind === 'reschedule_request' || item.code === 'RESCHEDULE_REQUESTED') return 'warn'
    if (isPaymentProofRequested(item)) return 'warn'
    if (item.code === 'PAYMENT_CLARIFICATION_REQUESTED') return 'warn'
    if (item.code === 'PAYMENT_CONFIRMED') return 'ok'
    if (item.source_kind === 'session_event' && item.code === 'RESCHEDULED') return 'ok'
    if (item.source_kind === 'session_event' && item.code === 'CANCELLED') return 'warn'
    if (item.source_kind === 'session_event' && item.code === 'BOOKED') return 'ok'
    return 'info'
  }

  function notificationText(item: NotificationFeedItem) {
    const clientLabel = notificationClientLabel(item)
    const counterpartyLabel = notificationCounterpartyLabel(item)
    if (item.source_kind === 'inquiry_message') {
      if (item.code === 'INQUIRY_CREATED') return `Запит до бронювання від ${counterpartyLabel}`
      if (item.code === 'INQUIRY_REPLIED') return `Відповідь на запит від ${counterpartyLabel}`
      if (item.code === 'INQUIRY_FOLLOWED_UP') return `Уточнення до запиту від ${counterpartyLabel}`
      return `Оновлення запиту до бронювання від ${counterpartyLabel}`
    }
    if (item.source_kind === 'reschedule_request' || item.code === 'RESCHEDULE_REQUESTED') {
      return `Перенесення: ${clientLabel} просить змінити час сесії`
    }
    if (isPaymentProofRequested(item)) {
      return `\u041E\u043F\u043B\u0430\u0442\u0430: ${counterpartyLabel} \u0437\u0430\u043F\u0440\u043E\u0441\u0438\u0432 \u043F\u0456\u0434\u0442\u0432\u0435\u0440\u0434\u0436\u0435\u043D\u043D\u044F \u043E\u043F\u043B\u0430\u0442\u0438`
    }
    if (item.code === 'SESSION_MEETING_LINK_UPDATED') return 'Посилання на онлайн-зустріч оновлено.'
    if (item.code === 'SESSION_MEETING_LINK_REQUESTED') return 'Клієнт попросив додати посилання на зустріч.'
    if (item.code === 'PAYMENT_PROOF_SUBMITTED') {
      return isClient.value ? 'Підтвердження оплати надіслано.' : 'Надійшло підтвердження оплати від клієнта.'
    }
    if (item.code === 'PAYMENT_CONFIRMED') {
      return isClient.value ? 'Вашу оплату підтверджено.' : 'Оплату підтверджено.'
    }
    if (item.code === 'PAYMENT_CLARIFICATION_REQUESTED') {
      return isClient.value ? 'Потрібне уточнення щодо оплати.' : 'Запитано уточнення щодо оплати.'
    }
    if (item.source_kind === 'session_event') {
      if (item.code === 'CANCELLED') return `Бронювання: скасування сесії від ${clientLabel}`
      if (item.code === 'CONFIRMED') return `Бронювання: сесію з ${clientLabel} підтверджено`
      if (item.code === 'BOOKED') return `Бронювання: нова сесія від ${clientLabel}`
      if (item.code === 'RESCHEDULED') return 'Перенесення: новий час сесії підтверджено'
      return `Оновлення по сесії від ${clientLabel}`
    }
    if (item.code === 'session_starts_1h') {
      if (notificationJoinUrl(item)) {
        return `Нагадування: онлайн-зустріч з ${clientLabel} починається за 1 годину`
      }
      return `Нагадування: сесія з ${clientLabel} починається за 1 годину`
    }
    if (item.code === 'session_starts_24h') {
      if (notificationJoinUrl(item)) {
        return `Нагадування: онлайн-зустріч з ${clientLabel} починається за 24 години`
      }
      return `Нагадування: сесія з ${clientLabel} починається за 24 години`
    }
    return `Нагадування про сесію з ${clientLabel}`
  }

  function notificationHint(item: NotificationFeedItem) {
    const email = item.client_email ? ` · ${item.client_email}` : ''
    const time = formatDateTime(item.slot_start_at || item.scheduled_for)
    if (item.source_kind === 'inquiry_message') {
      return notificationPreview(item)
    }
    if (isPaymentProofRequested(item)) {
      return time
        ? `\u0421\u0435\u0441\u0456\u044F: ${time}. \u0412\u0456\u0434\u043A\u0440\u0438\u0439\u0442\u0435 \u0434\u0435\u0442\u0430\u043B\u0456 \u0442\u0430 \u043D\u0430\u0434\u0456\u0448\u043B\u0456\u0442\u044C \u043F\u0456\u0434\u0442\u0432\u0435\u0440\u0434\u0436\u0435\u043D\u043D\u044F \u043E\u043F\u043B\u0430\u0442\u0438.`
        : '\u0412\u0456\u0434\u043A\u0440\u0438\u0439\u0442\u0435 \u0434\u0435\u0442\u0430\u043B\u0456 \u0441\u0435\u0441\u0456\u0457 \u0442\u0430 \u043D\u0430\u0434\u0456\u0448\u043B\u0456\u0442\u044C \u043F\u0456\u0434\u0442\u0432\u0435\u0440\u0434\u0436\u0435\u043D\u043D\u044F \u043E\u043F\u043B\u0430\u0442\u0438.'
    }
    if (item.code === 'SESSION_MEETING_LINK_UPDATED') {
      return time ? `Сесія: ${time}${email}` : `Перевірте оновлене посилання на зустріч${email}`
    }
    if (item.code === 'PAYMENT_PROOF_SUBMITTED') {
      return time ? `Сесія: ${time}${email}` : `Перевірте деталі оплати${email}`
    }
    if (item.code === 'PAYMENT_CONFIRMED') {
      return time ? `Сесія: ${time}${email}` : `Підтвердження оплати збережено${email}`
    }
    if (item.code === 'PAYMENT_CLARIFICATION_REQUESTED') {
      return time ? `Сесія: ${time}${email}` : `Відкрийте деталі та уточніть інформацію про оплату${email}`
    }
    if (item.source_kind === 'reschedule_request' || item.code === 'RESCHEDULE_REQUESTED') {
      return time ? `Запитаний час: ${time}${email}` : `Перевірте деталі запиту на перенесення${email}`
    }
    if (item.source_kind === 'session_event' && item.code === 'RESCHEDULED') {
      return time ? `Новий час: ${time}${email}` : `Перевірте оновлений час сесії${email}`
    }
    if (item.source_kind === 'session_event') {
      return time ? `Сесія: ${time}${email}` : `Перевірте деталі сесії${email}`
    }
    return time ? `Час сесії: ${time}${email}` : `Перевірте деталі сесії${email}`
  }

  function notificationTarget(item: NotificationFeedItem) {
    if (item.target_type === 'session_detail' && typeof item.target_id === 'number') {
      const focusSuffix = item.focus ? `?focus=${encodeURIComponent(String(item.focus).trim())}` : ''
      if (isClient.value) return `/client/sessions/${item.target_id}${focusSuffix}`
      return `/cabinet/sessions/${item.target_id}${focusSuffix}`
    }
    if (item.source_kind === 'inquiry_message') {
      if (isClient.value) {
        return item.specialist_id ? `/client/inquiries/${item.specialist_id}` : '/specialists'
      }
      const query = item.thread_id ? `?thread_id=${item.thread_id}` : ''
      return `/cabinet/inquiries${query}`
    }
    if (isClient.value) {
      return item.session_id ? `/client/sessions/${item.session_id}` : '/client'
    }
    return item.session_id ? `/cabinet/sessions/${item.session_id}` : '/cabinet/sessions'
  }

  const items = computed<BellNotification[]>(() =>
    feed.value.map((item) => ({
      id: item.id,
      text: notificationText(item),
      hint: notificationHint(item),
      to: notificationTarget(item),
      join_url: notificationJoinUrl(item),
      tone: notificationTone(item),
      unread: !item.read_at,
      source_kind: item.source_kind,
      source_id: item.source_id,
    }))
  )

  const unreadCount = computed(() => items.value.filter((n) => n.unread).length)

  async function refresh() {
    loading.value = true
    try {
      const resp = await fetchNotifications({ limit: 20 })
      feed.value = resp.results || []
      loaded.value = true
    } catch {
      if (!loaded.value) {
        feed.value = []
      }
    } finally {
      loading.value = false
    }
  }

  async function markRead(item: BellNotification) {
    if (!item.source_kind || item.source_id === null) return
    if (pendingIds.value.has(item.id)) return
    feed.value = feed.value.map((entry) =>
      entry.id === item.id ? { ...entry, read_at: entry.read_at || new Date().toISOString() } : entry
    )
    pendingIds.value = new Set(pendingIds.value).add(item.id)
    try {
      const resp = await markNotificationReadApi({
        source_kind: item.source_kind,
        source_id: item.source_id,
      })
      feed.value = feed.value.map((entry) =>
        entry.source_kind === resp.source_kind && entry.source_id === resp.source_id
          ? { ...entry, read_at: resp.read_at }
          : entry
      )
    } catch {
      await refresh()
      toast.error('Не вдалося позначити сповіщення як прочитане.')
    } finally {
      const next = new Set(pendingIds.value)
      next.delete(item.id)
      pendingIds.value = next
    }
  }

  async function markAllRead() {
    if (!unreadCount.value || readAllPending.value) return
    readAllPending.value = true
    const optimisticReadAt = new Date().toISOString()
    feed.value = feed.value.map((entry) => ({
      ...entry,
      read_at: entry.read_at || optimisticReadAt,
    }))
    try {
      await markAllNotificationsReadApi()
      await refresh()
    } catch {
      await refresh()
      toast.error('Не вдалося позначити всі сповіщення як прочитані.')
    } finally {
      readAllPending.value = false
    }
  }

  function startPolling() {
    if (intervalId.value !== null) return
    refresh()
    intervalId.value = window.setInterval(() => {
      refresh()
    }, 60000)
  }

  function stopPolling() {
    if (intervalId.value === null) return
    window.clearInterval(intervalId.value)
    intervalId.value = null
  }

  function reset() {
    feed.value = []
    loaded.value = false
  }

  return {
    feed,
    loaded,
    loading,
    readAllPending,
    items,
    unreadCount,
    refresh,
    markRead,
    markAllRead,
    startPolling,
    stopPolling,
    reset,
  }
}

