// packages/playground/tailwind.config.js
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

// 1. 获取当前配置文件的绝对路径
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default {
  // 2. 拼接子项目的完整文件路径（确保覆盖所有 Vue 文件！）
  content: [
    // 目标子项目的所有单文件组件
    join(__dirname, './app/**/*.{vue,js,ts}'),
    // 补充：子项目的其他文件（如 layouts/pages/components）
    join(__dirname, './pages/**/*.{vue,js,ts}'),
    join(__dirname, './components/**/*.{vue,js,ts}'),
    join(__dirname, './layouts/**/*.{vue,js,ts}')
  ],
  theme: {},
  plugins: [
    require('tailwindcss/plugin')(({ addUtilities }) => {
      addUtilities({
        // 自定义类名：border-dotted-bg
        '.border-dotted-bg': {
          height: '1px',
          backgroundImage: 'linear-gradient(to right, #e5e7eb 0%, #e5e7eb 40%, transparent 40%, transparent 60%)',
          backgroundSize: '12px 1px',
          backgroundRepeat: 'repeat-x'
        }
      })
    })
  ]
}
