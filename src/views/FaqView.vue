<template>
  <section class="faq">
    <header class="faq__hero">
      <div>
        <div class="badge">FAQ</div>
        <h1 class="title faq__title">Часті питання</h1>
        <p class="muted faq__subtitle">
          Короткі відповіді про те, як працює простір і що очікувати.
        </p>
      </div>
      <RouterLink class="btn btn--ghost" to="/">На головну</RouterLink>
    </header>

    <section class="panel">
      <details class="faq-item" open>
        <summary>Що таке Pro Consult?</summary>
        <p>Це інструмент для організації практики спеціаліста: профіль, запити, сесії, клієнти та групові події.</p>
      </details>
      <details class="faq-item">
        <summary>Чи бере сервіс комісію із сесій?</summary>
        <p>Ні. Pro Consult не втручається у фінансові домовленості між клієнтом і спеціалістом.</p>
      </details>
      <details class="faq-item">
        <summary>Як клієнт звертається до спеціаліста?</summary>
        <p>
          Клієнт відкриває публічний профіль спеціаліста і залишає запит без реєстрації. Спеціаліст бачить запит у
          кабінеті, узгоджує деталі та створює сесію.
        </p>
      </details>
      <details class="faq-item">
        <summary>Чи обов’язково додавати доступний час?</summary>
        <p>
          Ні. Для старту достатньо заповнити профіль, увімкнути публічний профіль і приймати запити. Доступний час
          можна додати окремо, якщо спеціаліст хоче дозволити пряме бронювання.
        </p>
      </details>
      <details class="faq-item">
        <summary>Чи можна перенести сесію?</summary>
        <p>Так. Клієнт може створити запит на перенесення, а спеціаліст має його підтвердити.</p>
      </details>
      <details class="faq-item">
        <summary>Чи можна приховати профіль?</summary>
        <p>Так. У кабінеті спеціаліста є перемикач публічності профілю.</p>
      </details>
      <details class="faq-item">
        <summary>Чи є Pro Consult медичною інформаційною системою?</summary>
        <p>
          Ні. Pro Consult — це SaaS-інструмент для організації приватної консультаційної практики: профіль, запити,
          сесії, календар, матеріали та робочі нотатки. Сервіс не призначений для ведення медичної документації,
          діагнозів або історій хвороби.
        </p>
      </details>
      <details class="faq-item">
        <summary>Що таке групові події?</summary>
        <p>Це зустрічі або трансляції з кількома учасниками, з інвайтами, ролями та лімітами.</p>
      </details>
      <details class="faq-item">
        <summary>Де побачити відгуки?</summary>
        <p>Відгуки доступні у кабінеті спеціаліста та на публічному профілі після підтвердження.</p>
      </details>
      <details class="faq-item">
        <summary>Чи є підтримка?</summary>
        <p>Поки що підтримка працює через заявки. Ми додамо чат у наступних релізах.</p>
      </details>
    </section>
  </section>
</template>

<script setup lang="ts"></script>

<style scoped>
.faq {
  display: grid;
  gap: 18px;
}

.faq__hero {
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

.faq__title {
  font-size: 32px;
}

.faq__subtitle {
  max-width: 520px;
}

.panel {
  border: 1px solid var(--line);
  border-radius: 18px;
  padding: 18px;
  background: #fff;
  display: grid;
  gap: 8px;
}

.faq-item {
  border: 1px solid rgba(47, 63, 73, 0.12);
  border-radius: 12px;
  padding: 12px 14px;
  background: rgba(7, 47, 71, 0.03);
}

.faq-item summary {
  cursor: pointer;
  font-weight: 600;
}

.faq-item p {
  margin: 8px 0 0;
  color: var(--muted);
  line-height: 1.5;
}

@media (max-width: 860px) {
  .faq__hero {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
