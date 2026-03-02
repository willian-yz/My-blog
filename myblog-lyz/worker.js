import { json } from "./functions/_lib/store.js";
import { onRequest as postsHandler } from "./functions/api/posts.js";
import { onRequest as profileHandler } from "./functions/api/profile.js";
import { onRequest as calendarHandler } from "./functions/api/calendar.js";
import { onRequest as todosHandler } from "./functions/api/todos.js";
import { onRequest as photosHandler } from "./functions/api/photos.js";
import { onRequest as booksHandler } from "./functions/api/books.js";

const routes = {
  "/api/posts": postsHandler,
  "/api/profile": profileHandler,
  "/api/calendar": calendarHandler,
  "/api/todos": todosHandler,
  "/api/photos": photosHandler,
  "/api/books": booksHandler,
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const handler = routes[url.pathname];

    if (handler) {
      return handler({ request, env, ctx });
    }

    if (url.pathname.startsWith("/api/")) {
      return json({ error: "Not found" }, 404);
    }

    return env.ASSETS.fetch(request);
  },
};
