<template>
  <section class="therapists">
    <header class="therapists__hero card">
      <div>
        <div class="eyebrow">????? ???????????</div>
        <h1 class="title">??????? ???????????</h1>
        <p class="muted">????????? ???????, ??? ??????????? ???????? ?????.</p>
      </div>
      <RouterLink class="btn btn--ghost" to="/client">????? ?? ????????</RouterLink>
    </header>

    <div class="card">
      <div class="card__title">???????????</div>
      <div v-if="loading" class="muted">???????????? ???????</div>
      <div v-else-if="error" class="form-error">{{ error }}</div>
      <div v-else-if="therapists.length === 0" class="muted">???? ????? ????????? ????????.</div>
      <div v-else class="therapist-grid">
        <RouterLink
          v-for="therapist in therapists"
          :key="therapist.public_slug"
          class="therapist-card"
          :to="`/specialist/${therapist.public_slug}`"
        >
          <img
            v-if="therapist.photo_url"
            :src="therapist.photo_url"
            :alt="publicName(therapist)"
            class="therapist-photo"
          />
          <div v-else class="therapist-photo therapist-photo--empty">????</div>
          <div class="therapist-info">
            <div class="therapist-name">{{ publicName(therapist) }}</div>
            <div class="muted meta-line">
              <span v-if="therapist.location">{{ therapist.location }}</span>
              <span v-if="languageLabel(therapist.languages)">{{ languageLabel(therapist.languages) }}</span>
            </div>
            <div v-if="priceLabel(therapist)" class="therapist-price">{{ priceLabel(therapist) }}</div>
            <div v-if="introPriceLabel(therapist)" class="therapist-price therapist-price--intro">
              ?????????: {{ introPriceLabel(therapist) }}
            </div>
          </div>
        </RouterLink>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { fetchPublicTherapists, type PublicSpecialistProfile } from '../lib/api'

const therapists = ref<PublicSpecialistProfile[]>([])
const loading = ref(false)
const error = ref('')

const languageLabel = (value?: string | string[]) => {
  if (!value) return ''
  if (Array.isArray(value)) return value.join(', ')
  return value
}

const priceLabel = (therapist: PublicSpecialistProfile) => {
  if (!therapist.price) return ''
  if (therapist.price_currency === 'USD') return `$${therapist.price}`
  if (therapist.price_currency === 'EUR') return `?${therapist.price}`
  return `${therapist.price} ???`
}

const introPriceLabel = (therapist: PublicSpecialistProfile) => {
  if (!therapist.intro_price) return ''
  if (therapist.intro_price_currency === 'USD') return `$${therapist.intro_price}`
  if (therapist.intro_price_currency === 'EUR') return `?${therapist.intro_price}`
  return `${therapist.intro_price} ???`
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

async function loadTherapists() {
  loading.value = true
  error.value = ''
  try {
    const resp = await fetchPublicTherapists({ page: 1, page_size: 12 })
    therapists.value = resp.results || []
  } catch {
    therapists.value = []
    error.value = '?? ??????? ??????????? ?????? ????????????.'
  } finally {
    loading.value = false
  }
}

onMounted(loadTherapists)
</script>

<style scoped>
.therapists {
  display: grid;
  gap: 20px;
}

.therapists__hero {
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
  text-decoration: none;
  color: inherit;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.therapist-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 16px 24px rgba(16, 33, 50, 0.12);
  border-color: rgba(31, 74, 96, 0.25);
}

.therapist-card:focus-visible {
  outline: 2px solid rgba(31, 74, 96, 0.35);
  outline-offset: 2px;
}

.therapist-photo {
  width: 100%;
  aspect-ratio: 1 / 1;
  height: auto;
  border-radius: 14px;
  object-fit: cover;
  border: 1px solid var(--line);
}

.therapist-photo--empty {
  display: grid;
  place-items: center;
  background: rgba(7, 47, 71, 0.06);
  color: var(--muted);
  aspect-ratio: 1 / 1;
}

.therapist-info {
  display: grid;
  gap: 6px;
}

.therapist-name {
  font-weight: 600;
}

.meta-line {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.meta-line span + span::before {
  content: " ?? ";
  color: var(--muted);
}

.therapist-price {
  font-weight: 600;
}

.therapist-price--intro {
  font-weight: 500;
  color: #4c5d6b;
}

.form-error {
  color: #b3261e;
  background: #fdecea;
  border: 1px solid #f5c2c0;
  border-radius: 10px;
  padding: 8px 10px;
  margin-top: 8px;
}

@media (max-width: 860px) {
  .therapists__hero {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
