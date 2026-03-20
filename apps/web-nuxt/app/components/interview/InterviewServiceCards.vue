<script setup lang="ts">
const services = [
  {
    title: '简历分析',
    description: '先用当前 Nest 后端的 `analyze-resume` 能力快速看一眼岗位匹配和简历重点。',
    icon: 'i-lucide-file-search-2',
  },
  {
    title: '简历押题',
    description: '通过 SSE 流式接口观察进度事件和最终结果，贴近你当前 AI 学习主线。',
    icon: 'i-lucide-sparkles',
  },
  {
    title: '历史复盘',
    description: '消费记录与用户资料已经接入，后续再继续补报告查询与结果详情。',
    icon: 'i-lucide-history',
  },
]
</script>

<template>
  <section class="service-grid">
    <UCard
      v-for="item in services"
      :key="item.title"
      class="service-card"
      :ui="{ body: 'p-7 sm:p-8' }">
      <div class="service-card__body">
        <div class="service-card__icon">
          <UIcon :name="item.icon" class="size-5" />
        </div>
        <h2>{{ item.title }}</h2>
        <p>{{ item.description }}</p>
      </div>
    </UCard>
  </section>
</template>

<style scoped>
.service-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
}

.service-card {
  min-height: 100%;
}

.service-card__body {
  display: grid;
  gap: 16px;
  height: 100%;
}

.service-card__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: 14px;
  color: var(--app-primary);
  background: var(--app-primary-soft);
}

.service-card h2 {
  margin: 0;
  font-size: 20px;
}

.service-card p {
  margin: 0;
  color: var(--app-muted);
  line-height: 1.7;
  max-width: 24ch;
}

@media (max-width: 960px) {
  .service-grid {
    grid-template-columns: 1fr;
  }
}
</style>
