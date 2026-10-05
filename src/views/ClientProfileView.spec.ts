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

const mockAuthStore = {
  logout: vi.fn(),
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

vi.mock('../stores/auth', () => ({
  useAuthStore: () => mockAuthStore,
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
    account_email: 'account@example.com',
    contact_email: 'maria@example.com',
    contact_phone: '+380991112233',
    photo_url: null,
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
    mockAuthStore.logout.mockReset()
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
    expect(screen.getByRole('button', { name: 'Видалити акаунт' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Скасувати видалення' })).not.toBeInTheDocument()
  })

  it('loads and saves editable fields without sending an absent photo', async () => {
    const savedProfile = profileFixture({
      display_name: 'Updated client',
      contact_email: 'updated@example.com',
      contact_phone: '+380501112233',
    })
    mockedUpdateClientProfile.mockResolvedValue(savedProfile)

    const { container } = renderView()

    await waitFor(() => {
      expect(container.querySelectorAll('.profile-form input')).toHaveLength(3)
    })
    const inputs = container.querySelectorAll<HTMLInputElement>('.profile-form input')
    await fireEvent.update(inputs[0]!, 'Updated client')
    await fireEvent.update(inputs[1]!, 'updated@example.com')
    await fireEvent.update(inputs[2]!, '+380501112233')
    await fireEvent.submit(container.querySelector('.profile-form') as HTMLFormElement)

    await waitFor(() => {
      expect(mockedUpdateClientProfile).toHaveBeenCalledWith({
        display_name: 'Updated client',
        contact_email: 'updated@example.com',
        contact_phone: '+380501112233',
      })
    })
    expect(mockedUpdateClientProfile.mock.calls[0]?.[0]).not.toHaveProperty('photo_url')
    expect(screen.getByText('account@example.com')).toBeInTheDocument()
    expect(screen.getByText('Email акаунта')).toBeInTheDocument()
    expect(mockedUpdateClientProfile.mock.calls[0]?.[0]).not.toHaveProperty('account_email')
    expect(mockRouter.push).toHaveBeenCalledWith('/client')
  })

  it('keeps the existing photo upload flow', async () => {
    mockedUploadClientPhoto.mockResolvedValue(
      profileFixture({ photo_url: 'https://signed.example/client-photos/new.jpg' })
    )
    const { container } = renderView()

    await waitFor(() => {
      expect(container.querySelector('input[type="file"]')).toBeInTheDocument()
    })
    const file = new File(['photo'], 'photo.jpg', { type: 'image/jpeg' })
    const photoInput = container.querySelector<HTMLInputElement>('input[type="file"]')
    Object.defineProperty(photoInput, 'files', {
      configurable: true,
      value: [file],
    })
    await fireEvent(photoInput as HTMLInputElement, new Event('change', { bubbles: true }))

    await waitFor(() => {
      expect(mockedUploadClientPhoto).toHaveBeenCalledWith(file)
    })
    expect(
      container.querySelector('img[src="https://signed.example/client-photos/new.jpg"]')
    ).toBeInTheDocument()
  })

  it('executes account deletion from confirm modal, clears auth, and redirects', async () => {
    mockedCreateDataDeletionRequest.mockResolvedValue(
      dataDeletionFixture({
        status: 'EXECUTED',
      })
    )

    renderView()

    await screen.findByDisplayValue('Марія')
    await fireEvent.click(screen.getByRole('button', { name: 'Видалити акаунт' }))
    const dialog = await screen.findByRole('dialog', {
      name: 'Видалити акаунт?',
    })
    expect(within(dialog).queryByRole('textbox')).not.toBeInTheDocument()
    await fireEvent.click(within(dialog).getByRole('button', { name: 'Видалити акаунт' }))

    await waitFor(() => {
      expect(mockedCreateDataDeletionRequest).toHaveBeenCalledWith()
    })
    expect(mockAuthStore.logout).toHaveBeenCalledTimes(1)
    expect(mockRouter.push).toHaveBeenCalledWith('/login')
    expect(mockToast.success).toHaveBeenCalledWith('Акаунт видалено.')
  })

  it('shows neutral blocked message with blocker labels', async () => {
    mockedCreateDataDeletionRequest.mockRejectedValue({
      response: {
        data: {
          code: 'ACCOUNT_DELETION_BLOCKED',
          blockers: {
            counts: {
              future_sessions_count: 1,
            },
            items: [
              {
                code: 'future_sessions_count',
                count: 1,
                label: 'Є майбутні сесії. Завершіть або скасуйте їх перед видаленням акаунта.',
              },
            ],
          },
        },
      },
    })

    renderView()

    await screen.findByDisplayValue('Марія')
    await fireEvent.click(screen.getByRole('button', { name: 'Видалити акаунт' }))
    const dialog = await screen.findByRole('dialog', {
      name: 'Видалити акаунт?',
    })
    await fireEvent.click(within(dialog).getByRole('button', { name: 'Видалити акаунт' }))

    expect(
      await screen.findByText(
        'Зараз видалення акаунта не завершено. Завершіть активні дії в акаунті та спробуйте ще раз.'
      )
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'Є майбутні сесії. Завершіть або скасуйте їх перед видаленням акаунта.'
      )
    ).toBeInTheDocument()
    expect(mockAuthStore.logout).not.toHaveBeenCalled()
  })

  it('shows in-review request and lets client cancel it', async () => {
    mockedFetchCurrentDataDeletionRequest.mockResolvedValue(
      dataDeletionFixture({
        status: 'IN_REVIEW',
      })
    )
    mockedCancelDataDeletionRequest.mockResolvedValue(
      dataDeletionFixture({
        status: 'CANCELLED',
        cancelled_at: '2026-06-17T10:30:00Z',
      })
    )

    renderView()

    expect(await screen.findByText('Видалення акаунта в обробці')).toBeInTheDocument()
    await fireEvent.click(screen.getByRole('button', { name: 'Скасувати видалення' }))

    await waitFor(() => {
      expect(mockedCancelDataDeletionRequest).toHaveBeenCalledWith(17)
    })
    expect(await screen.findByText('Видалення акаунта скасовано')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Видалити акаунт' })).toBeInTheDocument()
    expect(mockToast.success).toHaveBeenCalledWith('Видалення акаунта скасовано.')
  })

  it('shows approved state without cancel action', async () => {
    mockedFetchCurrentDataDeletionRequest.mockResolvedValue(
      dataDeletionFixture({
        status: 'APPROVED',
        reviewed_at: '2026-06-17T09:15:00Z',
      })
    )

    renderView()

    expect(await screen.findByText('Видалення акаунта в обробці')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Видалити акаунт' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Скасувати видалення' })).not.toBeInTheDocument()
  })

  it('keeps banned phrases out of the deletion flow copy', async () => {
    const { container } = renderView()

    await screen.findByRole('heading', { name: 'Акаунт і дані' })

    expect(container.textContent).not.toMatch(
      /запит на видалення|підтримка|перевірка|процедура|ризик|історія сервісу|дані іншої сторони|зв’яжеться з вами/i
    )
  })
})
