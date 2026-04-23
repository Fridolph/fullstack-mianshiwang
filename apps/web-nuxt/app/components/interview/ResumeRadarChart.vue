<script setup lang="ts">
import * as echarts from 'echarts/core'
import { RadarChart } from 'echarts/charts'
import {
  GridComponent,
  LegendComponent,
  RadarComponent,
  TooltipComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import type { ResumeQuizRadarDimension } from '~/types/domain'

echarts.use([
  RadarChart,
  GridComponent,
  LegendComponent,
  RadarComponent,
  TooltipComponent,
  CanvasRenderer,
])

const props = defineProps<{
  data: ResumeQuizRadarDimension[]
}>()

const chartRef = ref<HTMLDivElement | null>(null)
let chart: echarts.ECharts | null = null

function initChart() {
  if (!chartRef.value) return

  if (!chart) {
    chart = echarts.init(chartRef.value)
  }
}

function renderChart() {
  if (!chartRef.value) return

  if (!props.data.length) {
    chart?.clear()
    return
  }

  initChart()

  if (!chart || chartRef.value.clientWidth === 0) {
    requestAnimationFrame(() => {
      renderChart()
    })
    return
  }

  chart.resize()
  chart.setOption({
    animationDuration: 500,
    grid: {
      top: 24,
      left: 24,
      right: 24,
      bottom: 24,
      containLabel: true,
    },
    tooltip: {
      trigger: 'item',
    },
    radar: {
      radius: '66%',
      splitNumber: 4,
      axisName: {
        color: '#334155',
        fontSize: 12,
      },
      splitArea: {
        areaStyle: {
          color: ['rgba(15, 23, 42, 0.02)', 'rgba(15, 23, 42, 0.04)'],
        },
      },
      splitLine: {
        lineStyle: {
          color: 'rgba(148, 163, 184, 0.35)',
        },
      },
      axisLine: {
        lineStyle: {
          color: 'rgba(148, 163, 184, 0.35)',
        },
      },
      indicator: props.data.map(item => ({
        name: item.dimension,
        max: 100,
      })),
    },
    series: [
      {
        type: 'radar',
        data: [
          {
            value: props.data.map(item => item.score),
            name: '综合能力雷达',
            areaStyle: {
              color: 'rgba(59, 130, 246, 0.18)',
            },
            lineStyle: {
              color: '#2563eb',
              width: 2,
            },
            itemStyle: {
              color: '#2563eb',
            },
            symbolSize: 8,
          },
        ],
      },
    ],
  })
}

onMounted(() => {
  nextTick(() => {
    renderChart()
  })
})

watch(
  () => props.data,
  () => {
    renderChart()
  },
  { deep: true },
)

useResizeObserver(chartRef, () => {
  if (!chart) {
    renderChart()
    return
  }

  chart.resize()
})

onBeforeUnmount(() => {
  chart?.dispose()
  chart = null
})
</script>

<template>
  <div class="grid gap-3">
    <div
      v-if="data.length"
      ref="chartRef"
      class="h-[320px] w-full"
    />
    <div
      v-else
      class="flex h-[220px] items-center justify-center rounded-2xl border border-dashed border-[color:var(--app-border)] bg-white/60 text-sm text-[color:var(--app-muted)]">
      当前暂无可展示的雷达图数据
    </div>

    <div class="grid gap-2 sm:grid-cols-2">
      <div
        v-for="item in data"
        :key="item.dimension"
        class="rounded-2xl border border-[color:var(--app-border)] bg-white/70 p-3">
        <div class="flex items-center justify-between gap-3">
          <span class="text-sm font-semibold text-[color:var(--app-text)]">{{ item.dimension }}</span>
          <UBadge color="primary" variant="soft">
            {{ item.score }}
          </UBadge>
        </div>
        <p class="mt-2 text-sm leading-6 text-[color:var(--app-muted)]">
          {{ item.description || '当前暂无更多评分说明。' }}
        </p>
      </div>
    </div>
  </div>
</template>
