import { fireEvent, render, screen, waitFor } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiGet } from '../lib/api'
import {
  fetchSpecialistClientWorkbookSnapshot,
  saveSpecialistClientJournal,
} from '../lib/specialistSessions'
import TherapistClientWorkbookView from './TherapistClientWorkbookView.vue'

const mockRoute = {
  params: {
    clientId: '44',
  },
}

vi.mock('vue-router', async () => {
  const actual = await vi.importActual<typeof import('vue-router')>('vue-router')

  return {
    ...actual,
    useRoute: () => mockRoute,
  }
})

vi.mock('../lib/specialistSessions', () => ({
  fetchSpecialistClientWorkbookSnapshot: vi.fn(),
  saveSpecialistClientJournal: vi.fn(),
}))
vi.mock('../lib/api', () => ({
  apiGet: vi.fn(),
}))

const mockedApiGet = vi.mocked(apiGet)
const mockedFetchSpecialistClientWorkbookSnapshot = vi.mocked(fetchSpecialistClientWorkbookSnapshot)
const mockedSaveSpecialistClientJournal = vi.mocked(saveSpecialistClientJournal)

function renderView() {
  return render(TherapistClientWorkbookView, {
    global: {
      stubs: {
        RouterLink: {
          props: ['to'],
          computed: {
            href() {
              const to = this.to as string | { path?: string; query?: Record<string, string> }
              if (typeof to === 'string') return to
              const params = new URLSearchParams(to.query || {})
              return `${to.path || ''}${params.toString() ? `?${params.toString()}` : ''}`
            },
          },
          template: '<a :href="href"><slot /></a>',
        },
      },
    },
  })
}

function workbookTextarea() {
  const textarea = screen.getByRole('textbox')
  expect(textarea).toBeInstanceOf(HTMLTextAreaElement)
  return textarea as HTMLTextAreaElement
}

async function waitForWorkbookTextarea() {
  return (await screen.findByRole('textbox')) as HTMLTextAreaElement
}

describe('TherapistClientWorkbookView', () => {
  beforeEach(() => {
    mockRoute.params.clientId = '44'
    mockedApiGet.mockReset()
    mockedFetchSpecialistClientWorkbookSnapshot.mockReset()
    mockedSaveSpecialistClientJournal.mockReset()
    mockedApiGet.mockResolvedValue([
      {
        client_id: 44,
        client_display_name: 'Олена Тест',
        client_email: 'olena@example.com',
        client_phone: '+380501112233',
      },
    ])
    mockedFetchSpecialistClientWorkbookSnapshot.mockResolvedValue({
      content: '',
      isMissing: true,
      updatedAt: null,
    })
    mockedSaveSpecialistClientJournal.mockResolvedValue({ updated_at: '2099-06-16T12:00:00Z' } as any)
  })

  it('renders private notebook framing and returns to the selected client', async () => {
    renderView()

    expect(await screen.findByRole('heading', { name: 'Приватний зошит' })).toBeInTheDocument()
    await waitFor(() => {
      expect(document.querySelector('.workbook-page__client')).toHaveTextContent('Клієнт: Олена Тест')
    })
    await waitForWorkbookTextarea()
    expect(screen.getByText('olena@example.com · +380501112233')).toBeInTheDocument()
    expect(screen.getByText('Конфіденційно')).toBeInTheDocument()
    expect(screen.getAllByText(/Клієнт не бачить ці записи/).length).toBeGreaterThan(0)
    expect(screen.getByText(/Цей простір призначений для робочих нотаток спеціаліста/)).toBeInTheDocument()
    expect(screen.getByText(/Не використовуйте його для ведення офіційної медичної документації/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Назад до клієнта' })).toHaveAttribute(
      'href',
      '/cabinet/clients?client=44&autoOpen=1'
    )
    expect(screen.queryByText(['Назад', 'до', 'CRM'].join(' '))).not.toBeInTheDocument()
  })

  it('falls back to a technical client label when identity is unavailable', async () => {
    mockedApiGet.mockResolvedValue([])

    renderView()

    expect(await screen.findByRole('heading', { name: 'Приватний зошит' })).toBeInTheDocument()
    await waitFor(() => {
      expect(document.querySelector('.workbook-page__client')).toHaveTextContent('Клієнт: Клієнт #44')
    })
    await waitForWorkbookTextarea()
  })

  it('renders structure chips near the editor', async () => {
    renderView()

    await waitForWorkbookTextarea()
    await waitFor(() => {
      expect(document.querySelector('.workbook-section-tools__label')).toHaveTextContent('Додати секцію:')
      expect(screen.getByRole('button', { name: 'Запит' })).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: 'Спостереження' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Динаміка' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'План' })).toBeInTheDocument()
  })

  it('inserts a Markdown-style section heading from a chip', async () => {
    renderView()

    await waitForWorkbookTextarea()
    await fireEvent.click(await screen.findByRole('button', { name: 'Запит' }))

    expect(workbookTextarea().value).toContain('**Запит:**')
    expect(screen.getByText('Є незбережені зміни')).toBeInTheDocument()
  })

  it('preserves multiple chip insertions with clean spacing', async () => {
    renderView()

    await waitForWorkbookTextarea()
    await fireEvent.click(await screen.findByRole('button', { name: 'Запит' }))
    await fireEvent.click(screen.getByRole('button', { name: 'План' }))

    expect(workbookTextarea().value).toContain('**Запит:**')
    expect(workbookTextarea().value).toContain('**План:**')
    expect(workbookTextarea().value.indexOf('**Запит:**')).toBeLessThan(workbookTextarea().value.indexOf('**План:**'))
  })

  it('does not overwrite existing notebook content when inserting a chip', async () => {
    mockedFetchSpecialistClientWorkbookSnapshot.mockResolvedValue({
      content: 'Existing private context',
      isMissing: false,
      updatedAt: '2099-06-15T11:20:00Z',
    })

    renderView()

    await waitFor(() => {
      expect(workbookTextarea()).toHaveValue('Existing private context')
    })
    await fireEvent.click(screen.getByRole('button', { name: 'Запит' }))

    expect(workbookTextarea().value).toContain('Existing private context')
    expect(workbookTextarea().value).toContain('**Запит:**')
    expect(screen.getByText('Є незбережені зміни')).toBeInTheDocument()
  })

  it('replaces selected text when inserting a chip and places the cursor after the heading', async () => {
    mockedFetchSpecialistClientWorkbookSnapshot.mockResolvedValue({
      content: 'Before selected after',
      isMissing: false,
      updatedAt: null,
    })

    renderView()

    await waitFor(() => {
      expect(workbookTextarea()).toHaveValue('Before selected after')
    })
    const textarea = workbookTextarea()
    textarea.focus()
    textarea.setSelectionRange('Before '.length, 'Before selected'.length)
    await fireEvent.click(screen.getByRole('button', { name: 'План' }))

    expect(textarea.value).toBe('Before \n\n**План:**\n\n after')
    expect(textarea.selectionStart).toBe('Before \n\n**План:**\n\n'.length)
    expect(textarea.selectionEnd).toBe('Before \n\n**План:**\n\n'.length)
  })

  it('inserts the full workbook structure into an empty notebook', async () => {
    renderView()

    await waitForWorkbookTextarea()
    await fireEvent.click(await screen.findByRole('button', { name: 'Вставити базову структуру' }))

    expect(workbookTextarea().value).toContain('**Запит:**')
    expect(workbookTextarea().value).toContain('**Спостереження:**')
    expect(workbookTextarea().value).toContain('**Динаміка:**')
    expect(workbookTextarea().value).toContain('**План:**')
  })

  it('appends the full workbook structure without overwriting existing content', async () => {
    mockedFetchSpecialistClientWorkbookSnapshot.mockResolvedValue({
      content: 'Existing private context',
      isMissing: false,
      updatedAt: '2099-06-15T11:20:00Z',
    })

    renderView()

    await waitFor(() => {
      expect(workbookTextarea()).toHaveValue('Existing private context')
    })
    await fireEvent.click(screen.getByRole('button', { name: 'Вставити базову структуру' }))

    expect(workbookTextarea().value).toContain('Existing private context')
    expect(workbookTextarea().value).toContain('**Запит:**')
    expect(workbookTextarea().value).toContain('**План:**')
  })

  it('shows dirty and saved states for manual saves', async () => {
    mockedFetchSpecialistClientWorkbookSnapshot.mockResolvedValue({
      content: 'Initial private context',
      isMissing: false,
      updatedAt: '2099-06-15T11:20:00Z',
    })

    renderView()

    await waitFor(() => {
      expect(workbookTextarea()).toHaveValue('Initial private context')
    })
    await fireEvent.update(workbookTextarea(), 'Updated private context')

    expect(screen.getByText('Є незбережені зміни')).toBeInTheDocument()
    await fireEvent.click(screen.getByRole('button', { name: 'Зберегти приватний зошит' }))

    await waitFor(() => {
      expect(mockedSaveSpecialistClientJournal).toHaveBeenCalledWith(44, 'Updated private context')
    })
    expect(screen.getAllByText('Збережено').length).toBeGreaterThan(0)
  })
})
