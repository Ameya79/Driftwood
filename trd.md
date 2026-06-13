# TRD — Driftwood: Monte Carlo Risk Engine

## 1. Architecture Overview

```
Browser (Next.js)
      │
      │  HTTPS /api/*
      ▼
Cloudflare Worker          ← Edge layer: routing, CORS, rate limiting, caching
      │
      │  HTTP → origin
      ▼
FastAPI (Railway/Render)   ← Python: Monte Carlo engine, yfinance data
```

**Flow:**
1. Next.js calls `/api/simulate` (relative URL — always hits the Worker)
2. Worker validates, optionally serves from KV cache, proxies to FastAPI
3. FastAPI fetches historical data → runs GBM simulation → returns JSON
4. Worker caches response in KV (TTL: 5 min) → returns to browser
5. Next.js renders chart from JSON payload

---

## 2. Stack

| Layer | Technology | Why |
|---|---|---|
| Frontend | Next.js 14 (App Router) | File-based routing, RSC, minimal config |
| Styling | Tailwind CSS (CDN or base install) | Zero-runtime, no component lib needed |
| Chart | Recharts (only external dep) | Lightweight, React-native, composable |
| Edge | Cloudflare Workers | Free, global, 0ms cold start, KV caching |
| Backend | FastAPI (Python 3.11+) | Async, typed, fast, pythonic |
| Data | `yfinance` | Free stock data, no API key needed |
| Math | `numpy` | Vectorised GBM simulation |
| Deployment (FE) | Vercel | Git push deploy, free tier |
| Deployment (BE) | Railway or Render | Free tier, Docker or Nixpacks |

---

## 3. Repository Structure

```
driftwood/
├── frontend/                    # Next.js app — driftwood.run
│   ├── app/
│   │   ├── page.tsx             # Main UI (input + chart + metrics)
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── SimulatorForm.tsx    # Ticker + params input
│   │   ├── SimulationChart.tsx  # Recharts wrapper (200 sampled paths + P10/50/90)
│   │   ├── MetricsPanel.tsx     # P10/P50/P90 stats display
│   │   ├── CopyApiButton.tsx    # "Copy API call" → curl snippet
│   │   └── EmbedButton.tsx      # "Embed this" → iframe snippet generator
│   ├── lib/
│   │   └── api.ts               # fetch wrapper for /api/v1/simulate
│   ├── public/
│   │   └── widget.js            # Embeddable widget script (<50KB, canvas-based)
│   ├── next.config.js
│   ├── tailwind.config.js
│   └── package.json             # Only: next, react, recharts, typescript
│
├── worker/                      # Cloudflare Worker
│   ├── src/
│   │   └── index.ts             # Worker entrypoint
│   ├── wrangler.toml            # CF config (name: driftwood-worker)
│   └── package.json
│
├── backend/                     # FastAPI — the open-source API
│   ├── main.py                  # App entrypoint + routes (/v1/simulate, /v1/metrics)
│   ├── simulation.py            # GBM Monte Carlo engine
│   ├── data.py                  # yfinance data fetching
│   ├── models.py                # Pydantic request/response models
│   ├── requirements.txt
│   └── Dockerfile
│
├── docker-compose.yml           # One-command self-host: frontend + backend + nginx
└── README.md                    # Self-host guide, API docs, community links
```

---

## 4. Backend — FastAPI

### 4.1 Endpoints

All endpoints versioned under `/v1/` from day one.

#### `GET /health`
Returns `{ "status": "ok", "version": "1.0.0" }`. Used by Cloudflare Worker health check.

#### `POST /v1/simulate`
Full simulation. Returns percentile paths + metrics. Used by the frontend chart.

**Request body:**
```json
{
  "ticker": "AAPL",
  "days": 30,
  "simulations": 500
}
```

**Response:** (no raw paths — too large; only percentile summaries)
```json
{
  "ticker": "AAPL",
  "current_price": 189.43,
  "percentiles": {
    "p10": [189.43, 183.1, ...],
    "p50": [189.43, 191.4, ...],
    "p90": [189.43, 199.7, ...]
  },
  "metrics": {
    "mean_final": 193.21,
    "p10_final": 171.3,
    "p50_final": 191.4,
    "p90_final": 218.7,
    "volatility_annual": 0.284,
    "prob_profit": 0.613
  }
}
```

#### `POST /v1/metrics`
Lighter endpoint — returns only the metrics object, no path arrays. For third-party integrations that don't need chart data.

**Request body:** same as `/v1/simulate`
**Response:** only the `metrics` object above.

**Validation (both endpoints):**
- `ticker`: string, 1–5 chars, uppercase
- `days`: int, 7–252
- `simulations`: int, 10–1000

**Errors:**
- `422` Pydantic validation error
- `404` `{ "detail": "Ticker not found or no data available" }`
- `500` internal error with sanitised message

### 4.2 Monte Carlo Engine (`simulation.py`)

Uses **Geometric Brownian Motion (GBM)**:

```
S(t+1) = S(t) * exp((μ - σ²/2)Δt + σ√Δt * Z)
```

Where:
- `S(t)` = price at time t
- `μ` = annualised drift (mean log return × 252)
- `σ` = annualised volatility (std of log returns × √252)
- `Z` ~ N(0,1) random shock
- `Δt` = 1/252 (one trading day)

```python
# Pseudocode
log_returns = np.diff(np.log(prices))
mu = log_returns.mean() * 252
sigma = log_returns.std() * np.sqrt(252)
dt = 1 / 252

# Shape: (simulations, days)
Z = np.random.standard_normal((simulations, days))
daily_returns = np.exp((mu - 0.5 * sigma**2) * dt + sigma * np.sqrt(dt) * Z)

# Prepend S0, cumprod to build paths
paths = S0 * np.cumprod(np.hstack([np.ones((simulations, 1)), daily_returns]), axis=1)
```

**Performance note:** 1000 sims × 252 days = 252,000 floats — trivially fast with numpy vectorisation. No loops.

### 4.3 Data Layer (`data.py`)

```python
import yfinance as yf

def get_historical_prices(ticker: str, period: str = "1y") -> np.ndarray:
    df = yf.download(ticker, period=period, auto_adjust=True, progress=False)
    if df.empty:
        raise ValueError("Ticker not found")
    return df["Close"].dropna().values
```

- Fetch 1 year of daily closes (≈252 data points)
- Raise `ValueError` on empty response → FastAPI converts to 404

### 4.4 CORS

Allow all origins in development. In production, restrict to:
- `https://driftwood-worker.<your-cf-account>.workers.dev`
- `https://driftwood.run` (production domain)
- `https://driftwood.vercel.app` (Vercel preview)

### 4.5 `requirements.txt`
```
fastapi==0.111.0
uvicorn[standard]==0.29.0
yfinance==0.2.38
numpy==1.26.4
pydantic==2.7.0
```

### 4.6 Dockerfile
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## 5. Cloudflare Worker

### 5.1 Purpose
- Single stable URL for the frontend (`/api/*`)
- Hides the raw backend URL from the browser
- Caches simulation results in KV (same ticker+days+sims = instant return)
- Handles CORS preflight
- Rate limits per IP: 20 requests/minute (using CF's built-in rate limiting or a simple counter in KV)

### 5.2 `wrangler.toml`
```toml
name = "driftwood-worker"
main = "src/index.ts"
compatibility_date = "2024-04-01"

[[kv_namespaces]]
binding = "CACHE"
id = "<your-kv-namespace-id>"

[vars]
BACKEND_URL = "https://your-fastapi-on-railway.app"
```

### 5.3 Worker Logic (`src/index.ts`)
```typescript
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // 1. Handle CORS preflight
    if (request.method === "OPTIONS") return corsPreflightResponse();

    const url = new URL(request.url);

    // 2. Only proxy /api/* routes
    if (!url.pathname.startsWith("/api/")) {
      return new Response("Not found", { status: 404 });
    }

    // 3. Check KV cache for POST /api/simulate
    if (request.method === "POST" && url.pathname === "/api/v1/simulate") {
      const body = await request.json();
      const cacheKey = `sim:${body.ticker}:${body.days}:${body.simulations}`;
      
      const cached = await env.CACHE.get(cacheKey);
      if (cached) return jsonResponse(JSON.parse(cached));

      // 4. Proxy to FastAPI
      const backendRes = await fetch(`${env.BACKEND_URL}/v1/simulate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await backendRes.json();

      // 5. Cache for 5 minutes
      await env.CACHE.put(cacheKey, JSON.stringify(data), { expirationTtl: 300 });

      return jsonResponse(data, backendRes.status);
    }

    // 6. Forward all other /api/* requests
    const backendRes = await fetch(
      `${env.BACKEND_URL}${url.pathname}`,
      { method: request.method, headers: request.headers }
    );
    return backendRes;
  }
};
```

---

## 6. Frontend — Next.js

### 6.1 `package.json` dependencies
```json
{
  "dependencies": {
    "next": "14.x",
    "react": "18.x",
    "react-dom": "18.x",
    "recharts": "2.x"
  },
  "devDependencies": {
    "typescript": "5.x",
    "tailwindcss": "3.x",
    "autoprefixer": "^10",
    "postcss": "^8",
    "@types/react": "18.x",
    "@types/node": "20.x"
  }
}
```

**That's it. No Redux, no Zustand, no Axios, no UI lib.**

### 6.2 `next.config.js` — proxy `/api/*` to Worker
```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.WORKER_URL}/api/:path*`,
      },
    ];
  },
};
module.exports = nextConfig;
```

Set `WORKER_URL=https://driftwood-worker.<your-cf-account>.workers.dev` in `.env.local`.

### 6.3 State Management
No external library. `useState` + `useCallback` only.

```typescript
// app/page.tsx
const [params, setParams] = useState({ ticker: "AAPL", days: 30, simulations: 500 });
const [result, setResult] = useState<SimulationResult | null>(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
```

### 6.4 Chart — Recharts
- `<LineChart>` with `<Line>` for each path (opacity: 0.08, stroke: #00ff88)
- 3 bold `<Line>` overlays for P10/P50/P90
- `<ReferenceLine>` for current price
- `<Tooltip>` showing day + price on hover

**Performance:** Cap rendered paths at 200 in the chart even if 1000 were simulated (sample 200 randomly from the 1000). Keeps DOM lean.

### 6.5 URL Sync
Use `next/navigation` `useRouter` + `useSearchParams` to sync `?ticker=AAPL&days=30&sims=500` on every successful simulation. Enables shareable links.

---

## 7. Environment Variables

| Variable | Where | Value |
|---|---|---|
| `WORKER_URL` | Next.js `.env.local` | Cloudflare Worker URL |
| `BACKEND_URL` | Worker `wrangler.toml` [vars] | FastAPI Railway URL |
| `ALLOWED_ORIGINS` | FastAPI env | Comma-separated frontend domains |
| `NEXT_PUBLIC_SITE_URL` | Next.js `.env.local` | Used by EmbedButton to generate iframe snippets |

---

## 8. Deployment Steps

### Backend (Railway)
1. Push `backend/` to GitHub
2. New Railway project → Deploy from GitHub → select `backend/`
3. Railway auto-detects Dockerfile
4. Set env var `ALLOWED_ORIGINS`
5. Note the generated URL → add to Worker `wrangler.toml`

### Cloudflare Worker
1. `cd worker && npx wrangler login`
2. Create KV namespace: `npx wrangler kv:namespace create CACHE`
3. Update `wrangler.toml` with KV ID + backend URL
4. `npx wrangler deploy`
5. Note Worker URL → add to Next.js `.env.local`

### Frontend (Vercel)
1. Push `frontend/` to GitHub
2. New Vercel project → import repo
3. Set `WORKER_URL` in Vercel environment variables
4. Deploy

### Self-host (docker-compose)
1. Clone repo
2. Copy `.env.example` → `.env`, fill in values
3. `docker compose up` — spins frontend + backend + nginx together
4. Accessible at `localhost:3000`

---

## 9. Local Development

```bash
# Terminal 1 — Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Terminal 2 — Worker (local dev mode)
cd worker
npx wrangler dev --port 8787
# Set BACKEND_URL=http://localhost:8000 in wrangler.toml for local

# Terminal 3 — Frontend
cd frontend
npm install
echo "WORKER_URL=http://localhost:8787" > .env.local
npm run dev
```

---

## 10. Key Technical Decisions & Rationale

| Decision | Rationale |
|---|---|
| Cloudflare Worker as proxy (not direct backend call) | Hides backend URL, adds KV caching, centralises CORS, enables future auth middleware without touching FastAPI |
| GBM not ARIMA/ML | GBM is the industry standard for equity path simulation, mathematically sound, and explainable |
| `yfinance` not paid API | Zero cost, sufficient for 1y of daily OHLCV, no API key needed for demo |
| Recharts not D3 | D3 has steep learning curve for React; Recharts is declarative, typed, and sufficient for this use case |
| No DB in v1 | Simulations are stateless + cacheable by params — KV TTL is sufficient; avoids infra complexity |
| numpy vectorised GBM | A loop-based simulation at 1000×252 is 10–100× slower; vectorisation keeps P99 latency < 1s |
| API versioned at /v1/ from day one | Communicates production intent; allows future breaking changes without disrupting existing integrations |
| No raw paths in response | 500 paths × 252 days = 126,000 floats per response — too large; P10/P50/P90 summaries are sufficient for the chart and 10× smaller payload |
| widget.js uses canvas not Recharts | Recharts is 150KB+ — too heavy for an embeddable script tag. Canvas renderer keeps widget.js under 50KB |