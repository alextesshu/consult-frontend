import { http } from './http'

type TokenResponse = {
  access: string
  refresh: string
}

type SignupResponse = TokenResponse & {
  user: {
    id: number
    username: string
    email: string | null
    role: string
    roles: string[]
  }
}

export async function loginWithIdentifier(
  identifier: string,
  password: string
): Promise<TokenResponse> {
  const isEmail = identifier.includes('@')
  const payload = isEmail
    ? { email: identifier, password }
    : { username: identifier, password }

  try {
    const resp = await http.post<TokenResponse>('/auth/token/', payload)
    return resp.data
  } catch (err: any) {
    const message = err?.response?.data?.detail || 'Не вдалося увійти'
    throw new Error(message)
  }
}

export async function signupTherapist(
  email: string,
  password: string,
  passwordConfirm: string
): Promise<SignupResponse> {
  try {
    const resp = await http.post<SignupResponse>('/auth/signup/', {
      email,
      password,
      password_confirm: passwordConfirm,
    })
    return resp.data
  } catch (err: any) {
    const data = err?.response?.data
    let message = data?.detail
    if (!message && data && typeof data === 'object') {
      const parts = Object.entries(data).map(([key, value]) => {
        if (Array.isArray(value)) {
          return `${key}: ${value[0]}`
        }
        if (typeof value === 'string') {
          return `${key}: ${value}`
        }
        return `${key}: ${String(value)}`
      })
      message = parts.filter(Boolean).join(' ')
    }
    message = message || 'Не вдалося зареєструватися'
    throw new Error(message)
  }
}

export async function fetchMe(accessToken: string) {
  const resp = await http.get('/me/', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  return resp.data
}

export async function refreshToken(refresh: string): Promise<TokenResponse> {
  const resp = await http.post<TokenResponse>('/auth/token/refresh/', { refresh })
  return resp.data
}

export type TherapistProfile = {
  id: number
  public_profile_enabled: boolean
  public_slug: string
  last_slug_rotated_at: string | null
  display_name: string
  bio: string
  bio_about: string
  bio_work: string
  bio_approach: string
  bio_for_whom: string
  bio_other: string
  show_bio_about: boolean
  show_bio_work: boolean
  show_bio_approach: boolean
  show_bio_for_whom: boolean
  show_bio_other: boolean
  specializations: string | string[]
  languages: string | string[]
  location: string
  price: string
  price_currency: string
  contact_email: string
  contact_phone: string
  messenger: string
  telegram: string
  viber: string
  whatsapp: string
  photo_url: string
  video_url: string
  show_email: boolean
  show_phone: boolean
  show_messenger: boolean
  show_telegram: boolean
  show_viber: boolean
  show_whatsapp: boolean
  show_video: boolean
  show_price: boolean
  show_location: boolean
  show_photo: boolean
}

export type PublicTherapistProfile = {
  public_slug?: string
  therapist_id: number
  display_name: string
  bio?: string
  bio_about?: string
  bio_work?: string
  bio_approach?: string
  bio_for_whom?: string
  bio_other?: string
  specializations?: string | string[]
  languages?: string | string[]
  location?: string
  price?: string
  price_currency?: string
  contact_email?: string
  contact_phone?: string
  messenger?: string
  photo_url?: string
  video_url?: string
}

export async function uploadProfilePhoto(file: File): Promise<TherapistProfile> {
  const formData = new FormData()
  formData.append('file', file)
  const resp = await http.post<TherapistProfile>('/cabinet/profile/upload-photo/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return resp.data
}

export async function uploadProfileVideo(file: File): Promise<TherapistProfile> {
  const formData = new FormData()
  formData.append('file', file)
  const resp = await http.post<TherapistProfile>('/cabinet/profile/upload-video/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return resp.data
}

export async function fetchTherapistProfile(): Promise<TherapistProfile> {
  const resp = await http.get<TherapistProfile>('/cabinet/profile/')
  return resp.data
}

export async function updateTherapistProfile(
  payload: Partial<TherapistProfile>
): Promise<TherapistProfile> {
  const resp = await http.patch<TherapistProfile>('/cabinet/profile/', payload)
  return resp.data
}

export async function rotateTherapistProfileSlug(): Promise<TherapistProfile> {
  const resp = await http.post<TherapistProfile>('/cabinet/profile/rotate-slug/')
  return resp.data
}

export async function fetchPublicTherapistProfile(
  slug: string
): Promise<PublicTherapistProfile> {
  const resp = await http.get<PublicTherapistProfile>(`/public/therapists/${slug}/`)
  return resp.data
}

export type SessionReview = {
  id: number
  session: number
  rating: number
  review_text: string
  created_at: string
}

export async function fetchPublicTherapistReviews(
  slug: string,
  limit = 20
): Promise<SessionReview[]> {
  const resp = await http.get<SessionReview[]>(`/public/therapists/${slug}/reviews/`, {
    params: { limit },
  })
  return resp.data
}

export async function createSessionReview(sessionId: number, payload: { rating: number; review_text?: string }) {
  const resp = await http.post(`/booking/sessions/${sessionId}/review/`, payload)
  return resp.data
}

export async function fetchPublicTherapists(
  params?: {
    page?: number
    page_size?: number
    sort?: string
    query?: string
    language?: string
    location?: string
    price_min?: string
    price_max?: string
    price_currency?: string
  }
): Promise<{
  results: PublicTherapistProfile[]
  page: number
  page_size: number
  total: number
  total_pages: number
}> {
  const resp = await http.get('/public/therapists/', { params })
  return resp.data
}
