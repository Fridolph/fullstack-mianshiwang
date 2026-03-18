/**
 * 日志组合式函数
 * 用于快速创建带有日志功能的点击事件
 */
export function useInteractionLog(options?: LogOptions) {
  const logStore = useInteractionLogStore()
  const route = useRoute()
  const defaultCategory = (getUrlLastPath(route.fullPath) || 'element') as CategoryName
  const defaultIcon: string = 'i-lucide-mouse-pointer'

  // 创建点击事件处理函数
  const addLog = (evt?: any) => {
    // 支持函数式选项
    const getValue = (value: any) => {
      return typeof value === 'function' ? value() : value
    }

    // 如果没有传入选项，尝试从事件目标获取文本
    let title = getValue(options?.title)
    if (!title && evt?.target) {
      title = (evt.target as HTMLElement).textContent?.trim() || '新增1条交互日志'
    } else if (!title) {
      title = '新增1条交互日志'
    }

    logStore.addLog(
      options?.category || defaultCategory,
      title,
      getValue(options?.description),
      getValue(options?.icon) || defaultIcon
    )
  }

  return {
    logStore,
    addLog
  }
}

/**
 * 高阶函数：包装原始函数，添加日志功能, 确保正确的类型和上下文绑定
 */
export function withInteractionLog<T extends (...args: any[]) => any>(
  originalFn?: T,
  options?: LogOptions
): T {
  // 确保 useLog 在调用时的上下文正确
  const log = useInteractionLog(options)

  const wrappedFn = (...args: any[]) => {
    // 执行原始函数
    if (originalFn) {
      originalFn(...args)
    }

    // 执行日志记录
    log.addLog(args[0]) // 假设第一个参数是事件对象
  }

  return wrappedFn as T
}
