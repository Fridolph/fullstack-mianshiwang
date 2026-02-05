<template>
  <section class="flex flex-col gap-2">
    <h2 v-if="title" class="font-600 text-lg" has-line>
      {{ title }}
    </h2>
    <p v-if="desc">
      {{ desc }}
    </p>
    <slot />
  </section>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  title?: string
  desc?: string
}>(), {
  title: '',
  desc: ''
})
</script>

<style scoped>

</style>
