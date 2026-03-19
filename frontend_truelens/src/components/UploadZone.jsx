import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Brain, Target, Shield, Link2, Waves, PuzzleIcon, Search, User, Thermometer, FileText, Zap, FolderOpen, Clock, Image, Video, Mic, Type, Globe, Menu, X, CheckCircle, AlertTriangle, UploadCloud, Trash2, ScanLine, Mail, Lock, Eye, EyeOff, ArrowRight, Layers, Moon, Sun } from "lucide-react";
import { C, mono, syne } from "../theme.js";
import { MEDIA_TABS, ACCEPT_CFG } from "../constants.js";
import { sniffUrlMediaType } from "../utils/detection.js";
import { formatBytes } from "../utils/format.js";
import BottomSheet from "./BottomSheet.jsx";

function UploadZone({ tab, onFileSelected, isMobile }) {
  // ALL hooks declared unconditionally at the top — fixes React error #310
  const [dragging, setDragging]   = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [urlInput, setUrlInput]   = useState("");
  const [urlError, setUrlError]   = useState("");
  const galleryRef = useRef();
  const cameraRef  = useRef();
  const cfg = ACCEPT_CFG[tab];
  const isImageTab = tab === 0;

  const handleFile = useCallback((file) => {
    if (!file || !cfg) return;
    const sizeMB = file.size / (1024*1024);
    if (sizeMB > cfg.maxMB) { alert(`File too large. Max ${cfg.maxMB}MB allowed.`); return; }
    onFileSelected(file);
  }, [cfg, onFileSelected]);

  const onDrop     = (e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); };
  const onDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);

  const openGallery = () => { setSheetOpen(false); setTimeout(() => galleryRef.current?.click(), 150); };
  const openCamera  = () => { setSheetOpen(false); setTimeout(() => cameraRef.current?.click(),  150); };

  const handleScanUrl = () => {
    setUrlError("");
    const trimmed = urlInput.trim();
    if (!trimmed) { setUrlError("Please enter a URL."); return; }
    try { new URL(trimmed); } catch(e) { setUrlError("That doesn't look like a valid URL."); return; }
    const mediaType = sniffUrlMediaType(trimmed);
    if (!mediaType) {
      setUrlError("Only direct image, video, or audio URLs are supported. Website links are not allowed.");
      return;
    }
    const mimeMap = { image:"image/url", video:"video/url", audio:"audio/url" };
    onFileSelected({ name:trimmed, size:0, type:mimeMap[mediaType], isUrl:true, urlMediaType:mediaType });
  };

  // URL tab
  if (tab === 4) {
    return (
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        <div style={{ ...mono, fontSize:12, color:"var(--tl-muted)" }}>
          Paste a direct image, video, or audio URL — website links are not supported
        </div>
        {/* Supported format pills */}
        <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
          {[
            { label:"Images", exts:"JPG · PNG · WEBP · GIF",   color:"#0077ff" },
            { label:"Video",  exts:"MP4 · MOV · WEBM",         color:"#7c3aed" },
            { label:"Audio",  exts:"MP3 · WAV · OGG",          color:"#059669" },
          ].map(({ label, exts, color }) => (
            <div key={label} style={{ display:"flex", alignItems:"center", gap:5, padding:"4px 10px", borderRadius:7, background:`${color}10`, border:`1px solid ${color}30` }}>
              <span style={{ ...mono, fontSize:10, color, fontWeight:700 }}>{label}</span>
              <span style={{ ...mono, fontSize:9, color:"var(--tl-muted)" }}>{exts}</span>
            </div>
          ))}
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <input
            type="url"
            placeholder="https://example.com/photo.jpg  or  cdn.example.com/clip.mp4"
            value={urlInput}
            onChange={e => { setUrlInput(e.target.value); setUrlError(""); }}
            onKeyDown={e => e.key === "Enter" && handleScanUrl()}
            style={{
              flex:1, padding:"11px 14px", borderRadius:10,
              border:`1px solid ${urlError ? "#e8003d" : "var(--tl-border)"}`,
              background:"var(--tl-surface2)", fontSize:13, fontFamily:"sans-serif",
              color:"var(--tl-text)", outline:"none", transition:"border-color .2s",
            }}
          />
          <button
            onClick={handleScanUrl}
            style={{ background:C.accent, color:"#fff", border:"none", borderRadius:10, padding:"11px 18px", fontWeight:600, fontSize:13, cursor:"pointer", whiteSpace:"nowrap" }}>
            Scan URL
          </button>
        </div>
        {urlError && (
          <div style={{ display:"flex", alignItems:"flex-start", gap:6, background:"rgba(232,0,61,0.08)", border:"1px solid rgba(232,0,61,0.25)", borderRadius:8, padding:"9px 12px" }}>
            <AlertTriangle size={13} color="#e8003d" style={{ flexShrink:0, marginTop:1 }} />
            <span style={{ ...mono, fontSize:12, color:"#e8003d", lineHeight:1.5 }}>{urlError}</span>
          </div>
        )}
      </div>
    );
  }

  const hiddenInputs = (
    <>
      <input
        ref={galleryRef} type="file"
        accept={MEDIA_TABS[tab]?.mime}
        style={{ display:"none" }}
        onChange={e => handleFile(e.target.files[0])}
      />
      {isImageTab && (
        <input
          ref={cameraRef} type="file"
          accept="image/*"
          capture="environment"
          style={{ display:"none" }}
          onChange={e => handleFile(e.target.files[0])}
        />
      )}
    </>
  );

  if (isMobile) {
    return (
      <>
        {hiddenInputs}
        <div
          onClick={() => setSheetOpen(true)}
          style={{
            border:"1.5px dashed var(--tl-upload-border)", borderRadius:16,
            padding:"44px 24px",
            background:"var(--tl-card-bg)",
            backdropFilter:"blur(14px)", WebkitBackdropFilter:"blur(14px)",
            boxShadow:"var(--tl-card-shadow)",
            cursor:"pointer", textAlign:"center", transition:"all .2s",
          }}
        >
          <div style={{ width:54, height:54, margin:"0 auto 12px", background:"rgba(124,58,237,0.1)", borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <UploadCloud size={26} color={C.accent} />
          </div>
          <div style={{ ...syne, fontSize:16, marginBottom:5 }}>Tap to add file</div>
          <div style={{ ...mono, fontSize:12, color:"var(--tl-muted)", marginBottom:14 }}>upload or take a photo</div>
          <div style={{ display:"flex", gap:6, justifyContent:"center", flexWrap:"wrap" }}>
            {cfg?.exts.map(c => (
              <span key={c} style={{ ...mono, fontSize:10, padding:"3px 9px", borderRadius:100, border:"1px solid var(--tl-border)", color:"var(--tl-muted)", background:'var(--tl-pill-bg)' }}>{c}</span>
            ))}
            <span style={{ ...mono, fontSize:10, padding:"3px 9px", borderRadius:100, border:"1px solid var(--tl-border)", color:"var(--tl-muted)", background:'var(--tl-pill-bg)' }}>max {cfg?.maxMB}MB</span>
          </div>
        </div>

        <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)}>
          <div style={{ padding:"0 16px" }}>
            <div style={{ ...syne, fontSize:15, marginBottom:4, paddingLeft:4 }}>Add File</div>
            <div style={{ ...mono, fontSize:12, color:"var(--tl-muted)", marginBottom:20, paddingLeft:4 }}>
              Choose how you'd like to add your {MEDIA_TABS[tab]?.label.toLowerCase()}
            </div>
            <button
              onClick={openGallery}
              style={{
                width:"100%", display:"flex", alignItems:"center", gap:16,
                background:"var(--tl-surface2)", border:"none", borderRadius:14,
                padding:"16px", cursor:"pointer", marginBottom:10, textAlign:"left",
              }}
            >
              <div style={{ width:48, height:48, borderRadius:12, background:"rgba(0,119,255,0.1)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <FolderOpen size={22} color={C.accent} />
              </div>
              <div>
                <div style={{ ...syne, fontSize:15, color:"var(--tl-text)", marginBottom:3 }}>Choose from Gallery</div>
                <div style={{ ...mono, fontSize:12, color:"var(--tl-muted)" }}>Browse files, photos & documents</div>
              </div>
            </button>
            {isImageTab && (
              <button
                onClick={openCamera}
                style={{
                  width:"100%", display:"flex", alignItems:"center", gap:16,
                  background:"var(--tl-surface2)", border:"none", borderRadius:14,
                  padding:"16px", cursor:"pointer", marginBottom:10, textAlign:"left",
                }}
              >
                <div style={{ width:48, height:48, borderRadius:12, background:"rgba(124,58,237,0.1)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <ScanLine size={22} color="#7c3aed" />
                </div>
                <div>
                  <div style={{ ...syne, fontSize:15, color:"var(--tl-text)", marginBottom:3 }}>Take a Photo</div>
                  <div style={{ ...mono, fontSize:12, color:"var(--tl-muted)" }}>Open camera and capture now</div>
                </div>
              </button>
            )}
            <button
              onClick={() => setSheetOpen(false)}
              style={{
                width:"100%", padding:"14px", border:"1px solid var(--tl-border)",
                borderRadius:14, background:"transparent", cursor:"pointer",
                ...mono, fontSize:14, color:"var(--tl-muted)", marginTop:4,
              }}
            >
              Cancel
            </button>
          </div>
        </BottomSheet>
      </>
    );
  }

  return (
    <>
      {hiddenInputs}
      <div
        onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave}
        onClick={() => galleryRef.current?.click()}
        style={{
          border:`1.5px dashed ${dragging ? C.accent : "var(--tl-upload-border)"}`,
          borderRadius:16, padding:"44px 24px",
          background:dragging ? "rgba(124,58,237,0.12)" : "var(--tl-upload-bg)",
          backdropFilter:"blur(14px)", WebkitBackdropFilter:"blur(14px)",
          boxShadow:"var(--tl-card-shadow)",
          cursor:"pointer", textAlign:"center", transition:"all .2s",
        }}
      >
        <div style={{ width:54, height:54, margin:"0 auto 12px", background:"rgba(124,58,237,0.1)", borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <UploadCloud size={26} color={C.accent} />
        </div>
        <div style={{ ...syne, fontSize:16, marginBottom:5 }}>{dragging ? "Release to upload" : "Drop your file here"}</div>
        <div style={{ ...mono, fontSize:12, color:"var(--tl-muted)", marginBottom:14 }}>or click to browse</div>
        <div style={{ display:"flex", gap:6, justifyContent:"center", flexWrap:"wrap" }}>
          {cfg?.exts.map(c => (
            <span key={c} style={{ ...mono, fontSize:10, padding:"3px 9px", borderRadius:100, border:"1px solid var(--tl-border)", color:"var(--tl-muted)", background:'var(--tl-pill-bg)' }}>{c}</span>
          ))}
          <span style={{ ...mono, fontSize:10, padding:"3px 9px", borderRadius:100, border:"1px solid var(--tl-border)", color:"var(--tl-muted)", background:'var(--tl-pill-bg)' }}>max {cfg?.maxMB}MB</span>
        </div>
      </div>
    </>
  );
}

// ── File Preview ──────────────────────────────────────────────────────────────


export default UploadZone;
