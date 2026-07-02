# Nexly — 演示版

Amazon 品类机会分析 + Product Brief 生成工具。**纯前端作品集版**，宠物饮水机品类全流程数据预装，无需后端 / API Key。

## 快速运行

```bash
cd webapp/frontend
npm install
npx vite
```

## 部署到 Vercel

1. 将整个仓库推送到 GitHub
2. 在 Vercel 中导入该仓库
3. 设置：
   - Framework Preset: **Vite**
   - Root Directory: `webapp/frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Deploy — 无需任何环境变量

已包含 `vercel.json`（SPA 路由回退）。

## 演示内容

| 页面 | 内容 |
|------|------|
| 数据上传 | 5 个文件解析摘要、评论分布表格、BSR 分类概览 |
| 机会洞察 | Phase -1 9维度评分 → Phase 1 双线标签 → Phase 2 痛点聚类 → Phase 3 缺口矩阵 |
| Brief 工作台 | 完整 AquaPure S1 产品 Brief（规格/竞品/成本/上市策略） |
| Review Memory | 审核对话记忆 |
