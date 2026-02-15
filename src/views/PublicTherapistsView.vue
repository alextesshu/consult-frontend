<template>
  <section class="public-therapists">
    <header class="public-therapists__hero card">
      <div>
        <div class="eyebrow">Публічний каталог</div>
        <h1 class="title">Терапевти</h1>
        <p class="muted">Пошук та перегляд відкритих профілів.</p>
      </div>
      <RouterLink class="btn btn--ghost" to="/">На головну</RouterLink>
    </header>

    <section class="card">
      <div class="card__title">Пошук</div>
      <div class="filters">
        <input v-model="query" class="input" type="text" placeholder="Ім'я, спеціалізація, локація" />
        <input v-model="language" class="input" type="text" placeholder="Мова" />
        <input v-model="location" class="input" type="text" placeholder="Локація" />
        <input v-model="priceMin" class="input" type="number" min="0" placeholder="Ціна від" />
        <input v-model="priceMax" class="input" type="number" min="0" placeholder="Ціна до" />
        <select v-model="priceCurrency" class="input input--select">
          <option value="">Валюта</option>
          <option value="UAH">грн</option>
          <option value="USD">$</option>
          <option value="EUR">€</option>
        </select>
        <select v-model="sort" class="input input--select">
          <option value="">Сортування</option>
          <option value="name_asc">Ім'я (A→Z)</option>
          <option value="name_desc">Ім'я (Z→A)</option>
          <option value="price_asc">Ціна (дешевші)</option>
          <option value="price_desc">Ціна (дорожчі)</option>
          <option value="created_desc">Новіші профілі</option>
        </select>
        <button class="btn btn--ghost" type="button" @click="applyFilters">Знайти</button>
        <button class="btn btn--ghost" type="button" @click="resetFilters">Скинути</button>
      </div>
    </section>

    <section class="card">
      <div class="card__title">Результати</div>
      <LoadingSkeleton v-if="loading" variant="card" :count="6" height="140px" />
      <EmptyState
        v-else-if="therapists.length === 0"
        title="?????? ?? ????????"
        description="????????? ??????? ??????? ??? ??????? ?????."
      >
        <template #actions>
          <button class="btn btn--ghost" type="button" @click="resetFilters">??????? ???????</button>
        </template>
      </EmptyState>
      <div v-else class="therapist-grid">
        <article v-for="therapist in therapists" :key="therapist.public_slug" class="therapist-card">
          <RouterLink :to="`/t/${therapist.public_slug}`">
            <img
              v-if="therapist.photo_url"
              :src="therapist.photo_url"
              :alt="publicName(therapist)"
              class="therapist-photo"
            />
            <div v-else class="therapist-photo therapist-photo--empty">Фото</div>
          </RouterLink>
          <div class="therapist-info">
            <div class="therapist-name">{{ publicName(therapist) }}</div>
            <div class="muted">
              <span v-if="therapist.location">{{ therapist.location }}</span>
              <span v-if="languageLabel(therapist.languages)">{{ languageLabel(therapist.languages) }}</span>
            </div>
            <div v-if="priceLabel(therapist)" class="therapist-price">{{ priceLabel(therapist) }}</div>
          </div>
          <RouterLink class="btn btn--ghost" :to="`/t/${therapist.public_slug}`">Відкрити профіль</RouterLink>
        </article>
      </div>
      <div class="pagination">
        <div class="muted">
          Сторінка {{ page }} з {{ totalPages }} · Всього {{ total }}
        </div>
        <div class="pagination__controls">
          <button class="btn btn--ghost btn--sm" type="button" :disabled="page <= 1" @click="goPage(page - 1)">
            Назад
          </button>
          <button class="btn btn--ghost btn--sm" type="button" :disabled="page >= totalPages" @click="goPage(page + 1)">
            Далі
          </button>
        </div>
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { fetchPublicTherapists, type PublicTherapistProfile } from '../lib/api'
import { useToast } from '../composables/useToast'
import LoadingSkeleton from '../components/LoadingSkeleton.vue'
import EmptyState from '../components/EmptyState.vue'

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
const toast = useToast()

const languageLabel = (value?: string | string[]) => {
  if (!value) return ''
  if (Array.isArray(value)) return value.join(', ')
  return value
}

const priceLabel = (therapist: PublicTherapistProfile) => {
  if (!therapist.price) return ''
  if (therapist.price_currency === 'USD') return `$${therapist.price}`
  if (therapist.price_currency === 'EUR') return `€${therapist.price}`
  return `${therapist.price} грн`
}

const publicName = (therapist: PublicTherapistProfile) => {
  const raw = therapist.display_name || ''
  const parts = raw.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return ''
  if (parts.length === 1) return parts[0]
  const first = parts[0]
  const last = parts[parts.length - 1]
  if (!last) return first
  const initial = last.charAt(0).toUpperCase()
  return `${first} ${initial}.`
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
    toast.error('Не вдалося завантажити каталог')
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
