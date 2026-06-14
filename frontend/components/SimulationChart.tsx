"use client";

import React, { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import type { SimulationResult } from "@/lib/api";

interface SimulationChartProps {
  result: SimulationResult;
}

const COLORS = {
  p10: "#ef4444",      // red
  p50: "#C4956A",      // warm driftwood brown
  p90: "#16a34a",      // green
  grid: "#e2e8f0",     // thin border gray
  reference: "#64748b", // slate gray for current price line
  tooltip: {
    bg: "#ffffff",
    border: "#e2e8f0",
    text: "#0f172a",
  },
};

export default function SimulationChart({ result }: SimulationChartProps) {
  // Transform percentile arrays and path samples into Recharts format
  const chartData = useMemo(() => {
    const len = result.percentiles.p50.length;
    return Array.from({ length: len }, (_, i) => {
      const dataPoint: Record<string, number> = {
        day: i,
        p10: result.percentiles.p10[i],
        p50: result.percentiles.p50[i],
        p90: result.percentiles.p90[i],
      };

      if (result.paths) {
        result.paths.forEach((path, pathIdx) => {
          dataPoint[`path_${pathIdx}`] = path[i];
        });
      }

      return dataPoint;
    });
  }, [result]);

  // Y-axis domain with 5% padding
  const [yMin, yMax] = useMemo(() => {
    const allValues = [
      ...result.percentiles.p10,
      ...result.percentiles.p90,
    ];
    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    const padding = (max - min) * 0.05;
    return [Math.max(0, Math.floor(min - padding)), Math.ceil(max + padding)];
  }, [result]);

  return (
    <div className="w-full">
      <div className="chart-header">
        <h2 className="chart-title">
          {result.ticker}
          <span className="ml-2 text-xs font-normal text-slate-400">Monte Carlo Simulation</span>
        </h2>
        <div className="chart-legend">
          <span className="legend-item">
            <span className="legend-line" style={{ background: COLORS.p90 }} />
            P90 (Bull)
          </span>
          <span className="legend-item">
            <span className="legend-line" style={{ background: COLORS.p50 }} />
            P50 (Median)
          </span>
          <span className="legend-item">
            <span className="legend-line" style={{ background: COLORS.p10 }} />
            P10 (Bear)
          </span>
        </div>
      </div>

      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 10, right: 5, left: -10, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="0"
              stroke={COLORS.grid}
              vertical={false}
            />

            <XAxis
              dataKey="day"
              tick={{ fill: "#64748b", fontSize: 10, fontFamily: "var(--font-sans)" }}
              axisLine={{ stroke: COLORS.grid }}
              tickLine={{ stroke: COLORS.grid }}
              label={{
                value: "Trading Days",
                position: "insideBottom",
                offset: -5,
                fill: "#94a3b8",
                fontSize: 10,
              }}
            />

            <YAxis
              domain={[yMin, yMax]}
              tick={{ fill: "#64748b", fontSize: 10, fontFamily: "var(--font-sans)" }}
              axisLine={{ stroke: COLORS.grid }}
              tickLine={{ stroke: COLORS.grid }}
              tickFormatter={(v: number) => `$${v.toFixed(0)}`}
              width={55}
            />

            <Tooltip
              cursor={{ stroke: "#e2e8f0", strokeWidth: 1 }}
              contentStyle={{
                backgroundColor: COLORS.tooltip.bg,
                border: `1px solid ${COLORS.tooltip.border}`,
                borderRadius: "0px",
                fontFamily: "var(--font-sans)",
                fontSize: "12px",
                color: COLORS.tooltip.text,
                boxShadow: "none",
              }}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              labelFormatter={(label: any) => `Day ${label}`}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any, name: any) => {
                if (name === "p10" || name === "p50" || name === "p90") {
                  return [
                    typeof value === "number" ? `$${value.toFixed(2)}` : value,
                    name === "p10" ? "P10 (Bear)" : name === "p50" ? "P50 (Median)" : "P90 (Bull)"
                  ];
                }
                return null;
              }}
            />

            {/* Current price reference line */}
            <ReferenceLine
              y={result.current_price}
              stroke={COLORS.reference}
              strokeDasharray="4 4"
              strokeWidth={1}
              label={{
                value: `Start: $${result.current_price.toFixed(2)}`,
                position: "insideTopRight",
                fill: COLORS.reference,
                fontSize: 10,
              }}
            />

            {/* Render 100 individual simulation paths in background */}
            {result.paths &&
              result.paths.map((_, idx) => (
                <Line
                  key={`path_${idx}`}
                  type="monotone"
                  dataKey={`path_${idx}`}
                  stroke="rgba(196, 149, 106, 0.08)"
                  strokeWidth={1}
                  dot={false}
                  activeDot={false}
                  isAnimationActive={false}
                />
              ))}

            {/* P10 — bearish envelope */}
            <Line
              type="monotone"
              dataKey="p10"
              name="p10"
              stroke={COLORS.p10}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 3, fill: COLORS.p10, stroke: "#ffffff", strokeWidth: 1 }}
              isAnimationActive={false}
            />

            {/* P50 — median path (accent color, bold) */}
            <Line
              type="monotone"
              dataKey="p50"
              name="p50"
              stroke={COLORS.p50}
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 4, fill: COLORS.p50, stroke: "#ffffff", strokeWidth: 1 }}
              isAnimationActive={false}
            />

            {/* P90 — bullish envelope */}
            <Line
              type="monotone"
              dataKey="p90"
              name="p90"
              stroke={COLORS.p90}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 3, fill: COLORS.p90, stroke: "#ffffff", strokeWidth: 1 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
