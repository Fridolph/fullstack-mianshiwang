import type { $Fetch, FetchOptions } from 'ofetch'
import type { ResumeQuizResultPayload } from '~/types/domain'

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

export interface SseCallbacks<T = unknown> {
  onMessage?: (event: T) => void
  onError?: (error: Error) => void
  onComplete?: () => void
}

export interface SseRequestOptions<T = unknown> {
  token?: string
  baseURL?: string
  callbacks?: SseCallbacks<T>
}

export interface SseConnection {
  close: () => void
}

export interface ResumeQuizProgressEvent {
  type: 'progress' | 'complete' | 'error' | 'timeout'
  progress: number
  label?: string
  message?: string
  stage?: 'prepare' | 'generating' | 'saving' | 'done'
  data?: ResumeQuizResultPayload
  error?: string
}
