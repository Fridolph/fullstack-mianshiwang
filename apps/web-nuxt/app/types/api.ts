import type { $Fetch, FetchOptions } from 'ofetch'
import type { ResumeQuizResultPayload } from '~/types/domain'

/**
 * 当前 Nest 后端统一响应结构：
 * {
 *   code,
 *   message,
 *   data
 * }
 *
 * request 插件会在 code === 200 时自动把外层拆掉，只把 data 暴露给业务层。
 */
export interface ApiEnvelope<T> {
  code: number
  message: string
  data: T
  error?: unknown
  timestamp?: string
  path?: string
}

export type ApiClient = $Fetch
export type ApiRequestOptions = FetchOptions<'json'>

/**
 * SSE 生命周期回调。
 * 简历押题流式接口当前主要依赖这组回调把事件写入 store。
 */
export interface SseCallbacks<T = unknown> {
  onMessage?: (event: T) => void
  onError?: (error: Error) => void
  onComplete?: () => void
}

/**
 * SSE 请求的运行参数。
 * 和普通 $fetch 不同，这里需要显式传 token、baseURL、callbacks。
 */
export interface SseRequestOptions<T = unknown> {
  token?: string
  baseURL?: string
  callbacks?: SseCallbacks<T>
}

/**
 * 前端持有的 SSE 连接控制器。
 * 当前只有一个职责：在页面离开或重新发起请求时主动中断旧连接。
 */
export interface SseConnection {
  close: () => void
}

/**
 * 简历押题流式事件。
 *
 * 当前前端会按 type 区分 3 种关键阶段：
 * - progress: 更新进度条与时间线
 * - complete: 写入最终结果并跳转结果页
 * - error: 记录错误并回退页面状态
 */
export interface ResumeQuizProgressEvent {
  type: 'progress' | 'complete' | 'error' | 'timeout'
  progress: number
  label?: string
  message?: string
  stage?: 'prepare' | 'generating' | 'saving' | 'done'
  data?: ResumeQuizResultPayload
  error?: string
}
