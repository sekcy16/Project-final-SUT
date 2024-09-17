import React from 'react';
import { View, Text, Image, StyleSheet, Button } from 'react-native';

const FoodResult = ({ route, navigation }) => {
  const { predictions, capturedImageUri } = route.params;

  const highestPrediction = predictions.reduce((prev, current) => 
    prev.value > current.value ? prev : current, { name: 'Food not found', value: 0 });

  const highestPercentage = (highestPrediction.value * 100).toFixed(2);

  const handleRetake = () => {
    navigation.goBack(); // Go back to the camera screen
  };

  const handleNutrition = () => {
    navigation.navigate('Nutrition', {
      foodName: highestPrediction.name,
    });
  };

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
      <Button title="Retake" onPress={handleRetake} />
      {highestPrediction.value >= 0.35 && (
        <Button title="Nutrition" onPress={handleNutrition} />
      )}
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
});

export default FoodResult;