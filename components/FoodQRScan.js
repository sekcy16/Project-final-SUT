import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';

const FoodQRScan = () => {
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(false);
  const navigation = useNavigation();

  const OPENFOODFACTS_API_URL = 'https://world.openfoodfacts.org/api/v0/product/';

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  const handleBarCodeScanned = async ({ data }) => {
    if (!isScanning) {
      setIsScanning(true);

      try {
        const response = await axios.get(`${OPENFOODFACTS_API_URL}${data}.json`);

        if (response.data && response.data.status === 1) {
          navigation.navigate('FoodQRResult', { product: response.data.product });
        } else {
          Alert.alert('Error', 'Product not found. Please try scanning again.');
        }
      } catch (error) {
        console.error('Error scanning food QR code:', error);
        Alert.alert('Error', 'Something went wrong. Please try again.');
      } finally {
        setIsScanning(false);
      }
    }
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to access the camera</Text>
        <TouchableOpacity 
          style={styles.permissionButton} 
          onPress={requestPermission}
        >
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        onBarcodeScanned={handleBarCodeScanned}
        barcodeScannerSettings={{
          barCodeTypes: ['qr'],
        }}
      />
      {isScanning && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Scanning...</Text>
        </View>
      )}
      <View style={styles.instructionContainer}>
        <Text style={styles.instructionText}>Point your camera at a food product's QR code</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    textAlign: 'center',
    marginBottom: 20,
  },
  permissionButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 5,
  },
  permissionButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 18,
  },
  instructionContainer: {
    position: 'absolute',
    top: 40,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255,255,255,0.7)',
    padding: 10,
    borderRadius: 5,
  },
  instructionText: {
    textAlign: 'center',
    fontSize: 16,
  },
});

export default FoodQRScan;