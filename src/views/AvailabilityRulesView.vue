<template>
  <section v-if="uiV2" class="pc2-schedule-editor">
    <ScheduleHeroV2 :active="isVacationView ? 'vacation' : 'rules'" :title="isVacationView ? 'Відпустка й паузи' : 'Робочі години'" subtitle="Шаблон, створені вікна та сесії — окремі стани розкладу." :busy="busyV2" />
    <p v-if="navigationWarning" role="alert">{{ navigationWarning }}</p>
    <ScheduleRulesV2 v-if="!isVacationView" :rules="rules" :busy="busyV2" :error="error" :editing="editingRuleId" :toggling="togglingRuleId" @reload="loadRules" @add="openRuleCreate" @edit="startEdit" @toggle="onToggleRuleStatus" @remove="onDeleteRule">
      <template #edit="{ rule }"><form class="pc2-editor-form" @submit.prevent="onSaveRule(rule.id)"><fieldset :disabled="busyV2"><ScheduleRuleFieldsV2 :model-value="editForm" /><div class="pc2-editor-actions"><button type="submit">Зберегти проміжок</button><button type="button" @click="cancelEdit">Скасувати</button></div></fieldset></form></template>
      <template #generation>
        <section class="pc2-generation" aria-label="Генерація вікон">
          <h2>Створити вікна з робочих годин</h2>
          <p>Перегляд не створює вікон. Застосування може видалити незаброньовані вікна. Публічний запис визначається налаштуваннями й правилами сервера.</p>
          <div class="pc2-editor-actions"><label>З<input v-model="generationPeriod.date_from" type="date" :disabled="busyV2" /></label><label>По<input v-model="generationPeriod.date_to" type="date" :disabled="busyV2" /></label></div>
          <button type="button" :disabled="busyV2 || !hasActiveRules || hasUnsavedV2" @click="onPreviewGeneration">Переглянути генерацію</button>
          <p v-if="!busyV2 && !hasActiveRules">Для генерації додайте або увімкніть хоча б один робочий проміжок.</p>
          <p v-if="hasUnsavedV2">Спочатку збережіть або скасуйте зміни проміжку.</p>
          <p v-if="generationLoading" role="status">Обробляємо генерацію…</p><p v-if="generationError" role="alert">{{ generationError }}</p><p v-if="generationSuccess" role="status">{{ generationSuccess }}</p>
          <div v-if="previewResult" class="pc2-generation__preview">
            <h3>Попередній перегляд — не створені вікна</h3>
            <p>{{ previewResult.date_range.date_from }} — {{ previewResult.date_range.date_to }}</p>
            <p>До створення: {{ previewResult.to_create_count }} · До видалення: {{ previewResult.to_delete_count }} · Без змін: {{ previewResult.existing_count }}</p>
            <p>Конфлікти із заброньованими: {{ previewResult.booked_conflicts_count }} · Пропущено: {{ previewResult.skipped_duplicate_or_conflict_count }}</p>
            <p>Сервер повторно перевірить стан під час застосування. Результат може змінитися.</p>
            <button type="button" :disabled="busyV2 || hasUnsavedV2" @click="onApplyGeneration">Підтвердити генерацію</button>
          </div>
          <RouterLink to="/cabinet/slots?tab=availability">Перевірити створені вікна →</RouterLink>
        </section>
      </template>
    </ScheduleRulesV2>
    <ScheduleVacationV2 v-else :exceptions="exceptions" :busy="busyV2" :error="exceptionError" :editing="editingExceptionId" :format="formatSlotExample" @reload="loadExceptions" @edit="startEditException" @remove="onDeleteException">
      <template #create><form class="pc2-editor-form" @submit.prevent="onCreateException"><fieldset :disabled="busyV2"><ScheduleExceptionFieldsV2 :model-value="exceptionForm" /><p>Час — у часовому поясі пристрою: {{ deviceTimezone }}. Для цілоденної паузи вкажіть межі від 00:00 до 00:00 наступного дня.</p><button type="submit">Додати паузу</button></fieldset></form></template>
      <template #edit="{ item }"><form class="pc2-editor-form" @submit.prevent="onUpdateException(item.id)"><fieldset :disabled="busyV2"><ScheduleExceptionFieldsV2 :model-value="exceptionEditForm" /><div class="pc2-editor-actions"><button type="submit">Зберегти паузу</button><button type="button" @click="cancelEditException">Скасувати</button></div></fieldset></form></template>
    </ScheduleVacationV2>
    <ScheduleSlotDialogV2 v-if="ruleCreateOpen" label="Новий робочий проміжок" @close="closeRuleCreate">
      <button ref="ruleCloseButton" class="pc2-schedule-dialog__close" type="button" aria-label="Закрити" @click="closeRuleCreate">×</button><h2>Новий проміжок</h2>
      <div v-if="ruleClosePending" class="pc2-editor-form" role="alert"><p>Є незбережені зміни проміжку.</p><div class="pc2-editor-actions"><button ref="keepRuleButton" type="button" @click="keepRuleCreate">Продовжити редагування</button><button type="button" @click="discardRuleCreate">Відкинути зміни</button></div></div>
      <form class="pc2-editor-form" @submit.prevent="onCreateRule"><fieldset :disabled="busyV2 || ruleClosePending"><ScheduleRuleFieldsV2 :model-value="createForm" /><button type="submit">Зберегти проміжок</button></fieldset><p v-if="error" role="alert">{{ error }}</p><p v-if="navigationWarning" role="alert">{{ navigationWarning }}</p></form>
    </ScheduleSlotDialogV2>
    <ConfirmModal :open="confirmModal.open" :title="confirmModal.title" :message="confirmModal.message" :confirm-text="confirmModal.confirmText" :cancel-text="confirmModal.cancelText" :tone="confirmModal.tone" @confirm="confirmModal.confirm" @cancel="confirmModal.closeConfirm" />
  </section>
  <section v-else class="availability-rules">
    <header class="availability-rules__header">
      <div>
        <h1 class="title availability-rules__title">{{ isVacationView ? 'Відпустка' : 'Налаштування розкладу' }}</h1>
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

    <div class="availability-rules__main-tabs">
      <div class="schedule-tabs" role="tablist" aria-label="Режими розкладу">
        <RouterLink class="btn btn--ghost btn--sm schedule-tabs__item" role="tab" aria-selected="false" to="/cabinet/schedule">
          Календар
        </RouterLink>
        <RouterLink class="btn btn--ghost btn--sm schedule-tabs__item" role="tab" aria-selected="false" to="/cabinet/slots?tab=availability">
          Вікна для запису
        </RouterLink>
        <RouterLink
          class="btn btn--ghost btn--sm schedule-tabs__item"
          :class="{ 'btn--active': isVacationView }"
          role="tab"
          :aria-selected="isVacationView ? 'true' : 'false'"
          to="/cabinet/availability-exceptions"
        >
          Відпустка
        </RouterLink>
      </div>
    </div>

    <section v-if="!isVacationView" class="panel panel--control">
      <div class="panel__header">
        <div>
          <h2 class="panel__title">Налаштуйте робочі години</h2>
          <p class="muted generation__subtitle generation__subtitle--quiet">
            Робочі години визначають, коли ви зазвичай доступні в цей день. Щоб зробити перерву, створіть два окремі записи.
          </p>
          <p class="muted generation__subtitle generation__subtitle--quiet">
            Це лише шаблон розкладу. Самі правила не публікують вільні вікна для запису клієнтів.
          </p>
        </div>
      </div>

      <form class="rule-form rule-form--compact" @submit.prevent="onCreateRule">
        <div class="rule-form__grid rule-form__grid--compact">
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
            <select v-model="createForm.start_time" class="input" required>
              <option v-for="option in timeOptions" :key="option" :value="option">
                {{ option }}
              </option>
            </select>
          </label>

          <label class="field">
            Кінець
            <select v-model="createForm.end_time" class="input" required>
              <option v-for="option in timeOptions" :key="option" :value="option">
                {{ option }}
              </option>
            </select>
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
        </div>

        <button class="btn rule-form__submit" type="submit" :disabled="loading">
          Додати робочі години
        </button>
      </form>
      <div v-if="error" class="form-error">{{ error }}</div>
    </section>

    <section v-if="false" class="panel">
      <div class="panel__header">
        <div>
          <h2 class="panel__title">Налаштовані робочі години</h2>
        </div>
      </div>

      <div v-if="loading && !rules.length" class="muted">Завантаження...</div>
      <div v-else-if="!rules.length" class="muted">
        У вас ще немає налаштованих робочих годин.
      </div>

      <div v-else class="rules-list rules-list--compact">
        <article v-for="rule in rules" :key="rule.id" class="rule-card">
          <template v-if="editingRuleId === rule.id">
            <form class="rule-form rule-form--compact" @submit.prevent="onSaveRule(rule.id)">
              <div class="rule-form__grid rule-form__grid--compact">
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
                  <select v-model="editForm.start_time" class="input" required>
                    <option v-for="option in timeOptions" :key="option" :value="option">
                      {{ option }}
                    </option>
                  </select>
                </label>

                <label class="field">
                  Кінець
                  <select v-model="editForm.end_time" class="input" required>
                    <option v-for="option in timeOptions" :key="option" :value="option">
                      {{ option }}
                    </option>
                  </select>
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
              <button
                class="rule-card__status rule-card__status--toggle"
                :class="{
                  'rule-card__status--inactive': !rule.is_active,
                  'rule-card__status--pending': togglingRuleId === rule.id,
                }"
                type="button"
                :disabled="loading || togglingRuleId === rule.id"
                title="Натисніть, щоб змінити статус правила"
                @click="onToggleRuleStatus(rule)"
              >
                {{ rule.is_active ? 'Активне' : 'Неактивне' }}
              </button>
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

    <section v-if="isVacationView" class="panel panel--control">
      <div class="panel__header">
        <div>
          <h2 class="panel__title">Періоди недоступності</h2>
          <p class="muted generation__subtitle generation__subtitle--quiet">
            Такі періоди перекривають ваш звичний розклад і не дозволяють створювати нові вільні вікна у цей час.
          </p>
        </div>
      </div>

      <form class="rule-form rule-form--compact" @submit.prevent="onCreateException">
        <div class="rule-form__grid rule-form__grid--compact">
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
      <div v-else class="rules-list rules-list--compact">
        <article v-for="item in exceptions" :key="item.id" class="rule-card">
          <template v-if="editingExceptionId === item.id">
            <form class="rule-form rule-form--compact" @submit.prevent="onUpdateException(item.id)">
              <div class="rule-form__grid rule-form__grid--compact">
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
                      placeholder="дд.мм.рррр"
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
          <h2 class="panel__title">Згенеруйте вільні вікна</h2>
          <p class="muted generation__subtitle">
            Система створить вільні вікна на основі ваших активних робочих годин.
          </p>
          <p class="muted generation__subtitle generation__subtitle--quiet">
            Лише після кроку «Створити вільні вікна» вони стануть доступними для запису у публічному профілі.
          </p>
        </div>
      </div>

      <div class="generation__actions">
        <button class="btn" type="button" :disabled="!hasActiveRules || generationLoading" @click="onPreviewGeneration">
          Переглянути результат на 30 днів
        </button>
        <button
          class="btn btn--ghost"
          type="button"
          :disabled="!previewResult || generationLoading"
          @click="onApplyGeneration"
        >
          Створити вільні вікна
        </button>
      </div>

      <p v-if="!hasActiveRules" class="muted">Додайте активні робочі години, щоб запустити preview.</p>
      <div v-if="generationError" class="form-error">{{ generationError }}</div>
      <p v-if="generationSuccess" class="generation__success">{{ generationSuccess }}</p>

      <div v-if="previewResult" class="generation__result">
        <p v-if="previewResult.to_delete_count > 0" class="generation__warning">
          Під час застосування система оновить розклад і може видалити частину вільних вікон. Заброньовані сесії не видаляються автоматично.
        </p>
        <p v-if="previewResult.booked_conflicts_count > 0" class="generation__warning generation__warning--strong">
          У вибраному діапазоні є вже заброньовані сесії, які потребують окремої уваги.
        </p>
        <div class="generation__summary">
          <p class="generation__summaryItem">
            Створимо <strong>{{ previewResult.to_create_count }}</strong>
            {{ slotsWord(previewResult.to_create_count) }} на <strong>{{ previewResult.days_covered }}</strong> днів.
          </p>
          <p class="generation__summaryItem">
            Пропустимо <strong>{{ previewResult.skipped_duplicate_or_conflict_count }}</strong>
            {{ intervalsWord(previewResult.skipped_duplicate_or_conflict_count) }} через дублікати або конфлікти.
          </p>
          <p v-if="previewResult.existing_count > 0" class="generation__summaryItem">
            Без змін залишиться <strong>{{ previewResult.existing_count }}</strong>
            {{ slotsWord(previewResult.existing_count) }}, що вже існують.
          </p>
        </div>

        <details class="generation__details">
          <summary>Показати деталі</summary>
          <div class="generation__stats">
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
              Конфлікт часу: {{ formatSlotExample(example.start_at, example.end_at) }}
            </li>
          </ul>
        </details>
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
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { onBeforeRouteLeave, onBeforeRouteUpdate, useRoute } from 'vue-router'
import { apiDelete, apiGet, apiPatch, apiPost, fetchSpecialistProfile } from '../lib/api'
import { isUiV2 } from '../lib/uiVersion'
import ScheduleHeroV2 from '../components/schedule/ScheduleHeroV2.vue'
import ScheduleRulesV2 from '../components/schedule/ScheduleRulesV2.vue'
import ScheduleVacationV2 from '../components/schedule/ScheduleVacationV2.vue'
import ScheduleRuleFieldsV2 from '../components/schedule/ScheduleRuleFieldsV2.vue'
import ScheduleExceptionFieldsV2 from '../components/schedule/ScheduleExceptionFieldsV2.vue'
import ScheduleSlotDialogV2 from '../components/schedule/ScheduleSlotDialogV2.vue'
import { previewAvailabilityGeneration, applyAvailabilityGeneration } from '../lib/api'
import ConfirmModal from '../components/ConfirmModal.vue'
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
const editingExceptionId = ref<number | null>(null)
const exceptionSubmitting = ref(false)
const STANDARD_SESSION_DURATION_FALLBACK = 50
const standardSessionDurationMinutes = ref(STANDARD_SESSION_DURATION_FALLBACK)

const createForm = reactive({
  weekday: 0,
  start_time: '09:00',
  end_time: '18:00',
  session_duration_minutes: STANDARD_SESSION_DURATION_FALLBACK,
  buffer_minutes: 10,
  is_active: true,
})

const editingRuleId = ref<number | null>(null)
const togglingRuleId = ref<number | null>(null)
const editForm = reactive({
  weekday: 0,
  start_time: '09:00',
  end_time: '18:00',
  session_duration_minutes: STANDARD_SESSION_DURATION_FALLBACK,
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


const deviceTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
const uiV2 = computed(isUiV2)
const readingRulesV2 = ref(false)
const initializingV2 = ref(true)
const ruleCreateOpen = ref(false)
const ruleClosePending = ref(false)
const keepRuleButton = ref<HTMLButtonElement | null>(null)
const ruleCloseButton = ref<HTMLButtonElement | null>(null)
const navigationWarning = ref('')
const generationPeriod = reactive({ date_from: new Date().toLocaleDateString('en-CA'), date_to: new Date(Date.now() + 29 * 86400000).toLocaleDateString('en-CA') })
const busyV2 = computed(() => initializingV2.value || loading.value || togglingRuleId.value !== null || generationLoading.value || exceptionsLoading.value || exceptionSubmitting.value)
type DraftKey = 'createForm' | 'editForm' | 'exceptionForm' | 'exceptionEditForm'
const draftSnapshot = reactive<Partial<Record<DraftKey, string>>>({})
function drafts() { return { createForm, editForm, exceptionForm, exceptionEditForm } }
function markClean(keys: DraftKey[] = ['createForm', 'editForm', 'exceptionForm', 'exceptionEditForm']) {
  for (const key of keys) draftSnapshot[key] = JSON.stringify(drafts()[key])
  navigationWarning.value = ''
}
const hasUnsavedV2 = computed(() => uiV2.value && (Object.keys(draftSnapshot) as DraftKey[]).some(key => draftSnapshot[key] !== JSON.stringify(drafts()[key])))
function allowDiscard() {
  if (!uiV2.value) return true
  if ((loading.value && !readingRulesV2.value) || togglingRuleId.value !== null || generationLoading.value || exceptionSubmitting.value) { navigationWarning.value = 'Зачекайте завершення операції.'; return false }
  return !hasUnsavedV2.value || window.confirm('Незбережені зміни буде втрачено. Продовжити?')
}
function openRuleCreate(day: number) {
  if (!allowDiscard()) return
  editingRuleId.value = null
  resetCreateForm(); createForm.weekday = day; ruleClosePending.value = false; ruleCreateOpen.value = true; error.value = ''; markClean(['createForm', 'editForm'])
}
function closeRuleCreate() {
  if (busyV2.value) { navigationWarning.value = 'Зачекайте завершення операції.'; return }
  if (hasUnsavedV2.value) { ruleClosePending.value = true; void nextTick(() => keepRuleButton.value?.focus()); return }
  discardRuleCreate()
}
function discardRuleCreate() { ruleCreateOpen.value = false; ruleClosePending.value = false; resetCreateForm(); markClean(['createForm']) }
function keepRuleCreate() { ruleClosePending.value = false; void nextTick(() => ruleCloseButton.value?.focus()) }
function beforeUnload(event: BeforeUnloadEvent) { if (uiV2.value && (hasUnsavedV2.value || busyV2.value)) { event.preventDefault(); event.returnValue = '' } }
onBeforeRouteLeave(() => allowDiscard())
onBeforeRouteUpdate((to, from) => to.fullPath === from.fullPath || allowDiscard())
onBeforeUnmount(() => window.removeEventListener('beforeunload', beforeUnload))
watch([generationPeriod, rules], () => { if (uiV2.value) previewResult.value = null }, { deep: true })

function validateV2Rule(form: typeof createForm) {
  if (!form.start_time || !form.end_time || form.start_time >= form.end_time) { error.value = 'Кінець проміжку має бути пізніше за початок.'; return false }
  if (!Number.isInteger(form.session_duration_minutes) || form.session_duration_minutes < 5 || !Number.isInteger(form.buffer_minutes) || form.buffer_minutes < 0) { error.value = 'Перевірте тривалість і паузу.'; return false }
  return true
}
function validateV2Exception(form: typeof exceptionForm) {
  const start = combineDateTimeToIso(form.start_date, form.start_time), end = combineDateTimeToIso(form.end_date, form.end_time)
  if (!start || !end || start >= end) { exceptionError.value = 'Кінець паузи має бути пізніше за початок.'; return false }
  return true
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

function normalizeRuleTime(value: string): string {
  const trimmed = String(value || '').trim()
  const match = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(trimmed)
  if (!match) return trimmed
  const hours = String(Number(match[1])).padStart(2, '0')
  return `${hours}:${match[2]}`
}

function normalizeRule(rule: AvailabilityRule): AvailabilityRule {
  return {
    ...rule,
    start_time: normalizeRuleTime(rule.start_time),
    end_time: normalizeRuleTime(rule.end_time),
  }
}

async function loadRules() {
  readingRulesV2.value = true
  loading.value = true
  error.value = ''
  try {
    const response = await apiGet<AvailabilityRule[]>('/cabinet/availability-rules/')
    rules.value = (response || []).map(normalizeRule)
  } catch (err) {
    error.value = getApiErrorMessage(err, 'Не вдалося завантажити налаштування розкладу.')
  } finally {
    loading.value = false
    readingRulesV2.value = false
  }
}

async function loadStandardSessionDuration() {
  try {
    const profile = await fetchSpecialistProfile()
    const value = Number(profile.standard_session_duration_minutes)
    if (!Number.isFinite(value) || value <= 0) return
    standardSessionDurationMinutes.value = value
    createForm.session_duration_minutes = value
  } catch {
    standardSessionDurationMinutes.value = STANDARD_SESSION_DURATION_FALLBACK
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
  if (uiV2.value && !allowDiscard()) return
  if (uiV2.value && draftSnapshot.exceptionForm !== JSON.stringify(exceptionForm)) { resetExceptionForm(); markClean(['exceptionForm']) }
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
  if (uiV2.value) markClean(['exceptionEditForm'])
}

function cancelEditException() {
  if (uiV2.value && !allowDiscard()) return
  editingExceptionId.value = null
  if (uiV2.value) markClean(['exceptionEditForm'])
}

async function onCreateException() {
  if (uiV2.value && (busyV2.value || !validateV2Exception(exceptionForm))) return
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
    if (uiV2.value) markClean(['exceptionForm'])
    await loadExceptions()
    generationSuccess.value = ''
  } catch (err) {
    exceptionError.value = exceptionApiError(err, 'Не вдалося створити період недоступності.')
  } finally {
    exceptionSubmitting.value = false
  }
}

async function onUpdateException(id: number) {
  if (uiV2.value && (busyV2.value || !validateV2Exception(exceptionEditForm))) return
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
    editingExceptionId.value = null
    if (uiV2.value) markClean(['exceptionEditForm'])
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
        if (editingExceptionId.value === id) {
          if (uiV2.value) { editingExceptionId.value = null; markClean(['exceptionEditForm']) }
          else cancelEditException()
        }
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
  createForm.session_duration_minutes = standardSessionDurationMinutes.value
  createForm.buffer_minutes = 10
  createForm.is_active = true
}

async function onCreateRule() {
  if (uiV2.value && (busyV2.value || ruleClosePending.value || !validateV2Rule(createForm))) return
  loading.value = true
  error.value = ''
  try {
    const created = normalizeRule(
      await apiPost<AvailabilityRule>('/cabinet/availability-rules/', createForm)
    )
    rules.value = [...rules.value, created].sort((a, b) => a.id - b.id)
    resetCreateForm()
    if (uiV2.value) { ruleCreateOpen.value = false; markClean(['createForm']) }
    generationSuccess.value = ''
  } catch (err) {
    error.value = getApiErrorMessage(err, 'Не вдалося зберегти робочі години.')
  } finally {
    loading.value = false
  }
}

function startEdit(rule: AvailabilityRule) {
  if (uiV2.value && !allowDiscard()) return
  editingRuleId.value = rule.id
  editForm.weekday = rule.weekday
  editForm.start_time = normalizeRuleTime(rule.start_time)
  editForm.end_time = normalizeRuleTime(rule.end_time)
  editForm.session_duration_minutes = rule.session_duration_minutes
  editForm.buffer_minutes = rule.buffer_minutes
  editForm.is_active = rule.is_active
  if (uiV2.value) markClean(['editForm'])
}

function cancelEdit() {
  if (uiV2.value && !allowDiscard()) return
  editingRuleId.value = null
  if (uiV2.value) markClean(['editForm'])
}

async function onToggleRuleStatus(rule: AvailabilityRule) {
  if (loading.value || togglingRuleId.value !== null) return
  togglingRuleId.value = rule.id
  error.value = ''
  try {
    const updated = normalizeRule(
      await apiPatch<AvailabilityRule>(`/cabinet/availability-rules/${rule.id}/`, {
        is_active: !rule.is_active,
      })
    )
    rules.value = rules.value.map((item) => (item.id === rule.id ? updated : item))
    if (editingRuleId.value === rule.id) {
      editForm.is_active = updated.is_active
    }
  } catch (err) {
    error.value = getApiErrorMessage(err, 'Не вдалося змінити статус правила.')
  } finally {
    togglingRuleId.value = null
  }
}

async function onSaveRule(ruleId: number) {
  if (uiV2.value && (busyV2.value || !validateV2Rule(editForm))) return
  loading.value = true
  error.value = ''
  try {
    const updated = normalizeRule(
      await apiPatch<AvailabilityRule>(`/cabinet/availability-rules/${ruleId}/`, editForm)
    )
    rules.value = rules.value.map((rule) => (rule.id === ruleId ? updated : rule))
    editingRuleId.value = null
    if (uiV2.value) markClean(['editForm'])
    generationSuccess.value = ''
  } catch (err) {
    error.value = getApiErrorMessage(err, 'Не вдалося оновити робочі години.')
  } finally {
    loading.value = false
  }
}

async function onDeleteRule(ruleId: number) {
  confirmModal.openConfirm({
    title: 'Видалити робочі години?',
    message: 'Ці робочі години буде видалено зі звичного розкладу. Застосуйте генерацію, щоб оновити вільні вікна.',
    confirmText: 'Видалити',
    tone: 'danger',
    onConfirm: async () => {
      loading.value = true
      error.value = ''
      try {
        await apiDelete(`/cabinet/availability-rules/${ruleId}/`)
        rules.value = rules.value.filter((rule) => rule.id !== ruleId)
        if (editingRuleId.value === ruleId) {
          if (uiV2.value) { editingRuleId.value = null; markClean(['editForm']) }
          else cancelEdit()
        }
        generationSuccess.value = ''
      } catch (err) {
        error.value = getApiErrorMessage(err, 'Не вдалося видалити робочі години.')
      } finally {
        loading.value = false
      }
    },
  })
}

function formatSlotExample(startAt: string, endAt: string): string {
  const start = new Date(startAt)
  const end = new Date(endAt)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return `${startAt} - ${endAt}`
  return `${formatScheduleDateTime(start)} - ${formatScheduleTime(end)}`
}

function pad2(value: number) {
  return String(value).padStart(2, '0')
}

function formatScheduleDateTime(date: Date) {
  return `${pad2(date.getDate())}.${pad2(date.getMonth() + 1)}.${date.getFullYear()} ${formatScheduleTime(date)}`
}

function formatScheduleTime(date: Date) {
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`
}

function slotsWord(count: number): string {
  const n = Math.abs(count) % 100
  const n1 = n % 10
  if (n > 10 && n < 20) return 'вікон'
  if (n1 > 1 && n1 < 5) return 'вікна'
  if (n1 === 1) return 'вікно'
  return 'вікон'
}

function intervalsWord(count: number): string {
  const n = Math.abs(count) % 100
  const n1 = n % 10
  if (n > 10 && n < 20) return 'проміжків'
  if (n1 > 1 && n1 < 5) return 'проміжки'
  if (n1 === 1) return 'проміжок'
  return 'проміжків'
}

async function onPreviewGeneration() {
  if (uiV2.value && (busyV2.value || hasUnsavedV2.value)) return
  if (uiV2.value && (!generationPeriod.date_from || !generationPeriod.date_to || generationPeriod.date_to < generationPeriod.date_from)) { generationError.value = 'Вкажіть коректний період генерації.'; return }
  if (uiV2.value) previewResult.value = null
  if (!hasActiveRules.value) return
  generationLoading.value = true
  generationError.value = ''
  generationSuccess.value = ''
  try {
    if (uiV2.value) { previewResult.value = await previewAvailabilityGeneration({ ...generationPeriod }); return }
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
  if (uiV2.value && (busyV2.value || hasUnsavedV2.value)) return
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
  if (uiV2.value && (!previewResult.value || busyV2.value || hasUnsavedV2.value)) return
  if (uiV2.value) {
    generationLoading.value = true; generationError.value = ''; generationSuccess.value = ''
    try {
      const result = await applyAvailabilityGeneration({ ...generationPeriod })
      previewResult.value = null
      generationSuccess.value = `Створено: ${result.created_count} · Видалено: ${result.deleted_count} · Без змін: ${result.existing_count} · Конфлікти: ${result.booked_conflicts_count}.`
      try { await apiGet('/cabinet/slots/') } catch { generationError.value = 'Генерацію застосовано, але створені вікна не вдалося оновити. Перевірте їх окремо.' }
      await loadRules()
    } catch (err) { previewResult.value = null; generationError.value = getApiErrorMessage(err, 'Не вдалося застосувати генерацію. Оновіть перегляд перед повторною спробою.') }
    finally { generationLoading.value = false }
    return
  }
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
  await Promise.all([loadStandardSessionDuration(), loadRules()])
}

watch(
  () => route.name,
  async (nextName, prevName) => {
    if (nextName === prevName) return
    await loadScheduleContext()
  }
)

onMounted(async () => { window.addEventListener('beforeunload', beforeUnload); await loadScheduleContext(); initializingV2.value = false; markClean() })
</script>

<style scoped>
.pc2-schedule-editor { display:grid; gap:16px; font-family:var(--pc-font); color:var(--pc-text-main); min-width:0; }
.pc2-editor-form { width:100%; min-width:0; } .pc2-editor-form fieldset { border:0; padding:0; margin:0; display:grid; gap:14px; min-width:0; }
.pc2-editor-actions { display:flex; flex-wrap:wrap; align-items:end; gap:10px; }
.pc2-editor-form button, .pc2-generation button, .pc2-generation input { min-height:44px; padding:10px 14px; border:1px solid var(--pc-border); border-radius:12px; font:inherit; background:var(--pc-bg-card); color:var(--pc-text-main); }
.pc2-editor-form button[type="submit"], .pc2-generation > button { background:var(--pc-navy-900); color:#fff; justify-self:start; cursor:pointer; }
.pc2-generation { border-top:1px solid var(--pc-border); padding-top:20px; display:grid; gap:14px; min-width:0; }
.pc2-generation h2 { font-size:19px; font-weight:500; } .pc2-generation h3 { font-size:16px; }
.pc2-generation label { display:grid; gap:6px; min-width:0; flex:1 1 150px; } .pc2-generation input { min-width:0; width:100%; }
.pc2-generation__preview { padding:14px; background:var(--pc-bg-soft); border-radius:16px; }
.pc2-schedule-editor :focus-visible { outline:3px solid var(--pc-navy-900); outline-offset:3px; }
.pc2-schedule-editor button:disabled { opacity:.6; cursor:default; }
@media(max-width:767px) { .pc2-schedule-editor { margin-inline:-16px; } }

.availability-rules {
  display: grid;
  gap: 18px;
}

.availability-rules__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(circle at 92% 70%, color-mix(in srgb, var(--pc-peach-100) 70%, transparent) 0 120px, transparent 121px),
    linear-gradient(135deg, #ffffff 0%, color-mix(in srgb, var(--pc-primary-soft) 70%, #ffffff) 54%, color-mix(in srgb, var(--pc-yellow-soft) 45%, #ffffff) 100%);
  border: 1px solid var(--pc-border);
  border-radius: var(--pc-radius-panel);
  padding: 24px;
  box-shadow: var(--pc-shadow-soft);
}

.availability-rules__header > * {
  position: relative;
  z-index: 1;
}

.availability-rules__header::after {
  content: "";
  position: absolute;
  right: -44px;
  bottom: -58px;
  width: 180px;
  height: 180px;
  border-radius: 999px;
  background: rgba(247, 183, 126, 0.18);
  pointer-events: none;
}

.availability-rules__header .btn {
  min-height: 38px;
  padding: 6px 12px;
  border-radius: var(--pc-radius-control);
  font-weight: 700;
}

.availability-rules__header .btn--ghost {
  border-color: var(--pc-border);
  background: #fff;
  color: var(--pc-navy-900);
}


.availability-rules__title {
  margin: 8px 0 8px;
  color: var(--pc-navy-950);
  font-size: 32px;
  line-height: 1.15;
}

.availability-rules__subtitle {
  max-width: 560px;
  color: var(--pc-text-muted);
  line-height: 1.55;
}

.availability-rules__main-tabs {
  margin-top: -2px;
}

.schedule-tabs {
  display: flex;
  gap: 6px;
  overflow-x: auto;
}

.schedule-tabs__item {
  flex: 0 0 auto;
  text-decoration: none;
}

.panel {
  border: 1px solid var(--pc-border);
  border-radius: var(--pc-radius-panel);
  padding: 18px;
  background: #fff;
  box-shadow: var(--pc-shadow-soft);
  display: grid;
  gap: 14px;
}

.panel--control {
  gap: 8px;
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


.availability-rules .input {
  border: 1px solid var(--pc-border);
  border-radius: var(--pc-radius-control);
  background: #ffffff;
}

.availability-rules .btn {
  border-radius: var(--pc-radius-control);
}

.availability-rules .btn:not(.btn--ghost) {
  border-color: var(--pc-navy-900);
  background: linear-gradient(180deg, var(--pc-navy-900), var(--pc-navy-950));
  color: #ffffff;
}

.availability-rules .btn--ghost {
  border-color: var(--pc-border);
  background: #ffffff;
  color: var(--pc-navy-900);
}

.availability-rules .btn--ghost:hover,
.availability-rules .btn--ghost:focus-visible {
  border-color: color-mix(in srgb, var(--pc-navy-900) 26%, var(--pc-border));
  background: color-mix(in srgb, var(--pc-primary-soft) 58%, #ffffff);
  color: var(--pc-navy-900);
}

.rule-form {
  display: grid;
  gap: 10px;
}

.rule-form--compact {
  gap: 8px;
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

.rule-form__grid--compact {
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 8px;
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

.rules-list--compact {
  grid-template-columns: 1fr;
  gap: 8px;
}

.rule-card {
  border: 1px solid var(--pc-border);
  border-radius: var(--pc-radius-card);
  padding: 12px;
  background: #ffffff;
  box-shadow: var(--pc-shadow-soft);
  display: grid;
  gap: 8px;
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
  border: 1px solid color-mix(in srgb, var(--pc-navy-900) 22%, var(--pc-border));
  border-radius: var(--pc-radius-control);
  background: color-mix(in srgb, var(--pc-blue-soft) 78%, #ffffff);
  color: var(--pc-navy-900);
  padding: 5px 10px;
}

.rule-card__status--toggle {
  cursor: pointer;
  transition: background-color 120ms ease, border-color 120ms ease, color 120ms ease, opacity 120ms ease;
}

.rule-card__status--toggle:hover {
  background: color-mix(in srgb, var(--pc-primary-soft) 72%, #ffffff);
}

.rule-card__status--toggle:focus-visible {
  outline: none;
  border-color: color-mix(in srgb, var(--pc-navy-900) 36%, var(--pc-border));
}

.rule-card__status--toggle:disabled {
  cursor: not-allowed;
}

.rule-card__status--inactive {
  border-color: var(--pc-border);
  background: #ffffff;
  color: var(--pc-text-muted);
}

.rule-card__status--pending {
  opacity: 0.72;
}

.rule-card__actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.generation__subtitle {
  margin: 6px 0 0;
}

.generation__subtitle--quiet {
  font-size: 13px;
  opacity: 0.9;
}

.generation__actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.generation__result {
  border: 1px solid var(--pc-border);
  border-radius: var(--pc-radius-card);
  padding: 12px;
  background: #ffffff;
  display: grid;
  gap: 10px;
}

.generation__stats {
  display: grid;
  gap: 4px;
}

.generation__summary {
  display: grid;
  gap: 6px;
}

.generation__summaryItem {
  margin: 0;
}

.generation__details {
  border-top: 1px dashed var(--line);
  padding-top: 8px;
  display: grid;
  gap: 8px;
}

.generation__details summary {
  cursor: pointer;
  font-weight: 600;
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
  .availability-rules__header {
    flex-direction: column;
    align-items: flex-start;
  }

  .rule-form__grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 680px) {
  .availability-rules__header {
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

@media (min-width: 900px) {
  .rules-list--compact {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1320px) {
  .rules-list--compact {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
