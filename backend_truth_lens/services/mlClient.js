const fs = require("fs");
const path = require("path");

const ML_BASE_URL = process.env.ML_SERVICE_URL || "http://127.0.0.1:8001";
const MAX_REMOTE_FILE_BYTES = 25 * 1024 * 1024;

function filenameFromUrl(url) {
  try {
    const parsed = new URL(url);
    const name = path.basename(parsed.pathname || "");
    return name || "remote-file";
  } catch {
    return "remote-file";
  }
}

async function fetchRemoteFile(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Unable to fetch URL (status ${response.status})`);
  }

  const bytes = new Uint8Array(await response.arrayBuffer());
  if (!bytes.byteLength) {
    throw new Error("Remote URL returned empty file");
  }
  if (bytes.byteLength > MAX_REMOTE_FILE_BYTES) {
    throw new Error("Remote file too large");
  }

  const contentType = response.headers.get("content-type") || "application/octet-stream";
  return {
    filename: filenameFromUrl(url),
    bytes,
    contentType,
  };
}

async function detectWithMl({ endpoint, filePath, remoteUrl }) {
  if (!endpoint) {
    throw new Error("ML endpoint is required");
  }

  const form = new FormData();

  if (filePath) {
    const bytes = fs.readFileSync(filePath);
    const filename = path.basename(filePath);
    form.append("file", new Blob([bytes]), filename);
  } else if (remoteUrl) {
    const remote = await fetchRemoteFile(remoteUrl);
    form.append("file", new Blob([remote.bytes], { type: remote.contentType }), remote.filename);
  } else {
    throw new Error("Either filePath or remoteUrl is required");
  }

  const response = await fetch(`${ML_BASE_URL}${endpoint}`, {
    method: "POST",
    body: form,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`ML request failed (${response.status}): ${text}`);
  }

  const payload = await response.json();
  return payload.result || payload;
}

module.exports = {
  detectWithMl,
};
