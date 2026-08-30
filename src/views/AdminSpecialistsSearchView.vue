<template>
  <section class="admin-specialists-search">
    <header class="admin-specialists-search__hero panel">
      <div>
        <div class="badge">Адмін</div>
        <h1 class="title admin-specialists-search__title">Спеціалісти</h1>
        <p class="muted admin-specialists-search__subtitle">Усі спеціалісти Pro Consult та стан їхніх профілів.</p>
      </div>
      <RouterLink class="btn btn--ghost" to="/admin/inbox">До адмін-запитів</RouterLink>
    </header>

    <section class="panel">
      <div class="panel__header">
        <div>
          <div class="badge badge--soft">Реєстр</div>
          <h2 class="panel__title">Пошук у реєстрі спеціалістів</h2>
        </div>
      </div>
      <form class="search-form" @submit.prevent="submitSearch">
        <label class="field search-form__field">
          <span>Введіть email, логін, слаг або ім’я</span>
          <input v-model="searchQuery" class="input" type="search" autocomplete="off" placeholder="Введіть email, логін, слаг або ім’я" />
        </label>
        <div class="search-form__actions">
          <button class="btn" type="submit" :disabled="loading">Знайти</button>
          <button class="btn btn--ghost" type="button" :disabled="loading" @click="clearSearch">Очистити</button>
        </div>
      </form>
    </section>

    <section class="panel">
      <div class="panel__header">
        <div>
          <div class="badge badge--soft">Результати</div>
          <h2 class="panel__title">{{ isSearchActive ? 'Результати пошуку' : 'Усі спеціалісти' }}</h2>
        </div>
        <div v-if="!loading && !error" class="muted">Спеціалістів: {{ results.length }}</div>
      </div>

      <div v-if="loading" class="muted">Завантаження…</div>
      <div v-else-if="error" class="form-error">{{ error }}</div>
      <EmptyState
        v-else-if="results.length === 0"
        :title="isSearchActive ? 'За запитом нічого не знайдено' : 'Реєстр спеціалістів поки порожній'"
        :description="isSearchActive ? 'Спробуйте інший запит.' : 'Коли спеціалісти з’являться на платформі, вони будуть показані тут.'"
      />
      <template v-else>
        <div class="registry-filters" role="region" aria-label="Фільтри реєстру спеціалістів">
          <label class="field registry-filters__field"><span>Видимість профілю</span>
            <select v-model="visibilityFilter" class="input">
              <option value="all">Усі</option><option value="unpublished">Не опубліковано</option>
              <option value="direct_link_only">За прямим посиланням</option><option value="search_visible">У пошуку</option>
              <option value="invalid">Некоректний стан</option>
            </select>
          </label>
          <label class="field registry-filters__field"><span>Готовність</span>
            <select v-model="readinessFilter" class="input">
              <option value="all">Усі</option><option value="ready">Профіль готовий</option><option value="not_ready">Профіль не готовий</option>
            </select>
          </label>
          <label class="field registry-filters__field"><span>Фактичний тариф</span>
            <select v-model="effectivePlanFilter" class="input">
              <option value="all">Усі</option><option value="START">Start</option><option value="PRO">Pro</option><option value="LEADER">Leader</option>
            </select>
          </label>
        </div>
        <div class="muted registry-results-count">Показано: {{ filteredResults.length }} із {{ results.length }}</div>
        <EmptyState v-if="filteredResults.length === 0" title="За активними фільтрами нічого не знайдено" description="Змініть або скиньте фільтри, щоб побачити спеціалістів." />

        <div v-else class="registry-table-wrap">
          <table class="registry-table">
            <thead><tr>
              <th scope="col">Спеціаліст</th><th scope="col">Реєстрація</th><th scope="col">Готовність</th>
              <th scope="col">Видимість</th><th scope="col">Тариф</th><th scope="col">Онбординг</th><th scope="col">Дії</th>
            </tr></thead>
            <tbody>
              <tr
                v-for="item in filteredResults"
                :key="item.id"
                class="registry-table__row"
                tabindex="0"
                @click="openDetail(item.id)"
                @keydown.enter.self.prevent="openDetail(item.id)"
                @keydown.space.self.prevent="openDetail(item.id)"
              >
                <td data-label="Спеціаліст">
                  <h3 class="registry-cell__title">{{ item.display_name || item.username }}</h3>
                  <div class="registry-cell__meta">@{{ item.username }}</div>
                  <div class="registry-cell__meta">{{ item.email || '—' }}</div>
                </td>
                <td data-label="Реєстрація"><time :datetime="item.created_at">{{ formatRegistrationDate(item.created_at) }}</time></td>
                <td data-label="Готовність"><span :class="readinessPillClass(item)">{{ readinessBadgeText(item) }}</span></td>
                <td data-label="Видимість"><span :class="visibilityPillClass(item)">{{ visibilityBadgeText(item) }}</span></td>
                <td data-label="Тариф">
                  <span class="registry-plan">{{ planLabel(item.effective_plan) }}</span>
                  <div v-if="accessStateText(item)" class="registry-cell__meta">{{ accessStateText(item) }}</div>
                </td>
                <td data-label="Онбординг">
                  <template v-if="item.crm_summary?.onboarding">
                    <div class="onboarding-status">
                      <span :class="onboardingPillClass(item, 'template_a')">A {{ onboardingMark(item, 'template_a') }}</span>
                      <span :class="onboardingPillClass(item, 'template_b')">B {{ onboardingMark(item, 'template_b') }}</span>
                    </div>
                    <div v-if="templateBVariant(item)" class="registry-cell__meta">{{ templateBVariant(item) }}</div>
                  </template>
                  <span v-else class="muted">Немає даних</span>
                </td>
                <td data-label="Дії" class="registry-table__actions">
                  <a v-if="publicProfileUrl(item)" class="btn btn--ghost btn--sm" :href="publicProfileUrl(item)" target="_blank" rel="noopener noreferrer" @click.stop @keydown.stop>Профіль</a>
                  <button class="btn btn--ghost btn--sm" type="button" @click.stop="openDetail(item.id)" @keydown.stop>Деталка</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter, type LocationQueryRaw } from 'vue-router'
import EmptyState from '../components/EmptyState.vue'
import { fetchAdminSpecialistSearch, getApiErrorMessage, type AdminSpecialistSearchItem } from '../lib/api'
import { formatUkDateTimeCompact } from '../lib/dateTime'

const route = useRoute()
const router = useRouter()
const searchQuery = ref('')
const loading = ref(false)
const error = ref('')
const isSearchActive = ref(false)
const results = ref<AdminSpecialistSearchItem[]>([])
const requestSeq = ref(0)
const visibilityFilter = ref('all')
const readinessFilter = ref('all')
const effectivePlanFilter = ref('all')

const filteredResults = computed(() => results.value.filter((item) => {
  const visibility = String(item.crm_summary?.visibility?.state || '').trim()
  const readiness = item.crm_summary?.readiness?.is_ready
  const effectivePlan = String(item.effective_plan || '').trim().toUpperCase()
  return (visibilityFilter.value === 'all' || visibility === visibilityFilter.value)
    && (readinessFilter.value === 'all'
      || (readinessFilter.value === 'ready' && readiness === true)
      || (readinessFilter.value === 'not_ready' && readiness === false))
    && (effectivePlanFilter.value === 'all' || effectivePlan === effectivePlanFilter.value)
}))

function firstQueryValue(value: unknown) {
  return Array.isArray(value) ? value[0] : value
}

function normalizedQuery(value: unknown) {
  const raw = firstQueryValue(value)
  return typeof raw === 'string' ? raw.trim() : ''
}

function trialActive(item: AdminSpecialistSearchItem) {
  return item.trial_active ?? item.active_trial
}

function overrideActive(item: AdminSpecialistSearchItem) {
  return item.override_active ?? item.active_override
}

function statusToneClass(tone: 'ok' | 'warn' | 'muted') {
  return ['status-pill', `status-pill--${tone}`]
}

function planLabel(value: string | null | undefined) {
  const normalized = String(value || '').trim().toUpperCase()
  if (normalized === 'START' || normalized === 'PRO' || normalized === 'LEADER') return normalized
  return value || '—'
}

function formatRegistrationDate(value: string | null | undefined) {
  return formatUkDateTimeCompact(value)
}

function readinessBadgeText(item: AdminSpecialistSearchItem) {
  const readiness = item.crm_summary?.readiness
  if (!readiness) return 'Немає даних'
  return `${readiness.completed_count}/${readiness.total_count}${readiness.is_ready ? ' ✓' : ''}`
}

function readinessPillClass(item: AdminSpecialistSearchItem) {
  const readiness = item.crm_summary?.readiness
  return statusToneClass(!readiness ? 'muted' : readiness.is_ready ? 'ok' : 'warn')
}

function visibilityBadgeText(item: AdminSpecialistSearchItem) {
  const state = String(item.crm_summary?.visibility?.state || '').trim()
  if (state === 'unpublished') return 'Не опубліковано'
  if (state === 'direct_link_only') return 'За прямим посиланням'
  if (state === 'search_visible') return 'У пошуку'
  if (state === 'invalid') return 'Некоректний стан'
  return 'Немає даних'
}

function visibilityPillClass(item: AdminSpecialistSearchItem) {
  const state = String(item.crm_summary?.visibility?.state || '').trim()
  if (state === 'invalid') return statusToneClass('warn')
  if (state === 'direct_link_only' || state === 'search_visible') return statusToneClass('ok')
  return statusToneClass('muted')
}

function onboardingMark(item: AdminSpecialistSearchItem, template: 'template_a' | 'template_b') {
  const onboarding = item.crm_summary?.onboarding
  if (!onboarding) return '—'
  return (template === 'template_a' ? onboarding.template_a_sent : onboarding.template_b_sent) ? '✓' : '—'
}

function onboardingPillClass(item: AdminSpecialistSearchItem, template: 'template_a' | 'template_b') {
  const onboarding = item.crm_summary?.onboarding
  const sent = onboarding && (template === 'template_a' ? onboarding.template_a_sent : onboarding.template_b_sent)
  return statusToneClass(sent ? 'ok' : 'muted')
}

function templateBVariant(item: AdminSpecialistSearchItem) {
  if (!item.crm_summary?.onboarding?.template_b_sent) return ''
  return String(item.crm_summary.onboarding.template_b_variant || '').trim()
}

function accessStateText(item: AdminSpecialistSearchItem) {
  return [trialActive(item) ? 'Тест' : '', overrideActive(item) ? 'Перевизначення' : ''].filter(Boolean).join(' · ')
}

function publicProfileUrl(item: AdminSpecialistSearchItem) {
  const visibility = item.crm_summary?.visibility
  const state = String(visibility?.state || '').trim()
  const path = String(visibility?.public_profile_path || '').trim()
  return (state === 'direct_link_only' || state === 'search_visible') && path ? path : ''
}

function openDetail(specialistId: number) {
  router.push(`/admin/specialists/${specialistId}`)
}

async function runSearch(rawQuery: string) {
  const query = rawQuery.trim()
  const seq = ++requestSeq.value
  loading.value = true
  error.value = ''
  isSearchActive.value = Boolean(query)
  try {
    const resp = await fetchAdminSpecialistSearch(query ? { q: query, limit: 100 } : { limit: 100 })
    if (seq !== requestSeq.value) return
    results.value = resp.results || []
  } catch (err) {
    if (seq !== requestSeq.value) return
    error.value = getApiErrorMessage(err, 'Не вдалося завантажити список спеціалістів')
    results.value = []
  } finally {
    if (seq === requestSeq.value) loading.value = false
  }
}

async function submitSearch() {
  const query = searchQuery.value.trim()
  const nextQuery: LocationQueryRaw = { ...route.query }
  if (query) nextQuery.q = query
  else delete nextQuery.q
  if (normalizedQuery(route.query.q) === query) return runSearch(query)
  await router.replace({ query: nextQuery })
}

async function clearSearch() {
  searchQuery.value = ''
  if (normalizedQuery(route.query.q)) {
    const nextQuery: LocationQueryRaw = { ...route.query }
    delete nextQuery.q
    await router.replace({ query: nextQuery })
    return
  }
  await runSearch('')
}

watch(() => route.query.q, async (value) => {
  const query = normalizedQuery(value)
  searchQuery.value = query
  await runSearch(query)
}, { immediate: true })
</script>

<style scoped>
.admin-specialists-search { display: grid; gap: 1rem; }
.admin-specialists-search__hero { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; }
.admin-specialists-search__title { margin: 0; }
.admin-specialists-search__subtitle { margin: 0.5rem 0 0; }
.search-form { display: grid; gap: 0.75rem; }
.search-form__field, .registry-filters__field { margin: 0; }
.search-form__actions, .onboarding-status, .registry-table__actions { display: flex; flex-wrap: wrap; gap: 0.5rem; }
.registry-filters { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0.75rem; margin-bottom: 0.75rem; }
.registry-results-count { margin-bottom: 0.75rem; }
.registry-table-wrap { overflow-x: auto; }
.registry-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
.registry-table th, .registry-table td { border-bottom: 1px solid var(--border-color, #e5e7eb); padding: 0.65rem 0.55rem; text-align: left; vertical-align: top; }
.registry-table th { position: sticky; top: 0; z-index: 1; background: var(--panel-bg, #fff); color: var(--muted); font-size: 0.75rem; font-weight: 700; letter-spacing: 0.02em; text-transform: uppercase; }
.registry-table__row { cursor: pointer; }
.registry-table__row:hover { background: rgba(31, 111, 235, 0.04); }
.registry-table__row:focus-visible { outline: 2px solid rgba(31, 111, 235, 0.45); outline-offset: -2px; }
.registry-cell__title { margin: 0; font-size: 0.95rem; overflow-wrap: anywhere; }
.registry-cell__meta { color: var(--muted); font-size: 0.78rem; line-height: 1.35; overflow-wrap: anywhere; }
.registry-plan { font-weight: 700; }
.status-pill { display: inline-flex; align-items: center; border-radius: 999px; padding: 0.2rem 0.55rem; font-size: 0.78rem; font-weight: 600; line-height: 1.25; white-space: nowrap; }
.status-pill--ok { background: rgba(5, 150, 105, 0.14); color: #047857; }
.status-pill--muted { background: rgba(100, 116, 139, 0.16); color: #334155; }
.status-pill--warn { background: rgba(217, 119, 6, 0.16); color: #8b5f00; }
@media (max-width: 860px) {
  .registry-table-wrap { overflow: visible; }
  .registry-table, .registry-table tbody, .registry-table tr, .registry-table td { display: block; }
  .registry-table thead { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
  .registry-table__row { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0; border: 1px solid var(--border-color, #e5e7eb); border-radius: 10px; margin-bottom: 0.65rem; overflow: hidden; }
  .registry-table td { border-bottom: 1px solid var(--border-color, #e5e7eb); padding: 0.5rem 0.6rem; }
  .registry-table td::before { content: attr(data-label); display: block; color: var(--muted); font-size: 0.7rem; font-weight: 700; letter-spacing: 0.02em; margin-bottom: 0.25rem; text-transform: uppercase; }
  .registry-table td:first-child, .registry-table__actions { grid-column: 1 / -1; }
  .registry-table__actions { align-items: center; }
}
@media (max-width: 760px) {
  .admin-specialists-search__hero { flex-direction: column; align-items: stretch; }
  .registry-filters { grid-template-columns: minmax(0, 1fr); }
}
</style>
