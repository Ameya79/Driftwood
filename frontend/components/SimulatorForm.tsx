"use client";

import React, { useState, useCallback } from "react";
import { generateCurlCommand } from "@/lib/api";

interface SimulatorFormProps {
  onSubmit: (params: {
    ticker: string;
    days: number;
    simulations: number;
  }) => void;
  loading: boolean;
  defaults: {
    ticker: string;
    days: number;
    simulations: number;
  };
}

export default function SimulatorForm({
  onSubmit,
  loading,
  defaults,
}: SimulatorFormProps) {
  const [ticker, setTicker] = useState(defaults.ticker);
  const [days, setDays] = useState(defaults.days);
  const [simulations, setSimulations] = useState(defaults.simulations);
  const [copied, setCopied] = useState(false);

  const handleCopyApi = useCallback(() => {
    const curlCommand = generateCurlCommand({
      ticker: ticker.toUpperCase().trim() || "AAPL",
      days,
      simulations,
    });
    navigator.clipboard.writeText(curlCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [ticker, days, simulations]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      onSubmit({
        ticker: ticker.toUpperCase().trim(),
        days,
        simulations,
      });
    },
    [ticker, days, simulations, onSubmit]
  );

  return (
    <form onSubmit={handleSubmit} className="simulator-form">
      <div className="form-inputs-container">
        {/* Ticker Row: Ticker input left, Submit button right */}
        <div className="ticker-input-row">
          <div className="ticker-input-wrapper">
            <input
              id="ticker-input"
              type="text"
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              placeholder="ENTER TICKER (e.g. AAPL)"
              maxLength={5}
              className="ticker-input-field"
              disabled={loading}
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          <button
            id="run-simulation-btn"
            type="submit"
            className="run-button"
            disabled={loading || ticker.trim().length === 0}
          >
            {loading ? (
              <>
                <span className="spinner" />
                SIMULATING
              </>
            ) : (
              "RUN"
            )}
          </button>
          <button
            type="button"
            onClick={handleCopyApi}
            className="run-button secondary"
            disabled={ticker.trim().length === 0}
          >
            {copied ? "COPIED" : "COPY API"}
          </button>
        </div>

        {/* Parameters Sliders Row */}
        <div className="params-sliders-row">
          {/* Days */}
          <div className="param-group">
            <div className="param-header">
              <span>Days to simulate</span>
              <span className="param-value-box">{days}d</span>
            </div>
            <div className="slider-wrapper">
              <input
                id="days-slider"
                type="range"
                min={7}
                max={252}
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="form-range-slider"
                disabled={loading}
              />
            </div>
          </div>

          {/* Simulations */}
          <div className="param-group">
            <div className="param-header">
              <span>Paths (Simulations)</span>
              <span className="param-value-box">{simulations}</span>
            </div>
            <div className="slider-wrapper">
              <input
                id="sims-slider"
                type="range"
                min={10}
                max={1000}
                step={10}
                value={simulations}
                onChange={(e) => setSimulations(Number(e.target.value))}
                className="form-range-slider"
                disabled={loading}
              />
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
