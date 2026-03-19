import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";

function BottomSheet({ open, onClose, children }) {
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position:"fixed", inset:0, background:"rgba(0,0,0,0.45)",
          zIndex:200, opacity:open?1:0, pointerEvents:open?"auto":"none",
          transition:"opacity .25s ease",
        }}
      />
      <div style={{
        position:"fixed", left:0, right:0, bottom:0, zIndex:201,
        background:"var(--tl-sheet-bg)",
        backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)",
        borderRadius:"20px 20px 0 0",
        padding:"12px 0 32px",
        transform: open ? "translateY(0)" : "translateY(100%)",
        transition:"transform .3s cubic-bezier(.32,.72,0,1)",
        boxShadow:"0 -4px 32px rgba(0,0,0,0.12)",
      }}>
        <div style={{ width:36, height:4, borderRadius:100, background:"var(--tl-divider)", margin:"0 auto 20px" }} />
        {children}
      </div>
    </>
  );
}

// ── Upload Zone ───────────────────────────────────────────────────────────────

// Pure function — no hooks, safe to call from anywhere

export default BottomSheet;
