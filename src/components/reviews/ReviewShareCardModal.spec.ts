import { fireEvent, render, screen, waitFor } from '@testing-library/vue'
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import ReviewShareCardModal from './ReviewShareCardModal.vue'

class MockImage {
  static lastSrc = ''
  onload: null | (() => void) = null
  onerror: null | (() => void) = null
  set src(value: string) {
    MockImage.lastSrc = value
    setTimeout(() => this.onload && this.onload(), 0)
  }
}

describe('ReviewShareCardModal', () => {
  const originalImage = globalThis.Image

  beforeEach(() => {
    vi.restoreAllMocks()
    MockImage.lastSrc = ''
      ; (globalThis as any).Image = MockImage as any
  })

  afterAll(() => {
    ; (globalThis as any).Image = originalImage
  })

  function renderView(profileUrl = 'https://example.com/s/anna-kupriyan', specialistDisplayName = 'Олена Коваль') {
    const anchorClick = vi.fn()
    const toDataUrl = vi.fn(() => 'data:image/png;base64,test')
    const drawImage = vi.fn()

    const createElementSpy = vi.spyOn(document, 'createElement')
    createElementSpy.mockImplementation(((tagName: string) => {
      if (tagName === 'canvas') {
        return {
          width: 0,
          height: 0,
          getContext: () => ({ drawImage }),
          toDataURL: toDataUrl,
        } as any
      }
      if (tagName === 'a') {
        return {
          href: '',
          download: '',
          click: anchorClick,
        } as any
      }
      return document.createElementNS('http://www.w3.org/1999/xhtml', tagName) as any
    }) as any)

    const utils = render(ReviewShareCardModal, {
      props: {
        open: true,
        reviewText: 'Мені стало легше після консультації та з’явилося більше ясності.',
        reviewUid: 'practice:123',
        specialistDisplayName,
        profileUrl,
      },
    })

    return { ...utils, anchorClick, toDataUrl, drawImage, createElementSpy }
  }

  it('renders modal title and defaults', async () => {
    renderView()
    expect(screen.getByRole('dialog', { name: 'Створити картку відгуку' })).toBeInTheDocument()
    expect(screen.getByText('Створити картку')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Квадрат 1080×1080')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Світла')).toBeInTheDocument()
  })

  it('preview includes Pro Consult branding and consent footer', async () => {
    const { container } = renderView()
    expect(screen.getByText('Відгук через Pro Consult')).toBeInTheDocument()
    expect(screen.queryByText('Відгук клієнта через proconsult.space')).not.toBeInTheDocument()
    expect(screen.getByText('Використано зі згоди клієнта')).toBeInTheDocument()
    expect(screen.getByText('proconsult.space')).toBeInTheDocument()
    expect(container.querySelector('image')).toBeInTheDocument()
  })

  it('preview and exported SVG keep quotation marks around review text', async () => {
    const { container } = renderView()
    expect(container.innerHTML).toContain('“')
    expect(container.innerHTML).toContain('Мені стало легше після')
    expect(container.innerHTML).toContain('консультації та з’явилося більше')
    expect(container.innerHTML).toContain('ясності.”')
    await fireEvent.click(screen.getByRole('button', { name: 'Завантажити PNG' }))
    await waitFor(() => {
      expect(MockImage.lastSrc).toContain(encodeURIComponent('Відгук через Pro Consult'))
      expect(MockImage.lastSrc).toContain(encodeURIComponent('“'))
      expect(MockImage.lastSrc).toContain(encodeURIComponent('Мені стало легше після'))
      expect(MockImage.lastSrc).toContain(encodeURIComponent('консультації та з’явилося більше'))
      expect(MockImage.lastSrc).toContain(encodeURIComponent('ясності.”'))
      expect(MockImage.lastSrc).toContain(encodeURIComponent('proconsult.space'))
      expect(MockImage.lastSrc).toContain(encodeURIComponent('x="110"'))
    })
  })

  it('does not duplicate existing outer quotes', async () => {
    const quoted = '«Ну дуже гарний спеціаліст. Рекомендую!»'
    render(ReviewShareCardModal, {
      props: {
        open: true,
        reviewText: quoted,
        reviewUid: 'practice:123',
        specialistDisplayName: 'Олена Коваль',
        profileUrl: 'https://example.com/s/anna-kupriyan',
      },
    })
    expect(document.body.innerHTML).toContain('“Ну дуже гарний спеціаліст.')
    expect(document.body.innerHTML).toContain('Рекомендую!”')
  })

  it('short text uses compact layout structure', async () => {
    const { container } = renderView()
    expect(container.querySelector('.share-card-preview__svg')).toBeInTheDocument()
    expect(container.innerHTML).toContain('data-layout="square-v1"')
  })

  it('can switch story format and dark theme', async () => {
    const { container } = renderView()
    await fireEvent.update(screen.getByDisplayValue('Квадрат 1080×1080'), 'story')
    expect(screen.getByDisplayValue('Stories 1080×1920')).toBeInTheDocument()
    expect(container.innerHTML).toContain('data-layout="story-v1"')
    await fireEvent.update(screen.getByDisplayValue('Світла'), 'dark')
    expect(screen.getByDisplayValue('Темна')).toBeInTheDocument()
  })

  it('exported SVG applies light logo treatment for dark theme', async () => {
    renderView()
    await fireEvent.update(screen.getByDisplayValue('Квадрат 1080×1080'), 'story')
    await fireEvent.update(screen.getByDisplayValue('Світла'), 'dark')
    await fireEvent.click(screen.getByRole('button', { name: 'Завантажити PNG' }))
    await waitFor(() => {
      expect(MockImage.lastSrc).toContain(encodeURIComponent('data-layout="story-v1"'))
      expect(MockImage.lastSrc).toContain(encodeURIComponent('filter="url(#logoLighten)"'))
      expect(MockImage.lastSrc).toContain(encodeURIComponent('<image'))
      expect(MockImage.lastSrc).toMatch(/consult-logo_2026-02-24-2135_black|data%3Aimage/i)
    })
  })

  it('exported SVG uses dark logo source for light theme', async () => {
    renderView()
    await fireEvent.click(screen.getByRole('button', { name: 'Завантажити PNG' }))
    await waitFor(() => {
      expect(MockImage.lastSrc).toContain(encodeURIComponent('data-layout="square-v1"'))
      expect(MockImage.lastSrc).toContain(encodeURIComponent('<image'))
      expect(MockImage.lastSrc).toMatch(/consult-logo_2026-02-24-2135_black|data%3Aimage/i)
    })
  })

  it('shows profile link option only when canonical profileUrl is provided', async () => {
    renderView('https://example.com/s/anna-kupriyan')
    expect(screen.getByText('Показувати посилання на профіль')).toBeInTheDocument()
  })

  it('does not show profile link option when profileUrl is unavailable', async () => {
    renderView(null as any)
    expect(screen.queryByText('Показувати посилання на профіль')).not.toBeInTheDocument()
  })

  it('uses provided specialist display name and never renders login fallback', async () => {
    renderView('https://example.com/s/anna-kupriyan', 'Олена Коваль')
    await fireEvent.click(screen.getByLabelText('Показувати ім’я спеціаліста'))
    expect(screen.getByText('Спеціаліст')).toBeInTheDocument()
    expect(screen.getByText('Олена Коваль')).toBeInTheDocument()
    expect(screen.queryByText('famkendo')).not.toBeInTheDocument()
  })

  it('falls back to "Спеціаліст" when display name unavailable', async () => {
    renderView('https://example.com/s/anna-kupriyan', '')
    await fireEvent.click(screen.getByLabelText('Показувати ім’я спеціаліста'))
    expect((await screen.findAllByText('Спеціаліст')).length).toBeGreaterThan(0)
  })

  it('includes profileUrl in rendered card only when option is enabled and provided', async () => {
    renderView('https://example.com/s/anna-kupriyan')
    await fireEvent.click(screen.getByLabelText('Показувати посилання на профіль'))
    await fireEvent.click(screen.getByRole('button', { name: 'Завантажити PNG' }))
    await waitFor(() => {
      expect(MockImage.lastSrc).toContain(encodeURIComponent('https://example.com/s/anna-kupriyan'))
    })
  })

  it('uses compact logo size in preview/export svg', async () => {
    const { container } = renderView()
    expect(container.innerHTML).toContain('width="185"')
    expect(container.innerHTML).toContain('text-anchor="end"')
  })

  it('uses a higher safe footer zone for story than square', async () => {
    const { container } = renderView()
    expect(container.innerHTML).toContain('data-layout="square-v1"')
    expect(container.innerHTML).toContain('y="890"')

    await fireEvent.update(screen.getByDisplayValue('Квадрат 1080×1080'), 'story')
    expect(container.innerHTML).toContain('data-layout="story-v1"')
    expect(container.innerHTML).toContain('y="1600"')
    expect(container.innerHTML).toContain('width="210"')
  })

  it('export keeps author, specialist label, specialist name and consent text', async () => {
    renderView('https://example.com/s/anna-kupriyan', 'Олександр Константінов')
    await fireEvent.click(screen.getByLabelText('Показувати ім’я спеціаліста'))
    await fireEvent.click(screen.getByRole('button', { name: 'Завантажити PNG' }))
    await waitFor(() => {
      expect(MockImage.lastSrc).toContain(encodeURIComponent('Анонімний клієнт'))
      expect(MockImage.lastSrc).toContain(encodeURIComponent('Спеціаліст'))
      expect(MockImage.lastSrc).toContain(encodeURIComponent('Олександр Константінов'))
      expect(MockImage.lastSrc).toContain(encodeURIComponent('Використано зі згоди клієнта'))
    })
  })

  it('never injects username fallback into generated card', async () => {
    renderView(null as any)
    await fireEvent.click(screen.getByRole('button', { name: 'Завантажити PNG' }))
    await waitFor(() => {
      expect(MockImage.lastSrc).not.toContain(encodeURIComponent('/s/famkendo'))
      expect(MockImage.lastSrc).not.toContain(encodeURIComponent('/s/therapist_slug'))
    })
  })

  it('download button triggers PNG generation and sanitized filename', async () => {
    const { anchorClick, toDataUrl, drawImage, createElementSpy } = renderView()
    let capturedAnchor: any = null

    createElementSpy.mockImplementation(((tagName: string) => {
      if (tagName === 'canvas') {
        return {
          width: 0,
          height: 0,
          getContext: () => ({ drawImage }),
          toDataURL: toDataUrl,
        } as any
      }
      if (tagName === 'a') {
        capturedAnchor = {
          href: '',
          download: '',
          click: anchorClick,
        }
        return capturedAnchor
      }
      return document.createElementNS('http://www.w3.org/1999/xhtml', tagName) as any
    }) as any)

    await fireEvent.click(screen.getByRole('button', { name: 'Завантажити PNG' }))

    await waitFor(() => {
      expect(drawImage).toHaveBeenCalled()
      expect(toDataUrl).toHaveBeenCalledWith('image/png')
      expect(anchorClick).toHaveBeenCalled()
      expect(capturedAnchor.download).toBe('proconsult-review-card-practice-123.png')
    })
  })
})
