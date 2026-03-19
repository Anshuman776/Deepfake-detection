@echo off
echo ==========================================
echo   TruthLens Frontend (Port 5173)
echo ==========================================
cd frontend_truelens
call npm install 2>nul
call npm run dev
pause
