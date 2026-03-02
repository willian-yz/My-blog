import { getStore } from "@netlify/blobs";

export default async (req, context) => {
  const store = getStore("blog-data");

  try {
    if (req.method === "GET") {
      const calendar = await store.get("calendar", { type: "json" }) || {};
      return Response.json(calendar);
    }

    if (req.method === "PUT") {
      const calendar = await req.json();
      await store.setJSON("calendar", calendar);
      return Response.json({ success: true });
    }

    if (req.method === "DELETE") {
      await store.setJSON("calendar", {});
      return Response.json({ success: true });
    }

    return new Response("Method not allowed", { status: 405 });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
};

export const config = {
  path: "/api/calendar"
};
