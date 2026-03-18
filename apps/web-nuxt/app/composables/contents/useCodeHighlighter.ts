import { createHighlighter } from 'shiki'

export function useCodeHighlighter(
  code: ComputedRef<string> | Ref<string>,
  language: ComputedRef<string> | Ref<string>,
  theme: ComputedRef<string> | Ref<string>
) {
  const highlightedCode = ref('')
  const isHighlighterLoaded = ref(false)
  let highlighter: any = null

  // 初始化 shiki 并高亮代码
  onMounted(async () => {
    try {
      // 加载主题
      highlighter = await createHighlighter({
        themes: ['github-light', 'github-dark'],
        langs: [language.value]
      })

      updateHighlightedCode()
      isHighlighterLoaded.value = true
    } catch (error) {
      console.error('Shiki 初始化失败:', error)
    }
  })

  // 更新高亮代码的方法
  const updateHighlightedCode = () => {
    if (highlighter) {
      highlightedCode.value = highlighter.codeToHtml(code.value, {
        lang: language.value,
        theme: theme.value
      })
    }
  }

  // 监听代码和语言变化，重新高亮
  watch([code, language], () => {
    if (isHighlighterLoaded.value) {
      updateHighlightedCode()
    }
  })

  // 监听主题变化，重新高亮
  watch(theme, () => {
    if (isHighlighterLoaded.value) {
      updateHighlightedCode()
    }
  })

  return {
    highlightedCode,
    isHighlighterLoaded
  }
}
