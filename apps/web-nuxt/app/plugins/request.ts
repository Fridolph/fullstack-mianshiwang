import type { ApiClient, ApiEnvelope } from '~/types/api'
import { useUserStore } from '~/stores/user'

function isApiEnvelope(value: unknown): value is ApiEnvelope<unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'code' in value &&
    'message' in value &&
    'data' in value
  )
}

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()

  const api = $fetch.create({
    baseURL: config.public.apiBase,
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
      const message =
        typeof response?._data?.message === 'string'
          ? response._data.message
          : response?.statusText || '网络请求失败'

      if (response?.status === 401) {
        const userStore = useUserStore()
        userStore.logout()
      }

      throw new Error(message)
    }
  })

  return {
    provide: {
      api: api as ApiClient
    }
  }
})
