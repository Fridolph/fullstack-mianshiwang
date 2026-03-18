import type { ApiClient } from '~/types/api'

export function useApiClient(): ApiClient {
  return useNuxtApp().$api
}
