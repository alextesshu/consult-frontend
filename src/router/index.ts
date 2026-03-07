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
import ClientSessionDetailView from '../views/ClientSessionDetailView.vue'
import ClientGroupEventView from '../views/ClientGroupEventView.vue'
import SpecialistClientsView from '../views/TherapistClientsView.vue'
import BillingView from '../views/BillingView.vue'
import PublicSpecialistsView from '../views/PublicTherapistsView.vue'
import SpecialistReviewsView from '../views/TherapistReviewsView.vue'
import AuthorJournalView from '../views/AuthorJournalView.vue'
import GroupInviteJoinView from '../views/GroupInviteJoinView.vue'
import FaqView from '../views/FaqView.vue'
import FeedbackPolicyView from '../views/FeedbackPolicyView.vue'
import ClientFeedbackView from '../views/ClientFeedbackView.vue'
import NotFoundView from '../views/NotFoundView.vue'
import ForbiddenView from '../views/ForbiddenView.vue'
import ChatView from '../views/ChatView.vue'
import AnalyticsView from '../views/AnalyticsView.vue'
import ClientProfileView from '../views/ClientProfileView.vue'
import { useAuthStore } from '../stores/auth'
import { fetchSpecialistProfile } from '../lib/api'

const routes = [
  { path: '/', name: 'home', component: HomeView },
  { path: '/public', name: 'public-redirect', component: PublicProfileView },
  { path: '/login', name: 'login', component: LoginView },
  { path: '/signup', name: 'signup', component: SignupView },
  { path: '/signup-client', name: 'signup-client', component: ClientSignupView },
  { path: '/invite/:token', name: 'group-invite-join', component: GroupInviteJoinView },
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
    path: '/cabinet/clients',
    name: 'cabinet-clients',
    component: SpecialistClientsView,
    meta: { requiresAuth: true, requiresRole: 'SPECIALIST' },
  },
  {
    path: '/cabinet/chat',
    name: 'cabinet-chat',
    component: ChatView,
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
    redirect: { name: 'cabinet-profile' },
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
      '/:slug/journal/collections/:collectionSlug',
      '/t/:slug/journal/collections/:collectionSlug',
      '/specialist/:slug/journal/collections/:collectionSlug',
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
  { path: '/policy/feedback', name: 'feedback-policy', component: FeedbackPolicyView },
  { path: '/403', name: 'forbidden', component: ForbiddenView },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

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
    return { name: 'login' }
  }

  if (to.meta.requiresAuth) {
    if (!auth.accessToken) {
      if (to.name === 'public-specialists') {
        return { name: 'signup-client' }
      }
      return { name: 'login' }
    }
    if (!auth.user) {
      try {
        await auth.loadMe()
      } catch {
        if (to.name === 'public-specialists') {
          return { name: 'signup-client' }
        }
        return { name: 'login' }
      }
    }
    if (to.meta.requiresRole && !roleMatches(String(to.meta.requiresRole))) {
      if (to.name === 'public-specialists' && hasSpecialistRole()) {
        return { name: 'cabinet' }
      }
      return { name: 'forbidden' }
    }
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
    try {
      const profile = await fetchSpecialistProfile()
      slug = profile.public_slug || ''
    } catch {
      slug = ''
    }
    if (slug) {
      return { name: 'public-profile', params: { slug } }
    }
    return { name: 'cabinet-profile' }
  }
})

export default router
