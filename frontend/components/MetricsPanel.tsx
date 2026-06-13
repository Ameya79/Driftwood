"use client";

import React from "react";
import type { Metrics } from "@/lib/api";

interface MetricsPanelProps {
  currentPrice: number;
  metrics: Metrics;
  ticker: string;
}

interface MetricCardProps {
  label: string;
  value: string;
  subtext: string;
  subtextClass?: string;
  extraInfo?: string;
}

function MetricCard({ label, value, subtext, subtextClass = "text-neutral", extraInfo }: MetricCardProps) {
  return (
    <div className="metric-card">
      <span className="metric-label">{label}</span>
      <span className="metric-value">{value}</span>
      <div className="flex justify-between items-center mt-1">
        <span className={`metric-subtext ${subtextClass}`}>{subtext}</span>
        {extraInfo && <span className="text-xs text-slate-400 font-mono">{extraInfo}</span>}
      </div>
    </div>
  );
}

export default function MetricsPanel({
  currentPrice,
  metrics,
}: Omit<MetricsPanelProps, "ticker">) {
  const p10Return = ((metrics.p10_final - currentPrice) / currentPrice) * 100;
  const p50Return = ((metrics.p50_final - currentPrice) / currentPrice) * 100;
  const p90Return = ((metrics.p90_final - currentPrice) / currentPrice) * 100;

  const profitPct = metrics.prob_profit * 100;
  const volPct = metrics.volatility_annual * 100;

  return (
    <div className="metrics-grid">
      <MetricCard
        label="P10 Final (Bear)"
        value={`$${metrics.p10_final.toFixed(2)}`}
        subtext={`${p10Return >= 0 ? "+" : ""}${p10Return.toFixed(1)}%`}
        subtextClass={p10Return >= 0 ? "text-positive" : "text-negative"}
        extraInfo="Bearish Path"
      />

      <MetricCard
        label="P50 Final (Median)"
        value={`$${metrics.p50_final.toFixed(2)}`}
        subtext={`${p50Return >= 0 ? "+" : ""}${p50Return.toFixed(1)}%`}
        subtextClass={p50Return >= 0 ? "text-positive" : "text-negative"}
        extraInfo={`P(Profit): ${profitPct.toFixed(0)}%`}
      />

      <MetricCard
        label="P90 Final (Bull)"
        value={`$${metrics.p90_final.toFixed(2)}`}
        subtext={`${p90Return >= 0 ? "+" : ""}${p90Return.toFixed(1)}%`}
        subtextClass={p90Return >= 0 ? "text-positive" : "text-negative"}
        extraInfo={`Vol: ${volPct.toFixed(1)}%`}
      />
    </div>
  );
}
