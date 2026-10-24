// Cloudflare Worker: private R2 -> JSON list + raw streamed assets (Range supported) + Auto-caption proxy to a Hugging Face Space.
// Cloudflare Access protects the hostname at the edge. When ACCESS_TEAM_DOMAIN and ACCESS_AUD are set (wrangler.jsonc vars),
// this Worker also verifies the Access JWT (Cf-Access-Jwt-Assertion) on every /api/* request, so a request that bypasses Access is refused.

interface Env {
  BUCKET?: R2Bucket;
  ACCESS_TEAM_DOMAIN?: string;   // e.g. your-team.cloudflareaccess.com
  ACCESS_AUD?: string;           // Application Audience (AUD) tag of the Access application
  ASR_URL?: string;              // Hugging Face Space address, e.g. https://your-name-fornyein-asr.hf.space  (not secret)
  ASR_KEY?: string;              // shared key the Space checks in the X-API-Key header  (set as a SECRET in the dashboard)
}

// Fonts/ = font files (ttf/otf/woff/woff2). They stay in the PRIVATE bucket, so licensed fonts are never published in the public repo.
const TYPES = new Set(["Music", "BG", "Logo", "SE", "Fonts", "Presets", "IR", "Textures"]);
const PRESETS_KEY = "Presets/presets.json";

const json = (data: unknown, status = 200, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "private, no-cache", ...extra },
  });

// ---------- Cloudflare Access JWT check ----------
const b64u = (s: string): Uint8Array => {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  return Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
};
let jwks: { keys: any[] } | null = null;
let jwksAt = 0;
async function accessOk(request: Request, env: Env): Promise<boolean> {
  if (!env.ACCESS_AUD || !env.ACCESS_TEAM_DOMAIN) return true;          // not configured yet: rely on the edge policy only
  const token = request.headers.get("Cf-Access-Jwt-Assertion");
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  try {
    const dec = new TextDecoder();
    const header = JSON.parse(dec.decode(b64u(parts[0])));
    const payload = JSON.parse(dec.decode(b64u(parts[1])));
    if (!jwks || Date.now() - jwksAt > 3600_000 || !jwks.keys.some((k) => k.kid === header.kid)) {
      const r = await fetch(`https://${env.ACCESS_TEAM_DOMAIN}/cdn-cgi/access/certs`);
      if (!r.ok) return false;
      jwks = (await r.json()) as { keys: any[] };
      jwksAt = Date.now();
    }
    const jwk = jwks!.keys.find((k) => k.kid === header.kid);
    if (!jwk) return false;
    const key = await crypto.subtle.importKey("jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
    const valid = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, b64u(parts[2]), new TextEncoder().encode(parts[0] + "." + parts[1]));
    if (!valid) return false;
    const aud = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
    return aud.includes(env.ACCESS_AUD) && payload.exp * 1000 > Date.now() && payload.iss === `https://${env.ACCESS_TEAM_DOMAIN}`;
  } catch {
    return false;
  }
}

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
    if (!(await accessOk(request, env))) return json({ error: "forbidden" }, 403);

    if (parts[1] === "health") return json({ ok: true, r2: !!env.BUCKET, accessCheck: !!(env.ACCESS_AUD && env.ACCESS_TEAM_DOMAIN), asr: !!env.ASR_URL });

    // ---- Auto caption: forward ONE short 16 kHz mono WAV chunk to the Whisper server on Hugging Face ----
    //   GET  /api/transcribe            -> wakes the Space / says whether it is ready
    //   POST /api/transcribe?lang=my    -> { text }
    if (parts[1] === "transcribe") {
      if (!env.ASR_URL) return json({ error: "ASR_URL မသတ်မှတ်ရသေးပါ (Hugging Face Space လိပ်စာ)" }, 503);
      const base = env.ASR_URL.replace(/\/+$/, "");
      const headers: Record<string, string> = env.ASR_KEY ? { "x-api-key": env.ASR_KEY } : {};
      try {
        if (request.method === "GET") {
          const r = await fetch(base + "/", { headers });
          return json({ ready: r.ok, status: r.status });
        }
        if (request.method !== "POST") return json({ error: "method not allowed" }, 405);
        if (Number(request.headers.get("content-length") || 0) > 4 * 1024 * 1024) return json({ error: "chunk ကြီးလွန်းပါတယ် (4MB အောက်)" }, 413);
        const lang = (url.searchParams.get("lang") || "my").replace(/[^a-z-]/gi, "").slice(0, 8) || "my";
        const r = await fetch(`${base}/transcribe?lang=${lang}`, { method: "POST", headers: { ...headers, "content-type": "audio/wav" }, body: request.body });
        return new Response(await r.text(), { status: r.status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
      } catch (e) {
        return json({ error: "ASR server မခေါ်နိုင်ပါ: " + (e as Error).message }, 502);
      }
    }

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
      const probe = await bucket.head(key);
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
