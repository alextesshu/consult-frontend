import { render, screen } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import PublicProfileHeroSection from './PublicProfileHeroSection.vue'

function buildProps(heroRoleLine: string) {
  return {
    profile: {},
    publicName: 'Олена',
    heroRoleLine,
    heroLeadText: 'Допомагаю знаходити практичні рішення.',
    heroSupportText: '',
    completedSessionsBadge: null,
    displaySpecializationChips: ['Командний коучинг', 'Коучинг цілей'],
    generalInfoItems: [{ label: 'Локація', value: 'Київ' }],
    showAboutDetails: false,
  }
}

describe('PublicProfileHeroSection', () => {
  it('hides a subtitle generated only from specializations and location', () => {
    render(PublicProfileHeroSection, {
      props: buildProps('Командний коучинг, Коучинг цілей · Київ'),
    })

    expect(screen.queryByText('Командний коучинг, Коучинг цілей · Київ')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Мої спеціалізації')).toBeInTheDocument()
    expect(screen.getByLabelText('Загальна інформація')).toHaveTextContent('Київ')
  })

  it('renders a distinct manual professional headline', () => {
    render(PublicProfileHeroSection, {
      props: buildProps('Допомагаю командам проходити зміни без зайвого хаосу'),
    })

    expect(
      screen.getByText('Допомагаю командам проходити зміни без зайвого хаосу')
    ).toBeInTheDocument()
  })
})
