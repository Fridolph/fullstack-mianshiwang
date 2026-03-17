import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ChatDeepSeek } from '@langchain/deepseek'
import { ChatOpenAI } from '@langchain/openai'

type SupportedChatModel = ChatDeepSeek | ChatOpenAI

@Injectable()
export class AIModelFactory {
  private readonly logger = new Logger(AIModelFactory.name)

  constructor(private configService: ConfigService) {}

  private isQiniuProvider(): boolean {
    return this.configService.get<string>('AI_PROVIDER') === 'qiniu'
  }

  private createQiniuModel(temperature: number): ChatOpenAI {
    const apiKey = this.configService.get<string>('QINIU_AI_API_KEY')
    const baseURL =
      this.configService.get<string>('QINIU_AI_BASE_URL') ||
      'https://api.qnaigc.com/v1'

    if (!apiKey) {
      this.logger.warn('QINIU_AI_API_KEY 错误')
    }

    return new ChatOpenAI({
      apiKey,
      model:
        this.configService.get<string>('QINIU_AI_MODEL') ||
        this.configService.get<string>('DEEPSEEK_MODEL') ||
        'deepseek-chat',
      temperature,
      maxTokens: Number(this.configService.get<string>('DEEPSEEK_MAX_TOKENS')) || 4000,
      configuration: {
        baseURL,
      },
    })
  }

  private createDeepSeekModel(temperature: number): ChatDeepSeek {
    const apiKey = this.configService.get<string>('DEEPSEEK_API_KEY')

    if (!apiKey) {
      this.logger.warn('DEEPSEEK_API_KEY 错误')
    }

    return new ChatDeepSeek({
      apiKey,
      model: this.configService.get<string>('DEEPSEEK_MODEL') || 'deepseek-chat',
      temperature,
      maxTokens: Number(this.configService.get<string>('DEEPSEEK_MAX_TOKENS')) || 4000,
    })
  }

  private createModel(temperature: number): SupportedChatModel {
    if (this.isQiniuProvider()) {
      return this.createQiniuModel(temperature)
    }

    return this.createDeepSeekModel(temperature)
  }

  // 创建默认的AI模型，默认仍走 DeepSeek，配置 AI_PROVIDER=qiniu 时切到七牛云兼容接口
  createDefaultModel(): SupportedChatModel {
    // deepseek-reasoner 思考模式：慢，适合深度推理任务，数学题，逻辑题
    // deepseek-chat 非思考模式，快，用于直接生成任务，文案等
    return this.createModel(
      Number(this.configService.get<string>('DEEPSEEK_TEMPERATURE')) || 0.7,
    )
  }

  // 创建用于稳定输出的模型（评估场景）
  // 需要输出相对稳定，一致的场景，这个创建一个 temperature 较低的模型
  createStableModel(): SupportedChatModel {
    return this.createModel(0.3)
  }

  // 创建用于创意输出的模型（生成场景）
  // 需要多样化输出，创意场景，这个创建一个 temperature 较高的模型
  createCreativeModel(): SupportedChatModel {
    return this.createModel(0.8)
  }
}
