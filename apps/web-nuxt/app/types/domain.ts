export interface ResumeSummary {
  resumeId: string
  resumeName: string
  url?: string
  uploadTime?: string
}

export interface UserInfo {
  _id?: string
  username?: string
  phone?: string
  email?: string
  avatar?: string
  roles?: string[]
  isVip?: boolean
  wwCoinBalance?: number
  resumeRemainingCount?: number
  specialRemainingCount?: number
  behaviorRemainingCount?: number
  [key: string]: unknown
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

export interface InterviewReport {
  [key: string]: unknown
}
