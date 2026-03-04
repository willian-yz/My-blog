import { detectStoreMode, json } from "./functions/_lib/store.js";
import { onRequest as postsHandler } from "./functions/api/posts.js";
import { onRequest as profileHandler } from "./functions/api/profile.js";
import { onRequest as calendarHandler } from "./functions/api/calendar.js";
import { onRequest as todosHandler } from "./functions/api/todos.js";
import { onRequest as photosHandler } from "./functions/api/photos.js";
import { onRequest as doodlesHandler } from "./functions/api/doodles.js";
import { onRequest as bookSearchHandler } from "./functions/api/book-search.js";
import { onRequest as booksHandler } from "./functions/api/books.js";
import { onRequest as trashHandler } from "./functions/api/trash.js";

const BUILD_VERSION = "2026-03-02-b386d2a-hotfix";

const SLINGSHOT_WASM_PATH = "/godot/slingshot/slingshot.wasm";

async function serveSlingshotWasm(env) {
  const wasmUrl = env.SLINGSHOT_WASM_URL;
  if (!wasmUrl) {
    return new Response(
      "Missing SLINGSHOT_WASM_URL binding. Upload slingshot.wasm to external storage and point this env var to it.",
      { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } },
    );
  }

  const upstream = await fetch(wasmUrl, {
    cf: {
      cacheEverything: true,
      cacheTtl: 86400,
    },
  });

  if (!upstream.ok) {
    return new Response("Failed to load slingshot.wasm from upstream storage", {
      status: 502,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const headers = new Headers(upstream.headers);
  headers.set("Content-Type", "application/wasm");
  headers.set("Cache-Control", "public, max-age=86400");
  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers,
  });
}

const routes = {
  "/api/posts": postsHandler,
  "/api/profile": profileHandler,
  "/api/calendar": calendarHandler,
  "/api/todos": todosHandler,
  "/api/photos": photosHandler,
  "/api/doodles": doodlesHandler,
  "/api/book-search": bookSearchHandler,
  "/api/books": booksHandler,
  "/api/trash": trashHandler,
  "/api/version": async () => json({ version: BUILD_VERSION }),
  "/api/health": async ({ env }) => {
    const storeMode = detectStoreMode(env);
    const hasD1Binding = storeMode === "d1";
    const hasKvBinding = storeMode === "kv";
    return json({
      ok: true,
      version: BUILD_VERSION,
      storeMode,
      bindings: {
        BLOG_DB: hasD1Binding,
        BLOG_DATA: hasKvBinding,
      },
    });
  },
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const handler = routes[url.pathname];

    if (handler) {
      return handler({ request, env, ctx });
    }

    if (url.pathname === SLINGSHOT_WASM_PATH) {
      return serveSlingshotWasm(env);
    }

    if (url.pathname.startsWith("/api/")) {
      return json({ error: "Not found" }, 404);
    }

    const assetResponse = await env.ASSETS.fetch(request);
    if (url.pathname === "/" || url.pathname === "/index.html") {
      const headers = new Headers(assetResponse.headers);
      headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
      headers.set("x-my-blog-version", BUILD_VERSION);
      return new Response(assetResponse.body, {
        status: assetResponse.status,
        statusText: assetResponse.statusText,
        headers,
      });
    }

    return assetResponse;
  },
};
