<template>
  <section class="policy">
    <header class="policy__hero">
      <div>
        <div class="badge">Політика</div>
        <h1 class="title policy__title">Політика анонімних відгуків</h1>
        <p class="muted policy__subtitle">
          Коротко про те, як працюють приватні відгуки та чому вони важливі.
        </p>
      </div>
      <RouterLink class="btn btn--ghost" to="/">На головну</RouterLink>
    </header>

    <section class="panel">
      <h2>Що таке приватний текстовий відгук</h2>
      <p>
        Відгук — це короткий текст, який бачить лише спеціаліст. Публічного рейтингу або
        відображення для інших клієнтів немає. Ми не показуємо ім’я автора, профіль або інші
        персональні дані.
      </p>

      <h2>Анонімність</h2>
      <p>
        Ваш відгук анонімний: спеціаліст бачить лише текст, без імені та профілю автора. Це
        створено, щоб клієнт міг вільно описати досвід співпраці.
      </p>

      <h2>Хто може залишити відгук</h2>
      <p>
        Відгук можна залишити лише для тих спеціалістів, з якими ви працюєте або працювали. Це допомагає
        зберігати доречність і зв’язок зворотного зв’язку із реальною взаємодією.
      </p>

      <h2>Навіщо це потрібно</h2>
      <p>
        Приватні відгуки допомагають спеціалісту краще розуміти ваш досвід та покращувати роботу
        без публічного оцінювання чи порівнянь.
      </p>

      <h2>Чому інші клієнти не бачать відгуки</h2>
      <p>
        Ми не публікуємо відгуки, щоб уникнути оцінювання чи порівнянь між спеціалістами та
        зберегти приватність клієнтів. Це простір для безпечного й чесного зворотного зв’язку.
      </p>
      <p>
        Якщо ви хочете подякувати спеціалісту чи порадити його іншим людям — поділіться його
        публічним профілем у соцмережах.
      </p>
      <p>
        Якщо ви хочете поскаржитися на спеціаліста або повідомити про проблеми — напишіть нам на пошту
      </p>

      <div class="policy__cta">
        <RouterLink class="btn" to="/specialists">Знайти профіль спеціаліста</RouterLink>
      </div>
    </section>
  </section>
</template>

<script setup lang="ts"></script>

<style scoped>
.policy {
  display: grid;
  gap: 18px;
}

.policy__hero {
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

.policy__title {
  font-size: 32px;
}

.policy__subtitle {
  max-width: 520px;
}

.panel {
  border: 1px solid var(--line);
  border-radius: 18px;
  padding: 18px;
  background: #fff;
  display: grid;
  gap: 12px;
  line-height: 1.6;
}

.panel h2 {
  margin: 8px 0 0;
  font-size: 18px;
}

.panel p {
  color: var(--muted);
  margin: 0;
}

.policy__cta {
  margin-top: 8px;
}

@media (max-width: 860px) {
  .policy__hero {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
