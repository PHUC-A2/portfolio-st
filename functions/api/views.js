const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store, no-cache, must-revalidate",
};

const TOTAL_KEY = "total";
const DEDUPE_TTL = 60 * 60 * 24;

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });

const hashVisitor = async (ip, ua) => {
  const raw = `${ip}|${ua.slice(0, 160)}`;
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 40);
};

const readTotal = async (kv) => {
  const raw = await kv.get(TOTAL_KEY);
  const count = parseInt(raw || "0", 10);
  return Number.isFinite(count) && count >= 0 ? count : 0;
};

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  if (!env.VIEWS_KV) {
    return json({ count: 0, error: "VIEWS_KV binding missing" }, 503);
  }

  const kv = env.VIEWS_KV;

  if (request.method === "GET") {
    const count = await readTotal(kv);
    return json({ count });
  }

  if (request.method === "POST") {
    const ip = request.headers.get("CF-Connecting-IP") || "0.0.0.0";
    const ua = request.headers.get("User-Agent") || "unknown";
    const visitorHash = await hashVisitor(ip, ua);
    const dedupeKey = `dedupe:${visitorHash}`;
    const seen = await kv.get(dedupeKey);

    if (seen) {
      const count = await readTotal(kv);
      return json({ count, incremented: false });
    }

    const current = await readTotal(kv);
    const next = current + 1;

    await kv.put(TOTAL_KEY, String(next));
    await kv.put(dedupeKey, "1", { expirationTtl: DEDUPE_TTL });

    return json({ count: next, incremented: true });
  }

  return json({ error: "Method not allowed" }, 405);
}
