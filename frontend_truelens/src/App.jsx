import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Brain, Target, Shield, Link2, Waves, PuzzleIcon, Search, User, Thermometer, FileText, Zap, FolderOpen, Clock, Image, Video, Mic, Type, Globe, Menu, X, CheckCircle, AlertTriangle, UploadCloud, Trash2, ScanLine, Mail, Lock, Eye, EyeOff, ArrowRight, Layers, Moon, Sun } from "lucide-react";
import { C, card, hdr, mono, syne, useThemeStyles } from "./theme.js";
// import { FEATURES, STAT_TARGETS, SCAN_STEPS } from "./constants.js";
import { FEATURES, STAT_TARGETS, SCAN_STEPS, MEDIA_TABS } from "./constants.js";
import useBreakpoint from "./hooks/useBreakpoint.js";
import AnimatedStat from "./components/AnimatedStat.jsx";
import UploadZone from "./components/UploadZone.jsx";
import FilePreview from "./components/FilePreview.jsx";
import ScanProgress from "./components/ScanProgress.jsx";
import ScanResult from "./components/ScanResult.jsx";
import AuthLogin from "./components/AuthLogin.jsx";
import AuthSignup from "./components/AuthSignup.jsx";

export default function TruthLens() {
  const [tab, setTab] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [authPage, setAuthPage] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [file, setFile] = useState(null);
  const [scanState, setScanState] = useState("idle");
  const [scanStep, setScanStep] = useState(0);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanScore, setScanScore] = useState(null);
  const [scanResultData, setScanResultData] = useState(null);
  const [scanError, setScanError] = useState("");
  const { isMobile, isTablet } = useBreakpoint();
  const px = isMobile ? "16px" : isTablet ? "24px" : "40px";
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement;
      const scrolled = el.scrollTop || document.body.scrollTop;
      const total = el.scrollHeight - el.clientHeight;
      setScrollProgress(total > 0 ? Math.round((scrolled / total) * 100) : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // FIX: wrapped in useCallback so FilePreview/UploadZone don't re-render on every keystroke
  const handleFileSelected = useCallback((f) => {
    setFile(f);
    setScanState("idle");
    setScanScore(null);
    setScanResultData(null);
    setScanError("");
  }, []);

  const handleRemove = useCallback(() => {
    setFile(null);
    setScanState("idle");
    setScanScore(null);
    setScanResultData(null);
    setScanError("");
    setScanStep(0);
    setScanProgress(0);
  }, []);

  const [lastScanTime, setLastScanTime] = useState(2.8);
  const [scanCount, setScanCount] = useState(0);
  const scanStartRef = useRef(null);
  // FIX: track interval so it can be cleared on unmount to prevent memory leak
  const scanIntervalRef = useRef(null);

  useEffect(() => {
    return () => { if (scanIntervalRef.current) clearInterval(scanIntervalRef.current); };
  }, []);

  const handleScan = useCallback(async () => {
    setScanState("scanning");
    setScanStep(0);
    setScanProgress(0);
    setScanError("");
    scanStartRef.current = Date.now();

    const configuredBase = (import.meta.env.VITE_API_BASE_URL || "").trim();
    const apiBases = configuredBase
      ? [configuredBase]
      : ["http://127.0.0.1:8000", "http://127.0.0.1:8002"];

    const mediaByTab = {
      0: "image",
      1: "video",
      2: "audio",
      3: null,
      4: null,
    };

    let mediaType = null;
    if (file?.isUrl) {
      mediaType = file.urlMediaType || null;
    } else if (file?.type?.startsWith("image/")) {
      mediaType = "image";
    } else if (file?.type?.startsWith("video/")) {
      mediaType = "video";
    } else if (file?.type?.startsWith("audio/")) {
      mediaType = "audio";
    } else {
      mediaType = mediaByTab[tab] || null;
    }

    if (!mediaType) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
      setScanState("idle");
      setScanError("Unsupported file type for detection. Please use image, video, or audio only.");
      return;
    }

    // Animate the scan steps while the API call is in progress
    let step = 0;
    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    scanIntervalRef.current = setInterval(() => {
      step += 1;
      if (step < SCAN_STEPS.length) {
        setScanStep(step);
        setScanProgress(Math.min(95, Math.round((step / SCAN_STEPS.length) * 100)));
      }
    }, 600);

    try {
      const formData = new FormData();
      if (file?.isUrl) {
        formData.append("url", file.name);
      } else {
        formData.append("file", file);
      }

      let data = null;
      let fallbackData = null;
      let lastError = null;

      for (const base of apiBases) {
        const endpoint = `${base}/api/detect/${mediaType}`;
        try {
          const response = await fetch(endpoint, {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            throw new Error(`Scan request failed with status ${response.status} at ${base}`);
          }

          const payload = await response.json();
          console.log("[TruthLens] Raw API response from", base, ":", JSON.stringify(payload));

          // Accept various response shapes from backend
          const candidate = payload?.result || payload;
          const conf = candidate?.confidence ?? candidate?.fake_confidence ?? candidate?.fakeConfidence ?? candidate?.real_confidence ?? candidate?.realConfidence ?? null;

          if (candidate && (candidate.label || conf != null)) {
            // For image scans, prefer a backend response that includes OpenAI cross-check.
            // If this backend doesn't provide it, keep this as fallback and try next base.
            if (mediaType === "image" && !payload?.openai_crosscheck) {
              fallbackData = payload;
              continue;
            }

            data = payload;
            break;
          }

          throw new Error(`Invalid detection payload from ${base}: ${JSON.stringify(payload)}`);
        } catch (err) {
          lastError = err;
          console.warn("[TruthLens] Attempt failed for", base, ":", err.message);
        }
      }

      if (!data && fallbackData) {
        data = fallbackData;
      }

      if (!data) {
        throw lastError || new Error("No backend response available");
      }

      // Clear the animation interval
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
      setScanStep(SCAN_STEPS.length);
      setScanProgress(100);

      const result = data?.result || {};
      const parsedLabel = String(result.label || "").toUpperCase();

      const rawConfidence = Number(result.confidence);
      const confidence = Number.isFinite(rawConfidence)
        ? Math.max(0, Math.min(100, rawConfidence))
        : 50;

      let fakeConfidence = Number(result.fake_confidence ?? result.fakeConfidence);
      let realConfidence = Number(result.real_confidence ?? result.realConfidence);

      if (!Number.isFinite(fakeConfidence) || !Number.isFinite(realConfidence)) {
        if (parsedLabel === "REAL") {
          realConfidence = confidence;
          fakeConfidence = 100 - confidence;
        } else {
          fakeConfidence = confidence;
          realConfidence = 100 - confidence;
        }
      }

      if (!Number.isFinite(fakeConfidence) || !Number.isFinite(realConfidence)) {
        throw new Error("Detection result is missing valid confidence values");
      }

      fakeConfidence = Math.max(0, Math.min(100, fakeConfidence));
      realConfidence = Math.max(0, Math.min(100, realConfidence));

      const label = parsedLabel === "REAL" || parsedLabel === "FAKE"
        ? parsedLabel
        : (fakeConfidence >= realConfidence ? "FAKE" : "REAL");

      const score = Math.round(fakeConfidence);

      setTimeout(() => {
        const elapsed = ((Date.now() - scanStartRef.current) / 1000).toFixed(1);
        setLastScanTime(parseFloat(elapsed));
        setScanScore(score);
        const openaiCrosscheck = data?.openai_crosscheck || result?.openai_crosscheck || null;
        setScanResultData({
          label,
          confidence: Number(confidence.toFixed(3)),
          fakeConfidence: Number(fakeConfidence.toFixed(3)),
          realConfidence: Number(realConfidence.toFixed(3)),
          openaiCrosscheck,
        });
        setScanState("done");
        setScanCount(c => c + 1);
      }, 400);

    } catch (err) {
      console.error("Scan failed:", err);
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;

      setScanState("idle");
      setScanStep(0);
      setScanProgress(0);
      setScanError(err?.message || "Scan failed. Please ensure backend and ML service are running.");
    }
  }, [file, tab]);

  useThemeStyles(isDark);

  // FIX: Build stat targets with live values. Remove scanCount from AnimatedStat key —
  // this prevents all 4 counters from unmounting/resetting to 0 after each scan.
  // Only stat[2] (avg scan time) gets a new `end` value, so only its animation replays.
  const liveStatTargets = useMemo(() => STAT_TARGETS.map((t, i) => {
    if (i === 0) return { ...t, end: 2.4 + scanCount * 0.000001 };
    if (i === 2) return { ...t, end: lastScanTime };
    return t;
  }), [scanCount, lastScanTime]);

  return (
    <div className={`tl-root${isDark ? " tl-dark" : ""}`} style={{ background:"var(--tl-bg)", color:"var(--tl-text)", fontFamily:"sans-serif", position:"relative", overflow:"hidden" }}>

      {/* ── Global decorative background ── */}
      <div aria-hidden="true" style={{ position:"fixed", inset:0, zIndex:0, pointerEvents:"none", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, background:"var(--tl-hero-bg)" }} />
        {/* Central glow blob — greatly reduced opacity so text stays readable */}
        <div style={{ position:"absolute", top:"2%", left:"50%", transform:"translateX(-50%)", width:"80vw", height:"55vw", maxWidth:1100, maxHeight:750, borderRadius:"50%", background:"radial-gradient(ellipse at 50% 30%, rgba(220,200,255,0.25) 0%, rgba(180,140,255,0.12) 35%, rgba(130,80,220,0.06) 60%, transparent 80%)", filter:"blur(18px)" }} />
        <svg viewBox="0 0 1000 600" style={{ position:"absolute", top:"-5%", left:"50%", transform:"translateX(-50%)", width:"100vw", maxWidth:1400, opacity:1 }} preserveAspectRatio="xMidYMid meet">
          <defs>
            <radialGradient id="arcGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%"  stopColor="#c084fc" stopOpacity="0.0" />
              <stop offset="60%" stopColor="#a855f7" stopOpacity="0.45" />
              <stop offset="80%" stopColor="#7c3aed" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#6d28d9" stopOpacity="0.0" />
            </radialGradient>
            <radialGradient id="arcGlow2" cx="50%" cy="50%" r="50%">
              <stop offset="0%"  stopColor="#e9d5ff" stopOpacity="0.0" />
              <stop offset="50%" stopColor="#c4b5fd" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.0" />
            </radialGradient>
            <filter id="blur1"><feGaussianBlur stdDeviation="6" /></filter>
            <filter id="blur2"><feGaussianBlur stdDeviation="14" /></filter>
            <filter id="blur3"><feGaussianBlur stdDeviation="3" /></filter>
          </defs>
          {/* Outer halo — very faint */}
          <ellipse cx="500" cy="120" rx="480" ry="480" fill="none" stroke="url(#arcGlow2)" strokeWidth="60" filter="url(#blur2)" opacity="0.22" />
          {/* Main arc ring — toned down */}
          <ellipse cx="500" cy="120" rx="400" ry="400" fill="none" stroke="url(#arcGlow)" strokeWidth="28" filter="url(#blur1)" opacity="0.38" />
          {/* Inner crisp edge — very subtle */}
          <ellipse cx="500" cy="120" rx="400" ry="400" fill="none" stroke="#c4b5fd" strokeWidth="1.5" filter="url(#blur3)" opacity="0.25" />
          {/* Dot accents — dimmed */}
          <circle cx="152" cy="330" r="3" fill="#e9d5ff" opacity="0.4" />
          <circle cx="848" cy="330" r="3" fill="#e9d5ff" opacity="0.4" />
          <circle cx="103" cy="220" r="2" fill="#c4b5fd" opacity="0.3" />
          <circle cx="897" cy="220" r="2" fill="#c4b5fd" opacity="0.3" />
        </svg>
        <div style={{ position:"absolute", bottom:"10%", left:"-8%", width:"40vw", height:"40vw", maxWidth:500, maxHeight:500, borderRadius:"50%", background:"radial-gradient(circle, rgba(99,102,241,0.05) 0%, transparent 70%)", filter:"blur(50px)" }} />
        <div style={{ position:"absolute", bottom:"5%", right:"-10%", width:"35vw", height:"35vw", maxWidth:450, maxHeight:450, borderRadius:"50%", background:"radial-gradient(circle, rgba(192,132,252,0.05) 0%, transparent 70%)", filter:"blur(50px)" }} />
        <div style={{ position:"absolute", inset:0, backgroundImage:"radial-gradient(circle, var(--tl-dot-grid) 1px, transparent 1px)", backgroundSize:"30px 30px" }} />
      </div>

      <div style={{ position:"relative", zIndex:1 }}>

      {/* NAV */}
      <nav style={{ background:"var(--tl-nav-bg)", backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)", borderBottom:"1px solid var(--tl-nav-border)", display:"flex", alignItems:"center", justifyContent:"space-between", padding:`12px ${px}`, position:"fixed", top:0, left:0, right:0, zIndex:100, transition:"background .3s" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ width:30, height:30, borderRadius:7, background:"linear-gradient(135deg,#0077ff,#7c3aed)", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <Search size={15} color="#fff" />
          </div>
          <span style={{ ...syne, fontSize:18, color:"var(--tl-text)" }}>Truth<span style={{ color:C.accent }}>Lens</span></span>
        </div>
        {isMobile ? (
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            {/* Dark mode toggle — mobile */}
            <button onClick={() => setIsDark(d => !d)} style={{ background:"none", border:"none", cursor:"pointer", padding:4, display:"flex", alignItems:"center", justifyContent:"center" }}>
              {isDark ? <Sun size={19} color="#f4c430" /> : <Moon size={19} color="#7c3aed" />}
            </button>
            <button onClick={() => setMenuOpen(!menuOpen)} style={{ background:"none", border:"none", cursor:"pointer", padding:4 }}>
              {menuOpen ? <X size={22} color="var(--tl-text)" /> : <Menu size={22} color="var(--tl-text)" />}
            </button>
          </div>
        ) : (
          <div style={{ display:"flex", alignItems:"center", gap:24 }}>
            {["Detect","API","Pricing","Blog"].map(l => (
              <span key={l} style={{ ...mono, fontSize:12, color:"var(--tl-muted)", cursor:"pointer" }}>{l}</span>
            ))}
            {/* Dark mode toggle */}
            <button
              onClick={() => setIsDark(d => !d)}
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              style={{
                width:36, height:36, borderRadius:10, border:"none", cursor:"pointer",
                background: isDark ? "rgba(244,196,48,0.12)" : "rgba(124,58,237,0.08)",
                display:"flex", alignItems:"center", justifyContent:"center",
                transition:"background .2s, transform .2s",
              }}
              onMouseEnter={e => e.currentTarget.style.transform="scale(1.1)"}
              onMouseLeave={e => e.currentTarget.style.transform="scale(1)"}
            >
              {isDark
                ? <Sun size={17} color="#f4c430" />
                : <Moon size={17} color="#7c3aed" />
              }
            </button>
            {isLoggedIn ? (
              <div style={{ position:"relative" }}>
                {/* Avatar button */}
                <button
                  onClick={() => setUserMenuOpen(o => !o)}
                  style={{
                    width:34, height:34, borderRadius:"50%",
                    background:"linear-gradient(135deg,#0077ff,#7c3aed)",
                    border:"2px solid rgba(124,58,237,0.3)",
                    cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
                    boxShadow:"0 2px 8px rgba(124,58,237,0.25)", transition:"box-shadow .2s",
                  }}
                >
                  <User size={15} color="#fff" />
                </button>

                {/* Dropdown */}
                {userMenuOpen && (
                  <>
                    {/* Click-away backdrop */}
                    <div onClick={() => setUserMenuOpen(false)} style={{ position:"fixed", inset:0, zIndex:150 }} />
                    <div style={{
                      position:"absolute", top:42, right:0, zIndex:151,
                      background:"var(--tl-modal-bg)", backdropFilter:"blur(20px)",
                      border:"1px solid var(--tl-card-border)",
                      borderRadius:14, overflow:"hidden",
                      boxShadow:"0 12px 36px rgba(124,58,237,0.15)",
                      minWidth:200,
                    }}>
                      {/* User info header */}
                      <div style={{ padding:"14px 16px", borderBottom:`1px solid var(--tl-hdr-border)`, display:"flex", alignItems:"center", gap:10 }}>
                        <div style={{ width:36, height:36, borderRadius:"50%", background:"linear-gradient(135deg,#0077ff,#7c3aed)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                          <User size={16} color="#fff" />
                        </div>
                        <div>
                          <div style={{ ...syne, fontSize:13, color:"var(--tl-text)" }}>My Account</div>
                          <div style={{ ...mono, fontSize:10, color:"var(--tl-muted)" }}>user@example.com</div>
                        </div>
                      </div>
                      {/* Menu items */}
                      {[
                        { icon:Clock,    label:"Scan History"    },
                        { icon:FileText, label:"My Reports"      },
                        { icon:Shield,   label:"Privacy Settings"},
                      ].map(({ icon:Icon, label }) => (
                        <button key={label} onClick={() => setUserMenuOpen(false)} style={{
                          width:"100%", display:"flex", alignItems:"center", gap:10,
                          padding:"11px 16px", background:"none", border:"none",
                          cursor:"pointer", textAlign:"left",
                          borderBottom:`1px solid var(--tl-hdr-border)`,
                          transition:"background .15s",
                        }}
                        onMouseEnter={e => e.currentTarget.style.background= isDark ? "rgba(124,58,237,0.1)" : "rgba(124,58,237,0.05)"}
                        onMouseLeave={e => e.currentTarget.style.background="none"}
                        >
                          <Icon size={14} color="#7c3aed" />
                          <span style={{ ...mono, fontSize:12, color:"var(--tl-text)" }}>{label}</span>
                        </button>
                      ))}
                      {/* Log out */}
                      <button
                        onClick={() => { setIsLoggedIn(false); setUserMenuOpen(false); }}
                        style={{
                          width:"100%", display:"flex", alignItems:"center", gap:10,
                          padding:"11px 16px", background:"none", border:"none", cursor:"pointer", textAlign:"left",
                          transition:"background .15s",
                        }}
                        onMouseEnter={e => e.currentTarget.style.background="rgba(232,0,61,0.08)"}
                        onMouseLeave={e => e.currentTarget.style.background="none"}
                      >
                        <X size={14} color="#e8003d" />
                        <span style={{ ...mono, fontSize:12, color:"#e8003d" }}>Log Out</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <>
                <button onClick={() => setAuthPage("login")} style={{ background:"none", border:`1px solid rgba(124,58,237,0.3)`, borderRadius:7, padding:"7px 18px", fontWeight:600, cursor:"pointer", fontSize:13, color:"#7c3aed", ...mono }}>Log In</button>
                <button onClick={() => setAuthPage("signup")} style={{ background:"linear-gradient(135deg,#0077ff,#7c3aed)", color:"#fff", border:"none", borderRadius:7, padding:"7px 18px", fontWeight:600, cursor:"pointer", fontSize:13 }}>Sign Up</button>
              </>
            )}
          </div>
        )}
        <div style={{ position:"absolute", bottom:0, left:0, right:0, height:2, background:"rgba(124,58,237,0.1)" }}>
          <div style={{ height:"100%", width:`${scrollProgress}%`, background:"linear-gradient(90deg,#0077ff,#7c3aed)", transition:"width .1s linear", borderRadius:"0 2px 2px 0" }} />
        </div>
      </nav>

      <div style={{ height:54 }} />

      {isMobile && menuOpen && (
        <div style={{ background:"var(--tl-nav-bg)", backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)", borderBottom:"1px solid var(--tl-nav-border)", padding:"16px", display:"flex", flexDirection:"column", gap:12, position:"fixed", top:54, left:0, right:0, zIndex:99, transition:"background .3s" }}>
          {["Detect","API","Pricing","Blog"].map(l => (
            <span key={l} style={{ ...mono, fontSize:14, color:"var(--tl-muted)", cursor:"pointer" }}>{l}</span>
          ))}
          <div style={{ height:1, background:"var(--tl-divider)", margin:"4px 0" }} />
          {/* Dark mode toggle in mobile menu */}
          <button
            onClick={() => setIsDark(d => !d)}
            style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 4px", background:"none", border:"none", cursor:"pointer", textAlign:"left", width:"100%" }}
          >
            {isDark ? <Sun size={16} color="#f4c430" /> : <Moon size={16} color="#7c3aed" />}
            <span style={{ ...mono, fontSize:13, color:"var(--tl-text)" }}>{isDark ? "Light Mode" : "Dark Mode"}</span>
          </button>
          <div style={{ height:1, background:"var(--tl-divider)", margin:"4px 0" }} />
          {isLoggedIn ? (
            <>
              {/* User info row */}
              <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 4px" }}>
                <div style={{ width:38, height:38, borderRadius:"50%", background:"linear-gradient(135deg,#0077ff,#7c3aed)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <User size={17} color="#fff" />
                </div>
                <div>
                  <div style={{ ...syne, fontSize:13, color:"var(--tl-text)" }}>My Account</div>
                  <div style={{ ...mono, fontSize:10, color:"var(--tl-muted)" }}>user@example.com</div>
                </div>
              </div>
              {/* Menu items */}
              {[
                { icon:Clock,    label:"Scan History"     },
                { icon:FileText, label:"My Reports"       },
                { icon:Shield,   label:"Privacy Settings" },
              ].map(({ icon:Icon, label }) => (
                <button key={label} onClick={() => setMenuOpen(false)} style={{
                  display:"flex", alignItems:"center", gap:10, padding:"10px 4px",
                  background:"none", border:"none", cursor:"pointer", textAlign:"left", width:"100%",
                }}>
                  <Icon size={14} color="#7c3aed" />
                  <span style={{ ...mono, fontSize:13, color:"var(--tl-text)" }}>{label}</span>
                </button>
              ))}
              <div style={{ height:1, background:"var(--tl-divider)", margin:"4px 0" }} />
              <button
                onClick={() => { setIsLoggedIn(false); setMenuOpen(false); }}
                style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 4px", background:"none", border:"none", cursor:"pointer" }}
              >
                <X size={14} color="#e8003d" />
                <span style={{ ...mono, fontSize:13, color:"#e8003d" }}>Log Out</span>
              </button>
            </>
          ) : (
            <>
              <button onClick={() => { setAuthPage("login"); setMenuOpen(false); }} style={{ background:"none", border:`1px solid rgba(124,58,237,0.3)`, borderRadius:9, padding:"11px", fontWeight:600, cursor:"pointer", fontSize:14, color:"#7c3aed", ...mono }}>Log In</button>
              <button onClick={() => { setAuthPage("signup"); setMenuOpen(false); }} style={{ background:"linear-gradient(135deg,#0077ff,#7c3aed)", color:"#fff", border:"none", borderRadius:9, padding:"11px", fontWeight:600, cursor:"pointer", fontSize:14 }}>Sign Up</button>
            </>
          )}
        </div>
      )}

      {/* HERO */}
      <div style={{ padding:`40px ${px}`, background:"transparent" }}>
        <div style={{ textAlign:"center", maxWidth:700, margin:"0 auto 36px" }}>
          <div style={{ ...mono, display:"inline-flex", alignItems:"center", gap:7, fontSize:11, color:C.accent, border:"1px solid rgba(0,119,255,0.2)", background:"rgba(0,119,255,0.05)", padding:"4px 14px", borderRadius:100, marginBottom:18, letterSpacing:1 }}>
            <span style={{ width:5, height:5, borderRadius:"50%", background:C.accent, display:"inline-block" }}></span>
            AI Detection · Real-time Analysis
          </div>
          <h1 style={{ ...syne, fontSize:isMobile?"36px":isTablet?"52px":"66px", lineHeight:.95, letterSpacing:-2, marginBottom:16, color:"var(--tl-text)" }}>
            Is it real?<br />
            <span
              key={String(isDark)}
              className="tl-gradient-text"
              style={{
                background: isDark
                  ? "linear-gradient(90deg,#4da6ff,#a855f7)"
                  : "linear-gradient(90deg,#0077ff,#7c3aed)",
              }}
            >We'll know.</span>
          </h1>
          <p style={{ fontSize:isMobile?14:16, color:"var(--tl-muted)", lineHeight:1.65, maxWidth:480, margin:"0 auto" }}>
            Upload any image or video and get a forensic-grade analysis to detect AI-generated content, deepfakes, and synthetic media — in seconds.
          </p>
        </div>

        <div style={{ maxWidth:620, margin:"0 auto 28px", display:"flex", flexDirection:"column", gap:12 }}>
          {scanState !== "done" && (
            <div style={{ display:"flex", gap:7, flexWrap:"wrap", justifyContent:"center" }}>
              {MEDIA_TABS.map(({ label, Icon:TabIcon }, i) => (
                <div key={i} onClick={() => { setTab(i); handleRemove(); }}
                  style={{ ...mono, fontSize:11, padding:"6px 13px", borderRadius:100, border:`1px solid ${i===tab?C.accent:"var(--tl-tab-border)"}`, background:i===tab?C.accent:"var(--tl-tab-inactive)", color:i===tab?"#fff":"var(--tl-muted)", cursor:"pointer", display:"flex", alignItems:"center", gap:5, backdropFilter:"blur(8px)" }}>
                  <TabIcon size={12} />{label}
                </div>
              ))}
            </div>
          )}
          {scanState === "idle" && !file   && <UploadZone tab={tab} onFileSelected={handleFileSelected} isMobile={isMobile} />}
          {scanState === "idle" && file    && <FilePreview file={file} onRemove={handleRemove} onScan={handleScan} />}
          {scanState === "idle" && scanError && (
            <div style={{
              border: "1px solid rgba(232,0,61,0.25)",
              background: "rgba(232,0,61,0.08)",
              color: "#e8003d",
              borderRadius: 10,
              padding: "10px 12px",
              fontSize: 12,
              fontFamily: "monospace",
            }}>
              {scanError}
            </div>
          )}
          {scanState === "scanning"         && <ScanProgress step={scanStep} progress={scanProgress} />}
          {scanState === "done" && scanScore !== null && (
            <ScanResult file={file} score={scanScore} resultData={scanResultData} onReset={handleRemove} isMobile={isMobile} isTablet={isTablet} isLoggedIn={isLoggedIn} onLoginRequest={() => setAuthPage("login")} />
          )}
        </div>

        {/* FIX: key is now just index — stats persist across scans instead of remounting */}
        <div style={{ background:"var(--tl-card-bg)", border:"1px solid var(--tl-card-border)", backdropFilter:"blur(14px)", WebkitBackdropFilter:"blur(14px)", boxShadow:"var(--tl-card-shadow)", display:"grid", gridTemplateColumns:isMobile?"1fr 1fr":"repeat(4,1fr)", maxWidth:620, margin:"0 auto", borderRadius:12, overflow:"hidden" }}>
          {liveStatTargets.map((target, i) => (
            <AnimatedStat
              key={i}
              target={target}
              index={i}
              isMobile={isMobile}
              total={liveStatTargets.length}
            />
          ))}
        </div>
      </div>

      <div style={{ height:1, background:"var(--tl-divider)", margin:`0 ${px}` }}></div>

      {/* FEATURES */}
      <div style={{ padding:`40px ${px}`, maxWidth:1060, margin:"0 auto" }}>
        <div style={{ ...mono, fontSize:11, color:C.accent, letterSpacing:2, marginBottom:6 }}>// CAPABILITIES</div>
        <h2 style={{ ...syne, fontSize:isMobile?22:28, letterSpacing:-1, marginBottom:28, color:"var(--tl-text)" }}>Everything you need to fight synthetic media</h2>
        <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr":isTablet?"1fr 1fr":"repeat(3,1fr)", gap:14 }}>
          {FEATURES.map(({ Icon:FIcon, title, desc, tag, tc, tb, top }, i) => (
            <div key={i} className="card-hover" style={{ ...card, padding:20, position:"relative", overflow:"hidden" }}>
              <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:top }} />
              <div style={{ width:40, height:40, borderRadius:10, background:`${top}15`, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:12 }}>
                <FIcon size={20} color={top} />
              </div>
              <div style={{ ...syne, fontSize:13, marginBottom:5, color:"var(--tl-text)" }}>{title}</div>
              <p style={{ fontSize:12, color:"var(--tl-muted)", lineHeight:1.6, marginBottom:10 }}>{desc}</p>
              {tag && <span style={{ ...mono, fontSize:10, padding:"2px 9px", borderRadius:100, background:tb, color:tc, border:`1px solid ${tc}33` }}>{tag}</span>}
            </div>
          ))}
        </div>
      </div>

      {/* FOOTER */}
      <footer style={{ borderTop:`1px solid var(--tl-nav-border)`, padding:`20px ${px}`, background:"var(--tl-nav-bg)", backdropFilter:"blur(14px)", WebkitBackdropFilter:"blur(14px)", display:"flex", flexDirection:isMobile?"column":"row", alignItems:isMobile?"flex-start":"center", justifyContent:"space-between", gap:12, transition:"background .3s" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ width:24, height:24, borderRadius:6, background:"linear-gradient(135deg,#0077ff,#7c3aed)", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <Search size={12} color="#fff" />
          </div>
          <span style={{ ...syne, fontSize:15 }}>Truth<span style={{ color:C.accent }}>Lens</span></span>
        </div>
        <span style={{ ...mono, fontSize:11, color:"var(--tl-muted)" }}>© 2025 TruthLens · Built to fight synthetic media</span>
        <div style={{ display:"flex", gap:16 }}>
          {["Privacy","Terms","API Docs"].map(l => (
            <span key={l} style={{ ...mono, fontSize:11, color:"var(--tl-muted)", cursor:"pointer" }}>{l}</span>
          ))}
        </div>
      </footer>

      </div>

      {/* Auth Modal */}
      {authPage && (
        <div style={{ position:"fixed", inset:0, zIndex:500, display:"flex", alignItems:"center", justifyContent:"center", padding:"20px" }}>
          <div onClick={() => setAuthPage(null)} style={{ position:"absolute", inset:0, background:"rgba(15,10,30,0.55)", backdropFilter:"blur(8px)", WebkitBackdropFilter:"blur(8px)" }} />
          <div style={{ position:"relative", zIndex:1, background:"var(--tl-modal-bg)", backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)", border:`1px solid var(--tl-card-border)`, borderRadius:20, boxShadow:"0 24px 80px rgba(124,58,237,0.2)", width:"100%", maxWidth: authPage === "signup" ? 860 : 440, maxHeight:"90vh", overflowY:"auto" }}>
            <button onClick={() => setAuthPage(null)} style={{ position:"absolute", top:16, right:16, background:"rgba(124,58,237,0.08)", border:"none", borderRadius:"50%", width:32, height:32, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", zIndex:2 }}>
              <X size={16} color="#7c3aed" />
            </button>
            {authPage === "login"  && <AuthLogin  onSwitch={() => setAuthPage("signup")} onClose={() => { setAuthPage(null); setIsLoggedIn(true); }} />}
            {authPage === "signup" && <AuthSignup onSwitch={() => setAuthPage("login")}  onClose={() => { setAuthPage(null); setIsLoggedIn(true); }} isMobile={isMobile} />}
          </div>
        </div>
      )}

    </div>
  );
}
