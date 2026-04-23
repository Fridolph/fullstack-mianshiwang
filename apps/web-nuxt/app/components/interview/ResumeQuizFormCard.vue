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
  'mock-fill': []
  'parse-resume-file': [file: File]
}>()

const model = computed({
  get: () => props.modelValue,
  set: (value: ResumeQuizFormState) => emit('update:modelValue', value),
})

function handleResumeFileChange(event: Event) {
  const target = event.target as HTMLInputElement | null
  const file = target?.files?.[0]

  if (file) {
    emit('parse-resume-file', file)
  }

  if (target) {
    target.value = ''
  }
}
</script>

<template>
  <section class="surface-card interview-form">
    <div class="interview-form__header">
      <div>
        <span class="pill">Milestone 3</span>
        <h2>填写岗位信息与简历内容</h2>
      </div>
      <p class="section-description">
        现在支持 mock 快速填充，以及上传 pdf、doc、docx、md 文件读取文本后回填到简历输入框，方便先把体验链路跑通。
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
          placeholder="支持直接粘贴，也支持上传 pdf、doc、docx、md 文件后自动回填文本。"
          @update:model-value="
            model = {
              ...model,
              resumeContent: String($event || '')
            }
          "
        />
      </label>

      <label class="form-field form-field--full">
        <span>上传简历文件</span>
        <div class="interview-form__file-row">
          <UButton
            class="relative overflow-hidden"
            color="neutral"
            variant="soft"
            icon="i-lucide-file-up">
            选择文件
            <input
              class="interview-form__file-input"
              type="file"
              accept=".pdf,.doc,.docx,.md,text/markdown,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              @change="handleResumeFileChange">
          </UButton>
          <span class="interview-form__file-tip">
            仅做文本提取回填，不会直接创建新对话。
          </span>
        </div>
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
        variant="outline"
        icon="i-lucide-wand-sparkles"
        @click="emit('mock-fill')">
        一键填充 mock 信息
      </UButton>
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

.interview-form__file-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}

.interview-form__file-input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}

.interview-form__file-tip {
  font-size: 13px;
  color: var(--app-muted);
}

@media (max-width: 960px) {
  .interview-form__grid {
    grid-template-columns: 1fr;
  }
}
</style>
