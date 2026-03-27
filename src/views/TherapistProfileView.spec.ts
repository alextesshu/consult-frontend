import { fireEvent, render, screen, waitFor } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import TherapistProfileView from './TherapistProfileView.vue'
import {
  createProfileDocument,
  deleteProfileDocument,
  fetchProfileDocuments,
  fetchSpecialistProfile,
  rotateSpecialistProfileSlug,
  updateProfileDocument,
  updateSpecialistProfile,
  uploadProfilePhoto,
  uploadProfileVideo,
} from '../lib/api'

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
  rotateSpecialistProfileSlug: vi.fn(),
  updateProfileDocument: vi.fn(),
  updateSpecialistProfile: vi.fn(),
  uploadProfilePhoto: vi.fn(),
  uploadProfileVideo: vi.fn(),
}))

const mockedCreateProfileDocument = vi.mocked(createProfileDocument)
const mockedDeleteProfileDocument = vi.mocked(deleteProfileDocument)
const mockedFetchSpecialistProfile = vi.mocked(fetchSpecialistProfile)
const mockedFetchProfileDocuments = vi.mocked(fetchProfileDocuments)
const mockedRotateSpecialistProfileSlug = vi.mocked(rotateSpecialistProfileSlug)
const mockedUpdateProfileDocument = vi.mocked(updateProfileDocument)
const mockedUpdateSpecialistProfile = vi.mocked(updateSpecialistProfile)
const mockedUploadProfilePhoto = vi.mocked(uploadProfilePhoto)
const mockedUploadProfileVideo = vi.mocked(uploadProfileVideo)

function makeProfile() {
  return {
    id: 5,
    public_profile_enabled: true,
    public_slug: 'specialist-anna',
    last_slug_rotated_at: '2026-03-10T09:00:00Z',
    offers_online: true,
    offers_offline: true,
    offline_location: 'Львів, офіс 12',
    display_name: 'Анна',
    bio_about: 'Працюю дбайливо.',
    bio_work: 'Онлайн консультації.',
    bio_approach: 'CBT.',
    bio_for_whom: 'Для дорослих.',
    bio_other: '',
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
    intro_duration_minutes: 30,
    intro_price: '600',
    intro_price_currency: 'UAH',
    contact_email: 'anna@example.com',
    contact_phone: '+380001112233',
    messenger: '@anna-signal',
    telegram: '@anna',
    viber: '+380001112233',
    whatsapp: '+380001112233',
    photo_url: 'https://example.com/photo.jpg',
    video_url: 'https://example.com/video.mp4',
    show_email: true,
    show_phone: false,
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

function createFile(name: string, type: string, sizeOverride?: number) {
  const file = new File(['x'], name, { type })
  if (typeof sizeOverride === 'number') {
    Object.defineProperty(file, 'size', { value: sizeOverride, configurable: true })
  }
  return file
}

describe('TherapistProfileView', () => {
  beforeEach(() => {
    mockedCreateProfileDocument.mockReset()
    mockedDeleteProfileDocument.mockReset()
    mockedFetchSpecialistProfile.mockReset()
    mockedFetchProfileDocuments.mockReset()
    mockedRotateSpecialistProfileSlug.mockReset()
    mockedUpdateProfileDocument.mockReset()
    mockedUpdateSpecialistProfile.mockReset()
    mockedUploadProfilePhoto.mockReset()
    mockedUploadProfileVideo.mockReset()
    mockedFetchProfileDocuments.mockResolvedValue([])
  })

  it('renders the loaded public profile data and live preview', async () => {
    mockedFetchSpecialistProfile.mockResolvedValue(makeProfile())

    const { container } = renderView()

    expect(await screen.findByDisplayValue('Анна')).toBeInTheDocument()
    expect(screen.getByText('Live preview публічної сторінки')).toBeInTheDocument()
    expect(container).toHaveTextContent('anna@example.com')
    expect(container).toHaveTextContent('Анна')
    expect(screen.getByText('Ознайомча: 600 грн')).toBeInTheDocument()
    expect(screen.getByText('Досвід: 6 років')).toBeInTheDocument()
    expect(screen.getByLabelText('Доступно онлайн')).toBeChecked()
    expect(screen.getByLabelText('Доступно офлайн')).toBeChecked()
    expect(screen.getByDisplayValue('Львів, офіс 12')).toBeInTheDocument()
    expect(screen.getByText(`${window.location.origin}/specialist/specialist-anna`)).toBeInTheDocument()
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

    expect(await screen.findByTestId('profile-sticky-save-bar')).toBeInTheDocument()
    expect(screen.getByText('Є незбережені зміни')).toBeInTheDocument()
  })

  it('saves a normalized payload via sticky save action and hides sticky bar after success', async () => {
    const profile = makeProfile()
    mockedFetchSpecialistProfile.mockResolvedValue(profile)
    mockedUpdateSpecialistProfile.mockResolvedValue(profile)

    renderView()

    const standardPriceInput = (await screen.findByDisplayValue('1500')) as HTMLInputElement
    await fireEvent.update(standardPriceInput, '1500 грн')

    const introPriceInput = screen.getByDisplayValue('600') as HTMLInputElement
    await fireEvent.update(introPriceInput, '')

    expect(await screen.findByTestId('profile-sticky-save-bar')).toBeInTheDocument()
    await fireEvent.click(screen.getByRole('button', { name: 'Зберегти' }))

    await waitFor(() => {
      expect(mockedUpdateSpecialistProfile).toHaveBeenCalledTimes(1)
    })

    expect(mockedUpdateSpecialistProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        public_profile_enabled: true,
        offers_online: true,
        offers_offline: true,
        offline_location: 'Львів, офіс 12',
        display_name: 'Анна',
        specializations: ['CBT', 'ACT'],
        languages: ['Українська', 'English'],
        location: 'Львів',
        price: '1500',
        intro_price: null,
        show_email: true,
        show_messenger: true,
        show_telegram: true,
        show_photo: true,
      })
    )
    expect(await screen.findByText('Збережено.')).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.queryByTestId('profile-sticky-save-bar')).not.toBeInTheDocument()
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
    await fireEvent.click(screen.getByRole('button', { name: 'Зберегти' }))

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
