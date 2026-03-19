import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Brain, Target, Shield, Link2, Waves, PuzzleIcon, Search, User, Thermometer, FileText, Zap, FolderOpen, Clock, Image, Video, Mic, Type, Globe, Menu, X, CheckCircle, AlertTriangle, UploadCloud, Trash2, ScanLine, Mail, Lock, Eye, EyeOff, ArrowRight, Layers, Moon, Sun } from "lucide-react";
import { C, card, mono, syne } from "../theme.js";
import { SCAN_STEPS } from "../constants.js";

function ScanProgress({ step, progress }) {
  return (
    <div className="card-hover" style={{ border:"1px solid var(--tl-card-border)", borderRadius:14, padding:20, background:"var(--tl-card-bg)", backdropFilter:"blur(14px)", WebkitBackdropFilter:"blur(14px)", boxShadow:"var(--tl-card-shadow)" }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
        <div style={{ width:32, height:32, borderRadius:8, background:"rgba(0,119,255,0.08)", display:"flex", alignItems:"center", justifyContent:"center" }}>
          <ScanLine size={16} color={C.accent} />
        </div>
        <div>
          <div style={{ ...syne, fontSize:13 }}>Analyzing file...</div>
          <div style={{ ...mono, fontSize:11, color:"var(--tl-muted)" }}>Please wait</div>
        </div>
      </div>
      <div style={{ height:6, background:"var(--tl-surface2)", borderRadius:100, overflow:"hidden", marginBottom:10 }}>
        <div style={{ height:"100%", width:`${progress}%`, background:`linear-gradient(90deg,${C.accent},#7c3aed)`, borderRadius:100, transition:"width .3s ease" }} />
      </div>
      <div style={{ ...mono, fontSize:11, color:"var(--tl-muted)" }}>{SCAN_STEPS[step] || "Processing..."}</div>
    </div>
  );
}

// ── Audio / Video Temporal Analyzer ──────────────────────────────────────────

const AUDIO_INDICATORS = [
  "Robotic or unnatural intonation",
  "Abrupt voice transitions detected",
  "No background noise present",
  "Spectral pattern matches TTS model",
  "Pitch variance too uniform",
];

const VIDEO_INDICATORS = [
  "Temporal inconsistency in frames",
  "No camera shake or motion blur",
  "Facial landmarks misalignment",
  "GAN-based frame interpolation found",
  "Unnatural eye-blink pattern",
];

// Seeded deterministic pseudo-random — no Math.random in render body

export default ScanProgress;
