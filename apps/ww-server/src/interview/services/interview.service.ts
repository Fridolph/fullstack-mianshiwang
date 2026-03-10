import { ForbiddenException, Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { SessionManager } from './../../ai/services/session.manager'
import { ResumeAnalysisService } from './resume-analysis.service'
import { RESUME_ANALYSIS_SYSTEM_MESSAGE } from '../prompts/resume-analysis.prompts'
import { ConversationContinuationService } from './conversation-continuation.service'

/**
 * 面试服务
 *
 * 这个服务只关心业务逻辑和流程编排：
 * 1. 创建会话
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
  ) {}

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
      const systemMessage = RESUME_ANALYSIS_SYSTEM_MESSAGE(position)
      const sessionId = this.sessionManager.createSession(
        userId,
        position,
        systemMessage,
      )
      this.logger.log(`创建会话: ${sessionId}`)

      const result = await this.resumeAnalysisService.analyze(
        resumeContent,
        jobDescription,
      )

      this.sessionManager.addMessage(
        sessionId,
        'user',
        `简历内容: ${resumeContent}`,
      )

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
    }
    catch (err) {
      this.logger.error(`分析简历失败: ${err}`)
      throw err
    }
  }

  /**
   * 继续对话 （多轮对话，基于现有对话）
   * @param userId 当前登录用户 ID
   * @param sessionId 会话 ID
   * @param userQuestion 用户问题
   * @returns AI 的回答
   */
  async continueConversation(
    userId: string,
    sessionId: string,
    userQuestion: string,
  ): Promise<string> {
    try {
      const session = this.sessionManager.getSessionOrThrow(sessionId)
      if (session.userId !== userId) {
        throw new ForbiddenException('当前用户无权访问该会话')
      }

      this.sessionManager.addMessage(sessionId, 'user', userQuestion)

      const history = this.sessionManager.getRecentMessages(sessionId, 10)
      this.logger.log(
        `继续对话 sessionId: ${sessionId}, 历史消息数: ${history.length}`,
      )

      const aiResponse =
        await this.conversationContinuationService.continue(history)

      this.sessionManager.addMessage(sessionId, 'assistant', aiResponse)
      this.logger.log(`继续对话 ok | sessionId: ${sessionId}`)

      return aiResponse
    }
    catch (err) {
      this.logger.error(`继续对话失败: ${err}`)
      throw err
    }
  }
}
