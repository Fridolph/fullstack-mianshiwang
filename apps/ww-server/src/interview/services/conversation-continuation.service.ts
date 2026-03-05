import { PromptTemplate } from '@langchain/core/prompts'
import { AIModelFactory } from '../../ai/services/ai-model.factory'
import { Injectable, Logger } from '@nestjs/common'
import { Message } from '../../ai/interfaces/message.interface'
import { CONVERSATION_CONTINUATION_PROMPT } from '../prompts/resume-analysis.prompts'

@Injectable()
export class ConversationContinuationService {
  private readonly logger = new Logger(ConversationContinuationService.name)

  constructor(private aiModelFactory: AIModelFactory) {}

  async continue(history: Message[]): Promise<string> {
    try {
      // 1. 创建 Prompt模版
      const prompt = PromptTemplate.fromTemplate(
        CONVERSATION_CONTINUATION_PROMPT,
      )

      // 2. 获取模型
      const model = this.aiModelFactory.createDefaultModel()

      // 3. 组建链
      const chain = prompt.pipe(model)
      this.logger.log(`继续对话，历史消息数: ${history.length}`)

      // 4. 调用链
      const response = await chain.invoke({
        history: history.map((m) => `${m.role}: ${m.content}`).join('\n\n'),
      })

      // 5. 获取回答内容
      const aiResponse = response.content as string
      this.logger.log('继续对话 - 本次对话完成')
      return aiResponse
    } catch (err) {
      this.logger.error('继续对话失败', err)
      throw err
    }
  }
}
