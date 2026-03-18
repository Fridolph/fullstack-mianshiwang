import type { ApiClient } from '~/types/api'
import type { LoginPayload, RegisterPayload } from '~/types/domain'

/**
 * 邮箱密码登录
 */
export const loginAPI = ($api: ApiClient, body: LoginPayload) => {
  return $api('/user/login', {
    method: 'POST',
    body
  })
}

/**
 * 注册账号
 */
export const registerAPI = ($api: ApiClient, body: RegisterPayload) => {
  return $api('/user/register', {
    method: 'POST',
    body
  })
}

/**
 * 兼容旧前端迁移期保留
 */
export const generateWechatQRCodeAPI = (_$api: ApiClient) =>
  Promise.reject(new Error('当前后端未提供微信扫码登录接口，请使用邮箱密码登录'))

export const checkWechatQRCodeStatusAPI = (
  _$api: ApiClient,
  _qrCodeId: string
) =>
  Promise.reject(new Error('当前后端未提供微信扫码登录接口，请使用邮箱密码登录'))

export const testLogin = (_$api: ApiClient) =>
  Promise.reject(new Error('当前后端未提供测试登录接口，请先注册账号'))
