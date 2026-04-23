<script setup lang="ts">
import type { ResumeQuizProgressEvent } from '~/types/api'

const props = defineProps<{
  currentProgress: ResumeQuizProgressEvent | null
  errorMessage?: string
}>()

const stageTextMap: Record<string, string> = {
  prepare: '准备中',
  generating: 'AI 生成中',
  saving: '结果整理中',
  done: '已完成',
}

const progressValue = computed(() => props.currentProgress?.progress ?? 0)
const progressLabel = computed(
  () => props.currentProgress?.label || '等待开始...',
)
const stageLabel = computed(() => {
  const stage = props.currentProgress?.stage
  return stage ? stageTextMap[stage] || stage : '待命'
})
</script>

<template>
  <section class="surface-card grid gap-5 p-6">
    <div class="flex items-start justify-between gap-4">
      <div class="space-y-3">
        <span class="pill">SSE 流式进度</span>
        <div class="space-y-2">
          <h2 class="text-2xl font-semibold text-[color:var(--app-text)]">
            当前生成进度
          </h2>
          <p class="text-sm leading-6 text-[color:var(--app-muted)]">
            这里只展示当前实时状态，不再堆叠事件队列，方便你一直盯住最新进度。
          </p>
        </div>
      </div>

      <UBadge color="neutral" variant="soft" size="lg">
        {{ progressValue }}%
      </UBadge>
    </div>

    <UProgress :model-value="progressValue" size="xl" />

    <div class="grid gap-3 rounded-2xl border border-[color:var(--app-border)] bg-white/70 p-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <p class="text-sm font-semibold text-[color:var(--app-text)]">
          {{ progressLabel }}
        </p>
        <UBadge color="primary" variant="subtle">
          {{ stageLabel }}
        </UBadge>
      </div>

      <p v-if="errorMessage" class="text-sm leading-6 text-error">
        {{ errorMessage }}
      </p>
      <p v-else class="text-sm leading-6 text-[color:var(--app-muted)]">
        SSE 有新事件时会实时刷新；如果后端重复返回同一进度，界面会保持稳定，不再重复闪动。
      </p>
    </div>
  </section>
</template>
