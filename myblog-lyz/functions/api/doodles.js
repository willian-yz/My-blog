import { ensureArray, internalError, json, methodNotAllowed, parseJsonBody, readKVJson, writeKVJson } from "../_lib/store.js";

const KEY = "doodles";

export async function onRequest(context) {
  const { request, env } = context;

  try {
    if (request.method === "GET") {
      const doodles = ensureArray(await readKVJson(env, KEY, []));
      return json(doodles);
    }

    if (request.method === "POST") {
      const doodle = await parseJsonBody(request);
      if (!doodle) return json({ error: "Invalid JSON" }, 400);
      const doodles = ensureArray(await readKVJson(env, KEY, []));
      doodles.push(doodle);
      await writeKVJson(env, KEY, doodles);
      return json({ ok: true });
    }

    if (request.method === "PUT") {
      const updated = await parseJsonBody(request);
      if (!updated) return json({ error: "Invalid JSON" }, 400);
      const doodles = ensureArray(await readKVJson(env, KEY, []));
      const index = doodles.findIndex((item) => item.id === updated.id);
      if (index !== -1) {
        doodles[index] = updated;
        await writeKVJson(env, KEY, doodles);
      }
      return json({ ok: true });
    }

    if (request.method === "DELETE") {
      const body = await parseJsonBody(request);
      if (!body || body.id === undefined) return json({ error: "Invalid JSON" }, 400);
      const doodles = ensureArray(await readKVJson(env, KEY, []));
      const next = doodles.filter((item) => item.id !== body.id);
      await writeKVJson(env, KEY, next);
      return json({ ok: true });
    }

    return methodNotAllowed();
  } catch (error) {
    return internalError(error);
  }
}
