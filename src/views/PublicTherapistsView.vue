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
        <button class="btn btn--ghost" type="button" @click="applyFilters">Знайти</button>
        <button class="btn btn--ghost" type="button" @click="resetFilters">Скинути</button>
      </div>
    </section>

    <section class="card">
      <div class="card__title">Результати</div>
      <div v-if="loading" class="muted">Завантаження...</div>
      <div v-else-if="filtered.length === 0" class="muted">Нічого не знайдено.</div>
      <div v-else class="therapist-grid">
        <article v-for="therapist in filtered" :key="therapist.public_slug" class="therapist-card">
          <RouterLink :to="`/t/${therapist.public_slug}`">
            <img
              v-if="therapist.photo_url"
              :src="therapist.photo_url"
              :alt="therapist.display_name"
              class="therapist-photo"
            />
            <div v-else class="therapist-photo therapist-photo--empty">Фото</div>
          </RouterLink>
          <div class="therapist-info">
            <div class="therapist-name">{{ therapist.display_name }}</div>
            <div class="muted">
              <span v-if="therapist.location">{{ therapist.location }}</span>
              <span v-if="languageLabel(therapist.languages)">{{ languageLabel(therapist.languages) }}</span>
            </div>
            <div v-if="priceLabel(therapist)" class="therapist-price">{{ priceLabel(therapist) }}</div>
          </div>
          <RouterLink class="btn btn--ghost" :to="`/t/${therapist.public_slug}`">Відкрити профіль</RouterLink>
        </article>
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { fetchPublicTherapists, type PublicTherapistProfile } from '../lib/api'

const therapists = ref<PublicTherapistProfile[]>([])
const loading = ref(false)
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

const filtered = computed(() => {
  const q = appliedQuery.value.trim().toLowerCase()
  const l = appliedLanguage.value.trim().toLowerCase()
  const loc = appliedLocation.value.trim().toLowerCase()
  const min = appliedPriceMin.value ? Number(appliedPriceMin.value) : null
  const max = appliedPriceMax.value ? Number(appliedPriceMax.value) : null
  const cur = appliedPriceCurrency.value.trim()
  return therapists.value.filter((t) => {
    const name = (t.display_name || '').toLowerCase()
    const specs = Array.isArray(t.specializations) ? t.specializations.join(',') : t.specializations || ''
    const langs = Array.isArray(t.languages) ? t.languages.join(',') : t.languages || ''
    const locStr = (t.location || '').toLowerCase()
    const price = t.price ? Number(t.price) : null
    const priceOk =
      (min === null || (price !== null && !Number.isNaN(price) && price >= min)) &&
      (max === null || (price !== null && !Number.isNaN(price) && price <= max)) &&
      (!cur || t.price_currency === cur)
    const matchQuery = !q || name.includes(q) || specs.toLowerCase().includes(q)
    const matchLang = !l || langs.toLowerCase().includes(l)
    const matchLoc = !loc || locStr.includes(loc)
    return matchQuery && matchLang && matchLoc && priceOk
  })
})

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

async function loadTherapists() {
  loading.value = true
  try {
    therapists.value = await fetchPublicTherapists(24, {
      query: appliedQuery.value || undefined,
      language: appliedLanguage.value || undefined,
      location: appliedLocation.value || undefined,
      price_min: appliedPriceMin.value || undefined,
      price_max: appliedPriceMax.value || undefined,
      price_currency: appliedPriceCurrency.value || undefined,
    })
  } catch {
    therapists.value = []
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

@media (max-width: 860px) {
  .public-therapists__hero {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
