<template>
  <section class="surface-card grid gap-6 p-7 sm:gap-7 sm:p-10 xl:p-12">
    <div class="pill w-fit text-[13px] font-bold tracking-[0.14em]">
      <UIcon name="i-lucide-sparkles" class="size-4" />
      当前已对接 Nest 用户体系
    </div>
    <h1 class="section-title max-w-[12ch]">
      先把登录和用户态跑通，再接完整 AI 面试链路
    </h1>
    <p class="section-description max-w-[58ch]">
      这一阶段不再沿用旧项目里的微信扫码假设，而是直接对接当前
      NestJS 后端已经存在的 `user/register`、`user/login`、`user/info`
      能力，先把真实可用的认证闭环搭起来。
    </p>

    <div class="grid gap-4 lg:grid-cols-3">
      <article
        v-for="item in benefits"
        :key="item.title"
        class="flex gap-4 rounded-[20px] border border-[color:var(--app-border)] bg-white/70 p-5">
        <div class="flex size-10 shrink-0 items-center justify-center rounded-[14px] bg-primary/10 text-primary">
          <UIcon :name="item.icon" class="size-5" />
        </div>
        <div>
          <h2 class="mb-2 text-base font-semibold text-[color:var(--app-text)]">
            {{ item.title }}
          </h2>
          <p class="m-0 text-sm leading-7 text-[color:var(--app-muted)]">
            {{ item.description }}
          </p>
        </div>
      </article>
    </div>

    <div class="rounded-[20px] border border-primary/10 bg-[linear-gradient(135deg,rgba(5,150,105,0.08),rgba(255,255,255,0.82))] p-5">
      <p class="mb-2 text-base font-semibold text-[color:var(--app-text)]">
        学习重点
      </p>
      <ul class="m-0 list-disc space-y-2 pl-5 text-sm leading-7 text-[color:var(--app-muted)]">
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
