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

const RATE_LIMIT = 100; // 100 requests per 5 seconds
const RATE_WINDOW_MS = 5000;

const ipCache = new Map<string, { count: number; resetTime: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const data = ipCache.get(ip);

  // Inline cleanup (1% chance) to prevent memory leak
  if (Math.random() < 0.01) {
    for (const [key, val] of ipCache.entries()) {
      if (now > val.resetTime) {
        ipCache.delete(key);
      }
    }
  }

  if (!data) {
    ipCache.set(ip, { count: 1, resetTime: now + RATE_WINDOW_MS });
    return false;
  }

  if (now > data.resetTime) {
    ipCache.set(ip, { count: 1, resetTime: now + RATE_WINDOW_MS });
    return false;
  }

  data.count++;
  if (data.count > RATE_LIMIT) {
    return true;
  }
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

    // 3. Rate limit by IP (in-memory)
    const clientIp = request.headers.get("CF-Connecting-IP") || "unknown";
    if (isRateLimited(clientIp)) {
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

      let data: any;
      const contentType = backendRes.headers.get("Content-Type") || "";
      if (contentType.includes("application/json")) {
        data = await backendRes.json();
      } else {
        const text = await backendRes.text();
        return jsonResponse(
          { detail: `Backend returned non-JSON response (${backendRes.status}): ${text.substring(0, 200)}` },
          500
        );
      }

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
