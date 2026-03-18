<script setup lang="ts">
definePageMeta({
  layout: 'default'
})
</script>

<template>
  <section class="surface-card login-page">
    <div class="login-page__body">
      <span class="pill">里程碑 2 预留</span>
      <h1 class="section-title">登录模块正在迁移中</h1>
      <p class="section-description">
        这一页会在下一阶段接入微信登录、用户状态持久化和鉴权跳转逻辑。
        当前先保留页面骨架，确保路由和 layout 已经稳定。
      </p>

      <div class="login-page__actions">
        <NuxtLink to="/">
          <UButton color="neutral" variant="soft">返回首页</UButton>
        </NuxtLink>
      </div>
    </div>
  </section>
</template>

<style scoped>
.login-page__body {
  padding: clamp(28px, 5vw, 48px);
}

.login-page__actions {
  margin-top: 24px;
}
</style>
