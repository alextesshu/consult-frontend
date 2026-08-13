<template>
  <section class="discovery-page">
    <header class="discovery-page__hero">
      <div>
        <h1 class="title">Знайдіть спеціаліста для вашого запиту</h1>
        <p class="muted">Оберіть напрям або опишіть своїми словами, з чим хочете звернутися.</p>
      </div>
      <RouterLink class="btn btn--ghost hero-home-link" to="/">← На головну</RouterLink>
    </header>

    <section class="discovery-controls" aria-label="Пошук спеціалістів">
      <fieldset class="control-group">
        <legend>Спосіб пошуку</legend>
        <div class="segmented-control segmented-control--modes">
          <label><input name="specialist-discovery-mode" value="request" type="radio" :checked="mode === 'request'" @change="setMode('request')" />За запитом</label>
          <label><input name="specialist-discovery-mode" value="direction" type="radio" :checked="mode === 'direction'" @change="setMode('direction')" />За професійним напрямом</label>
        </div>
      </fieldset>

      <template v-if="mode === 'request'">
        <fieldset class="control-group">
          <legend>Оберіть запит</legend>
          <div class="choice-list request-group-controls__desktop">
            <label v-for="option in REQUEST_GROUP_OPTIONS" :key="option.code" class="choice-button">
              <input name="specialist-request-group" :value="option.code" type="radio" :checked="requestGroup === option.code" @change="setRequestGroup(option.code)" />
              <span>{{ option.label }}</span>
            </label>
            <button v-if="requestGroup" class="btn btn--ghost choice-list__clear" type="button" @click="setRequestGroup(null)">Очистити категорію</button>
          </div>
          <label class="request-group-controls__mobile" for="specialist-request-group-select">
            <span>Оберіть категорію запиту</span>
            <select id="specialist-request-group-select" class="input" :value="requestGroup || ''" @change="setRequestGroupFromSelect">
              <option value="">Усі запити</option>
              <option v-for="option in REQUEST_GROUP_OPTIONS" :key="option.code" :value="option.code">{{ option.label }}</option>
            </select>
          </label>
        </fieldset>
        <form class="query-form" @submit.prevent="submitQuery">
          <label for="discovery-query">Опишіть запит своїми словами</label>
          <div class="query-form__row">
            <input id="discovery-query" v-model="queryDraft" class="input" type="text" placeholder="Наприклад: не можу впоратися з тривогою" :aria-invalid="fieldError?.field === 'q' ? 'true' : undefined" :aria-describedby="fieldError?.field === 'q' ? 'discovery-query-error' : undefined" />
            <button class="btn" type="submit">Знайти</button>
          </div>
          <p v-if="fieldError?.field === 'q'" id="discovery-query-error" class="form-error">{{ fieldError.detail }}</p>
        </form>
      </template>

      <fieldset v-else class="control-group">
        <legend>Оберіть професійний напрям</legend>
        <div class="choice-list">
          <label v-for="option in DIRECTION_OPTIONS" :key="option.code" class="choice-button">
            <input name="specialist-direction" :value="option.code" type="radio" :checked="direction === option.code" @change="setDirection(option.code)" />
            <span>{{ option.label }}</span>
          </label>
        </div>
      </fieldset>

      <fieldset class="control-group">
        <legend>Формат</legend>
        <div class="segmented-control segmented-control--format">
          <label><input name="specialist-format" value="" type="radio" :checked="format === null" @change="setFormat(null)" />Усі формати</label>
          <label><input name="specialist-format" value="online" type="radio" :checked="format === 'online'" @change="setFormat('online')" />Онлайн</label>
          <label><input name="specialist-format" value="offline" type="radio" :checked="format === 'offline'" @change="setFormat('offline')" />Офлайн</label>
        </div>
      </fieldset>

      <div v-if="hasActiveSearch" class="active-search">
        <span>{{ activeSearchSummary }}</span>
        <button class="btn btn--ghost" type="button" @click="reset">Скинути пошук</button>
      </div>
      <p v-if="fieldError && fieldError.field !== 'q'" class="form-error" role="alert">
        {{ fieldError.detail }}
      </p>
    </section>

    <details class="legacy-lookup">
      <summary>Знайти конкретного спеціаліста</summary>
      <div class="legacy-lookup__content">
        <p class="muted">Введіть ім’я спеціаліста або вставте частину посилання на його публічний профіль.</p>
        <form class="query-form" @submit.prevent="submitLegacySearch">
          <label for="legacy-specialist-search">Ім’я або посилання</label>
          <div class="query-form__row"><input id="legacy-specialist-search" v-model="legacyQuery" class="input" type="text" autocomplete="off" /><button class="btn" type="submit">Знайти профіль</button></div>
          <p v-if="legacyValidation" class="form-error">{{ legacyValidation }}</p>
        </form>
        <LoadingSkeleton v-if="legacyLoading" variant="card" :count="2" height="150px" />
        <EmptyState v-else-if="legacyError" title="Не вдалося виконати пошук" description="Спробуйте ще раз трохи пізніше."><template #actions><button class="btn btn--ghost" type="button" @click="retryLegacySearch">Спробувати ще раз</button></template></EmptyState>
        <EmptyState v-else-if="legacySearched && legacyResults.length === 0" title="Профіль не знайдено" description="Перевірте написання або попросіть спеціаліста надіслати пряме посилання." />
        <div v-else-if="legacyResults.length" class="result-list legacy-lookup__results"><PublicSpecialistCard v-for="item in legacyResults" :key="item.public_profile_path || item.public_slug || item.slug" :item="item" /></div>
      </div>
    </details>

    <section class="results" :aria-busy="loading" aria-live="polite">
      <p v-if="isPendingDirection" class="direction-pending">Оберіть професійний напрям, щоб переглянути спеціалістів.</p>
      <template v-else>
        <div class="results__header">
          <div>
            <h2 ref="resultsHeading" tabindex="-1">{{ specialistCount(response?.total ?? 0) }}</h2>
            <p class="muted">Порядок результатів не є рейтингом.</p>
          </div>
        </div>

        <LoadingSkeleton v-if="loading" variant="card" :count="3" height="176px" />
        <EmptyState v-else-if="requestError" title="Не вдалося завантажити спеціалістів" :description="requestError">
          <template #actions><button class="btn btn--ghost" type="button" @click="retry">Спробувати ще раз</button></template>
        </EmptyState>
        <EmptyState v-else-if="response && response.total === 0" :title="hasActiveSearch ? 'За вашим запитом поки немає результатів' : 'Каталог спеціалістів поки порожній'" :description="hasActiveSearch ? 'Спробуйте змінити категорію, опис запиту або формат роботи.' : 'Поверніться сюди трохи пізніше.'">
          <template v-if="hasActiveSearch" #actions><button class="btn btn--ghost" type="button" @click="reset">Скинути пошук</button></template>
        </EmptyState>
        <template v-else>
          <section v-for="group in visibleGroups" :key="group.code" class="result-group" :aria-labelledby="`group-${group.code}`">
            <div class="result-group__header">
              <h2 :id="`group-${group.code}`">{{ group.label }}</h2>
              <span class="muted">{{ group.total }}</span>
            </div>
            <div class="result-list">
              <PublicSpecialistCard v-for="item in group.items" :key="item.public_profile_path || item.public_slug || item.slug" :item="item" />
            </div>
          </section>
        </template>

        <nav v-if="response && response.total_pages > 1" class="pagination" aria-label="Сторінки каталогу">
          <button class="btn btn--ghost" type="button" :disabled="response.page <= 1" @click="setPage(response.page - 1)">Попередня</button>
          <span>Сторінка {{ response.page }} з {{ response.total_pages }}</span>
          <button class="btn btn--ghost" type="button" :disabled="response.page >= response.total_pages" @click="setPage(response.page + 1)">Наступна</button>
        </nav>
      </template>
    </section>

  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { fetchPublicSpecialists, type PublicSpecialistProfile } from '../lib/api'
import PublicSpecialistCard from '../components/PublicSpecialistCard.vue'
import EmptyState from '../components/EmptyState.vue'
import LoadingSkeleton from '../components/LoadingSkeleton.vue'
import { DIRECTION_OPTIONS, REQUEST_GROUP_OPTIONS, useSpecialistDiscovery } from '../composables/useSpecialistDiscovery'
import { markClientAcquisitionDiscoveryUsed } from '../lib/clientAcquisitionAttribution'
import { productAnalytics } from '../lib/productAnalytics'

const discovery = useSpecialistDiscovery()
const route = useRoute()
markClientAcquisitionDiscoveryUsed()
productAnalytics.capture('specialist_discovery_opened')
const { mode, queryDraft, requestGroup, direction, format, response, loading, fieldError, requestError, hasActiveSearch, focusResultsAfterPagination, isPendingDirection, submitQuery, setMode, setRequestGroup, setDirection, setFormat, setPage, reset, retry, consumeFocusResultsAfterPagination } = discovery
const resultsHeading = ref<HTMLElement | null>(null)
const legacyQuery = ref('')
const legacyLoading = ref(false)
const legacyError = ref(false)
const legacySearched = ref(false)
const legacyValidation = ref('')
const legacyLastQuery = ref('')
const legacyResults = ref<PublicSpecialistProfile[]>([])

const visibleGroups = computed(() => (response.value?.groups || []).filter((group) => group.items.length > 0))
const trackedDiscoveryResultStates = new Set<string>()
const activeSearchSummary = computed(() => {
  if (mode.value === 'direction') return direction.value ? 'Пошук за професійним напрямом' : format.value ? 'Активний фільтр формату' : ''
  if (queryDraft.value || requestGroup.value) return 'Активний пошук за запитом'
  return format.value ? 'Активний фільтр формату' : ''
})

function setRequestGroupFromSelect(event: Event) {
  const value = (event.target as HTMLSelectElement).value
  void setRequestGroup(value ? value as typeof requestGroup.value : null)
}

function specialistCount(total: number) {
  const lastTwoDigits = total % 100
  const lastDigit = total % 10
  const label = lastTwoDigits >= 11 && lastTwoDigits <= 14
    ? 'спеціалістів'
    : lastDigit === 1
      ? 'спеціаліст'
      : lastDigit >= 2 && lastDigit <= 4
        ? 'спеціалісти'
        : 'спеціалістів'
  return `${total} ${label}`
}

function profileSlugFromPath(pathname: string) {
  const match = pathname.match(/^\/s\/([^/?#]+)\/?$/)
  return match?.[1] ? decodeURIComponent(match[1]).trim() : ''
}

function normalizeLegacyQuery(value: string) {
  const query = value.trim()
  if (!query) return ''
  if (query.startsWith('/s/')) return profileSlugFromPath(query) || query
  try { return profileSlugFromPath(new URL(query).pathname) || query } catch { /* Try a domain-prefixed URL. */ }
  if (/^[\w.-]+\/s\/[^/?#\s]+\/?(?:[?#].*)?$/.test(query)) {
    try { return profileSlugFromPath(new URL(`https://${query}`).pathname) || query } catch { return query }
  }
  return query
}

async function runLegacySearch(query: string) {
  legacyLoading.value = true
  legacyError.value = false
  legacyValidation.value = ''
  try {
    const result = await fetchPublicSpecialists({ name: query, page_size: 5 })
    legacyResults.value = result.results || []
    legacySearched.value = true
    legacyLastQuery.value = query
  } catch {
    legacyError.value = true
    legacyResults.value = []
  } finally { legacyLoading.value = false }
}

async function submitLegacySearch() {
  const query = normalizeLegacyQuery(legacyQuery.value)
  if (query.length < 3) { legacyValidation.value = 'Введіть щонайменше 3 символи для пошуку.'; return }
  legacyQuery.value = query
  await runLegacySearch(query)
}

async function retryLegacySearch() { await runLegacySearch(legacyLastQuery.value || normalizeLegacyQuery(legacyQuery.value)) }

watch(focusResultsAfterPagination, async (shouldFocus) => {
  if (!shouldFocus) return
  await nextTick()
  resultsHeading.value?.focus()
  resultsHeading.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  consumeFocusResultsAfterPagination()
})

watch(response, (nextResponse) => {
  if (!nextResponse || !nextResponse.groups.some((group) => group.items.length > 0)) return
  const stateKey = route.fullPath
  if (trackedDiscoveryResultStates.has(stateKey)) return
  trackedDiscoveryResultStates.add(stateKey)
  productAnalytics.capture('specialist_discovery_results_viewed')
})
</script>

<style scoped>
.discovery-page { display: grid; gap: 20px; min-width: 0; }
.discovery-page__hero, .discovery-controls, .legacy-lookup { border: 1px solid var(--line); border-radius: var(--radius-lg); background: #fff; padding: 22px 24px; min-width: 0; }
.discovery-page__hero, .results__header, .result-group__header, .active-search, .pagination { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.discovery-page__hero .title, .result-group h2, .results h2 { margin: 0; }
.discovery-controls, .control-group, .query-form, .result-group, .results { display: grid; gap: 12px; min-width: 0; }
.control-group { margin: 0; padding: 0; border: 0; }
.control-group legend, .query-form label { font-weight: 700; }
.segmented-control, .choice-list { display: flex; flex-wrap: wrap; gap: 8px; }
.segmented-control label, .choice-button { align-items: center; border: 1px solid var(--line); background: #fff; border-radius: 6px; cursor: pointer; display: inline-flex; min-height: 44px; padding: 9px 12px; }
.segmented-control label:has(input:checked), .choice-button[aria-pressed='true'] { background: rgba(15, 118, 110, .1); border-color: rgba(15, 118, 110, .55); font-weight: 700; }
.choice-button:has(input:checked) { background: rgba(15, 118, 110, .1); border-color: rgba(15, 118, 110, .55); font-weight: 700; }
.segmented-control input { accent-color: #0f766e; }
.choice-button input { accent-color: #0f766e; }
.choice-list__clear { min-height: 44px; }
.request-group-controls__mobile { display: none; }
.query-form__row { display: flex; gap: 10px; align-items: center; }
.query-form__row .input { flex: 1; min-width: 0; }
.direction-pending { margin: 0; max-width: 52ch; }
.result-group { padding-top: 4px; }
.result-list { display: grid; gap: 14px; }
.pagination { justify-content: center; flex-wrap: wrap; }
.legacy-lookup summary { cursor: pointer; font-weight: 700; }
.legacy-lookup__content { display: grid; gap: 14px; margin-top: 16px; }
@media (max-width: 720px) {
  .discovery-page__hero, .results__header, .active-search { align-items: stretch; flex-direction: column; }
  .discovery-page__hero, .discovery-controls, .legacy-lookup { padding: 16px; }
  .request-group-controls__desktop { display: none; }
  .request-group-controls__mobile { display: grid; gap: 6px; width: 100%; }
  .request-group-controls__mobile .input { min-height: 44px; width: 100%; }
  .segmented-control--modes { display: grid; grid-template-columns: minmax(0, 1fr); }
  .segmented-control--modes label { width: 100%; }
  .segmented-control--format { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .segmented-control--format label { justify-content: center; min-width: 0; padding-inline: 6px; text-align: center; white-space: normal; }
  .query-form__row { align-items: stretch; }
  .segmented-control label, .choice-button { max-width: 100%; }
}
@media (max-width: 480px) {
  .discovery-page { gap: 14px; }
  .discovery-page__hero { gap: 8px; padding: 14px; }
  .discovery-page__hero .title { font-size: 35px; line-height: 1.12; }
  .discovery-page__hero .muted { font-size: 14px; line-height: 1.45; }
  .hero-home-link { align-self: flex-start; border: 0; min-height: auto; padding: 2px 0; }
  .hero-home-link:focus-visible { outline: 2px solid rgba(15, 118, 110, .65); outline-offset: 3px; }
  .query-form__row { flex-direction: column; }
  .query-form__row .btn { width: 100%; }
}
@media (max-width: 360px) {
  .discovery-page__hero .title { font-size: 33px; }
}
</style>
