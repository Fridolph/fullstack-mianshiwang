import { ref } from 'vue'

export function useCopyToClipboard() {
  const toast = useToast()

  const isCopied = ref(false)
  const isSupported = ref(true)

  // 检查环境支持
  if (import.meta.client) {
    try {
      isSupported.value = Boolean(
        (navigator && navigator.clipboard) || document.execCommand
      )
    } catch (err) {
      isSupported.value = false
      console.error(err)
    }
  } else {
    isSupported.value = false
  }

  const onCopy = async (text: string): Promise<boolean> => {
    if (!isSupported.value) {
      console.warn('Copy to clipboard is not supported in this environment')
      return false
    }

    try {
      // 优先使用现代API
      if (import.meta.client && navigator && navigator.clipboard) {
        await navigator.clipboard.writeText(text)
        isCopied.value = true
        setTimeout(() => {
          isCopied.value = false
        }, 2000)
        return true
      }

      // 后备方案
      const textArea = document.createElement('textarea')
      textArea.value = text

      // 防止显示到界面上
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      textArea.style.top = '-999999px'
      document.body.appendChild(textArea)

      textArea.focus()
      textArea.select()

      const result = document.execCommand('copy')
      document.body.removeChild(textArea)

      isCopied.value = result
      if (result) {
        setTimeout(() => {
          isCopied.value = false
        }, 2000)
      }
      return result
    } catch (error) {
      console.error('Failed to copy: ', error)
      return false
    }
  }

  return {
    isCopied, isSupported,
    onCopy
  }
}
