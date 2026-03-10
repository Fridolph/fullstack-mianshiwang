# `auth + user` 第二个真实样本闭环示例

**日期**：2026-03-10  
**类型**：Example  
**适用范围**：`apps/ww-server/src/auth/*`、`apps/ww-server/src/user/*`

---

## 这个示例记录什么

这是 `fullstack-mianshiwang` 在 `Task 3` 跑通首个真实样本之后，第二次在真实业务线上完成的 `Dao` 闭环样本。

它不是单个 commit 的摘录，而是一条连续的真实路径：

1. 先收认证边界
2. 再收查询职责边界
3. 同步补 experience 与 blog
4. 最后用 `Dao Commit` 收口

也就是说，这条样本再次覆盖了：

- `Dao Coding`
- 代码实现
- 自测验证
- `#沉淀`
- 技术博客
- `Dao Commit`

---

## 样本背景

目标模块：

- `auth`
- `user`

目标问题：

- token 签发语义混在 `UserService` 中
- `auth` 与 `user` 的边界还不够清楚
- `UserService` 开始同时承担用户资料和消费记录查询职责
- 分页、排序、聚合统计开始侵入主服务

为什么选这条线：

- 它已经有真实业务，不是空壳
- 它和 `Task 3` 的 `interview + ai` 风格不同，适合做第二类验证
- 它天然能暴露“边界”和“超载”这两种典型信号

---

## 第一步：收紧认证边界

### 主要动作

- 新增 `AuthService` 统一编排登录流程
- 把 JWT 签发从 `UserService` 中收回认证层
- `UserController.login()` 改为直接委托 `AuthService`
- 新增 `JwtPayload` 与 `AuthenticatedUser` 类型，明确认证载荷边界

### 对应 Dao Coding

- 承载有度，边界清晰
- 位置即语义

### 收口提交

```text
[☶☵][蹇] refactor(auth): 收紧 token 签发与用户职责边界
```

### 对应沉淀

- `docs/experience/2026-03-10-auth-user-boundary.md`
- `docs/blog/2026-03-10-task-4-1-auth-user-boundary.md`

---

## 第二步：收束查询职责边界

### 主要动作

- 把消费记录查询和统计从 `UserService` 中拿出来
- 新增 `UserConsumptionQueryService`
- `UserController` 直接委托 query service 获取消费记录
- 保留 `/user/consumption-records` 路由，不改变外部接口语义

### 对应 Dao Coding

- 承载有度，边界清晰
- 聚则生，散则死

### 收口提交

```text
[☱☷][萃] refactor(user): 收束 consumption 查询职责，避免 user service 超载
```

### 对应沉淀

- `docs/experience/2026-03-10-user-consumption-query-boundary.md`
- `docs/blog/2026-03-10-task-4-2-user-consumption-boundary.md`

---

## 这条闭环里真正留下了什么

### 代码层

- `AuthService` 回到认证职责
- `UserService` 更接近纯用户领域服务
- `UserConsumptionQueryService` 成为查询扩展点

### 经验层

- 认证结果和用户领域对象，不是一回事
- 和用户有关，不等于就该放进 `UserService`
- 查询职责一旦开始长出分页与聚合，就值得单独收束

### 流程层

- 第二个真实样本同样适合按“两刀走”收口
- 每一步都需要独立验证、独立沉淀、独立提交
- 样本越多，`Dao` 判断语言越容易稳定下来

---

## 为什么这个示例值得复用

以后只要你在别的模块里看到类似信号，都可以参考这条路径：

1. 先看核心职责是否混层
2. 再看查询或聚合逻辑是否开始压垮主 service
3. 先做最值钱的一刀，不急着一次拆完整个模块
4. 每一步都补沉淀和博客，再用高信号 `Dao Commit` 收口

这比一开始就做“模块化大手术”更稳，也更适合真实项目演进。

---

## 可复用的最小模式

```text
发现职责开始混层
  -> 先收核心边界
  -> 再收查询或扩展职责
  -> 补 experience
  -> 补 blog
  -> 用高信号 Dao Commit 收口
```

这就是 `auth + user` 第二样本最值得复用的部分。

---

*这是 `fullstack-mianshiwang` 的第二条真实 Dao 工程闭环样本。*
