<script setup lang="ts">
const milestones = [
  {
    title: '里程碑 1',
    subtitle: '前端基础设施收敛',
    description:
      '整理 Nuxt 配置、统一请求层、补齐运行时配置，让 web-nuxt 成为后续业务迁移的稳定底座。'
  },
  {
    title: '里程碑 2',
    subtitle: '用户与认证能力迁移',
    description:
      '迁移登录、用户信息、鉴权中间件和 token 持久化，先把共享业务基础层跑通。'
  },
  {
    title: '里程碑 3',
    subtitle: '简历分析与押题主链路',
    description:
      '对接 NestJS 接口，完成简历分析、简历押题和 SSE 流式进度展示。'
  }
]
</script>

<template>
  <section class="hero surface-card">
    <div class="hero__body">
      <span class="pill">阶段 1 进行中</span>
      <h1 class="section-title">Nuxt JS -> TS Monorepo 迁移进行中</h1>
      <p class="section-description">
        当前前端以 monorepo 中的 <code>apps/web-nuxt</code> 为主工程，
        参考上一级目录中的旧 Nuxt 项目，逐步迁入业务模块，并同步沉淀迁移记录与踩坑经验。
      </p>

      <div class="hero__actions">
        <NuxtLink to="/login">
          <UButton size="lg">查看登录页骨架</UButton>
        </NuxtLink>
        <NuxtLink to="/interview">
          <UButton size="lg" color="neutral" variant="soft">查看面试模块占位页</UButton>
        </NuxtLink>
      </div>
    </div>
  </section>

  <section class="milestones">
    <article
      v-for="item in milestones"
      :key="item.title"
      class="milestones__card surface-card"
    >
      <p class="milestones__eyebrow">{{ item.title }}</p>
      <h2 class="milestones__title">{{ item.subtitle }}</h2>
      <p class="section-description">{{ item.description }}</p>
    </article>
  </section>
</template>

<style scoped>
.hero {
  overflow: hidden;
}

.hero__body {
  padding: clamp(28px, 5vw, 56px);
}

.hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 24px;
}

.milestones {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
  margin-top: 24px;
}

.milestones__card {
  padding: 24px;
}

.milestones__eyebrow {
  margin: 0 0 8px;
  color: var(--app-primary);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.milestones__title {
  margin: 0 0 12px;
  font-size: 20px;
}

@media (max-width: 900px) {
  .milestones {
    grid-template-columns: 1fr;
  }
}
</style>
