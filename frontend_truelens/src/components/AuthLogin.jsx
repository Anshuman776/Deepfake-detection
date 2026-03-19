import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Brain, Target, Shield, Link2, Waves, PuzzleIcon, Search, User, Thermometer, FileText, Zap, FolderOpen, Clock, Image, Video, Mic, Type, Globe, Menu, X, CheckCircle, AlertTriangle, UploadCloud, Trash2, ScanLine, Mail, Lock, Eye, EyeOff, ArrowRight, Layers, Moon, Sun } from "lucide-react";
import { C, mono, syne } from "../theme.js";

function AuthLogin({ onSwitch, onClose }) {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState("");

  // FIX: Removed <form> onSubmit handler — now handled directly via button onClick
  // to avoid form submission side effects in artifact environments.
  const handleSubmit = () => {
    if (!email || !password) { setError("Please fill in all fields."); return; }
    setError("");
    onClose();
  };

  const inputStyle = { width:"100%", padding:"11px 14px 11px 42px", borderRadius:10, border:`1px solid rgba(196,165,253,0.4)`, background:"var(--tl-lavender)", fontSize:14, fontFamily:"sans-serif", color:"var(--tl-text)", outline:"none" };

  return (
    <div style={{ padding:"40px 36px" }}>
      <div style={{ marginBottom:28 }}>
        <div style={{ ...mono, fontSize:11, color:"#7c3aed", letterSpacing:2, marginBottom:6 }}>WELCOME BACK</div>
        <h2 style={{ ...syne, fontSize:26, letterSpacing:-1, marginBottom:6 }}>Log in to TruthLens</h2>
        <p style={{ ...mono, fontSize:12, color:"var(--tl-muted)" }}>Detect AI-generated content in seconds.</p>
      </div>

      {error && (
        <div style={{ background:"rgba(232,0,61,0.08)", border:"1px solid rgba(232,0,61,0.25)", borderRadius:10, padding:"10px 14px", marginBottom:16, ...mono, fontSize:12, color:"#e8003d" }}>{error}</div>
      )}

      {/* FIX: Replaced <form> with <div> to avoid form-submission side effects */}
      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
        <div>
          <label style={{ ...mono, fontSize:11, color:"var(--tl-muted)", letterSpacing:1, textTransform:"uppercase", display:"block", marginBottom:7 }}>Email</label>
          <div style={{ position:"relative" }}>
            <Mail size={15} color={C.muted} style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)" }} />
            <input
              type="email" placeholder="you@example.com" value={email}
              onChange={e => setEmail(e.target.value)}
              // FIX: pressing Enter in email field now correctly moves to submit
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
              style={inputStyle}
            />
          </div>
        </div>
        <div>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:7 }}>
            <label style={{ ...mono, fontSize:11, color:"var(--tl-muted)", letterSpacing:1, textTransform:"uppercase" }}>Password</label>
            <span style={{ ...mono, fontSize:11, color:"#7c3aed", cursor:"pointer" }}>Forgot password?</span>
          </div>
          <div style={{ position:"relative" }}>
            <Lock size={15} color={C.muted} style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)" }} />
            <input
              type={showPass?"text":"password"} placeholder="••••••••" value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
              style={{ ...inputStyle, paddingRight:42 }}
            />
            <div onClick={() => setShowPass(!showPass)} style={{ position:"absolute", right:13, top:"50%", transform:"translateY(-50%)", cursor:"pointer" }}>
              {showPass ? <EyeOff size={15} color={C.muted} /> : <Eye size={15} color={C.muted} />}
            </div>
          </div>
        </div>
        <button
          onClick={handleSubmit}
          style={{ marginTop:4, background:"linear-gradient(135deg,#0077ff,#7c3aed)", color:"#fff", border:"none", borderRadius:10, padding:"12px", fontWeight:700, fontSize:14, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8, fontFamily:"sans-serif" }}>
          Log In <ArrowRight size={16} />
        </button>
      </div>

      <div style={{ display:"flex", alignItems:"center", gap:12, margin:"20px 0" }}>
        <div style={{ flex:1, height:1, background:"var(--tl-divider)" }} />
        <span style={{ ...mono, fontSize:11, color:"var(--tl-muted)" }}>or continue with</span>
        <div style={{ flex:1, height:1, background:"var(--tl-divider)" }} />
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
        {[{ label:"Google", color:"#EA4335" },{ label:"GitHub", color:"#24292e" }].map(({ label, color }) => (
          <button key={label} style={{ padding:"10px", border:"1px solid var(--tl-card-border)", borderRadius:10, background:"var(--tl-card-bg)", cursor:"pointer", ...mono, fontSize:13, color:"var(--tl-text)", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
            <span style={{ width:8, height:8, borderRadius:"50%", background:color, display:"inline-block" }} />{label}
          </button>
        ))}
      </div>

      <p style={{ textAlign:"center", ...mono, fontSize:12, color:"var(--tl-muted)", marginTop:24 }}>
        Don't have an account?{" "}
        <span onClick={onSwitch} style={{ color:"#7c3aed", fontWeight:700, cursor:"pointer" }}>Sign up free</span>
      </p>
    </div>
  );
}

// ── Auth — Signup ─────────────────────────────────────────────────────────────

const PERKS = [
  "Detect AI-generated images, video, audio & text",
  "Explainable AI — see why content is flagged",
  "Source prediction: Midjourney, DALL-E, Sora & more",
  "Free 10 scans/day, no credit card required",
];


export default AuthLogin;
