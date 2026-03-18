import { defineStore } from 'pinia'

interface UIState {
  authPromptOpen: boolean
  authRedirectPath: string
}

export const useUIStore = defineStore('ui', {
  state: (): UIState => ({
    authPromptOpen: false,
    authRedirectPath: '/'
  }),
  actions: {
    showAuthPrompt(path = '/') {
      this.authPromptOpen = true
      this.authRedirectPath = path || '/'
    },
    hideAuthPrompt() {
      this.authPromptOpen = false
      this.authRedirectPath = '/'
    }
  }
})
