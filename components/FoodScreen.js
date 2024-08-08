import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Button, ActivityIndicator } from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import { BlurView } from 'expo-blur';
import axios from 'axios';
import * as ImageManipulator from 'expo-image-manipulator';

const FoodCamera = () => {
  const [permission, setPermission] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const cameraRef = useRef(null);

  const API_KEY = '8c07338e937343cb819301d4ac60e191'; // Replace with your Clarifai API key
  const CLARIFAI_FOOD_MODEL = 'food-item-recognition'; // Updated Clarifai model ID for food recognition
  const CLARIFAI_API_URL = `https://api.clarifai.com/v2/models/${CLARIFAI_FOOD_MODEL}/outputs`;

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setPermission(status === 'granted');
    })();
  }, []);

  const convertImageToBase64 = async (imageUri) => {
    try {
      const response = await fetch(imageUri);
      console.log('Fetched image blob');
      const blob = await response.blob();
      console.log('Blob size:', blob.size);
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.error) {
            reject(reader.error);
          } else {
            console.log('Image converted to base64');
            resolve(reader.result.split(',')[1]);
          }
        };
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error during base64 conversion:', error);
      throw error; // Re-throw to handle in the main function
    }
  };

  const handleImageClassification = async (imageUri) => {
    try {
      setIsLoading(true);

      console.log('Starting image classification...');
      console.log('Image URI:', imageUri);

      // Resize image
      const resizedImage = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ resize: { width: 800, height: 800 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );
      console.log('Resized image URI:', resizedImage.uri);

      // Convert resized image to base64
      const base64Image = await convertImageToBase64(resizedImage.uri);

      console.log('Base64 Image:', base64Image);
      console.log('Base64 Image Length:', base64Image.length);

      console.log('API Key:', API_KEY);
      const requestPayload = {
        inputs: [
          {
            data: {
              image: {
                base64: base64Image,
              },
            },
          },
        ],
      };
      console.log('Request Payload:', JSON.stringify(requestPayload));

      const response = await axios.post(
        CLARIFAI_API_URL,
        requestPayload,
        {
          headers: {
            Authorization: `Key ${API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('Response Status:', response.status);
      console.log('Clarifai Response:', response.data);

      const outputs = response.data.outputs[0].data.concepts;
      setPredictions(outputs);
    } catch (error) {
      console.error('Error classifying image:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const captureFrame = useCallback(async () => {
    if (cameraRef.current) {
      try {
        console.log('Capturing frame...');
        const photo = await cameraRef.current.takePictureAsync({
          skipProcessing: true,
        });
        console.log('Frame captured:', photo.uri);
        handleImageClassification(photo.uri);
      } catch (error) {
        console.error('Error capturing frame:', error);
      }
    } else {
      console.log('Camera not ready for capture');
    }
  }, [handleImageClassification]);

  if (permission === null) {
    return <View />;
  }

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>
          We need your permission to show the camera
        </Text>
        <Button onPress={Camera.requestCameraPermissionsAsync} title="Grant Permission" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
      >
        {isLoading && (
          <BlurView intensity={50} style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loadingText}>Loading model...</Text>
          </BlurView>
        )}
        <View style={styles.buttonContainer}>
          <Button title="Capture Frame" onPress={captureFrame} />
        </View>
      </CameraView>
      <View style={styles.predictionContainer}>
        {predictions.length > 0 ? (
          predictions.map((prediction, index) => (
            <Text key={index} style={styles.predictionText}>
              {`${prediction.name} (${(prediction.value * 100).toFixed(2)}%)`}
            </Text>
          ))
        ) : (
          <Text style={styles.predictionText}>No objects detected</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
  },
  camera: {
    flex: 1,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 18,
    color: 'white',
  },
  buttonContainer: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: 'transparent',
    margin: 64,
  },
  predictionContainer: {
    position: 'absolute',
    bottom: 80,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 10,
    borderRadius: 5,
  },
  predictionText: {
    fontSize: 18,
    color: 'white',
  },
});

export default FoodCamera;
