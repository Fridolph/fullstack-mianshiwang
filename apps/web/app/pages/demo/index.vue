<script setup lang="ts">
const demoItems = ref<CardItem[]>([
  {
    title: 'Forms & Zod Validate',
    desc: '测试表单校验 & Zod Schema 自定义表单，嵌套表单及复杂表单场景',
    to: ''
  },
  {
    title: '支持滚动的虚拟列表 & 容器 Demo',
    desc: '展示如何使用虚拟列表和容器组件来实现高效的滚动性能',
    to: '/demo/scroll-area'
  },
  {
    title: 'Table & 综合展示 及 交互模拟',
    desc: '展示如何使用 nuxt-ui 表格组件进行数据展示和交互。添加常见 翻译，操作，弹窗，抽屉等更多功能，加深印象',
    to: '/demo/table-display'
  },
  {
    title: 'JSON 数据实时展示',
    desc: '允许用户手动编辑数据，进行校验后，实时应用（为了配合 Quote 演示 Demo）',
    to: '/demo/quote-calc'
  },
  {
    title: 'Quote 实时报价',
    desc: '多表单交互场景，支持用户对已添加项进行添加、修改、排序，删除，最终',
    to: '/demo/quote-calc',
    showLabel: true
  }
])
</script>

<template>
  <NuxtLayout name="onlyheader">
    <section class="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      <UBlogPost
        v-for="item in demoItems" :key="item.title"
        variant="subtle"
        :title="item.title"
        :description="item.desc"
        :image="item.imgUrl" date="2026-01-08"
        :to="item.to"
        :ui="{
          root: `${!!item.to ? 'bg-white' : 'bg-gray-100'}`,
          header: `px-4 py-2`
        }"
        :badge="item.showLabel ? {
          label: 'Release',
          color: 'primary',
          variant: 'solid'
        } : {}"
      />
    </section>
  </NuxtLayout>
</template>

<style scoped>

</style>
