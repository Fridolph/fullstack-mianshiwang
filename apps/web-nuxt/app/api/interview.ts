import type {
  ApiClient,
  ResumeQuizProgressEvent,
  SseConnection,
  SseRequestOptions,
} from '~/types/api'
import type {
  ConsumptionRecordDetail,
  InterviewMessage,
  ResumeQuizAnswerAnalysisPayload,
  ResumeQuizFinalEvaluationPayload,
  ResumeQuizStageTwoJobPayload,
} from '~/types/domain'

/**
 * 用 fetch 手动实现“POST + SSE”。
 *
 * 原因：
 * - EventSource 天然更适合 GET
 * - 当前后端简历押题接口是 POST
 * - 所以前端需要自己读取 ReadableStream，并逐行解析 `data: ...`
 */
const ssePost = (
  path: string,
  params: Record<string, unknown>,
  options?: SseRequestOptions<ResumeQuizProgressEvent>,
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
        'Accept': 'text/event-stream',
      }

      if (token) {
        headers.Authorization = `Bearer ${token}`
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(params),
        credentials: 'include',
        signal: controller.signal,
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

      const emitSseChunk = (chunk: string) => {
        const normalizedChunk = chunk.replace(/\r/g, '').trim()
        if (!normalizedChunk) return

        const dataLines = normalizedChunk
          .split('\n')
          .filter(line => line.startsWith('data:'))
          .map(line => line.slice(5).trim())

        if (!dataLines.length) return

        const data = dataLines.join('\n').trim()
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
            message: data,
          })
        }
      }

      // 服务端按 SSE 协议不断推送 `data: ...\n\n`，这里按完整事件块解析。
      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          if (buffer.trim()) {
            emitSseChunk(buffer)
          }
          onComplete?.()
          break
        }

        buffer += decoder.decode(value, { stream: true })
        const chunks = buffer.split('\n\n')
        buffer = chunks.pop() || ''

        for (const chunk of chunks) {
          emitSseChunk(chunk)
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return

      onError?.(error instanceof Error ? error : new Error('SSE 请求失败'))
    }
  }

  void connect()

  return {
    close: () => controller?.abort(),
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
  },
) => {
  return $api('/interview/analyze-resume', {
    method: 'POST',
    body,
    timeout: 60000,
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
  },
) => {
  return $api('/interview/continue-conversation', {
    method: 'POST',
    body,
    timeout: 60000,
  })
}

export const getConsumptionRecordDetailAPI = (
  $api: ApiClient,
  recordId: string,
) => {
  return $api(`/interview/records/${recordId}`, {
    method: 'GET',
  }) as Promise<ConsumptionRecordDetail>
}

export const parseResumeFileAPI = (
  $api: ApiClient,
  file: File,
) => {
  const formData = new FormData()
  formData.append('file', file)

  return $api('/interview/resume/parse-file', {
    method: 'POST',
    body: formData,
  }) as Promise<{
    text: string
    estimatedTokens: number
    warnings: string[]
  }>
}

export const getRecordResultAnalysisAPI = (
  $api: ApiClient,
  recordId: string,
) => {
  return $api(`/interview/records/${recordId}/result-analysis`, {
    method: 'GET',
    timeout: 60000,
  }) as Promise<ResumeQuizAnswerAnalysisPayload | null>
}

export const createRecordResultAnalysisAPI = (
  $api: ApiClient,
  recordId: string,
  answers: string[],
) => {
  return $api(`/interview/records/${recordId}/result-analysis`, {
    method: 'POST',
    body: {
      answers,
    },
    timeout: 60000,
  }) as Promise<ResumeQuizAnswerAnalysisPayload>
}

export const createStageTwoQuestionsJobAPI = (
  $api: ApiClient,
  recordId: string,
  body: {
    answers: string[]
    supplementaryContext?: string
  },
) => {
  return $api(`/interview/records/${recordId}/stage-two-questions`, {
    method: 'POST',
    body,
    timeout: 60000,
  }) as Promise<ResumeQuizStageTwoJobPayload>
}

export const getStageTwoQuestionsJobAPI = (
  $api: ApiClient,
  recordId: string,
) => {
  return $api(`/interview/records/${recordId}/stage-two-questions`, {
    method: 'GET',
    timeout: 60000,
  }) as Promise<ResumeQuizStageTwoJobPayload>
}

export const createFinalEvaluationJobAPI = (
  $api: ApiClient,
  recordId: string,
  answers: string[],
) => {
  return $api(`/interview/records/${recordId}/final-evaluation`, {
    method: 'POST',
    body: {
      answers,
    },
    timeout: 60000,
  }) as Promise<ResumeQuizFinalEvaluationPayload>
}

export const getFinalEvaluationJobAPI = (
  $api: ApiClient,
  recordId: string,
) => {
  return $api(`/interview/records/${recordId}/final-evaluation`, {
    method: 'GET',
    timeout: 60000,
  }) as Promise<ResumeQuizFinalEvaluationPayload>
}

/**
 * 处理简历押题 - 题目 + 答案 + 分析
 */
export const generateResumeQuizSSE = (
  params: Record<string, unknown>,
  options?: SseRequestOptions<ResumeQuizProgressEvent>,
) => {
  return ssePost('/interview/resume/quiz/stream', params, options)
}

/**
 * 获取分析报告
 */
export const getAnalysisReportAPI = ($api: ApiClient, resultId: string) => {
  return $api(`/interview/analysis/report/${resultId}`, {
    method: 'GET',
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
  limit: number,
) => {
  return $api('/interview/resume/quiz/history', {
    method: 'GET',
    query: {
      page,
      limit,
    },
  })
}

/**
 * 获取专项面试历史记录
 */
export const getInterviewSpecialHistoryAPI = (
  $api: ApiClient,
  page: number,
  limit: number,
) => {
  return $api('/interview/special/history', {
    method: 'GET',
    query: {
      page,
      limit,
    },
  })
}

/**
 * 获取行测 + HR 面试历史记录
 */
export const getInterviewBehaviorHistoryAPI = (
  $api: ApiClient,
  page: number,
  limit: number,
) => {
  return $api('/interview/behavior/history', {
    method: 'GET',
    query: {
      page,
      limit,
    },
  })
}

/**
 * 获取单个结果详情
 */
export const getInterviewResultDetailAPI = (
  $api: ApiClient,
  resultId: string,
) => {
  return $api(`/interview/resume/quiz/result/${resultId}`, {
    method: 'GET',
  })
}

/**
 * 非流式的押题接口
 */
export const generateResumeQuizAPI = (
  $api: ApiClient,
  params: Record<string, unknown>,
) => {
  return $api('/interview/resume/quiz', {
    method: 'POST',
    body: params,
  })
}

/**
 * 开始模拟面试 - SSE 流式接口
 */
export const startMockInterviewAPI = (
  params: Record<string, unknown>,
  options?: SseRequestOptions<ResumeQuizProgressEvent>,
) => {
  return ssePost('/interview/mock/start', params, options)
}

/**
 * 回答面试问题 - SSE 流式接口
 */
export const answerInterviewQuestionAPI = (
  params: Record<string, unknown>,
  options?: SseRequestOptions<ResumeQuizProgressEvent>,
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
  resultId: string,
) => {
  return $api(`/interview/mock/result/${resultId}/qa`, {
    method: 'GET',
  })
}

export const getMockInterviewSessionHistoryAPI = (
  $api: ApiClient,
  resultId: string,
) => {
  return $api(`/interview/mock/history/${resultId}`, {
    method: 'GET',
  })
}

export const exchangePackageAPI = (
  $api: ApiClient,
  body: Record<string, unknown>,
) => {
  return $api('/interview/exchange-package', {
    method: 'POST',
    body,
  })
}
