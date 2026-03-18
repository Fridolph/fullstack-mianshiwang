import type { ApiClient } from '~/types/api'

/**
 * 生成微信扫码登录二维码
 * @returns {Promise}
 */
export const generateWechatQRCodeAPI = ($api: ApiClient) => {
  return $api('/wechat/qrcode', {
    method: 'POST'
  })
}

/**
 * 检查微信扫码状态
 * @param {string} qrCodeId 二维码ID
 * @returns {Promise}
 */
export const checkWechatQRCodeStatusAPI = (
  $api: ApiClient,
  qrCodeId: string
) => {
  return $api(`/wechat/check-qr-status?id=${qrCodeId}`, {
    method: 'GET'
  })
}

/**
 * 本地测试登录接口
 */
export const testLogin = ($api: ApiClient) => {
  return $api('/wechat/test-login')
}
