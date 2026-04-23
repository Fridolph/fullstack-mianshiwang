<script setup lang="ts">
import {
  createFinalEvaluationJobAPI,
  createStageTwoQuestionsJobAPI,
  getConsumptionRecordDetailAPI,
  getFinalEvaluationJobAPI,
  getStageTwoQuestionsJobAPI,
} from '~/api/interview'
import ResumeQuizAnswerResultCard from '~/components/interview/ResumeQuizAnswerResultCard.vue'
import ResumeQuizAnswerWorkspace from '~/components/interview/ResumeQuizAnswerWorkspace.vue'
import type {
  ConsumptionRecordDetail,
  InterviewReport,
  ResumeQuizAnswerAnalysisPayload,
  ResumeQuizFinalEvaluationPayload,
  ResumeQuizJobStatus,
  ResumeQuizQuestion,
  ResumeQuizStageTwoJobPayload,
} from '~/types/domain'

definePageMeta({
  layout: 'default',
  middleware: 'auth',
  requiresAuth: true,
})

const route = useRoute()
const toast = useToast()
const $api = useApiClient()
const interviewStore = useInterviewStore()

const loading = ref(true)
const stageTwoSubmitting = ref(false)
const finalSubmitting = ref(false)
const stageTwoPolling = ref(false)
const finalPolling = ref(false)
const detail = ref<ConsumptionRecordDetail | null>(null)
const stageTwoTimer = ref<ReturnType<typeof setTimeout> | null>(null)
const finalTimer = ref<ReturnType<typeof setTimeout> | null>(null)

const recordId = computed(() => String(route.params.recordId || ''))
const sessionCache = computed(() =>
  interviewStore.resumeQuizSessions[recordId.value] || null,
)
const report = computed<InterviewReport | null>(
  () => detail.value?.result || sessionCache.value?.report || null,
)
const stageOneQuestions = computed<ResumeQuizQuestion[]>(
  () => report.value?.stageOneQuestions || report.value?.questions?.slice(0, 7) || [],
)
const stageTwoQuestions = computed<ResumeQuizQuestion[]>(
  () => report.value?.stageTwoQuestions || [],
)
const stageOneAnswers = computed(() =>
  sessionCache.value?.stageOneAnswerDrafts?.length
    ? sessionCache.value.stageOneAnswerDrafts
    : report.value?.userAnswersStageOne || [],
)
const stageTwoAnswers = computed(() =>
  sessionCache.value?.stageTwoAnswerDrafts?.length
    ? sessionCache.value.stageTwoAnswerDrafts
    : report.value?.userAnswersStageTwo || [],
)
const supplementaryContext = computed({
  get: () => sessionCache.value?.stageTwoSupplementaryContext || '',
  set: value => interviewStore.setStageTwoSupplementaryContext(recordId.value, value),
})
const stageTwoStatus = computed<ResumeQuizJobStatus>(
  () =>
    sessionCache.value?.stageTwoStatus
    || report.value?.stageTwoQuestionStatus
    || 'idle',
)
const finalAnalysisStatus = computed<ResumeQuizJobStatus>(
  () =>
    sessionCache.value?.finalAnalysisStatus
    || report.value?.finalEvaluationStatus
    || 'idle',
)
const stageTwoErrorMessage = computed(
  () => report.value?.stageTwoQuestionErrorMessage || '',
)
const finalErrorMessage = computed(
  () => report.value?.finalEvaluationErrorMessage || '',
)
const isFinalEvaluationLocked = computed(
  () => finalAnalysisStatus.value === 'queued'
    || finalAnalysisStatus.value === 'running'
    || finalAnalysisStatus.value === 'completed',
)
const isStageOneLocked = computed(
  () => stageTwoStatus.value === 'queued'
    || stageTwoStatus.value === 'running'
    || stageTwoStatus.value === 'completed',
)
const stageTwoGenerating = computed(
  () => stageTwoStatus.value === 'queued' || stageTwoStatus.value === 'running',
)
const stageTwoButtonLabel = computed(() => {
  if (stageTwoGenerating.value) {
    return '正在异步生成第 2 阶段 3 道定制题'
  }

  return stageTwoQuestions.value.length ? '重新生成第 2 阶段题目' : '生成第 2 阶段 3 道定制题'
})
const stageOneAnsweredCount = computed(
  () => stageOneAnswers.value.filter(answer => answer?.trim()).length,
)
const stageTwoAnsweredCount = computed(
  () => stageTwoAnswers.value.filter(answer => answer?.trim()).length,
)
const allStageOneAnswered = computed(
  () => stageOneQuestions.value.length === 7 && stageOneAnsweredCount.value === 7,
)
const allStageTwoAnswered = computed(
  () => stageTwoQuestions.value.length === 3 && stageTwoAnsweredCount.value === 3,
)
const allAnswers = computed(() => [
  ...stageOneAnswers.value.slice(0, 7),
  ...stageTwoAnswers.value.slice(0, 3),
])

function getInlineAnalysisFromReport(reportValue: InterviewReport | null) {
  if (
    !reportValue?.recordId
    || !reportValue.questionAnalyses?.length
    || !reportValue.overallEvaluation
    || !reportValue.userAnswers?.length
  ) {
    return null
  }

  return {
    recordId: reportValue.recordId,
    resultId: reportValue.resultId,
    userAnswers: reportValue.userAnswers,
    questionAnalyses: reportValue.questionAnalyses,
    overallEvaluation: reportValue.overallEvaluation,
    radarData: reportValue.radarData || [],
    answerAnalysisCachedAt: reportValue.answerAnalysisCachedAt,
  } satisfies ResumeQuizAnswerAnalysisPayload
}

const analysisResult = computed<ResumeQuizAnswerAnalysisPayload | null>(() => {
  return sessionCache.value?.analysisResult || getInlineAnalysisFromReport(report.value)
})

function clearStageTwoTimer() {
  if (stageTwoTimer.value) {
    clearTimeout(stageTwoTimer.value)
    stageTwoTimer.value = null
  }
}

function clearFinalTimer() {
  if (finalTimer.value) {
    clearTimeout(finalTimer.value)
    finalTimer.value = null
  }
}

function patchReport(patch: Partial<InterviewReport>) {
  const current = report.value
  if (!current || !recordId.value) return

  const nextReport = {
    ...current,
    ...patch,
  } satisfies InterviewReport

  if (detail.value?.result) {
    detail.value = {
      ...detail.value,
      result: nextReport,
    }
  }

  interviewStore.upsertResumeQuizSession(recordId.value, {
    report: nextReport,
    resultId: nextReport.resultId ?? null,
    stageTwoStatus: nextReport.stageTwoQuestionStatus || 'idle',
    finalAnalysisStatus: nextReport.finalEvaluationStatus || 'idle',
  })
}

function applyFinalEvaluationPayload(payload: ResumeQuizFinalEvaluationPayload) {
  if (!recordId.value) return

  const nextAnalysis
    = payload.status === 'completed'
      && payload.questionAnalyses?.length
      && payload.overallEvaluation
      ? {
          recordId: payload.recordId,
          resultId: payload.resultId,
          userAnswers: payload.userAnswers || [],
          questionAnalyses: payload.questionAnalyses,
          overallEvaluation: payload.overallEvaluation,
          radarData: payload.radarData || [],
          answerAnalysisCachedAt: payload.cachedAt,
        }
      : null

  if (nextAnalysis) {
    interviewStore.setResumeQuizAnalysisResult(recordId.value, nextAnalysis)
  }

  patchReport({
    userAnswers: payload.userAnswers || report.value?.userAnswers || [],
    questionAnalyses: payload.questionAnalyses || [],
    overallEvaluation: payload.overallEvaluation,
    radarData: payload.radarData || report.value?.radarData || [],
    finalEvaluationStatus: payload.status,
    finalEvaluationJobId: payload.jobId,
    finalEvaluationErrorMessage: payload.errorMessage,
    answerAnalysisCachedAt: payload.cachedAt,
  })
  interviewStore.setFinalAnalysisStatus(recordId.value, payload.status)
}

function applyStageTwoPayload(payload: ResumeQuizStageTwoJobPayload) {
  if (!recordId.value) return

  const nextStageTwoQuestions = payload.questions || stageTwoQuestions.value
  patchReport({
    stageTwoQuestions: nextStageTwoQuestions,
    questions: [...stageOneQuestions.value, ...nextStageTwoQuestions],
    totalQuestions: stageOneQuestions.value.length + nextStageTwoQuestions.length,
    totalPlannedQuestions: report.value?.totalPlannedQuestions || 10,
    questionStage: payload.status === 'completed' ? 2 : report.value?.questionStage || 1,
    stageTwoQuestionStatus: payload.status,
    stageTwoQuestionJobId: payload.jobId,
    stageTwoQuestionCachedAt: payload.cachedAt,
    stageTwoQuestionErrorMessage: payload.errorMessage,
  })
  interviewStore.setStageTwoStatus(recordId.value, payload.status)
}

async function pollStageTwoJob() {
  if (!recordId.value || stageTwoPolling.value) return

  stageTwoPolling.value = true
  clearStageTwoTimer()

  try {
    const payload = await getStageTwoQuestionsJobAPI($api, recordId.value)
    applyStageTwoPayload(payload)

    if (payload.status === 'queued' || payload.status === 'running') {
      stageTwoTimer.value = setTimeout(() => {
        void pollStageTwoJob()
      }, 5000)
      return
    }

    if (payload.status === 'completed') {
      await nextTick()
      document.getElementById('stage-two-section')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    }
  } catch (error) {
    toast.add({
      title: '查询第 2 阶段状态失败',
      description: error instanceof Error ? error.message : '请稍后重试',
      color: 'error',
    })
  } finally {
    stageTwoPolling.value = false
  }
}

async function pollFinalEvaluationJob() {
  if (!recordId.value || finalPolling.value) return

  finalPolling.value = true
  clearFinalTimer()

  try {
    const payload = await getFinalEvaluationJobAPI($api, recordId.value)
    applyFinalEvaluationPayload(payload)

    if (payload.status === 'queued' || payload.status === 'running') {
      finalTimer.value = setTimeout(() => {
        void pollFinalEvaluationJob()
      }, 5000)
      return
    }

    if (payload.status === 'completed') {
      await nextTick()
      document.getElementById('final-result-section')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    }
  } catch (error) {
    toast.add({
      title: '查询最终评价状态失败',
      description: error instanceof Error ? error.message : '请稍后重试',
      color: 'error',
    })
  } finally {
    finalPolling.value = false
  }
}

async function startStageTwoGeneration() {
  if (!recordId.value || !allStageOneAnswered.value || stageTwoSubmitting.value) return

  stageTwoSubmitting.value = true

  try {
    const payload = await createStageTwoQuestionsJobAPI($api, recordId.value, {
      answers: stageOneAnswers.value.slice(0, 7),
      supplementaryContext: supplementaryContext.value.trim() || undefined,
    })

    applyStageTwoPayload(payload)

    if (payload.status === 'queued' || payload.status === 'running') {
      toast.add({
        title: '第 2 阶段定制题生成中',
        description: '页面会自动轮询状态，你可以先查看前 7 题和自己的回答。',
        color: 'success',
      })
    } else if (payload.status === 'completed') {
      await nextTick()
      document.getElementById('stage-two-section')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    }
  } catch (error) {
    toast.add({
      title: '提交第 2 阶段任务失败',
      description: error instanceof Error ? error.message : '请稍后重试',
      color: 'error',
    })
  } finally {
    stageTwoSubmitting.value = false
  }
}

async function startFinalEvaluation() {
  if (!recordId.value || !allStageTwoAnswered.value || finalSubmitting.value) return

  finalSubmitting.value = true

  try {
    const payload = await createFinalEvaluationJobAPI(
      $api,
      recordId.value,
      allAnswers.value,
    )

    applyFinalEvaluationPayload(payload)

    if (payload.status === 'queued' || payload.status === 'running') {
      toast.add({
        title: '最终综合评价生成中',
        description: '你可以先继续查看前面 10 道题和自己的回答，结果生成后页面会自动刷新展示。',
        color: 'success',
      })
    } else if (payload.status === 'completed') {
      await nextTick()
      document.getElementById('final-result-section')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    }
  } catch (error) {
    toast.add({
      title: '提交最终评价任务失败',
      description: error instanceof Error ? error.message : '请稍后重试',
      color: 'error',
    })
  } finally {
    finalSubmitting.value = false
  }
}

function handleStageOneAnswerUpdate(payload: { index: number, value: string }) {
  if (!recordId.value) return
  interviewStore.setResumeQuizAnswer(recordId.value, 'stageOne', payload.index, payload.value)
}

function handleStageTwoAnswerUpdate(payload: { index: number, value: string }) {
  if (!recordId.value) return
  interviewStore.setResumeQuizAnswer(recordId.value, 'stageTwo', payload.index, payload.value)
}

async function loadDetail() {
  loading.value = true

  try {
    detail.value = await getConsumptionRecordDetailAPI($api, recordId.value)

    if (detail.value?.result) {
      interviewStore.setReport(detail.value.result)

      const inlineAnalysis = getInlineAnalysisFromReport(detail.value.result)
      if (inlineAnalysis) {
        interviewStore.setResumeQuizAnalysisResult(recordId.value, inlineAnalysis)
      }
    }
  } catch (error) {
    toast.add({
      title: '加载结果页失败',
      description: error instanceof Error ? error.message : '请稍后重试',
      color: 'error',
    })
  } finally {
    loading.value = false
  }
}

watch(
  stageTwoStatus,
  (status) => {
    if (status === 'queued' || status === 'running') {
      void pollStageTwoJob()
    }
  },
  { immediate: true },
)

watch(
  finalAnalysisStatus,
  (status) => {
    if (status === 'queued' || status === 'running') {
      void pollFinalEvaluationJob()
    }
  },
  { immediate: true },
)

watch(
  recordId,
  async () => {
    clearStageTwoTimer()
    clearFinalTimer()
    detail.value = null
    await loadDetail()
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  clearStageTwoTimer()
  clearFinalTimer()
})
</script>

<template>
  <section class="grid gap-6">
    <div class="surface-card flex flex-wrap items-end justify-between gap-4 p-6">
      <div class="space-y-3">
        <span class="pill">独立结果页</span>
        <div class="space-y-2">
          <h1 class="section-title">
            两阶段问答与综合评价
          </h1>
          <p class="section-description max-w-3xl">
            这里会先展示第 1 阶段 7 道题和你的原始回答；随后异步生成第 2 阶段 3 道定制题，并在全部完成后生成逐题点评、综合评价与雷达图。
          </p>
        </div>
      </div>

      <div class="flex flex-wrap gap-3">
        <UButton
          color="neutral"
          variant="soft"
          icon="i-lucide-arrow-left"
          :to="`/history/${recordId}`">
          返回历史详情
        </UButton>
        <UButton
          icon="i-lucide-refresh-cw"
          :loading="loading"
          @click="loadDetail">
          重新加载
        </UButton>
      </div>
    </div>

    <div v-if="loading" class="surface-card flex items-center gap-3 p-6 text-[color:var(--app-muted)]">
      <UIcon name="i-lucide-loader-circle" class="size-5 animate-spin" />
      <span>正在加载结果页基础内容...</span>
    </div>

    <template v-else-if="report">
      <div class="surface-card grid gap-4 p-6">
        <div class="grid gap-4 lg:grid-cols-4">
          <div class="rounded-2xl border border-[color:var(--app-border)] bg-white/70 p-4">
            <p class="text-sm text-[color:var(--app-muted)]">
              岗位
            </p>
            <p class="mt-2 text-lg font-semibold text-[color:var(--app-text)]">
              {{ report.position || detail?.record?.inputData?.positionName || '未提供' }}
            </p>
          </div>
          <div class="rounded-2xl border border-[color:var(--app-border)] bg-white/70 p-4">
            <p class="text-sm text-[color:var(--app-muted)]">
              公司
            </p>
            <p class="mt-2 text-lg font-semibold text-[color:var(--app-text)]">
              {{ report.company || detail?.record?.inputData?.company || '未提供' }}
            </p>
          </div>
          <div class="rounded-2xl border border-[color:var(--app-border)] bg-white/70 p-4">
            <p class="text-sm text-[color:var(--app-muted)]">
              第 1 阶段
            </p>
            <p class="mt-2 text-lg font-semibold text-[color:var(--app-text)]">
              {{ stageOneAnsweredCount }}/{{ stageOneQuestions.length }}
            </p>
          </div>
          <div class="rounded-2xl border border-[color:var(--app-border)] bg-white/70 p-4">
            <p class="text-sm text-[color:var(--app-muted)]">
              第 2 阶段
            </p>
            <p class="mt-2 text-lg font-semibold text-[color:var(--app-text)]">
              {{ stageTwoAnsweredCount }}/{{ stageTwoQuestions.length || 3 }}
            </p>
          </div>
        </div>

        <div class="grid gap-3 lg:grid-cols-2">
          <div class="rounded-2xl border border-primary/15 bg-primary/5 p-4 text-sm leading-7 text-[color:var(--app-text)]">
            第 2 阶段状态：{{ stageTwoStatus }}
            <span v-if="stageTwoErrorMessage">，{{ stageTwoErrorMessage }}</span>
          </div>
          <div class="rounded-2xl border border-emerald-500/15 bg-emerald-500/5 p-4 text-sm leading-7 text-[color:var(--app-text)]">
            最终评价状态：{{ finalAnalysisStatus }}
            <span v-if="finalErrorMessage">，{{ finalErrorMessage }}</span>
          </div>
        </div>
      </div>

      <section
        v-if="analysisResult"
        id="final-result-section"
        class="grid gap-6">
        <ResumeQuizAnswerResultCard
          :analysis-result="analysisResult"
          mode="overall"
        />
      </section>

      <section class="surface-card grid gap-5 p-6">
        <div class="space-y-2">
          <span class="pill">第 1 阶段</span>
          <h2 class="section-title">
            首屏先展示 7 道原题与当前回答
          </h2>
          <p class="section-description">
            即使后续异步任务还没完成，这里也会优先展示你已经写下的内容，避免整页都在等待。
          </p>
        </div>

        <div class="grid gap-4">
          <article
            v-for="(question, index) in stageOneQuestions"
            :key="`${recordId}-stage-one-${index}`"
            class="rounded-3xl border border-[color:var(--app-border)] bg-white/70 p-5">
            <div class="flex flex-wrap items-center gap-3">
              <UBadge color="primary" variant="soft">
                Q{{ index + 1 }}
              </UBadge>
              <UBadge v-if="question.category" color="neutral" variant="subtle">
                {{ question.category }}
              </UBadge>
              <UBadge v-if="question.difficulty" color="neutral" variant="subtle">
                {{ question.difficulty }}
              </UBadge>
            </div>

            <h3 class="mt-4 text-lg font-semibold leading-8 text-[color:var(--app-text)]">
              {{ question.question }}
            </h3>

            <label class="mt-4 grid gap-2">
              <span class="text-sm font-semibold text-[color:var(--app-text)]">你的回答</span>
              <UTextarea
                :model-value="stageOneAnswers[index] || ''"
                :rows="5"
                autoresize
                :disabled="isStageOneLocked"
                placeholder="你的第 1 阶段回答会保存在本地，刷新页面也不会丢。"
                @update:model-value="handleStageOneAnswerUpdate({ index, value: String($event || '') })"
              />
            </label>
          </article>
        </div>

        <div
          v-if="isStageOneLocked"
          class="rounded-2xl border border-warning/20 bg-warning/5 px-4 py-3 text-sm leading-7 text-[color:var(--app-text)]">
          第 2 阶段已经开始生成或已生成完成，前 7 道回答已锁定，避免后续题目与前置答案上下文不一致。
        </div>
      </section>

      <section class="surface-card grid gap-4 p-6">
        <div class="space-y-2">
          <span class="pill">补充说明</span>
          <h2 class="section-title">
            生成第 2 阶段前，可额外补充你希望重点追问的方向
          </h2>
          <p class="section-description">
            这段补充说明会作为异步任务的额外上下文，一起参与第 2 阶段 3 道定制题生成。
          </p>
        </div>

        <UTextarea
          v-model="supplementaryContext"
          :rows="4"
          autoresize
          :disabled="isStageOneLocked"
          placeholder="例如：我希望重点追问性能优化、项目难点拆解，或者我上一轮回答里说得不够清楚的点。"
        />

        <div class="flex flex-wrap gap-3">
          <UButton
            icon="i-lucide-wand-sparkles"
            :loading="stageTwoSubmitting || stageTwoGenerating"
            :disabled="!allStageOneAnswered || stageTwoGenerating"
            @click="startStageTwoGeneration">
            {{ stageTwoButtonLabel }}
          </UButton>
          <UButton
            v-if="stageTwoStatus === 'failed'"
            color="neutral"
            variant="soft"
            icon="i-lucide-rotate-cw"
            :loading="stageTwoSubmitting"
            @click="startStageTwoGeneration">
            重试第 2 阶段任务
          </UButton>
        </div>
      </section>

      <div
        v-if="stageTwoGenerating"
        class="surface-card flex items-start gap-3 rounded-3xl border border-primary/15 bg-primary/5 p-6 text-sm leading-7 text-[color:var(--app-text)]">
        <UIcon name="i-lucide-loader-circle" class="mt-1 size-5 shrink-0 animate-spin text-primary" />
        <div>
          <p class="font-semibold text-[color:var(--app-text)]">
            正在异步生成第 2 阶段 3 道定制题
          </p>
          <p class="mt-1 text-[color:var(--app-text)]">
            当前会根据你前 7 道题的真实回答生成更有针对性的追问。题目准备好后，这里会自动刷新。
          </p>
        </div>
      </div>

      <div
        v-if="stageTwoStatus === 'failed'"
        class="surface-card rounded-3xl border border-error/20 bg-error/5 p-6 text-sm leading-7 text-error">
        第 2 阶段题目生成失败：{{ stageTwoErrorMessage || '请点击上方按钮重试。' }}
      </div>

      <section v-if="stageTwoQuestions.length" id="stage-two-section" class="grid gap-6">
        <ResumeQuizAnswerWorkspace
          :record-id="recordId"
          :questions="stageTwoQuestions"
          :answers="stageTwoAnswers"
          phase-label="第 2 阶段"
          title="继续完成 3 道定制追问题"
          description="这 3 道题会根据你前 7 题的真实回答动态生成，目标是更贴近你的经历和短板。"
          footer-title="全部 10 题完成后，可手动生成最终综合评价"
          footer-description="这里不会在 blur 后自动提交。请确认 3 道定制题回答无误后，再点击按钮生成最终结果。"
          action-label="立即生成最终综合评价"
          :action-disabled="!allStageTwoAnswered || isFinalEvaluationLocked"
          :inputs-disabled="isFinalEvaluationLocked"
          :opening-result="finalSubmitting"
          @update-answer="handleStageTwoAnswerUpdate"
          @open-result="startFinalEvaluation"
        />
      </section>

      <div
        v-if="finalAnalysisStatus === 'queued' || finalAnalysisStatus === 'running'"
        class="surface-card flex items-start gap-3 rounded-3xl border border-emerald-500/15 bg-emerald-500/5 p-6 text-sm leading-7 text-[color:var(--app-text)]">
        <UIcon name="i-lucide-loader-circle" class="mt-1 size-5 shrink-0 animate-spin text-emerald-600" />
        <div>
          <p class="font-semibold text-[color:var(--app-text)]">
            正在生成逐题点评、综合评价与雷达图
          </p>
          <p class="mt-1 text-[color:var(--app-text)]">
            当前按 5 秒一次轮询状态。等待过程中，页面会一直保留你已经完成的 10 道题和回答，不会整页空白。
          </p>
        </div>
      </div>

      <div
        v-if="finalAnalysisStatus === 'failed'"
        class="surface-card rounded-3xl border border-error/20 bg-error/5 p-6 text-sm leading-7 text-error">
        最终综合评价生成失败：{{ finalErrorMessage || '请点击下方按钮重试。' }}
      </div>

      <div
        v-if="stageTwoQuestions.length && finalAnalysisStatus === 'failed'"
        class="flex justify-end">
        <UButton
          icon="i-lucide-rotate-cw"
          :loading="finalSubmitting"
          @click="startFinalEvaluation">
          重试最终综合评价
        </UButton>
      </div>

      <section
        v-if="analysisResult"
        id="question-analyses-section"
        class="grid gap-6">
        <ResumeQuizAnswerResultCard
          :analysis-result="analysisResult"
          mode="questions"
        />
      </section>
    </template>
  </section>
</template>
