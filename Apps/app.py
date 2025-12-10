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
    help="Minimum confidence to identify a person. Lower = more permissive"
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
tab1, tab2, tab3, tab4 = st.tabs(
    ["📷 Image Recognition", "🎥 Video Recognition", "📊 Model Stats", "ℹ️ About"]
)

with tab1:
    st.header("Image Recognition")
    
    col1, col2 = st.columns([1, 1], gap="large")
    
    with col1:
        st.subheader("Upload an Image")
        uploaded_file = st.file_uploader(
            "Choose an image file",
            type=["jpg", "jpeg", "png", "bmp"],
            help="Upload a photo containing faces to recognize"
        )
        
        if uploaded_file is not None:
            # Display original image
            image = Image.open(uploaded_file)
            st.image(image, caption="Uploaded Image", use_column_width=True)
            
            # Process image
            if st.button("🔍 Recognize Faces", key="recognize_img", use_container_width=True):
                with st.spinner("Processing image..."):
                    # Convert PIL to OpenCV format
                    img_array = np.array(image)
                    if len(img_array.shape) == 3 and img_array.shape[2] == 3:
                        img_cv = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
                    else:
                        img_cv = img_array
                    
                    # Detect faces
                    faces = face_analysis.get(img_cv)
                    
                    if len(faces) == 0:
                        st.warning("⚠️ No faces detected in the image.")
                    else:
                        # Draw rectangles and predictions
                        img_with_boxes = img_cv.copy()
                        results_list = []
                        
                        for i, face in enumerate(faces):
                            x1, y1, x2, y2 = face.bbox.astype(int)
                            emb = face.embedding.reshape(1, -1)
                            
                            # Predict
                            pred_label = clf.predict(emb)[0]
                            probas = clf.predict_proba(emb)[0]
                            confidence = max(probas)
                            
                            # Apply confidence threshold
                            if confidence < confidence_threshold:
                                display_label = "Unknown"
                                display_confidence = confidence
                            else:
                                display_label = pred_label
                                display_confidence = confidence
                            
                            results_list.append({
                                'id': i + 1,
                                'label': display_label,
                                'confidence': display_confidence,
                                'bbox': (x1, y1, x2, y2)
                            })
                            
                            # Draw rectangle
                            color = (0, 255, 0) if display_label != "Unknown" else (0, 0, 255)
                            cv2.rectangle(img_with_boxes, (x1, y1), (x2, y2), color, 3)
                            
                            # Put text
                            label_text = f"{display_label} ({display_confidence:.2%})"
                            cv2.putText(
                                img_with_boxes,
                                label_text,
                                (x1, y1 - 10),
                                cv2.FONT_HERSHEY_SIMPLEX,
                                0.8,
                                color,
                                2
                            )
                        
                        # Display result
                        img_result_rgb = cv2.cvtColor(img_with_boxes, cv2.COLOR_BGR2RGB)
                        st.session_state.results = results_list
    
    with col2:
        st.subheader("Recognition Results")
        
        if st.session_state.results is not None:
            st.image(img_result_rgb, caption="Detected & Recognized Faces", use_column_width=True)
            
            st.markdown("### 📋 Detection Details")
            
            for result in st.session_state.results:
                with st.container():
                    col_id, col_label, col_conf = st.columns([1, 2, 2])
                    
                    with col_id:
                        st.write(f"**Face #{result['id']}**")
                    
                    with col_label:
                        if result['label'] == "Unknown":
                            st.write(f"🔍 {result['label']}")
                        else:
                            st.write(f"👤 {result['label']}")
                    
                    with col_conf:
                        conf_pct = result['confidence'] * 100
                        if result['confidence'] >= 0.8:
                            st.write(f"<span class='confidence-high'>{conf_pct:.1f}%</span>", unsafe_allow_html=True)
                        elif result['confidence'] >= 0.6:
                            st.write(f"<span class='confidence-medium'>{conf_pct:.1f}%</span>", unsafe_allow_html=True)
                        else:
                            st.write(f"<span class='confidence-low'>{conf_pct:.1f}%</span>", unsafe_allow_html=True)

def process_video_file(video_path, face_analysis, clf, threshold, show_bbox, show_confidence):
    """Process video file and display results"""
    cap = cv2.VideoCapture(video_path)
    
    if not cap.isOpened():
        st.error("Failed to open video file")
        return
    
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = cap.get(cv2.CAP_PROP_FPS)
    
    frame_placeholder = st.empty()
    stats_placeholder = st.empty()
    progress_bar = st.progress(0)
    
    frame_count = 0
    face_detections = []
    
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        
        frame_count += 1
        
        # Resize for faster processing
        frame_resized = cv2.resize(frame, (640, 480))
        
        # Detect faces
        faces = face_analysis.get(frame_resized)
        
        frame_with_boxes = frame_resized.copy()
        faces_in_frame = []
        
        for face in faces:
            x1, y1, x2, y2 = face.bbox.astype(int)
            emb = face.embedding.reshape(1, -1)
            
            # Predict
            pred_label = clf.predict(emb)[0]
            probas = clf.predict_proba(emb)[0]
            confidence = max(probas)
            
            # Apply threshold
            if confidence < threshold:
                display_label = "Unknown"
            else:
                display_label = pred_label
            
            faces_in_frame.append({
                'name': display_label,
                'confidence': confidence
            })
            
            if show_bbox:
                color = (0, 255, 0) if display_label != "Unknown" else (0, 0, 255)
                cv2.rectangle(frame_with_boxes, (x1, y1), (x2, y2), color, 2)
                
                if show_confidence:
                    label_text = f"{display_label} ({confidence:.2%})"
                    cv2.putText(
                        frame_with_boxes,
                        label_text,
                        (x1, y1 - 10),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.6,
                        color,
                        2
                    )
        
        # Display frame
        frame_rgb = cv2.cvtColor(frame_with_boxes, cv2.COLOR_BGR2RGB)
        frame_placeholder.image(frame_rgb, use_column_width=True)
        
        # Update stats
        with stats_placeholder.container():
            col1, col2, col3 = st.columns(3)
            with col1:
                st.metric("Frame", f"{frame_count}/{total_frames}")
            with col2:
                st.metric("Faces Detected", len(faces_in_frame))
            with col3:
                st.metric("Progress", f"{int((frame_count/total_frames)*100)}%")
        
        progress_bar.progress(min(frame_count / total_frames, 1.0))
        
        face_detections.extend(faces_in_frame)
    
    cap.release()
    
    st.success("✅ Video processing complete!")
    
    # Summary
    if face_detections:
        col1, col2 = st.columns(2)
        with col1:
            st.subheader("📊 Summary Statistics")
            st.write(f"**Total Frames**: {frame_count}")
            st.write(f"**Total Faces Detected**: {len(face_detections)}")
            st.write(f"**Average per Frame**: {len(face_detections)/max(frame_count, 1):.2f}")
        
        with col2:
            st.subheader("👥 Person Detections")
            from collections import Counter
            names = [f['name'] for f in face_detections]
            person_counts = Counter(names)
            for person, count in person_counts.most_common():
                st.write(f"- **{person}**: {count} times")

def process_live_webcam(face_analysis, clf, threshold, show_bbox, show_confidence):
    """Process live webcam feed and display results"""
    st.info("📹 Starting webcam... Make sure to allow camera access when prompted!")
    
    col1, col2 = st.columns([2, 1])
    
    with col1:
        # Create a placeholder for the frame
        frame_placeholder = st.empty()
    
    with col2:
        st.write("### Live Stats")
        stats_placeholder = st.empty()
        fps_placeholder = st.empty()
        detection_placeholder = st.empty()
    
    # Open webcam
    cap = cv2.VideoCapture(0)
    
    if not cap.isOpened():
        st.error("❌ Failed to access webcam. Please check permissions or try a different camera.")
        return
    
    # Set camera properties for better performance
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
    cap.set(cv2.CAP_PROP_FPS, 30)
    
    # Button to stop the stream
    stop_button = st.button("🛑 Stop Webcam", key="stop_webcam", use_container_width=True)
    
    frame_count = 0
    total_detections = []
    
    import time
    prev_time = time.time()
    current_fps = 0
    
    try:
        while cap.isOpened() and not stop_button:
            ret, frame = cap.read()
            if not ret:
                st.error("Failed to read from webcam")
                break
            
            frame_count += 1
            
            # Resize for faster processing
            frame_resized = cv2.resize(frame, (640, 480))
            
            # Detect faces
            try:
                faces = face_analysis.get(frame_resized)
            except Exception as e:
                st.error(f"Error detecting faces: {e}")
                break
            
            frame_with_boxes = frame_resized.copy()
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
                        'confidence': confidence
                    })
                    
                    # Draw bounding box
                    if show_bbox:
                        cv2.rectangle(frame_with_boxes, (x1, y1), (x2, y2), box_color, 2)
                        
                        if show_confidence:
                            label_text = f"{display_label} ({confidence:.2%})"
                            cv2.putText(
                                frame_with_boxes,
                                label_text,
                                (x1, y1 - 10),
                                cv2.FONT_HERSHEY_SIMPLEX,
                                0.7,
                                box_color,
                                2
                            )
                except Exception as e:
                    continue
            
            # Calculate FPS
            current_time = time.time()
            if current_time - prev_time > 0.1:  # Update FPS every 0.1 seconds
                current_fps = 1 / (current_time - prev_time)
                prev_time = current_time
            
            # Convert BGR to RGB for display
            frame_rgb = cv2.cvtColor(frame_with_boxes, cv2.COLOR_BGR2RGB)
            
            # Display the frame
            frame_placeholder.image(frame_rgb, use_column_width=True)
            
            # Update statistics
            with stats_placeholder.container():
                st.metric("Faces Detected", len(current_detections))
            
            with fps_placeholder.container():
                st.metric("FPS", f"{current_fps:.1f}")
            
            if current_detections:
                with detection_placeholder.container():
                    st.write("**Current Persons:**")
                    for det in current_detections:
                        if det['name'] != 'Unknown':
                            st.write(f"✅ {det['name']} ({det['confidence']:.1%})")
                        else:
                            st.write(f"❓ Unknown ({det['confidence']:.1%})")
            
            total_detections.extend(current_detections)
    
    except Exception as e:
        st.error(f"Error during webcam stream: {e}")
    
    finally:
        cap.release()
        st.success("✅ Webcam stopped!")
        
        # Show summary
        if total_detections:
            st.markdown("---")
            st.subheader("📊 Session Summary")
            
            col1, col2 = st.columns(2)
            with col1:
                st.write(f"**Frames Processed**: {frame_count}")
                st.write(f"**Total Detections**: {len(total_detections)}")
                st.write(f"**Avg per Frame**: {len(total_detections)/max(frame_count, 1):.2f}")
            
            with col2:
                from collections import Counter
                names = [d['name'] for d in total_detections]
                person_counts = Counter(names)
                st.write("**Person Appearances:**")
                for person, count in person_counts.most_common():
                    st.write(f"- {person}: {count} times")

with tab2:
    st.header("Real-Time Video Recognition")
    
    # Choose between webcam and video file
    video_mode = st.radio(
        "Choose input source:",
        ["📷 Live Webcam", "📹 Upload Video File"],
        horizontal=True
    )
    
    if video_mode == "📷 Live Webcam":
        st.info("📹 Real-time face recognition from your webcam!")
        
        col1, col2 = st.columns([1, 1])
        
        with col1:
            st.write("### Display Options")
            show_bbox_live = st.checkbox("Show bounding boxes", value=True, key="live_bbox")
            show_confidence_live = st.checkbox("Show confidence scores", value=True, key="live_conf")
        
        with col2:
            st.write("### Camera Settings")
            st.caption("Make sure to allow camera access when prompted")
            if st.button("🎥 Start Webcam", key="start_webcam", use_container_width=True):
                process_live_webcam(face_analysis, clf, confidence_threshold, show_bbox_live, show_confidence_live)
    
    else:  # Video file upload
        st.info("📹 Process a video file with face recognition.")
        
        col1, col2 = st.columns([1, 1])
        
        with col1:
            st.write("### Upload Video")
            uploaded_video = st.file_uploader("Choose a video file", type=["mp4", "avi", "mov", "mkv", "flv"])
        
        with col2:
            st.write("### Display Options")
            show_bbox = st.checkbox("Show bounding boxes", value=True, key="video_bbox")
            show_confidence = st.checkbox("Show confidence scores", value=True, key="video_conf")
        
        if uploaded_video is not None:
            with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as tmp_file:
                tmp_file.write(uploaded_video.read())
                tmp_path = tmp_file.name
            
            st.info("⏳ Processing video... This may take a moment depending on video length and frame rate.")
            
            if st.button("🎬 Process Video", use_container_width=True):
                process_video_file(tmp_path, face_analysis, clf, confidence_threshold, show_bbox, show_confidence)
                
                # Clean up temp file
                try:
                    os.remove(tmp_path)
                except:
                    pass
        else:
            st.warning("Please upload a video file to get started.")


with tab3:
    st.header("Model Statistics & Information")
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.subheader("🧠 Face Embedding Model")
        st.markdown("""
        - **Model**: InsightFace (buffalo_l)
        - **Embedding Dimension**: 512
        - **Framework**: ONNX Runtime
        - **Providers**: CPU
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

with tab4:
    st.header("About This Application")
    
    st.markdown("""
    ### 👋 Welcome to Face Recognition AI
    
    This application demonstrates modern deep learning techniques for facial recognition,
    combining state-of-the-art models for face detection and embedding extraction.
    
    #### 🎯 Features
    - **Image Recognition**: Upload photos to identify faces
    - **Real-Time Processing**: Process videos with face recognition
    - **Confidence Scoring**: Get detailed confidence metrics for each detection
    - **Unknown Face Handling**: Smart detection of unfamiliar faces
    
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
    
    #### 📝 Version Info
    - **App Version**: 1.0.0
    - **Last Updated**: December 2024
    
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
