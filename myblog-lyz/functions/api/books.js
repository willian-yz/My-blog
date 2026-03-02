import { internalError, json, methodNotAllowed, parseJsonBody, readKVJson, writeKVJson } from "../_lib/store.js";

const KEY = "books";

export async function onRequest(context) {
  const { request, env } = context;

  try {
    if (request.method === "GET") {
      const books = await readKVJson(env, KEY, []);
      return json(books);
    }

    if (request.method === "POST") {
      const book = await parseJsonBody(request);
      if (!book) return json({ error: "Invalid JSON" }, 400);
      const books = await readKVJson(env, KEY, []);
      books.push(book);
      await writeKVJson(env, KEY, books);
      return json({ ok: true });
    }

    if (request.method === "PUT") {
      const updated = await parseJsonBody(request);
      if (!updated) return json({ error: "Invalid JSON" }, 400);
      const books = await readKVJson(env, KEY, []);
      const index = books.findIndex((book) => book.id === updated.id);
      if (index !== -1) {
        books[index] = updated;
        await writeKVJson(env, KEY, books);
      }

      return json({ ok: true });
    }

    if (request.method === "DELETE") {
      const body = await parseJsonBody(request);
      if (!body || body.id === undefined) return json({ error: "Invalid JSON" }, 400);
      const books = await readKVJson(env, KEY, []);
      const nextBooks = books.filter((book) => book.id !== body.id);
      await writeKVJson(env, KEY, nextBooks);
      return json({ ok: true });
    }

    return methodNotAllowed();
  } catch (error) {
    return internalError(error);
  }
}
