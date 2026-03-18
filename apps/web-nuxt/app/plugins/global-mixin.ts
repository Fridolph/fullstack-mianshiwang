// plugins/global-mixin.ts
import { useInteractionLog } from '~/composables/useInteractionLog'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.mixin({
    methods: {
      addCLog(options?: LogOptions) {
        return useInteractionLog(options).addLog
      },
      withInteractionLog(fn?: (evt: any) => void, options?: LogOptions) {
        return (evt: any) => {
          if (fn) fn(evt)
          useInteractionLog(options).addLog(evt)
        }
      }
    }
  })
})
