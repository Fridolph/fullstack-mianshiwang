import { Injectable, Logger } from '@nestjs/common'
import { Message } from '../../ai/interfaces/message.interface'
import { CONVERSATION_CONTINUATION_PROMPT } from '../prompts/resume-analysis.prompts'
import { InterviewAIService } from './interview-ai.service'

@Injectable()
export class ConversationContinuationService {
  private readonly logger = new Logger(ConversationContinuationService.name)

  constructor(private interviewAIService: InterviewAIService) {}

  async continue(history: Message[]): Promise<string> {
    try {
      this.logger.log(`继续对话，历史消息数: ${history.length}`)
      const aiResponse = await this.interviewAIService.invokeTextPrompt(
        CONVERSATION_CONTINUATION_PROMPT,
        {
          history: history.map(m => `${m.role}: ${m.content}`).join('\n\n'),
        },
        'default',
      )

      this.logger.log('继续对话 - 本次对话完成')
      return aiResponse
    }
    catch (err) {
      this.logger.error('继续对话失败', err)
      throw err
    }
  }
}
