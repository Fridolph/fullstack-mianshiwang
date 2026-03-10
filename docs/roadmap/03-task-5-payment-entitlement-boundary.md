# Task 5：`payment + entitlement` 第三个真实样本规划

**文档名称**：Payment Entitlement Boundary Plan  
**版本**：v0.1 草案  
**创建日期**：2026-03-10  
**文档位置**：`docs/roadmap/03-task-5-payment-entitlement-boundary.md`  
**文档性质**：`fullstack-mianshiwang` / Task 5 规划文档

---

## 一、为什么现在进入 Task 5

`Task 3` 和 `Task 4` 已经分别跑通了两条真实样本：

- `interview + ai`
- `auth + user`

这说明 `Dao` 工程方式已经不再只在一条主线上成立。
下一步最自然的动作，不是重复再收一条相似边界，而是进入一条更接近业务兑现的线路。

当前仓库里，最值得继续观察的，就是：

> 用户配额、消费记录、支付入口、微信通道，这几块到底应该怎样连接起来。

这已经不只是单个模块边界问题，而是一次更接近“交易与权益流动”的系统问题。

---

## 二、为什么 Task 5 不能直接写成“做 payment”

如果只看目录，很多人会自然想把第三个真实样本落在 `payment`。
这个方向并没有错，但如果直接理解成“开始实现支付功能”，现在仍然太早。

当前仓库状态很明确：

- `payment.controller` 还是空壳
- `payment.service` 还是空壳
- `wechat` 线也还是空壳
- 真实的消费记录 schema 还挂在 `interview` 线里
- 用户配额字段已经长在 `user` schema 上

这说明当前最真实的问题，不是“支付接口还没写”。
而是：

> 交易、消费、权益和支付通道的归属关系还没有站稳。

如果这一步不先规划清楚，直接去写 payment，大概率会把第三个样本做成一次“从零搭业务功能”。
这会偏离我们现在最重要的目标。

---

## 三、为什么第三个样本更适合叫 `payment + entitlement`

当前代码里已经有三类真实信号：

### 1. 用户侧已经有权益与余额字段

在 `user.schema.ts` 里，已经能看到：

- `aiInterviewRemainingCount`
- `resumeRemainingCount`
- `specialRemainingCount`
- `behaviorRemainingCount`
- `wwCoinBalance`

这说明“权益”已经存在，只是还没有完整的来源和流转语义。

### 2. 消费记录已经存在，但归属还不稳定

`ConsumptionRecord` 现在定义在 `interview` 线里。
但从字段看，它记录的已经不是单次面试内部状态，而是更广义的用户消费流水。

它天然在提醒我们：

- 这可能不该长期留在 `interview`
- 它更像一条跨模块的消费 / 权益轨迹

### 3. 支付与微信通道已经占位，但职责还没长出来

`payment` 和 `wechat` 两个模块都已经有位置。
但当前位置更像“未来入口”，还不是“真实职责”。

这正适合拿来做第三个样本的规划：

- 不直接冲实现
- 先把位置和边界长出来

所以我更建议把第三个样本定义为：

> `payment + entitlement` 样本

而不是狭义的“支付模块实现”。

---

## 四、Task 5 的核心问题

当前最值得回答的，不是“支付怎么调微信”。
而是以下四个问题。

### 1. 谁负责记录“用户购买了什么”

这是交易语义。
它不等于扣减配额，也不等于 AI 消费记录。

### 2. 谁负责把购买结果转成用户权益

这是 entitlement 语义。
它不等于支付通道，也不等于用户资料本身。

### 3. 谁负责记录“权益被消耗了”

这是 consumption 语义。
它和“购买成功”相关，但不是同一件事。

### 4. `payment`、`wechat`、`user`、`interview` 之间，谁依赖谁

如果这层关系不先理顺，后面很容易出现：

- 支付成功直接改用户字段
- 面试流程顺手记消费记录
- 微信回调直接落业务逻辑
- `UserService` 又重新变成一切权益变化的落点

也就是说，`Task 5` 的重点，是把“交易 -> 权益 -> 消费”这条链路的语义位置先认出来。

---

## 五、Task 5 建议拆成四步

### Task 5.1：先立 `payment` 入口与交易意图边界

目标：
先让 `payment` 不再是空壳，但也不急着把外部支付通道接满。

建议动作：

- 明确 `payment` controller / service 的最小职责
- 定义支付意图、下单请求、支付结果回执的 DTO / 接口
- 明确哪些是支付入口语义，哪些还只是占位

主要对应的 `Dao Coding`：

- 位置即语义
- 承载有度，边界清晰

高频候选 `Dao Commit`：

- `[☳☷][复] refactor(payment): 立住支付入口与交易意图边界`

### Task 5.2：收束 entitlement 归属，避免权益变化散落

目标：
把“购买后增加权益”从用户字段直改，提升为更明确的业务语义。

建议动作：

- 梳理哪些字段属于用户静态资料，哪些属于权益余额
- 判断是否需要单独的 entitlement / balance / ledger 收口点
- 先做轻量职责澄清，不急着一次性大建模

主要对应的 `Dao Coding`：

- 承载有度，边界清晰
- 聚则生，散则死

高频候选 `Dao Commit`：

- `[☱☷][萃] refactor(user): 收束权益变更职责，避免余额与资料语义混层`

### Task 5.3：澄清 consumption record 的归属与流向

目标：
让“权益被使用了”这件事，从 `interview` 局部状态，长成更明确的全局消费语义。

建议动作：

- 评估 `ConsumptionRecord` 是否继续留在 `interview` 线
- 判断它更适合落在 `payment`、`user`，还是独立的 ledger / consumption 位置
- 明确购买记录、权益记录、消费记录三者的关系

主要对应的 `Dao Coding`：

- 位置即语义
- 聚则生，散则死

高频候选 `Dao Commit`：

- `[☶☱][损] refactor(consumption): 让消费记录回到更稳定的语义位置`

### Task 5.4：补第三个真实样本的经验与对照总结

目标：
让 `Task 5` 不只是“支付相关规划”，而是形成第三条可回看的真实样本路径。

建议动作：

- 补 `payment + entitlement` 线的 experience
- 写阶段总结博客
- 更新 `examples / blog / roadmap` 索引
- 与 `Task 3`、`Task 4` 做样本对照

高频候选 `Dao Commit`：

- `[☲☷][明夷] docs(example): 收口 payment + entitlement 第三个真实样本`

---

## 六、Task 5 最推荐先做哪一刀

如果现在只选一步，我建议优先做 `Task 5.1`。

原因：

- `payment` 现在还是空壳，先立入口语义最值钱
- 只有入口立住，后面 entitlement 和 consumption 的归属才好判断
- 这一步最像 `Task 3.1` 与 `Task 4.1` 的开局刀法：先立最核心边界，再往里走

推荐顺序仍然是：

```text
先立 payment 入口与交易意图
  -> 再看 entitlement 应该如何收束
  -> 再澄清 consumption record 的归属
  -> 最后补第三个真实样本沉淀
```

---

## 七、Task 5 和前两个样本的关系

如果说：

- `Task 3` 主要验证入口边界与 AI 调用边界
- `Task 4` 主要验证认证边界与查询职责边界

那么 `Task 5` 更适合验证的是：

- 交易入口边界
- 权益归属边界
- 消费流水语义边界

这条样本一旦跑通，`Dao` 实践就会从“接口与服务边界”进一步走到“业务流动语义”层面。

这会让整个仓库的样本谱系更完整。

---

## 八、下一步

现在最合理的下一步，是在独立分支里正式启动 `Task 5.1`：

- 先审视 `payment` 和 `wechat` 的最小入口职责
- 先补支付意图与结果语义，而不是立刻接外部支付细节
- 让第三个真实样本先有可站立的起点

只要这一步做扎实，后面的 entitlement 与 consumption 语义就会更容易自然长出来。

---

*Dao guides, Code speaks.*
