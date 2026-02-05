// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt({
  // Your custom configs here
  rules: {
    // 允许 any
    '@typescript-eslint/no-explicit-any': 'off',
    // 组件必须为多字 （没必要）
    'vue/multi-word-component-names': 'off',
    // 强制每行的最大属性数 为 3个
    'vue/max-attributes-per-line': ['error', {
      singleline: {
        max: 3
      },
      multiline: {
        max: 3
      }
    }],
    // 需要或不允许在标签的右括号之前换行
    'vue/html-closing-bracket-newline': [
      'error',
      {
        singleline: 'never',
        multiline: 'never',
        selfClosingTag: {
          singleline: 'never',
          multiline: 'always'
        }
      }
    ],
    // 不允许向模板中添加多个根节点（Vue3 不用遵守）
    'vue/no-multiple-template-root': ['off', {
      disallowComments: false
    }],
    'vue/no-v-html': ['off']
  }
})
