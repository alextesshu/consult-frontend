<template>
  <div class="page">
    <header class="topbar">
      <div class="brand">Consult</div>
      <nav class="nav">
        <RouterLink to="/login">Login</RouterLink>
        <RouterLink to="/cabinet">Cabinet</RouterLink>
      </nav>
    </header>
    <section class="hero">
      <div class="hero__card">
        <div class="badge">Therapist Workspace</div>
        <h1 class="title">A calm, private cabinet for serious practice.</h1>
        <p class="subtitle">
          No marketplace. No pressure. Just a focused environment for sessions,
          clients, and groups.
        </p>
      </div>
      <div class="hero__card">
        <h2 class="title" style="font-size: 24px;">Quick access</h2>
        <p class="subtitle">Sign in to manage availability and client state.</p>
        <div style="display: flex; gap: 12px; margin-top: 16px;">
          <RouterLink class="btn" to="/login">Sign in</RouterLink>
          <RouterLink class="btn btn--ghost" to="/cabinet">Open cabinet</RouterLink>
        </div>
      </div>
    </section>
    <main>
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts"></script>
<style scoped></style>
