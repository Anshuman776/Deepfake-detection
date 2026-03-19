from fastapi import FastAPI, UploadFile, File
import tensorflow as tf
import numpy as np
import cv2
import tempfile
import os

app = FastAPI()

# ---------------- MODEL LOADING ----------------

model_path = "ml/model.h5"

# Use compile=False so TensorFlow ignores training configs
model = tf.keras.models.load_model(model_path, compile=False)

print("Model loaded successfully")

# ---------------- FRAME EXTRACTION ----------------

def extract_frames(video_path, max_frames=10):
    cap = cv2.VideoCapture(video_path)
    frames = []

    while len(frames) < max_frames:
        ret, frame = cap.read()
        if not ret:
            break

        frame = cv2.resize(frame, (128,128))
        frame = frame.astype("float32") / 255.0
        frames.append(frame)

    cap.release()

    while len(frames) < max_frames:
        frames.append(np.zeros((128,128,3), dtype=np.float32))

    return np.array(frames)

# ---------------- ROUTES ----------------

@app.get("/")
def home():
    return {"status": "TruthLens API Running"}

@app.post("/predict-video/")
async def predict_video(file: UploadFile = File(...)):

    temp = tempfile.NamedTemporaryFile(delete=False)
    temp.write(await file.read())
    temp.close()

    frames = extract_frames(temp.name)

    # add batch dimension
    frames = np.expand_dims(frames, axis=0)

    prediction = model.predict(frames)

    os.remove(temp.name)

    score = float(prediction[0][0])

    if score > 0.5:
        label = "FAKE"
    else:
        label = "REAL"

    return {
        "prediction_score": score,
        "result": label
    }