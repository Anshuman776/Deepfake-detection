import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Brain, Target, Shield, Link2, Waves, PuzzleIcon, Search, User, Thermometer, FileText, Zap, FolderOpen, Clock, Image, Video, Mic, Type, Globe, Menu, X, CheckCircle, AlertTriangle, UploadCloud, Trash2, ScanLine, Mail, Lock, Eye, EyeOff, ArrowRight, Layers, Moon, Sun } from "lucide-react";
import { C, mono, syne } from "../theme.js";

const PERKS = [
  "Detect AI-generated images, video, audio & text",
  "Explainable AI — see why content is flagged",
  "Source prediction: Midjourney, DALL-E, Sora & more",
  "Free 10 scans/day, no credit card required",
];

function AuthSignup({ onSwitch, onClose, isMobile }) {
  const [form, setForm]           = useState({ name:"", email:"", password:"", confirm:"" });
  const [showPass, setShowPass]   = useState(false);
  const [showConf, setShowConf]   = useState(false);
  const [error, setError]         = useState("");
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  // FIX: Removed <form> onSubmit — now a plain function called via onClick
  const handleSubmit = () => {
    if (!form.name || !form.email || !form.password || !form.confirm) { setError("Please fill in all fields."); return; }
    if (form.password !== form.confirm) { setError("Passwords do not match."); return; }
    if (form.password.length < 8) { setError("Password must be at least 8 characters."); return; }
    setError("");
    onClose();
  };

  const inputStyle = (pl="42px") => ({ width:"100%", padding:`11px 14px 11px ${pl}`, borderRadius:10, border:`1px solid rgba(196,165,253,0.4)`, background:"var(--tl-lavender)", fontSize:14, fontFamily:"sans-serif", color:"var(--tl-text)", outline:"none" });

  const FormPanel = (
    <div style={{ padding:"40px 36px" }}>
      <div style={{ marginBottom:24 }}>
        <div style={{ ...mono, fontSize:11, color:"#7c3aed", letterSpacing:2, marginBottom:6 }}>GET STARTED FREE</div>
        <h2 style={{ ...syne, fontSize:26, letterSpacing:-1, marginBottom:6 }}>Create your account</h2>
        <p style={{ ...mono, fontSize:12, color:"var(--tl-muted)" }}>No credit card needed.</p>
      </div>

      {error && (
        <div style={{ background:"rgba(232,0,61,0.08)", border:"1px solid rgba(232,0,61,0.25)", borderRadius:10, padding:"10px 14px", marginBottom:16, ...mono, fontSize:12, color:"#e8003d" }}>{error}</div>
      )}

      {/* FIX: Replaced <form onSubmit> with <div> + onClick button to avoid page-reload bug */}
      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
        {[
          { label:"Full Name", key:"name",  type:"text",  Icon:User, ph:"Devang Sharma",   pr:"42px" },
          { label:"Email",     key:"email", type:"email", Icon:Mail, ph:"you@example.com", pr:"42px" },
        ].map(({ label, key, type, Icon:Ic, ph, pr }) => (
          <div key={key}>
            <label style={{ ...mono, fontSize:11, color:"var(--tl-muted)", letterSpacing:1, textTransform:"uppercase", display:"block", marginBottom:7 }}>{label}</label>
            <div style={{ position:"relative" }}>
              <Ic size={15} color={C.muted} style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)" }} />
              <input type={type} placeholder={ph} value={form[key]} onChange={set(key)} style={inputStyle(pr)} />
            </div>
          </div>
        ))}
        {[
          { label:"Password",        key:"password", show:showPass, setShow:setShowPass, ph:"Min. 8 characters" },
          { label:"Confirm Password", key:"confirm",  show:showConf, setShow:setShowConf, ph:"Repeat password"   },
        ].map(({ label, key, show, setShow, ph }) => (
          <div key={key}>
            <label style={{ ...mono, fontSize:11, color:"var(--tl-muted)", letterSpacing:1, textTransform:"uppercase", display:"block", marginBottom:7 }}>{label}</label>
            <div style={{ position:"relative" }}>
              <Lock size={15} color={C.muted} style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)" }} />
              <input
                type={show?"text":"password"} placeholder={ph} value={form[key]} onChange={set(key)}
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
                style={{ ...inputStyle("42px"), paddingRight:42 }}
              />
              <div onClick={() => setShow(!show)} style={{ position:"absolute", right:13, top:"50%", transform:"translateY(-50%)", cursor:"pointer" }}>
                {show ? <EyeOff size={15} color={C.muted} /> : <Eye size={15} color={C.muted} />}
              </div>
            </div>
          </div>
        ))}
        <p style={{ ...mono, fontSize:11, color:"var(--tl-muted)", lineHeight:1.6 }}>
          By signing up you agree to our{" "}
          <span style={{ color:"#7c3aed", cursor:"pointer" }}>Terms</span> and{" "}
          <span style={{ color:"#7c3aed", cursor:"pointer" }}>Privacy Policy</span>.
        </p>
        <button
          onClick={handleSubmit}
          style={{ background:"linear-gradient(135deg,#0077ff,#7c3aed)", color:"#fff", border:"none", borderRadius:10, padding:"12px", fontWeight:700, fontSize:14, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8, fontFamily:"sans-serif" }}>
          Create Account <ArrowRight size={16} />
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
        Already have an account?{" "}
        <span onClick={onSwitch} style={{ color:"#7c3aed", fontWeight:700, cursor:"pointer" }}>Log in</span>
      </p>
    </div>
  );

  if (isMobile) return FormPanel;

  return (
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr" }}>
      <div style={{ background:"linear-gradient(145deg,#0077ff,#7c3aed)", borderRadius:"20px 0 0 20px", padding:"40px 32px", display:"flex", flexDirection:"column", justifyContent:"center", color:"#fff" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:36 }}>
          <div style={{ width:30, height:30, borderRadius:7, background:"rgba(255,255,255,0.15)", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <Search size={15} color="#fff" />
          </div>
          <span style={{ ...syne, fontSize:18 }}>TruthLens</span>
        </div>
        <h3 style={{ ...syne, fontSize:26, lineHeight:1.1, letterSpacing:-1, marginBottom:12 }}>Fight synthetic media.<br />Start for free.</h3>
        <p style={{ ...mono, fontSize:12, opacity:.75, lineHeight:1.7, marginBottom:28 }}>Join thousands of journalists, researchers, and creators verifying media authenticity.</p>
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {PERKS.map((p, i) => (
            <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:8 }}>
              <CheckCircle size={14} color="rgba(255,255,255,0.9)" style={{ flexShrink:0, marginTop:2 }} />
              <span style={{ ...mono, fontSize:12, opacity:.9, lineHeight:1.5 }}>{p}</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop:32, padding:"16px 20px", background:"rgba(255,255,255,0.1)", borderRadius:12, border:"1px solid rgba(255,255,255,0.15)" }}>
          <p style={{ ...mono, fontSize:12, opacity:.85, lineHeight:1.7, fontStyle:"italic" }}>"TruthLens caught a deepfake in seconds that our team missed for hours."</p>
          <p style={{ ...mono, fontSize:11, opacity:.6, marginTop:8 }}>— Priya S., Investigative Journalist</p>
        </div>
      </div>
      <div style={{ overflowY:"auto" }}>{FormPanel}</div>
    </div>
  );
}


export default AuthSignup;
