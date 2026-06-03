import { fireEvent, render, screen, waitFor } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
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
  const textarea = document.querySelector('textarea.workbook-page__textarea')
  expect(textarea).toBeInstanceOf(HTMLTextAreaElement)
  return textarea as HTMLTextAreaElement
}

describe('TherapistClientWorkbookView', () => {
  beforeEach(() => {
    mockRoute.params.clientId = '44'
    mockedFetchSpecialistClientWorkbookSnapshot.mockReset()
    mockedSaveSpecialistClientJournal.mockReset()
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
    expect(screen.getByText('Конфіденційно')).toBeInTheDocument()
    expect(screen.getByText(/Клієнт не бачить ці записи/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Назад до клієнта' })).toHaveAttribute(
      'href',
      '/cabinet/clients?client=44&autoOpen=1'
    )
    expect(screen.queryByText(['Назад', 'до', 'CRM'].join(' '))).not.toBeInTheDocument()
  })

  it('inserts the workbook structure into an empty notebook', async () => {
    renderView()

    await fireEvent.click(await screen.findByRole('button', { name: 'Вставити структуру' }))

    expect(workbookTextarea().value).toContain('Запит:')
    expect(workbookTextarea().value).toContain('План:')
  })

  it('appends the workbook structure without overwriting existing content', async () => {
    mockedFetchSpecialistClientWorkbookSnapshot.mockResolvedValue({
      content: 'Existing private context',
      isMissing: false,
      updatedAt: '2099-06-15T11:20:00Z',
    })

    renderView()

    await waitFor(() => {
      expect(workbookTextarea()).toHaveValue('Existing private context')
    })
    await fireEvent.click(screen.getByRole('button', { name: 'Вставити структуру' }))

    expect(workbookTextarea().value).toContain('Existing private context')
    expect(workbookTextarea().value).toContain('Запит:')
    expect(workbookTextarea().value).toContain('План:')
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
