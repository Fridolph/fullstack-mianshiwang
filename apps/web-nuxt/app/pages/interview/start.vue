<script setup lang="ts">
import {
  analyzeResumeAPI,
  continueConversationAPI,
  generateResumeQuizSSE,
  parseResumeFileAPI,
} from '~/api/interview'
import ResumeAnalysisFoldPanel from '~/components/interview/ResumeAnalysisFoldPanel.vue'
import ResumeQuizAnswerWorkspace from '~/components/interview/ResumeQuizAnswerWorkspace.vue'
import ResumeQuizFormCard from '~/components/interview/ResumeQuizFormCard.vue'
import ResumeQuizProgressCard from '~/components/interview/ResumeQuizProgressCard.vue'
import type { ResumeQuizProgressEvent, SseConnection } from '~/types/api'
import { resolvePublicApiBase } from '~/utils/api-base'

definePageMeta({
  layout: 'default',
  middleware: 'auth',
  requiresAuth: true,
})

const toast = useToast()
const runtimeConfig = useRuntimeConfig()
const publicApiBase = resolvePublicApiBase(runtimeConfig.public.apiBase)
const $api = useApiClient()
const userStore = useUserStore()
const interviewStore = useInterviewStore()

const loading = ref(false)
const questionLoading = ref(false)
const resumeFileLoading = ref(false)
const openingResult = ref(false)
const analysisPanelOpen = ref(false)
const analysisDialogOpen = ref(false)
const activeConnection = ref<SseConnection | null>(null)
const route = useRoute()
const router = useRouter()

const formState = computed({
  get: () => interviewStore.quizDraft,
  set: value => interviewStore.setQuizDraft(value),
})

const messages = computed(() => interviewStore.messages)
const analysis = computed(() => interviewStore.analysis)
const currentProgress = computed(() => interviewStore.currentProgress)
const errorMessage = computed(() => interviewStore.lastError)
const activeRecordId = computed(
  () => interviewStore.activeRecordId || interviewStore.report?.recordId || '',
)
const activeSession = computed(() =>
  activeRecordId.value
    ? interviewStore.resumeQuizSessions[activeRecordId.value] || null
    : null,
)
const activeReport = computed(
  () => activeSession.value?.report || interviewStore.report,
)
const stageOneQuestions = computed(
  () => activeReport.value?.stageOneQuestions || activeReport.value?.questions || [],
)
const activeStageOneAnswers = computed(
  () => activeSession.value?.stageOneAnswerDrafts || [],
)
const resultSectionRef = ref<HTMLElement | null>(null)
const analysisSectionRef = ref<HTMLElement | null>(null)

const mockDraft = {
  company: '字节跳动',
  positionName: '资深前端开发工程师',
  minSalary: 25,
  maxSalary: 40,
  jd: `负责 Web 中后台与用户端产品的前端架构设计与开发，主导复杂交互页面、性能优化、工程化建设和 AI 业务接入。要求熟悉 Vue / React、TypeScript、状态管理、接口联调、性能优化与跨团队协作，能够独立推进需求落地，并对业务抽象与可维护性负责。`,
  resumeContent: `张三
5 年前端开发经验，主攻 Vue 3、TypeScript、Nuxt 与工程化体系建设。

工作经历
1. 负责企业级中后台系统重构，推动模块拆分、状态管理收敛和组件库沉淀，页面首屏加载时间下降 35%。
2. 参与 AI 面试练习平台建设，完成登录态、SSE 流式推送、历史记录与结果回看等关键链路。
3. 与后端协作完成简历分析、继续追问、结果查询等接口联调，沉淀错误处理与请求封装规范。

项目亮点
1. 主导将旧项目迁移到 Nuxt 4 + Monorepo，统一前后端开发命令与工程规范。
2. 通过埋点和性能分析优化渲染链路，减少重复请求与无效重绘。
3. 负责多个复杂表单和工作流页面设计，实现高可维护性的业务抽象。`,
  resumeURL: '',
}

function createRequestId() {
  const cryptoObject = globalThis.crypto

  if (cryptoObject?.randomUUID) {
    return cryptoObject.randomUUID()
  }

  const bytes = new Uint8Array(16)

  if (cryptoObject?.getRandomValues) {
    cryptoObject.getRandomValues(bytes)
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256)
    }
  }

  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x40
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80

  const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')

  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join('-')
}

function pushProgressEvent(event: ResumeQuizProgressEvent) {
  interviewStore.pushProgressLog(event)
}

function startProgressFlow(label: string, progress: number = 5) {
  resetStreamState()
  pushProgressEvent({
    type: 'progress',
    progress,
    label,
    message: label,
    stage: 'prepare',
  })
}

function completeProgressFlow(label: string) {
  pushProgressEvent({
    type: 'complete',
    progress: 100,
    label,
    message: label,
    stage: 'done',
  })
}

function failProgressFlow(label: string, error: unknown) {
  const message = error instanceof Error ? error.message : '请稍后重试'
  interviewStore.setLastError(message)
  pushProgressEvent({
    type: 'error',
    progress: 0,
    label,
    message,
    error: message,
  })
}

// 当前开始页直接对着后端 DTO 做最小校验，避免无效请求进入服务端。
function validateForm() {
  if (!formState.value.positionName.trim()) return '请先填写目标岗位'
  if (formState.value.jd.trim().length < 50) return '岗位 JD 至少需要 50 个字符'
  if (!formState.value.resumeContent.trim() && !formState.value.resumeURL.trim()) {
    return '请提供简历文本，或填写可访问的简历 URL'
  }
  return ''
}

// 第一步：先做简历分析，获取 analysis + sessionId，后续才能继续追问。
async function handleAnalyzeResume() {
  const validationMessage = validateForm()
  if (validationMessage) {
    toast.add({
      title: '信息还不完整',
      description: validationMessage,
      color: 'warning',
    })
    return
  }

  startProgressFlow('已提交简历分析请求，等待服务返回...', 8)
  loading.value = true

  try {
    pushProgressEvent({
      type: 'progress',
      progress: 35,
      label: '后端正在分析简历与岗位 JD 匹配度...',
      message: '后端正在分析简历与岗位 JD 匹配度...',
      stage: 'generating',
    })

    const payload = await analyzeResumeAPI($api, {
      position: formState.value.positionName.trim(),
      resume: formState.value.resumeContent.trim(),
      jobDescription: formState.value.jd.trim(),
    })

    interviewStore.setAnalysis(payload.analysis as Record<string, unknown>, payload.sessionId)
    analysisPanelOpen.value = true
    analysisDialogOpen.value = true
    completeProgressFlow('简历分析完成，可以继续追问或直接开始押题。')
    toast.add({
      title: '简历分析完成',
      description: '分析面板已自动展开，你可以先看结果，再决定是否开始押题。',
      color: 'success',
    })

    await nextTick()
    analysisSectionRef.value?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  } catch (error) {
    failProgressFlow('简历分析失败', error)
    toast.add({
      title: '简历分析失败',
      description: error instanceof Error ? error.message : '请稍后重试',
      color: 'error',
    })
  } finally {
    loading.value = false
  }
}

// 第二步：基于 analyze-resume 返回的 sessionId 做多轮继续追问。
async function handleAskFollowUp(question: string) {
  if (!interviewStore.sessionId) return

  startProgressFlow('已提交继续追问请求，等待 AI 回复...', 12)
  questionLoading.value = true
  interviewStore.addMessage({
    role: 'user',
    content: question,
    timestamp: new Date().toISOString(),
  })

  try {
    pushProgressEvent({
      type: 'progress',
      progress: 52,
      label: 'AI 正在基于当前会话上下文组织回答...',
      message: 'AI 正在基于当前会话上下文组织回答...',
      stage: 'generating',
    })

    const payload = await continueConversationAPI($api, {
      sessionId: interviewStore.sessionId,
      question,
    })

    interviewStore.addMessage({
      role: 'assistant',
      content: String(payload.response || ''),
      timestamp: new Date().toISOString(),
    })

    completeProgressFlow('AI 已返回追问结果。')
  } catch (error) {
    failProgressFlow('继续追问失败', error)
    toast.add({
      title: '继续追问失败',
      description: error instanceof Error ? error.message : '请稍后重试',
      color: 'error',
    })
  } finally {
    questionLoading.value = false
  }
}

function handleMockFill() {
  interviewStore.setQuizDraft(mockDraft)
  toast.add({
    title: '已填充 mock 信息',
    description: '你可以直接点击“先分析简历”或继续微调内容。',
    color: 'success',
  })
}

async function handleResumeFileParse(file: File) {
  resumeFileLoading.value = true

  try {
    const result = await parseResumeFileAPI($api, file)
    interviewStore.setQuizDraft({
      resumeContent: result.text,
      resumeURL: '',
    })

    toast.add({
      title: '简历文件已读取',
      description: result.warnings?.length
        ? result.warnings.join('；')
        : `已回填 ${file.name} 的文本内容`,
      color: 'success',
    })
  } catch (error) {
    toast.add({
      title: '简历文件读取失败',
      description: error instanceof Error ? error.message : '请稍后重试',
      color: 'error',
    })
  } finally {
    resumeFileLoading.value = false
  }
}

function closeAnalysisDialog() {
  analysisDialogOpen.value = false
}

async function handleViewAnalysisResult() {
  analysisPanelOpen.value = true
  analysisDialogOpen.value = false

  await nextTick()
  analysisSectionRef.value?.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  })
}

// 重新发起流式请求前，先关闭旧连接并清空上一次的进度痕迹。
function resetStreamState() {
  activeConnection.value?.close()
  activeConnection.value = null
  interviewStore.resetProgress()
  interviewStore.setLastError('')
}

// 当前结果页除了展示后端返回结果，也要补上开始页里的输入上下文。
function normalizeCompletePayload(event: ResumeQuizProgressEvent) {
  const eventData = (event.data || {}) as ResumeQuizProgressEvent['data'] & {
    consmptionRecordId?: string
  }
  const recordId = eventData.recordId || eventData.consmptionRecordId

  return {
    ...eventData,
    recordId,
    stageOneQuestions: eventData.stageOneQuestions || eventData.questions || [],
    questions: eventData.questions || [],
    analysis: eventData.analysis || [],
    company: formState.value.company,
    position: formState.value.positionName,
    jobDescription: formState.value.jd,
  }
}

/**
 * 第三步：发起 SSE 简历押题。
 *
 * 这里是当前前端最核心的一段业务编排：
 * - 构造 requestId，满足后端幂等性设计
 * - 建立 SSE 连接
 * - 把 progress / complete / error 分发到 store
 * - complete 后跳转结果页
 */
async function handleGenerateQuiz() {
  const validationMessage = validateForm()
  if (validationMessage) {
    toast.add({
      title: '信息还不完整',
      description: validationMessage,
      color: 'warning',
    })
    return
  }

  resetStreamState()
  interviewStore.setInterviewStatus('starting')
  interviewStore.setReport(null)
  interviewStore.setActiveResumeQuizRecord(null)
  loading.value = true

  const requestId = createRequestId()
  if (!requestId) {
    toast.add({
      title: '生成请求标识失败',
      description: '请刷新页面后重试。',
      color: 'error',
    })
    loading.value = false
    interviewStore.setInterviewStatus('idle')
    return
  }

  pushProgressEvent({
    type: 'progress',
    progress: 3,
    label: '已创建请求标识，正在连接 SSE 流...',
    message: '已创建请求标识，正在连接 SSE 流...',
    stage: 'prepare',
  })

  activeConnection.value = generateResumeQuizSSE(
    {
      company: formState.value.company.trim() || undefined,
      positionName: formState.value.positionName.trim(),
      minSalary: formState.value.minSalary || undefined,
      maxSalary: formState.value.maxSalary || undefined,
      jd: formState.value.jd.trim(),
      resumeContent: formState.value.resumeContent.trim() || undefined,
      resumeURL: formState.value.resumeURL.trim() || undefined,
      sessionId: interviewStore.sessionId || undefined,
      requestId,
      promptVersion: 'web-nuxt-v1',
    },
    {
      token: userStore.token,
      baseURL: publicApiBase,
      callbacks: {
        onMessage(event) {
          pushProgressEvent(event)
          if (event.type === 'complete') {
            const normalizedReport = normalizeCompletePayload(event)

            activeConnection.value = null
            interviewStore.setInterviewStatus('ended')
            interviewStore.setReport(normalizedReport)
            loading.value = false
            void nextTick(() => {
              resultSectionRef.value?.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
              })
            })
          }
          if (event.type === 'error') {
            activeConnection.value = null
            interviewStore.setInterviewStatus('idle')
            interviewStore.setLastError(event.error || '生成失败')
            loading.value = false
          }
        },
        onError(error) {
          activeConnection.value = null
          interviewStore.setInterviewStatus('idle')
          failProgressFlow('流式押题失败', error)
          loading.value = false
          toast.add({
            title: '流式押题失败',
            description: error.message,
            color: 'error',
          })
        },
        onComplete() {
          activeConnection.value = null
          loading.value = false
        },
      },
    },
  )
}

// 页面离开时手动关闭 SSE，避免旧连接继续向已销毁组件推送事件。
onBeforeUnmount(() => {
  activeConnection.value?.close()
})

watch(
  analysis,
  (value) => {
    if (value) {
      analysisPanelOpen.value = true
    }
  },
  { immediate: true },
)

watch(
  () => route.query.fresh,
  async (fresh) => {
    if (!fresh) return

    interviewStore.resetStartPageState()
    analysisPanelOpen.value = false
    analysisDialogOpen.value = false
    activeConnection.value?.close()
    activeConnection.value = null

    const nextQuery = { ...route.query }
    delete nextQuery.fresh

    await router.replace({
      query: nextQuery,
    })
  },
  { immediate: true },
)

function handleAnswerUpdate(payload: { index: number, value: string }) {
  if (!activeRecordId.value) return
  interviewStore.setResumeQuizAnswer(
    activeRecordId.value,
    'stageOne',
    payload.index,
    payload.value,
  )
}

async function handleOpenResultPage() {
  if (!activeRecordId.value) return

  const questionCount = stageOneQuestions.value.length
  const answeredCount = activeStageOneAnswers.value.filter(answer => answer?.trim()).length

  if (!questionCount || answeredCount !== questionCount) {
    toast.add({
      title: '请先完成全部回答',
      description: '所有题目都填写后，才能进入独立结果页。',
      color: 'warning',
    })
    return
  }

  openingResult.value = true
  interviewStore.setActiveResumeQuizRecord(activeRecordId.value)

  try {
    await router.push(`/history/${activeRecordId.value}/result`)
  } finally {
    openingResult.value = false
  }
}
</script>

<template>
  <section class="interview-start">
    <ResumeQuizFormCard
      v-model="formState"
      :loading="loading || resumeFileLoading"
      @analyze="handleAnalyzeResume"
      @generate="handleGenerateQuiz"
      @mock-fill="handleMockFill"
      @parse-resume-file="handleResumeFileParse"
    />

    <aside class="interview-start__sidebar">
      <ResumeQuizProgressCard
        :current-progress="currentProgress"
        :error-message="errorMessage"
      />
    </aside>
  </section>

  <div ref="analysisSectionRef">
    <ResumeAnalysisFoldPanel
      v-model:open="analysisPanelOpen"
      :analysis="analysis"
      :session-id="interviewStore.sessionId"
      :messages="messages"
      :loading="questionLoading"
      @ask="handleAskFollowUp"
    />
  </div>

  <section class="surface-card interview-analysis-cta">
    <div class="space-y-2">
      <span class="pill">继续深化</span>
      <h2 class="text-2xl font-semibold text-[color:var(--app-text)]">
        看完分析后，可以直接继续押题
      </h2>
      <p class="text-sm leading-7 text-[color:var(--app-muted)]">
        这个入口不会被折叠隐藏。你可以先分析再押题，也可以不分析直接从上方表单开始。
      </p>
    </div>

    <div class="interview-analysis-cta__actions">
      <UButton
        icon="i-lucide-sparkles"
        :loading="loading"
        @click="handleGenerateQuiz">
        开始流式押题
      </UButton>
      <UButton
        v-if="analysis"
        color="neutral"
        variant="soft"
        icon="i-lucide-panel-top-open"
        @click="handleViewAnalysisResult">
        查看分析结果
      </UButton>
    </div>
  </section>

  <section
    v-if="stageOneQuestions.length"
    ref="resultSectionRef"
    class="interview-result-panel">
    <div class="surface-card interview-result-panel__hero">
      <div>
        <span class="pill">流式押题结果</span>
        <h2 class="section-title">
          第 1 阶段 7 题已生成，开始作答
        </h2>
        <p class="section-description">
          当前开始页只展示第 1 阶段 7 道题。你先完成这 7 题后，再进入独立结果页继续第 2 阶段 3 道定制题与最终综合评价。
        </p>
      </div>

      <div class="interview-result-panel__actions">
        <UButton
          color="neutral"
          variant="soft"
          icon="i-lucide-history"
          to="/history">
          查看历史记录
        </UButton>
      </div>
    </div>

    <ResumeQuizAnswerWorkspace
      v-if="activeRecordId"
      :record-id="activeRecordId"
      :questions="stageOneQuestions"
      :answers="activeStageOneAnswers"
      phase-label="第 1 阶段"
      title="先完成 7 道首轮问题"
      description="这 7 道题包含基础通识、进阶追问和简历项目深挖。这里只展示问题和提示，不展示参考答案。"
      footer-title="完成 7 题后进入独立结果页"
      footer-description="结果页会先展示这 7 题和你的回答，再异步生成第 2 阶段 3 道定制题。"
      action-label="进入独立结果页"
      :opening-result="openingResult"
      @update-answer="handleAnswerUpdate"
      @open-result="handleOpenResultPage"
    />
  </section>

  <div
    v-if="analysisDialogOpen"
    class="interview-start-dialog">
    <div class="interview-start-dialog__backdrop" @click="closeAnalysisDialog" />
    <div class="interview-start-dialog__panel">
      <UCard>
        <template #header>
          <div class="flex items-start gap-3">
            <div class="rounded-2xl bg-primary/10 p-3 text-primary">
              <UIcon name="i-lucide-file-check-2" class="size-6" />
            </div>
            <div class="space-y-2">
              <h3 class="text-lg font-semibold text-[color:var(--app-text)]">
                简历分析已完成
              </h3>
              <p class="text-sm leading-7 text-[color:var(--app-muted)]">
                现在可以先查看结构化分析与继续追问，再决定是否马上发起押题。
              </p>
            </div>
          </div>
        </template>

        <div class="grid gap-4">
          <div class="rounded-2xl border border-[color:var(--app-border)] bg-white/80 p-4 text-sm leading-7 text-[color:var(--app-text)]">
            分析面板已经自动展开，结构化摘要和原始 JSON 都已准备好。
          </div>
          <div class="flex flex-wrap justify-end gap-3">
            <UButton
              color="neutral"
              variant="soft"
              @click="closeAnalysisDialog">
              稍后再看
            </UButton>
            <UButton
              icon="i-lucide-panel-top-open"
              @click="handleViewAnalysisResult">
              查看分析结果
            </UButton>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>

<style scoped>
.interview-start {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(320px, 400px);
  gap: 24px;
  align-items: start;
  margin-bottom: 24px;
}

.interview-start__sidebar {
  position: sticky;
  top: 88px;
  align-self: start;
}

@media (max-width: 1100px) {
  .interview-start {
    grid-template-columns: 1fr;
  }

  .interview-start__sidebar {
    position: static;
  }
}

.interview-result-panel {
  display: grid;
  gap: 24px;
}

.interview-result-panel__hero {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  padding: 24px;
}

.interview-result-panel__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.interview-analysis-cta {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  padding: 24px;
}

.interview-analysis-cta__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.interview-start-dialog {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: grid;
  place-items: center;
  padding: 24px;
}

.interview-start-dialog__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(6px);
}

.interview-start-dialog__panel {
  position: relative;
  z-index: 1;
  width: min(100%, 560px);
}
</style>
