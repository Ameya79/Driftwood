"""
Geometric Brownian Motion (GBM) Monte Carlo simulation engine.

The core equation:
    S(t+1) = S(t) * exp((μ - σ²/2)Δt + σ√Δt * Z)

Where:
    S(t)  = price at time t
    μ     = annualised drift (mean log return × 252)
    σ     = annualised volatility (std of log returns × √252)
    Z     ~ N(0,1) random shock
    Δt    = 1/252 (one trading day)

All computation is vectorised with numpy — no Python loops.
1000 sims × 252 days = 252,000 floats, trivially fast.
"""

import numpy as np
from typing import Dict, Any, List


TRADING_DAYS_PER_YEAR = 252


def run_simulation(
    prices: np.ndarray,
    days: int,
    simulations: int,
) -> Dict[str, Any]:
    """
    Run a GBM Monte Carlo simulation.

    Args:
        prices: Historical daily closing prices (1-D array, oldest → newest).
        days: Number of future trading days to simulate.
        simulations: Number of Monte Carlo paths to generate.

    Returns:
        Dictionary with keys:
            current_price: float
            percentiles: {"p10": [...], "p50": [...], "p90": [...]}
            metrics: {mean_final, p10_final, p50_final, p90_final,
                      volatility_annual, prob_profit}
    """
    # ── Estimate drift and volatility from historical data ───────────
    log_returns = np.diff(np.log(prices))
    mu = log_returns.mean() * TRADING_DAYS_PER_YEAR          # annualised drift
    sigma = log_returns.std() * np.sqrt(TRADING_DAYS_PER_YEAR)  # annualised vol
    dt = 1.0 / TRADING_DAYS_PER_YEAR

    S0 = float(prices[-1])  # most recent closing price

    # ── Generate random shocks and build price paths ─────────────────
    # Shape: (simulations, days)
    Z = np.random.standard_normal((simulations, days))
    daily_returns = np.exp((mu - 0.5 * sigma ** 2) * dt + sigma * np.sqrt(dt) * Z)

    # Prepend column of ones (day 0 = S0), then cumprod across time axis
    ones = np.ones((simulations, 1))
    paths = S0 * np.cumprod(np.hstack([ones, daily_returns]), axis=1)
    # Shape: (simulations, days + 1)

    # ── Extract percentile paths ─────────────────────────────────────
    p10 = np.percentile(paths, 10, axis=0)
    p50 = np.percentile(paths, 50, axis=0)
    p90 = np.percentile(paths, 90, axis=0)

    # ── Compute summary metrics ──────────────────────────────────────
    final_prices = paths[:, -1]

    metrics = {
        "mean_final": round(float(final_prices.mean()), 2),
        "p10_final": round(float(np.percentile(final_prices, 10)), 2),
        "p50_final": round(float(np.percentile(final_prices, 50)), 2),
        "p90_final": round(float(np.percentile(final_prices, 90)), 2),
        "volatility_annual": round(float(sigma), 4),
        "prob_profit": round(float((final_prices > S0).mean()), 3),
    }

    # ── Sample paths for rendering ───────────────────────────────────
    # Return a sample of paths (up to 100 paths) to keep response size reasonable
    num_paths_to_return = min(simulations, 100)
    sample_indices = np.random.choice(simulations, size=num_paths_to_return, replace=False)
    sampled_paths = paths[sample_indices]
    paths_list = [_round_list(path) for path in sampled_paths]

    return {
        "current_price": round(S0, 2),
        "percentiles": {
            "p10": _round_list(p10),
            "p50": _round_list(p50),
            "p90": _round_list(p90),
        },
        "paths": paths_list,
        "metrics": metrics,
    }


def _round_list(arr: np.ndarray, decimals: int = 2) -> List[float]:
    """Convert numpy array to a list of rounded Python floats."""
    return [round(float(x), decimals) for x in arr]
