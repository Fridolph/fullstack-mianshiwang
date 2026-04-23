<script setup lang="ts">
import type { ResumeQuizAnswerAnalysisPayload } from '~/types/domain'

const props = withDefaults(defineProps<{
  analysisResult: ResumeQuizAnswerAnalysisPayload | null
  mode?: 'all' | 'overall' | 'questions'
}>(), {
  mode: 'all',
})

const showOverall = computed(() => props.mode === 'all' || props.mode === 'overall')
const showQuestions = computed(() => props.mode === 'all' || props.mode === 'questions')
</script>

<template>
  <section class="grid gap-6">
    <section
      v-if="showOverall && analysisResult?.overallEvaluation"
      class="surface-card grid gap-5 p-6">
      <div class="flex flex-wrap items-center gap-3">
        <span class="pill">综合评价</span>
        <UBadge color="primary" variant="soft">
          总分 {{ analysisResult.overallEvaluation.overallScore }}
        </UBadge>
        <UBadge
          v-if="analysisResult.overallEvaluation.readiness"
          color="neutral"
          variant="subtle">
          {{ analysisResult.overallEvaluation.readiness }}
        </UBadge>
      </div>

      <p class="text-base leading-8 text-[color:var(--app-text)]">
        {{ analysisResult.overallEvaluation.summary }}
      </p>

      <div class="grid gap-4 lg:grid-cols-3">
        <section class="rounded-2xl border border-[color:var(--app-border)] bg-white/70 p-4">
          <h3 class="text-sm font-semibold text-[color:var(--app-text)]">
            优势
          </h3>
          <ul class="mt-3 grid gap-2 pl-5 text-sm leading-6 text-[color:var(--app-muted)]">
            <li
              v-for="item in analysisResult.overallEvaluation.strengths"
              :key="item">
              {{ item }}
            </li>
          </ul>
        </section>

        <section class="rounded-2xl border border-[color:var(--app-border)] bg-white/70 p-4">
          <h3 class="text-sm font-semibold text-[color:var(--app-text)]">
            短板
          </h3>
          <ul class="mt-3 grid gap-2 pl-5 text-sm leading-6 text-[color:var(--app-muted)]">
            <li
              v-for="item in analysisResult.overallEvaluation.weaknesses"
              :key="item">
              {{ item }}
            </li>
          </ul>
        </section>

        <section class="rounded-2xl border border-[color:var(--app-border)] bg-white/70 p-4">
          <h3 class="text-sm font-semibold text-[color:var(--app-text)]">
            改进建议
          </h3>
          <ul class="mt-3 grid gap-2 pl-5 text-sm leading-6 text-[color:var(--app-muted)]">
            <li
              v-for="item in analysisResult.overallEvaluation.suggestions"
              :key="item">
              {{ item }}
            </li>
          </ul>
        </section>
      </div>

      <section class="rounded-3xl border border-[color:var(--app-border)] bg-white/80 p-4">
        <h3 class="text-base font-semibold text-[color:var(--app-text)]">
          能力雷达图
        </h3>
        <p class="mt-2 text-sm leading-6 text-[color:var(--app-muted)]">
          结合本次 10 道题的真实作答，展示当前综合面试能力画像。
        </p>
        <ClientOnly>
          <ResumeRadarChart :data="analysisResult.radarData || []" />
        </ClientOnly>
      </section>
    </section>

    <section
      v-else-if="showOverall && analysisResult"
      class="surface-card grid gap-4 p-6">
      <div class="flex flex-wrap items-center gap-3">
        <span class="pill">综合评价</span>
        <UBadge color="neutral" variant="subtle">
          暂无总结数据
        </UBadge>
      </div>
      <p class="text-sm leading-7 text-[color:var(--app-muted)]">
        当前还没有完整的综合评价字段，等待服务端返回后会在这里展示总结、优势短板和雷达图。
      </p>
    </section>

    <div
      v-if="showQuestions && analysisResult?.questionAnalyses?.length"
      class="grid gap-4">
      <article
        v-for="item in analysisResult.questionAnalyses"
        :key="`${analysisResult.recordId}-${item.questionIndex}`"
        class="surface-card grid gap-5 p-6">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex flex-wrap items-center gap-3">
            <UBadge color="primary" variant="soft">
              Q{{ item.questionIndex + 1 }}
            </UBadge>
            <UBadge color="neutral" variant="subtle">
              评分 {{ item.score }}
            </UBadge>
          </div>
        </div>

        <div class="grid gap-4 lg:grid-cols-2">
          <section class="grid gap-2 rounded-2xl border border-[color:var(--app-border)] bg-white/70 p-4">
            <h3 class="text-sm font-semibold text-[color:var(--app-muted)]">
              问题
            </h3>
            <p class="text-base leading-7 text-[color:var(--app-text)]">
              {{ item.question }}
            </p>
          </section>

          <section class="grid gap-2 rounded-2xl border border-[color:var(--app-border)] bg-white/70 p-4">
            <h3 class="text-sm font-semibold text-[color:var(--app-muted)]">
              你的回答
            </h3>
            <p class="whitespace-pre-wrap text-base leading-7 text-[color:var(--app-text)]">
              {{ item.userAnswer }}
            </p>
          </section>
        </div>

        <section class="grid gap-2 rounded-2xl border border-emerald-500/15 bg-emerald-500/5 p-4">
          <h3 class="text-sm font-semibold text-[color:var(--app-muted)]">
            参考答案
          </h3>
          <p class="whitespace-pre-wrap text-base leading-7 text-[color:var(--app-text)]">
            {{ item.referenceAnswer }}
          </p>
        </section>

        <section class="grid gap-4 rounded-2xl border border-primary/15 bg-primary/5 p-4">
          <div class="space-y-2">
            <h3 class="text-sm font-semibold text-[color:var(--app-muted)]">
              AI 点评
            </h3>
            <p class="whitespace-pre-wrap text-base leading-7 text-[color:var(--app-text)]">
              {{ item.feedback }}
            </p>
          </div>

          <div class="grid gap-4 lg:grid-cols-2">
            <div class="grid gap-2">
              <h4 class="text-sm font-semibold text-[color:var(--app-text)]">
                回答亮点
              </h4>
              <ul
                v-if="item.strengths.length"
                class="grid gap-2 pl-5 text-sm leading-6 text-[color:var(--app-muted)]">
                <li v-for="strength in item.strengths" :key="strength">
                  {{ strength }}
                </li>
              </ul>
              <p v-else class="text-sm leading-6 text-[color:var(--app-muted)]">
                本题暂无额外亮点补充。
              </p>
            </div>

            <div class="grid gap-2">
              <h4 class="text-sm font-semibold text-[color:var(--app-text)]">
                优化建议
              </h4>
              <ul
                v-if="item.improvements.length"
                class="grid gap-2 pl-5 text-sm leading-6 text-[color:var(--app-muted)]">
                <li v-for="improvement in item.improvements" :key="improvement">
                  {{ improvement }}
                </li>
              </ul>
              <p v-else class="text-sm leading-6 text-[color:var(--app-muted)]">
                当前暂无额外优化建议。
              </p>
            </div>
          </div>
        </section>
      </article>
    </div>
  </section>
</template>
