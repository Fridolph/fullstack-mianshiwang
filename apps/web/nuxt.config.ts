// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxtjs/i18n',
    '@nuxt/ui',
    '@nuxt/scripts',
    '@nuxt/test-utils',
    '@nuxt/image',
    '@nuxtjs/mdc',
    '@vueuse/nuxt',
    '@pinia/nuxt',
    'pinia-plugin-persistedstate',
    '@nuxt/content'
  ],

  imports: {
    autoImport: true,
    presets: [
      'vue',
      {
        from: 'pinia-plugin-persistedstate',
        imports: ['definePersistedState']
      }
    ] // 自动导入 Vue 的 ref/onMounted 等 API
  },

  devtools: {
    enabled: true,

    timeline: {
      enabled: true
    }
  },

  app: {
    head: {
      // htmlAttrs: { lang: 'en' },
      // title: 'GreenSketch | Sketching a Greener Future',
      meta: [
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no' }
      ],
      script: []
    }
  },

  css: ['~/assets/css/main.css'],

  ui: {
    fonts: false
  },

  // 配置持久化存储
  appConfig: {
    piniaPersistedstate: {
      storage: 'localStorage', // 默认存储方式
      cookieOptions: {
        sameSite: 'strict',
        maxAge: 90 * 24 * 60 * 60 // 三月
      }
    }
  },

  // 添加 Shiki 到 transpile 列表，确保它能被正确处理
  build: {
    transpile: ['shiki']
  },

  routeRules: {
  },

  devServer: {
    host: '0.0.0.0',
    port: 5945
  },

  // 确保生成类型声明
  typescript: {
    shim: false,
    strict: true,
    tsConfig: {
      compilerOptions: {
        moduleResolution: 'bundler',
        types: [
          '@nuxt/types',
          '@nuxt/ui',
          'nuxt/auto-imports',
          'nuxt',
          'pinia'
        ]
      }
    }
  },

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  },
  // 添加 i18n 配置
  i18n: {
    defaultLocale: 'zh',
    strategy: 'no_prefix',
    lazy: false,
    locales: [
      { code: 'zh', name: 'Chinese', file: 'zh.json' },
      { code: 'en', name: 'English', file: 'en.json' }
    ],
    preload: ['zh', 'en']
  }
})
