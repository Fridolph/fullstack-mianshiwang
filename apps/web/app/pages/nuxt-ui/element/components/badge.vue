<script setup lang="ts">
import { withInteractionLog } from '~/composables/useInteractionLog'

// 徽章类型
const badgeTypes = ['default', 'primary', 'secondary', 'success', 'warning', 'danger', 'info'] as const
type BadgeType = typeof badgeTypes[number]
const selectedType = ref<BadgeType>('primary')

// 徽章变体
const badgeVariants = ['solid', 'outline', 'soft'] as const
type BadgeVariant = typeof badgeVariants[number]
const selectedVariant = ref<BadgeVariant>('solid')

// 徽章尺寸
const badgeSizes = ['xs', 'sm', 'md', 'lg'] as const
type BadgeSize = typeof badgeSizes[number]
const selectedSize = ref<BadgeSize>('md')

// 徽章圆角
const isRounded = ref(true)

// 点击徽章类型
const changeBadgeType = withInteractionLog((type: BadgeType) => {
  selectedType.value = type
}, {
  title: () => `切换徽章类型为 ${selectedType.value}`,
  description: () => `选择了 ${selectedType.value} 类型的徽章`,
  icon: 'i-lucide-tag'
})

// 点击徽章变体
const changeBadgeVariant = withInteractionLog((variant: BadgeVariant) => {
  selectedVariant.value = variant
}, {
  title: () => `切换徽章变体为 ${selectedVariant.value}`,
  description: () => `选择了 ${selectedVariant.value} 变体的徽章`,
  icon: 'i-lucide-palette'
})

// 点击徽章尺寸
const changeBadgeSize = withInteractionLog((size: BadgeSize) => {
  selectedSize.value = size
}, {
  title: () => `切换徽章尺寸为 ${selectedSize.value}`,
  description: () => `选择了 ${selectedSize.value} 尺寸的徽章`,
  icon: 'i-lucide-move-horizontal'
})

// 切换圆角
const toggleRounded = withInteractionLog(() => {
  isRounded.value = !isRounded.value
}, {
  title: () => `${isRounded.value ? '启用' : '禁用'}徽章圆角`,
  description: () => `将徽章圆角设置为 ${isRounded.value}`,
  icon: 'i-lucide-circle-dot'
})

// 示例数据
const notifications = ref(5)
const increaseNotifications = withInteractionLog(() => {
  notifications.value++
}, {
  title: '增加通知数量',
  description: '点击增加通知徽章的数字',
  icon: 'i-lucide-plus'
})

const decreaseNotifications = withInteractionLog(() => {
  if (notifications.value > 0) {
    notifications.value--
  }
}, {
  title: '减少通知数量',
  description: '点击减少通知徽章的数字',
  icon: 'i-lucide-minus'
})

// 生成代码示例
const badgeCode = computed(() => {
  return `<UBadge
  color="${selectedType.value === 'default' ? 'gray' : selectedType}"
  variant="${selectedVariant.value}"
  size="${selectedSize.value}"
  :rounded="${isRounded.value}"
>
  徽章文本
</UBadge>`
})

const badgeWithIconCode = computed(() => {
  return `<UBadge
  color="${selectedType.value === 'default' ? 'gray' : selectedType}"
  variant="${selectedVariant.value}"
  size="${selectedSize.value}"
  :rounded="${isRounded.value}"
>
  <UIcon name="i-lucide-bell" class="mr-1" />
  通知
</UBadge>`
})

const notificationBadgeCode = computed(() => {
  return `<div class="relative">
  <UIcon name="i-lucide-bell" class="text-2xl" />
  <UBadge
    color="${selectedType.value === 'default' ? 'gray' : selectedType}"
    variant="${selectedVariant.value}"
    size="sm"
    :rounded="true"
    class="absolute -top-1 -right-1"
  >
    ${notifications.value}
  </UBadge>
</div>`
})

const buttonWithBadgeCode = computed(() => {
  return `<UButton
  color="${selectedType.value === 'default' ? 'gray' : selectedType}"
  variant="${selectedVariant.value === 'solid' ? 'outline' : 'solid'}"
>
  消息
  <UBadge
    color="${selectedType.value === 'default' ? 'info' : selectedType}"
    variant="${selectedVariant.value}"
    size="sm"
    :rounded="${isRounded.value}"
    class="ml-2"
  >
    ${notifications.value}
  </UBadge>
</UButton>`
})
</script>

<template>
  <div class="space-y-8">
    <div>
      <h3 class="text-lg font-medium mb-4">
        UBadge 徽章组件
      </h3>
      <p class="text-gray-500 dark:text-gray-400 mb-4">
        徽章是一种小型UI元素，用于显示状态、计数或标签信息。
      </p>
    </div>

    <!-- 配置面板 -->
    <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
      <h4 class="font-medium mb-3">
        配置选项
      </h4>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- 徽章类型 -->
        <div>
          <p class="text-sm mb-2">
            徽章类型
          </p>
          <div class="flex flex-wrap gap-2">
            <UBadge
              v-for="type in badgeTypes"
              :key="type"
              :color="type === 'default' ? 'info' : type"
              :variant="selectedType === type ? 'solid' : 'outline'"
              class="cursor-pointer"
              @click="changeBadgeType(type)">
              {{ type }}
            </UBadge>
          </div>
        </div>

        <!-- 徽章变体 -->
        <div>
          <p class="text-sm mb-2">
            徽章变体
          </p>
          <div class="flex flex-wrap gap-2">
            <UBadge
              v-for="variant in badgeVariants"
              :key="variant"
              :color="selectedType === 'default' ? 'info' : selectedType"
              :variant="selectedVariant === variant ? variant : 'outline'"
              class="cursor-pointer"
              @click="changeBadgeVariant(variant)">
              {{ variant }}
            </UBadge>
          </div>
        </div>

        <!-- 徽章尺寸 -->
        <div>
          <p class="text-sm mb-2">
            徽章尺寸
          </p>
          <div class="flex flex-wrap gap-2">
            <UBadge
              v-for="size in badgeSizes"
              :key="size"
              :color="selectedType === 'default' ? 'info' : selectedType"
              :size="size"
              :variant="selectedVariant"
              class="cursor-pointer"
              @click="changeBadgeSize(size)">
              {{ size }}
            </UBadge>
          </div>
        </div>

        <!-- 圆角选项 -->
        <div>
          <p class="text-sm mb-2">
            圆角选项
          </p>
          <UButton
            :color="selectedType === 'default' ? 'info' : selectedType"
            :variant="selectedVariant"
            size="sm"
            @click="toggleRounded">
            {{ isRounded ? '禁用圆角' : '启用圆角' }}
          </UButton>
        </div>
      </div>
    </div>

    <!-- 基础徽章 -->
    <ContentsCodeViewer
      title="基础徽章"
      description="最简单的徽章用法，可以根据需要设置不同的颜色、变体和尺寸。"
      :code="badgeCode"
      language="vue">
      <div class="flex flex-wrap gap-3">
        <UBadge
          :color="selectedType === 'default' ? 'info' : selectedType"
          :variant="selectedVariant"
          :size="selectedSize"
          :rounded="isRounded">
          徽章
        </UBadge>
      </div>
    </ContentsCodeViewer>

    <!-- 带图标的徽章 -->
    <ContentsCodeViewer
      title="带图标的徽章"
      description="徽章可以包含图标，增强视觉效果和信息传达。"
      :code="badgeWithIconCode"
      language="vue">
      <div class="flex flex-wrap gap-3">
        <UBadge
          :color="selectedType === 'default' ? 'info' : selectedType"
          :variant="selectedVariant"
          :size="selectedSize"
          :rounded="isRounded">
          <UIcon name="i-lucide-bell" class="mr-1" />
          通知
        </UBadge>

        <UBadge
          :color="selectedType === 'default' ? 'info' : selectedType"
          :variant="selectedVariant"
          :size="selectedSize"
          :rounded="isRounded">
          <UIcon name="i-lucide-check" class="mr-1" />
          已完成
        </UBadge>
      </div>
    </ContentsCodeViewer>

    <!-- 通知徽章 -->
    <ContentsCodeViewer
      title="通知徽章"
      description="徽章常用于显示通知计数，可以放置在图标或按钮的角落。"
      :code="notificationBadgeCode"
      language="vue">
      <div class="flex items-center gap-4">
        <UButton icon="i-lucide-minus" size="sm" @click="decreaseNotifications" />
        <div class="relative">
          <UIcon name="i-lucide-bell" class="text-2xl" />
          <UBadge
            :color="selectedType === 'default' ? 'info' : selectedType"
            :variant="selectedVariant"
            :size="selectedSize === 'lg' ? 'md' : 'sm'"
            :rounded="true"
            class="absolute -top-1 -right-1">
            {{ notifications }}
          </UBadge>
        </div>
        <UButton icon="i-lucide-plus" size="sm" @click="increaseNotifications" />
      </div>
    </ContentsCodeViewer>

    <!-- 徽章在按钮中的应用 -->
    <ContentsCodeViewer
      title="徽章在按钮中的应用"
      description="徽章可以与按钮组合使用，显示相关的计数或状态信息。"
      :code="buttonWithBadgeCode"
      language="vue">
      <div class="flex flex-wrap gap-3">
        <UButton
          :color="selectedType === 'default' ? 'info' : selectedType"
          :variant="selectedVariant === 'solid' ? 'outline' : 'solid'">
          消息
          <UBadge
            :color="selectedType === 'default' ? 'info' : selectedType"
            :variant="selectedVariant"
            :size="selectedSize === 'lg' ? 'md' : 'sm'"
            :rounded="isRounded"
            class="ml-2">
            {{ notifications }}
          </UBadge>
        </UButton>
      </div>
    </ContentsCodeViewer>
  </div>
</template>
