"""
Driftwood API — Monte Carlo Risk Engine (Vercel Serverless Entrypoint)

FastAPI entrypoint with three endpoints:
    GET  /health       → liveness check
    POST /v1/simulate  → full simulation (percentile paths + metrics)
    POST /v1/metrics   → metrics only (lighter payload)

Stateless, no DB. All simulation results are computed on the fly.
"""

import os
import sys
import logging

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# Add parent directory to sys.path to allow imports when run locally or in Vercel serverless environment
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models import (
    SimulationRequest,
    SimulationResponse,
    MetricsResponse,
    HealthResponse,
    Metrics,
    Percentiles,
)
from data import get_historical_prices
from simulation import run_simulation

# ── Logging ──────────────────────────────────────────────────────────────

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("driftwood")

# ── App ──────────────────────────────────────────────────────────────────

app = FastAPI(
    title="Driftwood",
    description="Open-source Monte Carlo simulation engine for equity price paths",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ─────────────────────────────────────────────────────────────────
# In production, restrict to known frontend origins.
# ALLOWED_ORIGINS env var: comma-separated list of origins.

_raw_origins = os.getenv("ALLOWED_ORIGINS", "*")
allowed_origins = (
    ["*"] if _raw_origins == "*" else [o.strip() for o in _raw_origins.split(",")]
)
# Wildcard origins cannot be used with allow_credentials=True
allow_credentials = False if "*" in allowed_origins else True

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)


import json
import urllib.request

KV_URL = os.getenv("KV_REST_API_URL")
KV_TOKEN = os.getenv("KV_REST_API_TOKEN")

def increment_api_calls():
    if not KV_URL or not KV_TOKEN:
        return
    try:
        url = KV_URL if KV_URL.endswith("/") else f"{KV_URL}/"
        body = json.dumps(["INCR", "stats:api_calls"]).encode("utf-8")
        req = urllib.request.Request(
            url,
            data=body,
            headers={
                "Authorization": f"Bearer {KV_TOKEN}",
                "Content-Type": "application/json"
            },
            method="POST"
        )
        with urllib.request.urlopen(req) as response:
            pass
    except Exception as e:
        logger.warning("Failed to increment KV counter: %s", e)

def get_api_calls():
    if not KV_URL or not KV_TOKEN:
        return 0
    try:
        url = KV_URL if KV_URL.endswith("/") else f"{KV_URL}/"
        body = json.dumps(["GET", "stats:api_calls"]).encode("utf-8")
        req = urllib.request.Request(
            url,
            data=body,
            headers={
                "Authorization": f"Bearer {KV_TOKEN}",
                "Content-Type": "application/json"
            },
            method="POST"
        )
        with urllib.request.urlopen(req) as response:
            res = json.loads(response.read().decode("utf-8"))
            val = res.get("result")
            return int(val) if val else 0
    except Exception as e:
        logger.warning("Failed to get KV counter: %s", e)
        return 0

# ── Routes ───────────────────────────────────────────────────────────────

@app.get("/health", response_model=HealthResponse)
async def health():
    """Liveness check — used by Cloudflare Worker and self-host monitoring."""
    return HealthResponse()


@app.post("/v1/simulate", response_model=SimulationResponse)
async def simulate(req: SimulationRequest):
    """
    Run a full Monte Carlo simulation.

    Returns percentile price paths (P10/P50/P90) and aggregate metrics.
    The response is designed to be rendered directly by a chart library.
    """
    prices = _fetch_prices(req.ticker)
    result = run_simulation(prices, req.days, req.simulations)
    
    # Track statistics
    increment_api_calls()

    return SimulationResponse(
        ticker=req.ticker,
        current_price=result["current_price"],
        percentiles=Percentiles(**result["percentiles"]),
        metrics=Metrics(**result["metrics"]),
        paths=result["paths"],
    )


@app.post("/v1/metrics", response_model=MetricsResponse)
async def metrics(req: SimulationRequest):
    """
    Run a simulation but return only the aggregate metrics (no path data).

    Lighter payload for third-party integrations that don't need chart data.
    """
    prices = _fetch_prices(req.ticker)
    result = run_simulation(prices, req.days, req.simulations)
    
    # Track statistics
    increment_api_calls()

    return MetricsResponse(
        ticker=req.ticker,
        current_price=result["current_price"],
        metrics=Metrics(**result["metrics"]),
    )


@app.get("/v1/stats")
async def stats():
    """Get the total number of simulations run globally."""
    calls = get_api_calls()
    return {"total_simulations": calls}


# ── Helpers ──────────────────────────────────────────────────────────────

def _fetch_prices(ticker: str):
    """Fetch historical prices, converting data errors to HTTP 404."""
    try:
        return get_historical_prices(ticker)
    except ValueError as e:
        logger.warning("Data fetch failed for %s: %s", ticker, e)
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error("Unexpected error fetching data for %s: %s", ticker, e)
        raise HTTPException(
            status_code=500,
            detail="An internal error occurred while fetching market data",
        )
