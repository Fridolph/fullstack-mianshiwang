/**
 * 用户在前端看到的简历摘要。
 * 后续通常用于“简历列表 / 简历选择器 / 简历管理页”。
 */
export interface ResumeSummary {
  resumeId: string
  resumeName: string
  url?: string
  uploadTime?: string
}

/**
 * 当前前端统一使用的用户信息结构。
 *
 * 它不是 Mongo 用户 Schema 的完整镜像，
 * 而是“当前页面、store、组件真正会消费到的字段集合”。
 */
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

/**
 * 登录成功后后端返回的核心数据：
 * - token: 供后续请求挂到 Authorization
 * - user: 当前登录用户的基础信息
 */
export interface AuthPayload {
  token: string
  user: UserInfo
}

/**
 * 登录表单提交给后端的数据结构。
 */
export interface LoginPayload {
  email: string
  password: string
}

/**
 * 注册表单提交给后端的数据结构。
 * 这里直接复用登录字段，再额外补一个 username。
 */
export interface RegisterPayload extends LoginPayload {
  username: string
}

/**
 * 当前消费记录在前端只关心三种状态：
 * - pending: 处理中
 * - success: 成功
 * - failed: 失败
 */
export type ConsumptionStatus = 'pending' | 'success' | 'failed' | 'cancelled'

/**
 * 用户服务消费记录。
 *
 * 对当前项目来说，它是一份重要的“业务中间结果”：
 * - 历史页展示依赖它
 * - 后续结果详情页也会通过 resultId 继续往下关联
 */
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

/**
 * 后端对消费记录做聚合统计后的结果。
 * 当前前端还没有完整展示，但先把契约保留下来，后续扩展会更顺手。
 */
export interface ConsumptionStats {
  _id: string
  count: number
  successCount: number
  failedCount: number
  totalCost: number
}

/**
 * 历史记录页当前消费的接口返回结构。
 */
export interface ConsumptionRecordsResponse {
  records: ConsumptionRecord[]
  stats: ConsumptionStats[]
}

/**
 * 面试服务类型。
 * 当前前端沿用了旧项目中的业务抽象：
 * - resume: 简历押题
 * - special: 专项面试
 * - behavior: HR / 行测
 */
export type InterviewServiceType = 'resume' | 'special' | 'behavior' | null

/**
 * 用户在“开始面试”前选择或填写的岗位信息。
 * 这份结构会同时影响：
 * - 简历分析输入
 * - 简历押题输入
 * - 后续结果页展示
 */
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

/**
 * 多轮对话中的消息结构。
 * 现在主要用于“分析后继续追问”的消息面板。
 */
export interface InterviewMessage {
  role: string
  content: string
  timestamp: string
  [key: string]: unknown
}

export interface ConsumptionRecordConversation {
  sessionId?: string | null
  canContinue?: boolean
  analysis?: Record<string, unknown> | null
  messages: InterviewMessage[]
}

export interface ConsumptionRecordDetail {
  record: ConsumptionRecord
  result: InterviewReport | null
  conversation: ConsumptionRecordConversation
}

/**
 * 单个押题问题的数据结构。
 * 如果后端后续补齐真实 AI 结果，这里会成为结果页和练习页最核心的数据模型之一。
 */
export interface ResumeQuizQuestion {
  question: string
  answer: string
  category?: string
  difficulty?: string
  tips?: string
  keywords?: string[]
  reasoning?: string
}

export interface ResumeQuizQuestionAnalysis {
  questionIndex: number
  question: string
  userAnswer: string
  referenceAnswer: string
  feedback: string
  score: number
  strengths: string[]
  improvements: string[]
}

export interface ResumeQuizRadarDimension {
  dimension: string
  score: number
  description?: string
}

export interface ResumeQuizOverallEvaluation {
  overallScore: number
  summary: string
  strengths: string[]
  weaknesses: string[]
  suggestions: string[]
  readiness?: string
}

export type ResumeQuizJobStatus = 'idle' | 'queued' | 'running' | 'completed' | 'failed'

export interface ResumeQuizAnswerAnalysisPayload {
  recordId: string
  resultId?: string
  userAnswers: string[]
  questionAnalyses: ResumeQuizQuestionAnalysis[]
  overallEvaluation: ResumeQuizOverallEvaluation
  radarData: ResumeQuizRadarDimension[]
  answerAnalysisCachedAt?: string
}

/**
 * 简历押题 / 结果页 / SSE 完成事件共享的结果载荷。
 *
 * 单独抽类型的目的，是让以下三处数据保持同一种理解：
 * - SSE complete 事件
 * - store 中的 report
 * - 将来单独的结果详情接口
 */
export interface ResumeQuizResultPayload {
  recordId?: string
  resultId?: string
  salaryRange?: string
  questions: ResumeQuizQuestion[]
  totalQuestions?: number
  totalPlannedQuestions?: number
  questionPlanVersion?: string
  questionStage?: number
  stageOneQuestions?: ResumeQuizQuestion[]
  stageTwoQuestions?: ResumeQuizQuestion[]
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
  radarData?: ResumeQuizRadarDimension[]
  strengths?: string[]
  weaknesses?: string[]
  interviewTips?: string[]
  remainingCount?: number
  isFromCache?: boolean
  userAnswers?: string[]
  userAnswersStageOne?: string[]
  userAnswersStageTwo?: string[]
  stageTwoQuestionStatus?: ResumeQuizJobStatus
  stageTwoQuestionJobId?: string
  stageTwoQuestionCachedAt?: string
  stageTwoQuestionErrorMessage?: string
  finalEvaluationStatus?: ResumeQuizJobStatus
  finalEvaluationJobId?: string
  finalEvaluationErrorMessage?: string
  questionAnalyses?: ResumeQuizQuestionAnalysis[]
  overallEvaluation?: ResumeQuizOverallEvaluation
  answerAnalysisCachedAt?: string
}

/**
 * 结果页展示模型。
 * 在通用结果载荷上，再补充页面自己需要的输入上下文。
 */
export interface InterviewReport extends ResumeQuizResultPayload {
  company?: string
  position?: string
  jobDescription?: string
}

export interface ResumeQuizSessionCache {
  recordId: string
  resultId?: string | null
  report: InterviewReport | null
  stageOneAnswerDrafts: string[]
  stageTwoAnswerDrafts: string[]
  stageTwoSupplementaryContext: string
  stageTwoStatus: ResumeQuizJobStatus
  finalAnalysisStatus: ResumeQuizJobStatus
  analysisResult: ResumeQuizAnswerAnalysisPayload | null
  completedAt?: string
}

export interface ResumeQuizStageTwoJobPayload {
  recordId: string
  resultId?: string
  status: ResumeQuizJobStatus
  jobId?: string
  questions?: ResumeQuizQuestion[]
  cachedAt?: string
  errorMessage?: string
}

export interface ResumeQuizFinalEvaluationPayload {
  recordId: string
  resultId?: string
  status: ResumeQuizJobStatus
  jobId?: string
  userAnswers?: string[]
  questionAnalyses?: ResumeQuizQuestionAnalysis[]
  overallEvaluation?: ResumeQuizOverallEvaluation
  radarData?: ResumeQuizRadarDimension[]
  cachedAt?: string
  errorMessage?: string
}

export interface ResumeAnalysisViewModel {
  yearsOfExperience: string
  recentPosition: string
  education: string
  matchScore: string
  skills: string[]
  strengths: string[]
  gaps: string[]
  suggestions: string[]
  summary: string
}
