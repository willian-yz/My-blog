import { ensureArray, internalError, json, methodNotAllowed, parseJsonBody, readKVJson, writeKVJson } from "../_lib/store.js";

const KEY = "trash-posts";

export async function onRequest(context) {
  const { request, env } = context;

  try {
    if (request.method === "GET") {
      const items = ensureArray(await readKVJson(env, KEY, []));
      return json(items);
    }

    if (request.method === "POST") {
      const item = await parseJsonBody(request);
      if (!item) return json({ error: "Invalid JSON" }, 400);
      const items = ensureArray(await readKVJson(env, KEY, []));
      const next = items.filter((p) => p.id !== item.id);
      next.push(item);
      await writeKVJson(env, KEY, next);
      return json({ success: true });
    }

    if (request.method === "DELETE") {
      const body = await parseJsonBody(request);
      if (!body || body.id === undefined) return json({ error: "Invalid JSON" }, 400);
      const items = ensureArray(await readKVJson(env, KEY, []));
      const next = items.filter((p) => p.id !== body.id);
      await writeKVJson(env, KEY, next);
      return json({ success: true });
    }

    return methodNotAllowed();
  } catch (error) {
    return internalError(error);
  }
}
