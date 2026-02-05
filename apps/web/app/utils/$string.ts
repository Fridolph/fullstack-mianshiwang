/**
 * 提取 URL 或路径的最后一部分（如文件名或路径名称）
 * 支持：
 * - 完整 URL: https://example.com/user/profile -> profile
 * - 绝对路径: /user/profile -> profile
 * - 相对路径: user/profile -> profile
 * - 空值: 返回空字符串
 */
export function getUrlLastPath(input?: string | null) {
  // 处理 null 和 undefined 情况
  if (!input) return ''

  const trimmed = String(input).trim()
  if (!trimmed) return ''

  // 简单的路径提取逻辑，避免复杂的 URL 解析
  let normalized = trimmed

  // 去除协议、域名和端口（如 https://example.com 或 http://localhost:3000）
  normalized = normalized.replace(/^https?:\/\/[^/]+/, '')

  // 去除查询字符串（?params）和哈希值（#hash）
  normalized = normalized?.split('?')[0]?.split('#')[0] as string

  // 按 / 分割并过滤空值
  const parts = normalized.split('/').filter(Boolean)

  return parts.pop() || ''
}
