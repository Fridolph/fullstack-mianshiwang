# Interview AI Facade 边界沉淀

**日期**：2026-03-10  
**类型**：Experience  
**适用范围**：`apps/ww-server/src/interview/services/*`、`apps/ww-server/src/ai/services/ai-model.factory.ts`

---

## 背景

在 `Task 3.1` 先把 `interview` 入口边界立住之后，下一步暴露出来的问题不再是 controller，而是 AI 调用职责散得有点模糊。

当前代码里同时存在：

- `AIModelFactory`
- `InterviewAIService`
- `ResumeAnalysisService`
- `ConversationContinuationService`

如果这四层都同时承担“模型选择、Prompt 组装、链路调用、业务变量拼装”，很快就会进入职责交叉。

---

## 问题表现

本轮改造前，几个信号很明显：

- `InterviewAIService` 存在，但几乎是空壳
- `ResumeAnalysisService` 和 `ConversationContinuationService` 都直接拼 Prompt + Model + Chain
- `AIModelFactory` 负责模型实例化，但业务服务直接拿它做调用

这会带来两个后果：

- 位置已经有了，但职责没有真正落位
- 新增第三种 AI 任务时，大概率会继续复制同样的调用模式

---

## 本轮处理方式

### 1. `AIModelFactory` 只留在基础设施层

它只负责一件事：

- 按配置创建不同模式的模型实例

它不应该知道 interview 业务，也不应该直接承担具体 Prompt 调用语义。

### 2. `InterviewAIService` 升级为 interview 线 AI facade

这一层现在负责：

- 根据场景选择模型（default / stable / creative）
- 组装 Prompt -> Model -> Parser 的调用链
- 统一文本 / 结构化输出的调用约定
- 统一日志入口

### 3. 业务服务只保留 prompt 与业务变量

本轮之后：

- `ResumeAnalysisService` 只负责简历分析 prompt 和变量
- `ConversationContinuationService` 只负责继续对话 prompt 和变量

这样它们的职责就更清楚：

- 不负责选模型
- 不负责重复搭链
- 不负责重复收口 AI 返回格式

---

## 经验结论

### 经验一：空壳服务不要长期悬着

如果一个服务已经占了位置，但长期没有真实职责，它会逐渐变成认知噪音。

处理方式通常只有三种：

- 删除
- 保持为空但明确预留意图
- 尽快让它承担真实职责

本轮选择的是第三种。

### 经验二：Factory 和 Facade 不要混在一起

- Factory 负责“怎么造出来”
- Facade 负责“在这条业务线上怎么用”

如果混在一起，基础设施层会被业务拖脏，业务层也会反复写调用细节。

### 经验三：任务服务只保留最贴近业务的问题

`ResumeAnalysisService` 和 `ConversationContinuationService` 最应该关心的是：

- 这次要用什么 prompt
- 这次要传什么变量
- 返回值在业务上怎么理解

而不是每个服务都重复写一次 LangChain 调用链。

---

## 复用建议

以后只要出现多种 AI 任务并行的地方，都可以优先检查：

1. 模型创建是不是还停留在 factory 层
2. 业务线是不是有一个明确的 facade 层
3. 任务服务是不是只保留 prompt 与业务变量
4. 是否已经开始复制同样的 Prompt -> Model -> Chain 代码

如果第 4 条开始出现，就说明该做 facade 了。

---

*Dao guides, Code speaks.*
