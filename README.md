![Python](https://img.shields.io/badge/Python-3.10-blue)
![AI](https://img.shields.io/badge/AI-Deepfake%20Detection-red)
![Status](https://img.shields.io/badge/Status-Active-green)
![License](https://img.shields.io/badge/License-MIT-yellow)


# 🧠 Deepfake Detection System (TruthLens)

A full-stack multimodal deepfake detection system that analyzes images, videos, and audio using machine learning models and enhances reliability with OpenAI-based cross-check validation.

---
## Live demo 
"https://huggingface.co/spaces/Anshumanmaurya776/fakevideodetect"
---
## Preview
<img width="1920" height="1080" alt="Screenshot 2026-03-19 215754" src="https://github.com/user-attachments/assets/ddd5bb2d-3213-4df8-bec5-5a2c67ee5f04" />

<img width="1920" height="1080" alt="Screenshot 2026-03-19 215813" src="https://github.com/user-attachments/assets/8b3394f4-bae9-43dd-805c-c9844a41f50d" />

---
## 🚀 Features
- 🖼️ Image Deepfake Detection
- 🎥 Video Deepfake Analysis
- 🎙️ Audio Deepfake Detection
- 🧠 OpenAI Cross-Check Validation (reduces false positives)
- ⚙️ Multi-Service Architecture (Frontend + Backend + ML)
- ⚡ Fast UI with React (Vite)
- 🔍 API-based backend using FastAPI

---
## 🧠 Architecture
```
Frontend (React - Port 5173)
        ↓
Backend (FastAPI - Port 8000)
        ↓
ML Services (Port 8001)
        ↓
OpenAI Cross-check Validation
```
----

## 📂 Project Structure
```
Deepfake-detection/
├── frontend_truelens/      # React frontend
├── backend_truth_lens/     # FastAPI backend
├── ml_services.py          # ML inference service
├── start_frontend.bat
├── start_backend.bat
├── start_ml.bat
├── requirements.txt
└── README.md
```
---
## ⚙️ Setup Instructions
1️⃣ Clone Repository
```
git clone https://github.com/Anshuman776/Deepfake-detection.git
cd Deepfake-detection
```
2️⃣ Setup Python Environment
```
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```
3️⃣ Setup Frontend
```
cd frontend_truelens
npm install
```
---
## 🚀 Run the System
1️⃣ Start ML Service (Port 8001)
```
start_ml.bat
```
2️⃣ Start Backend (Port 8000)
```
start_backend.bat
```
3️⃣ Start Frontend (Port 5173)
```
start_frontend.bat
```
## 🔑 OpenAI Setup
Create .env inside backend_truth_lens:
```
OPENAI_API_KEY=your_api_key_here
```

The application runs on multiple local services:
```
  - Frontend (React): http://localhost:5173  
  - Backend API (FastAPI): http://127.0.0.1:8000  
  - Backend Docs (Swagger): http://127.0.0.1:8000/docs  
  - ML Service: http://127.0.0.1:8001
```
---
## 🧠 Why This Project is Different

Unlike traditional systems, this project combines:
  - ML-based detection
  - API-driven architecture
  - LLM-based validation (OpenAI)
👉 Result: More reliable deepfake detection system
---
## 📌 Use Cases
  - Fake news detection
  - Media verification
  - AI-generated content filtering
  - Research & experimentation
---
## 👨‍💻 Author

Anshuman Maurya
AI/ML Developer

---
## ⭐ Contribution

Feel free to fork, contribute, and improve the system!

---
## 📜 License

