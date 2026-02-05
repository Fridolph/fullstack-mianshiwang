<script setup lang="ts">
import { useStorage } from '@vueuse/core'

// 使用 Nuxt i18n 的组合式API
const $i18n = useI18n()
const { locale, locales, messages } = $i18n

// 备用语言选项 - 以防 locales 为空
const fallbackOptions = ref([
  { label: '中文', value: 'zh', icon: 'i-emojione-flag-for-china' },
  { label: 'EN', value: 'en', icon: 'i-emojione-flag-for-united-states' },
])

// 使用 useStorage 代替 localStorage
const storedLocale = useStorage('user-locale', locale.value)

// 监听存储的语言变化并更新当前语言
watch(storedLocale, (newLocale) => {
  if (newLocale && newLocale !== locale.value) {
    switchLanguage(newLocale)
    console.log('从存储更新语言为:', newLocale)
  }
})

// 将 locales 对象转换为下拉菜单选项格式
const languageOptions = computed(() => {
  // 如果 locales 为空，使用备用选项
  if (!locales.value || !locales.value.length) {
    return fallbackOptions.value
  }

  const options = locales.value.map((l: any) => ({
    label: l.name,
    value: l.code,
    icon: getLanguageIcon(l.code)
  }))
  return options
})

// 改进的语言切换函数
const switchLanguage = async (langCode: string) => {
  // console.log(`开始切换语言到: ${langCode}`)
  try {
    // 使用 setLocale 方法切换语言，这是官方推荐的方式
    // 它会确保语言文件被正确加载
    if ($i18n.setLocale) {
      await $i18n.setLocale(langCode)
    } else {
      // 如果 setLocale 不可用，回退到直接设置
      locale.value = langCode
    }

    // 更新存储的语言设置
    storedLocale.value = langCode

    console.log(`语言已成功切换为: ${langCode}`)
    console.log(`${langCode} 翻译内容:`, messages.value[langCode])

    // 强制重新渲染页面内容
    if (typeof window !== 'undefined') {
      nextTick(() => {
        // 触发全局事件，让其他组件知道语言已切换
        window.dispatchEvent(new Event('language-changed'))
      })
    }
  } catch (error) {
    console.error(`切换语言到 ${langCode} 失败:`, error)
  }
}

// 当前选择的语言
const selectedLanguage = computed({
  get: () => {
    return locale.value
  },
  set: (value) => {
    const langCode = typeof value === 'string'
      ? value
      : (value && typeof value === 'object' && 'code' in value)
          ? value.code
          : String(value)

    // 使用改进的语言切换函数
    switchLanguage(langCode)
  }
})

// 根据语言代码获取对应的图标
function getLanguageIcon(code: string): string {
  if (code.startsWith('zh')) return 'i-emojione-flag-for-china'
  if (code.startsWith('en')) return 'i-emojione-flag-for-united-states'
  if (code.startsWith('ja')) return 'i-emojione-flag-for-japan'
  return 'i-heroicons-language'
}

const isOpen = ref(false)
const dropdownRef = ref(null)

function onSelect(option: any) {
  selectedLanguage.value = option.value
  isOpen.value = false
}

// 在 onMounted 中添加更多诊断信息
onMounted(() => {
  console.log('LangSelector 已挂载')
  console.log('当前语言:', locale.value)
  console.log('可用语言:', locales.value)

  // 初始化时，预加载所有语言文件
  if (typeof window !== 'undefined') {
    // 监听自定义事件
    window.addEventListener('language-changed', () => {
      console.log('检测到语言变更，重新计算翻译')
    })
  }

  // 添加点击外部关闭下拉菜单
  document.addEventListener('click', (event) => {
    if (dropdownRef.value && !dropdownRef.value.contains(event.target)) {
      isOpen.value = false
    }
  })
})

// 清理事件监听
onUnmounted(() => {
  document.removeEventListener('click', () => {})

  if (typeof window !== 'undefined') {
    window.removeEventListener('language-changed', () => {})
  }
})
</script>

<template>
  <div ref="dropdownRef" class="language-switcher relative">
    <UButton
      class="flex items-center"
      variant="ghost"
      :icon="getLanguageIcon(selectedLanguage)"
      @click.stop="isOpen = !isOpen">
      <span class="ml-2 text-sm hidden sm:inline-block">
        {{ fallbackOptions.find(opt => opt.value === selectedLanguage)?.label || selectedLanguage }}
      </span>
    </UButton>

    <div
      v-if="isOpen"
      class="absolute top-full right-0 mt-1 bg-white dark:bg-gray-800 rounded shadow-lg z-50 w-36 py-1">
      <div
        v-for="option in languageOptions"
        :key="option.value"
        class="px-3 py-2 flex items-center gap-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
        @click.stop="onSelect(option)">
        <UIcon :name="option.icon" class="size-5" />
        <span>{{ option.label }}</span>
        <UIcon
          v-if="selectedLanguage === option.value"
          name="i-heroicons-check"
          class="ml-auto text-primary-500"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.language-switcher {
  position: relative;
  display: inline-block;
}
</style>
