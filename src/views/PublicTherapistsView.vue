<template>
  <section class="profile-finder">
    <header class="profile-finder__hero card">
      <div class="profile-finder__hero-copy">
        <h1 class="title">Знайти профіль спеціаліста</h1>
        <p class="muted">
          Якщо ви знаєте ім’я спеціаліста або маєте частину посилання, знайдіть його публічний профіль у
          Pro Consult і залиште запит без реєстрації.
        </p>
      </div>
      <RouterLink class="btn btn--ghost" to="/">На головну</RouterLink>
    </header>

    <section class="card">
      <form class="finder-form" @submit.prevent="submitSearch">
        <label class="finder-form__field" for="specialist-search-input">
          <span class="finder-form__label">Пошук профілю</span>
          <input
            id="specialist-search-input"
            v-model="searchQuery"
            class="input"
            type="text"
            placeholder="Ім’я спеціаліста або частина посилання"
            autocomplete="off"
          />
        </label>
        <button class="btn" type="submit">Знайти профіль</button>
      </form>
      <p v-if="validationMessage" class="form-error">{{ validationMessage }}</p>
    </section>

    <section class="card">
      <div class="card__title">Результати пошуку</div>

      <LoadingSkeleton v-if="loading" variant="card" :count="3" height="176px" />

      <EmptyState
        v-else-if="error"
        title="Не вдалося виконати пошук"
        description="Спробуйте ще раз трохи пізніше."
      >
        <template #actions>
          <button class="btn btn--ghost" type="button" @click="retrySearch">Спробувати ще раз</button>
        </template>
      </EmptyState>

      <EmptyState
        v-else-if="!hasSearched"
        title="Знайти профіль спеціаліста"
        description="Введіть ім’я спеціаліста або частину посилання на профіль."
      />

      <EmptyState
        v-else-if="results.length === 0"
        title="Профіль не знайдено"
        description="Перевірте написання імені або попросіть спеціаліста надіслати пряме посилання на профіль."
      />

      <div v-else class="result-list">
        <RouterLink
          v-for="specialist in results"
          :key="specialist.slug || specialist.public_slug"
          class="result-card"
          :to="profileRoute(specialist)"
        >
          <div class="result-card__media">
            <img
              v-if="specialist.photo_url"
              :src="specialist.photo_url"
              :alt="publicName(specialist)"
              class="result-card__photo"
            />
            <div v-else class="result-card__photo result-card__photo--empty">Фото</div>
          </div>

          <div class="result-card__body">
            <div class="result-card__head">
              <div class="result-card__name">{{ publicName(specialist) }}</div>
              <p v-if="primarySpecialization(specialist)" class="result-card__headline">
                {{ primarySpecialization(specialist) }}
              </p>
            </div>

            <p v-if="specialist.public_profile_summary" class="result-card__summary">
              {{ specialist.public_profile_summary }}
            </p>

            <dl class="result-card__details">
              <div v-if="specializationText(specialist)" class="result-card__detail">
                <dt>Теми</dt>
                <dd>{{ specializationText(specialist) }}</dd>
              </div>
              <div v-if="formatText(specialist)" class="result-card__detail">
                <dt>Формат</dt>
                <dd>{{ formatText(specialist) }}</dd>
              </div>
              <div v-if="specialist.location" class="result-card__detail">
                <dt>Локація</dt>
                <dd>{{ specialist.location }}</dd>
              </div>
            </dl>

            <div class="result-card__actions">
              <span class="btn btn--ghost result-card__cta">Відкрити профіль</span>
            </div>
          </div>
        </RouterLink>
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { fetchPublicSpecialists, type PublicSpecialistProfile } from '../lib/api'
import EmptyState from '../components/EmptyState.vue'
import LoadingSkeleton from '../components/LoadingSkeleton.vue'

const searchQuery = ref('')
const loading = ref(false)
const error = ref(false)
const hasSearched = ref(false)
const validationMessage = ref('')
const lastSubmittedQuery = ref('')
const results = ref<PublicSpecialistProfile[]>([])

const trimmedQuery = computed(() => searchQuery.value.trim())

function publicName(specialist: PublicSpecialistProfile) {
  return (specialist.public_display_name || specialist.display_name || '').trim()
}

function specializations(specialist: PublicSpecialistProfile) {
  const value = specialist.specializations
  if (Array.isArray(value)) return value.map((item) => item.trim()).filter(Boolean)
  if (typeof value === 'string' && value.trim()) return [value.trim()]
  return []
}

function primarySpecialization(specialist: PublicSpecialistProfile) {
  return specializations(specialist)[0] || ''
}

function specializationText(specialist: PublicSpecialistProfile) {
  return specializations(specialist).join(', ')
}

function formatText(specialist: PublicSpecialistProfile) {
  const items = []
  if (specialist.offers_online) items.push('Онлайн')
  if (specialist.offers_offline) items.push('Офлайн')
  return items.join(' · ')
}

function profileRoute(specialist: PublicSpecialistProfile) {
  const slug = (specialist.slug || specialist.public_slug || '').trim()
  return slug ? `/s/${slug}` : '/specialists'
}

async function runSearch(query: string) {
  loading.value = true
  error.value = false
  validationMessage.value = ''
  try {
    const response = await fetchPublicSpecialists({
      name: query,
      page_size: 5,
    })
    results.value = response.results || []
    hasSearched.value = true
    lastSubmittedQuery.value = query
  } catch {
    error.value = true
    results.value = []
  } finally {
    loading.value = false
  }
}

async function submitSearch() {
  const query = trimmedQuery.value
  if (query.length < 3) {
    validationMessage.value = 'Введіть щонайменше 3 символи для пошуку.'
    hasSearched.value = false
    results.value = []
    error.value = false
    return
  }
  await runSearch(query)
}

async function retrySearch() {
  if (!lastSubmittedQuery.value) {
    await submitSearch()
    return
  }
  await runSearch(lastSubmittedQuery.value)
}
</script>

<style scoped>
.profile-finder {
  display: grid;
  gap: 20px;
}

.profile-finder__hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  padding: 22px 24px;
}

.profile-finder__hero-copy {
  display: grid;
  gap: 10px;
  max-width: 680px;
}

.finder-form {
  display: flex;
  align-items: end;
  gap: 12px;
}

.finder-form__field {
  flex: 1;
  display: grid;
  gap: 6px;
}

.finder-form__label {
  font-size: 14px;
  font-weight: 600;
}

.result-list {
  display: grid;
  gap: 16px;
}

.result-card {
  display: grid;
  grid-template-columns: 176px minmax(0, 1fr);
  gap: 20px;
  align-items: start;
  padding: 18px;
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background: #fff;
  color: inherit;
  text-decoration: none;
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}

.result-card:hover {
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
  transform: translateY(-1px);
}

.result-card:focus-visible {
  outline: 2px solid rgba(15, 118, 110, 0.5);
  outline-offset: 2px;
}

.result-card__media {
  min-width: 0;
}

.result-card__photo {
  display: block;
  width: 100%;
  aspect-ratio: 1 / 1;
  object-fit: cover;
  border-radius: var(--radius-md);
  background: rgba(15, 23, 42, 0.04);
}

.result-card__photo--empty {
  display: grid;
  place-items: center;
  color: var(--muted);
  font-weight: 600;
}

.result-card__body {
  display: grid;
  gap: 14px;
  min-width: 0;
}

.result-card__head {
  display: grid;
  gap: 6px;
}

.result-card__name {
  font-size: 22px;
  font-weight: 700;
  line-height: 1.2;
  color: var(--text);
}

.result-card__headline {
  margin: 0;
  font-size: 15px;
  line-height: 1.45;
  color: var(--muted);
}

.result-card__summary {
  margin: 0;
  font-size: 15px;
  line-height: 1.65;
  color: var(--text);
  display: -webkit-box;
  -webkit-line-clamp: 4;
  line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.result-card__details {
  display: grid;
  gap: 10px;
  margin: 0;
}

.result-card__detail {
  display: grid;
  gap: 4px;
}

.result-card__detail dt {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--muted);
}

.result-card__detail dd {
  margin: 0;
  font-size: 15px;
  line-height: 1.5;
  color: var(--text);
}

.result-card__actions {
  display: flex;
  justify-content: flex-start;
}

.result-card__cta {
  width: fit-content;
  pointer-events: none;
}

@media (max-width: 720px) {
  .profile-finder {
    gap: 14px;
  }

  .profile-finder__hero,
  .finder-form {
    flex-direction: column;
    align-items: stretch;
  }

  .profile-finder__hero {
    gap: 6px;
    padding: 12px 14px;
  }

  .profile-finder__hero-copy {
    gap: 2px;
  }

  .profile-finder__hero .title {
    font-size: 24px;
    line-height: 1.08;
  }

  .profile-finder__hero .muted {
    font-size: 15px;
    line-height: 1.45;
  }

  .profile-finder__hero .btn {
    min-height: 40px;
    padding: 9px 14px;
  }

  .result-card {
    grid-template-columns: minmax(0, 1fr);
    gap: 16px;
  }

  .result-card__photo {
    aspect-ratio: 16 / 10;
    max-height: 220px;
  }
}
</style>
