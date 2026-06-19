"use client";

import React, { useState, useCallback, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import SimulatorForm from "@/components/SimulatorForm";
import SimulationChart from "@/components/SimulationChart";
import MetricsPanel from "@/components/MetricsPanel";
import CopyApiButton from "@/components/CopyApiButton";
import EmbedButton from "@/components/EmbedButton";
import { runSimulation, fetchStats, type SimulationResult, type SimulationParams } from "@/lib/api";

// Helper functions for robust localStorage cache management
const getCachedCalls = (): number => {
  if (typeof window !== "undefined") {
    const cached = localStorage.getItem("driftwood_total_calls");
    if (cached) {
      const val = parseInt(cached, 10);
      return isNaN(val) ? 0 : val;
    }
  }
  return 0;
};

const saveCachedCalls = (val: number) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("driftwood_total_calls", String(val));
  }
};
 
function DriftwoodApp() {
  const searchParams = useSearchParams();
  const router = useRouter();
 
  // Read initial params from URL (enables shareable links)
  const initialParams: SimulationParams = {
    ticker: searchParams.get("ticker") || "AAPL",
    days: Number(searchParams.get("days")) || 30,
    simulations: Number(searchParams.get("sims")) || 500,
  };
 
  const [params, setParams] = useState<SimulationParams>(initialParams);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Interactive Day Inspector (scroll value)
  const [inspectorDay, setInspectorDay] = useState<number>(0);
  const [showCopyPanel, setShowCopyPanel] = useState(false);
  const [showEmbedPanel, setShowEmbedPanel] = useState(false);

  const [totalCalls, setTotalCalls] = useState<number>(0);

  // Fetch global stats on mount and poll periodically
  useEffect(() => {
    // 1. Instantly restore from localStorage to prevent flash/disappearance on reload
    const cached = getCachedCalls();
    setTotalCalls(cached);

    const loadStats = async () => {
      try {
        const count = await fetchStats();
        if (typeof count === "number" && count >= 0) {
          setTotalCalls((prev) => {
            // Get fresh cached value directly from localStorage to prevent race conditions
            const latestCached = getCachedCalls();
            const currentMax = Math.max(prev, latestCached);
            const nextCount = Math.max(currentMax, count);
            saveCachedCalls(nextCount);
            return nextCount;
          });
        }
      } catch {
        // Silent fallback
      }
    };
    loadStats();

    // Poll every 10 seconds to keep counter fresh with verified API calls made globally
    const interval = setInterval(loadStats, 10000);
    return () => clearInterval(interval);
  }, []);
 
  // Auto-run if URL has params
  const [hasAutoRun, setHasAutoRun] = useState(false);
  useEffect(() => {
    if (!hasAutoRun && searchParams.get("ticker")) {
      setHasAutoRun(true);
      handleSubmit(initialParams);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
 
  // Sync inspector day when result is fetched
  useEffect(() => {
    if (result) {
      setInspectorDay(result.percentiles.p50.length - 1);
    }
  }, [result]);
 
  const handleSubmit = useCallback(
    async (newParams: SimulationParams) => {
      setParams(newParams);
      setLoading(true);
      setError(null);
 
      try {
        const data = await runSimulation(newParams);
        setResult(data);

        // Increment count locally so it updates immediately for the user
        setTotalCalls((prev) => {
          const latestCached = getCachedCalls();
          const currentMax = Math.max(prev, latestCached);
          const nextCount = currentMax + 1;
          saveCachedCalls(nextCount);
          return nextCount;
        });
 
        // Sync URL for shareable links
        const url = new URL(window.location.href);
        url.searchParams.set("ticker", newParams.ticker);
        url.searchParams.set("days", String(newParams.days));
        url.searchParams.set("sims", String(newParams.simulations));
        router.replace(url.pathname + url.search, { scroll: false });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Simulation failed");
        setResult(null);
      } finally {
        setLoading(false);
      }
    },
    [router]
  );
 
  const isEmbed = searchParams.get("embed") === "true";
 
  // Minimal layout for embed mode
  if (isEmbed && result) {
    return (
      <div className="embed-mode">
        <SimulationChart result={result} />
        <div className="embed-footer">
          <a
            href="https://driftwood.run"
            target="_blank"
            rel="noopener noreferrer"
            className="powered-by"
          >
            Powered by Driftwood
          </a>
        </div>
      </div>
    );
  }
 
  return (
    <>
      <Navbar />
      <div className="app-container">
        {/* Big Hero Header Section */}
        <header className="hero-section" style={{ padding: "30px 0 10px" }}>
          <div className="hero-logo-container" style={{ width: 120, height: 120 }}>
            <img
              src="/logo.png"
              alt="Driftwood Logo"
              className="hero-logo-image"
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
          </div>
          <h1 className="hero-title">Driftwood</h1>
          <p className="hero-subtitle">Monte Carlo Risk Engine</p>
          <div className="stats-badge">
            <span className="stats-dot" />
            <span className="stats-count">{totalCalls.toLocaleString()}</span>
            <span>simulations run to date</span>
          </div>
        </header>


      {/* Input Form */}
      <section className="form-section">
        <SimulatorForm
          onSubmit={handleSubmit}
          loading={loading}
          defaults={params}
        />
      </section>

      {/* Error Display */}
      {error && (
        <div className="error-banner" role="alert">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          {error}
        </div>
      )}

      {/* Main Content Area */}
      {result && (
        <main className="flex flex-col gap-8 w-full">
          {/* Chart Section */}
          <section className="chart-container">
            <SimulationChart result={result} />
          </section>

          {/* Day Inspector (Scroll Value Slider) */}
          <section className="inspector-section">
            <div className="inspector-header">
              <span className="inspector-title">Day Inspector</span>
              <span className="inspector-value">Day {inspectorDay} / {result.percentiles.p50.length - 1}</span>
            </div>
            <div className="slider-wrapper">
              <input
                type="range"
                min={0}
                max={result.percentiles.p50.length - 1}
                value={inspectorDay}
                onChange={(e) => setInspectorDay(Number(e.target.value))}
                className="form-range-slider"
              />
            </div>
            <div className="inspector-grid">
              <div className="inspector-stat">
                <span className="inspector-stat-label">P10 (Bear)</span>
                <span className="inspector-stat-val">${result.percentiles.p10[inspectorDay]?.toFixed(2)}</span>
              </div>
              <div className="inspector-stat">
                <span className="inspector-stat-label">P50 (Median)</span>
                <span className="inspector-stat-val" style={{ color: "var(--color-accent)" }}>
                  ${result.percentiles.p50[inspectorDay]?.toFixed(2)}
                </span>
              </div>
              <div className="inspector-stat">
                <span className="inspector-stat-label">P90 (Bull)</span>
                <span className="inspector-stat-val">${result.percentiles.p90[inspectorDay]?.toFixed(2)}</span>
              </div>
            </div>
          </section>

          {/* Three Metric Cards Side by Side */}
          <section>
            <MetricsPanel
              currentPrice={result.current_price}
              metrics={result.metrics}
            />
          </section>

          {/* Scrollable Tabular Path Data */}
          <section className="table-section">
            <div className="table-header-bar">
              <span className="table-title">Daily Price Path Reference</span>
            </div>
            <div className="table-scroll-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Trading Day</th>
                    <th>P10 (Bear)</th>
                    <th>P50 (Median)</th>
                    <th>P90 (Bull)</th>
                  </tr>
                </thead>
                <tbody>
                  {result.percentiles.p50.map((_, idx) => (
                    <tr
                      key={idx}
                      onClick={() => setInspectorDay(idx)}
                      className={`cursor-pointer ${idx === inspectorDay ? "active-row" : ""}`}
                    >
                      <td>Day {idx} {idx === 0 ? "(Initial)" : ""}</td>
                      <td className="text-negative">${result.percentiles.p10[idx]?.toFixed(2)}</td>
                      <td style={{ color: "var(--color-accent)", fontWeight: 600 }}>
                        ${result.percentiles.p50[idx]?.toFixed(2)}
                      </td>
                      <td className="text-positive">${result.percentiles.p90[idx]?.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Accordion for Developers (Copy API & Embed) */}
          <section className="actions-section">
            <div className="action-accordion">
              <button
                className="action-accordion-header"
                onClick={() => setShowCopyPanel(!showCopyPanel)}
              >
                <span>Copy API Call (cURL)</span>
                <span>{showCopyPanel ? "−" : "+"}</span>
              </button>
              {showCopyPanel && (
                <div className="action-accordion-content">
                  <CopyApiButton params={params} />
                </div>
              )}
            </div>

            <div className="action-accordion">
              <button
                className="action-accordion-header"
                onClick={() => setShowEmbedPanel(!showEmbedPanel)}
              >
                <span>Embed This Simulation</span>
                <span>{showEmbedPanel ? "−" : "+"}</span>
              </button>
              {showEmbedPanel && (
                <div className="action-accordion-content">
                  <EmbedButton params={params} />
                </div>
              )}
            </div>
          </section>
        </main>
      )}

      {/* Empty State */}
      {!result && !loading && !error && (
        <section className="empty-state">
          <h2 className="empty-title">Risk simulation ready.</h2>
          <p className="empty-description">
            Enter a ticker symbol and run to generate stochastic price trajectories based on historical drift and volatility.
          </p>
        </section>
      )}
      {/* Search Engine Optimization (SEO) & AI Context Section */}
      <section className="seo-content-section" style={{ maxWidth: "1200px", margin: "40px auto 20px", padding: "40px 24px 20px", borderTop: "1px solid var(--color-border)" }}>
        <h2 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: "16px", color: "var(--color-text)" }}>DRIFTWOOD | Monte Carlo Stock Simulation & Risk Engine API</h2>
        
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px", color: "var(--color-text-muted)", fontSize: "0.9rem", lineHeight: "1.6" }}>
          <div>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 600, marginBottom: "8px", color: "var(--color-text)" }}>DRIFTWOOD API</h3>
            <p>
              Driftwood is an open-source, API-first quantitative finance risk engine written in Python (FastAPI). It enables developers and quants to calibrate stock price forecast models on historical daily market data without complex setups, API keys, or database integrations.
            </p>
          </div>
          <div>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 600, marginBottom: "8px", color: "var(--color-text)" }}>MONTECARLO PYTHON</h3>
            <p>
              By utilizing NumPy vectorization, our engine runs thousands of Monte Carlo trajectories in parallel. Instead of executing slow loops in Python, we generate high-speed random walk paths across standard normal matrices, projecting price bounds in milliseconds.
            </p>
          </div>
          <div>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 600, marginBottom: "8px", color: "var(--color-text)" }}>GEOMETRIC BROWNIAN MOTION</h3>
            <p>
              The engine simulates stock price paths using Geometric Brownian Motion (GBM). It extracts historical asset drift (average rate of return) and volatility (standard deviation of return logs) to project P10 (bearish), P50 (median), and P90 (bullish) price envelopes.
            </p>
          </div>
        </div>

        <div style={{ marginTop: "24px", color: "var(--color-text-muted)", fontSize: "0.9rem", lineHeight: "1.6" }}>
          <h3 style={{ fontSize: "1.05rem", fontWeight: 600, marginBottom: "8px", color: "var(--color-text)" }}>Exposing the API Programmatically</h3>
          <p>
            You can make a stateless HTTP POST request to the <code>/v1/simulate</code> endpoint. Send a JSON body containing the stock ticker, days to forecast, and number of simulations. The API returns full percentiles, sample paths, annualized volatility, and probability of profit in JSON format. View our <Link href="/docs" style={{ color: "var(--color-accent)", textDecoration: "underline" }}>API Documentation</Link> for JavaScript, Python, cURL, and HTML iframe widget integration code.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-text" style={{ display: "flex", justifyContent: "center", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
          <span>Open source under MIT License</span>
          <span>·</span>
          <a
            href="https://github.com/Ameya79/Driftwood"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link"
            style={{ fontWeight: 600 }}
          >
            ★ Star on GitHub
          </a>
          <span>·</span>
          <Link href="/docs" className="footer-link">
            API Docs
          </Link>
          <span>·</span>
          <span>Created by</span>
          <a
            href="https://www.linkedin.com/in/ameya-kulkarni-a31b74246?utm_source=share_via&utm_content=profile&utm_medium=member_android"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link"
          >
            Ameya Kulkarni
          </a>
        </div>
        <div className="footer-text footer-disclaimer">
          Simulations are mathematical representations based on Geometric Brownian Motion and do not constitute financial advice.
        </div>
      </footer>
    </div>
    </>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="app-container">
          <div className="hero-section">
            <h1 className="hero-title">Driftwood</h1>
          </div>
          <div className="flex items-center justify-center p-20">
            <div className="spinner" style={{ width: 24, height: 24 }} />
          </div>
        </div>
      }
    >
      <DriftwoodApp />
    </Suspense>
  );
}
