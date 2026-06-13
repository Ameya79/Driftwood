/**
 * Driftwood Embeddable Widget
 * < 50KB — Canvas-based chart renderer (no Recharts dependency)
 *
 * Usage:
 *   <script
 *     src="https://driftwood.run/widget.js"
 *     data-ticker="AAPL"
 *     data-days="30"
 *     data-sims="500"
 *     data-theme="dark"
 *   ></script>
 */
(function () {
  "use strict";

  // ── Configuration ──────────────────────────────────────────────────
  var DEFAULTS = {
    ticker: "AAPL",
    days: 30,
    sims: 500,
    theme: "dark",
    width: "100%",
    height: "400",
  };

  var THEMES = {
    dark: {
      bg: "#0a0a0a",
      card: "#141414",
      border: "#262626",
      text: "#fafaf9",
      textMuted: "#78716c",
      p10: "#ef4444",
      p50: "#f5f5f4",
      p90: "#22c55e",
      grid: "rgba(255,255,255,0.06)",
      reference: "#a8a29e",
    },
    light: {
      bg: "#ffffff",
      card: "#f9fafb",
      border: "#e5e7eb",
      text: "#111827",
      textMuted: "#9ca3af",
      p10: "#dc2626",
      p50: "#374151",
      p90: "#16a34a",
      grid: "rgba(0,0,0,0.06)",
      reference: "#9ca3af",
    },
  };

  var API_BASE = "https://driftwood.run/api/v1";

  // ── Find our script tag and read data attributes ───────────────────
  var scripts = document.getElementsByTagName("script");
  var currentScript = scripts[scripts.length - 1];

  var config = {
    ticker: currentScript.getAttribute("data-ticker") || DEFAULTS.ticker,
    days: parseInt(currentScript.getAttribute("data-days") || DEFAULTS.days, 10),
    sims: parseInt(currentScript.getAttribute("data-sims") || DEFAULTS.sims, 10),
    theme: currentScript.getAttribute("data-theme") || DEFAULTS.theme,
    width: currentScript.getAttribute("data-width") || DEFAULTS.width,
    height: parseInt(currentScript.getAttribute("data-height") || DEFAULTS.height, 10),
  };

  var theme = THEMES[config.theme] || THEMES.dark;

  // ── Create container ───────────────────────────────────────────────
  var container = document.createElement("div");
  container.style.cssText =
    "width:" + config.width + ";max-width:800px;background:" + theme.card +
    ";border:1px solid " + theme.border +
    ";border-radius:10px;overflow:hidden;font-family:'JetBrains Mono',monospace;";

  // Header
  var header = document.createElement("div");
  header.style.cssText = "padding:12px 16px;display:flex;justify-content:space-between;align-items:center;";

  var title = document.createElement("span");
  title.textContent = config.ticker + " · Monte Carlo";
  title.style.cssText = "font-size:13px;font-weight:600;color:" + theme.text + ";";

  var badge = document.createElement("span");
  badge.textContent = "Loading…";
  badge.style.cssText = "font-size:11px;color:" + theme.textMuted + ";";

  header.appendChild(title);
  header.appendChild(badge);
  container.appendChild(header);

  // Canvas
  var canvas = document.createElement("canvas");
  canvas.width = 760;
  canvas.height = config.height - 80;
  canvas.style.cssText = "width:100%;height:" + (config.height - 80) + "px;display:block;";
  container.appendChild(canvas);

  // Footer
  var footer = document.createElement("div");
  footer.style.cssText =
    "padding:8px 16px;text-align:center;border-top:1px solid " + theme.border + ";";

  var link = document.createElement("a");
  link.href = "https://driftwood.run/?ticker=" + config.ticker + "&days=" + config.days + "&sims=" + config.sims;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = "Powered by Driftwood";
  link.style.cssText = "font-size:10px;color:" + theme.textMuted + ";text-decoration:none;";

  footer.appendChild(link);
  container.appendChild(footer);

  // Insert into DOM
  currentScript.parentNode.insertBefore(container, currentScript.nextSibling);

  // ── Fetch data and render ──────────────────────────────────────────
  fetch(API_BASE + "/simulate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ticker: config.ticker,
      days: config.days,
      simulations: config.sims,
    }),
  })
    .then(function (res) {
      if (!res.ok) throw new Error("API error: " + res.status);
      return res.json();
    })
    .then(function (data) {
      badge.textContent =
        "$" + data.current_price.toFixed(2) +
        " → $" + data.metrics.mean_final.toFixed(2) +
        " (" + (data.metrics.prob_profit * 100).toFixed(0) + "% profit)";

      drawChart(canvas, data, theme);
    })
    .catch(function (err) {
      badge.textContent = "Error: " + err.message;
      badge.style.color = theme.p10;
    });

  // ── Canvas Chart Renderer ──────────────────────────────────────────
  function drawChart(canvas, data, theme) {
    var ctx = canvas.getContext("2d");
    var W = canvas.width;
    var H = canvas.height;
    var padding = { top: 20, right: 20, bottom: 30, left: 60 };

    var chartW = W - padding.left - padding.right;
    var chartH = H - padding.top - padding.bottom;

    // Clear
    ctx.fillStyle = theme.card;
    ctx.fillRect(0, 0, W, H);

    // Data
    var p10 = data.percentiles.p10;
    var p50 = data.percentiles.p50;
    var p90 = data.percentiles.p90;
    var numPoints = p50.length;

    // Scale
    var allValues = p10.concat(p90);
    var minY = Math.min.apply(null, allValues);
    var maxY = Math.max.apply(null, allValues);
    var yPad = (maxY - minY) * 0.08;
    minY -= yPad;
    maxY += yPad;

    function xScale(i) {
      return padding.left + (i / (numPoints - 1)) * chartW;
    }
    function yScale(v) {
      return padding.top + chartH - ((v - minY) / (maxY - minY)) * chartH;
    }

    // Grid lines
    ctx.strokeStyle = theme.grid;
    ctx.lineWidth = 1;
    var numGridLines = 5;
    for (var g = 0; g <= numGridLines; g++) {
      var gy = padding.top + (g / numGridLines) * chartH;
      ctx.beginPath();
      ctx.moveTo(padding.left, gy);
      ctx.lineTo(padding.left + chartW, gy);
      ctx.stroke();

      // Y-axis labels
      var yVal = maxY - (g / numGridLines) * (maxY - minY);
      ctx.fillStyle = theme.textMuted;
      ctx.font = "10px monospace";
      ctx.textAlign = "right";
      ctx.fillText("$" + yVal.toFixed(0), padding.left - 8, gy + 4);
    }

    // X-axis labels
    ctx.textAlign = "center";
    var xLabels = [0, Math.floor(numPoints / 2), numPoints - 1];
    for (var xi = 0; xi < xLabels.length; xi++) {
      var xp = xLabels[xi];
      ctx.fillText("Day " + xp, xScale(xp), H - 8);
    }

    // Current price reference line
    ctx.strokeStyle = theme.reference;
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(padding.left, yScale(data.current_price));
    ctx.lineTo(padding.left + chartW, yScale(data.current_price));
    ctx.stroke();
    ctx.setLineDash([]);

    // Fill between P10 and P90
    ctx.fillStyle = "rgba(255,255,255,0.03)";
    if (theme === THEMES.light) ctx.fillStyle = "rgba(0,0,0,0.03)";
    ctx.beginPath();
    ctx.moveTo(xScale(0), yScale(p90[0]));
    for (var i = 1; i < numPoints; i++) {
      ctx.lineTo(xScale(i), yScale(p90[i]));
    }
    for (var j = numPoints - 1; j >= 0; j--) {
      ctx.lineTo(xScale(j), yScale(p10[j]));
    }
    ctx.closePath();
    ctx.fill();

    // Draw lines
    function drawLine(points, color, width) {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(xScale(0), yScale(points[0]));
      for (var i = 1; i < points.length; i++) {
        ctx.lineTo(xScale(i), yScale(points[i]));
      }
      ctx.stroke();
    }

    drawLine(p10, theme.p10, 2);
    drawLine(p90, theme.p90, 2);
    drawLine(p50, theme.p50, 2.5);

    // Legend
    var legendX = padding.left + 8;
    var legendY = padding.top + 12;
    var legendItems = [
      { label: "P90 (Bull)", color: theme.p90 },
      { label: "P50 (Median)", color: theme.p50 },
      { label: "P10 (Bear)", color: theme.p10 },
    ];

    for (var li = 0; li < legendItems.length; li++) {
      var item = legendItems[li];
      var ly = legendY + li * 16;

      ctx.fillStyle = item.color;
      ctx.fillRect(legendX, ly - 4, 10, 3);

      ctx.fillStyle = theme.textMuted;
      ctx.font = "10px monospace";
      ctx.textAlign = "left";
      ctx.fillText(item.label, legendX + 16, ly);
    }
  }
})();
