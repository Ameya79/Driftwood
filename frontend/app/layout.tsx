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
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}


