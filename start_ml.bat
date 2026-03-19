@echo off
echo ==========================================
echo   TruthLens ML Service (Port 8001)
echo   This loads heavy ML models - may take time
echo ==========================================
pip install fastapi uvicorn python-multipart torch onnx onnx2pytorch opencv-python soundfile numpy 2>nul
python ml_service.py
pause
