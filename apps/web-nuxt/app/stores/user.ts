import { defineStore } from 'pinia'
import { MAX_RESUME_COUNT } from '~/constants/app'
import { getUserInfoAPI } from '~/api/user'
import type { ApiClient } from '~/types/api'
import type { AuthPayload, ResumeSummary, UserInfo } from '~/types/domain'

/**
 * 用户 store 的核心状态。
 *
 * 注意：
 * - token 决定“是否已登录”
 * - userInfo 决定“登录后能展示什么”
 * - profileLoaded 用来区分“没拉过资料”和“已经确认过资料为空”这两种状态
 */
interface UserState {
  userInfo: UserInfo | null
  token: string
  resumes: ResumeSummary[]
  profileLoaded: boolean
}

export const useUserStore = defineStore(
  'user',
  {
    state: (): UserState => ({
      userInfo: null,
      token: '',
      resumes: [],
      profileLoaded: false,
    }),
    getters: {
      isLogin: state => Boolean(state.token),
      canAddResume: state => state.resumes.length < MAX_RESUME_COUNT,
    },
    actions: {
      // 登录成功后，一次性把 token 和基础用户信息写入 store。
      applyAuth(payload: AuthPayload) {
        this.token = payload.token
        this.userInfo = payload.user
        this.profileLoaded = true
      },
      setToken(token: string) {
        this.token = token
      },
      setUserInfo(userInfo: UserInfo | null) {
        this.userInfo = userInfo
        this.profileLoaded = Boolean(userInfo)
      },
      updateUserInfo(userInfo: Partial<UserInfo>) {
        this.userInfo = {
          ...(this.userInfo || {}),
          ...userInfo,
        }
        this.profileLoaded = true
      },
      setResumes(resumes: ResumeSummary[]) {
        this.resumes = resumes
      },
      addResume(resume: ResumeSummary) {
        if (!this.canAddResume) return

        this.resumes.unshift(resume)
      },
      removeResume(resumeId: string) {
        this.resumes = this.resumes.filter(resume => resume.resumeId !== resumeId)
      },
      // 强制从后端重新拉一次用户资料，适合登录后首次同步或手动刷新资料。
      async fetchUserProfile($api: ApiClient) {
        if (!this.token) return null

        const user = await getUserInfoAPI($api)
        this.setUserInfo(user)
        return user
      },
      /**
       * 惰性确保资料存在：
       * - 如果本地已经有资料，直接复用
       * - 如果只有 token，没有资料，则自动补拉
       * - 如果补拉失败，通常说明 token 已失效，直接清空登录态
       */
      async ensureUserProfile($api: ApiClient) {
        if (!this.token) return null
        if (this.profileLoaded && this.userInfo) return this.userInfo

        try {
          return await this.fetchUserProfile($api)
        } catch (error) {
          this.logout()
          throw error
        }
      },
      // 退出登录时，清理与当前用户绑定的前端状态。
      logout() {
        this.token = ''
        this.userInfo = null
        this.resumes = []
        this.profileLoaded = false
      },
    },
    persist: {
      pick: ['token', 'userInfo', 'resumes', 'profileLoaded'],
    },
  },
)
