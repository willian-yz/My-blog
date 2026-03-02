# My Blog（Cloudflare 部署说明）

这个项目支持两种方式：
- **Cloudflare Pages（推荐 Git 自动部署）**
- **Cloudflare Workers（手动 wrangler deploy）**

## 目录说明

- `index.html`：前端页面（继续请求 `/api/*`）。
- `worker.js`：Worker 入口，路由 `/api/*` 到后端处理器，其他请求回退到静态资源。
- `functions/api/*.js`：API 处理逻辑（posts/profile/calendar/todos/photos/books）。
- `functions/_lib/store.js`：存储与响应工具（优先 KV；未绑定 KV 时回退内存存储）。
- `wrangler.toml`：Wrangler 配置（本地开发/手动部署用）。

## 一次性准备

```bash
npm install
npx wrangler login
```

## 推荐：绑定 D1 database（用于持久化）

你已经创建了 `myblog_database`，现在只需要把它绑定给 Worker：

1. Cloudflare Dashboard → Workers & Pages → 你的 `my-blog` Worker。
2. Settings → Bindings → Add binding → 选择 **D1 database**。
3. Binding 名称填写：`BLOG_DB`（必须是这个名字）。
4. Database 选择你创建的：`myblog_database`。

完成后，日记/图片会写入 D1（会自动创建 `blog_kv` 表），刷新页面后仍可读取。

> 兼容逻辑：优先使用 `BLOG_DB`（D1）；其次 `BLOG_DATA`（KV）；都没有时使用内存（不持久）。

## 关键：Cloudflare Pages 构建设置（修复 build 报错）

如果你在 Pages 上看到：
`Failed: error occurred while running deploy command`

请这样配置：

- **Build command**: `npm run build`
- **Build output directory**: `/`（根目录）
- **Deploy command**: `npx wrangler versions upload`

## 本地开发

```bash
npm run dev
```

## 手动部署（可选）

部署到 workers.dev：

```bash
npm run deploy:worker
```

部署到 Pages（CLI）：

```bash
npm run deploy:pages
```

## 测试

```bash
npm run test
```

## Cloudflare Pages / CI 注意事项

如果仓库根目录是 `My-blog/`，应用代码在 `myblog-lyz/` 子目录，
且 CI 使用 `npx wrangler versions upload`（在仓库根目录执行），
则仓库根目录也需要 `wrangler.toml`，并指向：

- `main = "myblog-lyz/worker.js"`
- `assets.directory = "myblog-lyz"`

否则会出现 `Missing entry-point to Worker script or to assets directory`。
