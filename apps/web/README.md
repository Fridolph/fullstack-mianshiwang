# Playground 项目模板

[![Nuxt UI](https://img.shields.io/badge/Made%20with-Nuxt%20UI-00DC82?logo=nuxt&labelColor=020420)](https://ui.nuxt.com)

使用此模板可以快速开始基于 [Nuxt UI](https://ui.nuxt.com) 的开发。

- [在线演示](https://starter-template.nuxt.dev/)
- [官方文档](https://ui.nuxt.com/docs/getting-started/installation/nuxt)

<a href="https://starter-template.nuxt.dev/" target="_blank">
<picture>
<source media="(prefers-color-scheme: dark)" srcset="https://ui.nuxt.com/assets/templates/nuxt/starter-dark.png">
<source media="(prefers-color-scheme: light)" srcset="https://ui.nuxt.com/assets/templates/nuxt/starter-light.png">
<img alt="Nuxt Starter Template" src="https://ui.nuxt.com/assets/templates/nuxt/starter-light.png">
</picture>
</a>

> Vue 的模板项目可以访问 [https://github.com/nuxt-ui-templates/starter-vue](https://github.com/nuxt-ui-templates/starter-vue)。

---

## 项目简介

Playground 是一个基于 Nuxt.js 的现代化前端开发项目，旨在提供高效、灵活的开发体验。它集成了丰富的 UI 组件库、状态管理工具和自动化工作流，适合用于构建复杂的前端应用。

---

## 功能特点

- **轻量级框架**：基于 `Nuxt.js` 构建，支持服务端渲染（SSR）和静态站点生成（SSG）。
- **组件库支持**：
  - 集成 `@nuxt/ui`，提供多种 UI 组件。
  - 支持 `tailwindcss`，快速构建响应式设计。
- **状态管理**：使用 `Pinia` 进行状态管理，支持状态持久化功能。
- **日期处理**：集成 `dayjs` 和 `@internationalized/date`，方便日期处理。
- **图标库**：支持多种图标库（如 `mdi`、`lucide`、`material-symbols`）。
- **国际化支持**：内置多语言切换功能。
- **类型安全**：使用 `TypeScript` 和 `Zod` 提供开发时类型检查和数据验证。
- **自动化工具**：
  - ESLint 集成代码质量检查。
  - 使用 `unplugin-auto-import` 自动导入工具。

---

## 快速开始

### 安装模板

使用以下命令快速创建基于 Nuxt UI 的项目：

```bash
npm create nuxt@latest -- -t github:nuxt-ui-templates/starter
```

---

## 安装与使用

### 环境要求

- Node.js >= 16
- pnpm >= 10

### 安装依赖

```bash
pnpm install
```

### 本地开发

启动本地开发服务器：

```bash
pnpm dev
```

开发服务器将在 `http://localhost:3000` 上运行。

---

## 生产环境

### 构建生产版本

```bash
pnpm build
```

### 本地预览生产版本

```bash
pnpm preview
```

查看 [部署文档](https://nuxt.com/docs/getting-started/deployment) 获取更多信息。

---

## 项目结构

以下是项目的主要目录及说明：

```
packages/playground/
├── app/                     # 核心应用目录
│   ├── assets/              # 静态资源（CSS、图片等）
│   ├── components/          # Vue 组件
│   ├── composables/         # 可组合逻辑
│   ├── layouts/             # 页面布局
│   ├── pages/               # 页面文件
│   ├── plugins/             # 插件
│   ├── stores/              # 状态管理
│   ├── types/               # TypeScript 类型定义
│   ├── utils/               # 工具函数
│   ├── app.config.ts        # 应用配置
│   ├── app.vue              # 应用入口
├── .github/workflows/       # GitHub Actions 配置
├── nuxt.config.ts           # Nuxt 配置文件
├── tailwind.config.js       # Tailwind CSS 配置
├── tsconfig.json            # TypeScript 配置
├── package.json             # 项目依赖配置
└── README.md                # 项目说明文档
```

---

## 主要依赖

### 核心依赖

- `nuxt`：用于构建现代化 Web 应用。
- `pinia`：状态管理工具。
- `tailwindcss`：CSS 框架，支持响应式设计。
- `typescript`：提供类型安全的开发体验。
- `zod`：数据验证工具。

### 图标支持

- `@iconify-json/lucide`
- `@iconify-json/material-symbols`
- `@iconify-json/mdi`
- `@iconify-json/ph`
- `@iconify-json/simple-icons`

### 日期处理

- `dayjs-nuxt`
- `@internationalized/date`

### 开发工具

- `eslint`：代码质量检查。
- `vue-tsc`：Vue 的类型检查工具。
- `unplugin-auto-import`：自动导入工具。

---

## 部署

点击以下按钮快速部署到 Vercel：

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-name=starter&repository-url=https%3A%2F%2Fgithub.com%2Fnuxt-ui-templates%2Fstarter&demo-image=https%3A%2F%2Fui.nuxt.com%2Fassets%2Ftemplates%2Fnuxt%2Fstarter-dark.png&demo-url=https%3A%2F%2Fstarter-template.nuxt.dev%2F&demo-title=Nuxt%20Starter%20Template&demo-description=A%20minimal%20template%20to%20get%20started%20with%20Nuxt%20UI.)

---

## 贡献指南

欢迎贡献代码！请遵循以下步骤：
1. Fork 项目。
2. 创建 Feature 分支。
3. 提交代码并创建 Pull Request。
4. 等待审核通过。

---

## 许可证

此项目为私有项目，未经授权不得分发。

---

通过以上内容，你可以快速了解并开始使用 Playground 项目。如果需要进一步调整或补充，请告诉我！
```
