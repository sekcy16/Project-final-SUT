import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, DeviceEventEmitter, BackHandler } from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import { BlurView } from 'expo-blur';
import axios from 'axios';
import * as ImageManipulator from 'expo-image-manipulator';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';

const FoodCamera = () => {
  const [permission, setPermission] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const cameraRef = useRef(null);
  const navigation = useNavigation();

  const API_KEY = '8c07338e937343cb819301d4ac60e191'; // Replace with your Clarifai API key
  const CLARIFAI_FOOD_MODEL = 'food-item-recognition'; // Updated Clarifai model ID for food recognition
  const CLARIFAI_API_URL = `https://api.clarifai.com/v2/models/${CLARIFAI_FOOD_MODEL}/outputs`;

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setPermission(status === 'granted');
    })();

    // Listen for the reset camera event
    const subscription = DeviceEventEmitter.addListener('resetCamera', () => {
      setIsCameraReady(false);
      // Add any other reset logic here
    });

    return () => {
      // Clean up the event listener
      subscription.remove();
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      setIsCameraReady(false);
      // Reset any other necessary state here

      return () => {
        // Clean up when the screen is unfocused
        setIsCameraReady(false);
      };
    }, [])
  );

  const onCameraReady = useCallback(() => {
    setIsCameraReady(true);
  }, []);

  const convertImageToBase64 = async (imageUri) => {
    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.error) {
            reject(reader.error);
          } else {
            resolve(reader.result.split(',')[1]);
          }
        };
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error during base64 conversion:', error);
      throw error;
    }
  };

  const handleImageClassification = async (imageUri) => {
    try {
      setIsLoading(true);

      const resizedImage = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ resize: { width: 800, height: 800 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );

      const base64Image = await convertImageToBase64(resizedImage.uri);

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

      if (response.status === 200) {
        const outputs = response.data.outputs[0].data.concepts;
        navigation.navigate('FoodResult', {
          predictions: outputs,
          capturedImageUri: resizedImage.uri,
        });
      } else {
        console.error('Error: Clarifai response status not OK', response.status);
      }
    } catch (error) {
      console.error('Error classifying image:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const captureFrame = useCallback(async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          skipProcessing: true,
        });
        handleImageClassification(photo.uri);
      } catch (error) {
        console.error('Error capturing frame:', error);
      }
    }
  }, []);

  const handleBackAction = useCallback(() => {
    navigation.navigate('AddFood'); // Navigate to HealthDashboard instead of going back
    return true; // Return true to indicate we've handled the back action
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      BackHandler.addEventListener('hardwareBackPress', handleBackAction);
      return () => {
        BackHandler.removeEventListener('hardwareBackPress', handleBackAction);
      };
    }, [handleBackAction])
  );

  if (permission === null) {
    return <View />;
  }

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>
          We need your permission to show the camera
        </Text>
        <TouchableOpacity onPress={Camera.requestCameraPermissionsAsync} style={styles.permissionButton}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView 
        ref={cameraRef} 
        style={styles.camera}
        onCameraReady={onCameraReady}
      >
        {isLoading && (
          <BlurView intensity={50} style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loadingText}>Loading...</Text>
          </BlurView>
        )}
        {isCameraReady && (
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.captureButton} onPress={captureFrame}>
              <MaterialIcons name="camera-alt" size={30} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      </CameraView>
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
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 36,
  },
  captureButton: {
    backgroundColor: '#ff4757',
    borderRadius: 50,
    height: 70,
    width: 70,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.29,
    shadowRadius: 4.65,
    elevation: 7,
    position: 'absolute',
    bottom: 20, // Adjust this value to move the button up or down
    left: '50%',
    transform: [{ translateX: -35 }], // Center the button horizontally
  },
  permissionButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 5,
    padding: 10,
    marginTop: 10,
  },
  permissionButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

export default FoodCamera;