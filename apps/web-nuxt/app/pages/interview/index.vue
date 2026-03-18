<script setup lang="ts">
import InterviewServiceCards from '~/components/interview/InterviewServiceCards.vue'

const userStore = useUserStore()
</script>

<template>
  <div class="interview-screen">
    <section class="surface-card interview-page">
      <div class="interview-page__hero">
        <div class="interview-page__copy">
          <span class="pill">核心业务链路</span>
          <h1 class="section-title">开始你的 AI 面试学习闭环</h1>
          <p class="section-description">
            这里不再停留在占位页，而是正式承接当前 NestJS 后端的简历分析、继续追问、流式押题和历史记录能力。
          </p>
        </div>

        <div class="interview-page__actions">
          <UButton
            size="lg"
            icon="i-lucide-sparkles"
            :to="userStore.isLogin ? '/interview/start' : '/login?redirect=/interview/start'"
          >
            {{ userStore.isLogin ? '开始体验' : '先登录后体验' }}
          </UButton>
          <UButton size="lg" color="neutral" variant="soft" to="/history">
            查看历史记录
          </UButton>
        </div>
      </div>
    </section>

    <InterviewServiceCards />
  </div>
</template>

<style scoped>
.interview-screen {
  display: grid;
  gap: 24px;
}

.interview-page__hero {
  display: grid;
  gap: 28px;
  padding: clamp(28px, 5vw, 48px);
}

.interview-page__copy {
  display: grid;
  gap: 16px;
}

.interview-page__copy :deep(.section-description) {
  max-width: 56rem;
}

.interview-page__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
</style>
