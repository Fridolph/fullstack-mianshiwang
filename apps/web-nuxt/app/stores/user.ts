import { defineStore } from 'pinia'
import { MAX_RESUME_COUNT } from '~/constants/app'
import { getUserInfoAPI } from '~/api/user'
import type { ApiClient } from '~/types/api'
import type { AuthPayload, ResumeSummary, UserInfo } from '~/types/domain'

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
      profileLoaded: false
    }),
    getters: {
      isLogin: (state) => Boolean(state.token),
      canAddResume: (state) => state.resumes.length < MAX_RESUME_COUNT
    },
    actions: {
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
          ...userInfo
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
        this.resumes = this.resumes.filter((resume) => resume.resumeId !== resumeId)
      },
      async fetchUserProfile($api: ApiClient) {
        if (!this.token) return null

        const user = await getUserInfoAPI($api)
        this.setUserInfo(user)
        return user
      },
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
      logout() {
        this.token = ''
        this.userInfo = null
        this.resumes = []
        this.profileLoaded = false
      }
    },
    persist: {
      pick: ['token', 'userInfo', 'resumes', 'profileLoaded']
    }
  }
)
