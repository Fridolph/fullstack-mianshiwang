import { useUserStore } from '~/stores/user'

export default defineNuxtRouteMiddleware((to) => {
  const userStore = useUserStore()

  if (userStore.isLogin) return

  return navigateTo({
    path: '/login',
    query: {
      redirect: to.fullPath
    }
  })
})
