# Nextly 2.0｜AI 协作的产品开发 Workflow Demo

Nextly 是一个用于作品集展示的前端功能原型，演示 AI、人工判断与产品开发状态如何持续衔接。

它关注的重点不是“让多个 Agent 自主完成一切”，而是解决真实产品开发中更常见的问题：资料进入后该影响什么、结论为何需要复核、人工决定如何被记录，以及变更如何同步到下游。

## 核心流程

**机会发现 → 市场研究 → 产品定义 → 落地验证 → 评审与决策**

| 阶段 | 核心问题 | 主要产出 |
|---|---|---|
| 机会发现 | 哪个方向值得研究？ | 3 个候选机会及最大不确定性 |
| 市场研究 | 这个机会成立吗？ | 市场、用户、竞品与趋势证据 |
| 产品定义 | 具体做什么？ | 有依据和验收方式的产品要求 |
| 落地验证 | 做得出来吗？ | 可制造性、BOM、风险与冲突 |
| 评审与决策 | 值得继续吗？ | 人工决定、条件与后续动作 |

## Demo 的核心故事

当前项目为 AquaPure S1 宠物饮水机。

1. 市场研究提出“整机洗碗机安全”的易清洁需求。
2. 落地验证发现泵体与 PCB 无法进入洗碗机。
3. AI 定位冲突，生成新旧差异和影响范围。
4. 用户在 Human Gate 中接受、修改或保留原要求。
5. 接受修订后，产品定义从 v1 升级到 v2。
6. 项目总览、落地结论、评审建议和 Decision Log 同步更新。
7. 用户可以做出“有条件进入打样”的阶段决定。

这个闭环用于展示：AI 负责分析与影响定位，人负责关键判断，Workflow 负责保存状态和推动下游。

## 关键设计

- 共享 Project State：各页面读取同一份版本、冲突和决定状态。
- Human Gate：关键修改必须经过人工确认。
- 版本 Diff：明确展示产品定义 v1 → v2 的变化。
- 问题分级：区分阻塞项、推进条件和普通提醒。
- Decision Log：记录决定、依据、时间和影响范围。
- 局部更新演示：上传 BSR、报价或验证报告后，模拟识别受影响模块。
- 上下文 AI 助手：根据当前页面和项目状态提供下一步，而不是重复固定话术。

## Demo 边界

这是一个纯前端 Portfolio Demo：

- 使用预置演示数据；
- 不调用真实大模型；
- 不上传或传输用户文件；
- 文件入口仅根据文件名模拟资料识别和影响分析；
- 项目状态保存在浏览器 localStorage；
- “重置演示”可恢复初始冲突状态。

## 本地运行 2.0 Demo

~~~bash
npm --prefix webapp/frontend install
npm --prefix webapp/frontend run dev
~~~

## Nextly 3.0 · Local-first 开发中

3.0 从 nextly-workflow-refresh 分支继续演进，当前工作分支为 nextly-3.0-local-first。

目标架构：

- 前端：React + Vite，保留现有工作台交互；
- 本地 API：FastAPI；
- 数据库：SQLite；
- ORM / Migration：SQLAlchemy 2.0 + Alembic；
- 文件：本地文件系统，数据库只保存相对路径和元数据；
- 运行方式：前端通过 Vite /api 代理访问本机 127.0.0.1:8000。

### 后端安装

建议使用 Python 3.11 或更高版本。

~~~bash
python -m venv .venv
# Windows PowerShell
.venv\Scripts\Activate.ps1
# macOS / Linux
source .venv/bin/activate
python -m pip install -e "./backend[dev]"
~~~

### 初始化数据库

~~~bash
npm run db:upgrade
~~~

### 启动服务

终端 A：

~~~bash
npm run dev:backend
~~~

终端 B：

~~~bash
npm --prefix webapp/frontend install
npm run dev
~~~

后端健康检查：http://127.0.0.1:8000/api/health

API 文档：http://127.0.0.1:8000/docs

后端测试：

~~~bash
npm run test:backend
~~~

### 当前 M0 范围

- FastAPI 本地服务骨架；
- SQLite 连接、WAL 和外键约束；
- Alembic 初始迁移；
- Project 创建、读取、更新、归档；
- 文件上传、元数据保存、下载；
- Vite /api 代理；
- 后端 CI 测试和前端构建检查。

CI 已通过后端 4 项 API smoke tests 和前端生产构建。Windows 本机运行、备份恢复及前端 Project CRUD 接入仍待完成。原 2.0 页面暂时继续使用演示状态。

完整实施边界见 docs/nextly-3.0/implementation-baseline.md。

## 技术栈

### 2.0 Demo
- React 18
- TypeScript
- React Router
- Vite
- CSS

### 3.0 Local-first
- FastAPI
- SQLAlchemy 2.0
- Alembic
- SQLite
- Python 3.11+
