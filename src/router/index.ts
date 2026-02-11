import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import SignupView from '../views/SignupView.vue'
import CabinetView from '../views/CabinetView.vue'
import GroupEventsView from '../views/GroupEventsView.vue'
import PublicProfileView from '../views/PublicProfileView.vue'
import TherapistProfileView from '../views/TherapistProfileView.vue'
import { useAuthStore } from '../stores/auth'

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', name: 'login', component: LoginView },
  { path: '/signup', name: 'signup', component: SignupView },
  { path: '/cabinet', name: 'cabinet', component: CabinetView, meta: { requiresAuth: true } },
  {
    path: '/cabinet/group-events',
    name: 'cabinet-group-events',
    component: GroupEventsView,
    meta: { requiresAuth: true },
  },
  {
    path: '/cabinet/profile',
    name: 'cabinet-profile',
    component: TherapistProfileView,
    meta: { requiresAuth: true },
  },
  { path: '/t/:slug', name: 'public-profile', component: PublicProfileView },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
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
  }
})

export default router
