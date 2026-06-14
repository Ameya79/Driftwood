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
import { runSimulation, type SimulationResult, type SimulationParams } from "@/lib/api";
 
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
