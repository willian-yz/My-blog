import { getStore } from "@netlify/blobs";

const defaultProfile = {
  name: "\u6211\u7684\u540d\u5b57",
  bio: "\u6b22\u8fce\u6765\u5230\u6211\u7684\u5c0f\u89d2\u843d\u3002\u8fd9\u91cc\u662f\u6211\u8bb0\u5f55\u751f\u6d3b\u3001\u5206\u4eab\u60f3\u6cd5\u7684\u5730\u65b9\u3002\n\u559c\u6b22\u6587\u5b57\u3001\u65c5\u884c\u548c\u4e00\u5207\u6709\u8da3\u7684\u4e8b\u7269\u3002",
  avatar: ""
};

export default async (req, context) => {
  const store = getStore("blog-data");

  try {
    if (req.method === "GET") {
      const profile = await store.get("profile", { type: "json" }) || defaultProfile;
      return Response.json(profile);
    }

    if (req.method === "PUT") {
      const profile = await req.json();
      await store.setJSON("profile", profile);
      return Response.json({ success: true });
    }

    return new Response("Method not allowed", { status: 405 });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
};

export const config = {
  path: "/api/profile"
};
