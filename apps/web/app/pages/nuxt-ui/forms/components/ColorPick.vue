<script setup lang="ts">
const color = ref('#00C16A')

const chip = computed(() => ({ backgroundColor: color.value }))
const text = computed(() => {
  return `Choose color (${color.value})`
})
</script>

<template>
  <ContentsTitleWrap title="ColorPicker">
    <UPopover>
      <UButton
        :label="text" color="neutral" variant="outline"
        class="w-100">
        <template #leading>
          <span :style="chip" class="size-3 rounded-full" />
        </template>
      </UButton>

      <template #content>
        <UColorPicker v-model="color" class="p-2" />
      </template>
    </UPopover>
  </ContentsTitleWrap>
</template>
