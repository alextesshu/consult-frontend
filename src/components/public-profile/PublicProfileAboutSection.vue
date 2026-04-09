<template>
  <section class="panel panel--about" v-if="aboutNarrativeText">
    <div class="panel__header">
      <div>
        <div class="badge badge--soft">Про спеціаліста</div>
        <h2 class="panel__title">Про спеціаліста</h2>
      </div>
    </div>
    <p class="narrative-text">{{ aboutNarrativeText }}</p>
  </section>

  <section class="panel panel--approach" v-if="workStyleText">
    <div class="panel__header">
      <div>
        <div class="badge badge--soft">Мій підхід</div>
        <h2 class="panel__title">Як я працюю</h2>
      </div>
    </div>
    <p class="narrative-text">{{ workStyleText }}</p>
  </section>

  <section class="panel panel--work-with" v-if="workWithText || workWithChips.length">
    <div class="panel__header">
      <div>
        <div class="badge badge--soft">Фокус роботи</div>
        <h2 class="panel__title">З чим я працюю</h2>
      </div>
    </div>
    <div v-if="workWithChips.length" class="work-with__chips">
      <span v-for="(chip, index) in workWithChips" :key="`${chip}-${index}`" class="work-with__chip">{{ chip }}</span>
    </div>
    <p v-if="workWithText" class="scope-text">{{ workWithText }}</p>
  </section>

  <section class="panel panel--who" v-if="whoIsNotSuitableText">
    <div class="panel__header">
      <div>
        <div class="badge badge--soft">Обмеження</div>
        <h2 class="panel__title">З чим я не працюю</h2>
      </div>
    </div>
    <p class="scope-text">{{ whoIsNotSuitableText }}</p>
  </section>

  <section class="panel panel--terms" v-if="specialistBookingTermsText">
    <div class="panel__header">
      <div>
        <div class="badge badge--soft">Перед записом</div>
        <h2 class="panel__title">Умови спеціаліста перед записом</h2>
        <p class="panel__lead">
          Індивідуальні умови цього спеціаліста. Якщо умови оновляться, перед новим записом може знадобитися повторне підтвердження.
        </p>
      </div>
    </div>
    <p class="terms-text">{{ specialistBookingTermsText }}</p>
  </section>

  <section class="panel panel--contacts" v-if="showDirectContactActions">
    <div class="panel__header">
      <div>
        <div class="badge badge--soft">Зв’язок</div>
        <h2 class="panel__title">Зв’язок зі спеціалістом</h2>
        <p class="panel__lead">
          Оберіть зручний канал. Якщо застосунок не відкриється, контакт можна скопіювати й продовжити вручну.
        </p>
      </div>
    </div>
    <div class="contact-actions">
      <a
        v-for="item in contactActions"
        :key="item.id"
        class="contact-action"
        :href="item.actionUrl"
        target="_blank"
        rel="noopener noreferrer"
        @click.prevent="$emit('direct-contact-action', item)"
      >
        <span class="contact-action__label">{{ item.channelLabel }}</span>
        <span class="contact-action__value">{{ item.valueText }}</span>
      </a>
    </div>
  </section>
</template>

<script setup lang="ts">
type ContactAction = {
  id: string
  channel: string
  channelLabel: string
  valueText: string
  actionUrl: string
  actionScheme: string
}

type Props = {
  aboutNarrativeText: string
  workStyleText: string
  workWithText: string
  workWithChips: string[]
  whoIsNotSuitableText: string
  specialistBookingTermsText: string
  showDirectContactActions: boolean
  contactActions: ContactAction[]
}

defineProps<Props>()

defineEmits<{
  (event: 'direct-contact-action', item: ContactAction): void
}>()
</script>

<style scoped>
.panel--about,
.panel--approach,
.panel--work-with,
.panel--who,
.panel--terms,
.panel--contacts {
  grid-column: 1 / -1;
}

.panel {
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  padding: 18px 18px 20px;
  background: color-mix(in srgb, #ffffff 90%, var(--surface));
  display: grid;
  gap: 12px;
}

.panel__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 2px;
}

.panel__header > div {
  display: grid;
  gap: 6px;
}

.panel__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 22px;
}

.panel__lead {
  margin: 0;
  color: var(--muted);
  font-size: 14px;
  line-height: 1.55;
  max-width: 78ch;
}

.narrative-text,
.scope-text,
.terms-text {
  margin: 0;
  white-space: pre-line;
  color: color-mix(in srgb, var(--text) 88%, var(--muted));
  font-size: 15px;
  line-height: 1.62;
}

.work-with__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.work-with__chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px 10px;
  border-radius: 10px;
  border: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.82);
  font-size: 12px;
}

.terms-text {
  border: 1px solid color-mix(in srgb, #d9a441 22%, var(--line));
  border-radius: 12px;
  padding: 12px 14px;
  background: color-mix(in srgb, #f5ecd5 42%, #ffffff);
}

.contact-actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 10px;
}

.contact-action {
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 10px 12px;
  display: grid;
  gap: 4px;
  text-decoration: none;
  color: inherit;
  background: #fff;
}

.contact-action:hover {
  border-color: color-mix(in srgb, var(--primary) 32%, var(--line));
  background: color-mix(in srgb, #eef2e8 56%, #ffffff);
}

.contact-action__label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--muted);
}

.contact-action__value {
  font-weight: 600;
}

.badge--soft {
  background: color-mix(in srgb, #e4e9dc 62%, #f8f3e9);
  border-color: color-mix(in srgb, #6f8b73 26%, var(--line));
  color: color-mix(in srgb, #3f5945 82%, var(--text));
}

@media (max-width: 960px) {
  .contact-actions {
    grid-template-columns: 1fr;
  }
}
</style>
