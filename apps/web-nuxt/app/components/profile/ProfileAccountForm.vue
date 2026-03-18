<script setup lang="ts">
import { updateUserProfileAPI } from '~/api/user'

const props = defineProps<{
  user: {
    email?: string
    nickname?: string
    phone?: string
    avatar?: string
  } | null
}>()

const emit = defineEmits<{
  updated: [payload: Record<string, unknown>]
}>()

const toast = useToast()
const $api = useApiClient()

const loading = ref(false)
const form = reactive({
  nickname: '',
  email: '',
  phone: '',
  avatar: ''
})

watch(
  () => props.user,
  (value) => {
    form.nickname = value?.nickname ?? ''
    form.email = value?.email ?? ''
    form.phone = value?.phone ?? ''
    form.avatar = value?.avatar ?? ''
  },
  { immediate: true }
)

async function handleSubmit() {
  loading.value = true

  try {
    const payload = await updateUserProfileAPI($api, {
      nickname: form.nickname.trim() || undefined,
      email: form.email.trim() || undefined,
      phone: form.phone.trim() || undefined,
      avatar: form.avatar.trim() || undefined
    })

    emit('updated', payload as Record<string, unknown>)

    toast.add({
      title: '资料更新成功',
      color: 'success'
    })
  } catch (error) {
    toast.add({
      title: '资料更新失败',
      description: error instanceof Error ? error.message : '请稍后重试',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <section class="profile-form surface-card">
    <div class="profile-form__header">
      <div>
        <h2>完善个人资料</h2>
        <p class="section-description">
          当前直接对接 `PUT /user/profile`，优先维护 NestJS 后端已经支持的字段。
        </p>
      </div>

      <UButton
        :loading="loading"
        icon="i-lucide-save"
        @click="handleSubmit"
      >
        保存资料
      </UButton>
    </div>

    <div class="profile-form__grid">
      <label class="profile-field">
        <span>昵称</span>
        <UInput v-model="form.nickname" placeholder="用于页面展示" />
      </label>

      <label class="profile-field">
        <span>邮箱</span>
        <UInput v-model="form.email" type="email" placeholder="用于登录和联系" />
      </label>

      <label class="profile-field">
        <span>手机号</span>
        <UInput v-model="form.phone" placeholder="可选" />
      </label>

      <label class="profile-field">
        <span>头像链接</span>
        <UInput v-model="form.avatar" placeholder="后续可接 OSS / 图床" />
      </label>
    </div>
  </section>
</template>

<style scoped>
.profile-form {
  padding: 24px;
}

.profile-form__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.profile-form__header h2 {
  margin: 0 0 10px;
  font-size: 24px;
}

.profile-form__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.profile-field {
  display: grid;
  gap: 8px;
}

.profile-field span {
  font-size: 14px;
  font-weight: 600;
}

@media (max-width: 900px) {
  .profile-form__header,
  .profile-form__grid {
    grid-template-columns: 1fr;
  }

  .profile-form__header {
    display: grid;
  }
}
</style>
