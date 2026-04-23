<script setup lang="ts">
import {
  continueConversationAPI,
  getConsumptionRecordDetailAPI,
} from '~/api/interview'
import ResumeQuizResultCard from '~/components/interview/ResumeQuizResultCard.vue'
import type { ConsumptionRecordDetail } from '~/types/domain'

definePageMeta({
  layout: 'default',
  middleware: 'auth',
  requiresAuth: true,
})

const route = useRoute()
const toast = useToast()
const $api = useApiClient()

const detail = ref<ConsumptionRecordDetail | null>(null)
const loading = ref(true)
const continueLoading = ref(false)
const followUpQuestion = ref('')

const recordId = computed(() => String(route.params.recordId || ''))
const record = computed(() => detail.value?.record || null)
const result = computed(() => detail.value?.result || null)
const conversation = computed(
  () =>
    detail.value?.conversation || {
      sessionId: null,
      canContinue: false,
      analysis: null,
      messages: [],
    },
)

const statusTextMap: Record<string, string> = {
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

async function loadDetail() {
  loading.value = true

  try {
    detail.value = await getConsumptionRecordDetailAPI($api, recordId.value)
  } catch (error) {
    toast.add({
      title: '加载历史详情失败',
      description: error instanceof Error ? error.message : '请稍后重试',
      color: 'error',
    })
  } finally {
    loading.value = false
  }
}

async function handleContinueConversation() {
  if (!conversation.value.sessionId || !followUpQuestion.value.trim()) return

  continueLoading.value = true

  try {
    const payload = await continueConversationAPI($api, {
      sessionId: conversation.value.sessionId,
      question: followUpQuestion.value.trim(),
    })

    const nextMessages = [
      ...conversation.value.messages,
      {
        role: 'user',
        content: followUpQuestion.value.trim(),
        timestamp: new Date().toISOString(),
      },
      {
        role: 'assistant',
        content: String(payload.response || ''),
        timestamp: new Date().toISOString(),
      },
    ]

    detail.value = detail.value
      ? {
          ...detail.value,
          conversation: {
            ...detail.value.conversation,
            messages: nextMessages,
          },
        }
      : detail.value

    followUpQuestion.value = ''
    toast.add({
      title: '已继续追问',
      color: 'success',
    })
  } catch (error) {
    toast.add({
      title: '继续追问失败',
      description: error instanceof Error ? error.message : '请稍后重试',
      color: 'error',
    })
  } finally {
    continueLoading.value = false
  }
}

watch(
  recordId,
  () => {
    void loadDetail()
  },
  { immediate: true },
)
</script>

<template>
  <section class="grid gap-6">
    <div class="surface-card p-6">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div class="space-y-3">
          <span class="pill">服务记录详情</span>
          <h1 class="section-title">
            {{ record?.inputData?.positionName || '历史记录回看' }}
          </h1>
          <p class="section-description max-w-3xl">
            这里展示当前记录对应的输入信息、处理状态、结果内容以及已有对话历史。若该记录仍在进行中，且保留了会话上下文，你可以继续在原对话里追问，但不会重新开启新会话。
          </p>
        </div>

        <div class="flex flex-wrap gap-3">
          <UButton
            color="neutral"
            variant="soft"
            icon="i-lucide-arrow-left"
            to="/history">
            返回列表
          </UButton>
          <UButton
            v-if="result"
            color="neutral"
            variant="soft"
            icon="i-lucide-file-chart-column"
            :to="`/history/${recordId}/result`">
            查看答题结果页
          </UButton>
          <UButton
            icon="i-lucide-refresh-cw"
            :loading="loading"
            @click="loadDetail">
            刷新详情
          </UButton>
        </div>
      </div>

      <div class="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div class="rounded-2xl border border-[color:var(--app-border)] bg-white/70 p-4">
          <p class="text-sm text-[color:var(--app-muted)]">
            状态
          </p>
          <p class="mt-2 text-lg font-semibold text-[color:var(--app-text)]">
            {{ statusTextMap[record?.status || 'pending'] || '处理中' }}
          </p>
        </div>
        <div class="rounded-2xl border border-[color:var(--app-border)] bg-white/70 p-4">
          <p class="text-sm text-[color:var(--app-muted)]">
            公司
          </p>
          <p class="mt-2 text-lg font-semibold text-[color:var(--app-text)]">
            {{ record?.inputData?.company || '未填写' }}
          </p>
        </div>
        <div class="rounded-2xl border border-[color:var(--app-border)] bg-white/70 p-4">
          <p class="text-sm text-[color:var(--app-muted)]">
            创建时间
          </p>
          <p class="mt-2 text-lg font-semibold text-[color:var(--app-text)]">
            {{ formatDate(record?.createdAt) }}
          </p>
        </div>
        <div class="rounded-2xl border border-[color:var(--app-border)] bg-white/70 p-4">
          <p class="text-sm text-[color:var(--app-muted)]">
            题目数量
          </p>
          <p class="mt-2 text-lg font-semibold text-[color:var(--app-text)]">
            {{ result?.questions?.length || record?.outputData?.questionCount || 0 }}
          </p>
        </div>
      </div>
    </div>

    <div v-if="loading" class="surface-card flex items-center gap-3 p-6 text-[color:var(--app-muted)]">
      <UIcon name="i-lucide-loader-circle" class="size-5 animate-spin" />
      <span>正在加载历史详情...</span>
    </div>

    <template v-else-if="record">
      <div class="surface-card grid gap-5 p-6">
        <div class="space-y-1">
          <h2 class="text-2xl font-semibold text-[color:var(--app-text)]">
            输入快照
          </h2>
          <p class="section-description">
            这里保留触发该服务时的岗位、薪资与 JD 信息，方便你回看上下文。
          </p>
        </div>

        <div class="grid gap-4 lg:grid-cols-2">
          <div class="rounded-2xl border border-[color:var(--app-border)] bg-white/70 p-4">
            <p class="text-sm font-semibold text-[color:var(--app-muted)]">
              岗位名称
            </p>
            <p class="mt-2 whitespace-pre-wrap text-base leading-7 text-[color:var(--app-text)]">
              {{ record.inputData?.positionName || '未填写' }}
            </p>
          </div>
          <div class="rounded-2xl border border-[color:var(--app-border)] bg-white/70 p-4">
            <p class="text-sm font-semibold text-[color:var(--app-muted)]">
              薪资范围
            </p>
            <p class="mt-2 whitespace-pre-wrap text-base leading-7 text-[color:var(--app-text)]">
              {{ record.inputData?.minSalary || '--' }}K - {{ record.inputData?.maxSalary || '--' }}K
            </p>
          </div>
        </div>

        <div class="rounded-2xl border border-[color:var(--app-border)] bg-white/70 p-4">
          <p class="text-sm font-semibold text-[color:var(--app-muted)]">
            岗位 JD
          </p>
          <p class="mt-2 whitespace-pre-wrap text-sm leading-7 text-[color:var(--app-text)]">
            {{ record.inputData?.jd || '未提供 JD' }}
          </p>
        </div>

        <div
          v-if="record.errorMessage"
          class="rounded-2xl border border-error/20 bg-error/5 p-4 text-sm leading-7 text-error">
          {{ record.errorMessage }}
        </div>
      </div>

      <div class="surface-card grid gap-5 p-6">
        <div class="space-y-1">
          <h2 class="text-2xl font-semibold text-[color:var(--app-text)]">
            对话历史
          </h2>
          <p class="section-description">
            这里展示这次记录关联的分析上下文与追问消息；如果该记录仍在进行中且保留了会话 ID，可以继续沿用原会话追问。
          </p>
        </div>

        <div
          v-if="conversation.analysis"
          class="rounded-2xl border border-slate-800/80 bg-slate-950 p-4 text-sm leading-7 text-slate-100">
          <pre class="m-0 whitespace-pre-wrap break-words">{{ JSON.stringify(conversation.analysis, null, 2) }}</pre>
        </div>

        <div
          v-if="conversation.messages.length"
          class="grid gap-3">
          <article
            v-for="(message, index) in conversation.messages"
            :key="`${message.role}-${index}-${message.timestamp}`"
            class="rounded-2xl border border-[color:var(--app-border)] bg-white/70 p-4">
            <div class="mb-2 flex items-center justify-between gap-3">
              <span class="text-sm font-semibold text-primary">
                {{ message.role === 'assistant' ? 'AI' : '我' }}
              </span>
              <span class="text-xs text-[color:var(--app-muted)]">
                {{ formatDate(message.timestamp) }}
              </span>
            </div>
            <p class="m-0 whitespace-pre-wrap text-sm leading-7 text-[color:var(--app-text)]">
              {{ message.content }}
            </p>
          </article>
        </div>
        <div
          v-else
          class="rounded-2xl border border-dashed border-[color:var(--app-border)] bg-white/60 p-4 text-sm leading-7 text-[color:var(--app-muted)]">
          该记录暂无可回放的对话内容。旧版本记录可能只保留了消费结果，没有保留分析会话上下文。
        </div>

        <div
          v-if="conversation.canContinue"
          class="grid gap-3 rounded-2xl border border-primary/15 bg-primary/5 p-4">
          <label class="grid gap-2">
            <span class="text-sm font-semibold text-[color:var(--app-text)]">继续当前对话</span>
            <UTextarea
              v-model="followUpQuestion"
              :rows="3"
              placeholder="基于这次已有上下文继续追问，例如：请继续深挖我在性能优化上的实践细节"
            />
          </label>
          <div class="flex justify-end">
            <UButton
              icon="i-lucide-message-square-share"
              :loading="continueLoading"
              @click="handleContinueConversation">
              继续追问
            </UButton>
          </div>
        </div>
      </div>

      <ResumeQuizResultCard :report="result" />
    </template>
  </section>
</template>
