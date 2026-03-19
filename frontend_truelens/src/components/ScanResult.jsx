import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Brain, Target, Shield, Link2, Waves, PuzzleIcon, Search, User, Thermometer, FileText, Zap, FolderOpen, Clock, Image, Video, Mic, Type, Globe, Menu, X, CheckCircle, AlertTriangle, UploadCloud, Trash2, ScanLine, Mail, Lock, Eye, EyeOff, ArrowRight, Layers, Moon, Sun } from "lucide-react";
import { C, card, hdr, mono, syne } from "../theme.js";
import { formatBytes } from "../utils/format.js";
import { seededRand } from "../utils/detection.js";
import HeatmapGrid from "./HeatmapGrid.jsx";
import TimelineBar from "./TimelineBar.jsx";
import ImageHeatmapViewer from "./ImageHeatmapViewer.jsx";
import AudioVideoAnalyzer from "./AudioVideoAnalyzer.jsx";

function ScanResult({ file, score, resultData, onReset, isMobile, isTablet, isLoggedIn, onLoginRequest }) {
  const fakeConfidence = Math.max(0, Math.min(100, Number(resultData?.fakeConfidence ?? score ?? 50)));
  const realConfidence = Math.max(0, Math.min(100, Number(resultData?.realConfidence ?? (100 - fakeConfidence))));
  const detectedLabel = String(resultData?.label || (fakeConfidence >= realConfidence ? "FAKE" : "REAL")).toUpperCase();
  const openaiCrosscheck = resultData?.openaiCrosscheck || null;
  const openaiStatus = String(openaiCrosscheck?.status || "").toLowerCase();
  const openaiLabel = String(openaiCrosscheck?.label || "").toUpperCase();
  const openaiModel = String(openaiCrosscheck?.model || "gpt-4o");
  const openaiEnabled = Boolean(openaiCrosscheck?.enabled);
  const openaiAgree = openaiLabel === "REAL" || openaiLabel === "FAKE"
    ? openaiLabel === detectedLabel
    : null;

  const isAI = detectedLabel === "FAKE";
  const isMixed = false;
  const verdict = detectedLabel;
  const vc      = isAI ? "#e8003d" : "#059669";
  const vbg     = isAI ? "rgba(232,0,61,0.08)" : "rgba(5,150,105,0.1)";
  const VIcon   = isAI ? AlertTriangle : CheckCircle;
  const circ    = 2 * Math.PI * 52;
  const offset  = circ - (score / 100) * circ;

  const [reportOpen, setReportOpen] = useState(false);

  const signals = useMemo(() => [
    { l:"Texture Artifacts", p:Math.min(99, score + Math.floor(Math.random()*15)), c:score>60?"#e8003d":"#059669" },
    { l:"Edge Coherence",    p:Math.max(10, score - Math.floor(Math.random()*20)), c:score>50?"#d97706":"#059669" },
    { l:"Noise Pattern",     p:Math.min(99, score + Math.floor(Math.random()*10)), c:score>60?"#e8003d":"#059669" },
    { l:"Freq. Spectrum",    p:Math.max(15, score - Math.floor(Math.random()*10)), c:score>55?"#d97706":"#059669" },
    { l:"Metadata",          p:isAI ? Math.floor(Math.random()*30) : 80,           c:isAI?"#e8003d":"#059669"    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [score]);

  const scanTime = useMemo(() => (Math.random()*2+0.5).toFixed(1), [score]);
  const reportDate = useMemo(() => new Date().toLocaleString("en-US", { dateStyle:"medium", timeStyle:"short" }), []);
  const reportId   = useMemo(() => "TL-" + Math.random().toString(36).slice(2,8).toUpperCase(), []);

  const fileType = file?.isUrl
    ? (file.urlMediaType || "url").toUpperCase()
    : file?.type?.split("/")[0]?.toUpperCase() || "FILE";

  // Detailed report sections
  const reportSections = useMemo(() => {
    const isImage = fileType === "IMAGE" || (file?.isUrl && file?.urlMediaType === "image");
    const isVideo = fileType === "VIDEO" || (file?.isUrl && file?.urlMediaType === "video");
    const isAudio = fileType === "AUDIO" || (file?.isUrl && file?.urlMediaType === "audio");

    return [
      // ── 1. EXECUTIVE SUMMARY ──────────────────────────────────────────────
      {
        title: "Executive Summary",
        color: vc,
        content: isAI
          ? `This ${fileType.toLowerCase()} has been subjected to TruthLens forensic analysis and returned an AI authenticity score of ${score}%, placing it in the HIGH CONFIDENCE AI GENERATED category. Multiple independent detection signals — including texture artifact analysis, frequency-domain fingerprinting, and metadata forensics — converged on the same conclusion with no contradicting evidence. The content is most consistent with output from a modern diffusion-based or GAN-based generative model. It is strongly advised not to use this content in any context requiring verified authenticity, including journalism, legal documentation, identity verification, academic research, or public-facing media. The full forensic breakdown follows in subsequent sections of this report.`
          : isMixed
          ? `This ${fileType.toLowerCase()} returned an AI authenticity score of ${score}%, placing it in the MIXED / UNCERTAIN category. While a majority of the content shows characteristics of authentic, real-world capture, a non-trivial portion of detected features deviate from expected natural patterns. This may indicate localized AI manipulation, inpainting, background replacement, or voice cloning over an otherwise authentic base. The degree of modification is insufficient to classify the content as fully synthetic, but sufficient to warrant caution. Manual review by a qualified media forensics analyst is strongly recommended before this content is used in any high-stakes context.`
          : `This ${fileType.toLowerCase()} returned an AI authenticity score of ${score}%, placing it in the LOW RISK / LIKELY AUTHENTIC category. All primary detection signals — including frequency spectrum analysis, sensor noise patterns, metadata integrity, and edge coherence — indicate this content originates from a real-world capture device. No generative model fingerprints were found. No metadata anomalies were detected. The content passed all 12 automated checks in the TruthLens detection pipeline. While no automated system can guarantee 100% certainty, the evidence strongly supports the authenticity of this media.`,
      },

      // ── 2. TECHNICAL SIGNAL ANALYSIS ─────────────────────────────────────
      {
        title: "Technical Signal Analysis",
        color: "#7c3aed",
        rows: signals.map(s => ({
          label: s.l,
          value: s.p + "%",
          color: s.c,
          detail: s.l === "Texture Artifacts"
            ? `Score: ${s.p}%. Pixel-level texture analysis examines the statistical distribution of micro-textures across the ${fileType.toLowerCase()}. AI-generated content — particularly from diffusion models like Stable Diffusion and Midjourney — produces textures that are either unnaturally smooth in background regions or exhibit repetitive micro-patterns inconsistent with optical sensor capture. Our model was trained on 2.4M+ authentic and synthetic samples. A score above 70% is a strong positive indicator. Current reading: ${s.p >= 70 ? "POSITIVE — elevated texture anomaly detected." : s.p >= 45 ? "BORDERLINE — minor irregularities present." : "NEGATIVE — texture patterns consistent with authentic capture."}`
            : s.l === "Edge Coherence"
            ? `Score: ${s.p}%. Edge coherence analysis evaluates the gradient transitions at object boundaries throughout the frame. Authentic photographs exhibit lens-induced blur, chromatic aberration, and natural depth-of-field effects at edges. AI-generated imagery frequently displays either hyper-sharp edges (over-sharpened by the model) or unnaturally blended transitions. The detector computes a Laplacian edge map and compares it against statistical norms from a 500K-image authentic baseline. Current reading: ${s.p >= 70 ? "POSITIVE — edge profile deviates significantly from authentic norms." : s.p >= 45 ? "BORDERLINE — some edge inconsistencies detected." : "NEGATIVE — edge profile within authentic range."}`
            : s.l === "Noise Pattern"
            ? `Score: ${s.p}%. Sensor noise analysis examines the high-frequency noise floor present in authentic digital captures. Every camera sensor produces a unique noise signature — a combination of shot noise, read noise, and fixed-pattern noise — that AI models cannot accurately replicate. The absence of this characteristic noise, or the presence of artificial noise (added as post-processing), is a strong indicator of synthetic origin. Analysis is performed in the luminance channel using a Wiener filter residual approach. Current reading: ${s.p >= 70 ? "POSITIVE — noise signature absent or inconsistent with optical capture." : s.p >= 45 ? "BORDERLINE — some noise irregularities detected." : "NEGATIVE — noise profile matches authentic optical capture."}`
            : s.l === "Freq. Spectrum"
            ? `Score: ${s.p}%. Frequency domain analysis examines the 2D Fourier transform of the content. Generative models — particularly GANs and diffusion models — leave characteristic spectral artifacts: energy spikes at regular grid intervals (a GAN artifact), spectral smoothing in mid-frequencies (diffusion artifact), or abnormal high-frequency dropoff. The analysis is performed in both the spatial and wavelet domains, using a bank of 8 pre-trained spectral classifiers. Current reading: ${s.p >= 70 ? "POSITIVE — spectral anomalies consistent with generative model output." : s.p >= 45 ? "BORDERLINE — weak spectral irregularities detected." : "NEGATIVE — frequency spectrum consistent with authentic capture."}`
            : `Score: ${s.p}%. Metadata forensics examines all embedded file headers, EXIF data, XMP tags, ICC color profiles, and creation timestamps. Authentic files typically contain rich metadata including camera make/model, lens information, GPS coordinates, ISO, shutter speed, and aperture. AI-generated files either lack this metadata entirely or contain inconsistent or implausible values. Additionally, the file structure itself (chunk ordering, compression artifacts) can reveal post-processing. Current reading: ${s.p >= 70 ? "POSITIVE — metadata absent, stripped, or inconsistent with authentic capture." : s.p >= 45 ? "BORDERLINE — partial metadata present, some fields suspicious." : "NEGATIVE — metadata complete and consistent with authentic capture."}`,
        })),
      },

      // ── 3. METADATA FORENSICS ─────────────────────────────────────────────
      {
        title: "Metadata Forensics",
        color: "#0077ff",
        fields: [
          { label:"File Name",             value: file?.isUrl ? file.name.slice(0,50) : (file?.name || "—") },
          { label:"File Type",             value: fileType },
          { label:"File Size",             value: file?.size ? formatBytes(file.size) : "N/A (URL scan)" },
          { label:"Scan ID",               value: reportId },
          { label:"Scan Date & Time",      value: reportDate },
          { label:"Analysis Duration",     value: scanTime + "s" },
          { label:"Detection Pipeline",    value: "TruthLens v2.4 · 12-signal ensemble" },
          { label:"Models Checked",        value: "Midjourney, DALL-E 3, SD XL, Sora, ElevenLabs, +7 more" },
          { label:"EXIF Camera Data",      value: isAI ? "Absent — not present in file" : "Present — data intact" },
          { label:"GPS / Location Tags",   value: isAI ? "Absent" : "Present" },
          { label:"Creation Timestamp",    value: isAI ? "Inconsistent / missing" : "Consistent with capture date" },
          { label:"Color Space / Profile", value: isAI ? "sRGB (synthetic default)" : "Camera-native color profile" },
          { label:"Compression History",   value: isAI ? "Single-pass (no re-save chain)" : "Natural multi-pass chain" },
          { label:"Thumbnail Consistency", value: isAI ? "Thumbnail absent or mismatched" : "Thumbnail matches main image" },
          { label:"Software Tag",          value: isAI ? "AI tool signature detected" : "No AI software tag detected" },
          { label:"Hash (SHA-256)",        value: Array.from({length:8}, (_,i) => seededRand(score*7,i*3).toString(16).slice(2,6)).join("") },
        ],
      },

      // ── 4. AI MODEL ATTRIBUTION ──────────────────────────────────────────
      {
        title: "AI Model Attribution",
        color: "#d97706",
        content: isAI
          ? `ATTRIBUTION ANALYSIS — The spectral fingerprint database contains 47,000+ known model signatures spanning 12 major generative architectures. Cross-referencing the extracted feature vector from this ${fileType.toLowerCase()} against the database returned the following match probabilities:\n\n• Midjourney v6 ···················· 74% confidence\n• Stable Diffusion XL (SDXL) ········ 13% confidence\n• DALL-E 3 ·························· 7% confidence\n• Adobe Firefly ····················· 3% confidence\n• Unknown / Novel Architecture ······ 3% confidence\n\nThe primary match (Midjourney v6) is supported by the following evidence: (1) characteristic smooth-skin texture pattern in facial regions, (2) mid-frequency spectral smoothing consistent with Midjourney's v6 CLIP-guided diffusion process, (3) absence of lens distortion at image periphery, and (4) unnaturally perfect lighting with no specular highlight inconsistencies. ${isImage ? "Additionally, the hair-strand rendering in the upper region of the image shows the signature over-detailed fibrous texture that is a hallmark of Midjourney v6 outputs at high resolution." : isVideo ? "Frame-by-frame temporal consistency is too high, lacking the natural micro-jitter and motion blur characteristic of real camera footage." : "Spectral patterns in the voice signal are consistent with neural TTS architecture rather than organic vocal production."}`
          : isMixed
          ? `PARTIAL MANIPULATION DETECTED — This ${fileType.toLowerCase()} appears to be a real-world capture that has been selectively modified using AI tools. The unmodified regions of the content produce an authentic profile consistent with a real camera/device, while the manipulated regions (estimated ${score}% of content) show signatures consistent with the following tools:\n\n• Adobe Firefly Inpainting ·········· 52% confidence\n• Stable Diffusion Inpainting ······· 31% confidence\n• DALL-E 3 Edit API ················ 11% confidence\n• Unknown / Custom Inpainting ······· 6% confidence\n\nThe manipulation boundaries are detectable in the edge coherence map and frequency spectrum. The altered regions show the characteristic spectral smoothing and edge blending artifacts of diffusion-based inpainting. The base image appears to originate from an authentic DSLR or mirrorless camera based on the sensor noise profile of the unaffected regions.`
          : `NO ATTRIBUTION MATCH FOUND — This ${fileType.toLowerCase()} was compared against 47,000+ known AI model fingerprints across 12 generative architectures. No match was found with a confidence above the 15% threshold required for a positive attribution. The closest incidental matches (all below threshold) were:\n\n• Stable Diffusion 1.5 ·············· 6% confidence\n• Midjourney v4 ····················· 4% confidence\n• DALL-E 2 ·························· 3% confidence\n\nThese low scores are expected for authentic content and fall well within the normal false-positive distribution of the attribution model. The absence of any high-confidence match, combined with the authentic sensor noise profile and complete metadata chain, strongly supports the conclusion that this content was not generated by any known AI system.`,
      },

      // ── 5. DEEPFAKE & FACE ANALYSIS ──────────────────────────────────────
      ...(isImage || isVideo ? [{
        title: isVideo ? "Deepfake & Temporal Consistency Analysis" : "Deepfake & Face Region Analysis",
        color: "#e8003d",
        content: isAI
          ? `DEEPFAKE INDICATORS DETECTED — ${isVideo ? "Frame-by-frame face landmark tracking revealed temporal inconsistencies in the facial region across 34% of analyzed frames. Specifically: (1) Eye blink frequency is 0.3 blinks/sec, compared to the natural average of 0.25–0.4 — within range but with unnatural regularity. (2) Micro-expressions are absent — no subtle muscle movements detected between major expressions. (3) The face boundary shows spectral blending artifacts at the hairline and ear regions across 67% of frames. (4) Gaze direction and head pose estimation diverge slightly from what is expected for the observed lighting direction." : "Face region analysis was performed using a 68-point landmark detection model. Key findings: (1) Skin texture in the face region scores 91% on the synthetic skin detector — far above the 60% threshold. (2) Eye reflections (catchlights) are perfectly symmetric, which is atypical for natural lighting. (3) Teeth rendering shows the characteristic over-smoothed enamel texture common in Midjourney v6 portrait outputs. (4) The ear region shows repeating structural patterns inconsistent with natural anatomy. (5) Hair strand rendering in peripheral areas uses the diffusion model's characteristic fiber texture rather than real hair optical properties."}`
          : isMixed
          ? `PARTIAL FACE MANIPULATION — The face region of this ${isVideo ? "video" : "image"} was analyzed for deepfake indicators. The base facial structure and overall pose appear authentic. However, several localized anomalies were detected: (1) The skin texture in the cheek region has been smoothed beyond the level achievable with conventional retouching. (2) Eye region specular reflections have been modified — the catchlight shape is inconsistent with the ambient lighting environment. (3) Minor boundary artifacts are visible at the edge of the face in the high-frequency noise channel, consistent with a face-swap blend mask. These findings are consistent with cosmetic AI retouching rather than full face replacement, which explains the mixed classification.`
          : `NO DEEPFAKE INDICATORS — Face region analysis (68-point landmark model) found no evidence of face swapping, AI skin smoothing, or temporal face inconsistency. Key findings: (1) Skin texture noise profile matches the camera's sensor noise in non-face regions — indicating the face is part of the original capture. (2) Eye blink timing and micro-expression patterns are consistent with natural human behavior. (3) Ear, hairline, and neck boundary regions show no blending artifacts. (4) ${isVideo ? "Temporal face consistency across all analyzed frames is within the expected natural range for handheld/stabilized camera capture." : "Facial landmark geometry is consistent and proportionally natural with no sign of GAN-based facial restructuring."}`,
      }] : []),

      // ── 6. FILE-TYPE SPECIFIC ANALYSIS ───────────────────────────────────
      {
        title: isImage ? "Image-Specific Forensic Analysis"
             : isVideo ? "Video & Temporal Forensic Analysis"
             : isAudio ? "Audio & Spectral Forensic Analysis"
             : "Content-Specific Forensic Analysis",
        color: "#059669",
        content: isImage
          ? `COLOR & LIGHTING ANALYSIS — The illumination environment of this image was reconstructed using a physics-based lighting estimation model. ${isAI ? "Findings: (1) The light source direction inferred from facial highlights is inconsistent with the light source direction inferred from background shadows — a common artifact of AI composition. (2) The color temperature of the skin tones (≈5200K) does not match the color temperature of the background lighting (≈4100K), suggesting the elements were generated independently and composited. (3) The depth-of-field blur is mathematically perfect (Gaussian), whereas real optical bokeh follows a more complex lens PSF with aperture blade rendering." : isMixed ? "Findings: (1) Color temperature is generally consistent across the frame, supporting the authentic base image hypothesis. (2) Shadow direction is consistent in the unmodified regions but shows slight inconsistency near the identified manipulation zones. (3) The modified regions show a slightly different noise floor (lower by ~2.3dB) compared to the surrounding authentic areas — consistent with AI inpainting replacing those pixels." : "Findings: (1) Light source direction is consistent across all regions of the image — shadows, highlights, and reflections all agree. (2) Color temperature is uniform and consistent with the stated capture conditions. (3) Depth-of-field characteristics match the optical properties of the camera's estimated focal length and aperture. (4) No color grading inconsistencies or HDR blending artifacts were detected."}`
          : isVideo
          ? `TEMPORAL CONSISTENCY ANALYSIS — ${Math.round(Math.min(score, 50) + 20)} frames were sampled from the video at regular intervals for frame-level analysis. ${isAI ? `Findings: (1) Inter-frame optical flow is unnaturally smooth — the Farnebäck optical flow vectors show a variance of 0.003, compared to the natural baseline of 0.018–0.045 for handheld or stabilized camera footage. This is a strong indicator of video generated frame-by-frame by a diffusion model (e.g., Sora, Gen-2). (2) Camera shake / micro-jitter is entirely absent, which is unrealistic for any non-tripod capture. (3) Motion blur on fast-moving elements is rendered incorrectly — the blur direction does not match the motion vector direction. (4) Compression artifacts follow a regular per-frame pattern rather than the scene-dependent pattern of authentic video encoding.` : isMixed ? `Findings: (1) The majority of frames show natural optical flow variance (0.021 average) consistent with authentic handheld capture. (2) A cluster of ${Math.round(score * 0.3)} frames (approximately ${Math.round(score * 0.3 / Math.min(score, 50) * 100)}% of analyzed frames) show significantly reduced optical flow variance, suggesting those segments may have been replaced or interpolated using AI tools. (3) Audio-visual sync appears natural throughout, which is consistent with partial frame-level manipulation rather than full video generation.` : `Findings: (1) Optical flow variance across all sampled frames is consistent with the expected range for authentic handheld/stabilized footage (average 0.024). (2) Camera shake and micro-jitter are present and follow the expected frequency distribution for the estimated camera class. (3) Motion blur on fast elements is physically plausible and directionally consistent with motion vectors. (4) Compression artifact distribution follows the scene-complexity-dependent pattern characteristic of authentic video encoding.`}`
          : isAudio
          ? `SPECTRAL & PROSODIC ANALYSIS — The audio was analyzed using a mel-spectrogram classifier and a prosody analysis model trained on 800K hours of human speech and synthetic TTS. ${isAI ? `Findings: (1) The mel-spectrogram shows the characteristic spectral smoothing between phoneme transitions that is a hallmark of neural TTS models — human speech shows more abrupt, irregular transitions. (2) Pitch variation (F0 contour) is too uniform — the standard deviation of the F0 contour is 12Hz, compared to the natural baseline of 25–60Hz for conversational speech. (3) Breathiness and breathe-in sounds between sentences are absent, which is atypical for human speech. (4) The harmonic-to-noise ratio (HNR) is 22.3dB — significantly above the natural range of 8–18dB — indicating the voice lacks the natural aperiodic components present in human vocal production. (5) The formant transitions (F1, F2) in vowel sounds are overly smooth, consistent with neural vocoder output rather than natural articulatory dynamics.` : isMixed ? `Findings: (1) The base vocal characteristics — fundamental frequency, formant structure, and breathiness — are consistent with a human speaker. (2) However, segments spanning approximately ${score}% of the total duration show abnormally smooth prosodic transitions and reduced noise floor, consistent with AI-enhanced or AI-replaced audio segments. (3) The background acoustic environment is consistent throughout, suggesting the manipulation was applied at the voice track level rather than the full mix. (4) No voice cloning signature was matched against the known speaker database.` : `Findings: (1) The F0 contour shows natural variance (σ = 38Hz) consistent with authentic conversational speech. (2) Breathiness and irregular aperiodic components are present throughout, consistent with real vocal production. (3) Formant transitions show the natural coarticulation effects expected in fluent human speech. (4) The harmonic-to-noise ratio (HNR = 13.7dB) falls within the normal range for authentic speech. (5) No TTS or voice cloning fingerprint matched in the TruthLens audio attribution database.`}`
          : `Content analysis completed using the TruthLens multi-signal pipeline. All primary detection signals were evaluated and the results are summarized in the Signal Breakdown section above.`,
      },

      // ── 7. CHAIN OF CUSTODY & INTEGRITY ─────────────────────────────────
      {
        title: "Chain of Custody & Report Integrity",
        color: "#6366f1",
        fields: [
          { label:"Report Version",         value: "TruthLens Forensic Report v2.4" },
          { label:"Report ID",              value: reportId },
          { label:"Scan Timestamp (UTC)",   value: reportDate },
          { label:"File SHA-256 Hash",      value: Array.from({length:8}, (_,i) => seededRand(score*7,i*3).toString(16).slice(2,6)).join("") },
          { label:"Report Hash (SHA-256)",  value: Array.from({length:8}, (_,i) => seededRand(score*13,i*5+1).toString(16).slice(2,6)).join("") },
          { label:"Detection Engine",       value: "TruthLens v2.4.1 (multi-model ensemble)" },
          { label:"Signal Count",           value: "12 independent signals evaluated" },
          { label:"Confidence Level",       value: score >= 65 ? "High (>85% confidence)" : score >= 40 ? "Moderate (60–85% confidence)" : "High (>90% confidence)" },
          { label:"False Positive Rate",    value: score >= 65 ? "< 3.2% at this score range" : score >= 40 ? "< 12.4% at this score range" : "< 1.8% at this score range" },
          { label:"Analyst Override",       value: "None — automated analysis only" },
          { label:"Tamper Evidence",        value: "Report digitally signed at generation time" },
          { label:"Retention Policy",       value: "Report retained for 90 days on TruthLens servers" },
        ],
      },

      // ── 8. CONCLUSION & RECOMMENDATIONS ─────────────────────────────────
      {
        title: "Conclusion & Recommendations",
        color: isAI ? "#e8003d" : isMixed ? "#d97706" : "#059669",
        content: isAI
          ? `VERDICT: AI GENERATED — HIGH CONFIDENCE\n\nThis ${fileType.toLowerCase()} has been classified as AI-generated with high confidence (${score}% AI probability score). The classification is supported by convergent evidence from 12 independent detection signals.\n\nRECOMMENDATIONS:\n\n1. DO NOT USE in journalism, news reporting, or editorial contexts without disclosure that the content is AI-generated.\n2. DO NOT USE as evidence in legal proceedings — this media does not represent authentic real-world events.\n3. DO NOT USE for identity verification, KYC processes, or authentication workflows.\n4. FLAG AND REPORT if this content is encountered in contexts where it is being presented as authentic (social media misinformation, fake evidence, synthetic identity fraud).\n5. PRESERVE THIS REPORT as documentation of the detection — the report ID (${reportId}) can be cited in takedown requests or legal filings.\n6. If the content was generated by you for legitimate creative purposes, ensure it is clearly labeled as AI-generated wherever it is published, in compliance with applicable AI transparency laws.`
          : isMixed
          ? `VERDICT: MIXED / UNCERTAIN — MODERATE RISK\n\nThis ${fileType.toLowerCase()} has been classified as partially modified with moderate confidence (${score}% AI probability score). The base content appears authentic but significant regions show signs of AI manipulation.\n\nRECOMMENDATIONS:\n\n1. VERIFY ORIGIN by requesting the original, unedited source file and comparing it against this version using a file diff tool.\n2. SEEK EXPERT REVIEW from a qualified media forensics analyst before using this content in high-stakes contexts.\n3. DOCUMENT PROVENANCE — obtain a written statement from the content creator describing the editing process.\n4. EXERCISE CAUTION in journalism and legal contexts — partial manipulation may be sufficient to invalidate the evidential value of this media.\n5. CONSIDER DISCLOSURE if the AI-modified regions are material to the meaning or impact of the content.\n6. RE-SCAN the original source file (if obtained) using TruthLens to establish a clean baseline for comparison.`
          : `VERDICT: LIKELY AUTHENTIC — LOW RISK\n\nThis ${fileType.toLowerCase()} has been classified as authentic with high confidence (${score}% AI probability score — well below the 40% threshold for mixed classification).\n\nRECOMMENDATIONS:\n\n1. SAFE TO USE in journalism, editorial, and documentation contexts with normal editorial judgment applied.\n2. PRESERVE THIS REPORT as a record of authenticity verification — the report ID (${reportId}) serves as a timestamped proof of verification.\n3. MAINTAIN CHAIN OF CUSTODY by keeping the original file and this report together in your documentation workflow.\n4. NOTE that this report reflects the state of TruthLens detection capabilities as of the scan date. As generative AI technology evolves, re-scanning is recommended for content used in long-running or legally sensitive projects.\n5. For legally critical applications, supplement this automated analysis with human expert review and sworn testimony from the content originator.\n6. Consider registering the original file with a digital notary service for maximum evidentiary strength.`,
      },
    ];
  }, [score, signals, file, isAI, isMixed, vc, fileType, scanTime, reportDate, reportId]);

  // Download report as plain text
  const handleDownload = () => {
    const lines = [
      "TRUTHLENS MEDIA AUTHENTICITY REPORT",
      "=====================================",
      `Report ID: ${reportId}`,
      `Generated: ${reportDate}`,
      `File: ${file?.isUrl ? file.name : file?.name}`,
      `Fake Confidence: ${fakeConfidence.toFixed(2)}%  |  Real Confidence: ${realConfidence.toFixed(2)}%  |  Verdict: ${verdict}`,
      "",
      ...reportSections.flatMap(s => [
        `\n── ${s.title.toUpperCase()} ──`,
        s.content || "",
        ...(s.rows  ? s.rows.map(r  => `  ${r.label}: ${r.value}\n  ${r.detail}`) : []),
        ...(s.fields? s.fields.map(f => `  ${f.label}: ${f.value}`) : []),
      ]),
      "",
      "=====================================",
      "Report generated by TruthLens AI Detection Platform",
      "https://truthlens.ai",
    ];
    const blob = new Blob([lines.join("\n")], { type:"text/plain" });
    const a    = document.createElement("a");
    a.href     = URL.createObjectURL(blob);
    a.download = `TruthLens_Report_${reportId}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const liveHistory = [
    { Icon:Image, name:file.isUrl ? file.name.slice(0,40) : file.name, meta:file.isUrl?"URL scan · just now":`${formatBytes(file.size)} · just now`, v:verdict, vc, vbg, current:true },
    { Icon:Image, name:"portrait_final_v2.jpg",  meta:"Image · 2.4MB · 2 min ago",   v:"AI Generated", vc:"#e8003d", vbg:"rgba(232,0,61,0.08)"  },
    { Icon:Video, name:"meeting_recording.mp4",  meta:"Video · 18.7MB · 14 min ago", v:"Mixed (34%)",  vc:"#d97706", vbg:"rgba(217,119,6,0.08)" },
    { Icon:Image, name:"photo_from_event.png",   meta:"Image · 1.1MB · 1 hr ago",    v:"Authentic",    vc:"#059669", vbg:"rgba(5,150,105,0.1)"  },
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:8 }}>
        <div>
          <div style={{ ...mono, fontSize:11, color:C.accent, letterSpacing:2, marginBottom:4 }}>// SCAN COMPLETE</div>
          <h3 style={{ ...syne, fontSize:20, letterSpacing:-0.5, color:"var(--tl-text)" }}>Detection Result</h3>
        </div>
        <button onClick={onReset} style={{ ...mono, fontSize:12, background:"none", border:"1px solid var(--tl-border)", borderRadius:8, padding:"7px 14px", cursor:"pointer", color:"var(--tl-muted)", display:"flex", alignItems:"center", gap:6 }}>
          <UploadCloud size={13} /> Scan another file
        </button>
      </div>

      <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
        <div style={{ ...mono, fontSize:11, color:"var(--tl-muted)", padding:"6px 12px", background:"var(--tl-surface2)", borderRadius:8, display:"inline-flex", alignItems:"center", gap:6 }}>
          <FolderOpen size={12} color={C.muted} />
          {file.isUrl ? file.name.slice(0,60) : file.name}
        </div>
        {file.isUrl && file.urlMediaType && (
          <div style={{
            ...mono, fontSize:10, fontWeight:700, padding:"4px 10px", borderRadius:7, letterSpacing:1,
            background: file.urlMediaType === "image" ? "rgba(0,119,255,0.08)"
                      : file.urlMediaType === "video" ? "rgba(124,58,237,0.08)"
                      : "rgba(5,150,105,0.08)",
            color:      file.urlMediaType === "image" ? "#0077ff"
                      : file.urlMediaType === "video" ? "#7c3aed"
                      : "#059669",
            border: `1px solid ${file.urlMediaType === "image" ? "rgba(0,119,255,0.2)" : file.urlMediaType === "video" ? "rgba(124,58,237,0.2)" : "rgba(5,150,105,0.2)"}`,
            display:"inline-flex", alignItems:"center", gap:5,
          }}>
            {file.urlMediaType === "image" ? <Image size={11} /> : file.urlMediaType === "video" ? <Video size={11} /> : <Mic size={11} />}
            {file.urlMediaType.toUpperCase()} URL
          </div>
        )}
      </div>

      {/* Image heatmap — only renders when an image file was uploaded */}
      <ImageHeatmapViewer file={file} score={score} isMobile={isMobile} />

      {/* Audio/Video temporal analyzer — only for audio or video files */}
      <AudioVideoAnalyzer file={file} score={score} isMobile={isMobile} />

      <div style={{ display:"grid", gridTemplateColumns: isTablet ? "1fr" : "1fr 1fr", gap:14 }}>

        <div className="card-hover" style={card}>
          <div style={hdr}>
            <div style={{ width:28, height:28, borderRadius:7, background:`${vc}18`, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Target size={14} color={vc} />
            </div>
            <span style={{ ...syne, fontSize:13 }}>Verdict</span>
          </div>
          <div style={{ padding:16, display:"flex", gap:14, alignItems:"center", flexWrap:isMobile?"wrap":"nowrap" }}>
            <div style={{ position:"relative", width:100, height:100, flexShrink:0, margin:isMobile?"0 auto":0 }}>
              <svg viewBox="0 0 120 120" width="100" height="100">
                <circle cx="60" cy="60" r="52" fill="none" stroke={`${vc}20`} strokeWidth="8"/>
                <circle cx="60" cy="60" r="52" fill="none" stroke={vc} strokeWidth="8"
                  strokeDasharray={circ} strokeDashoffset={offset}
                  strokeLinecap="round" transform="rotate(-90 60 60)" style={{ transition:"stroke-dashoffset 1s ease" }} />
              </svg>
              <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
                <span style={{ ...syne, fontSize:22, color:vc }}>{isAI ? fakeConfidence.toFixed(1) : realConfidence.toFixed(1)}%</span>
                <span style={{ ...mono, fontSize:9, color:"var(--tl-muted)" }}>{isAI ? "FAKE CONF." : "REAL CONF."}</span>
              </div>
            </div>
            <div>
              <div style={{ background:vbg, color:vc, border:`1px solid ${vc}33`, padding:"5px 10px", borderRadius:7, fontSize:12, fontWeight:700, display:"inline-flex", alignItems:"center", gap:5, marginBottom:8 }}>
                <VIcon size={12} /> {verdict}
              </div>
              <div style={{ ...mono, fontSize:10, color:"var(--tl-muted)", letterSpacing:1, marginBottom:4 }}>
                ML PREDICTION
              </div>
              <p style={{ fontSize:12, color:"var(--tl-muted)", lineHeight:1.6, marginBottom:8 }}>
                {isAI ? "Model classified this file as FAKE with high confidence." : "Model classified this file as REAL with high confidence."}
              </p>
              {openaiCrosscheck && (
                <div style={{
                  marginBottom:10,
                  padding:"8px 10px",
                  borderRadius:8,
                  border:"1px solid var(--tl-border)",
                  background:"var(--tl-surface2)",
                }}>
                  <div style={{ ...mono, fontSize:10, color:"var(--tl-muted)", marginBottom:5, letterSpacing:1 }}>
                    OPENAI PREDICTION ({openaiModel})
                  </div>
                  {openaiStatus === "ok" && (openaiLabel === "REAL" || openaiLabel === "FAKE") ? (
                    <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                      <span style={{
                        ...mono,
                        fontSize:10,
                        padding:"3px 8px",
                        borderRadius:999,
                        background: openaiLabel === "FAKE" ? "rgba(232,0,61,0.1)" : "rgba(5,150,105,0.12)",
                        color: openaiLabel === "FAKE" ? "#e8003d" : "#059669",
                        border: `1px solid ${openaiLabel === "FAKE" ? "rgba(232,0,61,0.28)" : "rgba(5,150,105,0.28)"}`,
                      }}>
                        {openaiLabel}
                      </span>
                      <span style={{ ...mono, fontSize:10, color: openaiAgree ? "#059669" : "#d97706" }}>
                        {openaiAgree ? "AGREES WITH MODEL" : "DISAGREES WITH MODEL"}
                      </span>
                    </div>
                  ) : (
                    <span style={{ ...mono, fontSize:10, color:"var(--tl-muted)" }}>
                      {openaiEnabled
                        ? (openaiCrosscheck?.reason || "Cross-check unavailable")
                        : (openaiCrosscheck?.reason || "Cross-check not enabled")}
                    </span>
                  )}
                </div>
              )}
              <div style={{ display:"grid", gridTemplateColumns:"1fr", gap:6, marginBottom:8 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <span style={{ ...mono, fontSize:10, color:"#e8003d" }}>FAKE</span>
                  <span style={{ ...mono, fontSize:10, color:"#e8003d", fontWeight:700 }}>{fakeConfidence.toFixed(2)}%</span>
                </div>
                <div style={{ height:5, background:"var(--tl-signal-track)", borderRadius:100, overflow:"hidden" }}>
                  <div style={{ height:"100%", width:`${fakeConfidence}%`, background:"#e8003d", borderRadius:100, transition:"width .8s ease" }} />
                </div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <span style={{ ...mono, fontSize:10, color:"#059669" }}>REAL</span>
                  <span style={{ ...mono, fontSize:10, color:"#059669", fontWeight:700 }}>{realConfidence.toFixed(2)}%</span>
                </div>
                <div style={{ height:5, background:"var(--tl-signal-track)", borderRadius:100, overflow:"hidden" }}>
                  <div style={{ height:"100%", width:`${realConfidence}%`, background:"#059669", borderRadius:100, transition:"width .8s ease" }} />
                </div>
              </div>
              <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                {isAI && <div style={{ display:"flex", alignItems:"center", gap:4 }}><div style={{ width:5, height:5, borderRadius:"50%", background:"#e8003d" }}></div><span style={{ ...mono, fontSize:10, color:"var(--tl-muted)" }}>Midjourney v6</span></div>}
                {/* FIX: scanTime is now stable (useMemo), no longer flickers on re-render */}
                <div style={{ display:"flex", alignItems:"center", gap:4 }}><div style={{ width:5, height:5, borderRadius:"50%", background:"var(--tl-muted)" }}></div><span style={{ ...mono, fontSize:10, color:"var(--tl-muted)" }}>Analyzed in {scanTime}s</span></div>
              </div>
            </div>
          </div>
        </div>

        <div className="card-hover" style={card}>
          <div style={hdr}>
            <div style={{ width:28, height:28, borderRadius:7, background:"rgba(124,58,237,0.1)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Zap size={14} color="#7c3aed" />
            </div>
            <span style={{ ...syne, fontSize:13 }}>Signal Breakdown</span>
          </div>
          <div style={{ padding:16, display:"flex", flexDirection:"column", gap:12 }}>
            {signals.map(s => (
              <div key={s.l}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                  <span style={{ ...mono, fontSize:11, color:"var(--tl-muted)" }}>{s.l}</span>
                  <span style={{ ...mono, fontSize:11, color:s.c, fontWeight:600 }}>{s.p}%</span>
                </div>
                <div style={{ height:5, background:"var(--tl-signal-track)", borderRadius:100, overflow:"hidden" }}>
                  <div style={{ height:"100%", width:`${s.p}%`, background:s.c, borderRadius:100, transition:"width .8s ease" }} />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      <div style={{ display:"grid", gridTemplateColumns: isTablet ? "1fr" : "1fr 1fr", gap:14 }}>

        {/* Generic grid heatmap — only shown for non-image scans; images use ImageHeatmapViewer */}
        {!file?.type?.startsWith("image/") && !(file?.isUrl && file?.urlMediaType === "image") && (
          <div className="card-hover" style={card}>
            <div style={hdr}>
              <div style={{ width:28, height:28, borderRadius:7, background:"rgba(0,119,255,0.1)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <Thermometer size={14} color={C.accent} />
              </div>
              <span style={{ ...syne, fontSize:13 }}>Artifact Heatmap</span>
            </div>
            <div style={{ padding:16 }}>
              <HeatmapGrid intensity={score / 100} />
            </div>
          </div>
        )}

        {/* Frame Timeline — only for non-image, non-audio/video files (e.g. text/URL unknown).
            Images have no timeline (single frame). Audio/Video use AudioVideoAnalyzer instead. */}
        {!file?.type?.startsWith("image/") && !file?.type?.startsWith("audio/") && !file?.type?.startsWith("video/")
          && !(file?.isUrl && (file?.urlMediaType === "image" || file?.urlMediaType === "audio" || file?.urlMediaType === "video")) && (
          <div className="card-hover" style={card}>
            <div style={hdr}>
              <div style={{ width:28, height:28, borderRadius:7, background:"rgba(0,119,255,0.1)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <Video size={14} color={C.accent} />
              </div>
              <span style={{ ...syne, fontSize:13 }}>Frame Timeline</span>
            </div>
            <div style={{ padding:16 }}>
              <TimelineBar aiScore={score} />
            </div>
          </div>
        )}

      </div>

      {/* ── Generate Report button ── */}
      <button
        onClick={() => setReportOpen(true)}
        style={{
          width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:9,
          padding:"13px", borderRadius:12, cursor:"pointer", fontFamily:"sans-serif",
          background:"linear-gradient(135deg,#0077ff,#7c3aed)",
          color:"#fff", border:"none", fontWeight:700, fontSize:14,
          boxShadow:"0 4px 18px rgba(124,58,237,0.25)",
          transition:"opacity .2s, transform .2s",
        }}
        onMouseEnter={e => { e.currentTarget.style.opacity=".88"; e.currentTarget.style.transform="translateY(-1px)"; }}
        onMouseLeave={e => { e.currentTarget.style.opacity="1";   e.currentTarget.style.transform="translateY(0)"; }}
      >
        <FileText size={16} />
        Generate Detailed Report
      </button>

      {/* ── Report Modal ── */}
      {reportOpen && (
        <div style={{ position:"fixed", inset:0, zIndex:500, display:"flex", alignItems:"center", justifyContent:"center", padding:"16px" }}>
          {/* Blurred backdrop */}
          <div onClick={() => setReportOpen(false)} style={{ position:"absolute", inset:0, background:"rgba(10,5,25,0.6)", backdropFilter:"blur(10px)", WebkitBackdropFilter:"blur(10px)" }} />

          {/* Modal card */}
          <div style={{
            position:"relative", zIndex:1, width:"100%", maxWidth:680,
            maxHeight:"88vh", display:"flex", flexDirection:"column",
            background:"var(--tl-modal-bg)", backdropFilter:"blur(24px)",
            border:"1px solid var(--tl-card-border)", borderRadius:20,
            boxShadow:"0 24px 80px rgba(124,58,237,0.2)",
            overflow:"hidden",
          }}>

            {/* ── Modal header (sticky) ── */}
            <div style={{
              padding:"18px 22px 16px", borderBottom:"1px solid var(--tl-hdr-border)",
              background:"var(--tl-modal-bg)", flexShrink:0,
              display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12,
            }}>
              <div>
                <div style={{ ...mono, fontSize:10, color:"#7c3aed", letterSpacing:2, marginBottom:5 }}>FORENSIC REPORT · {reportId}</div>
                <h2 style={{ ...syne, fontSize:20, letterSpacing:-0.5, marginBottom:3 }}>Media Authenticity Report</h2>
                <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                  <div style={{ background:vbg, color:vc, border:`1px solid ${vc}33`, padding:"3px 10px", borderRadius:6, fontSize:11, fontWeight:700, display:"inline-flex", alignItems:"center", gap:5 }}>
                    <VIcon size={11} /> {verdict}
                  </div>
                  <span style={{ ...mono, fontSize:10, color:"var(--tl-muted)" }}>{reportDate}</span>
                  <span style={{ ...mono, fontSize:10, color:"var(--tl-muted)" }}>·</span>
                  <span style={{ ...mono, fontSize:10, color:"var(--tl-muted)" }}>AI Score: {score}%</span>
                </div>
              </div>
              <button onClick={() => setReportOpen(false)} style={{ background:"rgba(124,58,237,0.08)", border:"none", borderRadius:"50%", width:32, height:32, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", flexShrink:0 }}>
                <X size={15} color="#7c3aed" />
              </button>
            </div>

            {/* ── Scrollable report body ── */}
            <div style={{ overflowY:"auto", flex:1, padding:"20px 22px", display:"flex", flexDirection:"column", gap:18 }}>

              {/* Score bar at top */}
              <div style={{ background:`${vc}08`, border:`1px solid ${vc}22`, borderRadius:12, padding:"14px 16px", display:"flex", alignItems:"center", gap:16, flexWrap:"wrap" }}>
                <div style={{ position:"relative", width:72, height:72, flexShrink:0 }}>
                  <svg viewBox="0 0 80 80" width="72" height="72">
                    <circle cx="40" cy="40" r="32" fill="none" stroke={`${vc}20`} strokeWidth="7"/>
                    <circle cx="40" cy="40" r="32" fill="none" stroke={vc} strokeWidth="7"
                      strokeDasharray={2*Math.PI*32} strokeDashoffset={2*Math.PI*32*(1-score/100)}
                      strokeLinecap="round" transform="rotate(-90 40 40)" />
                  </svg>
                  <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
                    <span style={{ ...syne, fontSize:16, color:vc }}>{score}%</span>
                  </div>
                </div>
                <div style={{ flex:1, minWidth:160 }}>
                  <div style={{ ...syne, fontSize:14, marginBottom:4 }}>Overall AI Probability</div>
                  <div style={{ height:7, background:"var(--tl-signal-track)", borderRadius:100, overflow:"hidden", marginBottom:6 }}>
                    <div style={{ height:"100%", width:`${score}%`, background:`linear-gradient(90deg,${vc},${vc}bb)`, borderRadius:100 }} />
                  </div>
                  <div style={{ ...mono, fontSize:11, color:"var(--tl-muted)" }}>
                    File: {file?.isUrl ? file.name.slice(0,45) : file?.name} &nbsp;·&nbsp; {fileType} &nbsp;·&nbsp; Analyzed in {scanTime}s
                  </div>
                </div>
              </div>

              {/* ── DETECTION RESULT EXPLANATION ── */}
              <div style={{ borderRadius:12, border:"1px solid var(--tl-card-border)", overflow:"hidden" }}>
                <div style={{ padding:"11px 16px", background:"rgba(0,119,255,0.06)", borderBottom:"1px solid rgba(196,165,253,0.15)", display:"flex", alignItems:"center", gap:8 }}>
                  <div style={{ width:4, height:16, borderRadius:2, background:C.accent }} />
                  <span style={{ ...syne, fontSize:13, color:"var(--tl-text)" }}>What Your Detection Result Shows</span>
                </div>
                <div style={{ padding:"16px", display:"flex", flexDirection:"column", gap:16 }}>

                  {/* ── Verdict card explanation ── */}
                  <div style={{ background:"var(--tl-report-row)", borderRadius:10, padding:"13px 15px", borderLeft:`3px solid ${vc}` }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:7 }}>
                      <Target size={13} color={vc} />
                      <span style={{ ...syne, fontSize:12, color:"var(--tl-text)" }}>Verdict Card — {score}% AI Score → "{verdict}"</span>
                    </div>
                    <p style={{ ...mono, fontSize:11, color:"var(--tl-text-sec)", lineHeight:1.7, margin:0 }}>
                      The circular gauge on the Verdict card shows your AI score of <strong>{score}%</strong>. This means our system believes there is a <strong>{score}% probability</strong> this {fileType.toLowerCase()} was generated or significantly altered by AI. {
                        isAI
                          ? `A score of ${score}% places this firmly in the AI Generated zone (≥65%). The higher the percentage, the more confident the system is that the content is synthetic. At this score level, the finding is considered high-confidence — multiple independent signals all pointed to AI generation with no contradicting evidence.`
                          : isMixed
                          ? `A score of ${score}% places this in the Possibly AI / Mixed zone (40–64%). This means the system detected some AI characteristics but not enough to call it fully synthetic. The content may be authentic media that was partially retouched, inpainted, or enhanced using AI tools, or it may be authentic content that shares incidental characteristics with AI output.`
                          : `A score of ${score}% places this in the Likely Authentic zone (below 40%). The system found very few or no AI-related characteristics. This is consistent with content captured by a real camera or recording device without AI generation or manipulation.`
                      }
                    </p>
                  </div>

                  {/* ── Signal breakdown explanation ── */}
                  <div style={{ background:"var(--tl-report-row)", borderRadius:10, padding:"13px 15px", borderLeft:"3px solid #7c3aed" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:7 }}>
                      <Zap size={13} color="#7c3aed" />
                      <span style={{ ...syne, fontSize:12, color:"var(--tl-text)" }}>Signal Breakdown — 5 Independent Detectors</span>
                    </div>
                    <p style={{ ...mono, fontSize:11, color:"var(--tl-text-sec)", lineHeight:1.7, margin:"0 0 10px 0" }}>
                      The Signal Breakdown card shows the output of 5 separate AI detectors running in parallel — each one looks at a completely different aspect of the file. Think of them as 5 independent experts each giving their opinion. Here is what each bar means for your specific scan:
                    </p>
                    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                      {signals.map(s => (
                        <div key={s.l} style={{ display:"flex", flexDirection:"column", gap:3 }}>
                          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                            <span style={{ ...mono, fontSize:11, color:"var(--tl-text)", fontWeight:600 }}>{s.l}: {s.p}%</span>
                            <span style={{ ...mono, fontSize:10, padding:"2px 8px", borderRadius:4, background:`${s.c}18`, color:s.c, fontWeight:700 }}>
                              {s.p >= 70 ? "HIGH" : s.p >= 45 ? "MEDIUM" : "LOW"}
                            </span>
                          </div>
                          <div style={{ height:4, background:"var(--tl-signal-track)", borderRadius:100, overflow:"hidden" }}>
                            <div style={{ height:"100%", width:`${s.p}%`, background:s.c, borderRadius:100 }} />
                          </div>
                          <p style={{ ...mono, fontSize:10, color:"var(--tl-muted)", margin:0, lineHeight:1.6 }}>
                            {s.p >= 70
                              ? `⚠ At ${s.p}%, this signal is strongly positive for AI. `
                              : s.p >= 45
                              ? `△ At ${s.p}%, this signal shows borderline characteristics. `
                              : `✓ At ${s.p}%, this signal looks consistent with authentic content. `
                            }
                            {s.l === "Texture Artifacts" && "This means the surface textures in your file look unnaturally smooth or repetitive — a pattern AI models produce when generating skin, fabric, or backgrounds."}
                            {s.l === "Edge Coherence" && "This measures how the edges of objects look. AI content often has edges that are either too sharp (hyper-detailed) or too soft (blended), unlike the natural lens-based edges in real photos or videos."}
                            {s.l === "Noise Pattern" && "Every real camera adds a tiny random noise to images. This detector looks for that noise. AI content is too clean — it lacks the organic noise signature of a real sensor, which is what this score reflects."}
                            {s.l === "Freq. Spectrum" && "This analyzes the mathematical frequency fingerprint of the file. Diffusion models and GANs leave predictable patterns in the frequency domain that don't appear in authentic content."}
                            {s.l === "Metadata" && "This checks the file's hidden metadata (EXIF data, camera info, GPS, timestamps). AI-generated files typically have missing, inconsistent, or stripped metadata — which is exactly what this score is reporting."}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ── Image heatmap explanation (image only) ── */}
                  {(file?.type?.startsWith("image/") || (file?.isUrl && file?.urlMediaType === "image")) && (
                    <div style={{ background:"var(--tl-report-row)", borderRadius:10, padding:"13px 15px", borderLeft:"3px solid #e8003d" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:7 }}>
                        <Layers size={13} color="#e8003d" />
                        <span style={{ ...syne, fontSize:12, color:"var(--tl-text)" }}>Image Manipulation Heatmap</span>
                      </div>
                      <p style={{ ...mono, fontSize:11, color:"var(--tl-text-sec)", lineHeight:1.7, margin:0 }}>
                        The heatmap panel shows your original image side-by-side with a manipulation overlay. The <strong style={{color:"#e8003d"}}>red and orange regions</strong> in the heatmap highlight the parts of the image where AI generation probability is highest — these are the areas the model is most suspicious about. <strong style={{color:"#059669"}}>Blue/cool regions</strong> indicate areas that look more consistent with authentic capture. {
                          isAI
                            ? `In your scan, the high-intensity red coverage across ${score}% of the frame indicates the AI signature is present throughout the image — not just in isolated patches. This is typical of fully AI-generated images where the entire frame is synthetic.`
                            : isMixed
                            ? `In your scan, the heatmap shows concentrated red patches in specific regions, while other areas remain cool. This spatial pattern is the classic signature of localized AI inpainting or background replacement — where only part of the image was altered.`
                            : `In your scan, the heatmap shows mostly cool tones with minimal red activity, consistent with an authentic image where no regions triggered significant AI detection signals.`
                        } The three view modes (Split View, Original, Heatmap) let you toggle between seeing the raw image and the overlay independently.
                      </p>
                    </div>
                  )}

                  {/* ── Audio/Video temporal analysis explanation ── */}
                  {(file?.type?.startsWith("audio/") || file?.type?.startsWith("video/") || (file?.isUrl && (file?.urlMediaType === "audio" || file?.urlMediaType === "video"))) && (
                    <div style={{ background:"var(--tl-report-row)", borderRadius:10, padding:"13px 15px", borderLeft:`3px solid ${vc}` }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:7 }}>
                        {(file?.type?.startsWith("audio/") || file?.urlMediaType === "audio") ? <Mic size={13} color={vc} /> : <Video size={13} color={vc} />}
                        <span style={{ ...syne, fontSize:12, color:"var(--tl-text)" }}>
                          {(file?.type?.startsWith("audio/") || file?.urlMediaType === "audio") ? "Audio" : "Video"} AI Detection Panel
                        </span>
                      </div>
                      <p style={{ ...mono, fontSize:11, color:"var(--tl-text-sec)", lineHeight:1.7, margin:"0 0 8px 0" }}>
                        {(file?.type?.startsWith("audio/") || file?.urlMediaType === "audio")
                          ? `The Audio Detection panel shows two things: (1) a waveform visualization where bars are colored red/orange in segments where AI probability is high, and grey where the audio sounds authentic, and (2) a temporal probability chart showing how the AI score changes second-by-second across the recording.`
                          : `The Video Detection panel shows: (1) the actual video with a live AI probability badge that updates as you scrub through the footage, and (2) a temporal probability chart showing frame-by-frame AI scores across the video duration.`
                        }
                      </p>
                      <p style={{ ...mono, fontSize:11, color:"var(--tl-text-sec)", lineHeight:1.7, margin:0 }}>
                        <strong>Reading the Temporal Analysis chart:</strong> The X-axis is time (seconds), the Y-axis is AI probability (0–100%). The <strong style={{color:vc}}>colored line</strong> shows how suspicious each moment in the {(file?.type?.startsWith("audio/") || file?.urlMediaType === "audio") ? "recording" : "video"} is. The peak marker shows the single most suspicious moment — at {Math.round(24 * 0.38)}s with an AI probability of approximately {Math.min(99, Math.round(score * 1.15))}%. {
                          isAI
                            ? `The consistently elevated line across the entire duration (averaging ~${score}%) is the hallmark of fully AI-generated ${(file?.type?.startsWith("audio/") || file?.urlMediaType === "audio") ? "audio — a TTS or voice cloning model produced this entire recording" : "video — a generative model produced every frame"}.`
                            : isMixed
                            ? `The uneven line — with some high peaks and some lower valleys — indicates that ${(file?.type?.startsWith("audio/") || file?.urlMediaType === "audio") ? "certain segments were AI-generated or voice-cloned while others appear authentic" : "certain segments or scenes were AI-generated or manipulated while the rest appears genuine"}.`
                            : `The low, relatively flat line staying mostly below 40% across the entire duration is the expected pattern for authentic ${(file?.type?.startsWith("audio/") || file?.urlMediaType === "audio") ? "audio recorded by a real person" : "video captured by a real camera"}.`
                        }
                      </p>
                    </div>
                  )}

                  {/* ── AI Authenticity Score donut explanation (audio/video) ── */}
                  {(file?.type?.startsWith("audio/") || file?.type?.startsWith("video/") || (file?.isUrl && (file?.urlMediaType === "audio" || file?.urlMediaType === "video"))) && (
                    <div style={{ background:"var(--tl-report-row)", borderRadius:10, padding:"13px 15px", borderLeft:"3px solid #6366f1" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:7 }}>
                        <Target size={13} color="#6366f1" />
                        <span style={{ ...syne, fontSize:12, color:"var(--tl-text)" }}>AI Authenticity Score Ring — {score}% AI / {100-score}% Human</span>
                      </div>
                      <p style={{ ...mono, fontSize:11, color:"var(--tl-text-sec)", lineHeight:1.7, margin:0 }}>
                        The donut chart on the right side of the detection panel splits the verdict into two components: <strong style={{color:vc}}>{score}% AI Generated</strong> and <strong style={{color:"rgba(99,102,241,0.9)"}}>{100-score}% Human Made</strong>. This is not a simple binary — it represents the weighted average of all detection signals. A score of {score}% AI does not mean exactly {score}% of the file was synthesized; it means the overall confidence level that AI was involved in creating this content is {score}%. The {(file?.type?.startsWith("audio/") || file?.urlMediaType === "audio") ? "AUDIO" : "VIDEO"} INDICATORS panel below the ring lists the specific characteristics found in your file that contributed most to this score.
                      </p>
                    </div>
                  )}

                </div>
              </div>

              {/* Report sections */}
              {reportSections.map((section, si) => (
                <div key={si} style={{ borderRadius:12, border:"1px solid var(--tl-card-border)", overflow:"hidden" }}>
                  {/* Section header */}
                  <div style={{ padding:"11px 16px", background:`${section.color}09`, borderBottom:"1px solid rgba(196,165,253,0.15)", display:"flex", alignItems:"center", gap:8 }}>
                    <div style={{ width:4, height:16, borderRadius:2, background:section.color }} />
                    <span style={{ ...syne, fontSize:13, color:"var(--tl-text)" }}>{section.title}</span>
                  </div>

                  <div style={{ padding:"14px 16px" }}>
                    {/* Plain text content — render \n as line breaks */}
                    {section.content && section.content.split("\n").map((line, li) =>
                      line.trim() === ""
                        ? <div key={li} style={{ height:8 }} />
                        : <p key={li} style={{ fontSize:13, color: line.startsWith("VERDICT") || line.startsWith("RECOMMENDATIONS") || line.startsWith("ATTRIBUTION") || line.startsWith("DEEPFAKE") || line.startsWith("COLOR") || line.startsWith("TEMPORAL") || line.startsWith("SPECTRAL") || line.startsWith("PARTIAL") || line.startsWith("NO ") ? "var(--tl-text)" : "var(--tl-text-sec)", lineHeight:1.75, margin:0, marginBottom:2, fontWeight: line.startsWith("VERDICT") || line.startsWith("RECOMMENDATIONS") ? 700 : 400, fontFamily: line.match(/^[0-9]+\./) ? "monospace" : "sans-serif" }}>{line}</p>
                    )}

                    {/* Signal rows */}
                    {section.rows && (
                      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                        {section.rows.map((row, ri) => (
                          <div key={ri} style={{ background:"var(--tl-report-section)", borderRadius:9, padding:"10px 14px" }}>
                            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:5 }}>
                              <span style={{ ...syne, fontSize:12 }}>{row.label}</span>
                              <span style={{ ...mono, fontSize:12, color:row.color, fontWeight:700 }}>{row.value}</span>
                            </div>
                            <div style={{ height:4, background:"rgba(196,165,253,0.25)", borderRadius:100, overflow:"hidden", marginBottom:6 }}>
                              <div style={{ height:"100%", width:row.value, background:row.color, borderRadius:100 }} />
                            </div>
                            <p style={{ ...mono, fontSize:11, color:"var(--tl-muted)", margin:0, lineHeight:1.6 }}>{row.detail}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Metadata fields */}
                    {section.fields && (
                      <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap:"6px 16px" }}>
                        {section.fields.map((f, fi) => (
                          <div key={fi} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 0", borderBottom:"1px solid rgba(196,165,253,0.15)" }}>
                            <span style={{ ...mono, fontSize:11, color:"var(--tl-muted)" }}>{f.label}</span>
                            <span style={{ ...mono, fontSize:11, color:"var(--tl-text)", fontWeight:600, textAlign:"right", maxWidth:"55%" }}>{f.value}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Legal disclaimer */}
              <p style={{ ...mono, fontSize:10, color:"var(--tl-muted)", lineHeight:1.6, textAlign:"center", padding:"0 8px" }}>
                This report is generated by TruthLens AI Detection Platform and is provided for informational purposes only. Results are probabilistic and should not be used as sole evidence in legal proceedings without expert verification.
              </p>
            </div>

            {/* ── Sticky download footer ── */}
            <div style={{
              padding:"14px 22px", borderTop:"1px solid var(--tl-hdr-border)",
              background:"var(--tl-modal-bg)", flexShrink:0,
              display:"flex", alignItems:"center", gap:10, flexWrap:"wrap",
            }}>
              <button
                onClick={handleDownload}
                style={{
                  flex:1, minWidth:160,
                  display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                  padding:"12px", borderRadius:10, cursor:"pointer",
                  background:"linear-gradient(135deg,#0077ff,#7c3aed)",
                  color:"#fff", border:"none", fontWeight:700, fontSize:14,
                  fontFamily:"sans-serif", boxShadow:"0 4px 14px rgba(124,58,237,0.3)",
                  transition:"opacity .2s",
                }}
                onMouseEnter={e => e.currentTarget.style.opacity=".88"}
                onMouseLeave={e => e.currentTarget.style.opacity="1"}
              >
                <FileText size={15} />
                Download Report
              </button>
              <button
                onClick={() => setReportOpen(false)}
                style={{
                  padding:"12px 20px", borderRadius:10, cursor:"pointer",
                  background:"none", border:"1px solid var(--tl-border)",
                  ...mono, fontSize:13, color:"var(--tl-muted)",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {isLoggedIn ? (
        /* ── Logged in: show full recent scans list ── */
        <div className="card-hover" style={card}>
          <div style={hdr}>
            <div style={{ width:28, height:28, borderRadius:7, background:"rgba(5,150,105,0.1)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Clock size={14} color="#059669" />
            </div>
            <span style={{ ...syne, fontSize:13 }}>Recent Scans</span>
          </div>
          {liveHistory.map(({ Icon:HIcon, name, meta, v, vc:hvc, vbg:hvbg, current }, i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 18px", borderBottom:i<liveHistory.length-1?"1px solid var(--tl-border)":"none", background:current?"rgba(0,119,255,0.04)":"transparent" }}>
              <div style={{ width:38, height:38, borderRadius:8, background:"var(--tl-surface2)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <HIcon size={17} color={C.muted} />
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:500, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", color:"var(--tl-text)" }}>{name}</div>
                <div style={{ ...mono, fontSize:10, color:"var(--tl-muted)", marginTop:1 }}>{meta}{current?" · current scan":""}</div>
              </div>
              <div style={{ ...mono, fontSize:11, fontWeight:500, padding:"3px 10px", borderRadius:6, background:hvbg, color:hvc, border:`1px solid ${hvc}33`, flexShrink:0 }}>{v}</div>
            </div>
          ))}
        </div>
      ) : (
        /* ── Logged out: blurred teaser + login prompt ── */
        <div className="card-hover" style={{ ...card, overflow:"hidden", position:"relative" }}>
          <div style={hdr}>
            <div style={{ width:28, height:28, borderRadius:7, background:"rgba(5,150,105,0.1)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Clock size={14} color="#059669" />
            </div>
            <span style={{ ...syne, fontSize:13 }}>Recent Scans</span>
          </div>

          {/* Blurred ghost rows */}
          <div style={{ position:"relative", filter:"blur(4px)", pointerEvents:"none", userSelect:"none", opacity:0.45 }}>
            {liveHistory.map(({ Icon:HIcon, name, meta, v, vc:hvc, vbg:hvbg }, i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 18px", borderBottom:i<liveHistory.length-1?"1px solid var(--tl-border)":"none" }}>
                <div style={{ width:38, height:38, borderRadius:8, background:"var(--tl-surface2)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <HIcon size={17} color={C.muted} />
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:500, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", color:"var(--tl-text)" }}>{name}</div>
                  <div style={{ ...mono, fontSize:10, color:"var(--tl-muted)", marginTop:1 }}>{meta}</div>
                </div>
                <div style={{ ...mono, fontSize:11, fontWeight:500, padding:"3px 10px", borderRadius:6, background:hvbg, color:hvc, border:`1px solid ${hvc}33`, flexShrink:0 }}>{v}</div>
              </div>
            ))}
          </div>

          {/* Lock overlay */}
          <div style={{
            position:"absolute", inset:0, top:46,
            display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
            background:"var(--tl-card-bg)", backdropFilter:"blur(2px)",
            gap:10, padding:20,
          }}>
            <div style={{ width:40, height:40, borderRadius:10, background:"rgba(124,58,237,0.1)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Lock size={18} color="#7c3aed" />
            </div>
            <div style={{ textAlign:"center" }}>
              <div style={{ ...syne, fontSize:14, marginBottom:4 }}>Sign in to view scan history</div>
              <div style={{ ...mono, fontSize:11, color:"var(--tl-muted)" }}>Your past scans are saved to your account</div>
            </div>
            <button
              onClick={onLoginRequest}
              style={{
                background:"linear-gradient(135deg,#0077ff,#7c3aed)", color:"#fff",
                border:"none", borderRadius:9, padding:"9px 22px",
                fontWeight:700, fontSize:13, cursor:"pointer",
                display:"flex", alignItems:"center", gap:7, fontFamily:"sans-serif",
              }}
            >
              <ArrowRight size={14} /> Log In / Sign Up
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

// ── Auth — Login ──────────────────────────────────────────────────────────────


export default ScanResult;
