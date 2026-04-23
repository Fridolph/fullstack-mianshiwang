import { DocumentParserService } from './document-parser.service'
import { v4 as uuidV4 } from 'uuid'
import { ConversationContinuationService } from './conversation-continuation.service'
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { SessionManager } from './../../ai/services/session.manager'
import { ResumeAnalysisService } from './resume-analysis.service'
import { InterviewAIService } from './interview-ai.service'
import { RESUME_ANALYSIS_SYSTEM_MESSAGE } from '../prompts/resume-analysis.prompts'
import { Subject } from 'rxjs'
import { ResumeQuizDto } from '../dto/resume-quiz.dto'
import { Model, Types } from 'mongoose'
import { PromptTemplate } from '@langchain/core/prompts'
import { StructuredOutputParser } from '@langchain/core/output_parsers'
import { z } from 'zod'
import {
  ConsumptionRecord,
  ConsumptionRecordDocument,
  ConsumptionStatus,
  ConsumptionType,
} from '../schemas/consumption-record.schema'
import { InjectModel } from '@nestjs/mongoose'
import { AIModelFactory } from '../../ai/services/ai-model.factory'
import {
  OverallEvaluation,
  QuestionAnswerAnalysis,
  QuestionCategory,
  QuestionDifficulty,
  RadarDimension,
  ResumeQuizJobStatus,
  ResumeQuizResult,
  ResumeQuizResultDocument,
} from '../schemas/interview-quiz-result.schema'
import { User, UserDocument } from '../../user/schemas/user.schema'
import {
  RESUME_QUIZ_ANSWER_ANALYSIS_PROMPT,
  RESUME_QUIZ_PROMPT_ANALYSIS_ONLY,
  RESUME_QUIZ_PROMPT_STAGE_ONE_QUESTIONS,
  RESUME_QUIZ_PROMPT_STAGE_TWO_QUESTIONS,
} from '../prompts/resume-quiz.prompts'

// 进度事件
export interface ProgressEvent {
  type: 'progress' | 'complete' | 'error' | 'timeout'
  step?: number
  label?: string
  progress: number // 0-100
  message?: string
  data?: any
  error?: string
  stage?: 'prepare' | 'generating' | 'saving' | 'done'
}

interface ResumeQuizExecutionContext {
  cancelled: boolean
}

interface ResumeQuizStreamHandle {
  stream: Subject<ProgressEvent>
  cancel: () => void
}

interface GeneratingProgressHandle {
  stop: () => void
}

interface ResumeQuizGeneratedQuestions {
  questions: Array<{
    question: string
    answer: string
    category: QuestionCategory
    difficulty: QuestionDifficulty
    tips: string
    keywords: string[]
    reasoning: string
  }>
  summary: string
}

export interface ResumeQuizStageTwoJobPayload {
  recordId: string
  resultId: string
  status: ResumeQuizJobStatus
  jobId?: string
  questions?: ResumeQuizGeneratedQuestions['questions']
  cachedAt?: string
  errorMessage?: string
}

export interface ResumeQuizFinalEvaluationPayload {
  recordId: string
  resultId: string
  status: ResumeQuizJobStatus
  jobId?: string
  userAnswers?: string[]
  questionAnalyses?: QuestionAnswerAnalysis[]
  overallEvaluation?: OverallEvaluation
  radarData?: RadarDimension[]
  cachedAt?: string
  errorMessage?: string
}

class ResumeQuizCancelledError extends Error {
  constructor(message = '客户端已断开，已取消生成') {
    super(message)
    this.name = 'ResumeQuizCancelledError'
  }
}

/**
 * 面试服务
 *
 * 这个服务只关心业务逻辑和流程编排：
 * 1. 创建会话_QUIZ
 * 2. 调用具体的分析服务（简历分析、对话继续等）
 * 3. 管理会话历史
 *
 * 不关心具体的 AI 实现细节，那些交给专门的分析服务。
 */
@Injectable()
export class InterviewService {
  private readonly logger = new Logger(InterviewService.name)

  constructor(
    private configService: ConfigService,
    private sessionManager: SessionManager,
    private resumeAnalysisService: ResumeAnalysisService,
    private conversationContinuationService: ConversationContinuationService,
    private documentParserService: DocumentParserService,
    private aiModelFactory: AIModelFactory,
    private interviewAIService: InterviewAIService,
    @InjectModel(ConsumptionRecord.name)
    private consumptionRecordModel: Model<ConsumptionRecordDocument>,
    @InjectModel(ResumeQuizResult.name)
    private resumeQuizResultModel: Model<ResumeQuizResultDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  private readonly resumeQuizQuestionSchema = z.object({
    question: z.string(),
    answer: z.string(),
    category: z.string(),
    difficulty: z.string(),
    tips: z.string().optional().nullable(),
    keywords: z.array(z.string()).optional().default([]),
    reasoning: z.string().optional().nullable(),
  })

  private readonly resumeQuizQuestionsParser =
    StructuredOutputParser.fromZodSchema(
      z.object({
        questions: z.array(this.resumeQuizQuestionSchema).min(1).max(12),
        summary: z.string(),
      }),
    )

  private readonly resumeQuizStageOneQuestionsParser =
    StructuredOutputParser.fromZodSchema(
      z.object({
        questions: z.array(this.resumeQuizQuestionSchema).length(7),
        summary: z.string(),
      }),
    )

  private readonly resumeQuizStageTwoQuestionsParser =
    StructuredOutputParser.fromZodSchema(
      z.object({
        questions: z.array(this.resumeQuizQuestionSchema).length(3),
        summary: z.string(),
      }),
    )

  private readonly resumeQuizAnalysisParser =
    StructuredOutputParser.fromZodSchema(
      z.object({
        matchScore: z.number().min(0).max(100),
        matchLevel: z.string(),
        matchedSkills: z
          .array(
            z.object({
              skill: z.string(),
              matched: z.boolean(),
              proficiency: z.string().optional().nullable(),
            }),
          )
          .default([]),
        missingSkills: z.array(z.string()).default([]),
        knowledgeGaps: z.array(z.string()).default([]),
        learningPriorities: z
          .array(
            z.object({
              topic: z.string(),
              priority: z.enum(['high', 'medium', 'low']),
              reason: z.string(),
            }),
          )
          .default([]),
        radarData: z
          .array(
            z.object({
              dimension: z.string(),
              score: z.number().min(0).max(100),
              description: z.string().optional().nullable(),
            }),
          )
          .default([]),
        strengths: z.array(z.string()).default([]),
        weaknesses: z.array(z.string()).default([]),
        interviewTips: z.array(z.string()).default([]),
      }),
    )

  private readonly resumeQuizAnswerAnalysisParser =
    StructuredOutputParser.fromZodSchema(
      z.object({
        questionAnalyses: z.array(
          z.object({
            questionIndex: z.number().int().min(0),
            question: z.string(),
            userAnswer: z.string(),
            referenceAnswer: z.string(),
            score: z.number().min(0).max(100),
            feedback: z.string(),
            strengths: z.array(z.string()).default([]),
            improvements: z.array(z.string()).default([]),
          }),
        ),
        overallEvaluation: z.object({
          overallScore: z.number().min(0).max(100),
          summary: z.string(),
          strengths: z.array(z.string()).default([]),
          weaknesses: z.array(z.string()).default([]),
          suggestions: z.array(z.string()).default([]),
          readiness: z.string().optional().nullable(),
        }),
        radarData: z
          .array(
            z.object({
              dimension: z.string(),
              score: z.number().min(0).max(100),
              description: z.string().optional().nullable(),
            }),
          )
          .default([]),
      }),
    )

  /**
   * 分析简历（首轮，创建会话）
   * @param userId
   * @param position 职位名称
   * @param resumeContent 简历要求
   * @param jobDescription 岗位要求
   * @returns 返简历的分析结果 和 sesionId
   */
  async analyzeResume(
    userId: string,
    position: string,
    resumeContent: string,
    jobDescription: string,
  ) {
    try {
      // 1. 现在要创建新会话
      const systemMessage = RESUME_ANALYSIS_SYSTEM_MESSAGE(position)
      const sessionId = this.sessionManager.createSession(
        userId,
        position,
        systemMessage,
      )
      this.logger.log(`创建会话: ${sessionId}`)

      // 2. 调用专门的简历分析服务
      const result = await this.resumeAnalysisService.analyze(
        resumeContent,
        jobDescription,
      )

      // 3. 保存用户输入到会话历史
      this.sessionManager.addMessage(
        sessionId,
        'user',
        `简历内容: ${resumeContent}`,
      )

      // 4. 保存 AI 的回答到会话历史
      this.sessionManager.addMessage(
        sessionId,
        'assistant',
        JSON.stringify(result),
      )

      this.logger.log(`简历分析完成 sessionId: ${sessionId}`)
      return {
        sessionId,
        analysis: result,
      }
    } catch (err) {
      this.logger.error(`分析简历失败: ${err}`)
      throw err
    }
  }

  /**
   * 继续对话 （多轮对话，基于现有对话）
   * @param sessionId
   * @param userQuestion
   * @returns AI 的回答
   */
  async continueConversation(
    sessionId: string,
    userQuestion: string,
  ): Promise<string> {
    try {
      // 1. 添加用户问题到会话历史
      this.sessionManager.addMessage(sessionId, 'user', userQuestion)

      // 2. 获取对话历史
      const history = this.sessionManager.getRecentMessages(sessionId, 10)
      this.logger.log(
        `继续对话 sessionId: ${sessionId}, 历史消息数: ${history.length}`,
      )

      // 3. 调用专门的对话 继续服务
      const aiResponse =
        await this.conversationContinuationService.continue(history)

      // 4. 保存AI的回答到会话历史
      this.sessionManager.addMessage(sessionId, 'assistant', aiResponse)
      this.logger.log(`继续对话 ok | sessionId: ${sessionId}`)

      return aiResponse
    } catch (err) {
      this.logger.error(`继续对话失败: ${err}`)
      throw err
    }
  }

  getHistoryMessages(sessionId: string) {
    try {
      const history = this.sessionManager.getRecentMessages(sessionId, 10)
      return history
    } catch (err) {
      this.logger.error(`获取当前会话历史消息失败: ${err}`)
      throw err
    }
  }

  private normalizeConversationMessages(
    messages: Array<{ role?: string; content?: string; timestamp?: string }>,
    fallbackDate?: Date,
  ) {
    const baseTime = fallbackDate?.getTime?.() || Date.now()

    return messages
      .filter(
        (message): message is {
          role: string
          content: string
          timestamp?: string
        } =>
          typeof message?.role === 'string'
          && message.role !== 'system'
          && typeof message?.content === 'string'
          && message.content.trim().length > 0,
      )
      .map((message, index) => ({
        role: message.role,
        content: message.content,
        timestamp:
          typeof message.timestamp === 'string' && message.timestamp
            ? message.timestamp
            : new Date(baseTime + index).toISOString(),
      }))
  }

  private splitConversationHistory(
    history: Array<{ role?: string; content?: string }>,
    fallbackDate?: Date,
  ) {
    const visibleMessages = history.filter((item) => item.role !== 'system')

    let analysis: Record<string, unknown> | null = null
    let conversationMessages = visibleMessages

    if (visibleMessages[1]?.role === 'assistant') {
      const candidate = this.tryParseAnalysis(visibleMessages[1].content)
      if (candidate) {
        analysis = candidate
        conversationMessages = visibleMessages.slice(2)
      }
    }

    return {
      analysis,
      messages: this.normalizeConversationMessages(
        conversationMessages,
        fallbackDate,
      ),
    }
  }

  private getPersistedConversationSnapshot(record: {
    createdAt?: Date
    updatedAt?: Date
    inputData?: Record<string, any>
  }) {
    const fallbackDate = record.updatedAt || record.createdAt
    const inputData = record.inputData || {}

    const analysis =
      inputData.analysisSnapshot
      && typeof inputData.analysisSnapshot === 'object'
      && !Array.isArray(inputData.analysisSnapshot)
        ? (inputData.analysisSnapshot as Record<string, unknown>)
        : null

    const rawMessages = Array.isArray(inputData.conversationMessages)
      ? inputData.conversationMessages
      : []

    return {
      analysis,
      messages: this.normalizeConversationMessages(rawMessages, fallbackDate),
    }
  }

  private buildConversationSnapshotFromSession(
    sessionId?: string | null,
    fallbackDate?: Date,
  ) {
    if (!sessionId) {
      return {
        analysis: null,
        messages: [],
      }
    }

    const history = this.getHistoryMessages(sessionId)
    return this.splitConversationHistory(history, fallbackDate)
  }

  async getConsumptionRecordDetail(userId: string, recordId: string) {
    const record = await this.consumptionRecordModel
      .findOne({
        userId,
        recordId,
      })
      .lean()

    if (!record) {
      throw new NotFoundException('未找到对应的历史记录')
    }

    const result = record.resultId
      ? await this.resumeQuizResultModel
          .findOne({
            userId,
            resultId: record.resultId,
          })
          .lean()
      : null

    const sessionId =
      typeof record.inputData?.sessionId === 'string'
        ? record.inputData.sessionId
        : null

    const recordTimestamp = (
      record as typeof record & {
        updatedAt?: Date
      }
    ).updatedAt
    const persistedConversation = this.getPersistedConversationSnapshot(record)
    const liveConversation = this.buildConversationSnapshotFromSession(
      sessionId,
      recordTimestamp || record.createdAt,
    )

    return {
      record,
      result: result
        ? {
            recordId: record.recordId,
            resultId: result.resultId,
            company: result.company,
            position: result.position,
            salaryRange: result.salaryRange,
            jobDescription: result.jobDescription,
            summary: result.summary,
            matchScore: result.matchScore,
            matchLevel: result.matchLevel,
            matchedSkills: result.matchedSkills,
            missingSkills: result.missingSkills,
            knowledgeGaps: result.knowledgeGaps,
            learningPriorities: this.normalizeLearningPriorities(
              result.learningPriorities,
            ),
            radarData: result.radarData,
            strengths: result.strengths,
            weaknesses: result.weaknesses,
            interviewTips: result.interviewTips,
            questions: result.questions,
            totalQuestions: result.totalQuestions,
            totalPlannedQuestions: result.totalPlannedQuestions,
            questionPlanVersion: result.questionPlanVersion,
            questionStage: result.questionStage,
            stageOneQuestions: result.stageOneQuestions,
            stageTwoQuestions: result.stageTwoQuestions,
            userAnswers: result.userAnswers,
            userAnswersStageOne: result.userAnswersStageOne,
            userAnswersStageTwo: result.userAnswersStageTwo,
            stageTwoQuestionStatus: result.stageTwoQuestionStatus,
            stageTwoQuestionJobId: result.stageTwoQuestionJobId,
            stageTwoQuestionCachedAt:
              result.stageTwoQuestionCachedAt?.toISOString(),
            stageTwoQuestionErrorMessage: result.stageTwoQuestionErrorMessage,
            finalEvaluationStatus: result.finalEvaluationStatus,
            finalEvaluationJobId: result.finalEvaluationJobId,
            finalEvaluationErrorMessage: result.finalEvaluationErrorMessage,
            questionAnalyses: result.questionAnalyses,
            overallEvaluation: result.overallEvaluation,
            answerAnalysisCachedAt:
              result.answerAnalysisCachedAt?.toISOString(),
          }
        : null,
      conversation: {
        sessionId,
        canContinue:
          Boolean(sessionId) && record.status === ConsumptionStatus.PENDING,
        analysis: liveConversation.analysis || persistedConversation.analysis,
        messages: liveConversation.messages.length
          ? liveConversation.messages
          : persistedConversation.messages,
      },
    }
  }

  private async getConsumptionRecordWithResult(userId: string, recordId: string) {
    const record = await this.consumptionRecordModel
      .findOne({
        userId,
        recordId,
      })
      .lean()

    if (!record) {
      throw new NotFoundException('未找到对应的历史记录')
    }

    const result = record.resultId
      ? await this.resumeQuizResultModel
          .findOne({
            userId,
            resultId: record.resultId,
          })
      : null

    if (!result) {
      throw new NotFoundException('未找到对应的押题结果')
    }

    return {
      record,
      result,
    }
  }

  async getResumeQuizResultAnalysis(userId: string, recordId: string) {
    const { result } = await this.getConsumptionRecordWithResult(userId, recordId)

    if (
      !result.questionAnalyses?.length ||
      !result.overallEvaluation ||
      !result.userAnswers?.length
    ) {
      return null
    }

    return {
      recordId,
      resultId: result.resultId,
      userAnswers: result.userAnswers,
      questionAnalyses: result.questionAnalyses,
      overallEvaluation: result.overallEvaluation,
      radarData: result.radarData || [],
      answerAnalysisCachedAt: result.answerAnalysisCachedAt?.toISOString(),
    }
  }

  async analyzeResumeQuizResultAnswers(
    userId: string,
    recordId: string,
    answers: string[],
  ) {
    const { result } = await this.getConsumptionRecordWithResult(userId, recordId)
    const normalizedAnswers = this.normalizeUserAnswers(answers)
    const questionCount = result.questions?.length || 0

    if (!questionCount) {
      throw new BadRequestException('当前记录还没有可分析的押题结果')
    }

    if (normalizedAnswers.length !== questionCount) {
      throw new BadRequestException(`请提交 ${questionCount} 道题对应的完整回答`)
    }

    const cachedAnswers = this.normalizeUserAnswers(result.userAnswers || [])
    const hasCachedAnalysis =
      result.questionAnalyses?.length &&
      result.overallEvaluation &&
      cachedAnswers.length === normalizedAnswers.length &&
      cachedAnswers.every((answer, index) => answer === normalizedAnswers[index])

    if (hasCachedAnalysis) {
      result.finalEvaluationStatus = ResumeQuizJobStatus.COMPLETED
      await result.save()
      return {
        recordId,
        resultId: result.resultId,
        userAnswers: result.userAnswers || normalizedAnswers,
        questionAnalyses: result.questionAnalyses,
        overallEvaluation: result.overallEvaluation,
        radarData: result.radarData || [],
        answerAnalysisCachedAt: result.answerAnalysisCachedAt?.toISOString(),
      }
    }

    const generated = await this.generateResumeQuizAnswerAnalysis(
      {
        company: result.company || '未提供',
        positionName: result.position || '未提供',
        salaryRange: result.salaryRange || '面议',
        jd: result.jobDescription || '未提供',
        resumeContent: result.resumeSnapshot || '未提供',
        questions: result.questions || [],
        answers: normalizedAnswers,
      },
    )

    const cachedAt = new Date()

    result.userAnswers = normalizedAnswers
    result.userAnswersStageOne = normalizedAnswers.slice(0, 7)
    result.userAnswersStageTwo = normalizedAnswers.slice(7)
    result.questionAnalyses = generated.questionAnalyses
    result.overallEvaluation = generated.overallEvaluation
    result.radarData = generated.radarData
    result.answerAnalysisCachedAt = cachedAt
    result.finalEvaluationStatus = ResumeQuizJobStatus.COMPLETED
    result.finalEvaluationErrorMessage = undefined
    await result.save()

    return {
      recordId,
      resultId: result.resultId,
      userAnswers: normalizedAnswers,
      questionAnalyses: generated.questionAnalyses,
      overallEvaluation: generated.overallEvaluation,
      radarData: generated.radarData,
      answerAnalysisCachedAt: cachedAt.toISOString(),
    }
  }

  async createStageTwoQuestionsJob(
    userId: string,
    recordId: string,
    answers: string[],
    supplementaryContext?: string,
  ): Promise<ResumeQuizStageTwoJobPayload> {
    const { result } = await this.getConsumptionRecordWithResult(userId, recordId)
    const normalizedAnswers = this.normalizeUserAnswers(answers)
    const stageOneQuestions = result.stageOneQuestions?.length
      ? result.stageOneQuestions
      : (result.questions || []).slice(0, 7)

    if (stageOneQuestions.length !== 7) {
      throw new BadRequestException('当前记录还没有完整的第 1 阶段题目')
    }

    if (normalizedAnswers.length !== 7) {
      throw new BadRequestException('请先完成第 1 阶段 7 道题的回答')
    }

    const currentStageOneAnswers = this.normalizeUserAnswers(
      result.userAnswersStageOne || [],
    )
    const hasCachedStageTwo =
      result.stageTwoQuestionStatus === ResumeQuizJobStatus.COMPLETED
      && (result.stageTwoQuestions?.length || 0) === 3
      && currentStageOneAnswers.length === normalizedAnswers.length
      && currentStageOneAnswers.every(
        (answer, index) => answer === normalizedAnswers[index],
      )

    if (hasCachedStageTwo) {
      return this.buildStageTwoQuestionsPayload(recordId, result)
    }

    const jobId = uuidV4()
    result.userAnswersStageOne = normalizedAnswers
    result.userAnswers = [
      ...normalizedAnswers,
      ...this.normalizeUserAnswers(result.userAnswersStageTwo || []),
    ]
    result.stageTwoQuestions = []
    result.questions = [...stageOneQuestions]
    result.totalQuestions = stageOneQuestions.length
    result.questionStage = 1
    result.stageTwoQuestionStatus = ResumeQuizJobStatus.QUEUED
    result.stageTwoQuestionJobId = jobId
    result.stageTwoQuestionCachedAt = undefined
    result.stageTwoQuestionErrorMessage = undefined
    result.finalEvaluationStatus = ResumeQuizJobStatus.IDLE
    result.finalEvaluationJobId = undefined
    result.finalEvaluationErrorMessage = undefined
    result.questionAnalyses = []
    result.overallEvaluation = undefined
    result.answerAnalysisCachedAt = undefined
    await result.save()

    queueMicrotask(() => {
      void this.runStageTwoQuestionsJob({
        userId,
        recordId,
        resultId: result.resultId,
        jobId,
        stageOneAnswers: normalizedAnswers,
        supplementaryContext,
      })
    })

    return this.buildStageTwoQuestionsPayload(recordId, result)
  }

  async getStageTwoQuestionsJob(
    userId: string,
    recordId: string,
  ): Promise<ResumeQuizStageTwoJobPayload> {
    const { result } = await this.getConsumptionRecordWithResult(userId, recordId)
    return this.buildStageTwoQuestionsPayload(recordId, result)
  }

  async createFinalEvaluationJob(
    userId: string,
    recordId: string,
    answers: string[],
  ): Promise<ResumeQuizFinalEvaluationPayload> {
    const { result } = await this.getConsumptionRecordWithResult(userId, recordId)
    const normalizedAnswers = this.normalizeUserAnswers(answers)
    const allQuestions = this.getAllQuestions(result)

    if (allQuestions.length !== 10) {
      throw new BadRequestException('请先完成第 2 阶段题目生成')
    }

    if (normalizedAnswers.length !== 10) {
      throw new BadRequestException('请提交全部 10 道题的回答')
    }

    const currentAnswers = this.normalizeUserAnswers(result.userAnswers || [])
    const hasCachedFinalEvaluation =
      result.finalEvaluationStatus === ResumeQuizJobStatus.COMPLETED
      && result.questionAnalyses?.length === allQuestions.length
      && result.overallEvaluation
      && currentAnswers.length === normalizedAnswers.length
      && currentAnswers.every((answer, index) => answer === normalizedAnswers[index])

    if (hasCachedFinalEvaluation) {
      return this.buildFinalEvaluationPayload(recordId, result)
    }

    const jobId = uuidV4()
    result.userAnswers = normalizedAnswers
    result.userAnswersStageOne = normalizedAnswers.slice(0, 7)
    result.userAnswersStageTwo = normalizedAnswers.slice(7)
    result.finalEvaluationStatus = ResumeQuizJobStatus.QUEUED
    result.finalEvaluationJobId = jobId
    result.finalEvaluationErrorMessage = undefined
    result.questionAnalyses = []
    result.overallEvaluation = undefined
    result.answerAnalysisCachedAt = undefined
    await result.save()

    queueMicrotask(() => {
      void this.runFinalEvaluationJob({
        userId,
        recordId,
        resultId: result.resultId,
        jobId,
        answers: normalizedAnswers,
      })
    })

    return this.buildFinalEvaluationPayload(recordId, result)
  }

  async getFinalEvaluationJob(
    userId: string,
    recordId: string,
  ): Promise<ResumeQuizFinalEvaluationPayload> {
    const { result } = await this.getConsumptionRecordWithResult(userId, recordId)
    return this.buildFinalEvaluationPayload(recordId, result)
  }

  async parseUploadedResume(fileName: string, buffer: Buffer) {
    const rawText = await this.documentParserService.parseDocumentFromUpload(
      fileName,
      buffer,
    )
    const cleanedText = this.documentParserService.cleanText(rawText)
    const validation =
      this.documentParserService.validateResumeContent(cleanedText)

    if (!validation.isValid) {
      throw new BadRequestException(validation.reason)
    }

    return {
      text: cleanedText,
      estimatedTokens: this.documentParserService.estimateTokens(cleanedText),
      warnings: validation.warnings || [],
    }
  }

  async getResumeQuizRequestStatus(userId: string, requestId: string) {
    const record = await this.consumptionRecordModel
      .findOne({
        userId,
        type: ConsumptionType.RESUME_QUIZ,
        'metadata.requestId': requestId,
      })
      .lean()

    if (!record) {
      throw new NotFoundException('未找到对应的 requestId 记录')
    }

    const basePayload = {
      requestId,
      recordId: record.recordId,
      status: record.status,
      resultId: record.resultId,
      startedAt: record.startedAt,
      completedAt: record.completedAt,
      failedAt: record.failedAt,
      errorMessage: record.errorMessage,
      isRefunded: record.isRefunded,
      promptVersion: record.metadata?.promptVersion,
    }

    if (record.status === ConsumptionStatus.PENDING) {
      return {
        ...basePayload,
        message: '请求仍在处理中，请继续等待或稍后重试',
      }
    }

    if (record.status === ConsumptionStatus.FAILED) {
      return {
        ...basePayload,
        message: '请求处理失败',
      }
    }

    if (record.status === ConsumptionStatus.CANCELLED) {
      return {
        ...basePayload,
        message: '请求已取消，请使用新的 requestId 重新发起',
        result: null,
      }
    }

    const result = record.resultId
      ? await this.resumeQuizResultModel
          .findOne({
            resultId: record.resultId,
            userId,
          })
          .lean()
      : null

    return {
      ...basePayload,
      message: result ? '已找到对应结果' : '消费记录已成功，但结果明细不存在',
      result: result
        ? {
            recordId: record.recordId,
            resultId: result.resultId,
            company: result.company,
            position: result.position,
            salaryRange: result.salaryRange,
            summary: result.summary,
            questions: result.questions,
            stageOneQuestions: result.stageOneQuestions,
            stageTwoQuestions: result.stageTwoQuestions,
            questionStage: result.questionStage,
            totalQuestions: result.totalQuestions,
            totalPlannedQuestions: result.totalPlannedQuestions,
            matchScore: result.matchScore,
            matchLevel: result.matchLevel,
            matchedSkills: result.matchedSkills,
            missingSkills: result.missingSkills,
            knowledgeGaps: result.knowledgeGaps,
            learningPriorities: this.normalizeLearningPriorities(
              result.learningPriorities,
            ),
            radarData: result.radarData,
            strengths: result.strengths,
            weaknesses: result.weaknesses,
            interviewTips: result.interviewTips,
            stageTwoQuestionStatus: result.stageTwoQuestionStatus,
            finalEvaluationStatus: result.finalEvaluationStatus,
          }
        : null,
    }
  }

  /**
   * 生成简历押题（带流式进度）
   * @param userId
   * @param dto ResumeQuizDto
   * @returns Subject<ProgressEvent> 流式事件
   */
  generateResumeQuizWithProgress(
    userId: string,
    dto: ResumeQuizDto,
  ): ResumeQuizStreamHandle {
    const subject = new Subject<ProgressEvent>()
    const context: ResumeQuizExecutionContext = {
      cancelled: false,
    }

    // 推迟到当前调用栈结束后再开始推送，避免首条事件在 subscribe 之前丢失
    queueMicrotask(() => {
      void this.executeResumeQuiz(userId, dto, subject, context)
    })

    return {
      stream: subject,
      cancel: () => {
        context.cancelled = true
      },
    }
  }

  private emitComplete(
    progressSubject: Subject<ProgressEvent> | undefined,
    data: Record<string, unknown>,
  ) {
    if (!progressSubject || progressSubject.closed) {
      return
    }

    progressSubject.next({
      type: 'complete',
      progress: 100,
      label: 'AI 已完成问题生成',
      message: 'AI 已完成问题生成',
      stage: 'done',
      data,
    })
    progressSubject.complete()
  }

  /**
   * 执行简历押题（核心业务逻辑）
   */
  private async executeResumeQuiz(
    userId: string,
    dto: ResumeQuizDto,
    progressSubject?: Subject<ProgressEvent>,
    context?: ResumeQuizExecutionContext,
  ) {
    let consumptionRecord: any = null
    let didConsumeCount = false
    let didCreateResult = false
    let generatingProgressHandle: GeneratingProgressHandle | null = null
    const recordId = uuidV4()
    const resultId = uuidV4()

    try {
      this.throwIfResumeQuizCancelled(context)

      // 先进行幂等性检查 - 优化中最关键点一步，防止重复生成
      if (dto.requestId) {
        // 查库中是否存在 requestId 记录
        const existingRecord = await this.consumptionRecordModel.findOne({
          userId,
          'metadata.requestId': dto.requestId,
        })

        if (existingRecord) {
          if (existingRecord.status === ConsumptionStatus.PENDING) {
            // 同一个请求还在处理中，告诉用户稍后查询
            throw new BadRequestException('请求正在处理中，请稍后查询结果')
          }

          // 已成功生成过，直接返已有结果（用缓存）
          if (existingRecord.status === ConsumptionStatus.SUCCESS) {
            this.logger.log(
              `重复请求，命中缓存，返已有结果: requestId=${dto.requestId}`,
            )
            // 查询之前生成的结果
            const existingResult = await this.resumeQuizResultModel.findOne({
              resultId: existingRecord.resultId,
            })

            if (!existingResult) throw new BadRequestException('结果不存在')

            const cachedPayload = {
              recordId: existingRecord.recordId,
              resultId: existingResult.resultId,
              questions: existingResult.questions,
              stageOneQuestions:
                existingResult.stageOneQuestions?.length
                  ? existingResult.stageOneQuestions
                  : existingResult.questions,
              stageTwoQuestions: existingResult.stageTwoQuestions || [],
              questionStage: existingResult.questionStage || 1,
              totalQuestions: existingResult.totalQuestions,
              totalPlannedQuestions: existingResult.totalPlannedQuestions || 10,
              questionPlanVersion:
                existingResult.questionPlanVersion || 'two-stage-v1',
              summary: existingResult.summary,
              matchScore: existingResult.matchScore,
              matchLevel: existingResult.matchLevel,
              matchedSkills: existingResult.matchedSkills,
              missingSkills: existingResult.missingSkills,
              knowledgeGaps: existingResult.knowledgeGaps,
              learningPriorities: this.normalizeLearningPriorities(
                existingResult.learningPriorities,
              ),
              radarData: existingResult.radarData,
              strengths: existingResult.strengths,
              weaknesses: existingResult.weaknesses,
              interviewTips: existingResult.interviewTips,
              stageTwoQuestionStatus: existingResult.stageTwoQuestionStatus,
              stageTwoQuestionCachedAt:
                existingResult.stageTwoQuestionCachedAt?.toISOString(),
              finalEvaluationStatus: existingResult.finalEvaluationStatus,
              remainingCount: await this.getRemainingCount(userId, 'resume'),
              salaryRange: existingResult.salaryRange,
              consmptionRecordId: existingRecord.recordId,
              isFromCache: true,
            }

            this.emitComplete(progressSubject, cachedPayload)

            // 直接返回，不再执行后续步骤，不再扣费
            return cachedPayload
          }

          if (existingRecord.status === ConsumptionStatus.CANCELLED) {
            throw new BadRequestException(
              '该 requestId 已取消，请使用新的 requestId 重新发起',
            )
          }

          if (existingRecord.status === ConsumptionStatus.FAILED) {
            throw new BadRequestException(
              '该 requestId 已失败，请使用新的 requestId 重新发起',
            )
          }
        }
      }

      this.throwIfResumeQuizCancelled(context)
      this.emitProgress(progressSubject, 5, '正在校验请求参数...', 'prepare')
      this.emitProgress(progressSubject, 10, '正在校验剩余次数...', 'prepare')

      // 步骤1 检查并扣除次数（原子操作）
      // 注意：扣费后如果后续步骤失败，会在catch块中自动退款
      const user = await this.userModel.findOneAndUpdate(
        {
          _id: userId,
          resumeRemainingCount: { $gt: 0 }, // 条件：体验次数 > 0
        },
        {
          $inc: { resumeRemainingCount: -1 }, // 原子操作: 体验次数 - 1
        },
        { new: false }, // 返回更新前的文档，用于日志记录
      )
      // 检查是否扣费成功
      if (!user) {
        throw new BadRequestException('简历押题次数不足, 请前往充值页面购买')
      }
      didConsumeCount = true

      this.throwIfResumeQuizCancelled(context)
      this.logger.log(
        `用户扣费成功: userId=${userId}, 扣费前=${user.resumeRemainingCount}, 扣费后=${user.resumeRemainingCount - 1}`,
      )
      this.emitProgress(
        progressSubject,
        15,
        '剩余次数校验通过，准备创建消费记录...',
        'prepare',
      )
      const conversationSnapshot = this.buildConversationSnapshotFromSession(
        dto.sessionId,
      )

      // 步骤2 创建消费记录 pending
      consumptionRecord = await this.consumptionRecordModel.create({
        recordId, // 消费记录唯一ID
        user: new Types.ObjectId(userId),
        userId,
        type: ConsumptionType.RESUME_QUIZ, // 消费类型
        status: ConsumptionStatus.PENDING, // 关键：标记为处理中
        consumedCount: 1, // 消费次数
        description: `简历押题 - ${dto?.company} ${dto.positionName}`,
        // 记录输入参数（用于调试和重现问题）
        inputData: {
          company: dto.company || '',
          positionName: dto.positionName,
          minSalary: dto.minSalary,
          maxSalary: dto.maxSalary,
          jd: dto.jd,
          sessionId: dto.sessionId,
          resumeId: dto.resumeId,
          analysisSnapshot: conversationSnapshot.analysis,
          conversationMessages: conversationSnapshot.messages,
        },
        resultId, // 结果ID（后面再生成）
        metadata: {
          requestId: dto.requestId, // 幂等性检查 - 请求ID
          promptVersion: dto.promptVersion,
        },
        startedAt: new Date(),
      })
      this.throwIfResumeQuizCancelled(context)
      this.logger.log(`消费记录创建成功: recordId=${recordId}`)
      this.emitProgress(
        progressSubject,
        20,
        '已创建消费记录，开始生成押题...',
        'generating',
      )

      // 如果没有 requestId 或 requestId 不存在，则继续执行正常的生成流程逻辑
      this.logger.log(
        `开始生成简历押题 userId=${userId}, positionName=${dto.positionName}`,
      )
      generatingProgressHandle = this.startGeneratingProgressTicker(
        progressSubject,
        context,
      )
      const resumeContent = await this.extractResumeContent(userId, dto)
      this.throwIfResumeQuizCancelled(context)
      const salaryRange = this.formatSalaryRange(dto.minSalary, dto.maxSalary)
      const aiResult = await this.generateResumeQuizStageOneResult(
        dto,
        resumeContent,
        salaryRange,
      )
      generatingProgressHandle.stop()
      generatingProgressHandle = null
      this.throwIfResumeQuizCancelled(context)
      // 阶段3 保存结果阶段
      // const quizResult =
      await this.resumeQuizResultModel.create({
        resultId,
        user: new Types.ObjectId(userId),
        userId,
        resumeId: dto.resumeId,
        company: dto.company || '',
        position: dto.positionName,
        salaryRange,
        jobDescription: dto.jd,
        resumeSnapshot: resumeContent,
        questions: aiResult?.questions || [],
        totalQuestions: aiResult?.questions?.length || 0,
        totalPlannedQuestions: 10,
        questionPlanVersion: 'two-stage-v1',
        questionStage: 1,
        stageOneQuestions: aiResult?.questions || [],
        stageTwoQuestions: [],
        stageTwoQuestionStatus: ResumeQuizJobStatus.IDLE,
        finalEvaluationStatus: ResumeQuizJobStatus.IDLE,
        summary: aiResult.summary,
        // AI 生成的分析报告数据
        matchScore: aiResult?.matchScore,
        matchLevel: aiResult?.matchLevel,
        matchedSkills: aiResult?.matchedSkills || [],
        missingSkills: aiResult?.missingSkills || [],
        knowledgeGaps: aiResult?.knowledgeGaps || [],
        learningPriorities: aiResult?.learningPriorities || [],
        radarData: aiResult?.radarData || [],
        strengths: aiResult?.strengths || [],
        weaknesses: aiResult?.weaknesses || [],
        interviewTips: aiResult?.interviewTips || [],
        // 元数据
        consumptionRecordId: recordId,
        aiModel: this.getCurrentAiModelName(),
        promptVersion: dto.promptVersion || 'v2',
      })
      didCreateResult = true
      this.throwIfResumeQuizCancelled(context)
      this.logger.log(`结果保存成功: resultId=${resultId}`)
      this.emitProgress(
        progressSubject,
        80,
        '结果已保存，正在整理返回数据...',
        'saving',
      )

      // 更新消费记录为成功
      await this.consumptionRecordModel.findByIdAndUpdate(
        consumptionRecord._id,
        {
          $set: {
            status: ConsumptionStatus.SUCCESS,
            outputData: {
              resultId,
              questionCount: aiResult?.questions?.length || 0,
              totalPlannedQuestions: 10,
            },
            aiModel: this.getCurrentAiModelName(),
            completedAt: new Date(),
          },
        },
      )
      this.throwIfResumeQuizCancelled(context)
      this.logger.log(
        `消费记录已更新为成功状态: recordId=${consumptionRecord.recordId}`,
      )

      const completedPayload = {
        recordId,
        resultId,
        questions: aiResult?.questions || [],
        stageOneQuestions: aiResult?.questions || [],
        stageTwoQuestions: [],
        totalQuestions: aiResult?.questions?.length || 0,
        totalPlannedQuestions: 10,
        questionStage: 1,
        questionPlanVersion: 'two-stage-v1',
        summary: aiResult?.summary,
        // 匹配度分析
        matchScore: aiResult?.matchScore,
        matchLevel: aiResult?.matchLevel,
        matchedSkills: aiResult?.matchedSkills || [],
        missingSkills: aiResult?.missingSkills || [],
        knowledgeGaps: aiResult?.knowledgeGaps || [],
        learningPriorities: aiResult?.learningPriorities || [],
        radarData: aiResult?.radarData || [],
        strengths: aiResult?.strengths || [],
        weaknesses: aiResult?.weaknesses || [],
        interviewTips: aiResult?.interviewTips || [],
        stageTwoQuestionStatus: ResumeQuizJobStatus.IDLE,
        finalEvaluationStatus: ResumeQuizJobStatus.IDLE,
        salaryRange,
        remainingCount: await this.getRemainingCount(userId, 'resume'),
        consmptionRecordId: recordId,
      }
      this.emitProgress(
        progressSubject,
        90,
        '结果整理完成，准备返回前端展示...',
        'saving',
      )
      // 发送完成事件
      this.emitComplete(progressSubject, completedPayload)
      return completedPayload
    }
    catch (error) {
      generatingProgressHandle?.stop()
      const message = error instanceof Error ? error.message : String(error)
      const stack = error instanceof Error ? error.stack : undefined
      const isCancelled = error instanceof ResumeQuizCancelledError

      if (isCancelled) {
        this.logger.warn(`简历押题已取消: userId=${userId}, reason=${message}`)
      } else {
        this.logger.error(
          `简历押题生成失败: userId=${userId}, error=${message}`,
          stack,
        )
      }
      // 失败回滚流程
      try {
        if (didCreateResult) {
          await this.resumeQuizResultModel.deleteOne({
            resultId,
            userId,
          })
          didCreateResult = false
          this.logger.warn(`已清理未完成结果: resultId=${resultId}`)
        }

        // 1. 返还次数（最重要）
        if (didConsumeCount) {
          this.logger.log(`开始退还次数: userId=${userId}`)
          await this.refundCount(userId, 'resume')
          this.logger.log(`次数退还成功: userId=${userId}`)
        }

        // 2. 更新消费记录为失败
        if (consumptionRecord) {
          await this.consumptionRecordModel.findByIdAndUpdate(
            consumptionRecord._id,
            {
              $set: {
                status: isCancelled
                  ? ConsumptionStatus.CANCELLED
                  : ConsumptionStatus.FAILED,
                errorMessage: message,
                errorStack:
                  !isCancelled && process.env.NODE_ENV === 'development'
                    ? stack // 开发环境记录堆栈
                    : undefined, // 生产环境 基于隐私考虑不记录
                failedAt: new Date(),
                isRefunded: didConsumeCount, // 标记为退款
                refundedAt: didConsumeCount ? new Date() : undefined,
              },
            },
          )
          this.logger.log(
            `消费记录已更新为失败状态: recordId=${consumptionRecord.recordId}`,
          )
        }
      } catch (refundError) {
        // 退款失败是严重问题，需要人工介入
        this.logger.error(
          `退款流程失败，严重问题 P0！ 需要人工介入!
userId=${userId},
originalError=${message},
refundError=${refundError instanceof Error ? refundError.message : String(refundError)},
${refundError instanceof Error ? refundError.stack : ''}
`,
        )
        // TODO 后续可以添加 邮件告警等逻辑
      }

      if (isCancelled) {
        if (progressSubject && !progressSubject.closed) {
          progressSubject.complete()
        }
        return
      }

      // 发送错误事件给前端
      if (progressSubject && !progressSubject.closed) {
        progressSubject.next({
          type: 'error',
          progress: 0,
          label: '生成失败',
          message,
          error: message,
        })
        progressSubject.complete()
        return
      }

      throw error
    }
  }

  private async refundCount(
    userId: string,
    type: 'resume' | 'special' | 'behavior',
  ) {
    const field =
      type === 'resume'
        ? 'resumeRemainingCount'
        : type === 'special'
          ? 'specialRemainingCount'
          : 'behabiorRemainingCount'

    // 使用原子操作退还次数
    const result = await this.userModel.findByIdAndUpdate(
      userId,
      {
        $inc: { [field]: 1 },
      },
      { new: true },
    )
    // 验证退款是否成功
    if (!result) {
      throw new Error(`退款失败: 用户不存在 userId=${userId}`)
    }
    this.logger.log(
      `次数退还成功: userId=${userId}, type=${type}, 退还后=${result[field]}`,
    )
  }

  private delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * 在 AI 真正生成结果期间，补一条连续可见的进度时间线。
   *
   * 这里的进度不是“真实百分比”，而是面向用户体验的阶段提示：
   * - 让前端不会长时间停在 20/40%
   * - 又不和最终 80/100 的真实保存阶段冲突
   */
  private startGeneratingProgressTicker(
    progressSubject: Subject<ProgressEvent> | undefined,
    context?: ResumeQuizExecutionContext,
  ): GeneratingProgressHandle {
    if (!progressSubject) {
      return {
        stop: () => {},
      }
    }

    let stopped = false

    const progressMessages = [
      { progress: 25, message: 'AI 正在深度理解你的简历内容...' },
      { progress: 30, message: 'AI 正在分析岗位 JD 与技能匹配度...' },
      { progress: 35, message: 'AI 正在提炼你的项目亮点与风险点...' },
      { progress: 45, message: 'AI 正在设计更贴近经历的追问题目...' },
      { progress: 50, message: 'AI 正在生成题目对应的参考回答...' },
      { progress: 55, message: 'AI 正在补充关键词与考察意图...' },
      { progress: 60, message: 'AI 正在优化题目难度分布...' },
      { progress: 65, message: 'AI 正在整理匹配度分析与学习建议...' },
      { progress: 70, message: 'AI 正在做最后的内容校验...' },
      { progress: 75, message: 'AI 即将完成生成，正在收尾...' },
    ]

    const run = async () => {
      for (const item of progressMessages) {
        if (stopped || !progressSubject || progressSubject.closed || context?.cancelled) {
          return
        }

        this.emitProgress(
          progressSubject,
          item.progress,
          item.message,
          'generating',
        )

        await this.delay(900)
      }

      while (!stopped && !progressSubject.closed && !context?.cancelled) {
        this.emitProgress(
          progressSubject,
          75,
          'AI 仍在生成中，请稍候，结果马上返回...',
          'generating',
        )
        await this.delay(5000)
      }
    }

    void run()

    return {
      stop: () => {
        stopped = true
      },
    }
  }

  /**
   * 获取产品体验 剩余次数
   * @param userId
   * @param type resume 简历押题 / special 专项面试 / behavior HR 行测面试
   */
  private async getRemainingCount(
    userId: string,
    type: 'resume' | 'special' | 'behavior',
  ) {
    const user = await this.userModel.findById(userId)
    if (!user) return 0

    switch (type) {
      case 'resume':
        return user.resumeRemainingCount
      case 'special':
        return user.specialRemainingCount
      case 'behavior':
        return user.behaviorRemainingCount
      default:
        return 0
    }
  }

  /**
   * 发送进度事件
   * @param subject 进度 Subject
   * @param progress 百分比数字（0-100）
   * @param label 进度提示文本
   * @param stage 当前阶段
   */
  emitProgress(
    subject: Subject<ProgressEvent> | undefined,
    progress: number,
    label: string,
    stage?: 'prepare' | 'generating' | 'saving' | 'done',
  ) {
    if (subject && !subject.closed) {
      subject.next({
        type: 'progress',
        progress: Math.min(Math.max(progress, 0), 100), // 确保进度在0-100之间
        label,
        message: label,
        stage,
      })
    }
  }

  private throwIfResumeQuizCancelled(context?: ResumeQuizExecutionContext) {
    if (context?.cancelled) {
      throw new ResumeQuizCancelledError()
    }
  }

  private async generateResumeQuizStageOneResult(
    dto: ResumeQuizDto,
    resumeContent: string,
    salaryRange: string,
  ) {
    const questionPrompt = PromptTemplate.fromTemplate(
      RESUME_QUIZ_PROMPT_STAGE_ONE_QUESTIONS,
    )
    const analysisPrompt = PromptTemplate.fromTemplate(
      RESUME_QUIZ_PROMPT_ANALYSIS_ONLY,
    )

    const [questionResult, analysisResult] = await Promise.all([
      questionPrompt
        .pipe(this.aiModelFactory.createCreativeModel())
        .pipe(this.resumeQuizStageOneQuestionsParser)
        .invoke({
          company: dto.company || '未提供',
          positionName: dto.positionName,
          salaryRange,
          jd: dto.jd,
          resumeContent,
          format_instructions:
            this.resumeQuizStageOneQuestionsParser.getFormatInstructions(),
        }),
      analysisPrompt
        .pipe(this.aiModelFactory.createStableModel())
        .pipe(this.resumeQuizAnalysisParser)
        .invoke({
          company: dto.company || '未提供',
          positionName: dto.positionName,
          salaryRange,
          jd: dto.jd,
          resumeContent,
          format_instructions:
            this.resumeQuizAnalysisParser.getFormatInstructions(),
        }),
    ])

    return {
      ...questionResult,
      ...analysisResult,
      questions: this.normalizeGeneratedQuestions(questionResult.questions),
      matchedSkills: analysisResult.matchedSkills.map((item) => ({
        skill: item.skill,
        matched: item.matched,
        proficiency: item.proficiency || undefined,
      })),
      learningPriorities: this.normalizeLearningPriorities(
        analysisResult.learningPriorities,
      ),
      radarData: analysisResult.radarData.map((item) => ({
        dimension: item.dimension,
        score: item.score,
        description: item.description || undefined,
      })),
    }
  }

  private async generateResumeQuizStageTwoQuestions(payload: {
    company: string
    positionName: string
    salaryRange: string
    jd: string
    resumeContent: string
    stageOneQuestions: Array<{
      question: string
      answer: string
      category?: string
      difficulty?: string
      tips?: string
      keywords?: string[]
      reasoning?: string
    }>
    stageOneAnswers: string[]
    supplementaryContext?: string
  }): Promise<ResumeQuizGeneratedQuestions> {
    const prompt = PromptTemplate.fromTemplate(
      RESUME_QUIZ_PROMPT_STAGE_TWO_QUESTIONS,
    )

    const stageOnePairs = payload.stageOneQuestions.map((question, index) => ({
      questionIndex: index + 1,
      question: question.question,
      referenceAnswer: question.answer,
      userAnswer: payload.stageOneAnswers[index] || '',
      tips: question.tips || '',
    }))
    const answerQualityNotes = this.buildStageOneAnswerQualityNotes(
      payload.stageOneQuestions,
      payload.stageOneAnswers,
    )

    const generated = await prompt
      .pipe(this.aiModelFactory.createCreativeModel())
      .pipe(this.resumeQuizStageTwoQuestionsParser)
      .invoke({
        company: payload.company,
        positionName: payload.positionName,
        salaryRange: payload.salaryRange,
        jd: payload.jd,
        resumeContent: payload.resumeContent,
        stage_one_pairs: JSON.stringify(stageOnePairs),
        answer_quality_notes: answerQualityNotes,
        supplementary_context: this.normalizeSupplementaryContext(
          payload.supplementaryContext,
        ),
        format_instructions:
          this.resumeQuizStageTwoQuestionsParser.getFormatInstructions(),
      })

    return {
      questions: this.normalizeGeneratedQuestions(generated.questions),
      summary: generated.summary,
    }
  }

  private normalizeGeneratedQuestions(
    questions: Array<{
      question: string
      answer: string
      category?: string
      difficulty?: string
      tips?: string | null
      keywords?: string[]
      reasoning?: string | null
    }>,
  ): ResumeQuizGeneratedQuestions['questions'] {
    return questions.map((item) => ({
      question: item.question,
      answer: item.answer,
      category: this.normalizeQuestionCategory(item.category),
      difficulty: this.normalizeQuestionDifficulty(item.difficulty),
      tips: item.tips || '',
      keywords: item.keywords || [],
      reasoning: item.reasoning || '',
    }))
  }

  private getAllQuestions(result: ResumeQuizResultDocument | ResumeQuizResult) {
    const stageOneQuestions = result.stageOneQuestions?.length
      ? result.stageOneQuestions
      : (result.questions || []).slice(0, 7)
    const stageTwoQuestions = result.stageTwoQuestions || []

    return [...stageOneQuestions, ...stageTwoQuestions]
  }

  private buildStageTwoQuestionsPayload(
    recordId: string,
    result: ResumeQuizResultDocument | ResumeQuizResult,
  ): ResumeQuizStageTwoJobPayload {
    return {
      recordId,
      resultId: result.resultId,
      status:
        result.stageTwoQuestionStatus || ResumeQuizJobStatus.IDLE,
      jobId: result.stageTwoQuestionJobId,
      questions:
        result.stageTwoQuestionStatus === ResumeQuizJobStatus.COMPLETED
          ? (result.stageTwoQuestions || []).map((item) => ({
              question: item.question,
              answer: item.answer,
              category: item.category,
              difficulty: item.difficulty,
              tips: item.tips || '',
              keywords: item.keywords || [],
              reasoning: item.reasoning || '',
            }))
          : [],
      cachedAt: result.stageTwoQuestionCachedAt?.toISOString(),
      errorMessage: result.stageTwoQuestionErrorMessage,
    }
  }

  private buildFinalEvaluationPayload(
    recordId: string,
    result: ResumeQuizResultDocument | ResumeQuizResult,
  ): ResumeQuizFinalEvaluationPayload {
    return {
      recordId,
      resultId: result.resultId,
      status:
        result.finalEvaluationStatus || ResumeQuizJobStatus.IDLE,
      jobId: result.finalEvaluationJobId,
      userAnswers: result.userAnswers || [],
      questionAnalyses:
        result.finalEvaluationStatus === ResumeQuizJobStatus.COMPLETED
          ? result.questionAnalyses || []
          : [],
      overallEvaluation:
        result.finalEvaluationStatus === ResumeQuizJobStatus.COMPLETED
          ? result.overallEvaluation
          : undefined,
      radarData:
        result.finalEvaluationStatus === ResumeQuizJobStatus.COMPLETED
          ? result.radarData || []
          : [],
      cachedAt: result.answerAnalysisCachedAt?.toISOString(),
      errorMessage: result.finalEvaluationErrorMessage,
    }
  }

  private async runStageTwoQuestionsJob(payload: {
    userId: string
    recordId: string
    resultId: string
    jobId: string
    stageOneAnswers: string[]
    supplementaryContext?: string
  }) {
    const result = await this.resumeQuizResultModel.findOne({
      userId: payload.userId,
      resultId: payload.resultId,
    })

    if (!result || result.stageTwoQuestionJobId !== payload.jobId) {
      return
    }

    try {
      result.stageTwoQuestionStatus = ResumeQuizJobStatus.RUNNING
      result.stageTwoQuestionErrorMessage = undefined
      await result.save()

      const stageOneQuestions = result.stageOneQuestions?.length
        ? result.stageOneQuestions
        : (result.questions || []).slice(0, 7)

      const generated = await this.generateResumeQuizStageTwoQuestions({
        company: result.company || '未提供',
        positionName: result.position || '未提供',
        salaryRange: result.salaryRange || '面议',
        jd: result.jobDescription || '未提供',
        resumeContent: result.resumeSnapshot || '未提供',
        stageOneQuestions,
        stageOneAnswers: payload.stageOneAnswers,
        supplementaryContext: payload.supplementaryContext,
      })

      result.stageTwoQuestions = generated.questions
      result.questions = [...stageOneQuestions, ...generated.questions]
      result.totalQuestions = result.questions.length
      result.questionStage = 2
      result.summary = generated.summary || result.summary
      result.stageTwoQuestionStatus = ResumeQuizJobStatus.COMPLETED
      result.stageTwoQuestionCachedAt = new Date()
      result.stageTwoQuestionErrorMessage = undefined
      result.finalEvaluationStatus = ResumeQuizJobStatus.IDLE
      result.finalEvaluationJobId = undefined
      result.finalEvaluationErrorMessage = undefined
      result.questionAnalyses = []
      result.overallEvaluation = undefined
      result.answerAnalysisCachedAt = undefined
      await result.save()
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      this.logger.error(
        `生成第 2 阶段定制题失败: recordId=${payload.recordId}, error=${message}`,
        error instanceof Error ? error.stack : undefined,
      )

      result.stageTwoQuestionStatus = ResumeQuizJobStatus.FAILED
      result.stageTwoQuestionErrorMessage = message
      await result.save()
    }
  }

  private async runFinalEvaluationJob(payload: {
    userId: string
    recordId: string
    resultId: string
    jobId: string
    answers: string[]
  }) {
    const result = await this.resumeQuizResultModel.findOne({
      userId: payload.userId,
      resultId: payload.resultId,
    })

    if (!result || result.finalEvaluationJobId !== payload.jobId) {
      return
    }

    try {
      result.finalEvaluationStatus = ResumeQuizJobStatus.RUNNING
      result.finalEvaluationErrorMessage = undefined
      await result.save()

      const generated = await this.generateResumeQuizAnswerAnalysis({
        company: result.company || '未提供',
        positionName: result.position || '未提供',
        salaryRange: result.salaryRange || '面议',
        jd: result.jobDescription || '未提供',
        resumeContent: result.resumeSnapshot || '未提供',
        questions: this.getAllQuestions(result),
        answers: payload.answers,
      })

      result.userAnswers = payload.answers
      result.userAnswersStageOne = payload.answers.slice(0, 7)
      result.userAnswersStageTwo = payload.answers.slice(7)
      result.questionAnalyses = generated.questionAnalyses
      result.overallEvaluation = generated.overallEvaluation
      result.radarData = generated.radarData
      result.answerAnalysisCachedAt = new Date()
      result.finalEvaluationStatus = ResumeQuizJobStatus.COMPLETED
      result.finalEvaluationErrorMessage = undefined
      await result.save()
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      this.logger.error(
        `生成最终综合评价失败: recordId=${payload.recordId}, error=${message}`,
        error instanceof Error ? error.stack : undefined,
      )

      result.finalEvaluationStatus = ResumeQuizJobStatus.FAILED
      result.finalEvaluationErrorMessage = message
      await result.save()
    }
  }

  private normalizeUserAnswers(answers: string[]) {
    return answers.map(answer => String(answer || '').trim())
  }

  private buildStageOneAnswerQualityNotes(
    questions: Array<{
      question: string
      category?: string
      difficulty?: string
    }>,
    answers: string[],
  ) {
    const weakSignals = [
      '不知道',
      '不清楚',
      '忘了',
      '没有',
      '不会',
      '放弃',
      '算了',
      '开玩笑',
      '哈哈',
      '555',
    ]
    const actionSignals = [
      '负责',
      '实现',
      '优化',
      '设计',
      '重构',
      '排查',
      '推动',
      '落地',
      '上线',
      '解决',
    ]
    const metricPattern = /\d+(?:\.\d+)?\s*(%|ms|秒|分钟|小时|天|周|月|年|人|次|个|k|w)/i

    const details = questions.map((question, index) => {
      const answer = String(answers[index] || '').trim()
      const hasWeakSignal = weakSignals.some(signal => answer.includes(signal))
      const hasActionSignal = actionSignals.some(signal => answer.includes(signal))
      const hasMetricSignal = metricPattern.test(answer)
      const answerLength = answer.length

      let quality = 'medium'
      let reason = '回答有一定信息量，但还可以继续深挖细节'

      if (!answer || answerLength < 20 || hasWeakSignal) {
        quality = 'low'
        reason = '回答偏短、偏虚或存在明显回避信号，更适合做澄清型追问'
      } else if (answerLength < 80 || (!hasActionSignal && !hasMetricSignal)) {
        quality = 'low'
        reason = '回答缺少具体行动或量化结果，应优先追问真实项目细节'
      } else if (answerLength >= 160 && hasActionSignal && hasMetricSignal) {
        quality = 'high'
        reason = '回答较具体，包含行动和结果，可以适当提高问题难度'
      }

      return {
        index: index + 1,
        category: question.category || 'unknown',
        difficulty: question.difficulty || 'unknown',
        quality,
        answerLength,
        answerPreview: answer.slice(0, 80) || '未作答',
        reason,
      }
    })

    const lowCount = details.filter(item => item.quality === 'low').length
    const highCount = details.filter(item => item.quality === 'high').length
    const overallAdvice
      = lowCount >= 3
        ? '整体回答质量偏弱，第 2 阶段应以澄清真实项目事实、拆解个人贡献和补齐量化结果为主，不要直接跳到泛化的大型架构题。'
        : highCount >= 3
          ? '整体回答较扎实，第 2 阶段可以在保留针对性的前提下适度提高深度和压力。'
          : '整体回答质量中等，第 2 阶段需要在项目细节追问和岗位关键能力验证之间保持平衡。'

    return JSON.stringify({
      overallAdvice,
      lowCount,
      highCount,
      details,
    })
  }

  private normalizeSupplementaryContext(value?: string) {
    const normalized = String(value || '').trim()
    return normalized || '无额外补充说明'
  }

  private async generateResumeQuizAnswerAnalysis(payload: {
    company: string
    positionName: string
    salaryRange: string
    jd: string
    resumeContent: string
    questions: Array<{
      question: string
      answer: string
    }>
    answers: string[]
  }): Promise<{
    questionAnalyses: QuestionAnswerAnalysis[]
    overallEvaluation: OverallEvaluation
    radarData: RadarDimension[]
  }> {
    const prompt = PromptTemplate.fromTemplate(
      RESUME_QUIZ_ANSWER_ANALYSIS_PROMPT,
    )

    const questionAnswerPairs = payload.questions.map((item, index) => ({
      questionIndex: index,
      question: item.question,
      referenceAnswer: item.answer,
      userAnswer: payload.answers[index] || '',
    }))

    const analysisResult = await prompt
      .pipe(this.aiModelFactory.createStableModel())
      .pipe(this.resumeQuizAnswerAnalysisParser)
      .invoke({
        company: payload.company,
        positionName: payload.positionName,
        salaryRange: payload.salaryRange,
        jd: payload.jd,
        resumeContent: payload.resumeContent,
        question_answer_pairs: JSON.stringify(questionAnswerPairs),
        format_instructions:
          this.resumeQuizAnswerAnalysisParser.getFormatInstructions(),
      })

    const indexedAnalyses = new Map(
      analysisResult.questionAnalyses.map((item, index) => [
        typeof item.questionIndex === 'number' ? item.questionIndex : index,
        item,
      ]),
    )

    return {
      questionAnalyses: questionAnswerPairs.map((pair, index) => {
        const item = indexedAnalyses.get(index)

        return {
          questionIndex: index,
          question: item?.question || pair.question,
          userAnswer: item?.userAnswer || pair.userAnswer,
          referenceAnswer: item?.referenceAnswer || pair.referenceAnswer,
          score: Math.round(item?.score ?? 0),
          feedback: item?.feedback || '本题暂无更多点评，请结合参考答案继续补强。',
          strengths: item?.strengths || [],
          improvements: item?.improvements || [],
        }
      }),
      overallEvaluation: {
        overallScore: Math.round(analysisResult.overallEvaluation.overallScore),
        summary: analysisResult.overallEvaluation.summary,
        strengths: analysisResult.overallEvaluation.strengths || [],
        weaknesses: analysisResult.overallEvaluation.weaknesses || [],
        suggestions: analysisResult.overallEvaluation.suggestions || [],
        readiness: analysisResult.overallEvaluation.readiness || undefined,
      },
      radarData: (analysisResult.radarData || []).map((item) => ({
        dimension: item.dimension,
        score: Math.round(item.score),
        description: item.description || undefined,
      })),
    }
  }

  private formatSalaryRange(minSalary?: number, maxSalary?: number): string {
    if (minSalary && maxSalary) {
      return `${minSalary}-${maxSalary}K`
    }

    if (minSalary) {
      return `${minSalary}K+`
    }

    if (maxSalary) {
      return `<=${maxSalary}K`
    }

    return '面议'
  }

  private normalizeLearningPriorities(
    items?: Array<{
      topic?: string
      priority?: string
      reason?: string
    }> | null,
  ) {
    return (items || [])
      .filter(
        (item) =>
          Boolean(item?.topic) &&
          Boolean(item?.priority) &&
          Boolean(item?.reason),
      )
      .map((item) => ({
        topic: item.topic as string,
        priority: item.priority as string,
        reason: item.reason as string,
      }))
  }

  private normalizeQuestionCategory(category?: string): QuestionCategory {
    const normalized = this.normalizeAiLabel(category)

    if (normalized.includes('project') || normalized.includes('项目')) {
      return QuestionCategory.PROJECT
    }

    if (
      normalized.includes('problem-solving') ||
      normalized.includes('problem solving') ||
      normalized.includes('scenario') ||
      normalized.includes('case') ||
      normalized.includes('问题解决') ||
      normalized.includes('场景')
    ) {
      return QuestionCategory.PROBLEM_SOLVING
    }

    if (
      normalized.includes('behavior') ||
      normalized.includes('软技能') ||
      normalized.includes('沟通') ||
      normalized.includes('协作') ||
      normalized.includes('行为')
    ) {
      return QuestionCategory.BEHAVIORAL
    }

    return QuestionCategory.TECHNICAL
  }

  private normalizeQuestionDifficulty(difficulty?: string): QuestionDifficulty {
    const normalized = this.normalizeAiLabel(difficulty)

    if (
      normalized.includes('hard') ||
      normalized.includes('困难') ||
      normalized.includes('高难') ||
      normalized.includes('压力')
    ) {
      return QuestionDifficulty.HARD
    }

    if (
      normalized.includes('easy') ||
      normalized.includes('简单') ||
      normalized.includes('基础') ||
      normalized.includes('暖场')
    ) {
      return QuestionDifficulty.EASY
    }

    return QuestionDifficulty.MEDIUM
  }

  private normalizeAiLabel(value?: string): string {
    return (value || '')
      .trim()
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
      .replace(/\s+/g, ' ')
  }

  private getCurrentAiModelName(): string {
    return (
      this.configService.get<string>('QINIU_AI_MODEL') ||
      this.configService.get<string>('DEEPSEEK_MODEL') ||
      'deepseek-chat'
    )
  }

  /**
   * 提取简历内容：支持 text / 结构化简历 / 上传文件（pdf、word）
   */
  private async extractResumeContent(userId: string, dto: ResumeQuizDto) {
    // 优先1 如果直接提供简历文本，则直接使用
    if (dto.resumeContent) {
      this.logger.log(
        `使用直接提供的简历文本, 长度 ${dto.resumeContent.length} 字符`,
      )
      return dto.resumeContent
    }
    // 若提供 resumeId 尝试查询
    if (dto.resumeURL) {
      try {
        // 1. 从url下载文件
        const rawText = await this.documentParserService.parseDocumentFromUrl(
          dto.resumeURL,
        )
        // 2. 清理文本（移除格式化符号等）
        const cleanedText = this.documentParserService.cleanText(rawText)
        // 3. 验证内容质量
        const validation =
          this.documentParserService.validateResumeContent(cleanedText)

        if (!validation.isValid) {
          throw new BadRequestException(validation.reason)
        }
        // 4. 记录任何警告
        if (validation.warnings && validation.warnings.length > 0) {
          this.logger.warn(`简历解析警告: ${validation.warnings.join('; ')}`)
        }
        // 5. 检查内容长度 (避免超长内容)
        const estimatedTokens =
          this.documentParserService.estimateTokens(cleanedText)

        if (estimatedTokens > 6000) {
          this.logger.warn(
            `简历内容过长: ${estimatedTokens} tokens, 将进行截断`,
          )
          // 截取前 6000 tokens 对应的字符
          const maxChars = 6000 * 1.5 // TODO 约9000字符 这里写死的，应该生产正确预估出来
          const truncatedText = cleanedText.substring(0, maxChars)
          this.logger.log(
            `简历已截断，原长度 ${cleanedText.length} 字符, 截断后 ${truncatedText.length} 字符；Tokens 用量约 ${estimatedTokens}`,
          )
          return truncatedText
        }

        return cleanedText
      } catch (error) {
        // 文件解析失败，返回友好的错误信息
        if (error instanceof BadRequestException) throw error
        this.logger.log(
          `解析简历失败: resumeId=${dto.resumeId}, error=${error.message}`,
          error.stack,
        )

        throw new BadRequestException(
          '简历文件解析失败，您可直接粘贴简历文本，或者上传 pdf、doc、docx、md 文件，且未加密和损坏',
        )
      }
    }

    throw new BadRequestException('请提供简历内容或可访问的简历 URL')
  }

  private tryParseAnalysis(content?: string) {
    if (!content) return null

    try {
      const parsed = JSON.parse(content)
      return parsed && typeof parsed === 'object' ? parsed : null
    } catch {
      return null
    }
  }
}
