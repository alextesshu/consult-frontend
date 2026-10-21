import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import './styles/tokens-v2.css'
import './styles/components-v2.css'
import { applyUiVersion } from './lib/uiVersion'
import App from './App.vue'
import { useAuthStore } from './stores/auth'
import {
  captureSpecialistRegistrationFirstTouch,
  getSpecialistRegistrationAttribution,
} from './lib/registrationAttribution'
import {
  browserAttributionForAnalytics,
  normalizedLandingRoute,
  productAnalytics,
} from './lib/productAnalytics'
import { captureEmailVerificationTokenFromLocation } from './lib/emailVerificationToken'
import { captureClientAcquisitionContext } from './lib/clientAcquisitionAttribution'
import {
  getAnalyticsConsentPreference,
  onAnalyticsConsentPreferenceChange,
} from './lib/analyticsConsent'

async function bootstrapApplication() {
  applyUiVersion()
  const app = createApp(App)
  const pinia = createPinia()
  app.use(pinia)
  captureEmailVerificationTokenFromLocation()

  const { default: router } = await import('./router')
  router.afterEach((_to, _from, failure) => {
    if (!failure) applyUiVersion()
  })
  app.use(router)

  const authStore = useAuthStore(pinia)
  captureSpecialistRegistrationFirstTouch()
  productAnalytics.setConsentPreference(getAnalyticsConsentPreference())
  captureClientAcquisitionContext()
  onAnalyticsConsentPreferenceChange((preference) => {
    productAnalytics.setConsentPreference(preference)
  })
  try {
    authStore.initFromStorage()
  } catch {
    // This action only removes legacy storage keys. Cookie-based restore must
    // still run when storage cleanup is unavailable; no stored tokens are used.
  }
  authStore.restoreSession().catch(() => {})

  router.isReady().then(() => {
    const landingRoute = normalizedLandingRoute(router.currentRoute.value.path)
    if (!landingRoute) return
    productAnalytics.capture('landing_viewed', {
      landing_route: landingRoute,
      ...browserAttributionForAnalytics(getSpecialistRegistrationAttribution()),
    })
  })

  app.mount('#app')
}

void bootstrapApplication()
