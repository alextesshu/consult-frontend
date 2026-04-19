import { fireEvent, render, screen, waitFor, within } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  apiGet,
  apiPost,
  fetchSessionPaymentProof,
  requestSessionPaymentProof,
  markSessionPaymentProofPaid,
  requestSessionPaymentProofClarification,
  uploadSessionPaymentProof,
} from '../lib/api'
import ClientSessionDetailView from './ClientSessionDetailView.vue'

const mockRoute = {
  params: {
    id: '55',
  },
}

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
    useRoute: () => mockRoute,
    useRouter: () => mockRouter,
  }
})

vi.mock('../composables/useToast', () => ({
  useToast: () => mockToast,
}))

vi.mock('../lib/api', () => ({
  apiGet: vi.fn(),
  apiPatch: vi.fn(),
  apiPost: vi.fn(),
  fetchSessionPaymentProof: vi.fn(),
  requestSessionPaymentProof: vi.fn(),
  markSessionPaymentProofPaid: vi.fn(),
  requestSessionPaymentProofClarification: vi.fn(),
  uploadSessionPaymentProof: vi.fn(),
}))

const mockedApiGet = vi.mocked(apiGet)
const mockedApiPost = vi.mocked(apiPost)
const mockedFetchSessionPaymentProof = vi.mocked(fetchSessionPaymentProof)
const mockedRequestSessionPaymentProof = vi.mocked(requestSessionPaymentProof)
const mockedMarkSessionPaymentProofPaid = vi.mocked(markSessionPaymentProofPaid)
const mockedRequestSessionPaymentProofClarification = vi.mocked(requestSessionPaymentProofClarification)
const mockedUploadSessionPaymentProof = vi.mocked(uploadSessionPaymentProof)

function makeSession(status: string, overrides: Record<string, unknown> = {}) {
  return {
    id: 55,
    status,
    slot_start_at: '2099-06-15T10:00:00Z',
    slot_end_at: '2099-06-15T10:50:00Z',
    specialist_id: 8,
    specialist_name: 'Олена',
    specialist_email: 'therapist@example.com',
    therapist: 8,
    therapist_name: 'Олена',
    therapist_email: 'therapist@example.com',
    therapist_public_slug: 'olena',
    specialist_public_slug: 'olena',
    session_format: 'online',
    offline_location: null,
    meeting_url: 'https://meet.google.com/abc-defg-hij',
    meeting_provider: 'google_meet',
    client: 21,
    ...overrides,
  }
}

function renderView() {
  return render(ClientSessionDetailView, {
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

describe('ClientSessionDetailView', () => {
  beforeEach(() => {
    mockRoute.params.id = '55'
    mockRouter.push.mockReset()
    mockToast.show.mockReset()
    mockToast.success.mockReset()
    mockToast.error.mockReset()
    mockToast.warning.mockReset()
    mockToast.info.mockReset()
    mockedApiGet.mockReset()
    mockedApiPost.mockReset()
    mockedFetchSessionPaymentProof.mockReset()
    mockedRequestSessionPaymentProof.mockReset()
    mockedMarkSessionPaymentProofPaid.mockReset()
    mockedRequestSessionPaymentProofClarification.mockReset()
    mockedUploadSessionPaymentProof.mockReset()
  })

  it('shows confirmed-session guidance and request-based reschedule copy', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === '/booking/sessions/55/') {
        return makeSession('CONFIRMED')
      }

      if (url === '/booking/slots/') {
        return [
          {
            id: 101,
            start_at: '2099-06-16T10:00:00Z',
            end_at: '2099-06-16T10:50:00Z',
          },
        ]
      }

      if (url === '/booking/sessions/55/reschedule-suggestions/') {
        return {
          suggestions: [
            {
              slot_id: 101,
              start_at: '2099-06-16T10:00:00Z',
              end_at: '2099-06-16T10:50:00Z',
              label: 'Suggested',
              reason_tag: 'nearest_available',
            },
          ],
        }
      }

      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    renderView()

    expect(
      await screen.findByText(
        'Сесію вже підтверджено спеціалістом. Якщо плани зміняться, завчасно надішліть запит на перенесення або скасуйте запис. Для входу в онлайн-зустріч відкрийте блок «Онлайн-зустріч» на цій сторінці та натисніть «Приєднатися».'
      )
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'Для підтвердженої сесії перенесення оформлюється як запит до спеціаліста. Поточний час залишиться чинним, доки запит не погодять.'
      )
    ).toBeInTheDocument()
    expect(screen.getByText('Google Meet')).toBeInTheDocument()
    expect(screen.getByText('Формат: Онлайн')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Приєднатися' })).toHaveAttribute(
      'href',
      'https://meet.google.com/abc-defg-hij'
    )

    const confirmedSuggestionReason = (await screen.findAllByText('Найближче доступне вікно'))[0]
    expect(confirmedSuggestionReason).toBeTruthy()
    await fireEvent.click(confirmedSuggestionReason!.closest('button') as HTMLButtonElement)

    expect(
      await screen.findByRole('button', { name: 'Запросити перенос для обраного варіанта' })
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Запросити перенос' })).toBeInTheDocument()
  })

  it('shows scheduled-session guidance and direct reschedule copy', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === '/booking/sessions/55/') {
        return makeSession('SCHEDULED')
      }

      if (url === '/booking/slots/') {
        return [
          {
            id: 202,
            start_at: '2099-06-18T09:00:00Z',
            end_at: '2099-06-18T09:50:00Z',
          },
        ]
      }

      if (url === '/booking/sessions/55/reschedule-suggestions/') {
        return {
          suggestions: [
            {
              slot_id: 202,
              start_at: '2099-06-18T09:00:00Z',
              end_at: '2099-06-18T09:50:00Z',
              label: 'Suggested',
              reason_tag: 'nearest_available',
            },
          ],
        }
      }

      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    renderView()

    expect(
      await screen.findByText(
        'Сесія ще очікує підтвердження спеціаліста. До підтвердження ви можете одразу перенести запис на інший слот або скасувати його. Коли спеціаліст додасть посилання, воно з’явиться в блоці «Онлайн-зустріч» на цій сторінці.'
      )
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'Для непідтвердженої сесії перенесення виконується одразу: новий слот бронюється, а поточний запис скасовується автоматично.'
      )
    ).toBeInTheDocument()

    await waitFor(() => {
      expect(mockedApiGet).toHaveBeenCalledTimes(3)
    })

    const scheduledSuggestionReason = (await screen.findAllByText('Найближче доступне вікно'))[0]
    expect(scheduledSuggestionReason).toBeTruthy()
    await fireEvent.click(scheduledSuggestionReason!.closest('button') as HTMLButtonElement)

    expect(
      await screen.findByRole('button', { name: 'Перенести на обраний варіант' })
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Перенести сюди' })).toBeInTheDocument()
  })

  it('disables reschedule actions when a confirmed session has already started', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === '/booking/sessions/55/') {
        return makeSession('CONFIRMED', {
          slot_start_at: '2000-01-01T10:00:00Z',
          slot_end_at: '2000-01-01T10:50:00Z',
        })
      }

      if (url === '/booking/slots/') {
        return [
          {
            id: 101,
            start_at: '2099-06-16T10:00:00Z',
            end_at: '2099-06-16T10:50:00Z',
          },
        ]
      }

      if (url === '/booking/sessions/55/reschedule-suggestions/') {
        return { suggestions: [] }
      }

      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    const { container } = renderView()

    await waitFor(() => {
      expect(container.querySelector('.slot-list .btn.btn--ghost.btn--sm')).not.toBeNull()
    })

    const requestButton = container.querySelector('.slot-list .btn.btn--ghost.btn--sm') as HTMLButtonElement | null
    expect(requestButton).not.toBeNull()
    expect(requestButton).toBeDisabled()

    expect(mockedApiPost).not.toHaveBeenCalled()
  })

  it('uploads payment proof from client block and refreshes payment-proof state', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === '/booking/sessions/55/') {
        return makeSession('CONFIRMED', {
          payment_proof: {
            status: 'REQUESTED',
            image_url: null,
            requested_by_specialist_at: '2099-06-15T08:00:00Z',
            submitted_by_client_at: null,
            reviewed_by_specialist_at: null,
            marked_paid_at: null,
            clarification_requested_at: null,
            specialist_note: '',
            client_can_upload_now: true,
            specialist_can_mark_paid_now: false,
            specialist_can_request_clarification_now: false,
            specialist_can_request_proof_now: false,
          },
        })
      }

      if (url === '/booking/slots/') return []
      if (url === '/booking/sessions/55/reschedule-suggestions/') return { suggestions: [] }

      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    mockedUploadSessionPaymentProof.mockResolvedValue({ status: 'PROOF_SUBMITTED' } as any)
    mockedFetchSessionPaymentProof.mockResolvedValue({
      status: 'PROOF_SUBMITTED',
      image_url: 'https://cdn.example.com/proof.webp',
      requested_by_specialist_at: '2099-06-15T08:00:00Z',
      submitted_by_client_at: '2099-06-15T08:15:00Z',
      reviewed_by_specialist_at: null,
      marked_paid_at: null,
      clarification_requested_at: null,
      specialist_note: '',
      client_can_upload_now: true,
      specialist_can_mark_paid_now: false,
      specialist_can_request_clarification_now: false,
      specialist_can_request_proof_now: false,
    } as any)

    renderView()

    expect(await screen.findByText('Спеціаліст запросив підтвердження оплати')).toBeInTheDocument()

    await fireEvent.click(screen.getByRole('button', { name: 'Надіслати підтвердження оплати' }))
    const input = screen.getByLabelText('Upload payment proof image') as HTMLInputElement
    const file = new File(['proof-bytes'], 'proof.jpg', { type: 'image/jpeg' })
    await fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => {
      expect(mockedUploadSessionPaymentProof).toHaveBeenCalledWith(55, file)
      expect(mockedFetchSessionPaymentProof).toHaveBeenCalledWith(55)
      expect(mockToast.success).toHaveBeenCalledWith('Підтвердження оплати надіслано.')
    })

    expect(await screen.findByText('Підтвердження оплати надіслано')).toBeInTheDocument()
    expect(
      screen.getByText('Платформа не перевіряє оплату автоматично. Спеціаліст переглядає підтвердження вручну.')
    ).toBeInTheDocument()
  })

  it('shows completed and cancelled guidance while keeping follow-up actions disabled', async () => {
    let sessionStatus = 'COMPLETED'

    mockedApiGet.mockImplementation(async (url) => {
      if (url === '/booking/sessions/55/') {
        return makeSession(sessionStatus)
      }

      if (url === '/booking/slots/') {
        return [
          {
            id: 303,
            start_at: '2099-06-20T09:00:00Z',
            end_at: '2099-06-20T09:50:00Z',
          },
        ]
      }

      if (url === '/booking/sessions/55/reschedule-suggestions/') {
        return {
          suggestions: [
            {
              slot_id: 303,
              start_at: '2099-06-20T09:00:00Z',
              end_at: '2099-06-20T09:50:00Z',
              label: 'Suggested',
              reason_tag: 'nearest_available',
            },
          ],
        }
      }

      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    const firstView = renderView()

    expect(
      await screen.findByText(
        'Сесію завершено. Для наступної зустрічі оберіть новий вільний слот у профілі спеціаліста.'
      )
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Записатися повторно' })).toHaveAttribute(
      'href',
      '/s/olena'
    )
    expect(screen.getByText('Завершено')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Перенесення доступне лише для активних сесій зі статусом "Заплановано" або "Підтверджено".'
      )
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Скасувати сесію' })).toBeDisabled()
    expect(screen.queryByRole('button', { name: 'Перенести на обраний варіант' })).not.toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Перенести сюди' })).toBeDisabled()
    })

    sessionStatus = 'CANCELLED'
    firstView.unmount()
    renderView()

    expect(
      await screen.findByText(
        'Сесію скасовано. Якщо потрібна нова зустріч, оберіть інший доступний слот у профілі спеціаліста.'
      )
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Обрати новий слот' })).toHaveAttribute(
      'href',
      '/s/olena'
    )
    expect(screen.getByText('Скасовано')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Перенесення доступне лише для активних сесій зі статусом "Заплановано" або "Підтверджено".'
      )
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Скасувати сесію' })).toBeDisabled()
    expect(screen.queryByRole('button', { name: 'Перенести на обраний варіант' })).not.toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Перенести сюди' })).toBeDisabled()
    })
  })

  it('shows online-meeting empty state when specialist has not added a link yet', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === '/booking/sessions/55/') {
        return makeSession('SCHEDULED', {
          meeting_url: null,
          meeting_provider: null,
          join_available: false,
        })
      }

      if (url === '/booking/slots/') {
        return []
      }

      if (url === '/booking/sessions/55/reschedule-suggestions/') {
        return { suggestions: [] }
      }

      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    renderView()

    expect(await screen.findByText('Онлайн-зустріч')).toBeInTheDocument()
    expect(screen.getByText('Посилання ще не додано')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Посилання на онлайн-зустріч ще не додано. Коли спеціаліст додасть посилання, тут з’явиться кнопка «Приєднатися».'
      )
    ).toBeInTheDocument()
    const meetingBlock = screen.getByText('Онлайн-зустріч').closest('.detail-notice--meeting')
    expect(meetingBlock).not.toBeNull()
    expect(within(meetingBlock as HTMLElement).queryByRole('link', { name: 'Приєднатися' })).not.toBeInTheDocument()
    expect(
      within(meetingBlock as HTMLElement).queryByRole('button', { name: 'Скопіювати посилання' })
    ).not.toBeInTheDocument()
  })

  it('renders offline session format, shows location, and hides join actions', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === '/booking/sessions/55/') {
        return makeSession('CONFIRMED', {
          session_format: 'offline',
          offline_location: 'Львів, кабінет 7',
          meeting_url: 'https://meet.google.com/should-not-be-used',
          meeting_provider: 'google_meet',
          join_available: true,
        })
      }

      if (url === '/booking/slots/') return []
      if (url === '/booking/sessions/55/reschedule-suggestions/') return { suggestions: [] }

      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    renderView()

    expect(await screen.findByText('Формат: Офлайн')).toBeInTheDocument()
    expect(screen.getByText('Локація: Львів, кабінет 7')).toBeInTheDocument()
    expect(screen.getByText('Офлайн-сесія')).toBeInTheDocument()
    expect(
      screen.getByText('Це офлайн-формат, посилання для приєднання не потрібне.')
    ).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Приєднатися' })).not.toBeInTheDocument()
  })

  it('calls meeting-link workflow endpoint without sending auto chat message', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === '/booking/sessions/55/') {
        return makeSession('CONFIRMED', {
          specialist_id: 8,
          meeting_url: null,
          meeting_provider: null,
          join_available: false,
        })
      }

      if (url === '/booking/slots/') {
        return []
      }

      if (url === '/booking/sessions/55/reschedule-suggestions/') {
        return { suggestions: [] }
      }

      throw new Error(`Unexpected apiGet call: ${url}`)
    })
    mockedApiPost.mockResolvedValue({ ok: true } as any)
    renderView()

    const requestButton = await screen.findByRole('button', { name: 'Попросити лінк зустрічі' })
    await fireEvent.click(requestButton)

    await waitFor(() => {
      expect(mockedApiPost).toHaveBeenCalledWith('/booking/sessions/55/meeting-link/request/', {})
      expect(mockToast.success).toHaveBeenCalledWith('Запит на посилання надіслано спеціалісту.')
    })

    expect(await screen.findByRole('button', { name: 'Запит надіслано' })).toBeDisabled()
  })
  it('explains waiting state when link exists but join is not available yet', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === '/booking/sessions/55/') {
        return makeSession('CONFIRMED', {
          meeting_url: 'https://meet.google.com/locked-room',
          meeting_provider: 'google_meet',
          join_available: false,
        })
      }

      if (url === '/booking/slots/') {
        return []
      }

      if (url === '/booking/sessions/55/reschedule-suggestions/') {
        return { suggestions: [] }
      }

      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    renderView()

    expect(await screen.findByText('Google Meet')).toBeInTheDocument()
    expect(screen.getByText(/Приєднання стане доступним ближче до часу сесії\./)).toBeInTheDocument()
    const meetingBlock = screen.getByText('Онлайн-зустріч').closest('.detail-notice--meeting')
    expect(meetingBlock).not.toBeNull()
    expect(within(meetingBlock as HTMLElement).queryByRole('link', { name: 'Приєднатися' })).not.toBeInTheDocument()
    expect(
      within(meetingBlock as HTMLElement).getByRole('button', { name: 'Скопіювати посилання' })
    ).toBeInTheDocument()
  })

  it('surfaces backend reason_code copy when a confirmed-session reschedule request is rejected', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === '/booking/sessions/55/') {
        return makeSession('CONFIRMED')
      }

      if (url === '/booking/slots/') {
        return [
          {
            id: 101,
            start_at: '2099-06-16T10:00:00Z',
            end_at: '2099-06-16T10:50:00Z',
          },
        ]
      }

      if (url === '/booking/sessions/55/reschedule-suggestions/') {
        return {
          suggestions: [
            {
              slot_id: 101,
              start_at: '2099-06-16T10:00:00Z',
              end_at: '2099-06-16T10:50:00Z',
              label: 'Suggested',
              reason_tag: 'nearest_available',
            },
          ],
        }
      }

      throw new Error(`Unexpected apiGet call: ${url}`)
    })
    mockedApiPost.mockRejectedValue({
      response: {
        status: 409,
        data: {
          code: 'STATE_TRANSITION_INVALID',
          reason_code: 'REQUEST_NOT_PENDING',
          detail: 'Request already processed.',
        },
      },
    })

    const { container } = renderView()

    await waitFor(() => {
      expect(container.querySelector('.suggestions-list .suggestion-btn')).not.toBeNull()
    })
    await fireEvent.click(container.querySelector('.suggestions-list .suggestion-btn') as HTMLButtonElement)

    await waitFor(() => {
      expect(container.querySelector('.suggestions-block > .btn.btn--sm')).not.toBeNull()
    })
    await fireEvent.click(container.querySelector('.suggestions-block > .btn.btn--sm') as HTMLButtonElement)

    await waitFor(() => {
      expect(mockedApiPost).toHaveBeenCalledWith('/booking/sessions/55/reschedule-request/', { slot_id: 101 })
      expect(mockToast.error).toHaveBeenCalledWith('Цей запит вже оброблено.')
    })
  })
})
