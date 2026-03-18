import { defineStore } from 'pinia'
import type { ResumeQuizProgressEvent } from '~/types/api'
import type {
  InterviewMessage,
  InterviewReport,
  InterviewServiceType,
  PositionSelection
} from '~/types/domain'

interface ResumeQuizDraft {
  company: string
  positionName: string
  minSalary: number | null
  maxSalary: number | null
  jd: string
  resumeContent: string
  resumeURL: string
}

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
        resumeURL: ''
      }
    }),
    getters: {
      resumeType: (state) => {
        if (state.resumeId) return 'resume'
        if (state.resumeText.trim()) return 'text'
        return ''
      },
      isInterviewing: (state) =>
        state.interviewStatus === 'starting' ||
        state.interviewStatus === 'in_progress'
    },
    actions: {
      setSelectedService(service: InterviewServiceType) {
        this.selectedService = service
      },
      setSelectedPosition(position: PositionSelection | null) {
        this.selectedPosition = position
      },
      setResumeSelection(payload: { resumeId?: string | null; resumeText?: string }) {
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
      setQuizDraft(payload: Partial<ResumeQuizDraft>) {
        this.quizDraft = {
          ...this.quizDraft,
          ...payload
        }
        this.resumeText = this.quizDraft.resumeContent
      },
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
      resetInterview() {
        this.interviewStatus = 'idle'
        this.messages = []
        this.resultId = null
        this.sessionId = null
        this.report = null
        this.analysis = null
        this.resetProgress()
      },
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
          resumeURL: ''
        }
        this.resetInterview()
      }
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
        'quizDraft'
      ]
    }
  }
)
