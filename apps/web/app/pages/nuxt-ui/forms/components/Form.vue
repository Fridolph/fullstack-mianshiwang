<script setup lang="ts">
import useForms from '../composables/useForm'

const {
  schema, formData,
  sexList, hobbyList, colorChip, colorText, mottoItems,
  onSubmit, onSubmitError, isDateDisabled,
  inputDateRef
} = useForms()
</script>

<template>
  <ContentsTitleWrap title="Form & Zod Validate">
    <p>
      用途: <br>
      使用 Form 组件，使用任何支持标准模式的验证库或您自己的验证逻辑来验证表单数据。
      它与 FormField 组件配合使用，自动显示表单元素周围的错误消息。<br>
      模式验证：<br>
      - state - 保存表单状态的反应对象。<br>
      - schema - 任何标准模式或超级结构。<br>
    </p>

    <UForm
      :schema="schema" :state="formData" class="w-auto space-y-4"
      @submit="onSubmit" @error="onSubmitError">
      <UFormField
        required label="Email" name="email">
        <UInput v-model="formData.email" class="w-50" />
      </UFormField>

      <UFormField
        required label="Password" name="password">
        <UInput v-model="formData.password" type="password" class="w-50" />
      </UFormField>

      <UFormField label="Age" name="age">
        <UInputNumber
          v-model="formData.age" :min="1" :max="999"
          class="w-50"
          :increment="{
            color: 'neutral',
            size: 'xs'
          }"
          :decrement="{
            color: 'neutral',
            size: 'xs'
          }"
        />
      </UFormField>

      <UFormField required label="Sex" name="sex">
        <URadioGroup v-model="formData.sex" value-key="id" :items="sexList" />
      </UFormField>

      <UFormField
        required label="Hobbies" name="hobbies"
        orientation="vertical"
        class="w-60">
        <UCheckboxGroup v-model="formData.hobbies" :items="hobbyList" orientation="horizontal" />
      </UFormField>

      <UFormField required label="Color" name="color">
        <UPopover>
          <UButton
            :label="colorText" color="neutral" variant="outline"
            class="w-100">
            <template #leading>
              <span :style="colorChip" class="size-3 rounded-full" />
            </template>
          </UButton>

          <template #content>
            <UColorPicker v-model="formData.color" class="p-2" />
          </template>
        </UPopover>
      </UFormField>

      <UFormField label="Motto" name="motto">
        <USelectMenu v-model="formData.motto" :items="mottoItems" class="w-100" />
      </UFormField>

      <UFormField name="isReady">
        <USwitch
          v-model="formData.isReady"
          color="neutral" default-value label="When you Go"
          description="Are you ready?"
        />
      </UFormField>

      <UFormField
        name="intro" label="Intro"
        class="w-100">
        <UTextarea
          v-model="formData.intro"
          :maxrows="8" autoresize
          maxlength="300" class="w-100 relative"
          color="neutral" variant="subtle" placeholder="Introduce yourself ..."
        />
        <p class="text-right text-xs mt-1">
          {{ `${formData.intro?.length || 0}/300` }}
        </p>
      </UFormField>

      <UFormField label="Input Date" name="inputDate">
        <UInputDate ref="inputDateRef" v-model="formData.inputDate" range>
          <template #trailing>
            <UPopover :reference="inputDateRef?.inputsRef[0]?.$el">
              <UButton
                color="neutral"
                variant="link"
                size="sm"
                icon="i-lucide-calendar"
                aria-label="Select a date range"
                class="px-0"
              />

              <template #content>
                <!-- TODO 完善该组件及交互 -->
                <UCalendar
                  v-model="formData.inputDate" class="p-2" :number-of-months="2"
                  range :is-date-disabled="isDateDisabled"
                />
              </template>
            </UPopover>
          </template>
        </UInputDate>
      </UFormField>

      <UButton type="submit">
        Submit
      </UButton>
    </UForm>
  </ContentsTitleWrap>
</template>
