"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function DocsPage() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [origin, setOrigin] = useState("http://localhost:8000");
  const [frontendOrigin, setFrontendOrigin] = useState("http://localhost:3000");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || (window.location.origin + "/api");
      setOrigin(apiBase);
      setFrontendOrigin(window.location.origin);
    }
  }, []);

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const curlCode = `curl -X POST ${origin}/v1/simulate \\
  -H "Content-Type: application/json" \\
  -d '{"ticker": "AAPL", "days": 30, "simulations": 100}'`;

  const jsCode = `fetch("${origin}/v1/simulate", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    ticker: "AAPL",
    days: 30,
    simulations: 100
  })
})
.then(res => res.json())
.then(data => {
  console.log("Current Price:", data.current_price);
  console.log("P50 (Median) Path:", data.percentiles.p50);
});`;

  const pythonCode = `import urllib.request
import json

url = "${origin}/v1/simulate"
payload = {"ticker": "AAPL", "days": 30, "simulations": 100}

req = urllib.request.Request(
    url,
    data=json.dumps(payload).encode("utf-8"),
    headers={"Content-Type": "application/json"},
    method="POST"
)

with urllib.request.urlopen(req) as response:
    data = json.loads(response.read().decode("utf-8"))
    print(f"Median final price: {data['metrics']['p50_final']}")`;

  const embedCode = `<iframe
  src="${frontendOrigin}/?ticker=AAPL&days=30&sims=100&embed=true"
  width="100%"
  height="420"
  frameborder="0"
  style="border: 1px solid #e2e8f0;"
></iframe>`;

  return (
    <>
      <Navbar />
      
      <div className="docs-layout-container">
        {/* Sticky left sidebar for desktop (laptop) */}
        <aside className="docs-sidebar-nav">
          <div className="docs-nav-group">
            <span className="docs-nav-title">Welcome</span>
            <div className="docs-nav-links">
              <a href="#intro" className="docs-nav-link">Introduction</a>
            </div>
          </div>

          <div className="docs-nav-group">
            <span className="docs-nav-title">API Reference</span>
            <div className="docs-nav-links">
              <a href="#endpoint" className="docs-nav-link">POST /v1/simulate</a>
              <a href="#format" className="docs-nav-link">Response JSON</a>
            </div>
          </div>

          <div className="docs-nav-group">
            <span className="docs-nav-title">Integrations</span>
            <div className="docs-nav-links">
              <a href="#curl" className="docs-nav-link">cURL (Terminal)</a>
              <a href="#js" className="docs-nav-link">JavaScript Fetch</a>
              <a href="#python" className="docs-nav-link">Python Script</a>
              <a href="#embed" className="docs-nav-link">HTML Iframe</a>
            </div>
          </div>

          <div className="docs-nav-group">
            <span className="docs-nav-title">Best Practices</span>
            <div className="docs-nav-links">
              <a href="#caching" className="docs-nav-link">API Caching & Limits</a>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="docs-main-content">
          {/* Header */}
          <header className="hero-section" style={{ padding: "0 0 20px", textAlign: "left", alignItems: "flex-start", gap: 8 }}>
            <h1 className="hero-title" style={{ fontSize: 36, marginTop: 0 }}>Documentation</h1>
            <p className="hero-subtitle" style={{ fontSize: 13, color: "var(--color-accent)", fontWeight: 600 }}>Driftwood API Guide</p>
          </header>

          {/* Intro Section */}
          <section id="intro" className="flex flex-col gap-3">
            <h2 className="text-xl font-bold tracking-tight border-b border-slate-100 pb-2">Introduction</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Welcome to Driftwood! This API allows you to programmatically generate thousands of stock price trajectories to model equity risk, calculate Value-at-Risk (VaR), and estimate options pricing directly in your own applications. Under the hood, Driftwood runs a Monte Carlo simulation engine powered by Geometric Brownian Motion (GBM) using historical stock drift and volatility.
            </p>
            <p className="text-sm text-slate-600 leading-relaxed">
              Our API is entirely stateless and does not require any authentication keys. You can plug it directly into your dashboards, financial planning tools, options calculators, or research notebooks to bring interactive probability models to your users.
            </p>
          </section>

          {/* API Basics */}
          <section id="endpoint" className="flex flex-col gap-4">
            <h2 className="text-xl font-bold tracking-tight border-b border-slate-100 pb-2">The Simulator Endpoint</h2>
            <p className="text-sm text-slate-600">
              Send a <strong>POST</strong> request to <code>/v1/simulate</code> to run a simulation.
            </p>

            <div className="bg-slate-50 border border-slate-100 p-4 font-mono text-xs flex flex-col gap-2">
              <div><strong>Request URL:</strong></div>
              <div className="text-slate-800">{origin}/v1/simulate</div>
              <div className="mt-2"><strong>Request Body parameters:</strong></div>
              <ul className="list-disc pl-4 text-slate-600 flex flex-col gap-1">
                <li><code>ticker</code> (string): The stock symbol in uppercase (e.g. <code>&quot;AAPL&quot;</code>).</li>
                <li><code>days</code> (number): How many future trading days to simulate (7 to 252 days).</li>
                <li><code>simulations</code> (number): How many random paths to simulate (10 to 1000 paths).</li>
              </ul>
            </div>
          </section>

          {/* Ways to use */}
          <section id="examples" className="flex flex-col gap-6">
            <h2 className="text-xl font-bold tracking-tight border-b border-slate-100 pb-2">Ways to Use the API</h2>

            {/* 1. cURL */}
            <div id="curl" className="flex flex-col gap-2">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-700">1. In your Terminal (cURL)</h3>
              <p className="text-xs text-slate-500">Perfect for quick testing inside any terminal.</p>
              <div className="code-block-wrapper">
                <button className="copy-btn" onClick={() => handleCopy(curlCode, "curl")}>
                  {copiedCode === "curl" ? "COPIED" : "COPY"}
                </button>
                <pre className="code-block-content"><code>{curlCode}</code></pre>
              </div>
            </div>

            {/* 2. JavaScript Fetch */}
            <div id="js" className="flex flex-col gap-2">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-700">2. In JavaScript / TypeScript</h3>
              <p className="text-xs text-slate-500">Easily call the API directly from your web application.</p>
              <div className="code-block-wrapper">
                <button className="copy-btn" onClick={() => handleCopy(jsCode, "js")}>
                  {copiedCode === "js" ? "COPIED" : "COPY"}
                </button>
                <pre className="code-block-content"><code>{jsCode}</code></pre>
              </div>
            </div>

            {/* 3. Python */}
            <div id="python" className="flex flex-col gap-2">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-700">3. In Python</h3>
              <p className="text-xs text-slate-500">Ideal for data science scripts, Google Colab notebooks, or Django/Flask backends.</p>
              <div className="code-block-wrapper">
                <button className="copy-btn" onClick={() => handleCopy(pythonCode, "python")}>
                  {copiedCode === "python" ? "COPIED" : "COPY"}
                </button>
                <pre className="code-block-content"><code>{pythonCode}</code></pre>
              </div>
            </div>

            {/* 4. HTML Iframe Embed */}
            <div id="embed" className="flex flex-col gap-2">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-700">4. Embedding the Interactive Widget</h3>
              <p className="text-xs text-slate-500">Embed a fully interactive, live simulation chart directly into any blog, article, or site.</p>
              <div className="code-block-wrapper">
                <button className="copy-btn" onClick={() => handleCopy(embedCode, "embed")}>
                  {copiedCode === "embed" ? "COPIED" : "COPY"}
                </button>
                <pre className="code-block-content"><code>{embedCode}</code></pre>
              </div>
            </div>
          </section>

          {/* Response Format */}
          <section id="format" className="flex flex-col gap-3">
            <h2 className="text-xl font-bold tracking-tight border-b border-slate-100 pb-2">Response JSON Structure</h2>
            <p className="text-sm text-slate-600">
              The API returns a clean JSON object containing:
            </p>
            <ul className="list-disc pl-6 text-sm text-slate-600 flex flex-col gap-2">
              <li><code>ticker</code>: The ticker symbol.</li>
              <li><code>current_price</code>: The last recorded closing price.</li>
              <li><code>percentiles</code>: Arrays for the <strong>P10</strong> (Bearish), <strong>P50</strong> (Median), and <strong>P90</strong> (Bullish) price paths.</li>
              <li><code>paths</code>: A list of 100 sample simulated raw paths for background visual rendering.</li>
              <li><code>metrics</code>: Summary stats including <code>mean_final</code>, <code>volatility_annual</code>, and <code>prob_profit</code> (probability that the price ends higher than the starting price).</li>
            </ul>
          </section>

          {/* API Caching & Limits */}
          <section id="caching" className="flex flex-col gap-3">
            <h2 className="text-xl font-bold tracking-tight border-b border-slate-100 pb-2">Rate Limits & Client-Side Caching</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              To guarantee high availability and protect upstream resources, the Driftwood API enforces a rate limit of <strong>100 requests per 5 seconds per IP address</strong>. If you exceed this rate, the API will return an HTTP <code>429 Too Many Requests</code> response.
            </p>
            <p className="text-sm text-slate-600 leading-relaxed">
              We strongly recommend caching simulation data in your own clients or backend proxy layers. Since stock trajectories rely on daily historical prices, running multiple identical simulations within the same day is redundant.
            </p>
            
            <div className="bg-slate-50 border border-slate-100 p-4 flex flex-col gap-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Caching Strategies</h4>
              <ul className="list-disc pl-4 text-xs text-slate-600 flex flex-col gap-2">
                <li>
                  <strong>Local Storage (Browser)</strong>: For client-only apps, cache simulation payloads in <code>localStorage</code> or <code>sessionStorage</code> using a composite key like <code>driftwood:{"{"}ticker{"}"}:{"{"}days{"}"}:{"{"}sims{"}"}</code>. Set an expiration of 1-4 hours.
                </li>
                <li>
                  <strong>Redis / Memcached (Backend)</strong>: If calling Driftwood from your own server, cache the JSON payloads in a key-value store using the same composite key. We recommend a <strong>5-minute to 1-hour Time-to-Live (TTL)</strong>.
                </li>
                <li>
                  <strong>In-Memory Caches</strong>: For Python/Node backends, use in-memory cache helpers like Python&apos;s <code>functools.lru_cache</code> or Node&apos;s <code>memory-cache</code> to prevent redundant outgoing HTTP requests.
                </li>
              </ul>
            </div>
          </section>

          {/* Footer */}
          <footer className="app-footer" style={{ borderTop: "1px solid var(--color-border)", marginTop: 40, paddingTop: 24 }}>
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
              <Link href="/" className="footer-link">
                Simulator
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
          </footer>
        </main>
      </div>
    </>
  );
}

