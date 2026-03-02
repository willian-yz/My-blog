import { internalError, json, methodNotAllowed, parseJsonBody, readKVJson, writeKVJson } from "../_lib/store.js";

const KEY = "todos";

export async function onRequest(context) {
  const { request, env } = context;

  try {
    if (request.method === "GET") {
      const todos = await readKVJson(env.BLOG_DATA, KEY, {});
      return json(todos);
    }

    if (request.method === "PUT") {
      const body = await parseJsonBody(request);
      if (!body || !body.date) return json({ error: "Invalid JSON" }, 400);
      const todos = await readKVJson(env.BLOG_DATA, KEY, {});
      todos[body.date] = body.data;
      await writeKVJson(env.BLOG_DATA, KEY, todos);
      return json({ success: true });
    }

    if (request.method === "DELETE") {
      const body = await parseJsonBody(request);
      if (!body || !body.date) return json({ error: "Invalid JSON" }, 400);
      const todos = await readKVJson(env.BLOG_DATA, KEY, {});

      if (body.todoId !== undefined && todos[body.date]) {
        todos[body.date].todos = (todos[body.date].todos || []).filter((todo) => todo.id !== body.todoId);
      } else {
        delete todos[body.date];
      }

      await writeKVJson(env.BLOG_DATA, KEY, todos);
      return json({ success: true });
    }

    return methodNotAllowed();
  } catch (error) {
    return internalError(error);
  }
}
