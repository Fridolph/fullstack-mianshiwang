<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useCodeHighlighter } from '~/composables/Contents/useCodeHighlighter'

export interface JsonEditorProps {
  /**
   * 初始JSON数据
   */
  modelValue: any
  /**
   * 是否只读模式
   */
  readonly?: boolean
  /**
   * 编辑器高度
   */
  height?: string
  /**
   * 组件标题
   */
  title?: string
  /**
   * 组件描述
   */
  description?: string
  /**
   * 是否默认展开代码
   */
  defaultOpen?: boolean
}

const props = withDefaults(defineProps<JsonEditorProps>(), {
  readonly: false,
  height: '300px',
  title: 'JSON编辑器',
  description: '',
  defaultOpen: true
})

const emit = defineEmits<{
  'update:modelValue': [value: any]
  'error': [error: Error | null]
}>()

// 控制面板是否展开
const isOpen = ref(props.defaultOpen)
// 存储JSON字符串
const jsonText = ref('')
// 存储解析错误
const parseError = ref<Error | null>(null)
// 是否处于编辑状态
const isEditing = ref(false)

// 初始化编辑器内容
const initJsonText = () => {
  try {
    jsonText.value = JSON.stringify(props.modelValue, null, 2)
    parseError.value = null
  } catch (error) {
    parseError.value = error as Error
    jsonText.value = '{}' // 默认空对象
  }
}

// 初始化
initJsonText()

// 监听传入数据变化
watch(() => props.modelValue, () => {
  if (!isEditing.value) {
    initJsonText()
  }
}, { deep: true })

// 尝试解析JSON
const parseJson = () => {
  try {
    const parsed = JSON.parse(jsonText.value)
    parseError.value = null
    emit('update:modelValue', parsed)
    emit('error', null)
    return true
  } catch (error) {
    parseError.value = error as Error
    emit('error', error as Error)
    return false
  }
}

// 处理输入变化
const handleInput = () => {
  isEditing.value = true
  parseJson()
}

// 处理失去焦点时的操作
const handleBlur = () => {
  isEditing.value = false
  if (parseJson()) {
    // 重新格式化JSON
    jsonText.value = JSON.stringify(JSON.parse(jsonText.value), null, 2)
  }
}

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
  const isSucc = await onCopy(jsonText.value)
  if (isSucc) {
    toast.add({
      title: '复制成功',
      description: 'JSON已复制到剪贴板',
      icon: 'i-lucide-check',
      color: 'success',
      duration: 2000
    })
  }
}

// 获取颜色模式
const colorMode = useColorMode()

// 根据颜色模式选择主题
const currentTheme = computed(() => {
  return colorMode.value === 'light' ? 'github-light' : 'github-dark'
})

// 为高亮器准备的计算属性
const codeForHighlight = computed(() => jsonText.value)
const languageRef = ref('json')

// 使用高亮器
const { highlightedCode, isHighlighterLoaded } = useCodeHighlighter(
  codeForHighlight,
  languageRef,
  currentTheme
)

// 格式化JSON
const formatJson = () => {
  try {
    const parsed = JSON.parse(jsonText.value)
    jsonText.value = JSON.stringify(parsed, null, 2)
    parseError.value = null
    emit('update:modelValue', parsed)
    emit('error', null)
  } catch (error) {
    // 如果JSON无效，保留原始文本
    parseError.value = error as Error
    emit('error', error as Error)
  }
}

// 切换面板展开/收起
const togglePanel = () => {
  isOpen.value = !isOpen.value
}
</script>

<template>
  <div class="json-editor w-full flex flex-col rounded">
    <!-- 标题和描述 -->
    <div v-if="title || description" class="mb-4">
      <h3 v-if="title" class="text-lg font-medium">
        {{ title }}
      </h3>
      <p v-if="description" class="text-sm text-gray-500 dark:text-gray-400 mt-1">
        {{ description }}
      </p>
    </div>

    <!-- 编辑器头部工具栏 -->
    <div
      class="min-h-12 flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-800 cursor-pointer"
      @click="togglePanel">
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-braces" class="text-gray-500" />
        <span class="text-sm font-medium">JSON</span>
        <UBadge
          v-if="parseError" color="error" variant="subtle"
          size="xs">
          无效JSON
        </UBadge>
      </div>
      <div class="flex items-center gap-2">
        <UButton
          v-if="isOpen && !readonly" color="primary" variant="ghost"
          icon="i-lucide-check-square"
          size="xs" aria-label="格式化JSON" @click.stop="formatJson"
        />
        <UButton
          v-if="isOpen" color="primary" variant="ghost"
          icon="i-lucide-copy" size="xs"
          aria-label="复制JSON" @click.stop="copyCode"
        />
        <UIcon
          :name="isOpen ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
          class="text-gray-500 transition-transform"
        />
      </div>
    </div>

    <!-- JSON编辑区域 -->
    <div v-show="isOpen" class="json-content">
      <!-- 只读模式下使用高亮显示 -->
      <div v-if="readonly">
        <div v-if="!isHighlighterLoaded" class="p-4 text-center text-gray-500">
          <UIcon name="i-lucide-loader" class="animate-spin mr-2" />
          代码高亮加载中...
        </div>
        <div
          v-else class="shiki-wrapper bg-gray-50 p-2 overflow-auto" :style="{ maxHeight: height }"
          v-html="highlightedCode"
        />
      </div>

      <!-- 编辑模式使用textarea -->
      <div v-else class="relative">
        <textarea
          v-model="jsonText" class="w-full font-mono text-sm p-3 bg-gray-50 dark:bg-gray-900 outline-none resize-none border-0" :style="{ height }"
          :class="{ 'border-red-500': parseError }"
          @input="handleInput"
          @blur="handleBlur"
        />

        <!-- 错误提示 -->
        <div v-if="parseError" class="text-red-500 text-xs p-2">
          <UIcon name="i-lucide-alert-triangle" class="inline-block mr-1" />
          JSON 语法错误: {{ parseError.message }}
        </div>
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
    font-size: 14px;
  }
}

:deep(.shiki) {
  background-color: transparent !important;
}

textarea:focus {
  box-shadow: inset 0 0 0 2px rgba(59, 130, 246, 0.3);
}
</style>
