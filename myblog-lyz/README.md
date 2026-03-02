# My Blog (Cloudflare Pages 迁移版)

这个项目已从 Netlify Functions + Blobs 迁移为 Cloudflare Pages Functions + KV。

## 目录说明

- `index.html`：前端页面（继续使用 `/api/*`）。
- `functions/api/*.js`：Cloudflare Pages Functions API。
- `functions/_lib/store.js`：KV 读写和响应工具。
- `wrangler.toml`：Cloudflare 本地开发与部署配置。

## 一次性准备

1. 安装依赖：

```bash
npm install
```

2. 登录 Cloudflare：

```bash
npx wrangler login
```

3. 创建 KV：

```bash
npx wrangler kv namespace create BLOG_DATA
npx wrangler kv namespace create BLOG_DATA --preview
```

4. 将创建后的 `id` / `preview_id` 填入 `wrangler.toml`。

## 本地运行

```bash
npm run dev
```

## 部署

```bash
npm run deploy
```

## 数据结构

KV 使用以下 key：

- `posts`: 文章数组
- `profile`: 个人资料对象
- `calendar`: 日历对象
- `todos`: 待办对象（按日期分组）
- `photos`: 照片数组
- `books`: 书单数组

## 说明

前端 API 路径保持不变（`/api/posts`、`/api/profile` 等），因此页面逻辑无需改动。
