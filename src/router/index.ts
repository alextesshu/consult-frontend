import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import AccountEmailChangeConfirmView from '../views/AccountEmailChangeConfirmView.vue'
import SignupView from '../views/SignupView.vue'
import ClientSignupView from '../views/ClientSignupView.vue'
import ClientRecordAccountInviteView from '../views/ClientRecordAccountInviteView.vue'
import CabinetView from '../views/CabinetView.vue'
import GroupEventsView from '../views/GroupEventsView.vue'
import PublicProfileView from '../views/PublicProfileView.vue'
import PublicJournalView from '../views/PublicJournalView.vue'
import PublicJournalPostView from '../views/PublicJournalPostView.vue'
import PublicJournalCollectionView from '../views/PublicJournalCollectionView.vue'
import SpecialistProfileView from '../views/TherapistProfileView.vue'
import SlotsView from '../views/SlotsView.vue'
import AvailabilityRulesView from '../views/AvailabilityRulesView.vue'
import HomeView from '../views/HomeView.vue'
import ClientDashboardView from '../views/ClientDashboardView.vue'
import SpecialistSessionsView from '../views/TherapistSessionsView.vue'
import SpecialistSessionDetailView from '../views/TherapistSessionDetailView.vue'
import ClientSessionDetailView from '../views/ClientSessionDetailView.vue'
import ClientGroupEventView from '../views/ClientGroupEventView.vue'
import SpecialistClientsView from '../views/TherapistClientsView.vue'
import SpecialistClientWorkbookView from '../views/TherapistClientWorkbookView.vue'
import BillingView from '../views/BillingView.vue'
import PublicSpecialistsView from '../views/PublicTherapistsView.vue'
import SpecialistReviewsView from '../views/TherapistReviewsView.vue'
import AuthorJournalView from '../views/AuthorJournalView.vue'
import GroupInviteJoinView from '../views/GroupInviteJoinView.vue'
import FaqView from '../views/FaqView.vue'
import FeedbackPolicyView from '../views/FeedbackPolicyView.vue'
import ClientFeedbackView from '../views/ClientFeedbackView.vue'
import TermsView from '../views/TermsView.vue'
import PrivacyView from '../views/PrivacyView.vue'
import DisclaimerView from '../views/DisclaimerView.vue'
import SupportAndDataRequestsView from '../views/SupportAndDataRequestsView.vue'
import ForbiddenView from '../views/ForbiddenView.vue'
import ChatView from '../views/ChatView.vue'
import AnalyticsView from '../views/AnalyticsView.vue'
import ClientProfileView from '../views/ClientProfileView.vue'
import ClientMaterialsView from '../views/ClientMaterialsView.vue'
import NotificationSettingsView from '../views/NotificationSettingsView.vue'
import SettingsHubView from '../views/SettingsHubView.vue'
import SpecialistInquiriesView from '../views/SpecialistInquiriesView.vue'
import ClientInquiryRedirectView from '../views/ClientInquiryRedirectView.vue'
import ExternalSessionsView from '../views/ExternalSessionsView.vue'
import ExternalSessionDetailView from '../views/ExternalSessionDetailView.vue'
import ExternalGuestSessionInviteView from '../views/ExternalGuestSessionInviteView.vue'
import PublicGuestBookingTimeProposalView from '../views/PublicGuestBookingTimeProposalView.vue'
import SpecialistPracticeBoardView from '../views/SpecialistPracticeBoardView.vue'
import AdminWorkQueueView from '../views/AdminWorkQueueView.vue'
import AdminInboxView from '../views/AdminInboxView.vue'
import AdminBillingAccessRequestsView from '../views/AdminBillingAccessRequestsView.vue'
import AdminBillingAccessRequestDetailView from '../views/AdminBillingAccessRequestDetailView.vue'
import AdminSpecialistsSearchView from '../views/AdminSpecialistsSearchView.vue'
import AdminSpecialistDetailView from '../views/AdminSpecialistDetailView.vue'
import { useAuthStore } from '../stores/auth'
import { fetchSpecialistProfile } from '../lib/api'
import {
  hasAdminRole,
  hasClientRole,
  hasSpecialistRole,
  isSpecialistCriticalReconcileRoute,
  normalizeUserRoles,
} from '../lib/entitlementReconcile'

const routes = [
  { path: '/', name: 'home', component: HomeView },
  { path: '/tour', name: 'tour', redirect: { path: '/', hash: '#how-it-works' } },
  { path: '/public', name: 'public-redirect', component: PublicProfileView },
  { path: '/login', name: 'login', component: LoginView },
  {
    path: '/account/email-change/confirm/:token',
    name: 'account-email-change-confirm',
    component: AccountEmailChangeConfirmView,
  },
  { path: '/signup', name: 'signup', component: SignupView },
  { path: '/signup-client', name: 'signup-client', component: ClientSignupView },
  {
    path: '/client/invite/:token',
    name: 'client-record-account-invite',
    component: ClientRecordAccountInviteView,
    meta: { minimalShell: true },
  },
  { path: '/invite/:token', name: 'group-invite-join', component: GroupInviteJoinView },
  {
    path: '/guest/external-session/:token',
    name: 'guest-external-session',
    component: ExternalGuestSessionInviteView,
    meta: { minimalShell: true },
  },
  {
    path: '/guest/booking-time-proposal/:token',
    name: 'guest-booking-time-proposal',
    component: PublicGuestBookingTimeProposalView,
    meta: { minimalShell: true },
  },
  {
    path: '/admin/work-queue',
    name: 'admin-work-queue',
    component: AdminWorkQueueView,
    meta: { requiresAuth: true, requiresRole: 'ADMIN' },
  },
  {
    path: '/admin/inbox',
    name: 'admin-inbox',
    component: AdminInboxView,
    meta: { requiresAuth: true, requiresRole: 'ADMIN' },
  },
  {
    path: '/admin/inbox/:id(\\d+)',
    name: 'admin-inbox-item',
    component: AdminInboxView,
    meta: { requiresAuth: true, requiresRole: 'ADMIN' },
  },
  {
    path: '/admin/billing-access-requests',
    name: 'admin-billing-access-requests',
    component: AdminBillingAccessRequestsView,
    meta: { requiresAuth: true, requiresRole: 'ADMIN' },
  },
  {
    path: '/admin/billing-access-requests/:id(\\d+)',
    name: 'admin-billing-access-request-detail',
    component: AdminBillingAccessRequestDetailView,
    meta: { requiresAuth: true, requiresRole: 'ADMIN' },
  },
  {
    path: '/admin/specialists',
    name: 'admin-specialists',
    component: AdminSpecialistsSearchView,
    meta: { requiresAuth: true, requiresRole: 'ADMIN' },
  },
  {
    path: '/admin/specialists/:id(\\d+)',
    name: 'admin-specialist-detail',
    component: AdminSpecialistDetailView,
    meta: { requiresAuth: true, requiresRole: 'ADMIN' },
  },
  {
    path: '/cabinet',
    name: 'cabinet',
    component: CabinetView,
    meta: { requiresAuth: true, requiresRole: 'SPECIALIST' },
  },
  {
    path: '/cabinet/group-events',
    name: 'cabinet-group-events',
    component: GroupEventsView,
    meta: { requiresAuth: true, requiresRole: 'SPECIALIST' },
  },
  {
    path: '/cabinet/schedule',
    name: 'cabinet-schedule',
    component: SlotsView,
    meta: { requiresAuth: true, requiresRole: 'SPECIALIST' },
  },
  {
    path: '/cabinet/slots',
    name: 'cabinet-slots',
    component: SlotsView,
    meta: { requiresAuth: true, requiresRole: 'SPECIALIST' },
  },
  {
    path: '/cabinet/availability-rules',
    name: 'cabinet-availability-rules',
    redirect: { path: '/cabinet/slots', query: { tab: 'availability' } },
    meta: { requiresAuth: true, requiresRole: 'SPECIALIST' },
  },
  {
    path: '/cabinet/availability-exceptions',
    name: 'cabinet-schedule-vacation',
    component: AvailabilityRulesView,
    meta: { requiresAuth: true, requiresRole: 'SPECIALIST' },
  },
  {
    path: '/cabinet/clients',
    name: 'cabinet-clients',
    component: SpecialistClientsView,
    meta: { requiresAuth: true, requiresRole: 'SPECIALIST' },
  },
  {
    path: '/cabinet/clients/:clientId(\\d+)/workbook',
    name: 'cabinet-client-workbook',
    component: SpecialistClientWorkbookView,
    meta: { requiresAuth: true, requiresRole: 'SPECIALIST' },
  },
  {
    path: '/cabinet/chat',
    name: 'cabinet-chat',
    component: ChatView,
    meta: { requiresAuth: true, requiresRole: 'SPECIALIST' },
  },
  {
    path: '/cabinet/inquiries',
    name: 'cabinet-inquiries',
    component: SpecialistInquiriesView,
    meta: { requiresAuth: true, requiresRole: 'SPECIALIST' },
  },
  {
    path: '/cabinet/billing',
    name: 'cabinet-billing',
    component: BillingView,
    meta: { requiresAuth: true, requiresRole: 'SPECIALIST' },
  },
  {
    path: '/cabinet/analytics',
    name: 'cabinet-analytics',
    component: AnalyticsView,
    meta: { requiresAuth: true, requiresRole: 'SPECIALIST' },
  },
  {
    path: '/cabinet/sessions',
    name: 'cabinet-sessions',
    component: SpecialistSessionsView,
    meta: { requiresAuth: true, requiresRole: 'SPECIALIST' },
  },
  {
    path: '/cabinet/external-sessions',
    name: 'cabinet-external-sessions',
    component: ExternalSessionsView,
    meta: { requiresAuth: true, requiresRole: 'SPECIALIST' },
  },
  {
    path: '/cabinet/practice-board',
    name: 'cabinet-practice-board',
    component: SpecialistPracticeBoardView,
    meta: { requiresAuth: true, requiresRole: 'SPECIALIST' },
  },
  {
    path: '/cabinet/external-sessions/:id(\\d+)',
    name: 'cabinet-external-session-detail',
    component: ExternalSessionDetailView,
    meta: { requiresAuth: true, requiresRole: 'SPECIALIST' },
  },
  {
    path: '/cabinet/sessions/:id(\\d+)',
    name: 'cabinet-session-detail',
    component: SpecialistSessionDetailView,
    meta: { requiresAuth: true, requiresRole: 'SPECIALIST' },
  },
  {
    path: '/cabinet/reviews',
    name: 'cabinet-reviews',
    component: SpecialistReviewsView,
    meta: { requiresAuth: true, requiresRole: 'SPECIALIST' },
  },
  {
    path: '/cabinet/profile',
    name: 'cabinet-profile',
    component: SpecialistProfileView,
    meta: { requiresAuth: true, requiresRole: 'SPECIALIST' },
  },
  {
    path: '/cabinet/settings',
    name: 'cabinet-settings',
    component: SettingsHubView,
    meta: { requiresAuth: true, requiresRole: 'SPECIALIST' },
  },
  {
    path: '/cabinet/settings/notifications',
    name: 'cabinet-settings-notifications',
    component: NotificationSettingsView,
    meta: { requiresAuth: true, requiresRole: 'SPECIALIST' },
  },
  {
    path: '/cabinet/journal',
    name: 'cabinet-journal',
    component: AuthorJournalView,
    meta: { requiresAuth: true, requiresRole: 'SPECIALIST' },
  },
  {
    path: '/cabinet/journal/:postId/preview/:postSlug?',
    name: 'cabinet-journal-preview',
    component: PublicJournalPostView,
    meta: { requiresAuth: true, requiresRole: 'SPECIALIST' },
  },
  {
    path: '/client',
    name: 'client-dashboard',
    component: ClientDashboardView,
    meta: { requiresAuth: true, requiresRole: 'CLIENT' },
  },
  {
    path: '/client/profile',
    name: 'client-profile',
    component: ClientProfileView,
    meta: { requiresAuth: true, requiresRole: 'CLIENT' },
  },
  {
    path: '/client/materials',
    name: 'client-materials',
    component: ClientMaterialsView,
    meta: { requiresAuth: true, requiresRole: 'CLIENT' },
  },
  {
    path: '/client/chat',
    name: 'client-chat',
    component: ChatView,
    meta: { requiresAuth: true, requiresRole: 'CLIENT' },
  },
  {
    path: '/client/inquiries/:specialistId(\\d+)',
    name: 'client-inquiry-redirect',
    component: ClientInquiryRedirectView,
    meta: { requiresAuth: true, requiresRole: 'CLIENT' },
  },
  {
    path: '/client/sessions/:id',
    name: 'client-session-detail',
    component: ClientSessionDetailView,
    meta: { requiresAuth: true, requiresRole: 'CLIENT' },
  },
  {
    path: '/client/specialists',
    name: 'client-specialists',
    redirect: { name: 'public-specialists' },
    meta: { requiresAuth: true, requiresRole: 'CLIENT' },
  },
  {
    path: '/client/therapists',
    name: 'client-therapists',
    redirect: { name: 'client-specialists' },
    meta: { requiresAuth: true, requiresRole: 'CLIENT' },
  },
  {
    path: '/client/group-events/:id',
    name: 'client-group-event',
    component: ClientGroupEventView,
    meta: { requiresAuth: true, requiresRole: 'CLIENT' },
  },
  {
    path: '/s/:slug/feedback',
    name: 'specialist-feedback',
    component: ClientFeedbackView,
    alias: ['/specialist/:slug/feedback'],
    meta: {},
  },
  {
    path: '/s/:slug',
    name: 'public-profile',
    component: PublicProfileView,
    alias: ['/t/:slug', '/specialist/:slug'],
  },
  {
    path: '/s/:slug/journal',
    name: 'public-journal',
    component: PublicJournalView,
    alias: ['/t/:slug/journal', '/specialist/:slug/journal'],
  },
  {
    path: '/s/:slug/journal/:postSlug',
    name: 'public-journal-post',
    component: PublicJournalPostView,
    alias: ['/:slug/journal/:postSlug', '/t/:slug/journal/:postSlug', '/specialist/:slug/journal/:postSlug'],
  },
  {
    path: '/s/:specialist_slug/journal/collections/:collection_slug',
    name: 'public-journal-collection',
    component: PublicJournalCollectionView,
    alias: [
      '/:specialist_slug/journal/collections/:collection_slug',
      '/t/:specialist_slug/journal/collections/:collection_slug',
      '/specialist/:specialist_slug/journal/collections/:collection_slug',
    ],
  },
  {
    path: '/specialists',
    name: 'public-specialists',
    component: PublicSpecialistsView,
  },
  { path: '/therapists', redirect: { name: 'public-specialists' } },
  { path: '/public/therapists', redirect: { name: 'public-specialists' } },
  { path: '/public/specialists', redirect: { name: 'public-specialists' } },
  { path: '/pricing', redirect: '/#pricing' },
  { path: '/faq', name: 'faq', component: FaqView },
  { path: '/terms', name: 'terms', component: TermsView, meta: {} },
  { path: '/privacy', name: 'privacy', component: PrivacyView, meta: {} },
  { path: '/disclaimer', name: 'disclaimer', component: DisclaimerView, meta: {} },
  {
    path: '/support-and-data-requests',
    name: 'support-and-data-requests',
    component: SupportAndDataRequestsView,
    meta: {},
  },
  { path: '/policy/feedback', name: 'feedback-policy', component: FeedbackPolicyView },
  { path: '/403', name: 'forbidden', component: ForbiddenView },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.hash) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            el: to.hash,
            top: 0,
            behavior: 'smooth',
          })
        }, 120)
      })
    }
    return { top: 0 }
  },
})

const SPECIALIST_ROUTE_RECONCILE_COOLDOWN_MS = 15_000
let lastSpecialistRouteReconcileAt = 0

type SpecialistProfileRouteContract = {
  slug?: string
  public_slug?: string
  public_profile_path?: string
  public_profile_url?: string
  public_profile_enabled?: boolean | null
}

function normalizePublicProfilePath(path: string | null | undefined): string {
  const raw = String(path || '').trim()
  if (!raw) return ''
  if (/^https?:\/\//i.test(raw)) {
    try {
      const parsed = new URL(raw)
      return parsed.pathname || ''
    } catch {
      return ''
    }
  }
  return raw.startsWith('/') ? raw : `/${raw}`
}

function extractCanonicalSlugFromPath(path: string | null | undefined): string {
  const normalizedPath = normalizePublicProfilePath(path)
  const match = normalizedPath.match(/^\/s\/([^/?#]+)/i)
  if (!match?.[1]) return ''
  return match[1].trim()
}

function resolveSpecialistProfilePath(profile: SpecialistProfileRouteContract): string {
  const fromPath = normalizePublicProfilePath(profile.public_profile_path)
  if (fromPath) return fromPath
  const fromUrl = normalizePublicProfilePath(profile.public_profile_url)
  if (fromUrl) return fromUrl
  const slug = String(profile.slug || profile.public_slug || '').trim()
  if (!slug) return ''
  return `/s/${slug}`
}

function resolveSpecialistProfileSlug(profile: SpecialistProfileRouteContract): string {
  const direct = String(profile.slug || profile.public_slug || '').trim()
  if (direct) return direct
  const fromPath = extractCanonicalSlugFromPath(profile.public_profile_path)
  if (fromPath) return fromPath
  return extractCanonicalSlugFromPath(profile.public_profile_url)
}

async function maybeReconcileSpecialistMeOnRoute(auth: ReturnType<typeof useAuthStore>, path: string) {
  if (!auth.accessToken) return
  if (!isSpecialistCriticalReconcileRoute(path)) return
  const roles = normalizeUserRoles(auth.me?.user ?? auth.user)
  if (!hasSpecialistRole(roles)) return

  const now = Date.now()
  if (now - lastSpecialistRouteReconcileAt < SPECIALIST_ROUTE_RECONCILE_COOLDOWN_MS) return

  lastSpecialistRouteReconcileAt = now
  try {
    await auth.loadMe()
  } catch {
    // silent reconcile: best effort only
  }
}

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  let ensureAuthResolvedRan = false
  let ensureAuthResolvedForceRan = false

  const getRoles = () => normalizeUserRoles(auth.me?.user ?? auth.user)
  const hasRole = (role: string) => getRoles().includes(role.toUpperCase())
  const hasAdmin = () => hasAdminRole(getRoles())
  const hasSpecialist = () => hasSpecialistRole(getRoles())
  const hasClient = () => hasClientRole(getRoles())
  const guardSnapshot = () => ({
    targetPath: to.fullPath,
    targetName: String(to.name || ''),
    matchedRoutes: to.matched.map((record) => ({
      name: String(record.name || ''),
      path: record.path,
      meta: { ...record.meta },
    })),
    authResolved: auth.authResolved,
    ensureAuthResolvedRan,
    ensureAuthResolvedForceRan,
    accessTokenPresent: Boolean(auth.accessToken),
    normalizedRoles: getRoles(),
    userRole: typeof auth.user?.role === 'string' ? auth.user.role : null,
    userRoles: Array.isArray(auth.user?.roles) ? auth.user?.roles : [],
    meUserRole: typeof auth.me?.user?.role === 'string' ? auth.me.user.role : null,
    meUserRoles: Array.isArray(auth.me?.user?.roles) ? auth.me.user.roles : [],
    isAdmin: hasAdmin(),
    requiresAuth: Boolean(to.meta.requiresAuth),
    requiresRole: String(to.meta.requiresRole || ''),
  })
  const denyForbidden = (reason: string, extra: Record<string, unknown> = {}) => {
    const payload = {
      ...guardSnapshot(),
      reason,
      ...extra,
    }
    console.warn('[admin-guard-deny]', payload)
    return { name: 'forbidden', query: { reason } }
  }
  const roleMatches = (role: string) => {
    if (role === 'SPECIALIST') return hasSpecialist()
    if (role === 'ADMIN') return hasAdmin()
    return hasRole(role)
  }
  const defaultRoute = () => {
    if (hasSpecialist()) return { name: 'cabinet' }
    if (hasClient()) return { name: 'client-dashboard' }
    if (hasAdmin()) return { name: 'admin-inbox' }
    return denyForbidden('fallback-guard-deny', { source: 'default-route' })
  }
  let loadedMeInGuard = false

  if (to.meta.requiresAuth) {
    ensureAuthResolvedRan = true
    const hasSession = await auth.ensureAuthResolved().catch(() => false)
    if (!hasSession) {
      if (to.name === 'public-specialists') {
        return { name: 'signup-client' }
      }
      return { name: 'login' }
    }
    if (!auth.user) {
      const needsAdminRole = String(to.meta.requiresRole || '').toUpperCase() === 'ADMIN'
      if (!needsAdminRole) return
      ensureAuthResolvedForceRan = true
      const refreshed = await auth.ensureAuthResolved({ force: true }).catch(() => false)
      if (!refreshed || !auth.user) {
        return denyForbidden('auth-unresolved', { source: 'admin-force-resolve' })
      }
    }

    if (to.meta.requiresRole && auth.user && !roleMatches(String(to.meta.requiresRole))) {
      if (to.name === 'public-specialists' && hasSpecialist()) {
        return { name: 'cabinet' }
      }
      const requiredRole = String(to.meta.requiresRole || '').toUpperCase()
      const reason = requiredRole === 'ADMIN' ? 'admin-role-missing' : 'route-meta-admin-check-failed'
      return denyForbidden(reason, { requiredRole })
    }
  }

  if (!loadedMeInGuard) {
    await maybeReconcileSpecialistMeOnRoute(auth, to.path)
  }

  if (to.name === 'login' && auth.accessToken) {
    if (!auth.me) {
      try {
        await auth.loadMe()
      } catch {
        return
      }
    }
    return defaultRoute()
  }

  if (to.name === 'public-redirect') {
    if (!auth.accessToken) {
      return { name: 'login' }
    }
    if (!auth.me) {
      try {
        await auth.loadMe()
      } catch {
        return { name: 'login' }
      }
    }
    if (!hasSpecialist()) {
      return defaultRoute()
    }
    let profilePath = ''
    let slug = ''
    let publicProfileEnabled = false
    try {
      const profile = await fetchSpecialistProfile() as SpecialistProfileRouteContract
      profilePath = resolveSpecialistProfilePath(profile)
      slug = resolveSpecialistProfileSlug(profile)
      publicProfileEnabled = Boolean(profile.public_profile_enabled)
    } catch {
      profilePath = ''
      slug = ''
      publicProfileEnabled = false
    }
    if (profilePath && publicProfileEnabled) {
      return profilePath
    }
    if (slug && !publicProfileEnabled) {
      return { name: 'cabinet-profile', query: { public_profile: 'unpublished' } }
    }
    return { name: 'cabinet-profile' }
  }
})

export default router
