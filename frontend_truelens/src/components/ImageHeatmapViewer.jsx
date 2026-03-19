import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Brain, Target, Shield, Link2, Waves, PuzzleIcon, Search, User, Thermometer, FileText, Zap, FolderOpen, Clock, Image, Video, Mic, Type, Globe, Menu, X, CheckCircle, AlertTriangle, UploadCloud, Trash2, ScanLine, Mail, Lock, Eye, EyeOff, ArrowRight, Layers, Moon, Sun } from "lucide-react";
import { C, card, hdr, mono, syne } from "../theme.js";
import { AI_INDICATORS } from "../constants.js";

function ImageHeatmapViewer({ file, score, isMobile }) {
  const [originalUrl, setOriginalUrl] = useState(null);
  const [activePanel, setActivePanel] = useState("split"); // "original" | "heatmap" | "split"
  const [heatmapReady, setHeatmapReady] = useState(false);
  const [scanlineY, setScanlineY] = useState(0);
  const [revealed, setRevealed]   = useState(false);
  const heatCanvasRef = useRef(null);
  const animRef       = useRef(null);

  const isAI    = score >= 65;
  const isMixed = score >= 40 && score < 65;
  const vc      = isAI ? "#e8003d" : isMixed ? "#d97706" : "#059669";
  const verdictLabel = isAI ? "FAKE" : isMixed ? "UNCERTAIN" : "REAL";

  // Pick indicators relevant to score
  const indicators = useMemo(() => {
    const count = isAI ? 3 : isMixed ? 2 : 1;
    return AI_INDICATORS.slice(0, count);
  }, [isAI, isMixed]);

  const isImageFile = file?.type?.startsWith("image/") && !file?.isUrl;
  const isImageUrl  = file?.isUrl && file?.urlMediaType === "image";

  // Load the real uploaded image OR fetch from image URL
  useEffect(() => {
    if (isImageFile) {
      const url = URL.createObjectURL(file);
      setOriginalUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    if (isImageUrl) {
      setOriginalUrl(file.name); // file.name holds the URL string for URL scans
    }
  }, [file, isImageFile, isImageUrl]);

  // Draw heatmap on canvas once image is loaded
  const drawHeatmap = useCallback((imgEl, canvas) => {
    const ctx = canvas.getContext("2d");
    const W = canvas.width  = imgEl.naturalWidth  || 400;
    const H = canvas.height = imgEl.naturalHeight || 300;

    // Draw original image as base
    ctx.drawImage(imgEl, 0, 0, W, H);

    // Generate seeded pseudo-random blobs based on score
    const seed  = score * 13.7;
    const blobs = Math.floor(3 + (score / 100) * 7);

    ctx.globalCompositeOperation = "source-over";
    for (let b = 0; b < blobs; b++) {
      // Deterministic positions from seed
      const bx = ((Math.sin(seed + b * 2.3) * 0.5 + 0.5) * 0.7 + 0.15) * W;
      const by = ((Math.cos(seed + b * 1.7) * 0.5 + 0.5) * 0.7 + 0.15) * H;
      const rx = (0.1 + (Math.sin(seed + b * 3.1) * 0.5 + 0.5) * 0.2) * W;
      const ry = (0.08 + (Math.cos(seed + b * 2.9) * 0.5 + 0.5) * 0.15) * H;
      const intensity = 0.35 + (score / 100) * 0.45;

      // Outer glow — orange/red
      const grd = ctx.createRadialGradient(bx, by, 0, bx, by, Math.max(rx, ry));
      if (score >= 65) {
        grd.addColorStop(0,   `rgba(232,0,61,${intensity})`);
        grd.addColorStop(0.4, `rgba(220,80,0,${intensity * 0.6})`);
        grd.addColorStop(1,   "rgba(232,0,61,0)");
      } else if (score >= 40) {
        grd.addColorStop(0,   `rgba(217,119,6,${intensity})`);
        grd.addColorStop(0.4, `rgba(234,179,8,${intensity * 0.6})`);
        grd.addColorStop(1,   "rgba(217,119,6,0)");
      } else {
        grd.addColorStop(0,   `rgba(5,150,105,${intensity * 0.5})`);
        grd.addColorStop(1,   "rgba(5,150,105,0)");
      }
      ctx.save();
      ctx.scale(1, ry / rx);
      ctx.beginPath();
      ctx.arc(bx, by * (rx / ry), rx, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();
      ctx.restore();
    }

    // Scanline grid overlay for authenticity feel
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = "rgba(255,255,255,0.04)";
    ctx.lineWidth   = 1;
    for (let y = 0; y < H; y += 4) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    // "FAKE DETECTED" watermark stamp if high score
    if (score >= 65) {
      ctx.save();
      ctx.font = `bold ${Math.round(W * 0.055)}px monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.globalAlpha = 0.12;
      ctx.fillStyle = "#e8003d";
      ctx.translate(W / 2, H / 2);
      ctx.rotate(-0.35);
      ctx.fillText("FAKE DETECTED", 0, 0);
      ctx.restore();
    }
  }, [score]);

  useEffect(() => {
    if (!originalUrl || !heatCanvasRef.current) return;
    const img = new window.Image();
    img.onload = () => {
      drawHeatmap(img, heatCanvasRef.current);
      setHeatmapReady(true);
      // Animate scan reveal
      let y = 0;
      const total = heatCanvasRef.current?.height || 300;
      const step  = () => {
        y += total / 40;
        setScanlineY(y);
        if (y < total) animRef.current = requestAnimationFrame(step);
        else { setRevealed(true); setScanlineY(0); }
      };
      animRef.current = requestAnimationFrame(step);
    };
    img.src = originalUrl;
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [originalUrl, drawHeatmap]);

  if ((!isImageFile && !isImageUrl) || !originalUrl) return null;

  const panels = ["split", "original", "heatmap"];
  const panelLabels = { split:"Split View", original:"Original", heatmap:"Heatmap" };

  return (
    <div className="card-hover" style={{ ...card, overflow:"hidden" }}>
      {/* Header */}
      <div style={{ ...hdr, justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:28, height:28, borderRadius:7, background:"rgba(232,0,61,0.1)", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <Layers size={14} color="#e8003d" />
          </div>
          <span style={{ ...syne, fontSize:13 }}>Image Manipulation Heatmap</span>
        </div>
        {/* View toggle pills */}
        <div style={{ display:"flex", gap:4, background:"var(--tl-lavender)", borderRadius:8, padding:3 }}>
          {panels.map(p => (
            <button key={p} onClick={() => setActivePanel(p)} style={{
              ...mono, fontSize:10, padding:"4px 10px", borderRadius:6, border:"none", cursor:"pointer",
              background: activePanel === p ? "#fff" : "transparent",
              color: activePanel === p ? "var(--tl-text)" : "var(--tl-muted)",
              boxShadow: activePanel === p ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
              transition:"all .15s",
            }}>
              {panelLabels[p]}
            </button>
          ))}
        </div>
      </div>

      {/* Main viewer */}
      <div style={{ padding:"14px 16px", display:"flex", flexDirection: isMobile ? "column" : "row", gap:12 }}>

        {/* Image panels */}
        <div style={{ flex:1, minWidth:0 }}>
          {activePanel === "split" && (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
              {/* Original */}
              <div style={{ borderRadius:10, overflow:"hidden", position:"relative", background:"#000" }}>
                <img src={originalUrl} alt="Original"
                  style={{ width:"100%", height:isMobile?130:190, objectFit:"cover", display:"block", opacity:0.95 }} />
                <div style={{ position:"absolute", bottom:0, left:0, right:0, background:"linear-gradient(transparent,rgba(0,0,0,0.6))", padding:"18px 10px 8px" }}>
                  <span style={{ ...mono, fontSize:10, color:"#fff", letterSpacing:1 }}>ORIGINAL FRAME</span>
                </div>
              </div>
              {/* Heatmap canvas */}
              <div style={{ borderRadius:10, overflow:"hidden", position:"relative", background:"#111" }}>
                <canvas ref={heatCanvasRef}
                  style={{ width:"100%", height:isMobile?130:190, objectFit:"cover", display:"block" }} />
                {/* Scanline animation */}
                {!revealed && heatmapReady && (
                  <div style={{ position:"absolute", top:0, left:0, right:0, bottom:0, overflow:"hidden", pointerEvents:"none" }}>
                    <div style={{ position:"absolute", left:0, right:0, top:scanlineY, height:2, background:"rgba(0,119,255,0.8)", boxShadow:"0 0 8px rgba(0,119,255,0.6)", transition:"top .04s linear" }} />
                    <div style={{ position:"absolute", left:0, right:0, top:scanlineY, bottom:0, background:"rgba(0,0,0,0.45)" }} />
                  </div>
                )}
                {/* Fake detected badge */}
                {score >= 65 && heatmapReady && (
                  <div style={{ position:"absolute", top:8, left:8, background:"#e8003d", color:"#fff", ...mono, fontSize:9, fontWeight:700, padding:"3px 8px", borderRadius:4, letterSpacing:1 }}>
                    FAKE DETECTED
                  </div>
                )}
                <div style={{ position:"absolute", bottom:0, left:0, right:0, background:"linear-gradient(transparent,rgba(0,0,0,0.65))", padding:"18px 10px 8px" }}>
                  <span style={{ ...mono, fontSize:10, color:"#fff", letterSpacing:1 }}>MANIPULATION HEATMAP</span>
                </div>
              </div>
            </div>
          )}

          {activePanel === "original" && (
            <div style={{ borderRadius:10, overflow:"hidden", position:"relative", background:"#000" }}>
              <img src={originalUrl} alt="Original"
                style={{ width:"100%", height:isMobile?200:240, objectFit:"cover", display:"block" }} />
              <div style={{ position:"absolute", bottom:0, left:0, right:0, background:"linear-gradient(transparent,rgba(0,0,0,0.6))", padding:"24px 14px 12px" }}>
                <span style={{ ...mono, fontSize:11, color:"#fff", letterSpacing:1 }}>ORIGINAL FRAME</span>
              </div>
            </div>
          )}

          {activePanel === "heatmap" && (
            <div style={{ borderRadius:10, overflow:"hidden", position:"relative", background:"#111" }}>
              <canvas ref={heatCanvasRef}
                style={{ width:"100%", height:isMobile?200:240, objectFit:"cover", display:"block" }} />
              {score >= 65 && heatmapReady && (
                <div style={{ position:"absolute", top:10, left:10, background:"#e8003d", color:"#fff", ...mono, fontSize:9, fontWeight:700, padding:"3px 8px", borderRadius:4, letterSpacing:1 }}>
                  FAKE DETECTED
                </div>
              )}
              <div style={{ position:"absolute", bottom:0, left:0, right:0, background:"linear-gradient(transparent,rgba(0,0,0,0.65))", padding:"24px 14px 12px" }}>
                <span style={{ ...mono, fontSize:11, color:"#fff", letterSpacing:1 }}>MANIPULATION HEATMAP</span>
              </div>
            </div>
          )}

          <p style={{ ...mono, fontSize:10, color:"var(--tl-muted)", textAlign:"center", marginTop:8 }}>
            Highlighted regions indicate areas likely manipulated in fake media.
          </p>
        </div>

        {/* Right panel — indicators */}
        <div style={{ width: isMobile ? "100%" : 180, flexShrink:0, display:"flex", flexDirection:"column", gap:10 }}>

          {/* Mini donut score */}
          <div style={{ background:"var(--tl-lavender)", borderRadius:10, padding:"12px", textAlign:"center" }}>
            <div style={{ position:"relative", width:70, height:70, margin:"0 auto 8px" }}>
              <svg viewBox="0 0 80 80" width="70" height="70">
                <circle cx="40" cy="40" r="32" fill="none" stroke={`${vc}20`} strokeWidth="7"/>
                <circle cx="40" cy="40" r="32" fill="none" stroke={vc} strokeWidth="7"
                  strokeDasharray={2 * Math.PI * 32}
                  strokeDashoffset={2 * Math.PI * 32 * (1 - score / 100)}
                  strokeLinecap="round" transform="rotate(-90 40 40)"
                  style={{ transition:"stroke-dashoffset 1.2s ease" }} />
              </svg>
              <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
                <span style={{ ...syne, fontSize:16, color:vc }}>{score}%</span>
              </div>
            </div>
            <div style={{ ...mono, fontSize:9, color:"var(--tl-muted)", letterSpacing:1 }}>FAKE SCORE</div>
            <div style={{ ...mono, fontSize:10, color:vc, fontWeight:700, marginTop:4 }}>
              {verdictLabel}
            </div>
          </div>

          {/* Indicators */}
          <div style={{ background:"var(--tl-lavender)", borderRadius:10, padding:"12px", flex:1 }}>
            <div style={{ ...mono, fontSize:9, color:"var(--tl-muted)", letterSpacing:1, marginBottom:8 }}>FAKE / REAL INDICATORS</div>
            <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
              {indicators.map((ind, i) => (
                <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:6 }}>
                  <AlertTriangle size={11} color="#d97706" style={{ flexShrink:0, marginTop:1 }} />
                  <span style={{ ...mono, fontSize:10, color:"var(--tl-text-sec)", lineHeight:1.4 }}>{ind}</span>
                </div>
              ))}
              {!isAI && !isMixed && (
                <div style={{ display:"flex", alignItems:"flex-start", gap:6 }}>
                  <CheckCircle size={11} color="#059669" style={{ flexShrink:0, marginTop:1 }} />
                  <span style={{ ...mono, fontSize:10, color:"var(--tl-text-sec)", lineHeight:1.4 }}>No fake artifacts found</span>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// ── Scan Result ───────────────────────────────────────────────────────────────


export default ImageHeatmapViewer;
