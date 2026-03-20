<script setup lang="ts">
const milestones = [
  {
    title: '里程碑 1',
    subtitle: '前端基础设施收敛',
    description: '整理 Nuxt 配置、统一请求层、补齐运行时配置，让 web-nuxt 成为后续业务迁移的稳定底座。',
  },
  {
    title: '里程碑 2',
    subtitle: '用户与认证能力迁移',
    description: '登录、注册、用户信息同步、鉴权跳转与个人中心基础能力已经接入。',
  },
  {
    title: '里程碑 3',
    subtitle: '简历分析与押题主链路',
    description: '已接入简历分析、继续追问、简历押题开始页与结果页骨架，并打通前端状态流转。',
  },
]

const docs = [
  {
    title: '迁移主记录',
    path: 'docs/01-Nuxt-JS迁移到TS-Monorepo记录.md',
    description: '按阶段记录从基础设施到用户态、面试主链路的迁移过程。',
  },
  {
    title: '模块梳理与问题记录',
    path: 'docs/02-web-nuxt模块梳理与问题记录.md',
    description: '更适合配合代码一起看，理解模块职责、踩坑和后续优化点。',
  },
]
</script>

<template>
  <section class="migration-page">
    <UCard>
      <template #header>
        <div class="migration-page__header">
          <div>
            <UBadge color="neutral" variant="soft">
              迁移记录入口
            </UBadge>
            <h1 class="section-title">
              把迁移说明从首页让出来，但继续保留
            </h1>
          </div>
        </div>
      </template>

      <p class="section-description">
        首页现在回到“面试入口”的角色；而这里专门保留给你学习、复盘、整理博客和回看迭代历史。
      </p>

      <div class="migration-page__actions">
        <UButton icon="i-lucide-house" to="/">
          返回首页
        </UButton>
        <UButton
          color="neutral" variant="soft" icon="i-lucide-play"
          to="/interview/start">
          进入 AI 面试开始页
        </UButton>
      </div>
    </UCard>

    <section class="migration-page__section">
      <h2 class="migration-page__title">
        阶段进度
      </h2>
      <div class="migration-page__grid">
        <UCard
          v-for="item in milestones"
          :key="item.title">
          <template #header>
            <div class="migration-card__header">
              <UBadge color="primary" variant="soft">
                {{ item.title }}
              </UBadge>
              <h3>{{ item.subtitle }}</h3>
            </div>
          </template>

          <p class="section-description">
            {{ item.description }}
          </p>
        </UCard>
      </div>
    </section>

    <section class="migration-page__section">
      <h2 class="migration-page__title">
        对应文档
      </h2>
      <div class="migration-page__grid migration-page__grid--docs">
        <UCard
          v-for="item in docs"
          :key="item.path">
          <template #header>
            <div class="migration-card__header">
              <UIcon name="i-lucide-file-text" class="size-5 text-primary" />
              <h3>{{ item.title }}</h3>
            </div>
          </template>

          <div class="migration-doc">
            <p class="section-description">
              {{ item.description }}
            </p>
            <code>{{ item.path }}</code>
          </div>
        </UCard>
      </div>
    </section>
  </section>
</template>

<style scoped>
.migration-page {
  display: grid;
  gap: 24px;
}

.migration-page__header h1 {
  margin-top: 14px;
}

.migration-page__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 20px;
}

.migration-page__section {
  display: grid;
  gap: 16px;
}

.migration-page__title {
  margin: 0;
  font-size: 24px;
}

.migration-page__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}

.migration-page__grid--docs {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.migration-card__header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.migration-card__header h3 {
  margin: 0;
  font-size: 20px;
}

.migration-doc {
  display: grid;
  gap: 12px;
}

.migration-doc code {
  display: inline-flex;
  width: fit-content;
  max-width: 100%;
  padding: 8px 12px;
  overflow: auto;
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.06);
}

@media (max-width: 960px) {
  .migration-page__grid,
  .migration-page__grid--docs {
    grid-template-columns: 1fr;
  }
}
</style>
