<template>
  <section class="public-therapists">
    <header class="public-therapists__hero card">
      <div>
        <div class="eyebrow">????????? ???????</div>
        <h1 class="title">?????????</h1>
        <p class="muted">????? ?? ???????? ????????? ????????.</p>
      </div>
      <RouterLink class="btn btn--ghost" to="/">?? ???????</RouterLink>
    </header>

    <section class="card">
      <div class="card__title">?????</div>
      <div class="filters">
        <input v-model="query" class="input" type="text" placeholder="??'?, ?????????????, ???????" />
        <input v-model="language" class="input" type="text" placeholder="????" />
        <input v-model="location" class="input" type="text" placeholder="???????" />
        <input v-model="priceMin" class="input" type="number" min="0" placeholder="???? ???" />
        <input v-model="priceMax" class="input" type="number" min="0" placeholder="???? ??" />
        <select v-model="priceCurrency" class="input input--select">
          <option value="">??????</option>
          <option value="UAH">???</option>
          <option value="USD">$</option>
          <option value="EUR">?</option>
        </select>
        <select v-model="sort" class="input input--select">
          <option value="">??????????</option>
          <option value="name_asc">??'? (A?Z)</option>
          <option value="name_desc">??'? (Z?A)</option>
          <option value="price_asc">???? (???????)</option>
          <option value="price_desc">???? (???????)</option>
          <option value="created_desc">?????? ???????</option>
        </select>
        <button class="btn btn--ghost" type="button" @click="applyFilters">??????</button>
        <button class="btn btn--ghost" type="button" @click="resetFilters">???????</button>
      </div>
    </section>

    <section class="card">
      <div class="card__title">??????????</div>
      <div v-if="loading" class="muted">????????????...</div>
      <div v-else-if="therapists.length === 0" class="muted">?????? ?? ????????.</div>
      <div v-else class="therapist-grid">
        <article v-for="therapist in therapists" :key="therapist.public_slug" class="therapist-card">
          <RouterLink :to="`/t/${therapist.public_slug}`">
            <img
              v-if="therapist.photo_url"
              :src="therapist.photo_url"
              :alt="therapist.display_name"
              class="therapist-photo"
            />
            <div v-else class="therapist-photo therapist-photo--empty">????</div>
          </RouterLink>
          <div class="therapist-info">
            <div class="therapist-name">{{ therapist.display_name }}</div>
            <div class="muted">
              <span v-if="therapist.location">{{ therapist.location }}</span>
              <span v-if="languageLabel(therapist.languages)">{{ languageLabel(therapist.languages) }}</span>
            </div>
            <div v-if="priceLabel(therapist)" class="therapist-price">{{ priceLabel(therapist) }}</div>
          </div>
          <RouterLink class="btn btn--ghost" :to="`/t/${therapist.public_slug}`">???????? ???????</RouterLink>
        </article>
      </div>
      <div class="pagination">
        <div class="muted">
          ???????? {{ page }} ? {{ totalPages }} ? ?????? {{ total }}
        </div>
        <div class="pagination__controls">
          <button class="btn btn--ghost btn--sm" type="button" :disabled="page <= 1" @click="goPage(page - 1)">
            ?????
          </button>
          <button class="btn btn--ghost btn--sm" type="button" :disabled="page >= totalPages" @click="goPage(page + 1)">
            ????
          </button>
        </div>
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { fetchPublicTherapists, type PublicTherapistProfile } from '../lib/api'

const therapists = ref<PublicTherapistProfile[]>([])
const loading = ref(false)
const total = ref(0)
const totalPages = ref(1)
const page = ref(1)
const pageSize = ref(12)
const sort = ref('')
const query = ref('')
const language = ref('')
const location = ref('')
const priceMin = ref('')
const priceMax = ref('')
const priceCurrency = ref('')
const appliedQuery = ref('')
const appliedLanguage = ref('')
const appliedLocation = ref('')
const appliedPriceMin = ref('')
const appliedPriceMax = ref('')
const appliedPriceCurrency = ref('')

const languageLabel = (value?: string | string[]) => {
  if (!value) return ''
  if (Array.isArray(value)) return value.join(', ')
  return value
}

const priceLabel = (therapist: PublicTherapistProfile) => {
  if (!therapist.price) return ''
  if (therapist.price_currency === 'USD') return `$${therapist.price}`
  if (therapist.price_currency === 'EUR') return `?${therapist.price}`
  return `${therapist.price} ???`
}

async function loadTherapists() {
  loading.value = true
  try {
    const resp = await fetchPublicTherapists({
      page: page.value,
      page_size: pageSize.value,
      sort: sort.value || undefined,
      query: appliedQuery.value || undefined,
      language: appliedLanguage.value || undefined,
      location: appliedLocation.value || undefined,
      price_min: appliedPriceMin.value || undefined,
      price_max: appliedPriceMax.value || undefined,
      price_currency: appliedPriceCurrency.value || undefined,
    })
    therapists.value = resp.results || []
    total.value = resp.total || 0
    totalPages.value = resp.total_pages || 1
  } catch {
    therapists.value = []
    total.value = 0
    totalPages.value = 1
  } finally {
    loading.value = false
  }
}

function applyFilters() {
  appliedQuery.value = query.value
  appliedLanguage.value = language.value
  appliedLocation.value = location.value
  appliedPriceMin.value = priceMin.value
  appliedPriceMax.value = priceMax.value
  appliedPriceCurrency.value = priceCurrency.value
  page.value = 1
  loadTherapists()
}

function resetFilters() {
  query.value = ''
  language.value = ''
  location.value = ''
  priceMin.value = ''
  priceMax.value = ''
  priceCurrency.value = ''
  appliedQuery.value = ''
  appliedLanguage.value = ''
  appliedLocation.value = ''
  appliedPriceMin.value = ''
  appliedPriceMax.value = ''
  appliedPriceCurrency.value = ''
  page.value = 1
  loadTherapists()
}

function goPage(next: number) {
  page.value = next
  loadTherapists()
}

onMounted(loadTherapists)
</script>

<style scoped>
.public-therapists {
  display: grid;
  gap: 20px;
}

.public-therapists__hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
}

.eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.16em;
  font-size: 11px;
  color: var(--muted);
}

.filters {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  align-items: center;
}

.input--select {
  min-width: 160px;
}

.therapist-grid {
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  margin-top: 12px;
}

.therapist-card {
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 14px;
  display: grid;
  gap: 10px;
  background: rgba(7, 47, 71, 0.04);
}

.therapist-photo {
  width: 100%;
  height: 140px;
  border-radius: 14px;
  object-fit: cover;
  border: 1px solid var(--line);
}

.therapist-photo--empty {
  display: grid;
  place-items: center;
  background: rgba(7, 47, 71, 0.06);
  color: var(--muted);
  width: 100%;
  height: 140px;
  border-radius: 14px;
  border: 1px solid var(--line);
}

.therapist-info {
  display: grid;
  gap: 6px;
}

.therapist-name {
  font-weight: 600;
}

.therapist-price {
  font-weight: 600;
}

.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
}

.pagination__controls {
  display: flex;
  gap: 8px;
}

.btn--sm {
  padding: 6px 10px;
  font-size: 13px;
}

@media (max-width: 860px) {
  .public-therapists__hero {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
