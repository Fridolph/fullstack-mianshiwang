<script setup lang="ts">
import type { ConsumptionRecord } from '~/types/domain'

defineProps<{
  records: ConsumptionRecord[]
  loading?: boolean
}>()

const typeLabelMap: Record<string, string> = {
  resume_quiz: '简历押题',
  special_interview: '专项面试',
  behavior_interview: 'HR / 行测',
  ai_interview: 'AI 模拟面试',
}

const statusLabelMap: Record<string, string> = {
  pending: '处理中',
  success: '已完成',
  failed: '已失败',
  cancelled: '已取消',
}

function formatDate(value?: string) {
  if (!value) return '--'

  return new Intl.DateTimeFormat('zh-CN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function resolveTypeLabel(type?: string) {
  return typeLabelMap[type || ''] || type || '未知服务'
}

function resolveStatusColor(status?: string) {
  if (status === 'success') return 'success'
  if (status === 'failed') return 'error'
  if (status === 'cancelled') return 'neutral'
  return 'warning'
}
</script>

<template>
  <section class="history-list surface-card">
    <div class="history-list__header">
      <div>
        <h2>服务记录</h2>
        <p class="section-description">
          点击任意记录即可进入详情页，查看这次服务的输入快照、处理结果与保留的历史对话。
        </p>
      </div>
      <UBadge color="neutral" variant="soft">
        {{ records.length }} 条
      </UBadge>
    </div>

    <div v-if="loading" class="history-list__state">
      <UIcon name="i-lucide-loader-circle" class="size-5 animate-spin" />
      <span>正在加载记录...</span>
    </div>

    <div v-else-if="records.length === 0" class="history-list__state">
      <UIcon name="i-lucide-inbox" class="size-5" />
      <span>暂时还没有服务记录，先去完成一次简历押题吧。</span>
    </div>

    <div v-else class="history-list__body">
      <NuxtLink
        v-for="record in records"
        :key="record.recordId || record._id"
        :to="`/history/${record.recordId || record._id}`"
        class="history-item">
        <div class="history-item__main">
          <div class="history-item__title-row">
            <h3>{{ record.inputData?.company || '未填写公司' }}</h3>
            <UBadge
              :color="resolveStatusColor(record.status)"
              variant="soft">
              {{ statusLabelMap[record.status || 'pending'] || '处理中' }}
            </UBadge>
          </div>
          <p class="history-item__subtitle">
            {{ record.inputData?.positionName || '未填写岗位' }} ·
            {{ resolveTypeLabel(record.type) }}
          </p>
          <p class="history-item__meta">
            {{ formatDate(record.createdAt) }}
            <span v-if="record.outputData?.questionCount">
              · 生成题目 {{ record.outputData?.questionCount }} 道
            </span>
            <span v-if="record.errorMessage">· {{ record.errorMessage }}</span>
          </p>
        </div>
        <UIcon name="i-lucide-chevron-right" class="history-item__arrow size-5" />
      </NuxtLink>
    </div>
  </section>
</template>

<style scoped>
.history-list {
  padding: 24px;
}

.history-list__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.history-list__header h2 {
  margin: 0 0 10px;
  font-size: 24px;
}

.history-list__state {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 24px 0;
  color: var(--app-muted);
}

.history-list__body {
  display: grid;
  gap: 14px;
}

.history-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px;
  border: 1px solid var(--app-border);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.66);
  transition:
    transform 0.18s ease,
    border-color 0.18s ease,
    box-shadow 0.18s ease;
}

.history-item:hover {
  border-color: rgba(5, 150, 105, 0.2);
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.06);
  transform: translateY(-1px);
}

.history-item__title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.history-item__title-row h3,
.history-item__subtitle,
.history-item__meta {
  margin: 0;
}

.history-item__subtitle {
  margin-top: 8px;
  color: var(--app-text);
  font-weight: 600;
}

.history-item__meta {
  margin-top: 8px;
  color: var(--app-muted);
  line-height: 1.7;
}

.history-item__arrow {
  flex-shrink: 0;
  color: var(--app-muted);
}
</style>
