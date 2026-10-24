import { render, screen } from '@testing-library/vue'
import { describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
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
  it('fits a complete long word, restores source sizing, and releases resize observation', async () => {
    const width = vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(300)
    const rect = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      return { width: this.textContent === 'Konstantinov' ? 450 : 100 } as DOMRect
    })
    const disconnect = vi.fn()
    const OriginalObserver = globalThis.ResizeObserver
    globalThis.ResizeObserver = class { observe() {} disconnect = disconnect } as unknown as typeof ResizeObserver
    try {
      const view = render(PublicProfileHeroSection, {
        props: { ...buildProps(''), uiV2: true, publicName: 'Alex Konstantinov' },
      })
      const title = screen.getByRole('heading', { level: 1 })
      await nextTick()
      const source = window.innerWidth < 860 ? 34 : Math.min(60, Math.max(40, window.innerWidth * .046))
      expect(parseFloat(title.style.fontSize)).toBeCloseTo(source * 300 / 450, 1)
      await view.rerender({ publicName: 'Alex Doe' })
      expect(parseFloat(title.style.fontSize)).toBeCloseTo(source)
      await view.rerender({ uiV2: false })
      expect(title.style.fontSize).toBe('')
      view.unmount()
      expect(disconnect).toHaveBeenCalledOnce()
    } finally {
      width.mockRestore()
      rect.mockRestore()
      globalThis.ResizeObserver = OriginalObserver
    }
  })
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
