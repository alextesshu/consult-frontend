<template>
  <section class="clients">
    <header class="clients__hero">
      <div>
        <h1 class="title clients__title">Робота з клієнтами</h1>
        <p class="muted clients__subtitle">
          Управління статусами клієнтів та доступом до активної роботи.
        </p>
      </div>
      <RouterLink class="btn btn--ghost hero-back-link" to="/cabinet">Назад до кабінету</RouterLink>
    </header>

    <div v-if="error" class="form-error">{{ error }}</div>
    <div v-if="manualClientsWarning" class="form-warning">{{ manualClientsWarning }}</div>

    <section v-if="showRemindersPanel" class="panel panel--reminders">
      <div class="panel__header">
        <div>
          <h2 class="panel__title">Нотатки після сесій</h2>
        </div>
      </div>
      <LoadingSkeleton v-if="notesLoading" variant="list" :count="2" height="88px" />
      <EmptyState
        v-else-if="remindersError"
        :title="remindersErrorTitle"
        :description="remindersError"
      >
        <template #actions>
          <button class="btn btn--ghost" type="button" @click="loadPendingNotes">{{ retryLabel }}</button>
        </template>
      </EmptyState>
      <div v-else class="reminders-summary">
        <div>
          <p class="reminders-summary__text">{{ pendingNotesSummary }}</p>
          <p class="reminders-summary__hint">Для зручності ведення історії можна додати коротку нотатку після сесії.</p>
        </div>
        <button
          class="btn btn--ghost btn--sm"
          type="button"
          @click="toggleRemindersExpanded"
        >
          {{ remindersExpanded ? 'Сховати сесії' : 'Показати сесії' }}
        </button>
      </div>
      <div v-if="remindersExpanded && pendingNotes.length > 0" class="history-list history-list--reminders">
        <div v-for="item in visiblePendingNotes" :key="item.sessionId" class="history-item history-item--compact">
          <div class="history-meta">
            <div class="history-date">{{ formatDateTime(item.slotStart) }}</div>
            <div class="muted">{{ formatDuration(item.slotStart, item.slotEnd) }}</div>
            <div class="history-status">{{ sessionStatusLabel(item.status) }}</div>
          </div>
          <div class="muted">
            {{ item.clientName || clientLabel(item.clientId) }}
          </div>
          <div class="client-actions">
            <RouterLink class="btn btn--ghost btn--sm" :to="noteReminderRoute(item.sessionId)">
              Додати нотатку
            </RouterLink>
            <button
              class="btn btn--ghost btn--sm"
              type="button"
              :disabled="!item.clientId || isHistoryLoading(item.clientId)"
              @click="toggleHistory(item.clientId)"
            >
              Відкрити клієнта
            </button>
            <button
              class="btn btn--ghost btn--sm"
              type="button"
              :disabled="isNoteSkipping(item.sessionId)"
              @click="skipPendingNote(item.sessionId)"
            >
              {{ isNoteSkipping(item.sessionId) ? 'Завершуємо...' : 'Залишити без нотатки' }}
            </button>
          </div>
        </div>
        <button
          v-if="hasMorePendingNotes"
          class="btn btn--ghost btn--sm reminders-more"
          type="button"
          @click="showMorePendingNotes"
        >
          Показати ще
        </button>
      </div>
    </section>

    <section class="panel panel--clients">
      <div class="panel__header">
        <div>
          <h2 class="panel__title">Клієнти</h2>
          <p class="clients-panel-hint">
            Додавайте клієнтів вручну, щоб швидко почати роботу. Коли буде потрібно, запросіть клієнта до кабінету — там він бачитиме розклад своїх сесій, нагадування, інформацію про оплату та матеріали.
          </p>
        </div>
        <button class="btn btn--sm clients-add-btn" type="button" @click="openManualClientModal">
          Додати клієнта
        </button>
      </div>
      <div class="clients-toolbar">
        <div class="filters" aria-label="Фільтр клієнтів">
          <button class="filters__item" :class="{ 'is-active': filter === 'ALL' }" @click="setFilter('ALL')">
            Усі
          </button>
          <button class="filters__item" :class="{ 'is-active': filter === 'ACTIVE' }" @click="setFilter('ACTIVE')">
            Активні
          </button>
          <button class="filters__item" :class="{ 'is-active': filter === 'INACTIVE' }" @click="setFilter('INACTIVE')">
            Неактивні
          </button>
          <button class="filters__item" :class="{ 'is-active': filter === 'ARCHIVED' }" @click="setFilter('ARCHIVED')">
            Архів
          </button>
        </div>

        <div class="clients-search">
          <label class="clients-search__label" for="clients-search-input">Швидкий пошук</label>
          <input
            id="clients-search-input"
            v-model.trim="searchQuery"
            class="input clients-search__input"
            type="search"
            placeholder="Імʼя, email або телефон"
            autocomplete="off"
          />
        </div>
      </div>

      <LoadingSkeleton v-if="clientsLoading" variant="list" :count="4" height="110px" />
      <EmptyState
        v-else-if="clientsError"
        title="Не вдалося завантажити клієнтів"
        :description="clientsError"
      >
        <template #actions>
          <button class="btn btn--ghost" type="button" @click="loadClients">Спробувати ще раз</button>
        </template>
      </EmptyState>
      <EmptyState
        v-else-if="filteredClients.length === 0"
        :title="clientsEmptyTitle"
        :description="clientsEmptyDescription"
      />
      <div v-else class="clients-master-detail" aria-label="Список клієнтів">
        <template v-for="client in filteredClients" :key="clientListKey(client)">
          <button
            :id="clientRowDomId(client)"
            class="client-row"
            :class="{
              'client-row--manual': isManualClientRecord(client),
              'client-row--selected': isClientSelected(client),
              'client-row--targeted': !isManualClientRecord(client) && targetedClientId === relationClientId(client),
            }"
            type="button"
            :aria-current="isClientSelected(client) ? 'true' : undefined"
            @click="selectClient(client)"
          >
            <span class="client-row__main">
              <span class="client-row__name">{{ displayClientName(client) }}</span>
              <span v-if="!isManualClientRecord(client) && client.client_code" class="client-row__code">
                Код клієнта: {{ client.client_code }}
              </span>
            </span>
            <span class="client-row__badges">
              <span class="client-account-badge" :class="{ 'client-account-badge--manual': isManualClientRecord(client) && !hasLinkedAccount(client) }">
                {{ accountBadgeLabel(client) }}
              </span>
              <span class="client-status" :class="clientStatusClass(clientListState(client))">
                {{ clientStatusLabel(clientListState(client)) }}
              </span>
            </span>
            <span class="client-row__meta">
              <span>
                <span class="client-row__label">Контакт</span>
                <span>{{ clientPrimaryContact(client) }}</span>
              </span>
              <span>
                <span class="client-row__label">Найближча</span>
                <span>{{ clientNearestSessionLabel(client) }}</span>
              </span>
              <span>
                <span class="client-row__label">Останнє</span>
                <span>{{ clientLastActivityLabel(client) }}</span>
              </span>
            </span>
          </button>

        <aside v-if="isClientSelected(client)" class="client-detail" aria-live="polite">
        <article
          :id="clientCardDomId(client)"
          class="client-card"
          :class="{
            'client-card--manual': isManualClientRecord(client),
            'client-card--targeted': !isManualClientRecord(client) && targetedClientId === relationClientId(client),
          }"
          tabindex="-1"
        >
          <div class="client-card__main">
            <div class="client-card__identity">
              <div>
                <div class="client-name">{{ displayClientName(client) }}</div>
                <div v-if="!isManualClientRecord(client) && client.client_code" class="client-code">Код клієнта: {{ client.client_code }}</div>
              </div>
              <div class="client-badges">
                <span class="client-account-badge" :class="{ 'client-account-badge--manual': isManualClientRecord(client) && !hasLinkedAccount(client) }">
                  {{ accountBadgeLabel(client) }}
                </span>
                <span class="client-status" :class="clientStatusClass(clientListState(client))">
                  {{ clientStatusLabel(clientListState(client)) }}
                </span>
              </div>
            </div>

            <dl v-if="isManualClientRecord(client)" class="client-meta client-meta--manual">
              <div v-if="shouldShowManualContactEmail(client)" class="client-meta__item">
                <dt>{{ manualContactEmailLabel(client) }}</dt>
                <dd>{{ manualContactEmail(client) }}</dd>
              </div>
              <div v-if="shouldShowManualAccountEmail(client)" class="client-meta__item">
                <dt>Email акаунта</dt>
                <dd>{{ manualAccountEmail(client) }}</dd>
              </div>
              <div v-if="client.phone" class="client-meta__item">
                <dt>Телефон</dt>
                <dd>{{ client.phone }}</dd>
              </div>
              <div v-if="client.telegram" class="client-meta__item">
                <dt>Telegram</dt>
                <dd>{{ client.telegram }}</dd>
              </div>
              <div class="client-meta__item">
                <dt>Джерело</dt>
                <dd>Вручну створена картка</dd>
              </div>

              <div class="client-meta__item">
                <dt>Ціна сесії</dt>
                <dd>{{ manualClientCustomPriceLabel(client) }}</dd>
              </div>

              <div class="client-meta__item">
                <dt>Оновлено</dt>
                <dd>{{ manualClientUpdatedLabel(client) }}</dd>
              </div>
              <div class="client-meta__item">
                <dt>Найближча сесія</dt>
                <dd>{{ optionalDateLabel(manualClientNearestSession(client)?.slot_start_at, 'Немає запланованих') }}</dd>
              </div>

              <div class="client-meta__item">
                <dt>{{ manualClientPaymentTitle(client) }}</dt>
                <dd>
                  <span class="manual-payment-status" :class="manualClientPaymentClass(client)">
                    {{ manualClientPaymentLabel(client) }}
                  </span>
                </dd>
              </div>

              <div class="client-meta__item">
                <dt>Майбутніх сесій</dt>
                <dd>{{ manualClientUpcomingSessions(client).length }}</dd>
              </div>
              
              <div class="client-meta__item">
                <dt>Остання сесія</dt>
                <dd>{{ optionalDateLabel(manualClientLastSession(client)?.slot_start_at, 'Ще не було') }}</dd>
              </div>
            </dl>
            <div v-if="isManualClientRecord(client) && client.internal_note" class="manual-client-note">
              <div class="manual-client-note__label">Короткий опис клієнта</div>
              <div>{{ client.internal_note }}</div>
            </div>
            <dl v-if="!isManualClientRecord(client)" class="client-meta">
              <div v-if="client.client_email" class="client-meta__item">
                <dt>EMAIL</dt>
                <dd>{{ client.client_email }}</dd>
              </div>
              <div class="client-meta__item">
                <dt>Остання сесія</dt>
                <dd>{{ optionalDateLabel(client.last_session_at, 'Ще не було') }}</dd>
              </div>
              <div class="client-meta__item">
                <dt>Майбутніх сесій</dt>
                <dd>{{ client.upcoming_count ?? 0 }}</dd>
              </div>
              <div class="client-meta__item">
                <dt>Остання нотатка</dt>
                <dd>{{ latestNoteSummary(client) }}</dd>
              </div>
              <div class="client-meta__item">
                <dt>Робочий зошит</dt>
                <dd>{{ workbookSummary(client) }}</dd>
              </div>
              <div class="client-meta__item">
                <dt>Оновлено</dt>
                <dd>{{ clientUpdatedLabel(client) }}</dd>
              </div>
            </dl>
          </div>
          <div v-if="isManualClientRecord(client)" class="client-actions">
            <div v-if="client.status !== 'archived'" class="client-actions__primary">
              <button
                class="btn btn--sm"
                type="button"
                :disabled="isManualActionLoading(client.id)"
                @click="openManualClientSessionModal(client)"
              >
                Створити сесію
              </button>

              <button
                class="btn btn--ghost btn--sm"
                type="button"
                :disabled="isManualActionLoading(client.id)"
                @click="openManualClientEditModal(client)"
              >
                Редагувати
              </button>

              <RouterLink
                v-if="manualClientNearestSession(client)"
                class="btn btn--ghost btn--sm"
                :to="manualClientSessionRoute(manualClientNearestSession(client))"
              >
                Відкрити найближчу
              </RouterLink>

              <RouterLink
                v-else-if="manualClientLastSession(client)"
                class="btn btn--ghost btn--sm"
                :to="manualClientSessionRoute(manualClientLastSession(client))"
              >
                Відкрити останню
              </RouterLink>
            </div>

            <div class="client-accordion">
            <section v-if="!hasLinkedAccount(client)" class="client-accordion__section manual-account-invite">
              <button
                class="client-accordion__header"
                type="button"
                :aria-expanded="isAccordionSectionOpen(client, 'invite')"
                @click="toggleClientAccordion(client, 'invite')"
              >
                <span>Запросити до кабінету</span>
                <span class="client-accordion__summary">{{ accordionSummary(client, 'invite') }}</span>
              </button>
              <div v-if="isAccordionSectionOpen(client, 'invite')" class="client-accordion__body">
              <div class="manual-account-invite__header">
                <div>
                  <div class="manual-account-invite__title">Запросити до кабінету</div>
                  <p class="manual-account-invite__copy">
                    Клієнт зможе увійти або зареєструватися і побачити свої сесії в кабінеті.
                  </p>
                </div>
                <span v-if="accountInviteState(client.id).loading" class="manual-account-invite__status">
                  Перевіряємо...
                </span>
              </div>

              <p v-if="accountInviteState(client.id).error" class="manual-account-invite__error">
                {{ accountInviteState(client.id).error }}
              </p>

              <template v-if="activeAccountInvite(client.id)">
                <p class="manual-account-invite__status">
                  {{ accountInviteStatusLabel(activeAccountInvite(client.id)) }}
                </p>

                <div v-if="accountInviteUrl(client.id)" class="manual-account-invite__link">
                  {{ accountInviteUrl(client.id) }}
                </div>
                <p v-else class="manual-account-invite__hint">
                  Запрошення вже було відкрито, але клієнт ще не підключив акаунт.
                </p>

                <div class="manual-account-invite__actions">
                  <button
                    v-if="accountInviteUrl(client.id)"
                    class="btn btn--ghost btn--sm"
                    type="button"
                    :disabled="accountInviteState(client.id).actionLoading"
                    @click="copyAccountInviteLink(client.id)"
                  >
                    {{ accountInviteState(client.id).copied ? 'Посилання скопійовано' : 'Скопіювати посилання' }}
                  </button>
                  <button
                    class="btn btn--ghost btn--sm"
                    type="button"
                    :disabled="accountInviteState(client.id).actionLoading"
                    @click="regenerateAccountInvite(client.id)"
                  >
                    {{ accountInviteUrl(client.id) ? 'Створити нове посилання' : 'Отримати нове посилання' }}
                  </button>
                  <button
                    class="btn btn--ghost btn--sm"
                    type="button"
                    :disabled="accountInviteState(client.id).actionLoading"
                    @click="revokeAccountInvite(client.id)"
                  >
                    Відкликати
                  </button>
                </div>
              </template>

              <button
                v-else
                class="btn btn--ghost btn--sm manual-account-invite__cta"
                type="button"
                :disabled="accountInviteState(client.id).actionLoading || accountInviteState(client.id).loading"
                @click="createAccountInvite(client.id)"
              >
                {{ accountInviteState(client.id).actionLoading ? 'Створюємо...' : 'Запросити до кабінету' }}
              </button>
              </div>
            </section>

            <section class="client-accordion__section client-materials">
              <button
                class="client-accordion__header"
                type="button"
                :aria-expanded="isAccordionSectionOpen(client, 'materials')"
                @click="toggleClientAccordion(client, 'materials')"
              >
                <span>Матеріали для клієнта</span>
                <span class="client-accordion__summary">{{ accordionSummary(client, 'materials') }}</span>
              </button>
              <p v-if="isAccordionSectionOpen(client, 'materials') && isManualClientRecord(client) && !hasLinkedAccount(client)" class="client-materials__note">
                Матеріал можна підготувати зараз. Клієнт побачить його після підключення акаунта.
              </p>
              <div v-if="isAccordionSectionOpen(client, 'materials')" class="client-materials__body">
                <p v-if="clientMaterialsState(clientMaterialsScopeKey(client) || '').listError" class="form-error">{{ clientMaterialsState(clientMaterialsScopeKey(client) || '').listError }}</p>
                <div v-if="clientMaterialsState(clientMaterialsScopeKey(client) || '').loading" class="muted">Завантаження матеріалів...</div>
                <div v-else class="client-materials__list">
                  <article v-for="material in clientMaterialsState(clientMaterialsScopeKey(client) || '').items" :key="material.id" class="client-material">
                    <div class="client-material__top">
                      <span class="client-material__type">{{ materialTypeLabel(material.material_type) }}</span>
                      <span class="material-status" :class="materialStatusClass(material.status)">{{ materialStatusLabel(material.status) }}</span>
                    </div>
                    <label class="field">
                      Назва
                      <input
                        class="input"
                        :value="materialFormById(clientMaterialsScopeKey(client) || '', material.id).title"
                        @input="onMaterialTitleInput(clientMaterialsScopeKey(client) || '', material.id, $event)"
                      />
                    </label>
                    <label class="field">
                      Тип
                      <select
                        class="input input--select"
                        :value="materialFormById(clientMaterialsScopeKey(client) || '', material.id).material_type"
                        @change="onMaterialTypeInput(clientMaterialsScopeKey(client) || '', material.id, $event)"
                      >
                        <option value="recommendation">Рекомендація</option>
                        <option value="homework">Домашнє завдання</option>
                        <option value="exercise">Вправа</option>
                        <option value="instruction">Інструкція</option>
                        <option value="link">Посилання</option>
                        <option value="document">Документ</option>
                        <option value="other">Інше</option>
                      </select>
                    </label>
                    <label class="field">
                      Текст
                      <textarea
                        class="input manual-client-form__textarea"
                        rows="4"
                        :value="materialFormById(clientMaterialsScopeKey(client) || '', material.id).content"
                        @input="onMaterialContentInput(clientMaterialsScopeKey(client) || '', material.id, $event)"
                      ></textarea>
                    </label>
                    <label class="field">
                      URL
                      <input
                        class="input"
                        type="url"
                        :value="materialFormById(clientMaterialsScopeKey(client) || '', material.id).url"
                        @input="onMaterialUrlInput(clientMaterialsScopeKey(client) || '', material.id, $event)"
                      />
                    </label>
                    <p v-if="clientMaterialsState(clientMaterialsScopeKey(client) || '').editErrorsById[material.id]" class="form-error">
                      {{ clientMaterialsState(clientMaterialsScopeKey(client) || '').editErrorsById[material.id] }}
                    </p>
                    <p v-if="clientMaterialsState(clientMaterialsScopeKey(client) || '').actionErrorsById[material.id]" class="form-error">
                      {{ clientMaterialsState(clientMaterialsScopeKey(client) || '').actionErrorsById[material.id] }}
                    </p>
                    <div class="client-material__actions">
                      <button class="btn btn--ghost btn--sm" type="button" :disabled="clientMaterialsState(clientMaterialsScopeKey(client) || '').actionLoadingId === material.id" @click="saveMaterial(client, material.id)">
                        Зберегти
                      </button>
                      <button
                        v-if="material.status === 'draft'"
                        class="btn btn--sm"
                        type="button"
                        :disabled="clientMaterialsState(clientMaterialsScopeKey(client) || '').actionLoadingId === material.id"
                        @click="publishMaterial(client, material.id)"
                      >
                        Опублікувати для клієнта
                      </button>
                      <button
                        v-if="material.status === 'published'"
                        class="btn btn--ghost btn--sm"
                        type="button"
                        :disabled="clientMaterialsState(clientMaterialsScopeKey(client) || '').actionLoadingId === material.id"
                        @click="revokeMaterial(client, material.id)"
                      >
                        Відкликати доступ
                      </button>
                      <a
                        v-if="hasMaterialUrl(material)"
                        class="btn btn--ghost btn--sm"
                        :href="material.url || '#'"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Відкрити посилання
                      </a>
                    </div>
                    <div class="client-material__attachments">
                      <div class="client-material__attachments-title">Файли</div>
                      <p v-if="clientMaterialsState(clientMaterialsScopeKey(client) || '').attachmentErrorByMaterialId[material.id]" class="form-error">
                        {{ clientMaterialsState(clientMaterialsScopeKey(client) || '').attachmentErrorByMaterialId[material.id] }}
                      </p>
                      <p v-if="clientMaterialsState(clientMaterialsScopeKey(client) || '').attachmentSuccessByMaterialId[material.id]" class="muted">
                        {{ clientMaterialsState(clientMaterialsScopeKey(client) || '').attachmentSuccessByMaterialId[material.id] }}
                      </p>
                      <div class="client-material__attachments-upload">
                        <label class="btn btn--ghost btn--sm">
                          Додати файл
                          <input
                            class="sr-only"
                            type="file"
                            :disabled="clientMaterialsState(clientMaterialsScopeKey(client) || '').attachmentUploadingByMaterialId[material.id]"
                            @change="attachmentFileChange(clientMaterialsScopeKey(client) || '', material.id, $event)"
                          />
                        </label>
                        <span v-if="clientMaterialsState(clientMaterialsScopeKey(client) || '').attachmentUploadingByMaterialId[material.id]" class="muted">Файл завантажується…</span>
                      </div>
                      <div v-if="clientMaterialsState(clientMaterialsScopeKey(client) || '').attachmentLoadingByMaterialId[material.id]" class="muted">
                        Завантаження файлів...
                      </div>
                      <ul
                        v-else-if="(clientMaterialsState(clientMaterialsScopeKey(client) || '').attachmentsByMaterialId[material.id] || []).length"
                        class="client-material__attachments-list"
                      >
                        <li
                          v-for="attachment in clientMaterialsState(clientMaterialsScopeKey(client) || '').attachmentsByMaterialId[material.id]"
                          :key="attachment.id"
                          class="client-material__attachments-item"
                        >
                          <span>{{ attachment.original_filename }} · {{ humanFileSize(attachment.size_bytes) }}</span>
                          <button
                            class="btn btn--ghost btn--sm"
                            type="button"
                            :disabled="Boolean(clientMaterialsState(clientMaterialsScopeKey(client) || '').attachmentDeletingByAttachmentId[attachment.id])"
                            @click="deleteAttachment(clientMaterialsScopeKey(client) || '', material.id, attachment.id)"
                          >
                            Видалити файл
                          </button>
                        </li>
                      </ul>
                      <p v-else class="muted">До цього матеріалу ще не додано файлів.</p>
                    </div>
                  </article>
                </div>
                <div class="client-materials__create">
                  <h4>Додати матеріал</h4>
                  <p v-if="clientMaterialsState(clientMaterialsScopeKey(client) || '').createError" class="form-error">
                    {{ clientMaterialsState(clientMaterialsScopeKey(client) || '').createError }}
                  </p>
                  <label class="field">
                    Назва
                    <input
                      class="input"
                      :value="clientMaterialsState(clientMaterialsScopeKey(client) || '').create.title"
                      @input="setCreateMaterialField(clientMaterialsScopeKey(client) || '', { title: String(($event.target as HTMLInputElement | null)?.value || '') })"
                    />
                  </label>
                  <label class="field">
                    Тип
                    <select
                      class="input input--select"
                      :value="clientMaterialsState(clientMaterialsScopeKey(client) || '').create.material_type"
                      @change="setCreateMaterialField(clientMaterialsScopeKey(client) || '', { material_type: String(($event.target as HTMLSelectElement | null)?.value || 'recommendation') as ClientMaterialType })"
                    >
                      <option value="recommendation">Рекомендація</option>
                      <option value="homework">Домашнє завдання</option>
                      <option value="exercise">Вправа</option>
                      <option value="instruction">Інструкція</option>
                      <option value="link">Посилання</option>
                      <option value="document">Документ</option>
                      <option value="other">Інше</option>
                    </select>
                  </label>
                  <label class="field">
                    Текст
                    <textarea
                      class="input manual-client-form__textarea"
                      rows="4"
                      :value="clientMaterialsState(clientMaterialsScopeKey(client) || '').create.content"
                      @input="setCreateMaterialField(clientMaterialsScopeKey(client) || '', { content: String(($event.target as HTMLTextAreaElement | null)?.value || '') })"
                    ></textarea>
                  </label>
                  <label class="field">
                    URL
                    <input
                      class="input"
                      type="url"
                      :value="clientMaterialsState(clientMaterialsScopeKey(client) || '').create.url"
                      @input="setCreateMaterialField(clientMaterialsScopeKey(client) || '', { url: String(($event.target as HTMLInputElement | null)?.value || '') })"
                    />
                  </label>
                  <button class="btn btn--sm" type="button" :disabled="clientMaterialsState(clientMaterialsScopeKey(client) || '').saving" @click="createMaterial(client)">
                    {{ clientMaterialsState(clientMaterialsScopeKey(client) || '').saving ? 'Зберігаємо...' : 'Додати матеріал' }}
                  </button>
                </div>
              </div>
            </section>

            <section class="client-accordion__section client-regular-times">
              <button
                class="client-accordion__header"
                type="button"
                :aria-expanded="isAccordionSectionOpen(client, 'regularTime')"
                @click="toggleClientAccordion(client, 'regularTime')"
              >
                <span>Регулярний час</span>
                <span class="client-accordion__summary">{{ accordionSummary(client, 'regularTime') }}</span>
              </button>
              <div v-if="isAccordionSectionOpen(client, 'regularTime')" class="client-accordion__body client-regular-times__body">
                <p class="client-regular-times__copy">
                  Зафіксуйте постійну домовленість із клієнтом: день, час, тривалість і формат зустрічі.
                </p>
                <p v-if="!clientRegularTimesScopeKey(client)" class="muted">
                  Для цього клієнта ще немає картки клієнта, тому регулярний час поки недоступний.
                </p>
                <template v-else>
                  <p v-if="clientRegularTimesState(clientRegularTimesScopeKey(client) || '').listError" class="form-error">
                    {{ clientRegularTimesState(clientRegularTimesScopeKey(client) || '').listError }}
                  </p>
                  <div v-if="clientRegularTimesState(clientRegularTimesScopeKey(client) || '').loading" class="muted">
                    Завантаження регулярного часу...
                  </div>
                  <template v-else>
                    <div v-if="clientRegularTimesState(clientRegularTimesScopeKey(client) || '').items.length" class="client-regular-times__list">
                      <article
                        v-for="regularTime in clientRegularTimesState(clientRegularTimesScopeKey(client) || '').items"
                        :key="regularTime.id"
                        class="client-regular-time"
                      >
                        <div class="client-regular-time__top">
                          <div>
                            <div class="client-regular-time__title">
                              {{ regularTimeWeekdayLabel(regularTime.weekday) }}, {{ normalizeRegularTimeValue(regularTime.start_time) }}
                            </div>
                            <div class="muted">
                              {{ regularTime.duration_minutes }} хв · {{ regularTimeFrequencyLabel(regularTime.frequency) }} · {{ regularTimeFormatLabel(regularTime.session_format) }}
                            </div>
                            <div class="muted">Починаючи з {{ formatRegularTimeDate(regularTime.starts_on) }}</div>
                          </div>
                          <span class="regular-time-status" :class="regularTimeStatusClass(regularTime.status)">
                            {{ regularTimeStatusLabel(regularTime.status) }}
                          </span>
                        </div>
                        <div class="client-regular-time__actions">
                          <button class="btn btn--ghost btn--sm" type="button" @click="openRegularTimeEditForm(client, regularTime)">
                            Редагувати
                          </button>
                          <button
                            v-if="regularTime.status === 'paused'"
                            class="btn btn--ghost btn--sm"
                            type="button"
                            :disabled="clientRegularTimesState(clientRegularTimesScopeKey(client) || '').actionLoadingId === regularTime.id"
                            @click="resumeRegularTime(client, regularTime.id)"
                          >
                            Відновити
                          </button>
                          <button
                            v-else
                            class="btn btn--ghost btn--sm"
                            type="button"
                            :disabled="clientRegularTimesState(clientRegularTimesScopeKey(client) || '').actionLoadingId === regularTime.id"
                            @click="pauseRegularTime(client, regularTime.id)"
                          >
                            Поставити на паузу
                          </button>
                        </div>
                      </article>
                    </div>
                    <div v-else class="client-regular-times__empty">
                      <p class="muted">Регулярний час ще не додано.</p>
                      <button class="btn btn--ghost btn--sm" type="button" @click="openRegularTimeCreateForm(client)">
                        Додати регулярний час
                      </button>
                    </div>
                    <button
                      v-if="clientRegularTimesState(clientRegularTimesScopeKey(client) || '').items.length && !clientRegularTimesState(clientRegularTimesScopeKey(client) || '').formOpen"
                      class="btn btn--ghost btn--sm client-regular-times__add"
                      type="button"
                      @click="openRegularTimeCreateForm(client)"
                    >
                      Додати регулярний час
                    </button>
                    <div v-if="clientRegularTimesState(clientRegularTimesScopeKey(client) || '').formOpen" class="client-regular-times__form">
                      <p v-if="clientRegularTimesState(clientRegularTimesScopeKey(client) || '').formError" class="form-error">
                        {{ clientRegularTimesState(clientRegularTimesScopeKey(client) || '').formError }}
                      </p>
                      <label class="field">
                        День тижня
                        <select
                          class="input input--select"
                          :value="clientRegularTimesState(clientRegularTimesScopeKey(client) || '').form.weekday ?? ''"
                          @change="setRegularTimeFormField(client, { weekday: Number(($event.target as HTMLSelectElement | null)?.value) })"
                        >
                          <option v-for="option in regularTimeWeekdayOptions" :key="option.value" :value="option.value">
                            {{ option.label }}
                          </option>
                        </select>
                      </label>
                      <label class="field">
                        Час початку
                        <input
                          class="input"
                          type="time"
                          :value="clientRegularTimesState(clientRegularTimesScopeKey(client) || '').form.start_time"
                          @input="setRegularTimeFormField(client, { start_time: String(($event.target as HTMLInputElement | null)?.value || '') })"
                        />
                      </label>
                      <label class="field">
                        Тривалість
                        <input
                          class="input"
                          type="number"
                          min="15"
                          max="240"
                          step="5"
                          :value="clientRegularTimesState(clientRegularTimesScopeKey(client) || '').form.duration_minutes"
                          @input="setRegularTimeFormField(client, { duration_minutes: Number(($event.target as HTMLInputElement | null)?.value || 0) })"
                        />
                      </label>
                      <label class="field">
                        Частота
                        <select
                          class="input input--select"
                          :value="clientRegularTimesState(clientRegularTimesScopeKey(client) || '').form.frequency"
                          @change="setRegularTimeFormField(client, { frequency: String(($event.target as HTMLSelectElement | null)?.value || 'weekly') as ClientRegularTimeFrequency })"
                        >
                          <option v-for="option in regularTimeFrequencyOptions" :key="option.value" :value="option.value">
                            {{ option.label }}
                          </option>
                        </select>
                      </label>
                      <label class="field">
                        Починаючи з
                        <input
                          class="input"
                          type="text"
                          inputmode="numeric"
                          placeholder="20.05.2026"
                          :value="clientRegularTimesState(clientRegularTimesScopeKey(client) || '').form.starts_on"
                          @input="setRegularTimeFormField(client, { starts_on: String(($event.target as HTMLInputElement | null)?.value || '') })"
                        />
                      </label>
                      <label class="field">
                        Формат
                        <select
                          class="input input--select"
                          :value="clientRegularTimesState(clientRegularTimesScopeKey(client) || '').form.session_format"
                          @change="setRegularTimeFormField(client, { session_format: String(($event.target as HTMLSelectElement | null)?.value || '') as SessionFormat })"
                        >
                          <option v-for="option in regularTimeFormatOptions" :key="option.value" :value="option.value">
                            {{ option.label }}
                          </option>
                        </select>
                      </label>
                      <label class="field">
                        Посилання на зустріч
                        <input
                          class="input"
                          type="url"
                          :value="clientRegularTimesState(clientRegularTimesScopeKey(client) || '').form.meeting_url"
                          @input="setRegularTimeFormField(client, { meeting_url: String(($event.target as HTMLInputElement | null)?.value || '') })"
                        />
                      </label>
                      <label class="field">
                        Адреса / місце зустрічі
                        <input
                          class="input"
                          type="text"
                          :value="clientRegularTimesState(clientRegularTimesScopeKey(client) || '').form.offline_location"
                          @input="setRegularTimeFormField(client, { offline_location: String(($event.target as HTMLInputElement | null)?.value || '') })"
                        />
                      </label>
                      <div class="client-regular-times__form-actions">
                        <button
                          class="btn btn--sm"
                          type="button"
                          :disabled="clientRegularTimesState(clientRegularTimesScopeKey(client) || '').saving"
                          @click="saveRegularTime(client)"
                        >
                          Зберегти
                        </button>
                        <button class="btn btn--ghost btn--sm" type="button" @click="cancelRegularTimeForm(client)">
                          Скасувати
                        </button>
                      </div>
                    </div>
                  </template>
                </template>
              </div>
            </section>

            <section class="client-accordion__section">
              <button
                class="client-accordion__header"
                type="button"
                :aria-expanded="isAccordionSectionOpen(client, 'settings')"
                @click="toggleClientAccordion(client, 'settings')"
              >
                <span>Керування клієнтом</span>
                <span class="client-accordion__summary">{{ accordionSummary(client, 'settings') }}</span>
              </button>
            <div v-if="isAccordionSectionOpen(client, 'settings')" class="client-accordion__body client-actions__secondary">
              <button
                v-if="client.status !== 'archived'"
                class="btn btn--ghost btn--sm"
                type="button"
                :disabled="isManualActionLoading(client.id)"
                @click="archiveManualClient(client.id)"
              >
                Архівувати
              </button>
              <button
                v-else
                class="btn btn--ghost btn--sm"
                type="button"
                :disabled="isManualActionLoading(client.id)"
                @click="restoreManualClient(client.id)"
              >
                Відновити
              </button>
            </div>
            </section>
            </div>
          </div>
          <div v-else class="client-actions">
            <div class="client-actions__primary">
              <RouterLink
                v-if="client.latest_session_note_session_id"
                class="btn btn--sm"
                :to="`/cabinet/sessions#note-${client.latest_session_note_session_id}`"
              >
                Відкрити нотатку
              </RouterLink>
              <button
                v-else
                class="btn btn--sm"
                type="button"
                :disabled="!relationClientId(client) || isHistoryLoading(relationClientId(client))"
                @click="toggleHistory(relationClientId(client))"
              >
                Приватна історія клієнта
              </button>
            </div>
            <div class="client-accordion">
            <section class="client-accordion__section client-materials">
              <button
                class="client-accordion__header"
                type="button"
                :aria-expanded="isAccordionSectionOpen(client, 'materials')"
                @click="toggleClientAccordion(client, 'materials')"
              >
                <span>Матеріали для клієнта</span>
                <span class="client-accordion__summary">{{ accordionSummary(client, 'materials') }}</span>
              </button>
              <div v-if="isAccordionSectionOpen(client, 'materials')" class="client-materials__body">
                <p v-if="clientMaterialsState(clientMaterialsScopeKey(client) || '').listError" class="form-error">{{ clientMaterialsState(clientMaterialsScopeKey(client) || '').listError }}</p>
                <div v-if="clientMaterialsState(clientMaterialsScopeKey(client) || '').loading" class="muted">Завантаження матеріалів...</div>
                <div v-else class="client-materials__list">
                  <article v-for="material in clientMaterialsState(clientMaterialsScopeKey(client) || '').items" :key="material.id" class="client-material">
                    <div class="client-material__top">
                      <span class="client-material__type">{{ materialTypeLabel(material.material_type) }}</span>
                      <span class="material-status" :class="materialStatusClass(material.status)">{{ materialStatusLabel(material.status) }}</span>
                    </div>
                    <label class="field">
                      Назва
                      <input
                        class="input"
                        :value="materialFormById(clientMaterialsScopeKey(client) || '', material.id).title"
                        @input="onMaterialTitleInput(clientMaterialsScopeKey(client) || '', material.id, $event)"
                      />
                    </label>
                    <label class="field">
                      Тип
                      <select
                        class="input input--select"
                        :value="materialFormById(clientMaterialsScopeKey(client) || '', material.id).material_type"
                        @change="onMaterialTypeInput(clientMaterialsScopeKey(client) || '', material.id, $event)"
                      >
                        <option value="recommendation">Рекомендація</option>
                        <option value="homework">Домашнє завдання</option>
                        <option value="exercise">Вправа</option>
                        <option value="instruction">Інструкція</option>
                        <option value="link">Посилання</option>
                        <option value="document">Документ</option>
                        <option value="other">Інше</option>
                      </select>
                    </label>
                    <label class="field">
                      Текст
                      <textarea
                        class="input manual-client-form__textarea"
                        rows="4"
                        :value="materialFormById(clientMaterialsScopeKey(client) || '', material.id).content"
                        @input="onMaterialContentInput(clientMaterialsScopeKey(client) || '', material.id, $event)"
                      ></textarea>
                    </label>
                    <label class="field">
                      URL
                      <input
                        class="input"
                        type="url"
                        :value="materialFormById(clientMaterialsScopeKey(client) || '', material.id).url"
                        @input="onMaterialUrlInput(clientMaterialsScopeKey(client) || '', material.id, $event)"
                      />
                    </label>
                    <p v-if="clientMaterialsState(clientMaterialsScopeKey(client) || '').editErrorsById[material.id]" class="form-error">
                      {{ clientMaterialsState(clientMaterialsScopeKey(client) || '').editErrorsById[material.id] }}
                    </p>
                    <p v-if="clientMaterialsState(clientMaterialsScopeKey(client) || '').actionErrorsById[material.id]" class="form-error">
                      {{ clientMaterialsState(clientMaterialsScopeKey(client) || '').actionErrorsById[material.id] }}
                    </p>
                    <div class="client-material__actions">
                      <button class="btn btn--ghost btn--sm" type="button" :disabled="clientMaterialsState(clientMaterialsScopeKey(client) || '').actionLoadingId === material.id" @click="saveMaterial(client, material.id)">
                        Зберегти
                      </button>
                      <button
                        v-if="material.status === 'draft'"
                        class="btn btn--sm"
                        type="button"
                        :disabled="clientMaterialsState(clientMaterialsScopeKey(client) || '').actionLoadingId === material.id"
                        @click="publishMaterial(client, material.id)"
                      >
                        Опублікувати для клієнта
                      </button>
                      <button
                        v-if="material.status === 'published'"
                        class="btn btn--ghost btn--sm"
                        type="button"
                        :disabled="clientMaterialsState(clientMaterialsScopeKey(client) || '').actionLoadingId === material.id"
                        @click="revokeMaterial(client, material.id)"
                      >
                        Відкликати доступ
                      </button>
                      <a
                        v-if="hasMaterialUrl(material)"
                        class="btn btn--ghost btn--sm"
                        :href="material.url || '#'"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Відкрити посилання
                      </a>
                    </div>
                    <div class="client-material__attachments">
                      <div class="client-material__attachments-title">Файли</div>
                      <p v-if="clientMaterialsState(clientMaterialsScopeKey(client) || '').attachmentErrorByMaterialId[material.id]" class="form-error">
                        {{ clientMaterialsState(clientMaterialsScopeKey(client) || '').attachmentErrorByMaterialId[material.id] }}
                      </p>
                      <p v-if="clientMaterialsState(clientMaterialsScopeKey(client) || '').attachmentSuccessByMaterialId[material.id]" class="muted">
                        {{ clientMaterialsState(clientMaterialsScopeKey(client) || '').attachmentSuccessByMaterialId[material.id] }}
                      </p>
                      <div class="client-material__attachments-upload">
                        <label class="btn btn--ghost btn--sm">
                          Додати файл
                          <input
                            class="sr-only"
                            type="file"
                            :disabled="clientMaterialsState(clientMaterialsScopeKey(client) || '').attachmentUploadingByMaterialId[material.id]"
                            @change="attachmentFileChange(clientMaterialsScopeKey(client) || '', material.id, $event)"
                          />
                        </label>
                        <span v-if="clientMaterialsState(clientMaterialsScopeKey(client) || '').attachmentUploadingByMaterialId[material.id]" class="muted">Файл завантажується…</span>
                      </div>
                      <div v-if="clientMaterialsState(clientMaterialsScopeKey(client) || '').attachmentLoadingByMaterialId[material.id]" class="muted">
                        Завантаження файлів...
                      </div>
                      <ul
                        v-else-if="(clientMaterialsState(clientMaterialsScopeKey(client) || '').attachmentsByMaterialId[material.id] || []).length"
                        class="client-material__attachments-list"
                      >
                        <li
                          v-for="attachment in clientMaterialsState(clientMaterialsScopeKey(client) || '').attachmentsByMaterialId[material.id]"
                          :key="attachment.id"
                          class="client-material__attachments-item"
                        >
                          <span>{{ attachment.original_filename }} · {{ humanFileSize(attachment.size_bytes) }}</span>
                          <button
                            class="btn btn--ghost btn--sm"
                            type="button"
                            :disabled="Boolean(clientMaterialsState(clientMaterialsScopeKey(client) || '').attachmentDeletingByAttachmentId[attachment.id])"
                            @click="deleteAttachment(clientMaterialsScopeKey(client) || '', material.id, attachment.id)"
                          >
                            Видалити файл
                          </button>
                        </li>
                      </ul>
                      <p v-else class="muted">До цього матеріалу ще не додано файлів.</p>
                    </div>
                  </article>
                </div>
                <div class="client-materials__create">
                  <h4>Додати матеріал</h4>
                  <p v-if="clientMaterialsState(clientMaterialsScopeKey(client) || '').createError" class="form-error">
                    {{ clientMaterialsState(clientMaterialsScopeKey(client) || '').createError }}
                  </p>
                  <label class="field">
                    Назва
                    <input
                      class="input"
                      :value="clientMaterialsState(clientMaterialsScopeKey(client) || '').create.title"
                      @input="setCreateMaterialField(clientMaterialsScopeKey(client) || '', { title: String(($event.target as HTMLInputElement | null)?.value || '') })"
                    />
                  </label>
                  <label class="field">
                    Тип
                    <select
                      class="input input--select"
                      :value="clientMaterialsState(clientMaterialsScopeKey(client) || '').create.material_type"
                      @change="setCreateMaterialField(clientMaterialsScopeKey(client) || '', { material_type: String(($event.target as HTMLSelectElement | null)?.value || 'recommendation') as ClientMaterialType })"
                    >
                      <option value="recommendation">Рекомендація</option>
                      <option value="homework">Домашнє завдання</option>
                      <option value="exercise">Вправа</option>
                      <option value="instruction">Інструкція</option>
                      <option value="link">Посилання</option>
                      <option value="document">Документ</option>
                      <option value="other">Інше</option>
                    </select>
                  </label>
                  <label class="field">
                    Текст
                    <textarea
                      class="input manual-client-form__textarea"
                      rows="4"
                      :value="clientMaterialsState(clientMaterialsScopeKey(client) || '').create.content"
                      @input="setCreateMaterialField(clientMaterialsScopeKey(client) || '', { content: String(($event.target as HTMLTextAreaElement | null)?.value || '') })"
                    ></textarea>
                  </label>
                  <label class="field">
                    URL
                    <input
                      class="input"
                      type="url"
                      :value="clientMaterialsState(clientMaterialsScopeKey(client) || '').create.url"
                      @input="setCreateMaterialField(clientMaterialsScopeKey(client) || '', { url: String(($event.target as HTMLInputElement | null)?.value || '') })"
                    />
                  </label>
                  <button class="btn btn--sm" type="button" :disabled="clientMaterialsState(clientMaterialsScopeKey(client) || '').saving" @click="createMaterial(client)">
                    {{ clientMaterialsState(clientMaterialsScopeKey(client) || '').saving ? 'Зберігаємо...' : 'Додати матеріал' }}
                  </button>
                </div>
              </div>
            </section>

            <section class="client-accordion__section client-regular-times">
              <button
                class="client-accordion__header"
                type="button"
                :aria-expanded="isAccordionSectionOpen(client, 'regularTime')"
                @click="toggleClientAccordion(client, 'regularTime')"
              >
                <span>Регулярний час</span>
                <span class="client-accordion__summary">{{ accordionSummary(client, 'regularTime') }}</span>
              </button>
              <div v-if="isAccordionSectionOpen(client, 'regularTime')" class="client-accordion__body client-regular-times__body">
                <p class="client-regular-times__copy">
                  Зафіксуйте постійну домовленість із клієнтом: день, час, тривалість і формат зустрічі.
                </p>
                <p v-if="!clientRegularTimesScopeKey(client)" class="muted">
                  Для цього клієнта ще немає картки клієнта, тому регулярний час поки недоступний.
                </p>
                <template v-else>
                  <p v-if="clientRegularTimesState(clientRegularTimesScopeKey(client) || '').listError" class="form-error">
                    {{ clientRegularTimesState(clientRegularTimesScopeKey(client) || '').listError }}
                  </p>
                  <div v-if="clientRegularTimesState(clientRegularTimesScopeKey(client) || '').loading" class="muted">
                    Завантаження регулярного часу...
                  </div>
                  <template v-else>
                    <div v-if="clientRegularTimesState(clientRegularTimesScopeKey(client) || '').items.length" class="client-regular-times__list">
                      <article
                        v-for="regularTime in clientRegularTimesState(clientRegularTimesScopeKey(client) || '').items"
                        :key="regularTime.id"
                        class="client-regular-time"
                      >
                        <div class="client-regular-time__top">
                          <div>
                            <div class="client-regular-time__title">
                              {{ regularTimeWeekdayLabel(regularTime.weekday) }}, {{ normalizeRegularTimeValue(regularTime.start_time) }}
                            </div>
                            <div class="muted">
                              {{ regularTime.duration_minutes }} хв · {{ regularTimeFrequencyLabel(regularTime.frequency) }} · {{ regularTimeFormatLabel(regularTime.session_format) }}
                            </div>
                            <div class="muted">Починаючи з {{ formatRegularTimeDate(regularTime.starts_on) }}</div>
                          </div>
                          <span class="regular-time-status" :class="regularTimeStatusClass(regularTime.status)">
                            {{ regularTimeStatusLabel(regularTime.status) }}
                          </span>
                        </div>
                        <div class="client-regular-time__actions">
                          <button class="btn btn--ghost btn--sm" type="button" @click="openRegularTimeEditForm(client, regularTime)">
                            Редагувати
                          </button>
                          <button
                            v-if="regularTime.status === 'paused'"
                            class="btn btn--ghost btn--sm"
                            type="button"
                            :disabled="clientRegularTimesState(clientRegularTimesScopeKey(client) || '').actionLoadingId === regularTime.id"
                            @click="resumeRegularTime(client, regularTime.id)"
                          >
                            Відновити
                          </button>
                          <button
                            v-else
                            class="btn btn--ghost btn--sm"
                            type="button"
                            :disabled="clientRegularTimesState(clientRegularTimesScopeKey(client) || '').actionLoadingId === regularTime.id"
                            @click="pauseRegularTime(client, regularTime.id)"
                          >
                            Поставити на паузу
                          </button>
                        </div>
                      </article>
                    </div>
                    <div v-else class="client-regular-times__empty">
                      <p class="muted">Регулярний час ще не додано.</p>
                      <button class="btn btn--ghost btn--sm" type="button" @click="openRegularTimeCreateForm(client)">
                        Додати регулярний час
                      </button>
                    </div>
                    <button
                      v-if="clientRegularTimesState(clientRegularTimesScopeKey(client) || '').items.length && !clientRegularTimesState(clientRegularTimesScopeKey(client) || '').formOpen"
                      class="btn btn--ghost btn--sm client-regular-times__add"
                      type="button"
                      @click="openRegularTimeCreateForm(client)"
                    >
                      Додати регулярний час
                    </button>
                    <div v-if="clientRegularTimesState(clientRegularTimesScopeKey(client) || '').formOpen" class="client-regular-times__form">
                      <p v-if="clientRegularTimesState(clientRegularTimesScopeKey(client) || '').formError" class="form-error">
                        {{ clientRegularTimesState(clientRegularTimesScopeKey(client) || '').formError }}
                      </p>
                      <label class="field">
                        День тижня
                        <select
                          class="input input--select"
                          :value="clientRegularTimesState(clientRegularTimesScopeKey(client) || '').form.weekday ?? ''"
                          @change="setRegularTimeFormField(client, { weekday: Number(($event.target as HTMLSelectElement | null)?.value) })"
                        >
                          <option v-for="option in regularTimeWeekdayOptions" :key="option.value" :value="option.value">
                            {{ option.label }}
                          </option>
                        </select>
                      </label>
                      <label class="field">
                        Час початку
                        <input
                          class="input"
                          type="time"
                          :value="clientRegularTimesState(clientRegularTimesScopeKey(client) || '').form.start_time"
                          @input="setRegularTimeFormField(client, { start_time: String(($event.target as HTMLInputElement | null)?.value || '') })"
                        />
                      </label>
                      <label class="field">
                        Тривалість
                        <input
                          class="input"
                          type="number"
                          min="15"
                          max="240"
                          step="5"
                          :value="clientRegularTimesState(clientRegularTimesScopeKey(client) || '').form.duration_minutes"
                          @input="setRegularTimeFormField(client, { duration_minutes: Number(($event.target as HTMLInputElement | null)?.value || 0) })"
                        />
                      </label>
                      <label class="field">
                        Частота
                        <select
                          class="input input--select"
                          :value="clientRegularTimesState(clientRegularTimesScopeKey(client) || '').form.frequency"
                          @change="setRegularTimeFormField(client, { frequency: String(($event.target as HTMLSelectElement | null)?.value || 'weekly') as ClientRegularTimeFrequency })"
                        >
                          <option v-for="option in regularTimeFrequencyOptions" :key="option.value" :value="option.value">
                            {{ option.label }}
                          </option>
                        </select>
                      </label>
                      <label class="field">
                        Починаючи з
                        <input
                          class="input"
                          type="text"
                          inputmode="numeric"
                          placeholder="20.05.2026"
                          :value="clientRegularTimesState(clientRegularTimesScopeKey(client) || '').form.starts_on"
                          @input="setRegularTimeFormField(client, { starts_on: String(($event.target as HTMLInputElement | null)?.value || '') })"
                        />
                      </label>
                      <label class="field">
                        Формат
                        <select
                          class="input input--select"
                          :value="clientRegularTimesState(clientRegularTimesScopeKey(client) || '').form.session_format"
                          @change="setRegularTimeFormField(client, { session_format: String(($event.target as HTMLSelectElement | null)?.value || '') as SessionFormat })"
                        >
                          <option v-for="option in regularTimeFormatOptions" :key="option.value" :value="option.value">
                            {{ option.label }}
                          </option>
                        </select>
                      </label>
                      <label class="field">
                        Посилання на зустріч
                        <input
                          class="input"
                          type="url"
                          :value="clientRegularTimesState(clientRegularTimesScopeKey(client) || '').form.meeting_url"
                          @input="setRegularTimeFormField(client, { meeting_url: String(($event.target as HTMLInputElement | null)?.value || '') })"
                        />
                      </label>
                      <label class="field">
                        Адреса / місце зустрічі
                        <input
                          class="input"
                          type="text"
                          :value="clientRegularTimesState(clientRegularTimesScopeKey(client) || '').form.offline_location"
                          @input="setRegularTimeFormField(client, { offline_location: String(($event.target as HTMLInputElement | null)?.value || '') })"
                        />
                      </label>
                      <div class="client-regular-times__form-actions">
                        <button
                          class="btn btn--sm"
                          type="button"
                          :disabled="clientRegularTimesState(clientRegularTimesScopeKey(client) || '').saving"
                          @click="saveRegularTime(client)"
                        >
                          Зберегти
                        </button>
                        <button class="btn btn--ghost btn--sm" type="button" @click="cancelRegularTimeForm(client)">
                          Скасувати
                        </button>
                      </div>
                    </div>
                  </template>
                </template>
              </div>
            </section>

            <section class="client-accordion__section">
              <button
                class="client-accordion__header"
                type="button"
                :aria-expanded="isAccordionSectionOpen(client, 'privateHistory')"
                @click="toggleClientAccordion(client, 'privateHistory')"
              >
                <span>Приватна історія</span>
                <span class="client-accordion__summary">{{ accordionSummary(client, 'privateHistory') }}</span>
              </button>
              <div v-if="isAccordionSectionOpen(client, 'privateHistory')" class="client-accordion__body client-history">
                <div class="history-header">
                  <div>
                    <div class="history-title">Приватна історія</div>
                    <div class="muted history-subtitle">Інформація зашифрована. Доступ має лише спеціаліст.</div>
                  </div>
                  <span class="history-badge">Зашифровано</span>
                </div>
              </div>
            </section>

            <section class="client-accordion__section">
              <button
                class="client-accordion__header"
                type="button"
                :aria-expanded="isAccordionSectionOpen(client, 'workbook')"
                @click="toggleClientAccordion(client, 'workbook')"
              >
                <span>Робочий зошит</span>
                <span class="client-accordion__summary">{{ accordionSummary(client, 'workbook') }}</span>
              </button>
              <div v-if="isAccordionSectionOpen(client, 'workbook')" class="client-accordion__body">
                <div class="workbook-block">
                  <div class="workbook-block__header">
                    <div>
                      <div class="workbook-block__title">Робочий зошит по клієнту</div>
                      <div class="muted">{{ workbookSummary(client) }}</div>
                    </div>
                    <div class="workbook-block__controls">
                      <button
                        class="btn btn--ghost btn--sm"
                        type="button"
                        @click="openWorkbookWindow(relationClientId(client))"
                      >
                        Відкрити в окремому вікні
                      </button>
                      <button class="btn btn--ghost btn--sm" type="button" @click="toggleWorkbook(relationClientId(client))">
                        {{
                          isWorkbookExpanded(relationClientId(client))
                            ? 'Згорнути робочий зошит'
                            : 'Розгорнути робочий зошит'
                        }}
                      </button>
                    </div>
                  </div>
                  <div v-if="workbookSavedMessage[relationClientId(client)]" class="workbook-success">
                    {{ workbookSavedMessage[relationClientId(client)] }}
                  </div>
                  <div v-if="isJournalLoading(relationClientId(client))" class="muted">Завантаження робочого зошита...</div>
                  <div v-else-if="!isWorkbookExpanded(relationClientId(client))" class="muted">
                    Зошит згорнуто для конфіденційності.
                  </div>
                  <template v-else>
                    <textarea
                      v-model="clientJournalDrafts[relationClientId(client)]"
                      class="input workbook-textarea"
                      rows="10"
                      placeholder="Основні спостереження, динаміка, плани та робочі гіпотези по клієнту."
                    ></textarea>
                    <div class="workbook-actions">
                      <button
                        class="btn btn--sm"
                        type="button"
                        :disabled="isJournalSaving(relationClientId(client))"
                        @click="saveClientJournal(relationClientId(client))"
                      >
                        Зберегти робочий зошит
                      </button>
                    </div>
                  </template>
                </div>
              </div>
            </section>

            <section class="client-accordion__section">
              <button
                class="client-accordion__header"
                type="button"
                :aria-expanded="isAccordionSectionOpen(client, 'sessionNotes')"
                @click="toggleClientAccordion(client, 'sessionNotes')"
              >
                <span>Нотатки по сесіях</span>
                <span class="client-accordion__summary">{{ accordionSummary(client, 'sessionNotes') }}</span>
              </button>
              <div v-if="isAccordionSectionOpen(client, 'sessionNotes')" class="client-accordion__body">
                <div v-if="isHistoryLoading(relationClientId(client))" class="muted">Завантаження історії...</div>
                <div v-else-if="!clientHistory[relationClientId(client)]?.length" class="muted">
                  Нотаток по цьому клієнту ще немає.
                </div>
                <div v-else class="history-list">
                  <div
                    v-for="item in visibleClientHistory(relationClientId(client))"
                    :key="item.sessionId"
                    class="history-item"
                    :class="{ 'history-item--empty': !item.hasNote }"
                  >
                    <div class="history-meta">
                      <div class="history-date">{{ formatDateTime(item.slotStart) }}</div>
                      <div class="muted">{{ formatDuration(item.slotStart, item.slotEnd) }}</div>
                      <div class="history-status">{{ sessionStatusLabel(item.status) }}</div>
                    </div>
                    <div class="muted history-note-summary">{{ historyNoteSummary(item) }}</div>
                    <div class="history-actions">
                      <RouterLink class="btn btn--ghost btn--sm" :to="`/cabinet/sessions#note-${item.sessionId}`">
                        Відкрити нотатку
                      </RouterLink>
                      <RouterLink class="btn btn--ghost btn--sm" :to="`/cabinet/clients/${relationClientId(client)}/workbook`">
                        Відкрити робочий зошит
                      </RouterLink>
                    </div>
                  </div>
                  <div v-if="hasMoreClientHistory(relationClientId(client))" class="history-more">
                    <button class="btn btn--ghost btn--sm" type="button" @click="showMoreClientHistory(relationClientId(client))">
                      Показати ще
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <section class="client-accordion__section">
              <button
                class="client-accordion__header"
                type="button"
                :aria-expanded="isAccordionSectionOpen(client, 'settings')"
                @click="toggleClientAccordion(client, 'settings')"
              >
                <span>Керування клієнтом</span>
                <span class="client-accordion__summary">{{ accordionSummary(client, 'settings') }}</span>
              </button>
            <div v-if="isAccordionSectionOpen(client, 'settings')" class="client-accordion__body client-actions__secondary">
              <button
                class="btn btn--ghost btn--sm"
                type="button"
                :disabled="!relationClientId(client) || isQuickAddLoading(relationClientId(client))"
                @click="openClientPracticeBoardModal(relationClientId(client))"
              >
                {{ isQuickAddLoading(relationClientId(client)) ? 'Додаємо…' : 'Додати на дошку' }}
              </button>
              <button
                v-if="client.state !== 'ARCHIVED'"
                class="btn btn--ghost btn--sm"
                type="button"
                :disabled="!relationClientId(client) || isActionLoading(relationClientId(client))"
                @click="archiveClient(relationClientId(client))"
              >
                Архівувати
              </button>
              <button
                v-else
                class="btn btn--ghost btn--sm"
                type="button"
                :disabled="!relationClientId(client) || isActionLoading(relationClientId(client))"
                @click="restoreClient(relationClientId(client))"
              >
                Відновити
              </button>
            </div>
            </section>
            </div>
          </div>
        </article>
        </aside>
        </template>
      </div>
    </section>
    <PracticeBoardQuickAddModal
      :open="quickAddModalOpen"
      :pending="isQuickAddLoading(quickAddDraftClientId || 0)"
      :error="quickAddModalError"
      subtitle="Сформулюйте наступний крок по клієнту."
      @cancel="closeClientPracticeBoardModal"
      @submit="submitClientPracticeBoardQuickAdd"
    />

    <div
      v-if="manualSessionModalOpen"
      class="manual-client-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="manual-session-title"
    >
      <button
        class="manual-client-modal__backdrop"
        type="button"
        aria-label="Закрити форму створення сесії"
        @click="closeManualClientSessionModal"
      ></button>

      <form class="manual-client-modal__content" @submit.prevent="submitManualClientSession">
        <div class="manual-client-modal__header">
          <div>
            <div class="badge badge--soft">Без реєстрації</div>
            <h2 id="manual-session-title" class="manual-client-modal__title">{{ manualSessionModalTitle }}</h2>
          </div>
          <button class="btn btn--ghost btn--sm" type="button" @click="closeManualClientSessionModal">
            Закрити
          </button>
        </div>

        <div v-if="manualSessionError" class="form-error">{{ manualSessionError }}</div>

        <p class="muted">
          Сесія буде створена для клієнта без реєстрації на основі одного з ваших вільних слотів.
        </p>

        <div v-if="manualSessionSlotsLoading" class="muted">Завантаження вільних слотів…</div>

        <div v-else-if="manualSessionSlots.length === 0" class="form-warning">
          Немає майбутніх вільних слотів. Спочатку створіть слот у розкладі.
          <RouterLink to="/cabinet/slots">Перейти до розкладу</RouterLink>
        </div>

        <div v-else class="manual-client-form">
          <label class="field manual-client-form__note">
            Вільний слот
            <select v-model.number="manualSessionDraft.slot_id" class="input input--select" required>
              <option :value="0" disabled>Оберіть слот</option>
              <option v-for="slot in manualSessionSlots" :key="slot.id" :value="slot.id">
                {{ formatManualSessionSlot(slot) }}
              </option>
            </select>
          </label>

          <label class="field">
            Формат
            <select v-model="manualSessionDraft.session_format" class="input input--select">
              <option value="online">Онлайн</option>
              <option value="offline">Офлайн</option>
            </select>
          </label>
        </div>

        <div class="manual-client-modal__actions">
          <button class="btn btn--sm" type="submit" :disabled="manualSessionSubmitDisabled">
            {{ manualSessionSaving ? 'Створюємо…' : 'Створити сесію' }}
          </button>
          <button class="btn btn--ghost btn--sm" type="button" @click="closeManualClientSessionModal">
            Скасувати
          </button>
        </div>
      </form>
    </div>

    <div v-if="manualClientModalOpen" class="manual-client-modal" role="dialog" aria-modal="true" aria-labelledby="manual-client-title">
      <button
        class="manual-client-modal__backdrop"
        type="button"
        aria-label="Закрити форму додавання клієнта"
        @click="closeManualClientModal"
      ></button>
      <form class="manual-client-modal__content" @submit.prevent="submitManualClient">
        <div class="manual-client-modal__header">
          <div>
            <div class="badge badge--soft">Без реєстрації</div>
            <h2 id="manual-client-title" class="manual-client-modal__title">{{ manualClientModalTitle }}</h2>
          </div>
          <button class="btn btn--ghost btn--sm" type="button" @click="closeManualClientModal">
            Закрити
          </button>
        </div>
        <div v-if="manualClientFormError" class="form-error">{{ manualClientFormError }}</div>
        <div class="manual-client-form">
          <label class="field">
            Імʼя клієнта
            <input
              v-model.trim="manualClientForm.display_name"
              class="input"
              type="text"
              autocomplete="name"
              required
            />
          </label>
          <label class="field">
            Email
            <input v-model.trim="manualClientForm.email" class="input" type="email" autocomplete="email" />
          </label>
          <label class="field">
            Телефон
            <input v-model.trim="manualClientForm.phone" class="input" type="tel" autocomplete="tel" />
          </label>
          <label class="field">
            Telegram
            <input v-model.trim="manualClientForm.telegram" class="input" type="text" autocomplete="off" />
          </label>
          <label class="field">
            Індивідуальна ціна сесії, грн
            <input
              v-model.trim="manualClientForm.custom_price_amount"
              class="input"
              type="text"
              inputmode="decimal"
              placeholder="Наприклад, 1600"
              autocomplete="off"
            />
            <span class="field-hint">Залиште порожнім, щоб використовувати стандартну ціну спеціаліста.</span>
          </label>
          <label class="field manual-client-form__note">
            Короткий опис клієнта
            <textarea
              v-model.trim="manualClientForm.internal_note"
              class="input manual-client-form__textarea"
              rows="4"
            ></textarea>
          </label>
        </div>
        <div class="manual-client-modal__actions">
          <button class="btn btn--sm" type="submit" :disabled="manualClientSaving">
            {{ manualClientSubmitLabel }}
          </button>
          <button class="btn btn--ghost btn--sm" type="button" @click="closeManualClientModal">
            Скасувати
          </button>
        </div>
      </form>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  apiGet,
  apiPatch,
  apiPost,
  createClientRegularTime,
  createSpecialistClientMaterial,
  deleteClientMaterialAttachment,
  createClientRecordAccountInvite,
  fetchClientRegularTimes,
  fetchSpecialistClientMaterials,
  fetchChatThreads,
  fetchClientRecordAccountInvite,
  hasMaterialUrl,
  listClientMaterialAttachments,
  publishSpecialistClientMaterial,
  regenerateClientRecordAccountInvite,
  pauseClientRegularTime,
  resumeClientRegularTime,
  revokeSpecialistClientMaterial,
  revokeClientRecordAccountInvite,
  uploadClientMaterialAttachment,
  updateClientRegularTime,
  updateSpecialistClientMaterial,
  type ChatThread,
  type ClientRegularTime,
  type ClientRegularTimeFrequency,
  type ClientRegularTimePayload,
  type ClientRegularTimeStatus,
  type ClientMaterialAttachment,
  type ClientMaterialSpecialistRecord,
  type ClientMaterialStatus,
  type ClientMaterialType,
  type ClientRecordAccountInvite,
  type ClientRecordAccountInviteResponse,
  type SessionFormat,
} from '../lib/api'
import EmptyState from '../components/EmptyState.vue'
import LoadingSkeleton from '../components/LoadingSkeleton.vue'
import PracticeBoardQuickAddModal from '../components/PracticeBoardQuickAddModal.vue'
import { formatUkDateCompact, formatUkDateTimeCompact } from '../lib/dateTime'
import { getApiErrorMessage } from '../lib/errors'
import { openClientWorkbookWindow } from '../lib/workbookWindow'
import { useToast } from '../composables/useToast'
import {
  createPracticeBoardItem,
  fetchPracticeBoards,
  resolveDefaultPracticeBoardId,
} from '../lib/specialistPracticeBoard'
import {
  fetchSpecialistAvailableSlots,
  fetchSpecialistClientWorkbookSnapshot as fetchSpecialistClientWorkbookSnapshotData,
  saveSpecialistClientJournal as saveSpecialistClientJournalAction,
  skipSpecialistSessionNote as skipSpecialistSessionNoteAction,
  type SpecialistSlot,
} from '../lib/specialistSessions'

type ClientState = {
  id: number
  client?: number
  client_id?: number
  client_record_id?: number | null
  client_email?: string | null
  state: 'CREATED' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED'
  last_session_at: string | null
  upcoming_count: number
  client_name?: string
  client_username?: string
  client_display_name?: string
  display_name?: string
  client_first_name?: string
  client_last_name?: string
  first_name?: string
  last_name?: string
  client_code?: string
  client_journal_content?: string
  client_journal_updated_at?: string | null
  has_client_journal_content?: boolean
  has_workbook_content?: boolean | null
  workbook_updated_at?: string | null
  latest_session_note_at?: string | null
  latest_session_note_session_id?: number | null
}

type ManualClientRecord = {
  id: number
  user_id: number | null
  display_name: string
  email: string | null
  account_email?: string | null
  phone: string | null
  telegram: string | null
  internal_note: string | null
  custom_price_amount: string | null
  custom_price_currency: string | null
  status: 'active' | 'archived'
  source: 'manual'
  has_account: boolean
  archived_at: string | null
  created_at: string | null
  updated_at: string | null
}

type ManualClientFormState = {
  display_name: string
  email: string
  phone: string
  telegram: string
  internal_note: string
  custom_price_amount: string
}

type ManualClientSessionFormState = {
  slot_id: number
  session_format: SessionFormat
}

type ManualClientSessionCreateResponse = {
  id?: number
  session_id?: number
}

type AccountInviteState = {
  loading: boolean
  actionLoading: boolean
  invite: ClientRecordAccountInvite | null
  inviteUrl: string
  error: string
  copied: boolean
}

type ClientListItem = ClientState | ManualClientRecord

type ClientMaterialDraft = {
  title: string
  content: string
  material_type: ClientMaterialType
  url: string
}

type ClientMaterialsState = {
  loading: boolean
  saving: boolean
  actionLoadingId: number | null
  listError: string
  createError: string
  editErrorsById: Record<number, string>
  actionErrorsById: Record<number, string>
  items: ClientMaterialSpecialistRecord[]
  create: ClientMaterialDraft
  editById: Record<number, ClientMaterialDraft>
  attachmentsByMaterialId: Record<number, ClientMaterialAttachment[]>
  attachmentLoadingByMaterialId: Record<number, boolean>
  attachmentErrorByMaterialId: Record<number, string>
  attachmentSuccessByMaterialId: Record<number, string>
  attachmentUploadingByMaterialId: Record<number, boolean>
  attachmentDeletingByAttachmentId: Record<number, boolean>
  open: boolean
}

type ClientRegularTimeDraft = {
  weekday: number | null
  start_time: string
  duration_minutes: number
  frequency: ClientRegularTimeFrequency
  starts_on: string
  session_format: SessionFormat | ''
  meeting_url: string
  offline_location: string
}

type ClientRegularTimesState = {
  loading: boolean
  saving: boolean
  actionLoadingId: number | null
  listError: string
  formError: string
  items: ClientRegularTime[]
  form: ClientRegularTimeDraft
  editingId: number | null
  formOpen: boolean
  open: boolean
}


type SessionItem = {
  id: number
  client?: number
  client_id?: number
  client_record_id?: number | null
  client_has_account?: boolean | null
  client_source?: string | null
  client_identity_type?: string | null
  status: string
  slot_start_at: string
  slot_end_at: string
  client_name?: string | null
  client_username?: string | null
  client_display_name?: string | null
  display_name?: string | null
  client_first_name?: string | null
  client_last_name?: string | null
  first_name?: string | null
  last_name?: string | null
  client_code?: string | null
  has_note?: boolean | null
  note_updated_at?: string | null
  payment_badge_state?: 'paid' | 'awaiting_confirmation' | 'unpaid' | null
  payment_resolution_state?: 'pending' | 'refunded' | 'credited' | 'retained' | string | null
  payment_resolution_note?: string | null
  payment_resolution_updated_at?: string | null
  price_amount?: string | number | null
  price_currency?: string | null
  payment_proof?: {
    status?: string | null
  } | null
  workspace?: {
    payment_state?: 'paid' | 'awaiting_confirmation' | 'unpaid' | 'not_applicable' | string | null
  } | null
}

type PendingNoteItem = {
  sessionId: number
  clientId: number
  slotStart: string
  slotEnd: string
  status: string
  clientName?: string
}

type HistoryItem = {
  sessionId: number
  slotStart: string
  slotEnd: string
  status: string
  hasNote: boolean
  noteUpdatedAt: string | null
}

type NameSource = {
  client_name?: string | null
  client_username?: string | null
  client_display_name?: string | null
  display_name?: string | null
  client_first_name?: string | null
  client_last_name?: string | null
  first_name?: string | null
  last_name?: string | null
}

type SessionMetadataSource = NameSource & {
  id?: number | null
  session?: number | null
  session_id?: number | null
  client?: number | null
  client_id?: number | null
  status?: string | null
  slot_start_at?: string | null
  slot_end_at?: string | null
  has_note?: boolean | null
  note_updated_at?: string | null
}

type ListResponse<T> = T[] | { results?: T[] } | null | undefined
type ClientAccordionSection =
  | 'materials'
  | 'regularTime'
  | 'invite'
  | 'privateHistory'
  | 'workbook'
  | 'sessionNotes'
  | 'settings'

const clients = ref<ClientState[]>([])
const manualClientRecords = ref<ManualClientRecord[]>([])
const clientsLoading = ref(false)
const clientsError = ref('')
const error = ref('')
const manualClientsWarning = ref('')
const filter = ref<'ALL' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED'>('ALL')
const searchQuery = ref('')
const selectedClientKey = ref<string | null>(null)
const openAccordionSectionByClientKey = ref<Record<string, ClientAccordionSection | null>>({})
const actionLoading = ref<Set<number>>(new Set())
const manualActionLoading = ref<Set<number>>(new Set())
const expandedClientId = ref<number | null>(null)
const targetedClientId = ref<number | null>(null)
const historyLoading = ref<Set<number>>(new Set())
const clientHistory = ref<Record<number, HistoryItem[]>>({})
const clientHistoryVisibleLimits = ref<Record<number, number>>({})
const clientJournalDrafts = ref<Record<number, string>>({})
const workbookExpanded = ref<Record<number, boolean>>({})
const workbookSavedMessage = ref<Record<number, string>>({})
const workbookMissingByClient = ref<Record<number, boolean>>({})
const sessionsCache = ref<SessionItem[] | null>(null)
const sessionClientNames = ref<Record<number, string>>({})
const chatClientNames = ref<Record<number, string>>({})
const journalLoading = ref<Set<number>>(new Set())
const journalSaving = ref<Set<number>>(new Set())
const quickAddLoading = ref<Set<number>>(new Set())
const quickAddModalOpen = ref(false)
const quickAddModalError = ref('')
const quickAddDraftClientId = ref<number | null>(null)
const notesLoading = ref(false)
const remindersError = ref('')
const pendingNotes = ref<PendingNoteItem[]>([])
const remindersExpanded = ref(false)
const pendingNotesVisibleLimit = ref(3)
const noteSkipping = ref<Set<number>>(new Set())
const manualClientModalOpen = ref(false)
const manualClientEditingId = ref<number | null>(null)
const manualClientSaving = ref(false)
const manualClientFormError = ref('')
const manualClientForm = ref<ManualClientFormState>({
  display_name: '',
  email: '',
  phone: '',
  telegram: '',
  internal_note: '',
  custom_price_amount: '',
})

const manualSessionModalOpen = ref(false)
const manualSessionClient = ref<ManualClientRecord | null>(null)
const manualSessionSlots = ref<SpecialistSlot[]>([])
const manualSessionSlotsLoading = ref(false)
const manualSessionSaving = ref(false)
const manualSessionError = ref('')
const manualSessionDraft = ref<ManualClientSessionFormState>({
  slot_id: 0,
  session_format: 'online',
})
const accountInviteStateByRecordId = ref<Record<number, AccountInviteState>>({})
const materialsStateByScopeKey = ref<Record<string, ClientMaterialsState>>({})
const regularTimesStateByScopeKey = ref<Record<string, ClientRegularTimesState>>({})

const retryLabel = '\u0421\u043f\u0440\u043e\u0431\u0443\u0432\u0430\u0442\u0438 \u0449\u0435 \u0440\u0430\u0437'
const remindersErrorTitle = '\u041d\u0435 \u0432\u0434\u0430\u043b\u043e\u0441\u044f \u0437\u0430\u0432\u0430\u043d\u0442\u0430\u0436\u0438\u0442\u0438 \u043d\u0430\u0433\u0430\u0434\u0443\u0432\u0430\u043d\u043d\u044f'
const CLIENT_HISTORY_INITIAL_VISIBLE = 3
const CLIENT_HISTORY_REVEAL_BATCH = 5
const initialDeepLinkClientId = parseClientDeepLinkClientId(window.location.search)
let clientCardHighlightTimer: number | null = null
const toast = useToast()
const router = useRouter()

const filteredClients = computed(() => {
  const items: ClientListItem[] = [...clients.value, ...manualClientRecords.value]
  const byStatus =
    filter.value === 'ALL' ? items : items.filter((client) => clientListState(client) === filter.value)
  const query = normalizeSearchValue(searchQuery.value)
  if (!query) return byStatus
  return byStatus.filter((client) => matchesClientSearch(client, query))
})

watch(filteredClients, (items) => {
  if (!items.length) {
    selectedClientKey.value = null
    return
  }
  if (selectedClientKey.value && items.some((client) => clientSelectionKey(client) === selectedClientKey.value)) {
    return
  }
  const firstClient = items[0]
  if (firstClient) {
    selectedClientKey.value = clientSelectionKey(firstClient)
  }
})

const clientsEmptyTitle = computed(() => {
  if (searchQuery.value.trim()) return 'Нічого не знайдено'
  if (filter.value === 'ACTIVE') return 'Активних клієнтів поки немає'
  if (filter.value === 'INACTIVE') return 'Неактивних клієнтів поки немає'
  if (filter.value === 'ARCHIVED') return 'Архів порожній'
  return 'Клієнтів поки немає'
})

const clientsEmptyDescription = computed(() => {
  if (searchQuery.value.trim()) return 'Перевірте написання або змініть фільтр, щоб побачити більше клієнтів.'
  if (filter.value === 'ACTIVE') return 'Активні клієнти з’являться тут після підтверджених або поточних консультацій.'
  if (filter.value === 'INACTIVE') return 'Клієнти без поточної роботи з’являться тут, коли не буде запланованих сесій.'
  if (filter.value === 'ARCHIVED') return 'Архівовані клієнти зберігатимуться тут, якщо ви приберете їх з активної роботи.'
  return 'Клієнти з’являться після перших консультацій або сесій без реєстрації.'
})

const showRemindersPanel = computed(() => notesLoading.value || Boolean(remindersError.value) || pendingNotes.value.length > 0)

const pendingNotesSummary = computed(() => {
  const count = pendingNotes.value.length
  if (count === 1) return 'Є 1 завершена сесія, до якої можна додати нотатку.'
  return `Є ${count} завершені сесії, до яких можна додати нотатку.`
})

const visiblePendingNotes = computed(() => pendingNotes.value.slice(0, pendingNotesVisibleLimit.value))

const hasMorePendingNotes = computed(() => pendingNotesVisibleLimit.value < pendingNotes.value.length)

const clientIndex = computed(() => {
  const map = new Map<number, ClientState>()
  clients.value.forEach((client) => {
    const id = relationClientId(client)
    if (id > 0) map.set(id, client)
  })
  return map
})

const isManualClientEditMode = computed(() => manualClientEditingId.value !== null)

const manualClientModalTitle = computed(() =>
  isManualClientEditMode.value ? 'Редагувати клієнта' : 'Додати клієнта'
)

const manualClientSubmitLabel = computed(() => {
  if (manualClientSaving.value) {
    return isManualClientEditMode.value ? 'Зберігаємо...' : 'Додаємо...'
  }

  return isManualClientEditMode.value ? 'Зберегти зміни' : 'Додати клієнта'
})

const manualSessionModalTitle = computed(() => {
  const client = manualSessionClient.value
  if (!client) return 'Створити сесію'
  return `Створити сесію для ${displayClientName(client)}`
})

const manualSessionSubmitDisabled = computed(() => {
  return manualSessionSaving.value || manualSessionSlotsLoading.value || !manualSessionDraft.value.slot_id
})

const isActionLoading = (id: number) => actionLoading.value.has(id)
const isManualActionLoading = (id: number) => manualActionLoading.value.has(id)
const isHistoryLoading = (id: number) => historyLoading.value.has(id)
const isJournalLoading = (id: number) => journalLoading.value.has(id)
const isJournalSaving = (id: number) => journalSaving.value.has(id)
const isQuickAddLoading = (id: number) => quickAddLoading.value.has(id)
const isNoteSkipping = (id: number) => noteSkipping.value.has(id)
const isWorkbookExpanded = (id: number) => Boolean(workbookExpanded.value[id])
function isManualClientRecord(client: ClientListItem): client is ManualClientRecord {
  return (client as ManualClientRecord).source === 'manual'
}

function hasLinkedAccount(client: ClientListItem): boolean {
  if (!isManualClientRecord(client)) return true
  return Boolean(client.has_account || client.user_id)
}

function manualContactEmail(client: ManualClientRecord): string {
  return String(client.email || '').trim()
}

function manualAccountEmail(client: ManualClientRecord): string {
  return String(client.account_email || '').trim()
}

function shouldShowManualAccountEmail(client: ManualClientRecord): boolean {
  return Boolean(manualAccountEmail(client))
}

function shouldShowManualContactEmail(client: ManualClientRecord): boolean {
  const contactEmail = manualContactEmail(client)
  if (!contactEmail) return false
  const accountEmail = manualAccountEmail(client)
  return !accountEmail || accountEmail.toLowerCase() !== contactEmail.toLowerCase()
}

function manualContactEmailLabel(client: ManualClientRecord): string {
  return manualAccountEmail(client) ? 'Контактний email' : 'Email'
}

function accountBadgeLabel(client: ClientListItem) {
  return hasLinkedAccount(client) ? 'З кабінетом' : 'Без реєстрації'
}

function defaultAccountInviteState(): AccountInviteState {
  return {
    loading: false,
    actionLoading: false,
    invite: null,
    inviteUrl: '',
    error: '',
    copied: false,
  }
}

function accountInviteState(recordId: number): AccountInviteState {
  const existing = accountInviteStateByRecordId.value[recordId]
  if (existing) return existing

  const next = defaultAccountInviteState()
  accountInviteStateByRecordId.value = {
    ...accountInviteStateByRecordId.value,
    [recordId]: next,
  }
  return next
}

function updateAccountInviteState(recordId: number, patch: Partial<AccountInviteState>) {
  accountInviteStateByRecordId.value = {
    ...accountInviteStateByRecordId.value,
    [recordId]: {
      ...accountInviteState(recordId),
      ...patch,
    },
  }
}

function normalizeAccountInviteResponse(payload: ClientRecordAccountInviteResponse | null | undefined) {
  const invite = payload?.invite || null
  const inviteUrl = String(invite?.invite_url || payload?.invite_url || '').trim()
  return { invite, inviteUrl }
}

function isActiveAccountInvite(invite?: ClientRecordAccountInvite | null) {
  const normalized = String(invite?.status || '').toUpperCase()
  return normalized === 'ACTIVE' || normalized === 'OPENED'
}

function activeAccountInvite(recordId: number) {
  const invite = accountInviteState(recordId).invite
  return isActiveAccountInvite(invite) ? invite : null
}

function accountInviteUrl(recordId: number) {
  return accountInviteState(recordId).inviteUrl
}

function accountInviteStatusLabel(invite: ClientRecordAccountInvite | null) {
  const normalized = String(invite?.status || '').toUpperCase()
  if (normalized === 'OPENED') return 'Запрошення вже відкрито'
  const expiresAt = formatDateTime(invite?.expires_at || null)
  if (expiresAt && expiresAt !== '—') return `Запрошення активне до ${expiresAt}`
  return 'Запрошення активне'
}

function accountInviteErrorMessage(err: unknown) {
  const payload = (err as any)?.response?.data || {}
  const code = String(payload.code || payload.reason_code || '').toUpperCase()
  if (code === 'CLIENT_RECORD_ALREADY_LINKED') return 'Клієнт уже має підключений кабінет.'
  if (code === 'CLIENT_RECORD_ARCHIVED') return 'Неможливо запросити архівного клієнта.'
  if (code === 'ACTIVE_INVITE_EXISTS') return 'Активне запрошення вже існує.'
  return getApiErrorMessage(err, 'Не вдалося оновити запрошення. Спробуйте ще раз.')
}

async function loadAccountInvite(recordId: number) {
  updateAccountInviteState(recordId, { loading: true, error: '' })
  try {
    const payload = await fetchClientRecordAccountInvite(recordId)
    const { invite, inviteUrl } = normalizeAccountInviteResponse(payload)
    updateAccountInviteState(recordId, {
      invite: isActiveAccountInvite(invite) ? invite : null,
      inviteUrl: isActiveAccountInvite(invite) ? inviteUrl : '',
      loading: false,
    })
  } catch {
    updateAccountInviteState(recordId, { loading: false })
  }
}

function preloadAccountInvites(records: ManualClientRecord[]) {
  records
    .filter((record) => !hasLinkedAccount(record))
    .forEach((record) => {
      void loadAccountInvite(record.id)
    })
}

function applyAccountInviteResponse(recordId: number, payload: ClientRecordAccountInviteResponse | null | undefined) {
  const { invite, inviteUrl } = normalizeAccountInviteResponse(payload)
  updateAccountInviteState(recordId, {
    invite: isActiveAccountInvite(invite) ? invite : null,
    inviteUrl: isActiveAccountInvite(invite) ? inviteUrl : '',
    error: '',
    copied: false,
  })
}

async function createAccountInvite(recordId: number) {
  updateAccountInviteState(recordId, { actionLoading: true, error: '', copied: false })
  try {
    const payload = await createClientRecordAccountInvite(recordId)
    applyAccountInviteResponse(recordId, payload)
  } catch (err) {
    updateAccountInviteState(recordId, { error: accountInviteErrorMessage(err) })
    const payload = (err as any)?.response?.data || {}
    const code = String(payload.code || payload.reason_code || '').toUpperCase()
    if (code === 'ACTIVE_INVITE_EXISTS') {
      await loadAccountInvite(recordId)
    }
  } finally {
    updateAccountInviteState(recordId, { actionLoading: false })
  }
}

async function regenerateAccountInvite(recordId: number) {
  updateAccountInviteState(recordId, { actionLoading: true, error: '', copied: false })
  try {
    const payload = await regenerateClientRecordAccountInvite(recordId)
    applyAccountInviteResponse(recordId, payload)
  } catch (err) {
    updateAccountInviteState(recordId, { error: accountInviteErrorMessage(err) })
  } finally {
    updateAccountInviteState(recordId, { actionLoading: false })
  }
}

async function revokeAccountInvite(recordId: number) {
  updateAccountInviteState(recordId, { actionLoading: true, error: '', copied: false })
  try {
    await revokeClientRecordAccountInvite(recordId)
    updateAccountInviteState(recordId, { invite: null, inviteUrl: '' })
  } catch (err) {
    updateAccountInviteState(recordId, { error: accountInviteErrorMessage(err) })
  } finally {
    updateAccountInviteState(recordId, { actionLoading: false })
  }
}

async function copyAccountInviteLink(recordId: number) {
  const inviteUrl = accountInviteUrl(recordId)
  if (!inviteUrl) return
  try {
    await navigator.clipboard.writeText(inviteUrl)
    updateAccountInviteState(recordId, { copied: true })
    window.setTimeout(() => {
      updateAccountInviteState(recordId, { copied: false })
    }, 1800)
  } catch {
    updateAccountInviteState(recordId, { error: 'Не вдалося скопіювати посилання.' })
  }
}

function clientListState(client: ClientListItem): ClientState['state'] {
  if (isManualClientRecord(client)) return client.status === 'archived' ? 'ARCHIVED' : 'ACTIVE'
  return client.state
}

function defaultMaterialDraft(): ClientMaterialDraft {
  return {
    title: '',
    content: '',
    material_type: 'recommendation',
    url: '',
  }
}

function defaultMaterialsState(): ClientMaterialsState {
  return {
    loading: false,
    saving: false,
    actionLoadingId: null,
    listError: '',
    createError: '',
    editErrorsById: {},
    actionErrorsById: {},
    items: [],
    create: defaultMaterialDraft(),
    editById: {},
    attachmentsByMaterialId: {},
    attachmentLoadingByMaterialId: {},
    attachmentErrorByMaterialId: {},
    attachmentSuccessByMaterialId: {},
    attachmentUploadingByMaterialId: {},
    attachmentDeletingByAttachmentId: {},
    open: false,
  }
}

function clientMaterialsState(scopeKey: string): ClientMaterialsState {
  const existing = materialsStateByScopeKey.value[scopeKey]
  if (existing) return existing
  const next = defaultMaterialsState()
  materialsStateByScopeKey.value = {
    ...materialsStateByScopeKey.value,
    [scopeKey]: next,
  }
  return next
}

function updateClientMaterialsState(scopeKey: string, patch: Partial<ClientMaterialsState>) {
  materialsStateByScopeKey.value = {
    ...materialsStateByScopeKey.value,
    [scopeKey]: {
      ...clientMaterialsState(scopeKey),
      ...patch,
    },
  }
}

const regularTimeWeekdayOptions = [
  { value: 0, label: 'Понеділок' },
  { value: 1, label: 'Вівторок' },
  { value: 2, label: 'Середа' },
  { value: 3, label: 'Четвер' },
  { value: 4, label: 'Пʼятниця' },
  { value: 5, label: 'Субота' },
  { value: 6, label: 'Неділя' },
]

const regularTimeFrequencyOptions: Array<{ value: ClientRegularTimeFrequency; label: string }> = [
  { value: 'weekly', label: 'Щотижня' },
  { value: 'every_two_weeks', label: 'Раз на два тижні' },
]

const regularTimeFormatOptions: Array<{ value: SessionFormat; label: string }> = [
  { value: 'online', label: 'Онлайн' },
  { value: 'offline', label: 'Офлайн' },
]

function defaultRegularTimeDraft(): ClientRegularTimeDraft {
  return {
    weekday: 0,
    start_time: '09:00',
    duration_minutes: 50,
    frequency: 'weekly',
    starts_on: '',
    session_format: 'online',
    meeting_url: '',
    offline_location: '',
  }
}

function defaultRegularTimesState(): ClientRegularTimesState {
  return {
    loading: false,
    saving: false,
    actionLoadingId: null,
    listError: '',
    formError: '',
    items: [],
    form: defaultRegularTimeDraft(),
    editingId: null,
    formOpen: false,
    open: false,
  }
}

function clientRegularTimeRecordId(client: ClientListItem): number {
  if (isManualClientRecord(client)) return Number(client.id || 0)
  return Number(client.client_record_id || 0)
}

function clientRegularTimesScopeKey(client: ClientListItem): string | null {
  const recordId = clientRegularTimeRecordId(client)
  return recordId ? `client-record:${recordId}` : null
}

function clientRegularTimesState(scopeKey: string): ClientRegularTimesState {
  const existing = regularTimesStateByScopeKey.value[scopeKey]
  if (existing) return existing
  const next = defaultRegularTimesState()
  regularTimesStateByScopeKey.value = {
    ...regularTimesStateByScopeKey.value,
    [scopeKey]: next,
  }
  return next
}

function updateClientRegularTimesState(scopeKey: string, patch: Partial<ClientRegularTimesState>) {
  regularTimesStateByScopeKey.value = {
    ...regularTimesStateByScopeKey.value,
    [scopeKey]: {
      ...clientRegularTimesState(scopeKey),
      ...patch,
    },
  }
}

function regularTimeWeekdayLabel(value: number): string {
  return regularTimeWeekdayOptions.find((option) => option.value === Number(value))?.label || String(value)
}

function regularTimeFrequencyLabel(value: ClientRegularTimeFrequency | string): string {
  if (value === 'weekly') return 'щотижня'
  if (value === 'every_two_weeks') return 'раз на два тижні'
  return String(value || '')
}

function regularTimeFormatLabel(value: SessionFormat | string): string {
  if (value === 'offline') return 'офлайн'
  return 'онлайн'
}

function regularTimeStatusLabel(status: ClientRegularTimeStatus | string): string {
  return status === 'paused' ? 'На паузі' : 'Активний'
}

function regularTimeStatusClass(status: ClientRegularTimeStatus | string): string {
  return status === 'paused' ? 'regular-time-status--paused' : 'regular-time-status--active'
}

function normalizeRegularTimeValue(value: string): string {
  const trimmed = String(value || '').trim()
  const match = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(trimmed)
  if (!match) return trimmed
  return `${String(Number(match[1])).padStart(2, '0')}:${match[2]}`
}

function formatRegularTimeDate(value?: string | null): string {
  const raw = String(value || '').trim()
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw)
  if (match) return `${match[3]}.${match[2]}.${match[1]}`
  return formatUkDateCompact(value, '')
}

function parseRegularTimeDate(value: string): string {
  const trimmed = String(value || '').trim()
  const match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(trimmed)
  if (!match) return ''
  const day = Number(match[1])
  const month = Number(match[2])
  const year = Number(match[3])
  const date = new Date(Date.UTC(year, month - 1, day))
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return ''
  }
  return `${match[3]}-${match[2]}-${match[1]}`
}

function regularTimeFormFromItem(item: ClientRegularTime): ClientRegularTimeDraft {
  return {
    weekday: item.weekday,
    start_time: normalizeRegularTimeValue(item.start_time),
    duration_minutes: item.duration_minutes,
    frequency: item.frequency,
    starts_on: formatRegularTimeDate(item.starts_on),
    session_format: item.session_format,
    meeting_url: item.meeting_url || '',
    offline_location: item.offline_location || '',
  }
}

function regularTimePayloadFromDraft(draft: ClientRegularTimeDraft): ClientRegularTimePayload | null {
  if (draft.weekday === null || draft.weekday === undefined || draft.weekday < 0 || draft.weekday > 6) return null
  const startTime = normalizeRegularTimeValue(draft.start_time)
  if (!startTime) return null
  const duration = Number(draft.duration_minutes)
  if (!Number.isFinite(duration) || duration < 15 || duration > 240) return null
  const startsOn = parseRegularTimeDate(draft.starts_on)
  if (!startsOn) return null
  if (draft.session_format !== 'online' && draft.session_format !== 'offline') return null
  return {
    weekday: Number(draft.weekday),
    start_time: startTime,
    duration_minutes: duration,
    frequency: draft.frequency,
    starts_on: startsOn,
    session_format: draft.session_format,
    meeting_url: draft.meeting_url.trim() || null,
    offline_location: draft.offline_location.trim() || null,
  }
}

function regularTimeValidationMessage(draft: ClientRegularTimeDraft): string {
  if (draft.weekday === null || draft.weekday === undefined || draft.weekday < 0 || draft.weekday > 6) {
    return 'Оберіть день тижня.'
  }
  if (!normalizeRegularTimeValue(draft.start_time)) return 'Вкажіть час початку.'
  const duration = Number(draft.duration_minutes)
  if (!Number.isFinite(duration) || duration < 15 || duration > 240) {
    return 'Тривалість має бути від 15 до 240 хв.'
  }
  if (!parseRegularTimeDate(draft.starts_on)) return 'Вкажіть дату початку у форматі ДД.ММ.РРРР.'
  if (draft.session_format !== 'online' && draft.session_format !== 'offline') return 'Оберіть формат зустрічі.'
  return 'Перевірте дані й спробуйте ще раз.'
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

function regularTimeSaveErrorMessage(err: unknown): string {
  const code = regularTimeErrorCode(err)
  if (code === 'CLIENT_RECORD_ARCHIVED') {
    return 'Картка клієнта в архіві. Регулярний час не можна змінити.'
  }
  if (code === 'CLIENT_REGULAR_TIME_DUPLICATE') {
    return 'Такий регулярний час уже додано для цього клієнта.'
  }
  return getApiErrorMessage(err, 'Не вдалося зберегти регулярний час. Перевірте дані й спробуйте ще раз.')
}

async function loadClientRegularTimes(client: ClientListItem) {
  const scopeKey = clientRegularTimesScopeKey(client)
  const recordId = clientRegularTimeRecordId(client)
  if (!scopeKey || !recordId) return
  updateClientRegularTimesState(scopeKey, { loading: true, listError: '' })
  try {
    const items = await fetchClientRegularTimes(recordId)
    updateClientRegularTimesState(scopeKey, {
      items,
      loading: false,
      listError: '',
    })
  } catch {
    updateClientRegularTimesState(scopeKey, {
      loading: false,
      listError: 'Не вдалося завантажити регулярний час. Спробуйте оновити сторінку.',
    })
  }
}

async function toggleClientRegularTimes(client: ClientListItem) {
  const scopeKey = clientRegularTimesScopeKey(client)
  if (!scopeKey) return
  const state = clientRegularTimesState(scopeKey)
  updateClientRegularTimesState(scopeKey, { open: true })
  if (!state.items.length && !state.loading) {
    await loadClientRegularTimes(client)
  }
}

function openRegularTimeCreateForm(client: ClientListItem) {
  const scopeKey = clientRegularTimesScopeKey(client)
  if (!scopeKey) return
  updateClientRegularTimesState(scopeKey, {
    formOpen: true,
    editingId: null,
    formError: '',
    form: defaultRegularTimeDraft(),
  })
}

function openRegularTimeEditForm(client: ClientListItem, item: ClientRegularTime) {
  const scopeKey = clientRegularTimesScopeKey(client)
  if (!scopeKey) return
  updateClientRegularTimesState(scopeKey, {
    formOpen: true,
    editingId: item.id,
    formError: '',
    form: regularTimeFormFromItem(item),
  })
}

function cancelRegularTimeForm(client: ClientListItem) {
  const scopeKey = clientRegularTimesScopeKey(client)
  if (!scopeKey) return
  updateClientRegularTimesState(scopeKey, {
    formOpen: false,
    editingId: null,
    formError: '',
    form: defaultRegularTimeDraft(),
  })
}

function setRegularTimeFormField(
  client: ClientListItem,
  patch: Partial<ClientRegularTimeDraft>
) {
  const scopeKey = clientRegularTimesScopeKey(client)
  if (!scopeKey) return
  const state = clientRegularTimesState(scopeKey)
  updateClientRegularTimesState(scopeKey, {
    formError: '',
    form: {
      ...state.form,
      ...patch,
    },
  })
}

async function saveRegularTime(client: ClientListItem) {
  const scopeKey = clientRegularTimesScopeKey(client)
  const recordId = clientRegularTimeRecordId(client)
  if (!scopeKey || !recordId) return
  const state = clientRegularTimesState(scopeKey)
  const payload = regularTimePayloadFromDraft(state.form)
  if (!payload) {
    updateClientRegularTimesState(scopeKey, { formError: regularTimeValidationMessage(state.form) })
    return
  }
  updateClientRegularTimesState(scopeKey, { saving: true, formError: '' })
  try {
    if (state.editingId) {
      await updateClientRegularTime(recordId, state.editingId, payload)
    } else {
      await createClientRegularTime(recordId, payload)
    }
    updateClientRegularTimesState(scopeKey, {
      formOpen: false,
      editingId: null,
      form: defaultRegularTimeDraft(),
    })
    await loadClientRegularTimes(client)
  } catch (err) {
    updateClientRegularTimesState(scopeKey, { formError: regularTimeSaveErrorMessage(err) })
  } finally {
    updateClientRegularTimesState(scopeKey, { saving: false })
  }
}

async function pauseRegularTime(client: ClientListItem, regularTimeId: number) {
  const scopeKey = clientRegularTimesScopeKey(client)
  const recordId = clientRegularTimeRecordId(client)
  if (!scopeKey || !recordId) return
  updateClientRegularTimesState(scopeKey, { actionLoadingId: regularTimeId, listError: '' })
  try {
    await pauseClientRegularTime(recordId, regularTimeId)
    await loadClientRegularTimes(client)
  } catch (err) {
    updateClientRegularTimesState(scopeKey, { listError: regularTimeSaveErrorMessage(err) })
  } finally {
    if (clientRegularTimesState(scopeKey).actionLoadingId === regularTimeId) {
      updateClientRegularTimesState(scopeKey, { actionLoadingId: null })
    }
  }
}

async function resumeRegularTime(client: ClientListItem, regularTimeId: number) {
  const scopeKey = clientRegularTimesScopeKey(client)
  const recordId = clientRegularTimeRecordId(client)
  if (!scopeKey || !recordId) return
  updateClientRegularTimesState(scopeKey, { actionLoadingId: regularTimeId, listError: '' })
  try {
    await resumeClientRegularTime(recordId, regularTimeId)
    await loadClientRegularTimes(client)
  } catch (err) {
    updateClientRegularTimesState(scopeKey, { listError: regularTimeSaveErrorMessage(err) })
  } finally {
    if (clientRegularTimesState(scopeKey).actionLoadingId === regularTimeId) {
      updateClientRegularTimesState(scopeKey, { actionLoadingId: null })
    }
  }
}

function normalizeMaterialUrl(value: string): string {
  const trimmed = String(value || '').trim()
  if (!trimmed) return ''
  const lowered = trimmed.toLowerCase()
  if (lowered.startsWith('http://') || lowered.startsWith('https://')) return trimmed
  return `https://${trimmed}`
}

function materialValidationErrorMessage(err: unknown, fallback: string): string {
  const data = (err as any)?.response?.data || {}
  const urlErrors = Array.isArray(data?.url) ? data.url : []
  const urlMessage = String(urlErrors[0] || '').toLowerCase()
  if (urlMessage.includes('enter a valid url') || urlMessage.includes('valid url')) {
    return 'Введіть коректне посилання. Наприклад: https://kendo.com.ua'
  }
  return getApiErrorMessage(err, fallback)
}

const attachmentAllowedExtensions = new Set(['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'webp', 'txt'])
const attachmentMaxSizeBytes = 20 * 1024 * 1024

function attachmentCode(err: unknown): string {
  const data = (err as any)?.response?.data
  return String(data?.code || data?.reason_code || '').trim().toUpperCase()
}

function attachmentActionErrorMessage(err: unknown, fallback: string): string {
  const code = attachmentCode(err)
  if (code === 'ATTACHMENT_FILE_REQUIRED') return 'Оберіть файл для завантаження.'
  if (code === 'ATTACHMENT_INVALID_EXTENSION' || code === 'ATTACHMENT_INVALID_MIME_TYPE') {
    return 'Цей тип файлу не підтримується. Дозволені PDF, DOC, DOCX, JPG, PNG, WEBP або TXT.'
  }
  if (code === 'ATTACHMENT_FILE_TOO_LARGE') return 'Файл завеликий. Максимальний розмір одного файлу — 20 МБ.'
  if (code === 'ATTACHMENT_COUNT_LIMIT_REACHED') return 'До одного матеріалу можна додати не більше 10 файлів.'
  if (code === 'ATTACHMENT_TOTAL_SIZE_LIMIT_REACHED') {
    return 'Загальний розмір файлів для одного матеріалу не може перевищувати 100 МБ.'
  }
  if (code === 'CLIENT_MATERIAL_ATTACHMENT_NOT_FOUND' || code === 'CLIENT_MATERIAL_NOT_FOUND') {
    return 'Файл не знайдено або у вас немає доступу.'
  }
  return getApiErrorMessage(err, fallback)
}

function clearAttachmentMessage(scopeKey: string, materialId: number) {
  const state = clientMaterialsState(scopeKey)
  const errors = { ...state.attachmentErrorByMaterialId }
  const success = { ...state.attachmentSuccessByMaterialId }
  delete errors[materialId]
  delete success[materialId]
  updateClientMaterialsState(scopeKey, {
    attachmentErrorByMaterialId: errors,
    attachmentSuccessByMaterialId: success,
  })
}

function humanFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 Б'
  if (bytes < 1024) return `${Math.round(bytes)} Б`
  const kb = bytes / 1024
  if (kb < 1024) return `${Math.round(kb)} КБ`
  const mb = kb / 1024
  const value = mb >= 10 ? Math.round(mb) : Math.round(mb * 10) / 10
  return `${value.toString().replace('.', ',')} МБ`
}

function clearMaterialEditError(scopeKey: string, materialId: number) {
  const state = clientMaterialsState(scopeKey)
  if (!state.editErrorsById[materialId]) return
  const next = { ...state.editErrorsById }
  delete next[materialId]
  updateClientMaterialsState(scopeKey, { editErrorsById: next })
}

function clearMaterialActionError(scopeKey: string, materialId: number) {
  const state = clientMaterialsState(scopeKey)
  if (!state.actionErrorsById[materialId]) return
  const next = { ...state.actionErrorsById }
  delete next[materialId]
  updateClientMaterialsState(scopeKey, { actionErrorsById: next })
}

function materialTypeLabel(value: ClientMaterialType): string {
  if (value === 'recommendation') return 'Рекомендація'
  if (value === 'homework') return 'Домашнє завдання'
  if (value === 'exercise') return 'Вправа'
  if (value === 'instruction') return 'Інструкція'
  if (value === 'link') return 'Посилання'
  if (value === 'document') return 'Документ'
  return 'Інше'
}

function materialStatusLabel(value: ClientMaterialStatus): string {
  if (value === 'draft') return 'Чернетка'
  if (value === 'published') return 'Опубліковано'
  return 'Відкликано'
}

function materialStatusClass(value: ClientMaterialStatus): string {
  if (value === 'published') return 'material-status--published'
  if (value === 'revoked') return 'material-status--revoked'
  return 'material-status--draft'
}

function materialFormById(scopeKey: string, materialId: number): ClientMaterialDraft {
  const state = clientMaterialsState(scopeKey)
  const existing = state.editById[materialId]
  if (existing) return existing
  const material = state.items.find((item) => item.id === materialId)
  const seed: ClientMaterialDraft = {
    title: material?.title || '',
    content: material?.content || '',
    material_type: material?.material_type || 'recommendation',
    url: material?.url || '',
  }
  updateClientMaterialsState(scopeKey, {
    editById: {
      ...state.editById,
      [materialId]: seed,
    },
  })
  return seed
}

function setMaterialFormById(scopeKey: string, materialId: number, patch: Partial<ClientMaterialDraft>) {
  const state = clientMaterialsState(scopeKey)
  const current = materialFormById(scopeKey, materialId)
  updateClientMaterialsState(scopeKey, {
    editById: {
      ...state.editById,
      [materialId]: {
        ...current,
        ...patch,
      },
    },
  })
}

function onMaterialTitleInput(scopeKey: string, materialId: number, event: Event) {
  clearMaterialEditError(scopeKey, materialId)
  setMaterialFormById(scopeKey, materialId, {
    title: String((event.target as HTMLInputElement | null)?.value || ''),
  })
}

function onMaterialTypeInput(scopeKey: string, materialId: number, event: Event) {
  clearMaterialEditError(scopeKey, materialId)
  setMaterialFormById(scopeKey, materialId, {
    material_type: String((event.target as HTMLSelectElement | null)?.value || 'recommendation') as ClientMaterialType,
  })
}

function onMaterialContentInput(scopeKey: string, materialId: number, event: Event) {
  clearMaterialEditError(scopeKey, materialId)
  setMaterialFormById(scopeKey, materialId, {
    content: String((event.target as HTMLTextAreaElement | null)?.value || ''),
  })
}

function onMaterialUrlInput(scopeKey: string, materialId: number, event: Event) {
  clearMaterialEditError(scopeKey, materialId)
  setMaterialFormById(scopeKey, materialId, {
    url: String((event.target as HTMLInputElement | null)?.value || ''),
  })
}

function setCreateMaterialField(
  scopeKey: string,
  patch: Partial<ClientMaterialDraft>
) {
  const state = clientMaterialsState(scopeKey)
  if (state.createError) {
    updateClientMaterialsState(scopeKey, { createError: '' })
  }
  updateClientMaterialsState(scopeKey, {
    create: {
      ...state.create,
      ...patch,
    },
  })
}

type ClientMaterialScope = { client_record_id?: number; client_id?: number }

function clientMaterialsScopeKey(client: ClientListItem): string | null {
  if (isManualClientRecord(client)) return `client-record:${client.id}`
  const clientId = relationClientId(client)
  if (!clientId) return null
  return `client:${clientId}`
}

function resolveClientMaterialScope(client: ClientListItem): ClientMaterialScope | null {
  if (isManualClientRecord(client)) {
    return { client_record_id: client.id }
  }
  const clientId = relationClientId(client)
  if (!clientId) return null
  return { client_id: clientId }
}

async function loadClientMaterials(scopeKey: string, scope: ClientMaterialScope) {
  updateClientMaterialsState(scopeKey, { loading: true, listError: '' })
  try {
    const items = await fetchSpecialistClientMaterials(scope)
    const editById: Record<number, ClientMaterialDraft> = {}
    items.forEach((item) => {
      editById[item.id] = {
        title: item.title || '',
        content: item.content || '',
        material_type: item.material_type,
        url: item.url || '',
      }
    })
    updateClientMaterialsState(scopeKey, {
      items,
      editById,
      loading: false,
      listError: '',
    })
    await Promise.all(items.map((item) => loadMaterialAttachments(scopeKey, item.id)))
  } catch (err) {
    updateClientMaterialsState(scopeKey, {
      loading: false,
      listError: getApiErrorMessage(err, 'Не вдалося завантажити матеріали.'),
    })
  }
}

async function loadMaterialAttachments(scopeKey: string, materialId: number) {
  const state = clientMaterialsState(scopeKey)
  updateClientMaterialsState(scopeKey, {
    attachmentLoadingByMaterialId: {
      ...state.attachmentLoadingByMaterialId,
      [materialId]: true,
    },
  })
  try {
    const attachments = await listClientMaterialAttachments(materialId)
    const nextErrors = { ...clientMaterialsState(scopeKey).attachmentErrorByMaterialId }
    delete nextErrors[materialId]
    updateClientMaterialsState(scopeKey, {
      attachmentsByMaterialId: {
        ...clientMaterialsState(scopeKey).attachmentsByMaterialId,
        [materialId]: attachments,
      },
      attachmentErrorByMaterialId: nextErrors,
    })
  } catch (err) {
    updateClientMaterialsState(scopeKey, {
      attachmentErrorByMaterialId: {
        ...clientMaterialsState(scopeKey).attachmentErrorByMaterialId,
        [materialId]: attachmentActionErrorMessage(err, 'Не вдалося виконати дію з файлом. Спробуйте ще раз.'),
      },
    })
  } finally {
    updateClientMaterialsState(scopeKey, {
      attachmentLoadingByMaterialId: {
        ...clientMaterialsState(scopeKey).attachmentLoadingByMaterialId,
        [materialId]: false,
      },
    })
  }
}

async function toggleClientMaterials(client: ClientListItem) {
  const scopeKey = clientMaterialsScopeKey(client)
  if (!scopeKey) return
  const scope = resolveClientMaterialScope(client)
  if (!scope) return
  const state = clientMaterialsState(scopeKey)
  const open = !state.open
  updateClientMaterialsState(scopeKey, { open })
  if (open && !state.items.length && !state.loading) {
    await loadClientMaterials(scopeKey, scope)
  }
}

async function createMaterial(client: ClientListItem) {
  const scopeKey = clientMaterialsScopeKey(client)
  if (!scopeKey) return
  const scope = resolveClientMaterialScope(client)
  if (!scope) return
  const state = clientMaterialsState(scopeKey)
  const draft = state.create
  if (!draft.title.trim() || !draft.content.trim()) {
    updateClientMaterialsState(scopeKey, { createError: 'Заповніть назву і текст матеріалу.' })
    return
  }
  if (draft.material_type === 'link' && !draft.url.trim()) {
    updateClientMaterialsState(scopeKey, { createError: 'Додайте посилання для матеріалу цього типу.' })
    return
  }
  const normalizedUrl = normalizeMaterialUrl(draft.url)
  updateClientMaterialsState(scopeKey, { saving: true, createError: '' })
  try {
    await createSpecialistClientMaterial({
      ...scope,
      title: draft.title.trim(),
      content: draft.content.trim(),
      material_type: draft.material_type,
      url: normalizedUrl || null,
    })
    updateClientMaterialsState(scopeKey, { create: defaultMaterialDraft() })
    await loadClientMaterials(scopeKey, scope)
  } catch (err) {
    updateClientMaterialsState(scopeKey, {
      createError: materialValidationErrorMessage(err, 'Не вдалося створити матеріал.'),
    })
  } finally {
    updateClientMaterialsState(scopeKey, { saving: false })
  }
}

async function saveMaterial(client: ClientListItem, materialId: number) {
  const scopeKey = clientMaterialsScopeKey(client)
  if (!scopeKey) return
  const scope = resolveClientMaterialScope(client)
  if (!scope) return
  const form = materialFormById(scopeKey, materialId)
  if (!form.title.trim() || !form.content.trim()) {
    updateClientMaterialsState(scopeKey, {
      editErrorsById: {
        ...clientMaterialsState(scopeKey).editErrorsById,
        [materialId]: 'Заповніть назву і текст матеріалу.',
      },
    })
    return
  }
  if (form.material_type === 'link' && !form.url.trim()) {
    updateClientMaterialsState(scopeKey, {
      editErrorsById: {
        ...clientMaterialsState(scopeKey).editErrorsById,
        [materialId]: 'Додайте посилання для матеріалу цього типу.',
      },
    })
    return
  }
  clearMaterialEditError(scopeKey, materialId)
  const normalizedUrl = normalizeMaterialUrl(form.url)
  updateClientMaterialsState(scopeKey, { actionLoadingId: materialId })
  try {
    await updateSpecialistClientMaterial(materialId, {
      title: form.title.trim(),
      content: form.content.trim(),
      material_type: form.material_type,
      url: normalizedUrl || null,
    })
    await loadClientMaterials(scopeKey, scope)
  } catch (err) {
    const state = clientMaterialsState(scopeKey)
    updateClientMaterialsState(scopeKey, {
      editErrorsById: {
        ...state.editErrorsById,
        [materialId]: materialValidationErrorMessage(err, 'Не вдалося зберегти матеріал.'),
      },
    })
  } finally {
    if (clientMaterialsState(scopeKey).actionLoadingId === materialId) {
      updateClientMaterialsState(scopeKey, { actionLoadingId: null })
    }
  }
}

async function publishMaterial(client: ClientListItem, materialId: number) {
  const scopeKey = clientMaterialsScopeKey(client)
  if (!scopeKey) return
  const scope = resolveClientMaterialScope(client)
  if (!scope) return
  clearMaterialActionError(scopeKey, materialId)
  updateClientMaterialsState(scopeKey, { actionLoadingId: materialId })
  try {
    await publishSpecialistClientMaterial(materialId)
    await loadClientMaterials(scopeKey, scope)
  } catch (err) {
    const state = clientMaterialsState(scopeKey)
    updateClientMaterialsState(scopeKey, {
      actionErrorsById: {
        ...state.actionErrorsById,
        [materialId]: materialValidationErrorMessage(err, 'Не вдалося опублікувати матеріал.'),
      },
    })
  } finally {
    if (clientMaterialsState(scopeKey).actionLoadingId === materialId) {
      updateClientMaterialsState(scopeKey, { actionLoadingId: null })
    }
  }
}

async function revokeMaterial(client: ClientListItem, materialId: number) {
  const scopeKey = clientMaterialsScopeKey(client)
  if (!scopeKey) return
  const scope = resolveClientMaterialScope(client)
  if (!scope) return
  clearMaterialActionError(scopeKey, materialId)
  updateClientMaterialsState(scopeKey, { actionLoadingId: materialId })
  try {
    await revokeSpecialistClientMaterial(materialId)
    await loadClientMaterials(scopeKey, scope)
  } catch (err) {
    const state = clientMaterialsState(scopeKey)
    updateClientMaterialsState(scopeKey, {
      actionErrorsById: {
        ...state.actionErrorsById,
        [materialId]: materialValidationErrorMessage(err, 'Не вдалося відкликати матеріал.'),
      },
    })
  } finally {
    if (clientMaterialsState(scopeKey).actionLoadingId === materialId) {
      updateClientMaterialsState(scopeKey, { actionLoadingId: null })
    }
  }
}

function attachmentFileChange(scopeKey: string, materialId: number, event: Event) {
  const input = event.target as HTMLInputElement | null
  const file = input?.files?.[0]
  if (!file) {
    updateClientMaterialsState(scopeKey, {
      attachmentErrorByMaterialId: {
        ...clientMaterialsState(scopeKey).attachmentErrorByMaterialId,
        [materialId]: 'Оберіть файл для завантаження.',
      },
    })
    return
  }

  const extension = file.name.includes('.') ? file.name.split('.').pop()?.toLowerCase() || '' : ''
  if (!attachmentAllowedExtensions.has(extension)) {
    updateClientMaterialsState(scopeKey, {
      attachmentErrorByMaterialId: {
        ...clientMaterialsState(scopeKey).attachmentErrorByMaterialId,
        [materialId]: 'Цей тип файлу не підтримується. Дозволені PDF, DOC, DOCX, JPG, PNG, WEBP або TXT.',
      },
    })
    return
  }

  if (file.size > attachmentMaxSizeBytes) {
    updateClientMaterialsState(scopeKey, {
      attachmentErrorByMaterialId: {
        ...clientMaterialsState(scopeKey).attachmentErrorByMaterialId,
        [materialId]: 'Файл завеликий. Максимальний розмір одного файлу — 20 МБ.',
      },
    })
    return
  }

  void uploadAttachment(scopeKey, materialId, file).finally(() => {
    if (input) input.value = ''
  })
}

async function uploadAttachment(scopeKey: string, materialId: number, file: File) {
  clearAttachmentMessage(scopeKey, materialId)
  updateClientMaterialsState(scopeKey, {
    attachmentUploadingByMaterialId: {
      ...clientMaterialsState(scopeKey).attachmentUploadingByMaterialId,
      [materialId]: true,
    },
  })
  try {
    await uploadClientMaterialAttachment(materialId, file)
    await loadMaterialAttachments(scopeKey, materialId)
    updateClientMaterialsState(scopeKey, {
      attachmentSuccessByMaterialId: {
        ...clientMaterialsState(scopeKey).attachmentSuccessByMaterialId,
        [materialId]: 'Файл додано',
      },
    })
  } catch (err) {
    updateClientMaterialsState(scopeKey, {
      attachmentErrorByMaterialId: {
        ...clientMaterialsState(scopeKey).attachmentErrorByMaterialId,
        [materialId]: attachmentActionErrorMessage(err, 'Не вдалося виконати дію з файлом. Спробуйте ще раз.'),
      },
    })
  } finally {
    updateClientMaterialsState(scopeKey, {
      attachmentUploadingByMaterialId: {
        ...clientMaterialsState(scopeKey).attachmentUploadingByMaterialId,
        [materialId]: false,
      },
    })
  }
}

async function deleteAttachment(scopeKey: string, materialId: number, attachmentId: number) {
  clearAttachmentMessage(scopeKey, materialId)
  updateClientMaterialsState(scopeKey, {
    attachmentDeletingByAttachmentId: {
      ...clientMaterialsState(scopeKey).attachmentDeletingByAttachmentId,
      [attachmentId]: true,
    },
  })
  try {
    await deleteClientMaterialAttachment(materialId, attachmentId)
    const existing = clientMaterialsState(scopeKey).attachmentsByMaterialId[materialId] || []
    updateClientMaterialsState(scopeKey, {
      attachmentsByMaterialId: {
        ...clientMaterialsState(scopeKey).attachmentsByMaterialId,
        [materialId]: existing.filter((item) => item.id !== attachmentId),
      },
      attachmentSuccessByMaterialId: {
        ...clientMaterialsState(scopeKey).attachmentSuccessByMaterialId,
        [materialId]: 'Файл видалено',
      },
    })
  } catch (err) {
    updateClientMaterialsState(scopeKey, {
      attachmentErrorByMaterialId: {
        ...clientMaterialsState(scopeKey).attachmentErrorByMaterialId,
        [materialId]: attachmentActionErrorMessage(err, 'Не вдалося виконати дію з файлом. Спробуйте ще раз.'),
      },
    })
  } finally {
    const deleting = { ...clientMaterialsState(scopeKey).attachmentDeletingByAttachmentId }
    delete deleting[attachmentId]
    updateClientMaterialsState(scopeKey, { attachmentDeletingByAttachmentId: deleting })
  }
}

function clientListKey(client: ClientListItem) {
  return isManualClientRecord(client) ? `manual-${client.id}` : `registered-${relationClientId(client)}`
}

function clientSelectionKey(client: ClientListItem) {
  return clientListKey(client)
}

function setClientAccordionSection(client: ClientListItem, section: ClientAccordionSection | null) {
  openAccordionSectionByClientKey.value = {
    ...openAccordionSectionByClientKey.value,
    [clientSelectionKey(client)]: section,
  }
}

function clientAccordionSection(client: ClientListItem) {
  return openAccordionSectionByClientKey.value[clientSelectionKey(client)] || null
}

function isAccordionSectionOpen(client: ClientListItem, section: ClientAccordionSection) {
  return clientAccordionSection(client) === section
}

async function toggleClientAccordion(client: ClientListItem, section: ClientAccordionSection) {
  if (isAccordionSectionOpen(client, section)) {
    setClientAccordionSection(client, null)
    return
  }

  setClientAccordionSection(client, section)

  if (section === 'materials' && !clientMaterialsState(clientMaterialsScopeKey(client) || '').open) {
    await toggleClientMaterials(client)
  }

  if (section === 'regularTime') {
    await toggleClientRegularTimes(client)
  }

  if (!isManualClientRecord(client) && ['privateHistory', 'workbook', 'sessionNotes'].includes(section)) {
    const clientId = relationClientId(client)
    expandedClientId.value = clientId
    resetClientHistoryVisibleLimit(clientId)
    if (!clientHistory.value[clientId]) {
      await loadHistory(clientId)
    }
  }
}

function accordionSummary(client: ClientListItem, section: ClientAccordionSection) {
  if (section === 'materials') {
    const state = clientMaterialsState(clientMaterialsScopeKey(client) || '')
    if (state.loading) return 'Завантаження...'
    if (state.items.length === 1) return '1 матеріал'
    if (state.items.length > 1) return `${state.items.length} матеріали`
    return 'Підготувати або переглянути'
  }
  if (section === 'regularTime') {
    const scopeKey = clientRegularTimesScopeKey(client)
    if (!scopeKey) return 'Недоступний'
    const state = clientRegularTimesState(scopeKey)
    if (state.loading) return 'Завантаження...'
    if (state.items.length === 1) return '1 домовленість'
    if (state.items.length > 1) return `${state.items.length} домовленості`
    return 'День і час зустрічі'
  }
  if (section === 'privateHistory') return 'Конфіденційний розділ'
  if (section === 'workbook') return workbookSummary(client)
  if (section === 'sessionNotes') {
    if (isManualClientRecord(client)) return ''
    const count = clientHistory.value[relationClientId(client)]?.length || 0
    if (count === 1) return '1 нотатка'
    if (count > 1) return `${count} нотатки`
    return 'Нотатки ще немає.'
  }
  if (section === 'invite') return 'Підключення кабінету'
  return 'Редагування, дошка, архів'
}

function selectClient(client: ClientListItem) {
  selectedClientKey.value = clientSelectionKey(client)
  setClientAccordionSection(client, null)
}

function selectRegisteredClient(clientId: number, resetAccordion = true) {
  if (!clientId) return
  selectedClientKey.value = `registered-${clientId}`
  if (resetAccordion) {
    openAccordionSectionByClientKey.value = {
      ...openAccordionSectionByClientKey.value,
      [`registered-${clientId}`]: null,
    }
  }
}

function isClientSelected(client: ClientListItem) {
  return selectedClientKey.value === clientSelectionKey(client)
}

function clientCardDomId(client: ClientListItem | number) {
  if (typeof client === 'number') return `client-card-${client}`
  return isManualClientRecord(client) ? `manual-client-record-${client.id}` : `client-card-${relationClientId(client)}`
}

function clientRowDomId(client: ClientListItem) {
  return isManualClientRecord(client) ? `client-row-manual-${client.id}` : `client-row-${relationClientId(client)}`
}

function relationClientId(client: Pick<ClientState, 'client' | 'client_id'> | ClientListItem) {
  if (isManualClientRecord(client as ClientListItem)) return 0
  const relation = client as Pick<ClientState, 'client' | 'client_id'>
  return Number(relation.client ?? relation.client_id ?? 0)
}

function relationSessionClientId(session: Pick<SessionItem, 'client' | 'client_id'>) {
  return Number(session.client ?? session.client_id ?? 0)
}

function relationSessionClientRecordId(session: Pick<SessionItem, 'client_record_id'>) {
  return Number(session.client_record_id || 0)
}

function isActiveSessionStatus(status?: string | null) {
  return ['SCHEDULED', 'CONFIRMED'].includes(String(status || '').toUpperCase())
}

function isCompletedOrPastSession(session: SessionItem) {
  const status = String(session.status || '').toUpperCase()
  const start = new Date(session.slot_start_at).getTime()

  if (status === 'COMPLETED') return true
  if (!Number.isFinite(start)) return false

  return start <= Date.now()
}

function manualClientSessions(client: ManualClientRecord) {
  return (sessionsCache.value || [])
    .filter((session) => relationSessionClientRecordId(session) === client.id)
    .sort((a, b) => String(a.slot_start_at || '').localeCompare(String(b.slot_start_at || '')))
}

function manualClientUpcomingSessions(client: ManualClientRecord) {
  const now = Date.now()

  return manualClientSessions(client).filter((session) => {
    const start = new Date(session.slot_start_at).getTime()
    return isActiveSessionStatus(session.status) && Number.isFinite(start) && start > now
  })
}

function manualClientNearestSession(client: ManualClientRecord) {
  return manualClientUpcomingSessions(client)[0] || null
}

type ManualSessionPaymentState = 'paid' | 'awaiting_confirmation' | 'unpaid' | null

function hasSessionPrice(session: SessionItem | null | undefined) {
  const amount = session?.price_amount
  return amount !== null && amount !== undefined && String(amount).trim() !== ''
}

function sessionPaymentState(session: SessionItem | null | undefined): ManualSessionPaymentState {
  if (!session) return null

  const workspaceState = String(session.workspace?.payment_state || '').toLowerCase()

  if (workspaceState === 'paid') return 'paid'
  if (workspaceState === 'awaiting_confirmation') return 'awaiting_confirmation'
  if (workspaceState === 'unpaid') return 'unpaid'

  const proofStatus = String(session.payment_proof?.status || '').toUpperCase()

  if (proofStatus === 'MARKED_PAID') return 'paid'
  if (proofStatus === 'PROOF_SUBMITTED') return 'awaiting_confirmation'

  if (session.payment_badge_state === 'paid') return 'paid'
  if (session.payment_badge_state === 'awaiting_confirmation') return 'awaiting_confirmation'
  if (session.payment_badge_state === 'unpaid') return 'unpaid'

  if (hasSessionPrice(session)) return 'unpaid'

  return null
}

function sessionPaymentLabel(session: SessionItem | null | undefined) {
  const resolutionLabel = sessionPaymentResolutionLabel(session)
  if (resolutionLabel) return resolutionLabel

  const state = sessionPaymentState(session)

  if (state === 'paid') return 'Оплачено'
  if (state === 'awaiting_confirmation') return 'Очікує підтвердження оплати'
  if (state === 'unpaid') return 'Не оплачено'

  return 'Немає даних про оплату'
}

function sessionPaymentClass(session: SessionItem | null | undefined) {
  const resolutionState = sessionPaymentResolutionState(session)

  if (resolutionState === 'pending') return 'manual-payment-status--awaiting'
  if (resolutionState) return 'manual-payment-status--paid'

  const state = sessionPaymentState(session)

  if (state === 'paid') return 'manual-payment-status--paid'
  if (state === 'awaiting_confirmation') return 'manual-payment-status--awaiting'
  if (state === 'unpaid') return 'manual-payment-status--unpaid'

  return 'manual-payment-status--muted'
}

type SessionPaymentResolutionState = 'pending' | 'refunded' | 'credited' | 'retained' | null

function sessionPaymentResolutionState(session: SessionItem | null | undefined): SessionPaymentResolutionState {
  const value = String(session?.payment_resolution_state || '').toLowerCase()

  if (value === 'pending') return 'pending'
  if (value === 'refunded') return 'refunded'
  if (value === 'credited') return 'credited'
  if (value === 'retained') return 'retained'

  return null
}

function sessionPaymentResolutionLabel(session: SessionItem | null | undefined) {
  const state = sessionPaymentResolutionState(session)

  if (state === 'pending') return 'Потребує рішення щодо оплати'
  if (state === 'refunded') return 'Оплату повернено'
  if (state === 'credited') return 'Зараховано на майбутню сесію'
  if (state === 'retained') return 'Оплату залишено за домовленістю'

  return ''
}

function manualClientPaymentSession(client: ManualClientRecord) {
  return manualClientNearestSession(client) || manualClientLastSession(client)
}

function manualClientPaymentTitle(client: ManualClientRecord) {
  if (manualClientNearestSession(client)) return 'Оплата найближчої'
  if (manualClientLastSession(client)) return 'Оплата останньої'
  return 'Оплата'
}

function manualClientPaymentLabel(client: ManualClientRecord) {
  const session = manualClientPaymentSession(client)
  if (!session) return 'Немає сесій'
  return sessionPaymentLabel(session)
}

function manualClientPaymentClass(client: ManualClientRecord) {
  return sessionPaymentClass(manualClientPaymentSession(client))
}

function manualClientLastSession(client: ManualClientRecord) {
  return manualClientSessions(client)
    .filter((session) => isCompletedOrPastSession(session))
    .sort((a, b) => String(b.slot_start_at || '').localeCompare(String(a.slot_start_at || '')))[0] || null
}

function manualClientSessionRoute(session: SessionItem | null | undefined) {
  if (!session?.id) return '/cabinet/sessions'
  return `/cabinet/sessions/${session.id}`
}

function rememberSessionClientNames(sessions: SessionItem[]) {
  const next = { ...sessionClientNames.value }
  sessions.forEach((session) => {
    const id = relationSessionClientId(session)
    if (!id || next[id]) return
    const normalized = preferredClientName(session)
    if (normalized) next[id] = normalized
  })
  sessionClientNames.value = next
}

function rememberChatClientNames(threads: ChatThread[]) {
  const next = { ...chatClientNames.value }
  threads.forEach((thread) => {
    const id = Number(thread.client_id || 0)
    const normalized = normalizeClientName(thread.other_user?.display_name || '')
    if (!id || !normalized) return
    next[id] = normalized
  })
  chatClientNames.value = next
}

function normalizeSearchValue(value?: string | number | null) {
  return String(value ?? '').trim().toLowerCase()
}

function matchesClientSearch(client: ClientListItem, query: string) {
  if (isManualClientRecord(client)) {
    const searchable = [
      client.display_name,
      client.email,
      client.phone,
      client.telegram,
      client.internal_note,
      client.id,
    ]
    return searchable.map((item) => normalizeSearchValue(item)).some((item) => item.includes(query))
  }
  const searchable = [
    displayClientName(client),
    normalizeClientName(client.client_name),
    normalizeClientName(client.client_username),
    client.client_code,
    relationClientId(client),
    client.id,
  ]
  return searchable.map((item) => normalizeSearchValue(item)).some((item) => item.includes(query))
}

function clientPrimaryContact(client: ClientListItem) {
  if (isManualClientRecord(client)) {
    return (
      manualContactEmail(client) ||
      manualAccountEmail(client) ||
      client.phone ||
      client.telegram ||
      'Контакт не вказано'
    )
  }

  return client.client_email || 'Контакт не вказано'
}

function clientNearestSessionLabel(client: ClientListItem) {
  if (isManualClientRecord(client)) {
    return optionalDateLabel(manualClientNearestSession(client)?.slot_start_at, 'Немає запланованих')
  }

  const count = Number(client.upcoming_count || 0)
  if (count <= 0) return 'Немає запланованих'
  if (count === 1) return '1 майбутня сесія'
  return `${count} майбутніх сесій`
}

function clientLastActivityLabel(client: ClientListItem) {
  if (isManualClientRecord(client)) {
    const lastSession = manualClientLastSession(client)
    if (lastSession) return optionalDateLabel(lastSession.slot_start_at, 'Ще не було')
    return manualClientUpdatedLabel(client)
  }

  const note = latestNoteSummary(client)
  if (note && note !== 'Нотаток ще немає') return note
  return optionalDateLabel(client.last_session_at, clientUpdatedLabel(client))
}

function parseClientDeepLinkClientId(search: string) {
  const params = new URLSearchParams(search)
  const value = Number(params.get('client'))
  const autoOpen = params.get('autoOpen')
  const shouldAutoOpen = autoOpen == null || autoOpen === '1' || autoOpen.toLowerCase() === 'true'
  if (!shouldAutoOpen || !Number.isFinite(value) || value <= 0) return null
  return value
}

function clearClientCardHighlightTimer() {
  if (clientCardHighlightTimer == null) return
  window.clearTimeout(clientCardHighlightTimer)
  clientCardHighlightTimer = null
}

function markClientCardAsTargeted(clientId: number) {
  targetedClientId.value = clientId
  clearClientCardHighlightTimer()
  clientCardHighlightTimer = window.setTimeout(() => {
    if (targetedClientId.value === clientId) {
      targetedClientId.value = null
    }
    clientCardHighlightTimer = null
  }, 2400)
}

async function focusClientCard(clientId: number) {
  await nextTick()
  const element = document.getElementById(clientCardDomId(clientId))
  if (!(element instanceof HTMLElement)) return
  element.scrollIntoView({ behavior: 'smooth', block: 'start' })
  element.focus({ preventScroll: true })
  markClientCardAsTargeted(clientId)
}

function setFilter(value: 'ALL' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED') {
  filter.value = value
}

function toggleRemindersExpanded() {
  remindersExpanded.value = !remindersExpanded.value
}

function showMorePendingNotes() {
  pendingNotesVisibleLimit.value += 3
}

function clientHistoryVisibleLimit(clientId: number) {
  return clientHistoryVisibleLimits.value[clientId] || CLIENT_HISTORY_INITIAL_VISIBLE
}

function resetClientHistoryVisibleLimit(clientId: number) {
  clientHistoryVisibleLimits.value = {
    ...clientHistoryVisibleLimits.value,
    [clientId]: CLIENT_HISTORY_INITIAL_VISIBLE,
  }
}

function visibleClientHistory(clientId: number) {
  return (clientHistory.value[clientId] || []).slice(0, clientHistoryVisibleLimit(clientId))
}

function hasMoreClientHistory(clientId: number) {
  return clientHistoryVisibleLimit(clientId) < (clientHistory.value[clientId] || []).length
}

function showMoreClientHistory(clientId: number) {
  const nextLimit = clientHistoryVisibleLimit(clientId) + CLIENT_HISTORY_REVEAL_BATCH
  clientHistoryVisibleLimits.value = {
    ...clientHistoryVisibleLimits.value,
    [clientId]: nextLimit,
  }
}

function noteReminderRoute(sessionId: number) {
  return {
    path: '/cabinet/sessions',
    query: { returnTo: '/cabinet/clients' },
    hash: `#note-${sessionId}`,
  }
}

function formatDateTime(value?: string | null) {
  return formatUkDateTimeCompact(value)
}

const SESSION_STATUS_LABELS: Record<string, string> = {
  COMPLETED: '\u0417\u0430\u0432\u0435\u0440\u0448\u0435\u043d\u043e',
  CONFIRMED: '\u041f\u0456\u0434\u0442\u0432\u0435\u0440\u0434\u0436\u0435\u043d\u043e',
  SCHEDULED: '\u0417\u0430\u043f\u043b\u0430\u043d\u043e\u0432\u0430\u043d\u043e',
  CANCELLED: '\u0421\u043a\u0430\u0441\u043e\u0432\u0430\u043d\u043e',
  NO_SHOW: '\u041d\u0435 \u0432\u0456\u0434\u0431\u0443\u043b\u043e\u0441\u044f',
}

function sessionStatusLabel(status: string) {
  return SESSION_STATUS_LABELS[status] || status
}

const CLIENT_STATUS_LABELS: Record<ClientState['state'], string> = {
  CREATED: 'Неактивний',
  ACTIVE: 'Активний',
  INACTIVE: 'Неактивний',
  ARCHIVED: 'Архів',
}

function clientStatusLabel(status: ClientState['state']) {
  return CLIENT_STATUS_LABELS[status] || 'Неактивний'
}

function clientStatusClass(status: ClientState['state']) {
  if (status === 'ACTIVE') return 'client-status--active'
  if (status === 'ARCHIVED') return 'client-status--archived'
  return 'client-status--inactive'
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

function setManualActionLoading(id: number, value: boolean) {
  const next = new Set(manualActionLoading.value)
  if (value) {
    next.add(id)
  } else {
    next.delete(id)
  }
  manualActionLoading.value = next
}

function setHistoryLoading(id: number, value: boolean) {
  const next = new Set(historyLoading.value)
  if (value) {
    next.add(id)
  } else {
    next.delete(id)
  }
  historyLoading.value = next
}

function setJournalLoading(id: number, value: boolean) {
  const next = new Set(journalLoading.value)
  if (value) {
    next.add(id)
  } else {
    next.delete(id)
  }
  journalLoading.value = next
}

function setJournalSaving(id: number, value: boolean) {
  const next = new Set(journalSaving.value)
  if (value) {
    next.add(id)
  } else {
    next.delete(id)
  }
  journalSaving.value = next
}

function setQuickAddLoading(id: number, value: boolean) {
  const next = new Set(quickAddLoading.value)
  if (value) {
    next.add(id)
  } else {
    next.delete(id)
  }
  quickAddLoading.value = next
}

function setNoteSkipping(id: number, value: boolean) {
  const next = new Set(noteSkipping.value)
  if (value) {
    next.add(id)
  } else {
    next.delete(id)
  }
  noteSkipping.value = next
}

function toggleWorkbook(clientId: number) {
  workbookExpanded.value = {
    ...workbookExpanded.value,
    [clientId]: !isWorkbookExpanded(clientId),
  }
  workbookSavedMessage.value = {
    ...workbookSavedMessage.value,
    [clientId]: '',
  }
}

function openWorkbookWindow(clientId: number) {
  openClientWorkbookWindow(clientId)
}

function formatDuration(start?: string | null, end?: string | null) {
  if (!start || !end) return ''
  const s = new Date(start)
  const e = new Date(end)
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return ''
  const minutes = Math.max(0, Math.round((e.getTime() - s.getTime()) / 60000))
  if (minutes < 60) return `${minutes} хв`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest ? `${hours} год ${rest} хв` : `${hours} год`
}

function clientLabel(clientId: number) {
  const client = clientIndex.value.get(clientId)
  const fromChat = chatClientNames.value[clientId]
  if (fromChat) return fromChat
  const normalized = preferredClientName(client)
  if (normalized) return normalized
  const fromSessions = sessionClientNames.value[clientId]
  if (fromSessions) return fromSessions
  if (client?.client_code) return `Код: ${client.client_code}`
  if (clientId > 0) return `Клієнт #${clientId}`
  return '\u041a\u043b\u0456\u0454\u043d\u0442'
}
function isMetadataEndpointUnsupported(err: any) {
  const status = Number(err?.response?.status || 0)
  return status === 404 || status === 405 || status === 501
}

function listFromResponse<T>(payload: ListResponse<T>) {
  if (Array.isArray(payload)) return payload
  const withResults = payload as { results?: T[] } | null | undefined
  if (Array.isArray(withResults?.results)) return withResults.results
  return []
}

function toPositiveNumber(...candidates: Array<number | string | null | undefined>) {
  for (const candidate of candidates) {
    const value = Number(candidate)
    if (Number.isFinite(value) && value > 0) return value
  }
  return 0
}

function resolveHasWorkbookContent(
  client?: Pick<ClientState, 'has_workbook_content' | 'has_client_journal_content' | 'client_journal_content'> | null
) {
  if (!client) return false
  if (typeof client.has_workbook_content === 'boolean') return client.has_workbook_content
  if (typeof client.has_client_journal_content === 'boolean') return client.has_client_journal_content
  return Boolean((client.client_journal_content || '').trim())
}

function workbookUpdatedAt(client?: Pick<ClientState, 'workbook_updated_at' | 'client_journal_updated_at'> | null) {
  return client?.workbook_updated_at || client?.client_journal_updated_at || null
}

function workbookSummary(client: ClientListItem) {
  if (isManualClientRecord(client)) return 'Недоступний без реєстрації'
  const clientId = relationClientId(client)
  if (workbookMissingByClient.value[clientId] === true) return 'Відсутній'
  if (!resolveHasWorkbookContent(client)) return 'Відсутній'
  const updatedAt = workbookUpdatedAt(client)
  if (!updatedAt) return 'Заповнений'
  return `Заповнений, оновлено ${formatDateTime(updatedAt)}`
}

function latestNoteSummary(client: ClientListItem) {
  if (isManualClientRecord(client)) return 'Нотаток ще немає'
  if (!client.latest_session_note_at) return '\u041d\u043e\u0442\u0430\u0442\u043e\u043a \u0449\u0435 \u043d\u0435\u043c\u0430\u0454'
  return formatDateTime(client.latest_session_note_at)
}

function optionalDateLabel(value: string | null | undefined, fallback: string) {
  if (!value) return fallback
  const label = formatDateTime(value)
  return label && label !== '—' ? label : fallback
}

function clientUpdatedLabel(client: ClientListItem) {
  if (isManualClientRecord(client)) return manualClientUpdatedLabel(client)
  const value = client.workbook_updated_at || client.client_journal_updated_at || client.latest_session_note_at || client.last_session_at
  return optionalDateLabel(value, 'Немає оновлень')
}

function historyNoteSummary(item: Pick<HistoryItem, 'hasNote' | 'noteUpdatedAt'>) {
  if (!item.hasNote) return '\u041d\u043e\u0442\u0430\u0442\u043a\u0438 \u0449\u0435 \u043d\u0435\u043c\u0430\u0454.'
  if (!item.noteUpdatedAt) return '\u041d\u043e\u0442\u0430\u0442\u043a\u0430 \u0434\u043e\u0434\u0430\u043d\u0430.'
  return `\u041d\u043e\u0442\u0430\u0442\u043a\u0443 \u043e\u043d\u043e\u0432\u043b\u0435\u043d\u043e ${formatDateTime(item.noteUpdatedAt)}.`
}

function mapPendingNoteItem(source: SessionMetadataSource): PendingNoteItem | null {
  const sessionId = toPositiveNumber(source.session_id, source.session, source.id)
  const clientId = toPositiveNumber(source.client_id, source.client)
  if (!sessionId || !clientId) return null
  return {
    sessionId,
    clientId,
    slotStart: source.slot_start_at || '',
    slotEnd: source.slot_end_at || '',
    status: source.status || 'COMPLETED',
    clientName: preferredClientName(source) || undefined,
  }
}

function mapHistoryItem(source: SessionMetadataSource): HistoryItem | null {
  const sessionId = toPositiveNumber(source.session_id, source.session, source.id)
  if (!sessionId) return null
  return {
    sessionId,
    slotStart: source.slot_start_at || '',
    slotEnd: source.slot_end_at || '',
    status: source.status || 'COMPLETED',
    hasNote: Boolean(source.has_note),
    noteUpdatedAt: source.note_updated_at || null,
  }
}

function normalizeClientName(value?: string | null) {
  const name = value?.trim() || ''
  if (!name) return ''
  if (/^#?\d+$/i.test(name)) return ''
  if (/^(client|\u043a\u043b\u0456\u0454\u043d\u0442)\s*#?\d+$/i.test(name)) return ''
  return name
}

function fullName(first?: string | null, last?: string | null) {
  const merged = [first?.trim() || '', last?.trim() || ''].filter(Boolean).join(' ')
  return normalizeClientName(merged)
}

function preferredClientName(source?: NameSource | null) {
  if (!source) return ''
  const candidates = [
    source.client_display_name,
    source.display_name,
    fullName(source.client_first_name, source.client_last_name),
    fullName(source.first_name, source.last_name),
    source.client_name,
    source.client_username,
  ]
  for (const candidate of candidates) {
    const normalized = normalizeClientName(candidate)
    if (normalized) return normalized
  }
  return ''
}

function displayClientName(
  client: ClientListItem
) {
  if (isManualClientRecord(client)) return normalizeClientName(client.display_name) || `Клієнт #${client.id}`
  const id = relationClientId(client)
  const fromChat = chatClientNames.value[id]
  if (fromChat) return fromChat
  const normalized = preferredClientName(client)
  if (normalized) return normalized
  const fromSessions = sessionClientNames.value[id]
  if (fromSessions) return fromSessions
  if (client.client_code) return `Код: ${client.client_code}`
  if (id > 0) return `Клієнт #${id}`
  return '\u041a\u043b\u0456\u0454\u043d\u0442'
}

function manualClientUpdatedLabel(client: ManualClientRecord) {
  return optionalDateLabel(client.updated_at || client.created_at, 'Немає оновлень')
}

function manualClientCustomPriceLabel(client: ManualClientRecord) {
  const amount = String(client.custom_price_amount || '').trim()

  if (!amount) {
    return 'Стандартна ціна'
  }

  const currency = String(client.custom_price_currency || 'UAH').toUpperCase()
  const numericAmount = Number(amount)
  const formattedAmount = Number.isFinite(numericAmount)
    ? new Intl.NumberFormat('uk-UA', { maximumFractionDigits: 2 }).format(numericAmount)
    : amount

  return `${formattedAmount} ${currency === 'UAH' ? 'грн' : currency}`
}

async function loadChatClientNames() {
  try {
    const threads = await fetchChatThreads()
    rememberChatClientNames(Array.isArray(threads) ? threads : [])
  } catch {
    chatClientNames.value = {}
  }
}

async function loadClients() {
  clientsLoading.value = true
  clientsError.value = ''
  try {
    const resp = await apiGet<ClientState[]>('/cabinet/clients/')
    clients.value = resp || []
    const seededDrafts: Record<number, string> = { ...clientJournalDrafts.value }
    for (const item of clients.value) {
      const id = relationClientId(item)
      if (!id) continue
      workbookMissingByClient.value = {
        ...workbookMissingByClient.value,
        [id]: !resolveHasWorkbookContent(item),
      }
      if (seededDrafts[id] !== undefined) continue
      seededDrafts[id] = item.client_journal_content || ''
    }
    clientJournalDrafts.value = seededDrafts
  } catch (err: any) {
    clients.value = []
    clientsError.value = getApiErrorMessage(err, 'Спробуйте ще раз або оновіть сторінку.')
  } finally {
    clientsLoading.value = false
  }
}

async function loadManualClientRecords() {
  manualClientsWarning.value = ''
  try {
    const resp = await apiGet<ListResponse<ManualClientRecord>>('/cabinet/client-records/')
    const records = listFromResponse(resp)
    manualClientRecords.value = records
    preloadAccountInvites(records)
  } catch (err: any) {
    manualClientRecords.value = []
    manualClientsWarning.value = getApiErrorMessage(
      err,
      'Не вдалося завантажити клієнтів без реєстрації. Зареєстровані клієнти залишаються доступними.'
    )
  }
}

function resetManualClientForm() {
  manualClientForm.value = {
    display_name: '',
    email: '',
    phone: '',
    telegram: '',
    internal_note: '',
    custom_price_amount: '',
  }
  manualClientFormError.value = ''
}

function openManualClientModal() {
  manualClientEditingId.value = null
  resetManualClientForm()
  manualClientModalOpen.value = true
}

function openManualClientEditModal(client: ManualClientRecord) {
  manualClientEditingId.value = client.id
  manualClientFormError.value = ''
  manualClientForm.value = {
    display_name: client.display_name || '',
    email: client.email || '',
    phone: client.phone || '',
    telegram: client.telegram || '',
    internal_note: client.internal_note || '',
    custom_price_amount: client.custom_price_amount || '',
  }
  manualClientModalOpen.value = true
}

function closeManualClientModal() {
  if (manualClientSaving.value) return
  manualClientModalOpen.value = false
  manualClientEditingId.value = null
  resetManualClientForm()
}

function resetManualSessionForm() {
  manualSessionDraft.value = {
    slot_id: 0,
    session_format: 'online',
  }
  manualSessionError.value = ''
  manualSessionSlots.value = []
}

function formatManualSessionSlot(slot: SpecialistSlot) {
  const start = formatDateTime(slot.start_at)
  const end = formatDateTime(slot.end_at)
  if (!start || start === '—') return `Слот #${slot.id}`
  if (!end || end === '—') return start
  return `${start} — ${end}`
}

async function openManualClientSessionModal(client: ManualClientRecord) {
  if (client.status === 'archived') return

  manualSessionClient.value = client
  resetManualSessionForm()
  manualSessionModalOpen.value = true
  manualSessionSlotsLoading.value = true

  try {
    const slots = await fetchSpecialistAvailableSlots()
    manualSessionSlots.value = slots
    manualSessionDraft.value = {
      ...manualSessionDraft.value,
      slot_id: slots[0]?.id || 0,
    }
  } catch (err: any) {
    manualSessionError.value = getApiErrorMessage(err, 'Не вдалося завантажити вільні слоти.')
  } finally {
    manualSessionSlotsLoading.value = false
  }
}

function closeManualClientSessionModal() {
  if (manualSessionSaving.value) return
  manualSessionModalOpen.value = false
  manualSessionClient.value = null
  resetManualSessionForm()
}

async function submitManualClientSession() {
  const client = manualSessionClient.value
  if (!client || client.status === 'archived') return

  if (!manualSessionDraft.value.slot_id) {
    manualSessionError.value = 'Оберіть вільний слот.'
    return
  }

  manualSessionSaving.value = true
  manualSessionError.value = ''
  error.value = ''

  try {
    const created = await apiPost<ManualClientSessionCreateResponse>(
      `/cabinet/client-records/${client.id}/sessions/`,
      {
        slot_id: manualSessionDraft.value.slot_id,
        session_format: manualSessionDraft.value.session_format,
      }
    )

    const sessionId = Number(created?.id || created?.session_id || 0)

    manualSessionModalOpen.value = false
    manualSessionClient.value = null
    resetManualSessionForm()

    toast.success('Сесію для клієнта створено.')

    if (sessionId) {
      await router.push(`/cabinet/sessions/${sessionId}`)
      return
    }

    await router.push('/cabinet/sessions')
  } catch (err: any) {
    manualSessionError.value = getApiErrorMessage(err, 'Не вдалося створити сесію для клієнта.')
  } finally {
    manualSessionSaving.value = false
  }
}

function manualClientPayload() {
  const form = manualClientForm.value
  return {
    display_name: form.display_name.trim(),
    email: form.email.trim() || null,
    phone: form.phone.trim() || null,
    telegram: form.telegram.trim() || null,
    internal_note: form.internal_note.trim() || null,
    custom_price_amount: form.custom_price_amount.trim() || null,
    custom_price_currency: 'UAH',
  }
}

function manualClientErrorMessage(err: unknown, fallback: string) {
  const data = (err as { response?: { data?: any } })?.response?.data
  const raw = [
    data?.detail,
    data?.code,
    data?.non_field_errors?.[0],
    data?.display_name?.[0],
    typeof data === 'string' ? data : '',
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  if (raw.includes('limit') || raw.includes('active_client')) {
    return 'Досягнуто ліміт активних клієнтів для вашого тарифу.'
  }
  return getApiErrorMessage(err, fallback)
}

async function submitManualClient() {
  const payload = manualClientPayload()

  if (!payload.display_name) {
    manualClientFormError.value = 'Вкажіть імʼя клієнта.'
    return
  }

  const editingId = manualClientEditingId.value

  manualClientSaving.value = true
  manualClientFormError.value = ''
  error.value = ''

  try {
    const saved = editingId
      ? await apiPatch<ManualClientRecord>(`/cabinet/client-records/${editingId}/`, payload)
      : await apiPost<ManualClientRecord>('/cabinet/client-records/', payload)

    manualClientRecords.value = editingId
      ? manualClientRecords.value.map((item) => (item.id === saved.id ? saved : item))
      : [saved, ...manualClientRecords.value.filter((item) => item.id !== saved.id)]

    manualClientModalOpen.value = false
    manualClientEditingId.value = null
    resetManualClientForm()
  } catch (err: any) {
    manualClientFormError.value = manualClientErrorMessage(
      err,
      editingId ? 'Не вдалося зберегти зміни.' : 'Не вдалося додати клієнта.'
    )
  } finally {
    manualClientSaving.value = false
  }
}

async function archiveClient(id: number) {
  if (!id) return
  setActionLoading(id, true)
  error.value = ''
  try {
    await apiPatch(`/cabinet/clients/${id}/archive/`)
    await loadClients()
  } catch (err: any) {
    error.value = getApiErrorMessage(err, '\u041d\u0435 \u0432\u0434\u0430\u043b\u043e\u0441\u044f \u0430\u0440\u0445\u0456\u0432\u0443\u0432\u0430\u0442\u0438 \u043a\u043b\u0456\u0454\u043d\u0442\u0430')
  } finally {
    setActionLoading(id, false)
  }
}

async function restoreClient(id: number) {
  if (!id) return
  setActionLoading(id, true)
  error.value = ''
  try {
    await apiPatch(`/cabinet/clients/${id}/restore/`)
    await loadClients()
  } catch (err: any) {
    error.value = getApiErrorMessage(err, '\u041d\u0435 \u0432\u0434\u0430\u043b\u043e\u0441\u044f \u0432\u0456\u0434\u043d\u043e\u0432\u0438\u0442\u0438 \u043a\u043b\u0456\u0454\u043d\u0442\u0430')
  } finally {
    setActionLoading(id, false)
  }
}

async function archiveManualClient(id: number) {
  if (!id) return
  setManualActionLoading(id, true)
  error.value = ''
  try {
    const updated = await apiPost<ManualClientRecord | null>(`/cabinet/client-records/${id}/archive/`, {})
    if (updated?.id) {
      manualClientRecords.value = manualClientRecords.value.map((item) => (item.id === id ? updated : item))
    } else {
      await loadManualClientRecords()
    }
  } catch (err: any) {
    error.value = manualClientErrorMessage(err, 'Не вдалося архівувати клієнта.')
  } finally {
    setManualActionLoading(id, false)
  }
}

async function restoreManualClient(id: number) {
  if (!id) return
  setManualActionLoading(id, true)
  error.value = ''
  try {
    const updated = await apiPost<ManualClientRecord | null>(`/cabinet/client-records/${id}/restore/`, {})
    if (updated?.id) {
      manualClientRecords.value = manualClientRecords.value.map((item) => (item.id === id ? updated : item))
    } else {
      await loadManualClientRecords()
    }
  } catch (err: any) {
    error.value = manualClientErrorMessage(err, 'Не вдалося відновити клієнта.')
  } finally {
    setManualActionLoading(id, false)
  }
}

async function loadSessionsIfNeeded() {
  if (sessionsCache.value) return sessionsCache.value
  const resp = await apiGet<SessionItem[]>('/booking/sessions/')
  sessionsCache.value = resp || []
  rememberSessionClientNames(sessionsCache.value)
  return sessionsCache.value
}

async function loadPendingNotes() {
  notesLoading.value = true
  remindersError.value = ''
  try {
    try {
      const remindersResp = await apiGet<ListResponse<SessionMetadataSource>>('/cabinet/notes/reminders/')
      pendingNotes.value = listFromResponse(remindersResp)
        .map((item) => mapPendingNoteItem(item))
        .filter((item): item is PendingNoteItem => Boolean(item))
        .sort((a, b) => b.slotStart.localeCompare(a.slotStart))
    } catch (primaryErr: any) {
      if (!isMetadataEndpointUnsupported(primaryErr)) throw primaryErr
      const sessions = await loadSessionsIfNeeded()
      pendingNotes.value = sessions
        .filter((item) => item.status === 'COMPLETED' && item.has_note === false)
        .map((item) => mapPendingNoteItem(item))
        .filter((item): item is PendingNoteItem => Boolean(item))
        .sort((a, b) => b.slotStart.localeCompare(a.slotStart))
    }
  } catch (err: any) {
    pendingNotes.value = []
    remindersError.value = getApiErrorMessage(
      err,
      '\u0421\u043f\u0440\u043e\u0431\u0443\u0439\u0442\u0435 \u0449\u0435 \u0440\u0430\u0437 \u0430\u0431\u043e \u043e\u043d\u043e\u0432\u0456\u0442\u044c \u0442\u0440\u043e\u0445\u0438 \u043f\u0456\u0437\u043d\u0456\u0448\u0435.'
    )
  } finally {
    if (!remindersError.value) {
      remindersExpanded.value = false
      pendingNotesVisibleLimit.value = 3
    }
    notesLoading.value = false
  }
}

async function skipPendingNote(sessionId: number) {
  if (!sessionId) return
  setNoteSkipping(sessionId, true)
  remindersError.value = ''
  try {
    await skipSpecialistSessionNoteAction(sessionId)
    pendingNotes.value = pendingNotes.value.filter((item) => item.sessionId !== sessionId)
    if (pendingNotesVisibleLimit.value > 3 && pendingNotesVisibleLimit.value > pendingNotes.value.length) {
      pendingNotesVisibleLimit.value = Math.max(3, pendingNotes.value.length)
    }
  } catch (err: any) {
    remindersError.value = getApiErrorMessage(err, 'Не вдалося завершити крок без нотатки. Спробуйте ще раз.')
  } finally {
    setNoteSkipping(sessionId, false)
  }
}

async function loadHistory(clientId: number) {
  setHistoryLoading(clientId, true)
  setJournalLoading(clientId, true)
  error.value = ''
  resetClientHistoryVisibleLimit(clientId)
  try {
    const client = clientIndex.value.get(clientId)
    const fromClientsList = client?.client_journal_content
    const hasListValue = typeof fromClientsList === 'string'
    const hasWorkbookByMetadata = resolveHasWorkbookContent(client)
    let journalContent = hasListValue ? fromClientsList || '' : ''
    let workbookMissing = !hasWorkbookByMetadata && !Boolean(journalContent.trim())

    if (!hasListValue && hasWorkbookByMetadata) {
      const snapshot = await fetchSpecialistClientWorkbookSnapshotData(clientId)
      journalContent = snapshot.content
      workbookMissing = snapshot.isMissing
    }

    if (!hasListValue && !hasWorkbookByMetadata) {
      workbookMissing = true
    }

    clientJournalDrafts.value = { ...clientJournalDrafts.value, [clientId]: journalContent }
    workbookMissingByClient.value = { ...workbookMissingByClient.value, [clientId]: workbookMissing }

    try {
      const historyResp = await apiGet<ListResponse<SessionMetadataSource>>(
        `/cabinet/clients/${clientId}/notes/history/`,
        { params: { limit: 10 } }
      )
      clientHistory.value = {
        ...clientHistory.value,
        [clientId]: listFromResponse(historyResp)
          .map((item) => mapHistoryItem(item))
          .filter((item): item is HistoryItem => Boolean(item))
          .sort((a, b) => b.slotStart.localeCompare(a.slotStart)),
      }
    } catch (primaryErr: any) {
      if (!isMetadataEndpointUnsupported(primaryErr)) throw primaryErr
      const sessions = await loadSessionsIfNeeded()
      clientHistory.value = {
        ...clientHistory.value,
        [clientId]: sessions
          .filter((item) => relationSessionClientId(item) === clientId && item.status === 'COMPLETED')
          .map((item) => mapHistoryItem(item))
          .filter((item): item is HistoryItem => Boolean(item))
          .sort((a, b) => b.slotStart.localeCompare(a.slotStart)),
      }
    }
  } catch (err: any) {
    error.value = getApiErrorMessage(err, 'Не вдалося завантажити нотатки клієнта')
  } finally {
    setJournalLoading(clientId, false)
    setHistoryLoading(clientId, false)
  }
}

async function saveClientJournal(clientId: number) {
  if (!clientId) return
  setJournalSaving(clientId, true)
  error.value = ''
  try {
    await saveSpecialistClientJournalAction(clientId, clientJournalDrafts.value[clientId] || '')
    workbookExpanded.value = {
      ...workbookExpanded.value,
      [clientId]: false,
    }
    workbookSavedMessage.value = {
      ...workbookSavedMessage.value,
      [clientId]: 'Дані збережено.',
    }
    workbookMissingByClient.value = {
      ...workbookMissingByClient.value,
      [clientId]: !Boolean((clientJournalDrafts.value[clientId] || '').trim()),
    }
  } catch (err: any) {
    error.value = getApiErrorMessage(err, 'Не вдалося зберегти робочий зошит клієнта')
  } finally {
    setJournalSaving(clientId, false)
  }
}

function openClientPracticeBoardModal(clientId: number) {
  if (!clientId || isQuickAddLoading(clientId)) return
  quickAddDraftClientId.value = clientId
  quickAddModalError.value = ''
  quickAddModalOpen.value = true
}

function closeClientPracticeBoardModal() {
  if (isQuickAddLoading(quickAddDraftClientId.value || 0)) return
  quickAddModalError.value = ''
  quickAddModalOpen.value = false
  quickAddDraftClientId.value = null
}

async function submitClientPracticeBoardQuickAdd(title: string) {
  const clientId = quickAddDraftClientId.value || 0
  await addClientToPracticeBoard(clientId, title)
}

async function addClientToPracticeBoard(clientId: number, title: string) {
  if (!clientId || isQuickAddLoading(clientId)) return
  setQuickAddLoading(clientId, true)
  quickAddModalError.value = ''
  try {
    const boards = await fetchPracticeBoards()
    const boardId = resolveDefaultPracticeBoardId(boards)
    await createPracticeBoardItem({
      ...(boardId ? { board_id: boardId } : {}),
      title: title.trim(),
      related_client_id: clientId,
      source_type: 'manual',
    })
    quickAddModalOpen.value = false
    quickAddDraftClientId.value = null
    toast.success('\u0417\u0430\u0434\u0430\u0447\u0443 \u0434\u043e\u0434\u0430\u043d\u043e \u043d\u0430 \u0434\u043e\u0448\u043a\u0443')
  } catch (err: any) {
    quickAddModalError.value = getApiErrorMessage(
      err,
      '\u041d\u0435 \u0432\u0434\u0430\u043b\u043e\u0441\u044f \u0434\u043e\u0434\u0430\u0442\u0438 \u0437\u0430\u0434\u0430\u0447\u0443 \u043d\u0430 \u0434\u043e\u0448\u043a\u0443.'
    )
  } finally {
    setQuickAddLoading(clientId, false)
  }
}

async function toggleHistory(clientId: number) {
  if (!clientId) return
  selectRegisteredClient(clientId, false)
  const client = clientIndex.value.get(clientId)
  if (client) {
    if (isAccordionSectionOpen(client, 'privateHistory')) {
      setClientAccordionSection(client, null)
      expandedClientId.value = null
      return
    }
    setClientAccordionSection(client, 'privateHistory')
  }
  expandedClientId.value = clientId
  resetClientHistoryVisibleLimit(clientId)
  if (!clientHistory.value[clientId]) {
    await loadHistory(clientId)
  }
}

async function openClientFromDeepLinkIfNeeded() {
  const deepLinkedClientId = initialDeepLinkClientId
  if (!deepLinkedClientId) return
  const matchingClient = clients.value.find((item) => relationClientId(item) === deepLinkedClientId)
  if (!matchingClient) return

  filter.value = 'ALL'
  searchQuery.value = ''
  selectRegisteredClient(deepLinkedClientId, false)
  expandedClientId.value = deepLinkedClientId
  setClientAccordionSection(matchingClient, 'privateHistory')
  resetClientHistoryVisibleLimit(deepLinkedClientId)
  if (!clientHistory.value[deepLinkedClientId]) {
    await loadHistory(deepLinkedClientId)
  }
  await focusClientCard(deepLinkedClientId)
}

onMounted(async () => {
  await Promise.all([
    loadClients(),
    loadManualClientRecords(),
    loadChatClientNames(),
    loadSessionsIfNeeded().catch(() => []),
  ])
  await openClientFromDeepLinkIfNeeded()
  await loadPendingNotes()
})

onBeforeUnmount(() => {
  clearClientCardHighlightTimer()
})
</script>

<style scoped>
.clients {
  display: grid;
  gap: 18px;
}

.clients__hero {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  order: 0;
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

.clients__hero > * {
  position: relative;
  z-index: 1;
}

.clients__hero::after {
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

.clients__title {
  margin: 8px 0 8px;
  color: var(--pc-navy-950);
  font-size: 32px;
  line-height: 1.15;
}

.clients__subtitle {
  max-width: 520px;
  color: var(--pc-text-muted);
  line-height: 1.55;
}

.clients__hero .btn {
  border-radius: var(--pc-radius-control);
  font-weight: 700;
}

.clients__hero .btn--ghost {
  border-color: var(--pc-border);
  background: #fff;
  color: var(--pc-navy-900);
}

.panel {
  border: 1px solid var(--line);
  border-radius: var(--pc-radius-panel);
  padding: 18px;
  background: #fff;
  display: grid;
  gap: 14px;
}

.panel__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  min-width: 0;
}

.panel--clients > .panel__header {
  padding: 14px 16px;
  border: 1px solid var(--pc-border);
  border-radius: var(--pc-radius-panel);
  background:
    radial-gradient(circle at 100% 0, rgba(221, 241, 239, 0.72), transparent 36%),
    linear-gradient(145deg, rgba(255, 255, 255, 0.96), rgba(255, 250, 239, 0.78));
}

.panel--clients > .panel__header > div {
  min-width: 0;
}

.clients-add-btn {
  flex: 0 0 auto;
  min-height: 42px;
  border-radius: var(--pc-radius-control);
  border-color: var(--pc-navy-900);
  background: linear-gradient(180deg, var(--pc-navy-900), var(--pc-navy-950));
  color: #fff;
  box-shadow: none;
  font-weight: 700;
}

.clients-add-btn:hover {
  border-color: var(--pc-navy-950);
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--pc-navy-900) 92%, #000000),
    var(--pc-navy-950)
  );
  color: #fff;
}

.panel__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 22px;
}

.panel--reminders {
  order: 2;
  border-color: color-mix(in srgb, var(--line) 86%, #ffffff);
  background: color-mix(in srgb, var(--surface) 78%, #ffffff);
}

.panel--clients {
  order: 1;
}

.badge--soft {
  background: rgba(8, 113, 201, 0.12);
}

.clients-toolbar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(240px, 360px);
  gap: 14px;
  align-items: end;
  padding: 12px;
  border: 1px solid var(--pc-border);
  border-radius: var(--pc-radius-panel);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(255, 250, 239, 0.78));
  box-shadow: 0 8px 18px rgba(18, 52, 90, 0.06);
}

.clients-panel-hint {
  max-width: 620px;
  margin: 6px 0 0;
  color: var(--pc-text-muted);
  font-size: 14px;
  line-height: 1.45;
}

.filters {
  display: inline-flex;
  width: fit-content;
  gap: 5px;
  flex-wrap: wrap;
  padding: 5px;
  border: 1px solid color-mix(in srgb, var(--pc-border) 82%, #ffffff);
  border-radius: var(--radius-pill);
  background: rgba(255, 255, 255, 0.82);
}

.filters__item {
  min-height: 36px;
  border: 1px solid transparent;
  border-radius: var(--radius-pill);
  padding: 7px 12px;
  background: transparent;
  color: var(--pc-navy-900);
  font: inherit;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.18s ease, border-color 0.18s ease, color 0.18s ease, box-shadow 0.18s ease;
}

.filters__item:hover,
.filters__item:focus-visible {
  border-color: color-mix(in srgb, var(--pc-navy-900) 22%, var(--pc-border));
  background: color-mix(in srgb, var(--pc-blue-soft) 62%, #ffffff);
  color: var(--pc-navy-950);
  outline: none;
}

.filters__item.is-active {
  border-color: var(--pc-navy-900);
  background: var(--pc-navy-900);
  color: #fff;
  box-shadow: 0 8px 18px rgba(18, 52, 90, 0.16);
}

.reminders-summary {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: center;
  border: 1px solid color-mix(in srgb, var(--line) 74%, #ffffff);
  border-radius: var(--pc-radius-control);
  padding: 12px;
  background: #fff;
}

.reminders-summary__text {
  margin: 0;
  color: var(--text);
  font-weight: 600;
}

.reminders-summary__hint {
  margin: 4px 0 0;
  color: var(--muted);
  font-size: 13px;
  line-height: 1.4;
}

.history-list--reminders {
  margin-top: 10px;
}

.history-item--compact {
  padding: 10px 12px;
}

.reminders-more {
  justify-self: flex-start;
}

.clients-search {
  display: grid;
  gap: 7px;
  min-width: 0;
}

.clients-search__label {
  font-size: 12px;
  font-weight: 700;
  color: color-mix(in srgb, var(--pc-navy-900) 62%, var(--pc-text-muted));
}

.clients-search__input {
  width: 100%;
  min-height: 42px;
  border-color: color-mix(in srgb, var(--pc-border) 82%, #ffffff);
  background: rgba(255, 255, 255, 0.94);
}

.clients-search__input:focus {
  border-color: color-mix(in srgb, var(--pc-navy-900) 36%, var(--pc-border));
  box-shadow: 0 0 0 3px rgba(18, 52, 90, 0.1);
}

.clients-master-detail {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px 14px;
  align-items: start;
  margin-top: 10px;
}

.client-row {
  grid-column: 1;
  order: 0;
  width: 100%;
  min-width: 0;
  border: 1px solid color-mix(in srgb, var(--pc-border) 84%, #ffffff);
  border-radius: var(--pc-radius-control);
  padding: 11px 12px;
  background: rgba(255, 255, 255, 0.92);
  color: var(--pc-navy-900);
  display: grid;
  grid-template-columns: minmax(160px, 1.05fr) auto;
  gap: 8px 12px;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.16s ease, background 0.16s ease, box-shadow 0.16s ease;
}

.client-row:hover,
.client-row:focus-visible {
  border-color: color-mix(in srgb, var(--pc-navy-900) 28%, var(--pc-border));
  background: #fff;
  outline: none;
}

.client-row--selected {
  border-color: var(--pc-navy-900);
  background: color-mix(in srgb, var(--pc-blue-soft) 58%, #ffffff);
  box-shadow: 0 0 0 2px rgba(18, 52, 90, 0.1);
}

.client-row--targeted {
  border-color: var(--pc-navy-900);
  box-shadow:
    0 0 0 2px rgba(18, 52, 90, 0.14),
    0 8px 18px rgba(18, 52, 90, 0.08);
}

.client-row--manual {
  border-color: color-mix(in srgb, var(--pc-teal-500) 24%, var(--pc-border));
}

.client-row__main,
.client-row__meta > span {
  min-width: 0;
  display: grid;
  gap: 3px;
}

.client-row__name {
  color: var(--pc-navy-950);
  font-size: 15px;
  font-weight: 800;
  line-height: 1.25;
  overflow-wrap: anywhere;
}

.client-row__code,
.client-row__label {
  color: color-mix(in srgb, var(--pc-navy-900) 52%, var(--pc-text-muted));
  font-size: 11px;
  font-weight: 700;
}

.client-row__badges {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
  flex-wrap: wrap;
}

.client-row__meta {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: minmax(120px, 1fr) minmax(120px, 1fr) minmax(120px, 1fr);
  gap: 8px 12px;
  color: var(--pc-text-muted);
  font-size: 12px;
  line-height: 1.35;
}

.client-row__meta span span:last-child {
  color: var(--pc-navy-900);
  overflow-wrap: anywhere;
}

.client-detail {
  grid-column: 1;
  grid-row: auto;
  order: 1;
  min-width: 0;
  position: static;
  top: 14px;
  display: grid;
  gap: 12px;
}

.client-card {
  border: 1px solid var(--pc-border);
  border-radius: var(--pc-radius-panel);
  padding: 18px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(255, 253, 248, 0.94));
  display: grid;
  gap: 14px;
  align-content: start;
  box-shadow: var(--pc-shadow-soft);
  min-width: 0;
}

.client-card--targeted {
  border-color: var(--pc-navy-900);
  box-shadow:
    0 0 0 2px rgba(18, 52, 90, 0.14),
    var(--pc-shadow-soft);
}

.client-card--manual {
  border-color: color-mix(in srgb, var(--pc-teal-500) 26%, var(--pc-border));
  background:
    radial-gradient(circle at 100% 0, rgba(221, 241, 239, 0.78), transparent 34%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(255, 253, 248, 0.94));
}

.client-card__main {
  display: grid;
  gap: 13px;
  min-width: 0;
}

@media (min-width: 1180px) {
  .clients-master-detail {
    grid-template-columns: minmax(0, 1fr) minmax(360px, 480px);
  }

  .client-detail {
    grid-column: 2;
    grid-row: 1 / span 999;
    order: 0;
    position: sticky;
  }
}

.client-card__identity {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
  min-width: 0;
}

.client-badges {
  display: flex;
  flex: 0 0 auto;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 6px;
}

.client-name {
  color: var(--pc-navy-950);
  font-size: 19px;
  font-weight: 700;
  line-height: 1.18;
  overflow-wrap: anywhere;
}

.client-code {
  margin-top: 4px;
  color: var(--muted);
  font-size: 12px;
}

.client-status,
.client-account-badge {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  border-radius: var(--radius-pill);
  padding: 5px 10px;
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
}

.client-status {
  border: 1px solid transparent;
}

.client-status--active {
  border-color: color-mix(in srgb, var(--pc-navy-900) 28%, var(--line));
  background: color-mix(in srgb, var(--pc-navy-900) 10%, #ffffff);
  color: var(--pc-navy-900);
}

.client-status--inactive {
  border-color: color-mix(in srgb, var(--muted) 22%, var(--line));
  background: color-mix(in srgb, var(--muted) 8%, #ffffff);
  color: var(--muted);
}

.client-status--archived {
  border-color: color-mix(in srgb, var(--warning) 32%, var(--line));
  background: color-mix(in srgb, var(--warning) 14%, #ffffff);
  color: #8a640b;
}

.client-account-badge {
  border: 1px solid color-mix(in srgb, var(--pc-navy-900) 18%, var(--pc-border));
  background: color-mix(in srgb, var(--pc-blue-soft) 72%, #ffffff);
  color: var(--pc-navy-900);
}

.client-account-badge--manual {
  border-color: color-mix(in srgb, var(--pc-peach-200) 80%, var(--pc-border));
  background: color-mix(in srgb, var(--pc-peach-100) 82%, #ffffff);
  color: var(--pc-navy-900);
}

.client-meta {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 9px;
  margin: 0;
}

.client-meta__item {
  min-width: 0;
  border: 1px solid color-mix(in srgb, var(--pc-border) 76%, #ffffff);
  border-radius: var(--pc-radius-panel);
  padding: 10px 12px;
  background: color-mix(in srgb, var(--pc-bg-main) 72%, #ffffff);
}

.client-meta__item dt {
  margin: 0 0 5px;
  color: color-mix(in srgb, var(--pc-navy-900) 56%, var(--pc-text-muted));
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.045em;
  text-transform: uppercase;
}

.client-meta__item dd {
  margin: 0;
  color: var(--pc-navy-900);
  font-size: 13px;
  line-height: 1.35;
  overflow-wrap: anywhere;
}

.client-meta--manual {
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
}

.manual-client-note {
  border: 1px solid color-mix(in srgb, var(--pc-border) 82%, #ffffff);
  border-radius: var(--pc-radius-panel);
  padding: 11px 12px;
  background: color-mix(in srgb, var(--pc-bg-main) 82%, #ffffff);
  color: var(--pc-text-muted);
  font-size: 13px;
  line-height: 1.45;
  white-space: pre-wrap;
}

.manual-client-note__label {
  margin-bottom: 5px;
  color: color-mix(in srgb, var(--pc-navy-900) 56%, var(--pc-text-muted));
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.045em;
  text-transform: uppercase;
}

.client-actions {
  display: grid;
  gap: 8px;
  border-top: 1px solid color-mix(in srgb, var(--pc-border) 72%, #ffffff);
  padding-top: 13px;
}

.client-actions__primary,
.client-actions__secondary {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.client-actions__secondary .btn {
  min-height: 34px;
}

.client-accordion {
  display: grid;
  gap: 8px;
}

.client-accordion__section {
  min-width: 0;
  border: 1px solid color-mix(in srgb, var(--pc-border) 82%, #ffffff);
  border-radius: var(--pc-radius-card);
  background: color-mix(in srgb, var(--pc-bg-main) 84%, #ffffff);
  overflow: hidden;
}

.client-accordion__header {
  width: 100%;
  min-height: 44px;
  border: 0;
  padding: 10px 12px;
  background: transparent;
  color: var(--pc-navy-900);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  text-align: left;
  font: inherit;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
}

.client-accordion__header:hover,
.client-accordion__header:focus-visible {
  background: color-mix(in srgb, var(--pc-blue-soft) 46%, #ffffff);
  outline: none;
}

.client-accordion__header::after {
  content: '+';
  flex: 0 0 auto;
  color: var(--pc-text-muted);
  font-weight: 800;
}

.client-accordion__header[aria-expanded='true']::after {
  content: '−';
}

.client-accordion__summary {
  margin-left: auto;
  color: var(--pc-text-muted);
  font-size: 12px;
  font-weight: 600;
  line-height: 1.3;
}

.client-accordion__body {
  display: grid;
  gap: 10px;
  border-top: 1px solid color-mix(in srgb, var(--pc-border) 78%, #ffffff);
  padding: 12px;
}

.manual-account-invite {
  display: grid;
  gap: 9px;
  border: 1px solid color-mix(in srgb, var(--pc-border) 82%, #ffffff);
  border-radius: var(--pc-radius-card);
  padding: 12px;
  background: color-mix(in srgb, var(--pc-bg-main) 84%, #ffffff);
}

.manual-account-invite__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.manual-account-invite__title {
  color: var(--pc-navy-900);
  font-size: 13px;
  font-weight: 800;
}

.manual-account-invite__copy,
.manual-account-invite__hint,
.manual-account-invite__status,
.manual-account-invite__error {
  margin: 0;
  font-size: 12px;
  line-height: 1.45;
}

.manual-account-invite__copy,
.manual-account-invite__hint,
.manual-account-invite__status {
  color: var(--pc-text-muted);
}

.manual-account-invite__error {
  color: var(--pc-danger);
}

.manual-account-invite__link {
  overflow-wrap: anywhere;
  border: 1px solid color-mix(in srgb, var(--pc-border) 78%, #ffffff);
  border-radius: var(--pc-radius-control);
  padding: 8px 10px;
  background: #fff;
  color: var(--pc-navy-900);
  font-size: 12px;
  line-height: 1.4;
}

.manual-account-invite__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.manual-account-invite__cta {
  justify-self: start;
}

.client-materials {
  display: grid;
  gap: 10px;
  border: 1px solid color-mix(in srgb, var(--pc-border) 82%, #ffffff);
  border-radius: var(--pc-radius-card);
  padding: 12px;
  background: color-mix(in srgb, var(--pc-bg-main) 84%, #ffffff);
}

.client-accordion__section.manual-account-invite,
.client-accordion__section.client-materials,
.client-accordion__section.client-regular-times {
  gap: 0;
  padding: 0;
}

.client-materials__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.client-materials__title {
  font-size: 13px;
  font-weight: 800;
  color: var(--pc-navy-900);
}

.client-materials__note {
  margin: 0;
  color: var(--pc-text-muted);
  font-size: 12px;
}

.client-materials__body,
.client-materials__list,
.client-materials__create {
  display: grid;
  gap: 10px;
}

.client-material {
  border: 1px solid color-mix(in srgb, var(--pc-border) 82%, #ffffff);
  border-radius: var(--pc-radius-control);
  padding: 10px;
  display: grid;
  gap: 8px;
  background: #fff;
}

.client-material__top {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  align-items: center;
}

.client-material__type {
  font-size: 12px;
  color: var(--pc-text-muted);
}

.material-status {
  font-size: 12px;
  font-weight: 700;
}

.material-status--draft {
  color: #6b7280;
}

.material-status--published {
  color: #0a7a3f;
}

.material-status--revoked {
  color: #b45309;
}

.client-material__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.client-material__attachments {
  display: grid;
  gap: 8px;
  padding-top: 6px;
  border-top: 1px solid color-mix(in srgb, var(--pc-border) 82%, #ffffff);
}

.client-material__attachments-title {
  font-size: 12px;
  font-weight: 700;
}

.client-material__attachments-upload {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.client-material__attachments-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 6px;
}

.client-material__attachments-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}

.client-materials__create h4 {
  margin: 0;
  font-size: 13px;
}

.client-regular-times__body,
.client-regular-times__list,
.client-regular-times__form {
  display: grid;
  gap: 10px;
}

.client-regular-times__copy {
  margin: 0;
  color: var(--pc-text-muted);
  font-size: 12px;
  line-height: 1.45;
}

.client-regular-time {
  border: 1px solid color-mix(in srgb, var(--pc-border) 82%, #ffffff);
  border-radius: var(--pc-radius-control);
  padding: 10px;
  display: grid;
  gap: 8px;
  background: #fff;
}

.client-regular-time__top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
}

.client-regular-time__title {
  color: var(--pc-navy-900);
  font-size: 13px;
  font-weight: 800;
}

.client-regular-time__actions,
.client-regular-times__form-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.client-regular-times__empty {
  display: grid;
  gap: 8px;
  justify-items: start;
}

.client-regular-times__add {
  justify-self: start;
}

.regular-time-status {
  flex: 0 0 auto;
  font-size: 12px;
  font-weight: 800;
}

.regular-time-status--active {
  color: #0a7a3f;
}

.regular-time-status--paused {
  color: #b45309;
}

.client-history {
  border-top: 1px solid rgba(47, 63, 73, 0.12);
  padding-top: 12px;
  display: grid;
  gap: 10px;
}

.history-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.history-title {
  font-weight: 600;
}

.history-subtitle {
  font-size: 12px;
}

.history-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(47, 63, 73, 0.08);
  border: 1px solid rgba(47, 63, 73, 0.16);
  color: #3b4a52;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.history-list {
  display: grid;
  gap: 10px;
}

.history-list-title {
  font-weight: 600;
  margin-top: 2px;
}

.workbook-block {
  display: grid;
  gap: 8px;
  padding: 12px;
  border-radius: var(--pc-radius-card);
  border: 1px solid rgba(7, 47, 71, 0.12);
  background: rgba(7, 47, 71, 0.03);
}

.workbook-block__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}

.workbook-block__title {
  font-weight: 600;
}

.workbook-block__controls {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.workbook-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.workbook-success {
  color: #1f6f52;
  font-size: 13px;
  font-weight: 600;
}

.workbook-textarea {
  min-height: 220px;
  resize: vertical;
}

.history-item {
  padding: 8px 10px;
  border-radius: var(--pc-radius-card);
  background: #f7f8fa;
  border: 1px solid rgba(47, 63, 73, 0.08);
  display: grid;
  gap: 5px;
}

.history-item--empty {
  background: rgba(247, 248, 250, 0.65);
}

.history-item--empty .history-actions {
  margin-top: 0;
}

.history-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  font-size: 12px;
}

.history-date {
  font-weight: 600;
}

.history-status {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 20px;
  padding: 3px 8px;
  border-radius: 999px;
  border: 1px solid rgba(90, 103, 114, 0.22);
  background: rgba(90, 103, 114, 0.08);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.01em;
  text-transform: none;
  line-height: 1.2;
  color: #5a6772;
}

.history-note {
  white-space: pre-wrap;
  line-height: 1.5;
}

.history-note-summary {
  font-size: 13px;
}

.history-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.history-more {
  display: flex;
  justify-content: flex-start;
}

.btn--sm {
  padding: 6px 10px;
  font-size: 13px;
}

.form-error {
  color: #b3261e;
  background: #fdecea;
  border: 1px solid #f5c2c0;
  border-radius: var(--pc-radius-control);
  padding: 8px 10px;
}

.form-warning {
  color: var(--pc-warning);
  background: var(--pc-yellow-soft);
  border: 1px solid color-mix(in srgb, var(--pc-warning) 24%, var(--pc-border));
  border-radius: var(--pc-radius-control);
  padding: 8px 10px;
}

.manual-client-modal {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: grid;
  place-items: start center;
  padding: min(6vh, 48px) 16px 24px;
}

.manual-client-modal__backdrop {
  position: absolute;
  inset: 0;
  border: 0;
  background:
    radial-gradient(circle at 50% 0, rgba(221, 241, 239, 0.22), transparent 36%),
    rgba(18, 35, 58, 0.46);
}

.manual-client-modal__content {
  position: relative;
  width: min(720px, 100%);
  max-height: min(90vh, 820px);
  overflow: auto;
  border: 1px solid var(--pc-border);
  border-radius: var(--pc-radius-panel);
  background:
    radial-gradient(circle at 100% 0, rgba(221, 241, 239, 0.7), transparent 32%),
    var(--pc-bg-card);
  box-shadow: var(--pc-shadow-float);
  padding: 22px;
  display: grid;
  gap: 18px;
}

.manual-client-modal__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  min-width: 0;
}

.manual-client-modal__header > div {
  min-width: 0;
}

.manual-client-modal__title {
  margin: 8px 0 0;
  color: var(--pc-navy-950);
  font-family: var(--font-display);
  font-size: 26px;
  line-height: 1.16;
}

.manual-client-form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 13px;
}

.manual-client-form .field {
  min-width: 0;
}

.manual-client-form .input {
  width: 100%;
  background: rgba(255, 255, 255, 0.94);
  border-color: color-mix(in srgb, var(--pc-border) 82%, #ffffff);
}

.manual-client-form .input:focus {
  border-color: color-mix(in srgb, var(--pc-navy-900) 36%, var(--pc-border));
  box-shadow: 0 0 0 3px rgba(18, 52, 90, 0.1);
}

.manual-client-form__note {
  grid-column: 1 / -1;
}

.manual-client-form__textarea {
  min-height: 120px;
  resize: vertical;
}

.manual-client-modal__actions {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 10px;
  padding-top: 2px;
}

.manual-client-modal__actions .btn[type='submit'] {
  border-color: var(--pc-navy-900);
  background: var(--pc-navy-900);
  color: #fff;
  box-shadow: 0 12px 26px rgba(18, 52, 90, 0.18);
}

.manual-client-modal__actions .btn[type='submit']:hover {
  border-color: var(--pc-navy-950);
  background: var(--pc-navy-950);
  color: #fff;
}

.manual-payment-status {
  display: inline-flex;
  width: fit-content;
  max-width: 100%;
  align-items: center;
  border: 1px solid transparent;
  border-radius: var(--radius-pill);
  padding: 4px 8px;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.2;
}

.manual-payment-status--paid {
  background: color-mix(in srgb, var(--pc-navy-900) 10%, #ffffff);
  color: var(--pc-navy-900);
  border-color: color-mix(in srgb, var(--pc-navy-900) 25%, transparent);
}

.manual-payment-status--awaiting {
  background: var(--pc-yellow-soft);
  color: var(--pc-warning);
  border-color: color-mix(in srgb, var(--pc-warning) 26%, transparent);
}

.manual-payment-status--unpaid {
  background: var(--pc-blue-soft);
  color: var(--pc-navy-800);
}

.manual-payment-status--muted {
  background: var(--pc-blue-soft);
  color: var(--pc-text-muted);
}

@media (max-width: 860px) {
  .clients {
    gap: 16px;
  }

  .clients__hero {
    flex-direction: column;
    align-items: flex-start;
    padding: 14px 16px;
    gap: 10px;
    border-radius: var(--pc-radius-panel);
  }

  .clients__hero::after {
    display: none;
  }

  .clients__title {
    font-size: 26px;
    margin: 4px 0;
    line-height: 1.16;
  }

  .clients__subtitle {
    margin: 0;
    font-size: 13px;
    line-height: 1.32;
    max-width: 100%;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .hero-back-link {
    display: none;
  }

  .clients-toolbar {
    grid-template-columns: 1fr;
  }

  .panel--clients > .panel__header {
    flex-wrap: wrap;
  }

  .clients-add-btn {
    max-width: 100%;
  }

  .filters {
    width: 100%;
  }

  .filters__item {
    flex: 1 1 auto;
  }

  .reminders-summary {
    align-items: flex-start;
    flex-direction: column;
  }

  .client-card__identity {
    flex-direction: column;
  }

  .client-badges {
    justify-content: flex-start;
  }

  .client-meta {
    grid-template-columns: 1fr;
  }

  .manual-client-modal {
    padding: 14px;
    place-items: start center;
  }

  .manual-client-modal__content {
    max-height: calc(100vh - 28px);
    padding: 18px;
    border-radius: var(--pc-radius-panel);
  }

  .manual-client-modal__header {
    flex-direction: column;
  }

  .manual-client-modal__title {
    font-size: 23px;
  }

  .manual-client-form {
    grid-template-columns: 1fr;
  }

  .manual-client-modal__actions {
    flex-direction: column;
  }

  .manual-client-modal__actions .btn {
    width: 100%;
  }
}

@media (max-width: 640px) {
  .clients-master-detail {
    grid-template-columns: 1fr;
  }

  .client-row,
  .client-detail {
    grid-column: 1;
    grid-row: auto;
  }

  .client-detail {
    order: 0;
    position: static;
  }
}

@media (max-width: 520px) {
  .clients {
    gap: 14px;
  }

  .clients__hero {
    padding: 12px 14px;
    gap: 10px;
    border-radius: var(--pc-radius-panel);
  }

  .clients__title {
    font-size: 24px;
    margin: 4px 0;
    line-height: 1.16;
  }

  .clients__subtitle {
    margin: 0;
    font-size: 13px;
    line-height: 1.35;
    max-width: 100%;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .panel {
    padding: 14px;
    gap: 12px;
  }

  .panel--clients > .panel__header {
    flex-direction: column;
    align-items: flex-start;
    padding: 10px 12px;
    gap: 10px;
  }

  .clients-add-btn {
    width: 100%;
  }

  .clients-toolbar {
    padding: 10px;
    gap: 10px;
  }

  .client-row {
    grid-template-columns: 1fr;
  }

  .client-row__badges {
    justify-content: flex-start;
  }

  .client-row__meta {
    grid-template-columns: 1fr;
  }

  .hero-back-link {
    display: none;
  }
}
</style>
