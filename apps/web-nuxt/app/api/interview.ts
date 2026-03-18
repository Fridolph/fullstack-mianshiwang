import type {
  ApiClient,
  ResumeQuizProgressEvent,
  SseConnection,
  SseRequestOptions
} from '~/types/api'
import type { InterviewMessage } from '~/types/domain'

const ssePost = (
  path: string,
  params: Record<string, unknown>,
  options?: SseRequestOptions<ResumeQuizProgressEvent>
): SseConnection => {
  if (typeof window === 'undefined') {
    return { close: () => {} }
  }

  const { token, baseURL = '', callbacks = {} } = options || {}
  const { onMessage, onError, onComplete } = callbacks
  const url = `${baseURL}${path.startsWith('/') ? path : `/${path}`}`

  let controller: AbortController | null = null

  const connect = async () => {
    try {
      controller = new AbortController()

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream'
      }

      if (token) {
        headers.Authorization = `Bearer ${token}`
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(params),
        credentials: 'include',
        signal: controller.signal
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`)
      }

      if (!response.body) {
        throw new Error('SSE 响应体为空')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          onComplete?.()
          break
        }

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue

          const data = line.slice(6).trim()
          if (data === '[DONE]') {
            onComplete?.()
            return
          }

          try {
            onMessage?.(JSON.parse(data) as ResumeQuizProgressEvent)
          } catch {
            onMessage?.({
              type: 'progress',
              progress: 0,
              message: data
            })
          }
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return

      onError?.(error instanceof Error ? error : new Error('SSE 请求失败'))
    }
  }

  void connect()

  return {
    close: () => controller?.abort()
  }
}

/**
 * 分析简历
 */
export const analyzeResumeAPI = (
  $api: ApiClient,
  body: {
    resume: string
    jobDescription: string
    position: string
  }
) => {
  return $api('/interview/analyze-resume', {
    method: 'POST',
    body
  })
}

/**
 * 继续追问
 */
export const continueConversationAPI = (
  $api: ApiClient,
  body: {
    sessionId: string
    question: string
  }
) => {
  return $api('/interview/continue-conversation', {
    method: 'POST',
    body
  })
}

/**
 * 处理简历押题 - 题目 + 答案 + 分析
 */
export const generateResumeQuizSSE = (
  params: Record<string, unknown>,
  options?: SseRequestOptions<ResumeQuizProgressEvent>
) => {
  return ssePost('/interview/resume/quiz/stream', params, options)
}

/**
 * 获取分析报告
 */
export const getAnalysisReportAPI = ($api: ApiClient, resultId: string) => {
  return $api(`/interview/analysis/report/${resultId}`, {
    method: 'GET'
  })
}

export interface AnalysisConversationResponse {
  response: string
  messages?: InterviewMessage[]
}

/**
 * 获取简历押题历史记录
 */
export const getInterviewResumeHistoryAPI = (
  $api: ApiClient,
  page: number,
  limit: number
) => {
  return $api('/interview/resume/quiz/history', {
    method: 'GET',
    query: {
      page,
      limit
    }
  })
}

/**
 * 获取专项面试历史记录
 */
export const getInterviewSpecialHistoryAPI = (
  $api: ApiClient,
  page: number,
  limit: number
) => {
  return $api('/interview/special/history', {
    method: 'GET',
    query: {
      page,
      limit
    }
  })
}

/**
 * 获取行测 + HR 面试历史记录
 */
export const getInterviewBehaviorHistoryAPI = (
  $api: ApiClient,
  page: number,
  limit: number
) => {
  return $api('/interview/behavior/history', {
    method: 'GET',
    query: {
      page,
      limit
    }
  })
}

/**
 * 获取单个结果详情
 */
export const getInterviewResultDetailAPI = (
  $api: ApiClient,
  resultId: string
) => {
  return $api(`/interview/resume/quiz/result/${resultId}`, {
    method: 'GET'
  })
}

/**
 * 非流式的押题接口
 */
export const generateResumeQuizAPI = (
  $api: ApiClient,
  params: Record<string, unknown>
) => {
  return $api('/interview/resume/quiz', {
    method: 'POST',
    body: params
  })
}

/**
 * 开始模拟面试 - SSE 流式接口
 */
export const startMockInterviewAPI = (
  params: Record<string, unknown>,
  options?: SseRequestOptions<ResumeQuizProgressEvent>
) => {
  return ssePost('/interview/mock/start', params, options)
}

/**
 * 回答面试问题 - SSE 流式接口
 */
export const answerInterviewQuestionAPI = (
  params: Record<string, unknown>,
  options?: SseRequestOptions<ResumeQuizProgressEvent>
) => {
  return ssePost('/interview/mock/answer', params, options)
}

export const pauseInterviewAPI = ($api: ApiClient, resultId: string) => {
  return $api(`/interview/mock/pause/${resultId}`, { method: 'POST' })
}

export const resumeInterviewAPI = ($api: ApiClient, resultId: string) => {
  return $api(`/interview/mock/resume/${resultId}`, { method: 'POST' })
}

export const getUnfinishedInterviewListAPI = ($api: ApiClient) => {
  return $api('/interview/mock/unfinished', { method: 'GET' })
}

export const endInterviewAPI = ($api: ApiClient, resultId: string) => {
  return $api(`/interview/mock/end/${resultId}`, { method: 'POST' })
}

export const getMockInterviewQAResultAPI = (
  $api: ApiClient,
  resultId: string
) => {
  return $api(`/interview/mock/result/${resultId}/qa`, {
    method: 'GET'
  })
}

export const getMockInterviewSessionHistoryAPI = (
  $api: ApiClient,
  resultId: string
) => {
  return $api(`/interview/mock/history/${resultId}`, {
    method: 'GET'
  })
}

export const exchangePackageAPI = (
  $api: ApiClient,
  body: Record<string, unknown>
) => {
  return $api('/interview/exchange-package', {
    method: 'POST',
    body
  })
}
