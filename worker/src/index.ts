// Cloudflare Worker: private R2 -> JSON list + raw streamed assets.
// Put Cloudflare Access in front of this route; no auth code here.

interface Env {
  BUCKET: R2Bucket;
}

const TYPES = new Set(["Music", "BG", "Logo", "SE", "Presets", "IR", "Textures"]);
const PRESETS_KEY = "Presets/presets.json";

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const parts = url.pathname.split("/").filter(Boolean).map(decodeURIComponent);
    // parts: ["api", ...]
    if (parts[0] !== "api") return json({ error: "not found" }, 404);

    // GET /api/library/:type  -> file list
    if (parts[1] === "library" && parts.length === 3 && request.method === "GET") {
      const type = parts[2];
      if (!TYPES.has(type)) return json({ error: "bad type" }, 400);
      const items: { name: string; size: number; uploaded: string }[] = [];
      let cursor: string | undefined;
      do {
        const res = await env.BUCKET.list({ prefix: `${type}/`, cursor });
        for (const o of res.objects) {
          items.push({
            name: o.key.slice(type.length + 1),
            size: o.size,
            uploaded: o.uploaded.toISOString(),
          });
        }
        cursor = res.truncated ? res.cursor : undefined;
      } while (cursor);
      return json(items);
    }

    // GET /api/asset/:type/:name -> raw stream with Range support
    if (parts[1] === "asset" && parts.length >= 4 && request.method === "GET") {
      const type = parts[2];
      const name = parts.slice(3).join("/");
      if (!TYPES.has(type) || name.includes("..")) return json({ error: "bad path" }, 400);
      const obj = await env.BUCKET.get(`${type}/${name}`, { range: request.headers });
      if (!obj) return json({ error: "not found" }, 404);
      const h = new Headers();
      obj.writeHttpMetadata(h);
      h.set("etag", obj.httpEtag);
      h.set("accept-ranges", "bytes");
      let status = 200;
      const r = (obj as R2ObjectBody).range as { offset?: number; length?: number } | undefined;
      if (r && request.headers.has("range")) {
        const start = r.offset ?? 0;
        const len = r.length ?? obj.size - start;
        h.set("content-range", `bytes ${start}-${start + len - 1}/${obj.size}`);
        h.set("content-length", String(len));
        status = 206;
      } else {
        h.set("content-length", String(obj.size));
      }
      return new Response((obj as R2ObjectBody).body, { status, headers: h });
    }

    // GET/PUT /api/presets
    if (parts[1] === "presets" && parts.length === 2) {
      if (request.method === "GET") {
        const obj = await env.BUCKET.get(PRESETS_KEY);
        return obj ? new Response(obj.body, { headers: { "content-type": "application/json" } }) : json([]);
      }
      if (request.method === "PUT") {
        const body = await request.text();
        try { JSON.parse(body); } catch { return json({ error: "invalid json" }, 400); }
        await env.BUCKET.put(PRESETS_KEY, body, { httpMetadata: { contentType: "application/json" } });
        return json({ ok: true });
      }
    }

    return json({ error: "not found" }, 404);
  },
};
