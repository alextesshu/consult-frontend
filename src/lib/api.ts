import { http } from './http'
import type { AxiosRequestConfig } from 'axios'

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

export function getApiErrorMessage(err: unknown, fallback: string): string {
  const anyErr = err as any
  const detail = anyErr?.response?.data?.detail
  if (typeof detail === 'string' && detail.trim()) return detail
  const data = anyErr?.response?.data
  if (data && typeof data === 'object') {
    const parts: string[] = []
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') parts.push(`${key}: ${value}`)
      else if (Array.isArray(value) && value[0]) parts.push(`${key}: ${value[0]}`)
    }
    if (parts.length) return parts.join(' · ')
  }
  if (typeof anyErr?.message === 'string' && anyErr.message.trim()) return anyErr.message
  return fallback
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
    throw new Error(getApiErrorMessage(err, 'Не вдалося увійти'))
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
    throw new Error(getApiErrorMessage(err, 'Не вдалося зареєструватися'))
  }
}

export async function signupSpecialist(
  email: string,
  password: string,
  passwordConfirm: string
): Promise<SignupResponse> {
  return signupTherapist(email, password, passwordConfirm)
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
  experience_years: number
  price: string
  price_currency: string
  intro_duration_minutes: number
  intro_price: string
  intro_price_currency: string
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
  show_intro_price: boolean
  show_location: boolean
  show_photo: boolean
}

export type SpecialistProfile = TherapistProfile

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
  experience_years?: number
  price?: string
  price_currency?: string
  intro_duration_minutes?: number
  intro_price?: string
  intro_price_currency?: string
  contact_email?: string
  contact_phone?: string
  messenger?: string
  photo_url?: string
  video_url?: string
  platform_setting_text?: string
  setting_text?: string
}

export type PublicSpecialistProfile = PublicTherapistProfile

export type AuthorJournalPost = {
  id: number
  category?: 'TIP' | 'EXPLAIN' | 'FAQ' | 'RESEARCH' | 'PRACTICE'
  is_featured: boolean
  featured_order: number
  title: string
  summary: string
  body: string
  cover_image_url: string
  is_published: boolean
  published_at: string | null
  created_at: string
  updated_at: string
}

export type CabinetJournalCollection = {
  id: number
  title: string
  slug: string
  description: string
  cover_image_url: string
  is_published: boolean
  published_at: string | null
  created_at: string
  posts_count: number
}

export type PublicAuthorJournalPost = {
  id: number
  category?: 'TIP' | 'EXPLAIN' | 'FAQ' | 'RESEARCH' | 'PRACTICE'
  is_featured: boolean
  featured_order: number
  title: string
  slug: string
  summary: string
  cover_image_url: string
  published_at: string | null
  created_at: string
}

export type PublicJournalCollectionListItem = {
  title: string
  slug: string
  cover_image_url: string
  description: string
  posts_count: number
}

export type PublicAuthorJournalPostDetail = {
  id: number
  category?: 'TIP' | 'EXPLAIN' | 'FAQ' | 'RESEARCH' | 'PRACTICE'
  is_featured: boolean
  featured_order: number
  title: string
  slug: string
  summary: string
  body: string
  cover_image_url: string
  published_at: string | null
  created_at: string
  collection: {
    id: number
    title: string
    slug: string
    description: string
    items: Array<{
      post: {
        slug: string
        title: string
      }
      sort_order: number
    }>
    current_post_index: number | null
  } | null
}

export type PublicJournalCollectionDetail = {
  id: number
  title: string
  slug: string
  description: string
  cover_image_url: string
  published_at: string | null
  items: Array<{
    post_slug: string
    post_title: string
    summary: string
    cover_image_url: string
    reading_time: number
    sort_order: number
  }>
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

export async function fetchSpecialistProfile(): Promise<SpecialistProfile> {
  return fetchTherapistProfile()
}

export async function updateTherapistProfile(
  payload: Partial<TherapistProfile>
): Promise<TherapistProfile> {
  const resp = await http.patch<TherapistProfile>('/cabinet/profile/', payload)
  return resp.data
}

export async function updateSpecialistProfile(
  payload: Partial<SpecialistProfile>
): Promise<SpecialistProfile> {
  return updateTherapistProfile(payload)
}

export async function rotateTherapistProfileSlug(): Promise<TherapistProfile> {
  const resp = await http.post<TherapistProfile>('/cabinet/profile/rotate-slug/')
  return resp.data
}

export async function rotateSpecialistProfileSlug(): Promise<SpecialistProfile> {
  return rotateTherapistProfileSlug()
}

export type ClientProfile = {
  id: number
  display_name: string
  contact_email: string
  contact_phone: string
  photo_url: string
  client_code?: string
  created_at: string
  updated_at: string
}

export async function fetchClientProfile(): Promise<ClientProfile> {
  const resp = await http.get<ClientProfile>('/client/profile/')
  return resp.data
}

export async function updateClientProfile(
  payload: Partial<ClientProfile>
): Promise<ClientProfile> {
  const resp = await http.patch<ClientProfile>('/client/profile/', payload)
  return resp.data
}

export async function uploadClientPhoto(file: File): Promise<ClientProfile> {
  const formData = new FormData()
  formData.append('file', file)
  const resp = await http.post<ClientProfile>('/client/profile/upload-photo/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return resp.data
}

export async function fetchPublicTherapistProfile(
  slug: string
): Promise<PublicTherapistProfile> {
  const resp = await http.get<PublicTherapistProfile>(`/public/specialists/${slug}/`)
  return resp.data
}

export async function fetchPublicSpecialistProfile(
  slug: string
): Promise<PublicSpecialistProfile> {
  return fetchPublicTherapistProfile(slug)
}

export async function fetchPublicAuthorJournalPosts(
  slug: string
): Promise<PublicAuthorJournalPost[]> {
  const resp = await http.get<PublicAuthorJournalPost[]>(`/public/specialists/${slug}/journal/`)
  return resp.data
}

export async function fetchPublicJournalCollections(
  slug: string
): Promise<PublicJournalCollectionListItem[]> {
  const resp = await http.get<PublicJournalCollectionListItem[]>(
    `/public/specialists/${slug}/journal/collections/`
  )
  return resp.data
}

export async function fetchPublicAuthorJournalPostDetail(
  slug: string,
  postSlug: string
): Promise<PublicAuthorJournalPostDetail> {
  const resp = await http.get<PublicAuthorJournalPostDetail>(
    `/public/specialists/${slug}/journal/${postSlug}/`
  )
  return resp.data
}

export async function fetchPublicJournalCollectionDetail(
  slug: string,
  collectionSlug: string
): Promise<PublicJournalCollectionDetail> {
  const resp = await http.get<PublicJournalCollectionDetail>(
    `/public/${slug}/journal/collections/${collectionSlug}/`
  )
  return resp.data
}

export async function createPracticeReview(
  specialistId: number,
  reviewText: string
): Promise<{ id: number }> {
  const resp = await http.post<{ id: number }>(`/practice/specialists/${specialistId}/reviews/`, {
    review_text: reviewText,
  })
  return resp.data
}

export async function fetchAuthorJournalPosts(): Promise<AuthorJournalPost[]> {
  const resp = await http.get<AuthorJournalPost[]>('/cabinet/journal/')
  return resp.data
}

export async function fetchCabinetJournalCollections(): Promise<CabinetJournalCollection[]> {
  const resp = await http.get<CabinetJournalCollection[]>('/cabinet/journal/collections/')
  return resp.data
}

export async function createAuthorJournalPost(
  payload: Partial<AuthorJournalPost>
): Promise<AuthorJournalPost> {
  const resp = await http.post<AuthorJournalPost>('/cabinet/journal/', payload)
  return resp.data
}

export async function updateAuthorJournalPost(
  postId: number,
  payload: Partial<AuthorJournalPost>
): Promise<AuthorJournalPost> {
  const resp = await http.patch<AuthorJournalPost>(`/cabinet/journal/${postId}/`, payload)
  return resp.data
}

export async function deleteAuthorJournalPost(postId: number): Promise<void> {
  await http.delete(`/cabinet/journal/${postId}/`)
}

export async function uploadAuthorJournalCover(
  file: File
): Promise<{ blob_name: string; preview_url: string }> {
  const formData = new FormData()
  formData.append('file', file)
  const resp = await http.post<{ blob_name: string; preview_url: string }>(
    '/cabinet/journal/upload-cover/',
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    }
  )
  return resp.data
}

export async function fetchPublicTherapists(
  params?: {
    page?: number
    page_size?: number
    sort?: string
    name?: string
    specialization?: string
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
  const resp = await http.get('/public/specialists/', { params })
  return resp.data
}

export async function fetchPublicSpecialists(
  params?: {
    page?: number
    page_size?: number
    sort?: string
    name?: string
    specialization?: string
    language?: string
    location?: string
    price_min?: string
    price_max?: string
    price_currency?: string
  }
): Promise<{
  results: PublicSpecialistProfile[]
  page: number
  page_size: number
  total: number
  total_pages: number
}> {
  return fetchPublicTherapists(params)
}

export type ChatThread = {
  id: number
  therapist_id: number
  client_id: number
  last_message_at: string | null
  last_message_preview: string
  unread_count: number
  other_user: {
    id: number
    role: 'SPECIALIST' | 'THERAPIST' | 'CLIENT'
    display_name: string
    photo_url?: string
  }
}

export type ChatMessage = {
  id: number
  thread_id: number
  sender_id: number
  body: string
  created_at: string
}

export async function fetchChatThreads(): Promise<ChatThread[]> {
  const resp = await http.get<ChatThread[]>('/chat/threads/')
  return resp.data
}

export async function fetchChatMessages(
  threadId: number,
  params?: { since_id?: number; limit?: number }
): Promise<ChatMessage[]> {
  const resp = await http.get<ChatMessage[]>('/chat/messages/', {
    params: { thread_id: threadId, ...params },
  })
  return resp.data
}

export async function sendChatMessage(threadId: number, body: string): Promise<ChatMessage> {
  const resp = await http.post<ChatMessage>('/chat/messages/send/', {
    thread_id: threadId,
    body,
  })
  return resp.data
}

export async function fetchChatUnreadCount(): Promise<{ unread_count: number }> {
  const resp = await http.get<{ unread_count: number }>('/chat/unread-count/')
  return resp.data
}

export async function signupClient(
  email: string,
  password: string,
  passwordConfirm: string
): Promise<SignupResponse> {
  try {
    const resp = await http.post<SignupResponse>('/auth/signup-client/', {
      email,
      password,
      password_confirm: passwordConfirm,
    })
    return resp.data
  } catch (err: any) {
    throw new Error(getApiErrorMessage(err, 'Не вдалося зареєструватися'))
  }
}

export async function apiGet<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const resp = await http.get<T>(url, config)
  return resp.data
}

export async function apiPost<T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<T> {
  const resp = await http.post<T>(url, data, config)
  return resp.data
}

export async function apiPatch<T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<T> {
  const resp = await http.patch<T>(url, data, config)
  return resp.data
}

export async function apiPut<T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<T> {
  const resp = await http.put<T>(url, data, config)
  return resp.data
}

export async function apiDelete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const resp = await http.delete<T>(url, config)
  return resp.data
}
