<template>
  <div v-if="isUiV2()" ref="motionRoot" class="pc2-for-clients" :class="{ 'is-reduced': motion.reduced, 'is-paused': motion.paused }" :data-demo-phase="motion.phase" :data-demo-index="motion.index">
    <section class="pc2-for-clients__hero" aria-labelledby="clients-title">
      <div class="pc2-for-clients__intro">
        <p class="pc2-for-clients__eyebrow">Психологи, психотерапевти, консультанти</p>
        <h1 id="clients-title">Знайдіть спеціаліста, який вас почує</h1>
        <p class="pc2-for-clients__lead">Опишіть свій запит, порівняйте підходи та умови консультацій. Зверніться через публічну сторінку спеціаліста — без обов’язкової реєстрації.</p>
        <form role="search" aria-label="Пошук спеціаліста" @submit.prevent="search">
          <label class="pc2-for-clients__sr" for="client-search">Що вас турбує?</label>
          <div class="pc2-for-clients__search">
            <div class="pc2-for-clients__input-wrap">
              <input id="client-search" v-model="query" type="search" name="q" :aria-invalid="Boolean(queryError)" :aria-describedby="queryError ? 'client-search-error' : 'client-search-hint'" @focus="motion.focus" @blur="motion.blur" @input="motion.focus" />
              <span v-if="!query && !motion.focused" class="pc2-for-clients__typed" aria-hidden="true">{{ motion.typed }}<span v-if="motion.phase === 'type' && !motion.reduced" class="pc2-for-clients__caret"></span></span>
            </div>
            <button type="submit" class="pc2-btn pc2-btn--primary"><span class="pc2-for-clients__label-wide">Знайти</span><span class="pc2-for-clients__label-narrow">Знайти спеціаліста</span></button>
          </div>
          <p v-if="queryError" id="client-search-error" class="pc2-error" role="alert">{{ queryError }}</p>
          <p v-else id="client-search-hint" class="pc2-for-clients__sr">Введіть свій запит або оберіть приклад. Кнопка «Знайти» з порожнім полем шукає поточний приклад.</p>
        </form>
        <nav class="pc2-chips" aria-label="Теми запитів">
          <button v-for="(topic, index) in topics" :key="topic.code" type="button" class="pc2-chip" :aria-pressed="motion.index === index" @click="motion.pick(index)">{{ topic.label }}</button>
        </nav>
        <RouterLink class="pc2-for-clients__all" to="/specialists?ui=v2">Переглянути всіх спеціалістів →</RouterLink>
      </div>
      <aside class="pc2-for-clients__preview" aria-labelledby="profile-example-title" aria-describedby="profile-example-note">
        <p id="profile-example-title" class="pc2-for-clients__eyebrow">Ілюстрація інтерфейсу · не результати пошуку</p>
        <p id="profile-example-note" class="pc2-for-clients__hint">Імена, описи й теми — умовні приклади з макета, а не реальні профілі. Доступність не перевіряється.</p>
        <div class="pc2-for-clients__status" aria-hidden="true">
          <span class="pc2-for-clients__listen" :style="{ opacity: motion.phase === 'type' || motion.phase === 'listen' ? 1 : 0.35 }"><span class="pc2-for-clients__ring"></span><span class="pc2-for-clients__ring"></span><img :src="fennecSymbol" alt="" /></span>
          <span>{{ motion.phase === 'show' ? 'Демо: 3 картки за темою' : motion.phase === 'listen' ? 'Демо: пошук за темою…' : 'Приклад запиту' }}</span>
        </div>
        <article v-for="(card, index) in motion.demo.cards" :key="index" class="pc2-card pc2-for-clients__profile-card" :class="{ 'is-shown': motion.phase === 'show' }" :aria-hidden="motion.phase !== 'show'" :style="{ '--demo-delay': motion.phase === 'show' ? `${index * 0.12}s` : '0s' }">
          <span class="pc2-for-clients__avatar" :data-tint="(index + motion.index) % 4" aria-hidden="true">{{ card.initials }}</span>
          <div class="pc2-for-clients__profile-info">
            <div class="pc2-for-clients__profile-heading"><h2>{{ card.name }}</h2><span>{{ card.role }}</span></div>
            <div class="pc2-for-clients__badges"><span v-for="topic in card.topics" :key="topic" :class="{ 'is-match': topic === motion.demo.topic.toLocaleLowerCase('uk') }">{{ topic }}</span></div>
          </div>
          <div class="pc2-for-clients__availability"><span>Час зустрічі</span><strong>Узгоджується</strong><span>Формат · приклад</span></div>
        </article>
      </aside>
    </section>

    <section ref="stepsRoot" class="pc2-for-clients__journey" :data-seen="motion.stepsSeen" aria-labelledby="clients-journey-title">
      <h2 id="clients-journey-title">Від запиту до першої зустрічі</h2>
      <ol class="pc2-for-clients__steps">
        <li v-for="(step, index) in steps" :key="step.title" :style="{ '--reveal-delay': `${0.1 + index * 0.12}s` }"><span class="pc2-for-clients__number" aria-hidden="true"><span class="pc2-for-clients__label-wide">0</span>{{ index + 1 }}</span><h3>{{ step.title }}</h3><p>{{ step.text }}</p></li>
      </ol>
    </section>

    <section class="pc2-for-clients__faq" aria-labelledby="clients-faq-title">
      <div><h2 id="clients-faq-title">Часті питання</h2><p>Не знайшли відповіді? <RouterLink to="/support-and-data-requests">Перегляньте способи звернення до підтримки.</RouterLink></p></div>
      <div>
        <div v-for="(item, index) in faq" :key="item.question" class="pc2-for-clients__faq-item">
          <h3><button :id="`clients-faq-${index}`" type="button" :aria-expanded="openFaq === index" :aria-controls="`clients-answer-${index}`" @click="openFaq = openFaq === index ? -1 : index"><span>{{ item.question }}</span><span class="pc2-for-clients__plus" aria-hidden="true">+</span></button></h3>
          <div :id="`clients-answer-${index}`" class="pc2-for-clients__answer" :class="{ 'is-open': openFaq === index }" :aria-hidden="openFaq !== index" :inert="openFaq !== index" role="region" :aria-labelledby="`clients-faq-${index}`"><div><p>{{ item.answer }}</p></div></div>
        </div>
        <p class="pc2-for-clients__crisis">Pro Consult — не служба екстреної допомоги. Якщо вам зараз загрожує небезпека, зверніться до місцевих екстрених служб. Не очікуйте відповіді спеціаліста чи підтримки на цьому сайті в екстреній ситуації.</p>
      </div>
    </section>

    <section ref="cabinetRoot" class="pc2-for-clients__cabinet" :data-seen="motion.cabinetSeen" aria-labelledby="clients-cabinet-title">
      <div class="pc2-for-clients__cabinet-top">
        <div><h2 id="clients-cabinet-title">Кабінет клієнта — безкоштовно</h2><p>Не обов’язково, але зручно, коли робота вже триває.</p></div>
        <div><RouterLink class="pc2-btn pc2-btn--primary" to="/signup-client?ui=v2">Створити кабінет клієнта</RouterLink><p class="pc2-for-clients__cabinet-hint">Або скористайтеся запрошенням від спеціаліста</p></div>
      </div>
      <dl class="pc2-for-clients__perks">
        <div style="--reveal-delay: .3s"><dt>Сесії</dt><dd>Інформація про ваші зустрічі</dd></div>
        <div style="--reveal-delay: .42s"><dt>Зв’язок</dt><dd>Робота зі своїм спеціалістом в одному просторі</dd></div>
        <div style="--reveal-delay: .54s"><dt>Матеріали</dt><dd>Матеріали, які спеціаліст опублікував для вас</dd></div>
      </dl>
    </section>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, reactive, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { isUiV2 } from '../lib/uiVersion'
import { applyPublicPageMetadata, resetPublicPageMetadata } from '../lib/publicMetadata'
import { useForClientsMotion } from '../composables/useForClientsMotion'
import { forClientsDemos } from '../lib/forClientsDemos'
import fennecSymbol from '../assets/brand-v2/proconsult-fennec-symbol-blue.svg'

const router = useRouter()
const route = useRoute()
const query = ref('')
const queryError = ref('')
const openFaq = ref(0)
const motionRoot = ref<HTMLElement | null>(null)
const stepsRoot = ref<HTMLElement | null>(null)
const cabinetRoot = ref<HTMLElement | null>(null)
const motion = reactive(useForClientsMotion({
  active: () => isUiV2() && route.path === '/for-clients',
  root: motionRoot, steps: stepsRoot, cabinet: cabinetRoot,
}))
// These are existing discovery request_group codes, not inferred topics.
const topics = forClientsDemos.map((demo) => ({ label: demo.topic, code: demo.requestGroup }))
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
  // Only this explicit submission may hand the demo to real search; input stays untouched.
  const searchQuery = normalized ? { q: normalized } : { q: motion.demo.query, request_group: motion.demo.requestGroup }
  await router.push({ path: '/specialists', query: { ...searchQuery, ui: 'v2' } })
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
html[data-ui="v2"] .pc2-for-clients { max-width: var(--pc-container); margin: 0 auto; padding: clamp(20px, 3vw, 32px) var(--pc-gutter) 0; color: var(--pc-text-main); font-family: var(--pc-font); }
html[data-ui="v2"] .pc2-for-clients { --pc-demo-motion-accent: #2f8c86; }
html[data-ui="v2"] .pc2-for-clients h1 { margin: 0; font-size: clamp(38px, 5vw, 64px); line-height: 1.02; letter-spacing: -0.045em; }
html[data-ui="v2"] .pc2-for-clients h2 { margin: 0; font-size: var(--pc-fs-h1); }
html[data-ui="v2"] .pc2-for-clients p { margin: 0; }
html[data-ui="v2"] .pc2-for-clients__hero { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 400px), 1fr)); align-items: center; gap: clamp(28px, 4vw, 56px); padding: clamp(28px, 5vw, 64px); border-radius: 32px; background: var(--pc-teal-100); }
html[data-ui="v2"] .pc2-for-clients__intro { display: flex; flex-direction: column; gap: 22px; min-width: 0; }
html[data-ui="v2"] .pc2-for-clients__eyebrow { color: var(--pc-teal-ink); font-size: var(--pc-fs-small); }
html[data-ui="v2"] .pc2-for-clients__lead { color: var(--pc-teal-ink); font-size: var(--pc-fs-lead); line-height: var(--pc-lh-body); }
html[data-ui="v2"] .pc2-for-clients__sr { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; border: 0; }
html[data-ui="v2"] .pc2-for-clients__search { display: flex; align-items: center; gap: var(--pc-space-3); min-height: calc(var(--pc-control-h) + var(--pc-space-3)); padding: 0 var(--pc-space-2) 0 var(--pc-space-5); border: 1.5px solid var(--pc-teal-500); border-radius: 18px; background: var(--pc-bg-card); box-shadow: var(--pc-shadow-sm); }
html[data-ui="v2"] .pc2-for-clients__search:focus-within { border-color: var(--pc-navy-900); }
html[data-ui="v2"] .pc2-for-clients__search input { min-width: 0; width: 100%; padding: var(--pc-space-2) 0; border: 0; border-radius: var(--pc-radius-xs); background: var(--pc-bg-card); color: var(--pc-text-main); font: inherit; font-size: var(--pc-fs-body); }
html[data-ui="v2"] .pc2-for-clients__search input::placeholder { color: var(--pc-text-body); opacity: 1; }
html[data-ui="v2"] .pc2-for-clients__search .pc2-btn { min-height: var(--pc-header-row-h); padding-inline: 18px; border-radius: 14px; }
html[data-ui="v2"] .pc2-for-clients .pc2-chip { padding: var(--pc-space-2) 14px; font-size: var(--pc-fs-small); }
html[data-ui="v2"] .pc2-for-clients .pc2-for-clients__hint { margin-top: var(--pc-space-2); color: var(--pc-teal-ink); font-size: var(--pc-fs-meta); }
html[data-ui="v2"] .pc2-for-clients__all { align-self: flex-start; color: var(--pc-navy-900); font-size: var(--pc-fs-small); text-decoration: underline; text-underline-offset: var(--pc-space-1); }
html[data-ui="v2"] .pc2-for-clients__preview { display: flex; flex-direction: column; gap: var(--pc-space-3); min-width: 0; }
html[data-ui="v2"] .pc2-for-clients__profile-card { display: grid; grid-template-columns: 52px minmax(0, 1fr) auto; align-items: center; gap: var(--pc-space-3) 14px; padding: var(--pc-space-4) 18px; border: 0; border-radius: 20px; box-shadow: var(--pc-shadow-sm); line-height: 1.25; }
html[data-ui="v2"] .pc2-for-clients__avatar { display: grid; place-items: center; width: 52px; height: 52px; border-radius: var(--pc-radius-md); background: var(--pc-teal-200); color: var(--pc-teal-ink); font-weight: var(--pc-fw-strong); }
html[data-ui="v2"] .pc2-for-clients__avatar[data-tint="1"] { background: var(--pc-peach-200); color: var(--pc-peach-ink); }
html[data-ui="v2"] .pc2-for-clients__avatar[data-tint="2"] { background: var(--pc-info-soft); color: var(--pc-info); }
html[data-ui="v2"] .pc2-for-clients__avatar[data-tint="3"] { background: var(--pc-bg-sunk); color: var(--pc-text-body); }
html[data-ui="v2"] .pc2-for-clients__profile-info { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
html[data-ui="v2"] .pc2-for-clients__profile-heading { display: flex; flex-wrap: wrap; align-items: baseline; gap: var(--pc-space-1) 10px; }
html[data-ui="v2"] .pc2-for-clients__profile-heading h2 { font-size: var(--pc-fs-body); }
html[data-ui="v2"] .pc2-for-clients__profile-heading > span { font-size: var(--pc-fs-meta); color: var(--pc-text-muted); }
html[data-ui="v2"] .pc2-for-clients__badges { display: flex; flex-wrap: wrap; gap: 6px; }
html[data-ui="v2"] .pc2-for-clients__badges span { padding: var(--pc-space-1) 10px; border-radius: var(--pc-radius-pill); background: var(--pc-bg-soft); color: var(--pc-text-body); font-size: var(--pc-fs-micro); }
html[data-ui="v2"] .pc2-for-clients__badges .is-match { background: var(--pc-teal-200); color: var(--pc-teal-ink); }
html[data-ui="v2"] .pc2-for-clients__availability { display: flex; flex-direction: column; align-items: flex-end; gap: var(--pc-space-1); text-align: right; }
html[data-ui="v2"] .pc2-for-clients__availability span { font-size: var(--pc-fs-micro); color: var(--pc-text-muted); }
html[data-ui="v2"] .pc2-for-clients__availability strong { font-size: var(--pc-fs-ui); font-weight: var(--pc-fw-medium); white-space: nowrap; }
html[data-ui="v2"] .pc2-for-clients__input-wrap { position: relative; flex: 1; min-width: 0; }
html[data-ui="v2"] .pc2-for-clients__search { border-color: var(--pc-teal-200); transition: border-color .3s; }
html[data-ui="v2"] .pc2-for-clients[data-demo-phase="type"] .pc2-for-clients__search { border-color: var(--pc-teal-500); }
html[data-ui="v2"] .pc2-for-clients__search:focus-within { border-color: var(--pc-navy-900); }
html[data-ui="v2"] .pc2-for-clients__typed { position: absolute; inset: 50% 0 auto; transform: translateY(-50%); display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; pointer-events: none; color: var(--pc-text-body); font-size: var(--pc-fs-body); }
html[data-ui="v2"] .pc2-for-clients__caret { display: inline-block; flex-shrink: 0; width: 2px; height: 1.1em; margin-left: 2px; vertical-align: -0.15em; background: var(--pc-demo-motion-accent); animation: pc2ForClientsCaret 1s steps(1) infinite; }
html[data-ui="v2"] .pc2-for-clients__status { display: flex; align-items: center; gap: var(--pc-space-3); min-height: var(--pc-space-10); color: var(--pc-teal-ink); font-size: var(--pc-fs-small); }
html[data-ui="v2"] .pc2-for-clients__listen { position: relative; width: 32px; height: 32px; flex-shrink: 0; transition: opacity .3s; }
html[data-ui="v2"] .pc2-for-clients__listen img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; animation: pc2ForClientsBreath 3.2s ease-in-out infinite; }
html[data-ui="v2"] .pc2-for-clients__ring { position: absolute; inset: 0; border: 1.5px solid var(--pc-demo-motion-accent); border-radius: 50%; mask: conic-gradient(black 0 156deg, transparent 156deg 198deg, black 198deg); animation: pc2ForClientsRing 1.8s cubic-bezier(.2,.6,.3,1) infinite; }
html[data-ui="v2"] .pc2-for-clients__ring:nth-child(2) { animation-delay: .9s; }
html[data-ui="v2"] .pc2-for-clients__profile-card { opacity: 0; transform: translateY(14px); transition: opacity .45s ease var(--demo-delay), transform .55s cubic-bezier(.2,.8,.2,1) var(--demo-delay), box-shadow .2s; }
html[data-ui="v2"] .pc2-for-clients__profile-card.is-shown { opacity: 1; transform: translateY(0); }
html[data-ui="v2"] .pc2-for-clients__profile-card { box-shadow: 0 8px 24px color-mix(in srgb, var(--pc-text-main) 6%, transparent); }
html[data-ui="v2"] .pc2-for-clients__profile-card:hover { box-shadow: 0 12px 32px color-mix(in srgb, var(--pc-text-main) 12%, transparent); }
html[data-ui="v2"] .pc2-for-clients .pc2-chip { transition: background .25s, color .25s, border-color .25s; }
html[data-ui="v2"] .pc2-for-clients__journey li { opacity: 0; transform: translateY(14px); transition: opacity .6s ease var(--reveal-delay), transform .7s cubic-bezier(.2,.8,.2,1) var(--reveal-delay); }
html[data-ui="v2"] .pc2-for-clients__journey[data-seen="true"] li { opacity: 1; transform: translateY(0); }
html[data-ui="v2"] .pc2-for-clients__cabinet .pc2-for-clients__perks > div { opacity: 0; transform: translateY(14px); transition: opacity .5s ease var(--reveal-delay), transform .6s cubic-bezier(.2,.8,.2,1) var(--reveal-delay); }
html[data-ui="v2"] .pc2-for-clients__cabinet[data-seen="true"] .pc2-for-clients__perks > div { opacity: 1; transform: translateY(0); }
html[data-ui="v2"] .pc2-for-clients__answer { display: grid; grid-template-rows: 0fr; visibility: hidden; transition: grid-template-rows .35s cubic-bezier(.2,.8,.2,1), visibility 0s .35s; }
html[data-ui="v2"] .pc2-for-clients__answer.is-open { grid-template-rows: 1fr; visibility: visible; transition: grid-template-rows .35s cubic-bezier(.2,.8,.2,1), visibility 0s; }
html[data-ui="v2"] .pc2-for-clients__answer > div { min-height: 0; overflow: hidden; }
html[data-ui="v2"] .pc2-for-clients__plus { transition: transform .3s cubic-bezier(.2,.8,.2,1), background .2s; }
html[data-ui="v2"] .pc2-for-clients__faq-item button[aria-expanded="true"] .pc2-for-clients__plus { transform: rotate(45deg); }
html[data-ui="v2"] .pc2-for-clients.is-paused * { animation-play-state: paused !important; }
html[data-ui="v2"] .pc2-for-clients.is-reduced *, html[data-ui="v2"] .pc2-for-clients.is-reduced *::before, html[data-ui="v2"] .pc2-for-clients.is-reduced *::after { animation: none !important; transition: none !important; }
@keyframes pc2ForClientsCaret { 0% { opacity: 1; } 50% { opacity: 0; } }
@keyframes pc2ForClientsRing { 0% { transform: scale(1.04); opacity: .55; } 100% { transform: scale(1.9); opacity: 0; } }
@keyframes pc2ForClientsBreath { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.035); } }
@media (prefers-reduced-motion: reduce) {
  html[data-ui="v2"] .pc2-for-clients *, html[data-ui="v2"] .pc2-for-clients *::before, html[data-ui="v2"] .pc2-for-clients *::after { animation: none !important; transition: none !important; }
}
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
@media (max-width: 767px) {
  html[data-ui="v2"] .pc2-for-clients__faq, html[data-ui="v2"] .pc2-for-clients__steps, html[data-ui="v2"] .pc2-for-clients__perks { grid-template-columns: 1fr; }
  html[data-ui="v2"] .pc2-for-clients__faq { gap: var(--pc-space-8); }
  html[data-ui="v2"] .pc2-for-clients__cabinet .pc2-btn { white-space: normal; text-align: center; line-height: var(--pc-lh-head); }
}
/* Public-Mobile.dc.html P3 (< 768px): search card in a column, topic strip, numbered step list. */
html[data-ui="v2"] .pc2-for-clients__label-narrow { display: none; }
@media (max-width: 767px) {
  html[data-ui="v2"] .pc2-for-clients__label-wide { display: none; }
  html[data-ui="v2"] .pc2-for-clients__label-narrow { display: inline; }
  html[data-ui="v2"] .pc2-for-clients { padding-top: 0; }
  html[data-ui="v2"] .pc2-for-clients__hero { display: block; margin: 0 calc(var(--pc-gutter) * -1); padding: 24px var(--pc-gutter) 0; border-radius: 0; background: linear-gradient(180deg, var(--pc-teal-100) 0, var(--pc-bg-main) 360px); }
  html[data-ui="v2"] .pc2-for-clients__intro { gap: 16px; }
  html[data-ui="v2"] .pc2-for-clients__intro .pc2-for-clients__eyebrow { font-size: 13px; letter-spacing: .04em; color: var(--pc-demo-motion-accent); }
  html[data-ui="v2"] .pc2-for-clients h1 { font-size: 36px; line-height: 1.04; letter-spacing: -.045em; text-wrap: balance; }
  html[data-ui="v2"] .pc2-for-clients__lead { font-size: 16px; line-height: 1.55; color: var(--pc-teal-ink); text-wrap: pretty; }
  html[data-ui="v2"] .pc2-for-clients__search { flex-direction: column; align-items: stretch; gap: 8px; min-height: 0; padding: 8px; border: 1px solid var(--pc-teal-200); border-radius: 22px; box-shadow: 0 12px 32px rgb(18 35 58 / 6%); }
  html[data-ui="v2"] .pc2-for-clients[data-demo-phase="type"] .pc2-for-clients__search { border-color: var(--pc-teal-200); }
  html[data-ui="v2"] .pc2-for-clients__search:focus-within { border-color: var(--pc-navy-900); }
  html[data-ui="v2"] .pc2-for-clients__input-wrap { min-height: 52px; padding: 0 14px; }
  html[data-ui="v2"] .pc2-for-clients__search input { padding: 14px 0; line-height: 1.4; }
  html[data-ui="v2"] .pc2-for-clients__typed { inset: 50% 14px auto; color: var(--pc-text-soft); }
  html[data-ui="v2"] .pc2-for-clients__search .pc2-btn { width: 100%; min-height: 52px; border-radius: 999px; font-size: 16px; font-weight: 500; }
  html[data-ui="v2"] .pc2-for-clients .pc2-chips { flex-wrap: nowrap; gap: 6px; overflow-x: auto; margin: 0 calc(var(--pc-gutter) * -1); padding: 0 var(--pc-gutter); scrollbar-width: none; overscroll-behavior-x: contain; }
  html[data-ui="v2"] .pc2-for-clients .pc2-chips::-webkit-scrollbar { display: none; }
  html[data-ui="v2"] .pc2-for-clients .pc2-chip { flex-shrink: 0; white-space: nowrap; min-height: 40px; padding: 0 14px; font-size: 14px; }
  html[data-ui="v2"] .pc2-for-clients .pc2-chip:not([aria-pressed="true"]) { background: var(--pc-bg-card); border-color: var(--pc-teal-200); }
  html[data-ui="v2"] .pc2-for-clients__preview { display: none; }
  html[data-ui="v2"] .pc2-for-clients__journey { padding-block: 32px var(--pc-space-12); }
  html[data-ui="v2"] .pc2-for-clients__journey h2 { font-size: 24px; letter-spacing: -.03em; }
  html[data-ui="v2"] .pc2-for-clients__steps { gap: 0; margin-top: 16px; }
  html[data-ui="v2"] .pc2-for-clients__steps li { display: grid; grid-template-columns: 32px minmax(0, 1fr); column-gap: 12px; align-items: start; padding: 14px 0; border-top: 1px solid var(--pc-border-hair); }
  html[data-ui="v2"] .pc2-for-clients__number { grid-row: 1 / span 2; display: grid; place-items: center; width: 32px; height: 32px; border-radius: 50%; background: var(--pc-teal-100); color: var(--pc-teal-ink); font-size: 14px; font-weight: 500; }
  html[data-ui="v2"] .pc2-for-clients__steps h3 { margin: 0; font-size: 16px; font-weight: 500; }
  html[data-ui="v2"] .pc2-for-clients__steps p { font-size: 14px; line-height: 1.5; color: var(--pc-text-muted); }
}
@media (max-width: 639px) {
  html[data-ui="v2"] .pc2-for-clients__profile-card { grid-template-columns: 52px minmax(0, 1fr); }
  html[data-ui="v2"] .pc2-for-clients__availability { grid-column: 1 / -1; flex-direction: row; flex-wrap: wrap; align-items: baseline; gap: var(--pc-space-1) var(--pc-space-2); text-align: left; }
}
</style>
