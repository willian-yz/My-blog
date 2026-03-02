import { internalError, json, methodNotAllowed, parseJsonBody, readKVJson, writeKVJson } from "../_lib/store.js";

const KEY = "calendar";

export async function onRequest(context) {
  const { request, env } = context;

  try {
    if (request.method === "GET") {
      const calendar = await readKVJson(env.BLOG_DATA, KEY, {});
      return json(calendar);
    }

    if (request.method === "PUT") {
      const calendar = await parseJsonBody(request);
      if (!calendar) return json({ error: "Invalid JSON" }, 400);
      await writeKVJson(env.BLOG_DATA, KEY, calendar);
      return json({ success: true });
    }

    if (request.method === "DELETE") {
      await writeKVJson(env.BLOG_DATA, KEY, {});
      return json({ success: true });
    }

    return methodNotAllowed();
  } catch (error) {
    return internalError(error);
  }
}
