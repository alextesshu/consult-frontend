<template>
  <section class="workbook-page">
    <header class="workbook-page__header">
      <div>
        <div class="badge badge--soft">Конфіденційно</div>
        <h1 class="title workbook-page__title">Робочий зошит клієнта</h1>
        <p class="muted">Доступ лише для спеціаліста. Дані зберігаються у приватній історії клієнта.</p>
      </div>
      <RouterLink class="btn btn--ghost" to="/cabinet/clients">Назад до CRM</RouterLink>
    </header>

    <div v-if="error" class="form-error">{{ error }}</div>

    <section class="panel">
      <LoadingSkeleton v-if="loading" variant="list" :count="1" height="260px" />
      <template v-else>
        <p class="muted workbook-page__state">{{ workbookStateLabel }}</p>
        <textarea
          v-model="content"
          class="input workbook-page__textarea"
          rows="22"
          placeholder="Основні спостереження, динаміка, плани та робочі гіпотези по клієнту."
        ></textarea>
        <div class="workbook-page__actions">
          <button class="btn" type="button" :disabled="saving" @click="save">
            {{ saving ? 'Збереження...' : 'Зберегти робочий зошит' }}
          </button>
          <span v-if="savedMessage" class="workbook-page__success">{{ savedMessage }}</span>
        </div>
      </template>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import LoadingSkeleton from '../components/LoadingSkeleton.vue'
import { getApiErrorMessage } from '../lib/errors'
import { fetchSpecialistClientWorkbookSnapshot, saveSpecialistClientJournal } from '../lib/specialistSessions'
import { workbookContentStateLabel as getWorkbookContentStateLabel } from '../lib/noteWorkbookCopy'

const route = useRoute()
const clientId = Number(route.params.clientId || 0)

const loading = ref(false)
const saving = ref(false)
const error = ref('')
const content = ref('')
const savedMessage = ref('')
const isWorkbookMissing = ref(true)

const workbookStateLabel = computed(() => {
  const hasContent = Boolean(content.value.trim())
  if (!hasContent) {
    const state = isWorkbookMissing.value ? 'missing' : 'draft'
    return `Стан: ${getWorkbookContentStateLabel(state)}.`
  }
  return `Стан: ${getWorkbookContentStateLabel('completed')}.`
})

async function load() {
  if (!clientId) {
    error.value = 'Некоректний ідентифікатор клієнта.'
    return
  }
  loading.value = true
  error.value = ''
  try {
    const snapshot = await fetchSpecialistClientWorkbookSnapshot(clientId)
    content.value = snapshot.content
    isWorkbookMissing.value = snapshot.isMissing
  } catch (err: unknown) {
    error.value = getApiErrorMessage(err, 'Не вдалося завантажити робочий зошит.')
  } finally {
    loading.value = false
  }
}

async function save() {
  if (!clientId) return
  saving.value = true
  error.value = ''
  savedMessage.value = ''
  try {
    await saveSpecialistClientJournal(clientId, content.value || '')
    isWorkbookMissing.value = !Boolean(content.value.trim())
    savedMessage.value = 'Дані збережено.'
  } catch (err: unknown) {
    error.value = getApiErrorMessage(err, 'Не вдалося зберегти робочий зошит.')
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.workbook-page {
  display: grid;
  gap: 14px;
}

.workbook-page__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.workbook-page__title {
  margin-bottom: 6px;
}

.panel {
  border: 1px solid var(--line);
  border-radius: 18px;
  padding: 16px;
  background: #fff;
  display: grid;
  gap: 12px;
}

.workbook-page__textarea {
  min-height: min(74vh, 920px);
  resize: vertical;
  line-height: 1.6;
}

.workbook-page__state {
  margin: 0;
}

.workbook-page__actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.workbook-page__success {
  color: #1f6f52;
  font-weight: 600;
}

.form-error {
  color: #b3261e;
  background: #fdecea;
  border: 1px solid #f5c2c0;
  border-radius: 10px;
  padding: 8px 10px;
}

@media (max-width: 860px) {
  .workbook-page__header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
