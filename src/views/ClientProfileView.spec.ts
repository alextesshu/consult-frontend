import { fireEvent, render, screen, waitFor, within } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ClientProfileView from './ClientProfileView.vue'
import {
  cancelDataDeletionRequest,
  createDataDeletionRequest,
  fetchClientProfile,
  fetchCurrentDataDeletionRequest,
  updateClientProfile,
  uploadClientPhoto,
  type ClientProfile,
  type DataDeletionRequest,
} from '../lib/api'

const mockRouter = {
  push: vi.fn(),
}

const mockToast = {
  show: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
}

vi.mock('vue-router', async () => {
  const actual = await vi.importActual<typeof import('vue-router')>('vue-router')
  return {
    ...actual,
    useRouter: () => mockRouter,
  }
})

vi.mock('../composables/useToast', () => ({
  useToast: () => mockToast,
}))

vi.mock('../lib/api', () => ({
  cancelDataDeletionRequest: vi.fn(),
  createDataDeletionRequest: vi.fn(),
  fetchClientProfile: vi.fn(),
  fetchCurrentDataDeletionRequest: vi.fn(),
  updateClientProfile: vi.fn(),
  uploadClientPhoto: vi.fn(),
}))

const mockedCancelDataDeletionRequest = vi.mocked(cancelDataDeletionRequest)
const mockedCreateDataDeletionRequest = vi.mocked(createDataDeletionRequest)
const mockedFetchClientProfile = vi.mocked(fetchClientProfile)
const mockedFetchCurrentDataDeletionRequest = vi.mocked(fetchCurrentDataDeletionRequest)
const mockedUpdateClientProfile = vi.mocked(updateClientProfile)
const mockedUploadClientPhoto = vi.mocked(uploadClientPhoto)

function profileFixture(overrides: Partial<ClientProfile> = {}): ClientProfile {
  return {
    id: 7,
    display_name: 'Марія',
    contact_email: 'maria@example.com',
    contact_phone: '+380991112233',
    photo_url: '',
    client_code: 'CL-1007',
    created_at: '2026-06-01T10:00:00Z',
    updated_at: '2026-06-16T10:00:00Z',
    ...overrides,
  }
}

function dataDeletionFixture(overrides: Partial<DataDeletionRequest> = {}): DataDeletionRequest {
  return {
    id: 17,
    kind: 'ACCOUNT',
    status: 'SUBMITTED',
    reason: '',
    submitted_at: '2026-06-16T12:00:00Z',
    reviewed_at: null,
    cancelled_at: null,
    ...overrides,
  }
}

function renderView() {
  return render(ClientProfileView, {
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

describe('ClientProfileView', () => {
  beforeEach(() => {
    mockRouter.push.mockReset()
    mockToast.show.mockReset()
    mockToast.success.mockReset()
    mockToast.error.mockReset()
    mockToast.warning.mockReset()
    mockToast.info.mockReset()

    mockedFetchClientProfile.mockReset()
    mockedFetchCurrentDataDeletionRequest.mockReset()
    mockedCreateDataDeletionRequest.mockReset()
    mockedCancelDataDeletionRequest.mockReset()
    mockedUpdateClientProfile.mockReset()
    mockedUploadClientPhoto.mockReset()

    mockedFetchClientProfile.mockResolvedValue(profileFixture())
    mockedFetchCurrentDataDeletionRequest.mockResolvedValue(null)
  })

  it('loads profile and shows account and data block with submit action when no request exists', async () => {
    renderView()

    expect(await screen.findByDisplayValue('Марія')).toBeInTheDocument()
    expect(mockedFetchCurrentDataDeletionRequest).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('heading', { name: 'Акаунт і дані' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Подати запит на видалення' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Скасувати запит' })).not.toBeInTheDocument()
  })

  it('submits data deletion request from confirm modal with optional reason', async () => {
    mockedCreateDataDeletionRequest.mockResolvedValue(
      dataDeletionFixture({
        reason: 'Хочу завершити користування сервісом після перевірки.',
      })
    )

    renderView()

    await screen.findByDisplayValue('Марія')
    await fireEvent.click(screen.getByRole('button', { name: 'Подати запит на видалення' }))
    const dialog = await screen.findByRole('dialog', {
      name: 'Подати запит на видалення акаунта?',
    })
    await fireEvent.update(
      within(dialog).getByLabelText('Коментар до запиту (необов’язково)'),
      'Хочу завершити користування сервісом після перевірки.'
    )
    await fireEvent.click(within(dialog).getByRole('button', { name: 'Подати запит' }))

    await waitFor(() => {
      expect(mockedCreateDataDeletionRequest).toHaveBeenCalledWith(
        'Хочу завершити користування сервісом після перевірки.'
      )
    })
    expect(await screen.findByText('Запит отримано')).toBeInTheDocument()
    expect(screen.getByText(/Коментар:/)).toHaveTextContent(
      'Коментар: Хочу завершити користування сервісом після перевірки.'
    )
    expect(mockToast.success).toHaveBeenCalledWith('Запит на видалення передано підтримці.')
  })

  it('shows in-review request and lets client cancel it', async () => {
    mockedFetchCurrentDataDeletionRequest.mockResolvedValue(
      dataDeletionFixture({
        status: 'IN_REVIEW',
        reason: 'Потрібна пауза.',
      })
    )
    mockedCancelDataDeletionRequest.mockResolvedValue(
      dataDeletionFixture({
        status: 'CANCELLED',
        reason: 'Потрібна пауза.',
        cancelled_at: '2026-06-17T10:30:00Z',
      })
    )

    renderView()

    expect(await screen.findByText('Запит на розгляді')).toBeInTheDocument()
    await fireEvent.click(screen.getByRole('button', { name: 'Скасувати запит' }))

    await waitFor(() => {
      expect(mockedCancelDataDeletionRequest).toHaveBeenCalledWith(17)
    })
    expect(await screen.findByText('Запит скасовано')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Подати запит на видалення' })).toBeInTheDocument()
    expect(mockToast.success).toHaveBeenCalledWith('Запит скасовано.')
  })

  it('shows approved state without cancel action', async () => {
    mockedFetchCurrentDataDeletionRequest.mockResolvedValue(
      dataDeletionFixture({
        status: 'APPROVED',
        reviewed_at: '2026-06-17T09:15:00Z',
      })
    )

    renderView()

    expect(
      await screen.findByText('Запит підтверджено. Очікує виконання підтримкою.')
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Подати запит на видалення' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Скасувати запит' })).not.toBeInTheDocument()
  })
})
