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

      <div
        v-if="report.matchedSkills?.length || report.missingSkills?.length"
        class="result-card__section">
        <h3>岗位匹配</h3>
        <div class="result-card__grid">
          <article class="result-card__panel">
            <p class="result-card__panel-title">
              已匹配技能
            </p>
            <div
              v-if="report.matchedSkills?.length"
              class="result-card__chips">
              <span
                v-for="item in report.matchedSkills"
                :key="item.skill"
                class="result-card__chip result-card__chip--success">
                {{ item.skill }}
              </span>
            </div>
            <p v-else class="result-card__muted">
              暂无已匹配技能数据
            </p>
          </article>

          <article class="result-card__panel">
            <p class="result-card__panel-title">
              待补强技能
            </p>
            <div
              v-if="report.missingSkills?.length"
              class="result-card__chips">
              <span
                v-for="item in report.missingSkills"
                :key="item"
                class="result-card__chip result-card__chip--warning">
                {{ item }}
              </span>
            </div>
            <p v-else class="result-card__muted">
              当前暂无明显缺口
            </p>
          </article>
        </div>
      </div>

      <div
        v-if="report.strengths?.length || report.weaknesses?.length || report.interviewTips?.length"
        class="result-card__section">
        <h3>面试建议</h3>
        <div class="result-card__grid">
          <article
            v-if="report.strengths?.length"
            class="result-card__panel">
            <p class="result-card__panel-title">
              优势亮点
            </p>
            <ul class="result-card__list">
              <li
                v-for="item in report.strengths"
                :key="item">
                {{ item }}
              </li>
            </ul>
          </article>

          <article
            v-if="report.weaknesses?.length"
            class="result-card__panel">
            <p class="result-card__panel-title">
              风险提醒
            </p>
            <ul class="result-card__list">
              <li
                v-for="item in report.weaknesses"
                :key="item">
                {{ item }}
              </li>
            </ul>
          </article>

          <article
            v-if="report.interviewTips?.length"
            class="result-card__panel">
            <p class="result-card__panel-title">
              回答建议
            </p>
            <ul class="result-card__list">
              <li
                v-for="item in report.interviewTips"
                :key="item">
                {{ item }}
              </li>
            </ul>
          </article>
        </div>
      </div>

      <div class="result-card__section">
        <h3>问题列表</h3>
        <div v-if="report.questions?.length" class="result-card__questions">
          <article
            v-for="(question, index) in report.questions"
            :key="`${question.question}-${index}`"
            class="result-question">
            <p class="result-question__title">
              Q{{ index + 1 }}. {{ question.question }}
            </p>
            <p v-if="question.answer">
              <strong>参考答案：</strong>{{ question.answer }}
            </p>
            <p v-if="question.tips">
              <strong>回答提示：</strong>{{ question.tips }}
            </p>
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

.result-card__grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.result-card__panel {
  padding: 16px;
  border: 1px solid var(--app-border);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.72);
}

.result-card__panel-title {
  margin: 0 0 12px;
  color: var(--app-text);
  font-weight: 700;
}

.result-card__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.result-card__chip {
  display: inline-flex;
  align-items: center;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
}

.result-card__chip--success {
  background: rgba(16, 185, 129, 0.12);
  color: #047857;
}

.result-card__chip--warning {
  background: rgba(245, 158, 11, 0.14);
  color: #b45309;
}

.result-card__list {
  margin: 0;
  padding-left: 18px;
  color: var(--app-muted);
  line-height: 1.8;
}

.result-card__muted {
  margin: 0;
  color: var(--app-muted);
  line-height: 1.7;
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
