import { http } from './http'
import type { AxiosRequestConfig } from 'axios'
import type { ProfessionalFocus } from '../constants/professionalFocus'
import type { RegistrationAttributionPayload } from './registrationAttribution'

type TokenResponse = {
  access: string
  refresh?: string
}

export type EmailVerificationState = 'legacy_unknown' | 'unverified' | 'verified'

export type AccountIdentity = {
  id: number
  username: string
  email: string | null
  role?: string | null
  roles?: string[]
  email_verification_state?: EmailVerificationState
  email_verified_at?: string | null
}

type SignupResponse = TokenResponse & {
  user: AccountIdentity
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

export type ClientRecordContactConflictCandidate = {
  id: number
  display_name: string
  matching_contact_types: Array<'email' | 'phone' | 'telegram'>
  source: 'manual' | 'registered'
  has_account: boolean
  archived: boolean
  latest_session_at: string | null
  has_upcoming_session: boolean
}

export type ClientRecordContactConflict = {
  code: 'CLIENT_RECORD_CONTACT_CONFLICT'
  detail: string
  candidates: ClientRecordContactConflictCandidate[]
}

export function getClientRecordContactConflict(err: unknown): ClientRecordContactConflict | null {
  const data = (err as { response?: { data?: unknown } })?.response?.data
  if (!data || typeof data !== 'object') return null
  const candidate = data as Partial<ClientRecordContactConflict>
  if (candidate.code !== 'CLIENT_RECORD_CONTACT_CONFLICT' || !Array.isArray(candidate.candidates)) return null
  return candidate as ClientRecordContactConflict
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

export type PasswordResetRequestResponse = {
  status: 'accepted'
  detail: string
}

export type PasswordResetConfirmResponse = {
  status: 'password_changed'
}

export async function requestPasswordReset(email: string): Promise<PasswordResetRequestResponse> {
  return apiPost<PasswordResetRequestResponse>('/auth/password-reset/', { email })
}

export async function confirmPasswordReset(
  uid: string,
  token: string,
  newPassword: string,
  newPasswordConfirm: string
): Promise<PasswordResetConfirmResponse> {
  return apiPost<PasswordResetConfirmResponse>('/auth/password-reset/confirm/', {
    uid,
    token,
    new_password: newPassword,
    new_password_confirm: newPasswordConfirm,
  })
}

export async function signupTherapist(
  email: string,
  password: string,
  passwordConfirm: string,
  acquisition?: RegistrationAttributionPayload
): Promise<SignupResponse> {
  try {
    const resp = await http.post<SignupResponse>('/auth/signup/', {
      email,
      password,
      password_confirm: passwordConfirm,
      ...(acquisition ? { acquisition } : {}),
    })
    return resp.data
  } catch (err: any) {
    throw new Error(getApiErrorMessage(err, 'Не вдалося зареєструватися'))
  }
}

export async function signupSpecialist(
  email: string,
  password: string,
  passwordConfirm: string,
  acquisition?: RegistrationAttributionPayload
): Promise<SignupResponse> {
  return signupTherapist(email, password, passwordConfirm, acquisition)
}

export async function fetchMe(accessToken: string) {
  const resp = await http.get('/me/', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  return resp.data
}

export type ClientSpecialist = {
  specialist_id: number
  display_name: string
  public_slug: string | null
  photo_url: string | null
  relation_state: string
}

export async function fetchClientSpecialists(): Promise<ClientSpecialist[]> {
  const resp = await http.get<ClientSpecialist[]>('/client/specialists/')
  return resp.data
}

export type AccountEmailChangeInitiationResponse = {
  status: 'verification_sent'
}

export type AccountEmailChangeConfirmationResponse = {
  status: 'email_changed'
}

export async function initiateAccountEmailChange(
  newEmail: string,
  currentPassword: string
): Promise<AccountEmailChangeInitiationResponse> {
  return apiPost<AccountEmailChangeInitiationResponse>('/account/email-change/', {
    new_email: newEmail,
    current_password: currentPassword,
  })
}

export async function confirmAccountEmailChange(
  token: string
): Promise<AccountEmailChangeConfirmationResponse> {
  return apiPost<AccountEmailChangeConfirmationResponse>(
    `/account/email-change/confirm/${encodeURIComponent(token)}/`
  )
}

export type AccountEmailVerificationResendResponse = {
  status: 'verification_sent'
  expires_at: string
}

export type AccountEmailVerificationConfirmationResponse = {
  status: 'email_verified'
}

export async function resendAccountEmailVerification(): Promise<AccountEmailVerificationResendResponse> {
  return apiPost<AccountEmailVerificationResendResponse>('/auth/email-verification/resend/', {})
}

export async function confirmAccountEmailVerification(
  token: string
): Promise<AccountEmailVerificationConfirmationResponse> {
  return apiPost<AccountEmailVerificationConfirmationResponse>('/auth/email-verification/confirm/', { token })
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
  public_display_name_exists?: boolean | null
  basic_description_exists?: boolean | null
  topics_configured?: boolean | null
  work_format_configured?: boolean | null
  standard_price_configured?: boolean | null
  client_entry_path_exists?: boolean | null
  has_future_slots?: boolean | null
  public_profile_enabled?: boolean | null
  is_search_visible?: boolean | null
  profile_slug_exists?: boolean | null
  public_profile_link_available?: boolean | null
  public_booking_mode?: string | null
  show_public_availability?: boolean | null
  ready_for_inbound_intent?: boolean | null
  minimum_public_profile_readiness?: PublicProfileReadiness | null
  public_profile_readiness?: PublicProfileReadiness | null
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
  public_profile_path?: string | null
  public_profile_enabled?: boolean | null
  is_search_visible?: boolean | null
  minimum_public_profile_readiness?: PublicProfileReadiness | null
  public_profile_readiness?: PublicProfileReadiness | null
}

export async function fetchSpecialistOnboardingState(): Promise<SpecialistOnboardingState> {
  const resp = await http.get<SpecialistOnboardingState>('/cabinet/onboarding-state/')
  return resp.data
}

export interface ActiveClientEntitlement {
  used?: number | null
  limit?: number | null
  base_limit?: number | null
  extra_slots?: number | null
  extra_slots_limit?: number | null
  effective_limit?: number | null
  remaining?: number | null
  extra_slot_price_uah?: number | null
  can_buy_extra_slot?: boolean | null
  requires_pro?: boolean | null
  upgrade_required_plan?: 'PRO' | 'LEADER' | string | null
  is_forced_limit?: boolean | null
}

export type ActiveClientLimitIncreaseRequestStatus = 'PENDING' | 'EXECUTED' | 'REJECTED' | string

export type ActiveClientLimitIncreaseRequest = {
  id: number
  therapist?: number
  status: ActiveClientLimitIncreaseRequestStatus
  requested_extra_slots: number
  plan_snapshot: 'START' | 'PRO' | 'LEADER' | string
  base_active_client_limit_snapshot: number
  current_extra_active_client_slots_snapshot: number
  max_extra_active_client_slots_snapshot: number
  price_uah_per_month_snapshot: string
  specialist_note?: string
  created_at: string
  updated_at: string
  decided_at: string | null
}

export type ActiveClientLimitIncreaseRequestState = {
  has_pending_request: boolean
  current_request: ActiveClientLimitIncreaseRequest | null
  latest_request: ActiveClientLimitIncreaseRequest | null
}

export async function refreshToken(): Promise<TokenResponse> {
  const resp = await http.post<TokenResponse>('/auth/token/refresh/', {})
  return resp.data
}

export async function logoutSession(): Promise<void> {
  await http.post('/auth/logout/', {})
}

export async function enableSpecialist(acquisition?: RegistrationAttributionPayload): Promise<void> {
  await http.post('/auth/enable-specialist/', acquisition ? { acquisition } : {})
}

export type PublicProfileReadinessItem = {
  key: string
  label: string
  complete: boolean
  reason?: string
  message?: string
  action_label?: string
  action_route?: string
}

export type PublicProfileReadiness = {
  is_ready: boolean
  completed_count: number
  total_count: number
  missing_items: string[]
  items: PublicProfileReadinessItem[]
}

export type ProfileNotice = {
  code: string
  detail: string
  missing_items?: string[]
}

export type TherapistProfile = {
  id: number
  public_visibility_contract_version?: number
  public_profile_enabled: boolean
  is_search_visible: boolean
  public_profile_readiness?: PublicProfileReadiness | null
  profile_notice?: ProfileNotice | null
  public_booking_mode?: 'request_only' | 'direct_booking'
  show_public_availability?: boolean
  public_booking_min_lead_time_hours?: number
  public_booking_horizon_days?: number
  public_booking_requires_confirmation?: boolean
  public_booking_slot_policy?: 'single_hold' | 'parallel_requests'
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
  public_display_name?: string
  bio?: string
  public_profile_summary?: string
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
  standard_session_duration_minutes: number
  intro_duration_minutes: number
  intro_price: string | null
  intro_price_currency: string
  couple_session_enabled: boolean
  couple_session_price: string | number | null
  couple_session_price_currency: string | null
  couple_session_duration_minutes: number | null
  contact_email: string
  contact_phone: string
  secondary_phone?: string
  messenger: string
  telegram: string
  viber: string
  whatsapp: string
  photo_url: string
  video_url: string
  show_email: boolean
  show_phone: boolean
  show_secondary_phone?: boolean
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
  kind?:
  | 'session_event'
  | 'reminder_event'
  | 'reschedule_request'
  | 'inquiry_message'
  | 'payment_proof_event'
  | 'public_guest_request'
  | 'admin_inbox_item'
  source_kind:
  | 'session_event'
  | 'reminder_delivery'
  | 'reschedule_request'
  | 'inquiry_message'
  | 'payment_proof_event'
  | 'public_guest_request'
  | 'admin_inbox_item'
  source_id: number
  code: string
  title?: string | null
  body?: string | null
  target_url?: string | null
  counterparty_name?: string | null
  preview?: string | null
  slot_start_at?: string | null
  meeting_url?: string | null
  created_at: string
  scheduled_for?: string | null
  delivered_at?: string | null
  read_at: string | null
}

export type NotificationFeedResponse = {
  count: number
  unread_count: number
  results: NotificationFeedItem[]
}

export type NotificationReadResponse = {
  ok: true
  source_kind: string
  source_id: number
  read_at: string
  unread_count: number
}

export type NotificationReadAllResponse = {
  ok: true
  marked_count: number
  unread_count: number
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

export type AdminOperationalWorkItem = {
  item_key: string
  item_type: string
  status: AdminWorkQueueStatus | string
  persisted_status?: AdminWorkQueueStatus | string | null
  status_changed_at?: string | null
  status_changed_by?: { id: number; username: string } | null
  resolution_note?: string | null
  source_type?: string | null
  source_id?: string | null
  target_url?: string | null
}

export type AdminOperationalSummary = {
  open_count: number
  in_progress_count: number
  resolved_count: number
  ignored_count: number
  has_active_items: boolean
  latest_item: AdminOperationalWorkItem | null
  domain_status?: string | null
  auto_closed?: boolean
  conflict_code?: string | null
}

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
  work_queue_summary?: AdminOperationalSummary | null
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

export interface AdminWorkQueueSummary {
  total_open: number
  public_requests_pending: number
  public_requests_stale: number
  specialists_pending_review: number
  notification_issues: number
  client_invites_pending: number
  billing_issues: number
}

export interface AdminWorkQueueRelated {
  object_type?: string
  object_id?: number | string
  request_id?: number | string
  public_request_id?: number | string
  specialist_id?: number | null
  client_id?: number | null
  request_status?: string | null
  domain_status?: string | null
  public_profile_enabled?: boolean | null
  public_profile_slug?: string | null
  public_profile_path?: string | null
  public_profile_url?: string | null
  public_profile_readiness?: PublicProfileReadiness | null
  has_client_name?: boolean
  has_contact?: boolean
  has_topics?: boolean
  has_message?: boolean
  has_requested_format?: boolean
}

export type AdminWorkQueueStatus = 'open' | 'in_progress' | 'resolved' | 'ignored'
export type AdminWorkQueueStatusFilter = 'active' | AdminWorkQueueStatus | 'all'

export interface AdminWorkQueueItem {
  id: string
  item_key?: string
  item_type?: string
  source_type?: string
  source_id?: string
  type: string
  severity: 'info' | 'normal' | 'warning' | 'critical' | string
  status: AdminWorkQueueStatus | 'new' | 'problem' | string
  title: string
  description?: string
  created_at?: string
  updated_at?: string | null
  status_changed_at?: string | null
  status_changed_by?: { id: number; username: string } | null
  resolution_note?: string
  resolved_at?: string | null
  resolved_by?: { id: number; username: string } | null
  ignored_at?: string | null
  ignored_by?: { id: number; username: string } | null
  source_active?: boolean
  target_url?: string | null
  related?: AdminWorkQueueRelated | null
  detail?: {
    why?: string
    next_step?: string
  } | null
  actions?: Array<{
    code: string
    label: string
    kind?: 'link' | 'mutation' | string
  }>
}

export interface AdminWorkQueueResponse {
  summary: AdminWorkQueueSummary
  items: AdminWorkQueueItem[]
}

export type AdminCrmVisibilityState =
  | 'unpublished'
  | 'direct_link_only'
  | 'search_visible'
  | 'invalid'

export type AdminCrmSummaryReadiness = {
  is_ready: boolean
  completed_count: number
  total_count: number
  missing_items: string[]
}

export type AdminCrmSummaryVisibility = {
  state?: AdminCrmVisibilityState | string | null
  public_profile_path?: string | null
}

export type AdminCrmSummaryOnboarding = {
  template_a_sent: boolean
  template_b_sent: boolean
  template_b_variant?: string | null
}

export type AdminCrmSummary = {
  readiness?: AdminCrmSummaryReadiness | null
  visibility?: AdminCrmSummaryVisibility | null
  onboarding?: AdminCrmSummaryOnboarding | null
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
  crm_summary?: AdminCrmSummary | null
}

export type AdminSpecialistSearchResponse = {
  count: number
  results: AdminSpecialistSearchItem[]
}

export type AdminCrmReadinessItem = {
  key: string
  label: string
  complete: boolean
}

export type AdminCrmReadiness = {
  is_ready?: boolean | null
  completed_count?: number | null
  total_count?: number | null
  missing_items?: string[] | null
  items?: AdminCrmReadinessItem[] | null
}

export type AdminCrmVisibility = {
  public_profile_enabled?: boolean | null
  is_search_visible?: boolean | null
  state?: AdminCrmVisibilityState | string | null
  public_profile_path?: string | null
}

export type AdminCrmClientEntryMode = 'request_only' | 'direct_booking' | 'unknown'

export type AdminCrmClientEntry = {
  mode?: AdminCrmClientEntryMode | string | null
  show_public_availability?: boolean | null
  has_future_available_windows?: boolean | null
  windows_attention_required?: boolean | null
}

export type AdminCrmOnboardingDelivery = {
  status?: string | null
  template_version?: string | null
  variant?: string | null
  source?: string | null
  attempt_count?: number | null
  created_at?: string | null
  scheduled_for?: string | null
  claimed_at?: string | null
  provider_accepted_at?: string | null
  next_attempt_at?: string | null
  last_error_code?: string | null
  last_error_message?: string | null
  provider_message_id?: string | null
  suppression_reason?: string | null
  cancellation_reason?: string | null
  outcome_unknown?: boolean | null
  automatic_retry_possible?: boolean | null
}

export type AdminCrmTemplateA = {
  sent?: boolean | null
  sent_at?: string | null
  delivery?: AdminCrmOnboardingDelivery | null
}

export type AdminCrmTemplateB = {
  sent?: boolean | null
  sent_at?: string | null
  variant?: string | null
  variant_label?: string | null
  delivery?: AdminCrmOnboardingDelivery | null
}

export type AdminCrmTemplateC = {
  sent?: boolean | null
  sent_at?: string | null
  variant?: string | null
  delivery?: AdminCrmOnboardingDelivery | null
}

export type AdminOnboardingSuppressionReason =
  | 'REPLY'
  | 'HARD_BOUNCE'
  | 'OPT_OUT'
  | 'MANUAL_STOP'
  | 'COMPLAINT'

export type AdminCrmOnboardingSuppression = {
  suppressed?: boolean | null
  reason?: AdminOnboardingSuppressionReason | string | null
  source?: string | null
  occurred_at?: string | null
  recorded_at?: string | null
  revoked_at?: string | null
}

export type AdminCrmOnboardingSuppressionHistoryItem = AdminCrmOnboardingSuppression & {
  active?: boolean | null
}

export type AdminCrmOnboarding = {
  template_a?: AdminCrmTemplateA | null
  template_b?: AdminCrmTemplateB | null
  template_c?: AdminCrmTemplateC | null
  suppression?: AdminCrmOnboardingSuppression | null
  suppression_history?: AdminCrmOnboardingSuppressionHistoryItem[] | null
}

export type AdminCrmState = {
  readiness?: AdminCrmReadiness | null
  visibility?: AdminCrmVisibility | null
  client_entry?: AdminCrmClientEntry | null
  onboarding?: AdminCrmOnboarding | null
}

export type AdminSpecialistDetailResponse = {
  identity: {
    id: number
    username: string
    email: string | null
    display_name: string
    public_display_name?: string
    slug: string | null
    public_slug?: string | null
    public_profile_enabled: boolean
    created_at: string | null
  }
  profile_readiness?: {
    public_profile_enabled: boolean
    public_display_name_exists: boolean
    profile_slug_exists: boolean
    basic_description_exists: boolean
    standard_price_configured: boolean
    client_entry_path_exists: boolean
    public_profile_link_available: boolean
    minimum_public_profile_ready?: boolean
    minimum_public_profile_readiness?: PublicProfileReadiness | null
    public_booking_mode?: string
    show_public_availability?: boolean
    has_future_availability_windows?: boolean
    missing_items: string[]
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
      active_client_entitlement?: ActiveClientEntitlement | null
      group_room_meeting_limit: number | null
      guest_sessions_limit_per_period: number | null
    }
    trial: {
      active: boolean
      trial_plan: string | null
      source?: 'MANUAL' | 'SIGNUP_COMPLIMENTARY' | 'BETA_POLICY_MIGRATION' | null
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
  admin_crm_state?: AdminCrmState | null
  admin_context: {
    open_billing_admin_requests_count: number
    open_admin_inbox_items_count?: number
    work_queue_summary: AdminOperationalSummary
    signup_template_a_email?: {
      sent: boolean
      sent_at: string | null
      item_key: string
    }
    signup_template_b_email?: {
      sent: boolean
      sent_at: string | null
      item_key: string
      variant: string
    }
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
  file_url?: string | null
  mime_type?: string | null
  original_filename?: string | null
  file_size?: number | null
  document_kind: string
  is_public: boolean
  sort_order: number
  uploaded_at: string
  source: string
}

export type AdminSpecialistOnboardingSuppressionActionPayload =
  | { action: 'STOP'; reason: AdminOnboardingSuppressionReason }
  | { action: 'RESUME' }

export type AdminSpecialistOnboardingSuppressionActionResponse = {
  specialist_id: number
  onboarding_suppression: AdminCrmOnboardingSuppression
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
  public_profile_summary?: string | null
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
  // Compatibility aliases for lower-level client-facing request chips.
  request_chips?: string[] | null
  request_topics?: string[] | null
  client_request_chips?: string[] | null
  selected_request_chips?: string[] | null
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
  couple_session_enabled?: boolean | null
  couple_session_price?: string | number | null
  couple_session_price_currency?: string | null
  couple_session_duration_minutes?: number | null
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
  public_profile_path?: string
  public_profile_url?: string
  therapist_id?: number
  public_booking_mode?: 'request_only' | 'direct_booking'
  show_public_availability?: boolean
  public_booking_min_lead_time_hours?: number
  public_booking_horizon_days?: number
  public_booking_requires_confirmation?: boolean
  public_booking_slot_policy?: 'single_hold' | 'parallel_requests'
  public_direct_booking_enabled?: boolean
  professional_focus?: ProfessionalFocus | null
  display_name: string
  public_display_name?: string
  completed_sessions_count?: number
  offers_online?: boolean
  offers_offline?: boolean
  offline_location?: string
  bio?: string
  public_profile_summary?: string
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
  standard_session_duration_minutes?: number
  intro_duration_minutes?: number
  intro_price?: string | number | null
  intro_price_currency?: string | null
  couple_session_enabled?: boolean
  couple_session_price?: string | number | null
  couple_session_price_currency?: string | null
  couple_session_duration_minutes?: number | null
  contact_email?: string
  contact_phone?: string
  secondary_phone?: string
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
export type ConsultationOfferType = 'standard' | 'intro' | 'couple'

export type PublicGuestRequestTopic =
  | 'anxiety'
  | 'stress'
  | 'self_esteem'
  | 'relationships'
  | 'burnout'
  | 'discipline'
  | 'career'
  | 'life_changes'
  | 'boundaries'
  | 'loneliness'
  | 'guilt'
  | 'decisions'
  | 'emotional_exhaustion'
  | 'self_discovery'
  | 'not_sure'

export const REQUEST_TOPIC_LABELS: Record<PublicGuestRequestTopic, string> = {
  anxiety: 'Тривога',
  stress: 'Стрес',
  self_esteem: 'Самооцінка',
  relationships: 'Стосунки',
  burnout: 'Вигорання',
  discipline: 'Дисципліна',
  career: 'Кар’єра / робота',
  life_changes: 'Зміни в житті',
  boundaries: 'Особисті межі',
  loneliness: 'Самотність',
  guilt: 'Почуття провини',
  decisions: 'Складні рішення',
  emotional_exhaustion: 'Емоційне виснаження',
  self_discovery: 'Пошук себе',
  not_sure: 'Не знаю',
}

export const REQUEST_TOPIC_OPTIONS: Array<{ value: PublicGuestRequestTopic; label: string }> = (
  Object.entries(REQUEST_TOPIC_LABELS) as Array<[PublicGuestRequestTopic, string]>
).map(([value, label]) => ({ value, label }))

export function requestTopicLabel(topic: string | null | undefined) {
  return REQUEST_TOPIC_LABELS[topic as PublicGuestRequestTopic] || ''
}

export type SessionTaskContext = {
  source_type?: PracticeBoardSourceType
  source_id?: number | string | null
  related_session_id?: number | null
  related_client_id?: number | null
  related_client_record_id?: number | null
}

export type Session = {
  id: number
  task_context?: SessionTaskContext | null
  [key: string]: unknown
}

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
  related_client_display_name?: string | null
  related_session_starts_at?: string | null
  related_session_label?: string | null
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
  acquisition?: import('./clientAcquisitionAttribution').ClientAcquisitionPayload
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

export async function fetchAdminWorkQueue(
  status: AdminWorkQueueStatusFilter = 'active'
): Promise<AdminWorkQueueResponse> {
  const resp = await http.get<AdminWorkQueueResponse>('/admin/work-queue/', {
    params: { status },
  })
  return resp.data
}

export async function transitionAdminWorkQueueItem(
  itemKey: string,
  action: 'start' | 'resolve' | 'ignore' | 'reopen',
  resolutionNote = ''
): Promise<AdminWorkQueueItem> {
  const resp = await http.post<AdminWorkQueueItem>(
    `/admin/work-queue/${encodeURIComponent(itemKey)}/${action}/`,
    resolutionNote ? { resolution_note: resolutionNote } : {}
  )
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

export async function applyAdminSpecialistOnboardingSuppressionAction(
  specialistId: number,
  payload: AdminSpecialistOnboardingSuppressionActionPayload
): Promise<AdminSpecialistOnboardingSuppressionActionResponse> {
  const resp = await http.post<AdminSpecialistOnboardingSuppressionActionResponse>(
    `/admin/specialists/${specialistId}/onboarding-suppression/`,
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

export async function createActiveClientLimitIncreaseRequest(payload: {
  requested_extra_slots?: number
  specialist_note?: string
} = {}): Promise<ActiveClientLimitIncreaseRequest> {
  const resp = await http.post<ActiveClientLimitIncreaseRequest>(
    '/cabinet/active-client-limit-increase-requests/',
    payload
  )
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
  photo_url: string | null
  client_code?: string
  created_at: string
  updated_at: string
}

export type ClientProfileUpdate = Partial<
  Pick<ClientProfile, 'display_name' | 'contact_email' | 'contact_phone' | 'photo_url'>
>

export type DataDeletionRequestKind = 'ACCOUNT' | 'PUBLIC_GUEST_REQUEST' | string

export type DataDeletionRequestStatus =
  | 'SUBMITTED'
  | 'IN_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'EXECUTED'
  | 'CANCELLED'
  | string

export type DataDeletionRequest = {
  id: number
  kind: DataDeletionRequestKind
  status: DataDeletionRequestStatus
  reason: string
  submitted_at: string
  reviewed_at: string | null
  cancelled_at: string | null
}

export type AccountDeletionBlockedItem = {
  code: string
  count: number
  label: string
}

export type AccountDeletionBlockedPayload = {
  detail: string
  code: 'ACCOUNT_DELETION_BLOCKED' | string
  blockers: {
    kind?: DataDeletionRequestKind
    counts: Record<string, number>
    items: AccountDeletionBlockedItem[]
  }
}

export async function fetchClientProfile(): Promise<ClientProfile> {
  const resp = await http.get<ClientProfile>('/client/profile/')
  return resp.data
}

export async function updateClientProfile(
  payload: ClientProfileUpdate
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

export async function createDataDeletionRequest(reason = ''): Promise<DataDeletionRequest> {
  const resp = await http.post<DataDeletionRequest>('/account/data-deletion-requests/', {
    reason,
  })
  return resp.data
}

export async function fetchCurrentDataDeletionRequest(): Promise<DataDeletionRequest | null> {
  const resp = await http.get<{ request: DataDeletionRequest | null }>(
    '/account/data-deletion-requests/current/'
  )
  return resp.data.request
}

export async function cancelDataDeletionRequest(id: number): Promise<DataDeletionRequest> {
  const resp = await http.post<DataDeletionRequest>(
    `/account/data-deletion-requests/${id}/cancel/`,
    {}
  )
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
  reviewText: string,
  allowAnonymousExternalUse?: boolean
): Promise<{ id: number }> {
  const payload: { review_text: string; allow_anonymous_external_use?: boolean } = {
    review_text: reviewText,
  }
  if (typeof allowAnonymousExternalUse === 'boolean') {
    payload.allow_anonymous_external_use = allowAnonymousExternalUse
  }
  const resp = await http.post<{ id: number }>(`/practice/specialists/${specialistId}/reviews/`, {
    ...payload,
  })
  return resp.data
}

export type CabinetReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
export type ReviewSource = 'session' | 'practice'
export type ShareCardPermissionStatus =
  | 'NOT_GRANTED'
  | 'GRANTED_ANONYMOUS'
  | 'REVOKED'
  | 'UNSUPPORTED_REVIEW_SOURCE'

export type ShareCardPermission = {
  can_create: boolean
  status: ShareCardPermissionStatus
  mode: 'anonymous' | null
}

export type CabinetReview = {
  id: number
  source: ReviewSource
  review_uid: string
  author_display_name: string
  rating: number | null
  text: string
  status: CabinetReviewStatus
  created_at: string
  session_id: number | null
  share_card_permission: ShareCardPermission
}

export async function fetchCabinetReviews(params?: {
  status?: CabinetReviewStatus
}): Promise<CabinetReview[]> {
  const resp = await http.get<CabinetReview[]>('/cabinet/reviews/', {
    params: {
      status: params?.status || undefined,
    },
  })
  return resp.data || []
}

export async function updateCabinetReviewStatus(params: {
  source: 'session' | 'practice'
  id: number
  status: CabinetReviewStatus
}): Promise<{
  id: number
  source: 'session' | 'practice'
  review_uid: string
  status: CabinetReviewStatus
}> {
  const resp = await http.patch<{
    id: number
    source: 'session' | 'practice'
    review_uid: string
    status: CabinetReviewStatus
  }>(
    `/cabinet/reviews/${params.source}/${params.id}/status/`,
    { status: params.status }
  )
  return resp.data
}

export async function fetchAuthorJournalPosts(): Promise<AuthorJournalPost[]> {
  const resp = await http.get<AuthorJournalPost[]>('/cabinet/journal/')
  return resp.data
}

export async function fetchAuthorJournalPost(postId: number): Promise<AuthorJournalPost> {
  const resp = await http.get<AuthorJournalPost>(`/cabinet/journal/${postId}/`)
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

export type SpecialistDiscoveryMode = 'request' | 'direction'
export type SpecialistDiscoveryRequestGroup =
  | 'emotional_state'
  | 'relationships_family'
  | 'self_esteem_change'
  | 'work_career_burnout'
  | 'loss_life_changes'
  | 'professional_development'
  | 'other_request'
export type SpecialistDiscoveryDirection =
  | 'psychological_support'
  | 'development_guidance'
  | 'education_supervision'
export type SpecialistDiscoveryFormat = 'online' | 'offline'
export type SpecialistDiscoveryMatchKind = 'exact' | 'related' | 'fallback' | null

export type PublicSpecialistDiscoveryItem = {
  slug: string
  public_slug: string
  public_profile_path: string | null
  public_profile_url: string | null
  display_name: string
  public_display_name: string
  public_profile_summary: string | null
  specializations: string[]
  location: string | null
  offers_online: boolean
  offers_offline: boolean
  photo_url: string | null
  match_kind: SpecialistDiscoveryMatchKind
}

export type PublicSpecialistDiscoveryAppliedFilters = {
  request_group: SpecialistDiscoveryRequestGroup | null
  direction: SpecialistDiscoveryDirection | null
  format: SpecialistDiscoveryFormat | null
}

export type PublicSpecialistDiscoveryGroup = {
  code: 'all_specialists' | 'matches_request' | 'related_matches' | 'other_specialists'
  label: string
  items: PublicSpecialistDiscoveryItem[]
  total: number
}

export type PublicSpecialistDiscoveryResponse = {
  query: string | null
  resolved_request_groups: SpecialistDiscoveryRequestGroup[]
  applied_filters: PublicSpecialistDiscoveryAppliedFilters
  groups: PublicSpecialistDiscoveryGroup[]
  page: number
  page_size: number
  total: number
  total_pages: number
}

export type PublicSpecialistDiscoveryParams = {
  q?: string
  request_group?: SpecialistDiscoveryRequestGroup
  direction?: SpecialistDiscoveryDirection
  format?: SpecialistDiscoveryFormat
  page?: number
}

export type PublicSpecialistDiscoveryError = {
  code: SpecialistDiscoveryErrorCode
  detail: string
  field: SpecialistDiscoveryErrorField
}

export type SpecialistDiscoveryErrorCode =
  | 'QUERY_TOO_SHORT'
  | 'QUERY_TOO_LONG'
  | 'INVALID_REQUEST_GROUP'
  | 'INVALID_DIRECTION'
  | 'INVALID_FORMAT'
  | 'INVALID_PAGE'
  | 'INVALID_PAGE_SIZE'
  | 'CONFLICTING_DISCOVERY_INPUTS'

export type SpecialistDiscoveryErrorField =
  | 'q'
  | 'request_group'
  | 'direction'
  | 'format'
  | 'page'
  | 'page_size'

const discoveryErrorCodes = new Set<SpecialistDiscoveryErrorCode>([
  'QUERY_TOO_SHORT',
  'QUERY_TOO_LONG',
  'INVALID_REQUEST_GROUP',
  'INVALID_DIRECTION',
  'INVALID_FORMAT',
  'INVALID_PAGE',
  'INVALID_PAGE_SIZE',
  'CONFLICTING_DISCOVERY_INPUTS',
])

const discoveryErrorFields = new Set<SpecialistDiscoveryErrorField>([
  'q',
  'request_group',
  'direction',
  'format',
  'page',
  'page_size',
])

export function getPublicSpecialistDiscoveryError(
  error: unknown
): PublicSpecialistDiscoveryError | null {
  if (!isRecord(error) || !isRecord(error.response) || !isRecord(error.response.data)) return null
  const value = error.response.data
  if (
    typeof value.code !== 'string' ||
    !discoveryErrorCodes.has(value.code as SpecialistDiscoveryErrorCode) ||
    typeof value.detail !== 'string' ||
    typeof value.field !== 'string' ||
    !discoveryErrorFields.has(value.field as SpecialistDiscoveryErrorField)
  ) {
    return null
  }
  return {
    code: value.code as SpecialistDiscoveryErrorCode,
    detail: value.detail,
    field: value.field as SpecialistDiscoveryErrorField,
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object'
}

export async function fetchPublicSpecialistDiscovery(
  params: PublicSpecialistDiscoveryParams = {}
): Promise<PublicSpecialistDiscoveryResponse> {
  const safeParams: PublicSpecialistDiscoveryParams = {}
  if (params.q?.trim()) safeParams.q = params.q.trim()
  if (params.request_group) safeParams.request_group = params.request_group
  if (params.direction) safeParams.direction = params.direction
  if (params.format) safeParams.format = params.format
  if (params.page && Number.isInteger(params.page) && params.page > 0) safeParams.page = params.page

  const response = await http.get<PublicSpecialistDiscoveryResponse>('/public/specialists/discovery/', {
    params: safeParams,
  })
  return response.data
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
  specialist_public_slug?: string | null
  client_id?: number | null
  client_record_id?: number | null
  client_card_id?: number | null
  created_at: string
  last_message_at: string | null
  inquiry_status: InquiryStatus
  closed_reason: string | null
  other_user: {
    id: number
    role: 'SPECIALIST' | 'THERAPIST' | 'CLIENT'
    display_name: string
    photo_url?: string | null
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

export type CabinetScheduleEventType = 'available_slot' | 'booked_slot' | 'session'

export interface CabinetScheduleEvent {
  type: CabinetScheduleEventType
  id: string
  slot_id: number | null
  session_id: number | null
  start_at: string
  end_at: string
  status?: string
  title: string
  client_display_name: string | null
  client_kind: 'registered' | 'guest' | 'unknown' | null
  requests_count?: number
  request_ids?: number[]
}

export interface CabinetScheduleResponse {
  events: CabinetScheduleEvent[]
}

export async function getCabinetSchedule(
  dateFrom: string,
  dateTo: string
): Promise<CabinetScheduleResponse> {
  const resp = await http.get<CabinetScheduleResponse>('/cabinet/schedule/', {
    params: {
      date_from: dateFrom,
      date_to: dateTo,
    },
  })
  return resp.data
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

export type ClientRecordPaymentState =
  | 'NOT_CONFIRMED'
  | 'AWAITING_CLIENT'
  | 'AWAITING_REVIEW'
  | 'NEEDS_CLARIFICATION'
  | 'PAID'
  | 'NO_PRICE'
  | 'CANCELLED'
  | 'PAYMENT_DECISION_REQUIRED'
  | 'RESOLVED_CANCELLED'

export type ClientRecordPaymentSummary = {
  not_confirmed_count: number
  awaiting_client_count: number
  awaiting_review_count: number
  needs_attention_count: number
  paid_count: number
}

export type ClientRecordPaymentRow = {
  session_id: number
  session_status: string
  starts_at: string | null
  ends_at: string | null
  session_format: string
  price_amount: string | null
  price_currency: string
  payment_state: ClientRecordPaymentState | string
  payment_proof_status: SessionPaymentProofStatus | null
  cancellation_resolution: string | null
  last_payment_action_at: string | null
}

export type ClientRecordPaymentOverview = {
  client_record: {
    id: number
    display_name: string
    source: string
    status: string
    user_id: number | null
  }
  summary: ClientRecordPaymentSummary
  rows: ClientRecordPaymentRow[]
}

export async function fetchClientRecordPayments(recordId: number): Promise<ClientRecordPaymentOverview> {
  const resp = await http.get<ClientRecordPaymentOverview>(`/cabinet/client-records/${recordId}/payments/`)
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

export type GuestBookingRequestSlotSnapshot = {
  id?: number | null
  start_at?: string | null
  end_at?: string | null
  starts_at?: string | null
  ends_at?: string | null
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
  slot_id: number | null
  has_slot?: boolean | null
  is_slotless_request?: boolean | null
  slot?: GuestBookingRequestSlotSnapshot | null
  requested_slot_start: string | null
  requested_slot_end: string | null
  duration_minutes: number | null
  offer_type?: ConsultationOfferType | string | null
  session_format: SessionFormat | null
  offline_location_snapshot: string | null
  client_name?: string | null
  client_email?: string | null
  client_phone?: string | null
  guest_name: string | null
  contact_channel: string | null
  contact_value: string | null
  request_topics?: PublicGuestRequestTopic[] | null
  message: string | null
  source: string | null
  public_profile_slug_snapshot: string | null
  slot_snapshot_timezone: string | null
  approved_at: string | null
  declined_at: string | null
  cancelled_at: string | null
  decline_reason: string | null
  external_session_id: number | null
  session_id?: number | null
  needs_alternative_time?: boolean | null
  conflicting_session_id?: number | null
  requested_slot_is_occupied?: boolean | null
  same_slot_pending_count?: number | null
  same_slot_approved_count?: number | null
  active_time_proposal_id?: number | null
  active_time_proposal_status?: string | null
  active_time_proposal_expires_at?: string | null
  active_time_proposal_options_count?: number | null
  created_at: string | null
  updated_at: string | null
}

export interface GuestBookingTimeProposalOption {
  id: number
  slot_id: number
  start_at: string
  end_at: string
  timezone: string
  status: string
  sort_order: number
}

export interface GuestBookingTimeProposal {
  id: number
  request_id: number
  status: string
  original_slot_id?: number | null
  original_requested_slot_start?: string | null
  original_requested_slot_end?: string | null
  original_duration_minutes?: number | null
  original_slot_timezone?: string
  expires_at: string
  message: string
  session_format: string
  meeting_url: string
  offline_location_snapshot: string
  accepted_at: string | null
  cancelled_at: string | null
  options_count: number
  options: GuestBookingTimeProposalOption[]
  created_at: string
  updated_at: string
}

export interface CreateGuestBookingTimeProposalPayload {
  slot_ids: number[]
  session_format?: 'online' | 'offline' | string
  message?: string
  meeting_url?: string
  offline_location_snapshot?: string
  expires_at?: string
}

export interface CreateGuestBookingTimeProposalResponse {
  proposal: GuestBookingTimeProposal & {
    proposal_url: string
    client_notification_status?: 'sent' | 'failed' | 'manual_required' | string | null
  }
}

export interface PublicGuestBookingTimeProposalOption {
  id: number
  start_at: string
  end_at: string
  timezone: string
  status: string
}

export interface PublicGuestBookingAcceptedSession {
  id: number
  starts_at: string
  ends_at: string
  timezone: string
  session_format: string
  meeting_url?: string
  offline_location_snapshot?: string
}

export interface PublicGuestBookingTimeProposal {
  public_status: string
  can_accept: boolean
  specialist_name: string
  specialist_profile_path: string
  specialist_profile_url: string
  session_format: string
  message: string
  expires_at: string
  options: PublicGuestBookingTimeProposalOption[]
  accepted_session: PublicGuestBookingAcceptedSession | null
}

export interface PublicGuestBookingTimeProposalDetailResponse {
  proposal: PublicGuestBookingTimeProposal
}

export interface AcceptPublicGuestBookingTimeProposalResponse {
  proposal: PublicGuestBookingTimeProposal
  selected_option: {
    id: number
    status: string
  }
  request: {
    status: string
    session_id: number | null
  }
  session: PublicGuestBookingAcceptedSession
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

export type GuestBookingRequestCreateSessionPayload = {
  starts_at: string
  ends_at: string
  timezone: string
  session_format: SessionFormat
  meeting_url?: string
  offline_location?: string
}

export type GuestBookingRequestCreateSessionResponse = {
  request: GuestBookingRequestRecord
  session: Session | null
}

export type GuestBookingRequestConfirmSessionResponse = {
  request: GuestBookingRequestRecord
  session: Session | null
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

export type ClientRegularTimeStatus = 'active' | 'paused'
export type ClientRegularTimeFrequency = 'weekly' | 'every_two_weeks'

export type ClientRegularTime = {
  id: number
  client_record: number
  weekday: number
  start_time: string
  duration_minutes: number
  frequency: ClientRegularTimeFrequency
  starts_on: string
  timezone?: string | null
  session_format: SessionFormat
  meeting_url?: string | null
  offline_location?: string | null
  status: ClientRegularTimeStatus
  paused_at: string | null
  created_at: string
  updated_at: string
}

export type ClientRegularTimePayload = {
  weekday: number
  start_time: string
  duration_minutes: number
  frequency: ClientRegularTimeFrequency
  starts_on: string
  session_format: SessionFormat
  meeting_url?: string | null
  offline_location?: string | null
}

export type ClientRegularTimeNextSessionResponse = {
  created: boolean
  regular_time_id: number
  occurrence_start_at: string
  occurrence_end_at: string
  session: Session
}

export type ClientRegularTimeMaterializeSessionsConflict = {
  occurrence_start_at: string
  occurrence_end_at: string
  code: string
  detail: string
}

export type ClientRegularTimeMaterializeSessionsResponse = {
  regular_time_id: number
  horizon_weeks: number
  max_occurrences: number
  occurrences_considered: number
  created_count: number
  skipped_existing_count: number
  skipped_conflicts_count: number
  created_sessions: Session[]
  skipped_existing_sessions: Session[]
  skipped_conflicts: ClientRegularTimeMaterializeSessionsConflict[]
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

export type ClientMaterialAttachment = {
  id: number
  original_filename: string
  mime_type: string
  size_bytes: number
  created_at: string
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
  attachments?: ClientMaterialAttachment[]
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
    attachments: Array.isArray(material.attachments) ? material.attachments : [],
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

function clientRegularTimesFromPayload(
  payload: ClientRegularTime[] | { results?: ClientRegularTime[] } | null | undefined
) {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.results)) return payload.results
  return []
}

export async function fetchClientRegularTimes(recordId: number): Promise<ClientRegularTime[]> {
  const resp = await http.get<ClientRegularTime[] | { results?: ClientRegularTime[] }>(
    `/cabinet/client-records/${recordId}/regular-times/`
  )
  return clientRegularTimesFromPayload(resp.data)
}

export async function createClientRegularTime(
  recordId: number,
  payload: ClientRegularTimePayload
): Promise<ClientRegularTime> {
  const resp = await http.post<ClientRegularTime>(
    `/cabinet/client-records/${recordId}/regular-times/`,
    payload
  )
  return resp.data
}

export async function updateClientRegularTime(
  recordId: number,
  regularTimeId: number,
  payload: Partial<ClientRegularTimePayload>
): Promise<ClientRegularTime> {
  const resp = await http.patch<ClientRegularTime>(
    `/cabinet/client-records/${recordId}/regular-times/${regularTimeId}/`,
    payload
  )
  return resp.data
}

export async function pauseClientRegularTime(
  recordId: number,
  regularTimeId: number
): Promise<ClientRegularTime> {
  const resp = await http.post<ClientRegularTime>(
    `/cabinet/client-records/${recordId}/regular-times/${regularTimeId}/pause/`,
    {}
  )
  return resp.data
}

export async function resumeClientRegularTime(
  recordId: number,
  regularTimeId: number
): Promise<ClientRegularTime> {
  const resp = await http.post<ClientRegularTime>(
    `/cabinet/client-records/${recordId}/regular-times/${regularTimeId}/resume/`,
    {}
  )
  return resp.data
}

export async function createNextSessionFromClientRegularTime(
  recordId: number,
  regularTimeId: number
): Promise<ClientRegularTimeNextSessionResponse> {
  const resp = await http.post<ClientRegularTimeNextSessionResponse>(
    `/cabinet/client-records/${recordId}/regular-times/${regularTimeId}/create-next-session/`,
    {}
  )
  return resp.data
}

export async function materializeClientRegularTimeSessions(
  recordId: number,
  regularTimeId: number
): Promise<ClientRegularTimeMaterializeSessionsResponse> {
  const resp = await http.post<ClientRegularTimeMaterializeSessionsResponse>(
    `/cabinet/client-records/${recordId}/regular-times/${regularTimeId}/materialize-sessions/`,
    {}
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

export async function listClientMaterialAttachments(
  materialId: number
): Promise<ClientMaterialAttachment[]> {
  const resp = await http.get<ClientMaterialAttachment[]>(
    `/cabinet/client-materials/${materialId}/attachments/`
  )
  return resp.data || []
}

export async function uploadClientMaterialAttachment(
  materialId: number,
  file: File
): Promise<ClientMaterialAttachment> {
  const formData = new FormData()
  formData.append('file', file)
  const resp = await http.post<ClientMaterialAttachment>(
    `/cabinet/client-materials/${materialId}/attachments/`,
    formData
  )
  return resp.data
}

export async function deleteClientMaterialAttachment(
  materialId: number,
  attachmentId: number
): Promise<void> {
  await http.delete(`/cabinet/client-materials/${materialId}/attachments/${attachmentId}/`)
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

export async function getClientMaterialAttachmentDownloadUrl(
  materialId: number,
  attachmentId: number
): Promise<{ download_url: string }> {
  const resp = await http.get<{ download_url: string }>(
    `/client/materials/${materialId}/attachments/${attachmentId}/download/`
  )
  return resp.data
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

export async function confirmCabinetGuestBookingRequestSession(
  requestId: number,
  payload?: { meeting_url?: string | null; offline_location_snapshot?: string | null }
): Promise<GuestBookingRequestConfirmSessionResponse> {
  const resp = await http.post<GuestBookingRequestConfirmSessionResponse>(
    `/cabinet/guest-booking-requests/${requestId}/confirm-session/`,
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

export async function createSessionFromCabinetGuestBookingRequest(
  requestId: number,
  payload: GuestBookingRequestCreateSessionPayload
): Promise<GuestBookingRequestCreateSessionResponse> {
  const resp = await http.post<GuestBookingRequestCreateSessionResponse>(
    `/cabinet/guest-booking-requests/${requestId}/create-session/`,
    payload
  )
  return resp.data
}

export async function listCabinetGuestBookingTimeProposals(
  requestId: number
): Promise<GuestBookingTimeProposal[]> {
  const resp = await http.get<GuestBookingTimeProposal[]>(
    `/cabinet/guest-booking-requests/${requestId}/time-proposals/`
  )
  return resp.data || []
}

export async function createCabinetGuestBookingTimeProposal(
  requestId: number,
  payload: CreateGuestBookingTimeProposalPayload
): Promise<CreateGuestBookingTimeProposalResponse> {
  const resp = await http.post<CreateGuestBookingTimeProposalResponse>(
    `/cabinet/guest-booking-requests/${requestId}/time-proposals/`,
    payload
  )
  return resp.data
}

export async function cancelCabinetGuestBookingTimeProposal(
  requestId: number,
  proposalId: number
): Promise<GuestBookingTimeProposal> {
  const resp = await http.post<GuestBookingTimeProposal>(
    `/cabinet/guest-booking-requests/${requestId}/time-proposals/${proposalId}/cancel/`,
    {}
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

export async function getPublicGuestBookingTimeProposal(
  token: string
): Promise<PublicGuestBookingTimeProposalDetailResponse> {
  const resp = await http.get<PublicGuestBookingTimeProposalDetailResponse>(
    `/public/guest-booking-time-proposals/${token}/`
  )
  return resp.data
}

export async function acceptPublicGuestBookingTimeProposal(
  token: string,
  optionId: number
): Promise<AcceptPublicGuestBookingTimeProposalResponse> {
  const resp = await http.post<AcceptPublicGuestBookingTimeProposalResponse>(
    `/public/guest-booking-time-proposals/${token}/accept/`,
    { option_id: optionId }
  )
  return resp.data
}
