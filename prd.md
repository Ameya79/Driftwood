# PRD — Driftwood: Open-Source Monte Carlo Risk Engine

## 1. The Actual Problem

Most open-source quant tools fall into one of two traps:

1. **Too academic** — QuantLib is brilliant but it's C++, undocumented for beginners, and you need a PhD just to compile it
2. **Too shallow** — Every "Monte Carlo simulator" tutorial on Medium is a 50-line script with no API, no deployment, and no real use

The result: developers building fintech side projects, finance students writing theses, and algo traders stress-testing strategies all end up doing the same thing — copy-pasting a GBM formula from Stack Overflow into a notebook that dies the moment they close it.

**There is no well-maintained, self-hostable, API-first Monte Carlo risk engine with a clean public interface.** That's the gap.

---

## 2. What Driftwood Is

An open-source Monte Carlo simulation engine for equity price paths — packaged as:

- **A hosted web UI** (the demo, at `driftwood.run`) that anyone can use instantly
- **A self-hostable REST API** that developers can drop into their own app, backtest, or dashboard
- **An embeddable widget** (`<iframe>` or `<script>` tag) that quant bloggers and educators can put inside their own pages

The web UI is the discovery surface. The API is the product people actually build on.

---

## 3. Why This Builds Community

The open-source tools that actually get stars share three traits. Driftwood has all three:

| Trait | How Driftwood has it |
|---|---|
| **Immediately usable** | Hosted demo at `driftwood.run` — no install, no account, result in 3 seconds |
| **Hackable and extensible** | Clean FastAPI backend — swap GBM for Heston model, GARCH, custom process with one file change |
| **Fills a distribution gap** | r/algotrading, r/quant, HackerNews "Show HN" — this is the exact kind of tool those communities share |

---

## 4. Target Audience (in priority order)

### Primary: Developers building fintech side projects
They need Monte Carlo as a component, not a product. They will `git clone`, self-host, and potentially contribute back. These are the **star givers and forkers**.

**Their pain:** "I want to add portfolio risk simulation to my app but I don't want to pay for a quant data vendor and I don't want to write the math myself."

**Driftwood answer:** Clone, `docker compose up`, call `/simulate`. Done.

### Secondary: Quant/finance students and self-learners
They're learning stochastic processes, portfolio theory, or algo trading. They need something real to point at — not a notebook, not a screenshot.

**Their pain:** "I understand the GBM formula in my textbook but I've never seen it running on real data."

**Driftwood answer:** Live demo with real tickers. Open source so they can read exactly how the math maps to code.

### Tertiary: Finance educators and quant bloggers
They write about options pricing, VaR, portfolio risk. They want an interactive element inside their article/course — not a static image.

**Their pain:** "I want my readers to be able to run a simulation without leaving the page."

**Driftwood answer:** Embeddable widget — one script tag, their readers can interact with a live simulation inline.

---

## 5. Community Growth Levers

These are the concrete actions that translate to numbers (stars, forks, installs, page views):

### 5.1 GitHub (stars + forks)
- MIT license, clean README with animated GIF of a simulation running
- One-command local setup: `docker compose up` — everyone can run it in under 2 minutes
- **"Self-host in 5 minutes"** guide targeting Railway, Render, Fly.io
- Modular simulation engine — clearly documented extension points so contributors can add models (Heston, GARCH, Jump Diffusion) as PRs
- Issue labels: `good first issue`, `model-request`, `integrations`

### 5.2 Hosted Demo — `driftwood.run` (page views + return users)
- Shareable simulation URLs (`driftwood.run/?ticker=NVDA&days=60`)
- "Embed this simulation" button that generates an iframe snippet
- "Powered by Driftwood" link on embedded widgets → back-link traffic loop
- No account required, ever, for the hosted demo

### 5.3 Community Channels (organic reach)
- **"Show HN"** post on Hacker News at launch (this kind of tool gets 100–400 points if framed as "I built a self-hostable quant risk API")
- Post to **r/algotrading**, **r/quant**, **r/SideProject** — these subreddits upvote financial tools heavily
- **Dev.to / Hashnode article** titled: "I rebuilt the core of a bank's risk engine in 200 lines of Python"
- A **"quant learning path"** page on the site that explains GBM, log returns, volatility from first principles — drives SEO traffic from people Googling "monte carlo stock simulation python"

### 5.4 API Downloads Metric
- Publish a Docker image to Docker Hub (`driftwood/api`) — pulls are a trackable metric
- Publish Python package to PyPI (`pip install driftwood-sim`) — download count is visible and shareable
- npm package for the embeddable widget (`npm install driftwood-widget`)

---

## 6. Core Features (v1)

### 6.1 Hosted UI (driftwood.run)
- Ticker input + days + simulations
- Simulation chart: all paths (opacity 0.06) + P10/P50/P90 bold overlays
- Metrics: current price, mean final, P10/P90 finals, annualised vol, P(profit)
- Shareable URL on every run
- "Copy API call" button — shows the `curl` command that produced this result
- "Embed this" button — generates iframe snippet

### 6.2 Public REST API
- `POST /simulate` — full simulation run, returns paths + metrics
- `POST /metrics` — returns only the metrics object (lighter, for integrations that don't need path data)
- `GET /health` — for self-hosters to verify their deployment
- API versioned at `/v1/` from day one — communicates that this is a real project, not a demo

### 6.3 Embeddable Widget
- `<script src="https://driftwood.run/widget.js" data-ticker="AAPL" data-days="30"></script>`
- Renders an iframe with a minimal chart + metrics, zero config
- Dark and light theme variants

### 6.4 Self-Host Package
- `docker compose up` spins the full stack (FastAPI + Worker equivalent via nginx, Next.js)
- `docker-compose.yml` committed to repo root
- Environment variable driven config — one `.env` file

---

## 7. Non-Goals (v1)

- No auth, no user accounts
- No portfolio-level simulation (multi-asset) — v2
- No options pricing (Black-Scholes, Greeks) — v2
- No backtesting — v3
- No paid tier — v1 is 100% free and open. Monetisation is a v3 conversation.

---

## 8. Success Metrics (3 months post-launch) ignore for understanding 

| Metric | Target | How to track |
|---|---|---|
| GitHub Stars | 300+ | GitHub Insights |
| Docker Hub pulls | 500+ | Docker Hub dashboard |
| PyPI downloads | 1,000+ | pypistats.org |
| driftwood.run monthly visitors | 5,000+ | Vercel Analytics (free) |
| Embedded widgets deployed | 20+ | Referrer logs on widget.js requests |
| "Show HN" points | 100+ | Hacker News |

---

## 9. UX & Design

- **Aesthetic:** Minimal, white-mode first, monospace accents — Bloomberg terminal meets Linear.app, inspired by flatn color and actual driftwood with its logo being a minimal actual driftwood flat colored branching, friendly aesthetic 
- **Name:** *Driftwood* — a natural reference to drift (the μ term in GBM), memorable, available as a domain
- **Layout:** Single page. Top: input bar. Center: full-width chart. Bottom: metrics row. Right sidebar on desktop: "Copy API call" + "Embed this"
- **Mobile:** Responsive, chart horizontally scrollable
- **Copy tone:** Technical but accessible. No financial advice disclaimers in the UI copy. Developers, not investors.

---

## 10. Constraints

- Frontend (nextjs): minimal npm deps — `next`, `react`, `react-dom`, `recharts` only
- Backend: stateless, no DB in v1
- All components deployable on free tiers
- Widget must load < 50KB (no bundling Recharts into it — use a lightweight canvas renderer)