from fastapi import FastAPI, UploadFile, File, HTTPException
import cv2
import numpy as np
from models import model, svm_model
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

CONFIDENCE_THRESHOLD = 0.8

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Hello FastAPI"}

@app.post("/predict-face")
async def predict_face(file: UploadFile = File(...)):
    image_bytes = await file.read()
    np_img = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(np_img, cv2.IMREAD_COLOR)

    if img is None:
        raise HTTPException(status_code=400, detail="Invalid image")

    # Detect faces
    faces = model.get(img)

    if len(faces) == 0:
        raise HTTPException(status_code=404, detail="No face detected")

    # Take the largest face
    face = max(faces, key=lambda f: f.bbox[2] * f.bbox[3])

    embedding = face.embedding.reshape(1, -1)  # (1, 512)

    # Predict
    prediction = svm_model.predict(embedding)[0]
    confidence = svm_model.predict_proba(embedding).max()

    if confidence < CONFIDENCE_THRESHOLD:
        prediction = "unknown"

    return {
        "prediction": prediction,
        "confidence": float(confidence)
    }
