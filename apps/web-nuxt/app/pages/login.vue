<script setup lang="ts">
import AuthBenefitsPanel from '~/components/auth/AuthBenefitsPanel.vue'
import AuthCredentialPanel from '~/components/auth/AuthCredentialPanel.vue'

definePageMeta({
  layout: 'default',
})

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const redirectTo = computed(() => {
  const redirect = route.query.redirect
  return typeof redirect === 'string' && redirect.startsWith('/')
    ? redirect
    : '/profile'
})

onMounted(async () => {
  if (!userStore.isLogin) return
  await router.replace(redirectTo.value)
})

async function handleSuccess() {
  await router.replace(redirectTo.value)
}
</script>

<template>
  <section class="login-page">
    <AuthBenefitsPanel />
    <AuthCredentialPanel @success="handleSuccess" />
  </section>
</template>

<style scoped>
.login-page {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(360px, 420px);
  gap: 28px;
  align-items: stretch;
}

@media (max-width: 960px) {
  .login-page {
    grid-template-columns: 1fr;
    gap: 20px;
  }
}
</style>
