<script setup lang="ts">
const demoItems = ref<CardItem[]>([
  {
    title: '易经学习小站',
    desc: '开发一个学习易经的小站，卦象、卦辞、易经、易经学习，学习记录啥的都可以记录在其中。'
  }
])

const routeTo = (to?: string) => {
  if (to) return navigateTo('/demo/quote-calc')
}
</script>

<template>
  <NuxtLayout name="onlyheader">
    <section class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      <UCard
        v-for="item in demoItems" :key="item.title"
        :class="{ 'cursor-pointer': item?.to }"
        variant="subtle" title="Quote"
        @click="routeTo(item?.to)">
        <template #header>
          <h3 v-text="item.title" />
        </template>
        <NuxtImg v-if="item?.imgUrl" :src="item.imgUrl" />
        <p class="text-sm" v-text="item.desc" />
      </UCard>
    </section>
  </NuxtLayout>
</template>

<style scoped>

</style>
