<script setup lang="ts">
import ProfileAccountForm from '~/components/profile/ProfileAccountForm.vue'
import ProfileSummaryCard from '~/components/profile/ProfileSummaryCard.vue'

definePageMeta({
  layout: 'default',
  middleware: 'auth',
  requiresAuth: true
})

const toast = useToast()
const $api = useApiClient()
const userStore = useUserStore()

const loading = ref(true)

onMounted(async () => {
  try {
    await userStore.ensureUserProfile($api)
  } catch (error) {
    toast.add({
      title: '加载用户资料失败',
      description: error instanceof Error ? error.message : '请重新登录',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
})

function handleUpdated(payload: Record<string, unknown>) {
  userStore.updateUserInfo(payload)
}
</script>

<template>
  <section class="profile-page">
    <div v-if="loading" class="surface-card profile-loading">
      <UIcon name="i-lucide-loader-circle" class="size-5 animate-spin" />
      <span>正在加载个人资料...</span>
    </div>

    <template v-else>
      <ProfileSummaryCard
        :email="userStore.userInfo?.email"
        :username="userStore.userInfo?.username"
        :nickname="userStore.userInfo?.nickname"
        :ww-coin-balance="userStore.userInfo?.wwCoinBalance"
        :resume-remaining-count="userStore.userInfo?.resumeRemainingCount"
        :special-remaining-count="userStore.userInfo?.specialRemainingCount"
        :behavior-remaining-count="userStore.userInfo?.behaviorRemainingCount"
      />

      <ProfileAccountForm
        :user="userStore.userInfo"
        @updated="handleUpdated"
      />
    </template>
  </section>
</template>

<style scoped>
.profile-page {
  display: grid;
  grid-template-columns: minmax(300px, 360px) minmax(0, 1fr);
  gap: 24px;
  align-items: start;
}

.profile-loading {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 20px 24px;
}

@media (max-width: 960px) {
  .profile-page {
    grid-template-columns: 1fr;
  }
}
</style>
