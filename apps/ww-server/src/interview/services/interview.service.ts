import { DocumentParserService } from './document-parser.service'
import { v4 as uuidv4 } from 'uuid'
import { ConversationContinuationService } from './conversation-continuation.service'
import { BadRequestException, Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { SessionManager } from './../../ai/services/session.manager'
import { ResumeAnalysisService } from './resume-analysis.service'
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
  QuestionCategory,
  QuestionDifficulty,
  ResumeQuizResult,
  ResumeQuizResultDocument,
} from '../schemas/interview-quiz-result.schema'
import { User, UserDocument } from '../../user/schemas/user.schema'
import {
  RESUME_QUIZ_PROMPT_ANALYSIS_ONLY,
  RESUME_QUIZ_PROMPT_QUESTIONS_ONLY,
} from '../prompts/resume-quiz.propmts'

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

  private readonly resumeQuizQuestionsParser = StructuredOutputParser.fromZodSchema(
    z.object({
      questions: z.array(this.resumeQuizQuestionSchema).min(1).max(12),
      summary: z.string(),
    }),
  )

  private readonly resumeQuizAnalysisParser = StructuredOutputParser.fromZodSchema(
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

  /**
   * 生成简历押题（带流式进度）
   * @param userId
   * @param dto ResumeQuizDto
   * @returns Subject<ProgressEvent> 流式事件
   */
  generateResumeQuizWithProgress(
    userId: string,
    dto: ResumeQuizDto,
  ): Subject<ProgressEvent> {
    const subject = new Subject<ProgressEvent>()
    // 推迟到当前调用栈结束后再开始推送，避免首条事件在 subscribe 之前丢失
    queueMicrotask(() => {
      void this.executeResumeQuiz(userId, dto, subject)
    })
    return subject
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
  ) {
    let consumptionRecord: any = null
    let didConsumeCount = false
    const recordId = uuidv4()
    const resultId = uuidv4()

    try {
      // 先进行幂等性检查 - 优化中最关键点一步，防止重复生成
      if (dto.requestId) {
        // 查库中是否存在 requestId 记录
        const existingRecord = await this.consumptionRecordModel.findOne({
          userId,
          'metadata.requestId': dto.requestId,
          status: {
            $in: [ConsumptionStatus.SUCCESS, ConsumptionStatus.PENDING],
          },
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
          }

          // 查询之前生成的结果
          const existingResult = await this.resumeQuizResultModel.findOne({
            resultId: existingRecord.resultId,
          })

          if (!existingResult) throw new BadRequestException('结果不存在')

          const cachedPayload = {
            resultId: existingResult.resultId,
            questions: existingResult.questions,
            summary: existingResult.summary,
            matchScore: existingResult.matchScore,
            matchLevel: existingResult.matchLevel,
            matchedSkills: existingResult.matchedSkills,
            missingSkills: existingResult.missingSkills,
            knowledgeGaps: existingResult.knowledgeGaps,
            learningPriorities: existingResult.learningPriorities,
            radarData: existingResult.radarData,
            strengths: existingResult.strengths,
            weaknesses: existingResult.weaknesses,
            interviewTips: existingResult.interviewTips,
            remainingCount: await this.getRemainingCount(userId, 'resume'),
            consmptionRecordId: existingRecord.recordId,
            isFromCache: true,
          }

          this.emitComplete(progressSubject, cachedPayload)

          // 直接返回，不再执行后续步骤，不再扣费
          return cachedPayload
        }
      }

      this.emitProgress(progressSubject, 5, '正在校验请求参数...', 'prepare')

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

      this.logger.log(
        `用户扣费成功: userId=${userId}, 扣费前=${user.resumeRemainingCount}, 扣费后=${user.resumeRemainingCount - 1}`,
      )
      this.emitProgress(progressSubject, 20, '已校验剩余次数，开始生成押题...', 'prepare')

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
          resumeId: dto.resumeId,
        },
        resultId, // 结果ID（后面再生成）
        metadata: {
          requestId: dto.requestId, // 幂等性检查 - 请求ID
          promptVersion: dto.promptVersion,
        },
        startedAt: new Date(),
      })
      this.logger.log(`消费记录创建成功: recordId=${recordId}`)
      this.emitProgress(progressSubject, 40, '已创建消费记录，正在生成结果...', 'generating')

      // 如果没有 requestId 或 requestId 不存在，则继续执行正常的生成流程逻辑
      this.logger.log(
        `开始生成简历押题 userId=${userId}, positionName=${dto.positionName}`,
      )
      const resumeContent = await this.extractResumeContent(userId, dto)
      const salaryRange = this.formatSalaryRange(dto.minSalary, dto.maxSalary)
      const aiResult = await this.generateResumeQuizResult(
        dto,
        resumeContent,
        salaryRange,
      )
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
        questions: aiResult?.questions || [],
        totalQuestions: aiResult?.questions?.length || 0,
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
      this.logger.log(`结果保存成功: resultId=${resultId}`)
      this.emitProgress(progressSubject, 80, '结果已保存，正在整理返回数据...', 'saving')

      // 更新消费记录为成功
      await this.consumptionRecordModel.findByIdAndUpdate(
        consumptionRecord._id,
        {
          $set: {
            status: ConsumptionStatus.SUCCESS,
            outputData: {
              resultId,
              questionCount: aiResult?.questions?.length || 0,
            },
            aiModel: this.getCurrentAiModelName(),
            completedAt: new Date(),
          },
        },
      )
      this.logger.log(
        `消费记录已更新为成功状态: recordId=${consumptionRecord.recordId}`,
      )

      const completedPayload = {
        resultId,
        questions: aiResult?.questions || [],
        summary: aiResult?.summary,
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
        salaryRange,
        remainingCount: await this.getRemainingCount(userId, 'resume'),
        consmptionRecordId: recordId,
      }

      this.emitComplete(progressSubject, completedPayload)
      return completedPayload
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      const stack = error instanceof Error ? error.stack : undefined

      this.logger.error(
        `简历押题生成失败: userId=${userId}, error=${message}`,
        stack,
      )
      // 失败回滚流程
      try {
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
                status: ConsumptionStatus.FAILED, // 标记为失败
                errorMessage: message,
                errorStack:
                  process.env.NODE_ENV === 'development'
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

  /**
   * 生成不同阶段的用户友好提示信息
   * @returns
   */
  private async getStagePrompt(
    progressSubject: Subject<ProgressEvent> | undefined,
  ) {
    if (!progressSubject) return
    // 定义不同阶段的提示信息
    const progressMessages = [
      // 0-20% 理解阶段
      { progress: 0.05, message: '🤖 AI 正在深度理解您的简历内容...' },
      { progress: 0.1, message: '📊 AI 正在分析您的技术栈和项目经验...' },
      { progress: 0.15, message: '🔍 AI 正在识别您的核心竞争力...' },
      { progress: 0.2, message: '📋 AI 正在对比岗位要求与您的背景...' },

      // 20-50% 设计问题阶段
      { progress: 0.25, message: '💡 AI 正在设计针对性的技术问题...' },
      { progress: 0.3, message: '🎯 AI 正在挖掘您简历中的项目亮点...' },
      { progress: 0.35, message: '🧠 AI 正在构思场景化的面试问题...' },
      { progress: 0.4, message: '⚡ AI 正在设计不同难度的问题组合...' },
      { progress: 0.45, message: '🔬 AI 正在分析您的技术深度和广度...' },
      { progress: 0.5, message: '📝 AI 正在生成基于 STAR 法则的答案...' },

      // 50-70% 优化阶段
      { progress: 0.55, message: '✨ AI 正在优化问题的表达方式...' },
      { progress: 0.6, message: '🎨 AI 正在为您准备回答要点和技巧...' },
      { progress: 0.65, message: '💎 AI 正在提炼您的项目成果和亮点...' },
      { progress: 0.7, message: '🔧 AI 正在调整问题难度分布...' },
      // 70-90% 完善阶段
      { progress: 0.75, message: '📚 AI 正在补充技术关键词和考察点...' },
      { progress: 0.8, message: '🎓 AI 正在完善综合评估建议...' },
      { progress: 0.85, message: '🚀 AI 正在做最后的质量检查...' },
      { progress: 0.9, message: '✅ AI 即将完成问题生成...' },
    ]

    for (const item of progressMessages) {
      if (!progressSubject || progressSubject.closed) {
        this.logger.warn('简历押题流已关闭，停止继续推送进度')
        return
      }

      this.emitProgress(
        progressSubject,
        Math.round(item.progress * 100),
        item.message,
        'generating',
      )

      const delay = (ms: number) => {
        return new Promise((resolve) => setTimeout(resolve, ms))
      }
      await delay(1000)
    }

    if (progressSubject && !progressSubject.closed) {
      progressSubject.next({
        type: 'complete',
        progress: 100,
        label: 'AI 已完成问题生成',
        message: 'AI 已完成问题生成',
        stage: 'done',
        data: {
          questions: [],
          analysis: [],
        },
      })
      progressSubject.complete()
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

  private async generateResumeQuizResult(
    dto: ResumeQuizDto,
    resumeContent: string,
    salaryRange: string,
  ) {
    const questionPrompt = PromptTemplate.fromTemplate(
      RESUME_QUIZ_PROMPT_QUESTIONS_ONLY,
    )
    const analysisPrompt = PromptTemplate.fromTemplate(
      RESUME_QUIZ_PROMPT_ANALYSIS_ONLY,
    )

    const [questionResult, analysisResult] = await Promise.all([
      questionPrompt
        .pipe(this.aiModelFactory.createCreativeModel())
        .pipe(this.resumeQuizQuestionsParser)
        .invoke({
          company: dto.company || '未提供',
          positionName: dto.positionName,
          salaryRange,
          jd: dto.jd,
          resumeContent,
          format_instructions:
            this.resumeQuizQuestionsParser.getFormatInstructions(),
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
      questions: questionResult.questions.map((item) => ({
        question: item.question,
        answer: item.answer,
        category: this.normalizeQuestionCategory(item.category),
        difficulty: this.normalizeQuestionDifficulty(item.difficulty),
        tips: item.tips || '',
        keywords: item.keywords || [],
        reasoning: item.reasoning || '',
      })),
      matchedSkills: analysisResult.matchedSkills.map((item) => ({
        skill: item.skill,
        matched: item.matched,
        proficiency: item.proficiency || undefined,
      })),
      radarData: analysisResult.radarData.map((item) => ({
        dimension: item.dimension,
        score: item.score,
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

  private normalizeQuestionCategory(category?: string): QuestionCategory {
    const normalized = this.normalizeAiLabel(category)

    if (
      normalized.includes('project') ||
      normalized.includes('项目')
    ) {
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

  private normalizeQuestionDifficulty(
    difficulty?: string,
  ): QuestionDifficulty {
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
          '简历文件解析失败，您可直接粘贴简历文本，或者上传 pdf 或 docx 文件，且未加密和损坏',
        )
      }
    }

    throw new BadRequestException('请提供简历内容或可访问的简历 URL')
  }
}
