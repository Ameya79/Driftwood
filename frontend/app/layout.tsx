import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Driftwood — Monte Carlo Risk Engine",
  description:
    "Open-source Monte Carlo simulation engine for equity price paths. Run GBM simulations on real market data with a clean API and interactive charts.",
  keywords: [
    "monte carlo simulation",
    "stock simulation",
    "GBM",
    "geometric brownian motion",
    "risk engine",
    "quant finance",
    "open source",
  ],
  verification: {
    google: "8VloNPk7vdTnnOUBoNUVCvYdM3BeHPAbQwBPnncN3sw",
  },
  openGraph: {
    title: "Driftwood — Monte Carlo Risk Engine",
    description:
      "Open-source Monte Carlo simulation engine for equity price paths.",
    type: "website",
    url: "https://driftwood.run",
  },
  twitter: {
    card: "summary_large_image",
    title: "Driftwood — Monte Carlo Risk Engine",
    description:
      "Open-source Monte Carlo simulation engine for equity price paths.",
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


