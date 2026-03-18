<script setup lang="ts">
const config = useRuntimeConfig()

const navItems = [
  { label: '迁移记录', to: '/' },
  { label: '登录', to: '/login' },
  { label: '面试入口', to: '/interview' }
]
</script>

<template>
  <div class="app-shell">
    <header class="app-shell__header">
      <div class="app-shell__header-inner">
        <NuxtLink to="/" class="app-shell__brand">
          <span class="app-shell__brand-mark">MW</span>
          <span class="app-shell__brand-copy">
            <span>{{ config.public.appName }}</span>
            <span class="app-shell__brand-subtitle">Nuxt monorepo 迁移中</span>
          </span>
        </NuxtLink>

        <nav class="app-shell__nav" aria-label="主导航">
          <NuxtLink
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
          >
            <UButton color="neutral" variant="ghost">
              {{ item.label }}
            </UButton>
          </NuxtLink>
        </nav>
      </div>
    </header>

    <main class="app-shell__main">
      <slot />
    </main>
  </div>
</template>
