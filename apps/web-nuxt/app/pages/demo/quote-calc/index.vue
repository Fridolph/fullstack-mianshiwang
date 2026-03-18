<script setup lang="ts">
import QuotationDisplay from '~/components/Contents/QuotationDisplay.vue'
import { mainList, secList, thirdList, decList, subtractList } from './mockData'

// 错误状态
const hasError = ref(false)
const handleError = (error: Error | null) => {
  hasError.value = !!error
}

const requiredCalculationParams = ref({
  taxRate: 0.1
})
const computedData = computed(() => {
  return {
    finalPrice: ''
  }
})
</script>

<template>
  <NuxtLayout name="uicomp" layout-class="flex flex-col gap-4">
    <h1 class="text-2xl font-bold mb-6">
      模拟实时数据  快速计算 & 展示 业务
    </h1>

    <div class="grid grid-cols-2 lg:grid-cols-2 gap-6">
      <!-- 编辑器区域 -->
      <section class="flex flex-col gap-y-8 gap-x-4">
        <h2 class="text-xl font-semibold">
          这里为方便实用了 mock 数据，模拟多表单交互的场景（表单的交互放另一个Demo里）
        </h2>

        <ContentsJsonEditor
          v-model="mainList"
          title="1. 主商品 mainList 数据"
          description="编辑 主商品列表数据，格式必须是有效的JSON数组"
          height="300px"
          @error="handleError"
        />
        <ContentsJsonEditor
          v-model="secList"
          title="2. 次级商品 secList 数据"
          height="300px"
          @error="handleError"
        />
        <ContentsJsonEditor
          v-model="thirdList"
          title="3. 三级商品 thirdList 数据"
          height="300px"
          @error="handleError"
        />
        <ContentsJsonEditor
          v-model="decList"
          title="4. 补贴、优惠项 decList"
          description="用来和上述相减的"
          height="200px"
          @error="handleError"
        />
        <ContentsJsonEditor
          v-model="subtractList"
          title="5. 其他项 subtractList"
          description="该项可灵活定制，可加可减，方便一些特殊灵活需要"
          height="200px"
          @error="handleError"
        />
        <ContentsJsonEditor
          v-model="requiredCalculationParams"
          title="计算所需的必要参数"
          description="如税率，一些限制项，计算规则等等；这里不展开根据需要自行填写"
          height="200px"
          @error="handleError"
        />
      </section>

      <!-- 预览区域 -->
      <section class="flex flex-col gap-2">
        <ContentsJsonEditor
          v-model="computedData"
          readonly
          title="根据左边商品项动态计算出的 Computed"
          description="该项可灵活定制，可加可减，方便一些特殊灵活需要"
          height="200px"
          @error="handleError"
        />
        <USeparator class="my-4" />
        <QuotationDisplay
          :main-list="mainList"
          :sec-list="secList"
          :third-list="thirdList"
          :dec-list="decList"
          :subtract-list="subtractList"
          :gst-rate="10"
        />
      </section>
    </div>
  </nuxtlayout>
</template>
