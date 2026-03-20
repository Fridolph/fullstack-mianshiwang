import type { ApiClient } from '~/types/api'

/**
 * 返回当前时间点进行模拟面试的人数
 */
export const getMockInterviewCountAPI = ($api: ApiClient) => {
  return $api('/admin/interview-count', {
    method: 'GET',
  })
}
