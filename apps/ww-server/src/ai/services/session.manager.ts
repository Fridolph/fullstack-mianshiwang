import { Injectable, Logger } from '@nestjs/common'
import { Message, SessionData } from '../interfaces/message.interface'
import { v4 as generateUUID } from 'uuid'

/**
 * 会话管理服务 - 负责管理用户和AI的对话会话
 * - 维护对话历史（内存存储）
 * - 管理会话的生命周期
 * - 提供会话数据的查询方法
 *
 * 为什么要放在AI模块里？因为对话历史管理是AI交互的核心
 * 任何涉及AI多轮对话的服务都需要用到它
 * 所以我们把它放在AI模块，作为通用服务供所有模块使用
 */
@Injectable()
export class SessionManager {
  private readonly logger = new Logger(SessionManager.name)
  // 内存存储 sessionId -> 历史对话
  private sessions = new Map<string, SessionData>()

  createSession(userId: string, position: string, systemMessage: string) {
    const sessionId = generateUUID()
    const sessionData: SessionData = {
      sessionId,
      userId,
      position,
      messages: [{ role: 'system', content: systemMessage }],
      createdAt: new Date(),
      lastActivityAt: new Date(),
    }

    this.sessions.set(sessionId, sessionData)
    this.logger.log(`创建会话: ${sessionId}, 用户: ${userId}, 职位: ${position}`)

    return sessionId
  }

  /**
   * 向会话添加信息
   * @param sessionId 会话ID
   * @param role 消息角色，注：只有 user 或 assistant
   * @param content 消息内容
   */
  addMessage(sessionId: string, role: 'user' | 'assistant', content: string) {
    const session = this.sessions.get(sessionId)

    if (!session) throw new Error(`会话不存在: ${sessionId}`)

    session.messages.push({
      role,
      content,
    })
    session.lastActivityAt = new Date()
    this.logger.debug(`添加信息到会话 ${sessionId}: ${role}`)
  }

  /**
   * 获取完整的对话记录
   * @param sessionId 会话ID
   * @returns 当前会话的历史消息
   */
  getHistory(sessionId: string): Message[] {
    const session = this.sessions.get(sessionId)
    return session?.messages || []
  }

  /**
   * 获取最近的 N 条信息，用于优化 Token 的使用
   *
   * 对话越长，token 越多，调用 AI 成本越高
   * 所以只保留最近几条，旧的消息可丢掉
   * 注：System Message （第一条）一定要保留
   */
  getRecentMessages(sessionId: string, count: number = 10): Message[] {
    const history = this.getHistory(sessionId)

    if (history.length === 0) return []

    // System Message 一定要保留（作为第一条）
    const systemMessage = history[0]
    // 获取最近 count 条消息
    // [1,2,3,4,5].slice(-2) -> [4,5]
    const recentMessages = history.slice(-count)

    if (recentMessages[0]?.role !== 'system') {
      return [systemMessage, ...recentMessages]
    }

    return recentMessages
  }

  /**
   * 结束会话
   * @param sessionId
   */
  endSession(sessionId: string) {
    if (this.sessions.has(sessionId)) {
      this.sessions.delete(sessionId)
      this.logger.log(`结束对话: ${sessionId}`)
    }
  }

  /**
   * 清理过期会话 （最近1小时未活动就清理）
   * 在生产环境中，应该定期调用这个方法来清理内存
   * 可以用 @Cron 装饰器在后台定期执行
   */
  cleanupExpiredSessions() {
    const now = new Date()
    const expirationTime = 60 * 60 * 1000 // 1小时

    for (const [sessionId, session] of this.sessions.entries()) {
      if (now.getTime() - session.lastActivityAt.getTime() > expirationTime) {
        this.logger.warn(`清理过期会话: ${sessionId}`)
        this.sessions.delete(sessionId)
      }
    }
  }
}
