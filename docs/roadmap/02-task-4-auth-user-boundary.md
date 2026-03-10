# Task 4：`auth + user` 第二个真实样本规划

**文档名称**：Auth User Boundary Plan  
**版本**：v0.1 草案  
**创建日期**：2026-03-10  
**文档位置**：`docs/roadmap/02-task-4-auth-user-boundary.md`  
**文档性质**：`fullstack-mianshiwang` / Task 4 规划文档

---

## 一、为什么现在进入 Task 4

`Task 3` 已经跑通了第一条真实样本闭环。
这意味着我们已经验证过：

- `Dao Coding` 可以进入真实业务判断
- `Dao Commit` 可以作为真实任务收口方式
- `experience / blog / example` 可以同步形成复利

下一步不该停在“首样本完成”的满足感里。
而应该继续验证：

> 这套方式是否也能在另一条业务线里稳定复用。

---

## 二、为什么 Task 4 不建议先选 `payment`

`payment` 当然重要。
但从当前仓库状态看，它还太早。

当前表现：

- `payment.controller` 基本是空壳
- `payment.service` 也还没长出真实职责

这意味着如果现在强行拿它做第二个真实样本，很容易变成：

- 不是在收边界
- 而是在从零搭功能

这会让 Task 4 的重点偏掉。

所以 `payment` 更适合作为后续“规则沉淀型样本”，而不是现在的第二刀。

---

## 三、为什么优先选 `auth + user`

当前更适合做第二个真实样本的，是：

- `apps/ww-server/src/auth/*`
- `apps/ww-server/src/user/*`

原因有三个。

### 1. 这条线已经有真实代码，不是空壳

当前 `auth` 与 `user` 已经承担真实职责：

- 注册
- 登录
- 获取用户信息
- 更新用户资料
- JWT 认证

这让它非常适合做“第二个真实样本”。

### 2. 它天然适合继续验证边界与承载问题

从当前代码看，已经能看到几个典型信号：

- `JwtStrategy.validate` 直接返回用户信息对象，仍有进一步明确认证载荷边界的空间
- `UserService` 同时承担注册、登录、用户资料、消费记录统计，多类职责已经自然聚集
- `user.controller` 已经比较完整，适合继续检查 controller / service / auth 的边界是否干净

### 3. 它能和 Task 3 形成互补

`Task 3` 主要验证了：

- 业务入口边界
- AI 调用边界

`Task 4` 如果落在 `auth + user`，就能继续验证：

- 认证边界
- 用户域职责边界
- token / profile / consumption 这些横向职责是否开始超载

这样两条样本互补性更强。

---

## 四、Task 4 的核心问题

当前 `auth + user` 线最值得观察的，不是“有没有功能”。
而是：

> 功能已经有了，但职责是不是开始堆在同一个 service 上了？

基于当前代码，可以先看到这些问题候选：

### 1. `UserService` 承载开始变重

当前它同时负责：

- 注册
- 登录
- 查询用户信息
- 更新用户信息
- 消费记录查询与统计

这类 service 在项目早期很常见。
但随着功能增长，它会逐渐变成“所有用户相关逻辑都往里塞”的地方。

### 2. `auth` 和 `user` 的边界还可以更清晰

例如：

- token 签发应该更多属于认证语义，还是继续留在 `UserService`
- `JwtStrategy.validate` 返回的数据边界是否应该更明确
- 登录成功后的返回结构，是否已经混合了认证结果与用户领域对象

### 3. consumption 相关逻辑是否已经开始偏离 `user` 主职责

当前消费记录查询与统计放在 `UserService` 里是可以理解的。
但如果后面支付、面试消耗、权益系统继续长，这块很可能会继续膨胀。

也就是说，它已经是一个值得观察的“未来超载点”。

---

## 五、Task 4 建议拆成三步

### Task 4.1：收紧认证与用户职责边界

目标：
先判断 `UserService` 和 `auth` 之间最核心的职责边界。

建议动作：

- 梳理登录 / token 签发 / 用户信息返回的责任归属
- 判断是否需要抽出更明确的 `AuthService`，或者先做更轻量的职责收束
- 让 controller / service / auth 语义更稳定

主要对应的 `Dao Coding`：

- 承载有度，边界清晰
- 位置即语义

高频候选 `Dao Commit`：

- `[☶☵][蹇] refactor(auth): 收紧 token 签发与用户职责边界`

### Task 4.2：识别并处理 `UserService` 的潜在超载点

目标：
不要等它彻底变成大一统 service，再来被动拆。

建议动作：

- 评估 consumption 相关逻辑是否需要单独收束
- 识别 user domain 与 consumption query 的自然边界
- 先做轻量拆分或至少做位置澄清

主要对应的 `Dao Coding`：

- 承载有度，边界清晰
- 聚则生，散则死

高频候选 `Dao Commit`：

- `[☱☷][萃] refactor(user): 收束 consumption 查询职责，避免 user service 超载`

### Task 4.3：补第二个真实样本的经验与对照示例

目标：
让 Task 4 不只是“又做了一轮重构”，而是能和 Task 3 形成对照学习。

建议动作：

- 补 `auth + user` 线的 experience
- 写一篇和 Task 3 对照的阶段总结
- 更新 examples / blog 索引

高频候选 `Dao Commit`：

- `[☲☷][明夷] docs(example): 补 auth + user 第二个真实样本总结`

---

## 六、Task 4 最推荐先做哪一刀

如果现在只选一步，我建议优先做 `Task 4.1`。

原因：

- 它最贴近当前真实代码
- 它最容易继续延续 Task 3 的边界判断语言
- 它做完以后，才能更准确判断 `UserService` 的超载到底要不要拆

也就是说，推荐顺序仍然是：

```text
先立 auth/user 核心边界
  -> 再看 user service 是否超载
  -> 最后补第二个真实样本沉淀
```

---

## 七、Task 4 和 Task 3 的关系

如果说 `Task 3` 解决的是：

- 业务入口边界
- AI 调用边界

那么 `Task 4` 主要解决的是：

- 认证边界
- 用户域职责边界
- service 超载风险

这两条样本组合起来，能让当前仓库的 Dao 实践不再只偏向 AI 侧，而开始覆盖更基础的业务骨架。

---

## 八、下一步

现在最合理的下一步，是在独立分支里正式启动 `Task 4.1`：

- 先审视 `UserService`、`JwtStrategy`、登录返回结构
- 先做职责收束，而不是一上来大拆 service

只要这一步做扎实，第二个真实样本就能自然长出来。

---

*Dao guides, Code speaks.*
