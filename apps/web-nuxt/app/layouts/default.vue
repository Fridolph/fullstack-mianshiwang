<script setup lang="ts">
const toast = useToast()
const config = useRuntimeConfig()
const router = useRouter()
const $api = useApiClient()
const userStore = useUserStore()

const navItems = [
  { label: '迁移记录', to: '/' },
  { label: '面试入口', to: '/interview' },
  { label: '历史记录', to: '/history' },
  { label: '个人中心', to: '/profile' }
]

const userDisplayName = computed(
  () => userStore.userInfo?.nickname || userStore.userInfo?.username || '学习中用户'
)

onMounted(async () => {
  if (!userStore.token) return

  try {
    await userStore.ensureUserProfile($api)
  } catch (error) {
    toast.add({
      title: '登录态已失效',
      description: error instanceof Error ? error.message : '请重新登录',
      color: 'warning'
    })
  }
})

async function handleLogout() {
  userStore.logout()
  toast.add({
    title: '已退出登录',
    color: 'success'
  })
  await router.push('/login')
}
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

          <template v-if="userStore.isLogin">
            <NuxtLink to="/profile">
              <UButton color="primary" variant="soft" icon="i-lucide-user-round">
                {{ userDisplayName }}
              </UButton>
            </NuxtLink>
            <UButton
              color="neutral"
              variant="outline"
              icon="i-lucide-log-out"
              @click="handleLogout"
            >
              退出
            </UButton>
          </template>

          <NuxtLink v-else to="/login">
            <UButton color="primary" icon="i-lucide-log-in">
              登录 / 注册
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
