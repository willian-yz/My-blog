import { ensureArray, internalError, json, methodNotAllowed, parseJsonBody, readKVJson, writeKVJson } from "../_lib/store.js";

const KEY = "posts";

export async function onRequest(context) {
  const { request, env } = context;

  try {
    if (request.method === "GET") {
      const posts = ensureArray(await readKVJson(env, KEY, []));
      return json(posts);
    }

    if (request.method === "POST") {
      const post = await parseJsonBody(request);
      if (!post) return json({ error: "Invalid JSON" }, 400);
      const posts = ensureArray(await readKVJson(env, KEY, []));
      posts.push(post);
      await writeKVJson(env, KEY, posts);
      return json({ success: true });
    }

    if (request.method === "PUT") {
      const updatedPost = await parseJsonBody(request);
      if (!updatedPost) return json({ error: "Invalid JSON" }, 400);
      const posts = ensureArray(await readKVJson(env, KEY, []));
      const index = posts.findIndex((post) => post.id === updatedPost.id);
      if (index === -1) {
        return json({ error: "Not found" }, 404);
      }

      posts[index] = updatedPost;
      await writeKVJson(env, KEY, posts);
      return json({ success: true });
    }

    if (request.method === "DELETE") {
      const body = await parseJsonBody(request);
      if (!body || body.id === undefined) return json({ error: "Invalid JSON" }, 400);
      const posts = ensureArray(await readKVJson(env, KEY, []));
      const nextPosts = posts.filter((post) => post.id !== body.id);
      await writeKVJson(env, KEY, nextPosts);
      return json({ success: true });
    }

    return methodNotAllowed();
  } catch (error) {
    return internalError(error);
  }
}
