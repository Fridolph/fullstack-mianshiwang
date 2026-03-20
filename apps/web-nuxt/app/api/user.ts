import type { ApiClient } from '~/types/api'

/**
 * 更新用户信息
 */
export const updateUserProfileAPI = (
  $api: ApiClient,
  body: Record<string, unknown>,
) => {
  return $api('/user/profile', {
    method: 'PUT',
    body,
  })
}

/**
 * 获取用户信息
 */
export const getUserInfoAPI = ($api: ApiClient) => {
  return $api('/user/info', {
    method: 'GET',
  })
}

/**
 * 获取消费记录
 */
export const getConsumptionRecordsAPI = (
  $api: ApiClient,
  query?: {
    skip?: number
    limit?: number
  },
) => {
  return $api('/user/consumption-records', {
    method: 'GET',
    query,
  })
}
