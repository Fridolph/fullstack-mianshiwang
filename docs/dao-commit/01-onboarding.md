# Dao Commit 接入说明

**文档名称**：Dao Commit Onboarding  
**版本**：v0.1 草案  
**创建日期**：2026-03-10  
**文档位置**：`docs/dao-commit/01-onboarding.md`  
**文档性质**：`fullstack-mianshiwang` 项目内最小接入说明

---

## 一、这份文档解决什么问题

这份文档只解决一件事：

> 让 `fullstack-mianshiwang` 先具备最小可用的 `Dao Commit` 能力。

这一轮不追求把所有治理能力一次铺满。
先做到：

- 能生成合格的 `Dao Commit`
- 能在本地被校验
- 能让团队成员快速启用
- 能为后续 `Dao Git Workflow` 和知识沉淀留出入口

---

## 二、本轮接入了什么

本轮最小接入包括：

- 提交模板：`.gitmessage/dao-commit-template.txt`
- 校验脚本：`scripts/validate-dao-commit.mjs`
- helper：`scripts/dao-commit.mjs`
- 本地 hook：`.githooks/commit-msg`
- 本地安装脚本：`scripts/setup-dao-git.mjs`

---

## 三、如何启用

在仓库根目录执行：

```bash
pnpm dao:setup
```

执行完成后，会自动写入两项本地 Git 配置：

- `commit.template`
- `core.hooksPath`

如果你想手动检查，可以执行：

```bash
git config --get commit.template
git config --get core.hooksPath
```

---

## 四、如何生成提交草稿

### 1. 查看可用预设

```bash
pnpm dao:commit --list
```

### 2. 进入交互模式

```bash
pnpm dao:commit
```

### 3. 非交互生成

```bash
pnpm dao:commit --preset knowledge-record --scope dao-commit --subject "补充接入说明"
```

如果需要把结果写入文件，可以增加 `--write`。

---

## 五、当前采用的 header 规范

当前项目内先使用与主规范仓库一致的复卦格式：

```text
[上卦下卦][卦名] type(scope): subject
```

示例：

```text
[☶☶][艮] docs(dao-commit): 接入最小基础设施与本地使用说明
[☰☶][大畜] refactor(ai): 沉淀 AI 模型工厂配置
[☶☵][蹇] fix(auth): 修复认证链路中的边界错位
```

---

## 六、当前建议的使用方式

首轮接入阶段，建议只做这些事：

1. 分支内允许保留必要的过程提交。
2. 一个任务完成时，优先使用 `squash + 高信号 Dao Commit` 收口。
3. 遇到真实可复用的坑，再补 `#沉淀`。
4. 不要为了选卦而卡住开发节奏，先用高频预设跑起来。

---

## 七、下一步会接什么

最小接入完成后，下一步重点不是继续堆工具，而是进入真实样本：

- 在 `apps/ww-server` 上跑第一个真实任务
- 补项目内 `Dao Git Workflow` 文档（已完成第一版）
- 开始积累 `example / experience`

---

*Dao guides, Code speaks.*
