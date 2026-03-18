import type { ApiClient } from '~/types/api'

/**
 * 获取 OSS 上传凭证
 */
export const getSts = ($api: ApiClient) => {
  return $api('/sts/getStsToken')
}
