<script setup lang="ts">
import { computed, ref } from 'vue'

// 定义接口类型
interface ProductItem {
  id?: number
  productType?: string
  productName: string
  quantity: number
  unitCost?: number | null
  unitPrice: number | null
  margin?: number | null
  lineCost?: number | null
  linePrice: number | null
  isHidePrice?: number | null
  isHideItem?: number | null
}

interface AdditionalItem {
  itemName: string
  unit?: string
  quantity: number
  unitCost?: number
  unitPrice: number
  margin?: number
  lineCost?: number
  linePrice: number
  isHidePrice?: number | null
  isHideItem?: number | null
}

interface DeductionItem {
  support?: number
  switch?: number
  isHideItem?: number
  isHidePrice?: number
  gstType?: string
  linePrice: number
  type?: string
  labelKey?: string
  quantity?: number
  unitPrice?: number
  installationYear?: string
}

interface DiscountItem {
  itemName: string
  gstType?: string
  unitPrice: number
  linePrice: number
  isHidePrice?: number | null
  isHideItem?: number | null
}

const props = defineProps<{
  mainList: ProductItem[]
  secList: AdditionalItem[]
  thirdList: AdditionalItem[]
  decList: DeductionItem[]
  subtractList: DiscountItem[]
  gstRate?: number
}>()

// 设置默认GST税率
const gstRate = computed(() => props.gstRate || 10)

// 控制各部分的折叠状态
const expandedSections = ref({
  system: true,
  discount: true,
  deductions: true
})

// 计算系统总价（不含GST）
const systemSubtotalExGST = computed(() => {
  // 主产品总价
  const mainTotal = props.mainList.reduce((sum, item) =>
    sum + (item.linePrice || 0), 0)

  // 其他产品总价
  const secTotal = props.secList.reduce((sum, item) =>
    sum + (item.linePrice || 0), 0)

  // 额外费用总价
  const thirdTotal = props.thirdList.reduce((sum, item) =>
    sum + (item.linePrice || 0), 0)

  return mainTotal + secTotal + thirdTotal
})

// 计算主要产品总价
const keyProductsTotal = computed(() => {
  return props.mainList.reduce((sum, item) =>
    sum + (item.linePrice || 0), 0)
})

// 计算系统余额
const systemBalanceTotal = computed(() => {
  return props.secList.reduce((sum, item) =>
    sum + (item.linePrice || 0), 0)
})

// 计算额外费用
const additionalChargesTotal = computed(() => {
  return props.thirdList.reduce((sum, item) =>
    sum + (item.linePrice || 0), 0)
})

// 计算GST金额
const gstAmount = computed(() => {
  return (systemSubtotalExGST.value * gstRate.value) / 100
})

// 计算系统总价（含GST）
const systemTotalIncGST = computed(() => {
  return systemSubtotalExGST.value + gstAmount.value
})

// 计算扣减总额
const deductionsTotal = computed(() => {
  return props.decList.reduce((sum, item) =>
    sum + (item.linePrice || 0), 0)
})

// 计算折扣总额
const discountTotal = computed(() => {
  return props.subtractList.reduce((sum, item) =>
    sum + (item.linePrice || 0), 0)
})

// 计算最终成本
const totalCost = computed(() => {
  // 这里的逻辑需要根据实际业务调整
  return 243.4 // 示例值，实际应从数据计算
})

// 计算毛利率
const grossMargin = computed(() => {
  // 示例值，实际应从数据计算
  return 90.13
})

// 计算毛利
const grossProfit = computed(() => {
  // 示例值，实际应从数据计算
  return 2222.73
})

// 计算最终价格
const finalPrice = computed(() => {
  return systemTotalIncGST.value - deductionsTotal.value
})

// 切换部分的展开/折叠状态
const toggleSection = (section: keyof typeof expandedSections.value) => {
  expandedSections.value[section] = !expandedSections.value[section]
}

// 格式化价格
const formatPrice = (price: number) => {
  return price.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}
</script>

<template>
  <div class="quote-summary bg-white rounded-lg shadow p-4">
    <!-- 系统总价部分 -->
    <div class="system-total border-b border-gray-300 border-dashed pb-4">
      <div class="flex justify-between items-center cursor-pointer" @click="toggleSection('system')">
        <div class="flex items-center">
          <UIcon
            :name="expandedSections.system ? 'i-heroicons-chevron-down' : 'i-heroicons-chevron-right'"
            class="mr-2 text-gray-500 w-5 h-5"
          />
          <h2 class="inline-flex gap-1 items-center text-xl font-bold">
            <span>System Total</span>
            <UBadge
              size="sm" variant="subtle"
              label="incl. GST"
            />
          </h2>
        </div>
        <span class="text-xl font-bold">${{ formatPrice(systemTotalIncGST) }}</span>
      </div>

      <!-- 系统总价的子项目 -->
      <div v-if="expandedSections.system" class="mt-3 space-y-2 pl-7">
        <!-- 关键产品 -->
        <div class="flex justify-between items-center">
          <div class="inline-flex gap-1 items-center font-medium">
            <span>Key Products</span>
            <UBadge
              size="sm" variant="subtle"
              label="excl. GST"
            />
          </div>
          <span class="font-medium">${{ formatPrice(keyProductsTotal) }}</span>
        </div>

        <!-- 系统余额 -->
        <div class="flex justify-between items-center">
          <div class="inline-flex gap-1 items-center font-medium">
            <span>Balance of System</span>
            <UBadge
              size="sm" variant="subtle"
              label="excl. GST"
            />
          </div>
          <span class="font-medium">${{ formatPrice(systemBalanceTotal) }}</span>
        </div>

        <!-- 额外费用 -->
        <div class="flex justify-between items-center">
          <div class="inline-flex gap-1 items-center font-medium">
            <span>Additional Charges</span>
            <UBadge
              size="sm" variant="subtle"
              label="excl. GST"
            />
          </div>
          <span class="font-medium">${{ formatPrice(additionalChargesTotal) }}</span>
        </div>

        <!-- GST -->
        <div class="flex justify-between items-center">
          <div class="inline-flex gap-1 items-center font-medium">
            <span>GST</span>
            <UBadge
              size="sm" variant="subtle"
              label="10%"
            />
          </div>
          <span class="font-medium">${{ formatPrice(gstAmount) }}</span>
        </div>
      </div>
    </div>

    <!-- 折扣部分 -->
    <div class="discount border-b border-gray-300 border-dashed py-4">
      <div class="flex justify-between items-center cursor-pointer" @click="toggleSection('discount')">
        <div class="flex items-center">
          <UIcon
            :name="expandedSections.discount ? 'i-heroicons-chevron-down' : 'i-heroicons-chevron-right'"
            class="mr-2 text-gray-500 w-5 h-5"
          />
          <h2 class="inline-flex gap-1 items-center text-xl font-bold">
            <span>Discount</span>
            <UBadge
              size="sm" variant="subtle"
              label="incl. GST"
            />
          </h2>
        </div>
        <span class="text-xl font-bold">${{ formatPrice(discountTotal) }}</span>
      </div>

      <!-- 折扣的子项目，如果有的话 -->
      <div v-if="expandedSections.discount && subtractList.length > 0" class="mt-3 space-y-2 pl-7">
        <div v-for="(item, index) in subtractList" :key="index" class="flex justify-between items-center">
          <span class="font-medium">{{ item.itemName }}</span>
          <span class="font-medium">${{ formatPrice(item.linePrice) }}</span>
        </div>
      </div>
    </div>

    <!-- 扣减部分 -->
    <div class="deductions border-b border-gray-300 border-dashed py-4">
      <div class="flex justify-between items-center cursor-pointer" @click="toggleSection('deductions')">
        <div class="flex items-center">
          <UIcon
            :name="expandedSections.deductions ? 'i-heroicons-chevron-down' : 'i-heroicons-chevron-right'"
            class="mr-2 text-gray-500 w-5 h-5"
          />
          <h2 class="text-xl font-bold">
            Deductions
          </h2>
        </div>
        <span class="text-xl font-bold text-green-500">- ${{ formatPrice(deductionsTotal) }}</span>
      </div>

      <!-- 扣减的子项目 -->
      <div v-if="expandedSections.deductions" class="mt-3 space-y-2 pl-7">
        <div v-for="(item, index) in decList" :key="index" class="flex justify-between items-center">
          <span class="font-medium">
            {{ item.labelKey?.replace('_', ' ').toUpperCase() || `Item ${index + 1}` }}
            <span v-if="item.unitPrice && item.quantity" class="text-gray-500 text-sm">
              (${{ formatPrice(item.unitPrice) }} x {{ item.quantity }})
            </span>
          </span>
          <span class="font-medium text-green-500">- ${{ formatPrice(item.linePrice) }}</span>
        </div>
      </div>
    </div>

    <!-- 汇总部分 - 使用浅色背景区分为一个整体 -->
    <div class="summary-group bg-gray-50 dark:bg-gray-800 -mx-4 -mb-4 px-4 pb-4 rounded-b-lg">
      <!-- 总成本 -->
      <div class="total-cost py-3 border-b border-gray-300 border-dashed">
        <div class="flex justify-between items-center">
          <div class="flex items-center">
            <h2 class="inline-flex gap-1.5 items-center text-xl font-bold">
              <span>Total Cost</span>
              <UBadge
                size="sm" variant="subtle"
                label="incl. GST"
              />
              <UTooltip :delay-duration="300" text="风火家人 -> 天火同人">
                <UIcon name="i-heroicons-question-mark-circle" class="size-4" />
              </UTooltip>
            </h2>
          </div>
          <div class="text-right">
            <span class="text-xl font-bold">${{ formatPrice(totalCost) }}</span>
          </div>
        </div>
      </div>

      <!-- 毛利率 -->
      <div class="gross-margin py-3 border-b border-gray-300 border-dashed">
        <div class="flex justify-between items-center">
          <div class="flex items-center">
            <h2 class="text-xl font-bold">
              Gross Margin
            </h2>
            <UTooltip :delay-duration="300" text="乾1兑2离3震4巽5坎6艮7坤8">
              <UIcon name="i-heroicons-question-mark-circle" class="size-4 ml-1.5" />
            </UTooltip>
          </div>
          <div class="text-right">
            <span class="text-xl font-bold">{{ grossMargin }}%</span>
          </div>
        </div>
      </div>

      <!-- 毛利 -->
      <div class="gross-profit py-3 border-b border-gray-300 border-dashed">
        <div class="flex justify-between items-center">
          <div class="flex items-center">
            <h2 class="inline-flex gap-1 items-center text-xl font-bold">
              <span>Gross Profit</span>
              <UBadge
                size="sm" variant="subtle"
                label="incl. GST"
              />
              <UTooltip :delay-duration="300" text="风地观 -> 风天小畜">
                <UIcon name="i-heroicons-question-mark-circle" class="size-4" />
              </UTooltip>
            </h2>
          </div>
          <div class="text-right">
            <span class="text-xl font-bold">${{ formatPrice(grossProfit) }}</span>
          </div>
        </div>
      </div>

      <!-- 最终价格 - 使用大号字体和强调色 -->
      <div class="final-price py-4">
        <div class="flex justify-between items-center">
          <div class="flex items-center">
            <h2 class="inline-flex gap-1 items-center text-xl font-bold">
              <span>Final Price</span>
              <UBadge
                size="sm" variant="subtle"
                label="incl. GST"
              />
              <UTooltip :delay-duration="300" text="履霜冰至 -> 潜龙勿用">
                <UIcon name="i-heroicons-question-mark-circle" class="size-4" />
              </UTooltip>
            </h2>
          </div>
          <div class="text-right">
            <span class="text-2xl font-bold text-primary">${{ formatPrice(finalPrice) }}</span>
            <p class="text-blue-500 text-sm cursor-pointer mt-1">
              Editable
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
