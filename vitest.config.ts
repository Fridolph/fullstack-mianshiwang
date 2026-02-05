import { defineConfig } from 'vitest/config'
import { resolve } from 'node:path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.spec.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/build/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['**/__tests__/**', '**/*.d.ts', '**/node_modules/**'],
      thresholds: {
        statements: 90,
        branches: 80,
        functions: 90,
        lines: 90,
      },
    },
    testTimeout: 30000, // 增加超时时间，MongoDB连接可能需要更多时间
    mockReset: true, // 每次测试后重置模拟
    restoreMocks: true, // 测试后恢复所有模拟
  },
  resolve: {
    alias: {
      '@api': resolve(__dirname, './apps/api-server/src'),
    },
  },
})
