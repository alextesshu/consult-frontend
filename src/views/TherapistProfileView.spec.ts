import { fireEvent, render, screen, waitFor, within } from '@testing-library/vue'
import { readFileSync } from 'node:fs'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import TherapistProfileView from './TherapistProfileView.vue'
import {
  createProfileDocument,
  deleteProfileDocument,
  fetchProfileDocuments,
  fetchSpecialistProfile,
  type SpecialistProfileDocument,
  type SpecialistProfile,
  updateProfileDocument,
  updateSpecialistProfile,
  uploadProfilePhoto,
  uploadProfileVideo,
} from '../lib/api'

const routerMocks = vi.hoisted(() => ({
  onBeforeRouteLeave: vi.fn(),
}))

const mockRoute = {
  query: {} as Record<string, string>,
}
const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
}

const PROFILE_SUBTITLE_COPY =
  'Заповніть інформацію, яка допоможе клієнту зрозуміти ваш підхід, формат роботи й спосіб зв’язку.'
const LEGACY_PROFILE_SUBTITLE_COPY =
  'Налаштуйте сторінку, яку бачить клієнт: опис, формати роботи, посилання, блог і відгуки.'
const scrollIntoViewSpy = vi.fn()

vi.mock('vue-router', async () => {
  const actual = await vi.importActual<typeof import('vue-router')>('vue-router')
  return {
    ...actual,
    useRoute: () => mockRoute,
    useRouter: () => mockRouter,
    onBeforeRouteLeave: routerMocks.onBeforeRouteLeave,
  }
})

vi.mock('vue-advanced-cropper', () => ({
  Cropper: defineComponent({
    name: 'CropperStub',
    setup(_, { expose }) {
      expose({
        getResult: () => ({
          canvas: {
            toBlob: (callback: (blob: Blob | null) => void) => {
              callback(new Blob(['photo'], { type: 'image/jpeg' }))
            },
          },
        }),
      })
      return () => h('div', { 'data-testid': 'cropper-stub' })
    },
  }),
}))

vi.mock('../lib/api', () => ({
  createProfileDocument: vi.fn(),
  deleteProfileDocument: vi.fn(),
  fetchSpecialistProfile: vi.fn(),
  fetchProfileDocuments: vi.fn(),
  updateProfileDocument: vi.fn(),
  updateSpecialistProfile: vi.fn(),
  uploadProfilePhoto: vi.fn(),
  uploadProfileVideo: vi.fn(),
}))

const mockedCreateProfileDocument = vi.mocked(createProfileDocument)
const mockedDeleteProfileDocument = vi.mocked(deleteProfileDocument)
const mockedFetchSpecialistProfile = vi.mocked(fetchSpecialistProfile)
const mockedFetchProfileDocuments = vi.mocked(fetchProfileDocuments)
const mockedUpdateProfileDocument = vi.mocked(updateProfileDocument)
const mockedUpdateSpecialistProfile = vi.mocked(updateSpecialistProfile)
const mockedUploadProfilePhoto = vi.mocked(uploadProfilePhoto)
const mockedUploadProfileVideo = vi.mocked(uploadProfileVideo)

function makeProfile(): SpecialistProfile {
  return {
    id: 5,
    public_profile_enabled: true,
    is_search_visible: true,
    public_profile_readiness: {
      is_ready: true,
      completed_count: 6,
      total_count: 6,
      missing_items: [],
      items: [
        { key: 'display_name', label: 'Публічне ім’я', complete: true },
        { key: 'about', label: 'Опис', complete: true },
        { key: 'topics', label: 'Спеціалізації', complete: true },
        { key: 'work_format', label: 'Формат роботи', complete: true },
        { key: 'first_contact', label: 'Перший контакт', complete: true },
        { key: 'price_decision', label: 'Вартість консультації', complete: true },
      ],
    },
    profile_notice: null,
    slug: 'specialist-anna',
    public_profile_path: '/s/specialist-anna',
    public_profile_url: `${window.location.origin}/s/specialist-anna`,
    public_slug: 'specialist-anna',
    last_slug_rotated_at: '2026-03-10T09:00:00Z',
    public_booking_mode: 'request_only',
    show_public_availability: false,
    public_booking_slot_policy: 'single_hold',
    offers_online: true,
    offers_offline: true,
    offline_location: 'Львів, офіс 12',
    professional_focus: 'psychological_practice',
    display_name: 'Анна',
    public_display_name: 'Анна',
    public_profile_summary: 'Короткий опис для hero-блоку.',
    setting_text: 'Будь ласка, попереджайте про перенесення щонайменше за 24 години.',
    bio_about: 'Працюю дбайливо.',
    bio_work: 'Онлайн консультації.',
    bio_approach: 'CBT.',
    bio_for_whom: 'Для дорослих.',
    bio_other: '',
    education_summary: 'Integrative psychotherapy background.',
    education_items: ['Master in psychology', 'CBT program'],
    professional_development_items: ['EMDR Level 1', 'Schema intensive'],
    show_bio_about: true,
    show_bio_work: true,
    show_bio_approach: true,
    show_bio_for_whom: true,
    show_bio_other: false,
    specializations: ['CBT', 'ACT'],
    languages: ['Українська', 'English'],
    location: 'Львів',
    experience_years: 6,
    price: '1500',
    price_currency: 'UAH',
    standard_session_duration_minutes: 50,
    intro_duration_minutes: 30,
    intro_price: '600',
    intro_price_currency: 'UAH',
    couple_session_enabled: false,
    couple_session_price: '',
    couple_session_price_currency: 'UAH',
    couple_session_duration_minutes: 50,
    contact_email: 'anna@example.com',
    contact_phone: '+380001112233',
    secondary_phone: '',
    messenger: '@anna-signal',
    telegram: '@anna',
    viber: '+380001112233',
    whatsapp: '+380001112233',
    photo_url: 'https://example.com/photo.jpg',
    video_url: 'https://example.com/video.mp4',
    show_email: true,
    show_phone: false,
    show_secondary_phone: false,
    show_messenger: true,
    show_telegram: true,
    show_viber: false,
    show_whatsapp: false,
    show_video: true,
    show_price: true,
    show_intro_price: true,
    show_location: true,
    show_photo: true,
  }
}

function makeIncompleteProfile(): SpecialistProfile {
  return {
    ...makeProfile(),
    public_profile_enabled: false,
    is_search_visible: false,
    public_profile_readiness: {
      is_ready: false,
      completed_count: 4,
      total_count: 6,
      missing_items: ['topics', 'price_decision'],
      items: [
        { key: 'display_name', label: 'Публічне ім’я', complete: true },
        { key: 'about', label: 'Опис', complete: true },
        { key: 'topics', label: 'Спеціалізації', complete: false },
        { key: 'work_format', label: 'Формат роботи', complete: true },
        { key: 'first_contact', label: 'Перший контакт', complete: true },
        { key: 'price_decision', label: 'Вартість консультації', complete: false },
      ],
    },
  }
}

function makeProfileWithSingleMissingReadinessItem(
  key: string,
  label: string,
  metadata: Partial<{
    reason: string
    message: string
    action_label: string
    action_route: string
  }> = {}
): SpecialistProfile {
  const profile = makeProfile()
  const hasKnownKey = profile.public_profile_readiness?.items.some((item) => item.key === key)
  const items = (profile.public_profile_readiness?.items || []).map((item, index) => {
    if (item.key === key || (!hasKnownKey && index === 0)) {
      return { ...item, key, label, complete: false, ...metadata }
    }
    return { ...item, complete: true }
  })

  profile.public_profile_readiness = {
    is_ready: false,
    completed_count: 5,
    total_count: 6,
    missing_items: [key],
    items,
  }
  return profile
}

function renderView() {
  return render(TherapistProfileView, {
    global: {
      stubs: {
        RouterLink: {
          template: '<a><slot /></a>',
        },
      },
    },
  })
}

function visibilityControl(controlId: string) {
  const control = screen.getByTestId(`${controlId}-visibility-control`)
  const buttons = within(control).queryAllByRole('button')
  return {
    control,
    show: buttons[0] ?? null,
    hide: buttons[1] ?? null,
  }
}

function createFile(name: string, type: string, sizeOverride?: number) {
  const file = new File(['x'], name, { type })
  if (typeof sizeOverride === 'number') {
    Object.defineProperty(file, 'size', { value: sizeOverride, configurable: true })
  }
  return file
}

function makeDocument(overrides: Partial<SpecialistProfileDocument> = {}): SpecialistProfileDocument {
  return {
    id: 10,
    title: 'CBT Certificate',
    file_url: 'https://example.com/certificate.pdf',
    mime_type: 'application/pdf',
    original_filename: 'certificate.pdf',
    file_size: 1024 * 1024,
    document_kind: 'CERTIFICATE',
    is_public: true,
    sort_order: 0,
    uploaded_at: '2026-01-01T10:00:00Z',
    source: 'cabinet',
    ...overrides,
  }
}

function setClipboard(writeText?: (value: string) => Promise<void>) {
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: writeText ? { writeText } : undefined,
  })
}

describe('TherapistProfileView', () => {
  beforeEach(() => {
    mockRoute.query = {}
    setClipboard()
    vi.restoreAllMocks()
    mockRouter.push.mockReset()
    mockRouter.replace.mockReset()
    scrollIntoViewSpy.mockReset()
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: scrollIntoViewSpy,
    })
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      writable: true,
      value: vi.fn(() => 'blob:document-preview'),
    })
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      writable: true,
      value: vi.fn(),
    })
    routerMocks.onBeforeRouteLeave.mockReset()
    mockedCreateProfileDocument.mockReset()
    mockedDeleteProfileDocument.mockReset()
    mockedFetchSpecialistProfile.mockReset()
    mockedFetchProfileDocuments.mockReset()
    mockedUpdateProfileDocument.mockReset()
    mockedUpdateSpecialistProfile.mockReset()
    mockedUploadProfilePhoto.mockReset()
    mockedUploadProfileVideo.mockReset()
    mockedFetchProfileDocuments.mockResolvedValue([])
  })

  it('renders the loaded public profile data and final public profile check action', async () => {
    mockedFetchSpecialistProfile.mockResolvedValue(makeProfile())

    renderView()

    expect(await screen.findByDisplayValue('Анна')).toBeInTheDocument()
    expect(screen.queryByText('Live preview публічної сторінки')).not.toBeInTheDocument()
    expect(screen.getByDisplayValue('anna@example.com')).toBeInTheDocument()
    expect(screen.queryByText('Ознайомча: 600 грн')).not.toBeInTheDocument()
    expect(screen.queryByText('Досвід: 6 років')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Доступно онлайн')).toBeChecked()
    expect(screen.getByLabelText('Доступно офлайн')).toBeChecked()
    expect(screen.getByDisplayValue('Львів, офіс 12')).toBeInTheDocument()
    expect(screen.getByLabelText('Стандартна сесія (тривалість)')).toHaveValue('50')
    expect(screen.getByText('Ця тривалість використовується як типова для звичайних сесій.')).toBeInTheDocument()
    expect(
      screen.getByDisplayValue('Будь ласка, попереджайте про перенесення щонайменше за 24 години.')
    ).toBeInTheDocument()
    expect(screen.getByText(`${window.location.origin}/s/specialist-anna`)).toBeInTheDocument()
    const finalCheck = screen.getByTestId('profile-final-public-check')
    expect(finalCheck).toBeInTheDocument()
    const finalOpenLink = screen.getByTestId('open-public-profile-final-link')
    expect(finalOpenLink).toHaveAttribute('href', `${window.location.origin}/s/specialist-anna`)
    expect(finalOpenLink).toHaveAttribute('target', '_blank')
    expect(finalOpenLink).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('validates profile document files before upload', async () => {
    mockedFetchSpecialistProfile.mockResolvedValue(makeProfile())

    renderView()

    expect(await screen.findByRole('heading', { name: 'Документи та сертифікати' })).toBeInTheDocument()
    expect(
      screen.getByText(
        'Додайте дипломи, сертифікати або інші професійні документи. Завантажений файл відображається у публічному профілі; щоб прибрати його, видаліть документ.'
      )
    ).toBeInTheDocument()
    expect(screen.getByText('JPG, PNG або PDF, до 10 МБ.')).toBeInTheDocument()

    const fileInput = screen.getByLabelText('Обрати файл документа')
    await fireEvent.change(fileInput, {
      target: { files: [createFile('notes.txt', 'text/plain')] },
    })

    expect(screen.getByText('Підтримуються лише файли JPG, PNG або PDF.')).toBeInTheDocument()
    expect(screen.getByText('Файл ще не вибрано')).toBeInTheDocument()
    expect(mockedCreateProfileDocument).not.toHaveBeenCalled()

    await fireEvent.change(fileInput, {
      target: { files: [createFile('large.pdf', 'application/pdf', 10 * 1024 * 1024 + 1)] },
    })

    expect(screen.getByText('Файл перевищує максимальний розмір 10 МБ.')).toBeInTheDocument()
    expect(mockedCreateProfileDocument).not.toHaveBeenCalled()
  })

  it('uploads a valid pending document and clears the local preview after success', async () => {
    const uploaded = makeDocument({
      id: 11,
      title: 'Diploma',
      file_url: 'https://example.com/diploma.jpg',
      mime_type: 'image/jpeg',
      original_filename: 'diploma.jpg',
      file_size: 2 * 1024 * 1024,
      document_kind: 'CERTIFICATE',
    })
    mockedFetchSpecialistProfile.mockResolvedValue(makeProfile())
    mockedCreateProfileDocument.mockResolvedValue(uploaded)

    renderView()

    expect(await screen.findByRole('heading', { name: 'Документи та сертифікати' })).toBeInTheDocument()
    const file = createFile('diploma.jpg', '', 2 * 1024 * 1024)
    await fireEvent.change(screen.getByLabelText('Обрати файл документа'), {
      target: { files: [file] },
    })

    expect(URL.createObjectURL).toHaveBeenCalledWith(file)
    expect(screen.getByText('diploma.jpg')).toBeInTheDocument()
    expect(screen.getByText('JPG')).toBeInTheDocument()
    expect(screen.getByText('2.0 МБ')).toBeInTheDocument()
    expect(screen.getByText('Показується у публічному профілі')).toBeInTheDocument()

    await fireEvent.click(screen.getByRole('button', { name: 'Завантажити документ' }))

    await waitFor(() => {
      expect(mockedCreateProfileDocument).toHaveBeenCalledWith({
        file,
        title: 'diploma',
        document_kind: 'CERTIFICATE',
      })
    })
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:document-preview')
    expect(screen.queryByRole('button', { name: 'Прибрати' })).not.toBeInTheDocument()
    expect(screen.getByText('Документ завантажено.')).toBeInTheDocument()
    expect(screen.getAllByText('diploma.jpg').length).toBeGreaterThanOrEqual(1)
  })

  it('keeps the selected document available for retry when upload fails', async () => {
    mockedFetchSpecialistProfile.mockResolvedValue(makeProfile())
    mockedCreateProfileDocument.mockRejectedValue({})

    renderView()

    expect(await screen.findByRole('heading', { name: 'Документи та сертифікати' })).toBeInTheDocument()
    const file = createFile('certificate.pdf', 'application/pdf', 512 * 1024)
    await fireEvent.change(screen.getByLabelText('Обрати файл документа'), {
      target: { files: [file] },
    })
    await fireEvent.click(screen.getByRole('button', { name: 'Завантажити документ' }))

    await waitFor(() => {
      expect(mockedCreateProfileDocument).toHaveBeenCalledTimes(1)
    })
    expect(screen.getByText('certificate.pdf')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Завантажити документ' })).toBeEnabled()
    expect(screen.getByText('Не вдалося завантажити документ. Спробуйте ще раз.')).toBeInTheDocument()
  })

  it('renders existing document metadata without deprecated visibility controls and keeps missing file fallback', async () => {
    mockedFetchSpecialistProfile.mockResolvedValue(makeProfile())
    mockedFetchProfileDocuments.mockResolvedValue([
      makeDocument({
        id: 12,
        title: 'Photo certificate',
        file_url: 'https://example.com/photo.png',
        mime_type: 'image/png',
        original_filename: 'photo.png',
        file_size: 2048,
        is_public: false,
      }),
      makeDocument({
        id: 13,
        title: 'PDF certificate',
        file_url: 'https://example.com/certificate.pdf',
        mime_type: 'application/pdf',
        original_filename: 'certificate.pdf',
        file_size: 1024 * 1024,
        is_public: true,
      }),
      makeDocument({
        id: 14,
        title: 'Unavailable',
        file_url: null,
        mime_type: 'application/pdf',
        original_filename: null,
        file_size: null,
        is_public: true,
      }),
    ])

    renderView()

    expect((await screen.findAllByText('photo.png')).length).toBeGreaterThanOrEqual(1)
    expect(screen.getByAltText('photo.png')).toHaveAttribute('src', 'https://example.com/photo.png')
    expect(screen.getByText('PNG')).toBeInTheDocument()
    expect(screen.getByText('2.0 КБ')).toBeInTheDocument()
    expect(screen.getAllByText('Переглянути PDF')[0]).toHaveAttribute('href', 'https://example.com/certificate.pdf')
    expect(screen.getByText('Перегляд файла тимчасово недоступний.')).toBeInTheDocument()
    expect(screen.queryByTestId('document-12-visibility-control')).not.toBeInTheDocument()
    expect(screen.queryByTestId('document-13-visibility-control')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Не показувати у профілі' })).not.toBeInTheDocument()
  })

  it('saves document metadata without resubmitting deprecated visibility state', async () => {
    const document = makeDocument({ id: 22, title: 'Private certificate', is_public: true })
    mockedFetchSpecialistProfile.mockResolvedValue(makeProfile())
    mockedFetchProfileDocuments.mockResolvedValue([document])
    mockedUpdateProfileDocument.mockResolvedValue(document)

    renderView()

    const titleInput = await screen.findByDisplayValue('Private certificate')
    const article = titleInput.closest('article') as HTMLElement
    await fireEvent.update(titleInput, 'Updated certificate')
    await fireEvent.click(within(article).getByRole('button', { name: 'Зберегти' }))

    await waitFor(() => {
      expect(mockedUpdateProfileDocument).toHaveBeenCalledWith(22, {
        title: 'Updated certificate',
      })
    })
  })

  it('confirms document deletion with the shared modal', async () => {
    mockedFetchSpecialistProfile.mockResolvedValue(makeProfile())
    mockedFetchProfileDocuments.mockResolvedValue([makeDocument({ id: 15, title: 'Delete me' })])
    mockedDeleteProfileDocument.mockResolvedValue(undefined)
    const browserConfirm = vi.spyOn(window, 'confirm')

    renderView()

    expect(await screen.findByDisplayValue('Delete me')).toBeInTheDocument()
    await fireEvent.click(screen.getByRole('button', { name: 'Видалити' }))

    const dialog = await screen.findByRole('dialog', { name: 'Видалити документ?' })
    expect(
      within(dialog).getByText('Документ буде прибрано з вашого кабінету та публічного профілю, якщо він там показувався.')
    ).toBeInTheDocument()
    await fireEvent.click(within(dialog).getByRole('button', { name: 'Скасувати' }))
    expect(mockedDeleteProfileDocument).not.toHaveBeenCalled()

    await fireEvent.click(screen.getByRole('button', { name: 'Видалити' }))
    await fireEvent.click(within(await screen.findByRole('dialog', { name: 'Видалити документ?' })).getByRole('button', { name: 'Видалити документ' }))

    await waitFor(() => {
      expect(mockedDeleteProfileDocument).toHaveBeenCalledWith(15)
    })
    expect(screen.queryByDisplayValue('Delete me')).not.toBeInTheDocument()
    expect(browserConfirm).not.toHaveBeenCalled()
  })

  it('renders a compact public profile summary with the active public CTA', async () => {
    const profile = {
      ...makeProfile(),
      public_slug: 'b7d6276f-5688-4e37-a4c3-9c8a18a7b312',
    }
    const writeText = vi.fn().mockResolvedValue(undefined)
    setClipboard(writeText)
    mockedFetchSpecialistProfile.mockResolvedValue(profile)
    mockedUpdateSpecialistProfile.mockResolvedValue({
      ...profile,
      public_profile_enabled: false,
    })

    const { container } = renderView()

    expect(await screen.findByDisplayValue('Анна')).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'Керування публічним профілем' })).toBeInTheDocument()
    const subtitle = screen.getByText(PROFILE_SUBTITLE_COPY)
    expect(subtitle).toBeInTheDocument()
    expect(subtitle).toHaveClass('profile__subtitle')
    expect([...subtitle.classList].join(' ')).not.toMatch(/truncate|ellipsis|line-clamp|nowrap/i)
    expect(subtitle.getAttribute('style') || '').not.toMatch(
      /white-space\s*:\s*nowrap|text-overflow\s*:\s*ellipsis|-webkit-line-clamp/i
    )
    expect(screen.queryByText(LEGACY_PROFILE_SUBTITLE_COPY)).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Для клієнтів та соціальних мереж' })).toBeInTheDocument()
    expect(screen.getByText(/Скопіюйте посилання, щоб надіслати його клієнтам/)).toBeInTheDocument()
    expect(
      screen.getByText(/На сторінці клієнти побачать інформацію про вас і зможуть скористатися/)
    ).toBeInTheDocument()
    expect(
      screen.queryByText('На сторінці можна переглянути інформацію про вас і залишити запит.')
    ).not.toBeInTheDocument()

    const summary = container.querySelector('.profile-summary-card') as HTMLElement
    expect(summary).not.toBeNull()
    expect(within(summary).getByText('Публічна сторінка')).toBeInTheDocument()
    expect(within(summary).getByText('Сторінка доступна за посиланням')).toBeInTheDocument()
    expect(within(summary).getByText('Клієнти можуть переглядати сторінку за прямим посиланням.')).toBeInTheDocument()
    expect(within(summary).queryByText('Клієнти можуть переглядати вашу сторінку та залишати запити.')).not.toBeInTheDocument()
    expect(within(summary).getByRole('heading', { name: 'Готовність профілю' })).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { name: 'Готовність профілю' })).toHaveLength(1)
    expect(within(summary).getByText('6 з 6')).toBeInTheDocument()
    expect(within(summary).getByText('Усі обов’язкові дані заповнені.')).toBeInTheDocument()
    const publicProfileCta = within(summary).getByRole('link', { name: 'Переглянути сторінку' })
    expect(publicProfileCta).toHaveAttribute('href', `${window.location.origin}/s/specialist-anna`)
    expect(publicProfileCta).toHaveAttribute('target', '_blank')
    const shareProfileButton = within(summary).getByRole('button', { name: 'Поділитися профілем' })
    expect(shareProfileButton).toHaveClass('btn--ghost', 'profile-summary-card__share-action')
    const publicActions = summary.querySelector('.profile-summary-card__public-actions') as HTMLElement
    expect(within(publicActions).getByRole('link', { name: 'Переглянути сторінку' })).toBe(publicProfileCta)
    expect(within(publicActions).getByRole('button', { name: 'Поділитися профілем' })).toBe(shareProfileButton)
    await fireEvent.click(shareProfileButton)
    const shareDialog = screen.getByRole('dialog', { name: 'Поділитися профілем' })
    expect(shareDialog).toBeInTheDocument()
    await fireEvent.click(within(shareDialog).getByRole('button', { name: 'Копіювати посилання' }))
    expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/s/specialist-anna`)
    expect(screen.getByRole('link', { name: 'Telegram' })).toHaveAttribute(
      'href',
      `https://t.me/share/url?url=${encodeURIComponent(`${window.location.origin}/s/specialist-anna`)}&text=${encodeURIComponent('Анна — Pro Consult')}`
    )
    expect(screen.getByRole('link', { name: 'Telegram' }).getAttribute('href')).not.toContain(
      'b7d6276f'
    )
    await fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(shareProfileButton).toHaveFocus()
    expect(within(summary).getByText('Відкриється сторінка, яку бачать клієнти.')).toBeInTheDocument()
    expect(within(summary).getByRole('button', { name: 'Зняти з публікації' })).toBeInTheDocument()
    expect(screen.queryByText('Відкрити як клієнт')).not.toBeInTheDocument()
    expect(screen.queryByText('Публічний профіль увімкнено')).not.toBeInTheDocument()
    expect(screen.queryByText('Увімкнути публічний профіль')).not.toBeInTheDocument()
    expect(screen.queryByText('Вимкнути публічний профіль')).not.toBeInTheDocument()
    expect(screen.queryByText('Профіль готовий до публікації.')).not.toBeInTheDocument()
    expect(screen.queryByText('Профіль активний')).not.toBeInTheDocument()

    expect(screen.queryByLabelText('Публічний профіль увімкнено')).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Публічний профіль' })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Поява в пошуку Pro Consult' })).toBeInTheDocument()
    expect(screen.getByLabelText('Показувати мою сторінку в пошуку')).toBeChecked()
    expect(screen.getByText('Клієнти можуть знайти сторінку через пошук спеціалістів.')).toBeInTheDocument()
    expect(screen.queryByLabelText('Дозволити знаходити мій профіль через пошук спеціалістів')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Поділитись профілем' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Назад до кабінету' })).not.toBeInTheDocument()
    const hero = container.querySelector('.profile__hero') as HTMLElement
    expect(within(hero).queryByRole('button', { name: 'Копіювати посилання' })).not.toBeInTheDocument()
    const linkCallout = container.querySelector('.profile-link-callout') as HTMLElement
    const searchVisibility = container.querySelector('.profile-search-visibility') as HTMLElement
    expect(linkCallout).not.toBeNull()
    expect(searchVisibility).not.toBeNull()
    expect(
      Boolean(linkCallout.compareDocumentPosition(searchVisibility) & Node.DOCUMENT_POSITION_FOLLOWING)
    ).toBe(true)
    expect(within(linkCallout).getByText('Ваше посилання')).toBeInTheDocument()
    expect(within(linkCallout).getByText(`${window.location.origin}/s/specialist-anna`)).toBeInTheDocument()
    const copyLinkButton = within(linkCallout).getByRole('button', { name: 'Копіювати посилання' })
    expect(copyLinkButton).toHaveClass('btn')
    expect(copyLinkButton).toHaveClass('btn--ghost')
    expect(copyLinkButton).toBeEnabled()
    expect(within(linkCallout).queryByRole('link', { name: 'Подивитись профіль' })).not.toBeInTheDocument()
    expect(within(linkCallout).queryByRole('link', { name: 'Відкрити як клієнт' })).not.toBeInTheDocument()
    expect(within(linkCallout).getByRole('link', { name: 'Переглянути сторінку' })).toHaveAttribute(
      'href',
      `${window.location.origin}/s/specialist-anna`
    )
    expect(within(linkCallout).queryByRole('button', { name: 'Зняти з публікації' })).not.toBeInTheDocument()
    expect(within(linkCallout).getByRole('button', { name: 'Змінити адресу' })).toBeInTheDocument()
    expect(screen.queryByText('Публічне посилання на профіль')).not.toBeInTheDocument()
    expect(screen.queryByText(/Надішліть це посилання клієнту/)).not.toBeInTheDocument()
    expect(screen.queryByText('Сторінку ще не опубліковано.')).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Відкрити профіль' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Усі налаштування' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Реквізити' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Профіль' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Сповіщення' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Плани та доступ' })).not.toBeInTheDocument()
    expect(container.querySelector('a[href^="mailto:"]')).toBeNull()

    await fireEvent.click(copyLinkButton)
    expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/s/specialist-anna`)
    expect(await within(linkCallout).findByText('Посилання скопійовано')).toBeInTheDocument()
    expect(screen.getAllByText('Переглянути сторінку')).toHaveLength(2)
  })

  it('keeps profile sharing available when the published profile is hidden from search', async () => {
    mockedFetchSpecialistProfile.mockResolvedValue({
      ...makeProfile(),
      public_slug: 'b7d6276f-5688-4e37-a4c3-9c8a18a7b312',
      is_search_visible: false,
    })

    renderView()

    expect(await screen.findByRole('button', { name: 'Поділитися профілем' })).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'Переглянути сторінку' })).not.toHaveLength(0)
    expect(screen.getByLabelText('Показувати мою сторінку в пошуку')).not.toBeChecked()
  })

  it('does not offer profile sharing for an unpublished profile', async () => {
    mockedFetchSpecialistProfile.mockResolvedValue({
      ...makeProfile(),
      public_profile_enabled: false,
      is_search_visible: false,
    })

    renderView()

    expect(await screen.findByRole('button', { name: 'Опублікувати сторінку' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Поділитися профілем' })).not.toBeInTheDocument()
  })

  it('does not offer profile sharing without a valid public slug', async () => {
    mockedFetchSpecialistProfile.mockResolvedValue({
      ...makeProfile(),
      slug: '',
      public_slug: 'b7d6276f-5688-4e37-a4c3-9c8a18a7b312',
      public_profile_path: '',
      public_profile_url: '',
    })

    renderView()

    expect(await screen.findByText('Сторінка доступна за посиланням')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Поділитися профілем' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Переглянути сторінку' })).not.toBeInTheDocument()
  })

  it('confirms disabling an active public profile and keeps the change in the save flow', async () => {
    const profile = makeProfile()
    mockedFetchSpecialistProfile.mockResolvedValue(profile)
    mockedUpdateSpecialistProfile.mockResolvedValue({
      ...profile,
      public_profile_enabled: false,
      is_search_visible: false,
    })

    renderView()

    expect(await screen.findByText('Сторінка доступна за посиланням')).toBeInTheDocument()
    await fireEvent.click(screen.getByRole('button', { name: 'Зняти з публікації' }))

    const cancelDialog = await screen.findByRole('dialog', { name: 'Зняти сторінку з публікації?' })
    expect(
      within(cancelDialog).getByText(
        'Сторінка перестане відкриватися за прямим посиланням і більше не відображатиметься в пошуку Pro Consult.'
      )
    ).toBeInTheDocument()
    await fireEvent.click(within(cancelDialog).getByRole('button', { name: 'Скасувати' }))

    expect(screen.getByText('Сторінка доступна за посиланням')).toBeInTheDocument()
    expect(screen.queryByTestId('profile-sticky-save-bar')).not.toBeInTheDocument()

    await fireEvent.click(screen.getByRole('button', { name: 'Зняти з публікації' }))
    const confirmDialog = await screen.findByRole('dialog', { name: 'Зняти сторінку з публікації?' })
    await fireEvent.click(within(confirmDialog).getByRole('button', { name: 'Зняти з публікації' }))

    expect(screen.getByText('Сторінку буде знято з публікації після збереження')).toBeInTheDocument()
    expect(screen.getByText('До збереження сторінка ще доступна за прямим посиланням.')).toBeInTheDocument()
    expect(screen.getByLabelText('Показувати мою сторінку в пошуку')).not.toBeChecked()
    expect(screen.getByText('Показ у пошуку буде вимкнено після збереження.')).toBeInTheDocument()
    expect(
      screen.queryByText('Спочатку опублікуйте сторінку. Після цього можна окремо ввімкнути її показ у пошуку.')
    ).not.toBeInTheDocument()
    expect(await screen.findByTestId('profile-sticky-save-bar')).toBeInTheDocument()
    expect(screen.getByText('Є незбережені зміни')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Копіювати посилання' })).toBeEnabled()

    await fireEvent.click(screen.getByRole('button', { name: 'Зберегти зміни' }))

    await waitFor(() => {
      expect(mockedUpdateSpecialistProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          public_profile_enabled: false,
          is_search_visible: false,
        })
      )
    })
    expect(screen.getByText('Сторінка не опублікована')).toBeInTheDocument()
    expect(
      screen.getByText('Спочатку опублікуйте сторінку. Після цього можна окремо ввімкнути її показ у пошуку.')
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Копіювати посилання' })).toBeDisabled()
    expect(screen.queryByRole('link', { name: 'Переглянути сторінку' })).not.toBeInTheDocument()
  })

  it('shows compact readiness card and guards incomplete profile activation', async () => {
    mockedFetchSpecialistProfile.mockResolvedValue(makeIncompleteProfile())

    const { container } = renderView()

    expect(await screen.findByRole('heading', { name: 'Готовність профілю' })).toBeInTheDocument()
    const summary = container.querySelector('.profile-summary-card') as HTMLElement
    expect(summary).not.toBeNull()
    expect(within(summary).getByText('Сторінка не опублікована')).toBeInTheDocument()
    expect(
      within(summary).getByText('Сторінку ще не можна опублікувати. Заповніть мінімально необхідну інформацію.')
    ).toBeInTheDocument()
    expect(within(summary).getByText('4 з 6')).toBeInTheDocument()
    expect(within(summary).getByText('Заповніть обов’язкові дані, щоб опублікувати профіль.')).toBeInTheDocument()
    expect(within(summary).getByText('Не вистачає:')).toBeInTheDocument()
    expect(within(summary).queryByText('Фото')).not.toBeInTheDocument()
    expect(within(summary).getByText('Спеціалізації')).toBeInTheDocument()
    expect(within(summary).getByText('Вартість консультації')).toBeInTheDocument()

    const finishProfileButton = within(summary).getByRole('button', { name: 'Завершити профіль' })
    expect(screen.getAllByText('Завершити профіль')).toHaveLength(1)
    const linkCallout = container.querySelector('.profile-link-callout') as HTMLElement
    expect(within(linkCallout).getByRole('button', { name: 'Копіювати посилання' })).toBeDisabled()
    expect(
      within(linkCallout).getByText('Посилання стане доступним клієнтам після публікації сторінки.')
    ).toBeInTheDocument()

    const searchCheckbox = screen.getByLabelText('Показувати мою сторінку в пошуку')
    expect(searchCheckbox).toBeDisabled()
    expect(
      screen.getByText(
        'Пошук стане доступним після заповнення мінімально необхідної інформації та публікації сторінки.'
      )
    ).toBeInTheDocument()

    await fireEvent.click(finishProfileButton)

    expect(scrollIntoViewSpy).toHaveBeenCalled()
    expect(mockedUpdateSpecialistProfile).not.toHaveBeenCalled()
  })

  it('keeps unpublish and search disable available for a published incomplete profile', async () => {
    const profile = makeProfileWithSingleMissingReadinessItem('first_contact', 'Запис або запит')
    mockedFetchSpecialistProfile.mockResolvedValue(profile)
    mockedUpdateSpecialistProfile.mockResolvedValue({
      ...profile,
      is_search_visible: false,
    })

    renderView()

    const unpublishButton = await screen.findByRole('button', { name: 'Зняти з публікації' })
    const searchCheckbox = screen.getByLabelText('Показувати мою сторінку в пошуку')

    expect(screen.getByRole('button', { name: 'Завершити профіль' })).toBeInTheDocument()
    expect(unpublishButton).toBeEnabled()
    expect(searchCheckbox).toBeChecked()
    expect(searchCheckbox).toBeEnabled()

    await fireEvent.click(searchCheckbox)

    expect(searchCheckbox).not.toBeChecked()
    expect(await screen.findByTestId('profile-sticky-save-bar')).toBeInTheDocument()
    await fireEvent.click(screen.getByRole('button', { name: 'Зберегти зміни' }))

    await waitFor(() => {
      expect(mockedUpdateSpecialistProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          public_profile_enabled: true,
          is_search_visible: false,
        })
      )
    })
  })

  it('blocks search enable but keeps unpublish available for a published incomplete profile', async () => {
    const profile = makeProfileWithSingleMissingReadinessItem('first_contact', 'Запис або запит')
    profile.is_search_visible = false
    mockedFetchSpecialistProfile.mockResolvedValue(profile)

    renderView()

    expect(await screen.findByRole('button', { name: 'Зняти з публікації' })).toBeEnabled()
    const searchCheckbox = screen.getByLabelText('Показувати мою сторінку в пошуку')
    expect(searchCheckbox).not.toBeChecked()
    expect(searchCheckbox).toBeDisabled()
  })

  it('keeps unpublish unavailable and search enable blocked for an unpublished incomplete profile', async () => {
    mockedFetchSpecialistProfile.mockResolvedValue(makeIncompleteProfile())

    renderView()

    expect(await screen.findByRole('button', { name: 'Завершити профіль' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Зняти з публікації' })).not.toBeInTheDocument()
    expect(screen.getByLabelText('Показувати мою сторінку в пошуку')).toBeDisabled()
  })

  it('focuses specializations from readiness deep link and preserves other query params', async () => {
    mockRoute.query = { focus: 'specializations', keep: '1' }
    mockedFetchSpecialistProfile.mockResolvedValue(makeIncompleteProfile())

    const { container } = renderView()

    const specializationsField = await screen.findByTestId('profile-specializations-field')
    await waitFor(() => {
      expect(scrollIntoViewSpy).toHaveBeenCalled()
      expect(mockRouter.replace).toHaveBeenCalledWith({ query: { keep: '1' } })
    })

    expect(specializationsField).toHaveClass('field--attention')
    expect(container.querySelector('[data-readiness-key="topics"]')).not.toBeInTheDocument()
  })

  it('routes first_contact readiness to booking settings instead of Contacts', async () => {
    mockedFetchSpecialistProfile.mockResolvedValue(
      makeProfileWithSingleMissingReadinessItem('first_contact', 'Запис або запит')
    )

    const { container } = renderView()
    await screen.findByRole('heading', { name: 'Готовність профілю' })
    const summary = container.querySelector('.profile-summary-card') as HTMLElement
    const contactsSection = container.querySelector('[data-readiness-key="first_contact"]')

    expect(within(summary).getByText('Не вистачає:')).toBeInTheDocument()
    expect(within(summary).getByText('Запис або запит')).toBeInTheDocument()
    await fireEvent.click(within(summary).getByRole('button', { name: 'Завершити профіль' }))

    expect(mockRouter.push).toHaveBeenCalledWith({
      path: '/cabinet/slots',
      query: { tab: 'settings' },
    })
    expect(scrollIntoViewSpy).not.toHaveBeenCalled()
    expect(contactsSection).not.toBeNull()
    expect(contactsSection).not.toContain(document.activeElement)
  })

  it.each([
    [
      'no_future_slots',
      'Створіть хоча б одне майбутнє вікно для запису.',
      'Створити вікна для запису',
      '/cabinet/slots?tab=availability',
    ],
    [
      'availability_hidden',
      'Увімкніть показ доступних вікон у публічному профілі.',
      'Увімкнути показ вікон',
      '/cabinet/slots?tab=settings',
    ],
    [
      'booking_mode_missing',
      'Оберіть, як клієнти можуть записуватися або залишати запит.',
      'Налаштувати запис і запити',
      '/cabinet/slots?tab=settings',
    ],
  ])(
    'uses backend-provided %s readiness message and action',
    async (_reason, message, actionLabel, actionRoute) => {
      mockedFetchSpecialistProfile.mockResolvedValue(
        makeProfileWithSingleMissingReadinessItem('first_contact', 'Запис або запит', {
          reason: _reason,
          message,
          action_label: actionLabel,
          action_route: actionRoute,
        })
      )

      const { container } = renderView()
      await screen.findByRole('heading', { name: 'Готовність профілю' })
      const summary = container.querySelector('.profile-summary-card') as HTMLElement

      expect(within(summary).getByText(message)).toBeInTheDocument()
      await fireEvent.click(within(summary).getByRole('button', { name: actionLabel }))

      expect(mockRouter.push).toHaveBeenCalledWith(actionRoute)
      expect(scrollIntoViewSpy).not.toHaveBeenCalled()
    }
  )

  it('keeps the legacy first_contact action when readiness metadata is absent', async () => {
    mockedFetchSpecialistProfile.mockResolvedValue(
      makeProfileWithSingleMissingReadinessItem('first_contact', 'Запис або запит')
    )

    const { container } = renderView()
    await screen.findByRole('heading', { name: 'Готовність профілю' })
    const summary = container.querySelector('.profile-summary-card') as HTMLElement

    expect(within(summary).queryByText('Створіть хоча б одне майбутнє вікно для запису.')).not.toBeInTheDocument()
    await fireEvent.click(within(summary).getByRole('button', { name: 'Завершити профіль' }))

    expect(mockRouter.push).toHaveBeenCalledWith({
      path: '/cabinet/slots',
      query: { tab: 'settings' },
    })
  })

  it.each([
    ['display_name', 'Публічне ім’я', '[data-readiness-key="display_name"]'],
    ['about', 'Опис', '[data-readiness-key="about"]'],
    ['topics', 'Спеціалізації', '[data-readiness-key="specializations"]'],
    ['work_format', 'Формат роботи', '[data-readiness-key="work_format"]'],
    ['price_decision', 'Вартість консультації', '[data-readiness-key="price_decision"]'],
  ])('keeps %s readiness targeting its profile section', async (key, label, selector) => {
    mockedFetchSpecialistProfile.mockResolvedValue(makeProfileWithSingleMissingReadinessItem(key, label))

    const { container } = renderView()
    await screen.findByRole('heading', { name: 'Готовність профілю' })
    const summary = container.querySelector('.profile-summary-card') as HTMLElement
    const target = container.querySelector(selector)

    await fireEvent.click(within(summary).getByRole('button', { name: 'Завершити профіль' }))

    expect(scrollIntoViewSpy).toHaveBeenCalledTimes(1)
    expect(scrollIntoViewSpy.mock.contexts[0]).toBe(target)
    expect(mockRouter.push).not.toHaveBeenCalled()
  })

  it('uses the profile basics section for an unknown readiness key instead of Contacts', async () => {
    mockedFetchSpecialistProfile.mockResolvedValue(
      makeProfileWithSingleMissingReadinessItem('unexpected_readiness_key', 'Невідома вимога')
    )

    const { container } = renderView()
    await screen.findByRole('heading', { name: 'Готовність профілю' })
    const summary = container.querySelector('.profile-summary-card') as HTMLElement
    const safeFallback = container.querySelector('.form--profile-basics')
    const contactsSection = container.querySelector('[data-readiness-key="first_contact"]')

    await fireEvent.click(within(summary).getByRole('button', { name: 'Завершити профіль' }))

    expect(scrollIntoViewSpy.mock.contexts[0]).toBe(safeFallback)
    expect(mockRouter.push).not.toHaveBeenCalled()
    expect(contactsSection).not.toContain(document.activeElement)
  })

  it('keeps the ready-profile primary action unchanged', async () => {
    mockedFetchSpecialistProfile.mockResolvedValue(makeProfile())

    renderView()

    expect((await screen.findAllByRole('link', { name: 'Переглянути сторінку' })).length).toBeGreaterThan(0)
    expect(screen.queryByRole('button', { name: 'Завершити профіль' })).not.toBeInTheDocument()
    expect(mockRouter.push).not.toHaveBeenCalled()
  })

  it('renders public_profile_summary field in profile settings', async () => {
    mockedFetchSpecialistProfile.mockResolvedValue(makeProfile())

    renderView()

    expect(await screen.findByText('Коротке професійне представлення')).toBeInTheDocument()
    expect(
      screen.getByText(
        'У 1–2 реченнях напишіть, хто ви як спеціаліст, з ким працюєте та що є важливим у вашому підході. Цей текст клієнт побачить одразу під вашим ім’ям.'
      )
    ).toBeInTheDocument()
    expect(
      screen.getByPlaceholderText(
        'Наприклад: Психологиня, гештальт-психотерапевтка. Працюю з дорослими, які переживають тривогу, життєві кризи або труднощі у стосунках.'
      )
    ).toBeInTheDocument()
    expect(screen.queryByText('Коротко про себе')).not.toBeInTheDocument()
    expect(screen.queryByText('Короткий опис для верхнього блоку профілю')).not.toBeInTheDocument()
    expect(screen.getByDisplayValue('Короткий опис для hero-блоку.')).toBeInTheDocument()
  })

  it('lets a ready inactive profile be activated from the status control', async () => {
    const readyInactive = {
      ...makeProfile(),
      public_profile_enabled: false,
      is_search_visible: false,
    }
    mockedFetchSpecialistProfile.mockResolvedValue(readyInactive)
    mockedUpdateSpecialistProfile.mockResolvedValue({
      ...readyInactive,
      public_profile_enabled: true,
    })

    renderView()

    const publishButton = await screen.findByRole('button', {
      name: 'Опублікувати сторінку',
    })
    expect(screen.getAllByText('Опублікувати сторінку')).toHaveLength(1)
    expect(screen.getByText('Сторінка не опублікована')).toBeInTheDocument()
    expect(screen.getByText('6 з 6')).toBeInTheDocument()
    expect(screen.getByText('Усі обов’язкові дані заповнені.')).toBeInTheDocument()
    const linkCallout = document.querySelector('.profile-link-callout') as HTMLElement
    expect(within(linkCallout).getByRole('button', { name: 'Копіювати посилання' })).toBeDisabled()
    expect(within(linkCallout).queryByRole('link', { name: 'Опублікувати сторінку' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Переглянути сторінку' })).not.toBeInTheDocument()
    expect(
      within(linkCallout).getByText('Посилання стане доступним клієнтам після публікації сторінки.')
    ).toBeInTheDocument()

    await fireEvent.click(publishButton)
    expect(screen.getByText('Сторінку буде опубліковано після збереження')).toBeInTheDocument()
    expect(
      screen.getByText('Збережіть зміни, щоб сторінка стала доступною клієнтам за прямим посиланням.')
    ).toBeInTheDocument()
    expect(await screen.findByTestId('profile-sticky-save-bar')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Переглянути сторінку' })).not.toBeInTheDocument()
    expect(screen.queryByText('Відкрити як клієнт')).not.toBeInTheDocument()
    expect(within(linkCallout).getByRole('button', { name: 'Копіювати посилання' })).toBeDisabled()
    expect(screen.getByLabelText('Показувати мою сторінку в пошуку')).not.toBeChecked()
    expect(mockedUpdateSpecialistProfile).not.toHaveBeenCalled()
    await fireEvent.click(screen.getByRole('button', { name: 'Зберегти зміни' }))

    await waitFor(() => {
      expect(mockedUpdateSpecialistProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          public_profile_enabled: true,
          is_search_visible: false,
        })
      )
    })
    expect(screen.getByText('Сторінка доступна за посиланням')).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'Переглянути сторінку' })[0]).toHaveAttribute(
      'href',
      `${window.location.origin}/s/specialist-anna`
    )
    expect(screen.getAllByText('Переглянути сторінку')).toHaveLength(2)
    expect(within(linkCallout).getByRole('button', { name: 'Копіювати посилання' })).toBeEnabled()
  })

  it('keeps pending publication state when saving publication fails', async () => {
    const readyInactive = {
      ...makeProfile(),
      public_profile_enabled: false,
      is_search_visible: false,
    }
    mockedFetchSpecialistProfile.mockResolvedValue(readyInactive)
    mockedUpdateSpecialistProfile.mockRejectedValue({
      response: {
        status: 500,
        data: { detail: 'Не вдалося зберегти зміни. Спробуйте ще раз.' },
      },
    })

    renderView()

    await fireEvent.click(await screen.findByRole('button', { name: 'Опублікувати сторінку' }))

    expect(screen.getByText('Сторінку буде опубліковано після збереження')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Копіювати посилання' })).toBeDisabled()
    expect(screen.queryByRole('link', { name: 'Переглянути сторінку' })).not.toBeInTheDocument()

    await fireEvent.click(screen.getByRole('button', { name: 'Зберегти зміни' }))

    expect(await screen.findByText('Не вдалося зберегти зміни. Спробуйте ще раз.')).toBeInTheDocument()
    expect(screen.getByText('Сторінку буде опубліковано після збереження')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Копіювати посилання' })).toBeDisabled()
    expect(screen.queryByRole('link', { name: 'Переглянути сторінку' })).not.toBeInTheDocument()
    expect(screen.getByTestId('profile-sticky-save-bar')).toBeInTheDocument()
  })

  it('shows missing readiness items when backend rejects activation', async () => {
    const readyInactive = {
      ...makeProfile(),
      public_profile_enabled: false,
      is_search_visible: false,
    }
    mockedFetchSpecialistProfile.mockResolvedValue(readyInactive)
    mockedUpdateSpecialistProfile.mockRejectedValue({
      response: {
        status: 409,
        data: {
          code: 'PROFILE_NOT_READY',
          missing_items: ['topics'],
          readiness: {
            is_ready: false,
            completed_count: 5,
            total_count: 6,
            missing_items: ['topics'],
            items: [
              { key: 'topics', label: 'Спеціалізації', complete: false },
            ],
          },
        },
      },
    })

    renderView()

    const publishButton = await screen.findByRole('button', {
      name: 'Опублікувати сторінку',
    })
    await fireEvent.click(publishButton)
    await fireEvent.click(screen.getByRole('button', { name: 'Зберегти зміни' }))

    expect(
      await screen.findByText(/Профіль поки не готовий для клієнтів/)
    ).toBeInTheDocument()
    expect(screen.getByText(/Не вистачає: Спеціалізації/)).toBeInTheDocument()
  })

  it('keeps price and contact visibility controls while removing content-driven controls', async () => {
    mockedFetchSpecialistProfile.mockResolvedValue(makeProfile())

    const { container } = renderView()

    const contactsPanel = (await screen.findByRole('heading', { name: 'Контакти' })).closest('section') as HTMLElement
    expect(within(contactsPanel).getByTestId('contact-email-visibility-control')).toBeInTheDocument()
    expect(within(contactsPanel).getByTestId('contact-phone-visibility-control')).toBeInTheDocument()
    expect(within(contactsPanel).getByTestId('contact-messenger-visibility-control')).toBeInTheDocument()
    expect(within(contactsPanel).getByTestId('contact-telegram-visibility-control')).toBeInTheDocument()
    expect(within(contactsPanel).getByTestId('contact-viber-visibility-control')).toBeInTheDocument()
    expect(within(contactsPanel).getByTestId('contact-whatsapp-visibility-control')).toBeInTheDocument()
    expect(within(contactsPanel).queryByLabelText('Видимість контактів у публічному профілі')).not.toBeInTheDocument()
    expect(container.querySelector('.profile-visibility-grid')).toBeNull()

    const mediaPanel = screen.getByRole('heading', { name: 'Фото та відео' }).closest('section') as HTMLElement
    expect(within(mediaPanel).queryByTestId('profile-photo-visibility-control')).not.toBeInTheDocument()
    expect(within(mediaPanel).queryByTestId('profile-video-visibility-control')).not.toBeInTheDocument()
    expect(screen.queryByTestId('bio-about-visibility-control')).not.toBeInTheDocument()
    expect(screen.queryByTestId('bio-work-visibility-control')).not.toBeInTheDocument()
    expect(screen.queryByTestId('bio-approach-visibility-control')).not.toBeInTheDocument()
    expect(screen.queryByTestId('bio-for-whom-visibility-control')).not.toBeInTheDocument()
    expect(screen.queryByTestId('bio-other-visibility-control')).not.toBeInTheDocument()

    expect(visibilityControl('standard-price').show).toHaveAttribute('aria-pressed', 'true')
    expect(visibilityControl('standard-price').hide).toHaveAttribute('aria-pressed', 'false')
    expect(visibilityControl('contact-phone').show).toHaveAttribute('aria-pressed', 'false')
    expect(visibilityControl('contact-phone').hide).toHaveAttribute('aria-pressed', 'true')

    expect(screen.queryByRole('heading', { name: 'Видимість' })).not.toBeInTheDocument()
  })

  it('keeps visibility changes local until the existing save action submits show fields', async () => {
    const profile = {
      ...makeProfile(),
      show_price: false,
    }
    mockedFetchSpecialistProfile.mockResolvedValue(profile)
    mockedUpdateSpecialistProfile.mockResolvedValue({
      ...profile,
      show_price: true,
      show_email: false,
    })

    renderView()

    await screen.findByDisplayValue('1500')
    expect(visibilityControl('standard-price').hide).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('Вартість заповнена, але не показується клієнтам.')).toBeInTheDocument()

    await fireEvent.click(visibilityControl('standard-price').show as HTMLElement)
    await fireEvent.click(visibilityControl('contact-email').hide as HTMLElement)

    expect(mockedUpdateSpecialistProfile).not.toHaveBeenCalled()
    expect(screen.queryByText('Вартість заповнена, але не показується клієнтам.')).not.toBeInTheDocument()
    expect(screen.getByText('Email заповнений, але не показується клієнтам.')).toBeInTheDocument()
    expect(await screen.findByTestId('profile-sticky-save-bar')).toBeInTheDocument()

    await fireEvent.click(screen.getByRole('button', { name: 'Зберегти зміни' }))

    await waitFor(() => {
      expect(mockedUpdateSpecialistProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          show_price: true,
          show_email: false,
        })
      )
    })
  })

  it('shows unavailable states for empty optional contact fields', async () => {
    mockedFetchSpecialistProfile.mockResolvedValue({
      ...makeProfile(),
      messenger: '',
      show_messenger: false,
      whatsapp: '',
      show_whatsapp: false,
    })

    renderView()

    await screen.findByText('Контакти')
    const messengerControl = visibilityControl('contact-messenger')
    const whatsappControl = visibilityControl('contact-whatsapp')

    expect(messengerControl.show).toBeNull()
    expect(messengerControl.hide).toBeNull()
    expect(
      within(messengerControl.control).getByText(
        'Спочатку заповніть Messenger / Signal, щоб налаштувати його видимість.'
      )
    ).toBeInTheDocument()

    expect(whatsappControl.show).toBeNull()
    expect(whatsappControl.hide).toBeNull()
    expect(
      within(whatsappControl.control).getByText(
        'Спочатку заповніть WhatsApp, щоб налаштувати його видимість.'
      )
    ).toBeInTheDocument()
  })

  it('omits content-driven legacy flags from hidden-items summary and keeps price controls', async () => {
    mockedFetchSpecialistProfile.mockResolvedValue({
      ...makeProfile(),
      intro_price: '0.00',
      show_intro_price: false,
      show_photo: false,
      secondary_phone: '',
      show_secondary_phone: false,
    })

    renderView()

    expect(await screen.findByText('Ознайомча вартість заповнена, але не показується клієнтам.')).toBeInTheDocument()
    expect(screen.queryByText('Фото завантажене, але не показується клієнтам.')).not.toBeInTheDocument()
    expect(screen.queryByText('Додатковий телефон заповнений, але не показується клієнтам.')).not.toBeInTheDocument()
    expect(screen.getByDisplayValue('0.00')).toBeInTheDocument()

    const finalCheck = screen.getByTestId('hidden-filled-final-check')
    expect(within(finalCheck).getByText('Заповнені, але приховані дані')).toBeInTheDocument()
    expect(within(finalCheck).queryByText('Фото')).not.toBeInTheDocument()
    expect(within(finalCheck).getByText('Ознайомча вартість')).toBeInTheDocument()
    expect(screen.getByText('6 з 6')).toBeInTheDocument()
  })

  it('does not render a video visibility control when no video is uploaded', async () => {
    mockedFetchSpecialistProfile.mockResolvedValue({
      ...makeProfile(),
      video_url: '',
      show_video: false,
    })

    renderView()

    await screen.findByRole('heading', { name: 'Фото та відео' })
    expect(screen.queryByTestId('profile-video-visibility-control')).not.toBeInTheDocument()
    expect(screen.queryByText('Відеовізитка завантажена, але не показується клієнтам.')).not.toBeInTheDocument()
  })

  it('supports adding and saving an optional secondary phone', async () => {
    const profile = makeProfile()
    mockedFetchSpecialistProfile.mockResolvedValue(profile)
    mockedUpdateSpecialistProfile.mockResolvedValue({
      ...profile,
      secondary_phone: '+380671234567',
      show_secondary_phone: true,
    })

    renderView()

    await fireEvent.click(await screen.findByRole('button', { name: 'Додати ще один номер' }))
    const secondaryInput = screen.getByTestId('secondary-phone-input') as HTMLInputElement
    expect(screen.getByText('Спочатку додайте додатковий номер, щоб налаштувати його видимість.')).toBeInTheDocument()
    expect(visibilityControl('secondary-phone').show).toBeNull()
    expect(visibilityControl('secondary-phone').hide).toBeNull()

    await fireEvent.update(secondaryInput, '+380 67 123 45 67')
    expect(visibilityControl('secondary-phone').hide).toHaveAttribute('aria-pressed', 'true')
    await fireEvent.click(visibilityControl('secondary-phone').show as HTMLElement)
    await fireEvent.click(screen.getByRole('button', { name: 'Зберегти зміни' }))

    await waitFor(() => {
      expect(mockedUpdateSpecialistProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          secondary_phone: '+380 67 123 45 67',
          show_secondary_phone: true,
        })
      )
    })
  })

  it('removes the optional secondary phone and clears visibility', async () => {
    const profile = {
      ...makeProfile(),
      secondary_phone: '+380671234567',
      show_secondary_phone: true,
    }
    mockedFetchSpecialistProfile.mockResolvedValue(profile)
    mockedUpdateSpecialistProfile.mockResolvedValue({
      ...profile,
      secondary_phone: '',
      show_secondary_phone: false,
    })

    renderView()

    expect(await screen.findByTestId('secondary-phone-input')).toHaveValue('+380671234567')
    await fireEvent.click(screen.getByRole('button', { name: 'Прибрати додатковий номер' }))
    await fireEvent.click(screen.getByRole('button', { name: 'Зберегти зміни' }))

    await waitFor(() => {
      expect(mockedUpdateSpecialistProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          secondary_phone: '',
          show_secondary_phone: false,
        })
      )
    })
  })

  it('shows local secondary phone validation errors before saving', async () => {
    mockedFetchSpecialistProfile.mockResolvedValue(makeProfile())

    renderView()

    await fireEvent.click(await screen.findByRole('button', { name: 'Додати ще один номер' }))
    await fireEvent.update(screen.getByTestId('secondary-phone-input'), 'tel:+380501234567 ext 12')
    await fireEvent.click(screen.getByRole('button', { name: 'Зберегти зміни' }))

    expect((await screen.findAllByText('Введіть коректний додатковий номер телефону.'))[0]).toHaveClass(
      'field-error'
    )
    expect(mockedUpdateSpecialistProfile).not.toHaveBeenCalled()
  })

  it('shows duplicate secondary phone validation before saving', async () => {
    mockedFetchSpecialistProfile.mockResolvedValue(makeProfile())

    renderView()

    await fireEvent.click(await screen.findByRole('button', { name: 'Додати ще один номер' }))
    await fireEvent.update(screen.getByTestId('secondary-phone-input'), '000 111 22 33')
    await fireEvent.click(screen.getByRole('button', { name: 'Зберегти зміни' }))

    expect((await screen.findAllByText('Додатковий номер збігається з основним.'))[0]).toHaveClass(
      'field-error'
    )
    expect(mockedUpdateSpecialistProfile).not.toHaveBeenCalled()
  })

  it('renders backend secondary phone field errors near the field', async () => {
    mockedFetchSpecialistProfile.mockResolvedValue(makeProfile())
    mockedUpdateSpecialistProfile.mockRejectedValue({
      response: {
        data: {
          secondary_phone: ['Backend secondary phone error'],
        },
      },
    })

    renderView()

    await fireEvent.click(await screen.findByRole('button', { name: 'Додати ще один номер' }))
    await fireEvent.update(screen.getByTestId('secondary-phone-input'), '+380671234567')
    await fireEvent.click(screen.getByRole('button', { name: 'Зберегти зміни' }))

    expect(await screen.findByText('Backend secondary phone error')).toBeInTheDocument()
  })

  it('keeps photo and video as one section directly after basic identity data', async () => {
    mockedFetchSpecialistProfile.mockResolvedValue(makeProfile())

    renderView()

    const basicsHeading = await screen.findByRole('heading', { name: 'Основні дані' })
    const mediaHeadings = screen.getAllByRole('heading', { name: 'Фото та відео' })
    const profileSectionsHeading = screen.getByRole('heading', { name: 'Секції публічного профілю' })

    expect(mediaHeadings).toHaveLength(1)
    const mediaHeading = mediaHeadings[0] as HTMLElement
    expect(
      Boolean(basicsHeading.compareDocumentPosition(mediaHeading) & Node.DOCUMENT_POSITION_FOLLOWING)
    ).toBe(true)
    expect(
      Boolean(mediaHeading.compareDocumentPosition(profileSectionsHeading) & Node.DOCUMENT_POSITION_FOLLOWING)
    ).toBe(true)
  })

  it('uses profile photo and video business card copy in the media section', async () => {
    mockedFetchSpecialistProfile.mockResolvedValue({
      ...makeProfile(),
      video_url: '',
    })

    renderView()

    const mediaPanel = (await screen.findByRole('heading', { name: 'Фото та відео' })).closest('section') as HTMLElement
    expect(within(mediaPanel).getByText('Додайте фото профілю та, за бажанням, коротку відеовізитку.')).toBeInTheDocument()
    expect(within(mediaPanel).getByText('Фото профілю')).toBeInTheDocument()
    expect(within(mediaPanel).getByText('Відеовізитка')).toBeInTheDocument()
    expect(within(mediaPanel).getByText('Відеовізитку ще не завантажено')).toBeInTheDocument()
    expect(within(mediaPanel).getByRole('button', { name: 'Додати відеовізитку' })).toBeInTheDocument()
    expect(within(mediaPanel).queryByText("Відео прев'ю")).not.toBeInTheDocument()
  })

  it('uses change video business card copy when a video exists', async () => {
    mockedFetchSpecialistProfile.mockResolvedValue(makeProfile())

    renderView()

    const mediaPanel = (await screen.findByRole('heading', { name: 'Фото та відео' })).closest('section') as HTMLElement
    expect(within(mediaPanel).getByRole('button', { name: 'Змінити відеовізитку' })).toBeInTheDocument()
  })

  it('does not apply truncation styles to the profile subtitle', () => {
    const source = readFileSync('src/views/TherapistProfileView.vue', 'utf-8')
    const subtitleBlocks = [...source.matchAll(/\.profile__subtitle\s*\{([^}]*)\}/g)].map((match) => match[1])

    expect(subtitleBlocks.length).toBeGreaterThan(0)
    subtitleBlocks.forEach((block) => {
      expect(block).not.toMatch(
        /white-space\s*:\s*nowrap|text-overflow\s*:\s*ellipsis|-webkit-line-clamp|line-clamp|display\s*:\s*-webkit-box|overflow\s*:\s*hidden/i
      )
    })
  })

  it('renders public display name guidance and max length', async () => {
    mockedFetchSpecialistProfile.mockResolvedValue(makeProfile())

    renderView()

    const input = await screen.findByLabelText('Публічне ім’я')
    expect(input).toHaveAttribute('maxlength', '120')
    expect(
      screen.getByText(
        'Так ваше ім’я буде відображатися у публічному профілі. Можна вказати повне ім’я або скорочений варіант.'
      )
    ).toBeInTheDocument()
  })

  it('renders search visibility control in profile settings', async () => {
    mockedFetchSpecialistProfile.mockResolvedValue(makeProfile())

    renderView()

    expect(await screen.findByRole('heading', { name: 'Поява в пошуку Pro Consult' })).toBeInTheDocument()
    expect(
      screen.getByLabelText('Показувати мою сторінку в пошуку')
    ).toBeChecked()
    expect(
      screen.getByText(
        'Дозвольте клієнтам знаходити вашу сторінку через пошук спеціалістів у Pro Consult.'
      )
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'Клієнти можуть знайти сторінку через пошук спеціалістів.'
      )
    ).toBeInTheDocument()
    expect(screen.queryByLabelText('Дозволити знаходити мій профіль через пошук спеціалістів')).not.toBeInTheDocument()
    expect(
      screen.getByText(/У пошуку спеціалістів вони зʼявляються лише якщо окремо увімкнено видимість у пошуку/)
    ).toBeInTheDocument()
  })

  it('shows pending search visibility helpers before save', async () => {
    mockedFetchSpecialistProfile.mockResolvedValue(makeProfile())

    const { unmount } = renderView()

    const disableSearchCheckbox = await screen.findByLabelText('Показувати мою сторінку в пошуку')
    await fireEvent.click(disableSearchCheckbox)

    expect(screen.getByText('Показ у пошуку буде вимкнено після збереження.')).toBeInTheDocument()
    expect(screen.queryByText('Сторінка залишається доступною за прямим посиланням, але не відображається в пошуку.')).not.toBeInTheDocument()
    expect(mockedUpdateSpecialistProfile).not.toHaveBeenCalled()

    unmount()
    mockedFetchSpecialistProfile.mockResolvedValue({
      ...makeProfile(),
      is_search_visible: false,
    })

    renderView()

    const enableSearchCheckbox = await screen.findByLabelText('Показувати мою сторінку в пошуку')
    expect(
      screen.getByText('Сторінка залишається доступною за прямим посиланням, але не відображається в пошуку.')
    ).toBeInTheDocument()
    await fireEvent.click(enableSearchCheckbox)

    expect(screen.getByText('Показ у пошуку буде ввімкнено після збереження.')).toBeInTheDocument()
    expect(screen.queryByText('Клієнти можуть знайти сторінку через пошук спеціалістів.')).not.toBeInTheDocument()
    expect(mockedUpdateSpecialistProfile).not.toHaveBeenCalled()
  })

  it('keeps work boundaries helper text in profile management', async () => {
    mockedFetchSpecialistProfile.mockResolvedValue(makeProfile())

    renderView()

    expect(
      await screen.findByPlaceholderText(
        '\u0422\u0435\u043c\u0438 \u0430\u0431\u043e \u0437\u0430\u043f\u0438\u0442\u0438, \u0437 \u044f\u043a\u0438\u043c\u0438 \u0432\u0438 \u043d\u0435 \u043f\u0440\u0430\u0446\u044e\u0454\u0442\u0435.'
      )
    ).toBeInTheDocument()
  })

  it('shows owner guidance when redirected from /public with unpublished profile', async () => {
    mockedFetchSpecialistProfile.mockResolvedValue({
      ...makeProfile(),
      public_profile_enabled: false,
    })
    mockRoute.query = { public_profile: 'unpublished' }

    renderView()

    expect(
      await screen.findByText('Публічний профіль ще не опубліковано. Заповніть профіль і увімкніть його для перегляду.')
    ).toBeInTheDocument()
    expect(screen.getByText('Перейти до налаштувань профілю')).toBeInTheDocument()
    expect(screen.queryByText('Profile not found.')).not.toBeInTheDocument()
  })

  it('updates canonical profile slug via secondary edit flow', async () => {
    mockedFetchSpecialistProfile.mockResolvedValue(makeProfile())
    mockedUpdateSpecialistProfile.mockResolvedValue({
      ...makeProfile(),
      slug: 'anna-new',
      public_slug: 'anna-new',
      public_profile_path: '/s/anna-new',
      public_profile_url: `${window.location.origin}/s/anna-new`,
    } as any)

    renderView()

    expect(await screen.findByText(`${window.location.origin}/s/specialist-anna`)).toBeInTheDocument()
    await fireEvent.click(screen.getByRole('button', { name: 'Змінити адресу' }))
    const slugInput = screen.getByPlaceholderText('ваш-slug') as HTMLInputElement
    await fireEvent.update(slugInput, 'anna-new')
    await fireEvent.click(screen.getByRole('button', { name: 'Зберегти адресу' }))

    await waitFor(() => {
      expect(mockedUpdateSpecialistProfile).toHaveBeenCalledWith({ slug: 'anna-new' })
    })
    expect(await screen.findByText(`${window.location.origin}/s/anna-new`)).toBeInTheDocument()
  })

  it('maps professional_focus from API into the profile form select', async () => {
    mockedFetchSpecialistProfile.mockResolvedValue({
      ...makeProfile(),
      professional_focus: 'coaching_practice',
    })

    renderView()

    const focusSelect = (await screen.findByTestId('professional-focus-select')) as HTMLSelectElement
    expect(focusSelect.value).toBe('coaching_practice')
    expect(
      Array.from(focusSelect.options).some((option) => option.text === 'Коучингова практика')
    ).toBe(true)
  })

  it('keeps profile form stable when professional_focus is null', async () => {
    mockedFetchSpecialistProfile.mockResolvedValue({
      ...makeProfile(),
      professional_focus: null,
    })

    renderView()

    const focusSelect = (await screen.findByTestId('professional-focus-select')) as HTMLSelectElement
    const selectedOption = focusSelect.options[focusSelect.selectedIndex]
    expect(selectedOption?.text).toBe('Оберіть тип практики')
    expect(screen.getByDisplayValue('Анна')).toBeInTheDocument()
  })

  it.each([
    ['SLUG_INVALID', 'Некоректний формат адреси. Використайте латинські літери, цифри або дефіс.'],
    ['SLUG_RESERVED', 'Ця адреса недоступна. Спробуйте інший варіант.'],
    ['SLUG_TAKEN', 'Ця адреса вже зайнята. Спробуйте іншу.'],
  ])('maps %s slug update code to inline user-friendly feedback', async (code, expectedMessage) => {
    mockedFetchSpecialistProfile.mockResolvedValue(makeProfile())
    mockedUpdateSpecialistProfile.mockRejectedValue({
      response: {
        status: 400,
        data: { code },
      },
    })

    renderView()

    await screen.findByText(`${window.location.origin}/s/specialist-anna`)
    await fireEvent.click(screen.getByRole('button', { name: 'Змінити адресу' }))
    const slugInput = screen.getByPlaceholderText('ваш-slug') as HTMLInputElement
    await fireEvent.update(slugInput, 'anna-new')
    await fireEvent.click(screen.getByRole('button', { name: 'Зберегти адресу' }))

    expect(await screen.findByText(expectedMessage)).toBeInTheDocument()
  })

  it('supports quick-add suggestions for main requests and work boundaries without duplicates', async () => {
    mockedFetchSpecialistProfile.mockResolvedValue(makeProfile())

    renderView()

    const categoryKeys = ['psychology', 'coaching', 'mentoring', 'teaching', 'general']
    for (const categoryKey of categoryKeys) {
      expect(await screen.findByTestId(`main-requests-category-tab-${categoryKey}`)).toBeInTheDocument()
      expect(screen.getByTestId(`work-boundaries-category-tab-${categoryKey}`)).toBeInTheDocument()
    }

    const mainRequestsTextarea = (await screen.findByTestId('main-requests-textarea')) as HTMLTextAreaElement
    const mainRequestsChips = screen.getAllByTestId('main-requests-suggestion-chip')
    expect(mainRequestsChips.length).toBeGreaterThan(0)
    const firstMainRequestsChip = mainRequestsChips[0] as HTMLButtonElement
    const mainRequestsSuggestion = firstMainRequestsChip.textContent?.trim() || ''

    await fireEvent.click(firstMainRequestsChip)
    expect(mainRequestsTextarea.value).toContain(`• ${mainRequestsSuggestion}`)
    expect(firstMainRequestsChip).toBeDisabled()

    const mainRequestsOccurrences = mainRequestsTextarea.value.split(`• ${mainRequestsSuggestion}`).length - 1
    expect(mainRequestsOccurrences).toBe(1)

    await fireEvent.click(screen.getByTestId('work-boundaries-category-tab-coaching'))
    const workBoundariesTextarea = screen.getByTestId('work-boundaries-textarea') as HTMLTextAreaElement
    const workBoundariesChips = screen.getAllByTestId('work-boundaries-suggestion-chip')
    expect(workBoundariesChips.length).toBeGreaterThan(0)
    const firstWorkBoundariesChip = workBoundariesChips[0] as HTMLButtonElement
    const workBoundariesSuggestion = firstWorkBoundariesChip.textContent?.trim() || ''

    await fireEvent.click(firstWorkBoundariesChip)
    expect(workBoundariesTextarea.value).toContain(`• ${workBoundariesSuggestion}`)
    expect(firstWorkBoundariesChip).toBeDisabled()
  })

  it('renders psychology specialization presets for psychological_practice focus', async () => {
    mockedFetchSpecialistProfile.mockResolvedValue({
      ...makeProfile(),
      professional_focus: 'psychological_practice',
    })

    renderView()

    await screen.findByTestId('specialization-suggestions')
    expect(screen.getByRole('button', { name: 'Гештальт-терапія' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Когнітивно-поведінкова терапія' })).toBeInTheDocument()
  })

  it('renders coaching specialization presets for coaching_practice focus', async () => {
    mockedFetchSpecialistProfile.mockResolvedValue({
      ...makeProfile(),
      professional_focus: 'coaching_practice',
    })

    renderView()

    await screen.findByTestId('specialization-suggestions')
    expect(screen.getByRole('button', { name: 'Кар’єрний коучинг' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Executive coaching' })).toBeInTheDocument()
  })

  it('renders fallback specialization presets when professional_focus is null', async () => {
    mockedFetchSpecialistProfile.mockResolvedValue({
      ...makeProfile(),
      professional_focus: null,
    })

    renderView()

    await screen.findByTestId('specialization-suggestions')
    expect(screen.getByRole('button', { name: 'Індивідуальна практика' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Консультаційний супровід' })).toBeInTheDocument()
  })

  it('updates specialization presets when professional_focus changes', async () => {
    mockedFetchSpecialistProfile.mockResolvedValue({
      ...makeProfile(),
      professional_focus: 'psychological_practice',
    })

    renderView()

    const focusSelect = (await screen.findByTestId('professional-focus-select')) as HTMLSelectElement
    expect(screen.getByRole('button', { name: 'Гештальт-терапія' })).toBeInTheDocument()

    await fireEvent.update(focusSelect, 'consulting_practice')

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Бізнес-консалтинг' })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Гештальт-терапія' })).not.toBeInTheDocument()
    })
  })

  it('preserves selected specialization tags when professional_focus changes', async () => {
    mockedFetchSpecialistProfile.mockResolvedValue({
      ...makeProfile(),
      specializations: [],
      professional_focus: 'psychological_practice',
    })

    renderView()

    await screen.findByTestId('specialization-suggestions')
    await fireEvent.click(screen.getByRole('button', { name: 'Гештальт-терапія' }))
    expect(screen.getAllByText('Гештальт-терапія').length).toBeGreaterThan(1)

    const focusSelect = screen.getByTestId('professional-focus-select') as HTMLSelectElement
    await fireEvent.update(focusSelect, 'coaching_practice')

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Кар’єрний коучинг' })).toBeInTheDocument()
    })
    expect(screen.getAllByText('Гештальт-терапія')).toHaveLength(1)
  })

  it('keeps sticky save bar hidden on pristine form', async () => {
    mockedFetchSpecialistProfile.mockResolvedValue(makeProfile())

    renderView()

    expect(await screen.findByDisplayValue('Анна')).toBeInTheDocument()
    expect(screen.queryByTestId('profile-sticky-save-bar')).not.toBeInTheDocument()
  })

  it('shows sticky save bar after field change', async () => {
    mockedFetchSpecialistProfile.mockResolvedValue(makeProfile())

    renderView()

    const nameInput = (await screen.findByDisplayValue('Анна')) as HTMLInputElement
    await fireEvent.update(nameInput, 'Анна Нова')

    const stickyBar = await screen.findByTestId('profile-sticky-save-bar')
    expect(stickyBar).toBeInTheDocument()
    expect(stickyBar).toHaveAttribute('role', 'status')
    expect(screen.getByText('Є незбережені зміни')).toBeInTheDocument()
    expect(document.body).toHaveClass('has-bottom-action-bar')
  })

  it('saves a normalized payload via sticky save action and hides sticky bar after success', async () => {
    const profile = makeProfile()
    mockedFetchSpecialistProfile.mockResolvedValue(profile)
    mockedUpdateSpecialistProfile.mockResolvedValue(profile)

    renderView()

    const standardPriceInput = (await screen.findByDisplayValue('1500')) as HTMLInputElement
    await fireEvent.update(standardPriceInput, '1500 грн')
    const publicNameInput = screen.getByLabelText('Публічне ім’я') as HTMLInputElement
    await fireEvent.update(publicNameInput, '  Анна Профі  ')

    const introPriceInput = screen.getByDisplayValue('600') as HTMLInputElement
    await fireEvent.update(introPriceInput, '')
    const standardDurationSelect = screen.getByLabelText('Стандартна сесія (тривалість)') as HTMLSelectElement
    await fireEvent.update(standardDurationSelect, '75')
    const summaryInput = screen.getByDisplayValue('Короткий опис для hero-блоку.') as HTMLTextAreaElement
    await fireEvent.update(summaryInput, 'Оновлений короткий опис.   ')
    const rulesInput = screen.getByLabelText('Умови спеціаліста перед записом') as HTMLTextAreaElement
    await fireEvent.update(rulesInput, 'Оновлені умови перед записом.   ')

    expect(await screen.findByTestId('profile-sticky-save-bar')).toBeInTheDocument()
    await fireEvent.click(screen.getByRole('button', { name: 'Зберегти зміни' }))

    await waitFor(() => {
      expect(mockedUpdateSpecialistProfile).toHaveBeenCalledTimes(1)
    })

    expect(mockedUpdateSpecialistProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        public_visibility_contract_version: 2,
        public_profile_enabled: true,
        offers_online: true,
        offers_offline: true,
        offline_location: 'Львів, офіс 12',
        professional_focus: 'psychological_practice',
        public_display_name: 'Анна Профі',
        display_name: 'Анна Профі',
        public_profile_summary: 'Оновлений короткий опис.',
        setting_text: 'Оновлені умови перед записом.',
        education_summary: 'Integrative psychotherapy background.',
        education_items: ['Master in psychology', 'CBT program'],
        professional_development_items: ['EMDR Level 1', 'Schema intensive'],
        specializations: ['CBT', 'ACT'],
        languages: ['Українська', 'English'],
        location: 'Львів',
        price: '1500',
        standard_session_duration_minutes: 75,
        intro_duration_minutes: 30,
        intro_price: null,
        show_email: true,
        show_messenger: true,
        show_telegram: true,
      })
    )
    const savedPayload = mockedUpdateSpecialistProfile.mock.calls[0]?.[0] as Record<string, unknown>
    expect(savedPayload).not.toHaveProperty('show_photo')
    expect(savedPayload).not.toHaveProperty('show_video')
    expect(savedPayload).not.toHaveProperty('show_bio_about')
    expect(savedPayload).not.toHaveProperty('show_bio_work')
    expect(savedPayload).not.toHaveProperty('show_bio_approach')
    expect(savedPayload).not.toHaveProperty('show_bio_for_whom')
    expect(savedPayload).not.toHaveProperty('show_bio_other')
    const successMessage = await screen.findByText('Зміни збережено')
    expect(successMessage).toBeInTheDocument()
    expect(successMessage).toHaveClass('profile-save-feedback--success')
    await waitFor(() => {
      expect(screen.queryByTestId('profile-sticky-save-bar')).not.toBeInTheDocument()
    })
    expect(document.body).not.toHaveClass('has-bottom-action-bar')
  })

  it('shows a clear profile save error when saving fails', async () => {
    mockedFetchSpecialistProfile.mockResolvedValue(makeProfile())
    mockedUpdateSpecialistProfile.mockRejectedValue({})

    renderView()

    const publicNameInput = (await screen.findByLabelText('Публічне ім’я')) as HTMLInputElement
    await fireEvent.update(publicNameInput, 'Анна Нова')
    await fireEvent.click(screen.getByRole('button', { name: 'Зберегти зміни' }))

    expect(
      await screen.findByText('Не вдалося зберегти зміни. Спробуйте ще раз.')
    ).toBeInTheDocument()
    const stickyBar = screen.getByTestId('profile-sticky-save-bar')
    expect(stickyBar).toHaveAttribute('role', 'alert')
    expect(stickyBar).toHaveClass('sticky-save-bar--error')
  })

  it('warns before leaving with unsaved profile changes and stops warning after save', async () => {
    const profile = makeProfile()
    mockedFetchSpecialistProfile.mockResolvedValue(profile)
    mockedUpdateSpecialistProfile.mockResolvedValue(profile)
    const confirmSpy = vi.spyOn(window, 'confirm')

    renderView()

    const routeGuard = routerMocks.onBeforeRouteLeave.mock.calls[0]?.[0]
    expect(routeGuard).toBeTypeOf('function')
    const cleanNext = vi.fn()
    routeGuard?.({} as never, {} as never, cleanNext)
    expect(confirmSpy).not.toHaveBeenCalled()
    expect(cleanNext).toHaveBeenCalledWith()

    const publicNameInput = (await screen.findByLabelText('Публічне ім’я')) as HTMLInputElement
    await fireEvent.update(publicNameInput, 'Анна Нова')

    confirmSpy.mockReturnValueOnce(false)
    const blockedNext = vi.fn()
    routeGuard?.({} as never, {} as never, blockedNext)
    expect(confirmSpy).toHaveBeenCalledWith('У вас є незбережені зміни. Вийти без збереження?')
    expect(blockedNext).toHaveBeenCalledWith(false)

    const unloadEvent = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(unloadEvent)
    expect(unloadEvent.defaultPrevented).toBe(true)

    await fireEvent.click(screen.getByRole('button', { name: 'Зберегти зміни' }))
    expect(await screen.findByText('Зміни збережено')).toBeInTheDocument()

    confirmSpy.mockClear()
    const savedNext = vi.fn()
    routeGuard?.({} as never, {} as never, savedNext)
    expect(confirmSpy).not.toHaveBeenCalled()
    expect(savedNext).toHaveBeenCalledWith()

    const cleanUnloadEvent = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(cleanUnloadEvent)
    expect(cleanUnloadEvent.defaultPrevented).toBe(false)
  })

  it('renders couple consultation settings and saves configured couple offer fields', async () => {
    const profile = makeProfile()
    mockedFetchSpecialistProfile.mockResolvedValue(profile)
    mockedUpdateSpecialistProfile.mockResolvedValue({
      ...profile,
      couple_session_enabled: true,
      couple_session_price: '1800',
      couple_session_duration_minutes: 75,
    })

    renderView()

    expect(await screen.findByText('Парна консультація')).toBeInTheDocument()
    await fireEvent.update(screen.getByPlaceholderText('1800'), '1800 грн')
    await fireEvent.update(screen.getByLabelText('Тривалість'), '75')
    expect(within(screen.getByTestId('couple-session-visibility-control')).getByRole('button', { name: 'Пропонувати клієнтам' })).toBeInTheDocument()
    expect(within(screen.getByTestId('couple-session-visibility-control')).getByRole('button', { name: 'Не пропонувати' })).toBeInTheDocument()
    await fireEvent.click(visibilityControl('couple-session').show as HTMLElement)
    const coupleSection = screen.getByText('Парна консультація').closest('.field') as HTMLElement
    const durationSelect = within(coupleSection).getByLabelText('Тривалість') as HTMLSelectElement
    await fireEvent.update(durationSelect, '75')

    await fireEvent.click(screen.getByRole('button', { name: 'Зберегти зміни' }))

    await waitFor(() => {
      expect(mockedUpdateSpecialistProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          couple_session_enabled: true,
          couple_session_price: '1800',
          couple_session_price_currency: 'UAH',
          couple_session_duration_minutes: 75,
        })
      )
    })
  })

  it('renders and saves public booking slot policy settings', async () => {
    const profile = makeProfile()
    mockedFetchSpecialistProfile.mockResolvedValue({
      ...profile,
      public_booking_mode: 'direct_booking',
      show_public_availability: false,
    })
    mockedUpdateSpecialistProfile.mockResolvedValue({
      ...profile,
      public_booking_mode: 'direct_booking',
      show_public_availability: true,
      public_booking_slot_policy: 'parallel_requests',
    })

    renderView()

    expect(await screen.findByText('Публічний запис')).toBeInTheDocument()

    const availabilityControl = visibilityControl('public-availability')
    expect(availabilityControl.hide).toHaveAttribute('aria-pressed', 'true')
    expect(within(availabilityControl.control).getByText('Вільні вікна приховані від клієнтів')).toBeInTheDocument()

    await fireEvent.click(screen.getByLabelText('Дозволити клієнтам обирати час'))

    expect(screen.getByText('Коли кілька клієнтів обирають той самий час')).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /Один запит на один час/ })).toBeChecked()
    expect(screen.getByText('Дозволити кілька запитів на один час')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Один і той самий час може бути доступний кільком клієнтам. Ви самі оберете, який запит підтвердити.'
      )
    ).toBeInTheDocument()

    await fireEvent.click(screen.getByLabelText('Лише запити без вибору часу'))
    await waitFor(() => {
      expect(screen.getByRole('radio', { name: 'Лише запити без вибору часу' })).toBeChecked()
    })
    expect(screen.queryByText('Коли кілька клієнтів обирають той самий час')).not.toBeInTheDocument()
    expect(screen.queryByRole('radio', { name: /Один запит на один час/ })).not.toBeInTheDocument()

    await fireEvent.click(screen.getByLabelText('Дозволити клієнтам обирати час'))
    await waitFor(() => {
      expect(screen.getByRole('radio', { name: 'Дозволити клієнтам обирати час' })).toBeChecked()
    })
    await fireEvent.click(screen.getByRole('button', { name: 'Показувати вільні вікна' }))
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Показувати вільні вікна' })).toHaveAttribute(
        'aria-pressed',
        'true'
      )
    })
    expect(
      within(screen.getByTestId('public-availability-visibility-control')).getByText(
        'Вільні вікна показуються на публічній сторінці'
      )
    ).toBeInTheDocument()
    await fireEvent.click(screen.getByRole('radio', { name: /Дозволити кілька запитів на один час/ }))
    await fireEvent.click(screen.getByRole('button', { name: 'Зберегти зміни' }))

    await waitFor(() => {
      expect(mockedUpdateSpecialistProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          public_booking_mode: 'direct_booking',
          show_public_availability: true,
          public_booking_slot_policy: 'parallel_requests',
        })
      )
    })
    expect(screen.queryByText(/рейтинг/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/маркетплейс/i)).not.toBeInTheDocument()
  })

  it('hides public availability visibility control in request-only mode and restores it with preserved true state', async () => {
    mockedFetchSpecialistProfile.mockResolvedValue({
      ...makeProfile(),
      public_booking_mode: 'request_only',
      show_public_availability: true,
    })

    renderView()

    await screen.findByText('Публічний запис')
    const requestOnlyRadio = screen.getByRole('radio', { name: 'Лише запити без вибору часу' })
    expect(requestOnlyRadio).toBeChecked()
    expect(screen.queryByRole('button', { name: 'Показувати вільні вікна' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Не показувати вільні вікна' })).not.toBeInTheDocument()
    expect(
      screen.getByText('Щоб показувати вільні вікна, дозвольте клієнтам обирати час.')
    ).toBeInTheDocument()
    expect(mockedUpdateSpecialistProfile).not.toHaveBeenCalled()

    await fireEvent.click(screen.getByLabelText('Дозволити клієнтам обирати час'))
    await waitFor(() => {
      expect(screen.getByRole('radio', { name: 'Дозволити клієнтам обирати час' })).toBeChecked()
    })

    await screen.findByRole('button', { name: 'Показувати вільні вікна' })
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Показувати вільні вікна' })).toHaveAttribute(
        'aria-pressed',
        'true'
      )
    })
    expect(
      within(screen.getByTestId('public-availability-visibility-control')).getByText(
        'Вільні вікна показуються на публічній сторінці'
      )
    ).toBeInTheDocument()
    expect(screen.queryByText('Щоб показувати вільні вікна, дозвольте клієнтам обирати час.')).not.toBeInTheDocument()

    await fireEvent.click(screen.getByLabelText('Лише запити без вибору часу'))
    await waitFor(() => {
      expect(screen.getByRole('radio', { name: 'Лише запити без вибору часу' })).toBeChecked()
    })

    expect(screen.queryByRole('button', { name: 'Показувати вільні вікна' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Не показувати вільні вікна' })).not.toBeInTheDocument()
    expect(
      screen.getByText('Щоб показувати вільні вікна, дозвольте клієнтам обирати час.')
    ).toBeInTheDocument()
    await fireEvent.click(screen.getByLabelText('Дозволити клієнтам обирати час'))
    await waitFor(() => {
      expect(screen.getByRole('radio', { name: 'Дозволити клієнтам обирати час' })).toBeChecked()
      expect(screen.getByRole('button', { name: 'Показувати вільні вікна' })).toHaveAttribute(
        'aria-pressed',
        'true'
      )
    })
    expect(mockedUpdateSpecialistProfile).not.toHaveBeenCalled()
  })

  it('hides public availability visibility control in request-only mode and restores it with preserved false state', async () => {
    mockedFetchSpecialistProfile.mockResolvedValue({
      ...makeProfile(),
      public_booking_mode: 'request_only',
      show_public_availability: false,
    })

    renderView()

    await screen.findByText('Публічний запис')
    expect(screen.queryByRole('button', { name: 'Показувати вільні вікна' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Не показувати вільні вікна' })).not.toBeInTheDocument()
    expect(
      screen.getByText('Щоб показувати вільні вікна, дозвольте клієнтам обирати час.')
    ).toBeInTheDocument()

    await fireEvent.click(screen.getByLabelText('Дозволити клієнтам обирати час'))
    await waitFor(() => {
      expect(screen.getByRole('radio', { name: 'Дозволити клієнтам обирати час' })).toBeChecked()
    })

    await screen.findByRole('button', { name: 'Не показувати вільні вікна' })
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Не показувати вільні вікна' })).toHaveAttribute(
        'aria-pressed',
        'true'
      )
    })
    expect(
      within(screen.getByTestId('public-availability-visibility-control')).getByText(
        'Вільні вікна приховані від клієнтів'
      )
    ).toBeInTheDocument()

    await fireEvent.click(screen.getByLabelText('Лише запити без вибору часу'))
    await waitFor(() => {
      expect(screen.getByRole('radio', { name: 'Лише запити без вибору часу' })).toBeChecked()
    })

    expect(screen.queryByRole('button', { name: 'Показувати вільні вікна' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Не показувати вільні вікна' })).not.toBeInTheDocument()
    expect(
      screen.getByText('Щоб показувати вільні вікна, дозвольте клієнтам обирати час.')
    ).toBeInTheDocument()
    await fireEvent.click(screen.getByLabelText('Дозволити клієнтам обирати час'))
    await waitFor(() => {
      expect(screen.getByRole('radio', { name: 'Дозволити клієнтам обирати час' })).toBeChecked()
      expect(screen.getByRole('button', { name: 'Не показувати вільні вікна' })).toHaveAttribute(
        'aria-pressed',
        'true'
      )
    })
    expect(mockedUpdateSpecialistProfile).not.toHaveBeenCalled()
  })

  it('keeps couple consultation visibility unavailable until the offer is configured', async () => {
    mockedFetchSpecialistProfile.mockResolvedValue(makeProfile())

    renderView()

    await screen.findByText('Парна консультація')
    const control = visibilityControl('couple-session')

    expect(control.show).toBeNull()
    expect(control.hide).toBeNull()
    expect(
      within(control.control).getByText(
        'Спочатку вкажіть додатну вартість і тривалість парної консультації.'
      )
    ).toBeInTheDocument()
    expect(mockedUpdateSpecialistProfile).not.toHaveBeenCalled()
  })

  it('shows couple availability helper when public time selection is enabled', async () => {
    mockedFetchSpecialistProfile.mockResolvedValue({
      ...makeProfile(),
      public_booking_mode: 'direct_booking',
      show_public_availability: true,
      couple_session_enabled: true,
      couple_session_price: '1800',
      couple_session_duration_minutes: 75,
    })

    renderView()

    expect(
      await screen.findByText(
        'Щоб клієнти могли обрати час для парної консультації, додайте вікна відповідного часу для запису в розкладі.'
      )
    ).toBeInTheDocument()
  })

  it('hides couple availability helper when public time selection is disabled', async () => {
    mockedFetchSpecialistProfile.mockResolvedValue({
      ...makeProfile(),
      public_booking_mode: 'request_only',
      show_public_availability: false,
      couple_session_enabled: true,
      couple_session_price: '1800',
      couple_session_duration_minutes: 75,
    })

    renderView()

    await screen.findByText('Парна консультація')
    expect(
      screen.queryByText(
        'Щоб клієнти могли обрати час для парної консультації, додайте вікна відповідного часу для запису в розкладі.'
      )
    ).not.toBeInTheDocument()
  })

  it('allows saving disabled couple offer without price', async () => {
    const profile = makeProfile()
    mockedFetchSpecialistProfile.mockResolvedValue(profile)
    mockedUpdateSpecialistProfile.mockResolvedValue(profile)

    renderView()

    const publicNameInput = (await screen.findByLabelText('Публічне ім’я')) as HTMLInputElement
    await fireEvent.update(publicNameInput, 'Анна без парної консультації')
    await fireEvent.click(screen.getByRole('button', { name: 'Зберегти зміни' }))

    await waitFor(() => {
      expect(mockedUpdateSpecialistProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          couple_session_enabled: false,
          couple_session_price: null,
        })
      )
    })
  })

  it('sends null professional_focus when specialist clears selection', async () => {
    const profile = makeProfile()
    mockedFetchSpecialistProfile.mockResolvedValue(profile)
    mockedUpdateSpecialistProfile.mockResolvedValue({
      ...profile,
      professional_focus: null,
    })

    renderView()

    const focusSelect = (await screen.findByTestId('professional-focus-select')) as HTMLSelectElement
    const placeholderValue = focusSelect.options[0]?.value ?? ''
    await fireEvent.update(focusSelect, placeholderValue)

    expect(await screen.findByTestId('profile-sticky-save-bar')).toBeInTheDocument()
    await fireEvent.click(screen.getByRole('button', { name: 'Зберегти зміни' }))

    await waitFor(() => {
      expect(mockedUpdateSpecialistProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          professional_focus: null,
        })
      )
    })
  })

  it('restores last saved values on cancel and hides sticky bar', async () => {
    mockedFetchSpecialistProfile.mockResolvedValue(makeProfile())

    renderView()

    const nameInput = (await screen.findByDisplayValue('Анна')) as HTMLInputElement
    await fireEvent.update(nameInput, 'Тест зміна')

    expect(await screen.findByTestId('profile-sticky-save-bar')).toBeInTheDocument()
    await fireEvent.click(screen.getByRole('button', { name: 'Скасувати' }))

    await waitFor(() => {
      expect((screen.getByDisplayValue('Анна') as HTMLInputElement).value).toBe('Анна')
      expect(screen.queryByTestId('profile-sticky-save-bar')).not.toBeInTheDocument()
    })
  })

  it('keeps existing validation flow when both online and offline options are disabled', async () => {
    mockedFetchSpecialistProfile.mockResolvedValue(makeProfile())

    renderView()

    const online = (await screen.findByLabelText('Доступно онлайн')) as HTMLInputElement
    const offline = screen.getByLabelText('Доступно офлайн') as HTMLInputElement
    if (online.checked) await fireEvent.click(online)
    if (offline.checked) await fireEvent.click(offline)

    const stickyBar = await screen.findByTestId('profile-sticky-save-bar')
    expect(stickyBar).toBeInTheDocument()
    await fireEvent.click(screen.getByRole('button', { name: 'Зберегти зміни' }))

    expect(mockedUpdateSpecialistProfile).not.toHaveBeenCalled()
    const validationError = await screen.findByText('Оберіть щонайменше один формат консультацій: онлайн або офлайн.')
    expect(validationError).toBeInTheDocument()
    expect(screen.getByTestId('profile-sticky-save-bar')).toHaveTextContent(
      'Оберіть щонайменше один формат консультацій: онлайн або офлайн.'
    )
    expect(screen.getByDisplayValue('Анна')).toBeInTheDocument()
  })

  it('hides and shows offline location field based on offline availability', async () => {
    mockedFetchSpecialistProfile.mockResolvedValue(makeProfile())

    renderView()

    expect(await screen.findByLabelText('Локація для офлайн-зустрічей')).toBeInTheDocument()

    const offline = screen.getByLabelText('Доступно офлайн') as HTMLInputElement
    await fireEvent.click(offline)
    await waitFor(() => {
      expect(screen.queryByLabelText('Локація для офлайн-зустрічей')).not.toBeInTheDocument()
    })

    await fireEvent.click(offline)
    expect(await screen.findByLabelText('Локація для офлайн-зустрічей')).toBeInTheDocument()
  })

  it('shows upload hints in media step', async () => {
    mockedFetchSpecialistProfile.mockResolvedValue(makeProfile())
    renderView()

    expect(await screen.findByText('JPG, PNG, WEBP • до 5 МБ')).toBeInTheDocument()
    expect(screen.getByText('MP4, MOV, WEBM • до 1 хв • до 100 МБ')).toBeInTheDocument()
    expect(
      screen.getByText('Рекомендовано: знімати у 720p або 1080p, з хорошим освітленням і чітким звуком.')
    ).toBeInTheDocument()
  })

  it('blocks oversized photo on client side', async () => {
    mockedFetchSpecialistProfile.mockResolvedValue(makeProfile())
    const { container } = renderView()
    await screen.findByText('JPG, PNG, WEBP • до 5 МБ')

    const photoInput = container.querySelector('input[type="file"][accept="image/*"]') as HTMLInputElement | null
    expect(photoInput).not.toBeNull()
    const tooLargePhoto = createFile('too-large.jpg', 'image/jpeg', 5 * 1024 * 1024 + 1)
    await fireEvent.change(photoInput as HTMLInputElement, { target: { files: [tooLargePhoto] } })

    expect(mockedUploadProfilePhoto).not.toHaveBeenCalled()
    expect(screen.getByText('Фото перевищує допустимий розмір 5 МБ.')).toBeInTheDocument()
    expect(screen.queryByTestId('cropper-stub')).not.toBeInTheDocument()
  })

  it('blocks invalid photo type on client side', async () => {
    mockedFetchSpecialistProfile.mockResolvedValue(makeProfile())
    const { container } = renderView()
    await screen.findByText('JPG, PNG, WEBP • до 5 МБ')

    const photoInput = container.querySelector('input[type="file"][accept="image/*"]') as HTMLInputElement | null
    expect(photoInput).not.toBeNull()
    const invalidPhoto = createFile('avatar.gif', 'image/gif')
    await fireEvent.change(photoInput as HTMLInputElement, { target: { files: [invalidPhoto] } })

    expect(mockedUploadProfilePhoto).not.toHaveBeenCalled()
    expect(screen.getByText('Підтримуються формати JPG, PNG, WEBP.')).toBeInTheDocument()
    expect(screen.queryByTestId('cropper-stub')).not.toBeInTheDocument()
  })

  it('blocks oversized video on client side', async () => {
    mockedFetchSpecialistProfile.mockResolvedValue(makeProfile())
    const { container } = renderView()
    await screen.findByText('MP4, MOV, WEBM • до 1 хв • до 100 МБ')

    const videoInput = container.querySelector('input[type="file"][accept="video/*"]') as HTMLInputElement | null
    expect(videoInput).not.toBeNull()
    const tooLargeVideo = createFile('preview.mp4', 'video/mp4', 100 * 1024 * 1024 + 1)
    await fireEvent.change(videoInput as HTMLInputElement, { target: { files: [tooLargeVideo] } })

    expect(mockedUploadProfileVideo).not.toHaveBeenCalled()
    expect(screen.getByText('Відео перевищує допустимий розмір 100 МБ.')).toBeInTheDocument()
  })

  it('blocks invalid video type on client side', async () => {
    mockedFetchSpecialistProfile.mockResolvedValue(makeProfile())
    const { container } = renderView()
    await screen.findByText('MP4, MOV, WEBM • до 1 хв • до 100 МБ')

    const videoInput = container.querySelector('input[type="file"][accept="video/*"]') as HTMLInputElement | null
    expect(videoInput).not.toBeNull()
    const invalidVideo = createFile('preview.avi', 'video/x-msvideo')
    await fireEvent.change(videoInput as HTMLInputElement, { target: { files: [invalidVideo] } })

    expect(mockedUploadProfileVideo).not.toHaveBeenCalled()
    expect(screen.getByText('Підтримуються формати MP4, MOV, WEBM.')).toBeInTheDocument()
  })

  it('valid video flow still uploads', async () => {
    const profile = makeProfile()
    mockedFetchSpecialistProfile.mockResolvedValue(profile)
    mockedUploadProfileVideo.mockResolvedValue({
      ...profile,
      video_url: 'https://example.com/video-updated.mp4',
    })
    const urlWithObjectUrl = URL as unknown as {
      createObjectURL?: (object: Blob | MediaSource) => string
      revokeObjectURL?: (url: string) => void
    }
    const originalCreateObjectUrl = urlWithObjectUrl.createObjectURL
    const originalRevokeObjectUrl = urlWithObjectUrl.revokeObjectURL
    urlWithObjectUrl.createObjectURL = vi.fn(() => 'blob:video-preview')
    urlWithObjectUrl.revokeObjectURL = vi.fn()

    const { container } = renderView()
    await screen.findByText('MP4, MOV, WEBM • до 1 хв • до 100 МБ')

    const videoInput = container.querySelector('input[type="file"][accept="video/*"]') as HTMLInputElement | null
    expect(videoInput).not.toBeNull()
    const videoFile = createFile('preview.mp4', 'video/mp4')
    await fireEvent.change(videoInput as HTMLInputElement, { target: { files: [videoFile] } })

    await waitFor(() => {
      expect(mockedUploadProfileVideo).toHaveBeenCalledTimes(1)
    })

    urlWithObjectUrl.createObjectURL = originalCreateObjectUrl
    urlWithObjectUrl.revokeObjectURL = originalRevokeObjectUrl
  })

  it('closes crop modal and keeps updated preview visible after successful photo save', async () => {
    const profile = makeProfile()
    mockedFetchSpecialistProfile.mockResolvedValue(profile)
    mockedUploadProfilePhoto.mockResolvedValue({
      ...profile,
      photo_url: 'https://example.com/photo-updated.jpg',
    })

    const urlWithObjectUrl = URL as unknown as {
      createObjectURL?: (object: Blob | MediaSource) => string
      revokeObjectURL?: (url: string) => void
    }
    const originalCreateObjectUrl = urlWithObjectUrl.createObjectURL
    const originalRevokeObjectUrl = urlWithObjectUrl.revokeObjectURL
    const createObjectUrlMock = vi.fn(() => 'blob:photo-preview')
    const revokeObjectUrlMock = vi.fn()
    urlWithObjectUrl.createObjectURL = createObjectUrlMock
    urlWithObjectUrl.revokeObjectURL = revokeObjectUrlMock

    const { container } = renderView()
    await screen.findByDisplayValue(profile.display_name)

    const photoInput = container.querySelector('input[type="file"][accept="image/*"]') as HTMLInputElement | null
    expect(photoInput).not.toBeNull()

    const file = new File(['photo'], 'profile.jpg', { type: 'image/jpeg' })
    await fireEvent.change(photoInput as HTMLInputElement, { target: { files: [file] } })

    expect(await screen.findByTestId('cropper-stub')).toBeInTheDocument()

    const saveCropButton = container.querySelector('.cropper-actions .btn:last-child') as HTMLButtonElement | null
    expect(saveCropButton).not.toBeNull()
    await fireEvent.click(saveCropButton as HTMLButtonElement)

    await waitFor(() => {
      expect(mockedUploadProfilePhoto).toHaveBeenCalledTimes(1)
    })

    await waitFor(() => {
      expect(screen.queryByTestId('cropper-stub')).not.toBeInTheDocument()
    })

    const previewImage = container.querySelector('.media-frame img') as HTMLImageElement | null
    expect(previewImage).not.toBeNull()
    expect((previewImage as HTMLImageElement).src).toContain('https://example.com/photo-updated.jpg')
    expect(revokeObjectUrlMock).toHaveBeenCalledWith('blob:photo-preview')

    urlWithObjectUrl.createObjectURL = originalCreateObjectUrl
    urlWithObjectUrl.revokeObjectURL = originalRevokeObjectUrl
  })

  it('shows delete controls on hover for media cards', async () => {
    mockedFetchSpecialistProfile.mockResolvedValue(makeProfile())

    const { container } = renderView()
    await screen.findByTestId('remove-photo-button')
    await screen.findByTestId('remove-video-button')

    const photoButton = screen.getByTestId('remove-photo-button')
    const videoButton = screen.getByTestId('remove-video-button')
    expect(photoButton).not.toHaveClass('is-visible')
    expect(videoButton).not.toHaveClass('is-visible')

    const photoImage = container.querySelector('[data-testid="media-card-photo"] .media-frame img') as HTMLElement | null
    const videoElement = container.querySelector('[data-testid="media-card-video"] .media-frame video') as HTMLElement | null
    expect(photoImage).not.toBeNull()
    expect(videoElement).not.toBeNull()

    await fireEvent.mouseEnter(photoImage as HTMLElement)
    await fireEvent.mouseEnter(videoElement as HTMLElement)
    expect(photoButton).toHaveClass('is-visible')
    expect(videoButton).toHaveClass('is-visible')

    await fireEvent.mouseLeave(photoImage as HTMLElement)
    await fireEvent.mouseLeave(videoElement as HTMLElement)
    expect(photoButton).not.toHaveClass('is-visible')
    expect(videoButton).not.toHaveClass('is-visible')
  })

  it('deletes profile photo and removes preview after success', async () => {
    const profile = makeProfile()
    mockedFetchSpecialistProfile.mockResolvedValue(profile)
    mockedUpdateSpecialistProfile.mockResolvedValue({
      ...profile,
      photo_url: '',
    })

    const { container } = renderView()
    await screen.findByTestId('remove-photo-button')

    await fireEvent.click(screen.getByTestId('remove-photo-button'))

    await waitFor(() => {
      expect(mockedUpdateSpecialistProfile).toHaveBeenCalledWith({ photo_url: '' })
    })

    await waitFor(() => {
      const photoImage = container.querySelector('[data-testid="media-card-photo"] .media-frame img')
      expect(photoImage).not.toBeInTheDocument()
    })
  })

  it('deletes profile video and removes preview after success', async () => {
    const profile = makeProfile()
    mockedFetchSpecialistProfile.mockResolvedValue(profile)
    mockedUpdateSpecialistProfile.mockResolvedValue({
      ...profile,
      video_url: '',
    })

    const { container } = renderView()
    await screen.findByTestId('remove-video-button')

    await fireEvent.click(screen.getByTestId('remove-video-button'))

    await waitFor(() => {
      expect(mockedUpdateSpecialistProfile).toHaveBeenCalledWith({ video_url: '' })
    })

    await waitFor(() => {
      const video = container.querySelector('[data-testid="media-card-video"] .media-frame video')
      expect(video).not.toBeInTheDocument()
    })
  })
})
