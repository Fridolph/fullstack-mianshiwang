<script setup lang="ts">
import type { ResumeQuizProgressEvent } from '~/types/api'

defineProps<{
  currentProgress: ResumeQuizProgressEvent | null
  progressLogs: ResumeQuizProgressEvent[]
  errorMessage?: string
}>()
</script>

<template>
  <section class="surface-card progress-card">
    <div class="progress-card__header">
      <div>
        <span class="pill">SSE 流式进度</span>
        <h2>观察后端事件流</h2>
      </div>
      <UBadge color="neutral" variant="soft">
        {{ currentProgress?.progress ?? 0 }}%
      </UBadge>
    </div>

    <UProgress
      :model-value="currentProgress?.progress ?? 0"
      size="xl"
      class="progress-card__bar"
    />

    <p class="progress-card__label">
      {{ currentProgress?.label || '等待开始...' }}
    </p>

    <p v-if="errorMessage" class="progress-card__error">
      {{ errorMessage }}
    </p>

    <div class="progress-card__timeline">
      <article
        v-for="(event, index) in progressLogs"
        :key="`${event.type}-${event.progress}-${index}`"
        class="progress-card__event"
      >
        <span>{{ event.progress }}%</span>
        <p>{{ event.label || event.message || '收到事件' }}</p>
      </article>
    </div>
  </section>
</template>

<style scoped>
.progress-card {
  padding: 24px;
}

.progress-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.progress-card__header h2 {
  margin: 16px 0 0;
  font-size: 24px;
}

.progress-card__bar {
  margin-top: 20px;
}

.progress-card__label {
  margin: 14px 0 0;
  color: var(--app-text);
  font-weight: 600;
}

.progress-card__error {
  margin: 12px 0 0;
  color: #dc2626;
}

.progress-card__timeline {
  display: grid;
  gap: 10px;
  max-height: 360px;
  margin-top: 18px;
  overflow: auto;
}

.progress-card__event {
  display: grid;
  grid-template-columns: 56px minmax(0, 1fr);
  gap: 12px;
  padding: 12px 14px;
  border: 1px solid var(--app-border);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.72);
}

.progress-card__event span,
.progress-card__event p {
  margin: 0;
}

.progress-card__event span {
  color: var(--app-primary);
  font-weight: 700;
}

.progress-card__event p {
  color: var(--app-muted);
  line-height: 1.6;
}
</style>
