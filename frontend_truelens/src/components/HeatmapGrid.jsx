import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { mono } from "../theme.js";

const HEATMAP_DATA = [
  0.1,0.2,0.3,0.8,0.9,0.7,0.2,0.1,
  0.1,0.3,0.6,0.95,0.95,0.8,0.3,0.1,
  0.2,0.5,0.85,0.9,0.95,0.85,0.5,0.2,
  0.3,0.7,0.9,0.7,0.6,0.9,0.6,0.3,
  0.2,0.6,0.85,0.5,0.4,0.8,0.5,0.2,
  0.1,0.4,0.7,0.6,0.65,0.7,0.4,0.1,
];

function HeatmapGrid({ intensity = 1 }) {
  return (
    <div style={{ borderRadius:9, overflow:"hidden", position:"relative", background:"var(--tl-lavender)", height:160 }}>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(8,1fr)", gap:2, padding:7, height:"100%" }}>
        {HEATMAP_DATA.map((v, i) => {
          const scaled = v * intensity;
          const r = Math.round(232*scaled + 200*(1-scaled));
          const g = Math.round(220*(1-scaled));
          const b = Math.round(61*scaled + 240*(1-scaled));
          return <div key={i} style={{ borderRadius:2, background:`rgb(${r},${g},${b})`, opacity:0.3+scaled*0.7 }} />;
        })}
      </div>
      <div style={{ ...mono, position:"absolute", bottom:5, right:5, fontSize:9, color:"var(--tl-muted)", background:"rgba(0,0,0,0.4)", padding:"2px 6px", borderRadius:5 }}>
        Red = high AI probability
      </div>
    </div>
  );
}


export default HeatmapGrid;
