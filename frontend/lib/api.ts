/**
 * API client for the Driftwood simulation engine.
 *
 * In development, requests go to /api/v1/* which Next.js rewrites
 * to the Cloudflare Worker (or directly to FastAPI in local dev).
 */

// ── Types ───────────────────────────────────────────────────────────────

export interface SimulationParams {
  ticker: string;
  days: number;
  simulations: number;
}

export interface Metrics {
  mean_final: number;
  p10_final: number;
  p50_final: number;
  p90_final: number;
  volatility_annual: number;
  prob_profit: number;
}

export interface Percentiles {
  p10: number[];
  p50: number[];
  p90: number[];
}

export interface SimulationResult {
  ticker: string;
  current_price: number;
  percentiles: Percentiles;
  metrics: Metrics;
  paths: number[][];
}

export interface ApiError {
  detail:
    | string
    | Array<{
        loc: (string | number)[];
        msg: string;
        type: string;
      }>;
}

// ── API Calls ───────────────────────────────────────────────────────────

const API_BASE = "/api/v1";

function parseApiError(err: ApiError, status: number): string {
  if (!err || !err.detail) {
    return `API error: ${status}`;
  }
  if (typeof err.detail === "string") {
    return err.detail;
  }
  if (Array.isArray(err.detail)) {
    return err.detail
      .map((d) => {
        const field = d.loc && d.loc.length > 1 ? `${d.loc[d.loc.length - 1]}: ` : "";
        return `${field}${d.msg}`;
      })
      .join(", ");
  }
  return `API error: ${status}`;
}

export async function runSimulation(
  params: SimulationParams
): Promise<SimulationResult> {
  const res = await fetch(`${API_BASE}/simulate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const err: ApiError = await res.json();
    throw new Error(parseApiError(err, res.status));
  }

  return res.json();
}

export async function fetchMetrics(
  params: SimulationParams
): Promise<{ ticker: string; current_price: number; metrics: Metrics }> {
  const res = await fetch(`${API_BASE}/metrics`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const err: ApiError = await res.json();
    throw new Error(parseApiError(err, res.status));
  }

  return res.json();
}

/**
 * Generate the curl command that reproduces a simulation.
 * Used by the "Copy API call" button.
 */
export function generateCurlCommand(
  params: SimulationParams,
  baseUrl = "https://driftwood.run"
): string {
  const body = JSON.stringify(params);
  return `curl -X POST ${baseUrl}/api/v1/simulate \\
  -H "Content-Type: application/json" \\
  -d '${body}'`;
}

/**
 * Generate the embeddable iframe snippet.
 * Used by the "Embed this" button.
 */
export function generateEmbedSnippet(
  params: SimulationParams,
  baseUrl = "https://driftwood.run"
): string {
  return `<iframe
  src="${baseUrl}/?ticker=${params.ticker}&days=${params.days}&sims=${params.simulations}&embed=true"
  width="100%"
  height="450"
  frameborder="0"
  style="border-radius: 8px; border: 1px solid #e5e7eb;"
></iframe>`;
}
