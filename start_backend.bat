@echo off
echo ==========================================
echo   TruthLens Backend API (Port 8000)
echo ==========================================
pip install fastapi uvicorn httpx python-multipart opencv-python numpy 2>nul
python app.py
pause
