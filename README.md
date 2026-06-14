<p align="center">
  <img src="frontend/public/logo.png" alt="Driftwood Logo" width="160" />
</p>

<h1 align="center">Driftwood</h1>

<p align="center">
  <strong>A free, stateless, high-performance Monte Carlo risk engine for stock price simulations.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/github/license/Ameya79/Driftwood?style=flat-square&color=blue" alt="License" />
  <img src="https://img.shields.io/badge/API-Stateless-green?style=flat-square" alt="API Stateless" />
  <img src="https://img.shields.io/badge/Rate--Limit-100%20req%20%2F%205s-orange?style=flat-square" alt="Rate Limit" />
</p>

---

## 🎯 Use Cases & Overview

Driftwood is an open-source, API-first simulation suite designed to generate stock price trajectories for financial applications. Developers and quantitative analysts use Driftwood to:
* **Model Equity Risk**: Estimate future price envelopes (bear, median, bull) to map risk boundaries.
* **Price Options**: Simulate asset paths to evaluate option pricing models (e.g. Monte Carlo option pricing).
* **Calculate Value-at-Risk (VaR)**: Compute statistical downside limits for portfolios.
* **Embed Interactive Charts**: Integrate interactive simulator widgets directly into client dashboards or websites.

---

## ⚡ FastAPI-Powered Stateless API

Driftwood's backend is powered by a high-performance **FastAPI** server that is completely stateless. 
* **Zero Keys/Credentials**: Developers can integrate simulation data instantly without needing to manage authentication keys.
* **Vectorized Computations**: Calculations run in parallel using optimized `numpy` vectorization, returning 1,000 paths in milliseconds.
* **Built-in Security**: Includes built-in sliding-window rate limiting to protect Upstash/Redis resources and prevent API abuse.
* **Auto-generated Documentation**: Includes native Swagger UI (`/docs`) and ReDoc (`/redoc`) endpoints out of the box.

---

## 🚀 Quick Start

### Run via Docker Compose (Recommended)

You can launch the complete stack (FastAPI backend + Next.js frontend + Nginx proxy with built-in rate-limiting) using Docker Compose:

```bash
docker-compose up --build
```
Once started, the services will be available at:
* **Frontend / Portal**: `http://localhost:3000`
* **FastAPI Documentation (Swagger)**: `http://localhost:8000/docs`

### Run Locally (Development)

#### 1. Start the FastAPI Backend
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn api.index:app --reload --port 8000
```

#### 2. Start the Next.js Frontend
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000` to view the interactive dashboard.

---

## 🔌 Integrating the API

### Endpoint: `POST /v1/simulate`

#### Request Payload (JSON)
| Parameter | Type | Default | Range | Description |
| :--- | :--- | :--- | :--- | :--- |
| `ticker` | `string` | *Required* | 1-5 chars | Uppercase stock symbol (e.g. `"AAPL"`) |
| `days` | `integer` | `30` | `7` to `252` | Simulation horizon in trading days |
| `simulations` | `integer` | `100` | `10` to `1000` | Number of simulation paths to run |

#### Sample Request (JavaScript Fetch)
```javascript
const response = await fetch("http://localhost:8000/v1/simulate", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    ticker: "AAPL",
    days: 30,
    simulations: 100
  })
});

const data = await response.json();
console.log(data);
```

#### Sample Response Structure
```json
{
  "ticker": "AAPL",
  "current_price": 189.43,
  "percentiles": {
    "p10": [189.43, 183.1, 180.2],  // Bearish envelope path (10th percentile)
    "p50": [189.43, 191.4, 192.5],  // Median expected path (50th percentile)
    "p90": [189.43, 199.7, 203.1]   // Bullish envelope path (90th percentile)
  },
  "metrics": {
    "mean_final": 193.21,
    "p10_final": 171.3,
    "p50_final": 191.4,
    "p90_final": 218.7,
    "volatility_annual": 0.284,      // Annualized historical volatility
    "prob_profit": 0.613             // Probability that the final price exceeds S_0
  }
}
```

---

## 🛡️ Rate Limits & DDoS Protection

To prevent overloading and ensure consistent performance, the system implements a strict rate limit of **100 requests per 5 seconds per client IP**.

* **FastAPI Middleware**: Exceeding the rate limit returns an `HTTP 429 Too Many Requests` response.
* **Nginx Protection**: The reverse proxy uses native rate-limiting (`rate=20r/s` with a `burst=30` burst limit) to filter traffic before it reaches the backend.

---

## 💾 Caching Guidelines

Because stock simulations rely on historical end-of-day market prices, running multiple identical simulations within a short timeframe is computationally redundant. 

### Composite Cache Key Format
We recommend constructing cache keys using the parameters of the request:
`driftwood:{ticker}:{days}:{simulations}`

### Caching Strategies
1. **Client-side (Browser)**: Cache responses in `localStorage` or `sessionStorage` with a **1 to 4 hour TTL**.
2. **Server-side (API Clients)**: Use an in-memory store (e.g. Redis or LRU cache) with a **5-minute to 1-hour TTL**.

---

## 🔬 Mathematical Background

Driftwood simulates future asset prices using a **Geometric Brownian Motion (GBM)** stochastic process:

$$dS_t = \mu S_t dt + \sigma S_t dW_t$$

Where $S_t$ is the asset price at time $t$, $\mu$ is the drift coefficient (historical annualized return), $\sigma$ is the diffusion coefficient (annualized volatility), and $W_t$ is a standard Brownian motion (Wiener process).

By applying Itô's Lemma, the analytical solution used to generate individual simulation paths is:

$$S_t = S_0 \exp\left( \left(\mu - \frac{\sigma^2}{2}\right)t + \sigma W_t \right)$$

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), Recharts, Vanilla CSS & Tailwind
- **Backend**: FastAPI (Python 3.11+), NumPy, yfinance
- **Infrastructure**: Nginx, Docker Compose, Cloudflare Workers

---

## 📄 License

MIT License. Feel free to copy, modify, self-host, and integrate this simulation engine into your own products.
