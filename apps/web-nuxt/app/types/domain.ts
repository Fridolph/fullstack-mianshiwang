export interface ResumeSummary {
  resumeId: string
  resumeName: string
  url?: string
  uploadTime?: string
}

export interface UserInfo {
  _id?: string
  username?: string
  nickname?: string
  phone?: string
  email?: string
  avatar?: string
  roles?: string[]
  isActive?: boolean
  isVerified?: boolean
  isVip?: boolean
  wwCoinBalance?: number
  resumeRemainingCount?: number
  specialRemainingCount?: number
  behaviorRemainingCount?: number
  [key: string]: unknown
}

export interface AuthPayload {
  token: string
  user: UserInfo
}

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload extends LoginPayload {
  username: string
}

export type ConsumptionStatus = 'pending' | 'success' | 'failed'

export interface ConsumptionRecord {
  _id?: string
  recordId?: string
  resultId?: string
  type?: string
  status?: ConsumptionStatus
  description?: string
  errorMessage?: string
  createdAt?: string
  updatedAt?: string
  completedAt?: string
  inputData?: {
    company?: string
    positionName?: string
    minSalary?: number
    maxSalary?: number
    jd?: string
    resumeId?: string
  }
  outputData?: {
    resultId?: string
    questionCount?: number
  }
  [key: string]: unknown
}

export interface ConsumptionStats {
  _id: string
  count: number
  successCount: number
  failedCount: number
  totalCost: number
}

export interface ConsumptionRecordsResponse {
  records: ConsumptionRecord[]
  stats: ConsumptionStats[]
}

export type InterviewServiceType = 'resume' | 'special' | 'behavior' | null

export interface PositionSelection {
  category?: string
  company?: string
  description?: string
  jd?: string
  level?: string
  maxSalary?: number
  minSalary?: number
  positionId?: string
  positionName?: string
}

export interface InterviewMessage {
  role: string
  content: string
  timestamp: string
  [key: string]: unknown
}

export interface ResumeQuizQuestion {
  question: string
  answer: string
  category?: string
  difficulty?: string
  tips?: string
  keywords?: string[]
  reasoning?: string
}

export interface ResumeQuizResultPayload {
  resultId?: string
  questions: ResumeQuizQuestion[]
  analysis?: string[]
  summary?: string
  matchScore?: number
  matchLevel?: string
  matchedSkills?: Array<{
    skill: string
    matched: boolean
    proficiency?: string
  }>
  missingSkills?: string[]
  knowledgeGaps?: string[]
  learningPriorities?: Array<{
    topic: string
    priority: string
    reason: string
  }>
  radarData?: Array<{
    dimension: string
    score: number
    description?: string
  }>
  strengths?: string[]
  weaknesses?: string[]
  interviewTips?: string[]
}

export interface InterviewReport extends ResumeQuizResultPayload {
  company?: string
  position?: string
  jobDescription?: string
}
