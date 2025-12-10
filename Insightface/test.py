import cv2
from insightface.app import FaceAnalysis
import joblib

# Load InsightFace model
model = FaceAnalysis(name="buffalo_l", providers=['CPUExecutionProvider'])
model.prepare(ctx_id=0, det_size=(640, 640))

# Load SVM classifier
clf = joblib.load("face_recognition_model.pkl")

cap = cv2.VideoCapture(0)

while True:
    ret, frame = cap.read()
    if not ret:
        break

    faces = model.get(frame)
    for face in faces:
        x1, y1, x2, y2 = face.bbox.astype(int)
        emb = face.embedding.reshape(1, -1)

        pred_label = clf.predict(emb)[0]
        probas = clf.predict_proba(emb)[0]
        confidence = max(probas)

        if confidence < 0.6:
            pred_label = "Unknown"

        cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
        cv2.putText(frame, f"{pred_label} ({confidence:.2f})", 
                    (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 
                    0.8, (0, 255, 0), 2)

    cv2.imshow("Face Recognition (SVM)", frame)

    if cv2.waitKey(1) & 0xFF == ord("q"):
        break

cap.release()
cv2.destroyAllWindows()
