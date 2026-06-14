<p align="center">
  <img src="https://via.placeholder.com/120x120/0a0a0a/d6cfc4?text=🪵" alt="Driftwood Logo" width="80" />
</p>

<h1 align="center">Driftwood</h1>
<p align="center">
  <strong>Open-source Monte Carlo simulation engine for equity price paths</strong>
</p>

<p align="center">
  <a href="https://driftwood.run">Live Demo</a> ·
  <a href="#api-documentation">API Docs</a> ·
  <a href="#self-host">Self-Host Guide</a> ·
  <a href="#embed">Embed Widget</a>
</p>

<p align="center">
  <img alt="License" src="https://img.shields.io/badge/license-MIT-blue.svg" />
  <img alt="Python" src="https://img.shields.io/badge/python-3.11+-blue.svg" />
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-14-black.svg" />
</p>

---

## What is Driftwood?

Driftwood is a **self-hostable, API-first Monte Carlo risk engine** that simulates equity price paths using Geometric Brownian Motion (GBM). It ships as:

- 🌐 **A hosted web UI** at [driftwood.run](https://driftwood.run) — no install, no account
- 🔌 **A REST API** you can drop into your own app, backtest, or dashboard
- 📦 **An embeddable widget** for quant bloggers and educators

---

## Quick Start

### Run locally (2 minutes)

```bash
# 1. Clone
git clone https://github.com/your-org/driftwood.git
cd driftwood

# 2. Start the backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# 3. In another terminal — start the frontend
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and run your first simulation.

### Self-host with Docker

```bash
git clone https://github.com/your-org/driftwood.git
cd driftwood
cp .env.example .env
docker compose up
```

Accessible at `http://localhost:3000`.

---

## API Documentation

All endpoints are versioned under `/v1/`.

### `GET /health`

```bash
curl http://localhost:8000/health
```

```json
{ "status": "ok", "version": "1.0.0" }
```

### `POST /v1/simulate`

Run a full Monte Carlo simulation. Returns percentile paths + metrics.

```bash
curl -X POST http://localhost:8000/v1/simulate \
  -H "Content-Type: application/json" \
  -d '{"ticker": "AAPL", "days": 30, "simulations": 500}'
```

**Response:**
```json
{
  "ticker": "AAPL",
  "current_price": 189.43,
  "percentiles": {
    "p10": [189.43, 183.1, "..."],
    "p50": [189.43, 191.4, "..."],
    "p90": [189.43, 199.7, "..."]
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

### `POST /v1/metrics`

Lighter endpoint — returns only the metrics object (no path arrays).

```bash
curl -X POST http://localhost:8000/v1/metrics \
  -H "Content-Type: application/json" \
  -d '{"ticker": "NVDA", "days": 60, "simulations": 1000}'
```

### Validation

| Parameter     | Type   | Range    |
|---------------|--------|----------|
| `ticker`      | string | 1–5 uppercase chars |
| `days`        | int    | 7–252    |
| `simulations` | int    | 10–1,000 |

### Errors

| Code | Description |
|------|-------------|
| `404` | Ticker not found or no data available |
| `422` | Validation error (bad input params) |
| `500` | Internal server error |

---

## Embed Widget

Add a live Monte Carlo simulation to any page:

```html
<script
  src="https://driftwood.run/widget.js"
  data-ticker="AAPL"
  data-days="30"
  data-sims="500"
  data-theme="dark"
></script>
```

Options:

| Attribute      | Default  | Description |
|----------------|----------|-------------|
| `data-ticker`  | `AAPL`   | Stock ticker symbol |
| `data-days`    | `30`     | Trading days to simulate |
| `data-sims`    | `500`    | Number of simulations |
| `data-theme`   | `dark`   | `dark` or `light` |

---

## Architecture

```
Browser (Next.js)
      │
      │  /api/* (Next.js Rewrite Proxy)
      ▼
Vercel Serverless (FastAPI)  ← Monte Carlo engine, in-memory cache, yfinance data
```

---

## The Math

Driftwood uses **Geometric Brownian Motion (GBM)**, the industry standard for equity path simulation:

```
S(t+1) = S(t) × exp((μ - σ²/2)Δt + σ√Δt × Z)
```

Where:
- **S(t)** = price at time t
- **μ** = annualised drift (mean of historical log returns × 252)
- **σ** = annualised volatility (std of log returns × √252)
- **Z** ~ N(0,1) random shock
- **Δt** = 1/252 (one trading day)

---

## Contributing

We welcome contributions! Some good starting points:

- 🏷️ **`good first issue`** — Great for first-time contributors
- 📊 **`model-request`** — Add new stochastic models (Heston, GARCH, Jump Diffusion)
- 🔌 **`integrations`** — Connect to new data sources or platforms

### Extension Points

The simulation engine is modular by design. To add a new model:

1. Create a new file in `backend/` (e.g., `heston.py`)
2. Implement a `run_simulation(prices, days, simulations)` function
3. Add a `model` parameter to the API request
4. Submit a PR!

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router) |
| Styling | Tailwind CSS |
| Charts | Recharts |
| Cache | Thread-safe In-memory Cache (FastAPI) |
| Backend | FastAPI (Python) |
| Data | yfinance |
| Math | numpy (vectorised) |

---

## License

[MIT](LICENSE) — use it, fork it, ship it.
