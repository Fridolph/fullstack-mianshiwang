import type { ApiClient } from '~/types/api'

/**
 * 更新用户信息
 */
export const updateUserInfoAPI = (
  $api: ApiClient,
  body: Record<string, unknown>
) => {
  return $api('/user/update', {
    method: 'POST',
    body
  })
}

/**
 * 获取用户信息
 */
export const getUserInfoAPI = ($api: ApiClient) => {
  return $api('/user/info', {
    method: 'GET'
  })
}

/**
 * 获取支付记录
 */
export const getPaymentRecordsAPI = (
  $api: ApiClient,
  query?: Record<string, string | number>
) => {
  return $api('/user/transactions', {
    method: 'GET',
    query
  })
}

/**
 * 获取消费记录
 */
export const getConsumptionRecordsAPI = ($api: ApiClient) => {
  return $api('/user/consumption-records', {
    method: 'GET'
  })
}
