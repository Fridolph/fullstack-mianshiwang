import { PromptTemplate } from '@langchain/core/prompts'
import { JsonOutputParser } from '@langchain/core/output_parsers'
import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { AIModelFactory } from 'src/ai/services/ai-model.factory'
import { RESUME_QUIZ_PROMPT } from '../prompts/resume-quiz.propmts'

/**
 * 处理与面试相关的业务逻辑
 * 依赖于 AIModelFactory 获取AI模型，而不是自己初始化
 *
 * 1. 关注点分离 InterviewService 只关心业务逻辑，AI模型的初始化交给 AIModelFactory
 * 2. 易于切换，若要换AI模型，只需要改 AIModelFactory
 * 3. 易于测试，可以 mock AIModelFactory 不用真实调用API
 */
@Injectable()
export class InterviewService {
  private readonly logger = new Logger(InterviewService.name)

  constructor(
    private configService: ConfigService,
    private aiModelFactory: AIModelFactory,
  ) {}

  /**
   * 分析建立并生成报告
   * @param resumeContent - 简历的文本内容
   * @param jobDescription - 岗位要求
   * @returns 分析结果，包含工作年限、技能、匹配度等信息
   */
  async analyzeResume(resumeContent: string, jobDescription: string) {
    // 创建 Prompt 模版
    const prompt = PromptTemplate.fromTemplate(RESUME_QUIZ_PROMPT)
    // 通过工程获取模型
    const model = this.aiModelFactory.createDefaultModel()
    // 创建输出解析器
    const parser = new JsonOutputParser()
    // 创建链：Prompt -> 模型 -> 解析器
    const chain = prompt.pipe(model).pipe(parser)

    // 调用链
    try {
      this.logger.log('开始分析建立 ...')
      const result = await chain.invoke({
        resume_content: resumeContent,
        job_description: jobDescription,
      })
      return result
    } catch (err) {
      this.logger.error('建立分析失败', err)
      throw err
    }
  }
}
