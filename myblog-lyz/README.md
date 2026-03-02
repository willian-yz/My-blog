# My Blog（Cloudflare Workers 迁移版）

这个项目已经改为 Cloudflare Workers + KV。

> 你的线上地址是 `*.workers.dev`，因此这里使用 Worker 路由（`worker.js`）来处理 `/api/*`，并通过 `ASSETS` 提供静态页面。

## 目录说明

- `index.html`：前端页面（继续请求 `/api/*`）。
- `worker.js`：Worker 入口，路由 `/api/*` 到后端处理器，其他请求回退到静态资源。
- `functions/api/*.js`：各业务 API（posts/profile/calendar/todos/photos/books）。
- `functions/_lib/store.js`：KV 读写和响应工具。
- `wrangler.toml`：Workers 配置。

## 一次性准备

1. 安装依赖

```bash
npm install
```

2. 登录 Cloudflare

```bash
npx wrangler login
```

3. 创建 KV 命名空间

```bash
npx wrangler kv namespace create BLOG_DATA
npx wrangler kv namespace create BLOG_DATA --preview
```

4. 将 `id` / `preview_id` 填入 `wrangler.toml`。

## 本地开发

```bash
npm run dev
```

## 部署到 workers.dev

```bash
npm run deploy
```

## 快速排查“无法保存”

- 打开浏览器 DevTools，检查 `/api/posts`、`/api/photos` 请求是否返回 200。
- 如果返回 500，通常是 `wrangler.toml` 里的 KV namespace ID 没填或填错。
- 如果返回 404，确认当前部署使用的是本仓库的 `worker.js` 和最新代码。
