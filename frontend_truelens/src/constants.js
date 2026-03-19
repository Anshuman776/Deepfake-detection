import { Brain, Target, Shield, Link2, Waves, PuzzleIcon, Search, User, Thermometer, FileText, Zap } from "lucide-react";
import { Image, Video, Mic, Type, Globe } from "lucide-react";

// ── Data ──────────────────────────────────────────────────────────────────────

const MEDIA_TABS = [
  { label:"Image",    Icon:Image,  mime:"image/*"                    },
  { label:"Video",    Icon:Video,  mime:"video/*"                    },
  { label:"Audio",    Icon:Mic,    mime:"audio/*"                    },
  { label:"Text",     Icon:Type,   mime:".txt,.pdf,.docx"            },
  { label:"URL/Link", Icon:Globe,  mime:null                         },
];

const ACCEPT_CFG = {
  0:{ exts:["JPG","PNG","WEBP","GIF"], maxMB:50  },
  1:{ exts:["MP4","MOV","WEBM"],       maxMB:200 },
  2:{ exts:["MP3","WAV","OGG"],        maxMB:100 },
  3:{ exts:["TXT","PDF","DOCX"],       maxMB:20  },
};

const USPS = [
  { Icon:Brain,      title:"Explainable AI",      sub:"We show you why, not just a score.", bg:"rgba(255,100,150,0.1)", ic:"#e8003d" },
  { Icon:Target,     title:"Source Prediction",   sub:"Midjourney · DALL-E · Sora · GPT.",  bg:"rgba(0,119,255,0.1)",  ic:"#0077ff" },
  { Icon:Shield,     title:"Trust Score",         sub:"Credibility score out of 100.",       bg:"rgba(0,119,255,0.08)", ic:"#0077ff" },
  { Icon:Link2,      title:"Social Media Links",  sub:"Paste any Twitter / Instagram URL.",  bg:"rgba(150,100,255,0.1)",ic:"#7c3aed" },
  { Icon:Waves,      title:"Watermark Detection", sub:"Detects invisible AI watermarks.",    bg:"rgba(0,200,120,0.1)",  ic:"#059669" },
  { Icon:PuzzleIcon, title:"Browser Extension",   sub:"Right-click any image to scan.",      bg:"rgba(255,170,0,0.1)",  ic:"#d97706" },
];

const STAT_TARGETS = [
  { end: 2.4,  prefix: "", suffix: "M+", divisor: 1, decimals: 1, l: "FILES SCANNED"      },
  { end: 97.3, prefix: "", suffix: "%",  divisor: 1, decimals: 1, l: "ACCURACY"           },
  { end: 2.8,  prefix: "", suffix: "s",  divisor: 1, decimals: 1, l: "AVG SCAN TIME"      },
  { end: 12,   prefix: "", suffix: "",   divisor: 1, decimals: 0, l: "AI MODELS DETECTED" },
];

const SAMPLE_SIGNALS = [
  { l:"Texture Artifacts", p:88, c:"#e8003d" },
  { l:"Edge Coherence",    p:62, c:"#d97706" },
  { l:"Noise Pattern",     p:79, c:"#e8003d" },
  { l:"Freq. Spectrum",    p:71, c:"#d97706" },
  { l:"Metadata",          p:32, c:"#059669" },
];

const SAMPLE_HISTORY = [
  { Icon:Image, name:"portrait_final_v2.jpg",  meta:"Image · 2.4MB · 2 min ago",   v:"AI Generated", vc:"#e8003d", vbg:"rgba(232,0,61,0.08)"  },
  { Icon:Video, name:"meeting_recording.mp4",  meta:"Video · 18.7MB · 14 min ago", v:"Mixed (34%)",  vc:"#d97706", vbg:"rgba(217,119,6,0.08)" },
  { Icon:Image, name:"photo_from_event.png",   meta:"Image · 1.1MB · 1 hr ago",    v:"Authentic",    vc:"#059669", vbg:"rgba(5,150,105,0.1)"  },
  { Icon:Video, name:"promo_video.mov",         meta:"Video · 42MB · 3 hrs ago",    v:"AI Generated", vc:"#e8003d", vbg:"rgba(232,0,61,0.08)"  },
];

const HEATMAP_DATA = [
  0.1,0.2,0.3,0.8,0.9,0.7,0.2,0.1,
  0.1,0.3,0.6,0.95,0.95,0.8,0.3,0.1,
  0.2,0.5,0.85,0.9,0.95,0.85,0.5,0.2,
  0.3,0.7,0.9,0.7,0.6,0.9,0.6,0.3,
  0.2,0.6,0.85,0.5,0.4,0.8,0.5,0.2,
  0.1,0.4,0.7,0.6,0.65,0.7,0.4,0.1,
];

const TIMELINE_DATA = [
  {w:8,c:"#059669"},{w:6,c:"#059669"},{w:5,c:"#e8003d"},
  {w:7,c:"#059669"},{w:4,c:"#e8003d"},{w:6,c:"#059669"},
  {w:5,c:"#e8003d"},{w:8,c:"#059669"},{w:5,c:"#d97706"},
  {w:7,c:"#059669"},{w:5,c:"#e8003d"},{w:8,c:"#059669"},{w:5,c:"#d97706"},
];

const FEATURES = [
  { Icon:Search,      title:"Multi-Model Detection",  desc:"Identifies content from Midjourney, DALL-E, Stable Diffusion, Sora, and 9 other AI generators.", tag:"UPDATED", tc:"#0077ff", tb:"rgba(0,119,255,0.08)",  top:"#0077ff" },
  { Icon:User,        title:"Deepfake Face Analysis",  desc:"Specialized neural pipeline to detect face-swapped or synthetically generated faces.",            tag:"NEW",     tc:"#0077ff", tb:"rgba(0,119,255,0.08)",  top:"#e8003d" },
  { Icon:Thermometer, title:"Artifact Heatmap",        desc:"Visual overlay highlighting which regions triggered the detection — forensic evidence.",          tag:"",        tc:"",        tb:"",                      top:"#7c3aed" },
  { Icon:FileText,    title:"Forensic PDF Report",     desc:"Download a court-ready report with all signals, scores, metadata, and heatmap per scan.",         tag:"PRO",     tc:"#7c3aed", tb:"rgba(124,58,237,0.08)", top:"#059669" },
  { Icon:Zap,         title:"REST API Access",          desc:"Integrate TruthLens into your app, CMS, or platform with our documented API. Batch supported.",   tag:"PRO",     tc:"#7c3aed", tb:"rgba(124,58,237,0.08)", top:"#0077ff" },
  { Icon:PuzzleIcon,  title:"Browser Extension",        desc:"Right-click any image on the web to scan instantly. Works on Twitter, Reddit, news sites.",       tag:"BETA",    tc:"#d97706", tb:"rgba(217,119,6,0.08)",  top:"#7c3aed" },
];

const SCAN_STEPS = [
  "Uploading file...",
  "Extracting metadata...",
  "Running frequency analysis...",
  "Checking texture artifacts...",
  "Analyzing edge coherence...",
  "Cross-referencing AI model signatures...",
  "Generating trust score...",
  "Finalizing report...",
];

// ── Detection indicators ─────────────────────────────────────────────────────

const AUDIO_INDICATORS = [
  "Robotic or unnatural intonation",
  "Abrupt voice transitions detected",
  "No background noise present",
  "Spectral pattern matches TTS model",
  "Pitch variance too uniform",
];

const VIDEO_INDICATORS = [
  "Temporal inconsistency in frames",
  "No camera shake or motion blur",
  "Facial landmarks misalignment",
  "GAN-based frame interpolation found",
  "Unnatural eye-blink pattern",
];

const AI_INDICATORS = [
  "Unnatural texture patterns detected",
  "No camera metadata present",
  "Facial features overly smooth",
  "GAN fingerprint signature found",
  "Inconsistent lighting gradients",
];

export {
  MEDIA_TABS, ACCEPT_CFG, USPS, STAT_TARGETS,
  SAMPLE_SIGNALS, SAMPLE_HISTORY, HEATMAP_DATA, TIMELINE_DATA,
  FEATURES, SCAN_STEPS,
  AUDIO_INDICATORS, VIDEO_INDICATORS, AI_INDICATORS,
};
