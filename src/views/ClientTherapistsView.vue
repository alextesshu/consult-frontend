<template>
  <section class="therapists">
    <header class="therapists__hero card">
      <div>
        <div class="eyebrow">Ваші спеціалісти</div>
        <h1 class="title">Спеціалісти, з якими ви працюєте</h1>
        <p class="muted">Переглядайте контакти, щоб планувати наступні сесії.</p>
      </div>
      <RouterLink class="btn btn--ghost" to="/client">Назад до кабінету</RouterLink>
    </header>

    <div class="card">
      <div class="card__title">Список спеціалістів</div>
      <LoadingSkeleton v-if="loading" variant="card" :count="4" height="140px" />
      <EmptyState
        v-else-if="error"
        title="Не вдалося завантажити список спеціалістів"
        :description="error"
        action-text="Відкрити каталог"
        action-to="/specialists"
      >
        <template #actions>
          <button class="btn btn--ghost" type="button" @click="loadTherapists">Спробувати ще раз</button>
        </template>
      </EmptyState>
      <EmptyState
        v-else-if="therapists.length === 0"
        title="Ще немає активних спеціалістів"
        description="Коли у вас з'являться активні спеціалісти, вони відобразяться тут."
        action-text="Відкрити каталог"
        action-to="/specialists"
      />
      <div v-else class="therapist-grid">
        <RouterLink
          v-for="therapist in therapists"
          :key="therapist.public_slug"
          class="therapist-card"
          :to="`/s/${therapist.public_slug}`"
        >
          <img
            v-if="therapist.photo_url"
            :src="therapist.photo_url"
            :alt="publicName(therapist)"
            class="therapist-photo"
          />
          <div v-else class="therapist-photo therapist-photo--empty">Фото</div>
          <div class="therapist-info">
            <div class="therapist-name">{{ publicName(therapist) }}</div>
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
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { fetchPublicSpecialists, type PublicSpecialistProfile } from '../lib/api'
import EmptyState from '../components/EmptyState.vue'
import LoadingSkeleton from '../components/LoadingSkeleton.vue'

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

async function loadTherapists() {
  loading.value = true
  error.value = ''
  try {
    const resp = await fetchPublicSpecialists({ page: 1, page_size: 12 })
    therapists.value = resp.results || []
  } catch {
    therapists.value = []
    error.value = 'Спробуйте ще раз або відкрийте загальний каталог спеціалістів.'
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
  font-size: 12px;
  color: var(--muted);
}

.therapist-grid {
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
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

.therapist-photo {
  width: 100%;
  height: 140px;
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

@media (max-width: 900px) {
  .therapists__hero {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
