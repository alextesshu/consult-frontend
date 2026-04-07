<template>
  <section class="panel panel--work-format">
    <div class="panel__header">
      <div>
        <div class="badge badge--soft">Формат</div>
        <h2 class="panel__title">Формат роботи</h2>
      </div>
    </div>
    <div class="work-format-grid">
      <div v-if="meetingFormatLabel" class="profile-summary__item">
        Формат зустрічей: {{ meetingFormatLabel }}
      </div>
      <div v-if="introDurationLabel" class="profile-summary__item">
        Тривалість ознайомчої сесії: {{ introDurationLabel }}
      </div>
      <div v-if="introPriceDisplay" class="profile-summary__item">
        Вартість ознайомчої сесії: {{ introPriceDisplay }}
      </div>
      <div v-if="offlineMeetingLocation" class="profile-summary__item">
        Локація офлайн-зустрічей: {{ offlineMeetingLocation }}
      </div>
      <div v-else-if="profileLocation" class="profile-summary__item">
        Локація: {{ profileLocation }}
      </div>
      <div v-if="priceDisplay" class="profile-summary__item">
        Консультація: {{ priceDisplay }} · {{ standardSessionDurationLabel }}
      </div>
      <div class="profile-summary__item">
        Що буде після запису: сесія з’явиться в кабінеті, після підтвердження надійде нагадування.
      </div>
    </div>
  </section>

  <section class="panel panel--about" v-if="aboutSections.length">
    <div class="panel__header">
      <div>
        <div class="badge badge--soft">Про спеціаліста</div>
        <h2 class="panel__title">Про спеціаліста</h2>
        <p class="panel__lead">Познайомтеся з підходом та стилем роботи перед першою консультацією.</p>
      </div>
    </div>
    <div class="about-grid">
      <article v-for="section in aboutSections" :key="section.title" class="bio-section">
        <div class="bio-title">{{ section.title }}</div>
        <div class="bio-copy">{{ section.body }}</div>
      </article>
    </div>
  </section>

  <section class="panel panel--who" v-if="whoThisIsForText">
    <div class="panel__header">
      <div>
        <div class="badge badge--soft">Кому підійде</div>
        <h2 class="panel__title">З якими запитами я працюю</h2>
      </div>
    </div>
    <div class="muted who-lead">Цей формат може підійти вам, якщо...</div>
    <div class="who-text">{{ whoThisIsForText }}</div>
    <div v-if="specializationChips.length" class="hero-trust">
      <span v-for="(chip, index) in specializationChips" :key="`${chip}-${index}`">{{ chip }}</span>
    </div>
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
type AboutSection = {
  title: string
  body: string
}

type ContactAction = {
  id: string
  channelLabel: string
  valueText: string
  actionUrl: string
}

type Props = {
  meetingFormatLabel: string
  introDurationLabel: string
  introPriceDisplay: string
  offlineMeetingLocation: string
  profileLocation: string
  priceDisplay: string
  standardSessionDurationLabel: string
  aboutSections: AboutSection[]
  whoThisIsForText: string
  specializationChips: string[]
  showDirectContactActions: boolean
  contactActions: ContactAction[]
}

defineProps<Props>()

defineEmits<{
  (event: 'direct-contact-action', item: any): void
}>()
</script>

<style scoped>
.panel--work-format,
.panel--about,
.panel--who,
.panel--contacts {
  grid-column: 1 / -1;
}

.panel {
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  padding: 18px 18px 20px;
  background: color-mix(in srgb, #ffffff 90%, var(--surface));
  display: grid;
  gap: 14px;
}

.panel__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 6px;
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

.work-format-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.profile-summary__item {
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 10px 12px;
  background: color-mix(in srgb, #f8f3e8 58%, #ffffff);
  font-size: 13px;
}

.about-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 12px;
}

.bio-section {
  display: grid;
  gap: 8px;
  border: 1px solid color-mix(in srgb, var(--line) 84%, #ffffff);
  border-radius: var(--radius-sm);
  padding: 12px 14px;
  background: color-mix(in srgb, #ffffff 78%, var(--surface));
}

.bio-title {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--deep);
  font-weight: 600;
}

.bio-copy {
  color: color-mix(in srgb, var(--text) 88%, var(--muted));
  line-height: 1.72;
  white-space: pre-line;
}

.who-lead {
  margin-top: -4px;
}

.who-text {
  white-space: pre-line;
  font-size: 16px;
  line-height: 1.5;
  color: var(--deep);
}

.hero-trust {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.hero-trust span {
  padding: 6px 10px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid var(--line);
  font-size: 12px;
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
  .work-format-grid {
    grid-template-columns: 1fr;
  }

  .about-grid,
  .contact-actions {
    grid-template-columns: 1fr;
  }
}
</style>
