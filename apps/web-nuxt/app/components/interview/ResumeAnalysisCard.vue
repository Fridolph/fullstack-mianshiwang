<script setup lang="ts">
const props = defineProps<{
  analysis: Record<string, unknown> | null
  sessionId?: string | null
  messages?: Array<{
    role: string
    content: string
    timestamp: string
  }>
  loading?: boolean
}>()

const emit = defineEmits<{
  ask: [question: string]
}>()

const followUpQuestion = ref('')

function submitQuestion() {
  if (!followUpQuestion.value.trim()) return
  emit('ask', followUpQuestion.value.trim())
  followUpQuestion.value = ''
}

const renderedAnalysis = computed(() =>
  props.analysis ? JSON.stringify(props.analysis, null, 2) : '',
)
</script>

<template>
  <section class="surface-card analysis-card">
    <div class="analysis-card__header">
      <div>
        <span class="pill">简历分析</span>
        <h2>先看一眼分析结果，再决定是否发起押题</h2>
      </div>
      <UBadge v-if="sessionId" color="neutral" variant="soft">
        session: {{ sessionId }}
      </UBadge>
    </div>

    <div v-if="analysis" class="analysis-card__content">
      <pre>{{ renderedAnalysis }}</pre>
    </div>
    <div v-else class="analysis-card__empty">
      分析结果会显示在这里，便于你一边看 AI 返回结构，一边理解前后端契约。
    </div>

    <div v-if="sessionId" class="analysis-card__follow-up">
      <label class="analysis-card__field">
        <span>继续追问</span>
        <UTextarea
          v-model="followUpQuestion"
          :rows="3"
          placeholder="例如：请继续追问我在这个项目中的性能优化细节"
        />
      </label>
      <UButton
        color="neutral"
        :loading="loading"
        icon="i-lucide-message-square-share"
        @click="submitQuestion">
        发起追问
      </UButton>
    </div>

    <div v-if="messages?.length" class="analysis-card__messages">
      <article
        v-for="(message, index) in messages"
        :key="`${message.role}-${index}`"
        class="analysis-message">
        <span>{{ message.role === 'assistant' ? 'AI' : '我' }}</span>
        <p>{{ message.content }}</p>
      </article>
    </div>
  </section>
</template>

<style scoped>
.analysis-card {
  padding: 24px;
}

.analysis-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.analysis-card__header h2 {
  margin: 16px 0 0;
  font-size: 24px;
}

.analysis-card__content,
.analysis-card__empty {
  margin-top: 18px;
  padding: 18px;
  border-radius: 18px;
  border: 1px solid var(--app-border);
  background: rgba(15, 23, 42, 0.96);
  color: #e2e8f0;
}

.analysis-card__content pre {
  margin: 0;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-word;
}

.analysis-card__empty {
  background: rgba(255, 255, 255, 0.7);
  color: var(--app-muted);
}

.analysis-card__follow-up {
  display: grid;
  gap: 12px;
  margin-top: 18px;
}

.analysis-card__field {
  display: grid;
  gap: 8px;
}

.analysis-card__field span {
  font-weight: 600;
}

.analysis-card__messages {
  display: grid;
  gap: 12px;
  margin-top: 18px;
}

.analysis-message {
  display: grid;
  gap: 8px;
  padding: 14px 16px;
  border: 1px solid var(--app-border);
  border-radius: 16px;
}

.analysis-message span,
.analysis-message p {
  margin: 0;
}

.analysis-message span {
  color: var(--app-primary);
  font-weight: 700;
}

.analysis-message p {
  color: var(--app-muted);
  line-height: 1.7;
  white-space: pre-wrap;
}
</style>
