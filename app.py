"""
TruthLens Backend API (port 8000)

This service acts as a lightweight bridge between the frontend and the heavy
ML inference service running on port 8001.
"""
import os
import base64
import tempfile
from pathlib import Path
from urllib.parse import urlparse

import logging
import httpx
import numpy as np
import cv2
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("truthlens-backend")

# Load local .env values if present (without external dependency).
ENV_FILE = Path(__file__).resolve().parent / ".env"
if ENV_FILE.exists():
    for _line in ENV_FILE.read_text(encoding="utf-8").splitlines():
        _line = _line.strip()
        if _line and not _line.startswith("#") and "=" in _line:
            _k, _v = _line.split("=", 1)
            os.environ.setdefault(_k.strip(), _v.strip())

ML_BASE_URL = "http://127.0.0.1:8001"
MAX_REMOTE_FILE_BYTES = 500 * 1024 * 1024  # 500 MB
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "").strip()
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o").strip() or "gpt-4o"

ML_ENDPOINTS = {
    "image": f"{ML_BASE_URL}/api/detect/image",
    "video": f"{ML_BASE_URL}/api/detect/video",
    "audio": f"{ML_BASE_URL}/api/detect/audio",
}

app = FastAPI(title="TruthLens Backend API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


async def _openai_crosscheck_image(content: bytes, content_type: str) -> dict:
    if not OPENAI_API_KEY:
        logger.warning("OpenAI cross-check skipped: OPENAI_API_KEY not configured")
        return {
            "enabled": False,
            "status": "disabled",
            "reason": "OPENAI_API_KEY is not configured on backend",
        }

    mime = (content_type or "image/jpeg").split(";")[0].strip() or "image/jpeg"
    encoded = base64.b64encode(content).decode("utf-8")

    body = {
        "model": OPENAI_MODEL,
        "temperature": 0,
        "max_tokens": 5,
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": (
                            "Classify this image as either REAL or FAKE (deepfake/AI-generated). "
                            "Reply with exactly one word: REAL or FAKE."
                        ),
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:{mime};base64,{encoded}",
                            "detail": "low",
                        },
                    },
                ],
            }
        ],
    }

    timeout = httpx.Timeout(45.0)
    headers = {
        "Authorization": f"Bearer {OPENAI_API_KEY}",
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient(timeout=timeout) as client:
        try:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers=headers,
                json=body,
            )
            response.raise_for_status()
        except httpx.HTTPError as exc:
            return {
                "enabled": True,
                "status": "error",
                "reason": f"OpenAI request failed: {exc}",
            }

    try:
        payload = response.json()
        raw = str(payload["choices"][0]["message"]["content"]).strip().upper()
    except Exception as exc:
        return {
            "enabled": True,
            "status": "error",
            "reason": f"OpenAI response parse failed: {exc}",
        }

    label = "UNKNOWN"
    if "REAL" in raw:
        label = "REAL"
    elif "FAKE" in raw:
        label = "FAKE"

    result = {
        "enabled": True,
        "status": "ok",
        "model": OPENAI_MODEL,
        "media_type": "image",
        "label": label,
        "raw": raw,
    }
    logger.info("OpenAI image cross-check: label=%s, model=%s", label, OPENAI_MODEL)
    return result


def _extract_video_frames_as_b64(content: bytes, max_frames: int = 4) -> list[str]:
    """Extract evenly spaced frames from video bytes and return JPEG base64 payloads."""
    with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as tmp:
        tmp.write(content)
        tmp_path = tmp.name

    try:
        cap = cv2.VideoCapture(tmp_path)
        if not cap.isOpened():
            return []

        total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        if total <= 0:
            total = max_frames

        sample_idxs = np.linspace(0, max(total - 1, 0), min(max_frames, max(total, 1))).astype(int).tolist()
        sample_set = set(sample_idxs)

        frames_b64: list[str] = []
        idx = 0
        while True:
            ok, frame = cap.read()
            if not ok:
                break
            if idx in sample_set:
                ok_jpg, buf = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 70])
                if ok_jpg:
                    frames_b64.append(base64.b64encode(buf.tobytes()).decode("utf-8"))
            idx += 1

        cap.release()
        return frames_b64
    finally:
        try:
            os.remove(tmp_path)
        except OSError:
            pass


async def _openai_crosscheck_video(content: bytes, content_type: str) -> dict:
    if not OPENAI_API_KEY:
        return {
            "enabled": False,
            "status": "disabled",
            "reason": "OPENAI_API_KEY is not configured on backend",
        }

    frames = _extract_video_frames_as_b64(content, max_frames=4)
    if not frames:
        return {
            "enabled": True,
            "status": "error",
            "reason": "Failed to extract frames from video for OpenAI cross-check",
        }

    content_items = [
        {
            "type": "text",
            "text": (
                "These are sampled frames from a video. "
                "Classify the video as REAL or FAKE (deepfake/AI-generated). "
                "Reply with exactly one word: REAL or FAKE."
            ),
        }
    ]
    for frame_b64 in frames:
        content_items.append(
            {
                "type": "image_url",
                "image_url": {
                    "url": f"data:image/jpeg;base64,{frame_b64}",
                    "detail": "low",
                },
            }
        )

    body = {
        "model": OPENAI_MODEL,
        "temperature": 0,
        "max_tokens": 5,
        "messages": [
            {
                "role": "user",
                "content": content_items,
            }
        ],
    }

    timeout = httpx.Timeout(60.0)
    headers = {
        "Authorization": f"Bearer {OPENAI_API_KEY}",
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient(timeout=timeout) as client:
        try:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers=headers,
                json=body,
            )
            response.raise_for_status()
        except httpx.HTTPError as exc:
            return {
                "enabled": True,
                "status": "error",
                "reason": f"OpenAI request failed: {exc}",
            }

    try:
        payload = response.json()
        raw = str(payload["choices"][0]["message"]["content"]).strip().upper()
    except Exception as exc:
        return {
            "enabled": True,
            "status": "error",
            "reason": f"OpenAI response parse failed: {exc}",
        }

    label = "UNKNOWN"
    if "REAL" in raw:
        label = "REAL"
    elif "FAKE" in raw:
        label = "FAKE"

    result = {
        "enabled": True,
        "status": "ok",
        "model": OPENAI_MODEL,
        "media_type": "video",
        "label": label,
        "raw": raw,
        "frames_used": len(frames),
    }
    logger.info("OpenAI video cross-check: label=%s, frames=%d, model=%s", label, len(frames), OPENAI_MODEL)
    return result


async def _crosscheck_for_media(media_type: str, content: bytes, content_type: str) -> dict:
    media_type = media_type.lower().strip()
    if media_type == "image":
        return await _openai_crosscheck_image(content, content_type)
    if media_type == "video":
        return await _openai_crosscheck_video(content, content_type)
    if media_type == "audio":
        return {
            "enabled": False,
            "status": "skipped",
            "reason": "OpenAI cross-check is currently enabled for image/video scans only",
        }
    return {
        "enabled": False,
        "status": "skipped",
        "reason": "Unsupported media type for OpenAI cross-check",
    }


def _attach_crosscheck(payload: dict, crosscheck: dict) -> dict:
    if isinstance(payload, dict):
        payload["openai_crosscheck"] = crosscheck
        return payload
    return {
        "result": payload,
        "openai_crosscheck": crosscheck,
    }


def _filename_from_url(url: str) -> str:
    path = urlparse(url).path
    name = Path(path).name
    return name or "remote-file"


async def _download_remote_file(url: str) -> tuple[str, bytes, str]:
    timeout = httpx.Timeout(45.0)
    async with httpx.AsyncClient(timeout=timeout, follow_redirects=True) as client:
        try:
            response = await client.get(url)
            response.raise_for_status()
        except httpx.HTTPError as exc:
            raise HTTPException(status_code=400, detail=f"Unable to fetch URL: {exc}") from exc

    content = response.content
    if not content:
        raise HTTPException(status_code=400, detail="Remote URL returned an empty response")
    if len(content) > MAX_REMOTE_FILE_BYTES:
        raise HTTPException(status_code=413, detail="Remote file is too large")

    filename = _filename_from_url(url)
    content_type = response.headers.get("content-type", "application/octet-stream")
    return filename, content, content_type


async def _forward_to_ml(media_type: str, filename: str, content: bytes, content_type: str):
    endpoint = ML_ENDPOINTS.get(media_type)
    if endpoint is None:
        raise HTTPException(status_code=400, detail="Unsupported media type")

    files = {
        "file": (filename, content, content_type or "application/octet-stream")
    }

    timeout = httpx.Timeout(180.0)
    async with httpx.AsyncClient(timeout=timeout) as client:
        try:
            response = await client.post(endpoint, files=files)
        except httpx.HTTPError as exc:
            raise HTTPException(status_code=502, detail=f"ML service request failed: {exc}") from exc

    if response.status_code >= 400:
        raise HTTPException(status_code=response.status_code, detail=response.text)

    try:
        return response.json()
    except ValueError as exc:
        raise HTTPException(status_code=502, detail="ML service returned invalid JSON") from exc


@app.get("/")
def home():
    return {
        "status": "TruthLens Backend API Running",
        "ml_service": ML_BASE_URL,
    }


@app.get("/health")
async def health():
    async with httpx.AsyncClient(timeout=httpx.Timeout(8.0)) as client:
        try:
            response = await client.get(f"{ML_BASE_URL}/")
            ml_ok = response.status_code == 200
        except httpx.HTTPError:
            ml_ok = False

    return {
        "backend": "ok",
        "ml_service_reachable": ml_ok,
    }


@app.post("/api/detect/{media_type}")
async def detect_media(
    media_type: str,
    file: UploadFile | None = File(default=None),
    url: str | None = Form(default=None),
):
    media_type = media_type.lower().strip()
    if media_type not in ML_ENDPOINTS:
        raise HTTPException(status_code=400, detail="media_type must be image, video, or audio")

    if file is None and not url:
        raise HTTPException(status_code=400, detail="Either file or url is required")

    if file is not None:
        content = await file.read()
        if not content:
            raise HTTPException(status_code=400, detail="Uploaded file is empty")
        filename = file.filename or f"upload.{media_type}"
        content_type = file.content_type or "application/octet-stream"
        ml_payload = await _forward_to_ml(media_type, filename, content, content_type)
        crosscheck = await _crosscheck_for_media(media_type, content, content_type)
        return _attach_crosscheck(ml_payload, crosscheck)

    filename, content, content_type = await _download_remote_file(url)
    ml_payload = await _forward_to_ml(media_type, filename, content, content_type)
    crosscheck = await _crosscheck_for_media(media_type, content, content_type)
    return _attach_crosscheck(ml_payload, crosscheck)


if __name__ == "__main__":
    import uvicorn

    print("=" * 50)
    print("  TruthLens Backend API")
    print("  Running on: http://127.0.0.1:8000")
    print("=" * 50)
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=False)
