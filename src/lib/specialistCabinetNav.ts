// UI v2 specialist cabinet navigation (Cabinet-Dashboard.dc.html NAV, Cabinet-Mobile.dc.html M1/M2).
// Every item points to an existing router path; matches mirror the legacy sidebar so active states agree.

export type CabinetNavKey =
  | 'dashboard' | 'profile' | 'clients' | 'schedule' | 'sessions' | 'requests' | 'tasks'
  | 'reviews' | 'chats' | 'group-events' | 'journal' | 'analytics' | 'billing' | 'settings'

export type CabinetNavItem = {
  key: CabinetNavKey
  label: string
  to: string
  match: string[]
  exact?: boolean
}

export type CabinetNavBadges = Partial<Record<CabinetNavKey, number>>

// Order and labels follow the 14-item source NAV.
export const CABINET_NAV: CabinetNavItem[] = [
  { key: 'dashboard', label: 'Кабінет', to: '/cabinet', match: ['/cabinet'], exact: true },
  { key: 'profile', label: 'Профіль', to: '/cabinet/profile', match: ['/cabinet/profile'] },
  { key: 'clients', label: 'Клієнти', to: '/cabinet/clients', match: ['/cabinet/clients'] },
  { key: 'schedule', label: 'Розклад', to: '/cabinet/slots', match: ['/cabinet/schedule', '/cabinet/slots', '/cabinet/availability-rules', '/cabinet/availability-exceptions'] },
  { key: 'sessions', label: 'Сесії', to: '/cabinet/sessions', match: ['/cabinet/sessions'] },
  { key: 'requests', label: 'Запити', to: '/cabinet/external-sessions#guest-requests', match: ['/cabinet/external-sessions', '/cabinet/inquiries'] },
  { key: 'tasks', label: 'Завдання', to: '/cabinet/practice-board', match: ['/cabinet/practice-board'] },
  { key: 'reviews', label: 'Відгуки', to: '/cabinet/reviews', match: ['/cabinet/reviews'] },
  { key: 'chats', label: 'Чати', to: '/cabinet/chat', match: ['/cabinet/chat'] },
  { key: 'group-events', label: 'Групові події', to: '/cabinet/group-events', match: ['/cabinet/group-events'] },
  { key: 'journal', label: 'Власний блог', to: '/cabinet/journal', match: ['/cabinet/journal'] },
  { key: 'analytics', label: 'Аналітика', to: '/cabinet/analytics', match: ['/cabinet/analytics'] },
  { key: 'billing', label: 'Тарифи і доступ', to: '/cabinet/billing', match: ['/cabinet/billing'] },
  { key: 'settings', label: 'Налаштування', to: '/cabinet/settings', match: ['/cabinet/settings'] },
]

// M1 bottom bar: four destinations plus «Ще»; M2 lists the remaining items.
export const CABINET_TAB_KEYS: CabinetNavKey[] = ['dashboard', 'sessions', 'clients', 'requests']
export const CABINET_MORE_KEYS: CabinetNavKey[] = CABINET_NAV.map((item) => item.key).filter((key) => !CABINET_TAB_KEYS.includes(key))

export function cabinetNavItem(key: CabinetNavKey) {
  return CABINET_NAV.find((item) => item.key === key)!
}

export function isCabinetNavActive(item: CabinetNavItem, path: string) {
  if (item.exact) return path === item.to
  return item.match.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))
}

// «Ще» shows the sum of the badges inside it (source note under M2).
export function moreBadge(badges: CabinetNavBadges) {
  return CABINET_MORE_KEYS.reduce((sum, key) => sum + (badges[key] || 0), 0)
}

export function badgeLabel(count: number | undefined) {
  if (!count || count < 1) return ''
  return count > 99 ? '99+' : String(count)
}

export function planLabel(plan: string | null | undefined) {
  const value = String(plan || '').toUpperCase()
  if (value === 'PRO') return 'Pro'
  if (value === 'START') return 'Start'
  return value ? value.charAt(0) + value.slice(1).toLowerCase() : ''
}

export function accountInitials(value: string | null | undefined) {
  const text = String(value || '').split('@')[0]!.replace(/[._-]+/g, ' ').trim()
  const parts = text.split(/\s+/).filter(Boolean)
  const letters = parts.length > 1 ? [parts[0]![0], parts[1]![0]] : [text[0], text[1]]
  return letters.filter(Boolean).join('').toLocaleUpperCase('uk-UA') || 'PC'
}
