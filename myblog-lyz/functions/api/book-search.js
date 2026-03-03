import { internalError, json, methodNotAllowed } from "../_lib/store.js";

function safeText(value) {
  return (value == null ? "" : String(value)).trim();
}

function mapGutendexDoc(doc) {
  const formats = doc?.formats || {};
  const epubUrl = formats["application/epub+zip"] || formats["application/x-mobipocket-ebook"] || "";
  const coverUrl = formats["image/jpeg"] || "";
  const author = Array.isArray(doc?.authors) && doc.authors[0] ? safeText(doc.authors[0].name) : "";
  return {
    title: safeText(doc?.title) || "Untitled",
    author,
    epubUrl,
    coverUrl,
    source: "gutendex",
  };
}

export async function onRequest(context) {
  const { request } = context;
  try {
    if (request.method !== "GET") return methodNotAllowed();

    const url = new URL(request.url);
    const q = safeText(url.searchParams.get("q"));
    if (!q) return json({ items: [] });

    const upstream = `https://gutendex.com/books/?search=${encodeURIComponent(q)}`;
    const res = await fetch(upstream, {
      headers: { "User-Agent": "my-blog-book-search/1.0" },
    });

    if (!res.ok) {
      return json({ items: [], error: `search failed: ${res.status}` }, 502);
    }

    const payload = await res.json();
    const rawItems = Array.isArray(payload?.results) ? payload.results : [];
    const items = rawItems
      .map(mapGutendexDoc)
      .filter((it) => it.epubUrl)
      .slice(0, 12);

    return json({ items });
  } catch (error) {
    return internalError(error);
  }
}
