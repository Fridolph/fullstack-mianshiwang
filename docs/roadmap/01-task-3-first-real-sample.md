# Task 3：`ww-server` 首个真实样本任务拆解

**文档名称**：First Real Sample Plan  
**版本**：v0.1 草案  
**创建日期**：2026-03-10  
**文档位置**：`docs/roadmap/01-task-3-first-real-sample.md`  
**文档性质**：`fullstack-mianshiwang` / Task 3 专项拆解文档

---

## 一、Task 3 现在要解决什么

`Task 1` 和 `Task 2` 已经把两件事补上了：

- 提交入口：`Dao Commit`
- 流转路径：`Dao Git Workflow`

接下来不能继续只写流程文档了。
`Task 3` 的目标，是让这套体系第一次进入真实业务代码。

换句话说：

> 从“会写 Dao Commit”进入“真实变化真的按 Dao 跑一次”。

---

## 二、为什么要先选一个“首个真实样本”

真实项目里可以改的地方很多。
但第一刀不能乱下。

首个真实样本应该尽量满足这些条件：

- 贴近项目当前主线，而不是边缘模块
- 代码里已经出现明显的边界、位置、承载问题
- 变更规模可控，能在一轮内收口
- 改完后能自然产出一条高质量 `Dao Commit`
- 有机会沉淀至少一条 `experience`

如果第一刀选得太散，后面很容易又回到“只是在做普通重构”。

---

## 三、候选入口对比

### 方案 A：`auth`

优点：

- 边界比较清晰
- 容易做成 `[☶☵][蹇]` 一类的边界修复
- 改动风险相对可控

不足：

- 离当前项目“AI 面试”的主线价值略远
- 对后续 `experience` 的复用密度不一定最高

### 方案 B：`interview + ai`

优点：

- 最贴近当前项目主线
- 直接连接“首个 AI 请求已经跑通”的现阶段成果
- 当前代码里已经出现了明显的边界与位置问题
- 很适合作为 `Dao Coding` 的第一批真实样本

不足：

- 涉及模块比 `auth` 略多，需要拆得更细

### 方案 C：`payment`

优点：

- 后续一定会重要
- 适合积累边界与规则类经验

不足：

- 从当前仓库状态看，它还不是最成熟、最紧迫的一条线
- 作为首刀，反馈密度不如 `interview + ai`

---

## 四、结论：首个真实样本优先选 `interview + ai`

当前 `Task 3` 建议优先落在：

- `apps/ww-server/src/interview/*`
- `apps/ww-server/src/ai/*`

原因很明确：

- 这是当前项目最有代表性的业务能力线
- 它最接近你正在推进和学习的 AI 主线
- 它同时暴露了“位置、边界、承载、收口”多个典型问题

这意味着它不是一个单纯“修代码”的地方。
它是一个非常好的 `Dao Coding` 演练场。

---

## 五、当前观察到的真实问题

基于当前源码，已经能看到几类高价值问题。

### 1. `interview.controller` 的入口边界还不稳定

当前表现：

- 接口直接接收匿名对象 `@Body() body`
- `JwtAuthGuard` 相关代码被注释掉
- controller 手动返回 `{ code, data }`，和全局响应拦截器存在职责重叠

这说明：

- 入口边界还不够清晰
- 响应格式责任没有完全收束
- 认证边界还没有正式立住

### 2. `InterviewAIService` 已存在，但当前是空壳

当前表现：

- `InterviewAIService` 已在模块中注册
- 但类本身几乎没有承担任何职责
- 实际 AI 调用分散在 `ResumeAnalysisService`、`ConversationContinuationService`、`AIModelFactory`

这说明：

- 位置已经占住，但语义还没有真正落下
- 是典型的“位置先有了，职责还没长出来”

### 3. 会话异常还没有正式进入统一异常语义

当前表现：

- `SessionManager` 中 `会话不存在` 直接抛原生 `Error`
- 这会导致业务层异常语义不够稳定

这说明：

- 这一块有明显的边界与承载改进空间
- 适合做第一批 `experience`

### 4. `interview` 线很适合自然产出多类 Dao Commit

它既可能产生：

- `[☶☵][蹇]`：边界修复
- `[☰☶][大畜]`：AI 能力沉淀
- `[☴☴][巽]`：统一响应 / 异常 / 中间层渗透

这对后续样本积累非常有价值。

---

## 六、Task 3 的拆解建议

`Task 3` 不建议一次改太大。
建议拆成三个连续子任务。

### Task 3.1：收紧 `interview` 入口边界

目标：
把 `interview` 模块的入口先收紧，让 controller 不再承担过多职责。

建议动作：

- 为 `analyze-resume`、`continue-conversation` 增加 DTO
- 判断并恢复 `JwtAuthGuard` 的使用策略，至少明确接口是公开还是受保护
- 清理 controller 中手动包装响应的方式，尽量回到统一响应链路
- 为 `session not found` 建立更明确的异常语义

主要对应的 `Dao Coding`：

- 位置即语义
- 承载有度，边界清晰

高频候选 `Dao Commit`：

- `[☶☵][蹇] refactor(interview): 收紧控制器入口边界并统一异常语义`

### Task 3.2：沉淀 `interview + ai` 的调用边界

目标：
让 AI 调用职责不再散落得模糊，决定 `InterviewAIService` 是否真正承担统一入口职责。

建议动作：

- 判断 `InterviewAIService` 是删除、保留还是升级为 facade
- 明确 `AIModelFactory`、`ResumeAnalysisService`、`ConversationContinuationService` 的职责边界
- 把复用性的 AI 调用约定沉淀下来

主要对应的 `Dao Coding`：

- 复利沉淀，不重复造轮子
- 聚则生，散则死

高频候选 `Dao Commit`：

- `[☰☶][大畜] refactor(ai): 沉淀 interview 线的 AI 调用边界`

### Task 3.3：补第一批真实经验文档与样本记录

目标：
不要让本轮重构只停留在代码上。

建议动作：

- 补一篇实现总结博客
- 补至少一条 `experience`
- 如果有代表性改动，再补一个 `example`

主要对应的 `Dao Coding`：

- 复利沉淀，不重复造轮子

高频候选 `Dao Commit`：

- `[☲☷][明夷] docs(experience): 沉淀 interview 首样本中的边界与异常经验`

---

## 七、第一轮最推荐先做哪一刀

如果现在只选一刀，我建议优先做 `Task 3.1`。

原因：

- 它改动边界最清晰
- 代码影响面可控
- 最容易产出第一条高信号真实业务 `Dao Commit`
- 改完以后，`Task 3.2` 的 AI 边界沉淀会更稳

也就是说，推荐顺序是：

```text
先立入口边界
  -> 再收 AI 职责
  -> 最后补经验与样本
```

这个顺序最符合自然生长。

---

## 八、第一轮验收标准

当以下条件满足时，可以认为 `Task 3` 已经真正开始，而不是停留在讨论：

- 已经选定一个明确的首个真实样本入口
- 已经拆成可执行的子任务
- `Task 3.1` 已开始进入实现
- 已有预期的 `Dao Commit` 收口方向
- 已明确这轮要沉淀的 `experience` 候选

---

## 九、下一步

现在最合理的下一步，不是继续补更多规划。
而是直接开始 `Task 3.1`：

- 收紧 `interview` 控制器入口边界
- 明确认证策略
- 统一异常语义

一旦这条线跑通，`Dao Coding -> Dao Commit -> #沉淀` 就会第一次在真实业务里闭环。

---

*Dao guides, Code speaks.*
