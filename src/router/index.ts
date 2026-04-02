import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import SignupView from '../views/SignupView.vue'
import ClientSignupView from '../views/ClientSignupView.vue'
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
import NotificationSettingsView from '../views/NotificationSettingsView.vue'
import SettingsHubView from '../views/SettingsHubView.vue'
import SpecialistInquiriesView from '../views/SpecialistInquiriesView.vue'
import ClientInquiryRedirectView from '../views/ClientInquiryRedirectView.vue'
import GuestSessionInviteView from '../views/GuestSessionInviteView.vue'
import { useAuthStore } from '../stores/auth'
import { fetchSpecialistProfile } from '../lib/api'
import { hasSpecialistRole, isSpecialistCriticalReconcileRoute } from '../lib/entitlementReconcile'

const routes = [
  { path: '/', name: 'home', component: HomeView },
  { path: '/public', name: 'public-redirect', component: PublicProfileView },
  { path: '/login', name: 'login', component: LoginView },
  { path: '/signup', name: 'signup', component: SignupView },
  { path: '/signup-client', name: 'signup-client', component: ClientSignupView },
  { path: '/invite/:token', name: 'group-invite-join', component: GroupInviteJoinView },
  {
    path: '/guest/session/:token',
    name: 'guest-session',
    component: GuestSessionInviteView,
    meta: { minimalShell: true },
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
    redirect: { name: 'cabinet-availability-rules' },
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
    component: AvailabilityRulesView,
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
    path: '/specialist/:slug/feedback',
    name: 'specialist-feedback',
    component: ClientFeedbackView,
    meta: {},
  },
  { path: '/t/:slug', name: 'public-profile', component: PublicProfileView, alias: '/specialist/:slug' },
  {
    path: '/t/:slug/journal',
    name: 'public-journal',
    component: PublicJournalView,
    alias: '/specialist/:slug/journal',
  },
  {
    path: '/:slug/journal/:postSlug',
    name: 'public-journal-post',
    component: PublicJournalPostView,
    alias: ['/t/:slug/journal/:postSlug', '/specialist/:slug/journal/:postSlug'],
  },
  {
    path: '/:specialist_slug/journal/collections/:collection_slug',
    name: 'public-journal-collection',
    component: PublicJournalCollectionView,
    alias: [
      '/t/:specialist_slug/journal/collections/:collection_slug',
      '/specialist/:specialist_slug/journal/collections/:collection_slug',
    ],
  },
  {
    path: '/specialists',
    name: 'public-specialists',
    component: PublicSpecialistsView,
    meta: { requiresAuth: true, requiresRole: 'CLIENT' },
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
            top: 90,
            behavior: 'smooth',
          })
        }, 0)
      })
    }
    return { top: 0 }
  },
})

const SPECIALIST_ROUTE_RECONCILE_COOLDOWN_MS = 15_000
let lastSpecialistRouteReconcileAt = 0

async function maybeReconcileSpecialistMeOnRoute(auth: ReturnType<typeof useAuthStore>, path: string) {
  if (!auth.accessToken) return
  if (!isSpecialistCriticalReconcileRoute(path)) return
  if (!hasSpecialistRole(auth.me?.user.roles ?? auth.user?.roles ?? [])) return

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
  const getRoles = () => auth.me?.user.roles ?? auth.user?.roles ?? []
  const hasRole = (role: string) => getRoles().includes(role)
  const hasSpecialistRole = () => hasRole('SPECIALIST') || hasRole('THERAPIST')
  const roleMatches = (role: string) => {
    if (role === 'SPECIALIST') return hasSpecialistRole()
    return hasRole(role)
  }
  const defaultRoute = () => {
    if (hasSpecialistRole()) return { name: 'cabinet' }
    if (hasRole('CLIENT')) return { name: 'client-dashboard' }
    return { name: 'forbidden' }
  }
  let loadedMeInGuard = false

  if (to.meta.requiresAuth) {
    if (!auth.accessToken) {
      const restored = await auth.restoreSession().catch(() => false)
      if (!restored) {
        if (to.name === 'public-specialists') {
          return { name: 'signup-client' }
        }
        return { name: 'login' }
      }
    }
    if (!auth.user) {
      try {
        await auth.loadMe()
        loadedMeInGuard = true
      } catch {
        if (auth.accessToken) {
          return
        }
        if (to.name === 'public-specialists') {
          return { name: 'signup-client' }
        }
        return { name: 'login' }
      }
    }
    if (to.meta.requiresRole && auth.user && !roleMatches(String(to.meta.requiresRole))) {
      if (to.name === 'public-specialists' && hasSpecialistRole()) {
        return { name: 'cabinet' }
      }
      return { name: 'forbidden' }
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
    if (!hasSpecialistRole()) {
      return defaultRoute()
    }
    let slug = ''
    let publicProfileEnabled = false
    try {
      const profile = await fetchSpecialistProfile()
      slug = profile.public_slug || ''
      publicProfileEnabled = Boolean(profile.public_profile_enabled)
    } catch {
      slug = ''
      publicProfileEnabled = false
    }
    if (slug && publicProfileEnabled) {
      return { name: 'public-profile', params: { slug } }
    }
    if (slug && !publicProfileEnabled) {
      return { name: 'cabinet-profile', query: { public_profile: 'unpublished' } }
    }
    return { name: 'cabinet-profile' }
  }
})

export default router
