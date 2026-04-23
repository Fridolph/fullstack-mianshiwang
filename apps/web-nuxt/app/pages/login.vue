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
  <section class="grid items-stretch gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(360px,420px)] lg:gap-7">
    <AuthBenefitsPanel />
    <AuthCredentialPanel @success="handleSuccess" />
  </section>
</template>
