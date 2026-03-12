import { fireEvent, render, screen, waitFor } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import TherapistProfileView from './TherapistProfileView.vue'
import {
  fetchSpecialistProfile,
  rotateSpecialistProfileSlug,
  updateSpecialistProfile,
  uploadProfilePhoto,
  uploadProfileVideo,
} from '../lib/api'

vi.mock('vue-advanced-cropper', () => ({
  Cropper: {
    template: '<div data-testid="cropper-stub"></div>',
  },
}))

vi.mock('../lib/api', () => ({
  fetchSpecialistProfile: vi.fn(),
  rotateSpecialistProfileSlug: vi.fn(),
  updateSpecialistProfile: vi.fn(),
  uploadProfilePhoto: vi.fn(),
  uploadProfileVideo: vi.fn(),
}))

const mockedFetchSpecialistProfile = vi.mocked(fetchSpecialistProfile)
const mockedRotateSpecialistProfileSlug = vi.mocked(rotateSpecialistProfileSlug)
const mockedUpdateSpecialistProfile = vi.mocked(updateSpecialistProfile)
const mockedUploadProfilePhoto = vi.mocked(uploadProfilePhoto)
const mockedUploadProfileVideo = vi.mocked(uploadProfileVideo)

function makeProfile() {
  return {
    id: 5,
    public_profile_enabled: true,
    public_slug: 'specialist-anna',
    last_slug_rotated_at: '2026-03-10T09:00:00Z',
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

describe('TherapistProfileView', () => {
  beforeEach(() => {
    mockedFetchSpecialistProfile.mockReset()
    mockedRotateSpecialistProfileSlug.mockReset()
    mockedUpdateSpecialistProfile.mockReset()
    mockedUploadProfilePhoto.mockReset()
    mockedUploadProfileVideo.mockReset()
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
    expect(screen.getByText(`${window.location.origin}/specialist/specialist-anna`)).toBeInTheDocument()
  })

  it('saves a normalized payload based on the current form state', async () => {
    const profile = makeProfile()
    mockedFetchSpecialistProfile.mockResolvedValue(profile)
    mockedUpdateSpecialistProfile.mockResolvedValue(profile)

    renderView()

    const standardPriceInput = (await screen.findByDisplayValue('1500')) as HTMLInputElement
    await fireEvent.update(standardPriceInput, '1500 грн')

    const introPriceInput = screen.getByDisplayValue('600') as HTMLInputElement
    await fireEvent.update(introPriceInput, '')

    const saveButton = screen.getByRole('button', { name: 'Зберегти зміни' })
    await fireEvent.click(saveButton)

    await waitFor(() => {
      expect(mockedUpdateSpecialistProfile).toHaveBeenCalledTimes(1)
    })

    expect(mockedUpdateSpecialistProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        public_profile_enabled: true,
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
  })
})
