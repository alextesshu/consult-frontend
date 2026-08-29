import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import router from './router'
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

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
captureEmailVerificationTokenFromLocation()
app.use(router)

const authStore = useAuthStore(pinia)
captureSpecialistRegistrationFirstTouch()
productAnalytics.setConsentPreference(getAnalyticsConsentPreference())
captureClientAcquisitionContext()
onAnalyticsConsentPreferenceChange((preference) => {
  productAnalytics.setConsentPreference(preference)
})
authStore.initFromStorage()
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
