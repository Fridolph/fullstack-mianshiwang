<script setup lang="ts">
import type { AccordionItem } from '@nuxt/ui'

const items = ref<AccordionItem[]>([
  {
    label: '天行健',
    icon: 'i-lucide-smile',
    content: '君子以自强不息'
  },
  {
    label: '地势坤',
    icon: 'i-lucide-box',
    content: '君子以厚德载物'
  },
  {
    label: '新功能开发中 Coming Soon ...',
    icon: 'i-lucide-swatch-book',
    content: 'Choose a primary and a neutral color from your Tailwind CSS theme.',
    disabled: true
  }
])

const mdItems = [
  {
    label: 'Is Nuxt UI free to use?',
    icon: 'i-lucide-circle-help',
    content: 'Yes! Nuxt UI is completely free and open source under the MIT license. All 125+ components are available to everyone.'
  },
  {
    label: 'Can I use Nuxt UI with Vue without Nuxt?',
    icon: 'i-lucide-circle-help',
    content: 'Yes! While optimized for Nuxt, Nuxt UI works perfectly with standalone Vue projects via our Vite plugin. You can follow the [installation guide](/docs/getting-started/installation/vue) to get started.'
  },
  {
    label: 'Will Nuxt UI work with other CSS frameworks like UnoCSS?',
    icon: 'i-lucide-circle-help',
    content: 'No. Nuxt UI is designed exclusively for Tailwind CSS. UnoCSS support would require significant architecture changes due to different class naming conventions.'
  },
  {
    label: 'How does Nuxt UI handle accessibility?',
    icon: 'i-lucide-circle-help',
    content: 'Through [Reka UI](https://reka-ui.com/docs/overview/accessibility) integration, Nuxt UI provides automatic ARIA attributes, keyboard navigation, focus management, and screen reader support. While offering a strong foundation, testing in your specific use case remains important.'
  },
  {
    label: 'How is Nuxt UI tested?',
    icon: 'i-lucide-circle-help',
    content: 'Nuxt UI ensures reliability with 1000+ Vitest tests covering core functionality and accessibility.'
  },
  {
    label: 'Is Nuxt UI production-ready?',
    icon: 'i-lucide-circle-help',
    content: 'Yes! Nuxt UI is used in production by thousands of applications with extensive tests, regular updates, and active maintenance.'
  }
]

const alertCode = computed(() => (`<template>
  <UAccordion
    type="multiple"
    :items="mdItems"
    :unmount-on-hide="false"
    :default-value="['3']"
    :ui="{
      trigger: 'text-base',
      body: 'text-base text-muted'
    }">
    <template #body="{ item }">
      <MDC :value="item.content" unwrap="p" />
    </template>
  </UAccordion>
</template>

<script>
import type { AccordionItem } from '@nuxt/ui'

const mdItems = [
  {
    label: 'Is Nuxt UI free to use?',
    icon: 'i-lucide-circle-help',
    content: 'Yes! Nuxt UI is completely free and open source under the MIT license. All 125+ components are available to everyone.'
  },
  {
    label: 'Can I use Nuxt UI with Vue without Nuxt?',
    icon: 'i-lucide-circle-help',
    content: 'Yes! While optimized for Nuxt, Nuxt UI works perfectly with standalone Vue projects via our Vite plugin. You can follow the [installation guide](/docs/getting-started/installation/vue) to get started.'
  },
  {
    label: 'Will Nuxt UI work with other CSS frameworks like UnoCSS?',
    icon: 'i-lucide-circle-help',
    content: 'No. Nuxt UI is designed exclusively for Tailwind CSS. UnoCSS support would require significant architecture changes due to different class naming conventions.'
  },
  {
    label: 'How does Nuxt UI handle accessibility?',
    icon: 'i-lucide-circle-help',
    content: 'Through [Reka UI](https://reka-ui.com/docs/overview/accessibility) integration, Nuxt UI provides automatic ARIA attributes, keyboard navigation, focus management, and screen reader support. While offering a strong foundation, testing in your specific use case remains important.'
  },
  {
    label: 'How is Nuxt UI tested?',
    icon: 'i-lucide-circle-help',
    content: 'Nuxt UI ensures reliability with 1000+ Vitest tests covering core functionality and accessibility.'
  },
  {
    label: 'Is Nuxt UI production-ready?',
    icon: 'i-lucide-circle-help',
    content: 'Yes! Nuxt UI is used in production by thousands of applications with extensive tests, regular updates, and active maintenance.'
  }
]
${SCRIPT_END}
`))
</script>

<template>
  <section class="flex flex-col gap-4">
    <h3>基础用法</h3>
    <UAccordion :items="items" />

    <ContentsCodeViewer
      title="UAccordion"
      description="高级用法，可添加 markdown content，更多查看文档"
      :code="alertCode"
      language="vue">
      <UAccordion
        type="multiple"
        :items="mdItems"
        :unmount-on-hide="false"
        :default-value="['3']"
        :ui="{
          trigger: 'text-base',
          body: 'text-base text-muted'
        }">
        <template #body="{ item }">
          <MDC :value="item.content" unwrap="p" />
        </template>
      </UAccordion>
    </ContentsCodeViewer>
  </section>
</template>
