<template>
  <section class="client-materials-page">
    <header class="client-materials-page__header">
      <div class="badge">Матеріали</div>
      <h1 class="title">Матеріали від спеціаліста</h1>
      <p class="muted">
        Тут з?являються рекомендації, вправи, інструкції або посилання, які спеціаліст відкриє для вас.
      </p>
    </header>

    <div v-if="error" class="form-error">{{ error }}</div>
    <div v-if="loading" class="muted">Завантаження...</div>
    <div v-else-if="items.length === 0" class="empty-state">Поки що матеріалів немає.</div>
    <div v-else class="client-materials-list">
      <article v-for="item in items" :key="item.id" class="client-material-card">
        <div class="client-material-card__top">
          <h2>{{ item.title }}</h2>
          <span class="muted">Опубліковано: {{ formatDateTime(item.published_at) }}</span>
        </div>
        <div class="muted">{{ materialTypeLabel(item.material_type) }}</div>
        <p class="client-material-card__content">{{ item.content }}</p>
        <div v-if="item.session_id" class="muted">Пов’язано із сесією #{{ item.session_id }}</div>

        <div v-if="hasMaterialUrl(item)" class="client-material-card__link-block">
          <div class="client-material-card__link-label">Посилання</div>
          <div class="client-material-card__link-value" :title="item.url || ''">{{ item.url }}</div>
          <div class="client-material-card__link-hint muted">Перевірте посилання перед відкриттям.</div>
          <div class="client-material-card__actions">
            <a class="btn btn--sm client-materials-btn client-materials-btn--primary" :href="item.url || '#'" target="_blank" rel="noopener noreferrer">
              Відкрити посилання
            </a>
          </div>
        </div>

        <div class="client-material-card__attachments">
          <div class="client-material-card__attachments-head">
            <div class="client-material-card__link-label">Файли до цього матеріалу</div>
            <button
              class="btn btn--sm client-materials-btn"
              :class="isDetailOpen(item.id) ? 'client-materials-btn--secondary' : 'client-materials-btn--primary'"
              type="button"
              @click="toggleDetail(item.id)"
            >
              {{ isDetailOpen(item.id) ? 'Сховати матеріал' : 'Відкрити матеріал' }}
            </button>
          </div>
          <p v-if="detailErrorByMaterialId[item.id]" class="form-error">{{ detailErrorByMaterialId[item.id] }}</p>
          <p v-if="downloadErrorByMaterialId[item.id]" class="form-error">{{ downloadErrorByMaterialId[item.id] }}</p>
          <p v-if="isDetailLoading(item.id)" class="muted">Завантаження файлів...</p>
          <template v-else-if="isDetailOpen(item.id)">
            <p class="muted">Файли доступні тільки для опублікованих матеріалів від спеціаліста.</p>
            <ul v-if="(detailByMaterialId[item.id]?.attachments || []).length" class="attachments-list">
              <li v-for="attachment in detailByMaterialId[item.id]?.attachments || []" :key="attachment.id" class="attachments-item">
                <div>
                  <div>{{ attachment.original_filename }}</div>
                  <div class="muted">{{ humanFileSize(attachment.size_bytes) }}</div>
                </div>
                <button
                  class="btn btn--sm client-materials-btn client-materials-btn--primary"
                  type="button"
                  :disabled="Boolean(downloadingByAttachmentId[attachment.id])"
                  @click="downloadAttachment(item.id, attachment.id)"
                >
                  Завантажити файл
                </button>
              </li>
            </ul>
            <p v-else class="muted">До цього матеріалу немає прикріплених файлів.</p>
          </template>
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
  fetchClientMaterialDetail,
  fetchClientMaterials,
  getClientMaterialAttachmentDownloadUrl,
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
const detailOpenByMaterialId = ref<Record<number, boolean>>({})
const detailByMaterialId = ref<Record<number, ClientMaterialClientRecord>>({})
const detailLoadingByMaterialId = ref<Record<number, boolean>>({})
const detailErrorByMaterialId = ref<Record<number, string>>({})
const downloadErrorByMaterialId = ref<Record<number, string>>({})
const downloadingByAttachmentId = ref<Record<number, boolean>>({})

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

function humanFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 Б'
  if (bytes < 1024) return `${Math.round(bytes)} Б`
  const kb = bytes / 1024
  if (kb < 1024) return `${Math.round(kb)} КБ`
  const mb = kb / 1024
  const value = mb >= 10 ? Math.round(mb) : Math.round(mb * 10) / 10
  return `${value.toString().replace('.', ',')} МБ`
}

function isDetailOpen(materialId: number): boolean {
  return Boolean(detailOpenByMaterialId.value[materialId])
}

function isDetailLoading(materialId: number): boolean {
  return Boolean(detailLoadingByMaterialId.value[materialId])
}

function downloadErrorMessage(err: unknown): string {
  const data = (err as any)?.response?.data
  const code = String(data?.code || data?.reason_code || '').trim().toUpperCase()
  if (code === 'ATTACHMENT_DOWNLOAD_UNAVAILABLE') {
    return 'Не вдалося підготувати посилання для завантаження. Спробуйте пізніше.'
  }
  if (code === 'CLIENT_MATERIAL_ATTACHMENT_NOT_FOUND' || code === 'CLIENT_MATERIAL_NOT_FOUND') {
    return 'Файл не знайдено або доступ до нього вже закрито.'
  }
  return getApiErrorMessage(err, 'Не вдалося завантажити файл. Спробуйте ще раз.')
}

async function loadDetail(materialId: number) {
  detailLoadingByMaterialId.value = { ...detailLoadingByMaterialId.value, [materialId]: true }
  detailErrorByMaterialId.value = { ...detailErrorByMaterialId.value, [materialId]: '' }
  try {
    const detail = await fetchClientMaterialDetail(materialId)
    detailByMaterialId.value = { ...detailByMaterialId.value, [materialId]: detail }
  } catch (err) {
    detailErrorByMaterialId.value = {
      ...detailErrorByMaterialId.value,
      [materialId]: getApiErrorMessage(err, 'Не вдалося завантажити матеріал.'),
    }
  } finally {
    detailLoadingByMaterialId.value = { ...detailLoadingByMaterialId.value, [materialId]: false }
  }
}

async function toggleDetail(materialId: number) {
  const next = !isDetailOpen(materialId)
  detailOpenByMaterialId.value = { ...detailOpenByMaterialId.value, [materialId]: next }
  if (!next) return
  if (!detailByMaterialId.value[materialId] && !isDetailLoading(materialId)) {
    await loadDetail(materialId)
  }
}

async function downloadAttachment(materialId: number, attachmentId: number) {
  downloadErrorByMaterialId.value = { ...downloadErrorByMaterialId.value, [materialId]: '' }
  downloadingByAttachmentId.value = { ...downloadingByAttachmentId.value, [attachmentId]: true }
  try {
    const payload = await getClientMaterialAttachmentDownloadUrl(materialId, attachmentId)
    if (payload.download_url) {
      window.open(payload.download_url, '_blank', 'noopener,noreferrer')
    }
  } catch (err) {
    downloadErrorByMaterialId.value = {
      ...downloadErrorByMaterialId.value,
      [materialId]: downloadErrorMessage(err),
    }
  } finally {
    const next = { ...downloadingByAttachmentId.value }
    delete next[attachmentId]
    downloadingByAttachmentId.value = next
  }
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

.client-material-card__link-block {
  display: grid;
  gap: 6px;
}

.client-material-card__link-label {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-muted);
}

.client-material-card__link-value {
  font-size: 14px;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.client-material-card__attachments {
  display: grid;
  gap: 8px;
  border-top: 1px solid var(--border);
  padding-top: 8px;
}

.client-material-card__attachments-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.attachments-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 8px;
}

.attachments-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.client-materials-btn {
  min-height: 38px;
  padding: 8px 14px;
  border-radius: 10px;
  font-weight: 600;
}

.client-materials-btn--primary {
  background: var(--pc-navy-900, #1f3556);
  color: #fff;
  border: 1px solid var(--pc-navy-900, #1f3556);
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.08);
}

.client-materials-btn--primary:hover {
  background: var(--pc-navy-950, #162741);
  border-color: var(--pc-navy-950, #162741);
}

.client-materials-btn--primary:focus-visible,
.client-materials-btn--secondary:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--pc-navy-900, #1f3556) 60%, #ffffff);
  outline-offset: 2px;
}

.client-materials-btn--secondary {
  background: #fff;
  color: var(--pc-navy-900, #1f3556);
  border: 1px solid color-mix(in srgb, var(--pc-navy-900, #1f3556) 45%, #cbd5e1);
}

.client-materials-btn--secondary:hover {
  background: color-mix(in srgb, var(--pc-navy-900, #1f3556) 8%, #ffffff);
  border-color: var(--pc-navy-900, #1f3556);
}

.client-materials-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 640px) {
  .attachments-item {
    align-items: flex-start;
    flex-direction: column;
  }

  .client-materials-btn {
    width: 100%;
  }
}
</style>
