import { ensureObject, internalError, json, methodNotAllowed, parseJsonBody, readKVJson, writeKVJson } from "../_lib/store.js";

const KEY = "todos";

export async function onRequest(context) {
  const { request, env } = context;

  try {
    if (request.method === "GET") {
      const todos = ensureObject(await readKVJson(env, KEY, {}));
      return json(todos);
    }

    if (request.method === "PUT") {
      const body = await parseJsonBody(request);
      if (!body || !body.date) return json({ error: "Invalid JSON" }, 400);
      const todos = ensureObject(await readKVJson(env, KEY, {}));
      todos[body.date] = body.data;
      await writeKVJson(env, KEY, todos);
      return json({ success: true });
    }

    if (request.method === "DELETE") {
      const body = await parseJsonBody(request);
      if (!body || !body.date) return json({ error: "Invalid JSON" }, 400);
      const todos = ensureObject(await readKVJson(env, KEY, {}));

      if (body.todoId !== undefined && todos[body.date]) {
        todos[body.date].todos = (todos[body.date].todos || []).filter((todo) => todo.id !== body.todoId);
      } else {
        delete todos[body.date];
      }

      await writeKVJson(env, KEY, todos);
      return json({ success: true });
    }

    return methodNotAllowed();
  } catch (error) {
    return internalError(error);
  }
}
