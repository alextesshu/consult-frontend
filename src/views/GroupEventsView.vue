<template>
  <section class="groups">
    <header class="groups__hero">
      <div>
        <div class="badge">Групові події</div>
        <h1 class="title groups__title">Групові події</h1>
        <p class="muted groups__subtitle">
          Керуйте зустрічами та трансляціями. План визначає доступ і місткість.
        </p>
      </div>
      <RouterLink class="btn btn--ghost" to="/cabinet">Назад до кабінету</RouterLink>
    </header>

    <section class="panel">
      <div class="panel__header">
        <div>
          <div class="badge badge--soft">Статус доступу</div>
          <h2 class="panel__title">Поточні можливості</h2>
        </div>
        <div class="access-chip" :class="accessChipClass">{{ accessLabel }}</div>
      </div>
      <div class="access-grid">
        <div class="access-card">
          <div class="access-title">Групові події</div>
          <div class="access-value">{{ groupRoomLabel }}</div>
        </div>
        <div class="access-card">
          <div class="access-title">Ліміт зустрічей</div>
          <div class="access-value">{{ meetingLimitLabel }}</div>
        </div>
        <div class="access-card">
          <div class="access-title">Трансляції</div>
          <div class="access-value">{{ broadcastLabel }}</div>
        </div>
      </div>
      <div v-if="!groupRoomEnabled" class="group-hint">
        Групові події недоступні на цьому плані. Підготовка можлива лише після оновлення доступу.
      </div>
      <div v-else class="group-actions">
        <button class="btn" type="button" @click="createDraft('MEETING')" :disabled="createLoading">
          Створити зустріч
        </button>
        <button class="btn btn--ghost" type="button" @click="createDraft('BROADCAST')" :disabled="createLoading">
          Створити трансляцію
        </button>
      </div>
      <div v-if="groupRoomEnabled" class="group-create">
        <div class="group-create__title">Нова подія</div>
        <div class="group-create__grid">
          <div class="group-create__row">
            <label class="field">
              <span>Режим</span>
              <select v-model="createForm.mode">
                <option value="MEETING">Зустріч</option>
                <option value="BROADCAST">Трансляція</option>
              </select>
              <div class="field-hint">Зустріч — інтерактивна група. Трансляція — велика подія з обмеженою взаємодією.</div>
            </label>
            <label class="field">
              <span>Видимість учасників</span>
              <select v-model="createForm.participant_list_visibility">
                <option value="SHOW_NAMES">Показувати імена учасників</option>
                <option value="HIDDEN">Приховати імена учасників</option>
              </select>
              <div class="field-hint">Якщо приховано — учасники не бачать список.</div>
            </label>
          </div>
          <div class="group-create__row">
            <label class="field">
              <span>Початок</span>
              <input
                v-model="createForm.starts_at"
                type="datetime-local"
                @click="openDatePicker"
                @focus="openDatePicker"
              />
            </label>
            <label class="field">
              <span>Завершення</span>
              <input
                v-model="createForm.ends_at"
                type="datetime-local"
                @click="openDatePicker"
                @focus="openDatePicker"
              />
            </label>
          </div>
          <div class="group-create__row">
            <label class="field">
              <span>Ліміт учасників (зустріч)</span>
              <input v-model="createForm.capacity_limit_snapshot" type="number" min="1" placeholder="Напр. 10" />
              <div class="field-hint">Скільки людей можуть бути у зустрічі одночасно.</div>
            </label>
            <label class="field">
              <span>Ліміт підключень</span>
              <input v-model="createForm.technical_cap" type="number" min="1" placeholder="Напр. 100" />
              <div class="field-hint">Скільки підключень може витримати подія (для великих груп).</div>
            </label>
          </div>
        </div>
        <div class="group-create__actions">
          <button class="btn" type="button" @click="createEvent(false)" :disabled="createLoading">
            Створити чернетку
          </button>
          <button class="btn btn--ghost" type="button" @click="createEvent(true)" :disabled="createLoading">
            Створити та запланувати
          </button>
        </div>
        <div class="group-create__hint">
          Запланування можливе лише якщо задані початок та завершення.
        </div>
      </div>
    </section>

    <div v-if="loading" class="muted" style="margin-top: 12px;">Завантаження...</div>

    <section v-else class="group-list">
      <div v-if="events.length === 0" class="muted">Подій поки немає.</div>
      <article v-for="event in events" :key="event.id" class="group-card">
        <div class="group-card__header">
          <div class="badge badge--soft">{{ formatMode(event.mode) }}</div>
          <div class="state-pill" :class="statePillClass(event.state)">{{ formatState(event.state) }}</div>
        </div>
        <div class="group-title">Старт: {{ formatDate(event.starts_at) || 'Без розкладу' }}</div>
        <div class="muted">
          Завершення: {{ formatDate(event.ends_at) || 'Не задано' }}
        </div>
        <div class="group-card-actions">
          <button class="btn btn--ghost btn--sm" type="button" @click="toggleDetails(event.id)">
            {{ expandedEventId === event.id ? 'Згорнути' : 'Деталі' }}
          </button>
          <button
            v-if="event.state === 'DRAFT'"
            class="btn btn--sm"
            type="button"
            @click="scheduleEvent(event)"
            :disabled="isActionLoading(event.id)"
          >
            Запланувати
          </button>
          <button
            v-if="event.state === 'SCHEDULED'"
            class="btn btn--sm"
            type="button"
            @click="startEvent(event)"
            :disabled="isActionLoading(event.id)"
          >
            Старт
          </button>
          <button
            v-if="event.state === 'LIVE'"
            class="btn btn--sm"
            type="button"
            @click="completeEvent(event)"
            :disabled="isActionLoading(event.id)"
          >
            Завершити
          </button>
          <button
            v-if="event.state === 'DRAFT' || event.state === 'SCHEDULED'"
            class="btn btn--ghost btn--sm"
            type="button"
            @click="cancelEvent(event)"
            :disabled="isActionLoading(event.id)"
          >
            Скасувати
          </button>
          <button
            v-if="event.state === 'DRAFT'"
            class="btn btn--ghost btn--sm"
            type="button"
            @click="deleteDraft(event)"
            :disabled="isActionLoading(event.id)"
          >
            Видалити
          </button>
        </div>
        <div v-if="expandedEventId === event.id" class="group-details">
          <div class="group-details__grid">
            <div>
              <div class="group-details__label">Ліміт учасників</div>
              <div>{{ event.capacity_limit_snapshot ?? 'Н/Д' }}</div>
            </div>
            <div>
              <div class="group-details__label">Ліміт підключень</div>
              <div>{{ event.technical_cap ?? 'Н/Д' }}</div>
            </div>
            <div>
                  <div class="group-details__label">Видимість учасників</div>
                  <div>{{ formatVisibility(event.participant_list_visibility) }}</div>
                </div>
          </div>

          <div class="group-details__section">
            <div class="group-details__section-title">
              Учасники (усі)
              <button class="btn btn--ghost btn--sm" type="button" @click="loadParticipantView(event.id)">
                Оновити
              </button>
            </div>
            <div class="participant-filters">
              <label class="field">
                <span>Пошук</span>
                <input
                  v-model="participantFilters[event.id].query"
                  type="text"
                  placeholder="Ім'я або email"
                />
              </label>
              <label class="field">
                <span>Роль</span>
                <select v-model="participantFilters[event.id].role">
                  <option value="">Усі</option>
                  <option value="HOST">Ведучий</option>
                  <option value="CO_HOST">Співведучий</option>
                  <option value="SPEAKER">Доповідач</option>
                  <option value="PARTICIPANT">Учасник</option>
                </select>
              </label>
              <label class="field">
                <span>Статус</span>
                <select v-model="participantFilters[event.id].status">
                  <option value="">Усі</option>
                  <option value="PENDING">Очікує підтвердження</option>
                  <option value="ACCEPTED">Підтверджено</option>
                  <option value="DECLINED">Відхилено</option>
                </select>
              </label>
              <button class="btn btn--ghost btn--sm" type="button" @click="resetParticipantFilters(event.id)">
                Скинути
              </button>
            </div>
            <div v-if="participantViewLoading[event.id]" class="muted">Завантаження...</div>
            <div v-else-if="(participantViews[event.id] || []).length === 0" class="muted">
              Поки що немає учасників.
            </div>
            <div v-else class="participant-list">
              <div
                v-for="participant in filteredParticipants(event.id)"
                :key="participant.id"
                class="participant-row"
              >
                <div>
                  <div class="participant-name">{{ participant.user_username }}</div>
                  <div v-if="participant.user_email" class="muted">{{ participant.user_email }}</div>
                  <div class="muted">{{ formatRole(participant.role) }} · {{ formatInviteStatus(participant.invite_status) }}</div>
                </div>
                <div class="participant-actions">
                  <select
                    v-if="participant.role !== 'HOST'"
                    :value="participant.role"
                    @change="updateParticipantRole(event, participant, ($event.target as HTMLSelectElement).value)"
                  >
                    <option value="PARTICIPANT">Учасник</option>
                    <option value="SPEAKER">Доповідач</option>
                    <option value="CO_HOST">Співведучий</option>
                  </select>
                  <select
                    v-if="participant.role !== 'HOST'"
                    :value="participant.invite_status"
                    @change="updateParticipantStatus(event, participant, ($event.target as HTMLSelectElement).value)"
                  >
                    <option value="PENDING" :disabled="participant.invite_status !== 'PENDING'">Очікує підтвердження</option>
                    <option
                      value="ACCEPTED"
                      :disabled="participant.invite_status !== 'PENDING'"
                    >
                      Підтверджено
                    </option>
                    <option
                      value="DECLINED"
                      :disabled="participant.invite_status === 'DECLINED'"
                    >
                      Відхилено
                    </option>
                  </select>
                  <button
                    v-if="participant.role !== 'HOST'"
                    class="btn btn--ghost btn--sm"
                    type="button"
                    @click="removeParticipant(event, participant)"
                    :disabled="isActionLoading(event.id)"
                  >
                    Видалити
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="group-details__section">
            <div class="group-details__section-title">Додати учасника</div>
            <div class="participant-form">
              <label class="field">
                <span>Email або логін</span>
                <input
                  v-model="participantForm.userKey"
                  type="text"
                  placeholder="email@domain.com або логін"
                />
              </label>
              <label class="field">
                <span>Роль</span>
                <select v-model="participantForm.role">
                  <option value="PARTICIPANT">Учасник</option>
                  <option value="SPEAKER">Доповідач</option>
                  <option value="CO_HOST">Співведучий</option>
                </select>
              </label>
              <label class="field">
                <span>Статус</span>
                <select v-model="participantForm.invite_status">
                  <option value="ACCEPTED">Підтверджено</option>
                  <option value="PENDING">Очікує підтвердження</option>
                </select>
              </label>
              <button class="btn btn--sm" type="button" @click="addParticipant(event)">
                Додати
              </button>
            </div>
            <div v-if="participantFormHint" class="muted">{{ participantFormHint }}</div>
          </div>

          <div class="group-details__section">
            <div class="group-details__section-title">
              Запрошення (посилання)
              <button class="btn btn--ghost btn--sm" type="button" @click="loadInvites(event.id)">
                Оновити
              </button>
            </div>
            <div class="muted">Запрошені користувачі стануть вашими активними клієнтами після прийняття.</div>
            <div v-if="inviteLoading[event.id]" class="muted">Завантаження...</div>
            <div v-else-if="(invitesByEvent[event.id] || []).length === 0" class="muted">
              Запрошень поки немає.
            </div>
            <div v-else class="invite-list">
              <div v-for="invite in invitesByEvent[event.id]" :key="invite.id" class="invite-row">
                <div>
                  <div class="invite-token">{{ invite.token }}</div>
                  <div class="muted">
                    Використано: {{ invite.uses }} / {{ invite.max_uses ?? '∞' }}
                    · Діє до: {{ invite.expires_at ? formatDate(invite.expires_at) : 'без обмежень' }}
                  </div>
                  <div class="muted">Посилання: {{ inviteLink(invite.token) }}</div>
                </div>
                <div class="invite-actions">
                  <button
                    class="btn btn--ghost btn--sm"
                    type="button"
                    @click="copyInvite(invite.token)"
                  >
                    Копіювати посилання
                  </button>
                </div>
              </div>
            </div>
            <div class="invite-form">
              <div class="invite-hint muted">
                Створіть запрошення і надішліть посилання клієнтам чи колегам.
              </div>
              <label class="field">
                <span>Email (необов'язково)</span>
                <input v-model="inviteForm.email" type="email" placeholder="name@example.com" />
              </label>
              <label class="field">
                <span>Діє до</span>
                <input v-model="inviteForm.expires_at" type="datetime-local" />
              </label>
              <label class="field">
                <span>Макс. використань</span>
                <input v-model="inviteForm.max_uses" type="number" min="1" placeholder="Напр. 50" />
              </label>
              <button class="btn btn--sm" type="button" @click="createInvite(event)">
                Створити запрошення
              </button>
            </div>
          </div>
        </div>
      </article>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '../stores/auth'
import { http } from '../lib/http'
import { useToast } from '../composables/useToast'

type GroupEvent = {
  id: number
  mode: 'MEETING' | 'BROADCAST'
  state: 'DRAFT' | 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED'
  starts_at: string | null
  ends_at: string | null
  capacity_limit_snapshot: number | null
  technical_cap: number | null
  participant_list_visibility: 'SHOW_NAMES' | 'HIDDEN'
}

type GroupParticipant = {
  id: number
  user: number
  user_username: string
  user_email: string | null
  role: 'HOST' | 'CO_HOST' | 'SPEAKER' | 'PARTICIPANT'
  invite_status: 'PENDING' | 'ACCEPTED' | 'DECLINED'
}

type GroupInvite = {
  id: number
  token: string
  expires_at: string | null
  max_uses: number | null
  uses: number
  created_at: string
}

const auth = useAuthStore()
const { me } = storeToRefs(auth)
const events = ref<GroupEvent[]>([])
const loading = ref(false)
const error = ref('')
const toast = useToast()
const createLoading = ref(false)
const actionLoading = ref<Record<number, boolean>>({})
const participantViewLoading = ref<Record<number, boolean>>({})
const inviteLoading = ref<Record<number, boolean>>({})
const participantFormHint = ref('')
const expandedEventId = ref<number | null>(null)
const participantViews = ref<Record<number, GroupParticipant[]>>({})
const invitesByEvent = ref<Record<number, GroupInvite[]>>({})
const participantFilters = ref<Record<number, { query: string; role: string; status: string }>>({})

const createForm = reactive({
  mode: 'MEETING' as GroupEvent['mode'],
  starts_at: '',
  ends_at: '',
  capacity_limit_snapshot: '',
  technical_cap: '',
  participant_list_visibility: 'SHOW_NAMES' as GroupEvent['participant_list_visibility'],
})

const participantForm = reactive({
  userKey: '',
  role: 'PARTICIPANT' as GroupParticipant['role'],
  invite_status: 'ACCEPTED' as GroupParticipant['invite_status'],
})

const inviteForm = reactive({
  expires_at: '',
  max_uses: '',
  email: '',
})

watch(error, (value) => {
  if (!value) return
  toast.error(value)
  error.value = ''
})

function openDatePicker(event: Event) {
  const input = event.target as HTMLInputElement | null
  if (input && typeof input.showPicker === 'function') {
    input.showPicker()
  }
}

const groupRoomEnabled = computed(() => !!me.value?.effective_entitlements?.group_room_enabled)

const meetingLimitLabel = computed(() => {
  const limit = me.value?.effective_entitlements?.group_room_meeting_limit
  if (limit === null || limit === undefined) return 'Н/Д'
  return Number.isFinite(limit) ? String(limit) : '∞'
})

const broadcastLabel = computed(() => {
  const enabled = me.value?.effective_entitlements?.group_room_broadcast_enabled
  if (enabled === null || enabled === undefined) return 'Н/Д'
  return enabled ? 'Доступний' : 'Недоступний'
})

const groupRoomLabel = computed(() => {
  if (!me.value?.effective_entitlements) return 'Н/Д'
  return groupRoomEnabled.value ? 'Увімкнено' : 'Вимкнено'
})

const accessLabel = computed(() => {
  const state = me.value?.access_state
  if (!state) return 'Невідомо'
  if (state === 'OK') return 'Повний доступ'
  if (state === 'GRACE') return 'Пільговий доступ'
  if (state === 'RESTRICTED') return 'Обмежений режим'
  return state
})

const accessChipClass = computed(() => {
  const state = me.value?.access_state
  if (state === 'GRACE') return 'access-chip--warn'
  if (state === 'RESTRICTED') return 'access-chip--danger'
  return 'access-chip--ok'
})

function statePillClass(state: string) {
  if (state === 'LIVE') return 'state-pill--live'
  if (state === 'SCHEDULED') return 'state-pill--scheduled'
  if (state === 'CANCELLED') return 'state-pill--cancelled'
  if (state === 'COMPLETED') return 'state-pill--completed'
  return 'state-pill--draft'
}

function formatMode(mode: GroupEvent['mode']) {
  if (mode === 'MEETING') return 'Зустріч'
  if (mode === 'BROADCAST') return 'Трансляція'
  return mode
}

function formatState(state: GroupEvent['state']) {
  if (state === 'DRAFT') return 'Чернетка'
  if (state === 'SCHEDULED') return 'Заплановано'
  if (state === 'LIVE') return 'Триває'
  if (state === 'COMPLETED') return 'Завершено'
  if (state === 'CANCELLED') return 'Скасовано'
  return state
}

function formatVisibility(value: GroupEvent['participant_list_visibility']) {
  if (value === 'SHOW_NAMES') return 'Показувати імена'
  if (value === 'HIDDEN') return 'Приховано'
  return value
}

function formatRole(role: GroupParticipant['role']) {
  if (role === 'HOST') return 'Ведучий'
  if (role === 'CO_HOST') return 'Співведучий'
  if (role === 'SPEAKER') return 'Доповідач'
  if (role === 'PARTICIPANT') return 'Учасник'
  return role
}

function formatInviteStatus(status: GroupParticipant['invite_status']) {
  if (status === 'PENDING') return 'Очікує підтвердження'
  if (status === 'ACCEPTED') return 'Підтверджено'
  if (status === 'DECLINED') return 'Відхилено'
  return status
}

function formatDate(value: string | null) {
  if (!value) return ''
  const dt = new Date(value)
  if (Number.isNaN(dt.getTime())) return value
  return dt.toLocaleString('uk-UA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

function inviteLink(token: string) {
  return `${window.location.origin}/invite/${token}`
}

function isActionLoading(eventId: number) {
  return !!actionLoading.value[eventId]
}

function setActionLoading(eventId: number, value: boolean) {
  actionLoading.value = { ...actionLoading.value, [eventId]: value }
}

function setParticipantViewLoading(eventId: number, value: boolean) {
  participantViewLoading.value = { ...participantViewLoading.value, [eventId]: value }
}

function setInviteLoading(eventId: number, value: boolean) {
  inviteLoading.value = { ...inviteLoading.value, [eventId]: value }
}

function updateEvent(updated: GroupEvent) {
  events.value = events.value.map((item) => (item.id === updated.id ? updated : item))
}

function extractError(err: any, fallback: string) {
  const data = err?.response?.data
  return data?.detail || data?.code || fallback
}

function toIso(value: string) {
  const dt = new Date(value)
  if (Number.isNaN(dt.getTime())) return null
  return dt.toISOString()
}

async function loadEvents() {
  loading.value = true
  error.value = ''
  try {
    const resp = await http.get<GroupEvent[]>('/cabinet/group-events/')
    events.value = resp.data || []
  } catch (err: any) {
    error.value = err?.response?.data?.detail || 'Не вдалося завантажити події'
  } finally {
    loading.value = false
  }
}

async function createDraft(mode: GroupEvent['mode']) {
  createLoading.value = true
  error.value = ''
  try {
    const resp = await http.post<GroupEvent>('/cabinet/group-events/', { mode })
    events.value = [resp.data, ...events.value]
  } catch (err: any) {
    const data = err?.response?.data
    error.value = data?.detail || data?.code || 'Не вдалося створити подію'
  } finally {
    createLoading.value = false
  }
}

async function createEvent(schedule: boolean) {
  createLoading.value = true
  error.value = ''
  try {
    const payload: Record<string, any> = {
      mode: createForm.mode,
      participant_list_visibility: createForm.participant_list_visibility,
    }
    if (createForm.starts_at && createForm.ends_at) {
      payload.starts_at = toIso(createForm.starts_at)
      payload.ends_at = toIso(createForm.ends_at)
    }
    if (createForm.capacity_limit_snapshot) {
      payload.capacity_limit_snapshot = Number(createForm.capacity_limit_snapshot)
    }
    if (createForm.technical_cap) {
      payload.technical_cap = Number(createForm.technical_cap)
    }
    const resp = await http.post<GroupEvent>('/cabinet/group-events/', payload)
    let created = resp.data
    if (schedule) {
      if (!created.starts_at || !created.ends_at) {
        error.value = 'Для запланування потрібні початок та завершення.'
      } else {
        const scheduled = await http.patch<GroupEvent>(`/cabinet/group-events/${created.id}/schedule/`)
        created = scheduled.data
      }
    }
    events.value = [created, ...events.value]
  } catch (err: any) {
    error.value = extractError(err, 'Не вдалося створити подію')
  } finally {
    createLoading.value = false
  }
}

async function deleteDraft(event: GroupEvent) {
  setActionLoading(event.id, true)
  error.value = ''
  try {
    await http.delete(`/cabinet/group-events/${event.id}/`)
    events.value = events.value.filter((item) => item.id !== event.id)
  } catch (err: any) {
    const data = err?.response?.data
    error.value = data?.detail || data?.code || 'Не вдалося видалити подію'
  } finally {
    setActionLoading(event.id, false)
  }
}

async function scheduleEvent(event: GroupEvent) {
  setActionLoading(event.id, true)
  error.value = ''
  try {
    const resp = await http.patch<GroupEvent>(`/cabinet/group-events/${event.id}/schedule/`)
    updateEvent(resp.data)
  } catch (err: any) {
    error.value = extractError(err, 'Не вдалося запланувати подію')
  } finally {
    setActionLoading(event.id, false)
  }
}

async function startEvent(event: GroupEvent) {
  setActionLoading(event.id, true)
  error.value = ''
  try {
    const resp = await http.patch<GroupEvent>(`/cabinet/group-events/${event.id}/start/`)
    updateEvent(resp.data)
  } catch (err: any) {
    error.value = extractError(err, 'Не вдалося розпочати подію')
  } finally {
    setActionLoading(event.id, false)
  }
}

async function completeEvent(event: GroupEvent) {
  setActionLoading(event.id, true)
  error.value = ''
  try {
    const resp = await http.patch<GroupEvent>(`/cabinet/group-events/${event.id}/complete/`)
    updateEvent(resp.data)
  } catch (err: any) {
    error.value = extractError(err, 'Не вдалося завершити подію')
  } finally {
    setActionLoading(event.id, false)
  }
}

async function cancelEvent(event: GroupEvent) {
  setActionLoading(event.id, true)
  error.value = ''
  try {
    const resp = await http.patch<GroupEvent>(`/cabinet/group-events/${event.id}/cancel/`)
    updateEvent(resp.data)
  } catch (err: any) {
    error.value = extractError(err, 'Не вдалося скасувати подію')
  } finally {
    setActionLoading(event.id, false)
  }
}

async function toggleDetails(eventId: number) {
  if (expandedEventId.value === eventId) {
    expandedEventId.value = null
    return
  }
  expandedEventId.value = eventId
  if (!participantFilters.value[eventId]) {
    participantFilters.value = {
      ...participantFilters.value,
      [eventId]: { query: '', role: '', status: '' },
    }
  }
  await Promise.all([loadParticipantView(eventId), loadInvites(eventId)])
}

async function loadParticipantView(eventId: number) {
  setParticipantViewLoading(eventId, true)
  participantFormHint.value = ''
  try {
    const resp = await http.get<GroupParticipant[]>(`/cabinet/group-events/${eventId}/participants/`)
    participantViews.value = {
      ...participantViews.value,
      [eventId]: resp.data || [],
    }
    if (!participantFilters.value[eventId]) {
      participantFilters.value = {
        ...participantFilters.value,
        [eventId]: { query: '', role: '', status: '' },
      }
    }
  } catch (err: any) {
    error.value = extractError(err, 'Не вдалося завантажити учасників')
  } finally {
    setParticipantViewLoading(eventId, false)
  }
}

async function addParticipant(event: GroupEvent) {
  participantFormHint.value = ''
  const userKey = participantForm.userKey.trim()
  if (!userKey) {
    participantFormHint.value = 'Вкажіть email або логін.'
    return
  }
  setActionLoading(event.id, true)
  try {
    const payload: Record<string, any> = {
      role: participantForm.role,
      invite_status: participantForm.invite_status,
    }
    if (userKey.includes('@')) {
      payload.user_email = userKey
    } else {
      payload.user_username = userKey
    }
    await http.post<GroupParticipant>(`/cabinet/group-events/${event.id}/participants/`, {
      ...payload,
    })
    participantForm.userKey = ''
    participantForm.role = 'PARTICIPANT'
    participantForm.invite_status = 'ACCEPTED'
    await loadParticipantView(event.id)
  } catch (err: any) {
    participantFormHint.value = extractError(err, 'Не вдалося додати учасника')
  } finally {
    setActionLoading(event.id, false)
  }
}

async function removeParticipant(event: GroupEvent, participant: GroupParticipant) {
  setActionLoading(event.id, true)
  try {
    await http.delete(`/cabinet/group-events/${event.id}/participants/${participant.id}/`)
    await loadParticipantView(event.id)
  } catch (err: any) {
    error.value = extractError(err, 'Не вдалося видалити учасника')
  } finally {
    setActionLoading(event.id, false)
  }
}

async function updateParticipantRole(event: GroupEvent, participant: GroupParticipant, role: string) {
  if (participant.role === role) return
  setActionLoading(event.id, true)
  try {
    const resp = await http.patch<GroupParticipant>(
      `/cabinet/group-events/${event.id}/participants/${participant.id}/role/`,
      { role }
    )
    const current = participantViews.value[event.id]
    if (current) {
      const updated = current.map((item) =>
        item.id === participant.id ? { ...item, role: resp.data.role } : item
      )
      participantViews.value = { ...participantViews.value, [event.id]: updated }
    }
  } catch (err: any) {
    error.value = extractError(err, 'Не вдалося оновити роль')
  } finally {
    setActionLoading(event.id, false)
  }
}

async function updateParticipantStatus(event: GroupEvent, participant: GroupParticipant, invite_status: string) {
  if (participant.invite_status === invite_status) return
  setActionLoading(event.id, true)
  try {
    const resp = await http.patch<GroupParticipant>(
      `/cabinet/group-events/${event.id}/participants/${participant.id}/invite-status/`,
      { invite_status }
    )
    const current = participantViews.value[event.id]
    if (current) {
      const updated = current.map((item) =>
        item.id === participant.id ? { ...item, invite_status: resp.data.invite_status } : item
      )
      participantViews.value = { ...participantViews.value, [event.id]: updated }
    }
  } catch (err: any) {
    error.value = extractError(err, 'Не вдалося оновити статус')
  } finally {
    setActionLoading(event.id, false)
  }
}

async function loadInvites(eventId: number) {
  setInviteLoading(eventId, true)
  try {
    const resp = await http.get<GroupInvite[]>(`/cabinet/group-events/${eventId}/invites/`)
    invitesByEvent.value = { ...invitesByEvent.value, [eventId]: resp.data || [] }
  } catch (err: any) {
    error.value = extractError(err, 'Не вдалося завантажити запрошення')
  } finally {
    setInviteLoading(eventId, false)
  }
}

async function copyInvite(token: string) {
  const link = inviteLink(token)
  try {
    await navigator.clipboard.writeText(link)
    toast.success('Посилання скопійовано.')
  } catch {
    toast.error('Не вдалося скопіювати посилання.')
  }
}

async function createInvite(event: GroupEvent) {
  setActionLoading(event.id, true)
  try {
    const payload: Record<string, any> = {}
    if (inviteForm.email) {
      payload.email = inviteForm.email.trim()
    }
    if (inviteForm.expires_at) {
      payload.expires_at = toIso(inviteForm.expires_at)
    }
    if (inviteForm.max_uses) {
      payload.max_uses = Number(inviteForm.max_uses)
    }
    const resp = await http.post<GroupInvite>(`/cabinet/group-events/${event.id}/invites/`, payload)
    const created = resp.data
    inviteForm.expires_at = ''
    inviteForm.max_uses = ''
    inviteForm.email = ''
    const current = invitesByEvent.value[event.id] || []
    invitesByEvent.value = {
      ...invitesByEvent.value,
      [event.id]: [created, ...current.filter((item) => item.id !== created.id)],
    }
    await copyInvite(created.token)
    if (payload.email) {
      const emailSent = (resp.data as any)?.email_sent
      if (emailSent) {
        toast.success('Запрошення надіслано на email.')
      } else {
        toast.error('Не вдалося надіслати email. Посилання скопійовано.')
      }
    }
  } catch (err: any) {
    error.value = extractError(err, 'Не вдалося створити запрошення')
  } finally {
    setActionLoading(event.id, false)
  }
}

onMounted(loadEvents)

function filteredParticipants(eventId: number) {
  const list = participantViews.value[eventId] || []
  const filter = participantFilters.value[eventId] || { query: '', role: '', status: '' }
  const query = filter.query.trim().toLowerCase()
  return list.filter((participant) => {
    if (filter.role && participant.role !== filter.role) return false
    if (filter.status && participant.invite_status !== filter.status) return false
    if (!query) return true
    const username = participant.user_username.toLowerCase()
    const email = participant.user_email?.toLowerCase() || ''
    return username.includes(query) || email.includes(query)
  })
}

function resetParticipantFilters(eventId: number) {
  participantFilters.value = {
    ...participantFilters.value,
    [eventId]: { query: '', role: '', status: '' },
  }
}
</script>

<style scoped>
.groups {
  display: grid;
  gap: 18px;
}

.groups__hero {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 20px;
  background: linear-gradient(135deg, rgba(8, 113, 201, 0.16), rgba(7, 47, 71, 0.06));
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 22px 24px;
  box-shadow: var(--shadow);
}

.groups__title {
  font-size: 32px;
}

.groups__subtitle {
  max-width: 520px;
}

.panel {
  border: 1px solid var(--line);
  border-radius: 18px;
  padding: 18px;
  background: #fff;
  display: grid;
  gap: 16px;
}

.panel__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.panel__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 22px;
}

.badge--soft {
  background: rgba(8, 113, 201, 0.12);
}

.access-chip {
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  background: rgba(31, 122, 76, 0.16);
  color: #1f7a4c;
}

.access-chip--warn {
  background: rgba(217, 164, 65, 0.2);
  color: #a57011;
}

.access-chip--danger {
  background: rgba(194, 75, 75, 0.2);
  color: #a03838;
}

.access-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}

.access-card {
  padding: 12px 14px;
  border-radius: 14px;
  border: 1px solid rgba(7, 47, 71, 0.1);
  background: rgba(7, 47, 71, 0.04);
}

.access-title {
  font-size: 12px;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.12em;
}

.access-value {
  margin-top: 6px;
  font-weight: 600;
}

.group-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.group-hint {
  color: #8a6d3b;
  background: #fff7e6;
  border: 1px solid #f3e1b3;
  padding: 10px 12px;
  border-radius: 12px;
}

.group-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}

.group-card {
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 16px;
  background: #fff;
}

.group-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.group-title {
  margin: 10px 0 4px;
  font-weight: 600;
}

.group-card-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.group-create {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed rgba(7, 47, 71, 0.12);
  display: grid;
  gap: 12px;
}

.group-create__title {
  font-weight: 600;
}

.group-create__grid {
  display: grid;
  gap: 12px;
}

.group-create__row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
  align-items: end;
}

.group-create__actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.group-create__hint {
  color: var(--muted);
  font-size: 13px;
}

.field {
  display: grid;
  gap: 8px;
  font-size: 13px;
  align-content: start;
}

.field span {
  display: block;
  color: var(--muted);
  font-size: 12px;
  letter-spacing: 0.02em;
  line-height: 1.2;
}

.field-hint {
  color: var(--muted);
  font-size: 12px;
  line-height: 1.3;
}

.field input,
.field select {
  min-height: 44px;
  border-radius: 12px;
  border: 1px solid var(--line);
  padding: 10px 12px;
  font-size: 14px;
  font-family: var(--font-sans);
  background: #fff;
  line-height: 1.4;
  width: 100%;
  box-sizing: border-box;
}

.field input[type='number'] {
  padding-right: 12px;
  appearance: textfield;
  -moz-appearance: textfield;
}

:deep(.field input[type='number']::-webkit-outer-spin-button),
:deep(.field input[type='number']::-webkit-inner-spin-button) {
  -webkit-appearance: none;
  margin: 0;
}

.group-details {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px dashed rgba(7, 47, 71, 0.12);
  display: grid;
  gap: 16px;
}

.group-details__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
}

.group-details__label {
  color: var(--muted);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.group-details__section {
  display: grid;
  gap: 10px;
}

.group-details__section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-weight: 600;
}

.participant-list,
.invite-list {
  display: grid;
  gap: 8px;
}

.participant-row,
.invite-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid rgba(7, 47, 71, 0.12);
  background: rgba(7, 47, 71, 0.03);
}

.participant-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.participant-actions select {
  height: 32px;
  border-radius: 8px;
  border: 1px solid var(--line);
  padding: 0 8px;
  font-size: 12px;
}

.participant-name {
  font-weight: 600;
}

.participant-form,
.invite-form {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 10px;
  align-items: end;
}

.participant-filters {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 10px;
  align-items: end;
}

.invite-hint {
  grid-column: 1 / -1;
  font-size: 12px;
}

.invite-token {
  font-family: var(--font-mono);
  font-size: 13px;
  word-break: break-all;
}

.state-pill {
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 6px 10px;
  border-radius: 999px;
  background: #eef6ff;
  color: #0b4a7d;
}

.state-pill--draft {
  background: #eef6ff;
  color: #0b4a7d;
}

.state-pill--scheduled {
  background: rgba(217, 164, 65, 0.18);
  color: #a57011;
}

.state-pill--live {
  background: rgba(31, 122, 76, 0.18);
  color: #1f7a4c;
}

.state-pill--completed {
  background: rgba(7, 47, 71, 0.12);
  color: #13455e;
}

.state-pill--cancelled {
  background: rgba(194, 75, 75, 0.18);
  color: #a03838;
}

.btn--sm {
  padding: 6px 10px;
  font-size: 13px;
}

@media (max-width: 860px) {
  .groups__hero {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
