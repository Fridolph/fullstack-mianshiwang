<script setup lang="ts">
import ConsumptionRecordList from '~/components/history/ConsumptionRecordList.vue'
import { getConsumptionRecordsAPI } from '~/api/user'
import type { ConsumptionRecord, ConsumptionRecordsResponse } from '~/types/domain'

definePageMeta({
  layout: 'default',
  middleware: 'auth',
  requiresAuth: true,
})

const toast = useToast()
const $api = useApiClient()

const records = ref<ConsumptionRecord[]>([])
const activeType = ref<'all' | 'resume_quiz' | 'special_interview' | 'behavior_interview'>(
  'all',
)
const loading = ref(true)

const filterOptions = [
  { label: '全部', value: 'all' },
  { label: '简历押题', value: 'resume_quiz' },
  { label: '专项面试', value: 'special_interview' },
  { label: 'HR / 行测', value: 'behavior_interview' },
] as const

const filteredRecords = computed(() => {
  if (activeType.value === 'all') return records.value
  return records.value.filter(record => record.type === activeType.value)
})

async function loadHistory() {
  loading.value = true

  try {
    const result = await getConsumptionRecordsAPI($api, {
      skip: 0,
      limit: 50,
    })

    const payload = result as ConsumptionRecordsResponse
    records.value = payload.records || []
  } catch (error) {
    toast.add({
      title: '加载历史记录失败',
      description: error instanceof Error ? error.message : '请稍后重试',
      color: 'error',
    })
  } finally {
    loading.value = false
  }
}

onMounted(loadHistory)
</script>

<template>
  <section class="history-page">
    <div class="history-page__toolbar surface-card">
      <div>
        <span class="pill">Milestone 4 先行接入</span>
        <h1 class="section-title">
          服务历史记录
        </h1>
        <p class="section-description">
          这里优先展示后端已经稳定存在的消费记录数据，后续如果服务结果查询接口补齐，再继续增加“查看报告详情”。
        </p>
      </div>

      <div class="history-page__actions">
        <UButton
          v-for="option in filterOptions"
          :key="option.value"
          :variant="activeType === option.value ? 'solid' : 'soft'"
          color="neutral"
          @click="activeType = option.value">
          {{ option.label }}
        </UButton>

        <UButton
          icon="i-lucide-refresh-cw"
          :loading="loading"
          @click="loadHistory">
          刷新
        </UButton>
      </div>
    </div>

    <ConsumptionRecordList
      :records="filteredRecords"
      :loading="loading"
    />
  </section>
</template>

<style scoped>
.history-page {
  display: grid;
  gap: 24px;
}

.history-page__toolbar {
  padding: 24px;
}

.history-page__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 20px;
}
</style>
