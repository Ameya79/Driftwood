"""
Pydantic request/response models for the Driftwood API.

Validation rules (from TRD §4.1):
  - ticker: 1–5 uppercase characters
  - days: 7–252 (trading days in a year)
  - simulations: 10–1000
"""

from pydantic import BaseModel, Field
from typing import Dict, List


# ── Request ──────────────────────────────────────────────────────────────

class SimulationRequest(BaseModel):
    """Input parameters for a Monte Carlo simulation run."""

    ticker: str = Field(
        ...,
        min_length=1,
        max_length=5,
        pattern=r"^[A-Z]{1,5}$",
        description="Stock ticker symbol (uppercase, 1–5 chars)",
        json_schema_extra={"examples": ["AAPL"]},
    )
    days: int = Field(
        default=30,
        ge=7,
        le=252,
        description="Number of trading days to simulate (7–252)",
    )
    simulations: int = Field(
        default=500,
        ge=10,
        le=1000,
        description="Number of Monte Carlo paths (10–1,000)",
    )


# ── Response ─────────────────────────────────────────────────────────────

class Metrics(BaseModel):
    """Aggregate statistics computed from the simulation paths."""

    mean_final: float = Field(..., description="Mean price on the final day")
    p10_final: float = Field(..., description="10th-percentile final price")
    p50_final: float = Field(..., description="50th-percentile (median) final price")
    p90_final: float = Field(..., description="90th-percentile final price")
    volatility_annual: float = Field(..., description="Annualised historical volatility")
    prob_profit: float = Field(
        ..., description="Fraction of paths ending above the starting price"
    )


class Percentiles(BaseModel):
    """Day-by-day percentile price paths (length = days + 1, including day 0)."""

    p10: List[float]
    p50: List[float]
    p90: List[float]


class SimulationResponse(BaseModel):
    """Full simulation result returned by POST /v1/simulate."""

    ticker: str
    current_price: float
    percentiles: Percentiles
    metrics: Metrics
    paths: List[List[float]] = Field(
        default_factory=list,
        description="Sample of simulated paths for chart rendering",
    )


class MetricsResponse(BaseModel):
    """Lighter response returned by POST /v1/metrics (no path data)."""

    ticker: str
    current_price: float
    metrics: Metrics


class HealthResponse(BaseModel):
    """Response from GET /health."""

    status: str = "ok"
    version: str = "1.0.0"
