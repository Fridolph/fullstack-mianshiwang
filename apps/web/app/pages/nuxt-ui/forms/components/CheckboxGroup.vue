<template>
  <ContentsTitleWrap class="w-100" title="Checkbox & checkboxGroup">
    <UCheckboxGroup v-model="value" :items="items" orientation="horizontal" />

    <h3>
      group and disabled
    </h3>
    <UCheckboxGroup v-model="value2" :items="dItems" />
  </ContentsTitleWrap>
</template>

<script setup lang="ts">
import type { CheckboxGroupItem } from '@nuxt/ui'

const items = ref(['A', 'B', 'C', 'D'])
const value = ref([''])

const dItems = ref<CheckboxGroupItem[]>([
  {
    label: 'System',
    description: 'only system ... haha',
    value: '1'
  },
  {
    label: 'Work',
    description: 'only system ... haha',
    value: '2'
  },
  {
    label: 'Hobby',
    description: 'You are beautitty',
    value: '3'
  },
  {
    label: 'Sleep',
    description: `You can't click ... `,
    value: '4',
    disabled: true
  }
])
const value2 = ref(['System'])
</script>
