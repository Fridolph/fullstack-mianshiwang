import { defineStore } from 'pinia'
import type { ResumeQuizProgressEvent } from '~/types/api'
import type {
  InterviewMessage,
  InterviewReport,
  InterviewServiceType,
  PositionSelection,
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
  report: InterviewReport | null
  analysis: Record<string, unknown> | null
  progressLogs: ResumeQuizProgressEvent[]
  currentProgress: ResumeQuizProgressEvent | null
  lastError: string
  quizDraft: ResumeQuizDraft
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
        this.currentProgress = event
        this.progressLogs.push(event)
      },
      setLastError(message: string) {
        this.lastError = message
      },
      resetProgress() {
        this.progressLogs = []
        this.currentProgress = null
        this.lastError = ''
      },
      // 只重置“本次面试运行态”，不清理用户之前在表单里输入的内容。
      resetInterview() {
        this.interviewStatus = 'idle'
        this.messages = []
        this.resultId = null
        this.sessionId = null
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
        'report',
        'analysis',
        'quizDraft',
      ],
    },
  },
)
