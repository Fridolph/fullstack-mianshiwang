<script setup lang="ts">
import type { LogItem } from '~/stores/interactionLog.store'

const logStore = useInteractionLogStore()
const { deleteCateLogItem, deleteThisCateLogs } = logStore
const { logs } = storeToRefs(logStore)
const route = useRoute()
const category = computed(() => getUrlLastPath(route.path))

// 类型断言：确保TS识别logs包含id属性
const items = computed(() => logs.value?.[category.value as CategoryName] as LogItem[])

const clearThisCateItems = () => deleteThisCateLogs(category.value as CategoryName)
</script>

<template>
  <div class="border border-gray-200 rounded-lg p-4 bg-white shadow-xs hover:shadow-lg use-trans">
    <h3 class="text-lg font-semibold mb-4 text-gray-800 flex justify-between">
      <span>交互日志</span>
      <UIcon
        name="mdi:beaker-remove-outline"
        class="text-gray-400 size-5 use-icon remove"
        @click="clearThisCateItems"
      />
    </h3>
    <UTimeline
      color="neutral"
      :items="items"
      class="w-full">
      <template #title="{ item }">
        {{ item.title }}
        <UIcon
          name="i-lucide-x"
          class="absolute right-0 top-2 size-5 text-gray-500 cursor-pointer hover:text-red-500 transition-colors"
          @click="deleteCateLogItem(category as CategoryName, item.id)"
        />
      </template>
    </UTimeline>
  </div>
</template>
