"use client";

import React, { useState, useCallback } from "react";
import { generateEmbedSnippet, type SimulationParams } from "@/lib/api";

interface EmbedButtonProps {
  params: SimulationParams;
}

export default function EmbedButton({ params }: EmbedButtonProps) {
  const [copied, setCopied] = useState(false);
  const embedSnippet = generateEmbedSnippet(params);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(embedSnippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement("textarea");
      textarea.value = embedSnippet;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [embedSnippet]);

  return (
    <div className="code-block-wrapper">
      <button className="copy-btn" onClick={handleCopy}>
        {copied ? "COPIED" : "COPY"}
      </button>
      <pre className="code-block-content">
        <code>{embedSnippet}</code>
      </pre>
    </div>
  );
}
