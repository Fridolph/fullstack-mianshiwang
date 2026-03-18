export default defineNuxtPlugin((nuxtApp) => {
  const { $i18n } = nuxtApp

  if (!$i18n) return

  // 监听语言变化
  const { locale } = $i18n

  watch(locale, async (newLocale) => {
    console.log(`插件检测到语言变化: ${newLocale}`)

    // 检查翻译是否已加载
    const { messages } = $i18n

    // 如果是客户端并且 nav.demo 键不存在
    if (import.meta.client && (!messages.value[newLocale]?.nav?.demo)) {
      console.log(`尝试重新加载 ${newLocale} 翻译文件...`)

      try {
        // 重新加载翻译文件 (如果可能)
        // 这里我们尝试强制刷新组件树
        nuxtApp.hooks.callHook('i18n:beforeLocaleSwitch', newLocale)

        // 延迟一下以确保翻译加载完成
        await new Promise(resolve => setTimeout(resolve, 100))

        // 通知页面刷新
        window.dispatchEvent(new Event('language-changed'))

        nuxtApp.hooks.callHook('i18n:localeSwitched', newLocale)
      } catch (error) {
        console.error('重新加载翻译失败:', error)
      }
    }
  })
})
