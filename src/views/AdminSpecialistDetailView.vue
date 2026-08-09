<template>
  <section class="admin-specialist-detail">
    <header class="admin-specialist-detail__hero panel">
      <div>
        <div class="badge">Адмін</div>
        <h1 class="title admin-specialist-detail__title">Деталка спеціаліста</h1>
        <p class="muted admin-specialist-detail__subtitle">
          Поточний доступ, повʼязані запити та історія адміністративних змін.
        </p>
      </div>
      <div class="admin-specialist-detail__hero-actions">
        <RouterLink class="btn btn--ghost" to="/admin/inbox">До адмін-запитів</RouterLink>
        <RouterLink class="btn btn--ghost" to="/admin/billing-access-requests">До запитів на тариф</RouterLink>
        <RouterLink class="btn btn--ghost" to="/admin/specialists">До списку спеціалістів</RouterLink>
      </div>
    </header>

    <div v-if="loading" class="muted">Завантаження деталки спеціаліста…</div>
    <div v-else-if="error" class="form-error">{{ error }}</div>

    <template v-else-if="detail">
      <section class="panel">
        <div class="panel__header">
          <div>
            <div class="badge badge--soft">ПІДСУМОК</div>
            <h2 class="panel__title">
              {{ detail.identity.public_display_name || detail.identity.display_name || detail.identity.username }}
            </h2>
          </div>
        <div class="summary-actions">
            <button class="btn btn--sm" type="button" @click="openPlanModal">Змінити базовий тариф</button>
            <div class="access-action access-action--primary">
              <button class="btn btn--ghost btn--sm" type="button" @click="openTrialModal">
                Керувати тестовим доступом
              </button>
              <p class="muted access-action__hint">
                Тестовий доступ — тимчасовий Pro-доступ для beta, демо або перевірки.
              </p>
            </div>
            <div class="access-action access-action--service">
              <button class="btn btn--ghost btn--sm" type="button" @click="openOverrideModal">
                Службове перевизначення
              </button>
              <p class="muted access-action__hint">
                Ручна службова дія для виняткових випадків, поза звичайним тестовим сценарієм.
              </p>
            </div>
          </div>
        </div>

        <div class="summary-grid">
          <div><span class="muted">ID:</span> {{ detail.identity.id }}</div>
          <div>
            <span class="muted">Публічне ім’я:</span>
            {{ detail.identity.public_display_name || '—' }}
          </div>
          <div><span class="muted">Логін:</span> @{{ detail.identity.username }}</div>
          <div><span class="muted">Email:</span> {{ detail.identity.email || '—' }}</div>
          <div><span class="muted">Слаг профілю:</span> {{ detail.identity.slug || '—' }}</div>
          <div>
            <span class="muted">Публічний профіль:</span>
            {{ detail.identity.public_profile_enabled ? 'Увімкнено' : 'Вимкнено' }}
          </div>
          <div><span class="muted">Створено:</span> {{ formatDate(detail.identity.created_at) }}</div>
        </div>
      </section>

      <section class="crm-grid">
        <article class="panel crm-panel crm-panel--readiness">
          <div class="panel__header">
            <div>
              <div class="badge badge--soft">CRM</div>
              <h2 class="panel__title">Готовність профілю</h2>
              <p class="muted readiness-panel__helper">{{ readinessSummaryText }}</p>
            </div>
            <span class="status-pill" :class="readinessOverallClass">
              {{ readinessBadgeText }}
            </span>
          </div>

          <div v-if="readinessUnavailable" class="muted">Дані про готовність недоступні</div>
          <template v-else>
            <div class="readiness-list">
              <div
                v-for="check in readinessChecks"
                :key="check.key"
                class="readiness-row"
              >
                <span class="readiness-row__label">{{ check.label }}</span>
                <span class="status-pill" :class="check.pass ? 'status-pill--ok' : 'status-pill--muted'">
                  {{ check.pass ? 'Готово' : 'Потрібно доповнити' }}
                </span>
              </div>
            </div>

            <p v-if="readinessMissingSummary" class="muted readiness-panel__missing">
              Не вистачає: {{ readinessMissingSummary }}
            </p>
          </template>
        </article>

        <article class="panel crm-panel">
          <div class="panel__header">
            <div>
              <div class="badge badge--soft">CRM</div>
              <h2 class="panel__title">Публікація та пошук</h2>
              <p class="muted readiness-panel__helper">{{ visibilityText }}</p>
            </div>
            <span class="status-pill" :class="visibilityStatusClass">
              {{ visibilityBadgeText }}
            </span>
          </div>

          <div v-if="visibilityUnavailable" class="muted">Дані про публікацію недоступні</div>
          <template v-else>
            <a
              v-if="publicProfileUrl"
              class="btn btn--ghost btn--sm public-profile-action"
              :href="publicProfileUrl"
              target="_blank"
              rel="noopener noreferrer"
            >
              Відкрити публічний профіль
            </a>
            <p v-else-if="publicProfileUnavailableText" class="muted readiness-panel__missing">
              {{ publicProfileUnavailableText }}
            </p>
          </template>
        </article>

        <article class="panel crm-panel">
          <div class="panel__header">
            <div>
              <div class="badge badge--soft">CRM</div>
              <h2 class="panel__title">Запис і запити</h2>
              <p class="muted readiness-panel__helper">{{ clientEntryText }}</p>
            </div>
            <span class="status-pill" :class="clientEntryStatusClass">
              {{ clientEntryBadgeText }}
            </span>
          </div>
          <div v-if="clientEntryUnavailable" class="muted">Дані про спосіб звернення недоступні</div>
        </article>

        <article class="panel crm-panel">
          <div class="panel__header">
            <div>
              <div class="badge badge--soft">CRM</div>
              <h2 class="panel__title">Онбординг</h2>
            </div>
          </div>

          <div v-if="onboardingUnavailable" class="muted">Дані про онбординг недоступні</div>
          <div v-else class="onboarding-grid">
            <section class="onboarding-card" aria-label="Перший лист спеціалісту">
              <div class="onboarding-card__header">
                <h3>Перший лист спеціалісту</h3>
                <span class="status-pill" :class="templateA.sent ? 'status-pill--ok' : 'status-pill--muted'">
                  {{ templateA.sent ? 'Надіслано' : 'Не зафіксовано' }}
                </span>
              </div>
              <p>
                {{
                  templateA.sent
                    ? 'Автоматичний лист після реєстрації надіслано.'
                    : 'Надсилання першого листа не зафіксовано.'
                }}
              </p>
              <div class="muted">Надіслано: {{ templateA.sentAtText }}</div>
            </section>

            <section class="onboarding-card" aria-label="Другий лист спеціалісту">
              <div class="onboarding-card__header">
                <h3>Другий лист спеціалісту</h3>
                <span class="status-pill" :class="templateB.sent ? 'status-pill--ok' : 'status-pill--muted'">
                  {{ templateB.sent ? 'Надіслано' : 'Не зафіксовано' }}
                </span>
              </div>
              <template v-if="templateB.sent">
                <p>{{ templateB.displayLabel }}</p>
                <div class="muted">Надіслано: {{ templateB.sentAtText }}</div>
                <div v-if="templateB.variant" class="muted">
                  Код варіанта: {{ templateB.variant }}
                </div>
              </template>
              <template v-else>
                <p>Надсилання другого листа ще не зафіксовано.</p>
                <div class="muted">Надіслано: —</div>
              </template>
            </section>
          </div>
        </article>
      </section>

      <section class="panel">
        <div class="panel__header">
          <div>
            <div class="badge badge--soft">ЧЕРГА РОБОТИ</div>
            <h2 class="panel__title">Операційний стан</h2>
          </div>
          <RouterLink
            v-if="detail.admin_context.work_queue_summary.has_active_items"
            class="btn btn--ghost btn--sm"
            :to="`/admin/work-queue?status=active&specialist_id=${detail.identity.id}`"
          >
            Відкрити активні елементи
          </RouterLink>
        </div>

        <div class="operational-counts">
          <div><span class="muted">Відкриті:</span> {{ detail.admin_context.work_queue_summary.open_count }}</div>
          <div><span class="muted">В роботі:</span> {{ detail.admin_context.work_queue_summary.in_progress_count }}</div>
          <div><span class="muted">Вирішені:</span> {{ detail.admin_context.work_queue_summary.resolved_count }}</div>
          <div><span class="muted">Ігноровані:</span> {{ detail.admin_context.work_queue_summary.ignored_count }}</div>
        </div>

        <div
          v-if="!detail.admin_context.work_queue_summary.has_active_items"
          class="operational-clean"
        >
          Активних операційних проблем немає.
        </div>

        <div
          v-if="detail.admin_context.work_queue_summary.latest_item"
          class="operational-latest"
        >
          <strong>Останній повʼязаний елемент</strong>
          <div>
            <span class="muted">Тип:</span>
            {{ operationalTypeLabel(detail.admin_context.work_queue_summary.latest_item.item_type) }}
          </div>
          <div>
            <span class="muted">Статус:</span>
            <span
              class="status-pill"
              :class="operationalStatusClass(detail.admin_context.work_queue_summary.latest_item.status)"
            >
              {{ operationalStatusLabel(detail.admin_context.work_queue_summary.latest_item.status) }}
            </span>
          </div>
          <div>
            <span class="muted">Оновлено:</span>
            {{ formatDate(detail.admin_context.work_queue_summary.latest_item.status_changed_at) }}
          </div>
          <div>
            <span class="muted">Хто змінив:</span>
            {{ detail.admin_context.work_queue_summary.latest_item.status_changed_by?.username || 'SYSTEM' }}
          </div>
          <div>
            <span class="muted">Причина / примітка:</span>
            {{ detail.admin_context.work_queue_summary.latest_item.resolution_note || '—' }}
          </div>
          <RouterLink
            class="btn btn--ghost btn--sm"
            :to="workQueueItemRoute(detail.admin_context.work_queue_summary.latest_item.item_key)"
          >
            Відкрити в черзі
          </RouterLink>
        </div>
      </section>

      <section class="panel">
        <div class="panel__header">
          <div>
            <div class="badge badge--soft">ПОТОЧНИЙ ДОСТУП</div>
            <h2 class="panel__title">Стан доступу</h2>
          </div>
        </div>

        <div class="access-grid">
          <div>
            <div class="muted">Базовий тариф</div>
            <strong>{{ detail.tariff_access.base_plan }}</strong>
          </div>
          <div>
            <div class="muted">Фактичний тариф</div>
            <strong>{{ detail.tariff_access.effective_plan }}</strong>
          </div>
          <div>
            <div class="muted">Статус тестового доступу</div>
            <span :class="pillClass(detail.tariff_access.trial.active)">
              {{ detail.tariff_access.trial.active ? 'Тестовий доступ активний' : 'Тестовий доступ неактивний' }}
            </span>
            <div v-if="detail.tariff_access.trial.active" class="muted">
              {{ detail.tariff_access.trial.trial_plan || '—' }} ·
              {{ formatDate(detail.tariff_access.trial.starts_at) }} → {{ formatDate(detail.tariff_access.trial.ends_at) }}
              <template v-if="detail.tariff_access.trial.source">
                · <span data-testid="trial-source">{{ trialSourceLabel(detail.tariff_access.trial.source) }}</span>
              </template>
            </div>
          </div>
          <div>
            <div class="muted">Статус службового перевизначення</div>
            <span :class="pillClass(detail.tariff_access.override.active)">
              {{
                detail.tariff_access.override.active
                  ? 'Службове перевизначення активне'
                  : 'Службове перевизначення неактивне'
              }}
            </span>
            <div v-if="detail.tariff_access.override.active" class="muted">
              {{ detail.tariff_access.override.override_plan || '—' }} ·
              {{ formatDate(detail.tariff_access.override.starts_at) }} → {{ formatDate(detail.tariff_access.override.ends_at) }}
            </div>
          </div>
        </div>

        <div class="summary-list">
          <div><strong>Базовий тариф:</strong> {{ planLabel(detail.tariff_access.base_plan) }}</div>
          <div><strong>Фактичний тариф:</strong> {{ planLabel(detail.tariff_access.effective_plan) }}</div>
          <div>
            <strong>Тестовий доступ:</strong>
            <template v-if="detail.tariff_access.trial.active">
              {{ planLabel(detail.tariff_access.trial.trial_plan || '—') }} до {{ formatDate(detail.tariff_access.trial.ends_at) }}
              <template v-if="detail.tariff_access.trial.source">
                (<span data-testid="trial-source-summary">{{ trialSourceLabel(detail.tariff_access.trial.source) }}</span>)
              </template>
            </template>
            <template v-else>немає</template>
          </div>
          <div>
            <strong>Службове перевизначення:</strong>
            <template v-if="detail.tariff_access.override.active">
              {{ planLabel(detail.tariff_access.override.override_plan || '—') }}
              <template v-if="detail.tariff_access.override.ends_at">
                до {{ formatDate(detail.tariff_access.override.ends_at) }}
              </template>
            </template>
            <template v-else>немає</template>
          </div>
          <div><strong>Фактичний доступ зараз:</strong> {{ planLabel(detail.tariff_access.effective_plan) }}</div>
        </div>

        <div
          v-if="detail.tariff_access.override.active && detail.tariff_access.base_plan !== detail.tariff_access.effective_plan"
          class="access-warning"
        >
          Службове перевизначення перекриває базовий тариф.
        </div>
      </section>

      <section class="panel">
        <div class="panel__header">
          <div>
            <div class="badge badge--soft">ПОВ’ЯЗАНІ ЗАПИТИ</div>
            <h2 class="panel__title">Зведення відкритих запитів</h2>
          </div>
        </div>
        <div class="requests-grid">
          <div>
            <span class="muted">Відкриті billing/admin запити:</span>
            {{ detail.admin_context.open_billing_admin_requests_count }}
          </div>
          <div>
            <span class="muted">Відкриті елементи inbox:</span>
            {{ detail.admin_context.open_admin_inbox_items_count ?? 0 }}
          </div>
          <div v-if="detail.admin_context.latest_related_request_summary" class="request-highlight">
            <div>
              <strong>Останній запит:</strong>
              #{{ detail.admin_context.latest_related_request_summary.id }}
              · {{ detail.admin_context.latest_related_request_summary.status }}
              · запитано {{ detail.admin_context.latest_related_request_summary.requested_plan || '—' }}
            </div>
            <RouterLink
              class="btn btn--ghost btn--sm"
              :to="`/admin/billing-access-requests/${detail.admin_context.latest_related_request_summary.id}`"
            >
              Відкрити запит
            </RouterLink>
          </div>
          <div v-else class="muted">Немає відкритих запитів</div>
        </div>
      </section>

      <section class="panel">
        <div class="panel__header">
          <div>
            <div class="badge badge--soft">ІСТОРІЯ ЗМІН ДОСТУПУ</div>
            <h2 class="panel__title">Історія змін доступу</h2>
          </div>
        </div>
        <div v-if="historyLoading" class="muted">Завантаження історії…</div>
        <div v-else-if="historyError" class="form-error">{{ historyError }}</div>
        <div v-else-if="history.length === 0" class="muted">Історія змін поки порожня.</div>
        <div v-else class="history-list">
          <article v-for="item in history" :key="item.id" class="history-item">
            <div class="history-item__head">
              <strong>{{ eventLabel(item.event_type) }}</strong>
            </div>
            <div><span class="muted">Опис зміни:</span> {{ beforeAfterSummary(item) }}</div>
            <div><span class="muted">Створено:</span> {{ formatDate(item.created_at) }}</div>
            <div><span class="muted">Хто змінив:</span> {{ item.actor_username || 'SYSTEM' }}</div>
            <div><span class="muted">Причина:</span> {{ item.reason || '—' }}</div>
          </article>
        </div>
      </section>
    </template>

    <div v-if="planModalOpen" class="setting-modal" @keydown.esc="closePlanModal">
      <div class="setting-modal__backdrop" @click="closePlanModal"></div>
      <section class="setting-modal__content panel" role="dialog" aria-modal="true" aria-label="Змінити базовий тариф">
        <div class="panel__header">
          <div>
            <div class="badge badge--soft">Адмін-дія</div>
            <h3 class="panel__title">Змінити базовий тариф</h3>
          </div>
          <button class="btn btn--ghost btn--sm" type="button" @click="closePlanModal">Закрити</button>
        </div>

        <label class="field">
          <span>Тариф</span>
          <select v-model="planForm.plan" class="input input--select">
            <option value="START">START</option>
            <option value="PRO">PRO</option>
            <option value="LEADER">LEADER</option>
          </select>
        </label>

        <label class="field">
          <span>Причина</span>
          <textarea v-model="planForm.reason" class="input input--textarea" rows="4" placeholder="Причина є обов’язковою" />
        </label>

        <div v-if="planFormError" class="form-error">{{ planFormError }}</div>

        <div class="setting-modal__footer">
          <button class="btn" type="button" :disabled="planSaving" @click="submitPlanAction">
            {{ planSaving ? 'Зберігаємо…' : 'Застосувати' }}
          </button>
          <button class="btn btn--ghost" type="button" :disabled="planSaving" @click="closePlanModal">Скасувати</button>
        </div>
      </section>
    </div>

    <div v-if="trialModalOpen" class="setting-modal" @keydown.esc="closeTrialModal">
      <div class="setting-modal__backdrop" @click="closeTrialModal"></div>
      <section class="setting-modal__content panel" role="dialog" aria-modal="true" aria-label="Керувати тестовим доступом">
        <div class="panel__header">
          <div>
            <div class="badge badge--soft">ТЕСТОВИЙ ДОСТУП</div>
            <h3 class="panel__title">Керувати тестовим доступом</h3>
            <p class="muted modal-helper">
              Тестовий доступ — тимчасовий Pro-доступ для beta, демо або перевірки.
            </p>
          </div>
          <button class="btn btn--ghost btn--sm" type="button" @click="closeTrialModal">Закрити</button>
        </div>

        <label class="field">
          <span>Дія</span>
          <select v-model="trialForm.action" class="input input--select">
            <option value="START">Запустити тестовий доступ</option>
            <option value="END">Завершити тестовий доступ</option>
          </select>
        </label>

        <template v-if="trialForm.action === 'START'">
          <label class="field">
            <span>Тариф тестового доступу</span>
            <select v-model="trialForm.trial_plan" class="input input--select">
              <option value="PRO">PRO</option>
              <option value="LEADER">LEADER</option>
            </select>
          </label>
          <div class="field">
            <span>Початок дії</span>
            <div class="date-time-grid">
              <label class="field field--compact">
                <span>Дата початку</span>
                <input
                  v-model="trialForm.starts_date"
                  type="text"
                  inputmode="numeric"
                  class="input"
                  placeholder="ДД.ММ.РРРР"
                />
              </label>
              <label class="field field--compact">
                <span>Час початку</span>
                <input v-model="trialForm.starts_time" type="text" inputmode="numeric" class="input" placeholder="HH:mm" />
              </label>
            </div>
          </div>
          <div class="field">
            <span>Завершення дії</span>
            <div class="date-time-grid">
              <label class="field field--compact">
                <span>Дата завершення</span>
                <input
                  v-model="trialForm.ends_date"
                  type="text"
                  inputmode="numeric"
                  class="input"
                  placeholder="ДД.ММ.РРРР"
                />
              </label>
              <label class="field field--compact">
                <span>Час завершення</span>
                <input v-model="trialForm.ends_time" type="text" inputmode="numeric" class="input" placeholder="HH:mm" />
              </label>
            </div>
          </div>
        </template>

        <label class="field">
          <span>Причина</span>
          <textarea v-model="trialForm.reason" class="input input--textarea" rows="4" placeholder="Причина є обов’язковою" />
        </label>

        <div v-if="trialFormError" class="form-error">{{ trialFormError }}</div>

        <div class="setting-modal__footer">
          <button class="btn" type="button" :disabled="trialSaving" @click="submitTrialAction">
            {{ trialSaving ? 'Зберігаємо…' : 'Застосувати' }}
          </button>
          <button class="btn btn--ghost" type="button" :disabled="trialSaving" @click="closeTrialModal">Скасувати</button>
        </div>
      </section>
    </div>

    <div v-if="overrideModalOpen" class="setting-modal" @keydown.esc="closeOverrideModal">
      <div class="setting-modal__backdrop" @click="closeOverrideModal"></div>
      <section class="setting-modal__content panel" role="dialog" aria-modal="true" aria-label="Службове перевизначення доступу">
        <div class="panel__header">
          <div>
            <div class="badge badge--soft">СЛУЖБОВА ДІЯ</div>
            <h3 class="panel__title">Службове перевизначення доступу</h3>
            <p class="muted modal-helper">
              Це ручна адмінська дія, яка примусово змінює фактичний доступ незалежно від тарифу, оплати чи
              тестового доступу. Використовуйте лише для виняткових випадків.
            </p>
          </div>
          <button class="btn btn--ghost btn--sm" type="button" @click="closeOverrideModal">Закрити</button>
        </div>

        <label class="field">
          <span>Дія</span>
          <select v-model="overrideForm.action" class="input input--select">
            <option value="ENABLE">Увімкнути службове перевизначення</option>
            <option value="UPDATE">Оновити службове перевизначення</option>
            <option value="DISABLE">Вимкнути службове перевизначення</option>
          </select>
        </label>

        <template v-if="overrideForm.action !== 'DISABLE'">
          <label class="field">
            <span>Тариф</span>
            <select v-model="overrideForm.forced_plan" class="input input--select">
              <option value="START">START</option>
              <option value="PRO">PRO</option>
              <option value="LEADER">LEADER</option>
            </select>
          </label>
          <div class="field">
            <span>Початок дії (необов’язково)</span>
            <div class="date-time-grid">
              <label class="field field--compact">
                <span>Дата початку</span>
                <input
                  v-model="overrideForm.starts_date"
                  type="text"
                  inputmode="numeric"
                  class="input"
                  placeholder="ДД.ММ.РРРР"
                />
              </label>
              <label class="field field--compact">
                <span>Час початку</span>
                <input v-model="overrideForm.starts_time" type="text" inputmode="numeric" class="input" placeholder="HH:mm" />
              </label>
            </div>
          </div>
          <div class="field">
            <span>Завершення дії (необов’язково)</span>
            <div class="date-time-grid">
              <label class="field field--compact">
                <span>Дата завершення</span>
                <input
                  v-model="overrideForm.expires_date"
                  type="text"
                  inputmode="numeric"
                  class="input"
                  placeholder="ДД.ММ.РРРР"
                />
              </label>
              <label class="field field--compact">
                <span>Час завершення</span>
                <input v-model="overrideForm.expires_time" type="text" inputmode="numeric" class="input" placeholder="HH:mm" />
              </label>
            </div>
          </div>
        </template>

        <label class="field">
          <span>Причина</span>
          <textarea
            v-model="overrideForm.reason"
            class="input input--textarea"
            rows="4"
            placeholder="Причина є обов’язковою"
          />
        </label>

        <div v-if="overrideFormError" class="form-error">{{ overrideFormError }}</div>

        <div class="setting-modal__footer">
          <button class="btn" type="button" :disabled="overrideSaving" @click="submitOverrideAction">
            {{ overrideSaving ? 'Зберігаємо…' : 'Застосувати' }}
          </button>
          <button class="btn btn--ghost" type="button" :disabled="overrideSaving" @click="closeOverrideModal">
            Скасувати
          </button>
        </div>
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useToast } from '../composables/useToast'
import {
  applyAdminSpecialistOverrideAction,
  applyAdminSpecialistPlanAction,
  applyAdminSpecialistTrialAction,
  fetchAdminSpecialistAccessHistory,
  fetchAdminSpecialistDetail,
  getApiErrorMessage,
  type AdminCrmReadinessItem,
  type AdminSpecialistAccessHistoryItem,
  type AdminSpecialistDetailResponse,
} from '../lib/api'
import { formatUkDateTimeCompact } from '../lib/dateTime'

type TrialAction = 'START' | 'END'
type OverrideAction = 'ENABLE' | 'UPDATE' | 'DISABLE'
type DateTimeParts = { date: string; time: string }
type DateTimeParseResult = { iso: string | null; error: string }
type ReadinessCheck = { key: string; label: string; missingLabel: string; pass: boolean }

const dateFormatError = 'Вкажіть дату у форматі ДД.ММ.РРРР.'
const timeFormatError = 'Вкажіть час у форматі HH:mm.'

const route = useRoute()
const toast = useToast()

const loading = ref(false)
const error = ref('')
const detail = ref<AdminSpecialistDetailResponse | null>(null)

const historyLoading = ref(false)
const historyError = ref('')
const history = ref<AdminSpecialistAccessHistoryItem[]>([])

const planModalOpen = ref(false)
const planSaving = ref(false)
const planFormError = ref('')
const planForm = ref<{ plan: 'START' | 'PRO' | 'LEADER'; reason: string }>({ plan: 'START', reason: '' })

const trialModalOpen = ref(false)
const trialSaving = ref(false)
const trialFormError = ref('')
const trialForm = ref<{
  action: TrialAction
  trial_plan: 'PRO' | 'LEADER'
  starts_date: string
  starts_time: string
  ends_date: string
  ends_time: string
  reason: string
}>({
  action: 'START',
  trial_plan: 'PRO',
  starts_date: '',
  starts_time: '',
  ends_date: '',
  ends_time: '',
  reason: '',
})

const overrideModalOpen = ref(false)
const overrideSaving = ref(false)
const overrideFormError = ref('')
const overrideForm = ref<{
  action: OverrideAction
  forced_plan: 'START' | 'PRO' | 'LEADER'
  starts_date: string
  starts_time: string
  expires_date: string
  expires_time: string
  reason: string
}>({
  action: 'ENABLE',
  forced_plan: 'PRO',
  starts_date: '',
  starts_time: '',
  expires_date: '',
  expires_time: '',
  reason: '',
})

const specialistId = computed(() => Number(route.params.id))
const publicProfileSlug = computed(() =>
  String(detail.value?.identity.slug || detail.value?.identity.public_slug || '').trim()
)
const adminCrmState = computed(() => detail.value?.admin_crm_state || null)
const crmReadiness = computed(() => adminCrmState.value?.readiness || null)
const crmVisibility = computed(() => adminCrmState.value?.visibility || null)
const crmClientEntry = computed(() => adminCrmState.value?.client_entry || null)
const crmOnboarding = computed(() => adminCrmState.value?.onboarding || null)
const normalizedVisibilityState = computed(() =>
  String(crmVisibility.value?.state || '').trim()
)
const publicProfileUrl = computed(() => {
  if (crmVisibility.value) {
    const state = normalizedVisibilityState.value
    const path = String(crmVisibility.value.public_profile_path || '').trim()
    if ((state === 'direct_link_only' || state === 'search_visible') && path) return path
    return ''
  }
  if (!detail.value?.identity.public_profile_enabled || !publicProfileSlug.value) return ''
  return `/s/${encodeURIComponent(publicProfileSlug.value)}`
})
const publicProfileUnavailableText = computed(() => {
  if (crmVisibility.value) {
    const state = normalizedVisibilityState.value
    if ((state === 'direct_link_only' || state === 'search_visible') && !publicProfileUrl.value) {
      return 'Публічне посилання ще не сформоване.'
    }
    return ''
  }
  if (!detail.value?.identity.public_profile_enabled) return ''
  if (!publicProfileSlug.value) return 'Публічне посилання ще не сформоване.'
  return ''
})
const profileReadiness = computed(() => {
  const readiness = detail.value?.profile_readiness
  if (readiness) return readiness
  const publicProfileEnabled = Boolean(detail.value?.identity.public_profile_enabled)
  const publicDisplayNameExists = Boolean(
    String(
      detail.value?.identity.public_display_name ||
        detail.value?.identity.display_name ||
        detail.value?.identity.username ||
        ''
    ).trim()
  )
  const profileSlugExists = Boolean(publicProfileSlug.value)
  return {
    public_profile_enabled: publicProfileEnabled,
    public_display_name_exists: publicDisplayNameExists,
    profile_slug_exists: profileSlugExists,
    basic_description_exists: false,
    standard_price_configured: false,
    client_entry_path_exists: publicProfileEnabled,
    public_profile_link_available: publicProfileEnabled && profileSlugExists,
    missing_items: [],
  }
})
const minimumPublicProfileReadiness = computed(
  () => profileReadiness.value.minimum_public_profile_readiness || null
)
const readinessChecks = computed<ReadinessCheck[]>(() => {
  if (adminCrmState.value && !crmReadiness.value) return []

  const crmItems = crmReadiness.value?.items
  if (crmItems?.length) {
    return crmItems.map((item: AdminCrmReadinessItem) => ({
      key: item.key,
      label: item.label,
      missingLabel: item.label,
      pass: Boolean(item.complete),
    }))
  }

  const minimumReadiness = minimumPublicProfileReadiness.value
  if (minimumReadiness?.items?.length) {
    return minimumReadiness.items.map((item) => ({
      key: item.key,
      label: item.label,
      missingLabel: item.label,
      pass: Boolean(item.complete),
    }))
  }

  if (!detail.value?.profile_readiness && !detail.value?.identity) return []
  return [
    {
      key: 'public_display_name_exists',
      label: 'Публічне ім’я заповнене',
      missingLabel: 'публічне ім’я',
      pass: Boolean(profileReadiness.value.public_display_name_exists),
    },
    {
      key: 'profile_slug_exists',
      label: 'Слаг профілю налаштовано',
      missingLabel: 'слаг профілю',
      pass: Boolean(profileReadiness.value.profile_slug_exists),
    },
    {
      key: 'basic_description_exists',
      label: 'Опис профілю заповнений',
      missingLabel: 'опис профілю',
      pass: Boolean(profileReadiness.value.basic_description_exists),
    },
    {
      key: 'standard_price_configured',
      label: 'Базова ціна налаштована',
      missingLabel: 'базову ціну',
      pass: Boolean(profileReadiness.value.standard_price_configured),
    },
    {
      key: 'client_entry_path_exists',
      label: 'Є шлях для першого звернення',
      missingLabel: 'доступність для звернень',
      pass: Boolean(profileReadiness.value.client_entry_path_exists),
    },
    {
      key: 'public_profile_link_available',
      label: 'Публічне посилання доступне',
      missingLabel: 'публічне посилання',
      pass: Boolean(profileReadiness.value.public_profile_link_available),
    },
  ]
})
const readinessFailedChecks = computed(() => readinessChecks.value.filter((check) => !check.pass))
const readinessMissingSummary = computed(() =>
  readinessFailedChecks.value.map((check) => check.missingLabel).join(', ')
)
const readinessUnavailable = computed(() => readinessChecks.value.length === 0)
const readinessCompletedCount = computed(() => {
  if (crmReadiness.value?.completed_count != null) return Number(crmReadiness.value.completed_count)
  if (minimumPublicProfileReadiness.value?.completed_count != null) {
    return Number(minimumPublicProfileReadiness.value.completed_count)
  }
  return readinessChecks.value.filter((check) => check.pass).length
})
const readinessTotalCount = computed(() => {
  if (crmReadiness.value?.total_count != null) return Number(crmReadiness.value.total_count)
  if (minimumPublicProfileReadiness.value?.total_count != null) {
    return Number(minimumPublicProfileReadiness.value.total_count)
  }
  return readinessChecks.value.length
})
const readinessIsReady = computed(() => {
  if (crmReadiness.value?.is_ready != null) return Boolean(crmReadiness.value.is_ready)
  if (minimumPublicProfileReadiness.value?.is_ready != null) {
    return Boolean(minimumPublicProfileReadiness.value.is_ready)
  }
  return readinessChecks.value.length > 0 && readinessFailedChecks.value.length === 0
})
const readinessSummaryText = computed(() => {
  if (readinessUnavailable.value) return 'Дані про готовність недоступні'
  if (readinessIsReady.value) return 'Усі обов’язкові дані заповнені'
  return `Заповнено ${readinessCompletedCount.value} з ${readinessTotalCount.value}`
})
const readinessBadgeText = computed(() => {
  if (readinessUnavailable.value) return '—'
  return `${readinessCompletedCount.value} з ${readinessTotalCount.value}`
})
const readinessOverallClass = computed(() => {
  if (readinessUnavailable.value) return 'status-pill--muted'
  if (readinessIsReady.value) return 'status-pill--ok'
  return 'status-pill--warn'
})
const visibilityUnavailable = computed(() => Boolean(adminCrmState.value && !crmVisibility.value))
const visibilityBadgeText = computed(() => {
  if (visibilityUnavailable.value) return '—'
  const state = normalizedVisibilityState.value
  if (state === 'unpublished') return 'Не опубліковано'
  if (state === 'direct_link_only') return 'Доступно за посиланням'
  if (state === 'search_visible') return 'Показується в пошуку'
  if (state === 'invalid') return 'Некоректний службовий стан'
  if (!crmVisibility.value && detail.value?.identity.public_profile_enabled) return 'Доступно за посиланням'
  if (!crmVisibility.value && detail.value) return 'Не опубліковано'
  return '—'
})
const visibilityText = computed(() => {
  if (visibilityUnavailable.value) return 'Дані про публікацію недоступні'
  const state = normalizedVisibilityState.value
  if (state === 'unpublished') return 'Сторінка ще недоступна клієнтам.'
  if (state === 'direct_link_only') return 'Сторінка опублікована, але не показується в пошуку Pro Consult.'
  if (state === 'search_visible') return 'Сторінка опублікована й доступна в пошуку Pro Consult.'
  if (state === 'invalid') {
    return 'Показ у пошуку увімкнено для неопублікованої сторінки. Потрібна службова перевірка.'
  }
  if (!crmVisibility.value && detail.value?.identity.public_profile_enabled) {
    return 'Сторінка опублікована. Дані про показ у пошуку недоступні.'
  }
  if (!crmVisibility.value && detail.value) return 'Сторінка ще недоступна клієнтам.'
  return 'Дані про публікацію недоступні'
})
const visibilityStatusClass = computed(() => {
  if (visibilityUnavailable.value) return 'status-pill--muted'
  const state = normalizedVisibilityState.value
  if (state === 'search_visible' || state === 'direct_link_only') return 'status-pill--ok'
  if (state === 'invalid') return 'status-pill--warn'
  return 'status-pill--muted'
})
const clientEntryMode = computed(() => String(crmClientEntry.value?.mode || '').trim())
const clientEntryUnavailable = computed(() => !crmClientEntry.value)
const clientEntryBadgeText = computed(() => {
  const mode = clientEntryMode.value
  if (mode === 'request_only') return 'Запит без вибору часу'
  if (mode === 'direct_booking') return 'Запис на доступне вікно'
  if (mode === 'unknown') return 'Не налаштовано'
  return 'Не налаштовано'
})
const clientEntryText = computed(() => {
  const mode = clientEntryMode.value
  if (mode === 'request_only') {
    return 'Клієнти можуть залишати запит, а спеціаліст сам узгоджує час. Вікна для запису не обов’язкові.'
  }
  if (mode === 'direct_booking') {
    if (crmClientEntry.value?.windows_attention_required) {
      return 'Прямий запис увімкнено, але майбутніх доступних вікон немає.'
    }
    if (crmClientEntry.value?.show_public_availability === false) {
      return 'Прямий запис обрано, але показ доступних вікон у публічному профілі вимкнено.'
    }
    if (crmClientEntry.value?.has_future_available_windows) {
      return 'Клієнти можуть обирати доступний час. Майбутні вікна для запису є.'
    }
    return 'Запис на доступне вікно налаштовано.'
  }
  if (mode === 'unknown') return 'Спосіб звернення клієнтів ще не визначено.'
  return 'Дані про спосіб звернення недоступні'
})
const clientEntryStatusClass = computed(() => {
  if (clientEntryUnavailable.value) return 'status-pill--muted'
  if (crmClientEntry.value?.windows_attention_required) return 'status-pill--warn'
  if (clientEntryMode.value === 'request_only' || clientEntryMode.value === 'direct_booking') return 'status-pill--ok'
  return 'status-pill--muted'
})
const legacyTemplateA = computed(() => detail.value?.admin_context.signup_template_a_email || null)
const legacyTemplateB = computed(() => detail.value?.admin_context.signup_template_b_email || null)
const templateA = computed(() => {
  const crmTemplate = crmOnboarding.value?.template_a
  const sent = Boolean(crmTemplate ? crmTemplate.sent : legacyTemplateA.value?.sent)
  const sentAt = crmTemplate ? crmTemplate.sent_at || null : legacyTemplateA.value?.sent_at || null
  return {
    sent,
    sentAt,
    sentAtText: formatDate(sentAt),
  }
})
const templateB = computed(() => {
  const crmTemplate = crmOnboarding.value?.template_b
  const sent = Boolean(crmTemplate ? crmTemplate.sent : legacyTemplateB.value?.sent)
  const sentAt = crmTemplate ? crmTemplate.sent_at || null : legacyTemplateB.value?.sent_at || null
  const variant = String((crmTemplate ? crmTemplate.variant : legacyTemplateB.value?.variant) || '').trim()
  const variantLabel = String(crmTemplate?.variant_label || '').trim()
  return {
    sent,
    sentAt,
    sentAtText: formatDate(sentAt),
    variant,
    displayLabel: variantLabel || (variant ? `Зафіксовано варіант: ${variant}` : 'Другий лист спеціалісту надіслано.'),
  }
})
const onboardingUnavailable = computed(
  () =>
    Boolean(adminCrmState.value && !crmOnboarding.value) ||
    (!adminCrmState.value && !legacyTemplateA.value && !legacyTemplateB.value)
)

function formatDate(value: string | null | undefined) {
  return formatUkDateTimeCompact(value)
}

function padDatePart(num: number) {
  return String(num).padStart(2, '0')
}

function toDisplayDateTimeParts(value?: string | null): DateTimeParts {
  if (!value) return { date: '', time: '' }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return { date: '', time: '' }
  return {
    date: `${padDatePart(date.getDate())}.${padDatePart(date.getMonth() + 1)}.${date.getFullYear()}`,
    time: `${padDatePart(date.getHours())}:${padDatePart(date.getMinutes())}`,
  }
}

function parseDisplayDateTime(dateValue: string, timeValue: string, required: boolean): DateTimeParseResult {
  const dateText = dateValue.trim()
  const timeText = timeValue.trim()

  if (!dateText && !timeText) {
    return required ? { iso: null, error: dateFormatError } : { iso: null, error: '' }
  }

  const dateMatch = dateText.match(/^(\d{2})\.(\d{2})\.(\d{4})$/)
  if (!dateMatch) return { iso: null, error: dateFormatError }

  const timeMatch = timeText.match(/^([01]\d|2[0-3]):([0-5]\d)$/)
  if (!timeMatch) return { iso: null, error: timeFormatError }

  const day = Number(dateMatch[1])
  const month = Number(dateMatch[2])
  const year = Number(dateMatch[3])
  const hours = Number(timeMatch[1])
  const minutes = Number(timeMatch[2])
  const date = new Date(year, month - 1, day, hours, minutes, 0, 0)

  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return { iso: null, error: dateFormatError }
  }

  return { iso: date.toISOString(), error: '' }
}

function pillClass(active: boolean) {
  return active ? 'status-pill status-pill--ok' : 'status-pill status-pill--muted'
}

function operationalStatusLabel(status: string | null | undefined) {
  const normalized = String(status || '').trim().toLowerCase()
  if (normalized === 'open') return 'Відкрите'
  if (normalized === 'in_progress') return 'В роботі'
  if (normalized === 'resolved') return 'Вирішено'
  if (normalized === 'ignored') return 'Ігноровано'
  return status || '—'
}

function operationalStatusClass(status: string | null | undefined) {
  const normalized = String(status || '').trim().toLowerCase()
  if (normalized === 'resolved') return 'status-pill--ok'
  if (normalized === 'ignored') return 'status-pill--muted'
  if (normalized === 'in_progress') return 'status-pill--warn'
  return 'status-pill--info'
}

function operationalTypeLabel(itemType: string) {
  const labels: Record<string, string> = {
    billing_access_request: 'Запит на тариф',
    billing_access_request_pending: 'Запит на тариф',
    specialist_beta_access_review: 'Перевірка доступу спеціаліста',
    public_guest_request_pending: 'Моніторинг публічного запиту',
    public_guest_request_stale: 'Прострочений сигнал публічного запиту',
    public_guest_request_notification_missing: 'Проблема повідомлення спеціалісту',
    client_record_invite_pending: 'Очікування запрошення клієнта',
  }
  return labels[itemType] || itemType
}

function workQueueItemRoute(itemKey: string) {
  return `/admin/work-queue?status=all&item_key=${encodeURIComponent(itemKey)}`
}

function planLabel(value: string) {
  const code = String(value || '').trim().toUpperCase()
  if (!code) return '—'
  return code
}

function eventLabel(eventType: string) {
  const mapping: Record<string, string> = {
    BASE_PLAN_CHANGED: 'Базовий тариф змінено',
    TRIAL_STARTED: 'Тестовий доступ розпочато',
    TRIAL_ENDED: 'Тестовий доступ завершено',
    OVERRIDE_ENABLED: 'Перевизначення увімкнено',
    OVERRIDE_UPDATED: 'Перевизначення оновлено',
    OVERRIDE_DISABLED: 'Перевизначення вимкнено',
    REQUEST_APPROVED: 'Запит погоджено',
    REQUEST_REJECTED: 'Запит відхилено',
  }
  return mapping[eventType] || eventType
}

function trialSourceLabel(source: string) {
  const labels: Record<string, string> = {
    MANUAL: 'Ручне надання',
    SIGNUP_COMPLIMENTARY: 'Автоматично після реєстрації',
    BETA_POLICY_MIGRATION: 'Історична beta-політика',
  }
  return labels[source] || source
}

function beforeAfterSummary(item: AdminSpecialistAccessHistoryItem) {
  if (item.event_type === 'BASE_PLAN_CHANGED' && item.before_plan && item.after_plan) {
    return `Базовий тариф змінено: ${item.before_plan} → ${item.after_plan}`
  }
  if (item.event_type === 'TRIAL_STARTED') {
    const after = item.after_plan || '—'
    const untilDate = formatDate(
      (item.after_snapshot as { trial_ends_at?: string | null } | null)?.trial_ends_at || null
    )
    if (untilDate && untilDate !== '—') return `Тестовий доступ розпочато: ${after} до ${untilDate}`
    return `Тестовий доступ розпочато: ${after}`
  }
  if (item.event_type === 'TRIAL_ENDED') return 'Тестовий доступ завершено'
  if (item.event_type === 'OVERRIDE_ENABLED') {
    const after = item.after_plan || '—'
    return `Перевизначення увімкнено: ${after}`
  }
  if (item.event_type === 'OVERRIDE_UPDATED') {
    const after = item.after_plan || '—'
    return `Перевизначення оновлено: ${after}`
  }
  if (item.event_type === 'OVERRIDE_DISABLED') return 'Перевизначення вимкнено'
  if (item.event_type === 'REQUEST_APPROVED') return 'Запит погоджено'
  if (item.event_type === 'REQUEST_REJECTED') return 'Запит відхилено'
  if (item.before_plan && item.after_plan && item.before_plan !== item.after_plan) {
    return `Змінено: ${item.before_plan} → ${item.after_plan}`
  }
  return '—'
}

async function loadDetail() {
  if (!Number.isInteger(specialistId.value) || specialistId.value <= 0) {
    detail.value = null
    error.value = 'Некоректний id спеціаліста.'
    return
  }
  loading.value = true
  error.value = ''
  try {
    detail.value = await fetchAdminSpecialistDetail(specialistId.value)
  } catch (err) {
    detail.value = null
    error.value = getApiErrorMessage(err, 'Не вдалося завантажити деталку спеціаліста.')
  } finally {
    loading.value = false
  }
}

async function loadHistory() {
  if (!Number.isInteger(specialistId.value) || specialistId.value <= 0) {
    history.value = []
    historyError.value = 'Некоректний id спеціаліста.'
    return
  }
  historyLoading.value = true
  historyError.value = ''
  try {
    history.value = await fetchAdminSpecialistAccessHistory(specialistId.value)
  } catch (err) {
    history.value = []
    historyError.value = getApiErrorMessage(err, 'Не вдалося завантажити історію доступу.')
  } finally {
    historyLoading.value = false
  }
}

async function refreshAfterAction(successMessage: string) {
  await Promise.all([loadDetail(), loadHistory()])
  toast.success(successMessage)
}

function openPlanModal() {
  planFormError.value = ''
  const basePlan = String(detail.value?.tariff_access.base_plan || 'START').toUpperCase()
  planForm.value.plan = basePlan === 'PRO' || basePlan === 'LEADER' ? basePlan : 'START'
  planForm.value.reason = ''
  planModalOpen.value = true
}

function closePlanModal() {
  if (planSaving.value) return
  planModalOpen.value = false
}

async function submitPlanAction() {
  const reason = planForm.value.reason.trim()
  if (!reason) {
    planFormError.value = 'Причина є обов’язковою.'
    return
  }
  planFormError.value = ''
  planSaving.value = true
  try {
    await applyAdminSpecialistPlanAction(specialistId.value, {
      plan: planForm.value.plan,
      reason,
    })
    planModalOpen.value = false
    await refreshAfterAction('Базовий тариф оновлено')
  } catch (err) {
    planFormError.value = getApiErrorMessage(err, 'Не вдалося оновити базовий тариф')
  } finally {
    planSaving.value = false
  }
}

function openTrialModal() {
  trialFormError.value = ''
  trialForm.value.action = detail.value?.tariff_access.trial.active ? 'END' : 'START'
  trialForm.value.trial_plan = (detail.value?.tariff_access.trial.trial_plan || 'PRO') as 'PRO' | 'LEADER'
  const trialStart = toDisplayDateTimeParts(detail.value?.tariff_access.trial.starts_at || new Date().toISOString())
  trialForm.value.starts_date = trialStart.date
  trialForm.value.starts_time = trialStart.time
  const plus7d = new Date()
  plus7d.setDate(plus7d.getDate() + 7)
  const trialEnd = toDisplayDateTimeParts(detail.value?.tariff_access.trial.ends_at || plus7d.toISOString())
  trialForm.value.ends_date = trialEnd.date
  trialForm.value.ends_time = trialEnd.time
  trialForm.value.reason = ''
  trialModalOpen.value = true
}

function closeTrialModal() {
  if (trialSaving.value) return
  trialModalOpen.value = false
}

async function submitTrialAction() {
  const reason = trialForm.value.reason.trim()
  if (!reason) {
    trialFormError.value = 'Причина є обов’язковою.'
    return
  }
  trialFormError.value = ''
  let startsAt: string | null = null
  let endsAt = ''
  if (trialForm.value.action === 'START') {
    const startsAtResult = parseDisplayDateTime(trialForm.value.starts_date, trialForm.value.starts_time, false)
    if (startsAtResult.error) {
      trialFormError.value = startsAtResult.error
      return
    }
    const endsAtResult = parseDisplayDateTime(trialForm.value.ends_date, trialForm.value.ends_time, true)
    if (endsAtResult.error || !endsAtResult.iso) {
      trialFormError.value = endsAtResult.error || dateFormatError
      return
    }
    startsAt = startsAtResult.iso
    endsAt = endsAtResult.iso
  }

  trialSaving.value = true
  try {
    if (trialForm.value.action === 'START') {
      await applyAdminSpecialistTrialAction(specialistId.value, {
        action: 'START',
        trial_plan: trialForm.value.trial_plan,
        starts_at: startsAt || undefined,
        ends_at: endsAt,
        reason,
      })
    } else {
      await applyAdminSpecialistTrialAction(specialistId.value, {
        action: 'END',
        reason,
      })
    }
    trialModalOpen.value = false
    await refreshAfterAction('Тестовий доступ оновлено')
  } catch (err) {
    trialFormError.value = getApiErrorMessage(err, 'Не вдалося оновити тестовий доступ')
  } finally {
    trialSaving.value = false
  }
}

function openOverrideModal() {
  overrideFormError.value = ''
  const overrideActive = Boolean(detail.value?.tariff_access.override.active)
  overrideForm.value.action = overrideActive ? 'UPDATE' : 'ENABLE'
  const overridePlan = String(detail.value?.tariff_access.override.override_plan || 'PRO').toUpperCase()
  overrideForm.value.forced_plan =
    overridePlan === 'START' || overridePlan === 'LEADER' ? overridePlan : 'PRO'
  const overrideStart = toDisplayDateTimeParts(
    detail.value?.tariff_access.override.starts_at || new Date().toISOString()
  )
  overrideForm.value.starts_date = overrideStart.date
  overrideForm.value.starts_time = overrideStart.time
  const overrideEnd = toDisplayDateTimeParts(detail.value?.tariff_access.override.ends_at)
  overrideForm.value.expires_date = overrideEnd.date
  overrideForm.value.expires_time = overrideEnd.time
  overrideForm.value.reason = ''
  overrideModalOpen.value = true
}

function closeOverrideModal() {
  if (overrideSaving.value) return
  overrideModalOpen.value = false
}

async function submitOverrideAction() {
  const reason = overrideForm.value.reason.trim()
  if (!reason) {
    overrideFormError.value = 'Причина є обов’язковою.'
    return
  }
  overrideFormError.value = ''
  let startsAt: string | null = null
  let expiresAt: string | null = null
  if (overrideForm.value.action !== 'DISABLE') {
    const startsAtResult = parseDisplayDateTime(overrideForm.value.starts_date, overrideForm.value.starts_time, false)
    if (startsAtResult.error) {
      overrideFormError.value = startsAtResult.error
      return
    }
    const expiresAtResult = parseDisplayDateTime(overrideForm.value.expires_date, overrideForm.value.expires_time, false)
    if (expiresAtResult.error) {
      overrideFormError.value = expiresAtResult.error
      return
    }
    startsAt = startsAtResult.iso
    expiresAt = expiresAtResult.iso
  }

  overrideSaving.value = true
  try {
    if (overrideForm.value.action === 'DISABLE') {
      await applyAdminSpecialistOverrideAction(specialistId.value, {
        action: 'DISABLE',
        reason,
      })
    } else {
      await applyAdminSpecialistOverrideAction(specialistId.value, {
        action: overrideForm.value.action,
        forced_plan: overrideForm.value.forced_plan,
        starts_at: startsAt,
        expires_at: expiresAt,
        reason,
      })
    }
    overrideModalOpen.value = false
    await refreshAfterAction('Перевизначення оновлено')
  } catch (err) {
    overrideFormError.value = getApiErrorMessage(err, 'Не вдалося оновити перевизначення')
  } finally {
    overrideSaving.value = false
  }
}

watch(
  specialistId,
  async () => {
    await Promise.all([loadDetail(), loadHistory()])
  },
  { immediate: true }
)
</script>

<style scoped>
.admin-specialist-detail {
  display: grid;
  gap: 16px;
}

.admin-specialist-detail__hero {
  background: linear-gradient(135deg, rgba(8, 113, 201, 0.14), rgba(7, 47, 71, 0.06));
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.admin-specialist-detail__hero-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.admin-specialist-detail__title {
  margin: 0;
}

.admin-specialist-detail__subtitle {
  margin: 6px 0 0;
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

.summary-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: flex-end;
}

.access-action {
  max-width: 260px;
  display: grid;
  gap: 6px;
}

.access-action--service {
  border-left: 1px solid var(--line);
  padding-left: 10px;
}

.access-action__hint {
  margin: 0;
  font-size: 12px;
  line-height: 1.35;
}

.summary-grid,
.access-grid,
.requests-grid {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.crm-grid {
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.crm-panel {
  align-content: start;
}

.crm-panel--readiness {
  grid-column: 1 / -1;
}

.public-profile-action {
  width: fit-content;
}

.summary-list {
  display: grid;
  gap: 8px;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  padding: 10px;
}

.summary-list--onboarding .summary-list__value {
  margin-left: 4px;
}

.onboarding-grid {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.onboarding-card {
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  display: grid;
  gap: 8px;
  padding: 10px;
}

.onboarding-card p {
  margin: 0;
}

.onboarding-card__header {
  align-items: flex-start;
  display: flex;
  gap: 10px;
  justify-content: space-between;
}

.onboarding-card__header h3 {
  font-size: 16px;
  margin: 0;
}

.operational-counts {
  display: grid;
  gap: 8px;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
}

.operational-clean,
.operational-latest {
  margin-top: 12px;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  padding: 10px;
}

.operational-clean {
  background: color-mix(in srgb, #1f8a4c 8%, #fff);
}

.operational-latest {
  display: grid;
  gap: 7px;
}

.access-warning {
  border: 1px solid color-mix(in srgb, #8b5f00 25%, var(--line));
  background: color-mix(in srgb, #8b5f00 8%, #fff);
  border-radius: var(--radius-sm);
  padding: 10px;
}

.request-highlight {
  display: grid;
  gap: 8px;
  border: 1px solid color-mix(in srgb, var(--primary) 20%, var(--line));
  border-radius: var(--radius-sm);
  padding: 10px;
  background: color-mix(in srgb, var(--primary) 5%, #fff);
}

.readiness-panel__helper,
.readiness-panel__missing {
  margin: 6px 0 0;
}

.readiness-list {
  display: grid;
  gap: 8px;
}

.readiness-row {
  align-items: center;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  display: flex;
  gap: 10px;
  justify-content: space-between;
  padding: 9px 10px;
}

.readiness-row__label {
  font-weight: 700;
}

.history-list {
  display: grid;
  gap: 10px;
}

.history-item {
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  padding: 10px;
  display: grid;
  gap: 6px;
}

.history-item__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.status-pill {
  width: fit-content;
  padding: 6px 10px;
  border-radius: var(--radius-sm);
  font-size: 12px;
  letter-spacing: 0;
}

.status-pill--ok {
  background: rgba(31, 122, 76, 0.18);
  color: #1f7a4c;
}

.status-pill--muted {
  background: rgba(109, 117, 139, 0.14);
  color: #4b5563;
}

.status-pill--warn {
  background: rgba(139, 95, 0, 0.16);
  color: #8b5f00;
}

.status-pill--info {
  background: rgba(8, 113, 201, 0.14);
  color: #075b8f;
}

.setting-modal {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: grid;
  place-items: center;
  padding: 16px;
}

.setting-modal__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(7, 16, 31, 0.56);
}

.setting-modal__content {
  position: relative;
  width: min(560px, calc(100vw - 24px));
  max-height: calc(100vh - 24px);
  overflow: auto;
}

.modal-helper {
  margin: 6px 0 0;
  max-width: 520px;
}

.date-time-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(120px, 0.5fr);
  gap: 10px;
}

.field--compact {
  gap: 4px;
}

.setting-modal__footer {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  flex-wrap: wrap;
}

.form-error {
  color: #b3261e;
  background: #fdecea;
  border: 1px solid #f5c2c0;
  border-radius: var(--radius-sm);
  padding: 8px 10px;
}

@media (max-width: 920px) {
  .admin-specialist-detail__hero {
    flex-direction: column;
    align-items: flex-start;
  }

  .summary-actions {
    justify-content: flex-start;
  }

  .access-action--service {
    border-left: 0;
    padding-left: 0;
  }

  .crm-grid,
  .onboarding-grid {
    grid-template-columns: 1fr;
  }

  .date-time-grid {
    grid-template-columns: 1fr;
  }
}
</style>
