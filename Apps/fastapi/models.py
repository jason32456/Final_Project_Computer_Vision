import numpy as np
import insightface
import cv2
import joblib

model = insightface.app.FaceAnalysis(providers=['CUDAExecutionProvider', 'CPUExecutionProvider'])
model.prepare(ctx_id=0, det_size=(640, 640))

svm_model = joblib.load('face_recognition_model.pkl')