import { useEffect } from "react";

// ── Shared styles ─────────────────────────────────────────────────────────────

// ── Theme tokens (CSS variables) ──────────────────────────────────────────────
// All colours reference CSS variables so a single class flip on <body> switches theme.
const C = {
  accent:  "#0077ff",
  border:  "var(--tl-border)",
  surface: "var(--tl-surface)",
  muted:   "var(--tl-muted)",
  surface2:"var(--tl-surface2)",
  text:    "var(--tl-text)",
};

const card = {
  background:   "var(--tl-card-bg)",
  border:       "1px solid var(--tl-card-border)",
  borderRadius: 14,
  boxShadow:    "var(--tl-card-shadow)",
  backdropFilter:"blur(20px)",
  WebkitBackdropFilter:"blur(20px)",
};

const hdr = {
  display:"flex", alignItems:"center", gap:10,
  padding:"13px 18px",
  borderBottom:"1px solid var(--tl-hdr-border)",
};

const mono = { fontFamily:"monospace" };
const syne = { fontFamily:"serif", fontWeight:800 };

// Inject light + dark CSS variable tokens once
function useThemeStyles(isDark) {
  useEffect(() => {
    const id = "tl-theme-vars";
    let el = document.getElementById(id);
    if (!el) { el = document.createElement("style"); el.id = id; document.head.appendChild(el); }
    el.textContent = `
      .tl-root {
        --tl-bg:#f8f8fc; --tl-text:#0f1117; --tl-text-sec:#374151; --tl-muted:#6b7280;
        --tl-border:rgba(0,0,0,0.08); --tl-surface:#ffffff; --tl-surface2:#eef1f7;
        --tl-nav-bg:rgba(248,248,252,0.88); --tl-nav-border:rgba(124,58,237,0.10);
        --tl-card-bg:rgba(255,255,255,0.60); --tl-card-border:rgba(196,165,253,0.35);
        --tl-card-shadow:0 4px 24px rgba(124,58,237,0.08),inset 0 1px 0 rgba(255,255,255,0.8);
        --tl-hdr-border:rgba(124,58,237,0.07); --tl-dot-grid:rgba(124,58,237,0.08);
        --tl-input-bg:#eef1f7; --tl-input-color:#0f1117; --tl-modal-bg:rgba(255,255,255,0.97);
        --tl-section-bg:rgba(237,233,254,0.40); --tl-lavender:rgba(237,233,254,0.50);
        --tl-pill-bg:rgba(237,233,254,0.70); --tl-pill-color:#6b7280;
        --tl-scan-track:#eef1f7; --tl-upload-bg:rgba(255,255,255,0.55);
        --tl-upload-border:rgba(124,58,237,0.3); --tl-tab-inactive:rgba(255,255,255,0.7);
        --tl-tab-border:rgba(0,0,0,0.1); --tl-sheet-bg:rgba(255,255,255,0.75);
        --tl-sheet-item:#eef1f7; --tl-signal-track:rgba(196,165,253,0.20);
        --tl-report-section:rgba(237,233,254,0.35); --tl-report-row:rgba(237,233,254,0.40);
        --tl-lock-overlay:rgba(255,255,255,0.60); --tl-divider:rgba(196,165,253,0.30);
        --tl-hero-bg:linear-gradient(160deg,#ffffff 0%,#f3f0ff 40%,#ede8ff 70%,#f8f8fc 100%);
      }
      .tl-root.tl-dark {
        --tl-bg:#0d0f14; --tl-text:#e4e6f0; --tl-text-sec:#c0c4d4; --tl-muted:#8b92a8;
        --tl-border:rgba(255,255,255,0.07); --tl-surface:#1a1d28; --tl-surface2:#1e2235;
        --tl-nav-bg:rgba(13,15,22,0.96); --tl-nav-border:rgba(124,58,237,0.22);
        --tl-card-bg:rgba(28,32,52,0.48); --tl-card-border:rgba(124,58,237,0.30);
        --tl-card-shadow:0 4px 24px rgba(0,0,0,0.40),inset 0 1px 0 rgba(255,255,255,0.06);
        --tl-hdr-border:rgba(124,58,237,0.16); --tl-dot-grid:rgba(124,58,237,0.14);
        --tl-input-bg:#1a1d2e; --tl-input-color:#e4e6f0; --tl-modal-bg:rgba(16,18,28,0.99);
        --tl-section-bg:rgba(30,28,55,0.65); --tl-lavender:rgba(30,28,55,0.60);
        --tl-pill-bg:rgba(30,28,55,0.80); --tl-pill-color:#a89de0;
        --tl-scan-track:#1e2235; --tl-upload-bg:rgba(22,25,38,0.35);
        --tl-upload-border:rgba(124,58,237,0.45); --tl-tab-inactive:rgba(22,25,38,0.80);
        --tl-tab-border:rgba(255,255,255,0.10); --tl-sheet-bg:rgba(16,18,28,0.97);
        --tl-sheet-item:#1e2235; --tl-signal-track:rgba(100,80,200,0.18);
        --tl-report-section:rgba(28,26,52,0.70); --tl-report-row:rgba(30,28,55,0.65);
        --tl-lock-overlay:rgba(16,18,28,0.75); --tl-divider:rgba(124,58,237,0.22);
        --tl-hero-bg:linear-gradient(160deg,#0d0f14 0%,#13102a 35%,#1a0f2e 60%,#0d0f14 100%);
      }
      .tl-root,.tl-root * {
        transition:background-color .25s ease,border-color .25s ease,color .25s ease,box-shadow .25s ease;
      }
      /* Gradient text must NEVER transition color — it must always stay transparent */
      .tl-root .tl-gradient-text {
        transition: background .25s ease !important;
        color: transparent !important;
        -webkit-text-fill-color: transparent !important;
        -webkit-background-clip: text !important;
        background-clip: text !important;
        display: inline-block !important;
      }
      .tl-root svg *,.tl-root canvas,.tl-root video { transition:none !important; }
      .tl-root .card-hover { transition:transform .2s ease,box-shadow .2s ease,border-color .2s ease,background-color .2s ease !important; }
      .tl-root .card-hover:hover { transform:translateY(-3px) !important; }
      .tl-root:not(.tl-dark) .card-hover:hover {
        background:rgba(255,255,255,0.82) !important; border-color:rgba(167,139,250,0.55) !important;
        box-shadow:0 12px 36px rgba(124,58,237,0.14),inset 0 1px 0 rgba(255,255,255,0.9) !important;
      }
      .tl-root.tl-dark .card-hover:hover {
        background:rgba(34,38,62,0.62) !important; border-color:rgba(167,139,250,0.45) !important;
        box-shadow:0 12px 36px rgba(0,0,0,0.45),inset 0 1px 0 rgba(255,255,255,0.07) !important;
      }
      .tl-root input,.tl-root textarea {
        background:var(--tl-input-bg) !important; color:var(--tl-input-color) !important;
        border-color:var(--tl-card-border) !important;
      }
      .tl-root input::placeholder { color:var(--tl-muted) !important; }
    `;
  }, [isDark]);
}

export { C, card, hdr, mono, syne, useThemeStyles };
