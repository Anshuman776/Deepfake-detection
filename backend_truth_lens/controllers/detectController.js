const fs = require("fs");

const detectImage = require("../services/imageDetector");
const detectVideo = require("../services/vedioDetector");
const detectAudio = require("../services/audioDetector");

const detectorByType = {
  image: detectImage,
  video: detectVideo,
  audio: detectAudio,
};

function clampConfidence(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return 50;
  return Math.max(0, Math.min(100, Number(num.toFixed(3))));
}

function normalizeResult(rawResult = {}) {
  const label = String(rawResult.label || "").toUpperCase();
  const confidence = clampConfidence(rawResult.confidence);

  let fakeConfidence = Number(rawResult.fake_confidence);
  let realConfidence = Number(rawResult.real_confidence);

  if (!Number.isFinite(fakeConfidence) || !Number.isFinite(realConfidence)) {
    if (label === "REAL") {
      realConfidence = confidence;
      fakeConfidence = 100 - confidence;
    } else {
      fakeConfidence = confidence;
      realConfidence = 100 - confidence;
    }
  }

  fakeConfidence = clampConfidence(fakeConfidence);
  realConfidence = clampConfidence(realConfidence);

  const resolvedLabel = label === "REAL" || label === "FAKE"
    ? label
    : (fakeConfidence >= realConfidence ? "FAKE" : "REAL");

  return {
    label: resolvedLabel,
    confidence: confidence,
    fake_confidence: fakeConfidence,
    real_confidence: realConfidence,
  };
}

function inferTypeFromRequest(req) {
  const mime = (req.file?.mimetype || "").toLowerCase();
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";

  const url = (req.body?.url || "").toLowerCase();
  if (/\.(jpg|jpeg|png|webp|gif|bmp|svg|avif)(\?|$)/.test(url)) return "image";
  if (/\.(mp4|mov|webm|avi|mkv|m4v|ogv)(\?|$)/.test(url)) return "video";
  if (/\.(mp3|wav|ogg|aac|flac|m4a|opus)(\?|$)/.test(url)) return "audio";

  return "";
}

exports.detectMedia = async (req, res) => {
  const routeType = (req.params.type || "").toLowerCase().trim();
  const bodyType = (req.body.type || "").toLowerCase().trim();
  const inferredType = inferTypeFromRequest(req);
  const type = routeType || bodyType || inferredType;

  if (!detectorByType[type]) {
    return res.status(400).json({
      error: "Unsupported media type",
      supported: ["image", "video", "audio"],
    });
  }

  const filePath = req.file?.path;
  const remoteUrl = req.body?.url;

  if (!filePath && !remoteUrl) {
    return res.status(400).json({ error: "Either file or url is required" });
  }

  try {
    const detector = detectorByType[type];
    const rawResult = await detector({ filePath, remoteUrl });
    const result = normalizeResult(rawResult);

    return res.json({
      mediaType: type,
      result,
    });
  } catch (err) {
    return res.status(502).json({
      error: "Detection failed",
      details: err.message,
    });
  } finally {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
};
