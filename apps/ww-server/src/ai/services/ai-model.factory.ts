import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ChatDeepSeek } from '@langchain/deepseek'

@Injectable()
export class AIModelFactory {
  private readonly logger = new Logger(AIModelFactory.name)

  constructor(private configService: ConfigService) {}

  // 创建默认的AI模型，返回一个配置好的 ChatDeepSeek实例
  createDefaultModel(): ChatDeepSeek {
    const apiKey = this.configService.get<string>('DEEPSEEK_API_KEY')
    if (!apiKey) {
      this.logger.warn('DEEPSEEK_API_KEY 错误')
    }
    // deepseek-reasoner 思考模式：慢，适合深度推理任务，数学题，逻辑题
    // deepseek-chat 非思考模式，快，用于直接生成任务，文案等
    return new ChatDeepSeek({
      apiKey,
      model: this.configService.get<string>('DEEPSEEK_MODEL') || 'deepseek-chat',
      temperature: Number(this.configService.get<string>('DEEPSEEK_TEMPERATURE')) || 0.7,
      maxTokens: Number(this.configService.get<string>('DEEPSEEK_MAX_TOKENS')) || 4000,
    })
  }

  // 创建用于稳定输出的模型（评估场景）
  // 需要输出相对稳定，一致的场景，这个创建一个 temperature 较低的模型
  createStableModel(): ChatDeepSeek {
    const baseModel = this.createDefaultModel()
    const apiKey = this.configService.get<string>('DEEPSEEK_API_KEY')
    return new ChatDeepSeek({
      apiKey,
      model: baseModel.model,
      temperature: 0.3,
      maxTokens: 4000,
    })
  }

  // 创建用于创意输出的模型（生成场景）
  // 需要多样化输出，创意场景，这个创建一个 temperature 较高的模型
  createCreativeModel(): ChatDeepSeek {
    const baseModel = this.createDefaultModel()
    const apiKey = this.configService.get<string>('DEEPSEEK_API_KEY')
    return new ChatDeepSeek({
      apiKey,
      model: baseModel.model,
      temperature: 0.8,
      maxTokens: 4000,
    })
  }
}
