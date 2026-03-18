import { defineStore } from 'pinia'
import { MAX_RESUME_COUNT } from '~/constants/app'
import type { ResumeSummary, UserInfo } from '~/types/domain'

interface UserState {
  userInfo: UserInfo | null
  token: string
  resumes: ResumeSummary[]
}

export const useUserStore = defineStore(
  'user',
  {
    state: (): UserState => ({
      userInfo: null,
      token: '',
      resumes: []
    }),
    getters: {
      isLogin: (state) => Boolean(state.token),
      canAddResume: (state) => state.resumes.length < MAX_RESUME_COUNT
    },
    actions: {
      setToken(token: string) {
        this.token = token
      },
      setUserInfo(userInfo: UserInfo | null) {
        this.userInfo = userInfo
      },
      updateUserInfo(userInfo: Partial<UserInfo>) {
        this.userInfo = {
          ...(this.userInfo || {}),
          ...userInfo
        }
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
      logout() {
        this.token = ''
        this.userInfo = null
        this.resumes = []
      }
    },
    persist: true
  }
)
