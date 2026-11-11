import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import router from '../router'
import {
  CABINET_MORE_KEYS, CABINET_NAV, CABINET_TAB_KEYS, accountInitials, badgeLabel, cabinetNavItem, isCabinetNavActive, moreBadge, planLabel,
} from './specialistCabinetNav'

const source = readFileSync('docs/ui-v2/snapshots/2026-10-23-4ff7cedd/handoff/mockups/Cabinet-Dashboard.dc.html', 'utf8')
const mobile = readFileSync('docs/ui-v2/snapshots/2026-10-23-4ff7cedd/handoff/mockups/Cabinet-Mobile.dc.html', 'utf8')

describe('specialist cabinet v2 navigation', () => {
  it('preserves source order while consolidating schedule and sessions for Calendar 3a', () => {
    const nav = source.match(/const NAV = (\[[^\]]+\])/)![1]!
    const labels: string[] = JSON.parse(nav.replace(/'/g, '"'))
    expect(CABINET_NAV.map((item) => item.label)).toEqual(labels.filter((label) => label !== 'Розклад').map((label) => label === 'Сесії' ? 'Календар' : label))
  })

  it('points every item at an existing specialist-only route (no fallback, no dead links)', () => {
    for (const item of CABINET_NAV) {
      const resolved = router.resolve(item.to)
      expect(resolved.matched.length, item.to).toBeGreaterThan(0)
      expect(resolved.matched.some((record) => record.path.includes(':pathMatch')), item.to).toBe(false)
      expect(resolved.meta.requiresRole, item.to).toBe('SPECIALIST')
    }
  })

  it('splits M1 tabs and the M2 «Ще» sheet like the source', () => {
    expect(mobile).toContain("const MAIN = [['Кабінет'], ['Сесії'], ['Клієнти'], ['Запити', '2'], ['Ще', '1']]")
    expect(CABINET_TAB_KEYS.map((key) => cabinetNavItem(key).label)).toEqual(['Кабінет', 'Календар', 'Клієнти', 'Запити'])
    // Schedule management is now secondary to Calendar, so More holds nine items.
    expect(CABINET_MORE_KEYS.map((key) => cabinetNavItem(key).label)).toEqual(['Профіль', 'Завдання', 'Відгуки', 'Чати', 'Групові події', 'Власний блог', 'Аналітика', 'Тарифи і доступ', 'Налаштування'])
  })

  it('matches active sections like the legacy sidebar', () => {
    const item = (key: Parameters<typeof cabinetNavItem>[0]) => cabinetNavItem(key)
    expect(isCabinetNavActive(item('dashboard'), '/cabinet')).toBe(true)
    expect(isCabinetNavActive(item('dashboard'), '/cabinet/clients')).toBe(false)
    expect(isCabinetNavActive(item('sessions'), '/cabinet/sessions/42')).toBe(true)
    expect(isCabinetNavActive(item('sessions'), '/cabinet/availability-rules')).toBe(true)
    expect(isCabinetNavActive(item('requests'), '/cabinet/inquiries')).toBe(true)
    expect(isCabinetNavActive(item('clients'), '/cabinet/clientsx')).toBe(false)
  })

  it.each(['/cabinet/sessions', '/cabinet/sessions/42', '/cabinet/slots', '/cabinet/schedule', '/cabinet/availability-rules', '/cabinet/availability-exceptions'])('keeps one active Calendar item on %s', (path) => {
    expect(CABINET_NAV.filter((item) => isCabinetNavActive(item, path)).map((item) => item.label)).toEqual(['Календар'])
    expect(router.resolve(path).matched.length).toBeGreaterThan(0)
  })

  it('formats badges, the «Ще» sum, plan and initials from real values only', () => {
    expect(moreBadge({ chats: 1, sessions: 3, requests: 2 })).toBe(1)
    expect(badgeLabel(0)).toBe('')
    expect(badgeLabel(120)).toBe('99+')
    expect(planLabel('PRO')).toBe('Pro')
    expect(planLabel(null)).toBe('')
    expect(accountInitials('maria.koval@example.com')).toBe('MK')
    expect(accountInitials('specialist')).toBe('SP')
  })
})
