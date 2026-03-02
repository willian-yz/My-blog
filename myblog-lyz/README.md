# My Blog（Cloudflare 部署说明）

这个项目支持两种方式：
- **Cloudflare Pages（推荐 Git 自动部署）**
- **Cloudflare Workers（手动 wrangler deploy）**

## 目录说明

- `index.html`：前端页面（继续请求 `/api/*`）。
- `worker.js`：Worker 入口，路由 `/api/*` 到后端处理器，其他请求回退到静态资源。
- `functions/api/*.js`：API 处理逻辑（posts/profile/calendar/todos/photos/books）。
- `functions/_lib/store.js`：KV 读写和响应工具。
- `wrangler.toml`：Wrangler 配置（本地开发/手动部署用）。

## 一次性准备

```bash
npm install
npx wrangler login
npx wrangler kv namespace create BLOG_DATA
npx wrangler kv namespace create BLOG_DATA --preview
```

然后把 KV 的 `id` / `preview_id` 填入 `wrangler.toml`。

## 关键：Cloudflare Pages 构建设置（修复 build 报错）

如果你在 Pages 上看到：
`Failed: error occurred while running deploy command`

请这样配置：

- **Build command**: `npm run build`
- **Build output directory**: `/`（根目录）
- **Deploy command**: **留空（不要填）**

> 原因：Pages Git 集成本身会负责部署，不应在构建阶段再次执行 `npm run deploy`（那是 wrangler 手动发布命令，会在 CI 中失败）。

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

## 快速排查“无法保存”

- 看 DevTools 的 `/api/posts`、`/api/photos` 请求是否 200。
- 500：通常是 KV 命名空间 ID 未正确配置。
- 404：通常是部署配置不对，没把 API 路由接入。

## Cloudflare Pages / CI 注意事项

如果你的仓库根目录是 `My-blog/`，应用代码在 `myblog-lyz/` 子目录，
且 CI 使用 `npx wrangler versions upload`（在仓库根目录执行），
则需要在仓库根目录也存在 `wrangler.toml`，并指向：

- `main = "myblog-lyz/worker.js"`
- `assets.directory = "myblog-lyz"`

否则会出现 `Missing entry-point to Worker script or to assets directory`。
