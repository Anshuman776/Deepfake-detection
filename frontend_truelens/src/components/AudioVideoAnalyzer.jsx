import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Brain, Target, Shield, Link2, Waves, PuzzleIcon, Search, User, Thermometer, FileText, Zap, FolderOpen, Clock, Image, Video, Mic, Type, Globe, Menu, X, CheckCircle, AlertTriangle, UploadCloud, Trash2, ScanLine, Mail, Lock, Eye, EyeOff, ArrowRight, Layers, Moon, Sun } from "lucide-react";
import { C, card, hdr, mono, syne } from "../theme.js";
import { AUDIO_INDICATORS, VIDEO_INDICATORS } from "../constants.js";
import AudioAnalyzerPanel from "./AudioAnalyzerPanel.jsx";
import VideoAnalyzerPanel from "./VideoAnalyzerPanel.jsx";

function AudioVideoAnalyzer({ file, score, isMobile }) {
  const isAudio = file?.type?.startsWith("audio/") || (file?.isUrl && file?.urlMediaType === "audio");
  const isVideo = file?.type?.startsWith("video/") || (file?.isUrl && file?.urlMediaType === "video");

  // Return null for non-audio/video files
  if (!isAudio && !isVideo) return null;

  const isAI    = score >= 65;
  const isMixed = score >= 40 && score < 65;
  const vc      = isAI ? "#e8003d" : isMixed ? "#d97706" : "#059669";
  const verdictLabel = isAI ? "FAKE" : isMixed ? "UNCERTAIN" : "REAL";

  // Strictly pick the correct indicator pool based on file type
  const indicators = useMemo(() => {
    const pool  = isAudio ? AUDIO_INDICATORS : VIDEO_INDICATORS;
    const count = isAI ? 3 : isMixed ? 2 : 1;
    return pool.slice(0, count);
  }, [isAudio, isAI, isMixed]);

  return (
    <div className="card-hover" style={{ ...card, overflow:"hidden" }}>
      {/* Header */}
      <div style={{ ...hdr, justifyContent:"space-between", flexWrap:"wrap", gap:8 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:28, height:28, borderRadius:7, background:`${vc}18`, display:"flex", alignItems:"center", justifyContent:"center" }}>
            {isAudio ? <Mic size={14} color={vc} /> : <Video size={14} color={vc} />}
          </div>
          <span style={{ ...syne, fontSize:13 }}>
            {isAudio ? "Audio" : "Video"} Fake/Real Detection
          </span>
        </div>
        {isAI && (
          <div style={{ background:"#e8003d", color:"#fff", ...mono, fontSize:10, fontWeight:700, padding:"3px 10px", borderRadius:5, letterSpacing:1 }}>
            FAKE DETECTED
          </div>
        )}
      </div>

      <div style={{ padding:"14px 16px", display:"flex", flexDirection: isMobile ? "column" : "row", gap:14 }}>

        {/* Left — format-specific visualizer */}
        <div style={{ flex:1, minWidth:0 }}>
          {isAudio
            ? <AudioAnalyzerPanel score={score} vc={vc} isAI={isAI} isMobile={isMobile} />
            : <VideoAnalyzerPanel file={file} score={score} vc={vc} isAI={isAI} isMobile={isMobile} />
          }
        </div>

        {/* Right — score donut + format-specific indicators */}
        <div style={{ width: isMobile ? "100%" : 178, flexShrink:0, display:"flex", flexDirection:"column", gap:10 }}>

          {/* Score ring */}
          <div style={{ background:"var(--tl-lavender)", borderRadius:10, padding:"14px 12px", textAlign:"center" }}>
            <div style={{ position:"relative", width:80, height:80, margin:"0 auto 8px" }}>
              <svg viewBox="0 0 90 90" width="80" height="80">
                <circle cx="45" cy="45" r="36" fill="none" stroke="rgba(99,102,241,0.25)" strokeWidth="8"/>
                <circle cx="45" cy="45" r="36" fill="none" stroke={vc} strokeWidth="8"
                  strokeDasharray={2 * Math.PI * 36}
                  strokeDashoffset={2 * Math.PI * 36 * (1 - score / 100)}
                  strokeLinecap="round" transform="rotate(-90 45 45)"
                  style={{ transition:"stroke-dashoffset 1.2s ease" }} />
              </svg>
              <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
                <span style={{ ...syne, fontSize:18, color:vc }}>{score}%</span>
                <span style={{ ...mono, fontSize:8, color:"var(--tl-muted)" }}>FAKE SCORE</span>
              </div>
            </div>
            {[
              { label:"FAKE", pct:score,       color:"#e8003d" },
              { label:"REAL", pct:100 - score, color:"#059669" },
            ].map(row => (
              <div key={row.label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:5 }}>
                <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                  <div style={{ width:8, height:8, borderRadius:2, background:row.color }} />
                  <span style={{ ...mono, fontSize:10, color:"var(--tl-text-sec)" }}>{row.label}</span>
                </div>
                <span style={{ ...mono, fontSize:10, fontWeight:700, color:row.color }}>{row.pct}%</span>
              </div>
            ))}
            <div style={{ ...mono, fontSize:10, color:vc, fontWeight:700, marginTop:6 }}>
              {verdictLabel}
            </div>
          </div>

          {/* Format-specific indicators */}
          <div style={{ background:"var(--tl-lavender)", borderRadius:10, padding:"12px", flex:1 }}>
            <div style={{ ...mono, fontSize:9, color:"var(--tl-muted)", letterSpacing:1, marginBottom:8 }}>
              {isAudio ? "AUDIO" : "VIDEO"} INDICATORS
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {indicators.map((ind, i) => (
                <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:6 }}>
                  <AlertTriangle size={11} color="#d97706" style={{ flexShrink:0, marginTop:1 }} />
                  <span style={{ ...mono, fontSize:10, color:"var(--tl-text-sec)", lineHeight:1.45 }}>{ind}</span>
                </div>
              ))}
              {!isAI && !isMixed && (
                <div style={{ display:"flex", alignItems:"flex-start", gap:6 }}>
                  <CheckCircle size={11} color="#059669" style={{ flexShrink:0, marginTop:1 }} />
                  <span style={{ ...mono, fontSize:10, color:"var(--tl-text-sec)", lineHeight:1.45 }}>No fake artifacts detected</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Image Heatmap Viewer ──────────────────────────────────────────────────────

const AI_INDICATORS = [
  "Unnatural texture patterns detected",
  "No camera metadata present",
  "Facial features overly smooth",
  "GAN fingerprint signature found",
  "Inconsistent lighting gradients",
];


export default AudioVideoAnalyzer;
