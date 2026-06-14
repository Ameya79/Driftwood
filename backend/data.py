"""
Historical price data layer.

Uses yfinance to fetch 1 year of daily closing prices.
No API key required — yfinance scrapes Yahoo Finance directly.
"""

import time
import threading
import numpy as np
import yfinance as yf

# Thread-safe in-memory cache for downloaded historical price data
# Key: ticker (str), Value: (timestamp: float, prices: np.ndarray)
_prices_cache = {}
_cache_lock = threading.Lock()
CACHE_TTL_SECONDS = 3600  # 1 hour cache duration


def get_historical_prices(ticker: str, period: str = "1y") -> np.ndarray:
    """
    Fetch daily closing prices for a ticker, using a local cache to prevent yfinance rate limiting.

    Args:
        ticker: Stock ticker symbol (e.g. "AAPL").
        period: Look-back period for yfinance (default "1y" ≈ 252 trading days).

    Returns:
        1-D numpy array of adjusted closing prices, oldest → newest.

    Raises:
        ValueError: If the ticker is not found or returns no data.
    """
    now = time.time()
    ticker_upper = ticker.upper().strip()

    # 1. Try reading from cache
    with _cache_lock:
        if ticker_upper in _prices_cache:
            cached_time, cached_prices = _prices_cache[ticker_upper]
            if now - cached_time < CACHE_TTL_SECONDS:
                return cached_prices

    # 2. Cache miss: Download from Yahoo Finance
    df = yf.download(
        ticker_upper,
        period=period,
        auto_adjust=True,
        progress=False,
    )

    if df.empty:
        raise ValueError(f"Ticker '{ticker_upper}' not found or no data available")

    closes = df["Close"].dropna()

    if len(closes) < 20:
        raise ValueError(
            f"Insufficient data for '{ticker_upper}': need ≥ 20 trading days, got {len(closes)}"
        )

    prices = closes.values.flatten().astype(np.float64)

    if np.any(prices <= 0):
        raise ValueError(
            f"Invalid price data for '{ticker_upper}': historical prices must be strictly positive"
        )

    # 3. Write successful download to cache
    with _cache_lock:
        _prices_cache[ticker_upper] = (now, prices)

    return prices

