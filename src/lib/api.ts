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
  bio?: string
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
  price: string | null
  price_currency: string
  intro_duration_minutes: number
  intro_price: string | null
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

export type NotificationSettings = {
  notify_session_booked_in_app: boolean
  notify_session_confirmed_in_app: boolean
  notify_session_starts_24h_in_app: boolean
  notify_session_starts_1h_in_app: boolean
}

export type NotificationFeedItem = {
  id: string
  kind: 'session_event' | 'reminder_event'
  source_kind: 'session_event' | 'reminder_delivery'
  source_id: number
  code: string
  session_id: number | null
  client_id: number | null
  client_name: string | null
  client_email: string | null
  slot_start_at: string | null
  created_at: string
  scheduled_for: string | null
  delivered_at: string | null
  read_at: string | null
}

export type NotificationFeedResponse = {
  count: number
  results: NotificationFeedItem[]
}

export type NotificationReadResponse = {
  ok: true
  source_kind: string
  source_id: number
  read_at: string
}

export type NotificationReadAllResponse = {
  ok: true
  marked_count: number
}

export type BillingAccessRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export type BillingAccessRequest = {
  id: number
  therapist: number
  requested_plan: 'START' | 'PRO' | 'LEADER'
  status: BillingAccessRequestStatus
  note: string
  admin_note: string
  created_at: string
  updated_at: string
  decided_at: string | null
  decided_by: number | null
}

export type BillingAccessRequestState = {
  has_pending_request: boolean
  active_request: BillingAccessRequest | null
  latest_request: BillingAccessRequest | null
}

export type BillingCheckoutSession = {
  plan: 'PRO' | 'LEADER'
  billing_cycle: 'monthly' | 'annual'
  checkout_url: string | null
  activation_source: 'VERIFIED_BILLING_WEBHOOK'
  fallback_available: boolean
  message: string
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
  experience_years?: number
  price?: string
  price_currency?: string
  intro_duration_minutes?: number
  intro_price?: string
  intro_price_currency?: string
  contact_email?: string
  contact_phone?: string
  messenger?: string
  telegram?: string
  viber?: string
  whatsapp?: string
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
  slug?: string
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

export type CabinetJournalCollectionItem = {
  id: number
  post: number
  sort_order: number
}

export type CabinetJournalCollectionDetail = CabinetJournalCollection & {
  items: CabinetJournalCollectionItem[]
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

export type PublicJournalCollectionPreviewPost = {
  title: string
  slug: string
}

export type PublicJournalCollectionListItem = {
  id: number
  title: string
  slug: string
  cover_image_url: string
  description: string
  posts_count: number
  preview_posts: PublicJournalCollectionPreviewPost[]
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

export type AvailabilityRule = {
  id: number
  specialist_id: number
  weekday: number
  start_time: string
  end_time: string
  session_duration_minutes: number
  buffer_minutes: number
  is_active: boolean
  needs_regeneration: boolean
  created_at: string
  updated_at: string
}

export type AvailabilityException = {
  id: number
  specialist_id: number
  starts_at: string
  ends_at: string
  is_all_day: boolean
  note: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export type AvailabilityGenerationPreview = {
  date_range: {
    date_from: string
    date_to: string
  }
  days_covered: number
  total_candidate_slots: number
  to_create_count: number
  existing_count: number
  to_delete_count: number
  skipped_duplicate_or_conflict_count: number
  booked_conflicts_count: number
  examples_to_create: Array<{
    start_at: string
    end_at: string
  }>
  examples_to_delete: Array<{
    start_at: string
    end_at: string
  }>
  booked_conflict_examples: Array<{
    start_at: string
    end_at: string
  }>
}

export type AvailabilityGenerationApply = {
  date_range: {
    date_from: string
    date_to: string
  }
  days_covered: number
  created_count: number
  deleted_count: number
  existing_count: number
  booked_conflicts_count: number
}

export async function fetchAvailabilityRules(): Promise<AvailabilityRule[]> {
  const resp = await http.get<AvailabilityRule[]>('/cabinet/availability-rules/')
  return resp.data
}

export async function createAvailabilityRule(payload: {
  weekday: number
  start_time: string
  end_time: string
  session_duration_minutes: number
  buffer_minutes: number
  is_active: boolean
}): Promise<AvailabilityRule> {
  const resp = await http.post<AvailabilityRule>('/cabinet/availability-rules/', payload)
  return resp.data
}

export async function updateAvailabilityRule(
  id: number,
  payload: Partial<{
    weekday: number
    start_time: string
    end_time: string
    session_duration_minutes: number
    buffer_minutes: number
    is_active: boolean
  }>
): Promise<AvailabilityRule> {
  const resp = await http.patch<AvailabilityRule>(`/cabinet/availability-rules/${id}/`, payload)
  return resp.data
}

export async function deleteAvailabilityRule(id: number): Promise<void> {
  await http.delete(`/cabinet/availability-rules/${id}/`)
}

export async function fetchAvailabilityExceptions(): Promise<AvailabilityException[]> {
  const resp = await http.get<AvailabilityException[]>('/cabinet/availability-exceptions/')
  return resp.data
}

export async function createAvailabilityException(payload: {
  starts_at: string
  ends_at: string
  is_all_day: boolean
  note: string
  is_active: boolean
}): Promise<AvailabilityException> {
  const resp = await http.post<AvailabilityException>('/cabinet/availability-exceptions/', payload)
  return resp.data
}

export async function updateAvailabilityException(
  id: number,
  payload: Partial<{
    starts_at: string
    ends_at: string
    is_all_day: boolean
    note: string
    is_active: boolean
  }>
): Promise<AvailabilityException> {
  const resp = await http.patch<AvailabilityException>(
    `/cabinet/availability-exceptions/${id}/`,
    payload
  )
  return resp.data
}

export async function deleteAvailabilityException(id: number): Promise<void> {
  await http.delete(`/cabinet/availability-exceptions/${id}/`)
}

export async function previewAvailabilityGeneration(payload: {
  days_ahead?: number
  date_from?: string
  date_to?: string
}): Promise<AvailabilityGenerationPreview> {
  const resp = await http.post<AvailabilityGenerationPreview>(
    '/cabinet/availability-rules/preview-generation/',
    payload
  )
  return resp.data
}

export async function applyAvailabilityGeneration(payload: {
  days_ahead?: number
  date_from?: string
  date_to?: string
}): Promise<AvailabilityGenerationApply> {
  const resp = await http.post<AvailabilityGenerationApply>(
    '/cabinet/availability-rules/apply-generation/',
    payload
  )
  return resp.data
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

export async function fetchNotificationSettings(): Promise<NotificationSettings> {
  const resp = await http.get<NotificationSettings>('/cabinet/settings/notifications/')
  return resp.data
}

export async function updateNotificationSettings(
  payload: Partial<NotificationSettings>
): Promise<NotificationSettings> {
  const resp = await http.patch<NotificationSettings>('/cabinet/settings/notifications/', payload)
  return resp.data
}

export async function fetchNotifications(params?: {
  limit?: number
}): Promise<NotificationFeedResponse> {
  const resp = await http.get<NotificationFeedResponse>('/notifications/', { params })
  return resp.data
}

export async function markNotificationRead(payload: {
  source_kind: string
  source_id: number
}): Promise<NotificationReadResponse> {
  const resp = await http.post<NotificationReadResponse>('/notifications/read/', payload)
  return resp.data
}

export async function markAllNotificationsRead(): Promise<NotificationReadAllResponse> {
  const resp = await http.post<NotificationReadAllResponse>('/notifications/read-all/', {})
  return resp.data
}

export async function fetchBillingAccessRequestState(): Promise<BillingAccessRequestState> {
  const resp = await http.get<BillingAccessRequestState>('/billing/request-access/')
  return resp.data
}

export async function createBillingAccessRequest(payload: {
  requested_plan: 'START' | 'PRO' | 'LEADER'
  note?: string
}): Promise<{
  request: BillingAccessRequest
  has_pending_request: boolean
}> {
  const resp = await http.post<{
    request: BillingAccessRequest
    has_pending_request: boolean
  }>('/billing/request-access/', payload)
  return resp.data
}

export async function createBillingCheckoutSession(payload: {
  plan: 'PRO' | 'LEADER'
  billing_cycle?: 'monthly' | 'annual'
}): Promise<BillingCheckoutSession> {
  const resp = await http.post<BillingCheckoutSession>('/billing/checkout-session/', payload)
  return resp.data
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

export async function createCabinetJournalCollection(payload: {
  title: string
  slug: string
  description: string
  is_published: boolean
}): Promise<CabinetJournalCollection> {
  const resp = await http.post<CabinetJournalCollection>('/cabinet/journal/collections/', payload)
  return resp.data
}

export async function updateCabinetJournalCollection(
  collectionId: number,
  payload: {
    title: string
    description: string
    is_published: boolean
  }
): Promise<CabinetJournalCollectionDetail> {
  const resp = await http.patch<CabinetJournalCollectionDetail>(
    `/cabinet/journal/collections/${collectionId}/`,
    payload
  )
  return resp.data
}

export async function deleteCabinetJournalCollection(collectionId: number): Promise<void> {
  await http.delete(`/cabinet/journal/collections/${collectionId}/`)
}

export async function fetchCabinetJournalCollectionDetail(
  collectionId: number
): Promise<CabinetJournalCollectionDetail> {
  const resp = await http.get<CabinetJournalCollectionDetail>(
    `/cabinet/journal/collections/${collectionId}/`
  )
  return resp.data
}

export async function createCabinetJournalCollectionItem(
  collectionId: number,
  payload: { post: number; sort_order?: number }
): Promise<CabinetJournalCollectionDetail> {
  const resp = await http.post<CabinetJournalCollectionDetail>(
    `/cabinet/journal/collections/${collectionId}/items/`,
    payload
  )
  return resp.data
}

export async function updateCabinetJournalCollectionItem(
  collectionId: number,
  itemId: number,
  payload: { sort_order: number }
): Promise<CabinetJournalCollectionDetail> {
  const resp = await http.patch<CabinetJournalCollectionDetail>(
    `/cabinet/journal/collections/${collectionId}/items/${itemId}/`,
    payload
  )
  return resp.data
}

export async function deleteCabinetJournalCollectionItem(
  collectionId: number,
  itemId: number
): Promise<CabinetJournalCollectionDetail> {
  const resp = await http.delete<CabinetJournalCollectionDetail>(
    `/cabinet/journal/collections/${collectionId}/items/${itemId}/`
  )
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

export type InquiryStatus =
  | 'NOT_CREATED'
  | 'OPEN'
  | 'CLOSED'
  | 'ACTIVE_CLIENT'
  | 'BLOCKED'
  | 'ARCHIVED'

export type InquiryReasonCode =
  | 'ACTIVE_CLIENT_USE_CHAT'
  | 'INQUIRY_ALREADY_EXISTS'
  | 'RELATION_BLOCKED'
  | 'RELATION_ARCHIVED'
  | 'THREAD_CLOSED'
  | 'INQUIRY_NOT_FOUND'
  | 'FOLLOW_UP_REQUIRES_SPECIALIST_REPLY'
  | 'CLIENT_MESSAGE_LIMIT_REACHED'
  | 'REPLY_REQUIRES_CLIENT_MESSAGE'
  | 'WAIT_FOR_CLIENT_MESSAGE'
  | 'ONLY_CLIENT_CAN_CREATE'
  | 'SPECIALIST_NOT_FOUND'
  | 'ACCESS_DENIED'
  | 'EMPTY_BODY'

export type InquiryState = {
  specialist_id: number
  inquiry_id: number | null
  inquiry_exists: boolean
  inquiry_status: InquiryStatus
  can_create_inquiry: boolean
  create_reason_code: InquiryReasonCode | string | null
  can_client_send: boolean
  client_send_reason_code: InquiryReasonCode | string | null
  can_specialist_reply: boolean
  specialist_reply_reason_code: InquiryReasonCode | string | null
}

export type InquiryThread = {
  id: number
  specialist_id: number
  client_id: number
  created_at: string
  last_message_at: string | null
  inquiry_status: InquiryStatus
  closed_reason: string | null
  other_user: {
    id: number
    role: 'SPECIALIST' | 'THERAPIST' | 'CLIENT'
    display_name: string
    photo_url?: string
  }
  last_message_preview: string
  unread_count: number
  can_client_send: boolean
  client_send_reason_code: InquiryReasonCode | string | null
  can_specialist_reply: boolean
  specialist_reply_reason_code: InquiryReasonCode | string | null
}

export type InquiryMessage = {
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

export async function fetchInquiryState(specialistId: number): Promise<InquiryState> {
  const resp = await http.get<InquiryState>('/inquiries/state/', {
    params: { specialist_id: specialistId },
  })
  return resp.data
}

export async function fetchInquiryThreads(): Promise<InquiryThread[]> {
  const resp = await http.get<InquiryThread[]>('/inquiries/threads/')
  return resp.data
}

export async function createInquiryThread(payload: {
  specialist_id: number
  body: string
}): Promise<InquiryThread> {
  const resp = await http.post<InquiryThread>('/inquiries/threads/', payload)
  return resp.data
}

export async function fetchInquiryMessages(
  threadId: number,
  params?: { since_id?: number; limit?: number }
): Promise<InquiryMessage[]> {
  const resp = await http.get<InquiryMessage[]>('/inquiries/messages/', {
    params: { thread_id: threadId, ...params },
  })
  return resp.data
}

export async function sendInquiryMessage(threadId: number, body: string): Promise<InquiryMessage> {
  const resp = await http.post<InquiryMessage>('/inquiries/messages/send/', {
    thread_id: threadId,
    body,
  })
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
