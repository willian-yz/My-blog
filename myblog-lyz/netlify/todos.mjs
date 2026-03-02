import { getStore } from "@netlify/blobs";

export default async (req, context) => {
  const store = getStore("blog-data");

  try {
    if (req.method === "GET") {
      const todos = await store.get("todos", { type: "json" }) || {};
      return Response.json(todos);
    }

    if (req.method === "PUT") {
      const body = await req.json();
      const { date, data } = body;
      const todos = (await store.get("todos", { type: "json" })) || {};
      todos[date] = data;
      await store.setJSON("todos", todos);
      return Response.json({ success: true });
    }

    if (req.method === "DELETE") {
      const { date, todoId } = await req.json();
      const todos = (await store.get("todos", { type: "json" })) || {};
      if (date && todoId !== undefined && todos[date]) {
        todos[date].todos = (todos[date].todos || []).filter(t => t.id !== todoId);
        await store.setJSON("todos", todos);
      } else if (date && todoId === undefined) {
        delete todos[date];
        await store.setJSON("todos", todos);
      }
      return Response.json({ success: true });
    }

    return new Response("Method not allowed", { status: 405 });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
};

export const config = {
  path: "/api/todos"
};
