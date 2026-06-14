# Driftwood

Driftwood is an open-source, API-first Monte Carlo risk engine designed to generate stock price trajectories for modeling equity risk, estimating option prices, and calculating Value-at-Risk (VaR) in financial applications. It simulates equity price paths using Geometric Brownian Motion (GBM) and ships with an interactive Next.js frontend, a FastAPI backend, and an iframe embed widget.

## Features

- **Stochastic Path Generation**: Run simulations using Geometric Brownian Motion (GBM) dynamically calibrated to historical stock data.
- **Percentile Tracking**: Access P10 (Bear), P50 (Median), and P90 (Bull) paths in a clean JSON format.
- **Key Financial Metrics**: Calculate annualized volatility, probability of profit, and final mean values.
- **Developer First**: Fully stateless API, no authentication keys required, with dynamic integration guides (cURL, JS, Python, HTML iFrame).
- **Modern UI**: A white-themed, high-performance web dashboard built using Next.js and Recharts.

---

## Quick Start

### 1. Run Locally

Start the backend:
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn api.index:app --reload --port 8000
```

Start the frontend in another terminal:
```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000` to run your first simulation.

### 2. Self-Host with Docker
```bash
docker compose up --build
```
Accessible at `http://localhost:3000`.

---

## Vercel Deployment

Driftwood is structured as a monorepo that deploys seamlessly to Vercel as two separate services.

### Backend Deployment (FastAPI Serverless)
1. Import this repository into Vercel.
2. In the project settings, set the **Root Directory** to `backend`.
3. Keep the **Framework Preset** as **Other**. Vercel will automatically read `vercel.json` and serve the FastAPI application as Python Serverless Functions.
4. Click **Deploy**. Copy the generated backend URL (e.g. `https://your-backend.vercel.app`).

### Frontend Deployment (Next.js)
1. Import this repository into Vercel as a new project.
2. Set the **Root Directory** to `frontend`. Vercel will auto-detect Next.js.
3. In **Environment Variables**, add:
   - **Key**: `NEXT_PUBLIC_API_URL`
   - **Value**: Your backend Vercel URL (e.g., `https://your-backend.vercel.app`).
4. Click **Deploy**.

---

## API Reference

### Health Check
`GET /health`
```bash
curl https://your-backend.vercel.app/health
```
```json
{ "status": "ok", "version": "1.0.0" }
```

### Run Simulation
`POST /v1/simulate`

**Request Body:**
```json
{
  "ticker": "AAPL",
  "days": 30,
  "simulations": 100
}
```

**Response:**
```json
{
  "ticker": "AAPL",
  "current_price": 189.43,
  "percentiles": {
    "p10": [189.43, 183.1, 180.2],
    "p50": [189.43, 191.4, 192.5],
    "p90": [189.43, 199.7, 203.1]
  },
  "metrics": {
    "mean_final": 193.21,
    "p10_final": 171.30,
    "p50_final": 191.40,
    "p90_final": 218.70,
    "volatility_annual": 0.284,
    "prob_profit": 0.613
  }
}
```

---

## Architecture

```
Browser (Next.js App)
      │
      │  /api/* (Next.js Rewrite Proxy)
      ▼
Vercel Serverless (FastAPI)  ← Monte Carlo engine, Thread-safe cache, yfinance
```

---

## The Math

Driftwood uses Geometric Brownian Motion (GBM) to forecast equity price paths:

$$S(t+1) = S(t) \times \exp\left((\mu - \frac{\sigma^2}{2})\Delta t + \sigma\sqrt{\Delta t} \times Z\right)$$

Where:
- $S(t)$ = stock price at time $t$
- $\mu$ = annualized historical drift
- $\sigma$ = annualized historical volatility
- $Z \sim N(0, 1)$ = standard normal random variable
- $\Delta t = 1/252$ = single trading day step

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router) |
| Styling | Custom Vanilla CSS + Tailwind |
| Charts | Recharts |
| Cache | Thread-Safe In-Memory |
| Backend | FastAPI (Python 3.11+) |
| Data | yfinance |
| Math | numpy (vectorized simulation) |

---

## License

MIT License — feel free to fork, self-host, and integrate into your own projects.
