<template>
  <section class="client-materials-page">
    <header class="client-materials-page__header">
      <div class="badge">Матеріали</div>
      <h1 class="title">Матеріали від спеціаліста</h1>
      <p class="muted">
        Тут з’являться рекомендації, вправи, інструкції або посилання, які спеціаліст відкриє для вас.
      </p>
    </header>

    <div v-if="error" class="form-error">{{ error }}</div>
    <div v-if="loading" class="muted">Завантаження...</div>
    <div v-else-if="items.length === 0" class="empty-state">
      Поки що матеріалів немає.
    </div>
    <div v-else class="client-materials-list">
      <article v-for="item in items" :key="item.id" class="client-material-card">
        <div class="client-material-card__top">
          <h2>{{ item.title }}</h2>
          <span class="muted">Опубліковано: {{ formatDateTime(item.published_at) }}</span>
        </div>
        <div class="muted">{{ materialTypeLabel(item.material_type) }}</div>
        <p class="client-material-card__content">{{ item.content }}</p>
        <div v-if="item.session_id" class="muted">Пов’язано із сесією #{{ item.session_id }}</div>
        <div class="client-material-card__actions">
          <a
            v-if="hasMaterialUrl(item)"
            class="btn btn--ghost btn--sm"
            :href="item.url || '#'"
            target="_blank"
            rel="noopener noreferrer"
          >
            Відкрити посилання
          </a>
        </div>
      </article>
      <button v-if="nextCursor" class="btn btn--ghost" type="button" :disabled="loadingMore" @click="loadMore">
        {{ loadingMore ? 'Завантаження...' : 'Показати ще' }}
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import {
  fetchClientMaterials,
  hasMaterialUrl,
  type ClientMaterialClientRecord,
  type ClientMaterialType,
} from '../lib/api'
import { formatUkDateTimeCompact } from '../lib/dateTime'
import { getApiErrorMessage } from '../lib/errors'

const loading = ref(false)
const loadingMore = ref(false)
const error = ref('')
const items = ref<ClientMaterialClientRecord[]>([])
const nextCursor = ref<string | null>(null)

function materialTypeLabel(value: ClientMaterialType): string {
  if (value === 'recommendation') return 'Рекомендація'
  if (value === 'homework') return 'Домашнє завдання'
  if (value === 'exercise') return 'Вправа'
  if (value === 'instruction') return 'Інструкція'
  if (value === 'link') return 'Посилання'
  if (value === 'document') return 'Документ'
  return 'Інше'
}

function formatDateTime(value?: string | null) {
  return formatUkDateTimeCompact(value || null)
}

async function loadInitial() {
  loading.value = true
  error.value = ''
  try {
    const payload = await fetchClientMaterials()
    items.value = payload.results || []
    nextCursor.value = payload.next_cursor || null
  } catch (err) {
    error.value = getApiErrorMessage(err, 'Не вдалося завантажити матеріали.')
    items.value = []
    nextCursor.value = null
  } finally {
    loading.value = false
  }
}

async function loadMore() {
  if (!nextCursor.value || loadingMore.value) return
  loadingMore.value = true
  try {
    const payload = await fetchClientMaterials(nextCursor.value)
    items.value = [...items.value, ...(payload.results || [])]
    nextCursor.value = payload.next_cursor || null
  } catch (err) {
    error.value = getApiErrorMessage(err, 'Не вдалося завантажити наступну сторінку.')
  } finally {
    loadingMore.value = false
  }
}

onMounted(() => {
  void loadInitial()
})
</script>

<style scoped>
.client-materials-page {
  display: grid;
  gap: 14px;
}

.client-materials-list {
  display: grid;
  gap: 12px;
}

.client-material-card {
  border: 1px solid var(--border);
  border-radius: 8px;
  background: #fff;
  padding: 12px;
  display: grid;
  gap: 8px;
}

.client-material-card__top {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: flex-start;
}

.client-material-card__top h2 {
  margin: 0;
  font-size: 16px;
}

.client-material-card__content {
  margin: 0;
  white-space: pre-wrap;
}
</style>
