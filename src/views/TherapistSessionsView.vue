<template>
  <section class="sessions">
    <header class="sessions__hero">
      <div>
        <div class="badge">РЎРµСЃС–С— СЃРїРµС†С–Р°Р»С–СЃС‚Р°</div>
        <h1 class="title sessions__title">РљРµСЂСѓР№С‚Рµ СЃРµСЃС–СЏРјРё</h1>
        <p class="muted sessions__subtitle">
          РЎРїРёСЃРѕРє Р·Р°РїР»Р°РЅРѕРІР°РЅРёС… С– РјРёРЅСѓР»РёС… СЃРµСЃС–Р№. Р”С–С— РґРѕСЃС‚СѓРїРЅС– РѕРґСЂР°Р·Сѓ.
        </p>
      </div>
      <RouterLink class="btn btn--ghost" to="/cabinet">РќР°Р·Р°Рґ РґРѕ РєР°Р±С–РЅРµС‚Сѓ</RouterLink>
    </header>

    <div v-if="error" class="form-error">{{ error }}</div>
    <LoadingSkeleton v-if="loading" variant="list" :count="3" />

    <section v-if="postSessionContext" class="panel panel--next-step">
      <div class="panel__header">
        <div>
          <div class="badge badge--soft">РџС–СЃР»СЏ СЃРµСЃС–С—</div>
          <h2 class="panel__title">РћР±РµСЂС–С‚СЊ РЅР°СЃС‚СѓРїРЅРёР№ РєСЂРѕРє</h2>
        </div>
        <button class="btn btn--ghost btn--sm" type="button" @click="clearPostSessionContext">
          РЎС…РѕРІР°С‚Рё
        </button>
      </div>
      <div class="next-step-rail">
        <button class="btn btn--sm" type="button" @click="openPostSessionWorkbook">
          Р’С–РґРєСЂРёС‚Рё СЂРѕР±РѕС‡РёР№ Р·РѕС€РёС‚
        </button>
        <RouterLink class="btn btn--ghost btn--sm" :to="postSessionClientLink">
          Р’С–РґРєСЂРёС‚Рё РєР»С–С”РЅС‚Р°
        </RouterLink>
        <RouterLink
          v-if="postSessionNextSession"
          class="btn btn--ghost btn--sm"
          :to="`/cabinet/sessions/${postSessionNextSession.id}`"
        >
          РќР°СЃС‚СѓРїРЅР° СЃРµСЃС–СЏ: {{ formatDateTime(postSessionNextSession.slot_start_at) }}
        </RouterLink>
        <button class="btn btn--ghost btn--sm" type="button" @click="returnToSessionList">
          РџРѕРІРµСЂРЅСѓС‚РёСЃСЊ РґРѕ СЃРїРёСЃРєСѓ
        </button>
      </div>
    </section>

    <section class="panel panel--priority">
      <div class="panel__header">
        <div>
          <div class="badge badge--soft">РџСЂС–РѕСЂРёС‚РµС‚</div>
          <h2 class="panel__title">РњР°Р№Р±СѓС‚РЅС– СЃРµСЃС–С—</h2>
        </div>
      </div>
      <div class="priority-grid">
        <div class="priority-card">
          <div class="priority-title">РћС‡С–РєСѓСЋС‚СЊ РїС–РґС‚РІРµСЂРґР¶РµРЅРЅСЏ</div>
          <div class="priority-value">
            {{ needsConfirmation.length }}
          </div>
          <div class="muted">РџС–РґС‚РІРµСЂРґСЊС‚Рµ РЅР°Р№Р±Р»РёР¶С‡С– СЃРµСЃС–С—, С‰РѕР± СѓРЅРёРєРЅСѓС‚Рё вЂњРќРµ РІС–РґР±СѓР»РѕСЃСЏвЂќ.</div>
          <div v-if="needsConfirmation.length" class="priority-list">
            <div
              v-for="session in needsConfirmation.slice(0, 3)"
              :key="session.id"
              class="priority-item"
            >
              <div class="priority-item__main">
                <div class="priority-time">{{ formatDateTime(session.slot_start_at) }}</div>
                <div class="muted">{{ sessionClientLabel(session) }}</div>
                <div class="muted">{{ sessionFormatBadge(session) }}</div>
                <div class="muted priority-item__context">{{ sessionContextHint(session) }}</div>
              </div>
              <button
                class="btn btn--sm"
                type="button"
                :disabled="isActionLoading(session.id)"
                @click="confirmSession(session.id)"
              >
                РџС–РґС‚РІРµСЂРґРёС‚Рё
              </button>
            </div>
          </div>
        </div>
        <div class="priority-card">
          <div class="priority-title">{{ isPriorityLive ? 'РЎРµСЃС–СЏ С‚СЂРёРІР°С”' : 'РќР°Р№Р±Р»РёР¶С‡Р° СЃРµСЃС–СЏ' }}</div>
          <div v-if="prioritySession" class="priority-next">
            <RouterLink class="priority-next__main" :to="`/cabinet/sessions/${prioritySession.id}`">
              <div class="priority-time">{{ formatDateTime(prioritySession.slot_start_at) }}</div>
              <div class="muted">
                РљР»С–С”РЅС‚: {{ sessionClientLabel(prioritySession) }}
              </div>
              <div class="muted">{{ sessionFormatBadge(prioritySession) }}</div>
              <div class="muted priority-next__context">{{ sessionContextHint(prioritySession) }}</div>
              <div v-if="isPriorityLive" class="status-pill status-pill--danger">РЎРµСЃС–СЏ С‚СЂРёРІР°С”</div>
              <div v-else class="status-pill" :class="statusClass(prioritySession)">
                {{ statusLabel(prioritySession) }}
              </div>
              <div v-if="timeUntilLabel(prioritySession)" class="status-pill status-pill--warn">
                РџРѕС‡Р°С‚РѕРє С‡РµСЂРµР· {{ timeUntilLabel(prioritySession) }}
              </div>
            </RouterLink>
            <div class="priority-next__actions">
              <button
                v-if="priorityPrimaryAction === 'confirm'"
                class="btn btn--sm"
                type="button"
                :disabled="isActionLoading(prioritySession.id)"
                @click="confirmSession(prioritySession.id)"
              >
                РџС–РґС‚РІРµСЂРґРёС‚Рё
              </button>
              <a
                v-else-if="priorityPrimaryAction === 'join'"
                class="btn btn--sm"
                :href="meetingUrl(prioritySession)"
                target="_blank"
                rel="noopener noreferrer"
              >
                РџСЂРёС”РґРЅР°С‚РёСЃСЏ
              </a>
              <RouterLink v-else class="btn btn--sm" :to="`/cabinet/sessions/${prioritySession.id}`">
                Р’С–РґРєСЂРёС‚Рё СЃРµСЃС–СЋ
              </RouterLink>
              <RouterLink
                v-if="priorityPrimaryAction !== 'details'"
                class="btn btn--ghost btn--sm"
                :to="`/cabinet/sessions/${prioritySession.id}`"
              >
                Р’С–РґРєСЂРёС‚Рё СЃРµСЃС–СЋ
              </RouterLink>
            </div>
          </div>
          <div v-else class="muted">РќРµРјР°С” РјР°Р№Р±СѓС‚РЅС–С… СЃРµСЃС–Р№.</div>
        </div>
      </div>
    </section>

    <section class="panel">
      <div class="panel__header">
        <div>
          <div class="badge badge--soft">Р¤С–Р»СЊС‚СЂРё</div>
          <h2 class="panel__title">РџРѕС€СѓРє РїРѕС‚СЂС–Р±РЅРёС… СЃРµСЃС–Р№</h2>
        </div>
        <button
          v-if="hasActiveSessionFilters"
          class="btn btn--ghost btn--sm"
          type="button"
          @click="clearSessionFilters"
        >
          РЎРєРёРЅСѓС‚Рё С„С–Р»СЊС‚СЂРё
        </button>
      </div>
      <div class="session-filters">
        <label class="field session-filters__field">
          <span class="muted">РЎС‚Р°С‚СѓСЃ</span>
          <select v-model="statusFilter" class="input input--select">
            <option
              v-for="option in sessionStatusFilterOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </select>
        </label>
        <label class="field session-filters__field session-filters__field--date" @click="openDateFilterPicker">
          <span class="muted">Р”Р°С‚Р°</span>
          <input
            ref="dateFilterInputRef"
            v-model="dateFilter"
            class="input session-filters__date-input"
            type="date"
          />
        </label>
      </div>
    </section>

    <section class="panel">
      <div class="panel__header">
        <div>
          <div class="badge badge--soft">РќР°Р№Р±Р»РёР¶С‡С–</div>
          <h2 class="panel__title">Р—Р°РїР»Р°РЅРѕРІР°РЅС– СЃРµСЃС–С—</h2>
        </div>
      </div>
      <div v-if="needsConfirmation.length" class="new-bookings-banner">
        <div>
          РќРѕРІС– Р±СЂРѕРЅСЋРІР°РЅРЅСЏ: <strong>{{ needsConfirmation.length }}</strong>
        </div>
        <button class="btn btn--ghost btn--sm" type="button" @click="needsConfirmation[0] && focusSession(needsConfirmation[0].id)">
          РџРµСЂРµР№С‚Рё РґРѕ РїРµСЂС€РѕРіРѕ
        </button>
      </div>
      <EmptyState
        v-if="!loading && filteredUpcomingSessions.length === 0"
        title="РќРµРјР°С” Р·Р°РїР»Р°РЅРѕРІР°РЅРёС… СЃРµСЃС–Р№"
        description="РЎС‚РІРѕСЂС–С‚СЊ РІС–Р»СЊРЅС– РІС–РєРѕРЅС†СЏ Р°Р±Рѕ РїРѕРґС–Р»С–С‚СЊСЃСЏ РїСЂРѕС„С–Р»РµРј, С‰РѕР± РєР»С–С”РЅС‚Рё РјРѕРіР»Рё Р·Р°РїРёСЃР°С‚РёСЃСЏ."
        action-text="РЎС‚РІРѕСЂРёС‚Рё РІС–РєРѕРЅС†Рµ"
        action-to="/cabinet/slots"
        secondary-text="РљРµСЂСѓРІР°РЅРЅСЏ РїСЂРѕС„С–Р»РµРј"
        secondary-to="/cabinet/profile"
      />
      <div v-else class="session-list">
        <article
          v-for="session in filteredUpcomingSessions"
          :key="session.id"
          :id="`session-${session.id}`"
          class="session-card session-card--with-photo"
          :class="{ 'session-card--highlight': highlightedSessionId === session.id }"
          @mouseenter="clearHighlight(session.id)"
        >
          <div class="session-summary">
            <div class="session-info">
              <div class="session-time">{{ formatDateTime(session.slot_start_at) }}</div>
              <div class="muted">{{ formatDuration(session.slot_start_at, session.slot_end_at) }}</div>
              <div class="muted">
                РљР»С–С”РЅС‚: {{ sessionClientLabel(session) }}
              </div>
              <div class="muted">{{ sessionFormatBadge(session) }}</div>
              <div class="muted session-context">{{ sessionContextHint(session) }}</div>
              <div v-if="session.client_email" class="muted">РџРѕС€С‚Р°: {{ session.client_email }}</div>
              <div class="status-pill" :class="statusClass(session)">
                {{ statusLabel(session) }}
              </div>
              <div
                v-if="hasPaymentBadge(session)"
                class="status-pill status-pill--payment"
              >
                {{ paymentBadgeLabel(session) }}
              </div>
              <div
                v-if="timeUntilLabel(session)"
                class="status-pill status-pill--warn"
              >
                РџРѕС‡Р°С‚РѕРє С‡РµСЂРµР· {{ timeUntilLabel(session) }}
              </div>
              <div
                v-if="session.status === 'SCHEDULED'"
                class="status-pill status-pill--danger"
              >
                РџРѕС‚СЂС–Р±РЅРµ РїС–РґС‚РІРµСЂРґР¶РµРЅРЅСЏ
              </div>
              <div
                v-if="session.status === 'SCHEDULED'"
                class="status-pill status-pill--new"
              >
                РќРѕРІР° Р·Р°СЏРІРєР°
              </div>
              <div
                v-if="hasPendingReschedule(session.id)"
                class="status-pill status-pill--warn"
              >
                Р„ Р·Р°РїРёС‚ РЅР° РїРµСЂРµРЅРѕСЃ
              </div>
            </div>
            <div class="session-actions">
              <button
                v-if="isPrimaryAction(session, 'confirm')"
                class="btn btn--sm"
                type="button"
                :disabled="isActionLoading(session.id)"
                @click="confirmSession(session.id)"
              >
                РџС–РґС‚РІРµСЂРґРёС‚Рё
              </button>
              <a
                v-else-if="isPrimaryAction(session, 'join')"
                class="btn btn--sm"
                :href="meetingUrl(session)"
                target="_blank"
                rel="noopener noreferrer"
              >
                РџСЂРёС”РґРЅР°С‚РёСЃСЏ
              </a>
              <RouterLink v-else class="btn btn--sm" :to="`/cabinet/sessions/${session.id}`">
                Р’С–РґРєСЂРёС‚Рё СЃРµСЃС–СЋ
              </RouterLink>
              <RouterLink
                v-if="!isPrimaryAction(session, 'details')"
                class="btn btn--ghost btn--sm"
                :to="`/cabinet/sessions/${session.id}`"
              >
                Р’С–РґРєСЂРёС‚Рё СЃРµСЃС–СЋ
              </RouterLink>
              <button
                v-if="session.status === 'CONFIRMED'"
                class="btn btn--ghost btn--sm"
                type="button"
                :disabled="isActionLoading(session.id)"
                @click="openCompletionModal(session.id)"
              >
                Р—Р°РІРµСЂС€РёС‚Рё
              </button>
              <button
                class="btn btn--ghost btn--sm"
                type="button"
                :disabled="isActionLoading(session.id) || !canCancel(session.status)"
                @click="cancelSession(session.id)"
              >
                РЎРєР°СЃСѓРІР°С‚Рё
              </button>
              <button
                class="btn btn--ghost btn--sm"
                type="button"
                :disabled="isActionLoading(session.id) || !canReschedule(session.status) || hasPendingReschedule(session.id)"
                @click="toggleReschedule(session.id)"
              >
                РџРµСЂРµРЅРµСЃС‚Рё
              </button>
              <button
                v-if="canShowRecurringAction(session)"
                class="btn btn--ghost btn--sm"
                type="button"
                :disabled="isActionLoading(session.id)"
                @click="toggleRecurring(session.id)"
              >
                РџРѕРІС‚РѕСЂСЋРІР°С‚Рё С‰РѕС‚РёР¶РЅСЏ
              </button>
            </div>
          </div>
          <div class="session-photo-wrap">
            <img
              v-if="therapistPhotoUrl"
              :src="therapistPhotoUrl"
              alt="Р¤РѕС‚Рѕ СЃРїРµС†С–Р°Р»С–СЃС‚Р°"
              class="session-photo"
            />
            <div v-else class="session-photo session-photo--empty">Р¤РѕС‚Рѕ</div>
          </div>
          <div v-if="rescheduleSessionId === session.id" class="reschedule-panel">
            <label class="field">
              РќРѕРІРµ РІС–Р»СЊРЅРµ РІС–РєРѕРЅС†Рµ
              <select v-model.number="rescheduleSlotId" class="input input--select">
                <option value="">РћР±РµСЂС–С‚СЊ РІС–Р»СЊРЅРµ РІС–РєРѕРЅС†Рµ</option>
                <option v-for="slot in availableSlots" :key="slot.id" :value="slot.id">
                  {{ formatDateTime(slot.start_at) }} ? {{ formatDuration(slot.start_at, slot.end_at) }}
                </option>
              </select>
            </label>
            <div class="suggestions-block">
              <div class="muted suggestions-title">Р РµРєРѕРјРµРЅРґРѕРІР°РЅС– РІР°СЂС–Р°РЅС‚Рё РїРµСЂРµРЅРµСЃРµРЅРЅСЏ</div>
              <div v-if="isSuggestionsLoading(session.id)" class="muted">
                Р—Р°РІР°РЅС‚Р°Р¶РµРЅРЅСЏ СЂРµРєРѕРјРµРЅРґР°С†С–Р№...
              </div>
              <div v-else-if="(rescheduleSuggestions[session.id] || []).length === 0" class="muted">
                РќРµ РІРґР°Р»РѕСЃСЏ Р·РЅР°Р№С‚Рё РІС–РґРїРѕРІС–РґРЅС– РІР°СЂС–Р°РЅС‚Рё РїРµСЂРµРЅРµСЃРµРЅРЅСЏ
              </div>
              <div v-else class="suggestions-list">
                <button
                  v-for="item in (rescheduleSuggestions[session.id] || []).slice(0, 5)"
                  :key="item.slot_id"
                  class="btn btn--ghost btn--sm suggestion-btn"
                  type="button"
                  @click="selectSuggestedSlot(item.slot_id)"
                >
                  <span>{{ formatDateTime(item.start_at) }} Р’В· {{ formatDuration(item.start_at, item.end_at) }}</span>
                  <span class="muted suggestion-meta">{{ suggestionReasonLabel(item.reason_tag) }}</span>
                </button>
              </div>
              <div class="muted">
                РќР°Р№Р±Р»РёР¶С‡С– РґРѕСЃС‚СѓРїРЅС– РІС–РєРЅР° РґР»СЏ С†С–С”С— СЃРµСЃС–С—
              </div>
            </div>
            <div class="reschedule-actions">
              <button
                class="btn btn--sm"
                type="button"
                :disabled="isActionLoading(session.id) || !rescheduleSlotId"
                @click="submitReschedule(session.id)"
              >
                РџС–РґС‚РІРµСЂРґРёС‚Рё РїРµСЂРµРЅРѕСЃ
              </button>
              <button class="btn btn--ghost btn--sm" type="button" @click="closeReschedule">
                РЎРєР°СЃСѓРІР°С‚Рё
              </button>
            </div>
          </div>
          <div v-if="recurringSessionId === session.id" class="recurring-panel">
            <label class="field">
              РљС–Р»СЊРєС–СЃС‚СЊ РїРѕРІС‚РѕСЂС–РІ
              <select v-model="recurringPreset" class="input input--select">
                <option :value="4">4 С‚РёР¶РЅС–</option>
                <option :value="8">8 С‚РёР¶РЅС–РІ</option>
                <option :value="12">12 С‚РёР¶РЅС–РІ</option>
                <option value="custom">Р’Р»Р°СЃРЅРµ С‡РёСЃР»Рѕ</option>
              </select>
            </label>
            <label v-if="recurringPreset === 'custom'" class="field">
              Р’РєР°Р¶С–С‚СЊ РєС–Р»СЊРєС–СЃС‚СЊ (1-52)
              <input
                v-model.number="recurringCustomOccurrences"
                type="number"
                min="1"
                max="52"
                step="1"
                class="input"
                placeholder="РќР°РїСЂРёРєР»Р°Рґ, 6"
              />
            </label>
            <div class="recurring-actions">
              <button
                class="btn btn--sm"
                type="button"
                :disabled="isActionLoading(session.id)"
                @click="submitRecurring(session.id)"
              >
                РЎС‚РІРѕСЂРёС‚Рё СЃРµСЂС–СЋ
              </button>
              <button class="btn btn--ghost btn--sm" type="button" @click="closeRecurring">
                РЎРєР°СЃСѓРІР°С‚Рё
              </button>
            </div>

            <div v-if="recurringResult[session.id]" class="recurring-result">
              <div class="status-pill status-pill--ok">
                РЎС‚РІРѕСЂРµРЅРѕ {{ recurringResult[session.id]?.created_count ?? 0 }} СЃРµСЃС–Р№
              </div>
              <div
                v-if="(recurringResult[session.id]?.skipped_count ?? 0) > 0"
                class="status-pill status-pill--warn"
              >
                РџСЂРѕРїСѓС‰РµРЅРѕ {{ recurringResult[session.id]?.skipped_count ?? 0 }} С‡РµСЂРµР· РєРѕРЅС„Р»С–РєС‚Рё
              </div>

              <div v-if="(recurringResult[session.id]?.created_dates || []).length" class="recurring-list">
                <div class="muted">РЎС‚РІРѕСЂРµРЅС– РґР°С‚Рё:</div>
                <ul class="recurring-ul">
                  <li v-for="date in (recurringResult[session.id]?.created_dates || [])" :key="date">
                    {{ formatDateTime(date) }}
                  </li>
                </ul>
              </div>

              <div v-if="(recurringResult[session.id]?.skipped || []).length" class="recurring-list">
                <div class="muted">РџСЂРѕРїСѓС‰РµРЅС– РґР°С‚Рё:</div>
                <ul class="recurring-ul">
                  <li v-for="item in (recurringResult[session.id]?.skipped || [])" :key="`${item.start_at}-${item.reason}`">
                    {{ formatDateTime(item.start_at) }} - {{ recurringReasonLabel(item.reason) }}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </article>
      </div>
    </section>

    <section class="panel">
      <div class="panel__header">
        <div>
          <div class="badge badge--soft">Р—Р°РїРёС‚Рё</div>
          <h2 class="panel__title">РџРµСЂРµРЅРµСЃРµРЅРЅСЏ СЃРµСЃС–Р№</h2>
        </div>
      </div>
      <div v-if="requestsLoading" class="muted">Р—Р°РІР°РЅС‚Р°Р¶РµРЅРЅСЏ Р·Р°РїРёС‚С–РІ...</div>
      <EmptyState
        v-else-if="rescheduleRequests.length === 0"
        title="РќРµРјР°С” РЅРѕРІРёС… Р·Р°РїРёС‚С–РІ"
        description="РљРѕР»Рё РєР»С–С”РЅС‚Рё РїРѕРїСЂРѕСЃСЏС‚СЊ РїРµСЂРµРЅРµСЃС‚Рё СЃРµСЃС–СЋ вЂ” С‚СѓС‚ Р·'СЏРІРёС‚СЊСЃСЏ Р·Р°РїРёС‚."
      />
      <div v-else class="request-list">
        <article v-for="req in rescheduleRequests" :key="req.id" class="request-card">
          <div class="request-info">
            <div class="request-title">
              РЎРµСЃС–СЏ #{{ req.session_id }} В· {{ req.client_name || req.client_username || "РљР»С–С”РЅС‚" }}
            </div>
            <div v-if="req.client_email" class="muted">РџРѕС€С‚Р°: {{ req.client_email }}</div>
            <div class="muted">
              Р—Р°РїРёС‚Р°РЅРµ РІС–Р»СЊРЅРµ РІС–РєРѕРЅС†Рµ:
              <span v-if="req.requested_slot_start_at && req.requested_slot_end_at">
                {{ formatDateTime(req.requested_slot_start_at) }}
                Р’В· {{ formatDuration(req.requested_slot_start_at, req.requested_slot_end_at) }}
              </span>
              <span v-else>#{{ req.requested_slot_id }}</span>
            </div>
            <div class="status-pill" :class="requestStatusClass(req.status)">
              {{ rescheduleStatusLabel(req.status) }}
            </div>
          </div>
          <div class="request-actions">
            <RouterLink class="btn btn--ghost btn--sm" :to="`/cabinet/sessions/${req.session_id}`">
              Р”РµС‚Р°Р»С– СЃРµСЃС–С—
            </RouterLink>
            <button
              v-if="req.status === 'PENDING'"
              class="btn btn--ghost btn--sm"
              type="button"
              :disabled="isRequestLoading(req.id)"
              @click="approveRequest(req.id)"
            >
              РџРѕРіРѕРґРёС‚Рё
            </button>
            <button
              v-if="req.status === 'PENDING'"
              class="btn btn--ghost btn--sm"
              type="button"
              :disabled="isRequestLoading(req.id)"
              @click="declineRequest(req.id)"
            >
              Р’С–РґС…РёР»РёС‚Рё
            </button>
          </div>
        </article>
      </div>
    </section>

    <section class="panel">
      <div class="panel__header">
        <div>
          <div class="badge badge--soft">РњРёРЅСѓР»С–</div>
          <h2 class="panel__title">Р†СЃС‚РѕСЂС–СЏ</h2>
        </div>
      </div>
      <EmptyState
        v-if="!loading && filteredHistorySessions.length === 0"
        title="Р†СЃС‚РѕСЂС–СЏ РїРѕСЂРѕР¶РЅСЏ"
        description="РџС–СЃР»СЏ Р·Р°РІРµСЂС€РµРЅРёС… Р°Р±Рѕ РІС–РґРјС–РЅРµРЅРёС… СЃРµСЃС–Р№ С‚СѓС‚ Р·'СЏРІРёС‚СЊСЃСЏ С–СЃС‚РѕСЂС–СЏ."
      />
      <div v-else class="history-grid">
        <article
          v-for="session in filteredHistorySessions"
          :key="session.id"
          :id="`session-${session.id}`"
          class="session-card history-tile"
          :class="{ 'session-card--highlight': highlightedSessionId === session.id }"
          @mouseenter="clearHighlight(session.id)"
        >
          <div class="history-tile__body">
            <div class="session-info">
              <div class="session-time">{{ formatDateTime(session.slot_start_at) }}</div>
              <div class="muted">{{ formatDuration(session.slot_start_at, session.slot_end_at) }}</div>
              <div class="muted">
                РљР»С–С”РЅС‚: {{ sessionClientLabel(session) }}
              </div>
              <div class="muted">{{ sessionFormatBadge(session) }}</div>
              <div class="muted session-context">{{ sessionContextHint(session) }}</div>
              <div v-if="session.client_email" class="muted">РџРѕС€С‚Р°: {{ session.client_email }}</div>
              <div class="status-pill" :class="statusClass(session)">
                {{ statusLabel(session) }}
              </div>
              <div
                v-if="hasPaymentBadge(session)"
                class="status-pill status-pill--payment"
              >
                {{ paymentBadgeLabel(session) }}
              </div>
              <div class="muted">{{ sessionNoteSummary(session) }}</div>
            </div>
            <div class="session-actions history-tile__actions">
              <button
                v-if="session.status === 'CONFIRMED'"
                class="btn btn--ghost btn--sm"
                type="button"
                :disabled="isActionLoading(session.id)"
                @click="openCompletionModal(session.id)"
              >
                Р—Р°РІРµСЂС€РёС‚Рё
              </button>
              <RouterLink class="btn btn--ghost btn--sm" :to="`/cabinet/sessions/${session.id}`">
                Р”РµС‚Р°Р»С–
              </RouterLink>
            </div>
          </div>
        </article>
      </div>
    </section>

    <div v-if="noteSessionId" class="note-modal">
      <div class="note-modal__backdrop" @click="closeNote"></div>
      <div class="note-modal__content">
        <div class="note-modal__header">
          <div>
            <div class="note-title">РќРѕС‚Р°С‚РєРё РїС–СЃР»СЏ СЃРµСЃС–С—</div>
            <div class="muted">РћРєСЂРµРјРѕ РІРµРґС–С‚СЊ РЅРѕС‚Р°С‚РєСѓ РїРѕ СЃРµСЃС–С— С‚Р° СЂРѕР±РѕС‡РёР№ Р·РѕС€РёС‚.</div>
          </div>
          <button class="btn btn--ghost btn--sm" type="button" @click="closeNote">
            Р—Р°РєСЂРёС‚Рё
          </button>
        </div>
        <div
          v-if="postSessionContext && noteSessionId === postSessionContext.sessionId"
          class="next-step-rail next-step-rail--modal"
        >
          <RouterLink class="btn btn--ghost btn--sm" :to="postSessionClientLink">
            Р’С–РґРєСЂРёС‚Рё РєР»С–С”РЅС‚Р°
          </RouterLink>
          <RouterLink
            v-if="postSessionNextSession"
            class="btn btn--ghost btn--sm"
            :to="`/cabinet/sessions/${postSessionNextSession.id}`"
          >
            РќР°СЃС‚СѓРїРЅР° СЃРµСЃС–СЏ: {{ formatDateTime(postSessionNextSession.slot_start_at) }}
          </RouterLink>
          <button class="btn btn--ghost btn--sm" type="button" @click="returnToSessionList">
            РџРѕРІРµСЂРЅСѓС‚РёСЃСЊ РґРѕ СЃРїРёСЃРєСѓ
          </button>
        </div>
        <div class="note-modal__body">
          <div class="note-grid">
            <div class="note-panel note-panel--session">
              <label class="field">
                <span class="note-title">РќРѕС‚Р°С‚РєР° РїС–СЃР»СЏ СЃРµСЃС–С—</span>
                <span class="note-badge">РЎРµСЃС–СЏ</span>
                <span class="note-state muted">Стан: {{ noteContentStateLabel() }}</span>
                <textarea
                  ref="noteTextareaRef"
                  v-model="noteDraft"
                  class="input note-textarea note-textarea--session"
                  rows="3"
                  placeholder="РљРѕСЂРѕС‚РєРёР№ РєРѕРјРµРЅС‚Р°СЂ РїРѕ СЃРµСЃС–С— С‚Р° РєР»СЋС‡РѕРІС– СЃРїРѕСЃС‚РµСЂРµР¶РµРЅРЅСЏ."
                ></textarea>
                <div class="note-helper muted">РћРєСЂРµРјР° РЅРѕС‚Р°С‚РєР° СЃР°РјРµ РґР»СЏ С†С–С”С— СЃРµСЃС–С—.</div>
              </label>
              <div class="note-actions">
                <button
                  class="btn btn--sm"
                  type="button"
                  :disabled="noteSessionId ? isNoteSaving(noteSessionId) : false"
                  @click="noteSessionId ? saveNote(noteSessionId) : null"
                >
                  Р—Р±РµСЂРµРіС‚Рё РЅРѕС‚Р°С‚РєСѓ
                </button>
                <div v-if="noteSaveMessage" class="note-save-feedback">{{ noteSaveMessage }}</div>
              </div>
            </div>
            <div class="note-panel note-panel--workbook">
              <label class="field">
                <span class="note-title">Р РѕР±РѕС‡РёР№ Р·РѕС€РёС‚</span>
                <span class="note-badge">Р’РЅСѓС‚СЂС–С€РЅС–Р№</span>
                <span class="note-state muted">Стан: {{ workbookContentStateLabel() }}</span>
                <textarea
                  ref="journalTextareaRef"
                  v-model="journalDraft"
                  class="input note-textarea note-textarea--workbook"
                  rows="9"
                  placeholder="Р”РѕРІРіРѕСЃС‚СЂРѕРєРѕРІРёР№ РєРѕРЅС‚РµРєСЃС‚, РґРёРЅР°РјС–РєР°, СЃРїРѕСЃС‚РµСЂРµР¶РµРЅРЅСЏ С‚Р° РїР»Р°РЅ РїРѕРґР°Р»СЊС€РѕС— СЂРѕР±РѕС‚Рё."
                  :disabled="journalLoading || !journalClientId"
                ></textarea>
                <div class="note-helper muted">
                  {{
                    journalIsMissing
                      ? 'Робочий зошит ще відсутній. Додайте перший змістовний запис.'
                      : 'Внутрішній розділ спеціаліста, не видимий клієнту.'
                  }}
                </div>
              </label>
              <div class="note-actions">
                <button
                  class="btn btn--sm"
                  type="button"
                  :disabled="journalSaving || journalLoading || !journalClientId"
                  @click="journalClientId ? saveClientJournal(journalClientId) : null"
                >
                  Р—Р±РµСЂРµРіС‚Рё СЂРѕР±РѕС‡РёР№ Р·РѕС€РёС‚
                </button>
                <div v-if="journalSaveMessage" class="note-save-feedback">{{ journalSaveMessage }}</div>
              </div>
            </div>
          </div>
        </div>
        <div class="note-modal__footer">
          <div class="muted note-modal__footer-hint">
            Р—Р±РµСЂРµР¶С–С‚СЊ РїРѕС‚СЂС–Р±РЅС– РїРѕР»СЏ Р№ Р·Р°РІРµСЂС€С–С‚СЊ РїС–СЃР»СЏСЃРµСЃС–Р№РЅРёР№ РєСЂРѕРє.
          </div>
          <button class="btn btn--sm note-modal__primary-action" type="button" @click="closeNote">
            Р—Р°РІРµСЂС€РёС‚Рё РїС–СЃР»СЏ СЃРµСЃС–С—
          </button>
        </div>
      </div>
    </div>

    <SessionCompletionModal
      :open="Boolean(completionSessionId)"
      v-model="completionDurationDraft"
      :loading="isCompletionSubmitting"
      :planned-duration-minutes="completionPlannedDuration"
      :error-message="completionDurationError"
      @confirm="submitCompletion"
      @cancel="closeCompletionModal"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { apiGet, fetchSpecialistProfile, type SessionFormat, type SpecialistProfile } from '../lib/api'
import {
  BOOKING_ERROR_FALLBACKS,
  BOOKING_SUCCESS_MESSAGES,
  getBookingErrorMessage,
} from '../lib/bookingCopy'
import {
  approveSpecialistRescheduleRequest as approveSpecialistRescheduleRequestAction,
  canCancel as sharedCanCancel,
  canReschedule as sharedCanReschedule,
  canShowRecurringAction as sharedCanShowRecurringAction,
  cancelSpecialistSession as cancelSpecialistSessionAction,
  completeSpecialistSession as completeSpecialistSessionAction,
  confirmSpecialistSession as confirmSpecialistSessionAction,
  createRecurringSpecialistSessions as createRecurringSpecialistSessionsAction,
  declineSpecialistRescheduleRequest as declineSpecialistRescheduleRequestAction,
  fetchSpecialistAvailableSlots as fetchSpecialistAvailableSlotsData,
  fetchSpecialistClientWorkbookSnapshot as fetchSpecialistClientWorkbookSnapshotData,
  fetchSpecialistRescheduleRequests as fetchSpecialistRescheduleRequestsData,
  fetchSpecialistRescheduleSuggestions as fetchSpecialistRescheduleSuggestionsData,
  fetchSpecialistSessionNoteContent as fetchSpecialistSessionNoteContentData,
  findNextUpcomingSession as getNextUpcomingSession,
  formatSessionDateTime as sharedFormatSessionDateTime,
  formatSessionDuration as sharedFormatSessionDuration,
  parseActualDurationInput as getActualDurationPayload,
  parseRecurringOccurrences as getRecurringOccurrences,
  requestStatusClass as getRequestStatusClass,
  rescheduleSpecialistSession as rescheduleSpecialistSessionAction,
  rescheduleStatusLabel as getRescheduleStatusLabel,
  saveSpecialistSessionNote as saveSpecialistSessionNoteAction,
  saveSpecialistClientJournal as saveSpecialistClientJournalAction,
  sessionDurationMinutes as getSessionDurationMinutes,
  statusClass as getStatusClass,
  statusLabel as getStatusLabel,
  suggestedActualDurationInput as getSuggestedActualDurationInput,
  suggestionReasonLabel as getSuggestionReasonLabel,
  timeUntilLabel as getTimeUntilLabel,
  type SpecialistRecurringSummary,
  type SpecialistRescheduleRequest,
  type SpecialistRescheduleSuggestion,
  type SpecialistSessionLike,
  type SpecialistSlot,
} from '../lib/specialistSessions'
import { canJoinExternalMeeting, normalizeMeetingUrl } from '../lib/sessionExecution'
import { useToast } from '../composables/useToast'
import LoadingSkeleton from '../components/LoadingSkeleton.vue'
import EmptyState from '../components/EmptyState.vue'
import SessionCompletionModal from '../components/SessionCompletionModal.vue'

type Session = {
  id: number
  status: string
  payment_badge_state?: 'paid' | 'awaiting_confirmation' | null
  client: number
  client_display_name?: string | null
  client_username?: string
  client_name?: string
  client_email?: string
  therapist: number
  therapist_username?: string
  slot: number | null
  slot_start_at: string | null
  slot_end_at: string | null
  session_format?: SessionFormat | null
  meeting_mode?: 'ONLINE' | 'OFFLINE' | null
  offline_location?: string | null
  meeting_url?: string | null
  join_available?: boolean
  join_starts_at?: string | null
  join_ends_at?: string | null
  has_note?: boolean | null
  note_updated_at?: string | null
}

type Slot = SpecialistSlot
type RescheduleRequest = SpecialistRescheduleRequest
type RecurringSummary = SpecialistRecurringSummary
type RescheduleSuggestion = SpecialistRescheduleSuggestion
type PrimarySessionAction = 'confirm' | 'join' | 'details'
type PostSessionContext = {
  sessionId: number
  clientId: number | null
}

type SessionStatusFilter =
  | 'ALL'
  | 'SCHEDULED'
  | 'CONFIRMED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW'

const sessionStatusFilterOptions: Array<{ value: SessionStatusFilter; label: string }> = [
  { value: 'ALL', label: 'РЈСЃС– СЃС‚Р°С‚СѓСЃРё' },
  { value: 'SCHEDULED', label: 'Р—Р°РїР»Р°РЅРѕРІР°РЅРѕ' },
  { value: 'CONFIRMED', label: 'РџС–РґС‚РІРµСЂРґР¶РµРЅРѕ' },
  { value: 'COMPLETED', label: 'Р—Р°РІРµСЂС€РµРЅРѕ' },
  { value: 'CANCELLED', label: 'РЎРєР°СЃРѕРІР°РЅРѕ' },
  { value: 'NO_SHOW', label: 'РќРµ РІС–РґР±СѓР»РѕСЃСЏ' },
]

const upcoming = ref<Session[]>([])
const past = ref<Session[]>([])
const availableSlots = ref<Slot[]>([])
const loading = ref(false)
const error = ref('')
const actionLoading = ref<Set<number>>(new Set())
const rescheduleSessionId = ref<number | null>(null)
const rescheduleSlotId = ref<number | ''>('')
const rescheduleSuggestions = ref<Record<number, RescheduleSuggestion[]>>({})
const suggestionsLoading = ref<Set<number>>(new Set())
const recurringSessionId = ref<number | null>(null)
const recurringPreset = ref<number | 'custom'>(4)
const recurringCustomOccurrences = ref<number | ''>('')
const recurringResult = ref<Record<number, RecurringSummary>>({})
const completionSessionId = ref<number | null>(null)
const completionDurationDraft = ref('')
const completionDurationError = ref('')
const noteSessionId = ref<number | null>(null)
const noteDraft = ref('')
const noteLoading = ref<Set<number>>(new Set())
const noteSaving = ref<Set<number>>(new Set())
const noteTextareaRef = ref<HTMLTextAreaElement | null>(null)
const journalTextareaRef = ref<HTMLTextAreaElement | null>(null)
const journalClientId = ref<number | null>(null)
const journalDraft = ref('')
const noteInitialDraft = ref('')
const journalInitialDraft = ref('')
const noteSaveMessage = ref('')
const journalSaveMessage = ref('')
const journalLoading = ref(false)
const journalSaving = ref(false)
const journalIsMissing = ref(true)
const therapistPhotoUrl = ref('')
const rescheduleRequests = ref<RescheduleRequest[]>([])
const requestsLoading = ref(false)
const requestLoading = ref<Set<number>>(new Set())
const highlightedSessionId = ref<number | null>(null)
const postSessionContext = ref<PostSessionContext | null>(null)
const statusFilter = ref<SessionStatusFilter>('ALL')
const dateFilter = ref('')
const dateFilterInputRef = ref<HTMLInputElement | null>(null)
const route = useRoute()
const toast = useToast()
const highlightTimeoutId = ref<number | null>(null)
const nowTs = ref(Date.now())
const LIVE_STATUS_REFRESH_MS = 30 * 1000
let nowIntervalId: number | null = null

const statusLabel = (session: Session) => {
  return getStatusLabel(session as SpecialistSessionLike)
}

const statusClass = (session: Session) => {
  return getStatusClass(session as SpecialistSessionLike)
}

const paymentBadgeLabel = (session: Session) => {
  if (session.payment_badge_state === 'paid') return 'РћРїР»Р°С‡РµРЅРѕ'
  if (session.payment_badge_state === 'awaiting_confirmation') {
    return 'РћС‡С–РєСѓС” РїС–РґС‚РІРµСЂРґР¶РµРЅРЅСЏ РѕРїР»Р°С‚Рё'
  }
  return ''
}

const hasPaymentBadge = (session: Session) => Boolean(paymentBadgeLabel(session))

const rescheduleStatusLabel = (status: string) => getRescheduleStatusLabel(status)

const requestStatusClass = (status: string) => {
  return getRequestStatusClass(status)
}

const pendingRescheduleSessions = computed(() => {
  const ids = new Set<number>()
  rescheduleRequests.value.forEach((req) => {
    if (req.status === 'PENDING') {
      ids.add(req.session_id)
    }
  })
  return ids
})

const hasPendingReschedule = (sessionId: number) =>
  pendingRescheduleSessions.value.has(sessionId)

const hasActiveSessionFilters = computed(
  () => statusFilter.value !== 'ALL' || Boolean(dateFilter.value)
)

const historySessions = computed(() => {
  const ids = new Set<number>()
  const history = [...upcoming.value, ...past.value]
    .filter((session) => {
      if (['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(session.status)) return true
      if (session.status !== 'CONFIRMED') return false
      const end = new Date(session.slot_end_at || '').getTime()
      if (Number.isNaN(end)) return false
      return end < nowTs.value
    })
    .filter((session) => {
      if (ids.has(session.id)) return false
      ids.add(session.id)
      return true
    })
  return history
})

const upcomingSorted = computed(() => {
  return upcoming.value
    .slice()
    .sort((a, b) => {
      const aPriority = a.status === 'SCHEDULED' ? 0 : 1
      const bPriority = b.status === 'SCHEDULED' ? 0 : 1
      if (aPriority !== bPriority) return aPriority - bPriority
      const aStart = new Date(a.slot_start_at || '').getTime()
      const bStart = new Date(b.slot_start_at || '').getTime()
      return aStart - bStart
    })
})

function sessionDateValue(session: Session) {
  if (!session.slot_start_at) return ''
  return session.slot_start_at.slice(0, 10)
}

function matchesSessionFilters(session: Session) {
  if (statusFilter.value !== 'ALL' && session.status !== statusFilter.value) {
    return false
  }
  if (dateFilter.value && sessionDateValue(session) !== dateFilter.value) {
    return false
  }
  return true
}

const filteredUpcomingSessions = computed(() =>
  upcomingSorted.value.filter((session) => matchesSessionFilters(session))
)

const filteredHistorySessions = computed(() =>
  historySessions.value.filter((session) => matchesSessionFilters(session))
)

const needsConfirmation = computed(() =>
  upcomingSorted.value.filter((session) => session.status === 'SCHEDULED')
)

const nextUpcoming = computed(() => {
  const items = upcomingSorted.value
    .filter((session) => session.slot_start_at)
    .slice()
    .sort(
      (a, b) =>
        new Date(a.slot_start_at || '').getTime() -
        new Date(b.slot_start_at || '').getTime()
    )
  return items[0] || null
})

const livePrioritySession = computed(() => {
  const items = upcomingSorted.value
    .filter((session) => isSessionInProgress(session))
    .slice()
    .sort(
      (a, b) =>
        new Date(a.slot_start_at || '').getTime() -
        new Date(b.slot_start_at || '').getTime()
    )
  return items[0] || null
})

const prioritySession = computed(() => livePrioritySession.value || nextUpcoming.value)
const isPriorityLive = computed(() =>
  prioritySession.value ? isSessionInProgress(prioritySession.value) : false
)
const priorityPrimaryAction = computed<PrimarySessionAction>(() => {
  if (!prioritySession.value) return 'details'
  return sessionPrimaryAction(prioritySession.value)
})

const completionSession = computed(() => {
  if (!completionSessionId.value) return null
  return findSessionById(completionSessionId.value)
})

const completionPlannedDuration = computed(() => {
  if (!completionSession.value) return null
  return getSessionDurationMinutes(completionSession.value as SpecialistSessionLike)
})

const isCompletionSubmitting = computed(() => {
  if (!completionSessionId.value) return false
  return isActionLoading(completionSessionId.value)
})

const postSessionNextSession = computed(() => {
  if (!postSessionContext.value) return null
  return getNextUpcomingSession(upcomingSorted.value, {
    excludeSessionId: postSessionContext.value.sessionId,
    nowTs: nowTs.value,
  })
})

const postSessionClientLink = computed(() => {
  const clientId = postSessionContext.value?.clientId
  if (!clientId) return '/cabinet/clients'
  return `/cabinet/clients?client=${clientId}&autoOpen=1`
})

const canCancel = (status: string) => sharedCanCancel(status)
const canReschedule = (status: string) => sharedCanReschedule(status)

const canShowRecurringAction = (session: Session) => {
  return sharedCanShowRecurringAction(session as SpecialistSessionLike, hasPendingReschedule(session.id))
}

const recurringReasonLabelMap: Record<string, string> = {
  SLOT_UNAVAILABLE: 'РќР° С†СЋ РґР°С‚Сѓ РІР¶Рµ РЅРµРјР°С” РІС–Р»СЊРЅРѕРіРѕ РІС–РєРЅР°',
  SLOT_ALREADY_BOOKED: 'Р¦Рµ РІС–РєРЅРѕ РІР¶Рµ Р·Р°Р№РЅСЏС‚Рµ',
  CLIENT_TIME_CONFLICT: 'РЈ РєР»С–С”РЅС‚Р° РІР¶Рµ С” С–РЅС€Р° СЃРµСЃС–СЏ РЅР° С†РµР№ С‡Р°СЃ',
}

function recurringReasonLabel(reason: string) {
  return recurringReasonLabelMap[reason] || reason
}

function suggestionReasonLabel(reasonTag: string) {
  return getSuggestionReasonLabel(reasonTag)
}

function savedAtMessage() {
  const time = new Date().toLocaleTimeString('uk-UA', {
    hour: '2-digit',
    minute: '2-digit',
  })
  return `\u0417\u0431\u0435\u0440\u0435\u0436\u0435\u043d\u043e \u043e ${time}.`
}

function hasUnsavedModalChanges() {
  if (noteDraft.value !== noteInitialDraft.value) return true
  if (journalClientId.value && journalDraft.value !== journalInitialDraft.value) return true
  return false
}

function noteContentStateLabel() {
  const hasContent = Boolean(noteDraft.value.trim())
  if (!hasContent) return 'Р’С–РґСЃСѓС‚РЅСЏ'
  if (noteDraft.value !== noteInitialDraft.value) return 'Р§РµСЂРЅРµС‚РєР°'
  return 'Р—Р°РїРѕРІРЅРµРЅР°'
}

function workbookContentStateLabel() {
  const hasContent = Boolean(journalDraft.value.trim())
  if (!hasContent) return journalIsMissing.value ? 'Р’С–РґСЃСѓС‚РЅС–Р№' : 'Р§РµСЂРЅРµС‚РєР°'
  if (journalDraft.value !== journalInitialDraft.value) return 'Р§РµСЂРЅРµС‚РєР°'
  return 'Р—Р°РїРѕРІРЅРµРЅРёР№'
}

function confirmNoteModalClose() {
  return window.confirm(
    '\u0423 \u0432\u0430\u0441 \u0454 \u043d\u0435\u0437\u0431\u0435\u0440\u0435\u0436\u0435\u043d\u0456 \u0437\u043c\u0456\u043d\u0438. \u0417\u0430\u043a\u0440\u0438\u0442\u0438 \u0431\u0435\u0437 \u0437\u0431\u0435\u0440\u0435\u0436\u0435\u043d\u043d\u044f?'
  )
}

function resetNoteModalState() {
  noteSessionId.value = null
  noteDraft.value = ''
  noteInitialDraft.value = ''
  noteSaveMessage.value = ''
  journalClientId.value = null
  journalDraft.value = ''
  journalInitialDraft.value = ''
  journalSaveMessage.value = ''
  journalIsMissing.value = true
}

const isActionLoading = (id: number) => actionLoading.value.has(id)
const isNoteSaving = (id: number) => noteSaving.value.has(id)
const isRequestLoading = (id: number) => requestLoading.value.has(id)
const isSuggestionsLoading = (id: number) => suggestionsLoading.value.has(id)

function formatDateTime(value?: string | null) {
  return sharedFormatSessionDateTime(value)
}

function formatDuration(start?: string | null, end?: string | null) {
  return sharedFormatSessionDuration(start, end, {
    empty: 'РўСЂРёРІР°Р»С–СЃС‚СЊ: вЂ”',
    prefix: 'РўСЂРёРІР°Р»С–СЃС‚СЊ: ',
  })
}

function normalizeSessionClientName(value?: string | null) {
  const normalized = value?.trim() || ''
  if (!normalized) return ''
  if (/^#?\d+$/i.test(normalized)) return ''
  if (/^(client|РєР»С–С”РЅС‚)\s*#?\d+$/i.test(normalized)) return ''
  return normalized
}

function sessionClientLabel(session: Session) {
  const preferred = normalizeSessionClientName(session.client_display_name)
  if (preferred) return preferred
  const fallbackName = normalizeSessionClientName(session.client_name)
  if (fallbackName) return fallbackName
  const login = normalizeSessionClientName(session.client_username)
  if (login) return login
  return `#${session.client}`
}

function sessionNoteSummary(session: Session) {
  if (session.has_note !== true) return 'РќРѕС‚Р°С‚РєР°: РЅРµ РґРѕРґР°РЅР°.'
  if (!session.note_updated_at) return 'РќРѕС‚Р°С‚РєР°: РґРѕРґР°РЅР°.'
  return `РќРѕС‚Р°С‚РєСѓ РѕРЅРѕРІР»РµРЅРѕ ${formatDateTime(session.note_updated_at)}.`
}

function timeUntilLabel(session: Session) {
  return getTimeUntilLabel(session as SpecialistSessionLike)
}

function sessionJoinStartAt(session: Session) {
  return session.slot_start_at || session.join_starts_at
}

function sessionJoinEndAt(session: Session) {
  return session.slot_end_at || session.join_ends_at
}

function isSessionInProgress(session: Session) {
  if (session.status !== 'CONFIRMED') return false
  const startRaw = sessionJoinStartAt(session)
  const endRaw = sessionJoinEndAt(session)
  if (!startRaw || !endRaw) return false
  const start = new Date(startRaw).getTime()
  const end = new Date(endRaw).getTime()
  if (Number.isNaN(start) || Number.isNaN(end)) return false
  const now = nowTs.value
  return now >= start && now <= end
}

function meetingUrl(session: Session) {
  return normalizeMeetingUrl(session.meeting_url)
}

function resolveSessionFormat(session: Session): SessionFormat {
  if (session.session_format === 'offline') return 'offline'
  if (session.session_format === 'online') return 'online'
  if (session.meeting_mode === 'OFFLINE') return 'offline'
  return 'online'
}

function isOfflineSession(session: Session) {
  return resolveSessionFormat(session) === 'offline'
}

function sessionFormatBadge(session: Session) {
  return `Р¤РѕСЂРјР°С‚: ${isOfflineSession(session) ? 'РћС„Р»Р°Р№РЅ' : 'РћРЅР»Р°Р№РЅ'}`
}

function canJoinMeeting(session: Session) {
  if (isOfflineSession(session)) return false
  if (!session.join_available) return false
  if (!isSessionInProgress(session)) return false
  return canJoinExternalMeeting({
    status: session.status,
    session_format: session.session_format,
    meeting_mode: session.meeting_mode,
    meeting_url: session.meeting_url,
  })
}

function sessionPrimaryAction(session: Session): PrimarySessionAction {
  if (session.status === 'SCHEDULED') return 'confirm'
  if (canJoinMeeting(session)) return 'join'
  return 'details'
}

function isPrimaryAction(session: Session, action: PrimarySessionAction) {
  return sessionPrimaryAction(session) === action
}

function sessionContextHint(session: Session) {
  if (isOfflineSession(session)) {
    const location = (session.offline_location || '').trim()
    return location
      ? `Р›РѕРєР°С†С–СЏ: ${location}`
      : 'Р›РѕРєР°С†С–СЋ РѕС„Р»Р°Р№РЅ-СЃРµСЃС–С— СѓС‚РѕС‡РЅРµРЅРѕ Р·С– СЃРїРµС†С–Р°Р»С–СЃС‚РѕРј.'
  }

  const link = meetingUrl(session)
  if (!link) {
    return 'Р”РѕРґР°Р№С‚Рµ РїРѕСЃРёР»Р°РЅРЅСЏ РЅР° РѕРЅР»Р°Р№РЅ-Р·СѓСЃС‚СЂС–С‡ Сѓ РґРµС‚Р°Р»СЏС….'
  }
  if (canJoinMeeting(session)) {
    return 'РњРѕР¶РЅР° РїСЂРёС”РґРЅР°С‚РёСЃСЏ РґРѕ Р·СѓСЃС‚СЂС–С‡С– Р·Р°СЂР°Р·.'
  }
  return 'РџРѕСЃРёР»Р°РЅРЅСЏ РґРѕРґР°РЅРѕ. Р’С…С–Рґ СЃС‚Р°РЅРµ РґРѕСЃС‚СѓРїРЅРёРј Р±Р»РёР¶С‡Рµ РґРѕ РїРѕС‡Р°С‚РєСѓ.'
}

function parseSessionIdFromHash(hash: string): number | null {
  if (!hash) return null
  const match = hash.match(/session-(\d+)/)
  if (!match) return null
  const id = Number(match[1])
  return Number.isFinite(id) ? id : null
}

function parseNoteIdFromHash(hash: string): number | null {
  if (!hash) return null
  const match = hash.match(/note-(\d+)/)
  if (!match) return null
  const id = Number(match[1])
  return Number.isFinite(id) ? id : null
}

function findSessionById(id: number): Session | null {
  return upcoming.value.find((session) => session.id === id) || past.value.find((session) => session.id === id) || null
}

async function scrollToHighlightedSession() {
  const id = parseSessionIdFromHash(route.hash)
  if (!id) return
  highlightedSessionId.value = id
  if (highlightTimeoutId.value !== null) {
    window.clearTimeout(highlightTimeoutId.value)
    highlightTimeoutId.value = null
  }
  await nextTick()
  const el = document.getElementById(`session-${id}`)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
  highlightTimeoutId.value = window.setTimeout(() => {
    highlightedSessionId.value = null
    highlightTimeoutId.value = null
  }, 8000)
}

function clearHighlight(id: number) {
  if (highlightedSessionId.value === id) {
    highlightedSessionId.value = null
  }
}

async function focusSession(id: number) {
  highlightedSessionId.value = id
  await nextTick()
  const el = document.getElementById(`session-${id}`)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}

function clearSessionFilters() {
  statusFilter.value = 'ALL'
  dateFilter.value = ''
}

function openDateFilterPicker() {
  const input = dateFilterInputRef.value
  if (!input) return
  input.focus()
  if (typeof input.showPicker === 'function') {
    try {
      input.showPicker()
    } catch {
      // Some browsers require a strict user gesture context for showPicker.
    }
  }
}

async function loadSessions() {
  loading.value = true
  error.value = ''
  try {
    const [upcomingResp, pastResp] = await Promise.all([
      apiGet<Session[]>('/booking/sessions/', { params: { upcoming: true } }),
      apiGet<Session[]>('/booking/sessions/', { params: { upcoming: false } }),
    ])
    upcoming.value = upcomingResp || []
    past.value = pastResp || []
  } catch (err: any) {
    error.value = getBookingErrorMessage(err, BOOKING_ERROR_FALLBACKS.loadSessions)
  } finally {
    loading.value = false
  }
}

async function loadTherapistProfilePhoto() {
  try {
    const data: SpecialistProfile | null = await fetchSpecialistProfile()
    therapistPhotoUrl.value = data?.photo_url || ''
  } catch {
    therapistPhotoUrl.value = ''
  }
}

async function loadSlots() {
  try {
    availableSlots.value = await fetchSpecialistAvailableSlotsData()
  } catch {
    availableSlots.value = []
  }
}

function setActionLoading(id: number, value: boolean) {
  const next = new Set(actionLoading.value)
  if (value) {
    next.add(id)
  } else {
    next.delete(id)
  }
  actionLoading.value = next
}

function setNoteLoading(id: number, value: boolean) {
  const next = new Set(noteLoading.value)
  if (value) {
    next.add(id)
  } else {
    next.delete(id)
  }
  noteLoading.value = next
}

function setNoteSaving(id: number, value: boolean) {
  const next = new Set(noteSaving.value)
  if (value) {
    next.add(id)
  } else {
    next.delete(id)
  }
  noteSaving.value = next
}

function setRequestLoading(id: number, value: boolean) {
  const next = new Set(requestLoading.value)
  if (value) {
    next.add(id)
  } else {
    next.delete(id)
  }
  requestLoading.value = next
}

function setSuggestionsLoading(id: number, value: boolean) {
  const next = new Set(suggestionsLoading.value)
  if (value) {
    next.add(id)
  } else {
    next.delete(id)
  }
  suggestionsLoading.value = next
}

async function confirmSession(id: number) {
  setActionLoading(id, true)
  error.value = ''
  try {
    await confirmSpecialistSessionAction(id)
    await loadSessions()
    toast.success(BOOKING_SUCCESS_MESSAGES.sessionConfirmed)
  } catch (err: any) {
    error.value = getBookingErrorMessage(err, BOOKING_ERROR_FALLBACKS.confirmSession)
  } finally {
    setActionLoading(id, false)
  }
}

function openCompletionModal(id: number) {
  const session = findSessionById(id)
  completionSessionId.value = id
  completionDurationDraft.value = session
    ? getSuggestedActualDurationInput(session as SpecialistSessionLike)
    : ''
  completionDurationError.value = ''
}

function closeCompletionModal(force = false) {
  if (!force && isCompletionSubmitting.value) return
  completionSessionId.value = null
  completionDurationDraft.value = ''
  completionDurationError.value = ''
}

function rememberPostSessionContext(sessionId: number) {
  const completed = findSessionById(sessionId)
  postSessionContext.value = {
    sessionId,
    clientId: completed?.client ?? null,
  }
}

function clearPostSessionContext() {
  postSessionContext.value = null
}

async function openPostSessionWorkbook() {
  if (!postSessionContext.value) return
  await openNoteModal(postSessionContext.value.sessionId, { focus: 'workbook' })
}

function returnToSessionList() {
  const closed = closeNote()
  if (!closed) return
  clearPostSessionContext()
}

async function submitCompletion() {
  const targetId = completionSessionId.value
  if (!targetId) return

  const { payload, error: durationError } = getActualDurationPayload(completionDurationDraft.value)
  if (durationError) {
    completionDurationError.value = durationError
    return
  }

  setActionLoading(targetId, true)
  error.value = ''
  completionDurationError.value = ''
  try {
    await completeSpecialistSessionAction(targetId, payload)
    await loadSessions()
    rememberPostSessionContext(targetId)
    closeCompletionModal(true)
    await openNoteModal(targetId, { focus: 'workbook' })
    toast.success(BOOKING_SUCCESS_MESSAGES.sessionCompleted)
  } catch (err: any) {
    error.value = getBookingErrorMessage(err, BOOKING_ERROR_FALLBACKS.completeSession)
  } finally {
    setActionLoading(targetId, false)
  }
}

async function cancelSession(id: number) {
  setActionLoading(id, true)
  error.value = ''
  try {
    await cancelSpecialistSessionAction(id)
    await loadSessions()
    toast.success(BOOKING_SUCCESS_MESSAGES.sessionCancelled)
  } catch (err: any) {
    error.value = getBookingErrorMessage(err, BOOKING_ERROR_FALLBACKS.cancelSession)
  } finally {
    setActionLoading(id, false)
  }
}

async function loadRescheduleSuggestions(id: number) {
  setSuggestionsLoading(id, true)
  try {
    rescheduleSuggestions.value = {
      ...rescheduleSuggestions.value,
      [id]: await fetchSpecialistRescheduleSuggestionsData(id),
    }
  } catch {
    rescheduleSuggestions.value = {
      ...rescheduleSuggestions.value,
      [id]: [],
    }
  } finally {
    setSuggestionsLoading(id, false)
  }
}

async function toggleReschedule(id: number) {
  if (rescheduleSessionId.value === id) {
    closeReschedule()
    return
  }
  rescheduleSessionId.value = id
  rescheduleSlotId.value = ''
  recurringSessionId.value = null
  await loadRescheduleSuggestions(id)
}

function closeReschedule() {
  rescheduleSessionId.value = null
  rescheduleSlotId.value = ''
}

function selectSuggestedSlot(slotId: number) {
  rescheduleSlotId.value = slotId
}

function toggleRecurring(id: number) {
  if (recurringSessionId.value === id) {
    closeRecurring()
    return
  }
  recurringSessionId.value = id
  recurringPreset.value = 4
  recurringCustomOccurrences.value = ''
  rescheduleSessionId.value = null
}

function closeRecurring() {
  recurringSessionId.value = null
}

function recurringOccurrencesValue() {
  return getRecurringOccurrences(recurringPreset.value, recurringCustomOccurrences.value)
}

async function submitReschedule(id: number) {
  if (!rescheduleSlotId.value) return
  setActionLoading(id, true)
  error.value = ''
  try {
    await rescheduleSpecialistSessionAction(id, Number(rescheduleSlotId.value))
    closeReschedule()
    await Promise.all([loadSessions(), loadSlots()])
    toast.success(BOOKING_SUCCESS_MESSAGES.sessionRescheduled)
  } catch (err: any) {
    error.value = getBookingErrorMessage(err, BOOKING_ERROR_FALLBACKS.rescheduleSession)
  } finally {
    setActionLoading(id, false)
  }
}

async function submitRecurring(id: number) {
  const occurrences = recurringOccurrencesValue()
  if (!occurrences) {
    error.value = 'Р’РєР°Р¶С–С‚СЊ РєС–Р»СЊРєС–СЃС‚СЊ РїРѕРІС‚РѕСЂС–РІ РІС–Рґ 1 РґРѕ 52.'
    return
  }
  setActionLoading(id, true)
  error.value = ''
  try {
    const resp = await createRecurringSpecialistSessionsAction(id, occurrences)
    recurringResult.value = {
      ...recurringResult.value,
      [id]: resp,
    }
    await Promise.all([loadSessions(), loadSlots()])
    const skipped = resp?.skipped_count || 0
    const created = resp?.created_count || 0
    if (skipped > 0) {
      toast.success(`РЎС‚РІРѕСЂРµРЅРѕ ${created} СЃРµСЃС–Р№, РїСЂРѕРїСѓС‰РµРЅРѕ ${skipped}.`)
    } else {
      toast.success(BOOKING_SUCCESS_MESSAGES.recurringSeriesCreated)
    }
  } catch (err: any) {
    error.value = getBookingErrorMessage(err, BOOKING_ERROR_FALLBACKS.createRecurringSession)
  } finally {
    setActionLoading(id, false)
  }
}


async function loadNote(id: number) {
  setNoteLoading(id, true)
  error.value = ''
  try {
    noteDraft.value = await fetchSpecialistSessionNoteContentData(id)
    noteInitialDraft.value = noteDraft.value
    noteSaveMessage.value = ''
  } catch (err: any) {
    error.value = getBookingErrorMessage(err, BOOKING_ERROR_FALLBACKS.loadSessionNote)
  } finally {
    setNoteLoading(id, false)
  }
}

async function loadClientJournal(clientId: number) {
  journalLoading.value = true
  error.value = ''
  try {
    const snapshot = await fetchSpecialistClientWorkbookSnapshotData(clientId)
    journalDraft.value = snapshot.content
    journalIsMissing.value = snapshot.isMissing
    journalInitialDraft.value = journalDraft.value
    journalSaveMessage.value = ''
  } catch (err: any) {
    error.value = getBookingErrorMessage(err, BOOKING_ERROR_FALLBACKS.loadWorkbook)
  } finally {
    journalLoading.value = false
  }
}

async function saveNote(id: number) {
  setNoteSaving(id, true)
  error.value = ''
  try {
    await saveSpecialistSessionNoteAction(id, noteDraft.value)
    noteInitialDraft.value = noteDraft.value
    noteSaveMessage.value = savedAtMessage()
    toast.success(BOOKING_SUCCESS_MESSAGES.noteSaved)
  } catch (err: any) {
    error.value = getBookingErrorMessage(err, BOOKING_ERROR_FALLBACKS.saveSessionNote)
  } finally {
    setNoteSaving(id, false)
  }
}

async function saveClientJournal(clientId: number) {
  journalSaving.value = true
  error.value = ''
  try {
    await saveSpecialistClientJournalAction(clientId, journalDraft.value)
    journalInitialDraft.value = journalDraft.value
    journalIsMissing.value = !Boolean(journalDraft.value.trim())
    journalSaveMessage.value = savedAtMessage()
    toast.success(BOOKING_SUCCESS_MESSAGES.workbookSaved)
  } catch (err: any) {
    error.value = getBookingErrorMessage(err, BOOKING_ERROR_FALLBACKS.saveWorkbook)
  } finally {
    journalSaving.value = false
  }
}

type NoteModalFocusTarget = 'note' | 'workbook'

async function focusNoteModalField(target: NoteModalFocusTarget) {
  await nextTick()
  const preferredTarget = target === 'workbook' && journalClientId.value ? journalTextareaRef.value : noteTextareaRef.value
  if (!preferredTarget) return
  preferredTarget.scrollIntoView({ behavior: 'smooth', block: 'center' })
  preferredTarget.focus()
}

async function openNoteModal(id: number, options?: { focus?: NoteModalFocusTarget }) {
  if (noteSessionId.value && noteSessionId.value !== id) {
    const closed = closeNote()
    if (!closed) return
  }
  noteSessionId.value = id
  noteDraft.value = ''
  noteInitialDraft.value = ''
  noteSaveMessage.value = ''
  journalDraft.value = ''
  journalInitialDraft.value = ''
  journalSaveMessage.value = ''
  const session = findSessionById(id)
  journalClientId.value = session?.client || null
  const target = options?.focus === 'workbook' && journalClientId.value ? 'workbook' : 'note'
  if (journalClientId.value) {
    await Promise.all([loadNote(id), loadClientJournal(journalClientId.value)])
    await focusNoteModalField(target)
    return
  }
  await loadNote(id)
  await focusNoteModalField(target)
}

function closeNote() {
  if (hasUnsavedModalChanges() && !confirmNoteModalClose()) {
    return false
  }
  resetNoteModalState()
  return true
}

async function loadRescheduleRequests() {
  requestsLoading.value = true
  try {
    rescheduleRequests.value = await fetchSpecialistRescheduleRequestsData()
  } catch {
    rescheduleRequests.value = []
  } finally {
    requestsLoading.value = false
  }
}

async function approveRequest(id: number) {
  setRequestLoading(id, true)
  error.value = ''
  try {
    await approveSpecialistRescheduleRequestAction(id)
    await Promise.all([loadSessions(), loadSlots(), loadRescheduleRequests(), loadTherapistProfilePhoto()])
    toast.success(BOOKING_SUCCESS_MESSAGES.rescheduleRequestApproved)
  } catch (err: any) {
    error.value = getBookingErrorMessage(err, BOOKING_ERROR_FALLBACKS.approveRescheduleRequest)
  } finally {
    setRequestLoading(id, false)
  }
}

async function declineRequest(id: number) {
  setRequestLoading(id, true)
  error.value = ''
  try {
    await declineSpecialistRescheduleRequestAction(id)
    await loadRescheduleRequests()
    toast.success(BOOKING_SUCCESS_MESSAGES.rescheduleRequestDeclined)
  } catch (err: any) {
    error.value = getBookingErrorMessage(err, BOOKING_ERROR_FALLBACKS.declineRescheduleRequest)
  } finally {
    setRequestLoading(id, false)
  }
}

async function openNoteFromHash() {
  const id = parseNoteIdFromHash(route.hash)
  if (!id) return
  await openNoteModal(id)
}

watch(noteDraft, (value) => {
  if (value !== noteInitialDraft.value) {
    noteSaveMessage.value = ''
  }
})

watch(journalDraft, (value) => {
  if (value !== journalInitialDraft.value) {
    journalSaveMessage.value = ''
  }
})

onMounted(async () => {
  await Promise.all([loadSessions(), loadSlots(), loadRescheduleRequests(), loadTherapistProfilePhoto()])
  await scrollToHighlightedSession()
  await openNoteFromHash()
  nowIntervalId = window.setInterval(() => {
    nowTs.value = Date.now()
  }, LIVE_STATUS_REFRESH_MS)
})

watch(
  () => route.hash,
  async () => {
    await scrollToHighlightedSession()
    await openNoteFromHash()
  }
)

onBeforeUnmount(() => {
  if (highlightTimeoutId.value !== null) {
    window.clearTimeout(highlightTimeoutId.value)
  }
  if (nowIntervalId !== null) {
    window.clearInterval(nowIntervalId)
    nowIntervalId = null
  }
})
</script>

<style scoped>
.sessions {
  display: grid;
  gap: 18px;
}

.sessions__hero {
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

.sessions__title {
  font-size: 32px;
}

.sessions__subtitle {
  max-width: 520px;
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

  .panel--priority {
    background: linear-gradient(135deg, rgba(8, 113, 201, 0.08), rgba(7, 47, 71, 0.04));
  }

  .panel--next-step {
    background: linear-gradient(135deg, rgba(31, 122, 76, 0.1), rgba(7, 47, 71, 0.04));
  }

  .next-step-rail {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .next-step-rail--modal {
    margin: 0 18px;
    padding: 10px;
    border-radius: 12px;
    border: 1px dashed rgba(31, 122, 76, 0.36);
    background: rgba(31, 122, 76, 0.08);
  }

  .priority-grid {
    display: grid;
    gap: 14px;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  }

  .priority-card {
    border: 1px solid var(--line);
    border-radius: 16px;
    padding: 14px;
    background: #fff;
    display: grid;
    gap: 10px;
  }

  .priority-title {
    font-weight: 600;
  }

  .priority-value {
    font-size: 28px;
    font-family: var(--font-display);
  }

  .priority-list {
    display: grid;
    gap: 8px;
  }

  .priority-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 10px;
    border-radius: 12px;
    background: rgba(8, 113, 201, 0.05);
  }

  .priority-item__main {
    display: grid;
    gap: 2px;
  }

  .priority-item__context {
    max-width: 420px;
    line-height: 1.35;
  }

  .priority-time {
    font-weight: 600;
  }

.priority-next {
  display: grid;
  gap: 6px;
}

.priority-next__main {
  display: grid;
  gap: 6px;
  color: inherit;
  text-decoration: none;
  border-radius: 10px;
  padding: 2px;
}

.priority-next__main:hover {
  background: rgba(8, 113, 201, 0.05);
}

.priority-next__main:focus-visible {
  outline: 2px solid rgba(31, 74, 96, 0.35);
  outline-offset: 2px;
}

.priority-next__actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.priority-next__context {
  line-height: 1.4;
}

.session-filters {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
  align-items: end;
}

.session-filters__field {
  margin: 0;
}

.session-filters__field--date {
  cursor: pointer;
}

.session-filters__date-input {
  width: 100%;
  cursor: pointer;
}

.session-filters__field--date:focus-within .session-filters__date-input {
  border-color: color-mix(in srgb, var(--primary) 45%, var(--line));
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--primary) 18%, transparent);
}

.badge--soft {
  background: rgba(8, 113, 201, 0.12);
}

.session-list {
  display: grid;
  gap: 12px;
  margin-top: 10px;
}

.session-card {
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 14px;
  background: #fff;
  display: grid;
  gap: 12px;
}

.session-card--with-photo {
  grid-template-columns: minmax(0, 1fr) 140px;
  align-items: start;
}

.session-summary {
  display: grid;
  gap: 12px;
}

.session-info {
  display: grid;
  gap: 6px;
}

.session-time {
  font-weight: 600;
}

.session-context {
  line-height: 1.4;
}

.status-pill {
  width: fit-content;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  background: rgba(7, 47, 71, 0.08);
  color: #13455e;
}

.status-pill--ok {
  background: rgba(31, 122, 76, 0.18);
  color: #1f7a4c;
}

.status-pill--warn {
  background: rgba(217, 164, 65, 0.18);
  color: #a57011;
}

.status-pill--muted {
  background: rgba(7, 47, 71, 0.08);
  color: #13455e;
}

.status-pill--danger {
  background: linear-gradient(135deg, #ea3e3e, #c01717);
  color: #fff;
  border: 1px solid rgba(154, 9, 9, 0.7);
  box-shadow: 0 6px 14px rgba(194, 23, 23, 0.26);
}

.status-pill--new {
  background: rgba(8, 113, 201, 0.16);
  color: #0c4c77;
}

.status-pill--payment {
  background: rgba(74, 124, 89, 0.12);
  color: #2f5f3e;
  text-transform: none;
  letter-spacing: 0.02em;
}

.new-bookings-banner {
  margin-top: 6px;
  padding: 10px 12px;
  border: 1px solid rgba(8, 113, 201, 0.3);
  border-radius: 12px;
  background: rgba(8, 113, 201, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.session-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.session-photo-wrap {
  display: flex;
  justify-content: flex-end;
  align-items: flex-start;
}

.session-photo {
  width: 120px;
  height: 120px;
  border-radius: 16px;
  object-fit: cover;
  border: 1px solid var(--line);
  background: rgba(7, 47, 71, 0.04);
}

.session-photo--empty {
  display: grid;
  place-items: center;
  font-size: 12px;
  color: rgba(7, 47, 71, 0.6);
}

.session-card--highlight {
  border-color: rgba(8, 113, 201, 0.55);
  box-shadow: 0 0 0 2px rgba(8, 113, 201, 0.18);
  background: rgba(8, 113, 201, 0.04);
}

.history-grid {
  display: grid;
  gap: 12px;
  margin-top: 10px;
  grid-template-columns: 1fr;
}

.history-tile {
  padding: 12px;
  gap: 0;
}

.history-tile__body {
  display: grid;
  gap: 10px;
  min-height: 100%;
}

.history-tile__actions {
  margin-top: auto;
}

.btn--sm {
  padding: 6px 10px;
  font-size: 13px;
}

.reschedule-panel {
  display: grid;
  gap: 10px;
  padding: 12px;
  border-radius: 12px;
  border: 1px dashed rgba(47, 63, 73, 0.2);
  background: rgba(7, 47, 71, 0.04);
  grid-column: 1 / -1;
}

.reschedule-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.suggestions-block {
  display: grid;
  gap: 8px;
  padding: 10px;
  border-radius: 10px;
  border: 1px solid rgba(7, 47, 71, 0.12);
  background: rgba(7, 47, 71, 0.03);
}

.suggestions-title {
  font-weight: 600;
}

.suggestions-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.suggestion-btn {
  display: grid;
  gap: 2px;
  text-align: left;
}

.suggestion-meta {
  font-size: 11px;
}

.recurring-panel {
  display: grid;
  gap: 10px;
  padding: 12px;
  border-radius: 12px;
  border: 1px dashed rgba(8, 113, 201, 0.35);
  background: rgba(8, 113, 201, 0.05);
  grid-column: 1 / -1;
}

.recurring-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.recurring-result {
  display: grid;
  gap: 8px;
}

.recurring-list {
  display: grid;
  gap: 4px;
}

.recurring-ul {
  margin: 0;
  padding-left: 18px;
  display: grid;
  gap: 4px;
}

.input--select {
  min-width: 220px;
}

.note-panel {
  display: grid;
  gap: 10px;
  padding: 12px;
  border-radius: 12px;
  border: 1px solid rgba(47, 63, 73, 0.12);
  background: #fbfbfb;
  grid-column: 1 / -1;
}

.note-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: 1fr;
}

.note-textarea {
  resize: vertical;
}

.note-textarea--session {
  min-height: 88px;
  max-height: 180px;
}

.note-textarea--workbook {
  min-height: 220px;
  max-height: 48vh;
}

.note-title {
  display: inline-block;
  margin-right: 8px;
}

.note-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(47, 63, 73, 0.08);
  border: 1px solid rgba(47, 63, 73, 0.16);
  color: #3b4a52;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.note-state {
  display: block;
  margin-top: 6px;
  font-size: 12px;
}

.note-helper {
  margin-top: 6px;
  font-size: 12px;
  line-height: 1.4;
}

.note-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
}

.note-save-feedback {
  color: #1f6f52;
  font-size: 12px;
  font-weight: 600;
}

.note-panel--session {
  gap: 8px;
}

.note-panel--workbook {
  border-color: rgba(8, 113, 201, 0.2);
  background: rgba(8, 113, 201, 0.04);
}

.note-modal {
  position: fixed;
  inset: 0;
  z-index: 50;
}

.note-modal__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(8, 18, 24, 0.35);
}

.note-modal__content {
  position: relative;
  width: min(760px, 96vw);
  max-height: min(90vh, 920px);
  margin: 4vh auto 0;
  background: #fff;
  border-radius: 18px;
  border: 1px solid var(--line);
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.18);
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr) auto;
}

.note-modal__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 18px 0;
}

.note-modal__body {
  min-height: 0;
  overflow-y: auto;
  padding: 12px 18px 0;
}

.note-modal__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 18px 18px;
  border-top: 1px solid rgba(47, 63, 73, 0.16);
  background: #fff;
}

.note-modal__footer-hint {
  font-size: 12px;
  line-height: 1.4;
}

.note-modal__primary-action {
  min-width: 220px;
}

@media (max-width: 760px) {
  .note-modal__content {
    width: min(96vw, 620px);
    margin-top: 3vh;
  }

  .note-modal__footer {
    flex-direction: column;
    align-items: stretch;
  }

  .note-modal__primary-action {
    width: 100%;
    min-width: 0;
  }

  .note-textarea--workbook {
    min-height: 180px;
    max-height: 42vh;
  }
}

.request-list {
  display: grid;
  gap: 12px;
  margin-top: 10px;
}

.request-card {
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 14px;
  background: #fff;
  display: grid;
  gap: 12px;
}

.request-info {
  display: grid;
  gap: 6px;
}

.request-title {
  font-weight: 600;
}

.request-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.form-error {
  color: #b3261e;
  background: #fdecea;
  border: 1px solid #f5c2c0;
  border-radius: 10px;
  padding: 8px 10px;
}

@media (min-width: 760px) {
  .history-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1040px) {
  .history-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (min-width: 1440px) {
  .history-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (max-width: 860px) {
  .sessions__hero {
    flex-direction: column;
    align-items: flex-start;
  }

  .new-bookings-banner {
    flex-direction: column;
    align-items: flex-start;
  }

  .session-card--with-photo {
    grid-template-columns: 1fr;
  }

  .session-photo-wrap {
    justify-content: flex-start;
  }
}
</style>

