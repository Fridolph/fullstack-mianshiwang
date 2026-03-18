// ✅ v4 正确配置：使用独立的 @tailwindcss/postcss 包
export default {
  plugins: {
    // 替换原有的 "tailwindcss" 为 "@tailwindcss/postcss"
    '@tailwindcss/postcss': {},
    // 保留 autoprefixer 用于自动添加浏览器前缀
    'autoprefixer': {}
  }
}
