/**
 * 浏览器端不能把 `0.0.0.0` 当成实际可访问的目标地址。
 *
 * 如果环境变量里误写成 `http://0.0.0.0:6789/api`，
 * 这里会自动替换成当前页面的 hostname，避免请求直接失败。
 */
export function resolvePublicApiBase(apiBase: string): string {
  const normalized = apiBase.trim().replace(/\/$/, '')

  if (typeof window === 'undefined') {
    return normalized
  }

  try {
    const url = new URL(normalized)

    if (url.hostname === '0.0.0.0') {
      url.hostname = window.location.hostname || '127.0.0.1'
    }

    return url.toString().replace(/\/$/, '')
  } catch {
    return normalized
  }
}
