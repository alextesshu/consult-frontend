<template>
  <section class="slots">
    <header class="slots__header">
      <div>
        <h1 class="title slots__title">Розклад</h1>
        <p class="muted slots__subtitle">
          Календар практики, сесії та вікна для запису.
        </p>
      </div>
      <RouterLink class="btn btn--ghost btn--sm" to="/cabinet">Назад до кабінету</RouterLink>
    </header>

    <div class="slots__subnav">
      <div class="schedule-tabs" role="tablist" aria-label="Режими розкладу">
        <RouterLink
          class="btn btn--ghost btn--sm schedule-tabs__item"
          :class="{ 'btn--active': scheduleTab === 'CALENDAR' }"
          role="tab"
          :aria-selected="scheduleTab === 'CALENDAR'"
          to="/cabinet/schedule"
          @click="setScheduleTab('CALENDAR')"
        >
          Календар
        </RouterLink>
        <RouterLink
          class="btn btn--ghost btn--sm schedule-tabs__item"
          :class="{ 'btn--active': scheduleTab === 'AVAILABILITY' }"
          role="tab"
          :aria-selected="scheduleTab === 'AVAILABILITY'"
          to="/cabinet/slots?tab=availability"
          @click="setScheduleTab('AVAILABILITY')"
        >
          Вікна для запису
        </RouterLink>
        <RouterLink
          class="btn btn--ghost btn--sm schedule-tabs__item"
          role="tab"
          aria-selected="false"
          to="/cabinet/availability-exceptions"
        >
          Відпустка
        </RouterLink>
      </div>
    </div>

    <section
      v-if="!isSettingsTab"
      class="panel schedule-toolbar"
      :class="{ 'schedule-toolbar--availability': isAvailabilityTab }"
    >
      <div class="schedule-toolbar__main">
        <div class="week-nav" aria-label="Навігація тижнями">
          <button class="btn btn--ghost btn--sm" type="button" aria-label="Попередній тиждень" @click="shiftWeek(-1)">
            <span class="week-nav__label week-nav__label--desktop">Попередній тиждень</span>
            <span class="week-nav__label week-nav__label--mobile" aria-hidden="true">Попередній</span>
            <span class="week-nav__label week-nav__label--narrow" aria-hidden="true">Назад</span>
          </button>
          <div class="week-range" aria-live="polite">{{ weekRangeLabel }}</div>
          <button class="btn btn--ghost btn--sm" type="button" aria-label="Наступний тиждень" @click="shiftWeek(1)">
            <span class="week-nav__label week-nav__label--desktop">Наступний тиждень</span>
            <span class="week-nav__label week-nav__label--mobile" aria-hidden="true">Наступний</span>
            <span class="week-nav__label week-nav__label--narrow" aria-hidden="true">Далі</span>
          </button>
          <button class="btn btn--ghost btn--sm" type="button" @click="goToToday">
            Сьогодні
          </button>
        </div>
        <div class="schedule-actions">
          <div v-if="isCalendarTab" class="action-group">
            <div class="action-group__title">Календар</div>
            <p class="muted action-group__hint">Створюйте разові або регулярні сесії для конкретних клієнтів.</p>
            <div class="action-group__buttons">
              <button class="btn btn--ghost btn--sm" type="button" @click="() => openOneOffSessionModal()">
                Створити сесію
              </button>
              <button class="btn btn--sm" type="button" @click="openRegularSessionsModal">
                Закріпити регулярний час
              </button>
            </div>
          </div>
          <div v-else class="action-group action-group--availability">
            <div class="action-group__buttons">
              <button class="btn btn--ghost btn--sm" type="button" @click="openCreateForm">
                Додати вікно
              </button>
              <RouterLink
                class="btn btn--ghost btn--sm booking-settings-cta"
                to="/cabinet/slots?tab=settings"
                @click="setScheduleTab('SETTINGS')"
              >
                Запис і запити
              </RouterLink>
              <button
                class="btn btn--sm smart-fill-cta"
                type="button"
                :disabled="loading || deleteActionLoading"
                @click="requestFillWeek"
              >
                Створити вікна для запису
              </button>
            </div>
          </div>
        </div>
      </div>
      <p v-if="isAvailabilityTab" class="muted schedule-toolbar__hint">
        {{ availabilityTabHelperText }}
      </p>

      <div class="day-list day-list--mobile" aria-label="Дні тижня">
        <button
          v-for="day in weekDays"
          :key="day.key"
          class="btn btn--ghost btn--sm"
          type="button"
          :class="{ 'btn--active': day.key === selectedDate }"
          @click="selectDay(day.key)"
        >
          {{ day.label }}
        </button>
      </div>

      <div
        v-if="isAvailabilityTab"
        class="filters-toolbar__row filters-toolbar__row--controls filters-toolbar__row--availability"
      >
        <div class="slot-filter" role="group" aria-label="Фільтр за статусом вікон для запису">
          <button
            class="btn btn--ghost btn--sm"
            type="button"
            :class="{ 'btn--active': slotStatusFilter === 'ALL' }"
            @click="slotStatusFilter = 'ALL'"
          >
            Усі
          </button>
          <button
            class="btn btn--ghost btn--sm"
            type="button"
            :class="{ 'btn--active': slotStatusFilter === 'FREE' }"
            @click="slotStatusFilter = 'FREE'"
          >
            Доступно
          </button>
          <button
            class="btn btn--ghost btn--sm"
            type="button"
            :class="{ 'btn--active': slotStatusFilter === 'BOOKED' }"
            @click="slotStatusFilter = 'BOOKED'"
          >
            Заброньовано
          </button>
        </div>
        <div class="muted slot-summary">
          {{ weekStatusSummary.free }} доступно · {{ weekStatusSummary.booked }} заброньовано
        </div>
        <div class="calendar-legend" aria-label="Позначення вікон для запису">
          <span><i class="legend-dot legend-dot--available"></i>Доступно</span>
          <span><i class="legend-dot legend-dot--booked"></i>Заброньовано</span>
          <span><i class="legend-dot legend-dot--past"></i>Минуло</span>
        </div>
        <button
          v-if="hasPastSlotsInWeek"
          class="btn btn--ghost btn--sm slot-toggle"
          type="button"
          @click="showPastSlots = !showPastSlots"
        >
          {{ showPastSlots ? 'Сховати минулі вікна' : `Показати минулі вікна (${hiddenPastWeekSlotsCount})` }}
        </button>
        <div class="availability-bulk-toolbar" aria-label="Керування вибраними вікнами для запису">
          <div v-if="selectedAvailabilitySlotCount > 0" class="availability-bulk-toolbar__selection">
            <span class="availability-bulk-toolbar__count">Вибрано: {{ selectedAvailabilitySlotCount }}</span>
            <button
              class="btn btn--danger btn--sm"
              type="button"
              :disabled="deleteActionLoading"
              @click="requestDeleteSelectedAvailabilitySlots"
            >
              {{ bulkDeleteLoading ? 'Видалення...' : 'Видалити вибрані' }}
            </button>
            <button
              class="btn btn--ghost btn--sm"
              type="button"
              :disabled="deleteActionLoading"
              @click="clearSelectedAvailabilitySlots"
            >
              Скасувати вибір
            </button>
          </div>
          <button
            class="btn btn--ghost btn--sm"
            type="button"
            :disabled="deleteActionLoading || unbookedVisibleWeekSlots.length === 0"
            @click="requestClearVisibleWeekAvailabilitySlots"
          >
            {{ clearWeekLoading ? 'Очищення...' : 'Очистити тиждень' }}
          </button>
        </div>
      </div>
      <div v-else class="filters-toolbar__row filters-toolbar__row--controls">
        <span class="muted action-group__hint">Показати</span>
        <div class="slot-filter" role="group" aria-label="Фільтр подій календаря">
          <button
            class="btn btn--ghost btn--sm"
            type="button"
            :class="{ 'btn--active': calendarEventFilter === 'ALL' }"
            @click="calendarEventFilter = 'ALL'"
          >
            Усе
          </button>
          <button
            class="btn btn--ghost btn--sm"
            type="button"
            :class="{ 'btn--active': calendarEventFilter === 'SESSIONS' }"
            @click="calendarEventFilter = 'SESSIONS'"
          >
            Сесії
          </button>
          <button
            class="btn btn--ghost btn--sm"
            type="button"
            :class="{ 'btn--active': calendarEventFilter === 'AVAILABLE' }"
            @click="calendarEventFilter = 'AVAILABLE'"
          >
            Доступно
          </button>
          <button
            class="btn btn--ghost btn--sm"
            type="button"
            :class="{ 'btn--active': calendarEventFilter === 'BOOKED' }"
            @click="calendarEventFilter = 'BOOKED'"
          >
            Запити
          </button>
        </div>
        <div class="calendar-legend" aria-label="Позначення подій календаря">
          <span><i class="legend-dot legend-dot--session"></i>Сесія</span>
          <span><i class="legend-dot legend-dot--available"></i>Доступно</span>
          <span><i class="legend-dot legend-dot--booked"></i>Запит</span>
        </div>
      </div>
    </section>

    <div v-if="loading" class="muted" style="margin-top: 8px;">Завантаження...</div>
    <div v-if="error && !createFormOpen" class="form-error form-error--inline">{{ error }}</div>

    <div v-if="!isSettingsTab" class="schedule-workspace">
      <section class="panel calendar-panel" aria-label="Календар">
        <div class="calendar-scroll">
          <div class="week-calendar" role="grid" :aria-label="`Календар на тиждень ${weekRangeLabel}`">
            <div class="calendar-time-gutter calendar-header-cell" aria-hidden="true"></div>
            <div v-for="day in weekDays" :key="day.key" class="calendar-day-header" role="columnheader">
              <span>{{ day.weekday }}</span>
              <strong>{{ day.dateLabel }}</strong>
            </div>

            <div class="calendar-time-column" :style="{ height: calendarBodyHeightStyle }">
              <div
                v-for="hour in calendarHours"
                :key="hour"
                class="calendar-time"
                role="rowheader"
                :style="{ height: `${CALENDAR_HOUR_HEIGHT}px` }"
              >
                {{ formatHourLabel(hour) }}
              </div>
            </div>
            <div
              v-for="day in weekDays"
              :key="day.key"
              class="calendar-day-column"
              :class="{ 'calendar-cell--selected-day': day.key === selectedDate }"
              role="gridcell"
              :style="{ height: calendarBodyHeightStyle }"
            >
              <button
                v-if="isCalendarTab"
                class="calendar-empty-hit-area"
                type="button"
                :aria-label="`Створити сесію ${formatDateOnly(day.key)}`"
                :title="`Створити сесію ${formatDateOnly(day.key)}`"
                @click="openOneOffSessionModalForCalendarClick($event, day.key)"
              ></button>
              <div
                v-for="(hour, hourIndex) in calendarHours"
                :key="`${day.key}-${hour}`"
                class="calendar-hour-line"
                :style="{ top: `${hourIndex * CALENDAR_HOUR_HEIGHT}px` }"
                aria-hidden="true"
              ></div>
              <div
                v-if="isAvailabilityTab"
                v-for="layout in positionedSlotsForDay(day.key)"
                :key="layout.slot.id"
                class="calendar-slot availability-slot"
                :class="[slotStatusClass(layout.slot), {
                  'calendar-slot--selected': selectedSlot?.id === layout.slot.id,
                  'availability-slot--bulk-selected': isAvailabilitySlotSelected(layout.slot.id),
                }]"
                :style="calendarSlotStyle(layout)"
                :data-duration-minutes="layout.durationMinutes"
                :data-clipped-duration-minutes="layout.clippedDurationMinutes"
                :data-top-minutes="layout.topMinutes"
                :aria-label="`${slotStatusLabel(layout.slot)} ${formatSlotTimeRange(layout.slot)}`"
                :title="`${slotStatusLabel(layout.slot)} · ${formatSlotTimeRange(layout.slot)}`"
                @click.stop="selectSlot(layout.slot)"
              >
                <button
                  class="availability-slot__main"
                  type="button"
                  :aria-label="`${slotStatusLabel(layout.slot)} ${formatSlotTimeRange(layout.slot)}`"
                  @click.stop="selectSlot(layout.slot)"
                >
                  <span class="calendar-slot__time">{{ formatSlotTimeRange(layout.slot) }}</span>
                </button>
                <button
                  v-if="canDeleteAvailabilitySlot(layout.slot)"
                  class="availability-slot__select"
                  type="button"
                  :disabled="deleteActionLoading"
                  :aria-pressed="isAvailabilitySlotSelected(layout.slot.id)"
                  :aria-label="availabilitySlotSelectionLabel(layout.slot)"
                  @click.stop="toggleAvailabilitySlotSelection(layout.slot)"
                >
                  <span aria-hidden="true">{{ isAvailabilitySlotSelected(layout.slot.id) ? '✓' : '+' }}</span>
                </button>
              </div>
              <button
                v-if="isCalendarTab"
                v-for="layout in positionedCalendarSessionsForDay(day.key)"
                :key="layout.session.id"
                class="calendar-slot schedule-event"
                :class="[scheduleEventClass(layout.session), { 'calendar-slot--selected': selectedScheduleSession?.id === layout.session.id }]"
                type="button"
                :style="calendarSlotStyle(layout)"
                :data-duration-minutes="layout.durationMinutes"
                :data-clipped-duration-minutes="layout.clippedDurationMinutes"
                :data-top-minutes="layout.topMinutes"
                :aria-label="sessionBlockLabel(layout.session)"
                :title="sessionBlockLabel(layout.session)"
                @click.stop="selectSession(layout.session)"
              >
                <span class="calendar-session__kind">{{ scheduleEventTypeLabel(layout.session) }}</span>
                <span class="calendar-slot__time">{{ formatSessionTimeRange(layout.session) }}</span>
                <span v-if="shouldShowScheduleEventClient(layout.session)" class="calendar-session__client">{{ sessionClientLabel(layout.session) }}</span>
              </button>
            </div>
          </div>
        </div>

        <div v-if="isCalendarTab && visibleWeekCalendarSessions.length === 0" class="calendar-empty muted">
          На цьому тижні ще немає подій у розкладі.
        </div>
        <div v-if="isAvailabilityTab && visibleWeekSlots.length === 0" class="calendar-empty muted">
          На цьому тижні ще немає вікон для запису.
        </div>

        <div class="mobile-day-schedule">
          <template v-if="isCalendarTab">
            <div class="mobile-day-schedule__title">Події тижня</div>
            <div v-if="mobileCalendarDayGroups.length === 0" class="muted">На цьому тижні ще немає подій у розкладі.</div>
            <section
              v-for="group in mobileCalendarDayGroups"
              :key="group.key"
              class="mobile-day-group"
              :aria-label="`Події за ${formatDateOnly(group.key)}`"
            >
              <h3 class="mobile-day-group__title">
                <span>{{ formatDateOnly(group.key) }}</span>
                <small>{{ group.weekday }}</small>
              </h3>
              <div
                v-for="session in group.events"
                :key="session.id"
                class="mobile-schedule-event"
                :class="scheduleEventClass(session)"
              >
                <button
                  class="mobile-slot mobile-slot--event"
                  :class="{ 'calendar-slot--selected': selectedScheduleSession?.id === session.id }"
                  type="button"
                  :aria-label="sessionBlockLabel(session)"
                  :title="sessionBlockLabel(session)"
                  @click="selectSession(session)"
                >
                  <span class="mobile-slot__time">{{ formatSessionTimeRange(session) }}</span>
                  <span class="mobile-slot__meta">
                    {{ scheduleEventTypeLabel(session) }}<template v-if="shouldShowScheduleEventClient(session)"> · {{ sessionClientLabel(session) }}</template>
                  </span>
                </button>
                <div
                  v-if="selectedScheduleSession?.id === session.id"
                  class="mobile-event-detail"
                  :class="scheduleEventStatusClass(session)"
                >
                  <div class="mobile-event-detail__header">
                    <strong>{{ scheduleEventTypeLabel(session) }}</strong>
                    <span>{{ formatDateOnly(toLocalDateKey(sessionStartAt(session))) }}</span>
                  </div>
                  <dl class="mobile-event-detail__meta">
                    <div>
                      <dt>Час</dt>
                      <dd>{{ formatSessionTimeRange(session) }}</dd>
                    </div>
                    <div v-if="shouldShowScheduleEventClient(session)">
                      <dt>Клієнт</dt>
                      <dd>{{ sessionClientLabel(session) }}</dd>
                    </div>
                    <div v-if="session.type !== 'available_slot'">
                      <dt>Статус</dt>
                      <dd>{{ scheduleEventLifecycleLabel(session) }}</dd>
                    </div>
                    <div v-if="session.type === 'available_slot'">
                      <dt>Керування</dt>
                      <dd>Керувати вікнами можна у вкладці “Вікна для запису”.</dd>
                    </div>
                  </dl>
                  <div v-if="session.session_id || isPendingScheduleRequestEvent(session)" class="mobile-event-detail__actions">
                    <RouterLink v-if="session.session_id" class="btn btn--sm" :to="`/cabinet/sessions/${session.session_id}`">
                      Відкрити сесію
                    </RouterLink>
                    <RouterLink v-else class="btn btn--sm" :to="PENDING_REQUESTS_ROUTE">
                      Переглянути запити
                    </RouterLink>
                  </div>
                </div>
              </div>
            </section>
          </template>
          <template v-else>
            <div class="mobile-day-schedule__title">
              {{ formatDateOnly(selectedDate) }}
              <span v-if="isSelectedToday" class="day-hint__today">· Сьогодні</span>
            </div>
            <div v-if="filteredSlots.length === 0" class="muted">На цей день немає вікон для запису.</div>
            <div
              v-for="slot in filteredSlots"
              :key="slot.id"
              class="mobile-slot mobile-slot--availability"
              :class="[slotStatusClass(slot), {
                'calendar-slot--selected': selectedSlot?.id === slot.id,
                'availability-slot--bulk-selected': isAvailabilitySlotSelected(slot.id),
              }]"
              :aria-label="`${slotStatusLabel(slot)} ${formatSlotTimeRange(slot)}`"
              :title="`${slotStatusLabel(slot)} · ${formatSlotTimeRange(slot)}`"
            >
              <button
                class="mobile-slot__main"
                type="button"
                :aria-label="`${slotStatusLabel(slot)} ${formatSlotTimeRange(slot)}`"
                @click="selectSlot(slot)"
              >
                <span>{{ formatSlotTimeRange(slot) }}</span>
              </button>
              <button
                v-if="canDeleteAvailabilitySlot(slot)"
                class="mobile-slot__select"
                type="button"
                :disabled="deleteActionLoading"
                :aria-pressed="isAvailabilitySlotSelected(slot.id)"
                :aria-label="availabilitySlotSelectionLabel(slot)"
                @click.stop="toggleAvailabilitySlotSelection(slot)"
              >
                {{ isAvailabilitySlotSelected(slot.id) ? 'Вибрано' : 'Вибрати' }}
              </button>
            </div>
          </template>
        </div>
      </section>

      <aside
        class="panel slot-detail-panel"
        :class="{ 'slot-detail-panel--calendar': isCalendarTab }"
        aria-label="Деталі вибраного елемента розкладу"
      >
        <template v-if="isCalendarTab && !selectedScheduleSession">
          <h2 class="panel__title">Деталі події</h2>
          <p class="muted">Оберіть подію в календарі, щоб переглянути деталі.</p>
        </template>
        <template v-else-if="isCalendarTab && selectedScheduleSession">
          <div class="slot-detail-panel__header">
            <div>
              <h2 class="panel__title">{{ scheduleEventDetailTitle(selectedScheduleSession) }}</h2>
              <p class="muted">{{ formatDateOnly(toLocalDateKey(sessionStartAt(selectedScheduleSession) || '')) }}</p>
            </div>
            <span class="slot-status" :class="scheduleEventStatusClass(selectedScheduleSession)">
              {{ scheduleEventTypeLabel(selectedScheduleSession) }}
            </span>
          </div>

          <dl class="slot-detail-list">
            <div>
              <dt>Час</dt>
              <dd>{{ formatSessionTimeRange(selectedScheduleSession) }}</dd>
            </div>
            <div v-if="shouldShowScheduleEventClient(selectedScheduleSession)">
              <dt>Клієнт</dt>
              <dd>{{ sessionClientLabel(selectedScheduleSession) }}</dd>
            </div>
            <div v-if="selectedScheduleSession.type !== 'available_slot'">
              <dt>Статус</dt>
              <dd>{{ scheduleEventLifecycleLabel(selectedScheduleSession) }}</dd>
            </div>
            <div v-if="selectedScheduleSession.type === 'available_slot'">
              <dt>Керування</dt>
              <dd>Керувати вікнами можна у вкладці “Вікна для запису”.</dd>
            </div>
          </dl>

          <div v-if="selectedScheduleSession.session_id || isPendingScheduleRequestEvent(selectedScheduleSession)" class="slot-actions">
            <RouterLink v-if="selectedScheduleSession.session_id" class="btn btn--sm" :to="`/cabinet/sessions/${selectedScheduleSession.session_id}`">
              Відкрити сесію
            </RouterLink>
            <RouterLink v-else class="btn btn--sm" :to="PENDING_REQUESTS_ROUTE">
              Переглянути запити
            </RouterLink>
          </div>
        </template>
        <template v-else-if="isAvailabilityTab && !selectedSlot">
          <h2 class="panel__title">Деталі вікна для запису</h2>
          <p class="muted">Оберіть вікно в календарі, щоб переглянути деталі або змінити його.</p>
        </template>
        <template v-else-if="isAvailabilityTab && selectedSlot">
          <div class="slot-detail-panel__header">
            <div>
              <h2 class="panel__title">Деталі вікна для запису</h2>
              <p class="muted">{{ formatDateOnly(toLocalDateKey(selectedSlot.start_at)) }}</p>
            </div>
            <span class="slot-status" :class="slotStatusClass(selectedSlot)">
              {{ slotStatusLabel(selectedSlot) }}
            </span>
          </div>

          <div v-if="isEditing(selectedSlot.id)" class="slot-card__edit slot-card__edit--panel">
            <div class="date-input-shell">
              <input
                v-model="editStartDate"
                class="input"
                type="text"
                inputmode="numeric"
                placeholder="дд.мм.рррр"
                aria-label="Дата початку редагованого вікна"
                @focus="openDatePickerFor('editStartDate')"
              />
              <button
                class="date-picker-trigger"
                type="button"
              aria-label="Вибрати дату"
              @click="openDatePickerFor('editStartDate')"
            >
                <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
                  <path d="M7 2v3M17 2v3M4 9h16M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
                </svg>
              </button>
              <div v-if="activeDatePicker === 'editStartDate'" class="date-picker-popover" role="dialog" aria-label="Календар вибору дати">
                <div class="date-picker-popover__header">
                  <button class="btn btn--ghost btn--sm" type="button" aria-label="Попередній місяць" @click="shiftDatePickerMonth(-1)">&lt;</button>
                  <strong>{{ datePickerMonthLabel }}</strong>
                  <button class="btn btn--ghost btn--sm" type="button" aria-label="Наступний місяць" @click="shiftDatePickerMonth(1)">&gt;</button>
                </div>
                <div class="date-picker-grid" aria-hidden="true">
                  <span v-for="weekday in DATE_PICKER_WEEKDAYS" :key="weekday">{{ weekday }}</span>
                </div>
                <div class="date-picker-grid">
                  <button
                    v-for="day in datePickerDays"
                    :key="day.iso"
                    class="date-picker-day"
                    type="button"
                    :class="{ 'date-picker-day--muted': !day.inMonth, 'date-picker-day--selected': isDatePickerDaySelected(day.iso), 'date-picker-day--today': day.isToday }"
                    :aria-label="formatDateOnly(day.iso)"
                    @click="selectDateFromPicker(day.iso)"
                  >
                    {{ day.label }}
                  </button>
                </div>
              </div>
            </div>
            <input
              v-model="editStartTime"
              class="input"
              type="text"
              inputmode="numeric"
              placeholder="09:00"
              list="time-options"
              aria-label="Час початку редагованого вікна"
            />
            <input
              v-model.number="editDuration"
              class="input"
              type="number"
              min="15"
              step="5"
              placeholder="хв"
              aria-label="Тривалість у хвилинах"
            />
          </div>
          <dl v-else class="slot-detail-list">
            <div>
              <dt>Час</dt>
              <dd>{{ formatSlotTimeRange(selectedSlot) }}</dd>
            </div>
            <div>
              <dt>Тривалість</dt>
              <dd>{{ formatDuration(selectedSlot) }}</dd>
            </div>
            <div v-if="selectedSlot.is_booked">
              <dt>Сесія</dt>
              <dd>Це вікно вже заброньовано. Даних для переходу до сесії в поточному payload немає.</dd>
            </div>
          </dl>

          <div class="slot-actions">
            <button
              v-if="!isEditing(selectedSlot.id)"
              class="btn btn--ghost btn--sm"
              type="button"
              :disabled="selectedSlot.is_booked || loading"
              @click="startEdit(selectedSlot)"
            >
              Редагувати вікно
            </button>
            <button
              v-else
              class="btn btn--sm"
              type="button"
              :disabled="loading"
              @click="saveEdit(selectedSlot.id)"
            >
              Зберегти
            </button>
            <button
              v-if="isEditing(selectedSlot.id)"
              class="btn btn--ghost btn--sm"
              type="button"
              :disabled="loading"
              @click="cancelEdit"
            >
              Скасувати
            </button>
            <button
              class="btn btn--ghost btn--sm"
              type="button"
              :disabled="selectedSlot.is_booked || loading || deleteActionLoading"
              @click="requestDeleteSlot(selectedSlot.id)"
            >
              {{ isSlotDeleting(selectedSlot.id) ? 'Видалення...' : 'Видалити вікно' }}
            </button>
          </div>
          <div
            v-if="isEditing(selectedSlot.id) && editErrors[selectedSlot.id]"
            :ref="setEditErrorRef(selectedSlot.id)"
            class="form-error slot-error"
          >
            {{ editErrors[selectedSlot.id] }}
          </div>
          <div v-if="selectedSlot.is_booked" class="muted slot-hint">
            Це вікно вже заброньовано - редагування та видалення недоступні.
          </div>
        </template>
      </aside>
    </div>

    <section v-else class="panel settings-panel">
      <div class="settings-panel__intro">
        <h2 class="panel__title">Запис і запити</h2>
        <p class="muted">
          Налаштуйте, як клієнти можуть звертатися до вас із публічного профілю.
        </p>
      </div>

      <div v-if="settingsLoading" class="muted">Завантаження налаштувань...</div>
      <form v-else class="settings-form" @submit.prevent="savePublicBookingSettings">
        <div v-if="settingsError" class="form-error" role="alert">{{ settingsError }}</div>
        <label class="field">
          Спосіб запису
          <select v-model="publicBookingMode" class="input" aria-label="Спосіб запису">
            <option
              v-for="option in publicBookingModeOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </select>
          <span class="muted settings-form__hint">{{ bookingModeHelperText }}</span>
        </label>

        <label class="field settings-form__checkbox-row">
          <span class="settings-form__checkbox-label">Показувати доступні вікна у публічному профілі</span>
          <input
            v-model="showPublicAvailability"
            type="checkbox"
            :disabled="publicBookingMode !== 'direct_booking'"
            aria-label="Показувати доступні вікна у публічному профілі"
          />
          <span class="muted settings-form__hint">
            Коли опція вимкнена, клієнти не бачать календар доступних вікон.
          </span>
        </label>

        <label class="field">
          Мінімальний час до бронювання
          <select
            v-model.number="publicBookingMinLeadTimeHours"
            class="input"
            aria-label="Мінімальний час до бронювання"
          >
            <option v-for="hours in publicBookingLeadTimeOptions" :key="hours" :value="hours">
              {{ hours }} год
            </option>
          </select>
          <span class="muted settings-form__hint">
            Клієнти не зможуть забронювати сесію раніше цього часу.
          </span>
        </label>

        <label class="field">
          Показувати доступні вікна наперед
          <select
            v-model.number="publicBookingHorizonDays"
            class="input"
            aria-label="Показувати доступні вікна наперед"
          >
            <option v-for="days in publicBookingHorizonOptions" :key="days" :value="days">
              {{ days }} днів
            </option>
          </select>
          <span class="muted settings-form__hint">
            Це обмежує, наскільки далеко вперед клієнти бачать доступні вікна.
          </span>
        </label>

        <label class="field">
          Підтвердження спеціаліста
          <select
            :value="publicBookingRequiresConfirmation ? 'required' : 'auto'"
            class="input"
            aria-label="Підтвердження спеціаліста"
            @change="onPublicBookingConfirmationChange"
          >
            <option value="required">Потрібне підтвердження</option>
            <option value="auto">Автоматично підтверджувати</option>
          </select>
          <span class="muted settings-form__hint">
            Під час beta рекомендуємо залишити підтвердження увімкненим.
          </span>
        </label>

        <div class="settings-form__actions">
          <button class="btn" type="submit" :disabled="settingsSaving || settingsLoading || !settingsLoaded">
            {{ settingsSaving ? 'Зберігаємо...' : 'Зберегти налаштування' }}
          </button>
        </div>
      </form>
    </section>

    <section v-if="isAvailabilityTab && createFormOpen" class="panel create-slot-panel">
      <div class="create-slot-panel__intro">
        <h2 class="panel__title">Додати вікно для запису</h2>
        <p class="muted" style="margin: 6px 0 0;">
          Цей проміжок клієнти зможуть обрати для прямого запису у вашому публічному профілі.
        </p>
      </div>
      <form ref="createFormRef" class="slot-form slot-form--create" @submit.prevent="createSlot">
        <label class="field slot-form__date-field">
          Дата
          <div class="date-input-shell">
            <input
              v-model="newStartDate"
              class="input"
              type="text"
              inputmode="numeric"
              placeholder="дд.мм.рррр"
              aria-label="Дата"
              required
              @focus="openDatePickerFor('newStartDate')"
            />
            <button
              class="date-picker-trigger"
              type="button"
              aria-label="Вибрати дату"
              @click="openDatePickerFor('newStartDate')"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
                <path d="M7 2v3M17 2v3M4 9h16M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
              </svg>
            </button>
            <div v-if="activeDatePicker === 'newStartDate'" class="date-picker-popover" role="dialog" aria-label="Календар вибору дати">
              <div class="date-picker-popover__header">
                <button class="btn btn--ghost btn--sm" type="button" aria-label="Попередній місяць" @click="shiftDatePickerMonth(-1)">&lt;</button>
                <strong>{{ datePickerMonthLabel }}</strong>
                <button class="btn btn--ghost btn--sm" type="button" aria-label="Наступний місяць" @click="shiftDatePickerMonth(1)">&gt;</button>
              </div>
              <div class="date-picker-grid" aria-hidden="true">
                <span v-for="weekday in DATE_PICKER_WEEKDAYS" :key="weekday">{{ weekday }}</span>
              </div>
              <div class="date-picker-grid">
                <button
                  v-for="day in datePickerDays"
                  :key="day.iso"
                  class="date-picker-day"
                  type="button"
                  :class="{ 'date-picker-day--muted': !day.inMonth, 'date-picker-day--selected': isDatePickerDaySelected(day.iso), 'date-picker-day--today': day.isToday }"
                  :aria-label="formatDateOnly(day.iso)"
                  @click="selectDateFromPicker(day.iso)"
                >
                  {{ day.label }}
                </button>
              </div>
            </div>
          </div>
        </label>
        <label class="field slot-form__time-field">
          Час початку
          <input
            v-model="newStartTime"
            class="input"
            type="text"
            inputmode="numeric"
            placeholder="09:00"
            aria-label="Час початку"
            list="time-options"
            required
          />
        </label>
        <label class="field slot-form__duration-field">
          Тривалість
          <span class="duration-input">
            <input
              v-model.number="newDuration"
              class="input"
              type="number"
              min="15"
              step="5"
              placeholder="50"
              aria-label="Тривалість у хвилинах"
              required
            />
            <span aria-hidden="true">хв</span>
          </span>
        </label>
        <datalist id="time-options">
          <option v-for="option in timeOptions" :key="option" :value="option" />
        </datalist>
        <div v-if="newSlotPreview" class="slot-form__preview">
          <strong>Буде доступно: {{ newSlotPreview }}</strong>
        </div>
        <div class="slot-form__actions">
          <button class="btn btn--ghost" type="button" @click="closeCreateForm">
            Скасувати
          </button>
          <button class="btn" type="submit">
            Додати
          </button>
        </div>
        <div v-if="error" class="form-error form-error--inline">{{ error }}</div>
      </form>
    </section>

    <div
      v-if="fillAvailabilityModalOpen"
      class="regular-sessions-modal regular-sessions-modal--smart-fill"
      role="dialog"
      aria-modal="true"
      aria-labelledby="fill-availability-modal-title"
    >
      <button
        class="regular-sessions-modal__backdrop"
        type="button"
        aria-label="Закрити"
        @click="closeFillAvailabilityModal"
      ></button>
      <div ref="fillAvailabilityModalContentRef" class="regular-sessions-modal__content smart-fill-modal">
        <div class="regular-sessions-modal__header">
          <div>
            <h2 id="fill-availability-modal-title" class="panel__title">Створити вікна для запису</h2>
            <p class="muted">
              Оберіть дні, робочий час, тривалість вікон і перерви між ними.
            </p>
            <div
              ref="fillAvailabilityAlertRef"
              class="form-error form-error--inline fill-availability-form__error"
              :class="{ 'fill-availability-form__error--empty': !fillAvailabilityError }"
              :role="fillAvailabilityError ? 'alert' : undefined"
              aria-live="polite"
              :tabindex="fillAvailabilityError ? -1 : undefined"
            >
              {{ fillAvailabilityError || ' ' }}
            </div>
          </div>
          <button class="icon-btn" type="button" aria-label="Закрити" @click="closeFillAvailabilityModal">×</button>
        </div>

        <form class="slot-form regular-sessions-form fill-availability-form" @submit.prevent="submitFillAvailability">
          <fieldset class="fill-availability-days">
            <legend>Дні тижня</legend>
            <div class="fill-availability-days__options" role="group" aria-label="Дні тижня для заповнення">
              <button
                v-for="option in fillAvailabilityWeekdayOptions"
                :key="option.value"
                class="fill-availability-day"
                type="button"
                :class="{ 'fill-availability-day--selected': isFillAvailabilityWeekdaySelected(option.value) }"
                :aria-pressed="isFillAvailabilityWeekdaySelected(option.value)"
                :data-selected="isFillAvailabilityWeekdaySelected(option.value) ? 'true' : 'false'"
                :data-testid="`fill-weekday-${option.value}`"
                @click="toggleFillAvailabilityWeekday(option.value)"
              >
                <span class="fill-availability-day__check" aria-hidden="true">✓</span>
                {{ option.label }}
              </button>
            </div>
          </fieldset>

          <label class="field">
            Початок робочого дня
            <select v-model="fillAvailabilityStartTime" class="input input--select" required>
              <option v-for="option in timeOptions" :key="option" :value="option">
                {{ option }}
              </option>
            </select>
          </label>

          <label class="field">
            Кінець робочого дня
            <select v-model="fillAvailabilityEndTime" class="input input--select" required>
              <option v-for="option in timeOptions" :key="option" :value="option">
                {{ option }}
              </option>
            </select>
          </label>

          <label class="field">
            Тривалість вікна
            <select v-model.number="fillAvailabilityDuration" class="input input--select" required>
              <option v-for="option in fillAvailabilityDurationOptions" :key="option" :value="option">
                {{ option }} хв
              </option>
            </select>
          </label>

          <label class="field">
            Перерва між вікнами
            <select v-model.number="fillAvailabilityBreak" class="input input--select" required>
              <option v-for="option in fillAvailabilityBreakOptions" :key="option" :value="option">
                {{ option === 0 ? 'Без перерви' : `${option} хв` }}
              </option>
            </select>
          </label>

          <label class="field">
            Кількість тижнів
            <input
              v-model.number="fillAvailabilityWeeks"
              class="input"
              type="number"
              min="1"
              max="12"
              step="1"
              required
            />
          </label>

          <p class="muted fill-availability-form__hint">
            Існуючі сесії та заброньовані вікна не буде змінено. Перетини буде пропущено.
          </p>
          <div class="slot-form__preview fill-availability-form__preview" data-testid="fill-availability-preview">
            <strong v-if="fillAvailabilitySelectedDaysCount > 0">
              Обрано {{ fillAvailabilitySelectedDaysCount }}
              {{ pluralizeUk(fillAvailabilitySelectedDaysCount, 'день', 'дні', 'днів') }}
              · до {{ fillAvailabilitySlotsPerDay }}
              {{ pluralizeUk(fillAvailabilitySlotsPerDay, 'вікно', 'вікна', 'вікон') }} на день
              · {{ fillAvailabilityWeeksCount }}
              {{ pluralizeUk(fillAvailabilityWeeksCount, 'тиждень', 'тижні', 'тижнів') }}.
              Буде створено до {{ fillAvailabilityRequestedCount }}
              {{ pluralizeUk(fillAvailabilityRequestedCount, 'вікна для запису', 'вікон для запису', 'вікон для запису') }}.
            </strong>
            <strong v-else>Оберіть дні тижня, щоб розрахувати кількість вікон.</strong>
            <span>Це орієнтовний максимум. Перетини буде пропущено, точну кількість покаже результат після створення.</span>
          </div>

          <div class="slot-form__actions">
            <button class="btn btn--ghost" type="button" :disabled="fillAvailabilitySaving" @click="closeFillAvailabilityModal">
              Скасувати
            </button>
            <button class="btn" type="submit" :disabled="fillAvailabilitySaving">
              {{ fillAvailabilitySaving ? 'Створюємо...' : 'Створити вікна для запису' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <div
      v-if="regularSessionsModalOpen"
      class="regular-sessions-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="regular-sessions-modal-title"
    >
      <button
        class="regular-sessions-modal__backdrop"
        type="button"
        aria-label="Закрити"
        @click="closeRegularSessionsModal"
      ></button>
      <div class="regular-sessions-modal__content">
        <div class="regular-sessions-modal__header">
          <div>
            <h2 id="regular-sessions-modal-title" class="panel__title">Закріпити регулярний час</h2>
            <p class="muted">
              Оберіть клієнта, день і час. Майбутні сесії створяться автоматично на кілька тижнів наперед.
            </p>
          </div>
          <button class="icon-btn" type="button" aria-label="Закрити" @click="closeRegularSessionsModal">×</button>
        </div>

        <form ref="regularSessionsFormRef" class="slot-form regular-sessions-form" @submit.prevent="createRegularSessions">
          <div v-if="regularClientsLoading" class="muted">Завантаження клієнтів...</div>
          <label v-else class="field">
            Клієнт
            <select
              v-model.number="regularClientRecordId"
              class="input input--select"
              :disabled="regularClientOptions.length === 0"
              required
            >
              <option value="" disabled>Оберіть клієнта</option>
              <option v-for="client in regularClientOptions" :key="client.recordId" :value="client.recordId">
                {{ client.label }}
              </option>
            </select>
          </label>
          <p v-if="!regularClientsLoading && regularClientOptions.length === 0" class="muted">
            Немає активних клієнтів із робочою карткою.
          </p>

          <label class="field">
            День тижня
            <select v-model.number="regularWeekday" class="input input--select">
              <option v-for="option in regularWeekdayOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </label>
          <label class="field">
            Час початку
            <select v-model="regularStartTime" class="input input--select" required>
              <option value="" disabled>Оберіть час</option>
              <option v-for="option in timeOptions" :key="option" :value="option">
                {{ option }}
              </option>
            </select>
          </label>
          <label class="field">
            Тривалість
            <span class="duration-input">
              <input
                v-model.number="regularDuration"
                class="input"
                type="number"
                min="15"
                max="240"
                step="5"
                aria-label="Тривалість регулярної сесії"
                required
              />
              <span aria-hidden="true">хв</span>
            </span>
          </label>
          <label class="field">
            Частота
            <select v-model="regularFrequency" class="input input--select">
              <option v-for="option in regularFrequencyOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </label>
          <label class="field">
            Формат зустрічі
            <select v-model="regularSessionFormat" class="input input--select">
              <option v-for="option in regularFormatOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </label>
          <label class="field">
            Починаючи з
            <div class="date-input-shell">
              <input
                v-model="regularStartsOn"
                class="input"
                type="text"
                inputmode="numeric"
                placeholder="дд.мм.рррр"
                aria-label="Починаючи з"
                readonly
                required
                @focus="openDatePickerFor('regularStartsOn')"
              />
              <button
                class="date-picker-trigger"
                type="button"
                aria-label="Вибрати дату початку регулярних сесій"
                @click="openDatePickerFor('regularStartsOn')"
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
                  <path d="M7 2v3M17 2v3M4 9h16M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
                </svg>
              </button>
              <div v-if="activeDatePicker === 'regularStartsOn'" class="date-picker-popover" role="dialog" aria-label="Календар вибору дати">
                <div class="date-picker-popover__header">
                  <button class="btn btn--ghost btn--sm" type="button" aria-label="Попередній місяць" @click="shiftDatePickerMonth(-1)">&lt;</button>
                  <strong>{{ datePickerMonthLabel }}</strong>
                  <button class="btn btn--ghost btn--sm" type="button" aria-label="Наступний місяць" @click="shiftDatePickerMonth(1)">&gt;</button>
                </div>
                <div class="date-picker-grid" aria-hidden="true">
                  <span v-for="weekday in DATE_PICKER_WEEKDAYS" :key="weekday">{{ weekday }}</span>
                </div>
                <div class="date-picker-grid">
                  <button
                    v-for="day in datePickerDays"
                    :key="day.iso"
                    class="date-picker-day"
                    type="button"
                    :class="{ 'date-picker-day--muted': !day.inMonth, 'date-picker-day--selected': isDatePickerDaySelected(day.iso), 'date-picker-day--today': day.isToday }"
                    :aria-label="formatDateOnly(day.iso)"
                    @click="selectDateFromPicker(day.iso)"
                  >
                    {{ day.label }}
                  </button>
                </div>
              </div>
            </div>
          </label>
          <label class="field">
            Посилання на онлайн-зустріч
            <input
              v-model.trim="regularMeetingUrl"
              class="input"
              type="url"
              placeholder="https://..."
            />
          </label>
          <label class="field">
            Місце зустрічі
            <input
              v-model.trim="regularOfflineLocation"
              class="input"
              type="text"
            />
          </label>
          <div class="slot-form__actions">
            <button class="btn btn--ghost" type="button" @click="closeRegularSessionsModal">
              Скасувати
            </button>
            <button class="btn" type="submit" :disabled="regularClientsLoading || regularSessionsSaving || regularClientOptions.length === 0">
              {{ regularSessionsSaving ? 'Додаємо...' : 'Додати' }}
            </button>
          </div>
          <div v-if="regularSessionsError" class="form-error form-error--inline">{{ regularSessionsError }}</div>
        </form>
      </div>
    </div>

    <div
      v-if="oneOffSessionModalOpen"
      class="regular-sessions-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="one-off-session-modal-title"
    >
      <button
        class="regular-sessions-modal__backdrop"
        type="button"
        aria-label="Закрити"
        @click="closeOneOffSessionModal"
      ></button>
      <div ref="oneOffSessionModalContentRef" class="regular-sessions-modal__content">
        <div class="regular-sessions-modal__header">
          <div>
            <h2 id="one-off-session-modal-title" class="panel__title">Створити сесію</h2>
            <p class="muted">
              Створіть разову сесію для клієнта без відкриття публічних вікон для запису.
            </p>
            <div
              v-if="oneOffSessionError"
              ref="oneOffSessionAlertRef"
              class="form-error form-error--inline"
              role="alert"
              aria-live="polite"
              tabindex="-1"
            >
              {{ oneOffSessionError }}
            </div>
          </div>
          <button class="icon-btn" type="button" aria-label="Закрити" @click="closeOneOffSessionModal">×</button>
        </div>

        <form class="slot-form regular-sessions-form" @submit.prevent="createOneOffSession">
          <div v-if="oneOffSessionLoading" class="muted">Завантаження даних...</div>
          <template v-else>
            <label class="field">
              Клієнт
              <select
                v-model.number="oneOffClientRecordId"
                class="input input--select"
                :disabled="regularClientOptions.length === 0"
                required
              >
                <option value="" disabled>Оберіть клієнта</option>
                <option v-for="client in regularClientOptions" :key="client.recordId" :value="client.recordId">
                  {{ client.label }}
                </option>
              </select>
            </label>

            <label class="field">
              Дата
              <input
                v-model.trim="oneOffDate"
                class="input"
                type="text"
                inputmode="numeric"
                placeholder="ДД.ММ.РРРР"
                required
              />
            </label>

            <label class="field">
              Час початку
              <select v-model="oneOffStartTime" class="input input--select" required>
                <option value="" disabled>Оберіть час</option>
                <option v-for="option in timeOptions" :key="option" :value="option">
                  {{ option }}
                </option>
              </select>
            </label>

            <label class="field">
              Тривалість
              <input
                v-model.number="oneOffDuration"
                class="input"
                type="number"
                min="15"
                max="480"
                step="5"
                required
              />
            </label>

            <label class="field">
              Формат зустрічі
              <select v-model="oneOffSessionFormat" class="input input--select">
                <option v-for="option in regularFormatOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
            </label>

            <label class="field">
              Посилання на онлайн-зустріч
              <input
                v-model.trim="oneOffMeetingUrl"
                class="input"
                type="url"
                placeholder="https://"
              />
            </label>

            <label class="field">
              Місце зустрічі
              <input
                v-model.trim="oneOffOfflineLocation"
                class="input"
                type="text"
              />
            </label>
          </template>

          <p v-if="!oneOffSessionLoading && regularClientOptions.length === 0" class="muted">
            Немає активних клієнтів із робочою карткою.
          </p>

          <div class="slot-form__actions">
            <button class="btn btn--ghost" type="button" @click="closeOneOffSessionModal">
              Скасувати
            </button>
            <button
              class="btn"
              type="submit"
              :disabled="oneOffSessionLoading || oneOffSessionSaving || regularClientOptions.length === 0"
            >
              {{ oneOffSessionSaving ? 'Створюємо...' : 'Створити сесію' }}
            </button>
          </div>
        </form>
      </div>
    </div>

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
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
  createClientRegularTime,
  fetchSpecialistProfile,
  getApiErrorMessage,
  getCabinetSchedule,
  updateSpecialistProfile,
} from '../lib/api'
import type {
  CabinetScheduleEvent,
  ClientRegularTimeFrequency,
  ClientRegularTimePayload,
  SessionFormat,
  SpecialistProfile,
} from '../lib/api'
import { getBookingErrorCode, getBookingErrorMessage } from '../lib/bookingCopy'
import { buildTenMinuteTimeOptions } from '../lib/timeOptions'
import { useToast } from '../composables/useToast'
import ConfirmModal from '../components/ConfirmModal.vue'
import { useConfirmModal } from '../composables/useConfirmModal'

type Slot = {
  id: number
  start_at: string
  end_at: string
  is_booked: boolean
}

type ScheduleSession = CabinetScheduleEvent

type SlotConflict = {
  slot_id?: number
  start_at?: string
  end_at?: string
}

type OneOffSessionCreateResponse = {
  id?: number
  session_id?: number
}

type FillAvailabilityResponse = {
  created_count?: number
  skipped_count?: number
  date_from?: string
  date_to?: string
  weeks?: number
  break_minutes?: number
}

type CalendarSlotLayout = {
  slot: Slot
  top: number
  height: number
  lane: number
  laneCount: number
  durationMinutes: number
  clippedDurationMinutes: number
  topMinutes: number
}

type CalendarSessionLayout = {
  session: ScheduleSession
  top: number
  height: number
  lane: number
  laneCount: number
  durationMinutes: number
  clippedDurationMinutes: number
  topMinutes: number
}

type DatePickerField = 'newStartDate' | 'editStartDate' | 'regularStartsOn'

type ManualClientRecord = {
  id: number
  display_name?: string | null
  status?: string | null
  archived_at?: string | null
}

type RegisteredClientRecord = {
  id: number
  client_record_id?: number | null
  state?: string | null
  client_name?: string | null
  client_display_name?: string | null
  display_name?: string | null
  client_username?: string | null
  client_email?: string | null
}

type ListResponse<T> = T[] | { results?: T[] } | null | undefined

type RegularClientOption = {
  recordId: number
  label: string
}

type ScheduleTab = 'CALENDAR' | 'AVAILABILITY' | 'SETTINGS'
type PublicBookingMode = 'request_only' | 'direct_booking'
type WeekRange = {
  dateFrom: string
  dateTo: string
}

type OneOffSessionPrefill = {
  dateKey?: string
  startTime?: string
}

const PAST_SESSION_TIME_ERROR_MESSAGE = 'Неможливо створити сесію в минулому. Оберіть майбутню дату або час.'
const PENDING_REQUESTS_ROUTE = '/cabinet/external-sessions#guest-requests'

const slots = ref<Slot[]>([])
const sessions = ref<ScheduleSession[]>([])
const loading = ref(false)
const error = ref('')
const editErrors = ref<Record<number, string>>({})
const editErrorRefs = ref<Record<number, HTMLElement | null>>({})
const route = useRoute()
const toast = useToast()
const confirmModal = useConfirmModal()
let scheduleLoadRequestId = 0

function scheduleTabFromRoute(): ScheduleTab {
  const path = String(route.path || '')
  if (path.startsWith('/cabinet/schedule')) return 'CALENDAR'

  const tab = Array.isArray(route.query.tab) ? route.query.tab[0] : route.query.tab
  if (tab === 'availability') return 'AVAILABILITY'
  if (tab === 'calendar') return 'CALENDAR'
  if (tab === 'settings') return 'SETTINGS'

  return 'CALENDAR'
}
const createFormRef = ref<HTMLFormElement | null>(null)
const createFormOpen = ref(false)
const regularSessionsFormRef = ref<HTMLFormElement | null>(null)
const regularSessionsModalOpen = ref(false)
const oneOffSessionModalOpen = ref(false)
const oneOffSessionLoading = ref(false)
const oneOffSessionSaving = ref(false)
const oneOffSessionError = ref('')
const oneOffProfileLoaded = ref(false)
const oneOffProfileTimezone = ref('')
const oneOffSessionAlertRef = ref<HTMLElement | null>(null)
const oneOffSessionModalContentRef = ref<HTMLElement | null>(null)
const regularClientsLoading = ref(false)
const regularSessionsSaving = ref(false)
const regularSessionsError = ref('')
const regularClientOptions = ref<RegularClientOption[]>([])
const regularClientsLoaded = ref(false)
const activeDatePicker = ref<DatePickerField | null>(null)

const newStartDate = ref('')
const newStartTime = ref('09:00')
const newDuration = ref(50)
const regularClientRecordId = ref<number | ''>('')
const regularWeekday = ref(0)
const regularStartTime = ref('09:00')
const regularDuration = ref(50)
const regularFrequency = ref<ClientRegularTimeFrequency>('weekly')
const regularSessionFormat = ref<SessionFormat>('online')
const regularStartsOn = ref('')
const regularMeetingUrl = ref('')
const regularOfflineLocation = ref('')
const oneOffClientRecordId = ref<number | ''>('')
const oneOffDate = ref('')
const oneOffStartTime = ref('09:00')
const oneOffDuration = ref(50)
const oneOffTimezone = ref(Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Kyiv')
const oneOffSessionFormat = ref<SessionFormat>('online')
const oneOffMeetingUrl = ref('')
const oneOffOfflineLocation = ref('')
const timeOptions = buildTenMinuteTimeOptions('00:00', '23:50')
const todayKey = toDateInputValue(new Date())
const selectedWeekStart = ref(toDateInputValue(startOfWeek(new Date())))
const datePickerMonth = ref(toDateInputValue(new Date()))
const selectedDate = ref(todayKey)
const showPastSlots = ref(false)
const slotStatusFilter = ref<'ALL' | 'FREE' | 'BOOKED'>('ALL')
const selectedSlotId = ref<number | null>(null)
const selectedAvailabilitySlotIds = ref<number[]>([])
const selectedSessionId = ref<string | null>(null)
const scheduleTab = ref<ScheduleTab>(scheduleTabFromRoute())
const calendarEventFilter = ref<'ALL' | 'SESSIONS' | 'AVAILABLE' | 'BOOKED'>('ALL')
const settingsLoading = ref(false)
const settingsSaving = ref(false)
const settingsError = ref('')
const settingsLoaded = ref(false)
const publicBookingMode = ref<PublicBookingMode>('request_only')
const showPublicAvailability = ref(false)
const publicBookingMinLeadTimeHours = ref(24)
const publicBookingHorizonDays = ref(14)
const publicBookingRequiresConfirmation = ref(true)
const pastSlotMessage = 'Неможливо створити вікно в минулому. Для нічного часу оберіть майбутню дату або майбутній час.'

const editingId = ref<number | null>(null)
const editStartDate = ref('')
const editStartTime = ref('')
const editDuration = ref(50)
const deletingSlotIds = ref<number[]>([])
const bulkDeleteLoading = ref(false)
const clearWeekLoading = ref(false)
const fillAvailabilityModalOpen = ref(false)
const fillAvailabilitySaving = ref(false)
const fillAvailabilityError = ref('')
const fillAvailabilityAlertRef = ref<HTMLElement | null>(null)
const fillAvailabilityModalContentRef = ref<HTMLElement | null>(null)
const fillAvailabilityWeekdays = ref<number[]>([0, 1, 2, 3, 4])
const fillAvailabilityStartTime = ref('09:00')
const fillAvailabilityEndTime = ref('18:00')
const fillAvailabilityDuration = ref(50)
const fillAvailabilityBreak = ref(10)
const fillAvailabilityWeeks = ref(1)
const deleteSlotsErrorMessage = 'Не вдалося видалити вікна для запису. Оновіть сторінку і спробуйте ще раз.'
const WEEKDAY_SHORT_UK = ['нд', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб']
const WEEKDAY_LONG_UK = ['Неділя', 'Понеділок', 'Вівторок', 'Середа', 'Четвер', 'Пʼятниця', 'Субота']
const DATE_PICKER_WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд']
const MONTHS_UK = [
  'січень',
  'лютий',
  'березень',
  'квітень',
  'травень',
  'червень',
  'липень',
  'серпень',
  'вересень',
  'жовтень',
  'листопад',
  'грудень',
]
const DEFAULT_CALENDAR_START_HOUR = 8
const DEFAULT_CALENDAR_END_HOUR = 21
const CALENDAR_HOUR_HEIGHT = 50
const MIN_CALENDAR_SLOT_HEIGHT = 24
const ACTIVE_SESSION_STATUSES = new Set(['SCHEDULED', 'CONFIRMED'])
const regularWeekdayOptions = [
  { value: 0, label: 'Понеділок' },
  { value: 1, label: 'Вівторок' },
  { value: 2, label: 'Середа' },
  { value: 3, label: 'Четвер' },
  { value: 4, label: 'Пʼятниця' },
  { value: 5, label: 'Субота' },
  { value: 6, label: 'Неділя' },
]
const regularFrequencyOptions: Array<{ value: ClientRegularTimeFrequency; label: string }> = [
  { value: 'weekly', label: 'Щотижня' },
  { value: 'every_two_weeks', label: 'Раз на два тижні' },
]
const publicBookingModeOptions: Array<{ value: PublicBookingMode; label: string }> = [
  { value: 'request_only', label: 'Клієнти надсилають запит' },
  { value: 'direct_booking', label: 'Клієнти можуть записатися на доступне вікно' },
]
const publicBookingLeadTimeOptions = [12, 24, 48, 72]
const publicBookingHorizonOptions = [7, 14, 30]
const regularFormatOptions: Array<{ value: SessionFormat; label: string }> = [
  { value: 'online', label: 'Онлайн' },
  { value: 'offline', label: 'Офлайн' },
]
const fillAvailabilityWeekdayOptions = [
  { value: 0, label: 'Пн' },
  { value: 1, label: 'Вт' },
  { value: 2, label: 'Ср' },
  { value: 3, label: 'Чт' },
  { value: 4, label: 'Пт' },
  { value: 5, label: 'Сб' },
  { value: 6, label: 'Нд' },
]
const fillAvailabilityDurationOptions = [10, 20, 30, 40, 50, 60, 90, 120]
const fillAvailabilityBreakOptions = [0, 5, 10, 15, 20, 30, 45, 60]

function startOfWeek(value: Date) {
  const date = new Date(value)
  date.setHours(0, 0, 0, 0)
  const day = date.getDay()
  const diff = day === 0 ? -6 : 1 - day
  date.setDate(date.getDate() + diff)
  return date
}

function parseDateLike(value: string | Date): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value
  }
  const raw = String(value || '').trim()
  const isoDate = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw)
  if (isoDate) {
    const year = Number(isoDate[1])
    const month = Number(isoDate[2])
    const day = Number(isoDate[3])
    const date = new Date(year, month - 1, day, 0, 0, 0, 0)
    if (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    ) {
      return date
    }
  }
  const parsed = new Date(raw)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function pad2(value: number) {
  return String(value).padStart(2, '0')
}

function formatDateParts(date: Date) {
  return `${pad2(date.getDate())}.${pad2(date.getMonth() + 1)}.${date.getFullYear()}`
}

function formatTimeParts(date: Date) {
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`
}

function timeOptionToMinutes(value: string) {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(String(value || '').trim())
  if (!match) return null
  return Number(match[1]) * 60 + Number(match[2])
}

function formatDayOptionLabel(date: Date) {
  const weekday = WEEKDAY_SHORT_UK[date.getDay()] || ''
  return `${weekday}, ${pad2(date.getDate())}.${pad2(date.getMonth() + 1)}`
}

function formatDate(value: string) {
  const parsed = parseDateLike(value)
  if (!parsed) return value
  return formatTimeParts(parsed)
}

function formatDateTime(value: string | Date) {
  const parsed = parseDateLike(value)
  if (!parsed) return String(value)
  return `${formatDateParts(parsed)}, ${formatTimeParts(parsed)}`
}

function formatDateOnly(value: string) {
  const parsed = parseDateLike(value)
  if (!parsed) return value
  return formatDateParts(parsed)
}

function formatDuration(slot: Slot) {
  const start = new Date(slot.start_at)
  const end = new Date(slot.end_at)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return '-'
  const minutes = Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000))
  return `${minutes} хв`
}

function toLocalDateKey(value: string) {
  const dt = new Date(value)
  if (Number.isNaN(dt.getTime())) return value
  const offset = dt.getTimezoneOffset() * 60000
  return new Date(dt.getTime() - offset).toISOString().slice(0, 10)
}

function isFutureSlot(slot: Slot) {
  const start = new Date(slot.start_at).getTime()
  return !Number.isNaN(start) && start > Date.now()
}

function sessionStartAt(session: ScheduleSession) {
  return session.start_at || ''
}

function sessionEndAt(session: ScheduleSession) {
  return session.end_at || ''
}

function isActiveScheduleSession(session: ScheduleSession) {
  return (
    session.type === 'available_slot' ||
    session.type === 'booked_slot' ||
    ACTIVE_SESSION_STATUSES.has(String(session.status || '').toUpperCase())
  )
}

function isSessionBackedBookedEvent(event: ScheduleSession) {
  return event.type === 'booked_slot' && Boolean(event.session_id)
}

function isPendingScheduleRequestEvent(event: ScheduleSession) {
  return event.type === 'booked_slot' && !isSessionBackedBookedEvent(event)
}

function pendingScheduleRequestsCount(event: ScheduleSession) {
  const count = Number(event.requests_count || 0)
  return Number.isFinite(count) && count > 0 ? count : 1
}

function pendingScheduleRequestLabel(event: ScheduleSession) {
  const count = pendingScheduleRequestsCount(event)
  return count > 1 ? `Запити · ${count}` : 'Запит на сесію'
}

function shouldShowScheduleEventClient(event: ScheduleSession) {
  return event.type !== 'available_slot' && !isPendingScheduleRequestEvent(event)
}

function scheduleEventTypeLabel(event: ScheduleSession) {
  if (event.type === 'available_slot') return 'Доступно'
  if (isSessionBackedBookedEvent(event)) return 'Сесія'
  if (isPendingScheduleRequestEvent(event)) return pendingScheduleRequestLabel(event)
  return 'Сесія'
}

function scheduleEventDetailTitle(event: ScheduleSession) {
  if (event.type === 'available_slot') return 'Деталі доступного часу'
  if (isPendingScheduleRequestEvent(event)) return pendingScheduleRequestLabel(event)
  return 'Деталі сесії'
}

function scheduleEventClientKindLabel(event: ScheduleSession) {
  if (event.client_kind === 'guest') return 'Гостьовий клієнт'
  if (event.client_kind === 'registered') return 'Клієнт'
  return 'Клієнт'
}

function sessionClientLabel(session: ScheduleSession) {
  if (session.type === 'available_slot') return 'Доступно'
  return session.client_display_name || scheduleEventClientKindLabel(session)
}

function sessionStatusLabel(status?: string | null) {
  const normalized = String(status || '').toUpperCase()
  if (normalized === 'CONFIRMED') return 'Підтверджено'
  if (normalized === 'BOOKED' || normalized === 'PENDING' || normalized === 'REQUESTED') return 'Очікує підтвердження'
  if (normalized === 'SCHEDULED') return 'Заплановано'
  return status || 'Сесія'
}

function scheduleEventLifecycleLabel(event: ScheduleSession) {
  if (isSessionBackedBookedEvent(event)) return 'Підтверджено'
  if (isPendingScheduleRequestEvent(event)) return 'Очікує підтвердження'
  return sessionStatusLabel(event.status)
}

function formatSessionTimeRange(session: ScheduleSession) {
  const start = parseDateLike(sessionStartAt(session))
  const end = parseDateLike(sessionEndAt(session))
  if (!start || !end) return formatDate(sessionStartAt(session))
  return `${formatTimeParts(start)}–${formatTimeParts(end)}`
}

function sessionBlockLabel(session: ScheduleSession) {
  const clientPart = shouldShowScheduleEventClient(session) ? ` · ${sessionClientLabel(session)}` : ''
  return `${scheduleEventTypeLabel(session)}${clientPart} · ${formatSessionTimeRange(session)}`
}

function sessionDurationMinutes(session: ScheduleSession) {
  const start = parseDateLike(sessionStartAt(session))
  const end = parseDateLike(sessionEndAt(session))
  if (!start || !end) return 0
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000))
}

function getSlotsForDate(dateKey: string) {
  return slots.value.filter((slot) => toLocalDateKey(slot.start_at) === dateKey)
}

function getNearestFutureDateKey(fromDateKey: string) {
  const nearest = slots.value
    .filter((slot) => isFutureSlot(slot))
    .map((slot) => toLocalDateKey(slot.start_at))
    .filter((dateKey) => dateKey >= fromDateKey)
    .sort()[0]
  return nearest || ''
}

function switchToNearestFutureDateIfNeeded() {
  if (!selectedDate.value || showPastSlots.value || filteredSlots.value.length > 0) return
  const nearestDateKey = getNearestFutureDateKey(selectedDate.value)
  if (!nearestDateKey || nearestDateKey === selectedDate.value) return
  const previousDateKey = selectedDate.value
  selectedDate.value = nearestDateKey
  moveWeekToDate(nearestDateKey)
  toast.info(
    `За ${formatDateOnly(previousDateKey)} немає майбутніх вікон. Показано найближчу дату: ${formatDateOnly(nearestDateKey)}.`
  )
}

function getHiddenPastSlotsCount(dateKey: string, excludedSlotId?: number) {
  return getSlotsForDate(dateKey).filter((slot) => {
    if (excludedSlotId !== undefined && slot.id === excludedSlotId) return false
    return !isFutureSlot(slot)
  }).length
}

function formatUkTime(value: Date) {
  return formatTimeParts(value)
}

function normalizeOneOffTimezone(value: string) {
  const normalized = String(value || '').trim()
  if (!normalized) return ''
  if (normalized === 'Europe/Kiev') return 'Europe/Kyiv'
  return normalized
}

function resolvedOneOffTimezone() {
  const timezoneName =
    normalizeOneOffTimezone(oneOffProfileTimezone.value) ||
    normalizeOneOffTimezone(oneOffTimezone.value) ||
    'Europe/Kyiv'
  return timezoneName || 'Europe/Kyiv'
}

function showOneOffSessionError(message: string) {
  oneOffSessionError.value = message
  void nextTick(() => {
    if (
      oneOffSessionModalContentRef.value &&
      typeof oneOffSessionModalContentRef.value.scrollTo === 'function'
    ) {
      oneOffSessionModalContentRef.value.scrollTo({ top: 0, behavior: 'smooth' })
    }
    oneOffSessionAlertRef.value?.focus()
  })
}

function parseUkDateTime(dateStr: string, timeStr: string) {
  const trimmedDate = dateStr.trim()
  const trimmedTime = timeStr.trim()
  const dateMatch = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(trimmedDate)
  const timeMatch = /^(\d{1,2}):(\d{1,2})$/.exec(trimmedTime)
  if (!dateMatch || !timeMatch) return null

  const day = Number(dateMatch[1])
  const month = Number(dateMatch[2])
  const year = Number(dateMatch[3])

  const hours = Number(timeMatch[1])
  const minutes = Number(timeMatch[2])

  if (month < 1 || month > 12) return null
  if (hours > 23 || minutes > 59) return null

  const candidate = new Date(year, month - 1, day, hours, minutes, 0, 0)
  if (
    candidate.getFullYear() !== year ||
    candidate.getMonth() !== month - 1 ||
    candidate.getDate() !== day
  ) {
    return null
  }
  return candidate
}

function normalizeOneOffStartTimeOption(value: string) {
  const trimmed = String(value || '').trim()
  if (timeOptions.includes(trimmed)) return trimmed
  const match = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(trimmed)
  if (!match) return ''
  const totalMinutes = Number(match[1]) * 60 + Number(match[2])
  const roundedMinutes = Math.min(23 * 60 + 50, Math.max(0, Math.round(totalMinutes / 10) * 10))
  const candidate = `${pad2(Math.floor(roundedMinutes / 60))}:${pad2(roundedMinutes % 60)}`
  return timeOptions.includes(candidate) ? candidate : ''
}

function isPastDateTime(value: Date) {
  return value.getTime() <= Date.now()
}

function displayDateToIso(value: string) {
  const trimmed = value.trim()
  const match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(trimmed)
  if (!match) return null

  const day = Number(match[1])
  const month = Number(match[2])
  const year = Number(match[3])
  if (month < 1 || month > 12) return null

  const candidate = new Date(year, month - 1, day, 0, 0, 0, 0)
  if (
    candidate.getFullYear() !== year ||
    candidate.getMonth() !== month - 1 ||
    candidate.getDate() !== day
  ) {
    return null
  }

  return toDateInputValue(candidate)
}

function isoDateToDisplay(value: string) {
  return formatDateOnly(value)
}

function regularTimeWeekdayFromIso(value: string): number | null {
  const parsed = parseDateLike(value)
  if (!parsed) return null
  return (parsed.getDay() + 6) % 7
}

function toDateInputValue(date: Date) {
  const offset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offset).toISOString().slice(0, 10)
}

function isEditing(id: number) {
  return editingId.value === id
}

function setEditErrorRef(id: number) {
  return (el: Element | { $el?: Element } | null) => {
    const element = el && '$el' in el ? el.$el ?? null : el
    editErrorRefs.value[id] = element as HTMLElement | null
  }
}

function normalizeError(err: any) {
  const detail = err?.response?.data?.detail
  if (Array.isArray(detail) && detail.length > 0) {
    return String(detail[0])
  }
  if (typeof detail === 'string') return detail
  if (Array.isArray(err?.response?.data) && err.response.data.length > 0) {
    return String(err.response.data[0])
  }
  return ''
}

function normalizeConflict(err: any): SlotConflict | null {
  const conflict = err?.response?.data?.conflict
  if (!conflict || typeof conflict !== 'object') return null

  const normalized: SlotConflict = {}
  if (typeof conflict.slot_id === 'number') normalized.slot_id = conflict.slot_id
  if (typeof conflict.start_at === 'string' && conflict.start_at.trim()) normalized.start_at = conflict.start_at
  if (typeof conflict.end_at === 'string' && conflict.end_at.trim()) normalized.end_at = conflict.end_at

  return normalized.slot_id || normalized.start_at || normalized.end_at ? normalized : null
}

function formatConflictRange(conflict: SlotConflict) {
  if (conflict.start_at && conflict.end_at) {
    const startLabel = formatDateTime(conflict.start_at)
    const sameDay = toLocalDateKey(conflict.start_at) === toLocalDateKey(conflict.end_at)
    const endDate = new Date(conflict.end_at)
    if (sameDay && !Number.isNaN(endDate.getTime())) {
      return `${startLabel}-${formatUkTime(endDate)}`
    }
    return `${startLabel} - ${formatDateTime(conflict.end_at)}`
  }

  if (conflict.start_at) {
    return formatDateTime(conflict.start_at)
  }

  if (typeof conflict.slot_id === 'number') {
    return `ID ${conflict.slot_id}`
  }

  return ''
}

function isPastConflict(conflict: SlotConflict | null) {
  if (!conflict?.end_at) return false
  const end = new Date(conflict.end_at).getTime()
  return !Number.isNaN(end) && end <= Date.now()
}

function translateError(
  message: string,
  options?: { code?: string | null; conflict?: SlotConflict | null }
) {
  if (!message && options?.code !== 'SLOT_OVERLAP') return ''
  if (options?.code === 'SLOT_OVERLAP' || message.includes('overlaps')) {
    const conflictRange = options?.conflict ? formatConflictRange(options.conflict) : ''
    if (conflictRange && isPastConflict(options?.conflict || null)) {
      return `Віконце перетинається з уже існуючим: ${conflictRange}. Це вікно вже в минулому, тому не показується у списку за замовчуванням.`
    }
    if (conflictRange) {
      return `Віконце перетинається з уже існуючим: ${conflictRange}.`
    }
    return 'Віконце перетинається з уже існуючим.'
  }
  if (message.includes('end_at must be greater than start_at')) {
    return 'Кінець має бути пізніше за початок.'
  }
  if (message.includes('Slot not found')) {
    return 'Віконце не знайдено.'
  }
  return message
}

function getSlotErrorMessage(err: unknown, fallback: string) {
  const code = getBookingErrorCode(err)
  const raw = normalizeError(err)
  const conflict = normalizeConflict(err)
  const translated = translateError(raw, { code, conflict })
  if (translated) return translated
  return getBookingErrorMessage(err, fallback)
}

const weekStartDate = computed(() => parseDateLike(selectedWeekStart.value) || startOfWeek(new Date()))

const weekDays = computed(() => {
  const start = weekStartDate.value
  return Array.from({ length: 7 }, (_, idx) => {
    const d = new Date(start.getTime() + idx * 24 * 60 * 60 * 1000)
    return {
      key: toDateInputValue(d),
      label: formatDayOptionLabel(d),
      weekday: WEEKDAY_LONG_UK[d.getDay()] || '',
      dateLabel: `${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}`,
    }
  })
})

const weekRangeLabel = computed(() => {
  const first = weekDays.value[0]
  const last = weekDays.value[6]
  if (!first || !last) return ''
  return `${formatDateOnly(first.key)} - ${formatDateOnly(last.key)}`
})

const fillAvailabilityWorkdayMinutes = computed(() => {
  const start = timeOptionToMinutes(fillAvailabilityStartTime.value)
  const end = timeOptionToMinutes(fillAvailabilityEndTime.value)
  if (start === null || end === null || end <= start) return 0
  return end - start
})

const fillAvailabilitySelectedDaysCount = computed(() => fillAvailabilityWeekdays.value.length)

const fillAvailabilityWeeksCount = computed(() => {
  const weeks = Number(fillAvailabilityWeeks.value)
  if (!Number.isFinite(weeks) || weeks < 1) return 0
  return Math.floor(weeks)
})

const fillAvailabilitySlotsPerDay = computed(() => {
  const duration = Number(fillAvailabilityDuration.value)
  const breakMinutes = Number(fillAvailabilityBreak.value)
  if (!fillAvailabilityDurationOptions.includes(duration)) return 0
  if (!fillAvailabilityBreakOptions.includes(breakMinutes)) return 0
  const workdayMinutes = fillAvailabilityWorkdayMinutes.value
  if (workdayMinutes < duration) return 0
  return Math.floor((workdayMinutes - duration) / (duration + breakMinutes)) + 1
})

const fillAvailabilityRequestedCount = computed(() => {
  const duration = Number(fillAvailabilityDuration.value)
  const breakMinutes = Number(fillAvailabilityBreak.value)
  if (
    fillAvailabilityWeeksCount.value < 1 ||
    fillAvailabilityWeeksCount.value > 12 ||
    !fillAvailabilityDurationOptions.includes(duration) ||
    !fillAvailabilityBreakOptions.includes(breakMinutes)
  ) {
    return 0
  }
  const perDay = fillAvailabilitySlotsPerDay.value
  if (perDay <= 0) return 0
  return fillAvailabilitySelectedDaysCount.value * fillAvailabilityWeeksCount.value * perDay
})

function pluralizeUk(value: number, one: string, few: string, many: string) {
  const absolute = Math.abs(value)
  const lastTwo = absolute % 100
  const last = absolute % 10
  if (lastTwo >= 11 && lastTwo <= 14) return many
  if (last === 1) return one
  if (last >= 2 && last <= 4) return few
  return many
}

function visibleWeekRange(): WeekRange | null {
  const firstDay = weekDays.value[0]?.key
  const lastDay = weekDays.value[6]?.key
  if (!firstDay || !lastDay) return null
  return {
    dateFrom: firstDay,
    dateTo: lastDay,
  }
}

function isSameWeekRange(left: WeekRange | null, right: WeekRange | null) {
  return Boolean(left && right && left.dateFrom === right.dateFrom && left.dateTo === right.dateTo)
}

const weekDateKeys = computed(() => new Set(weekDays.value.map((day) => day.key)))
const isCalendarTab = computed(() => scheduleTab.value === 'CALENDAR')
const isAvailabilityTab = computed(() => scheduleTab.value === 'AVAILABILITY')
const isSettingsTab = computed(() => scheduleTab.value === 'SETTINGS')
const bookingModeHelperText = computed(() => (
  publicBookingMode.value === 'direct_booking'
    ? 'Клієнти бачать доступні вікна у вашому публічному профілі та можуть записатися на них.'
    : 'Клієнти залишають запит, а ви самі домовляєтесь про час.'
))
const availabilityTabHelperText = computed(() => {
  if (publicBookingMode.value === 'request_only') {
    return 'Клієнти бачать ці вікна лише коли прямий запис увімкнено.'
  }
  if (showPublicAvailability.value) {
    return 'Клієнти бачать ці вікна у публічному профілі.'
  }
  return 'Показ доступних вікон вимкнено у публічному профілі.'
})

function matchesSlotStatusFilter(slot: Slot) {
  if (slotStatusFilter.value === 'FREE') return !slot.is_booked
  if (slotStatusFilter.value === 'BOOKED') return slot.is_booked
  return true
}

function isSlotVisible(slot: Slot) {
  if (!showPastSlots.value && !isFutureSlot(slot)) return false
  return matchesSlotStatusFilter(slot)
}

function matchesCalendarEventFilter(event: ScheduleSession) {
  if (calendarEventFilter.value === 'SESSIONS') return event.type === 'session' || isSessionBackedBookedEvent(event)
  if (calendarEventFilter.value === 'AVAILABLE') return event.type === 'available_slot'
  if (calendarEventFilter.value === 'BOOKED') return event.type === 'booked_slot' && !isSessionBackedBookedEvent(event)
  return true
}

const visibleWeekCalendarSessions = computed(() =>
  sessions.value
    .filter(isActiveScheduleSession)
    .filter(matchesCalendarEventFilter)
    .filter((session) => {
      const startAt = sessionStartAt(session)
      const endAt = sessionEndAt(session)
      return Boolean(startAt && endAt && weekDateKeys.value.has(toLocalDateKey(startAt)))
    })
    .sort((a, b) => String(sessionStartAt(a)).localeCompare(String(sessionStartAt(b))))
)

const visibleWeekSlots = computed(() =>
  slots.value
    .filter((slot) => weekDateKeys.value.has(toLocalDateKey(slot.start_at)))
    .filter(isSlotVisible)
    .sort((a, b) => String(a.start_at).localeCompare(String(b.start_at)))
)

const unbookedVisibleWeekSlots = computed(() =>
  slots.value
    .filter((slot) => weekDateKeys.value.has(toLocalDateKey(slot.start_at)))
    .filter(canDeleteAvailabilitySlot)
    .sort((a, b) => String(a.start_at).localeCompare(String(b.start_at)))
)

const selectedAvailabilitySlotCount = computed(() => selectedAvailabilitySlotIds.value.length)

const deleteActionLoading = computed(() =>
  deletingSlotIds.value.length > 0 || bulkDeleteLoading.value || clearWeekLoading.value
)

const calendarHours = computed(() => {
  const { startHour, endHour } = calendarHourRange.value
  return Array.from({ length: endHour - startHour }, (_, index) => startHour + index)
})

const calendarHourRange = computed(() => {
  const rangeItems = isCalendarTab.value
    ? visibleWeekCalendarSessions.value.map((item) => sessionMinuteRangeForDate(item, toLocalDateKey(sessionStartAt(item))))
    : visibleWeekSlots.value.map((item) => slotMinuteRangeForDate(item, toLocalDateKey(item.start_at)))
  const ranges = rangeItems.filter((range): range is { startMinutes: number; endMinutes: number } => Boolean(range))

  if (ranges.length === 0) {
    return {
      startHour: DEFAULT_CALENDAR_START_HOUR,
      endHour: Math.min(24, DEFAULT_CALENDAR_END_HOUR + 1),
    }
  }

  const minStart = Math.min(...ranges.map((range) => range.startMinutes))
  const maxEnd = Math.max(...ranges.map((range) => range.endMinutes))
  const startHour = Math.max(0, Math.floor(minStart / 60) - 1)
  const endHour = Math.min(24, Math.ceil(maxEnd / 60) + 1)

  return {
    startHour,
    endHour: Math.max(startHour + 1, endHour),
  }
})

const calendarBodyHeight = computed(() => (
  (calendarHourRange.value.endHour - calendarHourRange.value.startHour) * CALENDAR_HOUR_HEIGHT
))

const calendarBodyHeightStyle = computed(() => `${calendarBodyHeight.value}px`)

const weekStatusSummary = computed(() => {
  const weekSlots = slots.value
    .filter((slot) => weekDateKeys.value.has(toLocalDateKey(slot.start_at)))
    .filter((slot) => showPastSlots.value || isFutureSlot(slot))
  const free = weekSlots.filter((slot) => !slot.is_booked).length
  return {
    free,
    booked: weekSlots.length - free,
  }
})

const slotsForSelectedDay = computed(() => {
  if (!selectedDate.value) {
    return slots.value.filter(isSlotVisible)
  }
  const slotsForDate = getSlotsForDate(selectedDate.value)
  return slotsForDate.filter(isSlotVisible).sort((a, b) => String(a.start_at).localeCompare(String(b.start_at)))
})

const filteredSlots = computed(() => {
  return slotsForSelectedDay.value
})

const mobileCalendarDayGroups = computed(() =>
  weekDays.value
    .map((day) => ({
      ...day,
      events: visibleWeekCalendarSessions.value.filter((session) => toLocalDateKey(sessionStartAt(session)) === day.key),
    }))
    .filter((day) => day.events.length > 0)
)

const hiddenPastWeekSlotsCount = computed(() =>
  slots.value.filter((slot) => weekDateKeys.value.has(toLocalDateKey(slot.start_at)) && !isFutureSlot(slot)).length
)

const hasPastSlotsInWeek = computed(() => hiddenPastWeekSlotsCount.value > 0)

const isSelectedToday = computed(() => selectedDate.value === todayKey)
const selectedSlot = computed(() => slots.value.find((slot) => slot.id === selectedSlotId.value) || null)
const selectedScheduleSession = computed(() =>
  sessions.value.find((session) => session.id === selectedSessionId.value) || null
)
const newSlotPreview = computed(() => {
  const startAt = parseUkDateTime(newStartDate.value, newStartTime.value)
  const durationMinutes = Number(newDuration.value)
  if (!startAt || !Number.isFinite(durationMinutes) || durationMinutes <= 0) return ''
  const endAt = new Date(startAt.getTime() + durationMinutes * 60000)
  return `${formatDateParts(startAt)}, ${formatTimeParts(startAt)}–${formatTimeParts(endAt)}`
})
const datePickerMonthDate = computed(() => {
  const parsed = parseDateLike(datePickerMonth.value) || new Date()
  return new Date(parsed.getFullYear(), parsed.getMonth(), 1)
})
const datePickerMonthLabel = computed(() => {
  const month = datePickerMonthDate.value.getMonth()
  const year = datePickerMonthDate.value.getFullYear()
  return `${MONTHS_UK[month] || ''} ${year}`
})
const datePickerDays = computed(() => {
  const monthStart = datePickerMonthDate.value
  const gridStart = new Date(monthStart)
  const day = gridStart.getDay()
  const mondayOffset = day === 0 ? -6 : 1 - day
  gridStart.setDate(gridStart.getDate() + mondayOffset)

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart)
    date.setDate(gridStart.getDate() + index)
    const iso = toDateInputValue(date)
    return {
      iso,
      label: String(date.getDate()),
      inMonth: date.getMonth() === monthStart.getMonth(),
      isToday: iso === todayKey,
    }
  })
})

function selectDay(key: string) {
  selectedDate.value = key
  showPastSlots.value = false
}

function setScheduleTab(tab: ScheduleTab) {
  scheduleTab.value = tab
  closeDatePicker()
  if (tab === 'CALENDAR') {
    createFormOpen.value = false
    selectedSlotId.value = null
    clearSelectedAvailabilitySlots()
    return
  }
  if (tab === 'SETTINGS') {
    createFormOpen.value = false
    selectedSlotId.value = null
    selectedSessionId.value = null
    clearSelectedAvailabilitySlots()
    return
  }
  selectedSessionId.value = null
}

watch(
  () => [route.path, route.query.tab],
  () => {
    setScheduleTab(scheduleTabFromRoute())
  }
)

watch([slots, selectedWeekStart], () => {
  pruneSelectedAvailabilitySlots()
})

function getDatePickerFieldValue(field: DatePickerField) {
  if (field === 'newStartDate') return newStartDate.value
  if (field === 'regularStartsOn') return regularStartsOn.value
  return editStartDate.value
}

function setDatePickerFieldValue(field: DatePickerField, value: string) {
  if (field === 'newStartDate') {
    newStartDate.value = value
    return
  }
  if (field === 'editStartDate') {
    editStartDate.value = value
  }
  if (field === 'regularStartsOn') {
    regularStartsOn.value = value
    const isoDate = displayDateToIso(value)
    const weekday = isoDate ? regularTimeWeekdayFromIso(isoDate) : null
    if (weekday !== null) regularWeekday.value = weekday
  }
}

function openDatePickerFor(field: DatePickerField) {
  activeDatePicker.value = field
  const fieldIso = displayDateToIso(getDatePickerFieldValue(field))
  const fallbackIso = fieldIso || selectedDate.value || todayKey
  const parsed = parseDateLike(fallbackIso) || new Date()
  datePickerMonth.value = toDateInputValue(new Date(parsed.getFullYear(), parsed.getMonth(), 1))
}

function shiftDatePickerMonth(direction: number) {
  const current = datePickerMonthDate.value
  datePickerMonth.value = toDateInputValue(new Date(current.getFullYear(), current.getMonth() + direction, 1))
}

function selectDateFromPicker(isoDate: string) {
  if (!activeDatePicker.value) return
  setDatePickerFieldValue(activeDatePicker.value, isoDateToDisplay(isoDate))
  activeDatePicker.value = null
}

function closeDatePicker() {
  activeDatePicker.value = null
}

function handleDocumentPointerDown(event: PointerEvent) {
  if (!activeDatePicker.value) return
  const target = event.target
  if (target instanceof Element && target.closest('.date-input-shell')) return
  closeDatePicker()
}

function handleDocumentKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') closeDatePicker()
}

function isDatePickerDaySelected(isoDate: string) {
  if (!activeDatePicker.value) return false
  return displayDateToIso(getDatePickerFieldValue(activeDatePicker.value)) === isoDate
}

function moveWeekToDate(value: string | Date) {
  const parsed = parseDateLike(value)
  if (!parsed) return
  selectedWeekStart.value = toDateInputValue(startOfWeek(parsed))
}

function shiftWeek(direction: number) {
  const next = new Date(weekStartDate.value)
  next.setDate(next.getDate() + direction * 7)
  selectedWeekStart.value = toDateInputValue(next)
  selectedDate.value = selectedWeekStart.value
  selectedSlotId.value = null
  selectedSessionId.value = null
  showPastSlots.value = false
  pruneSelectedAvailabilitySlots()
  void loadWeekSessions()
}

function goToToday() {
  moveWeekToDate(new Date())
  selectedDate.value = todayKey
  selectedSlotId.value = null
  selectedSessionId.value = null
  showPastSlots.value = false
  pruneSelectedAvailabilitySlots()
  void loadWeekSessions()
}

function formatHourLabel(hour: number) {
  return `${pad2(hour)}:00`
}

function slotDurationMinutes(slot: Slot) {
  const start = parseDateLike(slot.start_at)
  const end = parseDateLike(slot.end_at)
  if (!start || !end) return 0
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000))
}

function slotMinuteRangeForDate(slot: Slot, dateKey: string) {
  const start = parseDateLike(slot.start_at)
  const end = parseDateLike(slot.end_at)
  if (!start || !end) return null

  const startKey = toLocalDateKey(slot.start_at)
  const endKey = toLocalDateKey(slot.end_at)
  const startMinutes = startKey < dateKey ? 0 : start.getHours() * 60 + start.getMinutes()
  let endMinutes = endKey > dateKey ? 24 * 60 : end.getHours() * 60 + end.getMinutes()

  if (endKey < dateKey) {
    endMinutes = 0
  }

  if (endMinutes <= startMinutes) {
    endMinutes = Math.min(24 * 60, startMinutes + slotDurationMinutes(slot))
  }

  return {
    startMinutes,
    endMinutes,
  }
}

function sessionMinuteRangeForDate(session: ScheduleSession, dateKey: string) {
  const startAt = sessionStartAt(session)
  const endAt = sessionEndAt(session)
  const start = parseDateLike(startAt)
  const end = parseDateLike(endAt)
  if (!start || !end) return null

  const startKey = toLocalDateKey(startAt)
  const endKey = toLocalDateKey(endAt)
  const startMinutes = startKey < dateKey ? 0 : start.getHours() * 60 + start.getMinutes()
  let endMinutes = endKey > dateKey ? 24 * 60 : end.getHours() * 60 + end.getMinutes()

  if (endKey < dateKey) {
    endMinutes = 0
  }

  if (endMinutes <= startMinutes) {
    endMinutes = Math.min(24 * 60, startMinutes + sessionDurationMinutes(session))
  }

  return {
    startMinutes,
    endMinutes,
  }
}

function positionedSlotsForDay(dateKey: string): CalendarSlotLayout[] {
  const rangeStartMinutes = calendarHourRange.value.startHour * 60
  const rangeEndMinutes = calendarHourRange.value.endHour * 60
  const pxPerMinute = CALENDAR_HOUR_HEIGHT / 60
  const activeLanes: Array<{ endMinutes: number; lane: number }> = []

  const layouts = visibleWeekSlots.value
    .filter((slot) => toLocalDateKey(slot.start_at) === dateKey)
    .map((slot) => {
      const range = slotMinuteRangeForDate(slot, dateKey)
      if (!range) return null
      const clippedStart = Math.max(rangeStartMinutes, range.startMinutes)
      const clippedEnd = Math.min(rangeEndMinutes, range.endMinutes)
      if (clippedEnd <= clippedStart) return null
      return {
        slot,
        startMinutes: clippedStart,
        endMinutes: clippedEnd,
        durationMinutes: slotDurationMinutes(slot),
        clippedDurationMinutes: clippedEnd - clippedStart,
      }
    })
    .filter((layout): layout is {
      slot: Slot
      startMinutes: number
      endMinutes: number
      durationMinutes: number
      clippedDurationMinutes: number
    } => Boolean(layout))
    .sort((a, b) => a.startMinutes - b.startMinutes || a.endMinutes - b.endMinutes)
    .map((layout) => {
      for (let index = activeLanes.length - 1; index >= 0; index -= 1) {
        const activeLane = activeLanes[index]
        if (activeLane && activeLane.endMinutes <= layout.startMinutes) {
          activeLanes.splice(index, 1)
        }
      }

      const usedLanes = new Set(activeLanes.map((lane) => lane.lane))
      let lane = 0
      while (usedLanes.has(lane)) lane += 1
      activeLanes.push({ endMinutes: layout.endMinutes, lane })

      return {
        slot: layout.slot,
        top: (layout.startMinutes - rangeStartMinutes) * pxPerMinute,
        height: Math.max(MIN_CALENDAR_SLOT_HEIGHT, layout.clippedDurationMinutes * pxPerMinute),
        lane,
        laneCount: 1,
        durationMinutes: layout.durationMinutes,
        clippedDurationMinutes: layout.clippedDurationMinutes,
        topMinutes: layout.startMinutes - rangeStartMinutes,
      }
    })

  const laneCount = Math.max(1, ...layouts.map((layout) => layout.lane + 1))
  return layouts.map((layout) => ({ ...layout, laneCount }))
}

function positionedCalendarSessionsForDay(dateKey: string): CalendarSessionLayout[] {
  const rangeStartMinutes = calendarHourRange.value.startHour * 60
  const rangeEndMinutes = calendarHourRange.value.endHour * 60
  const pxPerMinute = CALENDAR_HOUR_HEIGHT / 60
  const activeLanes: Array<{ endMinutes: number; lane: number }> = []

  const layouts = visibleWeekCalendarSessions.value
    .filter((session) => toLocalDateKey(sessionStartAt(session)) === dateKey)
    .map((session) => {
      const range = sessionMinuteRangeForDate(session, dateKey)
      if (!range) return null
      const clippedStart = Math.max(rangeStartMinutes, range.startMinutes)
      const clippedEnd = Math.min(rangeEndMinutes, range.endMinutes)
      if (clippedEnd <= clippedStart) return null
      return {
        session,
        startMinutes: clippedStart,
        endMinutes: clippedEnd,
        durationMinutes: sessionDurationMinutes(session),
        clippedDurationMinutes: clippedEnd - clippedStart,
      }
    })
    .filter((layout): layout is {
      session: ScheduleSession
      startMinutes: number
      endMinutes: number
      durationMinutes: number
      clippedDurationMinutes: number
    } => Boolean(layout))
    .sort((a, b) => a.startMinutes - b.startMinutes || a.endMinutes - b.endMinutes)
    .map((layout) => {
      for (let index = activeLanes.length - 1; index >= 0; index -= 1) {
        const activeLane = activeLanes[index]
        if (activeLane && activeLane.endMinutes <= layout.startMinutes) {
          activeLanes.splice(index, 1)
        }
      }

      const usedLanes = new Set(activeLanes.map((lane) => lane.lane))
      let lane = 0
      while (usedLanes.has(lane)) lane += 1
      activeLanes.push({ endMinutes: layout.endMinutes, lane })

      return {
        session: layout.session,
        top: (layout.startMinutes - rangeStartMinutes) * pxPerMinute,
        height: Math.max(MIN_CALENDAR_SLOT_HEIGHT, layout.clippedDurationMinutes * pxPerMinute),
        lane,
        laneCount: 1,
        durationMinutes: layout.durationMinutes,
        clippedDurationMinutes: layout.clippedDurationMinutes,
        topMinutes: layout.startMinutes - rangeStartMinutes,
      }
    })

  const laneCount = Math.max(1, ...layouts.map((layout) => layout.lane + 1))
  return layouts.map((layout) => ({ ...layout, laneCount }))
}

function calendarSlotStyle(layout: CalendarSlotLayout | CalendarSessionLayout) {
  const laneWidth = 100 / layout.laneCount
  return {
    top: `${layout.top}px`,
    height: `${layout.height}px`,
    left: `calc(${layout.lane * laneWidth}% + 3px)`,
    width: `calc(${laneWidth}% - 6px)`,
  }
}

function formatSlotTimeRange(slot: Slot) {
  const start = parseDateLike(slot.start_at)
  const end = parseDateLike(slot.end_at)
  if (!start || !end) return formatDate(slot.start_at)
  return `${formatTimeParts(start)}–${formatTimeParts(end)}`
}

function slotStatusLabel(slot: Slot) {
  if (!isFutureSlot(slot)) return 'Минуло'
  return slot.is_booked ? 'Заброньовано' : 'Доступно'
}

function slotStatusClass(slot: Slot) {
  return {
    'slot-status--booked': slot.is_booked && isFutureSlot(slot),
    'slot-status--past': !isFutureSlot(slot),
    'slot-status--available': !slot.is_booked && isFutureSlot(slot),
  }
}

function scheduleEventClass(event: ScheduleSession) {
  return {
    'schedule-event--available': event.type === 'available_slot',
    'schedule-event--booked': event.type === 'booked_slot' && !isSessionBackedBookedEvent(event),
    'calendar-session': event.type === 'session' || isSessionBackedBookedEvent(event),
    'mobile-slot--session': event.type === 'session' || isSessionBackedBookedEvent(event),
  }
}

function scheduleEventStatusClass(event: ScheduleSession) {
  return {
    'slot-status--available': event.type === 'available_slot',
    'slot-status--booked': event.type === 'booked_slot' && !isSessionBackedBookedEvent(event),
    'slot-status--session': event.type === 'session' || isSessionBackedBookedEvent(event),
  }
}

function selectSlot(slot: Slot) {
  selectedSlotId.value = slot.id
  selectedSessionId.value = null
  selectedDate.value = toLocalDateKey(slot.start_at)
}

function canDeleteAvailabilitySlot(slot: Slot) {
  return !slot.is_booked
}

function isAvailabilitySlotSelected(slotId: number) {
  return selectedAvailabilitySlotIds.value.includes(slotId)
}

function isSlotDeleting(slotId: number) {
  return deletingSlotIds.value.includes(slotId)
}

function availabilitySlotSelectionLabel(slot: Slot) {
  const action = isAvailabilitySlotSelected(slot.id) ? 'Прибрати з вибраних' : 'Вибрати слот'
  return `${action} ${formatSlotTimeRange(slot)}`
}

function toggleAvailabilitySlotSelection(slot: Slot) {
  if (!canDeleteAvailabilitySlot(slot) || deleteActionLoading.value) return
  selectSlot(slot)
  if (isAvailabilitySlotSelected(slot.id)) {
    selectedAvailabilitySlotIds.value = selectedAvailabilitySlotIds.value.filter((id) => id !== slot.id)
    return
  }
  selectedAvailabilitySlotIds.value = [...selectedAvailabilitySlotIds.value, slot.id]
}

function clearSelectedAvailabilitySlots() {
  selectedAvailabilitySlotIds.value = []
}

function pruneSelectedAvailabilitySlots() {
  if (selectedAvailabilitySlotIds.value.length === 0) return
  const allowedIds = new Set(unbookedVisibleWeekSlots.value.map((slot) => slot.id))
  selectedAvailabilitySlotIds.value = selectedAvailabilitySlotIds.value.filter((id) => allowedIds.has(id))
}

function removeSlotsFromState(slotIds: number[]) {
  const removedIds = new Set(slotIds)
  slots.value = slots.value.filter((slot) => !removedIds.has(slot.id))
  selectedAvailabilitySlotIds.value = selectedAvailabilitySlotIds.value.filter((id) => !removedIds.has(id))
  if (selectedSlotId.value !== null && removedIds.has(selectedSlotId.value)) selectedSlotId.value = null
}

function addDeletingSlotId(slotId: number) {
  if (deletingSlotIds.value.includes(slotId)) return
  deletingSlotIds.value = [...deletingSlotIds.value, slotId]
}

function removeDeletingSlotId(slotId: number) {
  deletingSlotIds.value = deletingSlotIds.value.filter((id) => id !== slotId)
}

function selectedAvailabilityDeleteTargets() {
  const requestedIds = new Set(selectedAvailabilitySlotIds.value)
  return unbookedVisibleWeekSlots.value.filter((slot) => requestedIds.has(slot.id))
}

async function deleteAvailabilitySlotsById(slotIds: number[]) {
  for (const slotId of slotIds) {
    await apiDelete(`/cabinet/slots/${slotId}/`)
  }
}

function selectSession(session: ScheduleSession) {
  selectedSessionId.value = session.id
  selectedSlotId.value = null
  selectedDate.value = toLocalDateKey(sessionStartAt(session))
}

async function openCreateForm() {
  createFormOpen.value = true
  if (!newStartDate.value) newStartDate.value = isoDateToDisplay(selectedDate.value || todayKey)
  if (!newStartTime.value) newStartTime.value = '09:00'
  await nextTick()
  if (typeof createFormRef.value?.scrollIntoView === 'function') {
    createFormRef.value.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  const firstInput = createFormRef.value?.querySelector('input')
  if (firstInput instanceof HTMLInputElement) {
    firstInput.focus()
  }
}

function closeCreateForm() {
  closeDatePicker()
  createFormOpen.value = false
}

function listFromResponse<T>(response: ListResponse<T>): T[] {
  if (Array.isArray(response)) return response
  if (Array.isArray(response?.results)) return response.results
  return []
}

function clientOptionLabel(value: RegisteredClientRecord | ManualClientRecord) {
  const source = value as RegisteredClientRecord & ManualClientRecord
  return (
    source.client_display_name ||
    source.display_name ||
    source.client_name ||
    source.client_username ||
    source.client_email ||
    `Клієнт #${source.id}`
  )
}

function normalizeRegularClientOptions(
  manualRecords: ManualClientRecord[],
  registeredClients: RegisteredClientRecord[]
) {
  const options = new Map<number, RegularClientOption>()
  manualRecords
    .filter((record) => String(record.status || 'active').toLowerCase() !== 'archived' && !record.archived_at)
    .forEach((record) => {
      const recordId = Number(record.id || 0)
      if (recordId > 0) {
        options.set(recordId, {
          recordId,
          label: clientOptionLabel(record),
        })
      }
    })
  registeredClients
    .filter((client) => String(client.state || '').toUpperCase() !== 'ARCHIVED')
    .forEach((client) => {
      const recordId = Number(client.client_record_id || 0)
      if (recordId > 0 && !options.has(recordId)) {
        options.set(recordId, {
          recordId,
          label: clientOptionLabel(client),
        })
      }
    })
  return Array.from(options.values()).sort((a, b) => a.label.localeCompare(b.label, 'uk'))
}

async function loadRegularClientOptions() {
  regularClientsLoading.value = true
  regularSessionsError.value = ''
  try {
    const [manualResp, registeredResp] = await Promise.all([
      apiGet<ListResponse<ManualClientRecord>>('/cabinet/client-records/'),
      apiGet<ListResponse<RegisteredClientRecord>>('/cabinet/clients/'),
    ])
    regularClientOptions.value = normalizeRegularClientOptions(
      listFromResponse(manualResp),
      listFromResponse(registeredResp)
    )
    regularClientsLoaded.value = true
    if (
      regularClientOptions.value.length > 0 &&
      !regularClientOptions.value.some((option) => option.recordId === regularClientRecordId.value)
    ) {
      regularClientRecordId.value = regularClientOptions.value[0]?.recordId ?? ''
    }
  } catch (err) {
    regularSessionsError.value = getApiErrorMessage(err, 'Не вдалося завантажити клієнтів.')
  } finally {
    regularClientsLoading.value = false
  }
}

function resetRegularSessionsForm() {
  const baseDate = selectedDate.value || todayKey
  regularClientRecordId.value = regularClientOptions.value[0]?.recordId ?? ''
  regularWeekday.value = regularTimeWeekdayFromIso(baseDate) ?? 0
  regularStartTime.value = '09:00'
  regularDuration.value = 50
  regularFrequency.value = 'weekly'
  regularSessionFormat.value = 'online'
  regularStartsOn.value = isoDateToDisplay(baseDate)
  regularMeetingUrl.value = ''
  regularOfflineLocation.value = ''
  regularSessionsError.value = ''
}

async function openRegularSessionsModal() {
  regularSessionsModalOpen.value = true
  oneOffSessionModalOpen.value = false
  createFormOpen.value = false
  closeDatePicker()
  if (!regularClientsLoaded.value) {
    await loadRegularClientOptions()
  }
  resetRegularSessionsForm()
  await nextTick()
  const firstControl = regularSessionsFormRef.value?.querySelector('select, input')
  if (firstControl instanceof HTMLElement) {
    firstControl.focus()
  }
}

function closeRegularSessionsModal() {
  closeDatePicker()
  regularSessionsModalOpen.value = false
  regularSessionsError.value = ''
}

function resetOneOffSessionForm(prefill?: OneOffSessionPrefill) {
  const baseDate = selectedDate.value || todayKey
  oneOffClientRecordId.value = regularClientOptions.value[0]?.recordId ?? ''
  oneOffDate.value = isoDateToDisplay(prefill?.dateKey || baseDate)
  oneOffStartTime.value = normalizeOneOffStartTimeOption(prefill?.startTime || '09:00') || '09:00'
  oneOffDuration.value = oneOffDuration.value > 0 ? oneOffDuration.value : 50
  oneOffSessionFormat.value = 'online'
  oneOffMeetingUrl.value = ''
  oneOffOfflineLocation.value = ''
  oneOffSessionError.value = ''
}

function oneOffSessionErrorCode(err: unknown): string {
  const data = (err as any)?.response?.data || {}
  const candidates = [
    data.code,
    data.reason_code,
    data.detail?.code,
    data.detail,
    Array.isArray(data.timezone) ? data.timezone[0] : '',
    Array.isArray(data.non_field_errors) ? data.non_field_errors[0] : '',
  ]
  return candidates.map((item) => String(item || '').trim().toUpperCase()).find(Boolean) || ''
}

function oneOffSessionRawErrorText(err: unknown): string {
  const data = (err as { response?: { data?: unknown } })?.response?.data
  if (data && typeof data === 'object' && 'detail' in data) {
    const detail = (data as { detail?: unknown }).detail
    if (Array.isArray(detail)) return String(detail[0] || '').trim()
    if (typeof detail === 'string') return detail.trim()
  }
  if (typeof data === 'string') return data.trim()
  const message = (err as { message?: unknown })?.message
  return typeof message === 'string' ? message.trim() : ''
}

function stripTechnicalErrorPrefix(message: string) {
  return String(message || '').trim().replace(/^detail:\s*/i, '')
}

function isPastSessionTimeErrorText(message: string) {
  const compact = stripTechnicalErrorPrefix(message).toLowerCase().replace(/\s+/g, ' ')
  return compact === 'session time is in the past.' || compact === 'session time is in the past'
}

function oneOffSessionCreateErrorMessage(err: unknown): string {
  const rawText = oneOffSessionRawErrorText(err)
  if (isPastSessionTimeErrorText(rawText)) {
    return PAST_SESSION_TIME_ERROR_MESSAGE
  }
  const code = oneOffSessionErrorCode(err)
  const messages: Record<string, string> = {
    CLIENT_RECORD_ARCHIVED: 'Картку клієнта архівовано. Спершу відновіть її.',
    MANUAL_SESSION_TIME_CONFLICT: 'Не вдалося створити сесію: цей час перетинається з іншою сесією або недоступністю.',
    SESSION_OVERLAP: 'Не вдалося створити сесію: цей час перетинається з іншою сесією або недоступністю.',
    MANUAL_SESSION_IN_PAST: 'Не можна створити сесію в минулому.',
    MANUAL_SESSION_TIME_RANGE_INVALID: 'Час завершення має бути пізніше за час початку.',
    MANUAL_SESSION_TIMEZONE_INVALID:
      'Не вдалося створити сесію: некоректний часовий пояс. Оновіть сторінку або перевірте налаштування профілю.',
    MANUAL_SESSION_TIMEZONE_REQUIRED:
      'Не вдалося створити сесію: некоректний часовий пояс. Оновіть сторінку або перевірте налаштування профілю.',
    MANUAL_SESSION_TIME_REQUIRED: 'Вкажіть дату, час початку та завершення сесії.',
    'INVALID TIMEZONE.':
      'Не вдалося створити сесію: некоректний часовий пояс. Оновіть сторінку або перевірте налаштування профілю.',
    'THIS FIELD MAY NOT BE BLANK.':
      'Не вдалося створити сесію: некоректний часовий пояс. Оновіть сторінку або перевірте налаштування профілю.',
  }
  return messages[code] || stripTechnicalErrorPrefix(getApiErrorMessage(err, 'Не вдалося створити сесію.'))
}

async function loadOneOffProfileDefaults() {
  if (oneOffProfileLoaded.value) return
  try {
    const profile = await fetchSpecialistProfile()
    applyOneOffProfileDefaults(profile)
  } catch {
    oneOffDuration.value = 50
  } finally {
    oneOffProfileLoaded.value = true
  }
}

function applyOneOffProfileDefaults(profile: Pick<SpecialistProfile, 'standard_session_duration_minutes'> & { timezone?: string | null }) {
  const duration = Number(profile.standard_session_duration_minutes)
  const profileTimezone = normalizeOneOffTimezone(String(profile.timezone || '').trim())
  if (Number.isFinite(duration) && duration > 0 && duration <= 480) {
    oneOffDuration.value = Math.round(duration)
  }
  if (profileTimezone) {
    oneOffProfileTimezone.value = profileTimezone
  }
}

function normalizePublicBookingMode(value: unknown): PublicBookingMode {
  return value === 'direct_booking' ? 'direct_booking' : 'request_only'
}

function normalizePublicBookingLeadTime(value: unknown): number {
  const parsed = Number(value)
  return publicBookingLeadTimeOptions.includes(parsed) ? parsed : 24
}

function normalizePublicBookingHorizon(value: unknown): number {
  const parsed = Number(value)
  return publicBookingHorizonOptions.includes(parsed) ? parsed : 14
}

function applyPublicBookingSettings(profile: Partial<SpecialistProfile>) {
  publicBookingMode.value = normalizePublicBookingMode(profile.public_booking_mode)
  showPublicAvailability.value = Boolean(profile.show_public_availability)
  publicBookingMinLeadTimeHours.value = normalizePublicBookingLeadTime(
    profile.public_booking_min_lead_time_hours
  )
  publicBookingHorizonDays.value = normalizePublicBookingHorizon(profile.public_booking_horizon_days)
  publicBookingRequiresConfirmation.value = profile.public_booking_requires_confirmation !== false
}

function onPublicBookingConfirmationChange(event: Event) {
  const target = event.target
  if (!(target instanceof HTMLSelectElement)) return
  publicBookingRequiresConfirmation.value = target.value === 'required'
}

async function loadPublicBookingSettings() {
  settingsLoading.value = true
  settingsError.value = ''
  try {
    const profile = await fetchSpecialistProfile()
    applyPublicBookingSettings(profile)
    applyOneOffProfileDefaults(profile)
    oneOffProfileLoaded.value = true
    settingsLoaded.value = true
  } catch (err) {
    settingsError.value = getApiErrorMessage(err, 'Не вдалося завантажити налаштування профілю.')
  } finally {
    settingsLoading.value = false
  }
}

async function savePublicBookingSettings() {
  settingsSaving.value = true
  settingsError.value = ''
  try {
    const updatedProfile = await updateSpecialistProfile({
      public_booking_mode: publicBookingMode.value,
      show_public_availability:
        publicBookingMode.value === 'direct_booking' ? showPublicAvailability.value : false,
      public_booking_min_lead_time_hours: publicBookingMinLeadTimeHours.value,
      public_booking_horizon_days: publicBookingHorizonDays.value,
      public_booking_requires_confirmation: publicBookingRequiresConfirmation.value,
    })
    applyPublicBookingSettings(updatedProfile)
    settingsLoaded.value = true
    toast.success('Налаштування публічного запису збережено.')
  } catch (err) {
    settingsError.value = getApiErrorMessage(err, 'Не вдалося зберегти налаштування публічного запису.')
  } finally {
    settingsSaving.value = false
  }
}

function calendarClickStartTime(event: MouseEvent) {
  const target = event.currentTarget
  if (!(target instanceof HTMLElement)) return '09:00'
  const rect = target.getBoundingClientRect()
  const offsetY = Math.min(Math.max(event.clientY - rect.top, 0), Math.max(0, rect.height - 1))
  const hourOffset = Math.floor(offsetY / CALENDAR_HOUR_HEIGHT)
  const rawHour = calendarHourRange.value.startHour + hourOffset
  const hour = Math.min(Math.max(rawHour, calendarHourRange.value.startHour), calendarHourRange.value.endHour - 1)
  return `${pad2(hour)}:00`
}

async function openOneOffSessionModal(prefill?: OneOffSessionPrefill) {
  oneOffSessionModalOpen.value = true
  regularSessionsModalOpen.value = false
  createFormOpen.value = false
  closeDatePicker()
  oneOffSessionLoading.value = true
  oneOffSessionError.value = ''
  try {
    if (!regularClientsLoaded.value) {
      await loadRegularClientOptions()
      if (regularSessionsError.value) {
        oneOffSessionError.value = regularSessionsError.value
      }
    }
    await loadOneOffProfileDefaults()
    oneOffTimezone.value = resolvedOneOffTimezone()
    resetOneOffSessionForm(prefill)
    await nextTick()
  } finally {
    oneOffSessionLoading.value = false
  }
}

function openOneOffSessionModalForCalendarClick(event: MouseEvent, dateKey: string) {
  selectedDate.value = dateKey
  selectedSlotId.value = null
  selectedSessionId.value = null
  void openOneOffSessionModal({
    dateKey,
    startTime: calendarClickStartTime(event),
  })
}

function forceCloseOneOffSessionModal(options?: { reset?: boolean }) {
  oneOffSessionModalOpen.value = false
  oneOffSessionError.value = ''
  if (options?.reset) {
    resetOneOffSessionForm()
  }
}

function closeOneOffSessionModal() {
  if (oneOffSessionSaving.value) return
  forceCloseOneOffSessionModal()
}

async function createOneOffSession() {
  const recordId = Number(oneOffClientRecordId.value || 0)
  if (!timeOptions.includes(oneOffStartTime.value)) {
    showOneOffSessionError('Оберіть час початку.')
    return
  }
  const startsAt = parseUkDateTime(oneOffDate.value, oneOffStartTime.value)
  const duration = Number(oneOffDuration.value)
  if (recordId <= 0) {
    showOneOffSessionError('Оберіть клієнта.')
    return
  }
  if (!startsAt) {
    showOneOffSessionError('Вкажіть дату та час початку у форматі ДД.ММ.РРРР і ГГ:ХХ.')
    return
  }
  if (isPastDateTime(startsAt)) {
    showOneOffSessionError(PAST_SESSION_TIME_ERROR_MESSAGE)
    return
  }
  if (!Number.isFinite(duration) || duration <= 0) {
    showOneOffSessionError('Вкажіть тривалість у хвилинах.')
    return
  }
  const endsAt = new Date(startsAt.getTime() + duration * 60000)

  oneOffSessionSaving.value = true
  oneOffSessionError.value = ''
  try {
    await apiPost<OneOffSessionCreateResponse>(`/cabinet/client-records/${recordId}/sessions/`, {
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      timezone: resolvedOneOffTimezone(),
      session_format: oneOffSessionFormat.value,
      meeting_url: oneOffMeetingUrl.value.trim(),
      offline_location: oneOffOfflineLocation.value.trim(),
    })
    oneOffSessionSaving.value = false
    forceCloseOneOffSessionModal({ reset: true })
    toast.success('Сесію створено.')
    try {
      await loadSlots()
    } catch {
      // Best-effort refresh: keep successful creation state and closed modal.
    }
  } catch (err) {
    showOneOffSessionError(oneOffSessionCreateErrorMessage(err))
  } finally {
    oneOffSessionSaving.value = false
  }
}

function regularSessionsPayload(): ClientRegularTimePayload | null {
  const startsOn = displayDateToIso(regularStartsOn.value)
  const duration = Number(regularDuration.value)
  if (!regularClientRecordId.value) {
    regularSessionsError.value = 'Оберіть клієнта.'
    return null
  }
  if (regularWeekday.value < 0 || regularWeekday.value > 6) {
    regularSessionsError.value = 'Оберіть день тижня.'
    return null
  }
  if (!regularStartTime.value) {
    regularSessionsError.value = 'Вкажіть час початку.'
    return null
  }
  if (!Number.isFinite(duration) || duration <= 0) {
    regularSessionsError.value = 'Вкажіть тривалість у хвилинах.'
    return null
  }
  if (!startsOn) {
    regularSessionsError.value = 'Вкажіть дату початку у форматі ДД.ММ.РРРР.'
    return null
  }
  if (regularTimeWeekdayFromIso(startsOn) !== regularWeekday.value) {
    regularSessionsError.value = 'Дата початку має відповідати обраному дню тижня.'
    return null
  }
  return {
    weekday: regularWeekday.value,
    start_time: regularStartTime.value,
    duration_minutes: duration,
    frequency: regularFrequency.value,
    starts_on: startsOn,
    session_format: regularSessionFormat.value,
    meeting_url: regularMeetingUrl.value.trim(),
    offline_location: regularOfflineLocation.value.trim(),
  }
}

function regularTimeErrorCode(err: unknown): string {
  const data = (err as any)?.response?.data || {}
  const candidates = [
    data.code,
    data.reason_code,
    data.detail?.code,
    data.detail,
    Array.isArray(data.non_field_errors) ? data.non_field_errors[0] : '',
  ]
  return candidates.map((item) => String(item || '').trim().toUpperCase()).find(Boolean) || ''
}

function regularTimeCreateErrorMessage(err: unknown) {
  const code = regularTimeErrorCode(err)
  const messages: Record<string, string> = {
    CLIENT_RECORD_ARCHIVED: 'Картку клієнта архівовано. Спершу відновіть її.',
    CLIENT_REGULAR_TIME_DUPLICATE: 'Такий регулярний час уже додано для цього клієнта.',
    CLIENT_REGULAR_TIME_ANCHOR_MISMATCH: 'Дата початку має відповідати обраному дню тижня.',
    SESSION_TIME_CONFLICT: 'На цей час уже є інша сесія.',
    CLIENT_TIME_CONFLICT: 'У клієнта вже є сесія на цей час.',
    CLIENT_RECORD_TIME_CONFLICT: 'У цій картці клієнта вже є сесія на цей час.',
    AVAILABILITY_EXCEPTION_CONFLICT: 'Цей час позначений як недоступний.',
    SESSION_FORMAT_INVALID: 'Некоректний формат зустрічі.',
  }
  return messages[code] || getApiErrorMessage(err, 'Не вдалося додати регулярні сесії. Перевірте дані й спробуйте ще раз.')
}

async function createRegularSessions() {
  const payload = regularSessionsPayload()
  if (!payload || !regularClientRecordId.value) return
  regularSessionsSaving.value = true
  regularSessionsError.value = ''
  try {
    await createClientRegularTime(Number(regularClientRecordId.value), payload)
    const startsOn = parseDateLike(payload.starts_on)
    if (startsOn) {
      selectedDate.value = toDateInputValue(startsOn)
      moveWeekToDate(startsOn)
    }
    selectedSlotId.value = null
    selectedSessionId.value = null
    showPastSlots.value = false
    closeRegularSessionsModal()
    await loadSlots()
    toast.success('Регулярні сесії додано.')
  } catch (err) {
    regularSessionsError.value = regularTimeCreateErrorMessage(err)
  } finally {
    regularSessionsSaving.value = false
  }
}

async function fetchWeekSessions(range: WeekRange) {
  const resp = await getCabinetSchedule(range.dateFrom, range.dateTo)
  return (resp.events || []).filter((event) => sessionStartAt(event) && sessionEndAt(event))
}

async function loadWeekSessions(options: { clear?: boolean } = {}) {
  const requestedRange = visibleWeekRange()
  if (!requestedRange) return
  const requestId = ++scheduleLoadRequestId
  if (options.clear) {
    sessions.value = []
  }
  try {
    const nextSessions = await fetchWeekSessions(requestedRange)
    if (requestId !== scheduleLoadRequestId) return
    if (!isSameWeekRange(requestedRange, visibleWeekRange())) return
    sessions.value = nextSessions
  } catch (err: any) {
    if (requestId !== scheduleLoadRequestId) return
    error.value = getBookingErrorMessage(err, 'Не вдалося завантажити сесії')
  }
}

async function loadSlots() {
  loading.value = true
  error.value = ''
  try {
    const requestedScheduleRange = visibleWeekRange()
    const [slotResp, sessionResp] = await Promise.all([
      apiGet<Slot[]>('/cabinet/slots/'),
      requestedScheduleRange ? fetchWeekSessions(requestedScheduleRange) : Promise.resolve([]),
    ])
    slots.value = slotResp || []
    pruneSelectedAvailabilitySlots()
    switchToNearestFutureDateIfNeeded()
    if (isCalendarTab.value) {
      const visibleRange = visibleWeekRange()
      if (isSameWeekRange(requestedScheduleRange, visibleRange)) {
        sessions.value = sessionResp
      } else {
        sessions.value = []
        await loadWeekSessions()
      }
    } else {
      sessions.value = sessionResp
    }
    if (selectedDate.value && getHiddenPastSlotsCount(selectedDate.value) === 0) {
      showPastSlots.value = false
    }
  } catch (err: any) {
    error.value = getBookingErrorMessage(err, '\u041d\u0435 \u0432\u0434\u0430\u043b\u043e\u0441\u044f \u0437\u0430\u0432\u0430\u043d\u0442\u0430\u0436\u0438\u0442\u0438 \u0441\u043b\u043e\u0442\u0438')
  } finally {
    loading.value = false
  }
}

async function createSlot() {
  loading.value = true
  error.value = ''
  try {
    const startAt = parseUkDateTime(newStartDate.value, newStartTime.value)
    const durationMinutes = Number(newDuration.value)
    if (!startAt || !Number.isFinite(durationMinutes) || durationMinutes <= 0) {
      error.value = 'Вкажіть дату, час і тривалість у хвилинах.'
      return
    }
    if (startAt.getTime() < Date.now()) {
      error.value = pastSlotMessage
      return
    }
    const endAt = new Date(startAt.getTime() + durationMinutes * 60000)
    const payload = {
      start_at: startAt.toISOString(),
      end_at: endAt.toISOString(),
    }
    await apiPost<Slot>('/cabinet/slots/', payload)
    closeDatePicker()
    selectedDate.value = toDateInputValue(startAt)
    moveWeekToDate(startAt)
    selectedSessionId.value = null
    showPastSlots.value = false
    await loadSlots()
    newStartDate.value = ''
    newStartTime.value = '09:00'
    newDuration.value = 50
    createFormOpen.value = false
    toast.success(`Вікно для запису на ${formatDateTime(startAt)} створено.`)
  } catch (err: any) {
    error.value = getSlotErrorMessage(err, '\u041d\u0435 \u0432\u0434\u0430\u043b\u043e\u0441\u044f \u0441\u0442\u0432\u043e\u0440\u0438\u0442\u0438 \u0432\u0456\u043b\u044c\u043d\u0435 \u0432\u0456\u043a\u043d\u043e')
    newStartTime.value = ''
  } finally {
    loading.value = false
  }
}

function resetFillAvailabilityForm() {
  fillAvailabilityWeekdays.value = [0, 1, 2, 3, 4]
  fillAvailabilityStartTime.value = '09:00'
  fillAvailabilityEndTime.value = '18:00'
  fillAvailabilityDuration.value = 50
  fillAvailabilityBreak.value = 10
  fillAvailabilityWeeks.value = 1
  fillAvailabilityError.value = ''
}

function showFillAvailabilityError(message: string) {
  fillAvailabilityError.value = message
  void nextTick(() => {
    fillAvailabilityModalContentRef.value?.scrollTo?.({ top: 0, behavior: 'smooth' })
    fillAvailabilityAlertRef.value?.focus()
  })
}

function requestFillWeek() {
  const isoDate = selectedWeekStart.value
  if (!isoDate) {
    error.value = 'Не вдалося визначити вибраний тиждень.'
    return
  }
  resetFillAvailabilityForm()
  fillAvailabilityModalOpen.value = true
  createFormOpen.value = false
  closeDatePicker()
}

function closeFillAvailabilityModal() {
  if (fillAvailabilitySaving.value) return
  fillAvailabilityModalOpen.value = false
  fillAvailabilityError.value = ''
}

function toggleFillAvailabilityWeekday(weekday: number) {
  const current = new Set(fillAvailabilityWeekdays.value)
  if (current.has(weekday)) {
    current.delete(weekday)
  } else {
    current.add(weekday)
  }
  fillAvailabilityWeekdays.value = Array.from(current).sort((a, b) => a - b)
  fillAvailabilityError.value = ''
}

function isFillAvailabilityWeekdaySelected(weekday: number) {
  return fillAvailabilityWeekdays.value.includes(weekday)
}

function validateFillAvailabilityForm() {
  if (fillAvailabilityWeekdays.value.length === 0) {
    return 'Оберіть хоча б один день тижня.'
  }
  const weeks = Number(fillAvailabilityWeeks.value)
  if (!Number.isInteger(weeks) || weeks < 1 || weeks > 12) {
    return 'Кількість тижнів має бути від 1 до 12.'
  }
  const start = timeOptionToMinutes(fillAvailabilityStartTime.value)
  const end = timeOptionToMinutes(fillAvailabilityEndTime.value)
  if (start === null || end === null || start >= end) {
    return 'Кінець робочого дня має бути пізніше за початок.'
  }
  const duration = Number(fillAvailabilityDuration.value)
  if (!fillAvailabilityDurationOptions.includes(duration)) {
    return 'Оберіть коректну тривалість вікна.'
  }
  const breakMinutes = Number(fillAvailabilityBreak.value)
  if (!fillAvailabilityBreakOptions.includes(breakMinutes)) {
    return 'Оберіть коректну перерву між вікнами.'
  }
  if (end - start < duration) {
    return 'Діапазон робочого дня має вміщувати хоча б одне вікно.'
  }
  return ''
}

async function submitFillAvailability() {
  const isoDate = selectedWeekStart.value
  if (!isoDate) {
    showFillAvailabilityError('Не вдалося визначити вибраний тиждень.')
    return
  }
  const validationError = validateFillAvailabilityForm()
  if (validationError) {
    showFillAvailabilityError(validationError)
    return
  }

  fillAvailabilitySaving.value = true
  fillAvailabilityError.value = ''
  try {
    const result = await apiPost<FillAvailabilityResponse>('/cabinet/slots/fill/', {
      date_from: isoDate,
      weeks: Number(fillAvailabilityWeeks.value),
      weekdays: [...fillAvailabilityWeekdays.value],
      start_time: fillAvailabilityStartTime.value,
      end_time: fillAvailabilityEndTime.value,
      slot_duration_minutes: Number(fillAvailabilityDuration.value),
      break_minutes: Number(fillAvailabilityBreak.value),
    })
    selectedDate.value = isoDate
    moveWeekToDate(isoDate)
    selectedSessionId.value = null
    showPastSlots.value = false
    await loadSlots()
    fillAvailabilityModalOpen.value = false
    const createdCount = Number(result?.created_count || 0)
    const skippedCount = Number(result?.skipped_count || 0)
    if (createdCount === 0 && skippedCount > 0) {
      toast.info('Нові вікна для запису не створено. Існуючі або зайняті періоди було пропущено.')
    } else {
      toast.success(`Створено ${createdCount} вікон для запису. Пропущено ${skippedCount}.`)
    }
  } catch {
    showFillAvailabilityError('Не вдалося створити вікна для запису. Перевірте параметри і спробуйте ще раз.')
  } finally {
    fillAvailabilitySaving.value = false
  }
}

function startEdit(slot: Slot) {
  editingId.value = slot.id
  editErrors.value[slot.id] = ''
  const start = new Date(slot.start_at)
  const end = new Date(slot.end_at)
  if (!Number.isNaN(start.getTime())) {
    editStartDate.value = isoDateToDisplay(toDateInputValue(start))
    editStartTime.value = formatUkTime(start)
  }
  if (!Number.isNaN(end.getTime())) {
    const durationMs = end.getTime() - start.getTime()
    editDuration.value = Math.max(15, Math.round(durationMs / 60000))
  }
}

function cancelEdit() {
  if (editingId.value !== null) {
    editErrors.value[editingId.value] = ''
  }
  editingId.value = null
  editStartDate.value = ''
  editStartTime.value = ''
  editDuration.value = 50
}

async function saveEdit(slotId: number) {
  loading.value = true
  error.value = ''
  editErrors.value[slotId] = ''
  const currentScroll = window.scrollY
  const htmlStyle = document.documentElement.style
  const bodyStyle = document.body.style
  const prevScrollBehavior = htmlStyle.scrollBehavior
  const prevBodyPosition = bodyStyle.position
  const prevBodyTop = bodyStyle.top
  const prevBodyWidth = bodyStyle.width
  htmlStyle.scrollBehavior = 'auto'
  bodyStyle.position = 'fixed'
  bodyStyle.top = `-${currentScroll}px`
  bodyStyle.width = '100%'
  try {
    const startAt = parseUkDateTime(editStartDate.value, editStartTime.value)
    const durationMinutes = Number(editDuration.value)
    if (!startAt || !Number.isFinite(durationMinutes) || durationMinutes <= 0) {
      error.value = 'Вкажіть дату, час і тривалість у хвилинах.'
      return
    }
    if (startAt.getTime() < Date.now()) {
      editErrors.value[slotId] = pastSlotMessage
      await nextTick()
      const errorEl = editErrorRefs.value[slotId]
      if (errorEl) {
        errorEl.scrollIntoView({ block: 'nearest' })
      }
      return
    }
    const endAt = new Date(startAt.getTime() + durationMinutes * 60000)
    const payload = {
      start_at: startAt.toISOString(),
      end_at: endAt.toISOString(),
    }
    const resp = await apiPatch<Slot>(`/cabinet/slots/${slotId}/`, payload)
    slots.value = slots.value.map((slot) => (slot.id === slotId ? resp : slot))
    selectedDate.value = toLocalDateKey(resp.start_at)
    moveWeekToDate(resp.start_at)
    selectedSessionId.value = null
    cancelEdit()
  } catch (err: any) {
    editErrors.value[slotId] =
      getSlotErrorMessage(err, '\u041d\u0435 \u0432\u0434\u0430\u043b\u043e\u0441\u044f \u043e\u043d\u043e\u0432\u0438\u0442\u0438 \u0432\u0456\u043b\u044c\u043d\u0435 \u0432\u0456\u043a\u043d\u043e')
    await nextTick()
    const errorEl = editErrorRefs.value[slotId]
    if (errorEl) {
      errorEl.scrollIntoView({ block: 'nearest' })
    } else {
      window.scrollTo({ top: currentScroll })
    }
  } finally {
    bodyStyle.position = prevBodyPosition
    bodyStyle.top = prevBodyTop
    bodyStyle.width = prevBodyWidth
    htmlStyle.scrollBehavior = prevScrollBehavior
    window.scrollTo({ top: currentScroll })
    loading.value = false
  }
}

async function deleteSlot(slotId: number) {
  if (deleteActionLoading.value) return
  const targetSlot = slots.value.find((slot) => slot.id === slotId)
  if (!targetSlot || !canDeleteAvailabilitySlot(targetSlot)) {
    pruneSelectedAvailabilitySlots()
    return
  }
  addDeletingSlotId(slotId)
  error.value = ''
  try {
    await apiDelete(`/cabinet/slots/${slotId}/`)
    removeSlotsFromState([slotId])
    toast.success('Вікно для запису видалено.')
  } catch (err: any) {
    await loadSlots()
    error.value = deleteSlotsErrorMessage
    toast.error(deleteSlotsErrorMessage)
  } finally {
    removeDeletingSlotId(slotId)
  }
}

function requestDeleteSlot(slotId: number) {
  if (deleteActionLoading.value) return
  const targetSlot = slots.value.find((slot) => slot.id === slotId)
  if (!targetSlot || !canDeleteAvailabilitySlot(targetSlot)) return
  confirmModal.openConfirm({
    title: 'Видалити вікно для запису?',
    message: 'Буде видалено 1 вікно для запису. Заброньовані сесії не буде змінено.',
    confirmText: 'Видалити',
    cancelText: 'Скасувати',
    tone: 'danger',
    onConfirm: () => deleteSlot(slotId),
  })
}

async function deleteSelectedAvailabilitySlots() {
  if (deleteActionLoading.value) return
  const targets = selectedAvailabilityDeleteTargets()
  if (targets.length === 0) {
    pruneSelectedAvailabilitySlots()
    return
  }

  bulkDeleteLoading.value = true
  error.value = ''
  const targetIds = targets.map((slot) => slot.id)
  try {
    await deleteAvailabilitySlotsById(targetIds)
    clearSelectedAvailabilitySlots()
    await loadSlots()
    toast.success('Вікна для запису видалено.')
  } catch (err: any) {
    clearSelectedAvailabilitySlots()
    await loadSlots()
    error.value = deleteSlotsErrorMessage
    toast.error(deleteSlotsErrorMessage)
  } finally {
    bulkDeleteLoading.value = false
  }
}

function requestDeleteSelectedAvailabilitySlots() {
  if (deleteActionLoading.value) return
  const targets = selectedAvailabilityDeleteTargets()
  if (targets.length === 0) {
    pruneSelectedAvailabilitySlots()
    return
  }

  confirmModal.openConfirm({
    title: 'Видалити вікна для запису?',
    message: `Буде видалено ${targets.length} вікон для запису. Заброньовані сесії не буде змінено.`,
    confirmText: 'Видалити вибрані',
    cancelText: 'Скасувати',
    tone: 'danger',
    onConfirm: deleteSelectedAvailabilitySlots,
  })
}

async function clearVisibleWeekAvailabilitySlots() {
  if (deleteActionLoading.value) return
  const targets = unbookedVisibleWeekSlots.value
  if (targets.length === 0) {
    pruneSelectedAvailabilitySlots()
    return
  }

  clearWeekLoading.value = true
  error.value = ''
  const targetIds = targets.map((slot) => slot.id)
  try {
    await deleteAvailabilitySlotsById(targetIds)
    removeSlotsFromState(targetIds)
    clearSelectedAvailabilitySlots()
    toast.success('Вікна для запису видалено.')
  } catch (err: any) {
    clearSelectedAvailabilitySlots()
    await loadSlots()
    error.value = deleteSlotsErrorMessage
    toast.error(deleteSlotsErrorMessage)
  } finally {
    clearWeekLoading.value = false
  }
}

function requestClearVisibleWeekAvailabilitySlots() {
  if (deleteActionLoading.value || unbookedVisibleWeekSlots.value.length === 0) return

  confirmModal.openConfirm({
    title: 'Очистити тиждень від вікон для запису?',
    message: 'Буде видалено всі доступні незаброньовані вікна для запису цього тижня. Заброньовані сесії не буде змінено.',
    confirmText: 'Очистити тиждень',
    cancelText: 'Скасувати',
    tone: 'danger',
    onConfirm: clearVisibleWeekAvailabilitySlots,
  })
}

onMounted(() => {
  document.addEventListener('pointerdown', handleDocumentPointerDown)
  document.addEventListener('keydown', handleDocumentKeydown)
  void loadSlots()
  void loadPublicBookingSettings()
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', handleDocumentPointerDown)
  document.removeEventListener('keydown', handleDocumentKeydown)
})
</script>

<style scoped>
.slots {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.slots__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 14px;
  position: relative;
  overflow: hidden;
  background: #fff;
  border: 1px solid var(--pc-border);
  border-radius: var(--pc-radius-panel);
  padding: 12px 16px;
  box-shadow: var(--pc-shadow-soft);
}

.slots__header > * {
  position: relative;
  z-index: 1;
}

.slots__header::after {
  display: none;
}

.slots__header .btn {
  min-height: 32px;
  padding: 4px 10px;
  border-radius: var(--pc-radius-control);
  font-weight: 700;
  white-space: nowrap;
}

.slots__header .btn--ghost {
  border-color: var(--pc-border);
  background: #fff;
  color: var(--pc-navy-900);
}

.slots__title {
  margin: 0 0 3px;
  color: var(--pc-navy-950);
  font-size: 28px;
  line-height: 1.1;
}

.slots__subtitle {
  margin: 0;
  max-width: 560px;
  color: var(--pc-text-muted);
  font-size: 13px;
  line-height: 1.35;
}


.slots__subnav {
  margin-top: -4px;
}

.schedule-tabs {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.schedule-tabs__item {
  text-decoration: none;
  border: 1px solid var(--pc-border);
  border-radius: var(--pc-radius-control);
  background: #fff;
  color: var(--pc-text-muted);
  font-weight: 700;
}

.schedule-tabs__item:hover,
.schedule-tabs__item:focus-visible {
  border-color: color-mix(in srgb, var(--pc-navy-900) 28%, var(--pc-border));
  background: color-mix(in srgb, var(--pc-blue-soft) 76%, #ffffff);
  color: var(--pc-navy-900);
}

.panel {
  border: 1px solid var(--pc-border);
  border-radius: var(--pc-radius-panel);
  padding: 14px;
  background: #fff;
  box-shadow: var(--pc-shadow-soft);
  display: grid;
  gap: 8px;
}

.panel--split {
  grid-template-columns: minmax(240px, 0.9fr) minmax(480px, 1.1fr);
  align-items: start;
  gap: 20px;
}

.panel--split > div {
  padding-right: 8px;
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

.schedule-toolbar {
  gap: 7px;
  padding: 10px 12px;
}

.schedule-toolbar__main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.week-nav,
.schedule-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.schedule-actions {
  align-items: stretch;
  gap: 8px;
}

.action-group {
  display: grid;
  gap: 6px;
  min-width: 280px;
  padding: 10px;
  border: 1px solid var(--pc-border);
  border-radius: var(--pc-radius-card);
  background: color-mix(in srgb, var(--pc-bg-soft) 62%, #ffffff);
}

.action-group--availability {
  display: flex;
  align-items: center;
  min-width: 0;
  padding: 0;
  border: 0;
  background: transparent;
}

.action-group__title {
  font-size: 12px;
  font-weight: 700;
  color: var(--pc-navy-900);
}

.action-group__hint {
  margin: 0;
  font-size: 12px;
  line-height: 1.35;
}

.action-group__buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.schedule-toolbar--availability .schedule-actions {
  margin-left: auto;
}

.schedule-toolbar--availability .action-group__buttons {
  justify-content: flex-end;
}

.smart-fill-cta {
  background: linear-gradient(135deg, var(--pc-navy-950) 0%, var(--pc-navy-900) 100%);
  border-color: var(--pc-navy-900);
  color: #fff;
  box-shadow: 0 8px 20px rgba(14, 43, 73, 0.16);
}

.smart-fill-cta:hover:not(:disabled),
.smart-fill-cta:focus-visible {
  background: var(--pc-navy-900);
  border-color: var(--pc-navy-900);
  color: #fff;
}

.schedule-toolbar__hint {
  margin: -1px 0 0;
  font-size: 12px;
  line-height: 1.3;
}

.booking-settings-cta {
  border-color: color-mix(in srgb, var(--pc-navy-900) 34%, var(--pc-border));
  background: color-mix(in srgb, var(--pc-primary-soft) 72%, #ffffff);
  color: var(--pc-navy-900);
  font-weight: 700;
}

.availability-bulk-toolbar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
  margin-left: auto;
}

.availability-bulk-toolbar__selection {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.availability-bulk-toolbar__count {
  font-size: 12px;
  font-weight: 800;
  color: var(--pc-navy-900);
}

.week-range {
  min-width: 190px;
  text-align: center;
  font-weight: 700;
  color: var(--pc-navy-900);
}

.week-nav__label--mobile {
  display: none;
}

.week-nav__label--narrow {
  display: none;
}

.schedule-workspace {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(280px, 320px);
  gap: 10px;
  align-items: start;
}

.settings-panel {
  gap: 14px;
}

.settings-panel__intro {
  display: grid;
  gap: 6px;
}

.settings-form {
  display: grid;
  gap: 12px;
  max-width: 640px;
}

.settings-form__hint {
  display: block;
  margin-top: 6px;
  font-size: 12px;
  line-height: 1.35;
}

.settings-form__checkbox-row {
  display: grid;
  gap: 6px;
}

.settings-form__checkbox-label {
  font-weight: 600;
  color: var(--pc-navy-900);
}

.settings-form__actions {
  margin-top: 4px;
  display: flex;
  justify-content: flex-start;
}

.calendar-panel {
  overflow: hidden;
  padding: 8px;
}

.calendar-scroll {
  max-height: min(62vh, 600px);
  overflow: auto;
  border: 1px solid var(--pc-border);
  border-radius: var(--pc-radius-card);
  background: #fff;
}

.week-calendar {
  display: grid;
  grid-template-columns: 52px repeat(7, minmax(92px, 1fr));
  min-width: 700px;
  background: #fff;
}

.calendar-header-cell,
.calendar-day-header,
.calendar-time,
.calendar-time-column,
.calendar-day-column {
  border-right: 1px solid rgba(47, 63, 73, 0.08);
  border-bottom: 1px solid rgba(47, 63, 73, 0.08);
}

.calendar-day-header {
  min-height: 44px;
  padding: 6px 7px;
  display: grid;
  gap: 2px;
  align-content: center;
  background: color-mix(in srgb, var(--pc-bg-soft) 72%, #ffffff);
  font-size: 12px;
  color: var(--pc-text-muted);
}

.calendar-day-header strong {
  color: var(--pc-navy-900);
  font-size: 13px;
}

.calendar-time {
  padding: 7px 5px;
  background: #fff;
  color: var(--pc-text-muted);
  font-size: 11px;
  text-align: right;
  border-bottom: 1px solid rgba(47, 63, 73, 0.08);
  box-sizing: border-box;
}

.calendar-time-column {
  background: #fff;
}

.calendar-day-column {
  position: relative;
  background: #fff;
  overflow: hidden;
}

.calendar-empty-hit-area {
  position: absolute;
  inset: 0;
  z-index: 0;
  display: block;
  width: 100%;
  height: 100%;
  border: 0;
  padding: 0;
  background: transparent;
  cursor: copy;
}

.calendar-empty-hit-area:hover,
.calendar-empty-hit-area:focus-visible {
  background: color-mix(in srgb, var(--pc-blue-soft) 18%, transparent);
  outline: 2px solid color-mix(in srgb, var(--pc-navy-900) 20%, transparent);
  outline-offset: -2px;
}

.calendar-cell--selected-day {
  background: color-mix(in srgb, var(--pc-blue-soft) 36%, #ffffff);
}

.calendar-hour-line {
  position: absolute;
  left: 0;
  right: 0;
  border-top: 1px solid rgba(47, 63, 73, 0.08);
  pointer-events: none;
}

.calendar-slot {
  position: absolute;
  border: 1px solid color-mix(in srgb, var(--pc-navy-900) 18%, var(--pc-border));
  border-radius: var(--pc-radius-control);
  padding: 4px 5px;
  background: color-mix(in srgb, var(--pc-primary-soft) 68%, #ffffff);
  color: var(--pc-navy-900);
  display: block;
  text-align: left;
  cursor: pointer;
  box-shadow: none;
  min-height: 24px;
  overflow: hidden;
  box-sizing: border-box;
  z-index: 1;
}

.calendar-slot:hover,
.calendar-slot:focus-visible {
  border-color: color-mix(in srgb, var(--pc-navy-900) 38%, var(--pc-border));
}

.calendar-slot--selected {
  outline: 2px solid color-mix(in srgb, var(--pc-navy-900) 36%, transparent);
  outline-offset: 1px;
}

.calendar-slot__time {
  font-weight: 700;
  font-size: 11px;
  line-height: 1.2;
  white-space: nowrap;
}

.availability-slot {
  padding: 0;
}

.availability-slot__main {
  width: 100%;
  height: 100%;
  min-height: 24px;
  border: 0;
  background: transparent;
  color: inherit;
  display: block;
  text-align: left;
  padding: 4px 30px 4px 5px;
  cursor: pointer;
}

.availability-slot__main:hover,
.availability-slot__main:focus-visible {
  outline: none;
}

.availability-slot__select {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 24px;
  height: 24px;
  border: 1px solid color-mix(in srgb, var(--pc-navy-900) 18%, var(--pc-border));
  border-radius: 999px;
  background: #fff;
  color: var(--pc-navy-900);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 800;
  line-height: 1;
  cursor: pointer;
}

.availability-slot__select:hover,
.availability-slot__select:focus-visible {
  border-color: color-mix(in srgb, var(--pc-navy-900) 38%, var(--pc-border));
  background: color-mix(in srgb, var(--pc-blue-soft) 72%, #ffffff);
}

.availability-slot--bulk-selected {
  outline: 2px solid color-mix(in srgb, var(--pc-primary) 48%, transparent);
  outline-offset: 1px;
}

.availability-slot--bulk-selected .availability-slot__select {
  background: var(--pc-navy-900);
  color: #fff;
  border-color: var(--pc-navy-900);
}

.calendar-legend {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  font-size: 11px;
  color: var(--pc-text-muted);
}

.calendar-legend span {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.legend-dot {
  width: 9px;
  height: 9px;
  border-radius: 999px;
  border: 1px solid var(--pc-border);
  background: color-mix(in srgb, var(--pc-primary-soft) 78%, #ffffff);
}

.legend-dot--booked {
  background: #f6e9e9;
  border-color: rgba(138, 44, 44, 0.18);
}

.legend-dot--session {
  background: #e7f2f1;
  border-color: rgba(31, 92, 87, 0.24);
}

.legend-dot--past {
  background: #f2f4f6;
  border-color: rgba(90, 103, 114, 0.16);
}

.slot-status--available {
  background: color-mix(in srgb, var(--pc-primary-soft) 78%, #ffffff);
  color: var(--pc-navy-900);
}

.slot-status--booked,
.calendar-slot.slot-status--booked {
  background: #f6e9e9;
  color: #8a2c2c;
  border-color: rgba(138, 44, 44, 0.18);
}

.schedule-event--available {
  background: color-mix(in srgb, var(--pc-primary-soft) 78%, #ffffff);
  color: var(--pc-navy-900);
  border-color: color-mix(in srgb, var(--pc-primary-soft) 72%, var(--pc-border));
}

.schedule-event--booked {
  background: #f6e9e9;
  color: #8a2c2c;
  border-color: rgba(138, 44, 44, 0.18);
}

.slot-status--past,
.calendar-slot.slot-status--past {
  background: #f2f4f6;
  color: #6a747c;
  border-color: rgba(90, 103, 114, 0.16);
}

.calendar-session,
.mobile-slot--session {
  background: #e7f2f1;
  color: #1f5c57;
  border-color: rgba(31, 92, 87, 0.24);
}

.slot-status--session {
  background: #e7f2f1;
  color: #1f5c57;
  border-color: rgba(31, 92, 87, 0.24);
}

.calendar-session__kind,
.calendar-session__client {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 10px;
  line-height: 1.2;
}

.calendar-session__kind {
  font-weight: 800;
}

.calendar-session__client {
  color: color-mix(in srgb, #1f5c57 76%, var(--pc-text-muted));
}

.calendar-empty {
  margin-top: 10px;
  padding: 10px 12px;
  border: 1px dashed var(--pc-border);
  border-radius: var(--pc-radius-card);
  background: color-mix(in srgb, var(--pc-bg-soft) 64%, #ffffff);
}

.mobile-day-schedule {
  display: none;
}

.mobile-day-schedule__title {
  font-weight: 700;
  color: var(--pc-navy-900);
}

.mobile-day-group {
  display: grid;
  gap: 8px;
}

.mobile-day-group + .mobile-day-group {
  padding-top: 10px;
  border-top: 1px solid color-mix(in srgb, var(--pc-border) 78%, transparent);
}

.mobile-day-group__title {
  margin: 0;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  color: var(--pc-navy-900);
  font-size: 13px;
  line-height: 1.25;
}

.mobile-day-group__title small {
  color: var(--pc-text-muted);
  font-size: 11px;
  font-weight: 700;
}

.mobile-schedule-event {
  display: grid;
  gap: 6px;
}

.mobile-slot {
  width: 100%;
  border: 1px solid var(--pc-border);
  border-radius: var(--pc-radius-control);
  padding: 7px 9px;
  display: flex;
  justify-content: space-between;
  gap: 10px;
  text-align: left;
  background: #fff;
}

.mobile-slot--availability {
  align-items: center;
  padding: 0;
  overflow: hidden;
}

.mobile-slot__main {
  min-width: 0;
  flex: 1 1 auto;
  min-height: 42px;
  border: 0;
  background: transparent;
  color: inherit;
  display: flex;
  align-items: center;
  text-align: left;
  padding: 9px 10px;
  font-weight: 800;
}

.mobile-slot__select {
  flex: 0 0 auto;
  min-height: 38px;
  min-width: 88px;
  margin-right: 4px;
  border: 1px solid color-mix(in srgb, var(--pc-navy-900) 18%, var(--pc-border));
  border-radius: var(--pc-radius-control);
  background: #fff;
  color: var(--pc-navy-900);
  font-size: 12px;
  font-weight: 800;
  padding: 6px 9px;
}

.mobile-slot__select[aria-pressed="true"] {
  background: var(--pc-navy-900);
  color: #fff;
  border-color: var(--pc-navy-900);
}

.mobile-slot--event {
  align-items: flex-start;
}

.mobile-slot__time {
  font-weight: 800;
  white-space: nowrap;
}

.mobile-slot__meta {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: right;
}

.mobile-event-detail {
  display: grid;
  gap: 9px;
  border: 1px solid var(--pc-border);
  border-radius: var(--pc-radius-card);
  background: #fff;
  padding: 10px 11px;
  box-shadow: none;
}

.mobile-event-detail__header {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: baseline;
}

.mobile-event-detail__header strong {
  color: var(--pc-navy-900);
  font-size: 13px;
}

.mobile-event-detail__header span {
  color: var(--pc-text-muted);
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

.mobile-event-detail__meta {
  margin: 0;
  display: grid;
  gap: 8px;
}

.mobile-event-detail__meta div {
  display: grid;
  gap: 2px;
}

.mobile-event-detail__meta dt {
  color: var(--pc-text-muted);
  font-size: 11px;
}

.mobile-event-detail__meta dd {
  margin: 0;
  color: var(--pc-navy-900);
  font-size: 13px;
  font-weight: 700;
}

.mobile-event-detail__actions {
  display: flex;
  justify-content: flex-end;
}

.mobile-event-detail__actions .btn {
  height: 34px;
  padding: 5px 10px;
}

.slot-detail-panel {
  position: sticky;
  top: 12px;
  align-content: start;
  gap: 10px;
}

.slot-detail-panel__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.slot-detail-list {
  margin: 0;
  display: grid;
  gap: 10px;
}

.slot-detail-list div {
  display: grid;
  gap: 3px;
}

.slot-detail-list dt {
  color: var(--pc-text-muted);
  font-size: 12px;
}

.slot-detail-list dd {
  margin: 0;
  color: var(--pc-navy-900);
  font-weight: 600;
}

.slot-form {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(120px, 0.4fr) 120px 108px;
  column-gap: 10px;
  row-gap: 8px;
  align-items: start;
  width: 100%;
  max-width: 100%;
}

.slot-form .field {
  display: grid;
  gap: 6px;
  font-size: 12px;
  color: var(--muted);
}

.slot-form .input,
.slot-form .btn {
  height: 40px;
}

.slot-form .input {
  font-size: 13px;
  padding: 10px 12px;
  border: 1px solid var(--pc-border);
  border-radius: var(--pc-radius-control);
}

.slot-form .btn {
  align-self: start;
  margin-top: 22px;
}

.slot-form .btn {
  width: 100%;
  min-width: 0;
  justify-self: stretch;
}

.slot-form .input {
  min-width: 0;
}

.slot-form__actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  align-self: start;
  padding-top: 22px;
}

.slot-form__actions .btn {
  width: auto;
  min-width: 132px;
  margin-top: 0;
  justify-self: auto;
}

.datetime-field {
  display: grid;
  grid-template-columns: minmax(220px, 260px) 90px;
  gap: 8px;
  align-items: start;
}

.date-input-shell {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 42px;
  gap: 6px;
  align-items: center;
  min-width: 0;
}

.date-picker-trigger {
  height: 40px;
  border: 1px solid var(--pc-border);
  border-radius: var(--pc-radius-control);
  background: #fff;
  color: var(--pc-navy-900);
  font-size: 12px;
  font-weight: 700;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.date-picker-trigger svg {
  width: 17px;
  height: 17px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.date-picker-trigger:hover,
.date-picker-trigger:focus-visible {
  border-color: color-mix(in srgb, var(--pc-navy-900) 28%, var(--pc-border));
  background: color-mix(in srgb, var(--pc-blue-soft) 76%, #ffffff);
}

.date-picker-popover {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  z-index: 40;
  width: 100%;
  min-width: 260px;
  max-width: 300px;
  border: 1px solid var(--pc-border);
  border-radius: var(--pc-radius-card);
  background: #fff;
  box-shadow: var(--pc-shadow-soft);
  padding: 10px;
}

.date-picker-popover__header {
  display: grid;
  grid-template-columns: 34px 1fr 34px;
  gap: 6px;
  align-items: center;
  margin-bottom: 8px;
}

.date-picker-popover__header strong {
  text-align: center;
  color: var(--pc-navy-900);
  font-size: 13px;
  line-height: 1.2;
  white-space: nowrap;
}

.date-picker-popover__header .btn {
  min-width: 0;
  width: 34px;
  height: 32px;
  padding: 0;
}

.date-picker-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 3px;
}

.date-picker-grid span {
  text-align: center;
  color: var(--pc-text-muted);
  font-size: 11px;
  font-weight: 700;
  padding: 4px 0;
}

.date-picker-day {
  height: 30px;
  border: 1px solid transparent;
  border-radius: var(--pc-radius-xs);
  background: #fff;
  color: var(--pc-navy-900);
  font-size: 12px;
  cursor: pointer;
}

.date-picker-day:hover,
.date-picker-day:focus-visible {
  border-color: color-mix(in srgb, var(--pc-navy-900) 24%, var(--pc-border));
  background: color-mix(in srgb, var(--pc-blue-soft) 72%, #ffffff);
}

.date-picker-day--muted {
  color: var(--pc-text-muted);
  background: color-mix(in srgb, var(--pc-bg-soft) 52%, #ffffff);
}

.date-picker-day--selected {
  border-color: color-mix(in srgb, var(--pc-navy-900) 38%, var(--pc-border));
  background: color-mix(in srgb, var(--pc-primary-soft) 80%, #ffffff);
  font-weight: 800;
}

.date-picker-day--today {
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--pc-navy-900) 18%, transparent);
}

.slot-list {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
}

.slot-summary {
  font-size: 12px;
  white-space: nowrap;
}

.quick-actions-panel {
  padding: 12px;
}

.quick-actions-panel .panel__title {
  font-size: 18px;
}

.create-slot-panel {
  display: grid;
  gap: 16px;
  width: min(100%, 600px);
  margin-inline: auto;
  padding: 18px;
  overflow: visible;
}

.create-slot-panel__intro {
  display: grid;
  gap: 4px;
}

.create-slot-panel .panel__title {
  font-size: 20px;
}

.slot-form--create {
  grid-template-columns: 1fr;
  gap: 14px;
  align-items: start;
}

.slot-form--create .field {
  font-size: 13px;
  font-weight: 700;
  color: var(--pc-text-muted);
}

.slot-form--create .form-error--inline,
.slot-form--create .slot-form__preview,
.slot-form--create .slot-form__actions {
  grid-column: 1 / -1;
}

.duration-input {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
  border: 1px solid var(--pc-border);
  border-radius: var(--pc-radius-control);
  background: #fff;
  padding-right: 12px;
}

.duration-input .input {
  border: 0;
  background: transparent;
}

.duration-input span {
  color: var(--pc-text-muted);
  font-size: 13px;
  font-weight: 700;
}

.slot-form__preview {
  display: grid;
  gap: 4px;
  padding: 10px 12px;
  border: 1px solid var(--pc-border);
  border-radius: var(--pc-radius-control);
  background: color-mix(in srgb, var(--pc-bg-soft) 62%, #ffffff);
  font-size: 13px;
}

.slot-form__preview span {
  color: var(--pc-text-muted);
}

.slot-form__preview strong {
  color: var(--pc-navy-900);
}

.slot-form--create .slot-form__actions {
  justify-content: flex-end;
  padding-top: 0;
}

.slot-form--create .slot-form__actions .btn {
  min-width: 112px;
  white-space: nowrap;
}

.regular-sessions-modal {
  position: fixed;
  inset: 0;
  z-index: 80;
  display: grid;
  place-items: center;
  padding: 18px;
}

.regular-sessions-modal__backdrop {
  position: absolute;
  inset: 0;
  border: 0;
  background: rgba(15, 23, 42, 0.34);
  cursor: pointer;
}

.regular-sessions-modal__content {
  position: relative;
  z-index: 1;
  display: grid;
  gap: 16px;
  width: min(100%, 620px);
  max-height: min(780px, calc(100vh - 36px));
  overflow: auto;
  border: 1px solid var(--pc-border);
  border-radius: var(--pc-radius-panel);
  background: #fff;
  padding: 18px;
  box-shadow: var(--pc-shadow-strong);
}

.smart-fill-modal {
  grid-template-rows: auto minmax(0, 1fr);
  gap: 0;
  max-height: min(760px, calc(100dvh - 36px));
  overflow: hidden;
  padding: 0;
}

.smart-fill-modal .regular-sessions-modal__header {
  padding: 18px 18px 12px;
  border-bottom: 1px solid color-mix(in srgb, var(--pc-border) 72%, transparent);
}

.regular-sessions-modal__header {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: flex-start;
}

.regular-sessions-modal__header .panel__title {
  font-size: 20px;
}

.regular-sessions-modal__header .muted {
  margin: 6px 0 0;
}

.regular-sessions-form {
  grid-template-columns: 1fr;
  gap: 14px;
}

.regular-sessions-form .field {
  font-size: 13px;
  font-weight: 700;
  color: var(--pc-text-muted);
}

.regular-sessions-form .form-error--inline,
.regular-sessions-form .slot-form__actions {
  grid-column: 1 / -1;
}

.regular-sessions-form .slot-form__actions {
  justify-content: flex-end;
  padding-top: 0;
}

.regular-sessions-form .slot-form__actions .btn {
  min-width: 112px;
  white-space: nowrap;
}

.smart-fill-modal .fill-availability-form {
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  align-content: start;
  padding: 14px 18px 0;
  scrollbar-gutter: stable;
}

.fill-availability-form__error {
  min-height: 38px;
  margin-top: 10px;
}

.fill-availability-form__error--empty {
  visibility: hidden;
}

.smart-fill-modal .fill-availability-form__hint {
  min-height: 34px;
  margin: 0;
}

.smart-fill-modal .fill-availability-form__preview {
  min-height: 92px;
  align-content: start;
}

.smart-fill-modal .slot-form__actions {
  position: sticky;
  bottom: 0;
  z-index: 2;
  min-height: 72px;
  margin: 0 -18px;
  padding: 12px 18px 18px;
  border-top: 1px solid color-mix(in srgb, var(--pc-border) 72%, transparent);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.94), #fff 32%);
  box-shadow: 0 -10px 18px rgba(15, 23, 42, 0.05);
}

.fill-availability-days {
  display: grid;
  gap: 8px;
  border: 0;
  padding: 0;
  margin: 0;
}

.fill-availability-days legend {
  padding: 0;
  font-size: 13px;
  font-weight: 700;
  color: var(--pc-text-muted);
}

.fill-availability-days__options {
  display: grid;
  grid-template-columns: repeat(7, minmax(38px, 1fr));
  gap: 6px;
  max-width: 420px;
}

.fill-availability-day {
  display: inline-flex;
  min-height: 36px;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 6px 8px;
  border: 1px solid var(--pc-border);
  border-radius: var(--pc-radius-control);
  background: #fff;
  color: var(--pc-text-muted);
  font: inherit;
  font-size: 13px;
  font-weight: 700;
  line-height: 1;
  cursor: pointer;
  transition:
    border-color 0.16s ease,
    background 0.16s ease,
    color 0.16s ease,
    box-shadow 0.16s ease;
}

.fill-availability-day:hover,
.fill-availability-day:focus-visible {
  border-color: rgba(21, 68, 115, 0.45);
  color: var(--pc-navy);
  box-shadow: 0 0 0 2px rgba(21, 68, 115, 0.1);
}

.fill-availability-day--selected {
  border-color: var(--pc-navy);
  background: rgba(21, 68, 115, 0.1);
  color: var(--pc-navy);
  box-shadow: inset 0 0 0 1px rgba(21, 68, 115, 0.15);
}

.fill-availability-day__check {
  display: inline-flex;
  width: 12px;
  justify-content: center;
  color: transparent;
  font-size: 12px;
}

.fill-availability-day--selected .fill-availability-day__check {
  color: currentColor;
}

.fill-availability-form__hint,
.fill-availability-form__preview {
  grid-column: 1 / -1;
}

.day-nav-actions {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.day-list {
  display: none;
  gap: 6px;
  flex-wrap: wrap;
}

.day-nav-actions .btn,
.day-list .btn,
.slot-filter .btn,
.slot-toggle {
  border: 1px solid var(--pc-border);
  border-radius: var(--pc-radius-control);
  background: #fff;
  color: var(--pc-text-muted);
  font-weight: 700;
}

.day-nav-actions .btn:hover:not(:disabled),
.day-nav-actions .btn:focus-visible,
.day-list .btn:hover,
.day-list .btn:focus-visible,
.slot-filter .btn:hover,
.slot-filter .btn:focus-visible,
.slot-toggle:hover,
.slot-toggle:focus-visible {
  border-color: color-mix(in srgb, var(--pc-navy-900) 28%, var(--pc-border));
  background: color-mix(in srgb, var(--pc-blue-soft) 76%, #ffffff);
  color: var(--pc-navy-900);
}

.slot-filter {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.filters-toolbar__row {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
}

.filters-toolbar__row--controls {
  justify-content: flex-start;
  gap: 8px;
}

.filters-toolbar__row--availability {
  align-items: center;
}

.filters-toolbar__row--meta {
  justify-content: flex-start;
  gap: 10px;
}

.day-picker {
  display: grid;
  gap: 2px;
  font-size: 12px;
  color: var(--muted);
}

.day-picker--compact .input {
  height: 36px;
  width: 220px;
  border: 1px solid var(--pc-border);
  border-radius: var(--pc-radius-control);
}

.day-hint {
  font-size: 12px;
  text-align: left;
}

.day-hint__today {
  color: #0b4a7d;
  font-weight: 600;
  margin-left: 6px;
}

.slot-toggle {
  width: fit-content;
}

.slot-note {
  margin: 0;
  font-size: 12px;
  color: var(--muted);
}

.slot-note--quiet {
  font-size: 11px;
  opacity: 0.8;
}

.slot-note__link {
  color: #0b4a7d;
  font-weight: 600;
  text-decoration: none;
}

.slot-note__link:hover,
.slot-note__link:focus-visible {
  text-decoration: underline;
}

.btn--active {
  border-color: color-mix(in srgb, var(--pc-navy-900) 36%, var(--pc-border));
  color: var(--pc-navy-900);
  background: color-mix(in srgb, var(--pc-primary-soft) 80%, #ffffff);
}

.slot-bulk {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 12px;
  align-items: start;
}

.bulk-group {
  display: grid;
  grid-template-columns: 1fr auto;
  grid-template-rows: auto auto;
  column-gap: 12px;
  row-gap: 8px;
  align-items: end;
}

.bulk-group .input,
.bulk-group .btn {
  height: 40px;
}

.bulk-group .input {
  border: 1px solid var(--pc-border);
  border-radius: var(--pc-radius-control);
}

.bulk-group .field {
  grid-column: 1;
  grid-row: 1;
}

.bulk-group .btn {
  grid-column: 2;
  grid-row: 1;
  align-self: end;
}

.bulk-hint {
  grid-column: 1 / -1;
  grid-row: 2;
  font-size: 12px;
  color: var(--muted);
}

.bulk-hint__today {
  color: #0b4a7d;
  font-weight: 600;
  margin-left: 6px;
}

.slot-card {
  border: 1px solid var(--pc-border);
  border-radius: var(--pc-radius-card);
  padding: 10px;
  background: #fff;
  box-shadow: var(--pc-shadow-soft);
  display: grid;
  gap: 6px;
}

.slot-card--editing {
  grid-column: 1 / -1;
}

.slot-card--booked {
  background: color-mix(in srgb, var(--pc-bg-soft) 62%, #ffffff);
  border-color: var(--pc-border);
}

.slot-card--booked .slot-card__time {
  color: #564943;
}

.slot-card--booked .slot-card__meta {
  color: #7b6b64;
}

.slot-card__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.slot-card__main {
  min-width: 0;
  display: grid;
  gap: 3px;
}

.slot-card__time {
  font-size: 15px;
  font-weight: 600;
  line-height: 1.2;
}

.slot-card__meta {
  font-size: 12px;
  color: var(--muted);
}

.slot-card__edit {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 76px 80px;
  gap: 6px;
  align-items: center;
}

.slot-card__edit--panel {
  grid-template-columns: 1fr;
}

.slot-card__edit .input {
  border: 1px solid var(--pc-border);
  border-radius: var(--pc-radius-control);
}

.field-hint {
  margin-top: 4px;
  font-size: 12px;
  color: var(--muted);
}

.slot-status {
  font-size: 12px;
  padding: 4px 8px;
  border: 1px solid color-mix(in srgb, var(--pc-navy-900) 22%, var(--pc-border));
  border-radius: var(--pc-radius-control);
  background: color-mix(in srgb, var(--pc-blue-soft) 82%, #ffffff);
  color: var(--pc-navy-900);
  width: fit-content;
}

.slot-status--booked {
  background: #f6e9e9;
  color: #8a2c2c;
}

.slot-actions {
  margin-top: 0;
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.slot-actions .btn--sm {
  height: 34px;
  padding: 5px 10px;
  font-size: 12px;
  border-radius: var(--pc-radius-control);
  font-weight: 700;
}

.slot-actions .btn--ghost {
  border-color: var(--pc-border);
  background: #fff;
  color: var(--pc-navy-900);
}

.slot-hint {
  margin-top: 6px;
  font-size: 12px;
}

.slot-error {
  margin-top: 8px;
}

.form-error,
.slot-error {
  color: #b3261e;
  background: #fdecea;
  border: 1px solid #f5c2c0;
  border-radius: 10px;
  padding: 8px 10px;
}

.form-error--inline {
  margin-top: 8px;
}

.btn--sm {
  padding: 6px 12px;
  font-size: 13px;
  height: 40px;
}

.input--sm {
  padding: 8px 10px;
  font-size: 13px;
}

@media (max-width: 860px) {
  .slots {
    gap: 6px;
  }

  .slots__header {
    align-items: center;
    padding: 0 2px;
    gap: 8px;
    border: 0;
    border-radius: 0;
    background: transparent;
    box-shadow: none;
  }

  .slots__header::after {
    display: none;
  }

  .slots__header .btn {
    min-height: 28px;
    height: 28px;
    padding: 3px 8px;
    font-size: 12px;
  }

  .slots__title {
    font-size: 23px;
    margin: 0 0 1px;
    line-height: 1.08;
  }

  .slots__subtitle {
    margin: 0;
    font-size: 11px;
    line-height: 1.2;
    max-width: 100%;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .slots__subnav {
    margin-top: -2px;
    overflow-x: auto;
    padding-bottom: 2px;
    scrollbar-width: none;
  }

  .slots__subnav::-webkit-scrollbar {
    display: none;
  }

  .schedule-tabs {
    flex-wrap: nowrap;
    gap: 4px;
    width: max-content;
    min-width: 100%;
  }

  .schedule-tabs__item {
    flex: 0 0 auto;
    min-height: 30px;
    height: 30px;
    padding: 4px 9px;
    font-size: 12px;
    white-space: nowrap;
  }

  .panel--split {
    grid-template-columns: 1fr;
  }

  .schedule-workspace {
    grid-template-columns: 1fr;
    gap: 6px;
  }

  .schedule-toolbar {
    gap: 5px;
    padding: 7px;
    border-radius: var(--pc-radius-card);
  }

  .schedule-toolbar__main {
    align-items: flex-start;
    gap: 6px;
  }

  .schedule-toolbar--availability .schedule-actions {
    margin-left: 0;
  }

  .schedule-toolbar--availability .action-group__buttons {
    justify-content: flex-start;
    width: 100%;
  }

  .week-nav,
  .schedule-actions {
    width: 100%;
  }

  .week-nav {
    display: flex;
    align-items: center;
    flex-wrap: nowrap;
    gap: 4px;
  }

  .week-nav .btn {
    flex: 0 0 auto;
    min-width: 0;
    height: 31px;
    min-height: 31px;
    padding: 3px 7px;
    font-size: 12px;
  }

  .week-nav__label--desktop {
    display: none;
  }

  .week-nav__label--mobile {
    display: inline;
  }

  .action-group {
    min-width: 0;
    width: 100%;
    gap: 4px;
    padding: 0;
    border: 0;
    background: transparent;
  }

  .action-group__buttons .btn {
    flex: 1 1 0;
    min-width: 0;
    min-height: 31px;
    height: 31px;
    padding: 3px 7px;
    font-size: 12px;
    line-height: 1.15;
  }

  .week-range {
    flex: 1 1 auto;
    min-width: 0;
    text-align: center;
    font-size: 13px;
    line-height: 1.2;
    white-space: nowrap;
  }

  .action-group__title,
  .action-group__hint,
  .schedule-toolbar__hint,
  .filters-toolbar__row > .action-group__hint,
  .calendar-legend {
    display: none;
  }

  .day-list {
    display: flex;
    flex-wrap: nowrap;
    gap: 4px;
    overflow-x: auto;
    padding-bottom: 1px;
    scrollbar-width: none;
  }

  .day-list::-webkit-scrollbar {
    display: none;
  }

  .day-list .btn {
    flex: 0 0 auto;
    height: 31px;
    min-height: 31px;
    padding: 3px 8px;
    font-size: 12px;
    white-space: nowrap;
  }

  .calendar-scroll,
  .week-calendar {
    display: none;
  }

  .mobile-day-schedule {
    display: grid;
    gap: 6px;
  }

  .slot-detail-panel {
    position: static;
    margin-top: -2px;
  }

  .slot-detail-panel--calendar {
    display: none;
  }

  .filters-toolbar__row {
    align-items: flex-start;
    gap: 5px;
  }

  .filters-toolbar__row--controls {
    gap: 5px;
  }

  .filters-toolbar__row--availability {
    flex-wrap: nowrap;
    overflow-x: auto;
    padding-bottom: 1px;
    scrollbar-width: none;
  }

  .filters-toolbar__row--availability::-webkit-scrollbar {
    display: none;
  }

  .slot-filter {
    flex-wrap: nowrap;
    gap: 4px;
    max-width: 100%;
    overflow-x: auto;
    padding-bottom: 1px;
    scrollbar-width: none;
  }

  .slot-filter::-webkit-scrollbar {
    display: none;
  }

  .filters-toolbar__row--availability .slot-filter {
    flex: 0 0 auto;
    overflow: visible;
  }

  .slot-filter .btn,
  .slot-toggle {
    flex: 0 0 auto;
    height: 31px;
    min-height: 31px;
    padding: 3px 8px;
    font-size: 12px;
    white-space: nowrap;
  }

  .availability-bulk-toolbar {
    flex: 0 0 auto;
    width: auto;
    justify-content: flex-start;
    margin-left: 0;
    gap: 5px;
  }

  .availability-bulk-toolbar__selection {
    width: auto;
    gap: 5px;
  }

  .availability-bulk-toolbar .btn {
    height: 31px;
    min-height: 31px;
    padding: 3px 8px;
    font-size: 12px;
  }

  .availability-bulk-toolbar__count,
  .slot-summary {
    font-size: 11px;
    line-height: 1.2;
  }

  .slot-summary {
    white-space: normal;
  }

  .calendar-panel {
    padding: 6px;
  }

  .day-picker--compact .input {
    width: 100%;
    max-width: 260px;
  }

  .filters-toolbar__row--meta {
    gap: 6px;
  }

  .slot-card__edit {
    grid-template-columns: minmax(0, 1fr) 84px;
  }

  .slot-form {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 520px) {
  .slots__subtitle {
    display: none;
  }

  .slots__header .btn {
    border: 0;
    background: transparent;
    padding-right: 0;
  }

  .filters-toolbar__row--availability .slot-summary {
    display: none;
  }

  .slots__subnav {
    overflow: visible;
    padding-bottom: 0;
  }

  .schedule-tabs {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    width: 100%;
    min-width: 0;
    gap: 3px;
  }

  .schedule-tabs__item {
    justify-content: center;
    width: 100%;
    min-width: 0;
    height: 28px;
    min-height: 28px;
    padding: 3px 5px;
    font-size: 10px;
    line-height: 1.1;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .week-nav {
    gap: 3px;
  }

  .week-nav .btn {
    height: 28px;
    min-height: 28px;
    padding: 2px 5px;
    font-size: 10px;
  }

  .week-range {
    font-size: 11px;
  }

  .action-group__buttons {
    gap: 4px;
  }

  .action-group__buttons .btn {
    height: 29px;
    min-height: 29px;
    padding: 2px 6px;
    font-size: 10px;
  }

  .day-list {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    overflow: visible;
    gap: 3px;
    padding-bottom: 0;
  }

  .day-list .btn {
    width: 100%;
    min-width: 0;
    height: 28px;
    min-height: 28px;
    padding: 2px 1px;
    font-size: 9px;
    line-height: 1.05;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .filters-toolbar__row--availability {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    overflow: visible;
    padding-bottom: 0;
  }

  .filters-toolbar__row--availability .slot-filter {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    min-width: 0;
    overflow: visible;
  }

  .filters-toolbar__row--availability .slot-filter .btn {
    width: 100%;
    min-width: 0;
    height: 28px;
    min-height: 28px;
    padding: 2px 3px;
    font-size: 9px;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .availability-bulk-toolbar .btn {
    height: 28px;
    min-height: 28px;
    padding: 2px 6px;
    font-size: 9px;
  }
}

@media (max-width: 380px) {
  .slots {
    gap: 5px;
  }

  .slots__header {
    gap: 6px;
  }

  .slots__title {
    font-size: 21px;
  }

  .slots__header .btn {
    font-size: 10px;
  }

  .schedule-tabs {
    gap: 2px;
  }

  .schedule-tabs__item {
    height: 26px;
    min-height: 26px;
    padding: 2px 4px;
    font-size: 9px;
  }

  .schedule-toolbar {
    gap: 4px;
    padding: 6px;
  }

  .schedule-toolbar__main {
    gap: 5px;
  }

  .week-nav {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto auto;
    align-items: center;
    gap: 3px;
  }

  .week-nav .btn {
    height: 27px;
    min-height: 27px;
    padding: 2px 5px;
    font-size: 9px;
  }

  .week-nav__label--mobile {
    display: none;
  }

  .week-nav__label--narrow {
    display: inline;
  }

  .week-range {
    font-size: 10px;
  }

  .action-group__buttons .btn {
    height: 28px;
    min-height: 28px;
    padding: 2px 5px;
    font-size: 9px;
  }

  .day-list {
    display: flex;
    gap: 2px;
  }

  .day-list .btn {
    height: 27px;
    min-height: 27px;
    font-size: 8px;
  }

  .filters-toolbar__row--availability {
    grid-template-columns: 1fr;
    gap: 4px;
  }

  .filters-toolbar__row--availability .slot-filter .btn {
    height: 27px;
    min-height: 27px;
    font-size: 8px;
  }

  .availability-bulk-toolbar {
    width: 100%;
  }

  .availability-bulk-toolbar > .btn {
    width: 100%;
  }
}

@media (max-width: 1180px) {
  .schedule-workspace {
    grid-template-columns: 1fr;
  }

  .slot-detail-panel {
    position: static;
  }
}

@media (min-width: 680px) {
  .slot-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 980px) {
  .slot-list {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (min-width: 1260px) {
  .slot-list {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}
</style>
