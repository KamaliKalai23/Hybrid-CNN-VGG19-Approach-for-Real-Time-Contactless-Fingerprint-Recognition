import React, { useState, useRef, useEffect } from "react";
import { Text, View, TouchableOpacity, Alert, StyleSheet } from "react-native";
import { Camera } from "expo-camera/legacy";
import { Video } from "expo-av";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import { url } from "./link";

const Vid = ({ setx, username, data }) => {
  const [hasPermission, setHasPermission] = useState(null);
  const [recording, setRecording] = useState(false);
  const [videoUri, setVideoUri] = useState(null);
  const cameraRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    (async () => {
      const { status: cameraStatus } =
        await Camera.requestCameraPermissionsAsync();
      const { status: audioStatus } =
        await Camera.requestMicrophonePermissionsAsync();
      const { status: galleryStatus } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      setHasPermission(
        cameraStatus === "granted" &&
          audioStatus === "granted" &&
          galleryStatus === "granted"
      );
    })();
  }, []);

  const pickVideo = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      quality: 1,
    });
    console.log(result);
    if (!result.canceled) {
      setVideoUri(result["assets"][0]["uri"]);
      uploadVideo(result["assets"][0]["uri"]);
    }
  };

  const startRecording = async () => {
    if (cameraRef.current) {
      setRecording(true);
      try {
        const video = await cameraRef.current.recordAsync();
        setVideoUri(video.uri);
        setRecording(false);
        uploadVideo(video.uri);
      } catch (error) {
        console.error("Recording Error:", error);
        Alert.alert("Error", "Could not start recording");
      }
    }
  };

  const stopRecording = () => {
    if (cameraRef.current && recording) {
      cameraRef.current.stopRecording();
      setRecording(false);
    }
  };

  const uploadVideo = async (uri) => {
    if (!uri) {
      Alert.alert("Error", "No video selected");
      return;
    }

    const formData = new FormData();
    formData.append("file", {
      uri,
      name: "video.mp4",
      type: "video/mp4",
    });
    formData.append("u", username);
    formData.append("data", data);
    console.log(data);

    try {
      const res = await axios.post(`${url}/upload`, formData, {
        headers: {
          Accept: "application/json",
          "Content-Type": "multipart/form-data",
        },
      });
      if (data === "login") {
        Alert.alert(res.data);
      } else {
        Alert.alert("Success", "Video uploaded successfully");
      }

      setx(0);
    } catch (error) {
      console.error("Upload Error:", error);
      Alert.alert("Upload Failed", "Could not upload video");
    }
  };

  if (hasPermission === null) return <View />;
  if (hasPermission === false)
    return <Text>No access to camera or gallery</Text>;

  return (
    <View style={styles.container}>
      {videoUri ? (
        <Video
          ref={videoRef}
          source={{ uri: videoUri }}
          style={styles.video}
          useNativeControls
          resizeMode="cover"
          shouldPlay
        />
      ) : (
        <Camera
          ref={cameraRef}
          style={styles.camera}
          type={Camera.Constants.Type.back}
        />
      )}

      <View style={styles.controls}>
        <TouchableOpacity style={styles.uploadButton} onPress={pickVideo}>
          <Text style={styles.buttonText}>Upload from Gallery</Text>
        </TouchableOpacity>

        {recording ? (
          <TouchableOpacity style={styles.stopButton} onPress={stopRecording}>
            <Text style={styles.buttonText}>Stop</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.startButton} onPress={startRecording}>
            <Text style={styles.buttonText}>Record</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default Vid;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "#000",
  },
  camera: {
    flex: 1,
  },
  video: {
    flex: 1,
  },
  controls: {
    flex: 0.2,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  uploadButton: {
    backgroundColor: "green",
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 5,
  },
  startButton: {
    backgroundColor: "blue",
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 5,
  },
  stopButton: {
    backgroundColor: "red",
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
  },
});
