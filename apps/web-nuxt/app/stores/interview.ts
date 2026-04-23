import { defineStore } from 'pinia'
import type { ResumeQuizProgressEvent } from '~/types/api'
import type {
  InterviewMessage,
  InterviewReport,
  InterviewServiceType,
  PositionSelection,
  ResumeQuizAnswerAnalysisPayload,
  ResumeQuizJobStatus,
  ResumeQuizSessionCache,
} from '~/types/domain'

/**
 * 开始页表单草稿。
 * 它既是页面表单状态，也是后续发起接口时的原始输入。
 */
interface ResumeQuizDraft {
  company: string
  positionName: string
  minSalary: number | null
  maxSalary: number | null
  jd: string
  resumeContent: string
  resumeURL: string
}

/**
 * 面试 store 是当前前端最复杂的业务状态之一。
 *
 * 它同时承接了 3 个阶段的数据：
 * 1. 输入阶段：quizDraft / selectedPosition
 * 2. 过程阶段：analysis / messages / progressLogs
 * 3. 结果阶段：report / resultId
 */
interface InterviewState {
  currentStep: number
  interviewStatus: 'idle' | 'starting' | 'in_progress' | 'suspend' | 'ended'
  selectedService: InterviewServiceType
  selectedPosition: PositionSelection | null
  resumeId: string | null
  resumeText: string
  messages: InterviewMessage[]
  resultId: string | null
  sessionId: string | null
  activeRecordId: string | null
  report: InterviewReport | null
  analysis: Record<string, unknown> | null
  progressLogs: ResumeQuizProgressEvent[]
  currentProgress: ResumeQuizProgressEvent | null
  lastError: string
  quizDraft: ResumeQuizDraft
  resumeQuizSessions: Record<string, ResumeQuizSessionCache>
}

export const useInterviewStore = defineStore(
  'interview',
  {
    state: (): InterviewState => ({
      currentStep: 1,
      interviewStatus: 'idle',
      selectedService: null,
      selectedPosition: null,
      resumeId: null,
      resumeText: '',
      messages: [],
      resultId: null,
      sessionId: null,
      activeRecordId: null,
      report: null,
      analysis: null,
      progressLogs: [],
      currentProgress: null,
      lastError: '',
      quizDraft: {
        company: '',
        positionName: '',
        minSalary: null,
        maxSalary: null,
        jd: '',
        resumeContent: '',
        resumeURL: '',
      },
      resumeQuizSessions: {},
    }),
    getters: {
      resumeType: (state) => {
        if (state.resumeId) return 'resume'
        if (state.resumeText.trim()) return 'text'
        return ''
      },
      isInterviewing: state =>
        state.interviewStatus === 'starting'
        || state.interviewStatus === 'in_progress',
      activeResumeQuizSession: (state) => {
        if (!state.activeRecordId) return null
        return state.resumeQuizSessions[state.activeRecordId] || null
      },
    },
    actions: {
      setSelectedService(service: InterviewServiceType) {
        this.selectedService = service
      },
      setSelectedPosition(position: PositionSelection | null) {
        this.selectedPosition = position
      },
      setResumeSelection(payload: { resumeId?: string | null, resumeText?: string }) {
        this.resumeId = payload.resumeId ?? null
        this.resumeText = payload.resumeText ?? ''
      },
      setInterviewStatus(status: InterviewState['interviewStatus']) {
        this.interviewStatus = status
      },
      setSession(sessionId: string | null, resultId?: string | null) {
        this.sessionId = sessionId
        this.resultId = resultId ?? this.resultId
      },
      setActiveResumeQuizRecord(recordId: string | null) {
        this.activeRecordId = recordId
      },
      // 简历分析接口返回后，把分析结果与会话 ID 一起存起来，方便继续追问。
      setAnalysis(analysis: Record<string, unknown> | null, sessionId?: string | null) {
        this.analysis = analysis
        if (sessionId !== undefined) {
          this.sessionId = sessionId
        }
      },
      addMessage(message: InterviewMessage) {
        this.messages.push(message)
      },
      setReport(report: InterviewReport | null) {
        this.report = report
        const recordId = report?.recordId

        if (!recordId) return

        const currentSession = this.resumeQuizSessions[recordId]
        this.upsertResumeQuizSession(recordId, {
          resultId: report.resultId ?? null,
          report,
          stageOneAnswerDrafts:
            currentSession?.stageOneAnswerDrafts?.length
              ? currentSession.stageOneAnswerDrafts
              : report.userAnswersStageOne || [],
          stageTwoAnswerDrafts:
            currentSession?.stageTwoAnswerDrafts?.length
              ? currentSession.stageTwoAnswerDrafts
              : report.userAnswersStageTwo || [],
          stageTwoStatus: report.stageTwoQuestionStatus || currentSession?.stageTwoStatus || 'idle',
          finalAnalysisStatus:
            report.finalEvaluationStatus || currentSession?.finalAnalysisStatus || 'idle',
          completedAt: new Date().toISOString(),
        })
        this.activeRecordId = recordId
      },
      // 表单草稿和 resumeText 保持联动，避免页面和 store 出现“双份状态”。
      setQuizDraft(payload: Partial<ResumeQuizDraft>) {
        this.quizDraft = {
          ...this.quizDraft,
          ...payload,
        }
        this.resumeText = this.quizDraft.resumeContent
      },
      // 每收到一个 SSE 事件，都顺序写入时间线，同时更新当前进度。
      pushProgressLog(event: ResumeQuizProgressEvent) {
        const current = this.currentProgress
        const isSameAsCurrent = Boolean(
          current
          && event.type === 'progress'
          && current.type === event.type
          && current.progress === event.progress
          && current.label === event.label
          && current.message === event.message
          && current.stage === event.stage,
        )

        if (isSameAsCurrent) {
          return
        }

        this.currentProgress = event
        this.progressLogs = [...this.progressLogs.slice(-11), event]
      },
      setLastError(message: string) {
        this.lastError = message
      },
      upsertResumeQuizSession(
        recordId: string,
        payload: Partial<Omit<ResumeQuizSessionCache, 'recordId'>>,
      ) {
        const currentSession = this.resumeQuizSessions[recordId]

        this.resumeQuizSessions = {
          ...this.resumeQuizSessions,
          [recordId]: {
            recordId,
            resultId: payload.resultId ?? currentSession?.resultId ?? null,
            report: payload.report ?? currentSession?.report ?? null,
            stageOneAnswerDrafts:
              payload.stageOneAnswerDrafts
              ?? currentSession?.stageOneAnswerDrafts
              ?? [],
            stageTwoAnswerDrafts:
              payload.stageTwoAnswerDrafts
              ?? currentSession?.stageTwoAnswerDrafts
              ?? [],
            stageTwoSupplementaryContext:
              payload.stageTwoSupplementaryContext
              ?? currentSession?.stageTwoSupplementaryContext
              ?? '',
            stageTwoStatus:
              payload.stageTwoStatus
              ?? currentSession?.stageTwoStatus
              ?? 'idle',
            finalAnalysisStatus:
              payload.finalAnalysisStatus
              ?? currentSession?.finalAnalysisStatus
              ?? 'idle',
            analysisResult:
              payload.analysisResult ?? currentSession?.analysisResult ?? null,
            completedAt: payload.completedAt ?? currentSession?.completedAt,
          },
        }
      },
      setResumeQuizAnswer(
        recordId: string,
        stage: 'stageOne' | 'stageTwo',
        index: number,
        value: string,
      ) {
        const currentSession = this.resumeQuizSessions[recordId]
        const key
          = stage === 'stageOne' ? 'stageOneAnswerDrafts' : 'stageTwoAnswerDrafts'
        const nextDrafts = [...(currentSession?.[key] ?? [])]

        nextDrafts[index] = value
        this.upsertResumeQuizSession(recordId, {
          [key]: nextDrafts,
        })
      },
      setStageTwoSupplementaryContext(recordId: string, value: string) {
        this.upsertResumeQuizSession(recordId, {
          stageTwoSupplementaryContext: value,
        })
      },
      setStageTwoStatus(recordId: string, status: ResumeQuizJobStatus) {
        this.upsertResumeQuizSession(recordId, {
          stageTwoStatus: status,
        })
      },
      setFinalAnalysisStatus(recordId: string, status: ResumeQuizJobStatus) {
        this.upsertResumeQuizSession(recordId, {
          finalAnalysisStatus: status,
        })
      },
      setResumeQuizAnalysisResult(
        recordId: string,
        analysisResult: ResumeQuizAnswerAnalysisPayload | null,
      ) {
        this.upsertResumeQuizSession(recordId, {
          analysisResult,
          finalAnalysisStatus: analysisResult ? 'completed' : 'idle',
        })
      },
      resetProgress() {
        this.progressLogs = []
        this.currentProgress = null
        this.lastError = ''
      },
      // 首页 fresh 进入开始页时，只清理当前工作态，不动历史缓存。
      resetStartPageState() {
        this.currentStep = 1
        this.interviewStatus = 'idle'
        this.selectedPosition = null
        this.resumeId = null
        this.resumeText = ''
        this.messages = []
        this.resultId = null
        this.sessionId = null
        this.activeRecordId = null
        this.report = null
        this.analysis = null
        this.quizDraft = {
          company: '',
          positionName: '',
          minSalary: null,
          maxSalary: null,
          jd: '',
          resumeContent: '',
          resumeURL: '',
        }
        this.resetProgress()
      },
      // 只重置“本次面试运行态”，不清理用户之前在表单里输入的内容。
      resetInterview() {
        this.interviewStatus = 'idle'
        this.messages = []
        this.resultId = null
        this.sessionId = null
        this.activeRecordId = null
        this.report = null
        this.analysis = null
        this.resetProgress()
      },
      // 回到初始状态时，连输入草稿一并清理。
      resetAll() {
        this.currentStep = 1
        this.selectedService = null
        this.selectedPosition = null
        this.resumeId = null
        this.resumeText = ''
        this.resumeQuizSessions = {}
        this.quizDraft = {
          company: '',
          positionName: '',
          minSalary: null,
          maxSalary: null,
          jd: '',
          resumeContent: '',
          resumeURL: '',
        }
        this.resetInterview()
      },
    },
    persist: {
      pick: [
        'selectedService',
        'selectedPosition',
        'resumeId',
        'resumeText',
        'resultId',
        'sessionId',
        'activeRecordId',
        'report',
        'analysis',
        'quizDraft',
        'resumeQuizSessions',
      ],
    },
  },
)
