import * as z from 'zod'
import type { RadioGroupItem, FormErrorEvent, FormSubmitEvent } from '@nuxt/ui'
import { CalendarDate } from '@internationalized/date'
import type { DateValue } from '@internationalized/date'
import { withInteractionLog } from '~/composables/useInteractionLog'

export default function useForm() {
  const schema = z.object({
    email: z.email('Invalid email'),
    password: z.string('Password is required').min(8, 'Must be at least 8 characters'),
    age: z.optional(z.number().min(6, 'You must be at least 6 years old').max(200, 'Age must be less than 200 years old')),
    sex: z.string('Sex is required'),
    hobbies: z.array(z.string('Hobbies are required')).min(1, 'Must select at least one hobby'),
    color: z.string('Color is required'),
    motto: z.optional(z.string()),
    intro: z.optional(z.string()),
    inputDate: z.object({
      start: z.date('Start date is required'),
      end: z.date('End date is required')
    })
  })

  const formData = reactive<Partial<ZodSchema>>({
    email: undefined,
    password: undefined,
    age: undefined,
    sex: undefined,
    hobbies: [],
    color: '#00C16A',
    motto: undefined,
    intro: undefined,
    inputDate: shallowRef({
      start: new CalendarDate(2025, 11, 4),
      end: new CalendarDate(2026, 1, 7)
    })
  })

  const isDateDisabled = (date: DateValue) => {
    const thisYear = new Date().getFullYear()
    return date.year < (thisYear - 1) || date.year > (thisYear + 1)
  }

  const mottoItems = computed(() => [
    '潜龙勿用',
    '天行健，君子以自强不息',
    '地势坤，君子以厚德载物',
    '君子终日乾乾，夕惕若厉，无咎',
    '履霜，坚冰至'
  ])
  const colorChip = computed(() => ({ backgroundColor: formData.color }))
  const colorText = computed(() => {
    return `Choose color (${formData.color})`
  })

  const inputDateRef = ref<any>(null)

  const sexList = computed<RadioGroupItem[]>(() => ['Male', 'Female'])

  const hobbyList = computed(() => [
    { label: 'Singing', value: '1' },
    { label: 'Jump', value: '2' },
    { label: 'Rap', value: '3' },
    { label: 'Basketball', value: '4' }
  ])

  const toast = useToast()
  const onSubmit = withInteractionLog((event: FormSubmitEvent<ZodSchema>) => {
    toast.add({ title: 'Success', description: 'The form has been submitted.', color: 'success' })
    console.log('onSubmit', event.data)
  }, {
    title: () => `提交表单 -> success`
  })

  const onSubmitError = withInteractionLog((event: FormErrorEvent) => {
    console.log('🚀 ~ onSubmitError:', event)
  }, {
    title: () => `提交表单 -> failed`,
    description: ''
  })

  return {
    // ref
    schema,
    formData,
    // computed
    sexList, hobbyList, colorChip, colorText, mottoItems,
    // fns
    onSubmit, onSubmitError, isDateDisabled,
    // refs
    inputDateRef
  }
}
