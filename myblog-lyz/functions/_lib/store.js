export const jsonHeaders = {
  "Content-Type": "application/json; charset=utf-8",
};

const memoryState = globalThis.__BLOG_MEMORY_KV__ || (globalThis.__BLOG_MEMORY_KV__ = new Map());

const memoryKV = {
  async get(key, options = {}) {
    if (!memoryState.has(key)) return null;
    const raw = memoryState.get(key);
    if (options.type === "json") {
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    }
    return raw;
  },
  async put(key, value) {
    memoryState.set(key, value);
  },
};

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: jsonHeaders,
  });
}

export function getStore(env) {
  return env?.BLOG_DATA ?? memoryKV;
}

export async function readKVJson(env, key, fallbackValue) {
  const value = await getStore(env).get(key, { type: "json" });
  return value ?? fallbackValue;
}

export async function writeKVJson(env, key, value) {
  await getStore(env).put(key, JSON.stringify(value));
}

export async function parseJsonBody(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export function methodNotAllowed() {
  return json({ error: "Method not allowed" }, 405);
}

export function internalError(error) {
  return json({ error: error instanceof Error ? error.message : String(error) }, 500);
}
