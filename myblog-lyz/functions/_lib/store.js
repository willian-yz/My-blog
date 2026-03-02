export const jsonHeaders = {
  "Content-Type": "application/json; charset=utf-8",
};

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: jsonHeaders,
  });
}

export async function readKVJson(kv, key, fallbackValue) {
  const value = await kv.get(key, { type: "json" });
  return value ?? fallbackValue;
}

export async function writeKVJson(kv, key, value) {
  await kv.put(key, JSON.stringify(value));
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
