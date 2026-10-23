<template>
  <div v-if="isUiV2()" class="pc2-for-clients">
    <section class="pc2-for-clients__hero" aria-labelledby="clients-title">
      <div class="pc2-for-clients__intro">
        <p class="pc2-for-clients__eyebrow">Психологи, психотерапевти, консультанти</p>
        <h1 id="clients-title">Знайдіть спеціаліста, який вас почує</h1>
        <p class="pc2-for-clients__lead">Оберіть тему або опишіть свій запит для пошуку. Порівняйте підходи спеціалістів і зверніться через їхні публічні сторінки — без обов’язкової реєстрації.</p>
        <form role="search" aria-label="Пошук спеціаліста" @submit.prevent="search">
          <label class="pc2-for-clients__label" for="client-search">Що вас турбує?</label>
          <div class="pc2-for-clients__search">
            <input id="client-search" v-model="query" type="search" name="q" placeholder="Наприклад, тривога" :aria-invalid="Boolean(queryError)" :aria-describedby="queryError ? 'client-search-error' : 'client-search-hint'" />
            <button type="submit" class="pc2-btn pc2-btn--primary">Знайти</button>
          </div>
          <p v-if="queryError" id="client-search-error" class="pc2-error" role="alert">{{ queryError }}</p>
          <p v-else id="client-search-hint" class="pc2-for-clients__hint">Пошук за словами або категорією запиту.</p>
        </form>
        <nav class="pc2-chips" aria-label="Теми запитів">
          <RouterLink v-for="topic in topics" :key="topic.code" class="pc2-chip" :to="{ path: '/specialists', query: { request_group: topic.code, ui: 'v2' } }">{{ topic.label }}</RouterLink>
        </nav>
        <RouterLink class="pc2-for-clients__all" to="/specialists?ui=v2">Переглянути всіх спеціалістів →</RouterLink>
      </div>
      <aside class="pc2-for-clients__preview" aria-labelledby="profile-example-title">
        <p id="profile-example-title" class="pc2-for-clients__eyebrow">На сторінці спеціаліста</p>
        <p class="pc2-for-clients__hint">Приклад інформації для вибору, а не результати пошуку.</p>
        <div v-for="(card, index) in profileDetails" :key="card.title" class="pc2-card pc2-for-clients__profile-card">
          <span class="pc2-for-clients__well" aria-hidden="true">0{{ index + 1 }}</span>
          <div><h2>{{ card.title }}</h2><p>{{ card.text }}</p></div>
        </div>
      </aside>
    </section>

    <section class="pc2-for-clients__journey" aria-labelledby="clients-journey-title">
      <h2 id="clients-journey-title">Від запиту до першої зустрічі</h2>
      <ol class="pc2-for-clients__steps">
        <li v-for="(step, index) in steps" :key="step.title"><span class="pc2-for-clients__number" aria-hidden="true">0{{ index + 1 }}</span><h3>{{ step.title }}</h3><p>{{ step.text }}</p></li>
      </ol>
    </section>

    <section class="pc2-for-clients__faq" aria-labelledby="clients-faq-title">
      <div><h2 id="clients-faq-title">Часті питання</h2><p>Не знайшли відповіді? <RouterLink to="/support-and-data-requests">Перегляньте способи звернення до підтримки.</RouterLink></p></div>
      <div>
        <div v-for="(item, index) in faq" :key="item.question" class="pc2-for-clients__faq-item">
          <h3><button :id="`clients-faq-${index}`" type="button" :aria-expanded="openFaq === index" :aria-controls="`clients-answer-${index}`" @click="openFaq = openFaq === index ? -1 : index"><span>{{ item.question }}</span><span class="pc2-for-clients__plus" aria-hidden="true">{{ openFaq === index ? '−' : '+' }}</span></button></h3>
          <div :id="`clients-answer-${index}`" :hidden="openFaq !== index" role="region" :aria-labelledby="`clients-faq-${index}`"><p>{{ item.answer }}</p></div>
        </div>
        <p class="pc2-for-clients__crisis">Pro Consult — не служба екстреної допомоги. Якщо вам зараз загрожує небезпека, зверніться до місцевих екстрених служб. Не очікуйте відповіді спеціаліста чи підтримки на цьому сайті в екстреній ситуації.</p>
      </div>
    </section>

    <section class="pc2-for-clients__cabinet" aria-labelledby="clients-cabinet-title">
      <div class="pc2-for-clients__cabinet-top">
        <div><h2 id="clients-cabinet-title">Кабінет клієнта — безкоштовно</h2><p>Не обов’язково, але зручно, коли робота вже триває.</p></div>
        <div><RouterLink class="pc2-btn pc2-btn--primary" to="/signup-client?ui=v2">Створити кабінет клієнта</RouterLink><p class="pc2-for-clients__cabinet-hint">Або скористайтеся запрошенням від спеціаліста</p></div>
      </div>
      <dl class="pc2-for-clients__perks">
        <div><dt>Сесії</dt><dd>Інформація про ваші зустрічі</dd></div>
        <div><dt>Зв’язок</dt><dd>Робота зі своїм спеціалістом в одному просторі</dd></div>
        <div><dt>Матеріали</dt><dd>Матеріали, які спеціаліст опублікував для вас</dd></div>
      </dl>
    </section>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { isUiV2 } from '../lib/uiVersion'
import { applyPublicPageMetadata, resetPublicPageMetadata } from '../lib/publicMetadata'

const router = useRouter()
const route = useRoute()
const query = ref('')
const queryError = ref('')
const openFaq = ref(0)
// These are existing discovery request_group codes, not inferred topics.
const topics = [
  { label: 'Тривога', code: 'emotional_state' },
  { label: 'Вигорання', code: 'work_career_burnout' },
  { label: 'Стосунки', code: 'relationships_family' },
  { label: 'Самооцінка', code: 'self_esteem_change' },
  { label: 'Втрата', code: 'loss_life_changes' },
]
const profileDetails = [
  { title: 'Теми роботи', text: 'З якими запитами працює спеціаліст.' },
  { title: 'Підхід і досвід', text: 'Опис роботи й освіта, зазначені спеціалістом.' },
  { title: 'Формат і вартість', text: 'Умови консультацій на публічній сторінці.' },
]
const steps = [
  { title: 'Опишіть запит', text: 'Своїми словами або оберіть категорію. Не потрібно знати назви методів чи діагнозів.' },
  { title: 'Порівняйте спеціалістів', text: 'Прочитайте про підхід, освіту, формат і вартість на публічних сторінках.' },
  { title: 'Зверніться напряму', text: 'Якщо спеціаліст приймає гостьові запити, залиште звернення без реєстрації. Час зустрічі потребує узгодження — запит не є підтвердженою сесією.' },
]
const faq = [
  { question: 'Скільки коштує консультація?', answer: 'Вартість і умови оплати встановлює спеціаліст. Перегляньте їх на його сторінці та узгодьте оплату з ним. Pro Consult не бере комісії з консультацій і не обробляє оплату автоматично. Підписка спеціаліста на платформу — окрема послуга.' },
  { question: 'Чи потрібно реєструватися?', answer: 'Для перегляду спеціалістів реєстрація не потрібна. На сторінках, де доступне гостьове звернення, можна надіслати запит без облікового запису. Кабінет клієнта можна створити окремо, коли він вам потрібен.' },
  { question: 'Як зрозуміти, що спеціаліст мені підходить?', answer: 'Подивіться, з якими темами він працює, який підхід і формат, чи відгукується вам його опис. Перша зустріч — це знайомство: можна поставити питання й вирішити, чи продовжувати.' },
  { question: 'Хто бачить мій запит?', answer: 'Запит призначений обраному спеціалісту й не є публікацією в каталозі. Уповноважені працівники можуть мати обмежений доступ для підтримки, безпеки та виконання законних обов’язків відповідно до політики конфіденційності.' },
  { question: 'Онлайн чи наживо?', answer: 'Доступний формат зазначає спеціаліст на своїй сторінці. У каталозі можна застосувати фільтр онлайн або офлайн. Конкретні умови й час зустрічі узгоджуються зі спеціалістом.' },
  { question: 'Що робити, якщо спеціаліст не відповідає?', answer: 'Час відповіді залежить від спеціаліста — Pro Consult не гарантує фіксованого строку. Ви можете звернутися до іншого спеціаліста. З технічними питаннями скористайтеся сторінкою підтримки.' },
]

async function search() {
  const normalized = query.value.normalize('NFKC').trim()
  if (normalized && normalized.length < 3) {
    queryError.value = 'Запит має містити щонайменше 3 символи.'
    return
  }
  if (normalized.length > 240) {
    queryError.value = 'Запит має містити не більше 240 символів.'
    return
  }
  queryError.value = ''
  await router.push({ path: '/specialists', query: { ...(normalized ? { q: normalized } : {}), ui: 'v2' } })
}

watch(() => [isUiV2(), route.fullPath], () => {
  if (route.path !== '/for-clients') return
  if (!isUiV2()) {
    // Keep the existing v1 client-entry experience, including acquisition query.
    void router.replace({ path: '/', query: route.query, hash: '#client-entry-title' })
    return
  }
  const origin = window.location.origin
  applyPublicPageMetadata({
    title: 'Pro Consult — знайдіть психолога чи психотерапевта',
    description: 'Знайдіть спеціаліста за запитом, порівняйте підходи й умови консультацій. Гостьове звернення доступне без обов’язкової реєстрації.',
    canonicalUrl: `${origin}/for-clients`,
    ogType: 'website',
    imageUrl: `${origin}/og-image.png?v=20260707`,
    imageAlt: 'Pro Consult',
  })
}, { immediate: true, flush: 'post' })
onBeforeUnmount(resetPublicPageMetadata)
</script>

<style scoped>
html[data-ui="v2"] .pc2-for-clients { max-width: var(--pc-container); margin: 0 auto; padding: var(--pc-space-8) var(--pc-gutter) 0; color: var(--pc-text-main); font-family: var(--pc-font); }
html[data-ui="v2"] .pc2-for-clients h1 { margin: 0; font-size: var(--pc-fs-display); line-height: var(--pc-lh-tight); letter-spacing: var(--pc-ls-display); }
html[data-ui="v2"] .pc2-for-clients h2 { margin: 0; font-size: var(--pc-fs-h1); }
html[data-ui="v2"] .pc2-for-clients p { margin: 0; }
html[data-ui="v2"] .pc2-for-clients__hero { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); align-items: center; gap: var(--pc-space-10); padding: clamp(28px, 4vw, 64px); border-radius: var(--pc-radius-lg); background: var(--pc-teal-100); }
html[data-ui="v2"] .pc2-for-clients__intro { display: flex; flex-direction: column; gap: var(--pc-space-5); min-width: 0; }
html[data-ui="v2"] .pc2-for-clients__eyebrow { color: var(--pc-teal-ink); font-size: var(--pc-fs-small); }
html[data-ui="v2"] .pc2-for-clients__lead { color: var(--pc-teal-ink); font-size: var(--pc-fs-lead); line-height: var(--pc-lh-body); }
html[data-ui="v2"] .pc2-for-clients__label { display: block; margin-bottom: var(--pc-space-2); color: var(--pc-teal-ink); font-size: var(--pc-fs-small); }
html[data-ui="v2"] .pc2-for-clients__search { display: flex; align-items: center; gap: var(--pc-space-2); min-height: var(--pc-control-h-lg); padding: var(--pc-space-2); border: 1px solid var(--pc-teal-500); border-radius: var(--pc-radius-md); background: var(--pc-bg-card); box-shadow: var(--pc-shadow-sm); }
html[data-ui="v2"] .pc2-for-clients__search:focus-within { border-color: var(--pc-navy-900); }
html[data-ui="v2"] .pc2-for-clients__search input { min-width: 0; width: 100%; padding: var(--pc-space-2); border: 0; border-radius: var(--pc-radius-xs); background: var(--pc-bg-card); color: var(--pc-text-main); font: inherit; font-size: var(--pc-fs-body); }
html[data-ui="v2"] .pc2-for-clients__search input::placeholder { color: var(--pc-text-muted); }
html[data-ui="v2"] .pc2-for-clients__search .pc2-btn { padding-inline: var(--pc-space-4); border-radius: var(--pc-radius-sm); }
html[data-ui="v2"] .pc2-for-clients .pc2-for-clients__hint { margin-top: var(--pc-space-2); color: var(--pc-teal-ink); font-size: var(--pc-fs-meta); }
html[data-ui="v2"] .pc2-for-clients__all { align-self: flex-start; color: var(--pc-navy-900); font-size: var(--pc-fs-small); text-decoration: underline; text-underline-offset: var(--pc-space-1); }
html[data-ui="v2"] .pc2-for-clients__preview { display: flex; flex-direction: column; gap: var(--pc-space-3); min-width: 0; }
html[data-ui="v2"] .pc2-for-clients__profile-card { display: flex; align-items: center; gap: var(--pc-space-4); padding: var(--pc-space-5); box-shadow: var(--pc-shadow-sm); }
html[data-ui="v2"] .pc2-for-clients__profile-card h2 { font-size: var(--pc-fs-body); margin-bottom: var(--pc-space-1); }
html[data-ui="v2"] .pc2-for-clients__profile-card p { font-size: var(--pc-fs-small); color: var(--pc-text-body); }
html[data-ui="v2"] .pc2-for-clients__well { display: grid; place-items: center; width: var(--pc-space-12); height: var(--pc-space-12); flex-shrink: 0; border-radius: var(--pc-radius-sm); background: var(--pc-teal-200); color: var(--pc-teal-ink); }
html[data-ui="v2"] .pc2-for-clients__journey { padding-block: var(--pc-section-y) var(--pc-space-16); }
html[data-ui="v2"] .pc2-for-clients__steps { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--pc-space-4); list-style: none; padding: 0; margin: var(--pc-space-8) 0 0; }
html[data-ui="v2"] .pc2-for-clients__steps li { border-top: 1px solid var(--pc-border-strong); padding-top: var(--pc-space-5); }
html[data-ui="v2"] .pc2-for-clients__steps h3 { font-size: var(--pc-fs-h3); margin: var(--pc-space-2) 0; }
html[data-ui="v2"] .pc2-for-clients__steps p { font-size: var(--pc-fs-ui); color: var(--pc-text-body); }
html[data-ui="v2"] .pc2-for-clients__number { color: var(--pc-text-muted); font-size: var(--pc-fs-small); }
html[data-ui="v2"] .pc2-for-clients__faq { display: grid; grid-template-columns: 0.8fr 1.2fr; gap: var(--pc-space-12); padding-bottom: var(--pc-section-y); }
html[data-ui="v2"] .pc2-for-clients__faq > div > p { margin-top: var(--pc-space-3); font-size: var(--pc-fs-ui); color: var(--pc-text-body); }
html[data-ui="v2"] .pc2-for-clients__faq a { color: var(--pc-navy-900); text-decoration: underline; }
html[data-ui="v2"] .pc2-for-clients__faq-item { border-top: 1px solid var(--pc-border); }
html[data-ui="v2"] .pc2-for-clients__faq-item h3 { margin: 0; }
html[data-ui="v2"] .pc2-for-clients__faq-item button { display: flex; align-items: center; justify-content: space-between; width: 100%; gap: var(--pc-space-4); min-height: var(--pc-control-h-lg); padding: var(--pc-space-4) 0; background: transparent; border: 0; color: var(--pc-text-main); font: var(--pc-fw-medium) var(--pc-fs-body)/var(--pc-lh-body) var(--pc-font); text-align: left; cursor: pointer; }
html[data-ui="v2"] .pc2-for-clients__faq-item button:hover { color: var(--pc-navy-900); }
html[data-ui="v2"] .pc2-for-clients__plus { display: grid; place-items: center; width: var(--pc-space-8); height: var(--pc-space-8); flex-shrink: 0; border-radius: var(--pc-radius-pill); background: var(--pc-bg-sunk); color: var(--pc-text-main); }
html[data-ui="v2"] .pc2-for-clients__faq-item button[aria-expanded="true"] .pc2-for-clients__plus { background: var(--pc-navy-900); color: var(--pc-bg-card); }
html[data-ui="v2"] .pc2-for-clients__faq-item [role="region"] p { padding: 0 var(--pc-space-12) var(--pc-space-5) 0; color: var(--pc-text-body); font-size: var(--pc-fs-ui); }
html[data-ui="v2"] .pc2-for-clients__faq .pc2-for-clients__crisis { margin-top: var(--pc-space-5); padding: var(--pc-space-4); border-radius: var(--pc-radius-md); background: var(--pc-peach-100); color: var(--pc-peach-ink); font-size: var(--pc-fs-small); }
html[data-ui="v2"] .pc2-for-clients__cabinet { margin-bottom: var(--pc-section-y); padding: clamp(24px, 4vw, 44px); border-radius: var(--pc-radius-lg); background: var(--pc-navy-900); color: var(--pc-bg-card); }
html[data-ui="v2"] .pc2-for-clients__cabinet h2 { font-size: var(--pc-fs-h2); color: var(--pc-bg-card); }
html[data-ui="v2"] .pc2-for-clients__cabinet-top { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: var(--pc-space-6); }
html[data-ui="v2"] .pc2-for-clients__cabinet-top p { margin-top: var(--pc-space-2); }
html[data-ui="v2"] .pc2-for-clients__cabinet .pc2-btn { border-color: var(--pc-bg-card); }
html[data-ui="v2"] .pc2-for-clients__cabinet :focus-visible { outline-color: var(--pc-bg-card); }
html[data-ui="v2"] .pc2-for-clients__cabinet-hint { font-size: var(--pc-fs-meta); }
html[data-ui="v2"] .pc2-for-clients__perks { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--pc-space-2); margin: var(--pc-space-6) 0 0; }
html[data-ui="v2"] .pc2-for-clients__perks > div { padding: var(--pc-space-4); border: 1px solid var(--pc-bg-card); border-radius: var(--pc-radius-md); }
html[data-ui="v2"] .pc2-for-clients__perks dt { font-size: var(--pc-fs-meta); margin-bottom: var(--pc-space-1); }
html[data-ui="v2"] .pc2-for-clients__perks dd { margin: 0; font-size: var(--pc-fs-ui); }
@media (max-width: 1000px) {
  html[data-ui="v2"] .pc2-for-clients__hero { grid-template-columns: 1fr; }
}
@media (max-width: 767px) {
  html[data-ui="v2"] .pc2-for-clients { padding-top: var(--pc-space-5); }
  html[data-ui="v2"] .pc2-for-clients__hero { padding: var(--pc-space-6); gap: var(--pc-space-8); }
  html[data-ui="v2"] .pc2-for-clients__faq, html[data-ui="v2"] .pc2-for-clients__steps, html[data-ui="v2"] .pc2-for-clients__perks { grid-template-columns: 1fr; }
  html[data-ui="v2"] .pc2-for-clients__faq { gap: var(--pc-space-8); }
  html[data-ui="v2"] .pc2-for-clients__cabinet .pc2-btn { white-space: normal; text-align: center; line-height: var(--pc-lh-head); }
}
</style>
