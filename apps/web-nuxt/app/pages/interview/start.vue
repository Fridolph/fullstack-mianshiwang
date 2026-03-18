<script setup lang="ts">
import {
  analyzeResumeAPI,
  continueConversationAPI,
  generateResumeQuizSSE
} from '~/api/interview'
import ResumeAnalysisCard from '~/components/interview/ResumeAnalysisCard.vue'
import ResumeQuizFormCard from '~/components/interview/ResumeQuizFormCard.vue'
import ResumeQuizProgressCard from '~/components/interview/ResumeQuizProgressCard.vue'
import type { ResumeQuizProgressEvent, SseConnection } from '~/types/api'

definePageMeta({
  layout: 'default',
  middleware: 'auth',
  requiresAuth: true
})

const router = useRouter()
const toast = useToast()
const runtimeConfig = useRuntimeConfig()
const $api = useApiClient()
const userStore = useUserStore()
const interviewStore = useInterviewStore()

const loading = ref(false)
const questionLoading = ref(false)
const activeConnection = ref<SseConnection | null>(null)

const formState = computed({
  get: () => interviewStore.quizDraft,
  set: (value) => interviewStore.setQuizDraft(value)
})

const messages = computed(() => interviewStore.messages)
const analysis = computed(() => interviewStore.analysis)
const currentProgress = computed(() => interviewStore.currentProgress)
const progressLogs = computed(() => interviewStore.progressLogs)
const errorMessage = computed(() => interviewStore.lastError)

function validateForm() {
  if (!formState.value.positionName.trim()) return '请先填写目标岗位'
  if (formState.value.jd.trim().length < 50) return '岗位 JD 至少需要 50 个字符'
  if (!formState.value.resumeContent.trim() && !formState.value.resumeURL.trim()) {
    return '请提供简历文本，或填写可访问的简历 URL'
  }
  return ''
}

async function handleAnalyzeResume() {
  const validationMessage = validateForm()
  if (validationMessage) {
    toast.add({
      title: '信息还不完整',
      description: validationMessage,
      color: 'warning'
    })
    return
  }

  loading.value = true

  try {
    const payload = await analyzeResumeAPI($api, {
      position: formState.value.positionName.trim(),
      resume: formState.value.resumeContent.trim(),
      jobDescription: formState.value.jd.trim()
    })

    interviewStore.setAnalysis(payload.analysis as Record<string, unknown>, payload.sessionId)
    toast.add({
      title: '简历分析完成',
      color: 'success'
    })
  } catch (error) {
    toast.add({
      title: '简历分析失败',
      description: error instanceof Error ? error.message : '请稍后重试',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

async function handleAskFollowUp(question: string) {
  if (!interviewStore.sessionId) return

  questionLoading.value = true
  interviewStore.addMessage({
    role: 'user',
    content: question,
    timestamp: new Date().toISOString()
  })

  try {
    const payload = await continueConversationAPI($api, {
      sessionId: interviewStore.sessionId,
      question
    })

    interviewStore.addMessage({
      role: 'assistant',
      content: String(payload.response || ''),
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    toast.add({
      title: '继续追问失败',
      description: error instanceof Error ? error.message : '请稍后重试',
      color: 'error'
    })
  } finally {
    questionLoading.value = false
  }
}

function resetStreamState() {
  activeConnection.value?.close()
  interviewStore.resetProgress()
  interviewStore.setLastError('')
}

function normalizeCompletePayload(event: ResumeQuizProgressEvent) {
  return {
    ...event.data,
    questions: event.data?.questions || [],
    analysis: event.data?.analysis || [],
    company: formState.value.company,
    position: formState.value.positionName,
    jobDescription: formState.value.jd
  }
}

async function handleGenerateQuiz() {
  const validationMessage = validateForm()
  if (validationMessage) {
    toast.add({
      title: '信息还不完整',
      description: validationMessage,
      color: 'warning'
    })
    return
  }

  resetStreamState()
  interviewStore.setInterviewStatus('starting')
  loading.value = true

  const requestId = globalThis.crypto?.randomUUID?.()
  if (!requestId) {
    toast.add({
      title: '当前浏览器不支持 randomUUID',
      description: '请升级浏览器后再试。',
      color: 'error'
    })
    loading.value = false
    interviewStore.setInterviewStatus('idle')
    return
  }

  activeConnection.value = generateResumeQuizSSE(
    {
      company: formState.value.company.trim() || undefined,
      positionName: formState.value.positionName.trim(),
      minSalary: formState.value.minSalary || undefined,
      maxSalary: formState.value.maxSalary || undefined,
      jd: formState.value.jd.trim(),
      resumeContent: formState.value.resumeContent.trim() || undefined,
      resumeURL: formState.value.resumeURL.trim() || undefined,
      requestId,
      promptVersion: 'web-nuxt-v1'
    },
    {
      token: userStore.token,
      baseURL: runtimeConfig.public.apiBase,
      callbacks: {
        onMessage(event) {
          interviewStore.pushProgressLog(event)
          if (event.type === 'complete') {
            interviewStore.setInterviewStatus('ended')
            interviewStore.setReport(normalizeCompletePayload(event))
            loading.value = false
            void router.push('/interview/report')
          }
          if (event.type === 'error') {
            interviewStore.setInterviewStatus('idle')
            interviewStore.setLastError(event.error || '生成失败')
            loading.value = false
          }
        },
        onError(error) {
          interviewStore.setInterviewStatus('idle')
          interviewStore.setLastError(error.message)
          loading.value = false
          toast.add({
            title: '流式押题失败',
            description: error.message,
            color: 'error'
          })
        },
        onComplete() {
          loading.value = false
        }
      }
    }
  )
}

onBeforeUnmount(() => {
  activeConnection.value?.close()
})
</script>

<template>
  <section class="interview-start">
    <ResumeQuizFormCard
      v-model="formState"
      :loading="loading"
      @analyze="handleAnalyzeResume"
      @generate="handleGenerateQuiz"
    />

    <ResumeQuizProgressCard
      :current-progress="currentProgress"
      :progress-logs="progressLogs"
      :error-message="errorMessage"
    />
  </section>

  <ResumeAnalysisCard
    :analysis="analysis"
    :session-id="interviewStore.sessionId"
    :messages="messages"
    :loading="questionLoading"
    @ask="handleAskFollowUp"
  />
</template>

<style scoped>
.interview-start {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(320px, 400px);
  gap: 24px;
  align-items: start;
  margin-bottom: 24px;
}

@media (max-width: 1100px) {
  .interview-start {
    grid-template-columns: 1fr;
  }
}
</style>
