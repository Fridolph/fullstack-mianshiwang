<script setup lang="ts">
import { loginAPI, registerAPI } from '~/api/login'
import type { LoginPayload, RegisterPayload } from '~/types/domain'

const emit = defineEmits<{
  success: []
}>()

const toast = useToast()
const $api = useApiClient()
const userStore = useUserStore()

const mode = ref<'login' | 'register'>('login')
const loading = ref(false)

const loginForm = reactive<LoginPayload>({
  email: '',
  password: '',
})

const registerForm = reactive<RegisterPayload & { confirmPassword: string }>({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
})

const panelTitle = computed(() =>
  mode.value === 'login' ? '登录你的学习环境' : '先创建一个本地账号',
)

async function handleLogin() {
  if (!loginForm.email.trim() || !loginForm.password.trim()) {
    toast.add({
      title: '请填写完整登录信息',
      color: 'warning',
    })
    return
  }

  loading.value = true

  try {
    const payload = await loginAPI($api, {
      email: loginForm.email.trim(),
      password: loginForm.password,
    })

    userStore.applyAuth(payload)
    await userStore.ensureUserProfile($api)

    toast.add({
      title: '登录成功',
      description: '已同步当前用户信息，正在进入应用。',
      color: 'success',
    })
    emit('success')
  } catch (error) {
    toast.add({
      title: '登录失败',
      description: error instanceof Error ? error.message : '请稍后重试',
      color: 'error',
    })
  } finally {
    loading.value = false
  }
}

async function handleRegister() {
  if (
    !registerForm.username.trim()
    || !registerForm.email.trim()
    || !registerForm.password.trim()
  ) {
    toast.add({
      title: '请填写完整注册信息',
      color: 'warning',
    })
    return
  }

  if (registerForm.password !== registerForm.confirmPassword) {
    toast.add({
      title: '两次密码不一致',
      description: '请确认后再提交注册。',
      color: 'warning',
    })
    return
  }

  loading.value = true

  try {
    await registerAPI($api, {
      username: registerForm.username.trim(),
      email: registerForm.email.trim(),
      password: registerForm.password,
    })

    const payload = await loginAPI($api, {
      email: registerForm.email.trim(),
      password: registerForm.password,
    })

    userStore.applyAuth(payload)
    await userStore.ensureUserProfile($api)

    toast.add({
      title: '注册并登录成功',
      description: '当前账号已经写入本地登录态。',
      color: 'success',
    })
    emit('success')
  } catch (error) {
    toast.add({
      title: '注册失败',
      description: error instanceof Error ? error.message : '请稍后重试',
      color: 'error',
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <section class="auth-panel surface-card">
    <div class="auth-panel__header">
      <span class="pill">Milestone 2</span>
      <h2 class="auth-panel__title">
        {{ panelTitle }}
      </h2>
      <p class="section-description">
        当前使用邮箱密码直接对接 NestJS 用户模块，后续如果补上微信能力，再在这一层做扩展。
      </p>
    </div>

    <div class="auth-panel__tabs">
      <UButton
        size="lg"
        :variant="mode === 'login' ? 'solid' : 'soft'"
        @click="mode = 'login'">
        登录
      </UButton>
      <UButton
        size="lg"
        :variant="mode === 'register' ? 'solid' : 'soft'"
        color="neutral"
        @click="mode = 'register'">
        注册
      </UButton>
    </div>

    <div v-if="mode === 'login'" class="auth-panel__form">
      <label class="auth-field">
        <span>邮箱</span>
        <UInput
          v-model="loginForm.email"
          type="email"
          placeholder="请输入登录邮箱"
          autocomplete="email"
        />
      </label>

      <label class="auth-field">
        <span>密码</span>
        <UInput
          v-model="loginForm.password"
          type="password"
          placeholder="请输入密码"
          autocomplete="current-password"
          @keyup.enter="handleLogin"
        />
      </label>

      <UButton
        block
        size="lg"
        :loading="loading"
        icon="i-lucide-log-in"
        @click="handleLogin">
        登录并进入应用
      </UButton>
    </div>

    <div v-else class="auth-panel__form">
      <label class="auth-field">
        <span>用户名</span>
        <UInput
          v-model="registerForm.username"
          placeholder="至少 3 个字符"
          autocomplete="username"
        />
      </label>

      <label class="auth-field">
        <span>邮箱</span>
        <UInput
          v-model="registerForm.email"
          type="email"
          placeholder="注册邮箱"
          autocomplete="email"
        />
      </label>

      <label class="auth-field">
        <span>密码</span>
        <UInput
          v-model="registerForm.password"
          type="password"
          placeholder="至少 6 位"
          autocomplete="new-password"
        />
      </label>

      <label class="auth-field">
        <span>确认密码</span>
        <UInput
          v-model="registerForm.confirmPassword"
          type="password"
          placeholder="再次输入密码"
          autocomplete="new-password"
          @keyup.enter="handleRegister"
        />
      </label>

      <UButton
        block
        size="lg"
        :loading="loading"
        icon="i-lucide-user-plus"
        @click="handleRegister">
        注册并自动登录
      </UButton>
    </div>
  </section>
</template>

<style scoped>
.auth-panel {
  display: grid;
  gap: 24px;
  padding: clamp(24px, 4vw, 36px);
}

.auth-panel__header {
  display: grid;
  gap: 12px;
}

.auth-panel__title {
  margin: 4px 0 0;
  font-size: clamp(24px, 4vw, 32px);
}

.auth-panel__tabs {
  display: inline-flex;
  gap: 10px;
  width: fit-content;
  padding: 6px;
  border: 1px solid var(--app-border);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.72);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7);
}

.auth-panel__form {
  display: grid;
  gap: 18px;
}

.auth-field {
  display: grid;
  gap: 10px;
}

.auth-field span {
  font-size: 14px;
  font-weight: 600;
  color: var(--app-muted);
}

.auth-panel :deep(.ui-input) {
  width: 100%;
}

.auth-panel :deep(.ui-button) {
  justify-content: center;
}
</style>
