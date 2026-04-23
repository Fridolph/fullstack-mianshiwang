<script setup lang="ts">
import ResumeAnalysisSummaryPanel from '~/components/interview/ResumeAnalysisSummaryPanel.vue'

const props = defineProps<{
  analysis: Record<string, unknown> | null
  sessionId?: string | null
  messages?: Array<{
    role: string
    content: string
    timestamp: string
  }>
  loading?: boolean
  hideHeader?: boolean
}>()

const emit = defineEmits<{
  ask: [question: string]
}>()

const followUpQuestion = ref('')
const messagesContainerRef = ref<HTMLDivElement | null>(null)

function submitQuestion() {
  if (!followUpQuestion.value.trim()) return
  emit('ask', followUpQuestion.value.trim())
  followUpQuestion.value = ''
}

async function scrollMessagesToBottom() {
  await nextTick()
  const container = messagesContainerRef.value

  if (!container) return

  container.scrollTo({
    top: container.scrollHeight,
    behavior: 'smooth',
  })
}

const renderedAnalysis = computed(() =>
  props.analysis ? JSON.stringify(props.analysis, null, 2) : '',
)

watch(
  () => props.messages?.length || 0,
  () => {
    void scrollMessagesToBottom()
  },
  { flush: 'post' },
)
</script>

<template>
  <section class="surface-card analysis-card">
    <div v-if="!hideHeader" class="analysis-card__header">
      <div>
        <span class="pill">简历分析</span>
        <h2>先看一眼分析结果，再决定是否发起押题</h2>
      </div>
      <UBadge v-if="sessionId" color="neutral" variant="soft">
        session: {{ sessionId }}
      </UBadge>
    </div>

    <div v-if="analysis" class="analysis-card__content">
      <ResumeAnalysisSummaryPanel :analysis="analysis" />

      <section class="analysis-card__debug">
        <div class="analysis-card__debug-header">
          <div>
            <span class="pill">开发联调视图</span>
            <p class="analysis-card__debug-copy">
              当前先保留原始 JSON，便于你和我一起核对字段契约与联调结果。
            </p>
          </div>
        </div>
        <pre>{{ renderedAnalysis }}</pre>
      </section>
    </div>
    <div v-else class="analysis-card__empty">
      分析结果会显示在这里，便于你一边看 AI 返回结构，一边理解前后端契约。
    </div>

    <section v-if="sessionId" class="analysis-card__chat">
      <div class="analysis-card__chat-header">
        <div>
          <span class="pill">继续追问</span>
          <p class="analysis-card__chat-copy">
            这里会保留多轮上下文。消息区域独立滚动，输入区固定在底部，更接近真实聊天体验。
          </p>
        </div>
      </div>

      <div ref="messagesContainerRef" class="analysis-card__messages">
        <article
          v-for="(message, index) in messages"
          :key="`${message.role}-${index}`"
          :class="[
            'analysis-message',
            message.role === 'assistant'
              ? 'analysis-message--assistant'
              : 'analysis-message--user'
          ]">
          <span>{{ message.role === 'assistant' ? 'AI' : '我' }}</span>
          <p>{{ message.content }}</p>
        </article>

        <div v-if="!messages?.length" class="analysis-card__messages-empty">
          分析完成后，你可以继续追问项目细节、岗位匹配点，或者让 AI 帮你补齐回答思路。
        </div>
      </div>

      <div class="analysis-card__composer">
        <label class="analysis-card__field">
          <span>继续追问输入框</span>
          <UTextarea
            v-model="followUpQuestion"
            :rows="3"
            autoresize
            placeholder="例如：请继续追问我在这个项目中的性能优化细节"
          />
        </label>
        <div class="analysis-card__composer-actions">
          <UButton
            color="neutral"
            :loading="loading"
            icon="i-lucide-message-square-share"
            @click="submitQuestion">
            发起追问
          </UButton>
        </div>
      </div>
    </section>
  </section>
</template>

<style scoped>
.analysis-card {
  display: grid;
  gap: 18px;
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

.analysis-card__content {
  display: grid;
  gap: 18px;
}

.analysis-card__debug,
.analysis-card__empty {
  padding: 18px;
  border-radius: 18px;
  border: 1px solid var(--app-border);
}

.analysis-card__debug {
  background: rgba(15, 23, 42, 0.96);
  color: #e2e8f0;
}

.analysis-card__debug-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.analysis-card__debug-copy {
  margin: 14px 0 0;
  color: rgba(226, 232, 240, 0.8);
  line-height: 1.7;
}

.analysis-card__debug pre {
  margin: 18px 0 0;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-word;
}

.analysis-card__empty {
  background: rgba(255, 255, 255, 0.7);
  color: var(--app-muted);
}

.analysis-card__chat {
  display: grid;
  gap: 16px;
  border: 1px solid var(--app-border);
  border-radius: 24px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.88), rgba(248, 250, 252, 0.96));
  padding: 18px;
}

.analysis-card__chat-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.analysis-card__chat-copy {
  margin: 14px 0 0;
  color: var(--app-muted);
  line-height: 1.7;
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
  max-height: 360px;
  overflow-y: auto;
  padding-right: 6px;
}

.analysis-card__messages-empty {
  padding: 18px;
  border: 1px dashed var(--app-border);
  border-radius: 18px;
  color: var(--app-muted);
  line-height: 1.7;
}

.analysis-message {
  display: grid;
  gap: 8px;
  max-width: min(100%, 680px);
  padding: 14px 16px;
  border: 1px solid var(--app-border);
  border-radius: 16px;
}

.analysis-message--assistant {
  justify-self: start;
  background: rgba(255, 255, 255, 0.92);
}

.analysis-message--user {
  justify-self: end;
  background: rgba(59, 130, 246, 0.08);
  border-color: rgba(59, 130, 246, 0.18);
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

.analysis-card__composer {
  position: sticky;
  bottom: 0;
  display: grid;
  gap: 12px;
  padding-top: 14px;
  border-top: 1px solid rgba(148, 163, 184, 0.18);
  background: linear-gradient(180deg, rgba(248, 250, 252, 0.72), rgba(255, 255, 255, 0.98));
}

.analysis-card__composer-actions {
  display: flex;
  justify-content: flex-end;
}
</style>
