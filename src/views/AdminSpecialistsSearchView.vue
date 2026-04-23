<template>
  <section class="admin-specialists-search">
    <header class="admin-specialists-search__hero panel">
      <div>
        <div class="badge">Адмін</div>
        <h1 class="title admin-specialists-search__title">Спеціалісти</h1>
        <p class="muted admin-specialists-search__subtitle">
          Пошук спеціалістів і перехід у деталку доступу.
        </p>
      </div>
      <RouterLink class="btn btn--ghost" to="/admin/inbox">До inbox</RouterLink>
    </header>

    <section class="panel">
      <div class="panel__header">
        <div>
          <div class="badge badge--soft">Пошук</div>
          <h2 class="panel__title">Знайти спеціаліста</h2>
        </div>
      </div>

      <form class="search-form" @submit.prevent="submitSearch">
        <label class="field search-form__field">
          <span>Email, username, slug або імʼя</span>
          <input
            v-model="searchQuery"
            class="input"
            type="search"
            autocomplete="off"
            placeholder="Наприклад: ira@, ira-bondar, Bondar"
          />
        </label>
        <div class="search-form__actions">
          <button class="btn" type="submit" :disabled="loading">Пошук</button>
          <button class="btn btn--ghost" type="button" :disabled="loading" @click="clearSearch">
            Очистити
          </button>
        </div>
      </form>
    </section>

    <section class="panel">
      <div class="panel__header">
        <div>
          <div class="badge badge--soft">Результати</div>
          <h2 class="panel__title">Список спеціалістів</h2>
        </div>
        <div v-if="hasSearched && !loading && !error" class="muted">Знайдено: {{ results.length }}</div>
      </div>

      <div v-if="loading" class="muted">Завантаження результатів…</div>
      <div v-else-if="error" class="form-error">{{ error }}</div>
      <EmptyState
        v-else-if="!hasSearched"
        title="Введіть запит для пошуку"
        description="Пошук працює за email, username, slug або display/full name."
      />
      <EmptyState
        v-else-if="results.length === 0"
        title="Нічого не знайдено"
        description="Спробуйте інший запит або перевірте написання."
      />

      <div v-else class="results-list">
        <article
          v-for="item in results"
          :key="item.id"
          class="result-card"
          role="button"
          tabindex="0"
          @click="openDetail(item.id)"
          @keydown.enter.prevent="openDetail(item.id)"
        >
          <div class="result-card__head">
            <div>
              <h3 class="result-card__title">{{ item.display_name || item.username }}</h3>
              <div class="muted">@{{ item.username }}</div>
            </div>
            <button class="btn btn--ghost btn--sm" type="button" @click.stop="openDetail(item.id)">
              Відкрити деталку
            </button>
          </div>

          <div class="result-card__grid">
            <div><strong>Email:</strong> {{ item.email || '—' }}</div>
            <div><strong>Slug:</strong> {{ item.slug || '—' }}</div>
            <div><strong>Базовий тариф:</strong> {{ planLabel(item.base_plan) }}</div>
            <div><strong>Фактичний тариф:</strong> {{ planLabel(item.effective_plan) }}</div>
          </div>

          <div class="result-card__badges">
            <span :class="statusPillClass(trialActive(item))">
              Trial {{ trialActive(item) ? 'активний' : 'неактивний' }}
            </span>
            <span :class="statusPillClass(overrideActive(item))">
              Override {{ overrideActive(item) ? 'активний' : 'неактивний' }}
            </span>
          </div>
        </article>
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute, useRouter, type LocationQueryRaw } from 'vue-router'
import EmptyState from '../components/EmptyState.vue'
import {
  fetchAdminSpecialistSearch,
  getApiErrorMessage,
  type AdminSpecialistSearchItem,
} from '../lib/api'

const route = useRoute()
const router = useRouter()

const searchQuery = ref('')
const loading = ref(false)
const error = ref('')
const hasSearched = ref(false)
const results = ref<AdminSpecialistSearchItem[]>([])
const requestSeq = ref(0)

function firstQueryValue(value: unknown) {
  if (Array.isArray(value)) return value[0]
  return value
}

function normalizedQuery(value: unknown) {
  const raw = firstQueryValue(value)
  if (typeof raw !== 'string') return ''
  return raw.trim()
}

function trialActive(item: AdminSpecialistSearchItem) {
  return item.trial_active ?? item.active_trial
}

function overrideActive(item: AdminSpecialistSearchItem) {
  return item.override_active ?? item.active_override
}

function statusPillClass(active: boolean) {
  return ['status-pill', active ? 'status-pill--ok' : 'status-pill--muted']
}

function planLabel(value: string | null | undefined) {
  const normalized = String(value || '').trim().toUpperCase()
  if (normalized === 'START') return 'Start'
  if (normalized === 'PRO') return 'Pro'
  if (normalized === 'LEADER') return 'Leader'
  return value || '—'
}

function openDetail(specialistId: number) {
  router.push(`/admin/specialists/${specialistId}`)
}

async function runSearch(rawQuery: string) {
  const query = rawQuery.trim()
  if (!query) {
    hasSearched.value = false
    results.value = []
    error.value = ''
    return
  }

  const seq = ++requestSeq.value
  loading.value = true
  error.value = ''
  hasSearched.value = true

  try {
    const resp = await fetchAdminSpecialistSearch({ q: query, limit: 50 })
    if (seq !== requestSeq.value) return
    results.value = resp.results || []
  } catch (err) {
    if (seq !== requestSeq.value) return
    error.value = getApiErrorMessage(err, 'Не вдалося завантажити список спеціалістів.')
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

  const currentQuery = normalizedQuery(route.query.q)
  if (currentQuery === query) {
    await runSearch(query)
    return
  }
  await router.replace({ query: nextQuery })
}

async function clearSearch() {
  searchQuery.value = ''
  requestSeq.value += 1
  loading.value = false
  error.value = ''
  hasSearched.value = false
  results.value = []
  if (normalizedQuery(route.query.q)) {
    const nextQuery: LocationQueryRaw = { ...route.query }
    delete nextQuery.q
    await router.replace({ query: nextQuery })
  }
}

watch(
  () => route.query.q,
  async (value) => {
    const query = normalizedQuery(value)
    searchQuery.value = query
    await runSearch(query)
  },
  { immediate: true }
)
</script>

<style scoped>
.admin-specialists-search {
  display: grid;
  gap: 1rem;
}

.admin-specialists-search__hero {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.admin-specialists-search__title {
  margin: 0;
}

.admin-specialists-search__subtitle {
  margin: 0.5rem 0 0;
}

.search-form {
  display: grid;
  gap: 0.75rem;
}

.search-form__field {
  margin: 0;
}

.search-form__actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.results-list {
  display: grid;
  gap: 0.75rem;
}

.result-card {
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 12px;
  padding: 0.875rem;
  display: grid;
  gap: 0.6rem;
  cursor: pointer;
}

.result-card:focus-visible {
  outline: 2px solid rgba(31, 111, 235, 0.45);
  outline-offset: 2px;
}

.result-card__head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.75rem;
}

.result-card__title {
  margin: 0;
}

.result-card__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.5rem 0.75rem;
}

.result-card__badges {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 0.2rem 0.55rem;
  font-size: 0.78rem;
  font-weight: 600;
}

.status-pill--ok {
  background: rgba(5, 150, 105, 0.14);
  color: #047857;
}

.status-pill--muted {
  background: rgba(100, 116, 139, 0.16);
  color: #334155;
}

@media (max-width: 760px) {
  .admin-specialists-search__hero {
    flex-direction: column;
    align-items: stretch;
  }

  .result-card__head {
    flex-direction: column;
    align-items: stretch;
  }

  .result-card__grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
