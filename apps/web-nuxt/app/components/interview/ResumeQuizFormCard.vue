<script setup lang="ts">
interface ResumeQuizFormState {
  company: string
  positionName: string
  minSalary: number | null
  maxSalary: number | null
  jd: string
  resumeContent: string
  resumeURL: string
}

const props = defineProps<{
  modelValue: ResumeQuizFormState
  loading?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: ResumeQuizFormState]
  'analyze': []
  'generate': []
}>()

const model = computed({
  get: () => props.modelValue,
  set: (value: ResumeQuizFormState) => emit('update:modelValue', value),
})
</script>

<template>
  <section class="surface-card interview-form">
    <div class="interview-form__header">
      <div>
        <span class="pill">Milestone 3</span>
        <h2>填写岗位信息与简历内容</h2>
      </div>
      <p class="section-description">
        当前后端还没有独立简历模块，所以这里优先支持直接粘贴简历文本，保证前后端链路先跑通。
      </p>
    </div>

    <div class="interview-form__grid">
      <label class="form-field">
        <span>目标公司</span>
        <UInput
          :model-value="model.company"
          placeholder="例如：字节跳动"
          @update:model-value="model = { ...model, company: $event }"
        />
      </label>

      <label class="form-field">
        <span>目标岗位</span>
        <UInput
          :model-value="model.positionName"
          placeholder="例如：前端开发工程师"
          @update:model-value="model = { ...model, positionName: $event }"
        />
      </label>

      <label class="form-field">
        <span>最低薪资（K）</span>
        <UInput
          :model-value="model.minSalary?.toString() ?? ''"
          type="number"
          placeholder="20"
          @update:model-value="
            model = {
              ...model,
              minSalary: $event ? Number($event) : null
            }
          "
        />
      </label>

      <label class="form-field">
        <span>最高薪资（K）</span>
        <UInput
          :model-value="model.maxSalary?.toString() ?? ''"
          type="number"
          placeholder="35"
          @update:model-value="
            model = {
              ...model,
              maxSalary: $event ? Number($event) : null
            }
          "
        />
      </label>

      <label class="form-field form-field--full">
        <span>岗位 JD</span>
        <UTextarea
          :model-value="model.jd"
          :rows="8"
          placeholder="请粘贴完整岗位描述，当前后端 DTO 要求至少 50 个字符。"
          @update:model-value="model = { ...model, jd: String($event || '') }"
        />
      </label>

      <label class="form-field form-field--full">
        <span>简历文本</span>
        <UTextarea
          :model-value="model.resumeContent"
          :rows="12"
          placeholder="当前优先支持直接粘贴简历文本，这样可以稳定触发简历分析与押题。"
          @update:model-value="
            model = {
              ...model,
              resumeContent: String($event || '')
            }
          "
        />
      </label>

      <label class="form-field form-field--full">
        <span>简历 URL（可选）</span>
        <UInput
          :model-value="model.resumeURL"
          placeholder="如果后续接入 OSS 或在线文件地址，可在这里填写"
          @update:model-value="model = { ...model, resumeURL: $event }"
        />
      </label>
    </div>

    <div class="interview-form__actions">
      <UButton
        color="neutral"
        variant="soft"
        :loading="loading"
        icon="i-lucide-search-code"
        @click="emit('analyze')">
        先分析简历
      </UButton>
      <UButton
        :loading="loading"
        icon="i-lucide-play"
        @click="emit('generate')">
        开始流式押题
      </UButton>
    </div>
  </section>
</template>

<style scoped>
.interview-form {
  padding: 24px;
}

.interview-form__header {
  display: grid;
  gap: 12px;
  margin-bottom: 20px;
}

.interview-form__header h2 {
  margin: 16px 0 0;
  font-size: 24px;
}

.interview-form__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.form-field {
  display: grid;
  gap: 8px;
}

.form-field--full {
  grid-column: 1 / -1;
}

.form-field span {
  font-size: 14px;
  font-weight: 600;
}

.interview-form__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 20px;
}

@media (max-width: 960px) {
  .interview-form__grid {
    grid-template-columns: 1fr;
  }
}
</style>
