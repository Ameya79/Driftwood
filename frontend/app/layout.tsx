import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DRIFTWOOD | Monte Carlo Stock Simulation & Risk Engine API",
  description:
    "Open-source Monte Carlo stock simulation and risk engine in Python (FastAPI). Calibrate and run Geometric Brownian Motion (GBM) trajectories on real market data. Free, stateless API for quant finance and options pricing.",
  keywords: [
    "DRIFTWOOD",
    "DRIFTWOOD API",
    "MONTECARLO PYTHON",
    "MONTE CARLO SIMULATION",
    "GBM PYTHON",
    "STOCK SIMULATOR",
    "GEOMETRIC BROWNIAN MOTION",
    "RISK ENGINE",
    "QUANT FINANCE",
    "VALUE AT RISK",
    "driftwood",
    "driftwood api",
    "montecarlo python",
    "monte carlo python",
    "gbm",
    "options pricing python",
    "stock risk model",
  ],
  verification: {
    google: "8VloNPk7vdTnnOUBoNUVCvYdM3BeHPAbQwBPnncN3sw",
  },
  openGraph: {
    title: "DRIFTWOOD | Monte Carlo Stock Simulation & Risk Engine API",
    description:
      "Open-source Monte Carlo stock simulation and risk engine in Python (FastAPI). Calibrate and run Geometric Brownian Motion (GBM) trajectories.",
    type: "website",
    url: "https://driftwood-docs.vercel.app",
  },
  twitter: {
    card: "summary_large_image",
    title: "DRIFTWOOD | Monte Carlo Stock Simulation & Risk Engine API",
    description:
      "Open-source Monte Carlo stock simulation and risk engine in Python (FastAPI). Calibrate and run Geometric Brownian Motion (GBM) trajectories.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Driftwood",
    "operatingSystem": "All",
    "applicationCategory": "FinanceApplication",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
    },
    "description": "Open-source Monte Carlo simulation engine for equity price paths using Geometric Brownian Motion (GBM).",
    "softwareVersion": "1.0.0",
    "license": "https://opensource.org/licenses/MIT",
    "creator": {
      "@type": "Organization",
      "name": "Driftwood Open Source Team",
    },
  };

  return (
    <html lang="en">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}


