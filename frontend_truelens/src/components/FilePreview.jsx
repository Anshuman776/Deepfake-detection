import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Brain, Target, Shield, Link2, Waves, PuzzleIcon, Search, User, Thermometer, FileText, Zap, FolderOpen, Clock, Image, Video, Mic, Type, Globe, Menu, X, CheckCircle, AlertTriangle, UploadCloud, Trash2, ScanLine, Mail, Lock, Eye, EyeOff, ArrowRight, Layers, Moon, Sun } from "lucide-react";
import { C, card, mono, syne } from "../theme.js";
import { formatBytes } from "../utils/format.js";

function FilePreview({ file, onRemove, onScan }) {
  const [previewUrl, setPreviewUrl] = useState(null);
  useEffect(() => {
    if (file.type?.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [file]);

  return (
    <div className="card-hover" style={{ border:"1px solid var(--tl-card-border)", borderRadius:14, overflow:"hidden", background:"var(--tl-card-bg)", backdropFilter:"blur(14px)", WebkitBackdropFilter:"blur(14px)", boxShadow:"var(--tl-card-shadow)" }}>
      {previewUrl && (
        <div style={{ width:"100%", height:160, overflow:"hidden", background:"var(--tl-surface2)" }}>
          <img src={previewUrl} alt="preview" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
        </div>
      )}
      <div style={{ padding:"12px 14px", display:"flex", alignItems:"center", gap:12 }}>
        <div style={{ width:38, height:38, borderRadius:9, background:"rgba(0,119,255,0.08)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
          <FolderOpen size={18} color={C.accent} />
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:13, fontWeight:600, color:"var(--tl-text)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{file.name}</div>
          {!file.isUrl && <div style={{ ...mono, fontSize:11, color:"var(--tl-muted)", marginTop:2 }}>{formatBytes(file.size)} · {file.type}</div>}
        </div>
        <button onClick={onRemove} style={{ background:"none", border:"none", cursor:"pointer", padding:4, borderRadius:6 }}>
          <Trash2 size={15} color="#e8003d" />
        </button>
      </div>
      <div style={{ padding:"0 14px 14px" }}>
        <button onClick={onScan} style={{ width:"100%", background:C.accent, color:"#fff", border:"none", borderRadius:10, padding:"11px", fontWeight:700, fontSize:14, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8, fontFamily:"sans-serif" }}>
          <ScanLine size={16} /> Scan Now
        </button>
      </div>
    </div>
  );
}

// ── Scan Progress ─────────────────────────────────────────────────────────────


export default FilePreview;
