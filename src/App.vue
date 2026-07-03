<template>
  <div
    :class="[
      'shell',
      {
        'shell--home': isHome,
        'shell--minimal': useMinimalShell,
        'shell--authenticated': isAuthenticatedLayout,
        'shell--public-profile': isPublicProfilePage,
      },
    ]"
  >
    <header v-if="!useMinimalShell" :class="topbarClass">
      <div class="topbar__inner">
        <RouterLink class="brand" to="/">
          <span class="brand__logo-frame">
            <img class="brand__logo brand__logo--full" src="/brand/proconsult-logo-dark.png" alt="Pro Consult" />
            <img class="brand__logo brand__logo--mark" src="/brand/proconsult-mark.png" alt="Pro Consult" />
            <span class="brand__mobile-name" aria-hidden="true">Pro Consult</span>
            <span class="brand__text-fallback" aria-hidden="true">PRO CONSULT</span>
          </span>
          <span class="brand__tagline">простір для ведення консультацій</span>
        </RouterLink>
        <nav class="nav">
        <RouterLink
          v-if="isAuthenticated && hasSupportedCabinetRole"
          class="nav__primary-action"
          :to="cabinetRoute"
        >
          {{ cabinetLabel }}
        </RouterLink>
        <RouterLink v-if="isAuthenticated && isAdmin" class="nav__desktop-only" to="/admin/inbox">
          Адмін-запити
        </RouterLink>
        <RouterLink v-if="isAuthenticated && isAdmin" class="nav__desktop-only" to="/admin/specialists">
          Спеціалісти
        </RouterLink>
        <RouterLink v-if="showCatalogNav" class="nav__desktop-only" to="/specialists">Пошук профілю</RouterLink>
        <RouterLink v-if="isAuthenticated && isClient && !isSpecialist" class="nav__desktop-only" to="/signup">
          Стати спеціалістом
        </RouterLink>
        <RouterLink v-if="isAuthenticated && isClient && !isSpecialist" class="nav__desktop-only" to="/client/materials">
          Матеріали
        </RouterLink>
        <RouterLink
          v-if="isAuthenticated && isSpecialist"
          class="nav__desktop-only"
          to="/public"
          :class="{ 'nav-link--active': isPublicRoute }"
        >
          Публічний профіль
        </RouterLink>
        <RouterLink v-if="!isAuthenticated" class="nav__desktop-only" to="/pricing">Тарифи</RouterLink>
        <RouterLink v-if="!isAuthenticated" to="/login">Вхід</RouterLink>
        <RouterLink v-if="!isAuthenticated" class="nav__guest-cta" to="/signup">
          <span v-if="isPublicProfilePage">Для спеціалістів</span>
          <template v-else>
            <span class="nav__guest-cta-full">Спробувати безкоштовно</span>
            <span class="nav__guest-cta-short">Спробувати</span>
          </template>
        </RouterLink>
        <RouterLink
          v-if="isAuthenticated && isChatCapable"
          class="icon-btn nav__desktop-only"
          :to="chatRoute"
          aria-label="Чат"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M4 4h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H8l-4 4v-4H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"
              fill="currentColor"
            />
          </svg>
          <span v-if="chatUnreadCount" class="icon-btn__badge">{{ chatUnreadCount }}</span>
        </RouterLink>
        <div v-if="isAuthenticated && isSpecialist" class="nav__settings nav__desktop-only">
          <button
            ref="settingsButtonRef"
            class="icon-btn"
            type="button"
            aria-label="Налаштування"
            aria-haspopup="menu"
            :aria-expanded="showSettings ? 'true' : 'false'"
            @click="toggleSettings"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M19.14 12.94a7.9 7.9 0 0 0 .06-.94 7.9 7.9 0 0 0-.06-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.2 7.2 0 0 0-1.63-.94L14.4 2.8a.5.5 0 0 0-.5-.4h-3.8a.5.5 0 0 0-.5.4L9.25 5.32a7.2 7.2 0 0 0-1.63.94l-2.39-.96a.5.5 0 0 0-.6.22L2.71 8.84a.5.5 0 0 0 .12.64l2.03 1.58a7.9 7.9 0 0 0-.06.94 7.9 7.9 0 0 0 .06.94L2.83 14.52a.5.5 0 0 0-.12.64l1.92 3.32c.13.22.39.31.6.22l2.39-.96c.5.39 1.05.7 1.63.94l.35 2.52c.04.24.25.4.5.4h3.8c.25 0 .46-.16.5-.4l.35-2.52c.58-.24 1.13-.55 1.63-.94l2.39.96c.22.09.47 0 .6-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58zM12 15.5A3.5 3.5 0 1 1 12 8.5a3.5 3.5 0 0 1 0 7z"
                fill="currentColor"
              />
            </svg>
          </button>
          <div v-if="showSettings" ref="settingsPanelRef" class="settings-menu" role="menu">
            <RouterLink class="settings-menu__item" to="/cabinet/settings" @click="showSettings = false">
              Усі налаштування
            </RouterLink>
            <RouterLink class="settings-menu__item" to="/cabinet/profile" @click="showSettings = false">
              Профіль
            </RouterLink>
            <RouterLink
              class="settings-menu__item"
              to="/cabinet/settings/notifications"
              @click="showSettings = false"
            >
              Сповіщення
            </RouterLink>
            <RouterLink class="settings-menu__item" to="/cabinet/billing" @click="showSettings = false">
              Плани та доступ
            </RouterLink>
          </div>
        </div>
        <div v-if="isAuthenticated" class="nav__notifications">
          <button
            ref="notificationsButtonRef"
            class="icon-btn"
            type="button"
            @click="toggleNotifications"
            aria-label="Сповіщення"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22zm7-6V11a7 7 0 1 0-14 0v5l-2 2v1h18v-1l-2-2z"
                fill="currentColor"
              />
            </svg>
            <span v-if="notificationCount" class="icon-btn__badge">{{ notificationCount }}</span>
          </button>
          <div v-if="showNotifications" ref="notificationsPanelRef" class="notif-panel">
            <div class="notif-panel__header">
              <div class="notif-panel__title">Сповіщення</div>
              <button
                v-if="notificationCount"
                class="btn btn--ghost btn--sm notif-panel__action"
                type="button"
                :disabled="notifs.readAllPending.value"
                @click="notifs.markAllRead"
              >
                {{ notifs.readAllPending.value ? 'Оновлюємо...' : 'Прочитати все' }}
              </button>
            </div>
            <div v-if="notifs.loading.value && !notifs.loaded.value" class="muted">Завантаження...</div>
            <div v-else-if="notifications.length === 0" class="muted">Немає нових сповіщень.</div>
            <div v-else class="notif-list">
              <article
                v-for="item in notifications"
                :key="item.id"
                class="notif-item-shell"
              >
                <button
                  v-if="notificationButtonTarget(item)"
                  class="notif-item"
                  :class="{ 'notif-item--read': !item.unread }"
                  type="button"
                  @click="onNotificationSpaClick(item)"
                >
                  <span class="notif-item__dot" :class="`notif-item__dot--${item.tone}`"></span>
                  <div>
                    <div class="notif-item__text">{{ item.text }}</div>
                    <div class="muted notif-item__hint">{{ item.hint }}</div>
                  </div>
                </button>
                <RouterLink
                  v-else-if="notificationSpaTarget(item)"
                  class="notif-item"
                  :class="{ 'notif-item--read': !item.unread }"
                  :to="notificationSpaTarget(item)"
                  @click="onMarkNotificationRead(item)"
                >
                  <span class="notif-item__dot" :class="`notif-item__dot--${item.tone}`"></span>
                  <div>
                    <div class="notif-item__text">{{ item.text }}</div>
                    <div class="muted notif-item__hint">{{ item.hint }}</div>
                  </div>
                </RouterLink>
                <a
                  v-else
                  class="notif-item"
                  :class="{ 'notif-item--read': !item.unread }"
                  :href="notificationExternalTarget(item)"
                  @click="onMarkNotificationRead(item)"
                >
                  <span class="notif-item__dot" :class="`notif-item__dot--${item.tone}`"></span>
                  <div>
                    <div class="notif-item__text">{{ item.text }}</div>
                    <div class="muted notif-item__hint">{{ item.hint }}</div>
                  </div>
                </a>
                <div v-if="item.join_url" class="notif-item__actions">
                  <a
                    class="btn btn--ghost btn--sm"
                    :href="item.join_url"
                    target="_blank"
                    rel="noopener noreferrer"
                    @click.stop="onMarkNotificationRead(item)"
                  >
                    Приєднатися
                  </a>
                </div>
              </article>
            </div>
          </div>
        </div>
        <button
          v-if="isAuthenticated"
          ref="mobileMenuButtonRef"
          class="icon-btn nav__mobile-only"
          type="button"
          aria-label="Меню"
          aria-haspopup="menu"
          :aria-expanded="showMobileMenu ? 'true' : 'false'"
          @click="toggleMobileMenu"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M4 7h16M4 12h16M4 17h16"
              fill="none"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-width="2"
            />
          </svg>
        </button>
        <button v-if="isAuthenticated" class="btn btn--ghost nav__desktop-only" type="button" @click="onLogout">
          Вийти
        </button>
        <div v-if="isAuthenticated && showMobileMenu" ref="mobileMenuPanelRef" class="mobile-menu" role="menu">
          <RouterLink
            v-if="hasSupportedCabinetRole && !isSpecialist"
            class="mobile-menu__item"
            :to="cabinetRoute"
            @click="closeMobileMenu"
          >
            {{ cabinetLabel }}
          </RouterLink>
          <RouterLink
            v-if="isAdmin"
            class="mobile-menu__item"
            to="/admin/inbox"
            @click="closeMobileMenu"
          >
            Адмін-запити
          </RouterLink>
          <RouterLink
            v-if="isAdmin"
            class="mobile-menu__item"
            to="/admin/specialists"
            @click="closeMobileMenu"
          >
            Спеціалісти
          </RouterLink>
          <RouterLink v-if="isSpecialist" class="mobile-menu__item" to="/public" @click="closeMobileMenu">
            Публічний профіль (перегляд)
          </RouterLink>
          <RouterLink
            v-if="isClient && !isSpecialist"
            class="mobile-menu__item"
            to="/signup"
            @click="closeMobileMenu"
          >
            Стати спеціалістом
          </RouterLink>
          <RouterLink
            v-if="isClient && !isSpecialist"
            class="mobile-menu__item"
            to="/client/materials"
            @click="closeMobileMenu"
          >
            Матеріали
          </RouterLink>
          <RouterLink
            v-if="isSpecialist"
            class="mobile-menu__item"
            to="/cabinet/settings"
            @click="closeMobileMenu"
          >
            Налаштування
          </RouterLink>
          <RouterLink v-if="isChatCapable && !isSpecialist" class="mobile-menu__item" :to="chatRoute" @click="closeMobileMenu">Чат</RouterLink>
          <button type="button" class="mobile-menu__item mobile-menu__item--button" @click="onLogoutFromMenu">
            Вийти
          </button>
        </div>
        </nav>
      </div>
    </header>

    <main
      :class="[
        'main',
        {
          'main--home': isHome,
          'main--public-profile': isPublicProfilePage,
          'main--tour': isTour,
          'main--authenticated': isAuthenticatedLayout,
          'main--specialist-shell': showSpecialistCabinetShell,
        },
      ]"
    >
      <div v-if="showSpecialistCabinetShell" class="specialist-shell">
        <aside class="specialist-sidebar" role="navigation" aria-label="Навігація кабінету спеціаліста">
          <div class="specialist-sidebar__label">Кабінет</div>
          <nav class="specialist-sidebar__nav">
            <RouterLink
              v-for="item in specialistSidebarItems"
              :key="item.to"
              class="specialist-sidebar__link"
              :class="{ 'is-active': isSpecialistSidebarItemActive(item) }"
              :to="item.to"
              :title="item.title || item.label"
            >
              <span class="specialist-sidebar__link-label">{{ item.label }}</span>
              <span v-if="item.badge" class="specialist-sidebar__badge" aria-hidden="true">{{ item.badge }}</span>
            </RouterLink>
          </nav>
        </aside>
        <section class="specialist-content">
          <div class="specialist-mobile-nav">
            <button
              class="btn btn--ghost specialist-mobile-nav__toggle"
              type="button"
              aria-controls="specialist-mobile-drawer"
              :aria-expanded="showSpecialistSidebarDrawer ? 'true' : 'false'"
              @click="toggleSpecialistSidebarDrawer"
            >
              Розділи кабінету
            </button>
          </div>
          <div
            v-if="showSpecialistSidebarDrawer"
            class="specialist-mobile-drawer"
            id="specialist-mobile-drawer"
            role="dialog"
            aria-label="Розділи кабінету спеціаліста"
          >
            <button
              class="specialist-mobile-drawer__backdrop"
              type="button"
              aria-label="Закрити меню кабінету"
              @click="closeSpecialistSidebarDrawer"
            ></button>
            <div class="specialist-mobile-drawer__panel">
              <div class="specialist-mobile-drawer__header">
                <div class="specialist-sidebar__label">Кабінет</div>
                <button
                  class="icon-btn specialist-mobile-drawer__close"
                  type="button"
                  aria-label="Закрити меню кабінету"
                  @click="closeSpecialistSidebarDrawer"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M6 6l12 12M18 6L6 18"
                      fill="none"
                      stroke="currentColor"
                      stroke-linecap="round"
                      stroke-width="2"
                    />
                  </svg>
                </button>
              </div>
              <nav class="specialist-sidebar__nav">
                <RouterLink
                  v-for="item in specialistSidebarItems"
                  :key="`mobile-${item.to}`"
                  class="specialist-sidebar__link"
                  :class="{ 'is-active': isSpecialistSidebarItemActive(item) }"
                  :to="item.to"
                  :title="item.title || item.label"
                  @click="closeSpecialistSidebarDrawer"
                >
                  <span class="specialist-sidebar__link-label">{{ item.label }}</span>
                  <span v-if="item.badge" class="specialist-sidebar__badge" aria-hidden="true">{{ item.badge }}</span>
                </RouterLink>
              </nav>
            </div>
          </div>
          <RouterView :key="route.fullPath" />
        </section>
      </div>
      <RouterView v-else :key="route.fullPath" />
    </main>
    <ScrollToTopButton v-if="showGlobalScrollTopButton" />
    <ToastHost />
    <footer
      v-if="!useMinimalShell"
      :class="[
        'footer',
        {
          'footer--cabinet': isCabinetRoute,
          'footer--public': !isCabinetRoute,
          'footer--home': isHome,
        },
      ]"
    >
      <template v-if="isCabinetRoute">
        <div class="footer__cabinet-brand">
          <span class="footer__brand-lockup">
            <img class="footer__logo footer__logo--cabinet" src="/brand/proconsult-logo-dark.png" alt="Pro Consult" />
            <span class="footer__name footer__text-fallback">Pro Consult</span>
          </span>
          <span>Без комісій. Без посередників. З повагою до практики.</span>
        </div>
        <div v-if="showStagingDeployMarker" class="footer__deploy" aria-label="staging-deploy-marker">
          <span class="footer__deploy-env">Staging</span>
          <span class="footer__deploy-build">FE {{ buildMarkerText }}</span>
        </div>
        <div class="footer__legal footer__legal--compact">
          <RouterLink class="footer__link" to="/terms">Умови користування</RouterLink>
          <RouterLink class="footer__link" to="/privacy">Політика конфіденційності</RouterLink>
          <RouterLink class="footer__link" to="/faq">Питання та відповіді</RouterLink>
          <RouterLink class="footer__link" to="/support-and-data-requests">Підтримка</RouterLink>
        </div>
      </template>
      <template v-else>
        <div class="footer__intro">
          <div>
            <div class="footer__brand-lockup footer__brand-lockup--public">
              <img class="footer__logo footer__logo--dark" src="/brand/proconsult-logo-dark.png" alt="Pro Consult" />
              <img class="footer__logo footer__logo--light" src="/brand/proconsult-logo-light.png" alt="Pro Consult" />
              <span class="footer__eyebrow footer__text-fallback">PRO CONSULT</span>
            </div>
            <p class="footer__lead">Простір для ведення консультацій.</p>
          </div>
          <p class="footer__description">
            Публічний профіль, запити, сесії, календар, власний блог і робочі матеріали без комісій з консультацій.
          </p>
        </div>
        <nav class="footer__columns" aria-label="Навігація footer">
          <section class="footer__column" aria-labelledby="footer-product-title">
            <h2 id="footer-product-title" class="footer__column-title">Продукт</h2>
            <RouterLink class="footer__link" to="/#features">Можливості</RouterLink>
            <RouterLink class="footer__link" to="/specialists">Знайти профіль спеціаліста</RouterLink>
            <span class="footer__text">Публічний профіль</span>
            <span class="footer__text">Запити без реєстрації</span>
            <span class="footer__text">Сесії та календар</span>
            <span class="footer__text">Власний блог</span>
            <span class="footer__text">Задачі</span>
            <RouterLink class="footer__link" to="/pricing">Без комісій</RouterLink>
          </section>
          <section class="footer__column" aria-labelledby="footer-specialists-title">
            <h2 id="footer-specialists-title" class="footer__column-title">Для спеціалістів</h2>
            <RouterLink class="footer__link" to="/pricing">Тарифи</RouterLink>
            <RouterLink class="footer__link" to="/faq">Питання та відповіді</RouterLink>
            <RouterLink class="footer__link" to="/login">Увійти</RouterLink>
            <RouterLink class="footer__link" to="/signup">Створити простір</RouterLink>
          </section>
          <section class="footer__column" aria-labelledby="footer-legal-title">
            <h2 id="footer-legal-title" class="footer__column-title">Правова інформація</h2>
            <RouterLink class="footer__link" to="/terms">Умови користування</RouterLink>
            <RouterLink class="footer__link" to="/privacy">Політика конфіденційності</RouterLink>
            <RouterLink class="footer__link" to="/disclaimer">Дисклеймер</RouterLink>
            <RouterLink class="footer__link" to="/support-and-data-requests">Підтримка та запити щодо даних</RouterLink>
          </section>
        </nav>
        <div class="footer__bottom">
          <span>Без комісій. Без посередників. З повагою до практики.</span>
          <div v-if="showStagingDeployMarker" class="footer__deploy" aria-label="staging-deploy-marker">
            <span class="footer__deploy-env">Staging</span>
            <span class="footer__deploy-build">FE {{ buildMarkerText }}</span>
          </div>
        </div>
      </template>
    </footer>
    <div
      v-if="showMinimalShellDeployMarker"
      class="deploy-marker deploy-marker--minimal"
      aria-label="staging-deploy-marker"
    >
      <span class="deploy-marker__env">Staging</span>
      <span class="deploy-marker__build">FE {{ buildMarkerText }}</span>
    </div>
    <div
      id="fe-build-probe"
      aria-hidden="true"
      :data-build-marker="buildMarkerText"
      :data-deploy-env="deployEnv || 'unknown'"
      :data-runtime-host="runtimeHost || 'unknown'"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from './stores/auth'
import ToastHost from './components/ToastHost.vue'
import ScrollToTopButton from './components/ScrollToTopButton.vue'
import { apiGet, fetchChatUnreadCount } from './lib/api'
import { normalizeMeetingUrl, canJoinExternalMeeting } from './lib/sessionExecution'
import { hasAdminRole, hasClientRole, hasSpecialistRole, normalizeUserRoles } from './lib/entitlementReconcile'
import { resolveDjangoAdminUrl, spaRouteTargetPath } from './lib/navigationTargets'
import { useToast } from './composables/useToast'
import { useNotifications, type BellNotification } from './composables/useNotifications'
import type { ToastAction } from './stores/toast'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const isAuthenticated = computed(() => Boolean(auth.accessToken))
const isHome = computed(() => route.path === '/')
const isTour = computed(() => route.path === '/tour')
const isCabinetRoute = computed(() => route.path.startsWith('/cabinet'))
const useMinimalShell = computed(() => Boolean(route.meta?.minimalShell))
const isAuthenticatedLayout = computed(
  () => isAuthenticated.value && !useMinimalShell.value && !isHome.value
)
const runtimeHost = typeof window !== 'undefined' ? window.location.hostname.toLowerCase() : ''
const deployEnv = String(import.meta.env.VITE_DEPLOY_ENV || '').trim().toLowerCase()
const apiBaseUrl = String(import.meta.env.VITE_API_BASE_URL || '').trim().toLowerCase()
const buildSha = String(import.meta.env.VITE_BUILD_SHA || '').trim()
const buildVersion = String(import.meta.env.VITE_BUILD_VERSION || '').trim()
const runtimeBundleBuildId = (() => {
  if (typeof document === 'undefined') return ''
  const script = document.querySelector<HTMLScriptElement>('script[src*="/assets/index-"]')
  if (!script?.src) return ''
  const match = script.src.match(/\/assets\/index-([A-Za-z0-9_-]+)\.js/)
  return match?.[1] || ''
})()
const buildShaShort = computed(() => {
  if (buildSha && buildSha.toLowerCase() !== 'unknown') return buildSha.slice(0, 8)
  return runtimeBundleBuildId || 'unknown'
})
const showStagingDeployMarker = computed(
  () =>
    deployEnv === 'staging' ||
    runtimeHost === 'staging.proconsult.space' ||
    apiBaseUrl.includes('staging-api.proconsult.space')
)
const buildMarkerText = computed(() => {
  if (buildVersion) return `v${buildVersion} (${buildShaShort.value})`
  return buildShaShort.value
})
const showMinimalShellDeployMarker = computed(
  () => showStagingDeployMarker.value && useMinimalShell.value
)

watchEffect(() => {
  document.body.classList.toggle('body--home', isHome.value)
  document.body.classList.toggle('body--authenticated', isAuthenticatedLayout.value)
})
const roles = computed(() => {
  return normalizeUserRoles(auth.me?.user ?? auth.user)
})
const isSpecialist = computed(() => hasSpecialistRole(roles.value))
const isClient = computed(() => hasClientRole(roles.value))
const isAdmin = computed(() => hasAdminRole(roles.value))
const hasSupportedCabinetRole = computed(() => isSpecialist.value || isClient.value || isAdmin.value)
const isChatCapable = computed(() => isSpecialist.value || isClient.value)
type SpecialistSidebarItem = {
  label: string
  title?: string
  to: string
  match: string[]
  exact?: boolean
  badge?: number
}

const specialistSidebarBaseItems: SpecialistSidebarItem[] = [
  { label: 'Кабінет', to: '/cabinet', match: ['/cabinet'], exact: true },
  { label: 'Профіль', to: '/cabinet/profile', match: ['/cabinet/profile'] },
  {
    label: 'Розклад',
    to: '/cabinet/slots',
    match: ['/cabinet/schedule', '/cabinet/slots', '/cabinet/availability-rules', '/cabinet/availability-exceptions'],
  },
  { label: 'Сесії', to: '/cabinet/sessions', match: ['/cabinet/sessions'] },
  {
    label: 'Запити',
    title: 'Запити, що очікують рішення',
    to: '/cabinet/external-sessions#guest-requests',
    match: ['/cabinet/external-sessions', '/cabinet/inquiries'],
  },
  { label: 'Задачі', to: '/cabinet/practice-board', match: ['/cabinet/practice-board'] },
  { label: 'Клієнти', to: '/cabinet/clients', match: ['/cabinet/clients'] },
  { label: 'Відгуки', to: '/cabinet/reviews', match: ['/cabinet/reviews'] },
  { label: 'Чати', to: '/cabinet/chat', match: ['/cabinet/chat'] },
  { label: 'Власний блог', to: '/cabinet/journal', match: ['/cabinet/journal'] },
  { label: 'Аналітика', to: '/cabinet/analytics', match: ['/cabinet/analytics'] },
  { label: 'Тарифи і доступ', to: '/cabinet/billing', match: ['/cabinet/billing'] },
  { label: 'Налаштування', to: '/cabinet/settings', match: ['/cabinet/settings'] },
]
const showSpecialistCabinetShell = computed(
  () => isAuthenticated.value && isSpecialist.value && !useMinimalShell.value && route.path.startsWith('/cabinet')
)
watchEffect(() => {
  const path = route.path || ''
  const role =
    isAdmin.value && path.startsWith('/admin')
      ? 'admin'
      : isSpecialist.value && (path.startsWith('/cabinet') || path.startsWith('/public'))
        ? 'specialist'
        : 'client'
  document.documentElement.setAttribute('data-role', role)
})
const cabinetRoute = computed(() => {
  if (isAdmin.value) return '/admin/work-queue'
  if (isSpecialist.value) return '/cabinet'
  if (isClient.value) return '/client'
  return '/403'
})
const cabinetLabel = computed(() => {
  if (isAdmin.value) return 'Черга роботи'
  if (isSpecialist.value) return 'Мій кабінет'
  if (isClient.value) return 'Кабінет'
  return 'Кабінет'
})
const showCatalogNav = computed(() => isClient.value)
const chatRoute = computed(() => (isSpecialist.value ? '/cabinet/chat' : '/client/chat'))
const isPublicProfilePage = computed(
  () => route.name === 'public-profile' || route.name === 'public-redirect'
)
const isPublicRoute = computed(
  () =>
    route.path.startsWith('/public') ||
    route.path.startsWith('/s/') ||
    route.path.startsWith('/t/') ||
    route.path.startsWith('/specialist/')
)
const showGlobalScrollTopButton = computed(
  () => !useMinimalShell.value && !isPublicProfilePage.value
)

const topbarClass = computed(() => [
  'topbar',
  {
    'topbar--admin': isAdmin.value,
    'topbar--specialist': isSpecialist.value,
    'topbar--client': isClient.value,
    'topbar--guest': !isAuthenticated.value,
  },
])

type UpcomingSessionReminder = {
  id: number
  status: string
  meeting_url?: string | null
  join_available?: boolean
  slot?: { start_at?: string | null } | number | null
  slot_start_at?: string | null
}

const PRE_SESSION_TOAST_WINDOW_MS = 5 * 60 * 1000
const PRE_SESSION_TOAST_POLL_MS = 60 * 1000
const PRE_SESSION_TOAST_STORAGE_KEY = 'consult.pre_session_toast_shown.v1'

const showNotifications = ref(false)
const showSettings = ref(false)
const showMobileMenu = ref(false)
const showSpecialistSidebarDrawer = ref(false)
const notificationsButtonRef = ref<HTMLButtonElement | null>(null)
const notificationsPanelRef = ref<HTMLDivElement | null>(null)
const settingsButtonRef = ref<HTMLButtonElement | null>(null)
const settingsPanelRef = ref<HTMLDivElement | null>(null)
const mobileMenuButtonRef = ref<HTMLButtonElement | null>(null)
const mobileMenuPanelRef = ref<HTMLDivElement | null>(null)
const refreshIntervalId = ref<number | null>(null)
const chatIntervalId = ref<number | null>(null)
const preSessionToastIntervalId = ref<number | null>(null)
const chatUnreadCount = ref(0)
const pendingGuestRequestsCount = ref(0)
const toast = useToast()
const notifs = useNotifications({ isClient, isSpecialist })
const shownPreSessionToastKeys = ref<Set<string>>(loadShownPreSessionToastKeys())

const upcomingCount = computed(() => auth.me?.counts?.upcoming_sessions_count ?? 0)
const specialistSidebarItems = computed<SpecialistSidebarItem[]>(() =>
  specialistSidebarBaseItems.map((item) =>
    item.to.startsWith('/cabinet/external-sessions')
      ? { ...item, badge: pendingGuestRequestsCount.value || undefined }
      : item
  )
)

function loadShownPreSessionToastKeys() {
  try {
    const raw = sessionStorage.getItem(PRE_SESSION_TOAST_STORAGE_KEY)
    if (!raw) return new Set<string>()
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return new Set<string>()
    return new Set(parsed.filter((item): item is string => typeof item === 'string'))
  } catch {
    return new Set<string>()
  }
}

function saveShownPreSessionToastKeys(next: Set<string>) {
  try {
    sessionStorage.setItem(PRE_SESSION_TOAST_STORAGE_KEY, JSON.stringify(Array.from(next)))
  } catch {
    // ignore storage errors
  }
}

function reminderSessionStartAt(session: UpcomingSessionReminder) {
  if (session.slot && typeof session.slot === 'object') {
    return session.slot.start_at || session.slot_start_at || null
  }
  return session.slot_start_at || null
}

function reminderKey(session: UpcomingSessionReminder) {
  const rolePrefix = isSpecialist.value ? 'specialist' : isClient.value ? 'client' : 'user'
  const startRaw = reminderSessionStartAt(session)
  const startTimestamp = startRaw ? new Date(startRaw).getTime() : Number.NaN
  const startPart =
    Number.isFinite(startTimestamp) && !Number.isNaN(startTimestamp)
      ? String(startTimestamp)
      : startRaw || 'no-start'
  return `${rolePrefix}:${session.id}:${startPart}`
}

function reminderDetailsRoute(sessionId: number) {
  if (isSpecialist.value) return `/cabinet/sessions/${sessionId}`
  return `/client/sessions/${sessionId}`
}

function reminderMessage() {
  if (isSpecialist.value) return 'За 5 хвилин починається сесія з клієнтом.'
  return 'За 5 хвилин починається ваша сесія.'
}

function reminderJoinAction(session: UpcomingSessionReminder) {
  const url = normalizeMeetingUrl(session.meeting_url)
  if (!url) return null
  if (session.join_available === false) return null
  if (!canJoinExternalMeeting({ status: session.status, meeting_url: url })) return null
  return {
    label: 'Приєднатися',
    href: url,
    target: '_blank' as const,
  }
}

function shouldShowSessionReminder(session: UpcomingSessionReminder, now: number) {
  if (!['SCHEDULED', 'CONFIRMED'].includes(session.status)) return false
  const startRaw = reminderSessionStartAt(session)
  if (!startRaw) return false
  const start = new Date(startRaw).getTime()
  if (Number.isNaN(start)) return false
  const diff = start - now
  return diff > 0 && diff <= PRE_SESSION_TOAST_WINDOW_MS
}

async function checkUpcomingSessionReminders() {
  if (!isAuthenticated.value) return
  if (!isSpecialist.value && !isClient.value) return

  try {
    const sessions = await apiGet<UpcomingSessionReminder[]>('/booking/sessions/', {
      params: { upcoming: true },
    })
    const now = Date.now()
    const eligible = (sessions || [])
      .filter((session) => shouldShowSessionReminder(session, now))
      .sort((a, b) => {
        const aStart = new Date(reminderSessionStartAt(a) || '').getTime()
        const bStart = new Date(reminderSessionStartAt(b) || '').getTime()
        return aStart - bStart
      })

    eligible.forEach((session) => {
      const key = reminderKey(session)
      if (shownPreSessionToastKeys.value.has(key)) return

      const actions: ToastAction[] = [
        {
          label: 'Відкрити деталі',
          to: reminderDetailsRoute(session.id),
        },
      ]
      const joinAction = reminderJoinAction(session)
      if (joinAction) {
        actions.push(joinAction)
      }

      toast.show({
        type: 'info',
        title: 'Нагадування',
        message: reminderMessage(),
        actions,
        duration: 10000,
      })

      const next = new Set(shownPreSessionToastKeys.value)
      next.add(key)
      shownPreSessionToastKeys.value = next
      saveShownPreSessionToastKeys(next)
    })
  } catch {
    // silent: reminder polling should not block shell behavior
  }
}

// Transitional behavior: until backend emits these as dedicated notifications,
// entitlement and counts-based hints still come from /api/me.
const supplementalNotifications = computed<BellNotification[]>(() => {
  const items: BellNotification[] = []
  const accessState = auth.me?.access_state
  const activeCount = auth.me?.counts?.active_clients ?? 0
  const activeClientEntitlement = auth.me?.effective_entitlements?.active_client_entitlement
  const activeLimit =
    activeClientEntitlement?.effective_limit ??
    auth.me?.effective_entitlements?.active_client_limit
  if (accessState === 'GRACE') {
    items.push({
      id: 'hint-access-grace',
      text: 'Оплата потребує уваги',
      hint: 'Доступ тимчасово збережено.',
      to: '/cabinet/billing',
      join_url: null,
      tone: 'warn',
      unread: false,
      source_kind: null,
      source_id: null,
    })
  }
  if (accessState === 'RESTRICTED') {
    items.push({
      id: 'hint-access-restricted',
      text: 'Обмежений режим доступу',
      hint: 'Нові дії тимчасово заблоковані.',
      to: '/cabinet/billing',
      join_url: null,
      tone: 'warn',
      unread: false,
      source_kind: null,
      source_id: null,
    })
  }
  if (typeof activeLimit === 'number' && activeCount > activeLimit) {
    const activeLimitHint = activeClientLimitHint(activeClientEntitlement)
    items.push({
      id: 'hint-over-limit',
      text: activeLimitHint.text,
      hint: activeLimitHint.hint,
      to: '/cabinet/billing',
      join_url: null,
      tone: 'warn',
      unread: false,
      source_kind: null,
      source_id: null,
    })
  }
  if (isSpecialist.value && upcomingCount.value > 0) {
    items.push({
      id: 'hint-upcoming-sessions',
      text: 'Є заплановані сесії',
      hint: 'Перевірте список найближчих сесій.',
      to: '/cabinet/sessions',
      join_url: null,
      tone: 'ok',
      unread: false,
      source_kind: null,
      source_id: null,
    })
  }
  return items
})

function activeClientLimitHint(snapshot: Record<string, unknown> | null | undefined) {
  if (snapshot?.can_buy_extra_slot === true) {
    if (snapshot.upgrade_required_plan === 'LEADER') {
      return {
        text: 'Досягнуто ліміт активних клієнтів на PRO',
        hint: 'Можна розширити ліміт: +1 активний клієнт — 200 грн/міс або перейти на Leader.',
      }
    }
    if (snapshot.upgrade_required_plan === 'PRO') {
      return {
        text: 'Досягнуто ліміт активних клієнтів на Start',
        hint: 'Можна розширити ліміт: +1 активний клієнт — 200 грн/міс або перейти на PRO.',
      }
    }
    return {
      text: 'Досягнуто ліміт активних клієнтів',
      hint: 'Можна розширити ліміт: +1 активний клієнт — 200 грн/міс.',
    }
  }
  if (snapshot?.upgrade_required_plan === 'PRO') {
    return {
      text: 'Досягнуто максимум Start',
      hint: 'На Start можна мати до 6 активних клієнтів. Для більшої кількості перейдіть на PRO.',
    }
  }
  if (snapshot?.upgrade_required_plan === 'LEADER') {
    return {
      text: 'Досягнуто максимум PRO',
      hint: 'На PRO можна мати до 26 активних клієнтів. Для більшої кількості потрібні умови Leader.',
    }
  }
  return {
    text: 'Перевищено ліміт активних клієнтів',
    hint: 'Нові підтвердження тимчасово заблоковані.',
  }
}

const notifications = computed(() => [
  ...notifs.items.value.filter((item) => item.unread),
  ...supplementalNotifications.value,
])
const notificationCount = notifs.unreadCount

function toggleNotifications() {
  showSettings.value = false
  showMobileMenu.value = false
  showSpecialistSidebarDrawer.value = false
  showNotifications.value = !showNotifications.value
}

function toggleSettings() {
  showNotifications.value = false
  showMobileMenu.value = false
  showSpecialistSidebarDrawer.value = false
  showSettings.value = !showSettings.value
}

function toggleMobileMenu() {
  showNotifications.value = false
  showSettings.value = false
  showSpecialistSidebarDrawer.value = false
  showMobileMenu.value = !showMobileMenu.value
}

function closeMobileMenu() {
  showMobileMenu.value = false
}

function toggleSpecialistSidebarDrawer() {
  showNotifications.value = false
  showSettings.value = false
  showMobileMenu.value = false
  showSpecialistSidebarDrawer.value = !showSpecialistSidebarDrawer.value
}

function closeSpecialistSidebarDrawer() {
  showSpecialistSidebarDrawer.value = false
}

function isSpecialistSidebarItemActive(item: SpecialistSidebarItem) {
  const path = route.path || ''
  if (item.exact) return path === item.to
  return item.match.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))
}

function onLogoutFromMenu() {
  closeMobileMenu()
  void onLogout()
}

function onMarkNotificationRead(item: BellNotification) {
  showNotifications.value = false
  notifs.markRead(item)
}

function notificationSpaTarget(item: BellNotification) {
  return spaRouteTargetPath(item.to)
}

function notificationButtonTarget(item: BellNotification) {
  const target = notificationSpaTarget(item)
  return /^\/admin\/work-queue(?:[?#]|$)/.test(target) ? target : ''
}

function notificationExternalTarget(item: BellNotification) {
  return resolveDjangoAdminUrl(item.to) || item.to
}

function onNotificationSpaClick(item: BellNotification) {
  const target = notificationButtonTarget(item)
  if (!target) return
  showNotifications.value = false
  notifs.markRead(item)
  void router.push(target)
}

async function onLogout() {
  await auth.logoutWithServer()
  router.push('/')
}

watch(
  () => route.fullPath,
  () => {
    showNotifications.value = false
    showSettings.value = false
    showMobileMenu.value = false
    showSpecialistSidebarDrawer.value = false
  }
)

watch(showNotifications, (value) => {
  if (value) {
    refreshMe()
    notifs.refresh()
  }
})

async function refreshMe() {
  if (!isAuthenticated.value) return
  try {
    await auth.loadMe()
  } catch {
    // ignore refresh errors
  }
}

async function refreshSpecialistRequestCount() {
  if (!isAuthenticated.value || !isSpecialist.value) {
    pendingGuestRequestsCount.value = 0
    return
  }
  try {
    const payload = await apiGet<{ pending_guest_requests_count?: number | null }>('/cabinet/work-queue/')
    const count = Number(payload?.pending_guest_requests_count)
    pendingGuestRequestsCount.value = Number.isFinite(count) && count > 0 ? Math.floor(count) : 0
  } catch {
    pendingGuestRequestsCount.value = 0
  }
}

async function refreshChatUnread() {
  if (!isAuthenticated.value || !isChatCapable.value) {
    chatUnreadCount.value = 0
    return
  }
  try {
    const resp = await fetchChatUnreadCount()
    chatUnreadCount.value = resp.unread_count ?? 0
  } catch {
    chatUnreadCount.value = 0
  }
}

function startMePolling() {
  if (refreshIntervalId.value !== null) return
  refreshMe()
  refreshSpecialistRequestCount()
  refreshIntervalId.value = window.setInterval(() => {
    refreshMe()
    refreshSpecialistRequestCount()
  }, 60000)
}

function stopMePolling() {
  if (refreshIntervalId.value === null) return
  window.clearInterval(refreshIntervalId.value)
  refreshIntervalId.value = null
}

function startChatPolling() {
  if (chatIntervalId.value !== null) return
  if (!isChatCapable.value) {
    chatUnreadCount.value = 0
    return
  }
  refreshChatUnread()
  chatIntervalId.value = window.setInterval(() => {
    refreshChatUnread()
  }, 5000)
}

function stopChatPolling() {
  if (chatIntervalId.value === null) return
  window.clearInterval(chatIntervalId.value)
  chatIntervalId.value = null
}

function startPreSessionToastPolling() {
  if (preSessionToastIntervalId.value !== null) return
  checkUpcomingSessionReminders()
  preSessionToastIntervalId.value = window.setInterval(() => {
    checkUpcomingSessionReminders()
  }, PRE_SESSION_TOAST_POLL_MS)
}

function stopPreSessionToastPolling() {
  if (preSessionToastIntervalId.value === null) return
  window.clearInterval(preSessionToastIntervalId.value)
  preSessionToastIntervalId.value = null
}

function handleVisibilityChange() {
  if (document.visibilityState === 'visible') {
    refreshMe()
    refreshSpecialistRequestCount()
    notifs.refresh()
    checkUpcomingSessionReminders()
  }
}


function handleGlobalClick(event: MouseEvent) {
  const target = event.target as Node
  if (showNotifications.value) {
    const button = notificationsButtonRef.value
    const panel = notificationsPanelRef.value
    if (button && button.contains(target)) return
    if (panel && panel.contains(target)) return
    showNotifications.value = false
  }
  if (showSettings.value) {
    const button = settingsButtonRef.value
    const panel = settingsPanelRef.value
    if (button && button.contains(target)) return
    if (panel && panel.contains(target)) return
    showSettings.value = false
  }
  if (showMobileMenu.value) {
    const button = mobileMenuButtonRef.value
    const panel = mobileMenuPanelRef.value
    if (button && button.contains(target)) return
    if (panel && panel.contains(target)) return
    showMobileMenu.value = false
  }
}

function handleGlobalKeydown(event: KeyboardEvent) {
  if (event.key !== 'Escape') return
  showNotifications.value = false
  showSettings.value = false
  showMobileMenu.value = false
}

onMounted(() => {
  if (isAuthenticated.value) {
    startMePolling()
    notifs.startPolling()
    startChatPolling()
    startPreSessionToastPolling()
  }
  document.addEventListener('click', handleGlobalClick)
  document.addEventListener('keydown', handleGlobalKeydown)
  document.addEventListener('visibilitychange', handleVisibilityChange)
})

onBeforeUnmount(() => {
  stopMePolling()
  notifs.stopPolling()
  stopChatPolling()
  stopPreSessionToastPolling()
  document.removeEventListener('click', handleGlobalClick)
  document.removeEventListener('keydown', handleGlobalKeydown)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})

watch(isAuthenticated, (value) => {
  if (value) {
    startMePolling()
    notifs.startPolling()
    startChatPolling()
    startPreSessionToastPolling()
  } else {
    stopMePolling()
    notifs.stopPolling()
    stopChatPolling()
    stopPreSessionToastPolling()
    pendingGuestRequestsCount.value = 0
    notifs.reset()
  }
})

watch(isSpecialist, (value) => {
  if (value && isAuthenticated.value) {
    refreshSpecialistRequestCount()
    return
  }
  pendingGuestRequestsCount.value = 0
})

watch(isChatCapable, (value) => {
  if (value && isAuthenticated.value) {
    startChatPolling()
    return
  }
  stopChatPolling()
  chatUnreadCount.value = 0
})
</script>

<style scoped>
.shell {
  --shell-inline-pad: 24px;
  width: 100%;
  max-width: none;
  margin: 0 auto;
  padding: 0 var(--shell-inline-pad) 48px;
  display: grid;
  gap: 24px;
  min-width: 0;
}

.shell--authenticated {
  --shell-inline-pad: clamp(24px, 2.4vw, 34px);
  padding: 0 var(--shell-inline-pad) 56px;
  gap: 30px;
}

.shell--public-profile {
  --shell-inline-pad: clamp(10px, 1.2vw, 16px);
  padding: 0 var(--shell-inline-pad) 28px;
  gap: 12px;
}

.shell--home {
  max-width: none;
  padding: 0;
  display: block;
  height: auto;
  overflow: visible;
}

.shell--minimal {
  padding: 0;
  display: block;
}

.topbar {
  position: relative;
  isolation: isolate;
  z-index: 10;
  background:
    radial-gradient(120% 140% at 50% -30%, rgba(255, 255, 255, 0.09), transparent 65%),
    linear-gradient(
      180deg,
      color-mix(in srgb, var(--topbar-bg) 94%, #1d5a4c) 0%,
      color-mix(in srgb, var(--topbar-bg) 98%, #0c2f28) 100%
    );
  backdrop-filter: blur(10px);
  border-bottom: 1px solid color-mix(in srgb, var(--topbar-text) 16%, transparent);
  color: var(--topbar-text);
  width: 100%;
  max-width: 100%;
  margin: 0;
  border-radius: 0;
  padding: 0;
  box-shadow: 0 10px 24px rgba(8, 24, 20, 0.14);
  min-width: 0;
}

.shell:not(.shell--home):not(.shell--minimal) .topbar {
  width: calc(100% + var(--shell-inline-pad) + var(--shell-inline-pad));
  max-width: none;
  margin-left: calc(-1 * var(--shell-inline-pad));
  margin-right: calc(-1 * var(--shell-inline-pad));
}

.topbar::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 1px;
  background: linear-gradient(
    90deg,
    color-mix(in srgb, var(--topbar-text) 0%, transparent) 0%,
    color-mix(in srgb, var(--topbar-text) 26%, transparent) 50%,
    color-mix(in srgb, var(--topbar-text) 0%, transparent) 100%
  );
  opacity: 0.55;
  pointer-events: none;
}

.topbar__inner {
  --marketing-shell-width: min(1280px, calc(100% - 48px));
  width: var(--marketing-shell-width);
  max-width: var(--marketing-shell-width);
  margin: 0 auto;
  min-height: 66px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 13px 0;
  min-width: 0;
}

.shell:not(.shell--home):not(.shell--minimal) .topbar .topbar__inner {
  width: min(
    1480px,
    calc(100% - var(--shell-inline-pad) - var(--shell-inline-pad))
  );
  max-width: calc(100% - var(--shell-inline-pad) - var(--shell-inline-pad));
  margin-left: auto;
  margin-right: auto;
}

.topbar--specialist,
.topbar--therapist,
.topbar--admin {
  --topbar-text: var(--pc-navy-950);
  background:
    radial-gradient(120% 180% at 50% -28%, rgba(255, 255, 255, 0.58), transparent 62%),
    linear-gradient(180deg, rgba(238, 244, 250, 0.92) 0%, rgba(229, 238, 248, 0.86) 100%);
  border-bottom-color: color-mix(in srgb, var(--pc-navy-900) 30%, var(--pc-border));
  box-shadow: 0 10px 24px rgba(18, 52, 90, 0.08);
}

.topbar--client {
  --topbar-text: var(--pc-navy-950);
  background:
    radial-gradient(120% 180% at 50% -28%, rgba(255, 255, 255, 0.58), transparent 62%),
    linear-gradient(180deg, rgba(238, 244, 250, 0.92) 0%, rgba(229, 238, 248, 0.86) 100%);
  border-bottom-color: color-mix(in srgb, var(--pc-navy-900) 30%, var(--pc-border));
  box-shadow: 0 10px 24px rgba(18, 52, 90, 0.08);
}

.topbar--admin {
  background:
    radial-gradient(120% 180% at 50% -28%, rgba(255, 255, 255, 0.5), transparent 62%),
    linear-gradient(180deg, rgba(233, 242, 250, 0.94) 0%, rgba(221, 235, 247, 0.9) 100%);
  border-bottom-color: color-mix(in srgb, var(--pc-navy-900) 35%, var(--pc-border));
  box-shadow: 0 10px 24px rgba(18, 52, 90, 0.12);
}

.topbar--specialist .topbar__inner,
.topbar--therapist .topbar__inner,
.topbar--admin .topbar__inner,
.topbar--client .topbar__inner {
  width: var(--marketing-shell-width);
  min-height: 78px;
  padding: 14px 0;
}

.topbar--guest {
  background: rgba(255, 255, 255, 0.92);
  color: var(--pc-navy-950);
  border-bottom: 1px solid var(--pc-border);
  box-shadow: 0 8px 24px rgba(18, 35, 58, 0.08);
}

.topbar--guest::after {
  opacity: 0.3;
}

.topbar--guest .topbar__inner {
  width: var(--marketing-shell-width);
  min-height: 78px;
  padding: 14px 0;
}

.brand {
  display: flex;
  align-items: center;
  gap: 14px;
  color: inherit;
  min-width: 0;
}

.brand__logo-frame {
  display: inline-flex;
  align-items: center;
  flex: 0 0 auto;
  min-width: 0;
}

.brand__logo {
  display: block;
  width: auto;
  object-fit: contain;
}

.brand__logo--full {
  height: 44px;
  max-width: 184px;
}

.brand__logo--mark {
  display: none;
  height: 34px;
  width: 34px;
}

.brand__mobile-name {
  display: none;
}

.brand__text-fallback,
.footer__text-fallback {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
}

.brand__tagline {
  font-size: 11.5px;
  letter-spacing: 0.16em;
  font-weight: 500;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--topbar-text) 76%, transparent);
  line-height: 1.2;
}

.topbar--guest .brand,
.topbar--specialist .brand,
.topbar--therapist .brand,
.topbar--admin .brand,
.topbar--client .brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.topbar--guest .brand__tagline,
.topbar--specialist .brand__tagline,
.topbar--therapist .brand__tagline,
.topbar--admin .brand__tagline,
.topbar--client .brand__tagline {
  font-size: 13.5px;
  letter-spacing: 0;
  font-weight: 400;
  text-transform: none;
  color: color-mix(in srgb, var(--pc-navy-900) 52%, var(--pc-text-muted));
  padding-left: 12px;
  border-left: 1px solid color-mix(in srgb, var(--pc-navy-900) 12%, var(--pc-border));
}

.topbar--guest .brand__tagline {
  color: color-mix(in srgb, var(--pc-text-muted) 88%, var(--pc-navy-900));
  border-left-color: var(--pc-border);
}

.nav {
  display: flex;
  gap: 10px;
  font-weight: 300;
  flex-wrap: wrap;
  justify-content: flex-end;
  min-width: 0;
}

.nav__primary-action {
  font-weight: 540;
}

.nav__desktop-only {
  display: inline-flex;
}

.nav__guest-cta {
  font-weight: 600;
}

.nav__guest-cta-short {
  display: none;
}

.nav__mobile-only {
  display: none;
}

.icon-btn.nav__mobile-only {
  display: none;
}

.nav a {
  padding: 4px 11px;
  min-height: 32px;
  border-radius: 6px;
  border: 1px solid color-mix(in srgb, var(--topbar-text) 24%, transparent);
  color: var(--topbar-text);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  background:
    linear-gradient(
      180deg,
      color-mix(in srgb, var(--topbar-text) 8%, transparent) 0%,
      color-mix(in srgb, var(--topbar-text) 4%, transparent) 100%
    );
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.07);
  transition: border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}

.nav a.icon-btn {
  padding: 0;
}

.nav a.router-link-active {
  border-color: color-mix(in srgb, var(--topbar-text) 42%, transparent);
  background: color-mix(in srgb, var(--topbar-text) 17%, transparent);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.11),
    0 6px 12px rgba(9, 24, 20, 0.16);
}

.nav :deep(a.nav-link--active) {
  border-color: color-mix(in srgb, var(--topbar-text) 42%, transparent);
  background: color-mix(in srgb, var(--topbar-text) 17%, transparent);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.11),
    0 6px 12px rgba(9, 24, 20, 0.16);
}

.nav a:hover {
  border-color: color-mix(in srgb, var(--topbar-text) 52%, transparent);
  background: color-mix(in srgb, var(--topbar-text) 21%, transparent);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.12),
    0 6px 12px rgba(9, 24, 20, 0.16);
}

.nav a:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--topbar-text) 45%, transparent);
  outline-offset: 2px;
}

.topbar--guest .nav {
  gap: 14px;
  align-items: center;
  flex-wrap: nowrap;
}

.topbar--guest .nav a {
  min-height: 38px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  box-shadow: none;
  color: var(--pc-navy-950);
  font-weight: 500;
  padding: 6px 8px;
}

.topbar--guest .nav a:hover {
  background: color-mix(in srgb, #1d3e38 7%, #ffffff);
}

.topbar--guest .nav a.router-link-active {
  background: color-mix(in srgb, #1d3e38 9%, #ffffff);
  box-shadow: none;
}

.topbar--guest .nav a.nav__guest-cta {
  border: 1px solid var(--pc-navy-900);
  background: var(--pc-navy-900);
  color: #ffffff;
  padding: 6px 16px;
  box-shadow: 0 10px 22px rgba(18, 52, 90, 0.18);
}

.topbar--guest .nav a.nav__guest-cta:hover {
  background: var(--pc-navy-950);
  border-color: var(--pc-navy-950);
}

.topbar--specialist .nav,
.topbar--therapist .nav,
.topbar--admin .nav,
.topbar--client .nav {
  gap: 14px;
  align-items: center;
  flex-wrap: nowrap;
  min-width: 0;
}

.topbar--specialist .nav a,
.topbar--therapist .nav a,
.topbar--admin .nav a,
.topbar--client .nav a {
  min-height: 38px;
  border-radius: 10px;
  border: 0;
  background: transparent;
  box-shadow: none;
  color: var(--pc-navy-900);
  font-weight: 500;
  padding: 6px 8px;
}

.topbar--specialist .nav a:hover,
.topbar--therapist .nav a:hover,
.topbar--admin .nav a:hover,
.topbar--client .nav a:hover {
  background: color-mix(in srgb, var(--pc-navy-900) 8%, #ffffff);
}

.topbar--specialist .nav a.router-link-active,
.topbar--therapist .nav a.router-link-active,
.topbar--admin .nav a.router-link-active,
.topbar--client .nav a.router-link-active {
  background: color-mix(in srgb, var(--pc-navy-900) 10%, #ffffff);
  box-shadow: none;
}

.topbar--specialist .nav a.nav__primary-action,
.topbar--therapist .nav a.nav__primary-action,
.topbar--admin .nav a.nav__primary-action,
.topbar--client .nav a.nav__primary-action {
  border: 1px solid var(--pc-navy-900);
  background: linear-gradient(180deg, var(--pc-navy-900) 0%, var(--pc-navy-950) 100%);
  color: #ffffff;
  box-shadow: 0 10px 18px rgba(18, 52, 90, 0.18);
}

.topbar--specialist .nav a.nav__primary-action:hover,
.topbar--therapist .nav a.nav__primary-action:hover,
.topbar--admin .nav a.nav__primary-action:hover,
.topbar--client .nav a.nav__primary-action:hover {
  background: var(--pc-navy-950);
  border-color: var(--pc-navy-950);
}

.topbar--specialist .nav a.icon-btn,
.topbar--therapist .nav a.icon-btn,
.topbar--admin .nav a.icon-btn,
.topbar--client .nav a.icon-btn {
  width: 38px;
  min-height: 38px;
  padding: 0;
}

.topbar--specialist .icon-btn,
.topbar--therapist .icon-btn,
.topbar--admin .icon-btn,
.topbar--client .icon-btn {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--pc-navy-900);
  box-shadow: none;
}

.topbar--specialist .icon-btn:hover,
.topbar--therapist .icon-btn:hover,
.topbar--admin .icon-btn:hover,
.topbar--client .icon-btn:hover,
.topbar--specialist .icon-btn:focus-visible,
.topbar--therapist .icon-btn:focus-visible,
.topbar--admin .icon-btn:focus-visible,
.topbar--client .icon-btn:focus-visible {
  border-color: color-mix(in srgb, var(--pc-navy-900) 20%, var(--pc-border));
  background: color-mix(in srgb, var(--pc-navy-900) 8%, #ffffff);
  box-shadow: none;
}

.topbar--specialist .btn--ghost,
.topbar--therapist .btn--ghost,
.topbar--admin .btn--ghost,
.topbar--client .btn--ghost {
  min-height: 38px;
  padding: 6px 8px;
  border-radius: 10px;
  border: 0;
  background: transparent;
  color: var(--pc-navy-900);
  box-shadow: none;
  font-weight: 500;
  font-size: inherit;
}

.topbar--specialist .btn--ghost:hover,
.topbar--therapist .btn--ghost:hover,
.topbar--admin .btn--ghost:hover,
.topbar--client .btn--ghost:hover,
.topbar--specialist .btn--ghost:focus-visible,
.topbar--therapist .btn--ghost:focus-visible,
.topbar--admin .btn--ghost:focus-visible,
.topbar--client .btn--ghost:focus-visible {
  background: color-mix(in srgb, var(--pc-navy-900) 8%, #ffffff);
}

.nav__notifications {
  position: relative;
}

.nav__settings {
  position: relative;
}

.mobile-menu {
  display: none;
}

.icon-btn {
  position: relative;
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  border-radius: 6px;
  border: 1px solid color-mix(in srgb, var(--topbar-text) 26%, transparent);
  color: var(--topbar-text);
  background:
    linear-gradient(
      180deg,
      color-mix(in srgb, var(--topbar-text) 8%, transparent) 0%,
      color-mix(in srgb, var(--topbar-text) 4%, transparent) 100%
    );
  cursor: pointer;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.07);
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease, transform 0.2s ease;
}

.icon-btn svg {
  width: 16px;
  height: 16px;
}

.icon-btn:hover,
.icon-btn:focus-visible {
  border-color: color-mix(in srgb, var(--topbar-text) 50%, transparent);
  background: color-mix(in srgb, var(--topbar-text) 15%, transparent);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.12),
    0 6px 12px rgba(12, 26, 36, 0.18);
}

.icon-btn__badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: #e56b6f;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  min-width: 16px;
  height: 16px;
  display: grid;
  place-items: center;
  border-radius: var(--radius-pill);
}

.topbar--guest .btn--ghost {
  min-height: 32px;
  padding: 4px 12px;
  border-radius: 6px;
  color: var(--topbar-text);
  border-color: color-mix(in srgb, var(--topbar-text) 30%, transparent);
  background:
    linear-gradient(
      180deg,
      color-mix(in srgb, var(--topbar-text) 10%, transparent) 0%,
      color-mix(in srgb, var(--topbar-text) 5%, transparent) 100%
    );
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.topbar--guest .btn--ghost:hover,
.topbar--guest .btn--ghost:focus-visible {
  border-color: color-mix(in srgb, var(--topbar-text) 50%, transparent);
  background: color-mix(in srgb, var(--topbar-text) 16%, transparent);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.12),
    0 6px 12px rgba(9, 24, 20, 0.14);
}

.topbar--guest .btn--ghost:active {
  background: color-mix(in srgb, var(--topbar-text) 24%, transparent);
}

.notif-panel {
  position: absolute;
  right: 0;
  top: calc(100% + 8px);
  width: 270px;
  background: #fff;
  color: var(--ink);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  box-shadow: 0 18px 32px rgba(16, 33, 50, 0.16);
  padding: 10px;
  z-index: 20;
}

.settings-menu {
  position: absolute;
  right: 0;
  top: calc(100% + 8px);
  width: 210px;
  background: #fff;
  color: var(--ink);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  box-shadow: 0 18px 32px rgba(16, 33, 50, 0.16);
  padding: 6px;
  z-index: 20;
  display: grid;
  gap: 2px;
}

.settings-menu__item {
  display: block;
  border-radius: 8px;
  padding: 8px 10px;
  text-decoration: none;
  color: var(--text);
  border: 1px solid transparent;
}

.nav .settings-menu__item {
  min-height: auto;
  justify-content: flex-start;
  font-weight: 500;
  color: var(--text);
  background: #fff;
  border: 1px solid transparent;
  padding: 8px 10px;
}

.settings-menu__item:hover {
  background: color-mix(in srgb, var(--primary) 8%, transparent);
  border-color: color-mix(in srgb, var(--primary) 24%, transparent);
}

.nav .settings-menu__item:hover {
  color: var(--text);
  background: color-mix(in srgb, var(--primary) 8%, transparent);
  border-color: color-mix(in srgb, var(--primary) 24%, transparent);
}

.settings-menu__item.router-link-active {
  background: color-mix(in srgb, var(--primary) 12%, transparent);
  border-color: color-mix(in srgb, var(--primary) 30%, transparent);
}

.nav .settings-menu__item.router-link-active {
  color: var(--text);
}

.settings-sheet {
  display: none;
}

.notif-panel__title {
  font-weight: 600;
}

.notif-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
}

.notif-panel .notif-panel__action.btn--ghost {
  flex-shrink: 0;
  color: var(--text);
  border-color: color-mix(in srgb, var(--primary) 22%, var(--border));
  background: color-mix(in srgb, var(--primary) 6%, #ffffff);
}

.notif-panel .notif-panel__action.btn--ghost:hover,
.notif-panel .notif-panel__action.btn--ghost:focus-visible {
  color: var(--text);
  border-color: color-mix(in srgb, var(--primary) 38%, var(--border));
  background: color-mix(in srgb, var(--primary) 12%, #ffffff);
}

.notif-panel .notif-panel__action.btn--ghost:disabled,
.notif-panel .notif-panel__action.btn--ghost[disabled] {
  color: var(--muted);
  border-color: var(--border);
  background: color-mix(in srgb, var(--surface) 85%, #ffffff);
}

.notif-panel .muted {
  color: var(--muted);
}

.notif-list {
  display: grid;
  gap: 8px;
}

.notif-item-shell {
  display: grid;
  gap: 6px;
}

.notif-item {
  display: grid;
  grid-template-columns: 10px 1fr;
  gap: 10px;
  width: 100%;
  border: 0;
  text-decoration: none;
  text-align: left;
  font: inherit;
  color: inherit;
  padding: 8px;
  border-radius: var(--radius-sm);
  background: color-mix(in srgb, var(--primary) 6%, transparent);
  cursor: pointer;
}

.notif-item:hover {
  background: color-mix(in srgb, var(--primary) 10%, transparent);
}

.notif-item--read .notif-item__text {
  color: color-mix(in srgb, var(--text) 75%, transparent);
  font-weight: 500;
}

.notif-item--read .notif-item__dot {
  background: color-mix(in srgb, var(--text) 35%, transparent);
}

.notif-item__dot {
  width: 8px;
  height: 8px;
  border-radius: var(--radius-pill);
  margin-top: 6px;
  background: #7a8d9c;
}

.notif-item__dot--warn {
  background: #d9a441;
}

.notif-item__dot--ok {
  background: #1f7a4c;
}

.notif-item__dot--info {
  background: #3b7db6;
}

.notif-item__text {
  font-weight: 600;
  font-size: 13px;
  color: var(--text);
}

.notif-item__hint {
  font-size: 12px;
  color: var(--muted);
}

.notif-item__actions {
  display: flex;
  justify-content: flex-end;
}

.notif-panel .notif-item__actions .btn--ghost {
  color: var(--text);
  border-color: color-mix(in srgb, var(--primary) 22%, var(--border));
  background: color-mix(in srgb, var(--primary) 6%, #ffffff);
}

.notif-panel .notif-item__actions .btn--ghost:hover,
.notif-panel .notif-item__actions .btn--ghost:focus-visible {
  color: var(--text);
  border-color: color-mix(in srgb, var(--primary) 38%, var(--border));
  background: color-mix(in srgb, var(--primary) 12%, #ffffff);
}

.specialist-shell {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  gap: 20px;
  align-items: start;
  width: 100%;
  max-width: 100%;
  min-width: 0;
}

.specialist-sidebar {
  position: sticky;
  top: 92px;
  display: grid;
  gap: 14px;
  max-height: calc(100vh - 116px);
  overflow: auto;
  border: 1px solid var(--pc-border);
  border-radius: var(--pc-radius-card);
  background: color-mix(in srgb, var(--pc-bg-card) 94%, #ffffff);
  box-shadow: var(--pc-shadow-soft);
  padding: 12px;
}

.specialist-sidebar__label {
  color: color-mix(in srgb, var(--text) 68%, #ffffff);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.specialist-sidebar__nav {
  display: grid;
  gap: 4px;
}

.specialist-sidebar__link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-height: 38px;
  border: 1px solid var(--pc-border);
  border-radius: var(--pc-radius-card);
  padding: 8px 10px;
  color: var(--pc-navy-900);
  font-weight: 600;
  line-height: 1.2;
  text-decoration: none;
  background: color-mix(in srgb, var(--pc-bg-card) 92%, #ffffff);
}

.specialist-sidebar__link-label {
  min-width: 0;
}

.specialist-sidebar__badge {
  flex: 0 0 auto;
  min-width: 24px;
  border: 1px solid color-mix(in srgb, var(--pc-warning) 44%, var(--pc-border));
  border-radius: var(--pc-radius-control);
  padding: 2px 6px;
  background: color-mix(in srgb, var(--pc-yellow-soft) 82%, #ffffff);
  color: var(--pc-navy-900);
  font-size: 12px;
  font-weight: 800;
  line-height: 1.25;
  text-align: center;
}

.specialist-sidebar__link:hover,
.specialist-sidebar__link:focus-visible {
  border-color: color-mix(in srgb, var(--pc-navy-900) 28%, var(--pc-border));
  background: color-mix(in srgb, var(--pc-bg-card) 86%, var(--pc-blue-soft));
  outline: none;
}

.specialist-sidebar__link.is-active {
  border-color: color-mix(in srgb, var(--pc-navy-900) 42%, var(--pc-border));
  background: color-mix(in srgb, var(--pc-bg-card) 78%, var(--pc-blue-soft));
  box-shadow: inset 3px 0 0 var(--pc-navy-900);
  color: var(--pc-navy-950);
}

.specialist-content {
  min-width: 0;
}

.specialist-mobile-nav,
.specialist-mobile-drawer {
  display: none;
}

.main {
  min-height: 320px;
  width: min(1200px, 100%);
  max-width: 100%;
  margin: 0 auto;
  min-width: 0;
}

.main--authenticated {
  width: min(1480px, 100%);
}

.main--specialist-shell {
  width: min(1540px, 100%);
}

.main--tour {
  width: 100%;
}

.main--home {
  min-height: 100vh;
  width: 100%;
  margin: 0;
  height: auto;
  overflow: visible;
}

.main--public-profile {
  width: min(1720px, 100%);
}

.shell--minimal .main {
  width: 100%;
}

.footer {
  display: grid;
  gap: 18px;
  padding-top: 18px;
  border-top: 1px solid var(--border);
  color: var(--text-2);
  font-size: 13px;
  font-weight: 400;
  line-height: 1.45;
  max-width: 100%;
  min-width: 0;
}

.footer--public {
  grid-template-columns: minmax(220px, 0.95fr) minmax(0, 1.6fr);
  align-items: start;
  padding-bottom: 24px;
}

.footer--cabinet {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  padding-bottom: 14px;
}

.footer__intro {
  display: grid;
  gap: 12px;
  min-width: 0;
}

.footer__eyebrow {
  color: var(--text);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
}

.footer__lead {
  margin: 4px 0 0;
  color: var(--text);
  font-size: 18px;
  font-weight: 700;
  line-height: 1.25;
}

.footer__description {
  margin: 0;
  max-width: 560px;
}

.footer__columns {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 22px;
  min-width: 0;
}

.footer__column {
  display: grid;
  align-content: start;
  gap: 7px;
  min-width: 0;
}

.footer__column-title {
  margin: 0 0 2px;
  color: var(--text);
  font-size: 13px;
  font-weight: 800;
  line-height: 1.25;
}

.footer__text {
  color: var(--text-2);
}

.footer__bottom {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  padding-top: 12px;
  border-top: 1px solid color-mix(in srgb, var(--border) 78%, transparent);
}

.footer__cabinet-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.footer__brand-lockup {
  display: inline-flex;
  align-items: center;
  flex: 0 0 auto;
  min-width: 0;
}

.footer__logo {
  display: block;
  width: auto;
  object-fit: contain;
}

.footer__logo--cabinet {
  height: 30px;
  max-width: 124px;
}

.footer__brand-lockup--public {
  min-height: 46px;
}

.footer__logo--dark,
.footer__logo--light {
  height: 46px;
  max-width: 184px;
}

.footer__logo--light {
  display: none;
}

.footer__name {
  color: var(--text);
  font-weight: 800;
}

.footer__deploy {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 2px 10px;
  border: 1px solid color-mix(in srgb, var(--text) 18%, transparent);
  border-radius: var(--radius-pill);
  font-size: 11px;
  line-height: 1.2;
  color: color-mix(in srgb, var(--text) 75%, #50606a);
  background: color-mix(in srgb, var(--surface) 80%, #f4f7f8);
}

.footer__deploy-env {
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-weight: 600;
}

.footer__deploy-build {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
  font-weight: 600;
}

.deploy-marker {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 2px 10px;
  border: 1px solid color-mix(in srgb, var(--text) 18%, transparent);
  border-radius: var(--radius-pill);
  font-size: 11px;
  line-height: 1.2;
  color: color-mix(in srgb, var(--text) 75%, #50606a);
  background: color-mix(in srgb, var(--surface) 80%, #f4f7f8);
  pointer-events: none;
}

.deploy-marker__env {
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-weight: 600;
}

.deploy-marker__build {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
  font-weight: 600;
}

.deploy-marker--minimal {
  position: fixed;
  right: 12px;
  bottom: 12px;
  z-index: 40;
  box-shadow: 0 4px 12px rgb(15 23 42 / 14%);
  opacity: 0.92;
}

#fe-build-probe {
  position: absolute;
  inline-size: 1px;
  block-size: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

.footer__legal {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.footer__legal--compact {
  gap: 8px;
}

.footer__legal--compact .footer__link + .footer__link::before {
  content: "·";
  margin-right: 8px;
  color: var(--text-2);
  text-decoration: none;
}

.footer__link {
  color: var(--text);
  font-weight: 500;
  text-decoration: underline;
  text-decoration-color: color-mix(in srgb, var(--text) 55%, transparent);
  text-underline-offset: 2px;
}

.footer__link:hover {
  text-decoration-color: color-mix(in srgb, var(--text) 80%, transparent);
}

body.body--home .footer--public {
  position: static;
  margin: 0;
  padding: 36px max(24px, calc((100vw - var(--pc-container-wide)) / 2)) 28px;
  z-index: auto;
  border-top: 0;
  background:
    radial-gradient(520px 260px at 92% 12%, rgba(143, 203, 200, 0.12), transparent 72%),
    linear-gradient(180deg, var(--pc-navy-900), var(--pc-navy-950));
  backdrop-filter: none;
  color: rgba(255, 255, 255, 0.82);
  box-shadow: 0 -18px 48px rgba(18, 35, 58, 0.1);
}

body.body--home .footer__description,
body.body--home .footer__text,
body.body--home .footer__bottom {
  color: rgba(255, 255, 255, 0.72);
}

body.body--home .footer__eyebrow,
body.body--home .footer__lead,
body.body--home .footer__column-title {
  color: #ffffff;
}

.footer--home .footer__logo--dark {
  display: none;
}

.footer--home .footer__logo--light {
  display: block;
}

body.body--home .footer__link {
  color: rgba(255, 255, 255, 0.86);
  text-decoration-color: rgba(255, 255, 255, 0.34);
}

body.body--home .footer__link:hover {
  color: #ffffff;
  text-decoration-color: rgba(255, 255, 255, 0.72);
}

body.body--home .footer__bottom {
  border-top-color: rgba(255, 255, 255, 0.14);
}

@media (max-width: 1024px) {
  .shell--public-profile {
    --shell-inline-pad: 10px;
    gap: 8px;
    padding-bottom: 20px;
  }

  .topbar__inner {
    align-items: flex-start;
    gap: 10px;
    padding: 12px 0;
  }

  .nav {
    gap: 10px;
  }

  .topbar--guest .topbar__inner {
    align-items: center;
    min-height: 70px;
    width: var(--marketing-shell-width);
  }

  .topbar--guest .brand__tagline {
    font-size: 13px;
  }
}

@media (max-width: 900px) {
  .topbar__inner {
    --marketing-shell-width: min(1280px, calc(100% - 32px));
  }

  .shell--authenticated {
    gap: 12px;
  }

  .footer--public {
    grid-template-columns: 1fr;
  }

  .footer__columns {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .footer--cabinet,
  .footer__bottom {
    align-items: flex-start;
    flex-direction: column;
  }

  .main--specialist-shell {
    width: 100%;
  }

  .specialist-shell {
    display: block;
  }

  .specialist-sidebar {
    display: none;
  }

  .specialist-content {
    width: 100%;
  }

  .specialist-mobile-nav {
    display: flex;
    justify-content: flex-start;
    width: min(100% - 32px, var(--pc-container-wide));
    margin: 0 auto;
    padding: 4px 0 4px;
  }

  .specialist-mobile-nav__toggle {
    display: inline-flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    width: 100%;
    min-height: 46px;
    border: 1px solid var(--pc-border);
    border-radius: var(--pc-radius-card);
    padding: 11px 14px;
    background: linear-gradient(135deg, var(--pc-bg-card), color-mix(in srgb, var(--pc-bg-card) 88%, var(--pc-blue-soft)));
    box-shadow: var(--pc-shadow-soft);
    color: var(--pc-navy-900);
    font-weight: 700;
    line-height: 1.2;
    text-align: left;
  }

  .specialist-mobile-nav__toggle::after {
    content: "";
    flex: 0 0 auto;
    width: 9px;
    height: 9px;
    border-right: 2px solid currentColor;
    border-bottom: 2px solid currentColor;
    opacity: 0.72;
    transform: rotate(45deg) translateY(-2px);
  }

  .specialist-mobile-nav__toggle:hover,
  .specialist-mobile-nav__toggle:focus-visible {
    border-color: color-mix(in srgb, var(--pc-navy-900) 38%, var(--pc-border));
    background: var(--pc-bg-card);
    box-shadow: 0 0 0 3px rgba(18, 52, 90, 0.14), var(--pc-shadow-soft);
    outline: none;
  }

  .specialist-mobile-drawer {
    display: block;
    position: fixed;
    inset: 0;
    z-index: 50;
  }

  .specialist-mobile-drawer__backdrop {
    position: absolute;
    inset: 0;
    border: 0;
    background: rgba(15, 28, 24, 0.32);
    cursor: pointer;
  }

  .specialist-mobile-drawer__panel {
    position: relative;
    z-index: 1;
    width: min(320px, calc(100vw - 32px));
    min-height: 100%;
    max-height: 100vh;
    overflow: auto;
    border-right: 1px solid var(--pc-border);
    background: color-mix(in srgb, var(--pc-bg-card) 96%, #ffffff);
    box-shadow: 16px 0 28px rgba(18, 35, 58, 0.14);
    padding: 16px;
  }

  .specialist-mobile-drawer__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 14px;
  }

  .specialist-mobile-drawer__close {
    flex: 0 0 auto;
  }
}

@media (max-width: 640px) {
  .shell--public-profile {
    --shell-inline-pad: 8px;
    gap: 6px;
    padding-bottom: 16px;
  }

  .footer {
    gap: 14px;
  }

  .footer__columns {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  body.body--home .footer--public {
    padding: 28px 16px 24px;
  }

  .main {
    width: 100%;
  }

  .topbar {
    position: sticky;
    top: 0;
  }

  .topbar__inner {
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    min-height: auto;
    padding: 10px 0 9px;
  }

  .nav__desktop-only {
    display: none !important;
  }

  .nav__mobile-only {
    display: inline-flex;
  }

  .icon-btn.nav__mobile-only {
    display: inline-flex;
  }

  .brand__logo--full {
    display: none;
  }

  .brand__logo--mark {
    display: block;
  }

  .topbar--guest .brand__logo-frame {
    gap: 7px;
  }

  .topbar--guest .brand__logo--mark {
    height: 32px;
    width: 32px;
  }

  .topbar--guest .brand__mobile-name {
    display: inline-block;
    color: var(--pc-navy-900);
    font-family: var(--font-display);
    font-size: 14.5px;
    font-weight: 600;
    line-height: 1;
    white-space: nowrap;
  }

  .nav {
    margin-left: auto;
    width: auto;
    justify-content: flex-end;
    gap: 8px;
    flex-wrap: nowrap;
    align-items: center;
  }

  .nav a.nav__primary-action {
    max-width: 124px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .topbar--guest .topbar__inner {
    width: var(--marketing-shell-width);
    padding: 10px 0 9px;
    flex-wrap: nowrap;
    gap: 10px;
  }

  .topbar--guest .brand__tagline {
    display: none;
  }

  .topbar--specialist .brand__tagline,
  .topbar--therapist .brand__tagline,
  .topbar--admin .brand__tagline,
  .topbar--client .brand__tagline {
    display: none;
  }

  .topbar--guest .nav {
    gap: 6px;
  }

  .topbar--guest .nav a {
    min-height: 34px;
    padding: 5px 8px;
  }

  .topbar--guest .nav a.nav__guest-cta {
    padding: 5px 12px;
  }

  .shell--home .topbar--guest .nav__guest-cta-full {
    display: none;
  }

  .shell--home .topbar--guest .nav__guest-cta-short {
    display: inline;
  }

  .shell--public-profile .topbar--guest .nav a.nav__guest-cta {
    display: none;
  }

  .mobile-menu {
    display: grid;
    position: absolute;
    right: 12px;
    top: calc(100% + 8px);
    width: min(280px, calc(100vw - 24px));
    background: #fff;
    border: 1px solid var(--line);
    border-radius: 12px;
    box-shadow: 0 18px 32px rgba(16, 33, 50, 0.18);
    padding: 6px;
    z-index: 24;
  }

  .mobile-menu__item {
    text-decoration: none;
    color: var(--text);
    border: 1px solid transparent;
    border-radius: 8px;
    padding: 8px 10px;
    text-align: left;
    background: #fff;
    font: inherit;
    cursor: pointer;
  }

  .nav .mobile-menu__item {
    min-height: auto;
    justify-content: flex-start;
    color: var(--text);
    background: #fff;
    border: 1px solid transparent;
    padding: 8px 10px;
    font-weight: 500;
  }

  .mobile-menu__item:hover {
    background: color-mix(in srgb, var(--primary) 8%, transparent);
    border-color: color-mix(in srgb, var(--primary) 24%, transparent);
  }

  .nav .mobile-menu__item:hover {
    color: var(--text);
    background: color-mix(in srgb, var(--primary) 8%, transparent);
    border-color: color-mix(in srgb, var(--primary) 24%, transparent);
  }

  .nav .mobile-menu__item.router-link-active {
    color: var(--text);
    background: color-mix(in srgb, var(--primary) 10%, transparent);
    border-color: color-mix(in srgb, var(--primary) 26%, transparent);
  }

  .settings-sheet {
    display: grid;
    gap: 4px;
    margin-top: 6px;
    width: 100%;
    border: 1px solid var(--line);
    border-radius: 12px;
    background: #fff;
    box-shadow: 0 14px 26px rgba(16, 33, 50, 0.14);
    padding: 8px;
  }

  .settings-sheet__item {
    text-decoration: none;
    color: var(--text);
    border: 1px solid transparent;
    border-radius: 8px;
    padding: 8px 10px;
    font-weight: 500;
    background: #fff;
  }

  .settings-sheet__item:hover {
    background: color-mix(in srgb, var(--primary) 8%, transparent);
    border-color: color-mix(in srgb, var(--primary) 24%, transparent);
  }

  .deploy-marker--minimal {
    right: 8px;
    bottom: 8px;
    max-width: calc(100vw - 16px);
  }
}

@media (max-width: 1024px) and (max-height: 560px) {
  .shell--public-profile {
    --shell-inline-pad: 6px;
    gap: 6px;
    padding-bottom: 12px;
  }
}
</style>
    border-radius: var(--pc-radius-card);
