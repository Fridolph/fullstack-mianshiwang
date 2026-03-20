import type { ApiClient, ApiEnvelope } from '~/types/api'
import { useUserStore } from '~/stores/user'
import { resolvePublicApiBase } from '~/utils/api-base'

// 用运行时判断把后端通用响应结构缩窄成 ApiEnvelope，避免业务层自己到处写类型断言。
function isApiEnvelope(value: unknown): value is ApiEnvelope<unknown> {
  return (
    typeof value === 'object'
    && value !== null
    && 'code' in value
    && 'message' in value
    && 'data' in value
  )
}

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const baseURL = resolvePublicApiBase(config.public.apiBase)

  /**
   * 统一请求客户端。
   *
   * 它负责 3 件事：
   * 1. 自动拼接 baseURL
   * 2. 自动挂 Bearer Token
   * 3. 自动把 { code, message, data } 拆成业务真正关心的 data
   */
  const api = $fetch.create({
    baseURL,
    credentials: 'include',
    timeout: 15000,
    onRequest({ options }) {
      const userStore = useUserStore()
      const headers = new Headers(options.headers ?? {})

      if (userStore.token) {
        headers.set('Authorization', `Bearer ${userStore.token}`)
      }

      options.headers = headers
    },
    onResponse({ response }) {
      // 有些接口未来可能不是标准包裹结构，这里直接放行，兼容后续扩展。
      if (!isApiEnvelope(response._data)) return

      if (response._data.code === 200) {
        response._data = response._data.data
        return
      }

      if (response._data.code === 401) {
        const userStore = useUserStore()
        userStore.logout()
      }

      throw new Error(response._data.message || '请求失败')
    },
    onResponseError({ response }) {
      const message
        = typeof response?._data?.message === 'string'
          ? response._data.message
          : response?.statusText || '网络请求失败'

      if (response?.status === 401) {
        const userStore = useUserStore()
        userStore.logout()
      }

      // 统一把 HTTP 层错误转成 Error，保证页面侧只处理一种错误形态。
      throw new Error(message)
    },
  })

  return {
    provide: {
      api: api as ApiClient,
    },
  }
})
