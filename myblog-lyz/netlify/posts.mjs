import { getStore } from "@netlify/blobs";

export default async (req, context) => {
  const store = getStore("blog-data");

  try {
    if (req.method === "GET") {
      const posts = await store.get("posts", { type: "json" }) || [];
      return Response.json(posts);
    }

    if (req.method === "POST") {
      const post = await req.json();
      const posts = (await store.get("posts", { type: "json" })) || [];
      posts.push(post);
      await store.setJSON("posts", posts);
      return Response.json({ success: true });
    }

    if (req.method === "PUT") {
      const updatedPost = await req.json();
      const posts = (await store.get("posts", { type: "json" })) || [];
      const index = posts.findIndex(p => p.id === updatedPost.id);
      if (index === -1) {
        return Response.json({ error: "Not found" }, { status: 404 });
      }
      posts[index] = updatedPost;
      await store.setJSON("posts", posts);
      return Response.json({ success: true });
    }

    if (req.method === "DELETE") {
      const { id } = await req.json();
      let posts = (await store.get("posts", { type: "json" })) || [];
      posts = posts.filter(p => p.id !== id);
      await store.setJSON("posts", posts);
      return Response.json({ success: true });
    }

    return new Response("Method not allowed", { status: 405 });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
};

export const config = {
  path: "/api/posts"
};
