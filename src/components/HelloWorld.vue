<script setup lang="ts">
import { ref } from 'vue'

defineProps<{ msg: string }>()

const count = ref(0)
</script>

<template>
  <h1>{{ msg }}</h1>

  <div class="card">
    <button type="button" @click="count++">Лічильник: {{ count }}</button>
    <p>
      Змініть
      <code>components/HelloWorld.vue</code>, щоб перевірити HMR
    </p>
  </div>

  <p>
    Перегляньте
    <a href="https://vuejs.org/guide/quick-start.html#local" target="_blank"
      >create-vue</a
    > — офіційний стартовий шаблон Vue + Vite.
  </p>
  <p>
    Дізнайтеся більше про підтримку IDE для Vue у
    <a
      href="https://vuejs.org/guide/scaling-up/tooling.html#ide-support"
      target="_blank"
      >гайді Vue Docs Scaling up</a
    >.
  </p>
  <p class="read-the-docs">Натисніть на логотипи Vite і Vue, щоб дізнатися більше</p>
</template>

<style scoped>
.read-the-docs {
  color: #888;
}
</style>
