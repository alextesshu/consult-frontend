<template>
  <section class="availability-rules">
    <header class="availability-rules__hero">
      <div>
        <div class="badge">Доступність</div>
        <h1 class="title availability-rules__title">Правила доступності</h1>
        <p class="muted availability-rules__subtitle">
          Налаштуйте шаблон робочих годин: день, час, тривалість сесії та буфер.
        </p>
      </div>
      <RouterLink class="btn btn--ghost" to="/cabinet">Назад до кабінету</RouterLink>
    </header>

    <section class="panel">
      <div class="panel__header">
        <div>
          <div class="badge badge--soft">Нове правило</div>
          <h2 class="panel__title">Додати правило</h2>
        </div>
      </div>

      <form class="rule-form" @submit.prevent="onCreateRule">
        <div class="rule-form__grid">
          <label class="field">
            День тижня
            <select v-model.number="createForm.weekday" class="input">
              <option v-for="opt in weekdayOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </label>

          <label class="field">
            Початок
            <input v-model="createForm.start_time" class="input" type="time" required />
          </label>

          <label class="field">
            Кінець
            <input v-model="createForm.end_time" class="input" type="time" required />
          </label>

          <label class="field">
            Тривалість сесії (хв)
            <input
              v-model.number="createForm.session_duration_minutes"
              class="input"
              type="number"
              min="5"
              step="5"
              required
            />
          </label>

          <label class="field">
            Буфер (хв)
            <input
              v-model.number="createForm.buffer_minutes"
              class="input"
              type="number"
              min="0"
              step="5"
              required
            />
          </label>

          <label class="field rule-form__active">
            <span>Активне</span>
            <input v-model="createForm.is_active" type="checkbox" />
          </label>
        </div>

        <button class="btn rule-form__submit" type="submit" :disabled="loading">
          Додати правило
        </button>
      </form>
      <div v-if="error" class="form-error">{{ error }}</div>
    </section>

    <section class="panel">
      <div class="panel__header">
        <div>
          <div class="badge badge--soft">Список</div>
          <h2 class="panel__title">Ваші правила</h2>
        </div>
      </div>

      <div v-if="loading && !rules.length" class="muted">Завантаження...</div>
      <div v-else-if="!rules.length" class="muted">
        Поки що немає правил доступності.
      </div>

      <div v-else class="rules-list">
        <article v-for="rule in rules" :key="rule.id" class="rule-card">
          <template v-if="editingRuleId === rule.id">
            <form class="rule-form" @submit.prevent="onSaveRule(rule.id)">
              <div class="rule-form__grid">
                <label class="field">
                  День тижня
                  <select v-model.number="editForm.weekday" class="input">
                    <option v-for="opt in weekdayOptions" :key="opt.value" :value="opt.value">
                      {{ opt.label }}
                    </option>
                  </select>
                </label>

                <label class="field">
                  Початок
                  <input v-model="editForm.start_time" class="input" type="time" required />
                </label>

                <label class="field">
                  Кінець
                  <input v-model="editForm.end_time" class="input" type="time" required />
                </label>

                <label class="field">
                  Тривалість сесії (хв)
                  <input
                    v-model.number="editForm.session_duration_minutes"
                    class="input"
                    type="number"
                    min="5"
                    step="5"
                    required
                  />
                </label>

                <label class="field">
                  Буфер (хв)
                  <input
                    v-model.number="editForm.buffer_minutes"
                    class="input"
                    type="number"
                    min="0"
                    step="5"
                    required
                  />
                </label>

                <label class="field rule-form__active">
                  <span>Активне</span>
                  <input v-model="editForm.is_active" type="checkbox" />
                </label>
              </div>

              <div class="rule-form__actions">
                <button class="btn btn--sm" type="submit" :disabled="loading">Зберегти</button>
                <button class="btn btn--ghost btn--sm" type="button" :disabled="loading" @click="cancelEdit">
                  Скасувати
                </button>
              </div>
            </form>
          </template>

          <template v-else>
            <div class="rule-card__row">
              <div class="rule-card__title">
                {{ weekdayLabel(rule.weekday) }} · {{ rule.start_time }}–{{ rule.end_time }}
              </div>
              <div class="rule-card__meta">
                {{ rule.session_duration_minutes }} хв · буфер {{ rule.buffer_minutes }} хв
              </div>
              <div class="rule-card__status">
                {{ rule.is_active ? 'Активне' : 'Неактивне' }}
              </div>
            </div>
            <div class="rule-card__actions">
              <button class="btn btn--ghost btn--sm" type="button" :disabled="loading" @click="startEdit(rule)">
                Редагувати
              </button>
              <button class="btn btn--ghost btn--sm" type="button" :disabled="loading" @click="onDeleteRule(rule.id)">
                Видалити
              </button>
            </div>
          </template>
        </article>
      </div>
    </section>

    <section class="panel">
      <div class="panel__header">
        <div>
          <div class="badge badge--soft">Генерація</div>
          <h2 class="panel__title">Згенерувати слоти</h2>
          <p class="muted generation__subtitle">
            На основі активних правил система може створити вільні вікна на найближчі 30 днів.
          </p>
        </div>
      </div>

      <div class="generation__actions">
        <button class="btn" type="button" :disabled="!hasActiveRules || generationLoading" @click="onPreviewGeneration">
          Переглянути генерацію на 30 днів
        </button>
        <button
          class="btn btn--ghost"
          type="button"
          :disabled="!previewResult || generationLoading"
          @click="onApplyGeneration"
        >
          Застосувати
        </button>
      </div>

      <p v-if="!hasActiveRules" class="muted">Додайте хоча б одне активне правило, щоб запустити preview.</p>
      <div v-if="generationError" class="form-error">{{ generationError }}</div>
      <p v-if="generationSuccess" class="generation__success">{{ generationSuccess }}</p>

      <div v-if="previewResult" class="generation__result">
        <div class="generation__stats">
          <div>Буде створено: <strong>{{ previewResult.to_create_count }}</strong></div>
          <div>Вже існує: <strong>{{ previewResult.existing_count }}</strong></div>
          <div>Буде пропущено: <strong>{{ previewResult.skipped_duplicate_or_conflict_count }}</strong></div>
        </div>
        <ul v-if="previewResult.examples?.length" class="generation__examples">
          <li v-for="example in previewResult.examples.slice(0, 10)" :key="example.start_at">
            {{ formatSlotExample(example.start_at, example.end_at) }}
          </li>
        </ul>
        <RouterLink class="btn btn--ghost btn--sm" to="/cabinet/slots">Перейти до слотів</RouterLink>
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { apiDelete, apiGet, apiPatch, apiPost } from '../lib/api'
import { getApiErrorMessage } from '../lib/errors'

type AvailabilityRule = {
  id: number
  specialist_id: number
  weekday: number
  start_time: string
  end_time: string
  session_duration_minutes: number
  buffer_minutes: number
  is_active: boolean
  needs_regeneration: boolean
  created_at: string
  updated_at: string
}

type AvailabilityGenerationPreview = {
  date_range: {
    date_from: string
    date_to: string
  }
  days_covered: number
  total_candidate_slots: number
  to_create_count: number
  existing_count: number
  skipped_duplicate_or_conflict_count: number
  examples: Array<{
    start_at: string
    end_at: string
  }>
}

type AvailabilityGenerationApply = {
  date_range: {
    date_from: string
    date_to: string
  }
  days_covered: number
  created_count: number
  deleted_count: number
  existing_count: number
}

const weekdayOptions = [
  { value: 0, label: 'Понеділок' },
  { value: 1, label: 'Вівторок' },
  { value: 2, label: 'Середа' },
  { value: 3, label: 'Четвер' },
  { value: 4, label: "П'ятниця" },
  { value: 5, label: 'Субота' },
  { value: 6, label: 'Неділя' },
]

const rules = ref<AvailabilityRule[]>([])
const loading = ref(false)
const error = ref('')
const generationLoading = ref(false)
const generationError = ref('')
const generationSuccess = ref('')
const previewResult = ref<AvailabilityGenerationPreview | null>(null)

const createForm = reactive({
  weekday: 0,
  start_time: '09:00',
  end_time: '18:00',
  session_duration_minutes: 50,
  buffer_minutes: 10,
  is_active: true,
})

const editingRuleId = ref<number | null>(null)
const editForm = reactive({
  weekday: 0,
  start_time: '09:00',
  end_time: '18:00',
  session_duration_minutes: 50,
  buffer_minutes: 10,
  is_active: true,
})

const hasActiveRules = computed(() => rules.value.some((rule) => rule.is_active))

function weekdayLabel(value: number): string {
  return weekdayOptions.find((opt) => opt.value === value)?.label || String(value)
}

async function loadRules() {
  loading.value = true
  error.value = ''
  try {
    rules.value = await apiGet<AvailabilityRule[]>('/cabinet/availability-rules/')
  } catch (err) {
    error.value = getApiErrorMessage(err, 'Не вдалося завантажити правила доступності.')
  } finally {
    loading.value = false
  }
}

function resetCreateForm() {
  createForm.weekday = 0
  createForm.start_time = '09:00'
  createForm.end_time = '18:00'
  createForm.session_duration_minutes = 50
  createForm.buffer_minutes = 10
  createForm.is_active = true
}

async function onCreateRule() {
  loading.value = true
  error.value = ''
  try {
    const created = await apiPost<AvailabilityRule>('/cabinet/availability-rules/', createForm)
    rules.value = [...rules.value, created].sort((a, b) => a.id - b.id)
    resetCreateForm()
    generationSuccess.value = ''
  } catch (err) {
    error.value = getApiErrorMessage(err, 'Не вдалося створити правило.')
  } finally {
    loading.value = false
  }
}

function startEdit(rule: AvailabilityRule) {
  editingRuleId.value = rule.id
  editForm.weekday = rule.weekday
  editForm.start_time = rule.start_time
  editForm.end_time = rule.end_time
  editForm.session_duration_minutes = rule.session_duration_minutes
  editForm.buffer_minutes = rule.buffer_minutes
  editForm.is_active = rule.is_active
}

function cancelEdit() {
  editingRuleId.value = null
}

async function onSaveRule(ruleId: number) {
  loading.value = true
  error.value = ''
  try {
    const updated = await apiPatch<AvailabilityRule>(`/cabinet/availability-rules/${ruleId}/`, editForm)
    rules.value = rules.value.map((rule) => (rule.id === ruleId ? updated : rule))
    cancelEdit()
    generationSuccess.value = ''
  } catch (err) {
    error.value = getApiErrorMessage(err, 'Не вдалося оновити правило.')
  } finally {
    loading.value = false
  }
}

async function onDeleteRule(ruleId: number) {
  if (!window.confirm('Видалити правило доступності?')) return
  loading.value = true
  error.value = ''
  try {
    await apiDelete(`/cabinet/availability-rules/${ruleId}/`)
    rules.value = rules.value.filter((rule) => rule.id !== ruleId)
    if (editingRuleId.value === ruleId) {
      cancelEdit()
    }
    generationSuccess.value = ''
  } catch (err) {
    error.value = getApiErrorMessage(err, 'Не вдалося видалити правило.')
  } finally {
    loading.value = false
  }
}

function formatSlotExample(startAt: string, endAt: string): string {
  const start = new Date(startAt)
  const end = new Date(endAt)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return `${startAt} – ${endAt}`
  return `${start.toLocaleString('uk-UA')} – ${end.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}`
}

async function onPreviewGeneration() {
  if (!hasActiveRules.value) return
  generationLoading.value = true
  generationError.value = ''
  generationSuccess.value = ''
  try {
    previewResult.value = await apiPost<AvailabilityGenerationPreview>(
      '/cabinet/availability-rules/preview-generation/',
      { days_ahead: 30 }
    )
  } catch (err) {
    generationError.value = getApiErrorMessage(err, 'Не вдалося виконати preview генерації.')
  } finally {
    generationLoading.value = false
  }
}

async function onApplyGeneration() {
  if (!previewResult.value) return
  generationLoading.value = true
  generationError.value = ''
  generationSuccess.value = ''
  try {
    const result = await apiPost<AvailabilityGenerationApply>('/cabinet/availability-rules/apply-generation/', {
      days_ahead: 30,
    })
    generationSuccess.value = `Створено ${result.created_count} слотів.`
    await loadRules()
    previewResult.value = null
  } catch (err) {
    generationError.value = getApiErrorMessage(err, 'Не вдалося застосувати генерацію.')
  } finally {
    generationLoading.value = false
  }
}

onMounted(loadRules)
</script>

<style scoped>
.availability-rules {
  display: grid;
  gap: 18px;
}

.availability-rules__hero {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  background: linear-gradient(135deg, rgba(8, 113, 201, 0.16), rgba(7, 47, 71, 0.06));
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 22px 24px;
  box-shadow: var(--shadow);
}

.availability-rules__title {
  font-size: 30px;
}

.availability-rules__subtitle {
  max-width: 560px;
}

.panel {
  border: 1px solid var(--line);
  border-radius: 18px;
  padding: 18px;
  background: #fff;
  display: grid;
  gap: 14px;
}

.panel__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.panel__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 22px;
}

.rule-form {
  display: grid;
  gap: 10px;
}

.rule-form__grid {
  display: grid;
  grid-template-columns:
    minmax(180px, 1fr)
    minmax(180px, 1fr)
    minmax(180px, 1fr)
    auto
    auto
    auto;
  gap: 10px;
  align-items: end;
}

.field {
  display: grid;
  gap: 6px;
  font-size: 12px;
  color: var(--muted);
}

.rule-form__active {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  min-height: 42px;
  white-space: nowrap;
  padding-bottom: 0;
}

.rule-form__submit {
  justify-self: start;
}

.rule-form__actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.rules-list {
  display: grid;
  gap: 10px;
}

.rule-card {
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 14px;
  display: grid;
  gap: 10px;
}

.rule-card__row {
  display: grid;
  gap: 6px;
}

.rule-card__title {
  font-weight: 700;
}

.rule-card__meta {
  color: var(--muted);
  font-size: 14px;
}

.rule-card__status {
  font-size: 12px;
  width: fit-content;
  border-radius: 999px;
  background: rgba(8, 113, 201, 0.12);
  color: #0b4a7d;
  padding: 5px 10px;
}

.rule-card__actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.generation__subtitle {
  margin: 6px 0 0;
}

.generation__actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.generation__result {
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 12px;
  display: grid;
  gap: 10px;
}

.generation__stats {
  display: grid;
  gap: 4px;
}

.generation__examples {
  margin: 0;
  padding-left: 18px;
  display: grid;
  gap: 4px;
}

.generation__success {
  color: #1f7a4c;
  font-weight: 600;
}

@media (max-width: 860px) {
  .availability-rules__hero {
    flex-direction: column;
    align-items: flex-start;
  }

  .rule-form__grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 680px) {
  .availability-rules__hero {
    flex-direction: column;
    align-items: flex-start;
  }

  .rule-form__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .rule-form__active {
    justify-content: flex-start;
  }
}
</style>
