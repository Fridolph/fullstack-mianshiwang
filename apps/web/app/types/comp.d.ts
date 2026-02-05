/**
 * 分类名：用于日志打印
 */
type CategoryName = 'form' | 'data' | 'navigation' | 'overlay' | 'page' | 'dashboard' | 'ai-chat' | 'editor' | 'content' | 'color-mode' | 'element'

/**
 * 日志选项
 */
interface LogOptions {
  category?: CategoryName
  title?: string | function
  description?: string | function
  icon?: string | function
}

/**
 * 通用卡片展示
 */
interface CardItem {
  title: string
  desc: string
  imgUrl?: string
  to?: string
  showLabel?: boolean
}
