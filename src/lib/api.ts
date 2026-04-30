import { http } from './http'
import type { AxiosRequestConfig } from 'axios'
import type { ProfessionalFocus } from '../constants/professionalFocus'

type TokenResponse = {
  access: string
  refresh?: string
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

export type OnboardingMissingItem = {
  code: string
  default_message?: string | null
}

export type OnboardingWarning = {
  code: string
  cta_code?: string | null
  cta_target?: string | null
  default_message?: string | null
}

export type OnboardingNextAction = {
  code?: string | null
  target?: string | null
  cta_code?: string | null
  cta_target?: string | null
  priority?: number | null
  default_message?: string | null
}

export type SpecialistOnboardingReadiness = {
  profile_core_ready?: boolean | null
  has_future_slots?: boolean | null
  public_profile_enabled?: boolean | null
  ready_for_inbound_intent?: boolean | null
}

export type SpecialistOnboardingState = {
  version?: number | null
  readiness?: boolean | SpecialistOnboardingReadiness | null
  ready_for_inbound_intent?: boolean | null
  is_ready?: boolean | null
  missing_items?: Array<OnboardingMissingItem | string> | null
  warnings?: Array<OnboardingWarning | string> | null
  next_actions?: OnboardingNextAction[] | null
  primary_cta_code?: string | null
  cta_target?: string | null
}

export async function fetchSpecialistOnboardingState(): Promise<SpecialistOnboardingState> {
  const resp = await http.get<SpecialistOnboardingState>('/cabinet/onboarding-state/')
  return resp.data
}

export async function refreshToken(): Promise<TokenResponse> {
  const resp = await http.post<TokenResponse>('/auth/token/refresh/', {})
  return resp.data
}

export async function logoutSession(): Promise<void> {
  await http.post('/auth/logout/', {})
}

export async function enableSpecialist(): Promise<void> {
  await http.post('/auth/enable-specialist/', {})
}

export type TherapistProfile = {
  id: number
  public_profile_enabled: boolean
  slug?: string
  public_profile_path?: string
  public_profile_url?: string
  public_slug?: string
  last_slug_rotated_at?: string | null
  offers_online: boolean
  offers_offline: boolean
  offline_location: string
  professional_focus?: ProfessionalFocus | null
  display_name: string
  bio?: string
  bio_about: string
  bio_work: string
  bio_approach: string
  bio_for_whom: string
  bio_other: string
  education_summary: string
  education_items: string[]
  professional_development_items: string[]
  setting_text?: string
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
  kind: 'session_event' | 'reminder_event' | 'reschedule_request' | 'inquiry_message' | 'payment_proof_event'
  source_kind:
  | 'session_event'
  | 'reminder_delivery'
  | 'reschedule_request'
  | 'inquiry_message'
  | 'payment_proof_event'
  source_id: number
  code: string
  session_id: number | null
  client_id: number | null
  client_name: string | null
  client_email: string | null
  specialist_id?: number | null
  specialist_name?: string | null
  counterparty_id?: number | null
  counterparty_name?: string | null
  thread_id?: number | null
  message_id?: number | null
  preview?: string | null
  slot_start_at: string | null
  meeting_url?: string | null
  meeting_provider?: string | null
  created_at: string
  scheduled_for: string | null
  delivered_at: string | null
  read_at: string | null
  target_type?: string | null
  target_id?: number | null
  focus?: string | null
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

export type AdminInboxItemStatus =
  | 'UNREAD'
  | 'OPEN'
  | 'RESOLVED'
  | 'DISMISSED'
  | string

export type AdminInboxActor = {
  id?: number | null
  username?: string | null
  email?: string | null
  display_name?: string | null
  full_name?: string | null
}

export type AdminInboxRelatedObject = {
  id?: number | string | null
  type?: string | null
  code?: string | null
  title?: string | null
  name?: string | null
  status?: string | null
  summary?: string | null
  [key: string]: unknown
}

export type AdminInboxItem = {
  id: number
  code: string
  status: AdminInboxItemStatus
  title: string
  message: string
  created_at: string
  read_at?: string | null
  started_at?: string | null
  resolved_at?: string | null
  dismissed_at?: string | null
  created_by?: AdminInboxActor | null
  related_object?: AdminInboxRelatedObject | null
  payload?: Record<string, unknown> | null
  data?: Record<string, unknown> | null
  metadata?: Record<string, unknown> | null
}

export type AdminInboxListResponse = {
  count: number
  unread_count: number
  open_count: number
  results?: AdminInboxItem[]
  items?: AdminInboxItem[]
}

export type AdminInboxListFilters = {
  status?: 'NEW' | 'IN_PROGRESS' | 'RESOLVED' | 'DISMISSED'
  code?: string
  unread_only?: boolean
  limit?: number
}

export type AdminBillingAccessRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | string

export type AdminBillingAccessRequestInboxItem = {
  id: number
  code?: string | null
  status?: string | null
  title?: string | null
  created_at?: string | null
  read_at?: string | null
  resolved_at?: string | null
  updated_at?: string | null
}

export type AdminBillingAccessRequestInboxRelation = {
  code?: string | null
  related_object_type?: string | null
  related_object_id?: number | null
  has_linked_items?: boolean | null
  linked_items_count?: number | null
  open_items_count?: number | null
  has_open_items?: boolean | null
  linked_items?: AdminBillingAccessRequestInboxItem[] | null
  // Compatibility fallback for older payload shape.
  items?: AdminBillingAccessRequestInboxItem[] | null
}

export type AdminBillingAccessRequestUserSummary = {
  id?: number | null
  email?: string | null
  display_name?: string | null
}

export type AdminBillingAccessRequestSpecialistSummary = {
  id?: number | null
  username?: string | null
  display_name?: string | null
  email?: string | null
  public_slug?: string | null
}

export type AdminBillingAccessRequest = {
  id: number
  request_type?: string | null
  status: AdminBillingAccessRequestStatus
  current_plan_label?: string | null
  requested_plan?: string | null
  current_plan?: string | null
  requested_plan_label?: string | null
  note?: string | null
  admin_note?: string | null
  submitted_by_user_id?: number | null
  created_at?: string | null
  updated_at?: string | null
  decided_at?: string | null
  user?: AdminBillingAccessRequestUserSummary | null
  specialist?: AdminBillingAccessRequestSpecialistSummary | null
  plans?: {
    current_plan?: string | null
    requested_plan?: string | null
  } | null
  inbox_relation?: AdminBillingAccessRequestInboxRelation | null
  metadata?: Record<string, unknown> | null
}

export type AdminBillingAccessRequestListResponse = {
  count?: number
  results?: AdminBillingAccessRequest[]
  items?: AdminBillingAccessRequest[]
}

export type AdminBillingAccessRequestListFilters = {
  status?: 'PENDING' | 'APPROVED' | 'REJECTED'
  open_inbox_only?: boolean
}

export type AdminSpecialistSearchItem = {
  id: number
  username: string
  email: string | null
  display_name: string
  slug?: string | null
  public_profile_enabled: boolean
  base_plan: 'START' | 'PRO' | 'LEADER' | string
  effective_plan: 'START' | 'PRO' | 'LEADER' | string
  active_trial: boolean
  active_override: boolean
  trial_active?: boolean
  override_active?: boolean
}

export type AdminSpecialistSearchResponse = {
  count: number
  results: AdminSpecialistSearchItem[]
}

export type AdminSpecialistDetailResponse = {
  identity: {
    id: number
    username: string
    email: string | null
    display_name: string
    slug: string | null
    public_profile_enabled: boolean
    created_at: string | null
  }
  role_state: {
    role: string
    roles: string[]
    specialist_active: boolean
    client_status: boolean
  }
  tariff_access: {
    base_plan: 'START' | 'PRO' | 'LEADER' | string
    effective_plan: 'START' | 'PRO' | 'LEADER' | string
    effective_entitlements: Record<string, unknown>
    current_limits: {
      active_client_limit: number | null
      group_room_meeting_limit: number | null
      guest_sessions_limit_per_period: number | null
    }
    trial: {
      active: boolean
      trial_plan: string | null
      starts_at: string | null
      ends_at: string | null
      reason: string | null
      actor: string | null
    }
    override: {
      active: boolean
      override_plan: string | null
      override_config: {
        forced_group_room_addon_enabled: boolean | null
        forced_active_client_limit: number | null
      }
      starts_at: string | null
      ends_at: string | null
      reason: string | null
      actor: string | null
    }
  }
  admin_context: {
    open_billing_admin_requests_count: number
    open_admin_inbox_items_count?: number
    latest_related_request_summary: {
      id: number
      requested_plan: string | null
      status: string
      created_at: string | null
      note: string | null
    } | null
    last_access_change_summary: {
      id: number
      event_type: string
      reason: string
      actor: string | null
      created_at: string | null
    } | null
  }
}

export type AdminSpecialistAccessHistoryItem = {
  id: number
  event_type: string
  event_label?: string | null
  before_snapshot: Record<string, unknown> | null
  after_snapshot: Record<string, unknown> | null
  before_plan?: string | null
  after_plan?: string | null
  summary?: string | null
  actor: number | null
  actor_username: string | null
  reason: string
  source: string
  source_request_id: number | null
  created_at: string | null
}

export type AdminSpecialistPlanActionPayload = {
  plan: 'START' | 'PRO' | 'LEADER'
  reason: string
}

export type AdminSpecialistPlanActionResponse = {
  specialist_id: number
  access_summary: Record<string, unknown>
  history_record: AdminSpecialistAccessHistoryItem
}

export type AdminSpecialistTrialActionPayload =
  | {
    action: 'START'
    trial_plan: 'PRO' | 'LEADER'
    starts_at?: string
    ends_at: string
    reason: string
  }
  | {
    action: 'END'
    reason: string
  }

export type AdminSpecialistOverrideActionPayload =
  | {
    action: 'ENABLE'
    forced_plan?: 'START' | 'PRO' | 'LEADER' | null
    starts_at?: string | null
    expires_at?: string | null
    reason: string
  }
  | {
    action: 'UPDATE'
    forced_plan?: 'START' | 'PRO' | 'LEADER' | null
    starts_at?: string | null
    expires_at?: string | null
    reason: string
  }
  | {
    action: 'DISABLE'
    reason: string
  }

export type SpecialistProfileDocument = {
  id: number
  title: string
  file_url: string
  document_kind: string
  is_public: boolean
  sort_order: number
  uploaded_at: string
  source: string
}

export type PublicSpecialistProfileDocument = {
  id: number
  title: string
  file_url: string
  document_kind: string
  uploaded_at: string
  source: string
}

export type PublicContactActionChannel =
  | 'EMAIL'
  | 'TELEGRAM'
  | 'VIBER'
  | 'WHATSAPP'
  | 'PHONE'
  | string

export type PublicContactAction = {
  channel?: PublicContactActionChannel | null
  label?: string | null
  value?: string | null
  action_url?: string | null
}

export type PublicProfilePublicationsPreviewEmptyState =
  | 'JOURNAL_DISABLED'
  | 'NO_PUBLICATIONS'
  | null

export type PublicProfilePublicationsPreviewItem = {
  id: number
  slug: string
  title: string
  category?: 'TIP' | 'EXPLAIN' | 'FAQ' | 'RESEARCH' | 'PRACTICE' | null
  published_at?: string | null
  is_featured?: boolean
  cover_image_url?: string | null
  excerpt?: string | null
  reading_time_minutes?: number | null
}

export type PublicProfilePublicationsPreviewSection = {
  enabled?: boolean
  items?: PublicProfilePublicationsPreviewItem[] | null
  empty_state?: PublicProfilePublicationsPreviewEmptyState
}

export type PublicProfileTrustItem = {
  label?: string | null
  value?: string | null
}

export type PublicProfileTrustSection = {
  items?: PublicProfileTrustItem[] | null
  experience_years?: number | null
  languages?: string[] | string | null
  location?: string | null
  completed_sessions_count?: number | null
  profile_documents?: PublicSpecialistProfileDocument[] | null
}

export type PublicProfileAboutItem = {
  title?: string | null
  body?: string | null
}

export type PublicProfileAboutSection = {
  items?: PublicProfileAboutItem[] | null
  sections?: PublicProfileAboutItem[] | null
  bio?: string | null
  bio_about?: string | null
  bio_work?: string | null
  bio_approach?: string | null
  bio_for_whom?: string | null
  bio_other?: string | null
}

export type PublicProfileTopicsSection = {
  who_this_is_for?: string | null
  items?: string[] | null
  chips?: string[] | null
  specializations?: string[] | string | null
}

export type PublicProfileCompetenceSection = {
  education_summary?: string | null
  education_items?: string[] | null
  professional_development_items?: string[] | null
}

export type PublicProfileFormatsSection = {
  meeting_format_label?: string | null
  intro_duration_label?: string | null
  intro_duration_minutes?: number | null
  intro_price_display?: string | null
  intro_price?: string | number | null
  intro_price_currency?: string | null
  price_display?: string | null
  price?: string | number | null
  price_currency?: string | null
  offline_location?: string | null
  location?: string | null
  standard_session_duration_label?: string | null
  standard_session_duration_minutes?: number | null
}

export type PublicProfileContactActionsSection = {
  items?: PublicContactAction[] | null
  actions?: PublicContactAction[] | null
}

export type PublicProfileReviewItem = {
  id?: number | string | null
  review_text?: string | null
  text?: string | null
  created_at?: string | null
  published_at?: string | null
}

export type PublicProfileReviewsSection = {
  items?: PublicProfileReviewItem[] | null
}

export type PublicProfileFaqItem = {
  id?: number | string | null
  question?: string | null
  answer?: string | null
  title?: string | null
  body?: string | null
}

export type PublicProfileFaqSection = {
  items?: PublicProfileFaqItem[] | null
}

export type PublicProfileMediaItem = {
  id?: number | string | null
  title?: string | null
  description?: string | null
  type?: string | null
  kind?: string | null
  url?: string | null
  file_url?: string | null
  image_url?: string | null
  video_url?: string | null
  thumbnail_url?: string | null
}

export type PublicProfileMediaSection = {
  items?: PublicProfileMediaItem[] | null
  assets?: PublicProfileMediaItem[] | null
  photo_url?: string | null
  video_url?: string | null
  hero_photo_url?: string | null
  hero_video_url?: string | null
}

export type PublicProfileSections = {
  publications_preview?: PublicProfilePublicationsPreviewSection | null
  trust?: PublicProfileTrustSection | null
  about?: PublicProfileAboutSection | null
  competence?: PublicProfileCompetenceSection | null
  topics?: PublicProfileTopicsSection | null
  formats?: PublicProfileFormatsSection | null
  contact_actions?: PublicProfileContactActionsSection | PublicContactAction[] | null
  reviews?: PublicProfileReviewsSection | null
  faq?: PublicProfileFaqSection | null
  media?: PublicProfileMediaSection | null
}

export type BookingRuleScope = 'PLATFORM' | 'SPECIALIST'

export type PublicBookingRuleItem = {
  scope: BookingRuleScope | string
  version: string
  text: string
  accepted: boolean
  accepted_at?: string | null
  specialist_id?: number | null
}

export type PublicBookingRules = {
  show_prompt: boolean
  reason_codes?: string[]
  items?: PublicBookingRuleItem[]
}

export type PublicTherapistProfile = {
  slug?: string
  public_slug?: string
  therapist_id: number
  professional_focus?: ProfessionalFocus | null
  display_name: string
  completed_sessions_count?: number
  offers_online?: boolean
  offers_offline?: boolean
  offline_location?: string
  bio?: string
  bio_about?: string
  bio_work?: string
  bio_approach?: string
  bio_for_whom?: string
  bio_other?: string
  education_summary?: string
  education_items?: string[]
  professional_development_items?: string[]
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
  booking_rules?: PublicBookingRules | null
  profile_documents?: PublicSpecialistProfileDocument[]
  contact_actions?: PublicContactAction[] | null
  sections_version?: number | null
  sections?: PublicProfileSections | null
}

export type PublicSpecialistProfile = PublicTherapistProfile

export type SessionFormat = 'online' | 'offline'

export type PracticeBoardStatus = 'todo' | 'in_progress' | 'done'

export type PracticeBoardSourceType =
  | 'manual'
  | 'session'
  | 'session_note'
  | 'client_advice'
  | 'workbook'
  | 'payment'
  | null

export type PracticeBoardItem = {
  id: number | string
  board_id?: number | string | null
  title: string
  description: string | null
  status: PracticeBoardStatus
  priority?: string | null
  related_client_id?: number | null
  related_session_id?: number | null
  source_type?: PracticeBoardSourceType
  source_id?: number | string | null
  created_at: string
  updated_at: string
  completed_at?: string | null
}

export type PracticeBoardColumns = {
  todo: PracticeBoardItem[]
  in_progress: PracticeBoardItem[]
  done: PracticeBoardItem[]
}

export type PracticeBoard = {
  id: number | string
  title: string
  is_default: boolean
  created_at?: string
  updated_at?: string
}

export type PracticeBoardEntityCreatePayload = {
  title: string
}

export type PracticeBoardEntityUpdatePayload = {
  title?: string
  is_default?: boolean
}

export type PracticeBoardCreatePayload = {
  board_id?: number | string
  title: string
  description?: string | null
  related_client_id?: number | null
  related_session_id?: number | null
  source_type?: PracticeBoardSourceType
  source_id?: number | string | null
}

export type PracticeBoardUpdatePayload = {
  title?: string
  description?: string | null
}

export type PracticeBoardMovePayload = {
  status: PracticeBoardStatus
}

export type BookingSessionCreatePayload = {
  slot_id: number
  setting_accepted?: boolean
  session_format?: SessionFormat
}

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

export async function fetchProfileDocuments(): Promise<SpecialistProfileDocument[]> {
  const resp = await http.get<SpecialistProfileDocument[]>('/cabinet/profile/documents/')
  return resp.data
}

export async function createProfileDocument(payload: {
  file: File
  title: string
  document_kind?: string
  is_public?: boolean
  sort_order?: number
}): Promise<SpecialistProfileDocument> {
  const formData = new FormData()
  formData.append('file', payload.file)
  formData.append('title', payload.title)
  if (payload.document_kind) {
    formData.append('document_kind', payload.document_kind)
  }
  if (typeof payload.is_public === 'boolean') {
    formData.append('is_public', String(payload.is_public))
  }
  if (typeof payload.sort_order === 'number') {
    formData.append('sort_order', String(payload.sort_order))
  }
  const resp = await http.post<SpecialistProfileDocument>('/cabinet/profile/documents/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return resp.data
}

export async function updateProfileDocument(
  documentId: number,
  payload: Partial<{
    title: string
    document_kind: string
    is_public: boolean
    sort_order: number
  }>
): Promise<SpecialistProfileDocument> {
  const resp = await http.patch<SpecialistProfileDocument>(
    `/cabinet/profile/documents/${documentId}/`,
    payload
  )
  return resp.data
}

export async function deleteProfileDocument(documentId: number): Promise<void> {
  await http.delete(`/cabinet/profile/documents/${documentId}/`)
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

export async function fetchAdminInbox(filters: AdminInboxListFilters = {}): Promise<AdminInboxListResponse> {
  const params: Record<string, string | number> = {}
  if (filters.status) params.status = filters.status
  if (filters.code) params.code = filters.code
  if (filters.unread_only) params.unread_only = '1'
  if (typeof filters.limit === 'number') params.limit = filters.limit

  const resp = await http.get<AdminInboxListResponse>('/admin/inbox/', { params })
  return resp.data
}

export async function fetchAdminInboxItem(itemId: number): Promise<AdminInboxItem> {
  const resp = await http.get<AdminInboxItem>(`/admin/inbox/${itemId}/`)
  return resp.data
}

export async function markAdminInboxItemRead(itemId: number): Promise<AdminInboxItem> {
  const resp = await http.post<AdminInboxItem>(`/admin/inbox/${itemId}/read/`, {})
  return resp.data
}

export async function startAdminInboxItem(itemId: number): Promise<AdminInboxItem> {
  const resp = await http.post<AdminInboxItem>(`/admin/inbox/${itemId}/start/`, {})
  return resp.data
}

export async function resolveAdminInboxItem(itemId: number): Promise<AdminInboxItem> {
  const resp = await http.post<AdminInboxItem>(`/admin/inbox/${itemId}/resolve/`, {})
  return resp.data
}

export async function dismissAdminInboxItem(itemId: number): Promise<AdminInboxItem> {
  const resp = await http.post<AdminInboxItem>(`/admin/inbox/${itemId}/dismiss/`, {})
  return resp.data
}

export async function fetchAdminBillingAccessRequests(
  filters: AdminBillingAccessRequestListFilters = {}
): Promise<AdminBillingAccessRequestListResponse> {
  const params: Record<string, string> = {}
  if (filters.status) params.status = filters.status
  if (filters.open_inbox_only) params.open_inbox_only = '1'

  const resp = await http.get<AdminBillingAccessRequest[] | AdminBillingAccessRequestListResponse>(
    '/admin/billing-access-requests/',
    { params }
  )
  const payload = resp.data
  if (Array.isArray(payload)) {
    return {
      count: payload.length,
      results: payload,
    }
  }
  return payload || { count: 0, results: [] }
}

export async function fetchAdminBillingAccessRequest(
  requestId: number
): Promise<AdminBillingAccessRequest> {
  const resp = await http.get<AdminBillingAccessRequest>(`/admin/billing-access-requests/${requestId}/`)
  return resp.data
}

export async function approveAdminBillingAccessRequest(
  requestId: number
): Promise<AdminBillingAccessRequest> {
  const resp = await http.post<AdminBillingAccessRequest>(
    `/admin/billing-access-requests/${requestId}/approve/`,
    {}
  )
  return resp.data
}

export async function rejectAdminBillingAccessRequest(
  requestId: number
): Promise<AdminBillingAccessRequest> {
  const resp = await http.post<AdminBillingAccessRequest>(
    `/admin/billing-access-requests/${requestId}/reject/`,
    {}
  )
  return resp.data
}

export async function fetchAdminSpecialistSearch(params?: {
  q?: string
  limit?: number
}): Promise<AdminSpecialistSearchResponse> {
  const resp = await http.get<AdminSpecialistSearchResponse>('/admin/specialists/search/', { params })
  return resp.data
}

export async function fetchAdminSpecialistDetail(
  specialistId: number
): Promise<AdminSpecialistDetailResponse> {
  const resp = await http.get<AdminSpecialistDetailResponse>(`/admin/specialists/${specialistId}/detail/`)
  return resp.data
}

export async function fetchAdminSpecialistAccessHistory(
  specialistId: number
): Promise<AdminSpecialistAccessHistoryItem[]> {
  const resp = await http.get<AdminSpecialistAccessHistoryItem[]>(
    `/admin/specialists/${specialistId}/access/history/`
  )
  return resp.data
}

export async function applyAdminSpecialistPlanAction(
  specialistId: number,
  payload: AdminSpecialistPlanActionPayload
): Promise<AdminSpecialistPlanActionResponse> {
  const resp = await http.post<AdminSpecialistPlanActionResponse>(
    `/admin/specialists/${specialistId}/access/plan/`,
    payload
  )
  return resp.data
}

export async function applyAdminSpecialistTrialAction(
  specialistId: number,
  payload: AdminSpecialistTrialActionPayload
): Promise<AdminSpecialistPlanActionResponse> {
  const resp = await http.post<AdminSpecialistPlanActionResponse>(
    `/admin/specialists/${specialistId}/access/trial/`,
    payload
  )
  return resp.data
}

export async function applyAdminSpecialistOverrideAction(
  specialistId: number,
  payload: AdminSpecialistOverrideActionPayload
): Promise<AdminSpecialistPlanActionResponse> {
  const resp = await http.post<AdminSpecialistPlanActionResponse>(
    `/admin/specialists/${specialistId}/access/override/`,
    payload
  )
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
  try {
    const resp = await http.get<PublicTherapistProfile>(`/s/${slug}/`)
    return resp.data
  } catch (err: any) {
    const status = Number(err?.response?.status || 0)
    if (status !== 404 && status !== 405) {
      throw err
    }
  }
  const legacyResp = await http.get<PublicTherapistProfile>(`/public/specialists/${slug}/`)
  return legacyResp.data
}

export async function fetchPublicSpecialistProfile(
  slug: string
): Promise<PublicSpecialistProfile> {
  return fetchPublicTherapistProfile(slug)
}

export type AcceptBookingRulesPayload = {
  specialist_id: number
}

export type AcceptBookingRulesResponse = {
  status: string
  created_count: number
  already_accepted_count: number
  booking_rules?: PublicBookingRules | null
}

export async function acceptBookingRules(
  payload: AcceptBookingRulesPayload
): Promise<AcceptBookingRulesResponse> {
  const resp = await http.post<AcceptBookingRulesResponse>('/booking/rules/accept/', payload)
  return resp.data
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
    offers_online?: '1'
    offers_offline?: '1'
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
    offers_online?: '1'
    offers_offline?: '1'
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
  is_archived?: boolean
  archived_at?: string | null
  other_user: {
    id: number
    role: 'SPECIALIST' | 'THERAPIST' | 'CLIENT'
    display_name: string
    photo_url?: string
  }
  header_context?: ChatThreadHeaderContext
}

export type ChatMessage = {
  id: number
  thread_id: number
  sender_id: number
  body: string
  created_at: string
  is_deleted?: boolean
  deleted_at?: string | null
}

export type ChatThreadRouteTarget = {
  route_name?: string
  params?: Record<string, string | number>
}

export type ChatThreadCounterpartContext = {
  type?: string
  id?: number
  client_id?: number
  display_name?: string
  avatar_url?: string | null
  profile_target?: ChatThreadRouteTarget | null
  sessions_target?: ChatThreadRouteTarget | null
}

export type ChatThreadRelevantSessionContext = {
  id: number
  status?: string
  starts_at?: string | null
  label?: string | null
}

export type ChatThreadHeaderContext = {
  counterpart?: ChatThreadCounterpartContext | null
  relevant_session?: ChatThreadRelevantSessionContext | null
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

export async function fetchChatThreadDetail(threadId: number): Promise<ChatThread> {
  const resp = await http.get<ChatThread>(`/chat/threads/${threadId}/`)
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

export async function deleteChatMessage(messageId: number): Promise<void> {
  await http.post(`/chat/messages/${messageId}/delete/`)
}

export async function archiveChatThread(threadId: number): Promise<void> {
  await http.post(`/chat/threads/${threadId}/archive/`)
}

export async function unarchiveChatThread(threadId: number): Promise<void> {
  await http.post(`/chat/threads/${threadId}/unarchive/`)
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

export type SpecialistPaymentMethodType = 'bank_account' | 'card' | string

export type SpecialistPaymentMethodDetails = {
  recipient_name: string
  iban: string
  card_number: string
  bank_name: string
  payment_purpose: string
  comment: string
}

export type SpecialistPaymentDetails = {
  is_configured: boolean
  available_methods: SpecialistPaymentMethodType[]
  default_method_type: SpecialistPaymentMethodType | null
  methods: Partial<Record<'bank_account' | 'card', SpecialistPaymentMethodDetails | null>>
}

export type SpecialistPaymentDetailsUpdatePayload = {
  default_method_type?: SpecialistPaymentMethodType | null
  methods?: Partial<Record<'bank_account' | 'card', SpecialistPaymentMethodDetails | null>>
}

export type SessionPaymentInstructions = {
  available_methods?: SpecialistPaymentMethodType[] | null
  default_method_type?: SpecialistPaymentMethodType | null
  methods?: Partial<Record<'bank_account' | 'card', Partial<SpecialistPaymentMethodDetails> | null>> | null
  method_type?: SpecialistPaymentMethodType | null
  recipient_name?: string | null
  iban?: string | null
  card_number?: string | null
  bank_name?: string | null
  payment_purpose?: string | null
  comment?: string | null
  snapshot_created_at?: string | null
}

export async function fetchCabinetPaymentDetails(): Promise<SpecialistPaymentDetails> {
  const resp = await http.get<SpecialistPaymentDetails>('/cabinet/payment-details/')
  return resp.data
}

export async function updateCabinetPaymentDetails(
  payload: SpecialistPaymentDetailsUpdatePayload
): Promise<SpecialistPaymentDetails> {
  const resp = await http.patch<SpecialistPaymentDetails>('/cabinet/payment-details/', payload)
  return resp.data
}

export type SessionPaymentProofStatus =
  | 'NOT_REQUESTED'
  | 'REQUESTED'
  | 'PROOF_SUBMITTED'
  | 'MARKED_PAID'
  | 'REQUIRES_CLARIFICATION'
  | string

export type SessionPaymentProof = {
  status: SessionPaymentProofStatus
  image_url: string | null
  requested_by_specialist_at: string | null
  submitted_by_client_at: string | null
  reviewed_by_specialist_at: string | null
  marked_paid_at: string | null
  clarification_requested_at: string | null
  specialist_note: string
  client_can_upload_now: boolean
  specialist_can_mark_paid_now: boolean
  specialist_can_request_clarification_now: boolean
  specialist_can_request_proof_now: boolean
  payment_instructions?: SessionPaymentInstructions | null
}

export async function fetchSessionPaymentProof(sessionId: number): Promise<SessionPaymentProof> {
  const resp = await http.get<SessionPaymentProof>(`/booking/sessions/${sessionId}/payment-proof/`)
  return resp.data
}

export async function requestSessionPaymentProof(
  sessionId: number,
  payload?: { specialist_note?: string }
): Promise<SessionPaymentProof> {
  const resp = await http.post<SessionPaymentProof>(
    `/booking/sessions/${sessionId}/payment-proof/request/`,
    payload ?? {}
  )
  return resp.data
}

export async function uploadSessionPaymentProof(
  sessionId: number,
  file: File
): Promise<SessionPaymentProof> {
  const formData = new FormData()
  formData.append('file', file)
  const resp = await http.post<SessionPaymentProof>(
    `/booking/sessions/${sessionId}/payment-proof/upload/`,
    formData
  )
  return resp.data
}

export async function markSessionPaymentProofPaid(
  sessionId: number,
  payload?: { specialist_note?: string }
): Promise<SessionPaymentProof> {
  const resp = await http.post<SessionPaymentProof>(
    `/booking/sessions/${sessionId}/payment-proof/mark-paid/`,
    payload ?? {}
  )
  return resp.data
}

export async function requestSessionPaymentProofClarification(
  sessionId: number,
  payload?: { specialist_note?: string }
): Promise<SessionPaymentProof> {
  const resp = await http.post<SessionPaymentProof>(
    `/booking/sessions/${sessionId}/payment-proof/request-clarification/`,
    payload ?? {}
  )
  return resp.data
}

export type SessionMeetingMode = 'ONLINE' | 'OFFLINE'

export type SessionMeetingAccess = {
  meeting_mode: SessionMeetingMode
  meeting_url: string | null
  meeting_provider: 'GOOGLE_MEET' | 'ZOOM' | 'EXTERNAL' | null
  meeting_link_ready: boolean
  join_available: boolean
  join_starts_at: string | null
  join_ends_at: string | null
}

export type UpdateSessionMeetingPayload = {
  meeting_mode: SessionMeetingMode
  meeting_url: string | null
}

export async function updateSpecialistSessionMeeting(
  sessionId: number,
  payload: UpdateSessionMeetingPayload
): Promise<SessionMeetingAccess> {
  const resp = await http.patch<SessionMeetingAccess>(
    `/cabinet/sessions/${sessionId}/meeting/`,
    payload
  )
  return resp.data
}

export type ExternalSessionStatus = 'SCHEDULED' | 'CANCELLED' | string
export type ExternalInviteStatus = 'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'OPENED' | 'JOINED' | string
export type GuestBookingRequestStatus = 'pending' | 'approved' | 'declined' | 'cancelled' | string

export type ExternalGuestPaymentState =
  | 'unpaid'
  | 'requested'
  | 'paid'
  | 'awaiting_confirmation'
  | 'not_applicable'
  | string

export type ExternalGuestPaymentBadgeState = 'unpaid' | 'awaiting_confirmation' | 'paid' | null | string

export type ExternalGuestPaymentAvailableActions = {
  can_request_payment?: boolean
  can_mark_paid?: boolean
  can_request_clarification?: boolean
}

export type ExternalSessionRecord = {
  id: number
  starts_at: string
  ends_at: string | null
  duration_minutes: number
  session_format: SessionFormat
  meeting_url: string | null
  offline_location_snapshot: string | null
  guest_name: string | null
  guest_email: string | null
  price_amount?: string | number | null
  price_currency?: string | null
  status: ExternalSessionStatus
  cancelled_at: string | null
  created_at: string | null
  updated_at: string | null
  payment_state?: ExternalGuestPaymentState
  payment_badge_state?: ExternalGuestPaymentBadgeState
  payment_requested_at?: string | null
  payment_confirmed_at?: string | null
  payment_amount?: string | number | null
  payment_currency?: string | null
  payment_details_snapshot?: SessionPaymentInstructions | null
  payment_available_actions?: ExternalGuestPaymentAvailableActions | null
  payment_proof?: unknown | null
}

export type ExternalSessionInvite = {
  id: number
  external_session_id: number
  status: ExternalInviteStatus
  expires_at: string | null
  opened_at: string | null
  last_opened_at: string | null
  joined_at: string | null
  created_at: string | null
  updated_at: string | null
  invite_url?: string | null
}

export type GuestBookingRequestRecord = {
  id: number
  status: GuestBookingRequestStatus
  specialist_id: number
  slot_id: number
  requested_slot_start: string | null
  requested_slot_end: string | null
  duration_minutes: number | null
  session_format: SessionFormat | null
  offline_location_snapshot: string | null
  guest_name: string | null
  contact_channel: string | null
  contact_value: string | null
  message: string | null
  source: string | null
  public_profile_slug_snapshot: string | null
  slot_snapshot_timezone: string | null
  approved_at: string | null
  declined_at: string | null
  cancelled_at: string | null
  decline_reason: string | null
  external_session_id: number | null
  created_at: string | null
  updated_at: string | null
}

export type GuestBookingRequestInviteSnapshot = {
  status: string
  expires_at: string | null
  created_at: string | null
  revoked_at: string | null
  last_opened_at: string | null
  joined_at: string | null
  invite_url: string | null
}

export type GuestBookingRequestApproveResponse = {
  request: GuestBookingRequestRecord
  external_session: ExternalSessionRecord | null
  invite: GuestBookingRequestInviteSnapshot | null
}

export type ExternalSessionInviteCreateResponse = {
  invite: ExternalSessionInvite | null
  invite_url?: string | null
}

export type ExternalSessionInviteStatusResponse = {
  invite: ExternalSessionInvite | null
  invite_url?: string | null
}

export type PublicPaymentMethodSnapshot = {
  recipient_name?: string | null
  iban?: string | null
  card_number?: string | null
  bank_name?: string | null
  payment_purpose?: string | null
  comment?: string | null
}

export type PublicPaymentDetailsSnapshot = {
  is_available: boolean
  available_methods: string[]
  default_method_type: string | null
  methods: Record<string, PublicPaymentMethodSnapshot>
  method_type: string | null
  recipient_name: string | null
  iban: string | null
  card_number: string | null
  bank_name: string | null
  payment_purpose: string | null
  comment: string | null
  snapshot_created_at: string | null
}

export type PublicExternalSessionPaymentPayload = {
  payment_requested: boolean
  payment_state: string
  payment_amount: string | null
  payment_currency: string | null
  payment_details_snapshot: PublicPaymentDetailsSnapshot | null
  can_submit_payment_proof: boolean
  payment_proof_status: string | null
}

export type PublicExternalSessionInviteResolved = {
  status: ExternalInviteStatus
  specialist_name: string | null
  specialist_profile_path: string | null
  specialist_profile_url: string | null
  starts_at: string | null
  ends_at: string | null
  session_format: SessionFormat | null
  offline_location: string | null
  instructions: string | null
  can_join: boolean
  payment: PublicExternalSessionPaymentPayload | null
}

type PublicExternalSessionInviteResolvedResponse = {
  guest_session: PublicExternalSessionInviteResolved | null
}

export type PublicExternalSessionInviteJoinResponse = {
  status: ExternalInviteStatus
  session_format: SessionFormat | null
  meeting_url: string | null
  offline_location_snapshot: string | null
}

type PublicExternalSessionInviteJoinNestedResponse = {
  join: {
    status: ExternalInviteStatus
    session_format: SessionFormat | null
    meeting_url: string | null
    offline_location_snapshot: string | null
    joined_at?: string | null
  } | null
}

export type ClientRecordAccountInvite = {
  id: number
  client_record_id?: number | null
  token?: string | null
  invite_url?: string | null
  status: string
  expires_at?: string | null
  accepted_at?: string | null
  revoked_at?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export type ClientMaterialStatus = 'draft' | 'published' | 'revoked'
export type ClientMaterialType =
  | 'recommendation'
  | 'homework'
  | 'exercise'
  | 'instruction'
  | 'link'
  | 'document'
  | 'other'

export type ClientMaterialSpecialistRecord = {
  id: number
  client_record_id: number
  session_id: number | null
  status: ClientMaterialStatus
  material_type: ClientMaterialType
  title: string
  content: string
  content_preview: string
  url: string | null
  published_at: string | null
  revoked_at: string | null
  created_at: string
  updated_at: string
}

export type ClientMaterialClientRecord = {
  id: number
  session_id: number | null
  material_type: ClientMaterialType
  title: string
  content: string
  content_preview: string
  url: string | null
  published_at: string
  specialist?: {
    id?: number | null
    display_name?: string | null
    username?: string | null
  } | null
}

export type ClientMaterialsClientListResponse = {
  results: ClientMaterialClientRecord[]
  next_cursor: string | null
}

export type SpecialistClientMaterialFilters = {
  client_record_id?: number
  client_id?: number
  status?: ClientMaterialStatus
  session_id?: number
  q?: string
}

export type SpecialistClientMaterialCreatePayload = {
  client_record_id?: number
  client_id?: number
  session_id?: number | null
  material_type: ClientMaterialType
  title: string
  content: string
  url?: string | null
}

export type SpecialistClientMaterialUpdatePayload = Partial<{
  session_id: number | null
  material_type: ClientMaterialType
  title: string
  content: string
  url: string | null
}>

function normalizeClientMaterialUrl(url: unknown): string | null {
  const value = String(url ?? '').trim()
  return value || null
}

function normalizeSpecialistClientMaterial(
  material: ClientMaterialSpecialistRecord
): ClientMaterialSpecialistRecord {
  return {
    ...material,
    url: normalizeClientMaterialUrl(material.url),
  }
}

function normalizeClientMaterial(
  material: ClientMaterialClientRecord
): ClientMaterialClientRecord {
  return {
    ...material,
    url: normalizeClientMaterialUrl(material.url),
  }
}

export function hasMaterialUrl(material: { url?: string | null } | null | undefined): boolean {
  return Boolean(normalizeClientMaterialUrl(material?.url))
}

export type ClientRecordAccountInviteResponse = {
  invite: ClientRecordAccountInvite | null
  invite_url?: string | null
}

export type PublicClientRecordAccountInvitePreview = {
  status: string
  specialist_name?: string | null
  specialist_display_name?: string | null
  client_display_name?: string | null
  client_name?: string | null
  expires_at?: string | null
  can_accept?: boolean
}

type PublicClientRecordAccountInvitePreviewResponse = {
  invite: PublicClientRecordAccountInvitePreview | null
}

export type AcceptClientRecordAccountInvitePayload = {
  confirm_identity?: boolean
}

export type AcceptClientRecordAccountInviteResponse = {
  status: string
  client_record_id?: number | null
  client_id?: number | null
  redirect_url?: string | null
}

export async function fetchClientRecordAccountInvite(
  recordId: number
): Promise<ClientRecordAccountInviteResponse | null> {
  const resp = await http.get<ClientRecordAccountInviteResponse | null>(
    `/cabinet/client-records/${recordId}/account-invite/`
  )
  return resp.data || null
}

export async function createClientRecordAccountInvite(
  recordId: number
): Promise<ClientRecordAccountInviteResponse> {
  const resp = await http.post<ClientRecordAccountInviteResponse>(
    `/cabinet/client-records/${recordId}/account-invite/`,
    {}
  )
  return resp.data
}

export async function revokeClientRecordAccountInvite(
  recordId: number
): Promise<ClientRecordAccountInviteResponse> {
  const resp = await http.post<ClientRecordAccountInviteResponse>(
    `/cabinet/client-records/${recordId}/account-invite/revoke/`,
    {}
  )
  return resp.data
}

export async function regenerateClientRecordAccountInvite(
  recordId: number
): Promise<ClientRecordAccountInviteResponse> {
  const resp = await http.post<ClientRecordAccountInviteResponse>(
    `/cabinet/client-records/${recordId}/account-invite/regenerate/`,
    {}
  )
  return resp.data
}

export async function fetchPublicClientRecordAccountInvite(
  token: string
): Promise<PublicClientRecordAccountInvitePreview | null> {
  const resp = await http.get<
    PublicClientRecordAccountInvitePreview | PublicClientRecordAccountInvitePreviewResponse | null
  >(`/public/client-record-account-invites/${token}/`)
  const payload = resp.data
  if (!payload) return null
  return typeof payload === 'object' && 'invite' in payload ? payload.invite : payload
}

export async function acceptClientRecordAccountInvite(
  token: string,
  payload?: AcceptClientRecordAccountInvitePayload
): Promise<AcceptClientRecordAccountInviteResponse> {
  const resp = await http.post<AcceptClientRecordAccountInviteResponse>(
    `/client/client-record-account-invites/${token}/accept/`,
    payload ?? {}
  )
  return resp.data
}

export async function fetchSpecialistClientMaterials(
  filters: SpecialistClientMaterialFilters = {}
): Promise<ClientMaterialSpecialistRecord[]> {
  const resp = await http.get<ClientMaterialSpecialistRecord[]>(
    '/cabinet/client-materials/',
    {
      params: filters,
    }
  )
  return (resp.data || []).map(normalizeSpecialistClientMaterial)
}

export async function createSpecialistClientMaterial(
  payload: SpecialistClientMaterialCreatePayload
): Promise<ClientMaterialSpecialistRecord> {
  const resp = await http.post<ClientMaterialSpecialistRecord>(
    '/cabinet/client-materials/',
    payload
  )
  return normalizeSpecialistClientMaterial(resp.data)
}

export async function fetchSpecialistClientMaterial(
  materialId: number
): Promise<ClientMaterialSpecialistRecord> {
  const resp = await http.get<ClientMaterialSpecialistRecord>(`/cabinet/client-materials/${materialId}/`)
  return normalizeSpecialistClientMaterial(resp.data)
}

export async function updateSpecialistClientMaterial(
  materialId: number,
  payload: SpecialistClientMaterialUpdatePayload
): Promise<ClientMaterialSpecialistRecord> {
  const resp = await http.patch<ClientMaterialSpecialistRecord>(
    `/cabinet/client-materials/${materialId}/`,
    payload
  )
  return normalizeSpecialistClientMaterial(resp.data)
}

export async function publishSpecialistClientMaterial(
  materialId: number
): Promise<ClientMaterialSpecialistRecord> {
  const resp = await http.post<ClientMaterialSpecialistRecord>(
    `/cabinet/client-materials/${materialId}/publish/`,
    {}
  )
  return normalizeSpecialistClientMaterial(resp.data)
}

export async function revokeSpecialistClientMaterial(
  materialId: number
): Promise<ClientMaterialSpecialistRecord> {
  const resp = await http.post<ClientMaterialSpecialistRecord>(
    `/cabinet/client-materials/${materialId}/revoke/`,
    {}
  )
  return normalizeSpecialistClientMaterial(resp.data)
}

export async function fetchClientMaterials(
  cursor?: string | null,
  sessionId?: number | null
): Promise<ClientMaterialsClientListResponse> {
  const resp = await http.get<ClientMaterialsClientListResponse>('/client/materials/', {
    params: {
      cursor: cursor || undefined,
      session_id: sessionId || undefined,
    },
  })
  const payload = resp.data || { results: [], next_cursor: null }
  return {
    results: (payload.results || []).map(normalizeClientMaterial),
    next_cursor: payload.next_cursor || null,
  }
}

export async function fetchClientMaterialDetail(
  materialId: number
): Promise<ClientMaterialClientRecord> {
  const resp = await http.get<ClientMaterialClientRecord>(`/client/materials/${materialId}/`)
  return normalizeClientMaterial(resp.data)
}

export async function fetchExternalSessions(): Promise<ExternalSessionRecord[]> {
  const resp = await http.get<ExternalSessionRecord[]>('/cabinet/external-sessions/')
  return resp.data
}

export async function createExternalSession(payload: {
  starts_at: string
  duration_minutes: number
  session_format: SessionFormat
  meeting_url?: string | null
  offline_location_snapshot?: string | null
  guest_name?: string | null
  guest_email?: string | null
  price_amount?: string | number | null
  price_currency?: string | null
}): Promise<ExternalSessionRecord> {
  const resp = await http.post<ExternalSessionRecord>('/cabinet/external-sessions/', payload)
  return resp.data
}

export async function fetchCabinetGuestBookingRequests(): Promise<GuestBookingRequestRecord[]> {
  const resp = await http.get<GuestBookingRequestRecord[]>('/cabinet/guest-booking-requests/')
  return resp.data || []
}

export async function approveCabinetGuestBookingRequest(
  requestId: number,
  payload?: { meeting_url?: string | null }
): Promise<GuestBookingRequestApproveResponse> {
  const resp = await http.post<GuestBookingRequestApproveResponse>(
    `/cabinet/guest-booking-requests/${requestId}/approve/`,
    payload ?? {}
  )
  return resp.data
}

export async function declineCabinetGuestBookingRequest(
  requestId: number,
  payload?: { decline_reason?: string | null }
): Promise<GuestBookingRequestRecord> {
  const resp = await http.post<GuestBookingRequestRecord>(
    `/cabinet/guest-booking-requests/${requestId}/decline/`,
    payload ?? {}
  )
  return resp.data
}

export async function fetchExternalSessionDetail(sessionId: number): Promise<ExternalSessionRecord> {
  const resp = await http.get<ExternalSessionRecord>(`/cabinet/external-sessions/${sessionId}/`)
  return resp.data
}

export async function updateExternalSession(
  sessionId: number,
  payload: Partial<{
    starts_at: string
    duration_minutes: number
    session_format: SessionFormat
    meeting_url: string | null
    offline_location_snapshot: string | null
    guest_name: string | null
    guest_email: string | null
  }>
): Promise<ExternalSessionRecord> {
  const resp = await http.patch<ExternalSessionRecord>(
    `/cabinet/external-sessions/${sessionId}/`,
    payload
  )
  return resp.data
}

export type ExternalSessionPaymentRequestPayload = {
  amount?: string | number | null
  currency?: string | null
  specialist_note?: string
}

export async function requestExternalSessionPayment(
  sessionId: number,
  payload?: ExternalSessionPaymentRequestPayload
): Promise<ExternalSessionRecord> {
  const resp = await http.post<ExternalSessionRecord>(
    `/cabinet/external-sessions/${sessionId}/payment-request/`,
    payload ?? {}
  )
  return resp.data
}

export async function markExternalSessionPaymentPaid(
  sessionId: number,
  payload?: { specialist_note?: string }
): Promise<ExternalSessionRecord> {
  const resp = await http.post<ExternalSessionRecord>(
    `/cabinet/external-sessions/${sessionId}/payment/mark-paid/`,
    payload ?? {}
  )
  return resp.data
}

export async function cancelExternalSession(sessionId: number): Promise<ExternalSessionRecord> {
  const resp = await http.post<ExternalSessionRecord>(
    `/cabinet/external-sessions/${sessionId}/cancel/`,
    {}
  )
  return resp.data
}

export async function fetchExternalSessionInvite(
  sessionId: number
): Promise<ExternalSessionInviteStatusResponse | null> {
  const resp = await http.get<ExternalSessionInviteStatusResponse | null>(
    `/cabinet/external-sessions/${sessionId}/invite/`
  )
  return resp.data || null
}

export async function createExternalSessionInvite(
  sessionId: number
): Promise<ExternalSessionInviteCreateResponse> {
  const resp = await http.post<ExternalSessionInviteCreateResponse>(
    `/cabinet/external-sessions/${sessionId}/invite/`,
    {}
  )
  return resp.data
}

export async function revokeExternalSessionInvite(sessionId: number): Promise<ExternalSessionInvite> {
  const resp = await http.post<ExternalSessionInvite>(
    `/cabinet/external-sessions/${sessionId}/invite/revoke/`,
    {}
  )
  return resp.data
}

export async function regenerateExternalSessionInvite(
  sessionId: number
): Promise<ExternalSessionInviteCreateResponse> {
  const resp = await http.post<ExternalSessionInviteCreateResponse>(
    `/cabinet/external-sessions/${sessionId}/invite/regenerate/`,
    {}
  )
  return resp.data
}

export async function fetchPublicExternalSessionInvite(
  token: string
): Promise<PublicExternalSessionInviteResolved> {
  const resp = await http.get<PublicExternalSessionInviteResolved | PublicExternalSessionInviteResolvedResponse>(
    `/public/external-session-invites/${token}/`
  )
  const payload = resp.data as PublicExternalSessionInviteResolved | PublicExternalSessionInviteResolvedResponse | null
  const source =
    payload && typeof payload === 'object' && 'guest_session' in payload
      ? payload.guest_session
      : payload
  return {
    status: source?.status || 'EXPIRED',
    specialist_name: source?.specialist_name || null,
    specialist_profile_path: source?.specialist_profile_path || null,
    specialist_profile_url: source?.specialist_profile_url || null,
    starts_at: source?.starts_at || null,
    ends_at: source?.ends_at || null,
    session_format: source?.session_format || null,
    offline_location: source?.offline_location || null,
    instructions: source?.instructions || null,
    can_join: Boolean(source?.can_join),
    payment: source?.payment || null,
  }
}

export async function joinPublicExternalSessionInvite(
  token: string
): Promise<PublicExternalSessionInviteJoinResponse> {
  const resp = await http.post<
    PublicExternalSessionInviteJoinResponse | PublicExternalSessionInviteJoinNestedResponse
  >(
    `/public/external-session-invites/${token}/join/`,
    {}
  )
  const payload = resp.data as
    | PublicExternalSessionInviteJoinResponse
    | PublicExternalSessionInviteJoinNestedResponse
    | null
  const source =
    payload && typeof payload === 'object' && 'join' in payload ? payload.join : payload
  return {
    status: source?.status || 'EXPIRED',
    session_format: source?.session_format || null,
    meeting_url: source?.meeting_url || null,
    offline_location_snapshot: source?.offline_location_snapshot || null,
  }
}
