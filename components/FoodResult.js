import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';

const FoodResult = ({ route, navigation }) => {
  const { predictions, capturedImageUri } = route.params;

  const highestPrediction = predictions.reduce(
    (prev, current) =>
      prev.value > current.value ? prev : current,
    { name: 'Food not found', value: 0 }
  );

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
        <Text style={styles.errorText}>
          Food not found. Please try to capture it again with a different angle.
        </Text>
      )}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={handleRetake}>
          <Text style={styles.buttonText}>Retake</Text>
        </TouchableOpacity>
        {highestPrediction.value >= 0.35 && (
          <TouchableOpacity style={styles.button} onPress={handleNutrition}>
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
    padding: 20,
    backgroundColor: '#f7f7f7',
  },
  image: {
    width: 300,
    height: 300,
    borderRadius: 15,
    marginBottom: 30,
    borderColor: '#ddd',
    borderWidth: 1,
  },
  resultText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#ff6f61',
    textAlign: 'center',
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '80%',
  },
  button: {
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginHorizontal: 10,
  },
  buttonText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
  },
});

export default FoodResult;
