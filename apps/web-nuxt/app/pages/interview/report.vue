<script setup lang="ts">
import ResumeQuizResultCard from '~/components/interview/ResumeQuizResultCard.vue'

definePageMeta({
  layout: 'default',
  middleware: 'auth',
  requiresAuth: true
})

const interviewStore = useInterviewStore()
</script>

<template>
  <section class="report-page">
    <div class="surface-card report-page__hero">
      <span class="pill">结果页</span>
      <h1 class="section-title">简历押题结果回看</h1>
      <p class="section-description">
        当前结果优先来自本地 store 中最近一次流式完成事件。后续如果后端补齐查询接口，再接入真正的结果详情拉取。
      </p>

      <div class="report-page__actions">
        <UButton icon="i-lucide-arrow-left" to="/interview/start">返回继续练习</UButton>
        <UButton color="neutral" variant="soft" to="/history">查看历史记录</UButton>
      </div>
    </div>

    <ResumeQuizResultCard :report="interviewStore.report" />
  </section>
</template>

<style scoped>
.report-page {
  display: grid;
  gap: 24px;
}

.report-page__hero {
  padding: 24px;
}

.report-page__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 20px;
}
</style>
