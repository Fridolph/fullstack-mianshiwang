# 分支学习总览：按什么顺序回看这套 Dao 实践

**日期**：2026-03-10  
**类型**：学习导览 / 技术博客  
**适用仓库**：`fullstack-mianshiwang`

---

## 这份总览解决什么问题

现在仓库里已经不止一个实验点，而是逐步形成了一条可回看的学习路径。
如果直接看当前代码，很容易只看到“最后结果”，却看不到每一步为什么这么走。

这份总览的目的，就是帮你按分支顺序回看：

- 每个阶段在解决什么问题
- 每个分支最值得看的是什么
- 建议按什么顺序学习
- 每一步应该重点看代码、文档还是提交语义

也就是说，它不是开发文档，而是一张学习地图。

---

## 推荐学习顺序

如果你准备完整温习一次，我建议按下面顺序看。

```text
1. feature/dao-commit-onboarding
2. feature/task-3-1-interview-boundary
3. feature/task-3-2-ai-boundary
4. feature/task-3-3-sample-closeout
5. feature/task-4-plan
6. feature/task-4-1-auth-user-boundary
7. feature/task-4-2-user-consumption-boundary
8. feature/task-4-3-auth-sample-closeout
9. feature/task-5-plan
```

这个顺序基本对应：

```text
先看 Dao 基础设施
  -> 再看第一个真实样本怎么长出来
  -> 再看第二个真实样本怎么验证迁移能力
  -> 最后看第三个真实样本的规划怎么展开
```

---

## 第一组：先看 Dao 基础设施怎么接进项目

### 1. `feature/dao-commit-onboarding`

**这一支在做什么**

这一步不是改业务，而是把 Dao 实践接进当前仓库。
它解决的是“这套东西怎么开始用起来”。

**重点看什么**

- `docs/dao-commit/01-onboarding.md`
- `docs/dao-git/01-workflow.md`
- `docs/blog/2026-03-10-dao-commit-onboarding.md`
- `docs/blog/2026-03-10-dao-git-workflow.md`

**你会学到什么**

- 这个项目是怎么接入 Dao Commit 的
- 为什么每一步都强调独立分支、独立验证、独立沉淀
- 后面所有样本为什么都按这个节奏在走

**建议学习方式**

先只看文档，不急着看业务代码。
先把“这套开发流程怎么运转”看明白，再进入后面的真实样本。

---

## 第二组：第一个真实样本 `interview + ai`

### 2. `feature/task-3-1-interview-boundary`

**这一支在做什么**

这是第一个真实样本的第一刀。
重点不在 AI 抽象，而在先把 `interview` 的入口边界立住。

**重点看什么**

- `apps/ww-server/src/interview/*`
- `docs/experience/2026-03-10-interview-session-boundary.md`
- `docs/blog/2026-03-10-task-3-1-interview-boundary.md`

**你会学到什么**

- 为什么真实重构通常先收入口边界
- 为什么会话也要有归属校验
- 为什么第一刀不该一上来做“大抽象”

### 3. `feature/task-3-2-ai-boundary`

**这一支在做什么**

这一刀继续往内层走，把 `InterviewAIService` 从“占位置但没职责”变成真正的 facade。

**重点看什么**

- `apps/ww-server/src/interview/services/interview-ai.service.ts`
- `apps/ww-server/src/interview/services/resume-analysis.service.ts`
- `apps/ww-server/src/interview/services/conversation-continuation.service.ts`
- `docs/experience/2026-03-10-interview-ai-facade-boundary.md`
- `docs/blog/2026-03-10-task-3-2-interview-ai-boundary.md`

**你会学到什么**

- Factory 和 Facade 为什么不能混为一层
- 为什么空壳服务要么删除，要么做实
- 为什么内层职责收束应该在入口边界之后发生

### 4. `feature/task-3-3-sample-closeout`

**这一支在做什么**

这是第一个真实样本的收口。
它不是再改业务，而是把整个样本变成可回看的经验。

**重点看什么**

- `docs/examples/2026-03-10-interview-first-real-sample.md`
- `docs/blog/2026-03-10-task-3-closeout.md`

**你会学到什么**

- 一个真实 Dao 样本怎样从代码变成可复用的方法
- 为什么收口文档和示例同样重要

---

## 第三组：第二个真实样本 `auth + user`

### 5. `feature/task-4-plan`

**这一支在做什么**

这一步不是实现，而是判断第二个真实样本该落在哪。
最后选择的是 `auth + user`，而不是 `payment`。

**重点看什么**

- `docs/roadmap/02-task-4-auth-user-boundary.md`
- `docs/blog/2026-03-10-task-4-plan.md`

**你会学到什么**

- 为什么第二个样本不能随便挑
- 为什么“已有真实业务但边界开始变重”的模块更适合做样本

### 6. `feature/task-4-1-auth-user-boundary`

**这一支在做什么**

这是第二个样本的第一刀。
重点是把登录与 token 签发从 `UserService` 收回到 `AuthService`。

**重点看什么**

- `apps/ww-server/src/auth/auth.service.ts`
- `apps/ww-server/src/auth/jwt.strategy.ts`
- `apps/ww-server/src/user/user.service.ts`
- `docs/experience/2026-03-10-auth-user-boundary.md`
- `docs/blog/2026-03-10-task-4-1-auth-user-boundary.md`

**你会学到什么**

- 认证结果和用户领域对象为什么不是同一回事
- 为什么这一步要先收核心边界，而不是先大拆 `UserService`

### 7. `feature/task-4-2-user-consumption-boundary`

**这一支在做什么**

这一刀继续往里走，把消费记录查询从 `UserService` 中拿出来，独立成 query service。

**重点看什么**

- `apps/ww-server/src/user/services/user-consumption-query.service.ts`
- `apps/ww-server/src/user/user.controller.ts`
- `apps/ww-server/src/user/user.service.ts`
- `docs/experience/2026-03-10-user-consumption-query-boundary.md`
- `docs/blog/2026-03-10-task-4-2-user-consumption-boundary.md`

**你会学到什么**

- 和用户有关，不等于就该放进 `UserService`
- 为什么查询职责一旦长出分页与聚合，就值得单独收束

### 8. `feature/task-4-3-auth-sample-closeout`

**这一支在做什么**

这是第二个真实样本的收口，把 `auth + user` 变成第二条可回看的完整样本。

**重点看什么**

- `docs/examples/2026-03-10-auth-user-second-real-sample.md`
- `docs/blog/2026-03-10-task-4-closeout.md`

**你会学到什么**

- 为什么第二个样本很关键
- 为什么两条不同样本放在一起，才能真正看见 Dao 方法开始具备迁移能力

---

## 第四组：第三个真实样本规划 `payment + entitlement`

### 9. `feature/task-5-plan`

**这一支在做什么**

这一支先不急着写支付，而是规划第三个真实样本该怎么下手。
重点是把“支付、权益、消费”看成一条流动链路，而不是孤立模块。

**重点看什么**

- `docs/roadmap/03-task-5-payment-entitlement-boundary.md`
- `docs/blog/2026-03-10-task-5-plan.md`

**你会学到什么**

- 为什么第三个样本不该直接写成“做 payment 功能”
- 为什么更准确的范围是 `payment + entitlement`
- 为什么系统开始涉及交易与权益时，要先认语义位置，再写功能细节

---

## 如果你时间不多，最短学习路径怎么走

如果你现在只想快速抓主线，不想一次看完所有细节，我建议走这个压缩版顺序：

```text
1. docs/dao-commit/01-onboarding.md
2. docs/examples/2026-03-10-interview-first-real-sample.md
3. docs/examples/2026-03-10-auth-user-second-real-sample.md
4. docs/roadmap/03-task-5-payment-entitlement-boundary.md
```

这条路径能先让你看到：

- 这套方式怎么开始
- 第一条样本长什么样
- 第二条样本如何证明它能迁移
- 第三条样本准备往哪走

---

## 建议你怎么看代码

如果你准备边看分支边学习，我建议每个分支都用同一个观察顺序：

```text
先看 blog/roadmap
  -> 再看具体代码改动
  -> 再看 experience
  -> 最后看 Dao Commit message
```

原因很简单：

- 先看 blog / roadmap，知道这一步为什么做
- 再看代码，知道具体怎么做
- 再看 experience，知道这一步沉淀了什么
- 最后看 commit，知道这一步是如何被语义收口的

这样看，学习成本会低很多。

---

## 常用查看命令

### 切到某个分支

```bash
git checkout feature/task-4-1-auth-user-boundary
```

### 看某个分支相对主线改了什么

```bash
git diff main...feature/task-4-1-auth-user-boundary
```

### 只看该分支提交

```bash
git log --oneline main..feature/task-4-1-auth-user-boundary
```

### 对照某个文件在不同分支的变化

```bash
git diff feature/task-4-plan..feature/task-4-1-auth-user-boundary -- apps/ww-server/src/user/user.service.ts
```

---

## 一句话总结

这批分支不是一堆零散改动。
它们其实已经组成了一条学习路径：

> 从 Dao 基础设施接入，走到第一个真实样本，再走到第二个真实样本，最后进入第三个真实样本规划。

你完全可以把它当成一套“随代码生长的学习材料”来回看。

这也是为什么我们一直坚持：

- 独立分支
- 独立验证
- 独立沉淀
- 独立收口

因为这样留下来的，不只是代码。
还有学习的路。🏔️
