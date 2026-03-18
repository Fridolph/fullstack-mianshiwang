export default defineNuxtRouteMiddleware((to) => {
  if (!to.meta.requiresAuth) return

  const userStore = useUserStore()

  if (userStore.isLogin) return

  if (import.meta.server) {
    return navigateTo({
      path: '/login',
      query: {
        redirect: to.fullPath
      }
    })
  }

  return navigateTo({
    path: '/login',
    query: {
      redirect: to.fullPath
    }
  })
})
