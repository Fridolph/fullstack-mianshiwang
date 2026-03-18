# 01 - Nuxt JS 迁移到 TS Monorepo 记录

## 文档目的

这份文档用于持续记录下面这些学习与迁移过程：

- 如何把一个独立的 Nuxt 项目迁移进 monorepo
- 如何把一个以 JavaScript 为主的前端项目逐步迁移到 TypeScript
- 如何把前端和后端组织到同一个仓库中，但仍保持各自独立运行
- 如何在迁移过程中保留学习痕迹、踩坑记录和架构思考
- 如何为后续部署上线做准备

它不只是变更记录，更是一份学习日志、迁移日志和架构复盘底稿。

## 源项目与目标项目

- 前端参考项目：`/Users/fri/Desktop/github/mianshiwang-nuxt`
- 当前 monorepo 前端应用：`/Users/fri/Desktop/github/fullstack-mianshiwang/apps/web-nuxt`
- 当前 monorepo 后端应用：`/Users/fri/Desktop/github/fullstack-mianshiwang/apps/ww-server`

## 迁移目标

目标不是把旧项目整体复制进 monorepo。

真正的目标是：

1. 以当前 monorepo 结构作为主架构
2. 把旧 Nuxt 项目作为参考实现
3. 在 `apps/web-nuxt` 中分阶段重建业务模块
4. 记录每一次迁移决策、问题、权衡和思路
5. 最终让前后端都能在 monorepo 中独立运行，并完成联调与部署

## 核心迁移原则

### 1. 以 monorepo 为主

`apps/web-nuxt` 才是最终前端落地点。

旧 Nuxt 项目只承担“参考来源”的角色，用于提供：

- 目录结构思路
- 业务模块拆分
- 页面流程设计
- 状态管理方式
- API 层组织思路

### 2. 按模块迁移，而不是整仓复制

不要一步把整个旧项目搬进来。

迁移顺序建议为：

1. 基础设施层
2. 共享业务基础层
3. 业务页面层
4. UI 细节层
5. 部署与发布层

### 3. 先保证 JS 行为迁移，再逐步补 TS 契约

因为参考项目是以 JavaScript 为主，不能一开始就把所有内容强行改成严格 TypeScript。

更合理的路线是：

1. 先迁模块结构
2. 先让功能运行起来
3. 再补 API、store、composable 的类型
4. 再逐步收紧类型
5. 等流程稳定后再重构命名和抽象

### 4. 每一步都尽量保持可运行

每个阶段都尽量保证：

- 后端可以单独运行
- 前端可以单独运行
- 前后端联调可以被验证

这样迁移更稳，也更容易排查问题。

## 当前基线

### monorepo 当前状态

- 前端应用位于 `apps/web-nuxt`
- 后端应用位于 `apps/ww-server`
- 前端已经是一个 Nuxt 应用
- 后端已经是一个 NestJS 应用

### 参考项目当前状态

参考项目已经具备比较完整的业务前端结构，例如：

- `app/api`
- `app/stores`
- `app/middleware`
- `app/pages/interview`
- `app/components/interview`
- `app/components/login`
- `app/components/profile`

### 当前迁移的主要挑战

参考项目以 JavaScript 模块为主，而目标 monorepo 希望逐步具备以下特征：

- 模块更清晰
- 类型更容易补全
- 维护成本更低
- 更适合记录和部署

## 迁移阶段划分

### 阶段 0 - 对比与准备

目标：

- 对比参考项目和 monorepo 前端结构
- 区分哪些属于基础设施，哪些属于业务模块
- 确认迁移顺序

产出：

- 迁移主文档
- 模块映射关系
- 分阶段迁移清单

### 阶段 1 - 在 monorepo 中搭建前端基础设施

目标：

- 为 `apps/web-nuxt` 做好承接业务模块的准备

典型工作：

- 环境变量约定
- API 请求层
- token 持久化
- 路由中间件
- 公共类型目录
- 业务目录整理

### 阶段 2 - 迁移共享业务基础层

目标：

- 在迁页面之前，先迁最基础、最通用的业务能力

典型工作：

- `user` store
- `interview` store
- 登录 API
- 用户 API
- 面试 API

### 阶段 3 - 迁移关键业务页面

目标：

- 在 monorepo 中跑通第一条完整业务链路

建议顺序：

1. 登录页
2. 个人中心
3. 面试入口页 / start 页
4. 面试进度页
5. 面试结果 / report 页
6. 历史记录页

### 阶段 4 - 补齐和收紧 TS 契约

目标：

- 从“能跑”逐步走向“清晰、可维护、类型明确”

典型工作：

- 请求和响应类型
- store 状态类型
- composable 返回值类型
- 公共枚举 / 常量
- 页面表单模型类型

### 阶段 5 - 重构与稳定化

目标：

- 在业务跑通后收拾迁移遗留问题

典型工作：

- 命名统一
- 去除重复逻辑
- 按功能整理 feature 目录
- 收敛 UI 组件
- 统一错误处理

### 阶段 6 - 部署与发布

目标：

- 让 monorepo 具备真实可部署能力

典型工作：

- 环境隔离
- 前端构建与后端构建
- 部署平台选择
- 运行时配置
- 发布清单

## 模块映射关系

当前可以先按下面的映射关系迁移：

| 参考项目 | monorepo 目标目录 | 说明 |
| --- | --- | --- |
| `app/api/*` | `apps/web-nuxt/app/api/*` | 按模块逐步迁 |
| `app/stores/*` | `apps/web-nuxt/app/stores/*` | 结合当前项目风格重写 |
| `app/middleware/*` | `apps/web-nuxt/app/middleware/*` | 优先迁鉴权中间件 |
| `app/pages/interview/*` | `apps/web-nuxt/app/pages/interview/*` | 核心业务页面 |
| `app/components/interview/*` | `apps/web-nuxt/app/components/interview/*` | 页面骨架稳定后再迁 |
| `app/components/login/*` | `apps/web-nuxt/app/components/login/*` | 跟随登录流迁移 |
| `app/components/profile/*` | `apps/web-nuxt/app/components/profile/*` | 跟随用户流迁移 |

## 每一步迁移记录模板

后续每一步都按这个模板记录，方便后续整理博客。

### 第 N 步 - 标题

日期：

目标：

参考来源：

修改文件：

本次迁移内容：

为什么这一步重要：

遇到的问题：

解决方式：

JS -> TS 迁移要点：

下一步待做内容：

## 第 0 步 - 项目迁移决策记录

日期：

- 2026-03-18

目标：

- 确认如何把独立 Nuxt 项目逐步迁入 monorepo

决策：

- 保留 `apps/web-nuxt` 作为 monorepo 中唯一的前端目标应用
- 保留 `mianshiwang-nuxt` 作为参考项目
- 不直接把旧项目整体替换到 monorepo 中

为什么这样决定：

- 更符合 monorepo 学习目标
- 能保留当前仓库对架构的主导权
- 避免把一个 JS 项目整体复制进来后难以渐进迁移到 TS
- 后续每一步都更容易写成博客和复盘材料

JS -> TS 迁移要点：

- 迁移必须是渐进式，而不是一次性完成
- 类型优先从“接口契约”和“状态结构”开始补，不从所有文件同时强推

下一步待做内容：

- 进入阶段 1，为 `apps/web-nuxt` 搭建前端基础设施层

## 第 1 步 - 收敛 web-nuxt 基础设施层

日期：

- 2026-03-18

目标：

- 让 `apps/web-nuxt` 从“零散迁入了一些旧项目文件”的状态，变成一个可以稳定承接后续业务迁移的 Nuxt 底座

参考来源：

- `mianshiwang-nuxt/app/plugins/request.js`
- `mianshiwang-nuxt/app/stores/*`
- `mianshiwang-nuxt/nuxt.config.js`

修改文件：

- `apps/web-nuxt/nuxt.config.ts`
- `apps/web-nuxt/package.json`
- `apps/web-nuxt/tsconfig.json`
- `apps/web-nuxt/app/app.vue`
- `apps/web-nuxt/app/app.config.ts`
- `apps/web-nuxt/app/assets/css/main.css`
- `apps/web-nuxt/app/layouts/default.vue`
- `apps/web-nuxt/app/composables/useApiClient.ts`
- `apps/web-nuxt/app/plugins/request.ts`
- `apps/web-nuxt/app/middleware/auth.ts`
- `apps/web-nuxt/app/constants/app.ts`
- `apps/web-nuxt/app/types/api.ts`
- `apps/web-nuxt/app/types/domain.ts`
- `apps/web-nuxt/app/types/nuxt.d.ts`
- `apps/web-nuxt/app/stores/user.ts`
- `apps/web-nuxt/app/stores/ui.ts`
- `apps/web-nuxt/app/stores/interview.ts`
- `apps/web-nuxt/app/api/*`
- `apps/web-nuxt/app/pages/index.vue`
- `apps/web-nuxt/app/pages/login.vue`
- `apps/web-nuxt/app/pages/interview/index.vue`

本次迁移内容：

- 将 `nuxt.config.ts` 从演示型配置收敛为更适合业务迁移的基础配置
- 确定 `srcDir: 'app'`，方便后续和参考项目结构对齐
- 建立 `runtimeConfig.public.apiBase`
- 建立统一请求插件 `request.ts`，统一处理请求头和后端 `{ code, message, data }` 响应结构
- 把旧的 `app/store` 重整为 `app/stores`
- 用 TS 重写基础 store，并移除旧项目中明显不完整或不安全的字段
- 为 API 层补充最基本的类型，先让 `typecheck` 通过
- 增加默认 layout、首页、登录页占位、面试入口页占位
- 增加迁移阶段展示页面，方便后续学习和展示进度

为什么这一步重要：

- 如果基础设施不稳定，后面迁移登录、面试、SSE、历史页时会一直卡在配置和目录问题上
- 先把底座整理好，后续每一个业务模块迁移都会轻松很多
- 这一步本质上是在把“旧项目文件拼接”转成“可维护的 monorepo 前端应用”

遇到的问题：

- 原来的 `typecheck` 直接报错，原因是 `tsconfig.json` 中手动类型配置和 Nuxt 4 生成配置不兼容
- `package.json` 里残留了 `nx serve` / `nx nuxt:build`，但当前前端包并没有可直接使用的 `nx` 环境
- `nuxt build` 一度因为图标集合过多导致内存溢出
- `postcss.config.js` 不符合当前 Nuxt 4 推荐方式，dev 启动时会持续告警
- dev server 在沙箱环境里无法直接监听端口，需要额外验证方式

解决方式：

- 将 `tsconfig.json` 收敛成 Nuxt 推荐的最小形式：仅继承 `./.nuxt/tsconfig.json`
- 把前端脚本改为 Nuxt 原生脚本：`nuxt dev`、`nuxt build`
- 在 `nuxt.config.ts` 里限制图标集合为 `lucide`，避免构建时把过多本地图标打包进去
- 删除 `postcss.config.js`，消除 Nuxt 4 的配置告警
- 通过提权启动本地 dev server，再用浏览器对页面进行实际验证

JS -> TS 迁移要点：

- 不先强求所有业务类型都严格完善，先把公共契约补起来：请求客户端、响应结构、store 状态、SSE 事件
- 旧项目里的 JS store 往往带有隐式字段和历史遗留逻辑，迁移到 TS 时应先“收敛状态结构”，再逐步补业务
- API 文件从 JS 迁入 TS 时，第一步不是做复杂泛型，而是先给参数和返回调用方式加上基础类型

本地验证方式：

- 执行 `pnpm --filter @mianshiwang/client typecheck`，通过
- 执行 `pnpm --filter @mianshiwang/client build`，通过
- 启动本地 dev server 并访问：
  - `/`
  - `/login`
  - `/interview`
- 实际页面可正常打开，标题、导航、占位内容均正确展示

下一步待做内容：

- 进入第 2 步，开始迁移用户与认证基础能力
- 重点处理登录 API、用户 store、鉴权中间件和登录页实际交互

## 第 2 步 - 用户与认证基础能力迁移

日期：

- 2026-03-18

目标：

- 让 `apps/web-nuxt` 不再停留在“登录占位页”，而是正式接上当前 NestJS 后端已经具备的用户注册、登录、读取资料和更新资料能力

参考来源：

- `mianshiwang-nuxt/app/pages/login.vue`
- `mianshiwang-nuxt/app/stores/user.js`
- `mianshiwang-nuxt/app/middleware/auth.js`
- `apps/ww-server/src/user/user.controller.ts`
- `apps/ww-server/src/user/user.service.ts`

修改文件：

- `apps/web-nuxt/app/api/login.ts`
- `apps/web-nuxt/app/api/user.ts`
- `apps/web-nuxt/app/stores/user.ts`
- `apps/web-nuxt/app/middleware/auth.ts`
- `apps/web-nuxt/app/layouts/default.vue`
- `apps/web-nuxt/app/app.vue`
- `apps/web-nuxt/app/types/domain.ts`
- `apps/web-nuxt/app/components/auth/AuthBenefitsPanel.vue`
- `apps/web-nuxt/app/components/auth/AuthCredentialPanel.vue`
- `apps/web-nuxt/app/components/profile/ProfileSummaryCard.vue`
- `apps/web-nuxt/app/components/profile/ProfileAccountForm.vue`
- `apps/web-nuxt/app/pages/login.vue`
- `apps/web-nuxt/app/pages/profile.vue`

本次迁移内容：

- 把登录逻辑从旧项目里的“微信扫码假设”切换为当前后端已经真实存在的“邮箱密码登录”
- 增加注册、登录、用户信息同步、资料更新的前端闭环
- 在 layout 中接入登录态展示与退出登录
- 为受保护页面增加 `requiresAuth + middleware: 'auth'` 的路由保护方式
- 新增个人中心页面，承接当前用户信息与服务次数展示

为什么这一步重要：

- 前端只有先把用户态跑通，后面的简历押题、历史记录、结果页才有稳定身份上下文
- 参考项目虽然更完整，但它依赖的是另一套微信登录后端能力，当前仓库并没有实现对应接口
- 如果不及时把前端与当前 Nest 后端对齐，后面会一直出现“前端代码有，但接口根本不存在”的假联调状态

遇到的问题：

- 参考项目中的登录接口是 `wechat/qrcode`、`check-qr-status` 等微信流，当前后端 `WechatController` 还是空壳
- 当前后端真正可用的是 `user/register`、`user/login`、`user/info`、`user/profile`
- 旧中间件逻辑依赖弹窗式鉴权提示，但 monorepo 前端目前没有对应的全局鉴权弹窗组件

解决方式：

- 直接把 `app/api/login.ts` 改为面向当前后端的注册/登录接口
- 保留旧微信函数名作为“迁移期兼容占位”，但明确抛出友好错误，避免误用
- 把中间件收敛为最小可用方案：未登录直接跳转 `/login?redirect=...`
- 通过 `userStore.ensureUserProfile()` 统一处理 token 存在但资料未加载的情况
- 在 `app.vue` 中补上 `UApp`，让 Nuxt UI 的 toast、overlay 等能力可正常工作

JS -> TS 迁移要点：

- 用户状态比 UI 更应该优先类型化，因为它会贯穿登录、权限、历史、面试、报告多个模块
- 与其在页面里到处写 `any`，不如优先补齐 `AuthPayload`、`LoginPayload`、`RegisterPayload`、`UserInfo`
- store 的持久化字段最好显式声明 `pick`，不要把临时 UI 状态一起持久化进 localStorage

本地验证方式：

- 执行 `pnpm --filter @mianshiwang/client typecheck`，通过
- 执行 `pnpm --filter @mianshiwang/client build`，通过
- 启动本地 dev server 后，访问 `/login`
- 访问 `/profile`、`/history`、`/interview/start` 时，未登录会自动跳回 `/login?redirect=...`

下一步待做内容：

- 进入第 3 步，把当前后端已经存在的简历分析、继续追问和简历押题流式接口接入前端

## 第 3 步 - 简历分析与押题主链路迁移

日期：

- 2026-03-18

目标：

- 把当前学习主线里的 AI 面试能力真正接到前端页面上，而不是只保留“面试入口”占位页

参考来源：

- `mianshiwang-nuxt/app/pages/interview/index.vue`
- `mianshiwang-nuxt/app/pages/interview/start.vue`
- `mianshiwang-nuxt/app/pages/interview/report.vue`
- `apps/ww-server/src/interview/interview.controller.ts`
- `apps/ww-server/src/interview/dto/resume-quiz.dto.ts`

修改文件：

- `apps/web-nuxt/app/api/interview.ts`
- `apps/web-nuxt/app/types/api.ts`
- `apps/web-nuxt/app/stores/interview.ts`
- `apps/web-nuxt/app/components/interview/InterviewServiceCards.vue`
- `apps/web-nuxt/app/components/interview/ResumeQuizFormCard.vue`
- `apps/web-nuxt/app/components/interview/ResumeQuizProgressCard.vue`
- `apps/web-nuxt/app/components/interview/ResumeAnalysisCard.vue`
- `apps/web-nuxt/app/components/interview/ResumeQuizResultCard.vue`
- `apps/web-nuxt/app/pages/interview/index.vue`
- `apps/web-nuxt/app/pages/interview/start.vue`
- `apps/web-nuxt/app/pages/interview/report.vue`

本次迁移内容：

- 为前端补齐 `analyze-resume`、`continue-conversation`、`resume/quiz/stream` 三条接口能力
- 新增面试入口页，不再是占位说明，而是业务入口与服务卡片
- 新增开始页，支持填写公司、岗位、薪资、JD、简历文本、简历 URL
- 新增简历分析区，可以看到 AI 原始结构化结果，并继续向 AI 追问
- 新增流式押题进度展示区，承接 SSE 事件并写入 interview store
- 新增结果页，用于回看最近一次流式完成事件返回的数据

为什么这一步重要：

- 这是前端真正开始承接 AI 业务链路的一步，能把“页面迁移”变成“接口联调”
- 用户体验上，也第一次从“进入页面”走到了“填写输入 -> 看 AI 返回 -> 看流式进度 -> 看结果”
- 架构上，这一步也证明了前端状态设计是否合理：分析结果、会话 ID、追问消息、流式进度、最终结果都需要组织起来

遇到的问题：

- 当前后端还没有独立的简历管理模块，因此不能照搬旧项目的“选择已上传简历”模式
- 当前后端虽然已经有 `resume/quiz/stream` 路由和消费记录模型，但结果生成仍处于学习中的骨架阶段
- 当前后端尚未补齐真正的“结果详情查询接口”，所以历史记录暂时只能看消费记录，不能回查完整报告

解决方式：

- 开始页优先支持“直接粘贴简历文本”，这是和当前 Nest DTO 最稳定的对接方式
- 结果页优先读取 interview store 里最近一次流式完成事件的数据
- 在结果组件中明确提示：如果题目为空，说明当前后端骨架已打通，但 AI 生成内容尚未真正落库
- 保留简历 URL 字段，为后续接 OSS / 文档解析预留位置

JS -> TS 迁移要点：

- SSE 事件的类型必须先定义，否则流式处理很容易退化成一堆无约束字符串
- 面试模块的 store 不仅要存“最终结果”，还要存过程状态：`analysis`、`sessionId`、`messages`、`progressLogs`、`currentProgress`
- 旧项目里很多页面逻辑写在同一个页面中，迁移到 TS 后更适合先拆成 `FormCard`、`AnalysisCard`、`ProgressCard`、`ResultCard`

本地验证方式：

- 执行 `pnpm --filter @mianshiwang/client typecheck`，通过
- 执行 `pnpm --filter @mianshiwang/client build`，通过
- 本地启动 dev server 后，访问 `/interview`
- 未登录访问 `/interview/start` 时，会被中间件重定向到登录页
- 已确认面试入口页、开始页、结果页可以正常构建与路由

下一步待做内容：

- 继续补齐“历史记录 -> 结果详情”闭环，或者同步补后端结果查询接口

## 第 4 步 - 个人中心与历史记录承接

日期：

- 2026-03-18

目标：

- 把当前后端已经存在的用户资料和消费记录能力承接到前端中，补齐用户可回看、可维护的信息面板

参考来源：

- `mianshiwang-nuxt/app/pages/profile.vue`
- `mianshiwang-nuxt/app/pages/history.vue`
- `apps/ww-server/src/user/user.controller.ts`
- `apps/ww-server/src/interview/schemas/consumption-record.schema.ts`

修改文件：

- `apps/web-nuxt/app/components/history/ConsumptionRecordList.vue`
- `apps/web-nuxt/app/pages/history.vue`
- `apps/web-nuxt/app/pages/profile.vue`

本次迁移内容：

- 增加历史记录页，接入后端 `GET /user/consumption-records`
- 增加前端侧的本地筛选：全部、简历押题、专项面试、HR / 行测
- 增加个人中心页，展示当前用户昵称、邮箱、旺旺币余额与剩余服务次数
- 增加资料编辑表单，直接调用 `PUT /user/profile`

为什么这一步重要：

- 到这里，前端就不再只是“能登录 + 能进面试页”，而是有了基本完整的用户视角
- 用户能看到自己的剩余次数与历史消费记录，才更像一个真实业务应用
- 对学习来说，这一步非常适合帮助理解“用户模块”和“业务消费记录模块”如何在前端会合

遇到的问题：

- 当前后端还没有真正的“按 resultId 查完整报告”的接口
- 当前后端也还没有单独的简历管理模块，所以个人中心里不能像旧项目那样完整管理简历列表

解决方式：

- 历史页先接稳定存在的消费记录接口，不强行伪造报告详情
- 个人中心先聚焦当前后端已有字段：昵称、邮箱、手机号、头像、余额、剩余次数
- 把“后续可补能力”在页面文案里明确说明，便于继续学习迭代

JS -> TS 迁移要点：

- 历史记录页里最先应该类型化的是“服务类型”“状态”“输入输出数据的基础结构”
- 这类页面经常来自后端聚合查询，因此宁可先定义“最小可用类型”，也不要等到字段 100% 完整再开始

本地验证方式：

- 执行 `pnpm --filter @mianshiwang/client typecheck`，通过
- 执行 `pnpm --filter @mianshiwang/client build`，通过
- 访问 `/history`、`/profile` 时，未登录会被重定向到登录页
- 本地 dev server 下已验证路由与页面渲染正常

## 阶段里程碑规划

下面这部分是当前确认后的执行路线。后续每完成一个阶段，都要补记录、补验证结果、补踩坑说明。

### 里程碑 1 - 前端基础设施收敛

目标：

- 先把 `apps/web-nuxt` 整理成一个稳定、可继续迁移的 Nuxt 前端底座

主要内容：

- 清理和收敛 `nuxt.config.ts`
- 建立统一的运行时配置 `runtimeConfig`
- 建立统一请求层
- 统一前端目录约定
- 统一 store 目录与命名
- 补基础中间件、插件、常量、类型目录
- 接通本地后端联调地址

完成标准：

- `apps/web-nuxt` 可以独立启动
- 前端能通过统一请求层访问后端
- 关键配置不再混乱或重复
- 目录结构足够支撑后续模块迁移

### 里程碑 2 - 用户与认证基础能力迁移

目标：

- 把登录态、用户态、权限控制这些共享业务能力先迁过来

主要内容：

- 迁移并重写 `user` store
- 迁移登录相关 API
- 迁移用户信息 API
- 增加登录页
- 增加鉴权中间件
- 增加 token 持久化与退出逻辑

完成标准：

- 可以完成登录
- 可以正确读取和维护用户状态
- 需要登录的页面具备基础权限保护

### 里程碑 3 - 简历分析与押题业务链路跑通

目标：

- 跑通当前学习主线里最重要的业务流：简历分析、简历押题、流式结果展示

主要内容：

- 迁移并重写 `interview` 相关 API
- 迁移并重写 `interview` store
- 增加简历分析页
- 增加简历押题页
- 接入 SSE 流式进度
- 与 `apps/ww-server` 当前接口联调

完成标准：

- 可以发起简历分析
- 可以发起简历押题
- 可以看到流式进度
- 可以接收并展示后端返回结果

### 里程碑 4 - 结果页、历史页和个人中心迁移

目标：

- 补齐用户在业务上的查看、复用、回看能力

主要内容：

- 迁移结果页 / report 页
- 迁移历史记录页
- 迁移个人中心页
- 梳理结果详情数据结构
- 补页面级状态管理

完成标准：

- 用户能查看历史记录
- 用户能进入结果页
- 用户能查看个人信息与相关状态

### 里程碑 5 - UI 收敛与 Nuxt UI 统一

目标：

- 用 `@nuxt/ui` 和当前 monorepo 风格统一组件与页面表现

主要内容：

- 评估参考项目中可复用的组件
- 把适合保留的能力迁移到 `@nuxt/ui` 风格下
- 收敛页面布局
- 去掉冗余样式和不必要依赖
- 补必要注释，保留学习痕迹

完成标准：

- 页面风格基本统一
- 组件职责更清晰
- 冗余代码和重复 UI 逻辑明显下降

### 里程碑 6 - TS 收紧、验证与部署准备

目标：

- 在业务跑通后，补齐类型、验证、构建与部署准备

主要内容：

- 完善 API 类型定义
- 完善 store / composable 类型
- 修复 `nuxt typecheck` 和构建问题
- 明确前后端部署方式
- 整理环境变量与发布说明

完成标准：

- 前端类型检查通过
- 前后端都可独立构建
- 部署路径和配置明确
- 文档足以支撑博客整理和项目复盘

## 当前已识别的重点问题

这些问题会优先进入里程碑 1：

- `apps/web-nuxt` 当前配置偏演示型，和参考项目的业务型结构还没有对齐
- 参考项目有 `app/api`、`app/stores`、`app/middleware`，当前 monorepo 前端虽然已有部分目录，但结构还不稳定
- 当前前端存在 `app/store` 与 Nuxt 常用 `app/stores` 约定不一致的问题
- 当前 `nuxt.config.ts` 模块较多，部分配置更适合后续再保留或收敛
- 当前前端缺少明确的 `runtimeConfig.public.apiBase` 约定
- 当前本地联调、请求封装、权限控制都还没有形成稳定底座

## 执行约定

从现在开始，按下面的节奏推进：

1. 先完成一个小阶段
2. 自行启动开发服务
3. 自行做最小自测
4. 记录文档
5. 再进入下一小阶段

每个阶段都会补充：

- 本次目标
- 修改内容
- 本地验证方式
- 遇到的问题
- JS -> TS 迁移注意点
