<template>
  <div class="page">
    <header class="topbar">
      <div class="brand">Consult</div>
      <nav class="nav">
        <RouterLink to="/login">Вхід</RouterLink>
        <RouterLink to="/signup">Реєстрація</RouterLink>
        <RouterLink to="/cabinet">Кабінет</RouterLink>
        <RouterLink to="/cabinet/profile">Профіль</RouterLink>
      </nav>
    </header>
    <section class="hero">
      <div class="hero__card">
        <div class="badge">Професійний кабінет</div>
        <h1 class="title">Професійні інструменти. Без чужих рук у вашій роботі.</h1>
        <p class="subtitle">
          Розклад, клієнти, сесії, нотатки та відео — у системі, що поважає межі.
        </p>
        <div class="hero__actions">
          <RouterLink class="btn" to="/signup">Створити кабінет</RouterLink>
          <RouterLink class="btn btn--ghost" to="/login">Увійти</RouterLink>
        </div>
      </div>
      <div class="hero__scene" aria-hidden="true">
        <div class="scene__glow"></div>
        <div class="scene__desk"></div>
        <div class="scene__lamp">
          <div class="lamp__shade"></div>
          <div class="lamp__stem"></div>
          <div class="lamp__base"></div>
        </div>
        <div class="scene__chair"></div>
        <div class="scene__notebook"></div>
      </div>
    </section>
    <main>
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts"></script>
<style scoped></style>
