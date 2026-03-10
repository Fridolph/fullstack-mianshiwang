# Dao Git Workflow v0.1

**文档名称**：Dao Git Workflow  
**版本**：v0.1 草案  
**创建日期**：2026-03-10  
**文档位置**：`docs/dao-git/01-workflow.md`  
**文档性质**：`fullstack-mianshiwang` 项目内 Git 工作流说明

---

## 写在前面

> `Dao Coding` 解决的是：这次变化应该怎样发生。  
> `Dao Commit` 解决的是：这次变化本质上是什么。  
> `Dao Git Workflow` 解决的是：这次变化应该沿着什么路径进入主干。  
>
> 三者接起来，项目的变化才真正可判断、可记录、可收口。

这份文档不是抽象规范的复读。
它是 `fullstack-mianshiwang` 在真实接入阶段的项目内版本。

---

## 一、这份文档解决什么问题

当前仓库已经完成了最小 `Dao Commit` 接入。
接下来需要解决的问题不再是“提交怎么写”，而是：

- 分支应该从哪里拉
- 什么提交留在分支里
- 什么变化进入主干时必须做总结
- `release` 和 `hotfix` 应该怎么走

这就是 `Dao Git Workflow` 要解决的事。

---

## 二、当前状态与目标状态

### 当前状态

当前仓库实际上还只有一个长期分支：

- `main`

这意味着：

- 最小 `Dao Commit` 能力已经接入
- 但完整的 `main / test / dev` 节奏还没有正式建立

### 目标状态

为了让后续真实开发更稳定，建议逐步建立三个长期分支：

- `main`：生产稳定分支
- `test`：测试 / 预发布分支
- `dev`：日常集成分支

这份文档描述的是目标状态下的推荐工作流。
在分支尚未补齐前，可以先按同样的原则运行：

- 分支内允许过程
- 进入主干必须收口
- 优先 `squash + Dao Commit`

---

## 三、核心原则

### 1. 分支内允许过程，进入主干必须总结

在 `feature/*`、`release/*`、`hotfix/*` 内部，可以保留必要的过程提交。
这些提交记录试错、重构和验证路径，对开发者有价值。

但当变化准备进入 `dev`、`test`、`main` 这类长期分支时，就应该尽量收束成一条高信号提交。
这条提交，优先使用 `Squash and merge + Dao Commit`。

### 2. 主干历史记录结论，不记录噪音

长期分支不是为了保存所有中间尝试。
它们更应该记录：

- 一个任务最终让系统发生了什么变化
- 一个模块最终完成了什么收口
- 一个版本最终发布了什么结果

### 3. 发布路径清晰，热修路径更清晰

功能开发、版本发布和线上热修的节奏不同。
因此它们应沿不同分支流动，并在合适的节点回到长期分支。

### 4. Dao Commit 用在收口时刻最有价值

分支内部当然也可以写 `Dao Commit`。
但最有价值的 `Dao Commit` 通常出现在：

- `feature/*` 合入 `dev` 时
- `release/*` 合入 `main` 时
- `hotfix/*` 合入 `main` 时

因为这些时刻，变化的边界最清晰，卦象也最容易判断准确。

---

## 四、推荐分支模型

### 长期分支

#### `main`

`main` 是生产稳定分支。
职责：

- 保存线上可用状态
- 承接 `release/*` 和 `hotfix/*`
- 每次正式发布后打 tag
- 作为热修复的基线来源

#### `test`

`test` 是测试 / 预发布分支。
职责：

- 承接 `release/*`
- 做联调、回归和预发布验证
- 在进入 `main` 之前完成最后确认

#### `dev`

`dev` 是日常集成分支。
职责：

- 承接 `feature/*`
- 聚合多个任务完成后的高信号收口提交
- 作为 `release/*` 的创建来源

### 短期分支

#### `feature/*`

用于日常功能开发。
建议：

- 从 `dev` 创建
- 完成后合回 `dev`
- 默认优先使用 `Squash and merge`

命名示例：

- `feature/auth-hardening`
- `feature/interview-ai-refactor`
- `feature/payment-retry`

#### `release/*`

用于发布准备。
建议：

- 从 `dev` 创建
- 只允许做发布收口、测试修复和小范围调整
- 先进入 `test`，验证通过后再进入 `main`

命名示例：

- `release/0.1.0`
- `release/0.2.0`

#### `hotfix/*`

用于线上热修。
建议：

- 从 `main` 创建
- 修复后先回到 `main`
- 再回流到 `dev`
- 如存在正在进行的 `release/*`，也同步回流

命名示例：

- `hotfix/login-token-expire`
- `hotfix/ai-timeout`

---

## 五、标准开发路径

### 1. 功能开发

标准路径：

```text
dev
  └── feature/xxx
         └── 分支内允许多次过程提交
                └── squash merge -> dev
```

推荐步骤：

1. 从 `dev` 拉出 `feature/xxx`
2. 在分支内正常开发
3. 过程中允许保留关键过程提交
4. 一个 issue / task 完成后，发起到 `dev` 的 PR
5. 使用 `Squash and merge`
6. 用一条高信号 `Dao Commit` 作为最终收口提交

### 2. 发布准备

标准路径：

```text
dev
  └── release/x.y.z
         └── test
                └── main
                       └── tag
```

推荐步骤：

1. 当 `dev` 累积到可发布状态时，从 `dev` 创建 `release/x.y.z`
2. 在 `release/*` 上只做发布相关收口
3. 合入 `test` 验证
4. 验证通过后合入 `main`
5. 在 `main` 打 tag
6. 将 `release/*` 的最终状态回流到 `dev`

### 3. 热修复

标准路径：

```text
main
  └── hotfix/xxx
         └── main
                └── tag
                └── dev
                └── release/*（如存在）
```

推荐步骤：

1. 从 `main` 创建 `hotfix/xxx`
2. 完成修复与验证
3. 合入 `main`
4. 打补丁 tag，例如 `v0.1.1`
5. 将修复内容回流到 `dev`
6. 如果当前有 `release/*`，同步回流，避免版本分叉

---

## 六、Squash 与 Dao Commit 的关系

这是当前工作流里最关键的一点。

### 分支内提交

分支内部允许保留多次提交，用来记录：

- 尝试路径
- 中间修复
- 小步验证
- 局部重构

这些提交不一定都是最终结论。
它们更像开发轨迹。

### 主干收口提交

当一个任务准备进入 `dev`、`test` 或 `main` 时，应尽量使用 `Squash and merge`，把这一段开发轨迹压缩成一条高信号提交。

这条提交最适合使用 `Dao Commit`，因为：

- 任务边界已经清晰
- 变化本质已经定型
- 语义最容易判断准确

---

## 七、和当前仓库现状如何对齐

当前仓库还没有正式建立 `dev` 与 `test`。
所以接下来的推进建议分两步走。

### Step 1：先按原则运行

在 `dev / test` 尚未建立前，先保持：

- 独立功能使用 `feature/*`
- 分支内允许过程提交
- 合回主干时优先 `Squash + Dao Commit`

### Step 2：再补长期分支治理

当接下来真实开发节奏稳定下来后，再正式建立：

- `dev`
- `test`
- 对应的合并策略与保护约定

这样做的好处是：

- 先让流程跑起来
- 不把第一轮接入做成纯治理动作
- 让分支模型随着真实协作节奏长出来

---

## 八、当前最推荐的项目内使用方式

针对 `fullstack-mianshiwang` 当前阶段，我建议：

1. 先用 `feature/*` 承接接入与真实任务。
2. 一个任务完成后，用 `Squash + Dao Commit` 收口。
3. 等 `ww-server` 第一批真实样本稳定后，再建立 `dev / test`。
4. 发布前再把 `release/*` 路径和 tag 节奏正式固化。

这是当前阶段最稳的走法。

---

## 九、与现有发布文档的关系

现有 `docs/release-desc.md` 更偏通用发布说明。
这份文档补的是更贴近当前项目接入阶段的 Git 运行规则。

两者关系可以理解为：

- `docs/release-desc.md`：更偏发布与 issue / milestone 的通用说明
- `docs/dao-git/01-workflow.md`：更偏开发分支、收口方式、热修回流的项目内工作流说明

后续如果流程稳定，可以再把两份内容进一步收束整理。

---

## 十、下一步

`Task 2` 完成后，下一步不应继续停留在流程文档。
最重要的是进入第一个真实样本任务。

当前优先建议：

- `apps/ww-server` 的 `auth`
- `apps/ww-server` 的 `ai`
- `apps/ww-server` 的 `interview`

只有当 `Dao Coding -> Dao Commit -> #沉淀` 在真实业务中跑起来，这套 workflow 才真正落地。

---

*Dao guides, Code speaks.*
