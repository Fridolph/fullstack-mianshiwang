# `interview + ai` 首个真实样本闭环示例

**日期**：2026-03-10  
**类型**：Example  
**适用范围**：`apps/ww-server/src/interview/*`、`apps/ww-server/src/ai/services/*`

---

## 这个示例记录什么

这是 `fullstack-mianshiwang` 在接入 `Dao` 工程体系之后，第一条真正进入业务代码的完整样本。

它不是单个 commit 的摘录，而是一条连续的真实闭环：

1. 先立入口边界
2. 再沉淀 AI 调用边界
3. 同步留下经验与博客

也就是说，这个样本同时覆盖了：

- `Dao Coding`
- `Dao Commit`
- `#沉淀`
- 技术博客

---

## 样本背景

目标模块：

- `interview`
- `ai`

目标问题：

- controller 入口边界不稳
- session 资源缺少明确归属校验
- AI 调用职责分散在多个服务中
- `InterviewAIService` 占了位置，但还没有真正承担职责

为什么先做这条线：

- 它最贴近当前项目主线
- 它已经有真实业务价值，不是边缘重构
- 它天然适合跑出一条清晰的 `Dao` 闭环

---

## 第一步：收紧入口边界

### 主要动作

- 为 `analyze-resume` 和 `continue-conversation` 增加 DTO
- 启用 `JwtAuthGuard`
- controller 回到统一响应收口
- `SessionManager` 增加 `getSessionOrThrow`
- `continueConversation` 增加会话归属校验

### 对应 Dao Coding

- 位置即语义
- 承载有度，边界清晰

### 收口提交

```text
[☶☵][蹇] refactor(interview): 收紧入口边界并统一会话异常语义
```

### 对应沉淀

- `docs/experience/2026-03-10-interview-session-boundary.md`
- `docs/blog/2026-03-10-task-3-1-interview-boundary.md`

---

## 第二步：沉淀 AI 调用边界

### 主要动作

- 把 `InterviewAIService` 做成真正的 interview 线 AI facade
- `ResumeAnalysisService` 只保留 prompt 与业务变量
- `ConversationContinuationService` 只保留 prompt 与业务变量
- `AIModelFactory` 继续只负责模型创建，不直接承担业务调用语义

### 对应 Dao Coding

- 复利沉淀，不重复造轮子
- 聚则生，散则死

### 收口提交

```text
[☰☶][大畜] refactor(interview): 沉淀 AI 调用边界并实化 InterviewAIService
```

### 对应沉淀

- `docs/experience/2026-03-10-interview-ai-facade-boundary.md`
- `docs/blog/2026-03-10-task-3-2-interview-ai-boundary.md`

---

## 这条闭环里真正留下了什么

### 代码层

- 入口边界更清晰
- 会话异常语义更稳定
- AI 调用职责更聚焦

### 经验层

- AI 会话也是资源，资源就要有归属校验
- Factory 与 Facade 不应混在一起
- 空壳服务不要长期悬着

### 流程层

- 真实样本适合先小步切一刀，再连续沉淀
- 一轮任务不只留代码，也要留经验和博客

---

## 为什么这个示例值得复用

以后只要你在别的模块遇到类似情况，都可以拿这条路径做参考：

1. 先判断入口边界是否稳
2. 再判断内层职责是否开始散乱
3. 每一刀都做独立分支、独立验证、独立沉淀
4. 每一轮都用一条高信号 `Dao Commit` 收口

这比一口气做“大而全重构”更稳，也更容易学习。

---

## 可复用的最小模式

```text
发现真实问题
  -> 先收入口边界
  -> 再收内层职责
  -> 补 experience
  -> 补 blog
  -> 用一条高信号 Dao Commit 收口
```

这就是这条首样本真正可复用的地方。

---

*这是 `fullstack-mianshiwang` 的第一条真实 Dao 工程闭环样本。*
