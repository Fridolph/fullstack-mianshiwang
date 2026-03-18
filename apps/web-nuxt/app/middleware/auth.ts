/**
 * 最小可用的鉴权中间件。
 *
 * 逻辑非常简单：
 * - 页面没有标记 requiresAuth，就直接放行
 * - 已登录就放行
 * - 未登录就跳到登录页，并带上 redirect 参数
 *
 * 这是当前学习阶段最容易理解的一种保护方式。
 */
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
