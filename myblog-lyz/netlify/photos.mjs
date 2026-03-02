import { getStore } from "@netlify/blobs";

export default async function handler(req) {
  const store = getStore("blog-data");
  const method = req.method;

  if (method === "GET") {
    try {
      const data = await store.get("photos", { type: "json" });
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
    const photo = await req.json();
    let photos = [];
    try {
      photos = (await store.get("photos", { type: "json" })) || [];
    } catch (e) {}
    photos.push(photo);
    await store.setJSON("photos", photos);
    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  if (method === "PUT") {
    const updated = await req.json();
    let photos = [];
    try {
      photos = (await store.get("photos", { type: "json" })) || [];
    } catch (e) {}
    const idx = photos.findIndex((p) => p.id === updated.id);
    if (idx !== -1) {
      photos[idx] = updated;
      await store.setJSON("photos", photos);
    }
    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  if (method === "DELETE") {
    const { id } = await req.json();
    let photos = [];
    try {
      photos = (await store.get("photos", { type: "json" })) || [];
    } catch (e) {}
    photos = photos.filter((p) => p.id !== id);
    await store.setJSON("photos", photos);
    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response("Method not allowed", { status: 405 });
}

export const config = {
  path: "/api/photos",
};
