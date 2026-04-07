<template>
  <section class="panel panel--trust" v-if="trustItems.length">
    <div class="panel__header">
      <div>
        <div class="badge badge--soft">Що важливо знати</div>
        <h2 class="panel__title">Довіра і формат</h2>
        <p class="panel__lead">Ключова інформація для спокійного рішення перед першим записом.</p>
      </div>
    </div>
    <div class="trust-grid">
      <article v-for="item in trustItems" :key="item.label" class="trust-card">
        <p class="trust-card__line">
          <span class="trust-card__label">{{ item.label }}</span>
          <span class="trust-card__separator">:</span>
          <span class="trust-card__value">{{ item.value }}</span>
        </p>
      </article>
    </div>
  </section>

  <section class="panel panel--documents" v-if="publicDocuments.length">
    <div class="panel__header">
      <div>
        <div class="badge badge--soft">Документи</div>
        <h2 class="panel__title">Документи та сертифікати</h2>
        <p class="panel__lead">
          Матеріали, завантажені спеціалістом для ознайомлення. PRO CONSULT не здійснює автоматичної
          верифікації їх змісту, якщо інше прямо не зазначено.
        </p>
      </div>
    </div>
    <div class="documents-grid">
      <article
        v-for="document in publicDocuments"
        :key="document.id"
        class="document-card"
        :class="{ 'document-card--file': !isImageDocument(document) }"
      >
        <div v-if="isImageDocument(document)" class="document-card__preview">
          <img
            :src="document.file_url"
            :alt="document.title"
            loading="lazy"
          />
        </div>
        <div v-else class="document-card__file-top">
          <div class="document-card__file-badge">
            {{ isPdfDocument(document) ? 'PDF' : 'DOC' }}
          </div>
          <div class="document-card__kind document-card__kind--file">{{ documentKindLabel(document.document_kind) }}</div>
        </div>
        <div class="document-card__body">
          <div v-if="isImageDocument(document)" class="document-card__kind">{{ documentKindLabel(document.document_kind) }}</div>
          <h3 class="document-card__title">{{ document.title }}</h3>
          <div v-if="document.uploaded_at" class="document-card__meta">
            Додано: {{ formatDate(document.uploaded_at) }}
          </div>
        </div>
        <a
          class="btn btn--ghost document-card__action"
          :href="document.file_url"
          target="_blank"
          rel="noopener noreferrer"
        >
          {{ isPdfDocument(document) ? 'Відкрити документ' : 'Відкрити' }}
        </a>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
type TrustItem = {
  label: string
  value: string
}

type PublicDocument = {
  id: number | string
  title: string
  file_url: string
  document_kind: string
  uploaded_at?: string | null
}

type Props = {
  trustItems: TrustItem[]
  publicDocuments: PublicDocument[]
  isImageDocument: (document: any) => boolean
  isPdfDocument: (document: any) => boolean
  documentKindLabel: (kind: string) => string
  formatDate: (value: string) => string
}

defineProps<Props>()
</script>

<style scoped>
.panel--trust,
.panel--documents {
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

.trust-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 10px;
}

.trust-card {
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 10px 12px;
  background: color-mix(in srgb, var(--color-primary-100) 22%, #ffffff);
}

.trust-card__line {
  margin: 0;
  display: inline-flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 4px;
  font-size: 13px;
  line-height: 1.45;
}

.trust-card__label {
  font-weight: 600;
  color: var(--muted);
}

.trust-card__separator {
  color: var(--muted);
}

.trust-card__value {
  color: var(--text);
}

.documents-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 12px;
}

.document-card {
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 12px;
  background: #fff;
  display: grid;
  gap: 10px;
}

.document-card--file {
  gap: 8px;
  background: color-mix(in srgb, #f8f3e8 38%, #ffffff);
}

.document-card__preview {
  width: 100%;
  height: clamp(160px, 24vw, 240px);
  border-radius: 12px;
  border: 1px solid var(--line);
  overflow: hidden;
  background: color-mix(in srgb, #f4efe2 58%, #ffffff);
  padding: 8px;
}

.document-card__preview img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
  border-radius: 8px;
}

.document-card__file-top {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.document-card__file-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  height: 26px;
  padding: 0 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #6a573f;
  border: 1px solid #dccdb4;
  background: color-mix(in srgb, #efe1c9 76%, #ffffff);
}

.document-card__body {
  display: grid;
  gap: 4px;
}

.document-card__kind {
  width: fit-content;
  padding: 4px 8px;
  border-radius: 999px;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #5f5345;
  border: 1px solid #e6dccb;
  background: #f5efe3;
}

.document-card__title {
  margin: 0;
  font-size: 17px;
  line-height: 1.35;
}

.document-card__meta {
  font-size: 12px;
  color: var(--muted);
}

.document-card__kind--file {
  margin: 0;
}

.document-card__action {
  justify-self: start;
}

.badge--soft {
  background: color-mix(in srgb, #e4e9dc 62%, #f8f3e9);
  border-color: color-mix(in srgb, #6f8b73 26%, var(--line));
  color: color-mix(in srgb, #3f5945 82%, var(--text));
}

@media (max-width: 960px) {
  .trust-grid,
  .documents-grid {
    grid-template-columns: 1fr;
  }
}
</style>
