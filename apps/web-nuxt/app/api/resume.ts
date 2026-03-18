import type { ApiClient } from '~/types/api'

export interface UploadResumePayload {
  url: string
  resumeName: string
  uploadTime: string
}

export interface UpdateResumeNamePayload {
  resumeId: string
  resumeName: string
}

/**
 * 获取简历列表
 */
export const getResumeListAPI = ($api: ApiClient) => {
  return $api('/resume/getInterviewResumeList')
}

/**
 * 上传简历
 */
export const uploadResumeAPI = (
  $api: ApiClient,
  body: UploadResumePayload
) => {
  return $api('/resume/uploadResume', {
    method: 'POST',
    body
  })
}

/**
 * 删除简历
 */
export const deleteResumeAPI = ($api: ApiClient, resumeId: string) => {
  return $api('/resume/deleteResume', {
    method: 'POST',
    body: {
      resumeId
    }
  })
}

/**
 * 更新简历名称
 */
export const updateResumeNameAPI = (
  $api: ApiClient,
  body: UpdateResumeNamePayload
) => {
  return $api('/resume/updateResumeName', {
    method: 'POST',
    body
  })
}
