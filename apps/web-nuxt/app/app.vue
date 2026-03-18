<script setup lang="ts">
const config = useRuntimeConfig()

useHead({
  htmlAttrs: {
    lang: 'zh-CN'
  },
  link: [{ rel: 'icon', href: '/favicon.ico' }]
})

useSeoMeta({
  title: config.public.appName,
  description: config.public.appDescription,
  ogTitle: config.public.appName,
  ogDescription: config.public.appDescription
})
</script>

<template>
  <UApp>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
