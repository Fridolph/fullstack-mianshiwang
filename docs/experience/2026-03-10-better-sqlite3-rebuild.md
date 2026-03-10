# `better-sqlite3` 阻塞处理记录

**日期**：2026-03-10  
**类型**：Environment Experience  
**适用范围**：本地开发环境 / `apps/web` / `Nuxt Content`

---

## 背景

在推进 `ww-server` 的真实样本时，仓库依赖安装曾被 `better-sqlite3` 卡住。
这个阻塞本身并不来自 `ww-server` 业务代码，而是来自工作区里前端相关依赖链。

---

## 这次确认到的事实

- `better-sqlite3` 主要由 `apps/web` / `Nuxt Content` 这条依赖链带入。
- 当前机器在 `Node 22` 下首次安装时，原生模块编译容易失败。
- 失败时不一定要立刻切换整个开发环境。

---

## 当前建议

先按下面顺序处理：

```bash
pnpm rebuild better-sqlite3
```

如果 `rebuild` 能恢复，就不要急着切全局 Node 版本。

---

## 补充说明

这次实际验证里：

- `pnpm rebuild better-sqlite3` 已经恢复可用状态
- 当前阶段先记录为“优先重建依赖”经验
- 暂不把“切到 Node 20”作为强制动作，以免影响其它环境

后续如果同类问题反复出现，再把 `Node 20` 升级为项目推荐版本。

---

*先让当前环境恢复，再决定是否调整长期环境。*
