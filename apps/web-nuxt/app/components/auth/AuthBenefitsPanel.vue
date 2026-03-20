<template>
  <section class="auth-benefits surface-card">
    <div class="auth-benefits__eyebrow">
      <UIcon name="i-lucide-sparkles" class="size-4" />
      当前已对接 Nest 用户体系
    </div>
    <h1 class="section-title">
      先把登录和用户态跑通，再接完整 AI 面试链路
    </h1>
    <p class="section-description">
      这一阶段不再沿用旧项目里的微信扫码假设，而是直接对接当前
      NestJS 后端已经存在的 `user/register`、`user/login`、`user/info`
      能力，先把真实可用的认证闭环搭起来。
    </p>

    <div class="auth-benefits__grid">
      <article
        v-for="item in benefits"
        :key="item.title"
        class="auth-benefits__item">
        <div class="auth-benefits__icon">
          <UIcon :name="item.icon" class="size-5" />
        </div>
        <div>
          <h2>{{ item.title }}</h2>
          <p>{{ item.description }}</p>
        </div>
      </article>
    </div>

    <div class="auth-benefits__tips">
      <p>学习重点</p>
      <ul>
        <li>前端如何从“占位页”迁移到“真实登录流程”</li>
        <li>为什么参考项目的微信登录不能直接照搬到当前 Nest 后端</li>
        <li>如何用 token + Pinia + 中间件组成最小鉴权闭环</li>
      </ul>
    </div>
  </section>
</template>

<script setup lang="ts">
const benefits = [
  {
    icon: 'i-lucide-key-round',
    title: '认证闭环',
    description: '注册、登录、持久化、鉴权跳转全部跑通。',
  },
  {
    icon: 'i-lucide-user-round',
    title: '用户状态',
    description: '登录后同步用户资料与剩余服务次数。',
  },
  {
    icon: 'i-lucide-route',
    title: '业务承接',
    description: '后续简历押题、历史记录、报告页都直接复用这套用户态。',
  },
]
</script>

<style scoped>
.auth-benefits {
  display: grid;
  gap: 24px;
  padding: clamp(28px, 5vw, 48px);
}

.auth-benefits__eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 999px;
  color: var(--app-primary);
  background: var(--app-primary-soft);
  font-size: 13px;
  font-weight: 700;
}

.auth-benefits :deep(.section-description) {
  max-width: 58ch;
}

.auth-benefits__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}

.auth-benefits__item {
  display: flex;
  gap: 14px;
  min-height: 100%;
  padding: 20px;
  border: 1px solid var(--app-border);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.6);
}

.auth-benefits__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 14px;
  color: var(--app-primary);
  background: var(--app-primary-soft);
}

.auth-benefits__item h2,
.auth-benefits__tips p {
  margin: 0 0 8px;
  font-size: 16px;
}

.auth-benefits__item p,
.auth-benefits__tips li {
  margin: 0;
  color: var(--app-muted);
  line-height: 1.7;
}

.auth-benefits__tips {
  padding: 20px;
  border-radius: 20px;
  background: linear-gradient(135deg, rgba(5, 150, 105, 0.08), rgba(255, 255, 255, 0.8));
  border: 1px solid rgba(5, 150, 105, 0.12);
}

.auth-benefits__tips ul {
  margin: 0;
  padding-left: 18px;
}

@media (max-width: 960px) {
  .auth-benefits__grid {
    grid-template-columns: 1fr;
  }
}
</style>
