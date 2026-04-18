<template>
  <section class="session-detail">
    <header class="detail-hero">
      <div>
        <div class="badge">РЎРµСЃС–СЏ СЃРїРµС†С–Р°Р»С–СЃС‚Р°</div>
        <h1 class="title detail-title">Р”РµС‚Р°Р»С– СЃРµСЃС–С—</h1>
        <p class="muted detail-subtitle">
          РџРѕРІРЅРёР№ РєРѕРЅС‚РµРєСЃС‚ РїРѕ СЃРµСЃС–С—, РґС–С— Р·С– СЃС‚Р°С‚СѓСЃРѕРј, РїРµСЂРµРЅРѕСЃ С– РїСЂРёРІР°С‚РЅС– РЅРѕС‚Р°С‚РєРё РІ РѕРґРЅРѕРјСѓ РјС–СЃС†С–.
        </p>
      </div>
      <RouterLink class="btn btn--ghost" to="/cabinet/sessions">РќР°Р·Р°Рґ РґРѕ СЃРїРёСЃРєСѓ</RouterLink>
    </header>

    <div v-if="error" class="form-error">{{ error }}</div>
    <LoadingSkeleton v-if="loading" variant="list" :count="3" />

    <template v-else-if="session">
      <section class="panel panel--summary">
        <div class="panel__header">
          <div>
            <div class="badge badge--soft">РЎС‚Р°С‚СѓСЃ</div>
            <h2 class="panel__title">{{ statusLabel(session) }}</h2>
          </div>
          <div class="summary-actions">
            <button
              class="btn btn--sm"
              type="button"
              :disabled="actionLoading || session.status !== 'SCHEDULED'"
              @click="confirmSession"
            >
              РџС–РґС‚РІРµСЂРґРёС‚Рё
            </button>
            <button
              v-if="session.status === 'CONFIRMED'"
              class="btn btn--ghost btn--sm"
              type="button"
              :disabled="actionLoading"
              @click="openCompletionModal"
            >
              Р—Р°РІРµСЂС€РёС‚Рё
            </button>
            <button
              class="btn btn--ghost btn--sm"
              type="button"
              :disabled="actionLoading || !canCancel(session.status)"
              @click="cancelSession"
            >
              РЎРєР°СЃСѓРІР°С‚Рё
            </button>
            <button
              class="btn btn--ghost btn--sm"
              type="button"
              :disabled="actionLoading || !canReschedule(session.status)"
              @click="toggleReschedulePanel"
            >
              {{ showReschedulePanel ? 'РЎС…РѕРІР°С‚Рё РїРµСЂРµРЅРѕСЃ' : 'РџРµСЂРµРЅРµСЃС‚Рё' }}
            </button>
            <button
              v-if="canShowRecurringAction(session)"
              class="btn btn--ghost btn--sm"
              type="button"
              :disabled="actionLoading"
              @click="toggleRecurringPanel"
            >
              {{ showRecurringPanel ? 'РЎС…РѕРІР°С‚Рё СЃРµСЂС–СЋ' : 'РџРѕРІС‚РѕСЂСЋРІР°С‚Рё С‰РѕС‚РёР¶РЅСЏ' }}
            </button>
            <button
              class="btn btn--ghost btn--sm"
              type="button"
              :disabled="actionLoading || quickAddPending"
              @click="addSessionToPracticeBoard"
            >
              {{ quickAddPending ? 'Р”РѕРґР°С”РјРѕвЂ¦' : 'Р”РѕРґР°С‚Рё РЅР° РґРѕС€РєСѓ' }}
            </button>
          </div>
        </div>

        <div class="detail-grid">
          <div class="detail-card">
            <div class="detail-label">РџРѕС‡Р°С‚РѕРє</div>
            <div class="detail-value">{{ formatDateTime(sessionStartAt(session)) }}</div>
          </div>
          <div class="detail-card">
            <div class="detail-label">РўСЂРёРІР°Р»С–СЃС‚СЊ</div>
            <div class="detail-value">{{ formatDuration(sessionStartAt(session), sessionEndAt(session)) }}</div>
          </div>
          <div class="detail-card">
            <div class="detail-label">Р¤РѕСЂРјР°С‚</div>
            <div class="detail-value">Р¤РѕСЂРјР°С‚: {{ sessionFormatLabel }}</div>
            <div v-if="offlineLocation" class="muted detail-meta">Р›РѕРєР°С†С–СЏ: {{ offlineLocation }}</div>
          </div>
          <div class="detail-card">
            <div class="detail-label">РљР»С–С”РЅС‚</div>
            <div class="detail-value">
              {{ clientLabel(session) }}
              <div v-if="session.client_email" class="muted detail-meta">{{ session.client_email }}</div>
              <div class="muted detail-meta">ID: #{{ session.client }}</div>
            </div>
          </div>
          <div class="detail-card">
            <div class="detail-label">РџРѕС‚РѕС‡РЅРёР№ СЃС‚Р°РЅ</div>
            <div class="detail-value">
              <div class="status-pill" :class="statusClass(session)">
                {{ statusLabel(session) }}
              </div>
              <div v-if="timeUntilLabel(session)" class="status-pill status-pill--warn">
                РџРѕС‡Р°С‚РѕРє С‡РµСЂРµР· {{ timeUntilLabel(session) }}
              </div>
            </div>
          </div>
        </div>
        <div
          v-if="!isOfflineSession && (meetingUrl || isEditingMeetingLink || ['SCHEDULED', 'CONFIRMED'].includes(session.status))"
          class="meeting-card"
        >
          <div v-if="!isEditingMeetingLink">
            <div class="detail-label">РћРЅР»Р°Р№РЅ-Р·СѓСЃС‚СЂС–С‡</div>
            <div class="detail-value">{{ meetingProvider }}</div>
            <div class="muted detail-meta">{{ meetingSetupHint }}</div>
          </div>
          <div v-else class="field" style="width: 100%">
            <label for="meeting-link-input" class="detail-label">РџРѕСЃРёР»Р°РЅРЅСЏ РЅР° РѕРЅР»Р°Р№РЅ-Р·СѓСЃС‚СЂС–С‡</label>
            <input
              id="meeting-link-input"
              v-model="meetingLinkDraft"
              class="input"
              placeholder="https://meet.google.com/... Р°Р±Рѕ https://zoom.us/..."
            />
            <div class="muted detail-meta">
              Р’СЃС‚Р°РІС‚Рµ РїРѕРІРЅРµ РїРѕСЃРёР»Р°РЅРЅСЏ РЅР° Р·СѓСЃС‚СЂС–С‡. РџС–СЃР»СЏ Р·Р±РµСЂРµР¶РµРЅРЅСЏ РєР»С–С”РЅС‚ РїРѕР±Р°С‡РёС‚СЊ РєРЅРѕРїРєСѓ В«РџСЂРёС”РґРЅР°С‚РёСЃСЏВ».
            </div>
          </div>
          <div class="meeting-card__actions">
            <template v-if="!isEditingMeetingLink">
              <a
                v-if="canJoinMeeting"
                class="btn btn--sm"
                :href="meetingUrl"
                target="_blank"
                rel="noopener noreferrer"
              >
                РџСЂРёС”РґРЅР°С‚РёСЃСЏ
              </a>
              <button v-if="meetingUrl" class="btn btn--ghost btn--sm" type="button" @click="copyMeetingLink">
                РЎРєРѕРїС–СЋРІР°С‚Рё РїРѕСЃРёР»Р°РЅРЅСЏ
              </button>
              <button
                v-if="session && ['SCHEDULED', 'CONFIRMED'].includes(session.status)"
                class="btn btn--ghost btn--sm"
                type="button"
                @click="toggleEditMeetingLink"
              >
                {{ meetingUrl ? 'Р—РјС–РЅРёС‚Рё РїРѕСЃРёР»Р°РЅРЅСЏ' : 'Р”РѕРґР°С‚Рё РїРѕСЃРёР»Р°РЅРЅСЏ' }}
              </button>
            </template>
            <template v-else>
              <button
                class="btn btn--sm"
                type="button"
                :disabled="actionLoading"
                @click="saveMeetingLink"
              >
                Р—Р±РµСЂРµРіС‚Рё
              </button>
              <button
                class="btn btn--ghost btn--sm"
                type="button"
                :disabled="actionLoading"
                @click="toggleEditMeetingLink"
              >
                РЎРєР°СЃСѓРІР°С‚Рё
              </button>
            </template>
          </div>
        </div>
        <div v-else-if="isOfflineSession" class="meeting-card">
          <div>
            <div class="detail-label">РћС„Р»Р°Р№РЅ-СЃРµСЃС–СЏ</div>
            <div class="detail-value">{{ offlineLocation || 'Р›РѕРєР°С†С–СЋ СѓР·РіРѕРґР¶РµРЅРѕ Р·С– СЃРїРµС†С–Р°Р»С–СЃС‚РѕРј.' }}</div>
            <div class="muted detail-meta">Р”Р»СЏ РѕС„Р»Р°Р№РЅ-С„РѕСЂРјР°С‚Сѓ РїРѕСЃРёР»Р°РЅРЅСЏ РґР»СЏ РїСЂРёС”РґРЅР°РЅРЅСЏ РЅРµ РІРёРєРѕСЂРёСЃС‚РѕРІСѓС”С‚СЊСЃСЏ.</div>
          </div>
        </div>
      </section>

      <section
        v-if="postSessionContext && session.status === 'COMPLETED'"
        class="panel panel--next-step"
      >
        <div class="panel__header">
          <div>
            <div class="badge badge--soft">РџС–СЃР»СЏ СЃРµСЃС–С—</div>
            <h2 class="panel__title">РќР°СЃС‚СѓРїРЅС– РєСЂРѕРєРё</h2>
          </div>
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
          <RouterLink class="btn btn--ghost btn--sm" to="/cabinet/sessions">
            РџРѕРІРµСЂРЅСѓС‚РёСЃСЊ РґРѕ СЃРїРёСЃРєСѓ
          </RouterLink>
        </div>
      </section>

      <section v-if="workspacePanelVisible" class="panel panel--workspace" data-testid="session-workspace">
        <div class="panel__header">
          <div>
            <div class="badge badge--soft">Р РѕР±РѕС‡РёР№ РїСЂРѕСЃС‚С–СЂ</div>
            <h2 class="panel__title">РЎС‚Р°РЅ РїС–СЃР»СЏ СЃРµСЃС–С—</h2>
          </div>
        </div>

        <div class="workspace-summary">
          <article
            v-for="item in workspaceSummaryItems"
            :key="item.key"
            class="workspace-summary__item"
            :data-testid="`workspace-summary-${item.key}`"
          >
            <div class="workspace-summary__meta">
              <div class="workspace-summary__label">{{ item.title }}</div>
              <div v-if="item.updatedAtLabel" class="workspace-summary__updated muted">
                РћРЅРѕРІР»РµРЅРѕ: {{ item.updatedAtLabel }}
              </div>
            </div>
            <div class="status-pill" :class="item.pillClass">{{ item.statusLabel }}</div>
          </article>
        </div>

        <div
          v-if="workspacePrimaryAction || workspaceSecondaryActions.length"
          class="workspace-actions"
          data-testid="workspace-actions"
        >
          <div class="workspace-actions__title">РџРѕС‚СЂРµР±СѓС” СѓРІР°РіРё</div>
          <button
            v-if="workspacePrimaryAction"
            class="btn btn--sm"
            type="button"
            :data-testid="`workspace-action-${workspacePrimaryAction.id}`"
            @click="workspacePrimaryAction.run"
          >
            {{ workspacePrimaryAction.label }}
          </button>
          <div v-if="workspaceSecondaryActions.length" class="workspace-actions__secondary">
            <button
              v-for="action in workspaceSecondaryActions"
              :key="action.id"
              class="btn btn--ghost btn--sm"
              type="button"
              :data-testid="`workspace-action-${action.id}`"
              @click="action.run"
            >
              {{ action.label }}
            </button>
          </div>
        </div>

        <div v-else class="muted" data-testid="workspace-no-pending">
          РЈСЃС– РєР»СЋС‡РѕРІС– РєСЂРѕРєРё РІРёРєРѕРЅР°РЅРѕ Р°Р±Рѕ РЅРµ РїРѕС‚СЂРµР±СѓСЋС‚СЊ РґС–Р№.
        </div>
      </section>

      <section ref="paymentPanelRef" class="panel">
        <SessionPaymentProofBlock
          :session-id="session.id"
          role="specialist"
          :payment-proof="session.payment_proof"
          @updated="onPaymentProofUpdated"
          @payment-details-missing="onPaymentDetailsMissing"
        />
        <div v-if="paymentProofActionError" class="payment-proof-error">
          <p>{{ paymentProofActionError }}</p>
          <button class="btn btn--ghost btn--sm" type="button" @click="openPaymentDetailsSettings">
            РџРµСЂРµР№С‚Рё РґРѕ СЂРµРєРІС–Р·РёС‚С–РІ РґР»СЏ РѕРїР»Р°С‚Рё
          </button>
        </div>
      </section>

      <section v-if="sessionRequests.length" class="panel">
        <div class="panel__header">
          <div>
            <div class="badge badge--soft">Р—Р°РїРёС‚Рё</div>
            <h2 class="panel__title">Р—Р°РїРёС‚Рё РЅР° РїРµСЂРµРЅРѕСЃ</h2>
          </div>
        </div>
        <div v-if="requestsLoading" class="muted">Р—Р°РІР°РЅС‚Р°Р¶РµРЅРЅСЏ Р·Р°РїРёС‚С–РІ...</div>
        <div v-else class="request-list">
          <article v-for="request in sessionRequests" :key="request.id" class="request-card">
            <div class="request-main">
              <div class="request-title">
                {{ request.client_name || request.client_username || 'РљР»С–С”РЅС‚' }}
              </div>
              <div v-if="request.client_email" class="muted">{{ request.client_email }}</div>
              <div class="muted">
                Р—Р°РїРёС‚Р°РЅРµ РІС–РєРЅРѕ:
                <span v-if="request.requested_slot_start_at && request.requested_slot_end_at">
                  {{ formatDateTime(request.requested_slot_start_at) }}
                  Р’В·
                  {{ formatDuration(request.requested_slot_start_at, request.requested_slot_end_at) }}
                </span>
                <span v-else>#{{ request.requested_slot_id }}</span>
              </div>
              <div class="status-pill" :class="requestStatusClass(request.status)">
                {{ rescheduleStatusLabel(request.status) }}
              </div>
            </div>
            <div v-if="request.status === 'PENDING'" class="request-actions">
              <button
                class="btn btn--ghost btn--sm"
                type="button"
                :disabled="isRequestLoading(request.id)"
                @click="approveRequest(request.id)"
              >
                РџРѕРіРѕРґРёС‚Рё
              </button>
              <button
                class="btn btn--ghost btn--sm"
                type="button"
                :disabled="isRequestLoading(request.id)"
                @click="declineRequest(request.id)"
              >
                Р’С–РґС…РёР»РёС‚Рё
              </button>
            </div>
          </article>
        </div>
      </section>

      <section v-if="showReschedulePanel" class="panel">
        <div class="panel__header">
          <div>
            <div class="badge badge--soft">РџРµСЂРµРЅРµСЃРµРЅРЅСЏ</div>
            <h2 class="panel__title">РќРѕРІРёР№ СЃР»РѕС‚ РґР»СЏ СЃРµСЃС–С—</h2>
          </div>
        </div>
        <div class="muted">
          РћР±РµСЂС–С‚СЊ РґРѕСЃС‚СѓРїРЅРµ РІС–РєРЅРѕ Р°Р±Рѕ СЃРєРѕСЂРёСЃС‚Р°Р№С‚РµСЃСЏ СЂРµРєРѕРјРµРЅРґРѕРІР°РЅРёРјРё РІР°СЂС–Р°РЅС‚Р°РјРё РїРµСЂРµРЅРѕСЃСѓ.
        </div>
        <div class="suggestions-block">
          <div class="muted suggestions-title">Р РµРєРѕРјРµРЅРґРѕРІР°РЅС– РІР°СЂС–Р°РЅС‚Рё</div>
          <div v-if="suggestionsLoading" class="muted">Р—Р°РІР°РЅС‚Р°Р¶РµРЅРЅСЏ СЂРµРєРѕРјРµРЅРґР°С†С–Р№...</div>
          <div v-else-if="rescheduleSuggestions.length === 0" class="muted">
            Р”Р»СЏ С†С–С”С— СЃРµСЃС–С— Р·Р°СЂР°Р· РЅРµРјР°С” РѕРєСЂРµРјРёС… СЂРµРєРѕРјРµРЅРґР°С†С–Р№.
          </div>
          <div v-else class="suggestions-list">
            <button
              v-for="item in rescheduleSuggestions.slice(0, 5)"
              :key="item.slot_id"
              class="btn btn--ghost btn--sm suggestion-btn"
              :class="{ 'suggestion-btn--active': selectedSuggestionSlotId === item.slot_id }"
              type="button"
              :disabled="actionLoading"
              @click="selectSuggestedSlot(item.slot_id)"
            >
              <span>{{ formatDateTime(item.start_at) }} Р’В· {{ formatDuration(item.start_at, item.end_at) }}</span>
              <span class="muted suggestion-meta">{{ suggestionReasonLabel(item.reason_tag) }}</span>
            </button>
          </div>
          <button
            v-if="selectedSuggestionSlotId"
            class="btn btn--sm"
            type="button"
            :disabled="actionLoading"
            @click="submitSelectedSuggestion"
          >
            РџС–РґС‚РІРµСЂРґРёС‚Рё РїРµСЂРµРЅРѕСЃ
          </button>
        </div>

        <div v-if="slotsLoading" class="muted">Р—Р°РІР°РЅС‚Р°Р¶РµРЅРЅСЏ СЃР»РѕС‚С–РІ...</div>
        <div v-else-if="availableSlots.length === 0" class="muted">РќРµРјР°С” РґРѕСЃС‚СѓРїРЅРёС… СЃР»РѕС‚С–РІ РґР»СЏ РїРµСЂРµРЅРѕСЃСѓ.</div>
        <div v-else class="slot-list">
          <article v-for="slot in availableSlots" :key="slot.id" class="slot-card">
            <div>
              <div class="slot-time">{{ formatDateTime(slot.start_at) }}</div>
              <div class="muted">{{ formatDuration(slot.start_at, slot.end_at) }}</div>
            </div>
            <button
              class="btn btn--ghost btn--sm"
              type="button"
              :disabled="actionLoading"
              @click="submitReschedule(slot.id)"
            >
              РџРµСЂРµРЅРµСЃС‚Рё СЃСЋРґРё
            </button>
          </article>
        </div>
      </section>

      <section v-if="showRecurringPanel" class="panel">
        <div class="panel__header">
          <div>
            <div class="badge badge--soft">РЎРµСЂС–СЏ</div>
            <h2 class="panel__title">РЎС‚РІРѕСЂРёС‚Рё РїРѕРІС‚РѕСЂСЋРІР°РЅС– СЃРµСЃС–С—</h2>
          </div>
        </div>
        <div class="recurring-grid">
          <label class="field">
            <span class="muted">РљС–Р»СЊРєС–СЃС‚СЊ РїРѕРІС‚РѕСЂС–РІ</span>
            <select v-model="recurringPreset" class="input input--select">
              <option :value="4">4 С‚РёР¶РЅС–</option>
              <option :value="8">8 С‚РёР¶РЅС–РІ</option>
              <option :value="12">12 С‚РёР¶РЅС–РІ</option>
              <option value="custom">Р’Р»Р°СЃРЅРµ С‡РёСЃР»Рѕ</option>
            </select>
          </label>
          <label v-if="recurringPreset === 'custom'" class="field">
            <span class="muted">Р’Р»Р°СЃРЅРµ С‡РёСЃР»Рѕ</span>
            <input
              v-model.number="recurringCustomOccurrences"
              class="input"
              type="number"
              min="1"
              max="52"
              step="1"
              placeholder="РќР°РїСЂРёРєР»Р°Рґ, 6"
            />
          </label>
        </div>
        <div class="recurring-actions">
          <button class="btn btn--sm" type="button" :disabled="actionLoading" @click="submitRecurring">
            РЎС‚РІРѕСЂРёС‚Рё СЃРµСЂС–СЋ
          </button>
        </div>
        <div v-if="recurringResult" class="recurring-result">
          <div class="status-pill status-pill--ok">
            РЎС‚РІРѕСЂРµРЅРѕ {{ recurringResult.created_count ?? 0 }} СЃРµСЃС–Р№
          </div>
          <div v-if="(recurringResult.skipped_count ?? 0) > 0" class="status-pill status-pill--warn">
            РџСЂРѕРїСѓС‰РµРЅРѕ {{ recurringResult.skipped_count ?? 0 }} С‡РµСЂРµР· РєРѕРЅС„Р»С–РєС‚Рё
          </div>
          <div v-if="(recurringResult.created_dates || []).length" class="recurring-list">
            <div class="muted">РЎС‚РІРѕСЂРµРЅС– РґР°С‚Рё:</div>
            <ul class="recurring-ul">
              <li v-for="date in recurringResult.created_dates" :key="date">{{ formatDateTime(date) }}</li>
            </ul>
          </div>
        </div>
      </section>

      <section class="panel">
        <div class="panel__header">
          <div>
            <div class="badge badge--soft">РќРѕС‚Р°С‚РєРё</div>
            <h2 class="panel__title">РџСЂРёРІР°С‚РЅР° С–СЃС‚РѕСЂС–СЏ РїРѕ СЃРµСЃС–С—</h2>
          </div>
          <div class="note-header-actions">
            <button
              v-if="session.client"
              class="btn btn--ghost btn--sm"
              type="button"
              @click="openWorkbookWindow(session.client)"
            >
              &#1042;&#1110;&#1076;&#1082;&#1088;&#1080;&#1090;&#1080;&#32;&#1074;&#32;&#1086;&#1082;&#1088;&#1077;&#1084;&#1086;&#1084;&#1091;&#32;&#1074;&#1110;&#1082;&#1085;&#1110;
            </button>
          </div>
        </div>
        <div v-if="noteLoading" class="muted">Р—Р°РІР°РЅС‚Р°Р¶РµРЅРЅСЏ РЅРѕС‚Р°С‚РєРё...</div>
        <div v-else class="note-panel">
          <label class="field">
            <span class="note-title">РџСЂРёРІР°С‚РЅР° РЅРѕС‚Р°С‚РєР°</span>
            <span class="note-badge">Р—Р°С€РёС„СЂРѕРІР°РЅРѕ</span>
            <textarea
              ref="noteTextareaRef"
              v-model="noteDraft"
              class="input note-textarea"
              rows="6"
              placeholder="РљРѕСЂРѕС‚РєРёР№ РєРѕРјРµРЅС‚Р°СЂ РїРѕ СЃРµСЃС–С— С‚Р° РІР°Р¶Р»РёРІС– СЃРїРѕСЃС‚РµСЂРµР¶РµРЅРЅСЏ."
            ></textarea>
            <span class="note-helper muted">Р”РѕСЃС‚СѓРї РґРѕ РЅРѕС‚Р°С‚РєРё РјР°С” Р»РёС€Рµ СЃРїРµС†С–Р°Р»С–СЃС‚.</span>
          </label>
          <div class="note-actions">
            <button class="btn btn--sm" type="button" :disabled="noteSaving" @click="saveNote">
              Р—Р±РµСЂРµРіС‚Рё
            </button>
          </div>
        </div>
      </section>
    </template>

    <section v-else class="panel">
      <EmptyState
        title="РЎРµСЃС–СЋ РЅРµ Р·РЅР°Р№РґРµРЅРѕ"
        :description="pageError || 'РџРµСЂРµРІС–СЂС‚Рµ РїРѕСЃРёР»Р°РЅРЅСЏ Р°Р±Рѕ РїРѕРІРµСЂРЅС–С‚СЊСЃСЏ РґРѕ СЃРїРёСЃРєСѓ СЃРµСЃС–Р№.'"
        action-text="Р”Рѕ СЃРїРёСЃРєСѓ СЃРµСЃС–Р№"
        action-to="/cabinet/sessions"
      />
    </section>

    <SessionCompletionModal
      :open="completionModalOpen"
      v-model="completionDurationDraft"
      :loading="actionLoading"
      :planned-duration-minutes="completionPlannedDuration"
      :error-message="completionDurationError"
      @confirm="submitCompletion"
      @cancel="closeCompletionModal"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  apiGet,
  updateSpecialistSessionMeeting,
  type SessionFormat,
  type SessionPaymentProof,
} from '../lib/api'
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
  clientLabel as getClientLabel,
  completeSpecialistSession as completeSpecialistSessionAction,
  confirmSpecialistSession as confirmSpecialistSessionAction,
  createRecurringSpecialistSessions as createRecurringSpecialistSessionsAction,
  declineSpecialistRescheduleRequest as declineSpecialistRescheduleRequestAction,
  findNextUpcomingSession as getNextUpcomingSession,
  fetchSpecialistAvailableSlots as fetchSpecialistAvailableSlotsData,
  fetchSpecialistRescheduleRequests as fetchSpecialistRescheduleRequestsData,
  fetchSpecialistRescheduleSuggestions as fetchSpecialistRescheduleSuggestionsData,
  fetchSpecialistSessionNoteContent as fetchSpecialistSessionNoteContentData,
  formatSessionDateTime as sharedFormatSessionDateTime,
  formatSessionDuration as sharedFormatSessionDuration,
  parseActualDurationInput as getActualDurationPayload,
  parseRecurringOccurrences as getRecurringOccurrences,
  requestStatusClass as getRequestStatusClass,
  rescheduleSpecialistSession as rescheduleSpecialistSessionAction,
  rescheduleStatusLabel as getRescheduleStatusLabel,
  saveSpecialistSessionNote as saveSpecialistSessionNoteAction,
  sessionDurationMinutes as getSessionDurationMinutes,
  sessionEndAt as getSessionEndAt,
  sessionStartAt as getSessionStartAt,
  statusClass as getStatusClass,
  statusLabel as getStatusLabel,
  suggestedActualDurationInput as getSuggestedActualDurationInput,
  suggestionReasonLabel as getSuggestionReasonLabel,
  timeUntilLabel as getTimeUntilLabel,
  type SpecialistRecurringSummary,
  type SpecialistRescheduleRequest,
  type SpecialistRescheduleSuggestion,
  type SpecialistSlot } from '../lib/specialistSessions'
import {
  externalMeetingHint,
  externalMeetingProviderLabel,
  normalizeMeetingUrl,
} from '../lib/sessionExecution'
import { openClientWorkbookWindow } from '../lib/workbookWindow'
import { useToast } from '../composables/useToast'
import EmptyState from '../components/EmptyState.vue'
import LoadingSkeleton from '../components/LoadingSkeleton.vue'
import SessionCompletionModal from '../components/SessionCompletionModal.vue'
import SessionPaymentProofBlock from '../components/SessionPaymentProofBlock.vue'
import {
  createPracticeBoardItem,
  fetchPracticeBoards,
  resolveDefaultPracticeBoardId,
} from '../lib/specialistPracticeBoard'

type SessionSlot = {
  start_at?: string | null
  end_at?: string | null
}

type WorkspacePaymentState = 'paid' | 'awaiting_confirmation' | 'unpaid' | 'not_applicable' | string
type WorkspaceNoteState = 'hidden' | 'missing' | 'draft' | 'completed' | string
type WorkspaceWorkbookState = 'hidden' | 'missing' | 'draft' | 'completed' | string
type WorkspaceDomain = 'payment' | 'note' | 'workbook'
type WorkspaceActionCode =
  | 'OPEN_NOTE'
  | 'CONTINUE_NOTE'
  | 'OPEN_WORKBOOK'
  | 'CONTINUE_WORKBOOK'
  | 'REVIEW_PAYMENT'
  | 'UPLOAD_PAYMENT_PROOF'
  | 'CONFIRM_PAYMENT'

type SessionWorkspaceItem = string | {
  code?: string | null
  label?: string | null
  title?: string | null
  name?: string | null
}

type SessionWorkspace = {
  session_id?: number | null
  lifecycle_status?: string | null
  payment_state?: WorkspacePaymentState | null
  note_state?: WorkspaceNoteState | null
  workbook_state?: WorkspaceWorkbookState | null
  payment_updated_at?: string | null
  note_updated_at?: string | null
  workbook_updated_at?: string | null
  permissions?: Record<string, unknown> | null
  available_action_items?: SessionWorkspaceItem[] | null
  pending_task_items?: SessionWorkspaceItem[] | null
  available_actions?: SessionWorkspaceItem[] | null
  pending_tasks?: SessionWorkspaceItem[] | null
}

type SessionDetail = {
  id: number
  status: string
  client: number
  client_username?: string | null
  client_name?: string | null
  client_email?: string | null
  therapist: number
  session_format?: SessionFormat | null
  offline_location?: string | null
  therapist_username?: string | null
  meeting_mode?: 'ONLINE' | 'OFFLINE'
  meeting_url?: string | null
  meeting_provider?: string | null
  meeting_link_ready?: boolean
  join_available?: boolean
  join_starts_at?: string | null
  join_ends_at?: string | null
  slot?: SessionSlot | number | null
  slot_start_at?: string | null
  slot_end_at?: string | null
  payment_proof?: SessionPaymentProof | null
  workspace?: SessionWorkspace | null
}

type PostSessionContext = {
  sessionId: number
  clientId: number | null
}

type WorkspaceSummaryItem = {
  key: WorkspaceDomain
  title: string
  statusLabel: string
  pillClass: string
  updatedAtLabel: string
}

type WorkspaceAction = {
  id: string
  label: string
  priority: number
  run: () => void | Promise<void>
}

const WORKSPACE_ACTION_PRIORITY: Record<WorkspaceActionCode, number> = {
  CONTINUE_NOTE: 10,
  OPEN_NOTE: 20,
  CONTINUE_WORKBOOK: 30,
  OPEN_WORKBOOK: 40,
  REVIEW_PAYMENT: 5,
  UPLOAD_PAYMENT_PROOF: 45,
  CONFIRM_PAYMENT: 50,
}

const WORKSPACE_ACTION_LABEL: Record<WorkspaceActionCode, string> = {
  OPEN_NOTE: 'Р’С–РґРєСЂРёС‚Рё РЅРѕС‚Р°С‚РєСѓ',
  CONTINUE_NOTE: 'РџСЂРѕРґРѕРІР¶РёС‚Рё РЅРѕС‚Р°С‚РєСѓ',
  OPEN_WORKBOOK: 'Р’С–РґРєСЂРёС‚Рё СЂРѕР±РѕС‡РёР№ Р·РѕС€РёС‚',
  CONTINUE_WORKBOOK: 'РџСЂРѕРґРѕРІР¶РёС‚Рё СЂРѕР±РѕС‡РёР№ Р·РѕС€РёС‚',
  REVIEW_PAYMENT: 'РџРµСЂРµРІС–СЂРёС‚Рё РѕРїР»Р°С‚Сѓ',
  UPLOAD_PAYMENT_PROOF: 'Р’С–РґРєСЂРёС‚Рё Р±Р»РѕРє РѕРїР»Р°С‚Рё',
  CONFIRM_PAYMENT: 'Р’С–РґРєСЂРёС‚Рё Р±Р»РѕРє РѕРїР»Р°С‚Рё',
}

const WORKSPACE_ACTION_DOMAIN: Record<WorkspaceActionCode, WorkspaceDomain> = {
  OPEN_NOTE: 'note',
  CONTINUE_NOTE: 'note',
  OPEN_WORKBOOK: 'workbook',
  CONTINUE_WORKBOOK: 'workbook',
  REVIEW_PAYMENT: 'payment',
  UPLOAD_PAYMENT_PROOF: 'payment',
  CONFIRM_PAYMENT: 'payment',
}

const route = useRoute()
const router = useRouter()
const toast = useToast()
const sessionId = computed(() => Number(route.params.id))
const hasValidSessionId = computed(() => Number.isInteger(sessionId.value) && sessionId.value > 0)
const session = ref<SessionDetail | null>(null)
const loading = ref(false)
const error = ref('')
const pageError = ref('')
const actionLoading = ref(false)
const completionModalOpen = ref(false)
const completionDurationDraft = ref('')
const completionDurationError = ref('')
const noteLoading = ref(false)
const noteSaving = ref(false)
const noteDraft = ref('')
const noteTextareaRef = ref<HTMLTextAreaElement | null>(null)
const slotsLoading = ref(false)
const availableSlots = ref<SpecialistSlot[]>([])
const suggestionsLoading = ref(false)
const rescheduleSuggestions = ref<SpecialistRescheduleSuggestion[]>([])
const selectedSuggestionSlotId = ref<number | null>(null)
const requestsLoading = ref(false)
const rescheduleRequests = ref<SpecialistRescheduleRequest[]>([])
const requestLoading = ref<Set<number>>(new Set())
const showReschedulePanel = ref(false)
const showRecurringPanel = ref(false)
const recurringPreset = ref<number | 'custom'>(4)
const recurringCustomOccurrences = ref<number | ''>('')
const recurringResult = ref<SpecialistRecurringSummary | null>(null)
const postSessionContext = ref<PostSessionContext | null>(null)
const postSessionNextSession = ref<Pick<SessionDetail, 'id' | 'status' | 'slot' | 'slot_start_at'> | null>(null)
const isEditingMeetingLink = ref(false)
const meetingLinkDraft = ref('')
const paymentProofActionError = ref('')
const paymentPanelRef = ref<HTMLElement | null>(null)
const quickAddPending = ref(false)

function normalizeSessionFormat(detail: SessionDetail | null): SessionFormat {
  if (!detail) return 'online'
  if (detail.session_format === 'offline') return 'offline'
  if (detail.session_format === 'online') return 'online'
  if (detail.meeting_mode === 'OFFLINE') return 'offline'
  return 'online'
}

const sessionFormat = computed<SessionFormat>(() => normalizeSessionFormat(session.value))
const isOfflineSession = computed(() => sessionFormat.value === 'offline')
const sessionFormatLabel = computed(() => (isOfflineSession.value ? 'РћС„Р»Р°Р№РЅ' : 'РћРЅР»Р°Р№РЅ'))
const offlineLocation = computed(() => {
  if (!isOfflineSession.value) return ''
  return (session.value?.offline_location || '').trim()
})
const meetingUrl = computed(() => normalizeMeetingUrl(session.value?.meeting_url))
const canJoinMeeting = computed(() =>
  Boolean(!isOfflineSession.value && session.value?.join_available && meetingUrl.value)
)
const meetingProvider = computed(() =>
  externalMeetingProviderLabel(session.value?.meeting_provider, meetingUrl.value)
)
const meetingHint = computed(() => {
  if (!session.value || !meetingUrl.value) return ''
  return externalMeetingHint(session.value)
})
const meetingSetupHint = computed(() => {
  if (meetingHint.value) return meetingHint.value
  return 'Р”РѕРґР°Р№С‚Рµ РїРѕСЃРёР»Р°РЅРЅСЏ РЅР° Google Meet, Zoom Р°Р±Рѕ С–РЅС€Сѓ РїР»Р°С‚С„РѕСЂРјСѓ РґР»СЏ РѕРЅР»Р°Р№РЅ-Р·СѓСЃС‚СЂС–С‡С–.'
})

const postSessionClientLink = computed(() => {
  const clientId = postSessionContext.value?.clientId ?? session.value?.client ?? null
  if (!clientId) return '/cabinet/clients'
  return `/cabinet/clients?client=${clientId}&autoOpen=1`
})

const sessionRequests = computed(() =>
  session.value ? rescheduleRequests.value.filter((item) => item.session_id === session.value?.id) : []
)

const workspace = computed<SessionWorkspace | null>(() => session.value?.workspace || null)

const workspacePanelVisible = computed(() => Boolean(workspace.value))

const workspacePaymentState = computed<WorkspacePaymentState | null>(() => workspace.value?.payment_state || null)
const workspaceNoteState = computed<WorkspaceNoteState | null>(() => workspace.value?.note_state || null)
const workspaceWorkbookState = computed<WorkspaceWorkbookState | null>(() => workspace.value?.workbook_state || null)

const workspaceSummaryItems = computed<WorkspaceSummaryItem[]>(() => {
  if (!workspace.value) return []

  const items: WorkspaceSummaryItem[] = []
  const paymentState = workspacePaymentState.value
  const noteState = workspaceNoteState.value
  const workbookState = workspaceWorkbookState.value

  if (paymentState && paymentState !== 'not_applicable') {
    items.push({
      key: 'payment',
      title: 'РћРїР»Р°С‚Р°',
      statusLabel: paymentStateLabel(paymentState),
      pillClass: paymentStateClass(paymentState),
      updatedAtLabel: formatWorkspaceUpdatedAt(workspace.value.payment_updated_at),
    })
  }

  if (noteState) {
    items.push({
      key: 'note',
      title: 'РќРѕС‚Р°С‚РєР°',
      statusLabel: noteStateLabel(noteState),
      pillClass: noteStateClass(noteState),
      updatedAtLabel: formatWorkspaceUpdatedAt(workspace.value.note_updated_at),
    })
  }

  if (workbookState) {
    items.push({
      key: 'workbook',
      title: 'Р РѕР±РѕС‡РёР№ Р·РѕС€РёС‚',
      statusLabel: noteStateLabel(workbookState),
      pillClass: noteStateClass(workbookState),
      updatedAtLabel: formatWorkspaceUpdatedAt(workspace.value.workbook_updated_at),
    })
  }

  return items
})

const workspaceActions = computed<WorkspaceAction[]>(() => {
  if (!workspace.value) return []
  const noteState = workspaceNoteState.value
  const workbookState = workspaceWorkbookState.value
  const paymentState = workspacePaymentState.value
  const sourceItems = normalizeWorkspaceItems(resolveWorkspaceActionSource(workspace.value))
  const actionItems =
    sourceItems.length > 0
      ? sourceItems
      : deriveWorkspaceFallbackActionItems({
          noteState,
          workbookState,
          paymentState,
        })
  const actions: WorkspaceAction[] = []
  const seenCodes = new Set<string>()
  for (const item of actionItems) {
    const code = item.code
    if (seenCodes.has(code)) continue
    seenCodes.add(code)
    const nextAction = resolveWorkspaceActionByCode(code, {
      noteState,
      workbookState,
      paymentState,
    })
    if (!nextAction) continue
    actions.push(nextAction)
  }
  return actions.sort((a, b) => a.priority - b.priority)
})
const workspacePrimaryAction = computed<WorkspaceAction | null>(() => workspaceActions.value[0] || null)
const workspaceSecondaryActions = computed(() => workspaceActions.value.slice(1))

const completionPlannedDuration = computed(() => {
  if (!session.value) return null
  return getSessionDurationMinutes(session.value)
})

const isRequestLoading = (id: number) => requestLoading.value.has(id)

watch(error, (value) => {
  if (!value) return
  toast.error(value)
  error.value = ''
})

function openWorkbookWindow(clientId: number) {
  openClientWorkbookWindow(clientId)
}

function sessionStartAt(detail: SessionDetail) {
  return getSessionStartAt(detail)
}

function sessionEndAt(detail: SessionDetail) {
  return getSessionEndAt(detail)
}

function formatDateTime(value?: string | null) {
  return sharedFormatSessionDateTime(value)
}

function formatDuration(start?: string | null, end?: string | null) {
  return sharedFormatSessionDuration(start, end)
}

function timeUntilLabel(detail: SessionDetail) {
  return getTimeUntilLabel(detail)
}

function clientLabel(detail: SessionDetail) {
  return getClientLabel(detail)
}

function statusLabel(detail: SessionDetail) {
  return getStatusLabel(detail)
}

function statusClass(detail: SessionDetail) {
  return getStatusClass(detail)
}

function formatWorkspaceUpdatedAt(value?: string | null) {
  if (!value) return ''
  return sharedFormatSessionDateTime(value)
}

function paymentStateLabel(state: WorkspacePaymentState) {
  if (state === 'paid') return 'РћРїР»Р°С‡РµРЅРѕ'
  if (state === 'awaiting_confirmation') return 'РћС‡С–РєСѓС” РїС–РґС‚РІРµСЂРґР¶РµРЅРЅСЏ'
  if (state === 'unpaid') return 'РќРµ РѕРїР»Р°С‡РµРЅРѕ'
  if (state === 'not_applicable') return 'РќРµ Р·Р°СЃС‚РѕСЃРѕРІСѓС”С‚СЊСЃСЏ'
  return state
}

function paymentStateClass(state: WorkspacePaymentState) {
  if (state === 'paid') return 'status-pill--ok'
  if (state === 'awaiting_confirmation') return 'status-pill--warn'
  if (state === 'unpaid') return 'status-pill--muted'
  return 'status-pill--muted'
}

function noteStateLabel(state: WorkspaceNoteState | WorkspaceWorkbookState) {
  if (state === 'missing') return 'РџРѕС‚СЂС–Р±РЅРѕ СЃС‚РІРѕСЂРёС‚Рё'
  if (state === 'draft') return 'Р§РµСЂРЅРµС‚РєР°'
  if (state === 'completed') return 'Р—Р°РїРѕРІРЅРµРЅРѕ'
  if (state === 'hidden') return 'РќРµРґРѕСЃС‚СѓРїРЅРѕ'
  return state
}

function noteStateClass(state: WorkspaceNoteState | WorkspaceWorkbookState) {
  if (state === 'completed') return 'status-pill--ok'
  if (state === 'draft') return 'status-pill--warn'
  if (state === 'missing') return 'status-pill--muted'
  if (state === 'hidden') return 'status-pill--muted'
  return 'status-pill--muted'
}

function resolveWorkspaceActionSource(currentWorkspace: SessionWorkspace) {
  if (currentWorkspace.pending_task_items?.length) return currentWorkspace.pending_task_items
  if (currentWorkspace.available_action_items?.length) return currentWorkspace.available_action_items
  if (currentWorkspace.pending_tasks?.length) return currentWorkspace.pending_tasks
  return currentWorkspace.available_actions
}
function normalizeWorkspaceItems(items?: SessionWorkspaceItem[] | null) {
  if (!items || !Array.isArray(items)) return []
  return items
    .map((item) => {
      if (typeof item === 'string') {
        const code = item.trim().toUpperCase()
        if (!code) return null
        return {
          code,
          label: item.trim(),
        }
      }
      if (!item || typeof item !== 'object') return null
      const rawCode = typeof item.code === 'string' ? item.code : ''
      const rawLabel =
        typeof item.label === 'string'
          ? item.label
          : typeof item.title === 'string'
            ? item.title
            : typeof item.name === 'string'
              ? item.name
              : ''
      const code = rawCode.trim().toUpperCase()
      const label = rawLabel.trim()
      if (!code) return null
      return { code, label }
    })
    .filter((item): item is { code: string; label: string } => Boolean(item))
}

function deriveWorkspaceFallbackActionItems({
  noteState,
  workbookState,
  paymentState,
}: {
  noteState: WorkspaceNoteState | null
  workbookState: WorkspaceWorkbookState | null
  paymentState: WorkspacePaymentState | null
}) {
  const codes: WorkspaceActionCode[] = []

  if (noteState === 'draft') codes.push('CONTINUE_NOTE')
  else if (noteState === 'missing') codes.push('OPEN_NOTE')

  if (workbookState === 'draft') codes.push('CONTINUE_WORKBOOK')
  else if (workbookState === 'missing') codes.push('OPEN_WORKBOOK')

  if (paymentState === 'awaiting_confirmation') codes.push('REVIEW_PAYMENT')
  else if (paymentState === 'unpaid') codes.push('UPLOAD_PAYMENT_PROOF')

  return codes.map((code) => ({ code, label: '' }))
}
function isWorkspaceActionCode(code: string): code is WorkspaceActionCode {
  return code in WORKSPACE_ACTION_DOMAIN
}
function hasWorkspaceActionPermission(code: WorkspaceActionCode) {
  const permissions = workspace.value?.permissions
  if (!permissions || typeof permissions !== 'object') return true
  const permissionKeysByCode: Record<WorkspaceActionCode, string[]> = {
    OPEN_NOTE: ['can_edit_note', 'can_open_note'],
    CONTINUE_NOTE: ['can_edit_note', 'can_open_note'],
    OPEN_WORKBOOK: ['can_open_workbook', 'can_edit_workbook'],
    CONTINUE_WORKBOOK: ['can_open_workbook', 'can_edit_workbook'],
    REVIEW_PAYMENT: ['can_review_payment'],
    UPLOAD_PAYMENT_PROOF: ['can_upload_payment_proof', 'can_review_payment'],
    CONFIRM_PAYMENT: ['can_confirm_payment', 'can_review_payment'],
  }
  const keys = permissionKeysByCode[code]
  const knownValues = keys
    .map((key) => permissions[key])
    .filter((value): value is boolean => typeof value === 'boolean')
  if (!knownValues.length) return true
  return knownValues.some(Boolean)
}
function canRunWorkspaceActionForState(
  code: WorkspaceActionCode,
  {
    noteState,
    workbookState,
    paymentState,
  }: {
    noteState: WorkspaceNoteState | null
    workbookState: WorkspaceWorkbookState | null
    paymentState: WorkspacePaymentState | null
  }
) {
  const domain = WORKSPACE_ACTION_DOMAIN[code]
  if (domain === 'note') {
    return Boolean(noteState && noteState !== 'hidden' && noteState !== 'completed')
  }
  if (domain === 'workbook') {
    return Boolean(workbookState && workbookState !== 'hidden' && workbookState !== 'completed')
  }
  return Boolean(paymentState && paymentState !== 'paid' && paymentState !== 'not_applicable')
}
function runWorkspaceAction(code: WorkspaceActionCode) {
  if (code === 'OPEN_NOTE' || code === 'CONTINUE_NOTE') {
    return () => focusSessionNote()
  }
  if (code === 'OPEN_WORKBOOK' || code === 'CONTINUE_WORKBOOK') {
    return () => openPostSessionWorkbook()
  }
  return () => focusPaymentBlock()
}
function resolveWorkspaceActionByCode(
  code: string,
  state: {
    noteState: WorkspaceNoteState | null
    workbookState: WorkspaceWorkbookState | null
    paymentState: WorkspacePaymentState | null
  }
): WorkspaceAction | null {
  if (!isWorkspaceActionCode(code)) return null
  if (!hasWorkspaceActionPermission(code)) return null
  if (!canRunWorkspaceActionForState(code, state)) return null
  return {
    id: code.toLowerCase(),
    label: WORKSPACE_ACTION_LABEL[code],
    priority: WORKSPACE_ACTION_PRIORITY[code],
    run: runWorkspaceAction(code),
  }
}
function rescheduleStatusLabel(status: string) {
  return getRescheduleStatusLabel(status)
}

function requestStatusClass(status: string) {
  return getRequestStatusClass(status)
}

function suggestionReasonLabel(reasonTag: string) {
  return getSuggestionReasonLabel(reasonTag)
}

function canCancel(status: string) {
  return sharedCanCancel(status)
}

function canReschedule(status: string) {
  return sharedCanReschedule(status)
}

function canShowRecurringAction(detail: SessionDetail) {
  return sharedCanShowRecurringAction(detail)
}

async function copyMeetingLink() {
  if (!meetingUrl.value) return
  try {
    await navigator.clipboard.writeText(meetingUrl.value)
    toast.success('РџРѕСЃРёР»Р°РЅРЅСЏ РЅР° Р·СѓСЃС‚СЂС–С‡ СЃРєРѕРїС–Р№РѕРІР°РЅРѕ.')
  } catch {
    toast.error('РќРµ РІРґР°Р»РѕСЃСЏ СЃРєРѕРїС–СЋРІР°С‚Рё РїРѕСЃРёР»Р°РЅРЅСЏ РЅР° Р·СѓСЃС‚СЂС–С‡.')
  }
}

function recurringOccurrencesValue() {
  return getRecurringOccurrences(recurringPreset.value, recurringCustomOccurrences.value)
}

function setRequestLoading(id: number, value: boolean) {
  const next = new Set(requestLoading.value)
  if (value) next.add(id)
  else next.delete(id)
  requestLoading.value = next
}

function onPaymentProofUpdated(nextPaymentProof: SessionPaymentProof) {
  if (!session.value) return
  paymentProofActionError.value = ''
  session.value = {
    ...session.value,
    payment_proof: nextPaymentProof,
  }
}

function focusPaymentBlock() {
  paymentPanelRef.value?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

function onPaymentDetailsMissing(message: string) {
  paymentProofActionError.value = message
}

function openPaymentDetailsSettings() {
  router.push({ path: '/cabinet/settings', query: { tab: 'payment-details' } })
}

async function loadSession() {
  if (!hasValidSessionId.value) {
    session.value = null
    pageError.value = 'РќРµРєРѕСЂРµРєС‚РЅРёР№ С–РґРµРЅС‚РёС„С–РєР°С‚РѕСЂ СЃРµСЃС–С—.'
    return
  }
  loading.value = true
  error.value = ''
  pageError.value = ''
  paymentProofActionError.value = ''
  try {
    session.value = await apiGet<SessionDetail>(`/booking/sessions/${sessionId.value}/`)
  } catch (err: any) {
    session.value = null
    pageError.value = getBookingErrorMessage(err, BOOKING_ERROR_FALLBACKS.loadSession)
  } finally {
    loading.value = false
  }
}

async function loadSlots() {
  slotsLoading.value = true
  try {
    availableSlots.value = await fetchSpecialistAvailableSlotsData()
  } catch {
    availableSlots.value = []
  } finally {
    slotsLoading.value = false
  }
}

async function loadRescheduleSuggestions() {
  if (!sessionId.value) return
  suggestionsLoading.value = true
  try {
    rescheduleSuggestions.value = await fetchSpecialistRescheduleSuggestionsData(sessionId.value)
  } catch {
    rescheduleSuggestions.value = []
  } finally {
    suggestionsLoading.value = false
  }
}

async function loadNote() {
  if (!sessionId.value) return
  noteLoading.value = true
  error.value = ''
  try {
    noteDraft.value = await fetchSpecialistSessionNoteContentData(sessionId.value)
  } catch (err: any) {
    error.value = getBookingErrorMessage(err, BOOKING_ERROR_FALLBACKS.loadSessionNote)
  } finally {
    noteLoading.value = false
  }
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

async function loadPage() {
  selectedSuggestionSlotId.value = null
  recurringResult.value = null
  showReschedulePanel.value = false
  showRecurringPanel.value = false
  postSessionContext.value = null
  postSessionNextSession.value = null
  closeCompletionModal(true)
  await loadSession()
  if (!session.value) return
  await Promise.all([loadSlots(), loadRescheduleSuggestions(), loadNote(), loadRescheduleRequests()])
}

async function refreshSessionContext() {
  await Promise.all([loadSession(), loadSlots(), loadRescheduleSuggestions(), loadRescheduleRequests()])
}

async function confirmSession() {
  if (!session.value) return
  actionLoading.value = true
  error.value = ''
  try {
    await confirmSpecialistSessionAction(session.value.id)
    await refreshSessionContext()
    toast.success(BOOKING_SUCCESS_MESSAGES.sessionConfirmed)
  } catch (err: any) {
    error.value = getBookingErrorMessage(err, BOOKING_ERROR_FALLBACKS.confirmSession)
  } finally {
    actionLoading.value = false
  }
}

function openCompletionModal() {
  if (!session.value) return
  completionModalOpen.value = true
  completionDurationDraft.value = getSuggestedActualDurationInput(session.value)
  completionDurationError.value = ''
}

function closeCompletionModal(force = false) {
  if (!force && actionLoading.value) return
  completionModalOpen.value = false
  completionDurationDraft.value = ''
  completionDurationError.value = ''
}

async function loadPostSessionNextSession(completedSessionId: number) {
  try {
    const upcoming = await apiGet<Array<Pick<SessionDetail, 'id' | 'status' | 'slot' | 'slot_start_at'>>>(
      '/booking/sessions/',
      { params: { upcoming: true } }
    )
    postSessionNextSession.value = getNextUpcomingSession(upcoming || [], {
      excludeSessionId: completedSessionId,
    })
  } catch {
    postSessionNextSession.value = null
  }
}

async function focusSessionNote() {
  await nextTick()
  const input = noteTextareaRef.value
  if (!input) return
  input.scrollIntoView({ behavior: 'smooth', block: 'center' })
  input.focus()
}

async function openPostSessionWorkbook() {
  const clientId = postSessionContext.value?.clientId ?? session.value?.client ?? null
  if (clientId) {
    openWorkbookWindow(clientId)
    return
  }
  await focusSessionNote()
}

async function submitCompletion() {
  if (!session.value) return
  const completionTargetId = session.value.id
  const { payload, error: durationError } = getActualDurationPayload(completionDurationDraft.value)
  if (durationError) {
    completionDurationError.value = durationError
    return
  }

  actionLoading.value = true
  error.value = ''
  completionDurationError.value = ''
  try {
    await completeSpecialistSessionAction(completionTargetId, payload)
    await Promise.all([refreshSessionContext(), loadNote(), loadPostSessionNextSession(completionTargetId)])
    postSessionContext.value = {
      sessionId: completionTargetId,
      clientId: session.value?.client ?? null,
    }
    closeCompletionModal(true)
    toast.success(BOOKING_SUCCESS_MESSAGES.sessionCompleted)
  } catch (err: any) {
    error.value = getBookingErrorMessage(err, BOOKING_ERROR_FALLBACKS.completeSession)
  } finally {
    actionLoading.value = false
  }
}

async function cancelSession() {
  if (!session.value) return
  actionLoading.value = true
  error.value = ''
  try {
    await cancelSpecialistSessionAction(session.value.id)
    await refreshSessionContext()
    toast.success(BOOKING_SUCCESS_MESSAGES.sessionCancelled)
  } catch (err: any) {
    error.value = getBookingErrorMessage(err, BOOKING_ERROR_FALLBACKS.cancelSession)
  } finally {
    actionLoading.value = false
  }
}

function toggleReschedulePanel() {
  showReschedulePanel.value = !showReschedulePanel.value
  if (showReschedulePanel.value) {
    showRecurringPanel.value = false
  }
}

function toggleRecurringPanel() {
  showRecurringPanel.value = !showRecurringPanel.value
  if (showRecurringPanel.value) {
    showReschedulePanel.value = false
  }
}

function selectSuggestedSlot(slotId: number) {
  selectedSuggestionSlotId.value = slotId
}

async function submitReschedule(slotId: number) {
  if (!session.value) return
  actionLoading.value = true
  error.value = ''
  try {
    await rescheduleSpecialistSessionAction(session.value.id, slotId)
    selectedSuggestionSlotId.value = null
    await refreshSessionContext()
    toast.success(BOOKING_SUCCESS_MESSAGES.sessionRescheduled)
  } catch (err: any) {
    error.value = getBookingErrorMessage(err, BOOKING_ERROR_FALLBACKS.rescheduleSession)
  } finally {
    actionLoading.value = false
  }
}

async function submitSelectedSuggestion() {
  if (!selectedSuggestionSlotId.value) return
  await submitReschedule(selectedSuggestionSlotId.value)
}

async function submitRecurring() {
  if (!session.value) return
  const occurrences = recurringOccurrencesValue()
  if (!occurrences) {
    error.value = 'Р’РєР°Р¶С–С‚СЊ РєС–Р»СЊРєС–СЃС‚СЊ РїРѕРІС‚РѕСЂС–РІ РІС–Рґ 1 РґРѕ 52.'
    return
  }

  actionLoading.value = true
  error.value = ''
  try {
    recurringResult.value = await createRecurringSpecialistSessionsAction(session.value.id, occurrences)
    await Promise.all([loadSession(), loadSlots()])
    const skipped = recurringResult.value?.skipped_count || 0
    const created = recurringResult.value?.created_count || 0
    if (skipped > 0) {
      toast.success(`РЎС‚РІРѕСЂРµРЅРѕ ${created} СЃРµСЃС–Р№, РїСЂРѕРїСѓС‰РµРЅРѕ ${skipped}.`)
    } else {
      toast.success(BOOKING_SUCCESS_MESSAGES.recurringSeriesCreated)
    }
  } catch (err: any) {
    error.value = getBookingErrorMessage(err, BOOKING_ERROR_FALLBACKS.createRecurringSession)
  } finally {
    actionLoading.value = false
  }
}

async function saveNote() {
  if (!sessionId.value) return
  noteSaving.value = true
  error.value = ''
  try {
    await saveSpecialistSessionNoteAction(sessionId.value, noteDraft.value)
    toast.success(BOOKING_SUCCESS_MESSAGES.noteSaved)
  } catch (err: any) {
    error.value = getBookingErrorMessage(err, BOOKING_ERROR_FALLBACKS.saveSessionNote)
  } finally {
    noteSaving.value = false
  }
}

async function approveRequest(id: number) {
  setRequestLoading(id, true)
  error.value = ''
  try {
    await approveSpecialistRescheduleRequestAction(id)
    await refreshSessionContext()
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

function toggleEditMeetingLink() {
  isEditingMeetingLink.value = !isEditingMeetingLink.value
  if (isEditingMeetingLink.value) {
    meetingLinkDraft.value = session.value?.meeting_url || ''
  } else {
    meetingLinkDraft.value = ''
  }
}

async function saveMeetingLink() {
  if (!session.value) return

  const normalized = meetingLinkDraft.value.trim()

  actionLoading.value = true
  error.value = ''

  try {
    await updateSpecialistSessionMeeting(session.value.id, {
      meeting_mode: normalized ? 'ONLINE' : 'OFFLINE',
      meeting_url: normalized || null,
    })
    await loadSession()
    toast.success('РџРѕСЃРёР»Р°РЅРЅСЏ РЅР° Р·СѓСЃС‚СЂС–С‡ РѕРЅРѕРІР»РµРЅРѕ.')
    isEditingMeetingLink.value = false
    meetingLinkDraft.value = ''
  } catch (err: any) {
    error.value = getBookingErrorMessage(err, 'РќРµ РІРґР°Р»РѕСЃСЏ РѕРЅРѕРІРёС‚Рё РїРѕСЃРёР»Р°РЅРЅСЏ РЅР° Р·СѓСЃС‚СЂС–С‡.')
  } finally {
    actionLoading.value = false
  }
}

async function addSessionToPracticeBoard() {
  if (!session.value || quickAddPending.value) return
  quickAddPending.value = true
  error.value = ''
  try {
    const boards = await fetchPracticeBoards()
    const boardId = resolveDefaultPracticeBoardId(boards)
    if (!boardId) {
      throw new Error('BOARD_NOT_FOUND')
    }
    await createPracticeBoardItem({
      board_id: boardId,
      title: 'РџРѕРІРµСЂРЅСѓС‚РёСЃСЊ РґРѕ СЃРµСЃС–С—',
      related_client_id: session.value.client || null,
      related_session_id: session.value.id,
      source_type: 'session',
      source_id: session.value.id,
    })
    toast.success('Р—Р°РґР°С‡Сѓ РґРѕРґР°РЅРѕ РЅР° РґРѕС€РєСѓ')
  } catch (err: any) {
    error.value = getBookingErrorMessage(err, 'РќРµ РІРґР°Р»РѕСЃСЏ РґРѕРґР°С‚Рё Р·Р°РґР°С‡Сѓ РЅР° РґРѕС€РєСѓ.')
  } finally {
    quickAddPending.value = false
  }
}

watch(
  sessionId,
  async () => {
    await loadPage()
  },
  { immediate: true }
)
</script>

<style scoped>
.session-detail {
  display: grid;
  gap: 18px;
}

.detail-hero {
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

.detail-title {
  font-size: 32px;
}

.detail-subtitle {
  max-width: 620px;
}

.panel {
  border: 1px solid var(--line);
  border-radius: 18px;
  padding: 18px;
  background: #fff;
  display: grid;
  gap: 14px;
}

.panel--summary {
  background: linear-gradient(135deg, rgba(8, 113, 201, 0.08), rgba(7, 47, 71, 0.03));
}

.panel--next-step {
  background: linear-gradient(135deg, rgba(31, 122, 76, 0.1), rgba(7, 47, 71, 0.04));
}

.panel--workspace {
  background: linear-gradient(135deg, rgba(7, 47, 71, 0.06), rgba(8, 113, 201, 0.05));
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
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}

.next-step-rail {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.note-header-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}

.workspace-summary {
  display: grid;
  gap: 10px;
}

.workspace-summary__item {
  border: 1px solid rgba(7, 47, 71, 0.12);
  border-radius: var(--radius-md);
  background: rgba(7, 47, 71, 0.03);
  padding: 10px 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.workspace-summary__meta {
  display: grid;
  gap: 2px;
}

.workspace-summary__label {
  font-size: 14px;
  font-weight: 600;
}

.workspace-summary__updated {
  font-size: 12px;
}

.workspace-actions {
  display: grid;
  gap: 10px;
  border: 1px solid rgba(217, 164, 65, 0.36);
  background: rgba(217, 164, 65, 0.08);
  border-radius: var(--radius-md);
  padding: 12px;
}

.workspace-actions__title {
  font-size: 13px;
  font-weight: 600;
  color: #7f5a12;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.workspace-actions__secondary {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}

.detail-card {
  padding: 12px 14px;
  border-radius: var(--radius-md);
  border: 1px solid rgba(7, 47, 71, 0.1);
  background: rgba(7, 47, 71, 0.04);
  display: grid;
  gap: 6px;
}

.detail-label {
  font-size: 12px;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.12em;
}

.detail-value {
  display: grid;
  gap: 8px;
  font-weight: 600;
}

.detail-meta {
  font-size: 12px;
  font-weight: 400;
}

.meeting-card {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: center;
  flex-wrap: wrap;
  padding: 12px 14px;
  border-radius: var(--radius-md);
  border: 1px solid rgba(31, 122, 76, 0.22);
  background: rgba(31, 122, 76, 0.08);
}

.meeting-card__actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.status-pill {
  width: fit-content;
  padding: 6px 10px;
  border-radius: var(--radius-sm);
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
  background: rgba(194, 75, 75, 0.18);
  color: #a03838;
}

.request-list {
  display: grid;
  gap: 12px;
}

.request-card {
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  padding: 14px;
  background: #fff;
  display: grid;
  gap: 12px;
}

.request-main {
  display: grid;
  gap: 6px;
}

.request-title {
  font-weight: 600;
}

.request-actions,
.recurring-actions,
.note-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.suggestions-block,
.note-panel {
  display: grid;
  gap: 10px;
  padding: 12px;
  border-radius: var(--radius-md);
  border: 1px solid rgba(7, 47, 71, 0.12);
  background: rgba(7, 47, 71, 0.03);
}

.suggestions-title {
  font-weight: 600;
}

.suggestions-list {
  display: grid;
  gap: 8px;
}

.suggestion-btn {
  display: grid;
  gap: 2px;
  text-align: left;
}

.suggestion-btn--active {
  border-color: rgba(8, 113, 201, 0.45);
  background: rgba(8, 113, 201, 0.08);
}

.suggestion-meta {
  font-size: 11px;
}

.slot-list {
  display: grid;
  gap: 10px;
}

.slot-card {
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  padding: 10px 12px;
  background: rgba(7, 47, 71, 0.04);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.slot-time {
  font-weight: 600;
}

.recurring-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.recurring-result,
.recurring-list {
  display: grid;
  gap: 8px;
}

.recurring-ul {
  margin: 0;
  padding-left: 18px;
  display: grid;
  gap: 4px;
}

.note-title {
  display: inline-block;
  margin-right: 8px;
}

.note-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  background: rgba(47, 63, 73, 0.08);
  border: 1px solid rgba(47, 63, 73, 0.16);
  color: #3b4a52;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.note-textarea {
  min-height: 140px;
  resize: vertical;
}

.note-helper {
  font-size: 12px;
  line-height: 1.4;
}

.form-error {
  color: #b3261e;
  background: #fdecea;
  border: 1px solid #f5c2c0;
  border-radius: var(--radius-sm);
  padding: 8px 10px;
}

.payment-proof-error {
  margin-top: 8px;
  display: grid;
  gap: 8px;
  border: 1px solid #f5c2c0;
  background: #fdecea;
  border-radius: var(--radius-sm);
  padding: 10px;
}

.payment-proof-error p {
  margin: 0;
  color: #8a1f18;
}

.btn--sm {
  padding: 6px 10px;
  font-size: 13px;
}

@media (max-width: 860px) {
  .detail-hero {
    flex-direction: column;
    align-items: flex-start;
  }

  .panel__header {
    flex-direction: column;
  }

  .summary-actions {
    justify-content: flex-start;
  }

  .slot-card {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>



