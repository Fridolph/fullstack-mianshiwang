<script setup lang="ts">
import { withInteractionLog } from '~/composables/useInteractionLog'

const isShowAlert = ref(true)

const toggleAlert = withInteractionLog(() => {
  console.log('toggleAlert')
  isShowAlert.value = !isShowAlert.value
}, {
  title: () => `点击 ${isShowAlert.value ? 'open' : 'close'} alert 按钮`
})

// 关闭 alert 日志
const closeAlert = withInteractionLog(() => {
  isShowAlert.value = false
}, {
  title: () => `click Close Icon`,
  description: () => `点击 Alert 组件 的 Close Icon 按钮`
})

// 告警 Actions 日志
const handleAction1 = withInteractionLog(() => {
  console.log('handleAction1')
}, {
  title: () => `click Action 1`,
  description: () => `点击 Alert 组件 的 Action 1 按钮`
})

const handleAction2 = withInteractionLog(() => {
  console.log('handleAction2')
}, {
  title: () => `click Action 2`,
  description: () => `点击 Alert 组件 的 Action 2 按钮`
})

// 生成代码示例
const alertCode = computed(() => {
  return `<template>
  <UAlert
    title="UAlert -> 可配置"
    description="You can change the primary color in your app config."
    color="neutral"
    variant="outline"
    :close="{
      color: 'primary',
      class: 'rounded-full cursor-pointer',
      onClick: closeAlert
    }"
    :actions="[
      { label: 'Action 1', class: 'cursor-pointer', onClick: handleAction1 },
      {
        label: 'Action 2',
        color: 'neutral',
        class: 'cursor-pointer',
        variant: 'subtle',
        onClick: handleAction2
      }
    ]"
  />
</template>
`
})
</script>

<template>
  <div class="space-y-6">
    <div>
      <h3 class="text-lg font-medium mb-4">
        UAlert 警告组件
      </h3>
      <p class="text-gray-500 dark:text-gray-400 mb-4">
        警告组件用于向用户显示重要信息，可以包含标题、描述、操作按钮和关闭按钮。
      </p>
    </div>

    <div>
      <UButton
        color="neutral"
        :ui="{ base: 'w-auto max-w-full cursor-pointer' }"
        @click="toggleAlert">
        {{ isShowAlert ? 'close' : 'show' }} alert
      </UButton>
    </div>

    <div class="grid grid-cols-1 gap-6">
      <USkeleton v-if="!isShowAlert" class="self-start h-50" />
      <ContentsCodeViewer
        v-else
        title="可配置的警告组件"
        description="这个警告组件具有自定义的颜色、变体、关闭按钮和操作按钮。"
        :code="alertCode"
        language="vue">
        <UAlert
          title="UAlert -> 可配置"
          description="You can change the primary color in your app config."
          color="neutral"
          variant="outline"
          :close="{
            color: 'primary',
            class: 'rounded-full cursor-pointer',
            onClick: closeAlert
          }"
          :actions="[
            { label: 'Action 1', class: 'cursor-pointer', onClick: handleAction1 },
            {
              label: 'Action 2',
              color: 'neutral',
              class: 'cursor-pointer',
              variant: 'subtle',
              onClick: handleAction2
            }
          ]"
        />
      </ContentsCodeViewer>
    </div>
  </div>
</template>
