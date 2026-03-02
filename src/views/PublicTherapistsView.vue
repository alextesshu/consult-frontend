<template>
  <section class="public-therapists">
    <header class="public-therapists__hero card">
      <div>
        <div class="badge badge--soft">Каталог спеціалістів</div>
        <h1 class="title">Знайдіть спеціаліста</h1>
        <p class="muted">Обирайте спеціаліста і бронюйте першу сесію.</p>
      </div>
      <RouterLink class="btn btn--ghost" to="/">На головну</RouterLink>
    </header>

    <section class="card">
      <div class="card__title">Пошук та фільтри</div>
      <div class="filters">
        <div class="filters__row">
          <input
            v-model="nameQuery"
            class="input"
            type="text"
            placeholder="Ім'я або прізвище"
            @input="scheduleSearch"
            @keyup.enter="applyFilters"
          />
          <input
            v-model="specialization"
            class="input"
            type="text"
            placeholder="Спеціалізація"
            list="catalogSpecializationOptions"
            @input="scheduleSearch"
            @keyup.enter="applyFilters"
          />
          <input
            v-model="language"
            class="input"
            type="text"
            placeholder="Мова"
            list="catalogLanguageOptions"
            @input="scheduleSearch"
            @keyup.enter="applyFilters"
          />
          <input
            v-model="location"
            class="input"
            type="text"
            placeholder="Місто"
            @input="scheduleSearch"
            @keyup.enter="applyFilters"
          />
        </div>
        <datalist id="catalogSpecializationOptions">
          <option v-for="option in specializationOptions" :key="option" :value="option" />
        </datalist>
        <datalist id="catalogLanguageOptions">
          <option v-for="option in languageOptions" :key="option" :value="option" />
        </datalist>
        <div class="filters__row">
          <input v-model="priceMin" class="input" type="number" min="0" placeholder="Ціна від" @input="scheduleSearch" />
          <input v-model="priceMax" class="input" type="number" min="0" placeholder="Ціна до" @input="scheduleSearch" />
          <select v-model="priceCurrency" class="input input--select" @change="applyFilters">
            <option value="">Валюта</option>
            <option value="UAH">грн</option>
            <option value="USD">$</option>
            <option value="EUR">€</option>
          </select>
          <select v-model="sort" class="input input--select" @change="applyFilters">
            <option value="">Сортування</option>
            <option value="name_asc">Ім'я (А-Я)</option>
            <option value="name_desc">Ім'я (Я-А)</option>
            <option value="price_asc">Ціна (зростання)</option>
            <option value="price_desc">Ціна (спадання)</option>
            <option value="experience_desc">Досвід (спадання)</option>
            <option value="experience_asc">Досвід (зростання)</option>
            <option value="created_desc">Новіші спочатку</option>
          </select>
        </div>
        <div class="filters__actions">
          <button class="btn btn--ghost" type="button" @click="applyFilters">Застосувати</button>
          <button class="btn btn--ghost" type="button" :disabled="!hasFilters" @click="resetFilters">Скинути</button>
          <div class="filters__hint muted">
            Почніть із пошуку по імені спеціаліста. Рекомендуємо не вводити одразу всі параметри — так
            легше знайти потрібного спеціаліста.
          </div>
        </div>
      </div>
    </section>

    <section class="card">
      <div class="card__title">Спеціалісти</div>
      <LoadingSkeleton v-if="loading" variant="card" :count="6" height="140px" />
      <EmptyState
        v-else-if="therapists.length === 0"
        title="Нічого не знайдено"
        description="Спробуйте змінити фільтри або очистити пошук."
      >
        <template #actions>
          <button class="btn btn--ghost" type="button" @click="resetFilters">Скинути фільтри</button>
        </template>
      </EmptyState>
      <div v-else class="therapist-grid">
        <RouterLink
          v-for="therapist in therapists"
          :key="therapist.public_slug"
          class="therapist-card"
          :to="`/specialist/${therapist.public_slug}`"
        >
          <div class="therapist-photo-link">
            <img
              v-if="therapist.photo_url"
              :src="therapist.photo_url"
              :alt="publicName(therapist)"
              class="therapist-photo"
            />
            <div v-else class="therapist-photo therapist-photo--empty">Фото</div>
          </div>
          <div class="therapist-info">
            <div class="therapist-name">{{ publicName(therapist) }}</div>
            <div v-if="therapist.experience_years !== undefined && therapist.experience_years !== null" class="muted">
              Досвід: {{ formatExperience(therapist.experience_years) }}
            </div>
            <div class="muted meta-line">
              <span v-if="therapist.location">{{ therapist.location }}</span>
              <span v-if="languageLabel(therapist.languages)">{{ languageLabel(therapist.languages) }}</span>
            </div>
            <div v-if="priceLabel(therapist)" class="therapist-price">{{ priceLabel(therapist) }}</div>
            <div v-if="introPriceLabel(therapist)" class="therapist-price therapist-price--intro">
              Ознайомча: {{ introPriceLabel(therapist) }}
            </div>
          </div>
        </RouterLink>
      </div>
      <div class="pagination">
        <div class="muted">Сторінка {{ page }} з {{ totalPages }} · Всього {{ total }}</div>
        <div class="pagination__controls">
          <button class="btn btn--ghost btn--sm" type="button" :disabled="page <= 1" @click="goPage(page - 1)">Назад</button>
          <button class="btn btn--ghost btn--sm" type="button" :disabled="page >= totalPages" @click="goPage(page + 1)">Далі</button>
        </div>
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { fetchPublicTherapists, type PublicSpecialistProfile } from '../lib/api'
import { useToast } from '../composables/useToast'
import LoadingSkeleton from '../components/LoadingSkeleton.vue'
import EmptyState from '../components/EmptyState.vue'

const therapists = ref<PublicSpecialistProfile[]>([])
const loading = ref(false)
const total = ref(0)
const totalPages = ref(1)
const page = ref(1)
const pageSize = ref(12)
const sort = ref('')
const nameQuery = ref('')
const specialization = ref('')
const language = ref('')
const location = ref('')
const priceMin = ref('')
const priceMax = ref('')
const priceCurrency = ref('')
const appliedName = ref('')
const appliedSpecialization = ref('')
const appliedLanguage = ref('')
const appliedLocation = ref('')
const appliedPriceMin = ref('')
const appliedPriceMax = ref('')
const appliedPriceCurrency = ref('')
const toast = useToast()
let searchTimer: number | undefined
const languageOptions = [
  'Українська',
  'Російська',
  'English',
  'Polski',
  'Deutsch',
  'Français',
  'Español',
  'Italiano',
  'Português',
  'Čeština',
  'Slovenčina',
]

const specializationOptions = [
  'Сімейна терапія',
  'Гештальт терапія',
  'Клієнт-центрована терапія',
  'Когнітивно-поведінкова терапія',
  'Терапія прийняття і відповідальності (ACT)',
  'Психоаналітична терапія',
  'Психотерапія',
  'Коучинг',
  'Психіатрія',
  'Арт-терапія',
  'Екзистенційна терапія',
  'Психодрама',
  'Інше',
]
const hasFilters = computed(
  () =>
    Boolean(nameQuery.value) ||
    Boolean(specialization.value) ||
    Boolean(language.value) ||
    Boolean(location.value) ||
    Boolean(priceMin.value) ||
    Boolean(priceMax.value) ||
    Boolean(priceCurrency.value) ||
    Boolean(sort.value)
)

const languageLabel = (value?: string | string[]) => {
  if (!value) return ''
  if (Array.isArray(value)) return value.join(', ')
  return value
}

const priceLabel = (therapist: PublicSpecialistProfile) => {
  if (!therapist.price) return ''
  if (therapist.price_currency === 'USD') return `$${therapist.price}`
  if (therapist.price_currency === 'EUR') return `€${therapist.price}`
  return `${therapist.price} грн`
}

const introPriceLabel = (therapist: PublicSpecialistProfile) => {
  if (!therapist.intro_price) return ''
  if (therapist.intro_price_currency === 'USD') return `$${therapist.intro_price}`
  if (therapist.intro_price_currency === 'EUR') return `€${therapist.intro_price}`
  return `${therapist.intro_price} грн`
}

const publicName = (therapist: PublicSpecialistProfile) => {
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

const formatExperience = (value: number) => {
  if (value === 0) return '0 років'
  if (value === 1) return '1 рік'
  if (value >= 2 && value <= 4) return `${value} роки`
  return `${value} років`
}

async function loadTherapists() {
  loading.value = true
  try {
    const resp = await fetchPublicTherapists({
      page: page.value,
      page_size: pageSize.value,
      sort: sort.value || undefined,
      name: appliedName.value || undefined,
      specialization: appliedSpecialization.value || undefined,
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
    toast.error('Не вдалося завантажити список спеціалістів')
  } finally {
    loading.value = false
  }
}

function applyFilters() {
  appliedName.value = nameQuery.value
  appliedSpecialization.value = specialization.value
  appliedLanguage.value = language.value
  appliedLocation.value = location.value
  appliedPriceMin.value = priceMin.value
  appliedPriceMax.value = priceMax.value
  appliedPriceCurrency.value = priceCurrency.value
  page.value = 1
  loadTherapists()
}

function scheduleSearch() {
  if (searchTimer) {
    window.clearTimeout(searchTimer)
  }
  searchTimer = window.setTimeout(() => {
    applyFilters()
  }, 450)
}

function resetFilters() {
  nameQuery.value = ''
  specialization.value = ''
  language.value = ''
  location.value = ''
  priceMin.value = ''
  priceMax.value = ''
  priceCurrency.value = ''
  sort.value = ''
  appliedName.value = ''
  appliedSpecialization.value = ''
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
  background: linear-gradient(135deg, rgba(8, 113, 201, 0.16), rgba(7, 47, 71, 0.06));
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 22px 24px;
  box-shadow: var(--shadow);
}

.public-therapists__hero > div {
  display: grid;
  gap: 8px;
  justify-items: start;
}

.public-therapists__hero .badge {
  text-transform: uppercase;
  letter-spacing: 0.18em;
  font-size: 11px;
}

.public-therapists__hero .title {
  font-size: 32px;
}

.public-therapists__hero .muted {
  max-width: 520px;
}

.filters {
  display: grid;
  gap: 12px;
}

.filters__row {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
}

.filters__actions {
  display: grid;
  gap: 10px;
}

.filters__hint {
  font-size: 13px;
}

.therapist-grid {
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
}

.therapist-card {
  display: grid;
  gap: 12px;
  padding: 14px;
  border-radius: 16px;
  border: 1px solid var(--line);
  background: #fff;
  transition: box-shadow 0.2s ease, transform 0.2s ease;
  text-decoration: none;
  color: inherit;
}

.therapist-card:hover {
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.1);
  transform: translateY(-2px);
}

.therapist-card:focus-visible {
  outline: 2px solid rgba(15, 118, 110, 0.6);
  outline-offset: 2px;
}

.therapist-photo-link {
  display: grid;
}

.therapist-photo {
  width: 100%;
  height: 150px;
  object-fit: cover;
  border-radius: 14px;
}

.therapist-photo--empty {
  display: grid;
  place-items: center;
  background: rgba(15, 23, 42, 0.06);
  color: var(--muted);
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

.therapist-price--intro {
  color: var(--muted);
}

.meta-line {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 12px;
}

.pagination__controls {
  display: flex;
  gap: 8px;
}

@media (max-width: 900px) {
  .public-therapists__hero {
    flex-direction: column;
    align-items: flex-start;
  }
  .pagination {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
