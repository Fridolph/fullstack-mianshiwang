import mitt, { type Emitter, type Handler } from 'mitt'

/**
 * @description
 * 严格约束事件格式：支持 "模块:业务:事件" / "模块:事件" / "事件"
 * 如 user_order:invoke, 或 server:error, 便于后续扩展，split(':') 右边一定能拿到事件名，左边便于分析业务，埋点等
 */
type EventName = string & { __brand: 'event-name' } // 用字符串字面量 union 类型兜底，确保类型安全
type Events = Record<EventName, any>

export default defineNuxtPlugin(() => {
  const emitter: Emitter<Events> = mitt<Events>()
  const onceMap = new Map<EventName, Handler<Events[EventName]>[]>()

  function once(event: EventName, handler: Handler<Events[EventName]>) {
    if (!onceMap.has(event)) {
      onceMap.set(event, [])
    }

    const wrappedHandler: Handler<Events[EventName]> = (payload) => {
      // 1. 先执行原handler
      handler(payload)
      // 2. 移除wrappedHandler的监听
      emitter.off(event, wrappedHandler)
      // 3. 【修复内存泄漏】清理onceMap中的残留引用
      const handlers = onceMap.get(event)
      if (handlers) {
        const idx = handlers.indexOf(wrappedHandler)
        if (idx > -1) {
          handlers.splice(idx, 1)
          // 如果当前事件的once队列空了，直接删除整个key
          if (handlers.length === 0) {
            onceMap.delete(event)
          }
        }
      }
    }

    onceMap.get(event)?.push(wrappedHandler)
    emitter.on(event, wrappedHandler)
  }

  return {
    provide: {
      mitt: {
        ...emitter,
        once
      }
    }
  }
})
