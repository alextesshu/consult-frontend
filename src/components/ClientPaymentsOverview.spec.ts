import { fireEvent, render, screen, waitFor, within } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ClientPaymentsOverview from './ClientPaymentsOverview.vue'
import { fetchClientRecordPayments } from '../lib/api'

vi.mock('../lib/api', () => ({
  fetchClientRecordPayments: vi.fn(),
}))

const mockedFetchClientRecordPayments = vi.mocked(fetchClientRecordPayments)

function renderComponent(props: { recordId: number | null; active: boolean; showNoAccountNote?: boolean }) {
  return render(ClientPaymentsOverview, {
    props: {
      showNoAccountNote: false,
      ...props,
    },
    global: {
      stubs: {
        RouterLink: {
          props: ['to'],
          template: '<a :href="to"><slot /></a>',
        },
      },
    },
  })
}

function overview(overrides: Record<string, unknown> = {}) {
  return {
    client_record: {
      id: 201,
      display_name: 'Payment Client',
      source: 'manual',
      status: 'active',
      user_id: null,
    },
    summary: {
      not_confirmed_count: 0,
      awaiting_client_count: 0,
      awaiting_review_count: 0,
      needs_attention_count: 0,
      paid_count: 0,
    },
    rows: [],
    ...overrides,
  }
}

function paymentRow(overrides: Record<string, unknown> = {}) {
  return {
    session_id: 7001,
    session_status: 'COMPLETED',
    starts_at: '2099-06-15T10:00:00Z',
    ends_at: '2099-06-15T10:50:00Z',
    session_format: 'online',
    price_amount: '1200.00',
    price_currency: 'UAH',
    payment_state: 'PAID',
    payment_proof_status: 'MARKED_PAID',
    cancellation_resolution: null,
    last_payment_action_at: '2099-06-15T11:00:00Z',
    ...overrides,
  }
}

const FIRST_PAYMENT_GUIDANCE_TITLE = 'Як зафіксувати оплату'
const PAYMENT_HEADER_DESCRIPTION =
  'Клієнт оплачує сесію безпосередньо вам. Pro Consult не приймає і не переказує кошти — тут ви лише відстежуєте статус оплати та підтвердження. Змінити статус оплати можна в картці конкретної сесії.'
const REGISTERED_GUIDANCE_COPY =
  'Відкрийте потрібну сесію, щоб керувати статусом оплати. Ця вкладка показує лише загальний стан оплат цього клієнта. У картці сесії можна позначити оплату, запросити підтвердження або перевірити надіслане підтвердження.'
const NO_ACCOUNT_GUIDANCE_COPY =
  'Відкрийте потрібну сесію, щоб зафіксувати оплату вручну. Ця вкладка показує лише загальний стан оплат цього клієнта.'

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

describe('ClientPaymentsOverview', () => {
  beforeEach(() => {
    mockedFetchClientRecordPayments.mockReset()
  })

  it('does not fetch while inactive', () => {
    renderComponent({ recordId: 201, active: false })

    expect(mockedFetchClientRecordPayments).not.toHaveBeenCalled()
  })

  it('fetches payments when active and record id exists', async () => {
    mockedFetchClientRecordPayments.mockResolvedValue(overview() as any)

    renderComponent({ recordId: 201, active: true })

    expect(screen.getByText(PAYMENT_HEADER_DESCRIPTION)).toBeInTheDocument()
    await waitFor(() => {
      expect(mockedFetchClientRecordPayments).toHaveBeenCalledWith(201)
    })
  })

  it('keeps direct-payment explanation visible when first-payment guidance is shown', async () => {
    mockedFetchClientRecordPayments.mockResolvedValue(
      overview({
        rows: [paymentRow({ payment_state: 'NOT_CONFIRMED' })],
      }) as any
    )

    renderComponent({ recordId: 201, active: true })

    expect(screen.getByText(PAYMENT_HEADER_DESCRIPTION)).toBeInTheDocument()
    expect(await screen.findByLabelText(FIRST_PAYMENT_GUIDANCE_TITLE)).toBeInTheDocument()
  })

  it('does not refetch the same loaded record on active toggles', async () => {
    mockedFetchClientRecordPayments.mockResolvedValue(overview() as any)
    const view = renderComponent({ recordId: 201, active: false })

    await view.rerender({ recordId: 201, active: true, showNoAccountNote: false })
    await screen.findByText('Ще немає сесій для відображення оплат')
    await view.rerender({ recordId: 201, active: false, showNoAccountNote: false })
    await view.rerender({ recordId: 201, active: true, showNoAccountNote: false })

    expect(mockedFetchClientRecordPayments).toHaveBeenCalledTimes(1)
  })

  it('reloads when record id changes', async () => {
    mockedFetchClientRecordPayments.mockResolvedValue(overview() as any)
    const view = renderComponent({ recordId: 201, active: true })

    await waitFor(() => expect(mockedFetchClientRecordPayments).toHaveBeenCalledWith(201))
    await view.rerender({ recordId: 202, active: true, showNoAccountNote: false })

    await waitFor(() => expect(mockedFetchClientRecordPayments).toHaveBeenCalledWith(202))
    expect(mockedFetchClientRecordPayments).toHaveBeenCalledTimes(2)
  })

  it('shows missing working-card state when record id is null', () => {
    renderComponent({ recordId: null, active: true })

    expect(mockedFetchClientRecordPayments).not.toHaveBeenCalled()
    expect(screen.getByText('Робоча картка клієнта ще не створена')).toBeInTheDocument()
    expect(screen.getByText('Оплати зʼявляться після її активації.')).toBeInTheDocument()
  })

  it('shows loading state', async () => {
    const request = deferred<any>()
    mockedFetchClientRecordPayments.mockReturnValue(request.promise)

    const { container } = renderComponent({ recordId: 201, active: true })

    await waitFor(() => expect(container.querySelector('.skeleton')).toBeInTheDocument())
    expect(screen.queryByLabelText('Підсумок оплат')).not.toBeInTheDocument()
    request.resolve(overview())
    expect(await screen.findByLabelText('Підсумок оплат')).toBeInTheDocument()
  })

  it('keeps only the latest record response visible', async () => {
    const firstRequest = deferred<any>()
    const secondRequest = deferred<any>()
    mockedFetchClientRecordPayments.mockImplementation((recordId) => {
      if (recordId === 201) return firstRequest.promise
      if (recordId === 202) return secondRequest.promise
      throw new Error(`Unexpected record id: ${recordId}`)
    })

    const view = renderComponent({ recordId: 201, active: true })
    await waitFor(() => expect(mockedFetchClientRecordPayments).toHaveBeenCalledWith(201))

    await view.rerender({ recordId: 202, active: true, showNoAccountNote: false })
    await waitFor(() => expect(mockedFetchClientRecordPayments).toHaveBeenCalledWith(202))

    secondRequest.resolve(
      overview({
        client_record: {
          id: 202,
          display_name: 'Second Payment Client',
          source: 'manual',
          status: 'active',
          user_id: null,
        },
        rows: [paymentRow({ session_id: 9202, price_amount: '2020.00' })],
      })
    )
    expect(await screen.findByText('2020 грн')).toBeInTheDocument()

    firstRequest.resolve(
      overview({
        rows: [paymentRow({ session_id: 9201, price_amount: '2010.00' })],
      })
    )

    await waitFor(() => expect(screen.getByText('2020 грн')).toBeInTheDocument())
    expect(screen.queryByText('2010 грн')).not.toBeInTheDocument()
  })

  it('does not create a duplicate in-flight request for the same record', async () => {
    const request = deferred<any>()
    mockedFetchClientRecordPayments.mockReturnValue(request.promise)
    const view = renderComponent({ recordId: 201, active: false })

    await view.rerender({ recordId: 201, active: true, showNoAccountNote: false })
    await view.rerender({ recordId: 201, active: false, showNoAccountNote: false })
    await view.rerender({ recordId: 201, active: true, showNoAccountNote: false })

    expect(mockedFetchClientRecordPayments).toHaveBeenCalledTimes(1)
    request.resolve(overview())
  })

  it('shows API error and retries', async () => {
    mockedFetchClientRecordPayments
      .mockRejectedValueOnce({ response: { data: { detail: 'Помилка API' } } })
      .mockResolvedValueOnce(overview() as any)

    renderComponent({ recordId: 201, active: true })

    expect(await screen.findByText('Не вдалося завантажити оплати')).toBeInTheDocument()
    expect(screen.getByText('Помилка API')).toBeInTheDocument()
    await fireEvent.click(screen.getByRole('button', { name: 'Спробувати ще раз' }))

    await screen.findByText('Ще немає сесій для відображення оплат')
    expect(mockedFetchClientRecordPayments).toHaveBeenCalledTimes(2)
  })

  it('shows the new no-session workflow description', async () => {
    mockedFetchClientRecordPayments.mockResolvedValue(overview() as any)

    renderComponent({ recordId: 201, active: true })

    expect(await screen.findByText('Ще немає сесій для відображення оплат')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Оплати зʼявляться тут після створення першої сесії. Створіть сесію в картці клієнта, а статус оплати змінюйте в картці конкретної сесії.'
      )
    ).toBeInTheDocument()
    expect(screen.queryByLabelText(FIRST_PAYMENT_GUIDANCE_TITLE)).not.toBeInTheDocument()
  })

  it('renders all summary counters including zeros', async () => {
    mockedFetchClientRecordPayments.mockResolvedValue(
      overview({
        summary: {
          not_confirmed_count: 0,
          awaiting_client_count: 1,
          awaiting_review_count: 2,
          needs_attention_count: 3,
          paid_count: 4,
        },
      }) as any
    )

    renderComponent({ recordId: 201, active: true })

    const summary = await screen.findByLabelText('Підсумок оплат')
    expect(within(summary).getByText('Не підтверджено')).toBeInTheDocument()
    expect(within(summary).getByText('Очікуємо від клієнта')).toBeInTheDocument()
    expect(within(summary).getByText('На перевірці')).toBeInTheDocument()
    expect(within(summary).getByText('Потребує уваги')).toBeInTheDocument()
    expect(within(summary).getByText('Оплачено')).toBeInTheDocument()
    expect(within(summary).getByText('0')).toBeInTheDocument()
    expect(within(summary).getByText('4')).toBeInTheDocument()
  })

  it('renders payment rows and session link', async () => {
    mockedFetchClientRecordPayments.mockResolvedValue(
      overview({
        rows: [
          paymentRow({
            session_id: 7010,
            price_amount: '1500.00',
            payment_state: 'PAID',
          }),
        ],
      }) as any
    )

    renderComponent({ recordId: 201, active: true })

    expect(await screen.findByText('1500 грн')).toBeInTheDocument()
    expect(screen.getByText('50 хв')).toBeInTheDocument()
    expect(screen.getByText('Завершено')).toBeInTheDocument()
    expect(screen.getByText('Формат: онлайн')).toBeInTheDocument()
    expect(screen.getAllByText('Оплачено').length).toBeGreaterThan(0)
    expect(screen.getByRole('link', { name: 'Відкрити сесію' })).toHaveAttribute(
      'href',
      '/cabinet/sessions/7010'
    )
  })

  it.each([
    'NOT_CONFIRMED',
    'AWAITING_CLIENT',
    'AWAITING_REVIEW',
    'NEEDS_CLARIFICATION',
    'PAYMENT_DECISION_REQUIRED',
  ])('shows first payment guidance for %s when there is no paid history', async (paymentState) => {
    mockedFetchClientRecordPayments.mockResolvedValue(
      overview({
        rows: [paymentRow({ payment_state: paymentState })],
      }) as any
    )

    renderComponent({ recordId: 201, active: true })

    const guidance = await screen.findByLabelText(FIRST_PAYMENT_GUIDANCE_TITLE)
    expect(within(guidance).getByText(FIRST_PAYMENT_GUIDANCE_TITLE)).toBeInTheDocument()
    expect(within(guidance).getByText(REGISTERED_GUIDANCE_COPY)).toBeInTheDocument()
  })

  it('does not show first payment guidance when there is paid history', async () => {
    mockedFetchClientRecordPayments.mockResolvedValue(
      overview({
        summary: {
          not_confirmed_count: 1,
          awaiting_client_count: 0,
          awaiting_review_count: 0,
          needs_attention_count: 0,
          paid_count: 1,
        },
        rows: [paymentRow({ payment_state: 'NOT_CONFIRMED' })],
      }) as any
    )

    renderComponent({ recordId: 201, active: true })

    await screen.findByRole('link', { name: 'Відкрити сесію' })
    expect(screen.queryByLabelText(FIRST_PAYMENT_GUIDANCE_TITLE)).not.toBeInTheDocument()
  })

  it.each(['PAID', 'NO_PRICE', 'CANCELLED', 'RESOLVED_CANCELLED'])(
    'does not show first payment guidance for terminal state %s',
    async (paymentState) => {
      mockedFetchClientRecordPayments.mockResolvedValue(
        overview({
          rows: [paymentRow({ payment_state: paymentState })],
        }) as any
      )

      renderComponent({ recordId: 201, active: true })

      await screen.findByRole('link', { name: 'Відкрити сесію' })
      expect(screen.queryByLabelText(FIRST_PAYMENT_GUIDANCE_TITLE)).not.toBeInTheDocument()
    }
  )

  it('uses manual no-account guidance without confirmation request copy', async () => {
    mockedFetchClientRecordPayments.mockResolvedValue(
      overview({
        rows: [paymentRow({ payment_state: 'NOT_CONFIRMED' })],
      }) as any
    )

    renderComponent({ recordId: 201, active: true, showNoAccountNote: true })

    expect(await screen.findByText(NO_ACCOUNT_GUIDANCE_COPY)).toBeInTheDocument()
    expect(
      screen.getByText(
        'Клієнт не має кабінету, тому не може завантажити підтвердження оплати. Для таких клієнтів ви фіксуєте оплату в картці сесії.'
      )
    ).toBeInTheDocument()
    expect(screen.queryByText(/запросити підтвердження/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/надіслане підтвердження/i)).not.toBeInTheDocument()
  })

  it('renders labels for every normalized payment state', async () => {
    const states = [
      'NOT_CONFIRMED',
      'AWAITING_CLIENT',
      'AWAITING_REVIEW',
      'NEEDS_CLARIFICATION',
      'PAID',
      'NO_PRICE',
      'CANCELLED',
      'PAYMENT_DECISION_REQUIRED',
      'RESOLVED_CANCELLED',
    ]
    mockedFetchClientRecordPayments.mockResolvedValue(
      overview({
        rows: states.map((state, index) =>
          paymentRow({
            session_id: 8000 + index,
            payment_state: state,
          })
        ),
      }) as any
    )

    renderComponent({ recordId: 201, active: true })

    expect((await screen.findAllByText('Не підтверджено')).length).toBeGreaterThan(0)
    expect(screen.getAllByText('Очікуємо від клієнта').length).toBeGreaterThan(0)
    expect(screen.getAllByText('На перевірці').length).toBeGreaterThan(0)
    expect(screen.getByText('Потрібне уточнення')).toBeInTheDocument()
    expect(screen.getAllByText('Оплачено').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Без ціни').length).toBeGreaterThan(0)
    expect(screen.getByText('Скасовано')).toBeInTheDocument()
    expect(screen.getByText('Потрібне рішення щодо оплати')).toBeInTheDocument()
    expect(screen.getByText('Рішення щодо оплати зафіксовано')).toBeInTheDocument()
  })

  it('handles null date, null end date, null price and unknown state safely', async () => {
    mockedFetchClientRecordPayments.mockResolvedValue(
      overview({
        rows: [
          paymentRow({
            starts_at: null,
            ends_at: null,
            price_amount: null,
            session_format: '',
            payment_state: 'UNKNOWN_STATE',
          }),
        ],
      }) as any
    )

    renderComponent({ recordId: 201, active: true })

    expect(await screen.findByText('Час не вказано')).toBeInTheDocument()
    expect(screen.getByText('Без ціни')).toBeInTheDocument()
    expect(screen.getByText('Формат не вказано')).toBeInTheDocument()
    expect(screen.getByText('Статус не визначено')).toBeInTheDocument()
    expect(screen.queryByText('50 хв')).not.toBeInTheDocument()
  })

  it('does not render payment mutation or upload controls', async () => {
    mockedFetchClientRecordPayments.mockResolvedValue(
      overview({ rows: [paymentRow()] }) as any
    )

    renderComponent({ recordId: 201, active: true })

    await screen.findByRole('link', { name: 'Відкрити сесію' })
    expect(screen.queryByRole('button', { name: 'Позначити оплачено' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Запросити підтвердження' })).not.toBeInTheDocument()
    expect(screen.queryByText(/завантажити підтвердження/i)).not.toBeInTheDocument()
  })

  it('renders no-account note only when prop is true', () => {
    const { rerender } = renderComponent({ recordId: null, active: true, showNoAccountNote: false })

    expect(screen.queryByText(/Клієнт не має кабінету/)).not.toBeInTheDocument()
    return rerender({ recordId: null, active: true, showNoAccountNote: true }).then(() => {
      expect(
        screen.getByText(
          'Клієнт не має кабінету, тому не може завантажити підтвердження оплати. Для таких клієнтів ви фіксуєте оплату в картці сесії.'
        )
      ).toBeInTheDocument()
    })
  })
})
