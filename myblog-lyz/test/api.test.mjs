import test from "node:test";
import assert from "node:assert/strict";

import worker from "../worker.js";

class InMemoryKV {
  constructor() {
    this.map = new Map();
  }

  async get(key, options = {}) {
    if (!this.map.has(key)) return null;
    const raw = this.map.get(key);
    if (options.type === "json") return JSON.parse(raw);
    return raw;
  }

  async put(key, value) {
    this.map.set(key, value);
  }
}

function makeEnv() {
  return {
    BLOG_DATA: new InMemoryKV(),
    ASSETS: {
      fetch: async () => new Response("asset", { status: 200 }),
    },
  };
}

async function call(env, path, method = "GET", body) {
  const init = { method, headers: {} };
  if (body !== undefined) {
    init.headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(body);
  }

  const request = new Request(`https://example.com${path}`, init);
  const res = await worker.fetch(request, env, {});
  return { status: res.status, body: await res.json() };
}

test("posts API can save and read diary entries", async () => {
  const env = makeEnv();
  const entry = { id: 1, title: "diary", content: "hello" };

  const createRes = await call(env, "/api/posts", "POST", entry);
  assert.equal(createRes.status, 200);

  const getRes = await call(env, "/api/posts");
  assert.equal(getRes.status, 200);
  assert.equal(getRes.body.length, 1);
  assert.equal(getRes.body[0].content, "hello");
});

test("posts API recovers if existing data type is corrupted", async () => {
  const env = makeEnv();
  await env.BLOG_DATA.put("posts", JSON.stringify({ broken: true }));

  const createRes = await call(env, "/api/posts", "POST", { id: 2, title: "new" });
  assert.equal(createRes.status, 200);

  const getRes = await call(env, "/api/posts");
  assert.equal(getRes.status, 200);
  assert.equal(Array.isArray(getRes.body), true);
  assert.equal(getRes.body.length, 1);
  assert.equal(getRes.body[0].id, 2);
});

test("photos API can save and read photos", async () => {
  const env = makeEnv();
  const photo = { id: 7, url: "https://img.example/p.jpg", caption: "test" };

  const createRes = await call(env, "/api/photos", "POST", photo);
  assert.equal(createRes.status, 200);
  assert.equal(createRes.body.ok, true);

  const getRes = await call(env, "/api/photos");
  assert.equal(getRes.status, 200);
  assert.equal(getRes.body.length, 1);
  assert.equal(getRes.body[0].id, 7);
});

test("non-api requests are served by ASSETS", async () => {
  const env = makeEnv();
  const request = new Request("https://example.com/");
  const res = await worker.fetch(request, env, {});
  assert.equal(res.status, 200);
  assert.equal(await res.text(), "asset");
});
