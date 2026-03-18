<script setup lang="ts">
import { withInteractionLog } from '~/composables/useInteractionLog'

// 按钮变体
const buttonVariants = ['solid', 'outline', 'soft', 'ghost', 'link'] as const
const selectedVariant = ref<typeof buttonVariants[number]>('solid')

// 按钮颜色
const buttonColors = ['primary', 'secondary', 'success', 'warning', 'danger', 'info'] as const
const selectedColor = ref<typeof buttonColors[number]>('primary')

// 按钮尺寸
const buttonSizes = ['xs', 'sm', 'md', 'lg', 'xl']
const selectedSize = ref('md')

// 点击按钮变体
const changeButtonVariant = withInteractionLog((variant: typeof buttonVariants[number]) => {
  selectedVariant.value = variant
}, {
  title: () => `切换按钮变体为 ${selectedVariant.value}`,
  description: () => `选择了 ${selectedVariant.value} 变体的按钮`,
  icon: 'i-lucide-palette'
})

// 点击按钮颜色
const changeButtonColor = withInteractionLog((color: typeof buttonColors[number]) => {
  selectedColor.value = color
}, {
  title: () => `切换按钮颜色为 ${selectedColor.value}`,
  description: () => `选择了 ${selectedColor.value} 颜色的按钮`,
  icon: 'i-lucide-droplet'
})

// 点击按钮尺寸
const changeButtonSize = withInteractionLog((size: string) => {
  selectedSize.value = size
}, {
  title: () => `切换按钮尺寸为 ${selectedSize.value}`,
  description: () => `选择了 ${selectedSize.value} 尺寸的按钮`,
  icon: 'i-lucide-move-horizontal'
})

// 生成代码示例
const buttonCode = computed(() => {
  return `<UButton
  color="${selectedColor.value}"
  variant="${selectedVariant.value}"
  size="${selectedSize.value}"
>
  按钮
</UButton>`
})

const buttonWithIconCode = computed(() => {
  return `<UButton
  color="${selectedColor.value}"
  variant="${selectedVariant.value}"
  size="${selectedSize.value}"
  icon="i-lucide-heart"
>
  喜欢
</UButton>`
})

const loadingButtonCode = computed(() => {
  return `<UButton
  color="${selectedColor.value}"
  variant="${selectedVariant.value}"
  size="${selectedSize.value}"
  :loading="true"
>
  加载中
</UButton>`
})
</script>

<template>
  <div class="space-y-8">
    <div>
      <h3 class="text-lg font-medium mb-4">
        UButton 按钮组件
      </h3>
      <p class="text-gray-500 dark:text-gray-400 mb-4">
        按钮是用户界面中最基本的交互元素，用于触发操作或事件。
      </p>
    </div>

    <!-- 配置面板 -->
    <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
      <h4 class="font-medium mb-3">
        配置选项
      </h4>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- 按钮变体 -->
        <div>
          <p class="text-sm mb-2">
            按钮变体
          </p>
          <div class="flex flex-wrap gap-2">
            <UButton
              v-for="variant in buttonVariants"
              :key="variant"
              :color="selectedColor"
              :variant="selectedVariant === variant ? variant : 'outline'"
              size="sm"
              class="cursor-pointer"
              @click="changeButtonVariant(variant)">
              {{ variant }}
            </UButton>
          </div>
        </div>

        <!-- 按钮颜色 -->
        <div>
          <p class="text-sm mb-2">
            按钮颜色
          </p>
          <div class="flex flex-wrap gap-2">
            <UButton
              v-for="color in buttonColors"
              :key="color"
              :color="color"
              :variant="selectedVariant"
              size="sm"
              class="cursor-pointer"
              @click="changeButtonColor(color)">
              {{ color }}
            </UButton>
          </div>
        </div>

        <!-- 按钮尺寸 -->
        <div>
          <p class="text-sm mb-2">
            按钮尺寸
          </p>
          <div class="flex flex-wrap gap-2">
            <UButton
              v-for="size in buttonSizes"
              :key="size"
              :color="selectedColor"
              :variant="selectedVariant"
              :size="size"
              class="cursor-pointer"
              @click="changeButtonSize(size)">
              {{ size }}
            </UButton>
          </div>
        </div>
      </div>
    </div>

    <!-- 基础按钮 -->
    <ContentsCodeViewer
      title="基础按钮"
      description="最基本的按钮用法，可以根据需要设置不同的颜色、变体和尺寸。"
      :code="buttonCode"
      language="vue">
      <div class="flex flex-wrap gap-3">
        <UButton
          :color="selectedColor"
          :variant="selectedVariant"
          :size="selectedSize">
          按钮
        </UButton>
      </div>
    </ContentsCodeViewer>

    <!-- 带图标的按钮 -->
    <ContentsCodeViewer
      title="带图标的按钮"
      description="按钮可以包含图标，增强视觉效果和信息传达。"
      :code="buttonWithIconCode"
      language="vue">
      <div class="flex flex-wrap gap-3">
        <UButton
          :color="selectedColor"
          :variant="selectedVariant"
          :size="selectedSize"
          icon="i-lucide-heart">
          喜欢
        </UButton>
      </div>
    </ContentsCodeViewer>

    <!-- 加载中的按钮 -->
    <ContentsCodeViewer
      title="加载中的按钮"
      description="按钮可以显示加载状态，防止用户重复点击。"
      :code="loadingButtonCode"
      language="vue"
      :default-open="true">
      <div class="flex flex-wrap gap-3">
        <UButton
          :color="selectedColor"
          :variant="selectedVariant"
          :size="selectedSize"
          :loading="true">
          加载中
        </UButton>
      </div>
    </ContentsCodeViewer>
  </div>
</template>
