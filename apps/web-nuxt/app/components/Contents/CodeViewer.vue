<script setup lang="ts">
import { withInteractionLog } from '~/composables/useInteractionLog'
import { useCodeHighlighter } from '~/composables/Contents/useCodeHighlighter'
import { ref, computed } from 'vue'

export interface CodeShowerProps {
  /**
   * 组件标题
   */
  title?: string
  /**
   * 组件描述
   */
  description?: string
  /**
   * 代码示例
   */
  code: string
  /**
   * 代码语言
   */
  language?: string
  /**
   * 是否默认展开代码
   */
  defaultOpen?: boolean
  /**
   * 预览区域的自定义类名
   */
  previewClass?: string
}

const props = withDefaults(defineProps<CodeShowerProps>(), {
  title: '',
  description: '',
  language: 'html',
  defaultOpen: false,
  previewClass: ''
})

// 检查是否有代码内容
const hasCode = computed(() => Boolean(props.code?.trim()))

// 获取颜色模式
const colorMode = useColorMode()

// 根据颜色模式选择主题
const currentTheme = computed(() => {
  return colorMode.value === 'light' ? 'github-light' : 'github-dark'
})

// 控制代码示例是否可见
const isOpen = ref(props.defaultOpen)

// 切换代码可见性
const toggleCode = withInteractionLog(() => {
  isOpen.value = !isOpen.value
}, {
  title: () => `${isOpen.value ? '展开' : '收起'}代码示例`,
  description: () => `点击${isOpen.value ? '展开' : '收起'}代码示例面板`,
  icon: 'i-lucide-code'
})

// 复制代码到剪贴板
const toast = useToast()
const { onCopy, isSupported } = useCopyToClipboard()
const copyCode = async () => {
  if (!isSupported.value) {
    toast.add({
      title: '复制失败',
      description: '当前环境不支持复制功能',
      icon: 'i-lucide-alert-triangle',
      color: 'warning',
      duration: 2000
    })
    return
  }
  const isSucc = await onCopy(props.code)
  if (isSucc) {
    toast.add({
      title: '复制成功',
      description: '代码已复制到剪贴板',
      icon: 'i-lucide-check',
      color: 'success',
      duration: 2000
    })
  }
}

// 为 useCodeHighlighter 创建响应式引用
const codeRef = computed(() => props.code)
const languageRef = computed(() => props.language)

// 使用 useCodeHighlighter hook 处理代码高亮
const { highlightedCode, isHighlighterLoaded } = useCodeHighlighter(
  codeRef,
  languageRef,
  currentTheme
)
</script>

<template>
  <div class="content-code-demo w-full flex flex-col gap-2 dark:border-gray-700">
    <!-- 标题和描述 -->
    <div v-if="title || description" class=" ">
      <h3 v-if="title" class="text-lg font-medium">
        {{ title }}
      </h3>
      <p v-if="description" class="text-sm text-gray-500 dark:text-gray-400 mt-1">
        {{ description }}
      </p>
    </div>

    <!-- 预览区域 -->
    <div
      class="demo-wrapper min-h-[100px] bg-white dark:bg-gray-900"
      :class="previewClass">
      <slot />
    </div>

    <!-- 代码区域 - 仅当有代码内容时显示 -->
    <div v-if="hasCode" class="code-wrapper">
      <!-- 代码标题栏 -->
      <div
        class="code-header flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-800 cursor-pointer"
        @click="toggleCode">
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-code" class="text-gray-500" />
          <span class="text-sm font-medium">{{ language.toUpperCase() }}</span>
        </div>
        <div class="flex items-center gap-2">
          <UButton
            v-if="isOpen"
            color="primary"
            variant="ghost"
            icon="i-lucide-copy"
            size="xs"
            aria-label="复制代码"
            @click.stop="copyCode"
          />
          <UIcon
            :name="isOpen ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
            class="text-gray-500 transition-transform"
          />
        </div>
      </div>

      <!-- 代码内容 - 使用 Shiki 替换原来的 ContentRenderer -->
      <div v-show="isOpen" class="code-content bg-gray-100">
        <div v-if="!isHighlighterLoaded" class="p-4 text-center text-gray-500">
          <UIcon name="i-lucide-loader" class="animate-spin mr-2" />
          代码高亮加载中...
        </div>
        <div v-else class="shiki-wrapper bg-gray-50 p-2 text-sm" v-html="highlightedCode" />
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Shiki 样式调整 */
::deep(.shiki-wrapper) {
  padding: 0;
  margin: 0;

  /* 调整 shiki 生成的代码样式 */
  pre {
    margin: 0 !important;
    border-radius: 0 !important;
    border: none !important;
  }
  code {
    width: 100%;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  }
}

:deep(.shiki) {
  background-color: transparent !important;
}
</style>
