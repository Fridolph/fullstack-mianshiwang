<script setup lang="ts">
import type { ResumeAnalysisViewModel } from '~/types/domain'

const props = defineProps<{
  analysis: Record<string, unknown> | null
}>()

function pickFirstString(
  source: Record<string, unknown>,
  keys: string[],
  fallback: string,
) {
  for (const key of keys) {
    const value = source[key]
    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
      return String(value)
    }
  }

  return fallback
}

function normalizeStringArray(input: unknown) {
  if (!Array.isArray(input)) return []

  return input
    .map((item) => {
      if (typeof item === 'string') {
        return item.trim()
      }

      if (item && typeof item === 'object') {
        const topic = typeof item.topic === 'string' ? item.topic.trim() : ''
        const reason = typeof item.reason === 'string' ? item.reason.trim() : ''

        if (topic && reason) {
          return `${topic}：${reason}`
        }

        if (topic) {
          return topic
        }

        if (reason) {
          return reason
        }
      }

      return ''
    })
    .filter(Boolean)
}

const viewModel = computed<ResumeAnalysisViewModel | null>(() => {
  if (!props.analysis) return null

  const source = props.analysis
  const strengths = normalizeStringArray(source.strengths)
  const gaps = normalizeStringArray(
    source.gaps || source.weaknesses || source.missingSkills,
  )
  const interviewTips = normalizeStringArray(source.interviewTips)
  const learningPriorities = normalizeStringArray(source.learningPriorities)
  const suggestions = [...interviewTips, ...learningPriorities]
  const summary = pickFirstString(source, ['summary'], '当前分析已返回，可结合下方原始 JSON 继续联调。')
  const yearsOfExperience = pickFirstString(
    source,
    ['years_of_experience', 'yearsOfExperience'],
    '未明确',
  )
  const rawMatchScore = pickFirstString(source, ['match_score', 'matchScore'], '未提供')
  const fallbackSuggestions = gaps.length
    ? gaps.slice(0, 3).map(item => `建议优先补齐：${item}`)
    : ['可继续通过下方追问补齐项目细节、量化结果与岗位匹配证据。']
  const normalizedYears = /年|year/i.test(yearsOfExperience)
    ? yearsOfExperience
    : `${yearsOfExperience} 年`
  const normalizedMatchScore = /分$/.test(rawMatchScore)
    ? rawMatchScore
    : `${rawMatchScore} 分`

  return {
    yearsOfExperience: yearsOfExperience === '未明确' ? yearsOfExperience : normalizedYears,
    recentPosition: pickFirstString(
      source,
      ['recent_position', 'recentPosition'],
      '未明确',
    ),
    education: pickFirstString(source, ['education'], '未提及'),
    matchScore: rawMatchScore === '未提供' ? rawMatchScore : normalizedMatchScore,
    skills: normalizeStringArray(source.skills),
    strengths,
    gaps,
    suggestions: suggestions.length ? suggestions : fallbackSuggestions,
    summary,
  }
})

const metricItems = computed(() => {
  if (!viewModel.value) return []

  return [
    { label: '工作年限', value: viewModel.value.yearsOfExperience },
    { label: '近期岗位', value: viewModel.value.recentPosition },
    { label: '匹配分', value: viewModel.value.matchScore },
    { label: '教育背景', value: viewModel.value.education },
  ]
})
</script>

<template>
  <section v-if="viewModel" class="grid gap-5">
    <div class="grid gap-3 lg:grid-cols-4">
      <article
        v-for="item in metricItems"
        :key="item.label"
        class="rounded-2xl border border-[color:var(--app-border)] bg-white/80 p-4">
        <p class="text-sm text-[color:var(--app-muted)]">
          {{ item.label }}
        </p>
        <p class="mt-2 text-base font-semibold leading-7 text-[color:var(--app-text)]">
          {{ item.value }}
        </p>
      </article>
    </div>

    <section class="rounded-3xl border border-[color:var(--app-border)] bg-white/75 p-5">
      <div class="flex flex-wrap items-center gap-2">
        <span class="pill">结构化摘要</span>
        <UBadge color="neutral" variant="soft">
          当前前端映射展示
        </UBadge>
      </div>
      <p class="mt-4 text-sm leading-7 text-[color:var(--app-text)]">
        {{ viewModel.summary }}
      </p>

      <div v-if="viewModel.skills.length" class="mt-4 flex flex-wrap gap-2">
        <UBadge
          v-for="skill in viewModel.skills"
          :key="skill"
          color="primary"
          variant="subtle">
          {{ skill }}
        </UBadge>
      </div>
    </section>

    <div class="grid gap-4 lg:grid-cols-3">
      <section class="rounded-2xl border border-emerald-500/15 bg-emerald-500/5 p-4">
        <h3 class="text-sm font-semibold text-[color:var(--app-text)]">
          优势
        </h3>
        <ul v-if="viewModel.strengths.length" class="mt-3 grid gap-2 pl-5 text-sm leading-6 text-[color:var(--app-muted)]">
          <li v-for="item in viewModel.strengths" :key="item">
            {{ item }}
          </li>
        </ul>
        <p v-else class="mt-3 text-sm leading-6 text-[color:var(--app-muted)]">
          暂未提取到明确优势，可结合原始 JSON 继续确认。
        </p>
      </section>

      <section class="rounded-2xl border border-warning/20 bg-warning/5 p-4">
        <h3 class="text-sm font-semibold text-[color:var(--app-text)]">
          短板
        </h3>
        <ul v-if="viewModel.gaps.length" class="mt-3 grid gap-2 pl-5 text-sm leading-6 text-[color:var(--app-muted)]">
          <li v-for="item in viewModel.gaps" :key="item">
            {{ item }}
          </li>
        </ul>
        <p v-else class="mt-3 text-sm leading-6 text-[color:var(--app-muted)]">
          当前还没有明确短板字段，可继续追问补充。
        </p>
      </section>

      <section class="rounded-2xl border border-primary/15 bg-primary/5 p-4">
        <h3 class="text-sm font-semibold text-[color:var(--app-text)]">
          当前建议
        </h3>
        <ul class="mt-3 grid gap-2 pl-5 text-sm leading-6 text-[color:var(--app-muted)]">
          <li v-for="item in viewModel.suggestions" :key="item">
            {{ item }}
          </li>
        </ul>
      </section>
    </div>
  </section>
</template>
