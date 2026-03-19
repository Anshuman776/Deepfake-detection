import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { mono } from "../theme.js";
import { generateProb } from "../utils/detection.js";
const syne = { fontFamily: "serif", fontWeight: 800 };

function TemporalChart({ score, vc, isMobile, label }) {
  const CHART_PTS = 40;
  const W = 500, H = 160, PAD = { t:12, r:10, b:30, l:38 };
  const cW = W - PAD.l - PAD.r;
  const cH = H - PAD.t - PAD.b;
  const duration = 24;

  const chartPts = useMemo(() =>
    Array.from({ length: CHART_PTS }, (_, i) => generateProb(score, i, CHART_PTS)),
  [score]);

  const maxProb  = Math.max(...chartPts);
  const peakIdx  = chartPts.indexOf(maxProb);
  const peakTime = Math.round((peakIdx / CHART_PTS) * duration);

  const [hoverIdx, setHoverIdx] = useState(null);
  const [animPct,  setAnimPct]  = useState(0);

  useEffect(() => {
    setAnimPct(0);
    let start = null;
    const dur  = 1200;
    let raf;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / dur, 1);
      setAnimPct(p);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [score]);

  const visibleCount = Math.max(2, Math.round(chartPts.length * animPct));

  const pts = chartPts.slice(0, visibleCount).map((v, i) => {
    const x = PAD.l + (i / (CHART_PTS - 1)) * cW;
    const y = PAD.t + cH - (v / 100) * cH;
    return `${x},${y}`;
  }).join(" ");

  const fillPts = chartPts.slice(0, visibleCount).map((v, i) => {
    const x = PAD.l + (i / (CHART_PTS - 1)) * cW;
    const y = PAD.t + cH - (v / 100) * cH;
    return `${x},${y}`;
  });
  const fillPath = fillPts.length > 1
    ? `M ${fillPts[0]} L ${fillPts.join(" L ")} L ${fillPts[fillPts.length-1].split(",")[0]},${PAD.t+cH} L ${PAD.l},${PAD.t+cH} Z`
    : "";

  const hovData = hoverIdx !== null ? {
    time: Math.round((hoverIdx / (CHART_PTS - 1)) * duration),
    prob: Math.round(chartPts[hoverIdx]),
    x: PAD.l + (hoverIdx / (CHART_PTS - 1)) * cW,
    y: PAD.t + cH - (chartPts[hoverIdx] / 100) * cH,
  } : null;

  const yLabels = [100, 80, 60, 40, 20];
  const xLabels = [0, 5, 10, 15, 20, 24];

  return (
    <div style={{ background:"#0f1520", borderRadius:10, padding:"12px 14px" }}>
      <div style={{ ...syne, fontSize:12, color:"var(--tl-muted)", marginBottom:8 }}>{label}</div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width:"100%", height: isMobile ? 140 : 200, display:"block", cursor:"crosshair" }}
        onMouseLeave={() => setHoverIdx(null)}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const mx   = (e.clientX - rect.left) / rect.width * W;
          const idx  = Math.round(((mx - PAD.l) / cW) * (CHART_PTS - 1));
          setHoverIdx(Math.max(0, Math.min(CHART_PTS - 1, idx)));
        }}
      >
        {yLabels.map(v => {
          const y = PAD.t + cH - (v / 100) * cH;
          return (
            <g key={v}>
              <line x1={PAD.l} y1={y} x2={W - PAD.r} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
              <text x={PAD.l - 5} y={y + 4} textAnchor="end"
                style={{ ...mono, fontSize:9, fill:"rgba(255,255,255,0.3)" }}>{v}%</text>
            </g>
          );
        })}
        {xLabels.map(t => (
          <text key={t} x={PAD.l + (t / duration) * cW} y={H - 6} textAnchor="middle"
            style={{ ...mono, fontSize:9, fill:"rgba(255,255,255,0.3)" }}>{t}s</text>
        ))}
        {fillPath && <path d={fillPath} fill={`${vc}22`} />}
        {pts && <polyline points={pts} fill="none" stroke={vc} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />}

        {/* Peak dot + tooltip (shown when not hovering) */}
        {animPct >= peakIdx / CHART_PTS && (() => {
          const px = PAD.l + (peakIdx / (CHART_PTS - 1)) * cW;
          const py = PAD.t + cH - (maxProb / 100) * cH;
          return (
            <g>
              <line x1={px} y1={PAD.t} x2={px} y2={PAD.t + cH} stroke="rgba(255,255,255,0.12)" strokeWidth="1" strokeDasharray="3,3" />
              <circle cx={px} cy={py} r={5} fill={vc} stroke="#fff" strokeWidth="1.5" />
              {hoverIdx === null && (
                <g>
                  <rect x={px - 52} y={py - 38} width={104} height={34} rx={5} fill="rgba(30,20,40,0.92)" stroke={`${vc}55`} strokeWidth="1" />
                  <text x={px} y={py - 24} textAnchor="middle" style={{ ...mono, fontSize:9, fill:"rgba(255,255,255,0.7)" }}>Time: {peakTime}s</text>
                  <text x={px} y={py - 11} textAnchor="middle" style={{ ...mono, fontSize:9, fill:vc, fontWeight:700 }}>AI Probability: {Math.round(maxProb)}%</text>
                </g>
              )}
            </g>
          );
        })()}

        {/* Hover crosshair */}
        {hovData && hoverIdx < visibleCount && (() => {
          const flip = hovData.x > W * 0.65;
          const tx = flip ? hovData.x - 108 : hovData.x + 8;
          const ty = Math.max(PAD.t + 4, hovData.y - 32);
          return (
            <g>
              <line x1={hovData.x} y1={PAD.t} x2={hovData.x} y2={PAD.t + cH} stroke="rgba(255,255,255,0.18)" strokeWidth="1" strokeDasharray="3,3" />
              <circle cx={hovData.x} cy={hovData.y} r={4} fill="#fff" stroke={vc} strokeWidth="1.5" />
              <rect x={tx} y={ty} width={100} height={32} rx={5} fill="rgba(20,10,30,0.95)" stroke={`${vc}66`} strokeWidth="1" />
              <text x={tx + 8} y={ty + 12} style={{ ...mono, fontSize:9, fill:"rgba(255,255,255,0.7)" }}>Time: {hovData.time}s</text>
              <text x={tx + 8} y={ty + 24} style={{ ...mono, fontSize:9, fill:vc, fontWeight:700 }}>AI Prob: {hovData.prob}%</text>
            </g>
          );
        })()}
      </svg>
    </div>
  );
}

// ── Audio-specific: waveform player ──────────────────────────────────────────

export default TemporalChart;
