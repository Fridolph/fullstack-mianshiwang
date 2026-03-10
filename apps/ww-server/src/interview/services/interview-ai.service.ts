import { JsonOutputParser } from '@langchain/core/output_parsers'
import { PromptTemplate } from '@langchain/core/prompts'
import { Injectable, Logger } from '@nestjs/common'
import { AIModelFactory } from '../../ai/services/ai-model.factory'

type InterviewModelMode = 'default' | 'stable' | 'creative'

type PromptVariables = Record<string, string>

/**
 * 面试 AI 服务
 *
 * 这一层负责 interview 线共用的 AI 调用约定：
 * - 根据场景选择模型
 * - 组装 Prompt -> Model -> Parser 的调用链
 * - 统一日志与输出形态
 *
 * 具体业务服务（如简历分析、对话继续）只负责：
 * - 提供 prompt
 * - 提供变量
 * - 处理业务上下文
 */
@Injectable()
export class InterviewAIService {
  private readonly logger = new Logger(InterviewAIService.name)

  constructor(private readonly aiModelFactory: AIModelFactory) {}

  async invokeStructuredPrompt<T extends Record<string, any>>(
    template: string,
    variables: PromptVariables,
    mode: InterviewModelMode = 'stable',
  ): Promise<T> {
    try {
      const prompt = PromptTemplate.fromTemplate(template)
      const parser = new JsonOutputParser<T>()
      const chain = prompt.pipe(this.resolveModel(mode)).pipe(parser)

      this.logger.log(`调用结构化 AI 链路，mode=${mode}`)
      return await chain.invoke(variables)
    }
    catch (error) {
      this.logger.error('结构化 AI 调用失败', error)
      throw error
    }
  }

  async invokeTextPrompt(
    template: string,
    variables: PromptVariables,
    mode: InterviewModelMode = 'default',
  ): Promise<string> {
    try {
      const prompt = PromptTemplate.fromTemplate(template)
      const chain = prompt.pipe(this.resolveModel(mode))

      this.logger.log(`调用文本 AI 链路，mode=${mode}`)
      const response = await chain.invoke(variables)

      if (typeof response.content === 'string') {
        return response.content
      }

      return JSON.stringify(response.content)
    }
    catch (error) {
      this.logger.error('文本 AI 调用失败', error)
      throw error
    }
  }

  private resolveModel(mode: InterviewModelMode) {
    switch (mode) {
      case 'stable':
        return this.aiModelFactory.createStableModel()
      case 'creative':
        return this.aiModelFactory.createCreativeModel()
      case 'default':
      default:
        return this.aiModelFactory.createDefaultModel()
    }
  }
}
