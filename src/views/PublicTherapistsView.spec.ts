import { fireEvent, render, screen, waitFor } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchPublicSpecialists } from '../lib/api'
import PublicTherapistsView from './PublicTherapistsView.vue'

vi.mock('../lib/api', () => ({
  fetchPublicSpecialists: vi.fn(),
}))

const mockedFetchPublicSpecialists = vi.mocked(fetchPublicSpecialists)

function renderView() {
  return render(PublicTherapistsView, {
    global: {
      stubs: {
        RouterLink: {
          props: ['to'],
          template: '<a :href="typeof to === \'string\' ? to : \'\'"><slot /></a>',
        },
      },
    },
  })
}

describe('PublicTherapistsView', () => {
  beforeEach(() => {
    mockedFetchPublicSpecialists.mockReset()
  })

  it('does not fetch specialists on mount and shows initial search-first state', () => {
    renderView()

    expect(mockedFetchPublicSpecialists).not.toHaveBeenCalled()
    expect(screen.getAllByText('Знайти профіль спеціаліста').length).toBeGreaterThan(0)
    expect(
      screen.getByText('Введіть ім’я спеціаліста, частину адреси або посилання, яке вам надіслали.')
    ).toBeInTheDocument()
    expect(
      screen.getByText('Наприклад: Олена Коваль, kovalenko або proconsult.space/s/proconsult')
    ).toBeInTheDocument()
    expect(screen.getByText('Знайдіть профіль за посиланням або іменем')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Вставте ім’я спеціаліста або посилання, яке він надіслав. Профілі з’являються тут лише після пошуку.'
      )
    ).toBeInTheDocument()
    expect(screen.queryByText(/Всього/i)).not.toBeInTheDocument()
  })

  it('does not fetch for short queries and shows validation message', async () => {
    renderView()

    await fireEvent.update(screen.getByPlaceholderText('Ім’я спеціаліста або частина посилання'), 'Ол')
    await fireEvent.click(screen.getByRole('button', { name: 'Знайти профіль' }))

    expect(mockedFetchPublicSpecialists).not.toHaveBeenCalled()
    expect(screen.getByText('Введіть щонайменше 3 символи для пошуку.')).toBeInTheDocument()
  })

  it('searches by name with page_size=5 and renders a compact result card', async () => {
    mockedFetchPublicSpecialists.mockResolvedValue({
      results: [
        {
          slug: 'olena-koval',
          public_slug: 'olena-koval',
          display_name: 'Олена Коваль',
          public_display_name: 'Олена Коваль',
          public_profile_summary: 'Працюю з тривогою, вигоранням і складними життєвими змінами.',
          specializations: ['Командний коучинг', 'Коучинг цілей'],
          offers_online: true,
          offers_offline: true,
          location: 'Київ',
        } as any,
      ],
      page: 1,
      page_size: 5,
      total: 1,
      total_pages: 1,
    })

    renderView()

    await fireEvent.update(screen.getByPlaceholderText('Ім’я спеціаліста або частина посилання'), 'Олена')
    await fireEvent.click(screen.getByRole('button', { name: 'Знайти профіль' }))

    await waitFor(() => {
      expect(mockedFetchPublicSpecialists).toHaveBeenCalledWith({ name: 'Олена', page_size: 5 })
    })

    expect(await screen.findByText('Олена Коваль')).toBeInTheDocument()
    expect(screen.getByText('Командний коучинг')).toBeInTheDocument()
    expect(screen.getByText('Командний коучинг, Коучинг цілей')).toBeInTheDocument()
    expect(screen.getByText('Онлайн · Офлайн')).toBeInTheDocument()
    expect(screen.getByText('Київ')).toBeInTheDocument()

    const link = screen.getByRole('link', { name: /Олена Коваль/ })
    expect(link).toHaveAttribute('href', '/s/olena-koval')
    expect(screen.getByText('Відкрити профіль')).toBeInTheDocument()
    expect(screen.queryByText(/Всього/i)).not.toBeInTheDocument()
  })

  it('normalizes pasted full profile URL before searching', async () => {
    mockedFetchPublicSpecialists.mockResolvedValue({
      results: [],
      page: 1,
      page_size: 5,
      total: 0,
      total_pages: 1,
    })

    renderView()

    const input = screen.getByPlaceholderText('Ім’я спеціаліста або частина посилання') as HTMLInputElement
    await fireEvent.update(input, 'https://proconsult.space/s/proconsult')
    await fireEvent.click(screen.getByRole('button', { name: 'Знайти профіль' }))

    await waitFor(() => {
      expect(mockedFetchPublicSpecialists).toHaveBeenCalledWith({ name: 'proconsult', page_size: 5 })
    })
    expect(input.value).toBe('proconsult')
  })

  it('normalizes pasted profile path before searching', async () => {
    mockedFetchPublicSpecialists.mockResolvedValue({
      results: [],
      page: 1,
      page_size: 5,
      total: 0,
      total_pages: 1,
    })

    renderView()

    const input = screen.getByPlaceholderText('Ім’я спеціаліста або частина посилання') as HTMLInputElement
    await fireEvent.update(input, '/s/proconsult/')
    await fireEvent.click(screen.getByRole('button', { name: 'Знайти профіль' }))

    await waitFor(() => {
      expect(mockedFetchPublicSpecialists).toHaveBeenCalledWith({ name: 'proconsult', page_size: 5 })
    })
    expect(input.value).toBe('proconsult')
  })

  it('renders no-results state after successful search with empty response', async () => {
    mockedFetchPublicSpecialists.mockResolvedValue({
      results: [],
      page: 1,
      page_size: 5,
      total: 0,
      total_pages: 1,
    })

    renderView()

    await fireEvent.update(screen.getByPlaceholderText('Ім’я спеціаліста або частина посилання'), 'Марія')
    await fireEvent.click(screen.getByRole('button', { name: 'Знайти профіль' }))

    expect(await screen.findByText('Профіль не знайдено')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Перевірте написання або попросіть спеціаліста надіслати пряме посилання на профіль. Деякі профілі доступні тільки за прямим посиланням або ще не увімкнені спеціалістом.'
      )
    ).toBeInTheDocument()
  })

  it('keeps cautious lookup wording without marketplace positioning', () => {
    renderView()

    const pageText = document.body.textContent || ''
    expect(pageText).not.toContain('каталог спеціалістів')
    expect(pageText).not.toContain('оберіть найкращого')
    expect(pageText).not.toContain('рейтинг')
    expect(pageText).not.toContain('порівняйте спеціалістів')
    expect(pageText).not.toContain('знайдіть психолога для себе')
    expect(pageText).not.toContain('/tour')
  })
})
