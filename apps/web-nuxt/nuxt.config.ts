import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@nuxt/image',
    '@vueuse/nuxt',
    '@pinia/nuxt',
    'pinia-plugin-persistedstate/nuxt',
  ],

  imports: {
    dirs: ['api', 'composables', 'stores'],
    presets: ['vue'],
  },

  devtools: {
    enabled: true,
    timeline: {
      enabled: true,
    },
  },

  app: {
    head: {
      title: '面试王',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content: '在 monorepo 中逐步迁移并实现的全栈面试练习平台。',
        },
      ],
    },
  },

  css: ['~/assets/css/main.css'],

  ui: {
    fonts: false,
  },

  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://127.0.0.1:6789/api',
      appName: '面试王',
      appDescription: '基于 Nuxt、NestJS 与 AI 能力的全栈面试练习平台',
    },
  },
  srcDir: 'app',

  devServer: {
    host: '0.0.0.0',
    port: 5945,
  },
  compatibilityDate: '2025-11-11',

  typescript: {
    strict: true,
    typeCheck: false,
  },

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs',
      },
    },
  },

  icon: {
    serverBundle: {
      collections: ['lucide'],
    },
  },
})
