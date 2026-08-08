import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'
import { captureSpecialistRegistrationFirstTouch } from './lib/registrationAttribution'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(router)

const authStore = useAuthStore(pinia)
captureSpecialistRegistrationFirstTouch()
authStore.initFromStorage()
authStore.restoreSession().catch(() => {})

app.mount('#app')
