// stores/apiStacksStore.ts

export const useApiStacksStore = defineStore('apiStacks', () => {
  const isSyncPage1 = ref<boolean>(false)
  const setSyncPage1Status = (status: boolean) => isSyncPage1.value = status

  const isSyncPage2 = ref<boolean>(false)
  const setSyncPage2Status = (status: boolean) => isSyncPage2.value = status

  const isSyncPage3 = ref<boolean>(false)
  const setSyncPage3Status = (status: boolean) => isSyncPage3.value = status

  return {
    isSyncPage1, setSyncPage1Status,
    isSyncPage2, setSyncPage2Status,
    isSyncPage3, setSyncPage3Status
  }
})
