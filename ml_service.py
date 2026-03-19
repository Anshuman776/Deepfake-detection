"""
TruthLens ML Service — Heavy model inference server.
Runs separately on port 8001.
Loads PyTorch, ONNX, and other ML models for deepfake detection.

Usage: python ml_service.py
"""
import os
import shutil
import tempfile
import numpy as np
import cv2
import soundfile as sf
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="TruthLens ML Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import inference (this loads heavy models — takes time)
print("Loading ML models... (this may take a minute)")
import inference
print("ML models loaded successfully!")

def save_upload_file_tmp(upload_file: UploadFile) -> str:
    try:
        os.makedirs("tmp_ml", exist_ok=True)
        temp_file_path = f"tmp_ml/uploaded_{upload_file.filename}"
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(upload_file.file, buffer)
        return temp_file_path
    finally:
        upload_file.file.close()

@app.get("/")
def home():
    return {"status": "TruthLens ML Service Running", "models_loaded": True}

@app.post("/api/detect/image")
async def detect_image(file: UploadFile = File(...)):
    temp_path = save_upload_file_tmp(file)
    try:
        result = inference.deepfakes_image_predict(temp_path)
        return {"result": result}
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Image processing failed: {str(e)}")
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

@app.post("/api/detect/video")
async def detect_video(file: UploadFile = File(...)):
    temp_path = save_upload_file_tmp(file)
    try:
        result = inference.deepfakes_video_predict(temp_path)
        return {"result": result}
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Video processing failed: {str(e)}")
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

@app.post("/api/detect/audio")
async def detect_audio(file: UploadFile = File(...)):
    temp_path = save_upload_file_tmp(file)
    try:
        result = inference.deepfakes_spec_predict(temp_path)
        return {"result": result}
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Audio processing failed: {str(e)}")
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)


@app.get("/api/probe")
def probe():
    """
    Synthetic sanity-check: generates a grey image and a 1-second sine-wave
    audio clip in memory, runs them through the loaded models, and verifies
    the outputs are structurally valid (label present, confidence in 0-100).
    Use this to confirm models loaded correctly without needing real dataset files.
    """
    os.makedirs("tmp_ml", exist_ok=True)
    results = {}

    # ── Image probe: neutral grey 256×256 JPEG ──────────────────────────────
    try:
        grey = np.full((256, 256, 3), 127, dtype=np.uint8)
        _, buf = cv2.imencode(".jpg", grey)
        with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False, dir="tmp_ml") as tmp:
            tmp.write(buf.tobytes())
            tmp_img = tmp.name
        res = inference.deepfakes_image_predict(tmp_img)
        os.remove(tmp_img)
        label = res.get("label", "")
        conf  = float(res.get("confidence", -1))
        results["image"] = {
            "status": "ok",
            "label": label,
            "confidence": conf,
            "confidence_valid": isinstance(conf, (int, float)) and 0 <= conf <= 100,
            "label_valid": label in ("REAL", "FAKE"),
        }
    except Exception as exc:
        results["image"] = {"status": "error", "detail": str(exc)}

    # ── Audio probe: 1-second 440 Hz sine wave at 16 kHz ────────────────────
    try:
        sr = 16000
        t  = np.linspace(0, 1.0, sr, dtype=np.float32)
        sine = (np.sin(2 * np.pi * 440 * t) * 0.5).astype(np.float32)
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False, dir="tmp_ml") as tmp:
            tmp_wav = tmp.name
        sf.write(tmp_wav, sine, sr)
        res = inference.deepfakes_spec_predict(tmp_wav)
        os.remove(tmp_wav)
        label = res.get("label", "")
        conf  = float(res.get("confidence", -1))
        results["audio"] = {
            "status": "ok",
            "label": label,
            "confidence": conf,
            "confidence_valid": isinstance(conf, (int, float)) and 0 <= conf <= 100,
            "label_valid": label in ("REAL", "FAKE"),
        }
    except Exception as exc:
        results["audio"] = {"status": "error", "detail": str(exc)}

    probe_ok = all(v.get("status") == "ok" for v in results.values())
    return {"probe_ok": probe_ok, "results": results}


if __name__ == '__main__':
    import uvicorn
    print("=" * 50)
    print("  TruthLens ML Service")
    print("  Running on: http://127.0.0.1:8001")
    print("=" * 50)
    uvicorn.run("ml_service:app", host="0.0.0.0", port=8001, reload=False)
