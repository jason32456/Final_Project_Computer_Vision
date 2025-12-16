import streamlit as st
import cv2
import numpy as np
from PIL import Image
import joblib
import os
from insightface.app import FaceAnalysis
import tempfile
from pathlib import Path
from streamlit_webrtc import webrtc_streamer, WebRtcMode, RTCConfiguration
import threading
from collections import deque

# Configure Streamlit page
st.set_page_config(
    page_title="Face Recognition AI",
    page_icon="👤",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS for better styling
st.markdown("""
    <style>
    .main-header {
        font-size: 3rem;
        color: #1f77b4;
        text-align: center;
        margin-bottom: 2rem;
        font-weight: bold;
    }
    .info-box {
        padding: 1rem;
        border-radius: 0.5rem;
        background-color: #f0f2f6;
        margin: 1rem 0;
    }
    .success-box {
        padding: 1rem;
        border-radius: 0.5rem;
        background-color: #d4edda;
        border: 1px solid #c3e6cb;
        margin: 1rem 0;
    }
    .warning-box {
        padding: 1rem;
        border-radius: 0.5rem;
        background-color: #fff3cd;
        border: 1px solid #ffeaa7;
        margin: 1rem 0;
    }
    .confidence-high {
        color: #28a745;
        font-weight: bold;
    }
    .confidence-medium {
        color: #ffc107;
        font-weight: bold;
    }
    .confidence-low {
        color: #dc3545;
        font-weight: bold;
    }
    </style>
""", unsafe_allow_html=True)

# Initialize session state
if "model_loaded" not in st.session_state:
    st.session_state.model_loaded = False
if "face_analysis" not in st.session_state:
    st.session_state.face_analysis = None
if "clf" not in st.session_state:
    st.session_state.clf = None
if "results" not in st.session_state:
    st.session_state.results = None

# Header
st.markdown('<div class="main-header">👤 Face Recognition AI System</div>', unsafe_allow_html=True)
st.markdown("---")

# Sidebar for model configuration
st.sidebar.title("⚙️ Configuration")

confidence_threshold = st.sidebar.slider(
    "Confidence Threshold",
    min_value=0.3,
    max_value=1.0,
    value=0.6,
    step=0.05,
    help="Minimum confidence to identify a person. Lower = more permissive",
    key="confidence_slider"  # NEW: Add key to prevent unnecessary reruns
)

st.sidebar.markdown("---")
st.sidebar.title("📊 Model Information")

# Load models
@st.cache_resource
def load_models():
    try:
        # Load InsightFace model
        face_analysis = FaceAnalysis(
            name="buffalo_l",
            providers=['CPUExecutionProvider']
        )
        face_analysis.prepare(ctx_id=0, det_size=(640, 640))
        
        # Load SVM classifier
        model_path = Path(__file__).parent.parent / "Insightface" / "face_recognition_model.pkl"
        if not model_path.exists():
            # Try alternative path
            model_path = Path("../Insightface/face_recognition_model.pkl")
        
        if model_path.exists():
            clf = joblib.load(str(model_path))
        else:
            st.error(f"Model not found at {model_path}")
            return None, None
            
        return face_analysis, clf
    except Exception as e:
        st.error(f"Error loading models: {e}")
        return None, None

# Load models
with st.spinner("Loading AI models... This may take a moment."):
    face_analysis, clf = load_models()
    
if face_analysis and clf:
    st.session_state.model_loaded = True
    st.session_state.face_analysis = face_analysis
    st.session_state.clf = clf
    
    # Display model info in sidebar
    st.sidebar.success("✅ Models loaded successfully!")
    st.sidebar.info(f"🧠 Model: InsightFace (buffalo_l)\n\n🤖 Classifier: SVM (Linear)")
else:
    st.error("❌ Failed to load models. Please check the model files.")
    st.stop()

# Main tabs
tab1, tab2, tab3 = st.tabs(
    ["🎥 Video Recognition", "📊 Model Stats", "ℹ️ About"]
)

def process_live_webcam(face_analysis, clf, threshold, show_bbox, show_confidence):
    """Process live webcam feed - stops immediately when faces are detected and displays predictions"""
    status_placeholder = st.empty()
    frame_placeholder = st.empty()
    
    status_placeholder.info("📹 Starting camera... detecting faces...")
    
    # Open webcam
    cap = cv2.VideoCapture(0)
    
    if not cap.isOpened():
        st.error("❌ Failed to access webcam. Please check permissions or try a different camera.")
        return
    
    # Set camera properties for optimal performance
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
    cap.set(cv2.CAP_PROP_FPS, 30)
    cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
    cap.set(cv2.CAP_PROP_BRIGHTNESS, 100)  # NEW: Increase brightness
    cap.set(cv2.CAP_PROP_CONTRAST, 50)     # NEW: Increase contrast
    
    captured_frame = None
    detected_faces = []
    
    import time
    
    try:
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            
            # Detect faces
            try:
                faces = face_analysis.get(frame)
            except Exception as e:
                st.error(f"Error detecting faces: {e}")
                break
            
            # Display current frame with brightness enhancement
            frame_display = frame.copy()
            
            # NEW: Enhance brightness and contrast for display
            frame_display = cv2.convertScaleAbs(frame_display, alpha=1.2, beta=30)
            
            current_detections = []
            
            # Process each detected face
            for face in faces:
                try:
                    x1, y1, x2, y2 = face.bbox.astype(int)
                    emb = face.embedding.reshape(1, -1)
                    
                    # Predict
                    pred_label = clf.predict(emb)[0]
                    probas = clf.predict_proba(emb)[0]
                    confidence = max(probas)
                    
                    # Apply threshold
                    if confidence < threshold:
                        display_label = "Unknown"
                        box_color = (0, 0, 255)  # Red
                    else:
                        display_label = pred_label
                        box_color = (0, 255, 0)  # Green
                    
                    current_detections.append({
                        'name': display_label,
                        'confidence': confidence,
                        'bbox': (x1, y1, x2, y2)
                    })
                    
                    # Draw bounding box
                    if show_bbox:
                        cv2.rectangle(frame_display, (x1, y1), (x2, y2), box_color, 3)
                        
                        if show_confidence:
                            label_text = f"{display_label} ({confidence:.0%})"
                            cv2.putText(
                                frame_display,
                                label_text,
                                (x1, y1 - 15),
                                cv2.FONT_HERSHEY_SIMPLEX,
                                0.8,
                                box_color,
                                2
                            )
                except Exception as e:
                    continue
            
            # Convert BGR to RGB for display
            frame_rgb = cv2.cvtColor(frame_display, cv2.COLOR_BGR2RGB)
            frame_placeholder.image(frame_rgb, channels="RGB")
            
            # If faces detected, stop and process
            if current_detections:
                # NEW: Enhance the captured frame for better visibility
                captured_frame = frame.copy()
                captured_frame = cv2.convertScaleAbs(captured_frame, alpha=1.2, beta=30)
                
                detected_faces = current_detections
                status_placeholder.success("✅ Faces detected! Processing predictions...")
                time.sleep(0.3)
                break
            else:
                status_placeholder.info("🔍 Scanning for faces...")
    
    except Exception as e:
        st.error(f"Error during webcam stream: {e}")
    
    finally:
        cap.release()
    
    # Display results if faces were detected
    if captured_frame is not None and detected_faces:
        # Display predictions
        st.markdown("### 👥 Identification Results")
        
        for i, detection in enumerate(detected_faces):
            col1, col2, col3 = st.columns([1, 2, 1])
            
            with col1:
                st.write(f"**#{i+1}**")
            
            with col2:
                name = detection['name']
                if name == "Unknown":
                    st.write(f"🔍 {name}")
                else:
                    st.write(f"👤 **{name}**")
            
            with col3:
                conf = detection['confidence'] * 100
                if detection['confidence'] >= 0.8:
                    st.write(f"<span class='confidence-high'>{conf:.1f}%</span>", unsafe_allow_html=True)
                elif detection['confidence'] >= 0.6:
                    st.write(f"<span class='confidence-medium'>{conf:.1f}%</span>", unsafe_allow_html=True)
                else:
                    st.write(f"<span class='confidence-low'>{conf:.1f}%</span>", unsafe_allow_html=True)
        
        # Summary stats
        st.markdown("---")
        col1, col2, col3 = st.columns(3)
        
        with col1:
            st.metric("Total Faces", len(detected_faces))
        
        with col2:
            identified = sum(1 for d in detected_faces if d['name'] != 'Unknown')
            st.metric("Identified", identified)
        
        with col3:
            avg_conf = np.mean([d['confidence'] for d in detected_faces]) * 100
            st.metric("Avg Confidence", f"{avg_conf:.1f}%")
    
    else:
        st.warning("⚠️ No faces detected. Please try again.")

with tab1:
    st.header("Real-Time Face Recognition (Live Webcam)")
    
    st.info("📹 Click 'Start Webcam' below. Position your face in front of the camera - it will automatically capture and identify you when faces are detected!")
    
    # Initialize webcam running state
    if "webcam_running" not in st.session_state:
        st.session_state.webcam_running = False

    # Control buttons
    col_buttons = st.columns([1, 1, 2])
    
    with col_buttons[0]:
        start_button = st.button("▶️ Start Webcam", key="start_webcam_btn", use_container_width=True)
    
    with col_buttons[2]:
        st.markdown("")  # Spacing
    
    # Display options (moved OUTSIDE the webcam running condition)
    col_display = st.columns([1, 1])
    with col_display[0]:
        show_bbox_live = st.checkbox("Show bounding boxes", value=True, key="live_bbox_opt")
    with col_display[1]:
        show_confidence_live = st.checkbox("Show confidence scores", value=True, key="live_conf_opt")
    
    st.markdown("---")
    
    # Handle start button
    if start_button:
        st.session_state.webcam_running = True
    
    # Display webcam only when running
    if st.session_state.webcam_running:
        process_live_webcam(face_analysis, clf, confidence_threshold, show_bbox_live, show_confidence_live)
        st.session_state.webcam_running = False  # Reset after processing
    else:
        st.warning("👆 Click '▶️ Start Webcam' above to begin face recognition. The camera will automatically stop when it detects your face and display the results!")
    



with tab2:
    st.header("Model Statistics & Information")
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.subheader("🧠 Face Embedding Model")
        st.markdown("""
        - **Model**: InsightFace (buffalo_l)
        - **Embedding Dimension**: 512
        - **Framework**: ONNX Runtime
        - **Providers**: GPU
        - **Purpose**: Extract facial features from images
        """)
        
        st.subheader("🤖 Classification Model")
        st.markdown("""
        - **Model Type**: Support Vector Machine (SVM)
        - **Kernel**: Linear
        - **Probability**: Enabled
        - **Purpose**: Classify extracted embeddings to person identity
        """)
    
    with col2:
        st.subheader("📊 Performance Metrics")
        
        # Display model classes if available
        try:
            classes = clf.classes_
            st.write(f"**Number of Known Persons**: {len(classes)}")
            st.write(f"**Known Persons**: {', '.join(classes)}")
        except:
            st.write("Model classes information not available")
        
        st.subheader("⚙️ Configuration")
        st.markdown(f"""
        - **Current Confidence Threshold**: {confidence_threshold:.0%}
        - **Detection Image Size**: 640x640
        - **Face Detection**: RetinaFace
        """)
    
    st.markdown("---")
    st.subheader("🔧 How It Works")
    with st.expander("Click to see the workflow"):
        st.markdown("""
        1. **Face Detection**: RetinaFace detects all faces in the image
        2. **Face Alignment**: Detected faces are aligned for consistent feature extraction
        3. **Feature Extraction**: InsightFace extracts 512-dimensional embeddings
        4. **Classification**: SVM classifies embeddings to predict person identity
        5. **Confidence Scoring**: Probability scores indicate confidence level
        6. **Unknown Detection**: Faces below threshold are marked as "Unknown"
        """)

with tab3:
    st.header("About This Application")
    
    st.markdown("""
    ### 👋 Welcome to Face Recognition AI
    
    This application demonstrates modern deep learning techniques for facial recognition,
    combining state-of-the-art models for face detection and embedding extraction.
    
    #### 🎯 Features
    - **Real-Time Processing**: Process videos with face recognition
    - **Confidence Scoring**: Get detailed confidence metrics for each detection
    
    #### 🔬 Technology Stack
    - **InsightFace**: Advanced face embedding model (buffalo_l)
    - **SVM Classifier**: Linear Support Vector Machine for classification
    - **Scikit-learn**: Machine learning framework
    - **OpenCV**: Computer vision processing
    - **Streamlit**: Interactive web interface
    
    #### 📈 Model Training
    The SVM model was trained on augmented face datasets with:
    - **Data Augmentation**: Rotation, shifting, zooming, brightness adjustment
    - **Train/Validation Split**: 80/20 ratio with stratification
    - **Optimization**: Linear SVM with probability calibration
    
    #### 💡 Tips for Best Results
    1. Use clear, well-lit photos with faces visible
    2. Adjust confidence threshold based on your requirements
    3. Ensure faces are reasonably sized in the image (not too small)
    4. For better accuracy, train on more diverse face images
    

    ---
    
    *This app was created for face recognition demonstration and educational purposes.*
    """)
    
    st.markdown("---")
    
    col1, col2, col3 = st.columns(3)
    with col1:
        st.info("✅ Models loaded and ready")
    with col2:
        st.success("🚀 System operational")
    with col3:
        st.info("📍 All features available")

# Footer
st.markdown("---")
st.markdown(
    """
    <div style='text-align: center'>
    <p><small>Face Recognition AI System | Powered by Streamlit & InsightFace</small></p>
    </div>
    """,
    unsafe_allow_html=True
)
