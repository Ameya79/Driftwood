import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "API Reference & Integrations — Driftwood",
  description:
    "Developer API reference guide for the Driftwood Monte Carlo stock price simulation engine. Integrate using cURL, JavaScript, Python, or HTML iFrames.",
  openGraph: {
    title: "API Reference & Integrations — Driftwood",
    description:
      "Developer API reference guide for the Driftwood Monte Carlo stock price simulation engine.",
  },
};

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
