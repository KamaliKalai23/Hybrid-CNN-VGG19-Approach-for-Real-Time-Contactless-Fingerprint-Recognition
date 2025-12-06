import os
import cv2
import numpy as np
import sqlite3
from flask import *
from flask_cors import CORS
from tensorflow.keras.applications import VGG16
from sklearn.neighbors import KNeighborsClassifier
import joblib

app = Flask(__name__)
CORS(app)

# Load VGG16 for feature extraction
vgg_model = VGG16(weights='imagenet', include_top=False, input_shape=(224, 224, 3))

# Database setup
DB_PATH = "fingerprints.db"

def preprocess_fingerprint(image):
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    _, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    if contours:
        x, y, w, h = cv2.boundingRect(max(contours, key=cv2.contourArea))
        fingerprint = image[y:y+h, x:x+w]
        return cv2.resize(fingerprint, (224, 224))
    
    return None

def extract_features(image):
    img_resized = cv2.resize(image, (224, 224))
    img_rgb = cv2.cvtColor(img_resized, cv2.COLOR_BGR2RGB)
    img_preprocessed = np.expand_dims(img_rgb, axis=0) / 255.0
    features = vgg_model.predict(img_preprocessed, verbose=0)
    return features.flatten()

# Train KNN Model
def train_knn():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT name, features FROM users")
    data = cursor.fetchall()
    conn.close()

    if len(data) < 2:
        return None  # Not enough data to train

    features, labels = zip(*[(np.frombuffer(row[1], dtype=np.float32), row[0]) for row in data])
    knn = KNeighborsClassifier(n_neighbors=min(3, len(features)))
    knn.fit(np.array(features), np.array(labels))

    joblib.dump(knn, 'knn_model.pkl')
    return knn
def train(v,name):
    cap = cv2.VideoCapture(v)
    fingerprints = []
    
    for _ in range(20):
        ret, frame = cap.read()
        if not ret:
            break
        fingerprint = preprocess_fingerprint(frame)
        if fingerprint is not None:
            fingerprints.append(fingerprint)
    
    cap.release()

    if not fingerprints:
        return jsonify({"error": "No fingerprint detected"}), 400

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    for fingerprint in fingerprints:
        features = extract_features(fingerprint)
        cursor.execute("INSERT INTO users (name, features) VALUES (?, ?)", 
                       (name, features.tobytes()))
    
    conn.commit()
    conn.close()

    train_knn()  # Retrain KNN after adding new user
    return jsonify({"error": "K"})
def test(video_path, name):
    print(f"Testing started for {video_path}")
    
    frame_skip = 5 
    early_exit_threshold = 10
    
    cap = cv2.VideoCapture(video_path)
    
    if not cap.isOpened():
        print("Error: Unable to open video file.")
        return jsonify({"error": "Invalid video file"}), 400
    
    try:
        knn = joblib.load('knn_model.pkl')
    except Exception as e:
        print("Error loading KNN model:", e)
        return jsonify({"error": "KNN model not found"}), 500

    user_counts = {}
    frame_count = 0

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            print("No more frames to read or video ended.")
            break

        if frame_count % frame_skip == 0:
            fingerprint = preprocess_fingerprint(frame)
            if fingerprint is not None:
                features = extract_features(fingerprint)
                
                try:
                    prediction = knn.predict([features])[0]
                    user_counts[prediction] = user_counts.get(prediction, 0) + 1

                    # Stop early if a user reaches the threshold
                    if user_counts[prediction] >= early_exit_threshold:
                        cap.release()
                        if(prediction==name):
                            return "User login success "+name
                        else:
                            return "User Failed"
                        print(f"User {prediction} identified early with {user_counts[prediction]} matches.")
                        return jsonify({"user": prediction}), 200
                except Exception as e:
                    print("Prediction error:", e)
                    return jsonify({"error": "Prediction failed"}), 500

        frame_count += 1

    cap.release()
    
    if not user_counts:
        print("No fingerprint detected in the video.")
        return jsonify({"error": "No fingerprint detected"}), 400

    identified_user = max(user_counts, key=user_counts.get)
    if(identified_user==name):
        return "User login success "+name
    else:
        return "User login Failed"
    


@app.route('/upload', methods=['POST'])
def dymentriyaupload():
    file = request.files['file']
    name = request.form["u"]
    data = request.form["data"]
    print(name,data)
    
    import random
    file.filename = name + str(random.randint(0, 9999)) + file.filename
    file_path = "static/" + file.filename
    file.save(file_path)

    if data == "reg":
        return train(file_path, name)
    else:
        return test(file_path,name)
    
@app.route('/register', methods=['POST'])
def register():
    name = request.form['name']
    print(name)
    video = request.files['video']
    video_path = f"uploads/{name}.mp4"
    os.makedirs("uploads", exist_ok=True)
    video.save(video_path)

    cap = cv2.VideoCapture(video_path)
    fingerprints = []
    
    for _ in range(20):
        ret, frame = cap.read()
        if not ret:
            break
        fingerprint = preprocess_fingerprint(frame)
        if fingerprint is not None:
            fingerprints.append(fingerprint)
    
    cap.release()

    if not fingerprints:
        return jsonify({"error": "No fingerprint detected"}), 400

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    for fingerprint in fingerprints:
        features = extract_features(fingerprint)
        cursor.execute("INSERT INTO users (name, features) VALUES (?, ?)", 
                       (name, features.tobytes()))
    
    conn.commit()
    conn.close()

    train_knn()  # Retrain KNN after adding new user

    return jsonify({"message": "User registered successfully"}), 200

# Authenticate User API
@app.route('/authenticate', methods=['POST'])
def authenticate():
    name = request.form['name']
    video = request.files['video']
    video_path = "uploads/temp.mp4"
    video.save(video_path)

    cap = cv2.VideoCapture(video_path)
    knn = joblib.load('knn_model.pkl')
    user_counts = {}

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        fingerprint = preprocess_fingerprint(frame)
        if fingerprint is not None:
            features = extract_features(fingerprint)
            prediction = knn.predict([features])[0]
            user_counts[prediction] = user_counts.get(prediction, 0) + 1

    cap.release()

    if not user_counts:
        return jsonify({"error": "No fingerprint detected"}), 400

    identified_user = max(user_counts, key=user_counts.get)
    print(name,identified_user)
    return jsonify({"user": identified_user}), 200
if __name__ == '__main__':
    app.run("0.0.0.0")
