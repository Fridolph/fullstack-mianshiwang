<script setup lang="ts">
import type { InterviewReport } from '~/types/domain'

defineProps<{
  report: InterviewReport | null
}>()
</script>

<template>
  <section class="surface-card result-card">
    <div class="result-card__header">
      <div>
        <span class="pill">结果展示</span>
        <h2>当前简历押题结果</h2>
      </div>
    </div>

    <div v-if="report" class="result-card__body">
      <div class="result-card__summary">
        <article>
          <span>匹配度</span>
          <strong>{{ report.matchScore ?? '--' }}</strong>
        </article>
        <article>
          <span>匹配等级</span>
          <strong>{{ report.matchLevel || '--' }}</strong>
        </article>
        <article>
          <span>题目数量</span>
          <strong>{{ report.questions?.length ?? 0 }}</strong>
        </article>
      </div>

      <div v-if="report.summary" class="result-card__section">
        <h3>总结</h3>
        <p>{{ report.summary }}</p>
      </div>

      <div class="result-card__section">
        <h3>问题列表</h3>
        <div v-if="report.questions?.length" class="result-card__questions">
          <article
            v-for="(question, index) in report.questions"
            :key="`${question.question}-${index}`"
            class="result-question"
          >
            <p class="result-question__title">Q{{ index + 1 }}. {{ question.question }}</p>
            <p v-if="question.answer"><strong>参考答案：</strong>{{ question.answer }}</p>
            <p v-if="question.tips"><strong>回答提示：</strong>{{ question.tips }}</p>
          </article>
        </div>
        <div v-else class="result-card__empty">
          当前后端仍处于学习中的骨架版本，结果表已打通，但题目内容还没有真正写入。
        </div>
      </div>
    </div>

    <div v-else class="result-card__empty">
      暂无可展示结果，请先去开始一次简历分析或简历押题。
    </div>
  </section>
</template>

<style scoped>
.result-card {
  padding: 24px;
}

.result-card__header h2 {
  margin: 16px 0 0;
  font-size: 24px;
}

.result-card__summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin-top: 20px;
}

.result-card__summary article,
.result-question {
  padding: 16px;
  border: 1px solid var(--app-border);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.72);
}

.result-card__summary span,
.result-card__summary strong,
.result-question p {
  margin: 0;
}

.result-card__summary span {
  display: block;
  color: var(--app-muted);
}

.result-card__summary strong {
  display: block;
  margin-top: 8px;
  font-size: 24px;
}

.result-card__section {
  margin-top: 20px;
}

.result-card__section h3 {
  margin: 0 0 12px;
}

.result-card__section p,
.result-card__empty {
  color: var(--app-muted);
  line-height: 1.7;
}

.result-card__questions {
  display: grid;
  gap: 12px;
}

.result-question__title {
  color: var(--app-text);
  font-weight: 700;
}

@media (max-width: 900px) {
  .result-card__summary {
    grid-template-columns: 1fr;
  }
}
</style>
