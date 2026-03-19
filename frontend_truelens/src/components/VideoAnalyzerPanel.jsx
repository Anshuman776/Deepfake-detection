import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Brain, Target, Shield, Link2, Waves, PuzzleIcon, Search, User, Thermometer, FileText, Zap, FolderOpen, Clock, Image, Video, Mic, Type, Globe, Menu, X, CheckCircle, AlertTriangle, UploadCloud, Trash2, ScanLine, Mail, Lock, Eye, EyeOff, ArrowRight, Layers, Moon, Sun } from "lucide-react";
import { mono, syne, C } from "../theme.js";
import { generateProb } from "../utils/detection.js";
import TemporalChart from "./TemporalChart.jsx";

function VideoAnalyzerPanel({ file, score, vc, isAI, isMobile }) {
  const videoRef   = useRef(null);
  const [videoUrl, setVideoUrl]     = useState(null);
  const [playing,  setPlaying]      = useState(false);
  const [currentT, setCurrentT]     = useState(0);
  const [duration, setDuration]     = useState(0);
  const [muted,    setMuted]        = useState(true);
  const [showOverlay, setShowOverlay] = useState(true);
  const rafRef = useRef(null);

  // Create object URL from uploaded file (not available for URL-based scans)
  const isUrlScan = file?.isUrl;
  useEffect(() => {
    if (!file || isUrlScan) return;
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file, isUrlScan]);

  // Sync playback state
  const onTimeUpdate = () => {
    if (videoRef.current) setCurrentT(videoRef.current.currentTime);
  };
  const onLoadedMetadata = () => {
    if (videoRef.current) setDuration(videoRef.current.duration || 0);
  };
  const onEnded = () => setPlaying(false);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (playing) { v.pause(); setPlaying(false); }
    else         { v.play().catch(() => {}); setPlaying(true); setShowOverlay(false); }
  };

  const handleSeek = (e) => {
    const v = videoRef.current;
    if (!v || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct  = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    v.currentTime = pct * duration;
    setCurrentT(pct * duration);
  };

  const toggleMute = () => {
    if (videoRef.current) { videoRef.current.muted = !muted; setMuted(m => !m); }
  };

  const formatTime = (s) => {
    if (!s || isNaN(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const playPct  = duration > 0 ? (currentT / duration) * 100 : 0;

  // AI probability at current timestamp (maps playback position → chart prob)
  const CHART_PTS = 40;
  const currentAiProb = useMemo(() => {
    if (!duration) return Math.round(generateProb(score, 15, CHART_PTS));
    const idx = Math.round((currentT / duration) * (CHART_PTS - 1));
    return Math.round(generateProb(score, Math.min(idx, CHART_PTS - 1), CHART_PTS));
  }, [currentT, duration, score]);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>

      {/* ── Real video player ── */}
      <div style={{ background:"#0a0d14", borderRadius:12, overflow:"hidden", position:"relative" }}>

        {/* Video element */}
        {videoUrl ? (
          <div style={{ position:"relative" }}>
            <video
              ref={videoRef}
              src={videoUrl}
              muted={muted}
              playsInline
              onTimeUpdate={onTimeUpdate}
              onLoadedMetadata={onLoadedMetadata}
              onEnded={onEnded}
              onClick={togglePlay}
              style={{
                width:"100%",
                maxHeight: isMobile ? 120 : 150,
                display:"block",
                objectFit:"contain",
                background:"#000",
                cursor:"pointer",
              }}
            />

            {/* AI score overlay badge — top right */}
            <div style={{
              position:"absolute", top:10, right:10,
              background:"rgba(0,0,0,0.72)", backdropFilter:"blur(6px)",
              borderRadius:8, padding:"5px 10px",
              display:"flex", alignItems:"center", gap:6,
              border:`1px solid ${vc}44`,
            }}>
              <div style={{ width:6, height:6, borderRadius:"50%", background:vc, boxShadow:`0 0 6px ${vc}` }} />
              <span style={{ ...mono, fontSize:10, color:vc, fontWeight:700 }}>
                AI Prob: {currentAiProb}%
              </span>
            </div>

            {/* AI DETECTED stamp — top left */}
            {isAI && (
              <div style={{
                position:"absolute", top:10, left:10,
                background:"#e8003d", color:"#fff",
                ...mono, fontSize:9, fontWeight:700,
                padding:"3px 8px", borderRadius:4, letterSpacing:1,
              }}>
                AI DETECTED
              </div>
            )}

            {/* Centre play/pause overlay */}
            {showOverlay && !playing && (
              <div
                onClick={togglePlay}
                style={{
                  position:"absolute", inset:0,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  background:"rgba(0,0,0,0.35)", cursor:"pointer",
                }}
              >
                <div style={{
                  width:52, height:52, borderRadius:"50%",
                  background:"rgba(124,58,237,0.25)", backdropFilter:"blur(8px)",
                  border:"1.5px solid rgba(124,58,237,0.5)",
                  display:"flex", alignItems:"center", justifyContent:"center",
                }}>
                  <div style={{ width:0, height:0, borderLeft:"18px solid #fff", borderTop:"11px solid transparent", borderBottom:"11px solid transparent", marginLeft:4 }} />
                </div>
              </div>
            )}
          </div>
        ) : (
          /* URL-based video scan — can't embed, show placeholder */
          <div style={{
            height: isMobile ? 100 : 120,
            display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
            background:"linear-gradient(135deg,#0d1117,#161b22)", gap:10,
          }}>
            <div style={{ width:48, height:48, borderRadius:12, background:`${vc}18`, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Video size={22} color={vc} />
            </div>
            <span style={{ ...mono, fontSize:11, color:"var(--tl-muted)", textAlign:"center", padding:"0 20px" }}>
              Video preview unavailable for URL scans
            </span>
            <div style={{
              background:`${vc}18`, border:`1px solid ${vc}33`,
              borderRadius:6, padding:"4px 12px",
              ...mono, fontSize:10, color:vc,
            }}>
              {isAI ? "AI DETECTED" : "ANALYSIS COMPLETE"}
            </div>
          </div>
        )}

        {/* Controls bar */}
        <div style={{ padding:"10px 12px", background:"rgba(0,0,0,0.6)", display:"flex", flexDirection:"column", gap:8 }}>

          {/* Seek bar — clickable */}
          <div
            onClick={handleSeek}
            style={{ height:4, background:"var(--tl-signal-track)", borderRadius:100, cursor:"pointer", position:"relative", overflow:"visible" }}
          >
            {/* Played portion */}
            <div style={{ height:"100%", width:`${playPct}%`, background:vc, borderRadius:100, transition:"width .1s linear", position:"relative" }}>
              {/* Thumb */}
              <div style={{
                position:"absolute", right:-5, top:"50%", transform:"translateY(-50%)",
                width:10, height:10, borderRadius:"50%", background:"#fff",
                boxShadow:`0 0 4px ${vc}`,
              }} />
            </div>
          </div>

          {/* Play/pause + time + mute row */}
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            {/* Play/Pause */}
            <button onClick={togglePlay} style={{
              width:28, height:28, borderRadius:"50%", flexShrink:0,
              background: playing ? vc : "rgba(255,255,255,0.12)",
              border:"none", cursor:"pointer",
              display:"flex", alignItems:"center", justifyContent:"center",
              transition:"background .2s",
            }}>
              {playing
                ? <div style={{ width:7, height:7, background:"#fff", borderRadius:1 }} />
                : <div style={{ width:0, height:0, borderLeft:"8px solid #fff", borderTop:"5px solid transparent", borderBottom:"5px solid transparent", marginLeft:2 }} />
              }
            </button>

            {/* Time */}
            <span style={{ ...mono, fontSize:10, color:"var(--tl-muted)" }}>
              {formatTime(currentT)} / {formatTime(duration)}
            </span>

            <div style={{ flex:1 }} />

            {/* Mute toggle */}
            {videoUrl && (
              <button onClick={toggleMute} style={{
                background:"none", border:"none", cursor:"pointer", padding:4,
                ...mono, fontSize:9, color:"var(--tl-muted)",
              }}>
                {muted ? "🔇" : "🔊"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Temporal chart */}
      <TemporalChart score={score} vc={vc} isMobile={isMobile} label="AI Temporal Analysis" />
    </div>
  );
}

// ── Main gate component ───────────────────────────────────────────────────────

export default VideoAnalyzerPanel;
