"use client";

import React, { useState, useCallback, useEffect } from "react";
import { generateCurlCommand, type SimulationParams } from "@/lib/api";

interface CopyApiButtonProps {
  params: SimulationParams;
}

export default function CopyApiButton({ params }: CopyApiButtonProps) {
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("https://driftwood.run");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  const curlCommand = generateCurlCommand(params, origin);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(curlCommand);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement("textarea");
      textarea.value = curlCommand;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [curlCommand]);

  return (
    <div className="code-block-wrapper">
      <button className="copy-btn" onClick={handleCopy}>
        {copied ? "COPIED" : "COPY"}
      </button>
      <pre className="code-block-content">
        <code>{curlCommand}</code>
      </pre>
    </div>
  );
}
