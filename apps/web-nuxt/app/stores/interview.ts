import { defineStore } from 'pinia'
import type {
  InterviewMessage,
  InterviewReport,
  InterviewServiceType,
  PositionSelection
} from '~/types/domain'

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
      report: null
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
      addMessage(message: InterviewMessage) {
        this.messages.push(message)
      },
      setReport(report: InterviewReport | null) {
        this.report = report
      },
      resetInterview() {
        this.interviewStatus = 'idle'
        this.messages = []
        this.resultId = null
        this.sessionId = null
        this.report = null
      },
      resetAll() {
        this.currentStep = 1
        this.selectedService = null
        this.selectedPosition = null
        this.resumeId = null
        this.resumeText = ''
        this.resetInterview()
      }
    },
    persist: true
  }
)
