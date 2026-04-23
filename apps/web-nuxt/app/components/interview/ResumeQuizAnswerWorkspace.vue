<script setup lang="ts">
import type { ResumeQuizQuestion } from '~/types/domain'

const props = defineProps<{
  recordId: string
  questions: ResumeQuizQuestion[]
  answers: string[]
  phaseLabel?: string
  title?: string
  description?: string
  footerTitle?: string
  footerDescription?: string
  actionLabel?: string
  hideAction?: boolean
  actionDisabled?: boolean
  inputsDisabled?: boolean
  openingResult?: boolean
}>()

const emit = defineEmits<{
  updateAnswer: [payload: { index: number, value: string }]
  openResult: []
}>()

const answeredCount = computed(
  () => props.answers.filter(answer => answer?.trim().length > 0).length,
)
const allAnswered = computed(
  () => props.questions.length > 0 && answeredCount.value === props.questions.length,
)
const finalActionDisabled = computed(() =>
  props.actionDisabled !== undefined ? props.actionDisabled : !allAnswered.value,
)

function getAnswer(index: number) {
  return props.answers[index] || ''
}
</script>

<template>
  <section class="grid gap-6">
    <div class="surface-card flex flex-wrap items-end justify-between gap-4 p-6">
      <div class="space-y-3">
        <span class="pill">{{ phaseLabel || '答题工作区' }}</span>
        <div class="space-y-2">
          <h2 class="section-title">
            {{ title || '押题已生成，开始逐题作答' }}
          </h2>
          <p class="section-description max-w-3xl">
            {{ description || '这里只展示问题和回答提示，不展示参考答案。你的输入会实时缓存在本地，刷新页面也不会丢。' }}
          </p>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <UBadge color="neutral" variant="soft">
          recordId: {{ recordId }}
        </UBadge>
        <UBadge color="primary" variant="subtle">
          已回答 {{ answeredCount }}/{{ props.questions.length }}
        </UBadge>
      </div>
    </div>

    <div
      v-if="props.questions.length"
      class="grid gap-4">
      <article
        v-for="(question, index) in props.questions"
        :key="`${recordId}-${index}-${question.question}`"
        class="surface-card grid gap-4 p-6">
        <div class="space-y-3">
          <div class="flex flex-wrap items-center gap-3">
            <UBadge color="primary" variant="soft">
              Q{{ index + 1 }}
            </UBadge>
            <UBadge v-if="question.difficulty" color="neutral" variant="subtle">
              {{ question.difficulty }}
            </UBadge>
            <UBadge v-if="question.category" color="neutral" variant="subtle">
              {{ question.category }}
            </UBadge>
          </div>

          <h3 class="text-lg font-semibold leading-8 text-[color:var(--app-text)]">
            {{ question.question }}
          </h3>
          <p class="rounded-2xl border border-primary/15 bg-primary/5 px-4 py-3 text-sm leading-7 text-[color:var(--app-text)]">
            回答提示：{{ question.tips || '请结合项目背景、你的行动和量化结果来回答。' }}
          </p>
        </div>

        <label class="grid gap-2">
          <span class="text-sm font-semibold text-[color:var(--app-text)]">你的回答</span>
          <UTextarea
            :model-value="getAnswer(index)"
            :rows="6"
            autoresize
            :disabled="inputsDisabled"
            placeholder="建议用 STAR 结构组织回答：背景 / 任务 / 行动 / 结果"
            @update:model-value="emit('updateAnswer', { index, value: String($event || '') })"
          />
        </label>
      </article>
    </div>

    <div v-else class="surface-card p-6 text-sm leading-7 text-[color:var(--app-muted)]">
      当前还没有可作答的问题，请先完成流式押题生成。
    </div>

    <div
      v-if="!hideAction"
      class="surface-card flex flex-wrap items-center justify-between gap-4 p-6">
      <div class="space-y-1">
        <p class="text-base font-semibold text-[color:var(--app-text)]">
          {{ footerTitle || '全部作答后可进入独立结果页' }}
        </p>
        <p class="text-sm leading-6 text-[color:var(--app-muted)]">
          {{ footerDescription || '结果页会按题展示用户答案、参考答案和 AI 点评，并给出综合评价。' }}
        </p>
      </div>

      <UButton
        icon="i-lucide-arrow-right-circle"
        :disabled="finalActionDisabled"
        :loading="openingResult"
        @click="emit('openResult')">
        {{ actionLabel || '打开独立结果页' }}
      </UButton>
    </div>
  </section>
</template>
