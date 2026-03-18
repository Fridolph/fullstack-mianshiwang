# 02 - web-nuxt 模块梳理与问题记录

## 文档目的

这份文档不再重复“做了哪些提交”，而是专门用于回答下面这些学习问题：

- `apps/web-nuxt` 现在有哪些模块，它们各自负责什么
- 当前前端和 `ww-server` 的关系是什么，哪些已经打通，哪些还没打通
- 本次从旧 Nuxt 项目迁到当前 monorepo 时，Nuxt 升级和结构重构踩了哪些坑
- 当前代码里有哪些地方只是“先打通主链路”，后续还值得继续优化

如果说 `01` 号文档更像迁移日志，那么这份文档更像“架构解说 + 问题台账”。

---

## 一、当前 web-nuxt 的模块分层

当前前端可以先按下面 6 层来理解。

### 1. 应用壳层

对应文件：

- `apps/web-nuxt/app/app.vue`
- `apps/web-nuxt/app/layouts/default.vue`
- `apps/web-nuxt/app/assets/css/main.css`
- `apps/web-nuxt/app/app.config.ts`

职责：

- 提供全局页面壳
- 提供主导航
- 提供统一视觉基线
- 承接 `UApp`、`NuxtLayout`、`NuxtPage`

学习重点：

- 为什么 Nuxt UI 需要 `UApp`
- 为什么 layout 应该是“外壳和导航”，而不是塞满业务逻辑

---

### 2. 基础设施层

对应文件：

- `apps/web-nuxt/nuxt.config.ts`
- `apps/web-nuxt/app/plugins/request.ts`
- `apps/web-nuxt/app/composables/useApiClient.ts`
- `apps/web-nuxt/app/types/api.ts`

职责：

- 定义运行时配置
- 定义统一请求客户端
- 统一处理 token 注入
- 统一处理 `{ code, message, data }` 后端响应
- 定义 SSE 请求相关类型

学习重点：

- 为什么不能在每个页面里各自 `fetch`
- 为什么后端一旦有统一响应结构，前端最好在插件层拆包
- 为什么流式接口不能简单等同于普通 HTTP 请求

---

### 3. 用户与认证层

对应文件：

- `apps/web-nuxt/app/api/login.ts`
- `apps/web-nuxt/app/api/user.ts`
- `apps/web-nuxt/app/stores/user.ts`
- `apps/web-nuxt/app/middleware/auth.ts`
- `apps/web-nuxt/app/pages/login.vue`
- `apps/web-nuxt/app/pages/profile.vue`
- `apps/web-nuxt/app/pages/history.vue`

职责：

- 注册 / 登录
- token 持久化
- 拉取用户资料
- 受保护页面跳转
- 个人资料维护
- 历史消费记录展示

学习重点：

- token 只是“登录凭证”，不是“用户资料”
- 所以 `token` 和 `userInfo` 必须分开管理
- `ensureUserProfile()` 的作用，就是解决“本地有 token，但还没拉用户资料”的问题

---

### 4. 面试业务层

对应文件：

- `apps/web-nuxt/app/api/interview.ts`
- `apps/web-nuxt/app/stores/interview.ts`
- `apps/web-nuxt/app/pages/interview/index.vue`
- `apps/web-nuxt/app/pages/interview/start.vue`
- `apps/web-nuxt/app/pages/interview/report.vue`
- `apps/web-nuxt/app/components/interview/*`

职责：

- 简历分析
- 继续追问
- 简历押题流式进度
- 押题结果展示

学习重点：

- 页面不是直接持有所有状态，而是把关键状态放到 interview store
- store 里现在实际承接了：
  - 输入草稿
  - 分析结果
  - 会话 ID
  - 追问消息
  - SSE 进度
  - 最终结果

这正是一个比较典型的“业务容器状态”。

---

### 5. 类型契约层

对应文件：

- `apps/web-nuxt/app/types/domain.ts`
- `apps/web-nuxt/app/types/api.ts`
- `apps/web-nuxt/app/types/nuxt.d.ts`

职责：

- 统一业务模型认知
- 把接口返回、store 状态、组件 props 关联起来
- 降低“每个页面都重新猜字段”的成本

学习重点：

- interface/type 的价值不是“看起来更规范”
- 真正的价值是：把业务关系显式化

比如：

- `AuthPayload` 告诉你登录成功到底返回什么
- `ResumeQuizProgressEvent` 告诉你 SSE 事件会长什么样
- `InterviewReport` 告诉你结果页真正需要什么字段

---

### 6. 学习与迁移记录层

对应文件：

- `docs/01-Nuxt-JS迁移到TS-Monorepo记录.md`
- `docs/02-web-nuxt模块梳理与问题记录.md`

职责：

- 记录迁移步骤
- 记录踩坑
- 记录为什么这么做
- 为后续博客和复盘保留结构化素材

---

## 二、当前前端和后端的对应关系

这是当前最容易“联系不上”的地方，所以单独梳理。

### 1. 已经和当前后端真实打通的部分

#### 用户模块

前端：

- `app/api/login.ts`
- `app/api/user.ts`
- `app/stores/user.ts`

后端：

- `POST /api/user/register`
- `POST /api/user/login`
- `GET /api/user/info`
- `PUT /api/user/profile`
- `GET /api/user/consumption-records`

结论：

- 这一层是已经真实可对齐的，不是假的

---

#### 面试模块

前端：

- `app/api/interview.ts`
- `app/stores/interview.ts`
- `app/pages/interview/start.vue`

后端：

- `POST /api/interview/analyze-resume`
- `POST /api/interview/continue-conversation`
- `POST /api/interview/resume/quiz/stream`

结论：

- 这三条链路前端已经接好了
- 但后端“结果内容质量”和“结果详情查询接口”仍处于学习中的骨架阶段

---

### 2. 当前后端还没有真正支持的部分

#### 微信登录

参考项目里有：

- `wechat/qrcode`
- `check-qr-status`
- `test-login`

但当前仓库里：

- `apps/ww-server/src/wechat/wechat.controller.ts`
- `apps/ww-server/src/wechat/wechat.service.ts`

目前基本还是空壳。

结论：

- 所以这次前端不能继续照搬微信扫码登录
- 只能先切到当前后端真实存在的邮箱密码登录

---

#### 简历管理模块

参考项目里有更完整的“上传简历 / 选择简历 / 删除简历”体验。

但当前 `ww-server`：

- 还没有完整独立的 `resume` 模块
- 前端虽然保留了 `resume.ts` 这层 API 文件，但当前主链路并没有真正依赖它跑通

结论：

- 所以当前开始页优先走“直接粘贴简历文本”

---

#### 结果详情查询

前端已经有：

- `pages/interview/report.vue`
- `components/interview/ResumeQuizResultCard.vue`

但当前后端：

- 还没有完整补齐“按 resultId 查询完整结果详情”的稳定接口

结论：

- 当前结果页优先展示“最近一次 SSE 完成事件”写进 store 的结果
- 这是合理的学习阶段做法，但不是最终形态

---

## 三、关键业务流梳理

这部分是最适合配合代码一起看的。

### 1. 登录流

流程：

1. 用户在 `/login` 提交邮箱密码
2. 前端调用 `loginAPI`
3. 后端返回 `AuthPayload`
4. `userStore.applyAuth()` 写入 token 和基础用户信息
5. `userStore.ensureUserProfile()` 补拉用户完整资料
6. 跳转到 `redirect` 对应页面

关键代码：

- `app/components/auth/AuthCredentialPanel.vue`
- `app/stores/user.ts`

为什么这样设计：

- 登录返回的是“认证结果”
- 页面真正展示依赖的是“用户资料”
- 两者在概念上应该区分清楚

---

### 2. 受保护页面流

流程：

1. 页面通过 `definePageMeta({ middleware: 'auth', requiresAuth: true })` 标记需要登录
2. `app/middleware/auth.ts` 检查 `userStore.isLogin`
3. 未登录则跳到 `/login?redirect=当前路径`

为什么这样设计：

- 这是一种最小可用、最好理解的鉴权方案
- 比一开始就做弹窗式权限系统更适合学习阶段

---

### 3. 简历分析流

流程：

1. 用户在 `/interview/start` 填写岗位、JD、简历文本
2. `validateForm()` 做前端最小校验
3. 调用 `analyzeResumeAPI`
4. 返回 `analysis + sessionId`
5. 写入 `interviewStore.setAnalysis(...)`

为什么 `sessionId` 很重要：

- 它是后续“继续追问”的上下文凭证
- 没有它，AI 不知道你上一轮分析的上下文

---

### 4. 继续追问流

流程：

1. 用户在分析面板里输入追问
2. 前端调用 `continueConversationAPI`
3. 带上 `sessionId + question`
4. 后端基于当前会话继续生成回答
5. 前端把 user / assistant 两条消息都写入 `interviewStore.messages`

为什么消息要入 store：

- 因为它不是单个组件的局部状态
- 以后如果把“分析面板”和“对话面板”拆到不同组件甚至不同页面，状态仍然能复用

---

### 5. SSE 简历押题流

流程：

1. 用户点击“开始流式押题”
2. 前端生成 `requestId`
3. 调用 `generateResumeQuizSSE`
4. 通过 `onMessage` 接收进度事件
5. `progress` 事件写入 `progressLogs`
6. `complete` 事件写入 `report`
7. 跳转到 `/interview/report`

为什么一定要生成 `requestId`：

- 因为后端 `ResumeQuizDto` 和 `InterviewService` 已经按幂等性设计了 requestId
- 这是很典型的“前后端配合避免重复生成”的设计点

---

## 四、Nuxt 升级与迁移踩坑记录

这部分是后续写博客时很有价值的素材。

### 1. `tsconfig.json` 不能继续手写一堆 Nuxt 类型配置

现象：

- `typecheck` 一开始报错

原因：

- Nuxt 4 会自己生成 `.nuxt/tsconfig.json`
- 手动堆很多旧配置，容易和 Nuxt 4 自动生成配置冲突

最终做法：

- `tsconfig.json` 只保留：
  - `extends: "./.nuxt/tsconfig.json"`

---

### 2. 原来的脚本仍然残留了旧工程思维

现象：

- `package.json` 里有 `nx serve`、`nx nuxt:build`

问题：

- 当前 `apps/web-nuxt` 更适合直接用 Nuxt 原生命令

最终做法：

- 改回：
  - `nuxt dev`
  - `nuxt build`
  - `nuxt typecheck`

---

### 3. 图标集合过多会导致构建压力增大

现象：

- 构建阶段出现资源压力问题

最终做法：

- 在 `nuxt.config.ts` 中限制：
  - `icon.serverBundle.collections = ['lucide']`

经验：

- 学习项目一开始不要把图标系统配得太大
- 先保守，再扩展

---

### 4. `@nuxt/ui` 装了，不代表样式一定真的生效

这次又踩到了一个很典型的 Nuxt UI 问题：

现象：

- `UButton`、`UCard` 这些组件可以正常渲染
- 但看起来像“普通按钮”，没有 Nuxt UI 的主题样式

原因：

- `app.vue` 中虽然已经用了 `UApp`
- `nuxt.config.ts` 中虽然已经注册了 `@nuxt/ui`
- 但 `app/assets/css/main.css` 缺少：
  - `@import "tailwindcss";`
  - `@import "@nuxt/ui";`

也就是说：

- 组件功能层在
- 样式层没有真正被引入

最终做法：

- 在 `main.css` 顶部补上 Nuxt UI 官方推荐的两个 `@import`
- 用 `pnpm --filter @mianshiwang/client list @nuxt/ui tailwindcss --depth 0`
  再确认依赖确实已经装到当前前端包里

经验：

- Nuxt UI 的接入要同时满足 3 件事：
  1. 模块注册
  2. `UApp` 包裹
  3. CSS 入口正确导入

少一个，最终体验都会不完整。

补充一个这次一起顺手收掉的小细节：

- 如果页面只是“点按钮后跳转”，优先直接写 `UButton` 的 `to`
- 不要再额外包一层 `NuxtLink`

原因是：

- `UButton` 本身已经支持导航场景
- 外层再包 `NuxtLink`，语义和交互结构都更绕
- 后面统一样式和状态也更方便

这类问题不一定会立刻报错，但属于“能跑，不代表写法已经最顺”。

---

### 5. 旧项目里的能力，不等于当前后端真实支持的能力

这是这次迁移中最重要的坑。

典型例子：

- 旧项目是微信扫码登录
- 当前后端实际只有邮箱密码登录

经验：

- 迁移时一定要先看“当前后端真实有哪些控制器和 DTO”
- 不要直接以旧前端为真相来源

---

### 6. 结果页“看起来完整”，不代表后端已经完整

现象：

- 前端已经有开始页、进度页、结果页、历史页
- 但后端的简历押题结果仍然是学习中的骨架版本

经验：

- 页面完成度和真实业务完成度不是一回事
- 学习时要始终区分：
  - 前端结构是否完整
  - 后端能力是否真实到位

---

## 五、当前已知问题

### 1. `web-nuxt` 比 `ww-server` 走得快

当前前端已经具备完整页面承接能力，但后端仍停留在“第九章学习进度附近”的阶段。

这意味着：

- 前端很多页面是“结构和状态先走通”
- 后端很多结果仍然是“流程先打通，内容后补齐”

这不是错误，但要清楚认知。

---

### 2. 简历押题的 SSE 已经接好，但后端结果内容还不完整

从当前代码看，后端流式结构已经存在，但真实 AI 结果写入仍未完全补齐。

所以当前前端的状态是：

- 进度机制已接好
- 结果页已接好
- 但数据质量还依赖后端继续推进

---

### 3. 历史记录页只能先看消费记录，不能完整回看报告详情

当前历史页已经有价值，但还不是终态。

后续还需要：

- 结果详情查询接口
- `resultId -> report` 的完整链路

---

### 4. 仍有未分类工作区内容

当前仓库里还有一些未纳入阶段提交的内容，例如：

- `apps/web-nuxt/eslint.config.mjs`
- `pnpm-lock.yaml`
- `apps/web-nuxt/middleware/`

这些都需要后续继续分类，不然会干扰学习时的提交历史。

---

## 六、后续可优化点

### 1. 类型进一步收紧

当前很多地方已经从 `any` 走到了“最小可用类型”，但还可以继续收紧：

- `analysis` 目前还是 `Record<string, unknown>`
- 消费记录中的 `inputData` / `outputData` 还可以进一步结构化
- 结果详情结构可以和后端 Schema 再做更细粒度映射

---

### 2. 结果详情接口补齐

这是前后端下一步最值得优先推进的一点。

一旦补齐：

- 历史页就能跳转结果页
- 结果页就不只依赖 store 中最近一次结果
- 整个面试链路会更闭环

---

### 3. 简历管理模块补齐

当前开始页优先支持粘贴简历文本是合理的，但后续如果补齐：

- 上传简历
- 简历列表
- 删除 / 重命名

那前端体验会更接近参考项目。

---

### 4. 路由和模块可以继续 feature 化

现在已经比最初清晰很多，但后续还可以进一步按业务拆目录，例如：

- `components/auth/*`
- `components/profile/*`
- `components/interview/*`
- `types/auth.ts`
- `types/interview.ts`

这样会更利于长期维护。

---

### 5. 错误提示可以再统一

当前页面里已经有 toast，但还是“各页面自己报错”。

后续可以继续收敛：

- 统一错误文案
- 统一 401 处理体验
- 统一表单校验提示风格

---

### 6. 首页应该优先回到“业务入口”，而不是“迁移说明”

当前这个项目虽然是学习项目，但它同时也是：

- 面向自己使用的前端入口
- 未来可能给别人演示的产品入口

因此首页更合理的职责应该是：

- 让人一进来就知道下一步该做什么
- 例如：登录、开始面试、查看历史记录

而不是：

- 一上来先看到迁移说明和工程背景

这次调整后的策略是：

- 首页回归“面试入口”
- 单独新增“迁移记录页”
- 导航继续保留“迁移记录”入口

这样两边都保住了：

- 产品入口更自然
- 学习记录也没有丢

---

## 七、学习建议

如果你接下来要边看代码边学，建议按这个顺序看：

1. 先看 `types/domain.ts`
2. 再看 `stores/user.ts`
3. 再看 `middleware/auth.ts`
4. 再看 `pages/login.vue`
5. 再看 `stores/interview.ts`
6. 再看 `pages/interview/start.vue`
7. 最后再看 `api/interview.ts` 和后端 `interview.controller.ts`

为什么这样看：

- 因为这样是从“数据模型 -> 状态 -> 路由 -> 页面 -> 接口”的顺序
- 比从页面直接往下看，更容易把业务联系起来

---

## 八、当前阶段总结

到目前为止，`apps/web-nuxt` 的意义已经发生了变化。

它不再只是：

- “把旧 Nuxt 项目搬进 monorepo”

而是变成了：

- 一个围绕当前 NestJS 学习后端逐步承接业务能力的前端实验场
- 一个可以持续记录“JS -> TS -> Monorepo -> 前后端联调”的学习工程

这也是为什么文档、类型注释、阶段提交要一起做。

因为对学习项目来说：

- 代码能跑很重要
- 但“你为什么这样写、以后怎么看得懂”同样重要
