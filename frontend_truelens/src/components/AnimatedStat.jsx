import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import useCountUp from "../hooks/useCountUp.js";
import { C, mono, syne } from "../theme.js";

function AnimatedStat({ target, index, isMobile, total }) {
  const raw = useCountUp(target.end / target.divisor, 2000 + index * 200, target.decimals);
  const display = `${target.prefix}${raw.toFixed(target.decimals)}${target.suffix}`;
  const isLast  = index === total - 1;

  return (
    <div style={{
      padding:"14px 16px", textAlign:"center",
      borderRight: (!isMobile && !isLast) ? "1px solid var(--tl-border)" : "none",
      borderBottom:(isMobile && index < 2)  ? "1px solid var(--tl-border)" : "none",
    }}>
      <div style={{ ...syne, fontSize:19, color:C.accent, transition:"all .1s" }}>{display}</div>
      <div style={{ ...mono, fontSize:10, color:"var(--tl-muted)", marginTop:2 }}>{target.l}</div>
    </div>
  );
}


export default AnimatedStat;
