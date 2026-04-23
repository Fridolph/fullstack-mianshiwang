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

const modeOptions = [
  {
    value: 'login',
    label: '登录',
  },
  {
    value: 'register',
    label: '注册',
  },
] as const

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
  <section class="surface-card grid gap-6 p-6 sm:gap-7 sm:p-8 xl:p-9">
    <div class="grid gap-3">
      <span class="pill">Milestone 2</span>
      <h2 class="section-title mt-1 text-[clamp(2rem,4vw,3.5rem)]">
        {{ panelTitle }}
      </h2>
      <p class="section-description">
        当前使用邮箱密码直接对接 NestJS 用户模块，后续如果补上微信能力，再在这一层做扩展。
      </p>
    </div>

    <div class="auth-panel__tabs">
      <UButton
        v-for="item in modeOptions"
        :key="item.value"
        class="auth-panel__tab-button"
        size="xl"
        :variant="mode === item.value ? 'solid' : 'soft'"
        :color="mode === item.value ? 'primary' : 'neutral'"
        :ui="{
          base: 'justify-center',
          label: 'text-base font-semibold'
        }"
        @click="mode = item.value">
        {{ item.label }}
      </UButton>
    </div>

    <div v-if="mode === 'login'" class="grid gap-4 sm:gap-5">
      <label class="grid gap-2.5">
        <span class="text-sm font-semibold text-[color:var(--app-muted)]">邮箱</span>
        <UInput
          v-model="loginForm.email"
          class="w-full"
          size="xl"
          type="email"
          placeholder="请输入登录邮箱"
          autocomplete="email"
        />
      </label>

      <label class="grid gap-2.5">
        <span class="text-sm font-semibold text-[color:var(--app-muted)]">密码</span>
        <UInput
          v-model="loginForm.password"
          class="w-full"
          size="xl"
          type="password"
          placeholder="请输入密码"
          autocomplete="current-password"
          @keyup.enter="handleLogin"
        />
      </label>

      <UButton
        block
        size="xl"
        :loading="loading"
        icon="i-lucide-log-in"
        class="justify-center rounded-2xl"
        @click="handleLogin">
        登录并进入应用
      </UButton>
    </div>

    <div v-else class="grid gap-4 sm:gap-5">
      <label class="grid gap-2.5">
        <span class="text-sm font-semibold text-[color:var(--app-muted)]">用户名</span>
        <UInput
          v-model="registerForm.username"
          class="w-full"
          size="xl"
          placeholder="至少 3 个字符"
          autocomplete="username"
        />
      </label>

      <label class="grid gap-2.5">
        <span class="text-sm font-semibold text-[color:var(--app-muted)]">邮箱</span>
        <UInput
          v-model="registerForm.email"
          class="w-full"
          size="xl"
          type="email"
          placeholder="注册邮箱"
          autocomplete="email"
        />
      </label>

      <label class="grid gap-2.5">
        <span class="text-sm font-semibold text-[color:var(--app-muted)]">密码</span>
        <UInput
          v-model="registerForm.password"
          class="w-full"
          size="xl"
          type="password"
          placeholder="至少 6 位"
          autocomplete="new-password"
        />
      </label>

      <label class="grid gap-2.5">
        <span class="text-sm font-semibold text-[color:var(--app-muted)]">确认密码</span>
        <UInput
          v-model="registerForm.confirmPassword"
          class="w-full"
          size="xl"
          type="password"
          placeholder="再次输入密码"
          autocomplete="new-password"
          @keyup.enter="handleRegister"
        />
      </label>

      <UButton
        block
        size="xl"
        :loading="loading"
        icon="i-lucide-user-plus"
        class="justify-center rounded-2xl"
        @click="handleRegister">
        注册并自动登录
      </UButton>
    </div>
  </section>
</template>

<style scoped>
.auth-panel__tabs {
  display: inline-grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: stretch;
  gap: 8px;
  width: min(100%, 264px);
  min-height: 60px;
  padding: 6px;
  border: 1px solid var(--app-border);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.78);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7);
}

.auth-panel__tab-button {
  min-height: 48px;
  border-radius: 16px;
}
</style>
