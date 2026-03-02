import { getStore } from "@netlify/blobs";

export default async function handler(req) {
  const store = getStore("blog-data");
  const method = req.method;

  if (method === "GET") {
    try {
      const data = await store.get("books", { type: "json" });
      return new Response(JSON.stringify(data || []), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (e) {
      return new Response(JSON.stringify([]), {
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  if (method === "POST") {
    const book = await req.json();
    let books = [];
    try {
      books = (await store.get("books", { type: "json" })) || [];
    } catch (e) {}
    books.push(book);
    await store.setJSON("books", books);
    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  if (method === "PUT") {
    const updated = await req.json();
    let books = [];
    try {
      books = (await store.get("books", { type: "json" })) || [];
    } catch (e) {}
    const idx = books.findIndex((b) => b.id === updated.id);
    if (idx !== -1) {
      books[idx] = updated;
      await store.setJSON("books", books);
    }
    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  if (method === "DELETE") {
    const { id } = await req.json();
    let books = [];
    try {
      books = (await store.get("books", { type: "json" })) || [];
    } catch (e) {}
    books = books.filter((b) => b.id !== id);
    await store.setJSON("books", books);
    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response("Method not allowed", { status: 405 });
}

export const config = {
  path: "/api/books",
};
