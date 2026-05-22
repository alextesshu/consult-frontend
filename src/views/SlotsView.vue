<template>
  <section class="slots">
    <header class="slots__header">
      <div>
        <h1 class="title slots__title">Розклад</h1>
        <p class="muted slots__subtitle">
          Тут ви бачите календар практики. Вільний час потрібен лише тоді, коли ви хочете дозволити клієнтам самостійно обирати час у публічному профілі.
        </p>
      </div>
      <RouterLink class="btn btn--ghost" to="/cabinet">Назад до кабінету</RouterLink>
    </header>

    <div class="slots__subnav">
      <ScheduleSubnav active="slots" />
    </div>

    <section class="panel schedule-toolbar">
      <div class="schedule-toolbar__main">
        <div class="week-nav" aria-label="Навігація тижнями">
          <button class="btn btn--ghost btn--sm" type="button" @click="shiftWeek(-1)">
            Попередній тиждень
          </button>
          <div class="week-range" aria-live="polite">{{ weekRangeLabel }}</div>
          <button class="btn btn--ghost btn--sm" type="button" @click="shiftWeek(1)">
            Наступний тиждень
          </button>
          <button class="btn btn--ghost btn--sm" type="button" @click="goToToday">
            Сьогодні
          </button>
        </div>
        <div class="schedule-actions">
          <div class="action-group">
            <div class="action-group__title">Сесії</div>
            <p class="muted action-group__hint">Створюйте разові або регулярні сесії для конкретних клієнтів.</p>
            <div class="action-group__buttons">
              <button class="btn btn--ghost btn--sm" type="button" @click="openOneOffSessionModal">
                Створити сесію
              </button>
              <button class="btn btn--sm" type="button" @click="openRegularSessionsModal">
                Закріпити регулярний час
              </button>
            </div>
          </div>
          <div class="action-group action-group--availability">
            <div class="action-group__title">Вільний час для запису</div>
            <p class="muted action-group__hint">Вільний час бачать клієнти в публічному профілі та можуть обрати для запису.</p>
            <div class="action-group__buttons">
              <button class="btn btn--ghost btn--sm" type="button" @click="openCreateForm">
                Додати вільний час
              </button>
              <button class="btn btn--ghost btn--sm" type="button" :disabled="loading" @click="requestFillWeek">
                Заповнити тиждень
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="day-list" aria-label="Дні тижня">
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

      <div class="filters-toolbar__row filters-toolbar__row--controls">
        <div class="slot-filter" role="group" aria-label="Фільтр за статусом вільного часу">
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
            Заброньовані
          </button>
          <button
            class="btn btn--ghost btn--sm"
            type="button"
            :class="{ 'btn--active': slotStatusFilter === 'SESSIONS' }"
            @click="slotStatusFilter = 'SESSIONS'"
          >
            Сесії
          </button>
        </div>
        <div class="muted slot-summary">
          {{ weekStatusSummary.free }} вільних вікон · {{ weekStatusSummary.booked }} заброньованих · {{ visibleWeekNoSlotSessions.length }} сесія
        </div>
        <div class="calendar-legend" aria-label="Позначення вільного часу">
          <span><i class="legend-dot legend-dot--available"></i>Доступно</span>
          <span><i class="legend-dot legend-dot--booked"></i>Заброньовано</span>
          <span><i class="legend-dot legend-dot--session"></i>Сесія</span>
          <span><i class="legend-dot legend-dot--past"></i>Минуло</span>
        </div>
        <button
          v-if="hasPastSlotsInWeek"
          class="btn btn--ghost btn--sm slot-toggle"
          type="button"
          @click="showPastSlots = !showPastSlots"
        >
          {{ showPastSlots ? 'Сховати минулий вільний час' : `Показати минулий вільний час (${hiddenPastWeekSlotsCount})` }}
        </button>
      </div>
    </section>

    <div v-if="loading" class="muted" style="margin-top: 8px;">Завантаження...</div>

    <div class="schedule-workspace">
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
              <div
                v-for="(hour, hourIndex) in calendarHours"
                :key="`${day.key}-${hour}`"
                class="calendar-hour-line"
                :style="{ top: `${hourIndex * CALENDAR_HOUR_HEIGHT}px` }"
                aria-hidden="true"
              ></div>
              <button
                v-for="layout in positionedSlotsForDay(day.key)"
                :key="layout.slot.id"
                class="calendar-slot"
                :class="[slotStatusClass(layout.slot), { 'calendar-slot--selected': selectedSlot?.id === layout.slot.id }]"
                type="button"
                :style="calendarSlotStyle(layout)"
                :data-duration-minutes="layout.durationMinutes"
                :data-clipped-duration-minutes="layout.clippedDurationMinutes"
                :data-top-minutes="layout.topMinutes"
                :aria-label="`${slotStatusLabel(layout.slot)} ${formatSlotTimeRange(layout.slot)}`"
                :title="`${slotStatusLabel(layout.slot)} · ${formatSlotTimeRange(layout.slot)}`"
                @click="selectSlot(layout.slot)"
              >
                <span class="calendar-slot__time">{{ formatSlotTimeRange(layout.slot) }}</span>
              </button>
              <button
                v-for="layout in positionedSessionsForDay(day.key)"
                :key="`session-${layout.session.id}`"
                class="calendar-slot calendar-session"
                :class="{ 'calendar-slot--selected': selectedScheduleSession?.id === layout.session.id }"
                type="button"
                :style="calendarSlotStyle(layout)"
                :data-duration-minutes="layout.durationMinutes"
                :data-clipped-duration-minutes="layout.clippedDurationMinutes"
                :data-top-minutes="layout.topMinutes"
                :aria-label="sessionBlockLabel(layout.session)"
                :title="sessionBlockLabel(layout.session)"
                @click="selectSession(layout.session)"
              >
                <span class="calendar-session__kind">Сесія</span>
                <span class="calendar-slot__time">{{ formatSessionTimeRange(layout.session) }}</span>
                <span class="calendar-session__client">{{ sessionClientLabel(layout.session) }}</span>
              </button>
            </div>
          </div>
        </div>

        <div v-if="visibleWeekSlots.length === 0 && visibleWeekNoSlotSessions.length === 0" class="calendar-empty muted">
          На цьому тижні ще немає вільного часу для прямого запису.
        </div>

        <div class="mobile-day-schedule">
          <div class="mobile-day-schedule__title">
            {{ formatDateOnly(selectedDate) }}
            <span v-if="isSelectedToday" class="day-hint__today">· Сьогодні</span>
          </div>
          <div v-if="filteredSlots.length === 0 && filteredNoSlotSessions.length === 0" class="muted">На цей день немає вільного часу або сесій.</div>
          <button
            v-for="slot in filteredSlots"
            :key="slot.id"
            class="mobile-slot"
            :class="[slotStatusClass(slot), { 'calendar-slot--selected': selectedSlot?.id === slot.id }]"
            type="button"
            :aria-label="`${slotStatusLabel(slot)} ${formatSlotTimeRange(slot)}`"
            :title="`${slotStatusLabel(slot)} · ${formatSlotTimeRange(slot)}`"
            @click="selectSlot(slot)"
          >
            <span>{{ formatSlotTimeRange(slot) }}</span>
          </button>
          <button
            v-for="session in filteredNoSlotSessions"
            :key="`session-${session.id}`"
            class="mobile-slot mobile-slot--session"
            :class="{ 'calendar-slot--selected': selectedScheduleSession?.id === session.id }"
            type="button"
            :aria-label="sessionBlockLabel(session)"
            :title="sessionBlockLabel(session)"
            @click="selectSession(session)"
          >
            <span>{{ formatSessionTimeRange(session) }}</span>
            <span>Сесія · {{ sessionClientLabel(session) }}</span>
          </button>
        </div>
      </section>

      <aside class="panel slot-detail-panel" aria-label="Деталі вибраного елемента розкладу">
        <template v-if="!selectedSlot && !selectedScheduleSession">
          <h2 class="panel__title">Деталі вільного часу</h2>
          <p class="muted">Оберіть вільний час у календарі, щоб переглянути деталі або змінити його.</p>
        </template>
        <template v-else-if="selectedScheduleSession">
          <div class="slot-detail-panel__header">
            <div>
              <h2 class="panel__title">Деталі сесії</h2>
              <p class="muted">{{ formatDateOnly(toLocalDateKey(sessionStartAt(selectedScheduleSession) || '')) }}</p>
            </div>
            <span class="slot-status slot-status--booked">Сесія</span>
          </div>

          <dl class="slot-detail-list">
            <div>
              <dt>Час</dt>
              <dd>{{ formatSessionTimeRange(selectedScheduleSession) }}</dd>
            </div>
            <div>
              <dt>Клієнт</dt>
              <dd>{{ sessionClientLabel(selectedScheduleSession) }}</dd>
            </div>
            <div>
              <dt>Статус</dt>
              <dd>{{ sessionStatusLabel(selectedScheduleSession.status) }}</dd>
            </div>
          </dl>

          <div class="slot-actions">
            <RouterLink class="btn btn--sm" :to="`/cabinet/sessions/${selectedScheduleSession.id}`">
              Відкрити сесію
            </RouterLink>
          </div>
        </template>
        <template v-else-if="selectedSlot">
          <div class="slot-detail-panel__header">
            <div>
              <h2 class="panel__title">Деталі вільного часу</h2>
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
                aria-label="Дата початку редагованого вільного часу"
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
              aria-label="Час початку редагованого вільного часу"
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
              <dd>Цей вільний час уже заброньовано. Даних для переходу до сесії в поточному payload немає.</dd>
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
              Редагувати вільний час
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
              :disabled="selectedSlot.is_booked || loading"
              @click="requestDeleteSlot(selectedSlot.id)"
            >
              Видалити вільний час
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
            Цей вільний час уже заброньовано - редагування та видалення недоступні.
          </div>
        </template>
      </aside>
    </div>

    <section v-if="createFormOpen" class="panel create-slot-panel">
      <div class="create-slot-panel__intro">
        <h2 class="panel__title">Додати вільний час</h2>
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
      <div class="regular-sessions-modal__content">
        <div class="regular-sessions-modal__header">
          <div>
            <h2 id="one-off-session-modal-title" class="panel__title">Створити сесію</h2>
            <p class="muted">
              Створіть разову сесію для клієнта: консультацію, ознайомчу зустріч або іншу домовленість.
            </p>
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
              Вільний час
              <select
                v-model.number="oneOffSlotId"
                class="input input--select"
                :disabled="oneOffAvailableSlots.length === 0"
                required
              >
                <option value="" disabled>Оберіть вільний час</option>
                <option v-for="slot in oneOffAvailableSlots" :key="slot.id" :value="slot.id">
                  {{ formatOneOffSlotOption(slot) }}
                </option>
              </select>
            </label>

            <label class="field">
              Формат зустрічі
              <select v-model="oneOffSessionFormat" class="input input--select">
                <option v-for="option in regularFormatOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
            </label>
          </template>

          <p v-if="!oneOffSessionLoading && regularClientOptions.length === 0" class="muted">
            Немає активних клієнтів із робочою карткою.
          </p>
          <p v-if="!oneOffSessionLoading && oneOffAvailableSlots.length === 0" class="muted">
            Немає доступного вільного часу для разової сесії.
          </p>

          <div class="slot-form__actions">
            <button class="btn btn--ghost" type="button" @click="closeOneOffSessionModal">
              Скасувати
            </button>
            <button
              class="btn"
              type="submit"
              :disabled="oneOffSessionLoading || oneOffSessionSaving || regularClientOptions.length === 0 || oneOffAvailableSlots.length === 0"
            >
              {{ oneOffSessionSaving ? 'Створюємо...' : 'Створити сесію' }}
            </button>
          </div>
          <div v-if="oneOffSessionError" class="form-error form-error--inline">{{ oneOffSessionError }}</div>
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
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
  createClientRegularTime,
  getApiErrorMessage,
} from '../lib/api'
import type { ClientRegularTimeFrequency, ClientRegularTimePayload, SessionFormat } from '../lib/api'
import { getBookingErrorCode, getBookingErrorMessage } from '../lib/bookingCopy'
import { useToast } from '../composables/useToast'
import ConfirmModal from '../components/ConfirmModal.vue'
import ScheduleSubnav from '../components/ScheduleSubnav.vue'
import { useConfirmModal } from '../composables/useConfirmModal'

type Slot = {
  id: number
  start_at: string
  end_at: string
  is_booked: boolean
}

type ScheduleSession = {
  id: number
  slot: number | null
  slot_start_at: string | null
  slot_end_at: string | null
  status: string
  client_name?: string | null
  client_display_name?: string | null
  client_username?: string | null
  client_email?: string | null
  client_record_id?: number | null
}

type SlotConflict = {
  slot_id?: number
  start_at?: string
  end_at?: string
}

type OneOffSessionCreateResponse = {
  id?: number
  session_id?: number
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

const slots = ref<Slot[]>([])
const sessions = ref<ScheduleSession[]>([])
const loading = ref(false)
const error = ref('')
const editErrors = ref<Record<number, string>>({})
const editErrorRefs = ref<Record<number, HTMLElement | null>>({})
const toast = useToast()
const confirmModal = useConfirmModal()
const createFormRef = ref<HTMLFormElement | null>(null)
const createFormOpen = ref(false)
const regularSessionsFormRef = ref<HTMLFormElement | null>(null)
const regularSessionsModalOpen = ref(false)
const oneOffSessionModalOpen = ref(false)
const oneOffSessionLoading = ref(false)
const oneOffSessionSaving = ref(false)
const oneOffSessionError = ref('')
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
const oneOffSlotId = ref<number | ''>('')
const oneOffSessionFormat = ref<SessionFormat>('online')
const timeOptions = Array.from({ length: 24 * 4 }, (_, index) => {
  const minutes = index * 15
  const hours = String(Math.floor(minutes / 60)).padStart(2, '0')
  const mins = String(minutes % 60).padStart(2, '0')
  return `${hours}:${mins}`
})
const todayKey = toDateInputValue(new Date())
const selectedWeekStart = ref(toDateInputValue(startOfWeek(new Date())))
const datePickerMonth = ref(toDateInputValue(new Date()))
const selectedDate = ref(todayKey)
const showPastSlots = ref(false)
const slotStatusFilter = ref<'ALL' | 'FREE' | 'BOOKED' | 'SESSIONS'>('ALL')
const selectedSlotId = ref<number | null>(null)
const selectedSessionId = ref<number | null>(null)
const pastSlotMessage = 'Неможливо створити вікно в минулому. Для нічного часу оберіть майбутню дату або майбутній час.'

const editingId = ref<number | null>(null)
const editStartDate = ref('')
const editStartTime = ref('')
const editDuration = ref(50)
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
const regularFormatOptions: Array<{ value: SessionFormat; label: string }> = [
  { value: 'online', label: 'Онлайн' },
  { value: 'offline', label: 'Офлайн' },
]

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
  return session.slot_start_at || ''
}

function sessionEndAt(session: ScheduleSession) {
  return session.slot_end_at || ''
}

function isNoSlotSession(session: ScheduleSession) {
  return session.slot === null || session.slot === undefined
}

function isActiveScheduleSession(session: ScheduleSession) {
  return ACTIVE_SESSION_STATUSES.has(String(session.status || '').toUpperCase())
}

function sessionClientLabel(session: ScheduleSession) {
  return (
    session.client_display_name ||
    session.client_name ||
    session.client_username ||
    session.client_email ||
    (session.client_record_id ? `Клієнт #${session.client_record_id}` : 'Клієнт')
  )
}

function sessionStatusLabel(status: string) {
  const normalized = String(status || '').toUpperCase()
  if (normalized === 'CONFIRMED') return 'Підтверджено'
  if (normalized === 'SCHEDULED') return 'Заплановано'
  return status || 'Сесія'
}

function formatSessionTimeRange(session: ScheduleSession) {
  const start = parseDateLike(sessionStartAt(session))
  const end = parseDateLike(sessionEndAt(session))
  if (!start || !end) return formatDate(sessionStartAt(session))
  return `${formatTimeParts(start)}–${formatTimeParts(end)}`
}

function sessionBlockLabel(session: ScheduleSession) {
  return `Сесія · ${sessionClientLabel(session)} · ${formatSessionTimeRange(session)}`
}

function sessionDurationMinutes(session: ScheduleSession) {
  const start = parseDateLike(sessionStartAt(session))
  const end = parseDateLike(sessionEndAt(session))
  if (!start || !end) return 0
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000))
}

function sessionOverlapsSlot(session: ScheduleSession, slot: Slot) {
  const sessionStart = parseDateLike(sessionStartAt(session))
  const sessionEnd = parseDateLike(sessionEndAt(session))
  const slotStart = parseDateLike(slot.start_at)
  const slotEnd = parseDateLike(slot.end_at)
  if (!sessionStart || !sessionEnd || !slotStart || !slotEnd) return false
  return sessionStart < slotEnd && sessionEnd > slotStart
}

function isSlotCoveredByNoSlotSession(slot: Slot) {
  if (!slot.is_booked) return false
  return visibleWeekNoSlotSessions.value.some((session) => sessionOverlapsSlot(session, slot))
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

const weekDateKeys = computed(() => new Set(weekDays.value.map((day) => day.key)))

function matchesSlotStatusFilter(slot: Slot) {
  if (slotStatusFilter.value === 'SESSIONS') return false
  if (slotStatusFilter.value === 'FREE') return !slot.is_booked
  if (slotStatusFilter.value === 'BOOKED') return slot.is_booked
  return true
}

function isSlotVisible(slot: Slot) {
  if (isSlotCoveredByNoSlotSession(slot)) return false
  if (!showPastSlots.value && !isFutureSlot(slot)) return false
  return matchesSlotStatusFilter(slot)
}

const visibleWeekNoSlotSessions = computed(() =>
  sessions.value
    .filter(isNoSlotSession)
    .filter(isActiveScheduleSession)
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

const calendarHours = computed(() => {
  const { startHour, endHour } = calendarHourRange.value
  return Array.from({ length: endHour - startHour }, (_, index) => startHour + index)
})

const calendarHourRange = computed(() => {
  const slotRanges = visibleWeekSlots.value
    .map((slot) => slotMinuteRangeForDate(slot, toLocalDateKey(slot.start_at)))
    .filter((range): range is { startMinutes: number; endMinutes: number } => Boolean(range))
  const sessionRanges = visibleWeekNoSlotSessions.value
    .map((session) => sessionMinuteRangeForDate(session, toLocalDateKey(sessionStartAt(session))))
    .filter((range): range is { startMinutes: number; endMinutes: number } => Boolean(range))
  const ranges = [...slotRanges, ...sessionRanges]

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
  const free = visibleWeekSlots.value.filter((slot) => !slot.is_booked).length
  return {
    free,
    booked: visibleWeekSlots.value.length - free,
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

const filteredNoSlotSessions = computed(() =>
  visibleWeekNoSlotSessions.value
    .filter((session) => toLocalDateKey(sessionStartAt(session)) === selectedDate.value)
    .filter(() => slotStatusFilter.value === 'SESSIONS' || slotStatusFilter.value === 'ALL')
)

const oneOffAvailableSlots = computed(() =>
  slots.value
    .filter((slot) => !slot.is_booked)
    .filter(isFutureSlot)
    .sort((a, b) => String(a.start_at).localeCompare(String(b.start_at)))
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
  void loadWeekSessions()
}

function goToToday() {
  moveWeekToDate(new Date())
  selectedDate.value = todayKey
  selectedSlotId.value = null
  selectedSessionId.value = null
  showPastSlots.value = false
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

function positionedSessionsForDay(dateKey: string): CalendarSessionLayout[] {
  if (slotStatusFilter.value === 'FREE' || slotStatusFilter.value === 'BOOKED') return []
  const rangeStartMinutes = calendarHourRange.value.startHour * 60
  const rangeEndMinutes = calendarHourRange.value.endHour * 60
  const pxPerMinute = CALENDAR_HOUR_HEIGHT / 60
  const activeLanes: Array<{ endMinutes: number; lane: number }> = []

  const layouts = visibleWeekNoSlotSessions.value
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

function selectSlot(slot: Slot) {
  selectedSlotId.value = slot.id
  selectedSessionId.value = null
  selectedDate.value = toLocalDateKey(slot.start_at)
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

function resetOneOffSessionForm() {
  oneOffClientRecordId.value = regularClientOptions.value[0]?.recordId ?? ''
  oneOffSlotId.value = oneOffAvailableSlots.value[0]?.id ?? ''
  oneOffSessionFormat.value = 'online'
  oneOffSessionError.value = ''
}

function formatOneOffSlotOption(slot: Slot) {
  const startAt = parseDateLike(slot.start_at)
  const endAt = parseDateLike(slot.end_at)
  if (!startAt || !endAt) return `Вільний час #${slot.id}`
  return `${formatDateParts(startAt)}, ${formatTimeParts(startAt)}–${formatTimeParts(endAt)}`
}

async function openOneOffSessionModal() {
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
    await loadSlots()
    resetOneOffSessionForm()
    await nextTick()
  } finally {
    oneOffSessionLoading.value = false
  }
}

function closeOneOffSessionModal() {
  if (oneOffSessionSaving.value) return
  oneOffSessionModalOpen.value = false
  oneOffSessionError.value = ''
}

async function createOneOffSession() {
  const recordId = Number(oneOffClientRecordId.value || 0)
  const slotId = Number(oneOffSlotId.value || 0)
  if (recordId <= 0) {
    oneOffSessionError.value = 'Оберіть клієнта.'
    return
  }
  if (slotId <= 0) {
    oneOffSessionError.value = 'Оберіть вільний час.'
    return
  }

  oneOffSessionSaving.value = true
  oneOffSessionError.value = ''
  try {
    await apiPost<OneOffSessionCreateResponse>(`/cabinet/client-records/${recordId}/sessions/`, {
      slot_id: slotId,
      session_format: oneOffSessionFormat.value,
    })
    closeOneOffSessionModal()
    await loadSlots()
    toast.success('Сесію створено.')
  } catch (err) {
    oneOffSessionError.value = getApiErrorMessage(err, 'Не вдалося створити сесію.')
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

async function fetchWeekSessions() {
  const firstDay = weekDays.value[0]?.key
  const lastDay = weekDays.value[6]?.key
  if (!firstDay || !lastDay) return []
  const resp = await apiGet<ScheduleSession[]>('/booking/sessions/', {
    params: {
      date_from: firstDay,
      date_to: lastDay,
      status: 'SCHEDULED,CONFIRMED',
    },
  })
  return (resp || []).filter((session) => sessionStartAt(session) && sessionEndAt(session))
}

async function loadWeekSessions() {
  try {
    sessions.value = await fetchWeekSessions()
  } catch (err: any) {
    error.value = getBookingErrorMessage(err, 'Не вдалося завантажити сесії')
  }
}

async function loadSlots() {
  loading.value = true
  error.value = ''
  try {
    const [slotResp, sessionResp] = await Promise.all([
      apiGet<Slot[]>('/cabinet/slots/'),
      fetchWeekSessions(),
    ])
    slots.value = slotResp || []
    sessions.value = sessionResp
    switchToNearestFutureDateIfNeeded()
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
    toast.success(`Вільне вікно на ${formatDateTime(startAt)} створено.`)
  } catch (err: any) {
    error.value = getSlotErrorMessage(err, '\u041d\u0435 \u0432\u0434\u0430\u043b\u043e\u0441\u044f \u0441\u0442\u0432\u043e\u0440\u0438\u0442\u0438 \u0432\u0456\u043b\u044c\u043d\u0435 \u0432\u0456\u043a\u043d\u043e')
    newStartTime.value = ''
  } finally {
    loading.value = false
  }
}

async function fillWeek() {
  const isoDate = selectedWeekStart.value
  if (!isoDate) {
    error.value = 'Не вдалося визначити вибраний тиждень.'
    return
  }
  loading.value = true
  error.value = ''
  try {
    await apiPost('/cabinet/slots/fill-week/', {
      date: isoDate,
    })
    selectedDate.value = isoDate
    moveWeekToDate(isoDate)
    selectedSessionId.value = null
    showPastSlots.value = false
    await loadSlots()
    toast.success(
      weekPeriodIncludesPast(isoDate)
        ? `Тиждень від ${formatDateOnly(isoDate)} заповнено. Для сьогодні додано лише майбутні вікна.`
        : `Тиждень від ${formatDateOnly(isoDate)} заповнено.`,
    )
  } catch (err: any) {
    error.value = getBookingErrorMessage(err, '\u041d\u0435 \u0432\u0434\u0430\u043b\u043e\u0441\u044f \u0437\u0430\u043f\u043e\u0432\u043d\u0438\u0442\u0438 \u0442\u0438\u0436\u0434\u0435\u043d\u044c \u0432\u0456\u043b\u044c\u043d\u0438\u043c\u0438 \u0432\u0456\u043a\u043d\u0430\u043c\u0438')
  } finally {
    loading.value = false
  }
}

function getWeekPeriodLabel(isoDate: string) {
  const parsed = parseDateLike(isoDate)
  if (!parsed) return weekRangeLabel.value
  const start = startOfWeek(parsed)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  return `${formatDateParts(start)}–${formatDateParts(end)}`
}

function weekPeriodIncludesPast(isoDate: string) {
  const parsed = parseDateLike(isoDate)
  if (!parsed) return false
  return startOfWeek(parsed).getTime() < new Date(todayKey).getTime()
}

function requestFillWeek() {
  const isoDate = selectedWeekStart.value
  if (!isoDate) {
    error.value = 'Не вдалося визначити вибраний тиждень.'
    return
  }

  const messageLines = [
    'Система створить вільний час для прямого запису на основі ваших робочих годин. Клієнти зможуть обрати ці проміжки у публічному профілі.',
    `Період: ${getWeekPeriodLabel(isoDate)}`,
    'Існуючі сесії та записи не буде змінено.',
  ]
  if (weekPeriodIncludesPast(isoDate)) {
    messageLines.push('Минулі години не додаються.')
  }

  confirmModal.openConfirm({
    title: 'Заповнити тиждень вільним часом?',
    message: messageLines.join('\n\n'),
    confirmText: 'Заповнити тиждень',
    cancelText: 'Скасувати',
    tone: 'neutral',
    onConfirm: fillWeek,
  })
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
  loading.value = true
  error.value = ''
  try {
    await apiDelete(`/cabinet/slots/${slotId}/`)
    slots.value = slots.value.filter((slot) => slot.id !== slotId)
    if (selectedSlotId.value === slotId) selectedSlotId.value = null
  } catch (err: any) {
    error.value = getBookingErrorMessage(err, '\u041d\u0435 \u0432\u0434\u0430\u043b\u043e\u0441\u044f \u0432\u0438\u0434\u0430\u043b\u0438\u0442\u0438 \u0432\u0456\u043b\u044c\u043d\u0435 \u0432\u0456\u043a\u043d\u043e')
  } finally {
    loading.value = false
  }
}

function requestDeleteSlot(slotId: number) {
  confirmModal.openConfirm({
    title: 'Видалити вільне вікно?',
    message: 'Воно зникне з публічного профілю.',
    confirmText: 'Видалити',
    cancelText: 'Скасувати',
    tone: 'danger',
    onConfirm: () => deleteSlot(slotId),
  })
}

onMounted(() => {
  document.addEventListener('pointerdown', handleDocumentPointerDown)
  document.addEventListener('keydown', handleDocumentKeydown)
  void loadSlots()
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
  gap: 14px;
}

.slots__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  position: relative;
  overflow: hidden;
  background: #fff;
  border: 1px solid var(--pc-border);
  border-radius: var(--pc-radius-panel);
  padding: 24px;
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
  min-height: 38px;
  padding: 6px 12px;
  border-radius: var(--pc-radius-control);
  font-weight: 700;
}

.slots__header .btn--ghost {
  border-color: var(--pc-border);
  background: #fff;
  color: var(--pc-navy-900);
}

.slots__title {
  margin: 8px 0 8px;
  color: var(--pc-navy-950);
  font-size: 32px;
  line-height: 1.15;
}

.slots__subtitle {
  max-width: 520px;
  color: var(--pc-text-muted);
  line-height: 1.55;
}


.slots__subnav {
  margin-top: -2px;
}

.slots__subnav :deep(.schedule-subnav__link) {
  border: 1px solid var(--pc-border);
  border-radius: var(--pc-radius-control);
  background: #fff;
  color: var(--pc-text-muted);
  font-weight: 700;
}

.slots__subnav :deep(.schedule-subnav__link:hover),
.slots__subnav :deep(.schedule-subnav__link:focus-visible) {
  border-color: color-mix(in srgb, var(--pc-navy-900) 28%, var(--pc-border));
  background: color-mix(in srgb, var(--pc-blue-soft) 76%, #ffffff);
  color: var(--pc-navy-900);
}

.slots__subnav :deep(.schedule-subnav__link.is-active) {
  border-color: color-mix(in srgb, var(--pc-navy-900) 36%, var(--pc-border));
  background: color-mix(in srgb, var(--pc-primary-soft) 80%, #ffffff);
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
  gap: 10px;
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
  gap: 8px;
  flex-wrap: wrap;
}

.schedule-actions {
  align-items: stretch;
  gap: 10px;
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
  background: #fff;
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

.week-range {
  min-width: 190px;
  text-align: center;
  font-weight: 700;
  color: var(--pc-navy-900);
}

.schedule-workspace {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(280px, 320px);
  gap: 12px;
  align-items: start;
}

.calendar-panel {
  overflow: hidden;
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

.day-nav-actions {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.day-list {
  display: flex;
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
  gap: 10px;
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
  .slots__header {
    flex-direction: column;
    align-items: flex-start;
    padding: 14px 16px;
    gap: 10px;
  }

  .slots__header::after {
    display: none;
  }

  .slots__title {
    font-size: 26px;
    margin: 4px 0;
    line-height: 1.16;
  }

  .slots__subtitle {
    margin: 0;
    font-size: 13px;
    line-height: 1.32;
    max-width: 100%;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .panel--split {
    grid-template-columns: 1fr;
  }

  .schedule-workspace {
    grid-template-columns: 1fr;
  }

  .schedule-toolbar__main {
    align-items: flex-start;
  }

  .week-nav,
  .schedule-actions {
    width: 100%;
  }

  .action-group {
    min-width: 0;
    width: 100%;
  }

  .action-group__buttons .btn {
    flex: 1 1 170px;
  }

  .week-range {
    min-width: 0;
    text-align: left;
  }

  .calendar-scroll,
  .week-calendar {
    display: none;
  }

  .mobile-day-schedule {
    display: grid;
    gap: 8px;
  }

  .slot-detail-panel {
    position: static;
  }

  .filters-toolbar__row {
    align-items: flex-start;
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
