import { render, screen } from '@testing-library/vue'
import { createRouter, createWebHistory } from 'vue-router'
import { createPinia } from 'pinia'
import App from '../App.vue'

function renderWithProviders(initialPath = '/') {
  const routes = [
    { path: '/', component: { template: '<div>Home</div>' } },
    { path: '/login', component: { template: '<div>Login</div>' } },
    { path: '/faq', component: { template: '<div>Faq</div>' } },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ]
  const router = createRouter({
    history: createWebHistory(),
    routes,
  })

  router.push(initialPath)
  return router.isReady().then(() =>
    render(App, {
      global: {
        plugins: [createPinia(), router],
      },
    })
  )
}

describe('App shell', () => {
  it('renders footer text', async () => {
    await renderWithProviders('/')
    expect(screen.getByText(/Pro Consult/i)).toBeInTheDocument()
  })
})
