import type { TimelineItem } from '@nuxt/ui'
import { nanoid } from 'nanoid' // 用nanoid生成唯一ID

const KEY_INTERACTION_LOG = 'interactionLog'

// 扩展TimelineItem类型，增加唯一ID
export interface LogItem extends TimelineItem {
  id: string // 新增：唯一标识，用于删除
}

/**
 * 交互日志状态管理 Store   自动持久化到 localStorage
 */
export const useInteractionLogStore = defineStore(KEY_INTERACTION_LOG, () => {
  // 直接定义为 TimelineItem[] 类型，避免后续转换
  const logs = ref<Record<CategoryName, TimelineItem[]>>({
    'ai-chat': [],
    'editor': [],
    'content': [],
    'color-mode': [],
    'element': [],
    'form': [],
    'data': [],
    'navigation': [],
    'overlay': [],
    'page': [],
    'dashboard': []
  })

  /**
   * 新增1条交互日志
   * @param category 记录类型，组件名称
   * @param title 操作名称（如："关闭告警弹窗"）
   * @param description 操作上下文（如："组件：UAlert | 类型：outline"）
   * @param icon 日志图标（@nuxt/ui 图标格式，默认：鼠标指针）
   */
  const addLog = (
    category: CategoryName, // 对应正在操作的组件类型
    title: string, // 对应 UTimeline 的 title（主要操作）
    description?: string, // 对应 UTimeline 的 description（组件/上下文）
    icon?: string // 可选：UTimeline 支持的图标（如 i-lucide-mouse-pointer）
  ) => {
    const nDate = new Date()
    const newLog: TimelineItem = {
      id: nanoid(8), // 生成8位唯一ID
      category,
      date: nDate.toLocaleDateString() + ' ' + nDate.toLocaleTimeString(),
      title,
      description,
      icon: icon || 'i-lucide-mouse-pointer' // 默认鼠标点击图标
    }

    // 最新日志置顶
    logs.value[category].unshift(newLog as TimelineItem)
    // 限制日志条数（避免持久化数据过大）
    if (logs.value[category].length > 50) logs.value[category].pop()
  }

  /**
   * 根据ID删除单条日志
   * @param category 记录类型，组件名称
   * @param id 日志唯一标识
   */
  const deleteCateLogItem = (type: CategoryName, id: string) => {
    const targetIndex = logs.value[type].findIndex(log => log.id === id)
    if (targetIndex !== -1) logs.value[type].splice(targetIndex, 1)
  }

  /**
   * 清空指定类型的所有日志
   * @param type 记录类型，组件名称
   */
  const deleteThisCateLogs = (type: CategoryName) => {
    logs.value[type] = []
  }

  return { logs, addLog, deleteCateLogItem, deleteThisCateLogs }
}, {
  persist: {
    storage: 'localStorage',
    key: KEY_INTERACTION_LOG,
    paths: ['logs']
  }
})
