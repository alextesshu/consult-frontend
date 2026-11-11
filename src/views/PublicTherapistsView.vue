<template>
  <section v-if="uiV2" ref="discoveryRoot" class="pc2-discovery" :class="{ 'is-reduced': motionReduced, 'is-hidden': motionHidden }" :data-placeholder-index="placeholderIndex" :data-placeholder-shown="placeholderShown" :data-results-ready="cardsReady">
    <header class="pc2-discovery__hero" :class="{ 'is-landing': Boolean(landing) }">
      <h1>{{ landing?.heading || 'Знайдіть спеціаліста для вашого запиту' }}</h1>
      <p>{{ landing?.intro || 'Опишіть своїми словами або оберіть тему.' }} <span>Перше звернення — без реєстрації.</span></p>
    </header>

    <div class="pc2-discovery__bar">
    <div class="pc2-discovery__bar-row">
      <form v-if="mode === 'request'" class="pc2-discovery__search" @submit.prevent="submitQuery">
        <label class="pc2-discovery__sr-only" for="discovery-query">Опишіть запит своїми словами</label>
        <div class="pc2-discovery__search-row">
          <div class="pc2-discovery__field">
            <input id="discovery-query" v-model="queryDraft" type="text" autocomplete="off" enterkeyhint="search" :aria-invalid="fieldError?.field === 'q' ? 'true' : undefined" :aria-describedby="fieldError?.field === 'q' ? 'discovery-query-error' : 'discovery-query-hint'" @focus="focusSearch" @blur="blurSearch">
            <span class="pc2-discovery__placeholder" aria-hidden="true" :class="{ 'is-off': !placeholderShown || Boolean(queryDraft) }">{{ discoveryPlaceholders[placeholderIndex] }}</span>
          </div>
          <button type="submit" class="pc2-btn pc2-btn--primary">Знайти</button>
        </div>
        <p id="discovery-query-hint" class="pc2-discovery__sr-only">Введіть від 3 до 240 символів і натисніть «Знайти». Приклади не заповнюють поле.</p>
        <p v-if="fieldError?.field === 'q'" id="discovery-query-error" class="pc2-discovery__error" role="alert">{{ fieldError.detail }}</p>
      </form>
      <p v-else class="pc2-discovery__bar-mode">Пошук за професійним напрямом</p>
      <button ref="filtersTrigger" class="pc2-discovery__filters-toggle" type="button" aria-haspopup="dialog" aria-controls="discovery-filter-sheet" :aria-expanded="filtersOpen" :aria-label="activeFilterCount ? `Фільтри, активних: ${activeFilterCount}` : 'Фільтри'" @click="filtersOpen = true">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M7 12h10M10 17h4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" /></svg>
        <span v-if="activeFilterCount" class="pc2-discovery__filters-count" aria-hidden="true">{{ activeFilterCount }}</span>
      </button>
    </div>

    <section class="pc2-discovery__filters" aria-label="Пошук спеціалістів">
      <div v-if="mode === 'request'" class="pc2-discovery__topics pc2-chips" role="group" aria-label="Оберіть запит">
        <button v-for="option in REQUEST_GROUP_OPTIONS" :key="option.code" type="button" :aria-pressed="requestGroup === option.code" @click="setRequestGroup(requestGroup === option.code ? null : option.code)">{{ option.label }}</button>
      </div>
      <fieldset v-else class="pc2-discovery__directions">
        <legend>Оберіть професійний напрям</legend>
        <div class="pc2-discovery__topics pc2-chips">
          <template v-for="option in DIRECTION_OPTIONS" :key="option.code">
            <RouterLink v-if="isPsychologicalSupportLink(option.code)" :to="PSYCHOLOGICAL_SUPPORT_LANDING.path">{{ option.label }}</RouterLink>
            <label v-else><input name="specialist-direction" :value="option.code" type="radio" :checked="direction === option.code" @change="setDirection(option.code)">{{ option.label }}</label>
          </template>
        </div>
      </fieldset>
      <div class="pc2-discovery__filter-row">
        <fieldset class="pc2-discovery__formats pc2-chips">
          <legend class="pc2-discovery__sr-only">Формат</legend>
          <label><input name="specialist-format" type="radio" :checked="format === null" @change="setFormat(null)">Усі формати</label>
          <label><input name="specialist-format" type="radio" :checked="format === 'online'" @change="setFormat('online')">Онлайн</label>
          <label><input name="specialist-format" type="radio" :checked="format === 'offline'" @change="setFormat('offline')">Офлайн</label>
        </fieldset>
        <fieldset class="pc2-discovery__modes">
          <legend class="pc2-discovery__sr-only">Спосіб пошуку</legend>
          <label><input name="specialist-discovery-mode" type="radio" :checked="mode === 'request'" @change="setMode('request')">За запитом</label>
          <label><input name="specialist-discovery-mode" type="radio" :checked="mode === 'direction'" @change="setMode('direction')" aria-label="За професійним напрямом">За напрямом</label>
        </fieldset>
        <button v-if="hasActiveSearch" class="pc2-discovery__reset" type="button" @click="reset">Скинути пошук</button>
      </div>
      <p v-if="fieldError && fieldError.field !== 'q'" class="pc2-discovery__error" role="alert">{{ fieldError.detail }}</p>
      <RouterLink v-if="landing" class="pc2-discovery__broad" to="/specialists">{{ landing.broadDiscoveryLinkLabel }}</RouterLink>
    </section>
    </div>

    <section class="pc2-discovery__results" :aria-busy="loading" aria-label="Результати пошуку">
      <p v-if="isPendingDirection">Оберіть професійний напрям, щоб переглянути спеціалістів.</p>
      <template v-else>
        <div class="pc2-discovery__result-heading">
          <div>
            <span v-if="loading" class="pc2-discovery__listen" aria-hidden="true"><span v-for="ring in 2" :key="ring" class="pc2-discovery__ring" :style="{ animationDelay: `${(ring - 1) * .9}s` }"></span><img :src="discoveryFennec" alt="" width="32" height="32"></span>
            <h2 aria-live="polite" aria-atomic="true">{{ loading ? 'Завантажуємо спеціалістів…' : specialistCount(response?.total ?? 0) }}</h2>
          </div>
          <p>Порядок результатів не є рейтингом.</p>
        </div>
        <div class="pc2-discovery__result-state" :class="{ 'is-loading': loading }">
          <LoadingSkeleton v-if="loading" variant="card" :count="3" height="220px" />
          <div v-else-if="requestError" class="pc2-discovery__empty" role="alert"><h3>Не вдалося завантажити спеціалістів</h3><p>{{ requestError }}</p><button class="pc2-btn" type="button" @click="retry">Спробувати ще раз</button></div>
          <div v-else-if="response && response.total === 0" class="pc2-discovery__empty" role="status"><img :src="discoveryFennec" alt="" width="56" height="56"><h3>{{ hasActiveSearch ? 'За вашим запитом поки немає результатів' : 'Каталог спеціалістів поки порожній' }}</h3><p>{{ hasActiveSearch ? 'Спробуйте змінити категорію, опис запиту або формат роботи.' : 'Поверніться сюди трохи пізніше.' }}</p><button v-if="hasActiveSearch" class="pc2-btn" type="button" @click="reset">Скинути пошук</button></div>
          <template v-else-if="response && !fieldError">
            <section v-for="group in visibleGroups" :key="group.code" class="pc2-discovery__group" :aria-labelledby="`group-${group.code}`">
              <div v-if="group.code !== 'all_specialists'" class="pc2-discovery__group-heading"><h3 :id="`group-${group.code}`">{{ group.label }}</h3><span>{{ group.total }}</span></div>
              <h3 v-else :id="`group-${group.code}`" class="pc2-discovery__sr-only">{{ group.label }}</h3>
              <div class="pc2-discovery__list" :data-revealed="cardsReady" :inert="cardsReady ? undefined : true">
                <PublicSpecialistCard v-for="(item, index) in group.items" :key="item.public_profile_path || item.public_slug || item.slug" :item="item" :style="{ '--pc2-discovery-card-delay': `${Math.min(index, 5) * .08}s` }" />
              </div>
            </section>
          </template>
        </div>
      </template>
    </section>

    <aside class="pc2-discovery__help" aria-label="Як звернутися до спеціаліста">
      <section class="pc2-discovery__optional"><div><h2>Кабінет клієнта — за бажанням</h2><p>Звернутися можна й без нього. З кабінетом зручніше:</p></div><ul><li>Переглядати свої сесії</li><li>Читати окремо опубліковані матеріали спеціаліста</li><li>Керувати налаштуваннями облікового запису</li></ul><RouterLink class="pc2-btn" to="/signup-client">Створити кабінет</RouterLink></section>
      <section class="pc2-discovery__guide"><h2>Як це працює</h2><ol><li>Відкрийте сторінку спеціаліста й познайомтесь із підходом.</li><li>Залиште запит — можна без вибору часу.</li><li>Спеціаліст відповість і запропонує зустріч.</li></ol></section>
      <section class="pc2-discovery__lookup">
        <button class="pc2-discovery__lookup-toggle" type="button" :aria-expanded="lookupOpen" aria-controls="discovery-lookup-panel" @click="lookupOpen = !lookupOpen"><span><strong>Шукаєте конкретного спеціаліста?</strong><small>За ім’ям або посиланням на профіль</small></span><span class="pc2-discovery__plus" aria-hidden="true">+</span></button>
        <div id="discovery-lookup-panel" class="pc2-discovery__lookup-panel" :class="{ 'is-open': lookupOpen }" :aria-hidden="!lookupOpen" :inert="lookupOpen ? undefined : true"><div>
          <form @submit.prevent="submitLegacySearch"><label class="pc2-discovery__sr-only" for="legacy-specialist-search">Ім’я або посилання</label><div class="pc2-discovery__lookup-row"><input id="legacy-specialist-search" v-model="legacyQuery" type="text" placeholder="Ім’я або proconsult.space/s/…" autocomplete="off"><button class="pc2-btn pc2-btn--primary" type="submit">Знайти профіль</button></div><p v-if="legacyValidation" class="pc2-discovery__error" role="alert">{{ legacyValidation }}</p></form>
          <LoadingSkeleton v-if="legacyLoading" variant="card" :count="2" height="150px" />
          <EmptyState v-else-if="legacyError" title="Не вдалося виконати пошук" description="Спробуйте ще раз трохи пізніше."><template #actions><button class="pc2-btn" type="button" @click="retryLegacySearch">Спробувати ще раз</button></template></EmptyState>
          <EmptyState v-else-if="legacySearched && legacyResults.length === 0" title="Профіль не знайдено" description="Перевірте написання або попросіть спеціаліста надіслати пряме посилання." />
          <div v-else-if="legacyResults.length" class="pc2-discovery__lookup-results"><PublicSpecialistCard v-for="item in legacyResults" :key="item.public_profile_path || item.public_slug || item.slug" :item="item" /></div>
        </div></div>
      </section>
    </aside>

    <Teleport to="body">
      <div class="pc2-discovery-sheet" :class="{ 'is-open': filtersOpen, 'is-reduced': motionReduced }">
        <div class="pc2-discovery-sheet__backdrop" aria-hidden="true" @click="filtersOpen = false"></div>
        <div id="discovery-filter-sheet" ref="filtersPanel" class="pc2-discovery-sheet__panel" role="dialog" aria-modal="true" aria-labelledby="discovery-filter-title" tabindex="-1" :aria-hidden="filtersOpen ? undefined : 'true'" :inert="filtersOpen ? undefined : true">
          <div class="pc2-discovery-sheet__handle" aria-hidden="true"><span></span></div>
          <div class="pc2-discovery-sheet__head"><h2 id="discovery-filter-title">Фільтри</h2><button type="button" :disabled="!hasActiveSearch" @click="reset">Скинути</button></div>
          <div class="pc2-discovery-sheet__body">
            <fieldset>
              <legend>Спосіб пошуку</legend>
              <div class="pc2-discovery-sheet__options">
                <label><input name="sheet-discovery-mode" type="radio" :checked="mode === 'request'" @change="setMode('request')">За запитом</label>
                <label><input name="sheet-discovery-mode" type="radio" :checked="mode === 'direction'" @change="setMode('direction')">За напрямом</label>
              </div>
            </fieldset>
            <fieldset>
              <legend>Формат</legend>
              <div class="pc2-discovery-sheet__options">
                <label><input name="sheet-format" type="radio" :checked="format === 'online'" @change="setFormat('online')">Онлайн</label>
                <label><input name="sheet-format" type="radio" :checked="format === 'offline'" @change="setFormat('offline')">Офлайн</label>
                <label><input name="sheet-format" type="radio" :checked="format === null" @change="setFormat(null)">Будь-який</label>
              </div>
            </fieldset>
          </div>
          <div class="pc2-discovery-sheet__foot"><button class="pc2-btn pc2-btn--primary" type="button" @click="filtersOpen = false">{{ sheetSubmitLabel }}</button></div>
        </div>
      </div>
    </Teleport>
  </section>

  <section v-else class="discovery-page" :class="{ 'pc2-discovery': uiV2 }">
    <header class="discovery-page__hero">
      <div class="discovery-page__hero-copy">
        <h1 class="title">{{ landing?.heading || 'Знайдіть спеціаліста для вашого запиту' }}</h1>
        <p class="muted">{{ landing?.intro || 'Оберіть напрям або опишіть своїми словами, з чим хочете звернутися.' }}</p>
        <p v-if="uiV2" class="pc2-discovery__guest">Перше звернення — без реєстрації.</p>
      </div>
      <RouterLink v-if="landing" class="btn btn--ghost hero-home-link" to="/specialists">{{ landing.broadDiscoveryLinkLabel }}</RouterLink>
      <RouterLink v-else class="btn btn--ghost hero-home-link" to="/">← На головну</RouterLink>
    </header>

    <form v-if="uiV2 && mode === 'request'" class="query-form pc2-discovery__search" @submit.prevent="submitQuery">
      <label for="discovery-query">Опишіть запит своїми словами</label>
      <div class="query-form__row">
        <input id="discovery-query" v-model="queryDraft" class="input pc2-input" type="text" placeholder="Наприклад: не можу впоратися з тривогою" :aria-invalid="fieldError?.field === 'q' ? 'true' : undefined" :aria-describedby="fieldError?.field === 'q' ? 'discovery-query-error' : undefined" />
        <button class="btn pc2-btn pc2-btn--primary" type="submit">Знайти</button>
      </div>
      <p v-if="fieldError?.field === 'q'" id="discovery-query-error" class="form-error" role="alert">{{ fieldError.detail }}</p>
    </form>

    <section class="discovery-controls" aria-label="Пошук спеціалістів">
      <div class="discovery-controls__toolbar">
        <fieldset class="control-group">
          <legend>Спосіб пошуку</legend>
          <div class="segmented-control segmented-control--modes" :class="{ 'pc2-chips': uiV2 }">
            <label><input name="specialist-discovery-mode" value="request" type="radio" :checked="mode === 'request'" @change="setMode('request')" />За запитом</label>
            <label><input name="specialist-discovery-mode" value="direction" type="radio" aria-label="За професійним напрямом" :checked="mode === 'direction'" @change="setMode('direction')" /><span class="control-label--full" aria-hidden="true">За професійним напрямом</span><span class="control-label--short" aria-hidden="true">За напрямом</span></label>
          </div>
        </fieldset>

        <fieldset class="control-group">
          <legend>Формат</legend>
          <div class="segmented-control segmented-control--format" :class="{ 'pc2-chips': uiV2 }">
            <label><input name="specialist-format" value="" type="radio" aria-label="Усі формати" :checked="format === null" @change="setFormat(null)" /><span class="control-label--full" aria-hidden="true">Усі формати</span><span class="control-label--short" aria-hidden="true">Усі</span></label>
            <label><input name="specialist-format" value="online" type="radio" :checked="format === 'online'" @change="setFormat('online')" />Онлайн</label>
            <label><input name="specialist-format" value="offline" type="radio" :checked="format === 'offline'" @change="setFormat('offline')" />Офлайн</label>
          </div>
        </fieldset>
      </div>

      <template v-if="mode === 'request'">
        <fieldset class="control-group">
          <legend>Оберіть запит</legend>
          <div class="choice-list request-group-controls__desktop" :class="{ 'pc2-chips': uiV2 }">
            <label v-for="option in REQUEST_GROUP_OPTIONS" :key="option.code" class="choice-button">
              <input name="specialist-request-group" :value="option.code" type="radio" :checked="requestGroup === option.code" @change="setRequestGroup(option.code)" />
              <span>{{ option.label }}</span>
            </label>
            <button v-if="requestGroup" class="btn btn--ghost choice-list__clear" type="button" @click="setRequestGroup(null)">Очистити категорію</button>
          </div>
          <label class="request-group-controls__mobile" for="specialist-request-group-select">
            <span>Оберіть категорію запиту</span>
            <select id="specialist-request-group-select" class="input" :value="requestGroup || ''" @change="setRequestGroupFromSelect">
              <option value="">Усі запити</option>
              <option v-for="option in REQUEST_GROUP_OPTIONS" :key="option.code" :value="option.code">{{ option.label }}</option>
            </select>
          </label>
        </fieldset>
        <form v-if="!uiV2" class="query-form" @submit.prevent="submitQuery">
          <label for="discovery-query">Опишіть запит своїми словами</label>
          <div class="query-form__row">
            <input id="discovery-query" v-model="queryDraft" class="input" type="text" placeholder="Наприклад: не можу впоратися з тривогою" :aria-invalid="fieldError?.field === 'q' ? 'true' : undefined" :aria-describedby="fieldError?.field === 'q' ? 'discovery-query-error' : undefined" />
            <button class="btn" type="submit">Знайти</button>
          </div>
          <p v-if="fieldError?.field === 'q'" id="discovery-query-error" class="form-error">{{ fieldError.detail }}</p>
        </form>
      </template>

      <fieldset v-else class="control-group">
        <legend>Оберіть професійний напрям</legend>
        <div class="choice-list" :class="{ 'pc2-chips': uiV2 }">
          <template v-for="option in DIRECTION_OPTIONS" :key="option.code">
            <RouterLink
              v-if="isPsychologicalSupportLink(option.code)"
              class="choice-button"
              :to="PSYCHOLOGICAL_SUPPORT_LANDING.path"
            >
              <span>{{ option.label }}</span>
            </RouterLink>
            <label v-else class="choice-button">
              <input name="specialist-direction" :value="option.code" type="radio" :checked="direction === option.code" @change="setDirection(option.code)" />
              <span>{{ option.label }}</span>
            </label>
          </template>
        </div>
      </fieldset>

      <div v-if="hasActiveSearch" class="active-search">
        <span>{{ activeSearchSummary }}</span>
        <button class="btn btn--ghost" type="button" @click="reset">Скинути пошук</button>
      </div>
      <p v-if="fieldError && fieldError.field !== 'q'" class="form-error" role="alert">
        {{ fieldError.detail }}
      </p>
      <details v-if="!uiV2" class="legacy-lookup">
        <summary>Знайти конкретного спеціаліста</summary>
        <div class="legacy-lookup__content">
          <p class="muted">Введіть ім’я спеціаліста або вставте частину посилання на його публічний профіль.</p>
          <form class="query-form" @submit.prevent="submitLegacySearch">
            <label for="legacy-specialist-search">Ім’я або посилання</label>
            <div class="query-form__row"><input id="legacy-specialist-search" v-model="legacyQuery" class="input" type="text" autocomplete="off" /><button class="btn" type="submit">Знайти профіль</button></div>
            <p v-if="legacyValidation" class="form-error">{{ legacyValidation }}</p>
          </form>
          <LoadingSkeleton v-if="legacyLoading" variant="card" :count="2" height="150px" />
          <EmptyState v-else-if="legacyError" title="Не вдалося виконати пошук" description="Спробуйте ще раз трохи пізніше."><template #actions><button class="btn btn--ghost" type="button" @click="retryLegacySearch">Спробувати ще раз</button></template></EmptyState>
          <EmptyState v-else-if="legacySearched && legacyResults.length === 0" title="Профіль не знайдено" description="Перевірте написання або попросіть спеціаліста надіслати пряме посилання." />
          <div v-else-if="legacyResults.length" class="result-list legacy-lookup__results"><PublicSpecialistCard v-for="item in legacyResults" :key="item.public_profile_path || item.public_slug || item.slug" :item="item" /></div>
        </div>
      </details>
    </section>

    <section class="results" :aria-busy="loading" aria-live="polite">
      <p v-if="isPendingDirection" class="direction-pending">Оберіть професійний напрям, щоб переглянути спеціалістів.</p>
      <template v-else>
        <div class="results__header">
          <div>
            <h2>{{ specialistCount(response?.total ?? 0) }}</h2>
            <p class="muted">Порядок результатів не є рейтингом.</p>
          </div>
        </div>

        <LoadingSkeleton v-if="loading" variant="card" :count="3" height="176px" />
        <EmptyState v-else-if="requestError" title="Не вдалося завантажити спеціалістів" :description="requestError">
          <template #actions><button class="btn btn--ghost" type="button" @click="retry">Спробувати ще раз</button></template>
        </EmptyState>
        <EmptyState v-else-if="response && response.total === 0" :title="hasActiveSearch ? 'За вашим запитом поки немає результатів' : 'Каталог спеціалістів поки порожній'" :description="hasActiveSearch ? 'Спробуйте змінити категорію, опис запиту або формат роботи.' : 'Поверніться сюди трохи пізніше.'">
          <template v-if="hasActiveSearch" #actions><button class="btn btn--ghost" type="button" @click="reset">Скинути пошук</button></template>
        </EmptyState>
        <template v-else>
          <section v-for="group in visibleGroups" :key="group.code" class="result-group" :aria-labelledby="`group-${group.code}`">
            <div class="result-group__header">
              <h2 :id="`group-${group.code}`">{{ group.label }}</h2>
              <span class="muted">{{ group.total }}</span>
            </div>
            <div class="result-list">
              <PublicSpecialistCard v-for="item in group.items" :key="item.public_profile_path || item.public_slug || item.slug" :item="item" />
            </div>
          </section>
        </template>
      </template>
    </section>

    <aside v-if="uiV2" class="pc2-discovery__help" aria-label="Як звернутися до спеціаліста">
      <section class="pc2-discovery__optional">
        <h2>Кабінет клієнта — за бажанням</h2>
        <p>Звернутися до спеціаліста можна без реєстрації. Кабінет допомагає зберігати вашу роботу в одному місці.</p>
        <RouterLink class="pc2-btn" to="/signup-client">Створити кабінет</RouterLink>
      </section>
      <section class="pc2-discovery__guide">
        <h2>Як це працює</h2>
        <ol>
          <li>Відкрийте сторінку спеціаліста й познайомтесь із підходом.</li>
          <li>Залиште запит — можна без вибору часу.</li>
          <li>Спеціаліст відповість і запропонує зустріч.</li>
        </ol>
      </section>
      <section class="pc2-discovery__lookup">
        <details class="legacy-lookup">
          <summary>Знайти конкретного спеціаліста</summary>
          <div class="legacy-lookup__content">
            <p class="muted">Введіть ім’я спеціаліста або вставте частину посилання на його публічний профіль.</p>
            <form class="query-form" @submit.prevent="submitLegacySearch">
              <label for="legacy-specialist-search">Ім’я або посилання</label>
              <div class="query-form__row"><input id="legacy-specialist-search" v-model="legacyQuery" class="input" type="text" autocomplete="off" /><button class="btn" type="submit">Знайти профіль</button></div>
              <p v-if="legacyValidation" class="form-error">{{ legacyValidation }}</p>
            </form>
            <LoadingSkeleton v-if="legacyLoading" variant="card" :count="2" height="150px" />
            <EmptyState v-else-if="legacyError" title="Не вдалося виконати пошук" description="Спробуйте ще раз трохи пізніше."><template #actions><button class="btn btn--ghost" type="button" @click="retryLegacySearch">Спробувати ще раз</button></template></EmptyState>
            <EmptyState v-else-if="legacySearched && legacyResults.length === 0" title="Профіль не знайдено" description="Перевірте написання або попросіть спеціаліста надіслати пряме посилання." />
            <div v-else-if="legacyResults.length" class="result-list legacy-lookup__results"><PublicSpecialistCard v-for="item in legacyResults" :key="item.public_profile_path || item.public_slug || item.slug" :item="item" /></div>
          </div>
        </details>
      </section>
    </aside>

  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { fetchPublicSpecialists, type PublicSpecialistProfile } from '../lib/api'
import PublicSpecialistCard from '../components/PublicSpecialistCard.vue'
import EmptyState from '../components/EmptyState.vue'
import LoadingSkeleton from '../components/LoadingSkeleton.vue'
import { DIRECTION_OPTIONS, REQUEST_GROUP_OPTIONS, useSpecialistDiscovery } from '../composables/useSpecialistDiscovery'
import { markClientAcquisitionDiscoveryUsed } from '../lib/clientAcquisitionAttribution'
import { productAnalytics } from '../lib/productAnalytics'
import { applyPublicPageMetadata, resetPublicPageMetadata } from '../lib/publicMetadata'
import { isUiV2 } from '../lib/uiVersion'
import { discoveryPlaceholders, useDiscoveryMotion } from '../composables/useDiscoveryMotion'
import { useMobileOverlay } from '../composables/useMobileOverlay'
import discoveryFennec from '../assets/brand-v2/proconsult-fennec-symbol-blue.svg'
import { PSYCHOLOGICAL_SUPPORT_LANDING } from '../lib/specialistDiscoveryLanding'

const uiV2 = computed(isUiV2)
const discovery = useSpecialistDiscovery()
const route = useRoute()
const landing = computed(() => (
  route.meta.discoveryLanding === PSYCHOLOGICAL_SUPPORT_LANDING.code
    ? PSYCHOLOGICAL_SUPPORT_LANDING
    : null
))
const isPsychologicalSupportLanding = computed(() => Boolean(landing.value))
markClientAcquisitionDiscoveryUsed()
productAnalytics.capture('specialist_discovery_opened')
const { mode, queryDraft, requestGroup, direction, format, response, loading, fieldError, requestError, hasActiveSearch, isPendingDirection, submitQuery, setMode, setRequestGroup, setDirection, setFormat, reset, retry } = discovery
const discoveryRoot = ref<HTMLElement | null>(null)
const lookupOpen = ref(false)
const { placeholderIndex, placeholderShown, reduced: motionReduced, hidden: motionHidden, cardsReady, focus: focusSearch, blur: blurSearch } = useDiscoveryMotion({ active: () => uiV2.value, query: () => queryDraft.value, loading: () => loading.value, root: discoveryRoot })
// Public-Mobile.dc.html P4: only filters the discovery API supports live in the sheet.
const filtersOpen = ref(false)
const filtersTrigger = ref<HTMLElement | null>(null)
const filtersPanel = ref<HTMLElement | null>(null)
useMobileOverlay({ open: filtersOpen, panel: filtersPanel, trigger: filtersTrigger })
const activeFilterCount = computed(() => (format.value ? 1 : 0) + (mode.value === 'direction' ? (direction.value ? 1 : 0) : (requestGroup.value ? 1 : 0)))
const sheetSubmitLabel = computed(() => {
  if (isPendingDirection.value) return 'Оберіть професійний напрям'
  if (loading.value || !response.value) return 'Оновлюємо результати…'
  return `Показати ${specialistCount(response.value.total)}`
})
watch(() => route.path, () => { filtersOpen.value = false })
const legacyQuery = ref('')
const legacyLoading = ref(false)
const legacyError = ref(false)
const legacySearched = ref(false)
const legacyValidation = ref('')
const legacyLastQuery = ref('')
const legacyResults = ref<PublicSpecialistProfile[]>([])

function applyDirectoryMetadata() {
  const filtered = ['q', 'request_group', 'direction', 'format', 'mode', 'page'].some((key) => {
    const value = route.query[key]
    return Array.isArray(value) ? value.some(Boolean) : Boolean(value)
  })
  const origin = window.location.origin
  const landingMetadata = landing.value
  applyPublicPageMetadata({
    title: landingMetadata?.title || 'Знайти спеціаліста | Pro Consult',
    description: landingMetadata?.description || 'Знайдіть спеціаліста за запитом або професійним напрямом.',
    canonicalUrl: `${origin}${landingMetadata?.path || '/specialists'}`,
    ogType: 'website',
    imageUrl: `${origin}/og-image.png?v=20260707`,
    imageAlt: 'Pro Consult',
    robots: filtered ? 'noindex, follow' : undefined,
  })
}

function isPsychologicalSupportLink(code: string) {
  return (
    !isPsychologicalSupportLanding.value
    && code === PSYCHOLOGICAL_SUPPORT_LANDING.direction
  )
}

const visibleGroups = computed(() => (response.value?.groups || []).filter((group) => group.items.length > 0))
const trackedDiscoveryResultStates = new Set<string>()
const activeSearchSummary = computed(() => {
  if (mode.value === 'direction') return direction.value ? 'Пошук за професійним напрямом' : format.value ? 'Активний фільтр формату' : ''
  if (queryDraft.value || requestGroup.value) return 'Активний пошук за запитом'
  return format.value ? 'Активний фільтр формату' : ''
})

function setRequestGroupFromSelect(event: Event) {
  const value = (event.target as HTMLSelectElement).value
  void setRequestGroup(value ? value as typeof requestGroup.value : null)
}

function specialistCount(total: number) {
  const lastTwoDigits = total % 100
  const lastDigit = total % 10
  const label = lastTwoDigits >= 11 && lastTwoDigits <= 14
    ? 'спеціалістів'
    : lastDigit === 1
      ? 'спеціаліст'
      : lastDigit >= 2 && lastDigit <= 4
        ? 'спеціалісти'
        : 'спеціалістів'
  return `${total} ${label}`
}

function profileSlugFromPath(pathname: string) {
  const match = pathname.match(/^\/s\/([^/?#]+)\/?$/)
  return match?.[1] ? decodeURIComponent(match[1]).trim() : ''
}

function normalizeLegacyQuery(value: string) {
  const query = value.trim()
  if (!query) return ''
  if (query.startsWith('/s/')) return profileSlugFromPath(query) || query
  try { return profileSlugFromPath(new URL(query).pathname) || query } catch { /* Try a domain-prefixed URL. */ }
  if (/^[\w.-]+\/s\/[^/?#\s]+\/?(?:[?#].*)?$/.test(query)) {
    try { return profileSlugFromPath(new URL(`https://${query}`).pathname) || query } catch { return query }
  }
  return query
}

async function runLegacySearch(query: string) {
  legacyLoading.value = true
  legacyError.value = false
  legacyValidation.value = ''
  try {
    const result = await fetchPublicSpecialists({ name: query, page_size: 5 })
    legacyResults.value = result.results || []
    legacySearched.value = true
    legacyLastQuery.value = query
  } catch {
    legacyError.value = true
    legacyResults.value = []
  } finally { legacyLoading.value = false }
}

async function submitLegacySearch() {
  const query = normalizeLegacyQuery(legacyQuery.value)
  if (query.length < 3) { legacyValidation.value = 'Введіть щонайменше 3 символи для пошуку.'; return }
  legacyQuery.value = query
  await runLegacySearch(query)
}

async function retryLegacySearch() { await runLegacySearch(legacyLastQuery.value || normalizeLegacyQuery(legacyQuery.value)) }

watch(response, (nextResponse) => {
  if (!nextResponse || !nextResponse.groups.some((group) => group.items.length > 0)) return
  const stateKey = route.fullPath
  if (trackedDiscoveryResultStates.has(stateKey)) return
  trackedDiscoveryResultStates.add(stateKey)
  productAnalytics.capture('specialist_discovery_results_viewed')
})

watch(() => route.fullPath, applyDirectoryMetadata, { immediate: true })
onBeforeUnmount(resetPublicPageMetadata)
</script>

<style scoped>
.discovery-page { display: grid; gap: 12px; min-width: 0; }
.discovery-page__hero, .discovery-controls { min-width: 0; }
.discovery-page__hero { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 0 2px 2px; }
.discovery-page__hero-copy { min-width: 0; }
.discovery-page__hero .title, .result-group h2, .results h2 { margin: 0; }
.discovery-page__hero .muted { margin: 6px 0 0; max-width: 76ch; }
.discovery-controls { display: grid; gap: 10px; min-width: 0; border: 1px solid var(--line); border-radius: var(--radius-lg); background: #fff; padding: 14px 18px; }
.discovery-controls__toolbar, .discovery-page__hero, .results__header, .result-group__header, .active-search { display: flex; align-items: center; justify-content: space-between; gap: 12px 16px; }
.discovery-controls__toolbar { flex-wrap: wrap; align-items: end; }
.control-group, .query-form, .result-group, .results { display: grid; gap: 8px; min-width: 0; }
.control-group { margin: 0; padding: 0; border: 0; }
.control-group legend, .query-form label { font-weight: 700; }
.control-group legend { margin-bottom: 2px; font-size: 13px; }
.segmented-control, .choice-list { display: flex; flex-wrap: wrap; gap: 8px; }
.control-label--short { display: none; }
.segmented-control label, .choice-button { align-items: center; border: 1px solid var(--line); background: #fff; border-radius: 6px; cursor: pointer; display: inline-flex; min-height: 44px; padding: 9px 12px; }
.segmented-control label:has(input:checked), .choice-button[aria-pressed='true'] { background: rgba(15, 118, 110, .1); border-color: rgba(15, 118, 110, .55); font-weight: 700; }
.choice-button:has(input:checked) { background: rgba(15, 118, 110, .1); border-color: rgba(15, 118, 110, .55); font-weight: 700; }
.segmented-control input { accent-color: #0f766e; }
.choice-button input { accent-color: #0f766e; }
.choice-list__clear { min-height: 44px; }
.request-group-controls__mobile { display: none; }
.query-form__row { display: flex; gap: 10px; align-items: center; }
.query-form__row .input { flex: 1; min-width: 0; }
.direction-pending { margin: 0; max-width: 52ch; }
.result-group { padding-top: 4px; }
.result-list { display: grid; gap: 14px; }
.legacy-lookup { min-width: 0; margin-top: 2px; padding-top: 6px; border-top: 1px solid var(--line); }
.legacy-lookup summary { min-height: 44px; padding: 10px 0; cursor: pointer; font-weight: 700; }
.legacy-lookup summary:focus-visible { outline: 2px solid rgba(15, 118, 110, .7); outline-offset: 2px; }
.legacy-lookup__content { display: grid; gap: 10px; margin-top: 8px; }
@media (max-width: 720px) {
  .discovery-page__hero, .results__header, .active-search { align-items: stretch; flex-direction: column; }
  .discovery-page__hero { padding: 0; }
  .discovery-controls { padding: 14px; }
  .discovery-controls__toolbar { align-items: stretch; flex-direction: column; }
  .discovery-controls__toolbar > .control-group:first-child { width: 100%; }
  .request-group-controls__desktop { display: none; }
  .request-group-controls__mobile { display: grid; gap: 6px; width: 100%; }
  .request-group-controls__mobile .input { min-height: 44px; width: 100%; }
  .segmented-control--modes { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 140px), 1fr)); }
  .segmented-control--modes label { width: 100%; min-width: 0; min-height: 48px; height: auto; padding: 8px 10px; justify-content: center; text-align: center; line-height: 1.2; }
  .segmented-control--format { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .segmented-control--format label { justify-content: center; min-width: 0; padding-inline: 6px; text-align: center; white-space: normal; }
  .query-form__row { align-items: stretch; }
  .segmented-control label, .choice-button { max-width: 100%; }
}
@media (max-width: 480px) {
  .discovery-page { gap: 14px; }
  .discovery-page__hero { gap: 8px; padding: 0; }
  .discovery-page__hero .title { font-size: clamp(30px, 8.5vw, 34px); line-height: 1.12; }
  .discovery-page__hero .muted { display: none; }
  .control-label--full { display: none; }
  .control-label--short { display: inline; }
  .hero-home-link { align-self: flex-start; border: 0; min-height: auto; padding: 2px 0; }
  .hero-home-link:focus-visible { outline: 2px solid rgba(15, 118, 110, .65); outline-offset: 3px; }
  .query-form__row { flex-wrap: wrap; }
  .query-form__row .input { flex: 1 1 190px; min-height: 44px; }
  .query-form__row .btn { flex: 0 0 auto; min-height: 44px; }
}
</style>

<style>
/* Claude v5 Discovery presentation, isolated from v1 and other pages. */
html[data-ui="v2"] .pc2-discovery { --pc2-discovery-width: calc(min(100vw, 1240px) - var(--pc-gutter) * 2); width: var(--pc2-discovery-width); margin: -24px calc((100% - var(--pc2-discovery-width)) / 2) 0; min-width: 0; font-family: var(--pc-font); color: var(--pc-text-main); }
html[data-ui="v2"] .pc2-discovery p { margin: 0; }
html[data-ui="v2"] .pc2-discovery h1, html[data-ui="v2"] .pc2-discovery h2, html[data-ui="v2"] .pc2-discovery h3 { font-weight: 500; color: inherit; }
html[data-ui="v2"] .pc2-discovery__hero { padding: clamp(48px,7vw,80px) 0 0; max-width: 820px; }
html[data-ui="v2"] .pc2-discovery__bar-row { max-width: 820px; padding-bottom: 32px; }
html[data-ui="v2"] .pc2-discovery__bar-mode, html[data-ui="v2"] .pc2-discovery__filters-toggle, html[data-ui="v2"] .pc2-discovery-sheet { display: none; }
html[data-ui="v2"] .pc2-discovery__hero h1 { font-size: clamp(38px,5vw,60px); line-height: 1.04; letter-spacing: -.04em; margin: 0 0 16px; text-wrap: balance; }
html[data-ui="v2"] .pc2-discovery__hero > p { font-size: 18px; line-height: 1.6; color: var(--pc-text-body); margin: 0 0 32px; max-width: 560px; }
html[data-ui="v2"] .pc2-discovery__search-row { display: flex; align-items: center; gap: 8px; padding: 8px 8px 8px 22px; border-radius: 999px; background: var(--pc-bg-card); border: 1.5px solid var(--pc-border-hair); box-shadow: 0 16px 40px rgb(18 35 58 / 6%); transition: border-color .25s; }
html[data-ui="v2"] .pc2-discovery__search-row:focus-within { border-color: var(--pc-navy-900); }
html[data-ui="v2"] .pc2-discovery__field { position: relative; flex: 1; min-width: 0; height: 48px; }
html[data-ui="v2"] .pc2-discovery__field input { position: absolute; inset: 0; width: 100%; min-width: 0; border: 0; border-radius: 4px; outline: none; background: transparent; color: var(--pc-text-main); padding: 0; font: inherit; font-size: 18px; }
html[data-ui="v2"] .pc2-discovery__placeholder { position: absolute; left: 0; top: 50%; transform: translateY(-50%); opacity: 1; font-size: 18px; color: var(--pc-text-muted); pointer-events: none; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; transition: opacity .4s ease, transform .4s ease; }
html[data-ui="v2"] .pc2-discovery__placeholder.is-off { opacity: 0; transform: translateY(calc(-50% - 8px)); }
html[data-ui="v2"] .pc2-discovery__search .pc2-btn { padding: 14px 26px; font-size: 16px; font-weight: 500; min-height: 48px; }
html[data-ui="v2"] .pc2-discovery .pc2-btn { text-decoration: none; transition: background .2s, border-color .2s; }
html[data-ui="v2"] .pc2-discovery__filters { display: flex; flex-direction: column; gap: 16px; padding-bottom: 28px; border-bottom: 1px solid var(--pc-border-hair); }
html[data-ui="v2"] .pc2-discovery__topics { display: flex; flex-wrap: wrap; gap: 8px; }
html[data-ui="v2"] .pc2-discovery__topics :is(button,label,a) { position: relative; display: inline-flex; align-items: center; font: inherit; font-size: 15px; padding: 10px 16px; border-radius: 999px; cursor: pointer; border: 1px solid var(--pc-border-hair); background: var(--pc-bg-card); color: var(--pc-text-main); transition: all .2s; text-decoration: none; max-width: 100%; text-align: left; }
html[data-ui="v2"] .pc2-discovery__topics button[aria-pressed="true"], html[data-ui="v2"] .pc2-discovery__topics label:has(input:checked) { background: var(--pc-navy-900); border-color: var(--pc-navy-900); color: var(--pc-bg-card); }
html[data-ui="v2"] .pc2-discovery__topics :is(button,label,a):hover { border-color: var(--pc-border-strong); }
html[data-ui="v2"] .pc2-discovery__filter-row { display: flex; flex-wrap: wrap; gap: 12px 24px; align-items: center; justify-content: space-between; }
html[data-ui="v2"] .pc2-discovery fieldset { margin: 0; padding: 0; border: 0; min-width: 0; }
html[data-ui="v2"] .pc2-discovery__directions legend { margin-bottom: 12px; font-size: 14px; }
html[data-ui="v2"] .pc2-discovery .pc2-discovery__formats { display: flex; padding: 4px; border-radius: 999px; background: var(--pc-bg-sunk); gap: 2px; }
html[data-ui="v2"] .pc2-discovery__formats label { position: relative; padding: 8px 18px; border-radius: 999px; font-size: 14px; cursor: pointer; background: transparent; transition: all .25s; white-space: nowrap; }
html[data-ui="v2"] .pc2-discovery__formats label:has(input:checked) { background: var(--pc-bg-card); box-shadow: var(--pc-shadow-sm); }
html[data-ui="v2"] .pc2-discovery__formats input, html[data-ui="v2"] .pc2-discovery__topics input { position: absolute; width: 1px; height: 1px; opacity: 0; }
html[data-ui="v2"] .pc2-discovery .pc2-discovery__modes { display: flex; gap: 12px; flex-wrap: wrap; font-size: 13px; color: var(--pc-text-muted); }
html[data-ui="v2"] .pc2-discovery__modes label { display: flex; align-items: center; gap: 5px; cursor: pointer; }
html[data-ui="v2"] .pc2-discovery__modes input { accent-color: var(--pc-navy-900); }
html[data-ui="v2"] .pc2-discovery__reset { font: inherit; font-size: 14px; color: var(--pc-navy-900); cursor: pointer; border: 0; border-bottom: 1px solid var(--pc-border-strong); padding: 0; background: none; }
html[data-ui="v2"] .pc2-discovery__broad { font-size: 14px; text-decoration: underline; }
html[data-ui="v2"] .pc2-discovery__results { padding: 32px 0 64px; }
html[data-ui="v2"] .pc2-discovery__result-heading { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 8px; margin-bottom: 20px; }
html[data-ui="v2"] .pc2-discovery__result-heading > div { display: flex; align-items: center; gap: 12px; min-height: 40px; }
html[data-ui="v2"] .pc2-discovery__result-heading h2 { font-size: 24px; letter-spacing: -.02em; margin: 0; }
html[data-ui="v2"] .pc2-discovery__result-heading > p { font-size: 14px; color: var(--pc-text-muted); }
html[data-ui="v2"] .pc2-discovery__result-state { opacity: 1; transform: translateY(0); transition: opacity .3s ease, transform .3s ease; }
html[data-ui="v2"] .pc2-discovery__result-state.is-loading { opacity: .35; transform: translateY(6px); }
html[data-ui="v2"] .pc2-discovery__list { display: grid; grid-template-columns: repeat(auto-fill,minmax(min(100%,520px),1fr)); gap: 14px; }
html[data-ui="v2"] .pc2-discovery__list .pc2-specialist-card { opacity: 0; transform: translateY(14px); transition: opacity .45s ease var(--pc2-discovery-card-delay,0s), transform .55s cubic-bezier(.2,.8,.2,1) var(--pc2-discovery-card-delay,0s), box-shadow .3s ease, border-color .3s; }
html[data-ui="v2"] .pc2-discovery__list[data-revealed="true"] .pc2-specialist-card { opacity: 1; transform: translateY(0); }
html[data-ui="v2"] .pc2-discovery__list .pc2-specialist-card:focus-visible { opacity: 1; transform: none; transition: none; }
html[data-ui="v2"] .pc2-discovery__list .pc2-specialist-card:nth-child(4n+2) .pc2-specialist-card__initials { background: var(--pc-teal-200); }
html[data-ui="v2"] .pc2-discovery__list .pc2-specialist-card:nth-child(4n+3) .pc2-specialist-card__initials { background: var(--pc-peach-200); }
html[data-ui="v2"] .pc2-discovery__list .pc2-specialist-card:nth-child(4n+4) .pc2-specialist-card__initials { background: var(--pc-info-soft); }
html[data-ui="v2"] .pc2-discovery__group + .pc2-discovery__group { margin-top: 28px; }
html[data-ui="v2"] .pc2-discovery__group-heading { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; margin-bottom: 14px; }
html[data-ui="v2"] .pc2-discovery__group-heading h3 { margin: 0; font-size: 20px; }
html[data-ui="v2"] .pc2-discovery__group-heading > span { color: var(--pc-text-muted); font-size: 14px; }
html[data-ui="v2"] .pc2-discovery__empty { padding: 48px; border-radius: 24px; border: 1px dashed var(--pc-border-strong); text-align: center; }
html[data-ui="v2"] .pc2-discovery__empty img { display: block; margin: 0 auto 16px; opacity: .35; }
html[data-ui="v2"] .pc2-discovery__empty h3 { font-size: 20px; margin: 0 0 8px; }
html[data-ui="v2"] .pc2-discovery__empty p { font-size: 15px; color: var(--pc-text-muted); margin-bottom: 20px; }
html[data-ui="v2"] .pc2-discovery__help { display: grid; grid-template-columns: repeat(auto-fit,minmax(min(100%,320px),1fr)); gap: 14px; padding-bottom: 96px; }
html[data-ui="v2"] .pc2-discovery__help section { border-radius: 24px; padding: 28px; min-width: 0; }
html[data-ui="v2"] .pc2-discovery__help h2 { font-size: 20px; letter-spacing: -.02em; margin: 0 0 6px; }
html[data-ui="v2"] .pc2-discovery__optional { background: var(--pc-navy-900); color: var(--pc-bg-card); display: flex; flex-direction: column; gap: 14px; }
html[data-ui="v2"] .pc2-discovery__optional p { font-size: 14px; color: var(--pc-bg-sunk); }
html[data-ui="v2"] .pc2-discovery__optional ul { display: flex; flex-direction: column; gap: 8px; list-style: none; padding: 0; margin: 0; font-size: 15px; line-height: 1.5; }
html[data-ui="v2"] .pc2-discovery__optional .pc2-btn { margin-top: auto; align-self: flex-start; background: var(--pc-bg-card); color: var(--pc-navy-900); }
html[data-ui="v2"] .pc2-discovery__optional .pc2-btn:hover { background: var(--pc-peach-100); }
html[data-ui="v2"] .pc2-discovery__guide { background: var(--pc-teal-100); color: var(--pc-teal-ink); }
html[data-ui="v2"] .pc2-discovery__guide ol { display: flex; flex-direction: column; gap: 8px; padding-left: 20px; margin: 10px 0 0; font-size: 15px; line-height: 1.5; }
html[data-ui="v2"] .pc2-discovery__lookup { background: var(--pc-bg-card); border: 1px solid var(--pc-border-hair); }
html[data-ui="v2"] .pc2-discovery__lookup-toggle { display: flex; justify-content: space-between; align-items: center; gap: 12px; text-align: left; background: none; padding: 0; border: 0; font: inherit; cursor: pointer; color: var(--pc-text-main); width: 100%; }
html[data-ui="v2"] .pc2-discovery__lookup-toggle strong { font-weight: 500; font-size: 20px; letter-spacing: -.02em; display: block; margin-bottom: 4px; }
html[data-ui="v2"] .pc2-discovery__lookup-toggle small { font-size: 14px; color: var(--pc-text-muted); }
html[data-ui="v2"] .pc2-discovery__plus { width: 32px; height: 32px; flex-shrink: 0; border-radius: 50%; background: var(--pc-bg-soft); color: var(--pc-text-muted); display: grid; place-items: center; transition: all .3s; font-size: 18px; }
html[data-ui="v2"] .pc2-discovery__lookup-toggle[aria-expanded="true"] .pc2-discovery__plus { transform: rotate(45deg); background: var(--pc-navy-900); color: var(--pc-bg-card); }
html[data-ui="v2"] .pc2-discovery__lookup-panel { display: grid; grid-template-rows: 0fr; transition: grid-template-rows .4s ease, visibility 0s .4s; visibility: hidden; }
html[data-ui="v2"] .pc2-discovery__lookup-panel.is-open { grid-template-rows: 1fr; visibility: visible; transition-delay: 0s; }
html[data-ui="v2"] .pc2-discovery__lookup-panel > div { overflow: hidden; min-width: 0; }
html[data-ui="v2"] .pc2-discovery__lookup-row { display: flex; gap: 8px; padding-top: 18px; min-width: 0; }
html[data-ui="v2"] .pc2-discovery__lookup-row input { flex: 1; width: 0; min-width: 0; height: 48px; padding: 0 16px; border-radius: 14px; border: 1.5px solid var(--pc-border); background: var(--pc-bg-main); font: inherit; font-size: 15px; color: var(--pc-text-main); }
html[data-ui="v2"] .pc2-discovery__lookup-row .pc2-btn { padding-inline: 14px; border-radius: 14px; font-size: 14px; }
html[data-ui="v2"] .pc2-discovery__lookup-results { display: grid; gap: 14px; padding-top: 16px; }
html[data-ui="v2"] .pc2-discovery .pc2-discovery__error { color: var(--pc-danger); font-size: 14px; margin-top: 8px; }
html[data-ui="v2"] .pc2-discovery__listen { position: relative; width: 32px; height: 32px; flex-shrink: 0; }
html[data-ui="v2"] .pc2-discovery__listen img { position: absolute; inset: 0; width: 100%; height: 100%; animation: pc2DiscoveryBreath 3.2s ease-in-out infinite; }
html[data-ui="v2"] .pc2-discovery__ring { position: absolute; inset: 0; border-radius: 50%; border: 1.5px solid var(--pc2-discovery-motion-accent); mask: conic-gradient(black 0 156deg, transparent 156deg 198deg, black 198deg); animation: pc2DiscoveryRing 1.8s cubic-bezier(.2,.6,.3,1) infinite; }
html[data-ui="v2"] .pc2-discovery { --pc2-discovery-motion-accent: #2f8c86; }
@keyframes pc2DiscoveryRing { from { transform: scale(1.04); opacity: .55; } to { transform: scale(1.9); opacity: 0; } }
@keyframes pc2DiscoveryBreath { 0%,100% { transform: scale(1); } 50% { transform: scale(1.035); } }
html[data-ui="v2"] .pc2-discovery.is-hidden * { animation-play-state: paused; }
html[data-ui="v2"] .pc2-discovery :is(a,button,input):focus-visible, html[data-ui="v2"] .pc2-discovery :is(label):has(input:focus-visible) { outline: var(--pc-focus-width) solid var(--pc-navy-900); outline-offset: var(--pc-focus-offset); }
html[data-ui="v2"] .pc2-discovery__optional :focus-visible { outline-color: var(--pc-bg-card); }
html[data-ui="v2"] .pc2-discovery__sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
@media (max-width: 639px) {
  html[data-ui="v2"] .pc2-discovery__placeholder { font-size: 16px; }
  html[data-ui="v2"] .pc2-discovery__search .pc2-btn { padding-inline: 18px; }
  html[data-ui="v2"] .pc2-discovery__topics :is(button,label,a) { white-space: normal; }
  html[data-ui="v2"] .pc2-discovery__empty { padding: 32px 20px; }
  html[data-ui="v2"] .pc2-discovery__lookup-row { flex-wrap: wrap; }
  html[data-ui="v2"] .pc2-discovery__lookup-row input { flex-basis: 100%; width: 100%; }
}
/* Public-Mobile.dc.html P4 (< 768px): sticky search + filter button, quick chip strip, compact cards, bottom sheet. */
@media (max-width: 767px) {
  html[data-ui="v2"] .pc2-discovery { --pc2-discovery-width: calc(100vw - 32px); margin-top: -24px; }
  html[data-ui="v2"] .pc2-discovery__hero:not(.is-landing) { position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
  html[data-ui="v2"] .pc2-discovery__hero.is-landing { padding: 20px 0 12px; }
  html[data-ui="v2"] .pc2-discovery__hero.is-landing h1 { font-size: 28px; margin-bottom: 8px; }
  html[data-ui="v2"] .pc2-discovery__hero.is-landing > p { font-size: 15px; margin: 0; }
  html[data-ui="v2"] .pc2-discovery__bar { position: sticky; top: var(--pc-header-h); z-index: 15; display: flex; flex-direction: column; gap: 10px; margin: 0 -16px; padding: 8px 16px 10px; background: var(--pc-bg-main); border-bottom: 1px solid var(--pc-border-hair); }
  html[data-ui="v2"] .pc2-discovery__bar-row { display: flex; align-items: center; gap: 8px; max-width: none; padding: 0; }
  html[data-ui="v2"] .pc2-discovery__search { flex: 1; min-width: 0; }
  html[data-ui="v2"] .pc2-discovery__search-row { padding: 0; border: 0; border-radius: 0; background: none; box-shadow: none; }
  html[data-ui="v2"] .pc2-discovery__search-row .pc2-btn { display: none; }
  html[data-ui="v2"] .pc2-discovery__field { height: 48px; border: 1.5px solid var(--pc-navy-900); border-radius: 999px; background: var(--pc-bg-card); }
  html[data-ui="v2"] .pc2-discovery__field input { padding: 0 16px; border-radius: 999px; font-size: 15px; }
  html[data-ui="v2"] .pc2-discovery__field:focus-within { box-shadow: 0 0 0 4px rgb(18 52 90 / 8%); }
  html[data-ui="v2"] .pc2-discovery__placeholder { left: 16px; max-width: calc(100% - 32px); font-size: 15px; }
  html[data-ui="v2"] .pc2-discovery__bar-mode { display: block; flex: 1; min-width: 0; font-size: 15px; color: var(--pc-text-muted); }
  html[data-ui="v2"] .pc2-discovery__filters-toggle { position: relative; display: grid; place-items: center; flex-shrink: 0; width: 48px; height: 48px; padding: 0; border: 1px solid var(--pc-border); border-radius: 50%; background: var(--pc-bg-card); color: var(--pc-text-main); cursor: pointer; }
  html[data-ui="v2"] .pc2-discovery__filters-toggle svg { width: 20px; height: 20px; }
  html[data-ui="v2"] .pc2-discovery__filters-count { position: absolute; top: -2px; right: -2px; display: grid; place-items: center; min-width: 18px; height: 18px; padding: 0 5px; border-radius: 999px; background: var(--pc-navy-900); color: var(--pc-bg-card); font-size: 11px; font-weight: 600; }
  html[data-ui="v2"] .pc2-discovery__filters { gap: 10px; padding-bottom: 0; border-bottom: 0; }
  html[data-ui="v2"] .pc2-discovery__directions legend { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
  html[data-ui="v2"] .pc2-discovery__topics { flex-wrap: nowrap; gap: 6px; overflow-x: auto; margin: 0 -16px; padding: 0 16px; scrollbar-width: none; overscroll-behavior-x: contain; }
  html[data-ui="v2"] .pc2-discovery__topics::-webkit-scrollbar { display: none; }
  html[data-ui="v2"] .pc2-discovery__topics :is(button,label,a) { flex-shrink: 0; white-space: nowrap; min-height: 34px; padding: 0 12px; font-size: 13px; border-color: var(--pc-border); }
  html[data-ui="v2"] .pc2-discovery__filter-row { display: none; }
  html[data-ui="v2"] .pc2-discovery__broad { font-size: 13px; }
  html[data-ui="v2"] .pc2-discovery__results { padding: 12px 0 40px; }
  html[data-ui="v2"] .pc2-discovery__result-heading { flex-wrap: wrap; align-items: center; justify-content: flex-start; gap: 0 6px; margin-bottom: 10px; }
  html[data-ui="v2"] .pc2-discovery__result-heading > div { gap: 8px; min-height: 20px; }
  html[data-ui="v2"] .pc2-discovery__result-heading h2 { font-size: 13px; font-weight: 400; letter-spacing: 0; color: #5a6578; }
  html[data-ui="v2"] .pc2-discovery__result-heading > p { font-size: 13px; color: #5a6578; }
  html[data-ui="v2"] .pc2-discovery__result-heading > p::before { content: '· '; }
  html[data-ui="v2"] .pc2-discovery__listen { width: 20px; height: 20px; }
  html[data-ui="v2"] .pc2-discovery__list { gap: 10px; }
  html[data-ui="v2"] .pc2-discovery__group-heading h3 { font-size: 17px; }
  html[data-ui="v2"] .pc2-discovery__help { padding-bottom: 64px; }
  html[data-ui="v2"] .pc2-discovery-sheet { display: block; position: fixed; inset: 0; z-index: 60; visibility: hidden; pointer-events: none; transition: visibility 0s .4s; font-family: var(--pc-font); color: var(--pc-text-main); }
  html[data-ui="v2"] .pc2-discovery-sheet.is-open { visibility: visible; pointer-events: auto; transition: visibility 0s; }
  html[data-ui="v2"] .pc2-discovery-sheet__backdrop { position: absolute; inset: 0; background: rgb(18 35 58 / 42%); opacity: 0; transition: opacity .3s; }
  html[data-ui="v2"] .pc2-discovery-sheet.is-open .pc2-discovery-sheet__backdrop { opacity: 1; }
  html[data-ui="v2"] .pc2-discovery-sheet__panel { position: absolute; left: 0; right: 0; bottom: 0; height: 72%; display: flex; flex-direction: column; background: var(--pc-bg-card); border-radius: 28px 28px 0 0; transform: translateY(105%); transition: transform .4s cubic-bezier(.2,.8,.2,1); outline: none; }
  html[data-ui="v2"] .pc2-discovery-sheet.is-open .pc2-discovery-sheet__panel { transform: translateY(0); }
  html[data-ui="v2"] .pc2-discovery-sheet__handle { display: flex; justify-content: center; padding: 10px 0 4px; }
  html[data-ui="v2"] .pc2-discovery-sheet__handle span { width: 40px; height: 5px; border-radius: 999px; background: var(--pc-border-strong); }
  html[data-ui="v2"] .pc2-discovery-sheet__head { display: flex; justify-content: space-between; align-items: center; padding: 4px 16px 8px; }
  html[data-ui="v2"] .pc2-discovery-sheet__head h2 { margin: 0; font-size: 19px; font-weight: 500; color: inherit; }
  html[data-ui="v2"] .pc2-discovery-sheet__head button { min-height: 44px; padding: 0 4px; border: 0; background: none; font: inherit; font-size: 14px; color: var(--pc-navy-900); cursor: pointer; }
  html[data-ui="v2"] .pc2-discovery-sheet__head button:disabled { color: var(--pc-text-soft); cursor: default; }
  html[data-ui="v2"] .pc2-discovery-sheet__body { flex: 1; overflow-y: auto; overscroll-behavior: contain; display: flex; flex-direction: column; gap: 18px; padding: 4px 16px 16px; }
  html[data-ui="v2"] .pc2-discovery-sheet fieldset { margin: 0; padding: 0; border: 0; min-width: 0; }
  html[data-ui="v2"] .pc2-discovery-sheet legend { margin-bottom: 8px; padding: 0; font-size: 13px; color: var(--pc-text-muted); }
  html[data-ui="v2"] .pc2-discovery-sheet__options { display: flex; flex-wrap: wrap; gap: 6px; }
  html[data-ui="v2"] .pc2-discovery-sheet__options label { position: relative; display: inline-flex; align-items: center; height: 40px; padding: 0 14px; border-radius: 999px; border: 1px solid var(--pc-border); background: var(--pc-bg-card); color: var(--pc-text-main); font-size: 14px; white-space: nowrap; cursor: pointer; transition: background .2s, border-color .2s, color .2s; }
  html[data-ui="v2"] .pc2-discovery-sheet__options label:has(input:checked) { background: var(--pc-navy-900); border-color: var(--pc-navy-900); color: var(--pc-bg-card); }
  html[data-ui="v2"] .pc2-discovery-sheet__options input { position: absolute; width: 1px; height: 1px; opacity: 0; }
  html[data-ui="v2"] .pc2-discovery-sheet__options label:has(input:focus-visible), html[data-ui="v2"] .pc2-discovery-sheet :is(button):focus-visible { outline: var(--pc-focus-width) solid var(--pc-navy-900); outline-offset: var(--pc-focus-offset); }
  html[data-ui="v2"] .pc2-discovery-sheet__foot { padding: 12px 16px max(28px, env(safe-area-inset-bottom)); border-top: 1px solid var(--pc-bg-sunk); }
  html[data-ui="v2"] .pc2-discovery-sheet__foot .pc2-btn { width: 100%; min-height: 52px; justify-content: center; font-size: 16px; font-weight: 500; }
  html[data-ui="v2"] .pc2-discovery-sheet.is-reduced *, html[data-ui="v2"] .pc2-discovery-sheet.is-reduced { transition: none; }
}
@media (max-width: 767px) and (prefers-reduced-motion: reduce) {
  html[data-ui="v2"] .pc2-discovery-sheet, html[data-ui="v2"] .pc2-discovery-sheet * { transition: none; }
}
html[data-ui="v2"] .pc2-discovery.is-reduced *, html[data-ui="v2"] .pc2-discovery.is-reduced *::before { animation: none; transition: none; }
@media (prefers-reduced-motion: reduce) {
  html[data-ui="v2"] .pc2-discovery *, html[data-ui="v2"] .pc2-discovery *::before, html[data-ui="v2"] .pc2-discovery *::after { animation: none; transition: none; scroll-behavior: auto; }
}
</style>
