# Markdown Preview Workspace

一个基于 Next.js App Router 的简易 Markdown 文档工作台：

- 左侧文档列表
- 中间编辑器
- 右侧实时预览
- 自动保存到本地 SQLite（可持久化）

## 你需要手动安装的包

按你的要求，依赖由你自行安装。建议安装：

```bash
pnpm add better-sqlite3 react-markdown remark-gfm
```

可选代码高亮（当前实现未强制依赖）：

```bash
pnpm add rehype-highlight highlight.js
```

## 运行

```bash
pnpm dev
```

默认地址：`http://localhost:3000`

## 最简数据库设计

数据库文件：`data/markdown.db`

表结构（单表设计）：

```sql
CREATE TABLE IF NOT EXISTS docs (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

说明：

- `id` 使用 UUID
- `title` 文档标题
- `content` Markdown 原文
- `created_at` / `updated_at` 使用 ISO 时间字符串

## API

- `GET /api/docs` 获取文档列表
- `POST /api/docs` 新建文档
- `GET /api/docs/:id` 获取单篇文档
- `PATCH /api/docs/:id` 更新标题或内容

## 关键文件

- `lib/db.ts` SQLite 初始化与 CRUD
- `app/api/docs/route.ts` 列表与新建 API
- `app/api/docs/[id]/route.ts` 单文档读取与更新 API
- `app/page.tsx` 首页（Landing）
- `app/workspace/page.tsx` 前端编辑器 + 实时预览 + 自动保存
- `app/globals.css` 页面风格与响应式布局
