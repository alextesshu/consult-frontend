<template>
  <section class="availability-rules">
    <header class="availability-rules__hero">
      <div>
        <div class="badge">Розклад</div>
        <h1 class="title availability-rules__title">{{ isVacationView ? 'Відпустка' : 'Правила розкладу' }}</h1>
        <p class="muted availability-rules__subtitle">
          {{
            isVacationView
              ? 'Додавайте паузи й періоди недоступності у своєму розкладі.'
              : 'Налаштуйте, коли ви зазвичай доступні для запису: день, час, тривалість сесії та перерва.'
          }}
        </p>
      </div>
      <RouterLink class="btn btn--ghost" to="/cabinet">Назад до кабінету</RouterLink>
    </header>

    <ScheduleSubnav :active="isVacationView ? 'vacation' : 'rules'" />

    <section v-if="!isVacationView" class="panel">
      <div class="panel__header">
        <div>
          <div class="badge badge--soft">Правила</div>
          <h2 class="panel__title">Додати правило розкладу</h2>
          <p class="muted generation__subtitle">
            Правило визначає, коли ви зазвичай працюєте в цей день. Щоб зробити перерву, створіть два окремі інтервали.
          </p>
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
            <input
              ref="ruleCreateStartTimeRef"
              v-model="createForm.start_time"
              class="input"
              type="time"
              required
              @click.stop="openDateTimePicker(ruleCreateStartTimeRef)"
              @focus="openDateTimePicker(ruleCreateStartTimeRef)"
            />
          </label>

          <label class="field field--picker" @click="openDateTimePicker(ruleCreateEndTimeRef)">
            Кінець
            <input
              ref="ruleCreateEndTimeRef"
              v-model="createForm.end_time"
              class="input"
              type="time"
              required
              @click.stop="openDateTimePicker(ruleCreateEndTimeRef)"
              @focus="openDateTimePicker(ruleCreateEndTimeRef)"
            />
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
            Пауза між сесіями (хв)
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

    <section v-if="!isVacationView" class="panel">
      <div class="panel__header">
        <div>
          <div class="badge badge--soft">Список</div>
          <h2 class="panel__title">Правила розкладу</h2>
        </div>
      </div>

      <div v-if="loading && !rules.length" class="muted">Завантаження...</div>
      <div v-else-if="!rules.length" class="muted">
        У вас ще немає правил розкладу.
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
                  <input
                    ref="ruleEditStartTimeRef"
                    v-model="editForm.start_time"
                    class="input"
                    type="time"
                    required
                    @click.stop="openDateTimePicker(ruleEditStartTimeRef)"
                    @focus="openDateTimePicker(ruleEditStartTimeRef)"
                  />
                </label>

                <label class="field field--picker" @click="openDateTimePicker(ruleEditEndTimeRef)">
                  Кінець
                  <input
                    ref="ruleEditEndTimeRef"
                    v-model="editForm.end_time"
                    class="input"
                    type="time"
                    required
                    @click.stop="openDateTimePicker(ruleEditEndTimeRef)"
                    @focus="openDateTimePicker(ruleEditEndTimeRef)"
                  />
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
                  Пауза між сесіями (хв)
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

    <section v-if="isVacationView" class="panel">
      <div class="panel__header">
        <div>
          <div class="badge badge--soft">Відпустка</div>
          <h2 class="panel__title">Періоди недоступності</h2>
          <p class="muted generation__subtitle">
            Такі періоди перекривають звичайні правила розкладу і не дозволяють створювати нові вільні вікна у цей час.
          </p>
        </div>
      </div>

      <form class="rule-form" @submit.prevent="onCreateException">
        <div class="rule-form__grid">
          <label class="field">
            Початок
            <input
              v-model="exceptionForm.start_date"
              class="input"
              type="date"
              lang="uk"
              required
              @click="openPicker"
            />
            <input
              v-model="exceptionForm.start_time"
              class="input"
              type="text"
              inputmode="numeric"
              placeholder="ГГ:ХХ"
              list="availability-time-options"
              required
            />
          </label>
          <label class="field">
            Кінець
            <input
              v-model="exceptionForm.end_date"
              class="input"
              type="date"
              lang="uk"
              required
              @click="openPicker"
            />
            <input
              v-model="exceptionForm.end_time"
              class="input"
              type="text"
              inputmode="numeric"
              placeholder="ГГ:ХХ"
              list="availability-time-options"
              required
            />
          </label>
          <label class="field rule-form__active">
            <span>Весь день</span>
            <input v-model="exceptionForm.is_all_day" type="checkbox" />
          </label>
          <label class="field">
            Примітка
            <input v-model="exceptionForm.note" class="input" type="text" />
          </label>
          <label class="field rule-form__active">
            <span>Активне</span>
            <input v-model="exceptionForm.is_active" type="checkbox" />
          </label>
        </div>
        <div class="muted">Формат: дд.мм.рррр · гг:хх</div>
        <button class="btn rule-form__submit" type="submit" :disabled="exceptionSubmitting">
          Додати період недоступності
        </button>
      </form>
      <div v-if="exceptionError" class="form-error">{{ exceptionError }}</div>

      <div v-if="exceptionsLoading && !exceptions.length" class="muted">Завантаження...</div>
      <div v-else-if="!exceptions.length" class="muted">
        Поки що немає періодів недоступності.
      </div>
      <div v-else class="rules-list">
        <article v-for="item in exceptions" :key="item.id" class="rule-card">
          <template v-if="editingExceptionId === item.id">
            <form class="rule-form" @submit.prevent="onUpdateException(item.id)">
              <div class="rule-form__grid">
                <label class="field">
                  Початок
                  <input
                    v-model="exceptionEditForm.start_date"
                    class="input"
                    type="date"
                    lang="uk"
                    required
                    @click="openPicker"
                  />
                  <input
                    v-model="exceptionEditForm.start_time"
                    class="input"
                    type="text"
                    inputmode="numeric"
                    placeholder="ГГ:ХХ"
                    list="availability-time-options"
                    required
                  />
                </label>
                <label class="field">
                  Кінець
                    <input
                      v-model="exceptionEditForm.end_date"
                      class="input"
                      type="date"
                      lang="uk"
                      placeholder="РґРґ.РјРј.СЂСЂСЂСЂ"
                      required
                      @click="openPicker"
                    />
                  <input
                    v-model="exceptionEditForm.end_time"
                    class="input"
                    type="text"
                    inputmode="numeric"
                    placeholder="ГГ:ХХ"
                    list="availability-time-options"
                    required
                  />
                </label>
                <label class="field rule-form__active">
                  <span>Весь день</span>
                  <input v-model="exceptionEditForm.is_all_day" type="checkbox" />
                </label>
                <label class="field">
                  Примітка
                  <input v-model="exceptionEditForm.note" class="input" type="text" />
                </label>
                <label class="field rule-form__active">
                  <span>Активне</span>
                  <input v-model="exceptionEditForm.is_active" type="checkbox" />
                </label>
              </div>
              <div class="rule-form__actions">
                <button class="btn btn--sm" type="submit" :disabled="exceptionSubmitting">Зберегти</button>
                <button class="btn btn--ghost btn--sm" type="button" :disabled="exceptionSubmitting" @click="cancelEditException">
                  Скасувати
                </button>
              </div>
            </form>
          </template>
          <template v-else>
            <div class="rule-card__row">
              <div class="rule-card__title">
                {{ formatSlotExample(item.starts_at, item.ends_at) }}
              </div>
              <div class="rule-card__meta" v-if="item.note">{{ item.note }}</div>
              <div class="rule-card__status">
                {{ item.is_active ? 'Активне' : 'Неактивне' }}
              </div>
            </div>
            <div class="rule-card__actions">
              <button class="btn btn--ghost btn--sm" type="button" :disabled="exceptionSubmitting" @click="startEditException(item)">
                Редагувати
              </button>
              <button class="btn btn--ghost btn--sm" type="button" :disabled="exceptionSubmitting" @click="onDeleteException(item.id)">
                Видалити
              </button>
            </div>
          </template>
        </article>
      </div>
      <datalist id="availability-time-options">
        <option v-for="option in timeOptions" :key="option" :value="option" />
      </datalist>
    </section>

    <section v-if="!isVacationView" class="panel">
      <div class="panel__header">
        <div>
          <div class="badge badge--soft">Вільні вікна</div>
          <h2 class="panel__title">Згенерувати вільні вікна</h2>
          <p class="muted generation__subtitle">
            Система може створити вільні вікна на основі ваших активних правил розкладу.
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
        <p v-if="previewResult.to_delete_count > 0" class="generation__warning">
          Під час застосування система оновить розклад і може видалити частину вільних вікон. Заброньовані сесії не видаляються автоматично.
        </p>
        <p v-if="previewResult.booked_conflicts_count > 0" class="generation__warning generation__warning--strong">
          У вибраному діапазоні є вже заброньовані сесії, які потребують окремої уваги.
        </p>
        <div class="generation__stats">
          <div>Буде створено: <strong>{{ previewResult.to_create_count }}</strong></div>
          <div>Вже існує: <strong>{{ previewResult.existing_count }}</strong></div>
          <div>Буде видалено (вільні): <strong>{{ previewResult.to_delete_count }}</strong></div>
          <div>Заброньовані конфлікти: <strong>{{ previewResult.booked_conflicts_count }}</strong></div>
          <div>Буде пропущено: <strong>{{ previewResult.skipped_duplicate_or_conflict_count }}</strong></div>
        </div>

        <ul v-if="previewResult.examples_to_create?.length" class="generation__examples">
          <li v-for="example in previewResult.examples_to_create.slice(0, 10)" :key="`create-${example.start_at}`">
            {{ formatSlotExample(example.start_at, example.end_at) }}
          </li>
        </ul>

        <ul v-if="previewResult.examples_to_delete?.length" class="generation__examples">
          <li v-for="example in previewResult.examples_to_delete.slice(0, 10)" :key="`delete-${example.start_at}`">
            Видалення: {{ formatSlotExample(example.start_at, example.end_at) }}
          </li>
        </ul>

        <ul v-if="previewResult.booked_conflict_examples?.length" class="generation__examples">
          <li v-for="example in previewResult.booked_conflict_examples.slice(0, 10)" :key="`conflict-${example.start_at}`">
            Конфлікт бронювання: {{ formatSlotExample(example.start_at, example.end_at) }}
          </li>
        </ul>
        <RouterLink class="btn btn--ghost btn--sm" to="/cabinet/slots">Перейти до вільних вікон</RouterLink>
      </div>
    </section>

    <ConfirmModal
      :open="confirmModal.open"
      :title="confirmModal.title"
      :message="confirmModal.message"
      :confirm-text="confirmModal.confirmText"
      :cancel-text="confirmModal.cancelText"
      :tone="confirmModal.tone"
      @confirm="confirmModal.confirm"
      @cancel="confirmModal.closeConfirm"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { apiDelete, apiGet, apiPatch, apiPost } from '../lib/api'
import ConfirmModal from '../components/ConfirmModal.vue'
import ScheduleSubnav from '../components/ScheduleSubnav.vue'
import { useConfirmModal } from '../composables/useConfirmModal'
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
  to_delete_count: number
  skipped_duplicate_or_conflict_count: number
  booked_conflicts_count: number
  examples_to_create: Array<{
    start_at: string
    end_at: string
  }>
  examples_to_delete: Array<{
    start_at: string
    end_at: string
  }>
  booked_conflict_examples: Array<{
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
  booked_conflicts_count: number
}

type AvailabilityException = {
  id: number
  specialist_id: number
  starts_at: string
  ends_at: string
  is_all_day: boolean
  note: string
  is_active: boolean
  created_at: string
  updated_at: string
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
const confirmModal = useConfirmModal()
const route = useRoute()
const exceptions = ref<AvailabilityException[]>([])
const exceptionsLoading = ref(false)
const exceptionError = ref('')
const ruleCreateStartTimeRef = ref<HTMLInputElement | null>(null)
const ruleCreateEndTimeRef = ref<HTMLInputElement | null>(null)
const ruleEditStartTimeRef = ref<HTMLInputElement | null>(null)
const ruleEditEndTimeRef = ref<HTMLInputElement | null>(null)
const editingExceptionId = ref<number | null>(null)
const exceptionSubmitting = ref(false)

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

const timeOptions = Array.from({ length: 24 * 4 }, (_, index) => {
  const minutes = index * 15
  const hours = String(Math.floor(minutes / 60)).padStart(2, '0')
  const mins = String(minutes % 60).padStart(2, '0')
  return `${hours}:${mins}`
})

const exceptionForm = reactive({
  start_date: '',
  start_time: '',
  end_date: '',
  end_time: '',
  is_all_day: true,
  note: '',
  is_active: true,
})

const exceptionEditForm = reactive({
  start_date: '',
  start_time: '',
  end_date: '',
  end_time: '',
  is_all_day: true,
  note: '',
  is_active: true,
})

const hasActiveRules = computed(() => rules.value.some((rule) => rule.is_active))
const isVacationView = computed(() => route.name === 'cabinet-schedule-vacation')

function openDateTimePicker(input: HTMLInputElement | null) {
  if (!input) return
  const picker = input as HTMLInputElement & { showPicker?: () => void }
  if (typeof picker.showPicker === 'function') {
    try {
      picker.showPicker()
      return
    } catch {
      // no-op: browser may block showPicker in some contexts
    }
  }
  input.focus()
}

function openPicker(event: Event) {
  const target = event.target as HTMLInputElement | null
  if (!target) return
  if (typeof target.showPicker === 'function') {
    try {
      target.showPicker()
    } catch {
      target.focus()
    }
    return
  }
  target.focus()
}

function exceptionApiError(err: unknown, fallback: string): string {
  const status = (err as { response?: { status?: number } })?.response?.status
  if (status === 404) {
    return 'Періоди недоступності поки недоступні на сервері. Оновіть бекенд або перевірте маршрут API.'
  }
  if (status && status >= 500) {
    return 'Сервер тимчасово не може обробити періоди недоступності. Спробуйте ще раз або перевірте логи бекенду.'
  }
  return getApiErrorMessage(err, fallback)
}

function weekdayLabel(value: number): string {
  return weekdayOptions.find((opt) => opt.value === value)?.label || String(value)
}

async function loadRules() {
  loading.value = true
  error.value = ''
  try {
    rules.value = await apiGet<AvailabilityRule[]>('/cabinet/availability-rules/')
  } catch (err) {
    error.value = getApiErrorMessage(err, 'Не вдалося завантажити правила розкладу.')
  } finally {
    loading.value = false
  }
}

async function loadExceptions() {
  exceptionsLoading.value = true
  exceptionError.value = ''
  try {
    exceptions.value = await apiGet<AvailabilityException[]>('/cabinet/availability-exceptions/')
  } catch (err) {
    exceptionError.value = exceptionApiError(err, 'Не вдалося завантажити періоди недоступності.')
  } finally {
    exceptionsLoading.value = false
  }
}

function toInputDateTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const mi = String(date.getMinutes()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`
}

function splitIsoToDateTimeParts(iso: string): { date: string; time: string } {
  const value = toInputDateTime(iso)
  if (!value.includes('T')) return { date: '', time: '' }
  const [date = '', time = ''] = value.split('T')
  return { date, time: time.slice(0, 5) }
}

function combineDateTimeToIso(dateValue: string, timeValue: string): string | null {
  if (!dateValue || !timeValue) return null
  const isoValue = `${dateValue}T${timeValue}`
  const parsed = new Date(isoValue)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.toISOString()
}

function resetExceptionForm() {
  exceptionForm.start_date = ''
  exceptionForm.start_time = ''
  exceptionForm.end_date = ''
  exceptionForm.end_time = ''
  exceptionForm.is_all_day = true
  exceptionForm.note = ''
  exceptionForm.is_active = true
}

function startEditException(item: AvailabilityException) {
  editingExceptionId.value = item.id
  const start = splitIsoToDateTimeParts(item.starts_at)
  const end = splitIsoToDateTimeParts(item.ends_at)
  exceptionEditForm.start_date = start.date
  exceptionEditForm.start_time = start.time
  exceptionEditForm.end_date = end.date
  exceptionEditForm.end_time = end.time
  exceptionEditForm.is_all_day = item.is_all_day
  exceptionEditForm.note = item.note || ''
  exceptionEditForm.is_active = item.is_active
}

function cancelEditException() {
  editingExceptionId.value = null
}

async function onCreateException() {
  exceptionSubmitting.value = true
  exceptionError.value = ''
  try {
    const startsAtIso = combineDateTimeToIso(exceptionForm.start_date, exceptionForm.start_time)
    const endsAtIso = combineDateTimeToIso(exceptionForm.end_date, exceptionForm.end_time)
    if (!startsAtIso || !endsAtIso) {
      exceptionError.value = 'Вкажіть коректні дату та час для початку і кінця.'
      return
    }
    await apiPost<AvailabilityException>('/cabinet/availability-exceptions/', {
      starts_at: startsAtIso,
      ends_at: endsAtIso,
      is_all_day: exceptionForm.is_all_day,
      note: exceptionForm.note,
      is_active: exceptionForm.is_active,
    })
    resetExceptionForm()
    await loadExceptions()
    generationSuccess.value = ''
  } catch (err) {
    exceptionError.value = exceptionApiError(err, 'Не вдалося створити період недоступності.')
  } finally {
    exceptionSubmitting.value = false
  }
}

async function onUpdateException(id: number) {
  exceptionSubmitting.value = true
  exceptionError.value = ''
  try {
    const startsAtIso = combineDateTimeToIso(
      exceptionEditForm.start_date,
      exceptionEditForm.start_time
    )
    const endsAtIso = combineDateTimeToIso(exceptionEditForm.end_date, exceptionEditForm.end_time)
    if (!startsAtIso || !endsAtIso) {
      exceptionError.value = 'Вкажіть коректні дату та час для початку і кінця.'
      return
    }
    await apiPatch<AvailabilityException>(`/cabinet/availability-exceptions/${id}/`, {
      starts_at: startsAtIso,
      ends_at: endsAtIso,
      is_all_day: exceptionEditForm.is_all_day,
      note: exceptionEditForm.note,
      is_active: exceptionEditForm.is_active,
    })
    cancelEditException()
    await loadExceptions()
    generationSuccess.value = ''
  } catch (err) {
    exceptionError.value = exceptionApiError(err, 'Не вдалося оновити період недоступності.')
  } finally {
    exceptionSubmitting.value = false
  }
}

async function onDeleteException(id: number) {
  confirmModal.openConfirm({
    title: 'Видалити період недоступності?',
    message: 'Період буде видалено з розкладу. Заброньовані сесії автоматично не скасовуються.',
    confirmText: 'Видалити',
    tone: 'danger',
    onConfirm: async () => {
      exceptionSubmitting.value = true
      exceptionError.value = ''
      try {
        await apiDelete(`/cabinet/availability-exceptions/${id}/`)
        if (editingExceptionId.value === id) cancelEditException()
        await loadExceptions()
        generationSuccess.value = ''
      } catch (err) {
        exceptionError.value = exceptionApiError(err, 'Не вдалося видалити період недоступності.')
      } finally {
        exceptionSubmitting.value = false
      }
    },
  })
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
  confirmModal.openConfirm({
    title: 'Видалити правило розкладу?',
    message: 'Правило буде видалено зі звичного ритму роботи. Застосуйте генерацію, щоб оновити вільні вікна.',
    confirmText: 'Видалити',
    tone: 'danger',
    onConfirm: async () => {
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
    },
  })
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
  if (previewResult.value.to_delete_count > 0) {
    confirmModal.openConfirm({
      title: 'Застосувати генерацію вільних вікон?',
      message:
        'Під час застосування система оновить розклад і може видалити частину вільних вікон. Заброньовані сесії не видаляються автоматично.',
      confirmText: 'Застосувати',
      tone: 'danger',
      onConfirm: async () => {
        await applyGeneration()
      },
    })
    return
  }
  await applyGeneration()
}

async function applyGeneration() {
  generationLoading.value = true
  generationError.value = ''
  generationSuccess.value = ''
  try {
    const result = await apiPost<AvailabilityGenerationApply>('/cabinet/availability-rules/apply-generation/', {
      days_ahead: 30,
    })
    generationSuccess.value = `Створено ${result.created_count} вільних вікон.`
    await loadRules()
    previewResult.value = null
  } catch (err) {
    generationError.value = getApiErrorMessage(err, 'Не вдалося застосувати генерацію.')
  } finally {
    generationLoading.value = false
  }
}

async function loadScheduleContext() {
  if (isVacationView.value) {
    await loadExceptions()
    return
  }
  await loadRules()
}

watch(
  () => route.name,
  async (nextName, prevName) => {
    if (nextName === prevName) return
    await loadScheduleContext()
  }
)

onMounted(loadScheduleContext)
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

.field--picker {
  cursor: pointer;
}

.datetime-field {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(110px, 130px);
  gap: 8px;
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

.generation__warning {
  margin: 0;
  color: #8a4c13;
  background: #fff7e6;
  border: 1px solid #f3ddb8;
  border-radius: 10px;
  padding: 10px 12px;
}

.generation__warning--strong {
  color: #8b2b2b;
  background: #fff1f1;
  border-color: #efcaca;
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
