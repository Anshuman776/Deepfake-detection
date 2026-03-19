import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Brain, Target, Shield, Link2, Waves, PuzzleIcon, Search, User, Thermometer, FileText, Zap, FolderOpen, Clock, Image, Video, Mic, Type, Globe, Menu, X, CheckCircle, AlertTriangle, UploadCloud, Trash2, ScanLine, Mail, Lock, Eye, EyeOff, ArrowRight, Layers, Moon, Sun } from "lucide-react";
import { mono, syne, C } from "../theme.js";
import { seededRand, generateProb } from "../utils/detection.js";
import TemporalChart from "./TemporalChart.jsx";

function AudioAnalyzerPanel({ score, vc, isAI, isMobile }) {
  const WAVE_BARS = 80;
  const duration  = 24;

  const waveBars = useMemo(() => Array.from({ length: WAVE_BARS }, (_, i) => {
    const base     = seededRand(score, i);
    const envelope = Math.sin((i / WAVE_BARS) * Math.PI);
    const height   = 0.1 + base * 0.85 * (0.4 + envelope * 0.6);
    const aiProb   = generateProb(score, i, WAVE_BARS);
    const color    = aiProb > 70 ? "#e8003d" : aiProb > 50 ? "#d97706" : "rgba(148,163,184,0.6)";
    return { height, color };
  }), [score]);

  const [playing, setPlaying] = useState(false);
  const [playPct, setPlayPct] = useState(0);
  const playRef = useRef(null);

  const handlePlay = () => {
    if (playing) { clearInterval(playRef.current); setPlaying(false); return; }
    setPlaying(true); setPlayPct(0);
    playRef.current = setInterval(() => {
      setPlayPct(p => {
        if (p >= 100) { clearInterval(playRef.current); setPlaying(false); return 100; }
        return p + 0.8;
      });
    }, 80);
  };
  useEffect(() => () => clearInterval(playRef.current), []);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
      {/* Waveform */}
      <div style={{ background:"#0f1520", borderRadius:10, padding:"12px 14px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
          <button onClick={handlePlay} style={{
            width:32, height:32, borderRadius:"50%", flexShrink:0,
            background: playing ? vc : "rgba(255,255,255,0.12)",
            border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", transition:"background .2s",
          }}>
            {playing
              ? <div style={{ width:8, height:8, background:"#fff", borderRadius:1 }} />
              : <div style={{ width:0, height:0, borderLeft:"9px solid #fff", borderTop:"5px solid transparent", borderBottom:"5px solid transparent", marginLeft:2 }} />
            }
          </button>
          <div style={{ flex:1, position:"relative", height:48, display:"flex", alignItems:"center", gap:1 }}>
            {waveBars.map((bar, i) => (
              <div key={i} style={{
                flex:1, borderRadius:2, minWidth:2,
                height:`${bar.height * 100}%`,
                background: (playPct / 100) * WAVE_BARS > i ? vc : bar.color,
                transition:"background .1s",
              }} />
            ))}
            {playing && (
              <div style={{
                position:"absolute", left:`${playPct}%`, top:0, bottom:0,
                width:2, background:"#fff", borderRadius:1,
                boxShadow:"0 0 6px rgba(255,255,255,0.5)", transition:"left .08s linear",
              }} />
            )}
          </div>
          <span style={{ ...mono, fontSize:10, color:"var(--tl-muted)", flexShrink:0 }}>0:00 / {duration}s</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          {isAI && (
            <div style={{ background:"#e8003d", color:"#fff", ...mono, fontSize:9, fontWeight:700, padding:"2px 7px", borderRadius:4, letterSpacing:1, flexShrink:0 }}>
              AI DETECTED
            </div>
          )}
          <div style={{ flex:1, height:3, background:"var(--tl-signal-track)", borderRadius:100, overflow:"hidden" }}>
            <div style={{ height:"100%", width:`${playPct}%`, background:vc, borderRadius:100, transition:"width .08s linear" }} />
          </div>
          <span style={{ ...mono, fontSize:9, color:"var(--tl-muted)" }}>
            {(Math.round((playPct / 100) * duration * 10) / 10).toFixed(1)}s
          </span>
        </div>
      </div>
      {/* Chart */}
      <TemporalChart score={score} vc={vc} isMobile={isMobile} label="AI Temporal Analysis" />
    </div>
  );
}

// ── Video-specific: real video player + temporal chart ────────────────────────

export default AudioAnalyzerPanel;
