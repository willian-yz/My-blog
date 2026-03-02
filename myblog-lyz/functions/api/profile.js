import { internalError, json, methodNotAllowed, parseJsonBody, readKVJson, writeKVJson } from "../_lib/store.js";

const KEY = "profile";
const defaultProfile = {
  name: "我的名字",
  bio: "欢迎来到我的小角落。这里是我记录生活、分享想法的地方。\n喜欢文字、旅行和一切有趣的事物。",
  avatar: "",
};

export async function onRequest(context) {
  const { request, env } = context;

  try {
    if (request.method === "GET") {
      const profile = await readKVJson(env, KEY, defaultProfile);
      return json(profile);
    }

    if (request.method === "PUT") {
      const profile = await parseJsonBody(request);
      if (!profile) return json({ error: "Invalid JSON" }, 400);
      await writeKVJson(env, KEY, profile);
      return json({ success: true });
    }

    return methodNotAllowed();
  } catch (error) {
    return internalError(error);
  }
}
