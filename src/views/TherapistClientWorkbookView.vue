<template>
  <section class="workbook-page">
    <header class="workbook-page__header">
      <div>
        <div class="badge badge--soft">Конфіденційно</div>
        <h1 class="title workbook-page__title">Приватний зошит</h1>
        <p class="muted workbook-page__subtitle">
          Робочий простір спеціаліста по цьому клієнту. Клієнт не бачить ці записи.
        </p>
      </div>
      <RouterLink class="btn btn--ghost" :to="clientBackLink">Назад до клієнта</RouterLink>
    </header>

    <div v-if="error" class="form-error">{{ error }}</div>

    <section class="panel workbook-editor">
      <LoadingSkeleton v-if="loading" variant="list" :count="1" height="260px" />
      <template v-else>
        <div class="workbook-editor__top">
          <div>
            <p class="muted workbook-page__state">{{ workbookStateLabel }}</p>
            <p v-if="lastUpdatedLabel" class="muted workbook-page__updated">
              Останнє оновлення: {{ lastUpdatedLabel }}
            </p>
          </div>
          <span class="workbook-save-state" :class="saveStateClass">{{ saveStateLabel }}</span>
        </div>

        <div class="workbook-editor__helper">
          Ведіть зошит у вільній формі або використовуйте структуру: запит, спостереження, динаміка, план.
        </div>

        <div class="workbook-editor__toolbar">
          <button class="btn btn--ghost btn--sm" type="button" @click="insertTemplate">
            Вставити структуру
          </button>
        </div>

        <textarea
          ref="textareaRef"
          v-model="content"
          class="input workbook-page__textarea"
          rows="22"
          placeholder="Почніть із короткого опису запиту, важливих спостережень, динаміки роботи або плану до наступної сесії."
        ></textarea>

        <div class="workbook-page__actions">
          <button class="btn" type="button" :disabled="saving || !isDirty" @click="save">
            {{ saving ? 'Зберігаємо...' : 'Зберегти приватний зошит' }}
          </button>
          <span v-if="savedMessage" class="workbook-page__success">{{ savedMessage }}</span>
        </div>
      </template>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import LoadingSkeleton from '../components/LoadingSkeleton.vue'
import { getApiErrorMessage } from '../lib/errors'
import { fetchSpecialistClientWorkbookSnapshot, saveSpecialistClientJournal } from '../lib/specialistSessions'
import { workbookContentStateLabel as getWorkbookContentStateLabel } from '../lib/noteWorkbookCopy'

const WORKBOOK_TEMPLATE = 'Запит:\n\nСпостереження:\n\nДинаміка:\n\nПлан:'

const route = useRoute()
const clientId = Number(route.params.clientId || 0)

const loading = ref(false)
const saving = ref(false)
const error = ref('')
const content = ref('')
const initialContent = ref('')
const savedMessage = ref('')
const isWorkbookMissing = ref(true)
const updatedAt = ref<string | null>(null)
const textareaRef = ref<HTMLTextAreaElement | null>(null)

const isDirty = computed(() => content.value !== initialContent.value)

const clientBackLink = computed(() => {
  if (!clientId) return '/cabinet/clients'
  return {
    path: '/cabinet/clients',
    query: {
      client: String(clientId),
      autoOpen: '1',
    },
  }
})

const workbookStateLabel = computed(() => {
  const hasContent = Boolean(content.value.trim())
  if (!hasContent) {
    const state = isWorkbookMissing.value ? 'missing' : 'draft'
    return `Стан: ${getWorkbookContentStateLabel(state)}.`
  }
  return `Стан: ${getWorkbookContentStateLabel('completed')}.`
})

const saveStateLabel = computed(() => {
  if (saving.value) return 'Зберігаємо...'
  if (error.value) return 'Не вдалося зберегти'
  if (isDirty.value) return 'Є незбережені зміни'
  if (savedMessage.value) return 'Збережено'
  const hasContent = Boolean(content.value.trim())
  const state = hasContent ? 'completed' : isWorkbookMissing.value ? 'missing' : 'draft'
  return getWorkbookContentStateLabel(state)
})

const saveStateClass = computed(() => ({
  'workbook-save-state--saving': saving.value,
  'workbook-save-state--dirty': isDirty.value && !saving.value,
  'workbook-save-state--error': Boolean(error.value) && !saving.value,
}))

const lastUpdatedLabel = computed(() => {
  if (!updatedAt.value) return ''
  const date = new Date(updatedAt.value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('uk-UA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
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
    initialContent.value = snapshot.content
    isWorkbookMissing.value = snapshot.isMissing
    updatedAt.value = snapshot.updatedAt || null
  } catch (err: unknown) {
    error.value = getApiErrorMessage(err, 'Не вдалося завантажити приватний зошит.')
  } finally {
    loading.value = false
  }
}

async function insertTemplate() {
  const current = content.value
  const textarea = textareaRef.value
  savedMessage.value = ''
  if (!current.trim()) {
    content.value = WORKBOOK_TEMPLATE
    await nextTick()
    textareaRef.value?.focus()
    return
  }

  const insertion = `\n\n${WORKBOOK_TEMPLATE}`
  if (!textarea) {
    content.value = `${current}${insertion}`
    return
  }

  const start = textarea.selectionStart ?? current.length
  const end = textarea.selectionEnd ?? current.length
  content.value = `${current.slice(0, start)}${insertion}${current.slice(end)}`
  await nextTick()
  textarea.focus()
  const nextPosition = start + insertion.length
  textarea.setSelectionRange(nextPosition, nextPosition)
}

async function save() {
  if (!clientId || saving.value) return
  saving.value = true
  error.value = ''
  savedMessage.value = ''
  try {
    const response = await saveSpecialistClientJournal(clientId, content.value || '')
    initialContent.value = content.value
    isWorkbookMissing.value = !Boolean(content.value.trim())
    updatedAt.value = (response as { updated_at?: string | null } | undefined)?.updated_at || new Date().toISOString()
    savedMessage.value = 'Збережено'
  } catch (err: unknown) {
    error.value = getApiErrorMessage(err, 'Не вдалося зберегти приватний зошит.')
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
  align-items: flex-start;
  gap: 16px;
}

.workbook-page__title {
  margin-bottom: 6px;
}

.workbook-page__subtitle {
  max-width: 680px;
}

.panel {
  border: 1px solid var(--line);
  border-radius: var(--radius-lg, 16px);
  padding: 16px;
  background: #fff;
  display: grid;
  gap: 12px;
}

.workbook-editor {
  box-shadow: 0 16px 40px rgba(16, 24, 40, 0.06);
}

.workbook-editor__top {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
  flex-wrap: wrap;
}

.workbook-editor__helper {
  border: 1px solid rgba(7, 47, 71, 0.1);
  border-radius: var(--radius-sm, 10px);
  padding: 10px 12px;
  background: rgba(7, 47, 71, 0.035);
  color: var(--text);
  font-size: 14px;
  line-height: 1.5;
}

.workbook-editor__toolbar {
  display: flex;
  justify-content: flex-end;
}

.workbook-page__textarea {
  min-height: min(64vh, 760px);
  resize: vertical;
  line-height: 1.6;
}

.workbook-page__state,
.workbook-page__updated {
  margin: 0;
}

.workbook-page__updated {
  margin-top: 4px;
  font-size: 13px;
}

.workbook-page__actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.workbook-save-state {
  border-radius: var(--radius-sm, 10px);
  border: 1px solid rgba(31, 111, 82, 0.18);
  color: #1f6f52;
  background: rgba(31, 111, 82, 0.08);
  padding: 5px 9px;
  font-size: 13px;
  font-weight: 600;
}

.workbook-save-state--dirty {
  border-color: rgba(176, 112, 0, 0.24);
  color: #7a4d00;
  background: rgba(176, 112, 0, 0.08);
}

.workbook-save-state--saving {
  border-color: rgba(7, 47, 71, 0.16);
  color: var(--text);
  background: rgba(7, 47, 71, 0.06);
}

.workbook-save-state--error {
  border-color: rgba(179, 38, 30, 0.2);
  color: #b3261e;
  background: #fdecea;
}

.workbook-page__success {
  color: #1f6f52;
  font-weight: 600;
}

.form-error {
  color: #b3261e;
  background: #fdecea;
  border: 1px solid #f5c2c0;
  border-radius: var(--radius-sm, 10px);
  padding: 8px 10px;
}

@media (max-width: 860px) {
  .workbook-page__header {
    flex-direction: column;
  }

  .workbook-editor__toolbar {
    justify-content: flex-start;
  }

  .workbook-page__textarea {
    min-height: 420px;
  }
}
</style>
