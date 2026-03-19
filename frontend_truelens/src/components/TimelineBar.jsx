import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { mono, C } from "../theme.js";

const TIMELINE_DATA = [
  {w:8,c:"#059669"},{w:6,c:"#059669"},{w:5,c:"#e8003d"},
  {w:7,c:"#059669"},{w:4,c:"#e8003d"},{w:6,c:"#059669"},
  {w:5,c:"#e8003d"},{w:8,c:"#059669"},{w:5,c:"#d97706"},
  {w:7,c:"#059669"},{w:5,c:"#e8003d"},{w:8,c:"#059669"},{w:5,c:"#d97706"},
];

function TimelineBar({ aiScore = 75 }) {
  return (
    <>
      <div style={{ background:"var(--tl-lavender)", borderRadius:9, height:42, display:"flex", gap:2, padding:"5px 6px", marginBottom:6, overflow:"hidden" }}>
        {TIMELINE_DATA.map((s,i) => (
          <div key={i} style={{ background:s.c, borderRadius:3, flex:s.w, height:"100%" }} />
        ))}
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
        {["0:00","0:15","0:30","0:45","1:00"].map(t => (
          <span key={t} style={{ ...mono, fontSize:10, color:"var(--tl-muted)" }}>{t}</span>
        ))}
      </div>
      <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
        {[["#e8003d",`AI: ${aiScore}%`],["#059669",`Real: ${100-aiScore}%`],["#d97706","3 uncertain cuts"]].map(([c,l]) => (
          <div key={l} style={{ display:"flex", alignItems:"center", gap:4 }}>
            <div style={{ width:5, height:5, borderRadius:"50%", background:c }} />
            <span style={{ ...mono, fontSize:10, color:"var(--tl-muted)" }}>{l}</span>
          </div>
        ))}
      </div>
    </>
  );
}

// ── Mobile Bottom Sheet ───────────────────────────────────────────────────────


export default TimelineBar;
