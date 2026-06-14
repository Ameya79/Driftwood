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

### Run Locally

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

---

## Integrating the API into your App

You can call the Driftwood API from any frontend or backend application to bring Monte Carlo risk modeling to your users.

### 1. The Request (JavaScript / TypeScript Fetch)

Send a POST request to `/v1/simulate` with the target ticker, days to forecast, and number of simulation runs:

```javascript
const response = await fetch("https://your-backend-url.vercel.app/v1/simulate", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    ticker: "AAPL",       // Stock symbol (1-5 chars)
    days: 30,             // Forecasting horizon (7-252 trading days)
    simulations: 100      // Number of simulation paths (10-1000)
  })
});

const data = await response.json();
console.log(data);
```

### 2. The Response Structure

The API returns a clean JSON payload:

```json
{
  "ticker": "AAPL",
  "current_price": 189.43,
  "percentiles": {
    "p10": [189.43, 183.1, 180.2],  // Bearish envelope path
    "p50": [189.43, 191.4, 192.5],  // Median expected path
    "p90": [189.43, 199.7, 203.1]   // Bullish envelope path
  },
  "metrics": {
    "mean_final": 193.21,           // Expected average final price
    "p10_final": 171.30,
    "p50_final": 191.40,
    "p90_final": 218.70,
    "volatility_annual": 0.284,      // Annualized historical volatility
    "prob_profit": 0.613             // Probability price ends higher than starting price
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
