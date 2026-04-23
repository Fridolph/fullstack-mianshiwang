<script setup lang="ts">
import ResumeAnalysisCard from '~/components/interview/ResumeAnalysisCard.vue'

const props = defineProps<{
  analysis: Record<string, unknown> | null
  sessionId?: string | null
  messages?: Array<{
    role: string
    content: string
    timestamp: string
  }>
  loading?: boolean
  open?: boolean
}>()

const emit = defineEmits<{
  'ask': [question: string]
  'update:open': [value: boolean]
}>()

const internalOpen = ref(false)
const isControlled = computed(() => props.open !== undefined)
const isOpen = computed(() => (isControlled.value ? Boolean(props.open) : internalOpen.value))

function setOpen(value: boolean) {
  if (!isControlled.value) {
    internalOpen.value = value
  }

  emit('update:open', value)
}

const summaryText = computed(() => {
  if (!props.analysis) {
    return '先做简历分析后，这里会展示结构化结果与继续追问入口。'
  }

  return isOpen.value
    ? '已展开，你可以查看分析结果，并基于当前会话继续追问。'
    : '分析结果已就绪，展开后可以查看详情，再决定是否发起押题。'
})
</script>

<template>
  <section class="surface-card grid gap-4 p-6">
    <button
      type="button"
      class="flex w-full items-start justify-between gap-4 text-left"
      @click="setOpen(!isOpen)">
      <div class="space-y-3">
        <span class="pill">分析面板</span>
        <div class="space-y-2">
          <h2 class="text-2xl font-semibold text-[color:var(--app-text)]">
            先看一眼分析结果，再决定是否发起押题
          </h2>
          <p class="text-sm leading-6 text-[color:var(--app-muted)]">
            {{ summaryText }}
          </p>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <UBadge v-if="sessionId" color="neutral" variant="soft">
          session: {{ sessionId }}
        </UBadge>
        <UIcon
          :name="isOpen ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
          class="size-5 text-[color:var(--app-muted)]"
        />
      </div>
    </button>

    <div
      v-if="isOpen"
      class="rounded-3xl border border-[color:var(--app-border)] bg-white/50 p-2">
      <ResumeAnalysisCard
        :analysis="analysis"
        :session-id="sessionId"
        :messages="messages"
        :loading="loading"
        hide-header
        @ask="emit('ask', $event)"
      />
    </div>
  </section>
</template>
