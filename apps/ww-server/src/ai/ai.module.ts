import { Module } from '@nestjs/common'
import { AIModelFactory } from './services/ai-model.factory'
import { SessionManager } from './services/session.manager'

/**
 * AI 模块，用于集中管理所有的AI相关服务
 * 注：任何需要用到AI的模块，都应该导入这个AIModule
 */
@Module({
  providers: [
    // AI模型工厂（初始化模型）
    AIModelFactory,
    // 会话管理（管理对话历史）
    SessionManager,
  ],
  exports: [AIModelFactory, SessionManager],
})
export class AIModule {}
