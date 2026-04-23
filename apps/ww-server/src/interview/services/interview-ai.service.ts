import { PromptTemplate } from '@langchain/core/prompts'
import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { AIModelFactory } from '../../ai/services/ai-model.factory'
import {
  RESUME_QUIZ_PROMPT_ANALYSIS_ONLY,
  RESUME_QUIZ_PROMPT_QUESTIONS_ONLY,
} from '../prompts/resume-quiz.prompts'
import { JsonOutputParser } from '@langchain/core/output_parsers'
import {
  FORMAT_INSTRUCTIONS_ANALYSIS_ONLY,
  FORMAT_INSTRUCTIONS_QUESTIONS_ONLY,
} from '../prompts/format-instructions.prompts'

/**
 * 简历押题输入
 */
export interface ResumeQuizInput {
  company: string
  positionName: string
  minSalary?: number
  maxSalary?: number
  jd: string
  resumeContent: string
  promptVersion?: string
}

/**
 * 简历押题输出
 */
export interface ResumeQuizOutput {
  // 面试问题
  questions: Array<{
    question: string
    answer: string
    category: string
    difficulty: string
    tips: string
    keywords?: string[]
    reasoning?: string
  }>

  // 综合评估
  summary: string

  // 匹配度分析
  matchScore: number
  matchLevel: string

  // 技能分析
  matchedSkills: Array<{
    skill: string
    matched: boolean
    proficiency?: string
  }>
  missingSkills: string[]

  // 知识补充建议
  knowledgeGaps: string[]
  learningPriorities: Array<{
    topic: string
    priority: 'high' | 'medium' | 'low'
    reason: string
  }>

  // 雷达图数据
  radarData: Array<{
    dimension: string
    score: number
    description?: string
  }>

  // 优势与劣势
  strengths: string[]
  weaknesses: string[]

  // 面试准备建议
  interviewTips: string[]

  // Token 使用情况
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

/**
 * 面试 AI 服务
 * 封装 LangChain + DeepSeek 的调用
 */
@Injectable()
export class InterviewAIService {
  private readonly logger = new Logger(InterviewAIService.name)

  constructor(
    private readonly configService: ConfigService,
    private aiModelFactory: AIModelFactory,
  ) {}

  /**
   * 生成简历押题 - 仅押题部分（问题 + 综合预估）
   * 返回：问题列表 + 综合评估 summary
   */
  async generateResumeQuizQuestionOnly(
    input: ResumeQuizInput,
  ): Promise<{ questions: any[]; summary: string }> {
    const startTime = Date.now()
    try {
      // 1. 后续 AI 流程类似，都是先构建 prompt
      const prompt = PromptTemplate.fromTemplate(
        RESUME_QUIZ_PROMPT_QUESTIONS_ONLY,
      )
      // 2. 创建输出解析器 JsonOutputParser 会自动解析 AI 返回的 JSON
      const parser = new JsonOutputParser()
      // 3. 构建链
      const model = this.aiModelFactory.createDefaultModel()
      const chain = prompt.pipe(model).pipe(parser)
      // 4. 准备参数
      const salaryRange =
        input.minSalary && input.maxSalary
          ? `${input.minSalary}K-${input.maxSalary}K`
          : input.minSalary
            ? `${input.minSalary}K起`
            : input.maxSalary
              ? `${input.maxSalary}K封顶`
              : '面议'

      const params = {
        company: input?.company || '',
        positionName: input.positionName,
        salaryRange,
        jd: input.jd,
        resumeContent: input.resumeContent,
        format_instructions: FORMAT_INSTRUCTIONS_QUESTIONS_ONLY,
      }
      this.logger.log(
        `[押题部分]开始生成: company=${params.company}, position=${params.positionName}`,
      )
      // 5. 调用 AI
      const rawResult = await chain.invoke(params)
      // 6. 验证结果 - 虽然我们暂无 zod 验证（后面加）这里临时做基本检查
      if (!Array.isArray(rawResult.questions)) {
        throw new Error('AI 返回的结果中 questions 不是数组')
      }

      if (rawResult.questions.length < 7) {
        throw new Error(
          `AI返回的问题数量不足: ${rawResult.questions.length} (当前不足7个问题)`,
        )
      }

      const duration = Date.now() - startTime
      this.logger.log(
        `[押题部分]生成成功: 耗时=${duration}ms, 问题数量=${rawResult.questions.length || 0}`,
      )
      return rawResult as { questions: any[]; summary: string }
    } catch (error) {
      const duration = Date.now() - startTime
      this.logger.log(
        `[押题部分]生成成功: 耗时=${duration}ms, 错误=${error.message}`,
      )
      throw error
    }
  }

  /**
   * 生成简历押题 - 仅匹配度分析部分
   * 返回：匹配度、技能分析、学习建议、雷达图等
   */
  async generateResumeQuizAnalysisOnly(input: ResumeQuizInput) {
    const startTime = Date.now()
    try {
      // 流程与上面类似
      const prompt = PromptTemplate.fromTemplate(
        RESUME_QUIZ_PROMPT_ANALYSIS_ONLY,
      )
      const parser = new JsonOutputParser()
      const model = this.aiModelFactory.createDefaultModel()
      const chain = prompt.pipe(model).pipe(parser)

      const salaryRange =
        input.minSalary && input.maxSalary
          ? `${input.minSalary}K-${input.maxSalary}K`
          : input.minSalary
            ? `${input.minSalary}K起`
            : input.maxSalary
              ? `${input.maxSalary}K封顶`
              : '面议'

      const params = {
        company: input?.company || '',
        positionName: input.positionName,
        salaryRange,
        jd: input.jd,
        resumeContent: input.resumeContent,
        format_instructions: FORMAT_INSTRUCTIONS_ANALYSIS_ONLY,
      }
      this.logger.log(
        `[匹配度分析]开始生成: company=${params.company}, position=${params.positionName}`,
      )

      const result = await chain.invoke(params)
      const duration = Date.now() - startTime
      this.logger.log(`[匹配度分析] 生成成功, 耗时 = ${duration} ms`)
      return result
    } catch (error) {
      const duration = Date.now() - startTime
      this.logger.log(
        `[匹配度分析] 生成失败, 耗时 = ${duration} ms, 错误原因: ${error.message}`,
      )
      throw error
    }
  }
}
