import { fireEvent, render, screen } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import PublicProfileExternalContacts from './PublicProfileExternalContacts.vue'

const actions = [
  { id: 'EMAIL-0', channel: 'EMAIL', channelLabel: 'Email', valueText: 'long.specialist.contact@example.test', actionUrl: 'mailto:long.specialist.contact@example.test', actionScheme: 'mailto' },
  { id: 'PHONE-1', channel: 'PHONE', channelLabel: 'Телефон', valueText: '+380501234567', actionUrl: 'tel:+380501234567', actionScheme: 'tel' },
  { id: 'SECONDARY_PHONE-2', channel: 'SECONDARY_PHONE', channelLabel: 'Додатковий телефон', valueText: '+380671234567', actionUrl: 'tel:+380671234567', actionScheme: 'tel' },
]

describe('PublicProfileExternalContacts', () => {
  it('separates each full value from its own accessible copy button and preserves the action payload', async () => {
    const view = render(PublicProfileExternalContacts, { props: { contactActions: actions } })
    expect(screen.getAllByRole('listitem')).toHaveLength(3)
    expect(screen.getAllByRole('button')).toHaveLength(3)
    for (const action of actions) {
      const value = screen.getByText(action.valueText)
      expect(value.closest('button')).toBeNull()
      expect(value.closest('.pc2-profile-contacts__row')?.tagName).toBe('LI')
      await fireEvent.click(screen.getByRole('button', { name: `Скопіювати ${action.channelLabel}: ${action.valueText}` }))
    }
    expect(view.emitted()['copy-contact-action']).toEqual(actions.map(action => [action]))
    await view.rerender({ copiedContactId: actions[2]!.id })
    expect(screen.getByRole('button', { name: 'Скопіювати Додатковий телефон: +380671234567' })).toHaveTextContent('Скопійовано')
    expect(screen.getByText('Звернення поза Pro Consult не зберігатимуться у вашій історії запитів на платформі.')).toBeInTheDocument()
  })
})
