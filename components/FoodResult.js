import React, { useEffect, useCallback } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, BackHandler } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

const FoodResult = ({ route, navigation }) => {
  const { predictions, capturedImageUri } = route.params;

  const highestPrediction = predictions.reduce(
    (prev, current) => (prev.value > current.value ? prev : current),
    { name: 'Food not found', value: 0 }
  );

  const highestPercentage = (highestPrediction.value * 100).toFixed(2);

  const handleRetake = () => {
    navigation.navigate('FoodARPage');
  };

  const handleNutrition = () => {
    navigation.navigate('Nutrition', {
      foodName: highestPrediction.name,
    });
  };

  const handleBackAction = useCallback(() => {
    navigation.navigate('HealthDashboard'); // Navigate to FoodScreen instead of going back
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

  return (
    <View style={styles.container}>
      <Image source={{ uri: capturedImageUri }} style={styles.image} />
      {highestPrediction.value >= 0.35 ? (
        <Text style={styles.resultText}>
          {`${highestPrediction.name} (${highestPercentage}%)`}
        </Text>
      ) : (
        <Text style={styles.resultText}>
          Food not found. Please try to capture it again with a different angle.
        </Text>
      )}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={[styles.button, styles.retakeButton]} onPress={handleRetake}>
          <Text style={styles.buttonText}>Retake</Text>
        </TouchableOpacity>
        {highestPrediction.value >= 0.35 && (
          <TouchableOpacity style={[styles.button, styles.retakeButton]} onPress={handleNutrition}>
            <Text style={styles.buttonText}>Nutrition</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  image: {
    width: 300,
    height: 300,
    borderRadius: 10,
    marginBottom: 20,
  },
  resultText: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#007BFF',
    padding: 10,
    marginHorizontal: 5,
    borderRadius: 5,
  },
  retakeButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 5,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
  },
});

export default FoodResult;
