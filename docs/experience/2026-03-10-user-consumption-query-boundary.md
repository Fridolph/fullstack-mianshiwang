# User Consumption Query 边界沉淀

**日期**：2026-03-10  
**类型**：Experience  
**适用范围**：`apps/ww-server/src/user/*`、`apps/ww-server/src/interview/schemas/consumption-record.schema.ts`

---

## 背景

`Task 4.1` 做完以后，`auth` 和 `user` 的第一条硬边界已经立住。
这时候再看 `UserService`，剩下最明显的超载点就更清楚了：

- 用户注册与资料更新是用户领域职责
- 消费记录查询与统计更像一条查询线

它们都和“用户”有关，但并不是同一类工作。

---

## 本轮看到的信号

在这轮处理前，`UserService` 里还同时存在两类逻辑：

- 面向用户领域对象的写操作与规则校验
- 面向消费记录的列表查询与统计聚合

这会带来几个问题：

- `UserService` 的阅读入口变宽，既要看用户本身，又要看消费数据
- `consumption` 的分页、排序、聚合细节开始侵入用户主服务
- 后面如果再补筛选条件、统计维度或导出逻辑，很容易继续把查询职责堆进 `UserService`

也就是说，这块已经不是“还可以先放着”的轻微信号，而是下一轮自然该收的位置。

---

## 本轮怎么处理

### 1. 从 `UserService` 中移出消费记录查询

本轮把 `getUserConsumptionRecords()` 从 `UserService` 中拿出来，单独放进：

- `UserConsumptionQueryService`

这样做以后，`UserService` 就重新回到更纯的用户领域职责：

- 注册
- 凭证校验
- 用户对象脱敏
- 查询用户资料
- 更新用户资料

### 2. 保留接口位置，不改变对外路由语义

这轮没有把接口从 `/user/consumption-records` 挪走。
因为当前用户视角下，这个入口仍然合理。

调整的是**内部职责分工**，不是对外 API 位置。

也就是说：

- 对外仍然是用户中心查看自己的消费记录
- 对内已经不再由 `UserService` 承担查询聚合细节

### 3. 让 controller 直接委托专门查询服务

`UserController` 现在直接委托 `UserConsumptionQueryService`。
这样控制器层也更诚实：

- 用户资料相关动作走 `UserService`
- 消费记录查询走专门的 query service

这种委托关系一旦明确，后面继续长筛选、聚合、分页参数时，落点就不会再摇摆。

---

## 经验结论

### 经验一：和用户有关，不等于就该进 `UserService`

这是这轮最重要的提醒。

“用户的消费记录”听起来像用户功能，但它本质上已经是查询视角，不再只是用户领域对象本身。

判断标准不是“是不是和用户有关”，而是：

> 这段逻辑主要在表达用户规则，还是在表达查询视图？

如果主要表达的是查询、分页、排序和统计，就应该给它单独的位置。

### 经验二：先收查询职责，比先造大模块更合适

这轮没有直接引入新的复杂分层，也没有强拆出完整子模块。
而是先做最小可解释拆分：

- 保留原有 controller 路由
- 单独抽一个 query service
- 先把查询职责从主 service 中拿开

这比一次性引入很多新层更适合当前项目阶段。

### 经验三：查询服务天然适合作为未来扩展点

`UserConsumptionQueryService` 站住以后，后面再做这些事会自然很多：

- 增加筛选条件
- 增加更多统计维度
- 补导出能力
- 改成更明确的 read model

如果这些能力继续长在 `UserService` 里，每加一项都会让用户主服务变得更难维护。

---

## 给下一轮的提醒

这轮收完以后，后面还可以继续观察两件事：

- `consumption-record` schema 目前仍然从 `interview` 线引用，后续是否需要进一步澄清其归属
- `user` 线里是否还需要补一个更明确的 application / query 目录结构

这两件事现在都还不急。
先把“查询职责不再压在 `UserService` 身上”这一步走稳，更重要。

---

## 本轮验证

本轮已完成：

- `user-consumption-query.service.spec.ts`
- `user.controller.spec.ts`
- `user.service.spec.ts`
- `auth.service.spec.ts`
- `@mianshiwang/ww-server` 构建验证

这说明当前拆分不仅语义更清楚，也已经通过了最小验证闭环。

---

*Dao guides, Code speaks.*
