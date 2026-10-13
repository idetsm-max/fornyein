// Cloudflare Worker: private R2 -> JSON list + raw streamed assets (Range supported).
// Put Cloudflare Access in front of the route; no auth code here.

interface Env {
  BUCKET?: R2Bucket;
}

const TYPES = new Set(["Music", "BG", "Logo", "SE", "Presets", "IR", "Textures"]);
const PRESETS_KEY = "Presets/presets.json";

const json = (data: unknown, status = 200, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "private, no-cache", ...extra },
  });

async function listPrefix(bucket: R2Bucket, prefix?: string, max = 5000): Promise<R2Object[]> {
  const out: R2Object[] = [];
  let cursor: string | undefined;
  do {
    const res = await bucket.list({ prefix, cursor });
    out.push(...res.objects);
    cursor = res.truncated ? res.cursor : undefined;
  } while (cursor && out.length < max);
  return out;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const parts = url.pathname.split("/").filter(Boolean).map(decodeURIComponent);
    if (parts[0] !== "api") return json({ error: "not found" }, 404);

    if (parts[1] === "health") return json({ ok: true, r2: !!env.BUCKET });
    const bucket = env.BUCKET;
    if (!bucket) return json({ error: "R2 not configured" }, 503);

    // GET /api/library/_all -> what is actually in the bucket (top-level folders), for troubleshooting
    if (parts[1] === "library" && parts[2] === "_all") {
      const res = await bucket.list({ delimiter: "/", limit: 200 });
      return json({ folders: res.delimitedPrefixes, rootFiles: res.objects.map((o) => o.key), truncated: res.truncated });
    }

    // GET /api/library/:type  -> file list (exact prefix first, then a case-insensitive fallback)
    if (parts[1] === "library" && parts.length === 3 && request.method === "GET") {
      const type = parts[2];
      if (!TYPES.has(type)) return json({ error: "bad type" }, 400);
      let objs = await listPrefix(bucket, `${type}/`);
      if (!objs.length) {
        const pre = `${type}/`.toLowerCase();
        objs = (await listPrefix(bucket)).filter((o) => o.key.toLowerCase().startsWith(pre));
      }
      const items = objs
        .filter((o) => !o.key.endsWith("/"))
        .map((o) => ({ name: o.key.slice(type.length + 1), size: o.size, uploaded: o.uploaded.toISOString() }));
      return json(items);
    }

    // GET /api/asset/:type/:name -> raw stream with Range support
    if (parts[1] === "asset" && parts.length >= 4 && request.method === "GET") {
      const type = parts[2];
      const name = parts.slice(3).join("/");
      if (!TYPES.has(type) || name.includes("..")) return json({ error: "bad path" }, 400);
      let key = `${type}/${name}`;
      let probe = await bucket.head(key);
      if (!probe) {
        const want = key.toLowerCase();
        const hit = (await listPrefix(bucket)).find((o) => o.key.toLowerCase() === want);
        if (!hit) return json({ error: "not found" }, 404);
        key = hit.key;
      }
      const obj = await bucket.get(key, { range: request.headers });
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
        const obj = await bucket.get(PRESETS_KEY);
        return obj ? new Response(obj.body, { headers: { "content-type": "application/json" } }) : json([]);
      }
      if (request.method === "PUT") {
        const body = await request.text();
        try { JSON.parse(body); } catch { return json({ error: "invalid json" }, 400); }
        await bucket.put(PRESETS_KEY, body, { httpMetadata: { contentType: "application/json" } });
        return json({ ok: true });
      }
    }

    return json({ error: "not found" }, 404);
  },
};
