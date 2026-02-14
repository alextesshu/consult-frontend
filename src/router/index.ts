import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import SignupView from '../views/SignupView.vue'
import CabinetView from '../views/CabinetView.vue'
import GroupEventsView from '../views/GroupEventsView.vue'
import PublicProfileView from '../views/PublicProfileView.vue'
import TherapistProfileView from '../views/TherapistProfileView.vue'
import SlotsView from '../views/SlotsView.vue'
import HomeView from '../views/HomeView.vue'
import ClientDashboardView from '../views/ClientDashboardView.vue'
import ClientTherapistsView from '../views/ClientTherapistsView.vue'
import TherapistSessionsView from '../views/TherapistSessionsView.vue'
import ClientSessionDetailView from '../views/ClientSessionDetailView.vue'
import TherapistClientsView from '../views/TherapistClientsView.vue'
import BillingView from '../views/BillingView.vue'
import PublicTherapistsView from '../views/PublicTherapistsView.vue'
import { useAuthStore } from '../stores/auth'
import { fetchTherapistProfile } from '../lib/api'

const routes = [
  { path: '/', name: 'home', component: HomeView },
  { path: '/public', name: 'public-redirect', component: PublicProfileView },
  { path: '/login', name: 'login', component: LoginView },
  { path: '/signup', name: 'signup', component: SignupView },
  {
    path: '/cabinet',
    name: 'cabinet',
    component: CabinetView,
    meta: { requiresAuth: true, requiresRole: 'THERAPIST' },
  },
  {
    path: '/cabinet/group-events',
    name: 'cabinet-group-events',
    component: GroupEventsView,
    meta: { requiresAuth: true, requiresRole: 'THERAPIST' },
  },
  {
    path: '/cabinet/slots',
    name: 'cabinet-slots',
    component: SlotsView,
    meta: { requiresAuth: true, requiresRole: 'THERAPIST' },
  },
  {
    path: '/cabinet/clients',
    name: 'cabinet-clients',
    component: TherapistClientsView,
    meta: { requiresAuth: true, requiresRole: 'THERAPIST' },
  },
  {
    path: '/cabinet/billing',
    name: 'cabinet-billing',
    component: BillingView,
    meta: { requiresAuth: true, requiresRole: 'THERAPIST' },
  },
  {
    path: '/cabinet/sessions',
    name: 'cabinet-sessions',
    component: TherapistSessionsView,
    meta: { requiresAuth: true, requiresRole: 'THERAPIST' },
  },
  {
    path: '/cabinet/profile',
    name: 'cabinet-profile',
    component: TherapistProfileView,
    meta: { requiresAuth: true, requiresRole: 'THERAPIST' },
  },
  {
    path: '/client',
    name: 'client-dashboard',
    component: ClientDashboardView,
    meta: { requiresAuth: true, requiresRole: 'CLIENT' },
  },
  {
    path: '/client/sessions/:id',
    name: 'client-session-detail',
    component: ClientSessionDetailView,
    meta: { requiresAuth: true, requiresRole: 'CLIENT' },
  },
  {
    path: '/client/therapists',
    name: 'client-therapists',
    component: ClientTherapistsView,
    meta: { requiresAuth: true, requiresRole: 'CLIENT' },
  },
  { path: '/t/:slug', name: 'public-profile', component: PublicProfileView },
  { path: '/public/therapists', name: 'public-therapists', component: PublicTherapistsView },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  const getRoles = () => auth.me?.user.roles ?? auth.user?.roles ?? []
  const hasRole = (role: string) => getRoles().includes(role)
  const defaultRoute = () => {
    if (hasRole('THERAPIST')) return { name: 'cabinet' }
    if (hasRole('CLIENT')) return { name: 'client-dashboard' }
    return { name: 'login' }
  }

  if (to.meta.requiresAuth) {
    if (!auth.accessToken) {
      return { name: 'login' }
    }
    if (!auth.user) {
      try {
        await auth.loadMe()
      } catch {
        return { name: 'login' }
      }
    }
    if (to.meta.requiresRole && !hasRole(String(to.meta.requiresRole))) {
      return defaultRoute()
    }
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
    if (!hasRole('THERAPIST')) {
      return defaultRoute()
    }
    let slug = ''
    try {
      const profile = await fetchTherapistProfile()
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
