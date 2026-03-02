import { internalError, json, methodNotAllowed, parseJsonBody, readKVJson, writeKVJson } from "../_lib/store.js";

const KEY = "photos";

export async function onRequest(context) {
  const { request, env } = context;

  try {
    if (request.method === "GET") {
      const photos = await readKVJson(env.BLOG_DATA, KEY, []);
      return json(photos);
    }

    if (request.method === "POST") {
      const photo = await parseJsonBody(request);
      if (!photo) return json({ error: "Invalid JSON" }, 400);
      const photos = await readKVJson(env.BLOG_DATA, KEY, []);
      photos.push(photo);
      await writeKVJson(env.BLOG_DATA, KEY, photos);
      return json({ ok: true });
    }

    if (request.method === "PUT") {
      const updated = await parseJsonBody(request);
      if (!updated) return json({ error: "Invalid JSON" }, 400);
      const photos = await readKVJson(env.BLOG_DATA, KEY, []);
      const index = photos.findIndex((photo) => photo.id === updated.id);
      if (index !== -1) {
        photos[index] = updated;
        await writeKVJson(env.BLOG_DATA, KEY, photos);
      }

      return json({ ok: true });
    }

    if (request.method === "DELETE") {
      const body = await parseJsonBody(request);
      if (!body || body.id === undefined) return json({ error: "Invalid JSON" }, 400);
      const photos = await readKVJson(env.BLOG_DATA, KEY, []);
      const nextPhotos = photos.filter((photo) => photo.id !== body.id);
      await writeKVJson(env.BLOG_DATA, KEY, nextPhotos);
      return json({ ok: true });
    }

    return methodNotAllowed();
  } catch (error) {
    return internalError(error);
  }
}
