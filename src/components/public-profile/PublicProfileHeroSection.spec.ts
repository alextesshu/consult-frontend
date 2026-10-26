import { fireEvent, render, screen } from '@testing-library/vue'
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
  it.each([28, 40, 56])('uses the local responsive %ipx source size without changing v1', async size => {
    const width = vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(400)
    const rect = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ width: 100 } as DOMRect)
    const view = render(PublicProfileHeroSection, { props: { ...buildProps(''), uiV2: true } })
    try {
      const title = screen.getByRole('heading', { level: 1 })
      title.style.setProperty('--pc-profile-title-size', `${size}px`)
      window.dispatchEvent(new Event('resize'))
      await nextTick()
      expect(title.style.fontSize).toBe(`${size}px`)
      await view.rerender({ uiV2: false })
      expect(title.style.fontSize).toBe('')
    } finally { view.unmount(); width.mockRestore(); rect.mockRestore() }
  })
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
  it('shows an initials tile for a missing or broken photo in UI v2 only', async () => {
    const v2 = render(PublicProfileHeroSection, {
      props: { ...buildProps(''), uiV2: true, publicName: 'Олена Коваль', profile: { photo_url: 'https://example.test/broken.jpg' } },
    })
    const photo = screen.getByRole('img', { name: 'Фото спеціаліста' })
    await fireEvent.error(photo)
    const fallback = screen.getByRole('img', { name: 'Фото спеціаліста не завантажилося' })
    expect(fallback).toHaveTextContent('ОК')
    expect(screen.queryByRole('img', { name: 'Фото спеціаліста' })).toBeNull()
    await v2.rerender({ profile: { photo_url: 'https://example.test/new.jpg' } })
    expect(screen.getByRole('img', { name: 'Фото спеціаліста' })).toHaveAttribute('src', 'https://example.test/new.jpg')
    await v2.rerender({ profile: {} })
    expect(screen.getByRole('img', { name: 'Фото спеціаліста не додано' })).toHaveTextContent('ОК')
    v2.unmount()

    const v1 = render(PublicProfileHeroSection, {
      props: { ...buildProps(''), publicName: 'Олена Коваль', profile: { photo_url: 'https://example.test/broken.jpg' } },
    })
    await fireEvent.error(screen.getByRole('img', { name: 'Фото спеціаліста' }))
    expect(screen.getByRole('img', { name: 'Фото спеціаліста' })).toBeInTheDocument()
    await v1.rerender({ profile: {} })
    expect(screen.getByText('Фото спеціаліста')).toHaveClass('hero-photo-placeholder')
    expect(document.querySelector('.pc2-profile-photo-fallback')).toBeNull()
    v1.unmount()
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
