/**
 * Driftwood Cloudflare Worker
 *
 * Edge proxy that sits between the Next.js frontend and the FastAPI backend.
 * Responsibilities:
 *   1. CORS preflight handling
 *   2. KV-backed response caching (5-min TTL)
 *   3. Rate limiting (20 req/min per IP via KV counter)
 *   4. Proxying /api/* routes to the FastAPI origin
 */

interface Env {
  CACHE: KVNamespace;
  BACKEND_URL: string;
}

// ── CORS Headers ────────────────────────────────────────────────────────

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

function corsPreflightResponse(): Response {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...CORS_HEADERS,
    },
  });
}

// ── Rate Limiting ───────────────────────────────────────────────────────

const RATE_LIMIT = 20; // requests per window
const RATE_WINDOW_SECONDS = 60;

async function isRateLimited(ip: string, env: Env): Promise<boolean> {
  const key = `rate:${ip}`;
  const current = await env.CACHE.get(key);
  const count = current ? parseInt(current, 10) : 0;

  if (count >= RATE_LIMIT) {
    return true;
  }

  await env.CACHE.put(key, String(count + 1), {
    expirationTtl: RATE_WINDOW_SECONDS,
  });
  return false;
}

// ── Worker Entry ────────────────────────────────────────────────────────

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // 1. Handle CORS preflight
    if (request.method === "OPTIONS") {
      return corsPreflightResponse();
    }

    const url = new URL(request.url);

    // 2. Only proxy /api/* routes
    if (!url.pathname.startsWith("/api/")) {
      return new Response("Not found", { status: 404 });
    }

    // 3. Rate limit by IP
    const clientIp = request.headers.get("CF-Connecting-IP") || "unknown";
    if (await isRateLimited(clientIp, env)) {
      return jsonResponse(
        { detail: "Rate limit exceeded. Try again in a minute." },
        429
      );
    }

    // 4. Cache check for POST /api/v1/simulate
    const backendPath = url.pathname.replace(/^\/api/, "");

    if (
      request.method === "POST" &&
      backendPath === "/v1/simulate"
    ) {
      let body: Record<string, any>;
      try {
        body = (await request.json()) as Record<string, unknown>;
      } catch (e) {
        return jsonResponse({ detail: "Invalid JSON payload" }, 400);
      }

      const ticker = typeof body?.ticker === "string" ? body.ticker.toUpperCase().trim() : "";
      const days = Number(body?.days);
      const simulations = Number(body?.simulations);

      if (!ticker || isNaN(days) || isNaN(simulations)) {
        return jsonResponse(
          { detail: "Missing or invalid parameters: ticker (string), days (number), simulations (number) are required." },
          400
        );
      }

      const cacheKey = `sim:${ticker}:${days}:${simulations}`;

      // Try KV cache first
      const cached = await env.CACHE.get(cacheKey);
      if (cached) {
        return jsonResponse(JSON.parse(cached));
      }

      // 5. Proxy to FastAPI
      const backendRes = await fetch(`${env.BACKEND_URL}${backendPath}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker, days, simulations }),
      });

      const data = await backendRes.json();

      // 6. Cache successful responses for 5 minutes
      if (backendRes.ok) {
        await env.CACHE.put(cacheKey, JSON.stringify(data), {
          expirationTtl: 300,
        });
      }

      return jsonResponse(data, backendRes.status);
    }

    // 7. Forward all other /api/* requests (health, metrics, etc.)
    const forwardRes = await fetch(`${env.BACKEND_URL}${backendPath}`, {
      method: request.method,
      headers: {
        "Content-Type": request.headers.get("Content-Type") || "application/json",
      },
      ...(request.method === "POST" ? { body: await request.text() } : {}),
    });

    const forwardData = await forwardRes.text();
    return new Response(forwardData, {
      status: forwardRes.status,
      headers: {
        "Content-Type": forwardRes.headers.get("Content-Type") || "application/json",
        ...CORS_HEADERS,
      },
    });
  },
};
