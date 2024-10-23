import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, DeviceEventEmitter } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const Nutrition = ({ route }) => {
  const { newFood } = route.params;
  const navigation = useNavigation();

  const handleGoToDashboard = () => {
    // Emit the reset camera event
    DeviceEventEmitter.emit('resetCamera');
    
    // Navigate to the AddFood screen with the new food data
    navigation.navigate('AddFood', { newFood });
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>{newFood.name}</Text>
        <View style={styles.nutritionContainer}>
          <Text style={styles.nutritionText}>Calories</Text>
          <Text style={styles.nutritionValue}>{newFood.calories} kcal</Text>
        </View>
        <View style={styles.nutritionContainer}>
          <Text style={styles.nutritionText}>Amount</Text>
          <Text style={styles.nutritionValue}>{newFood.amount}</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.button} onPress={handleGoToDashboard}>
        <Text style={styles.buttonText}>Add to Meal</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f7f7f7',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    marginBottom: 20,
    width: '90%',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  nutritionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  nutritionText: {
    fontSize: 18,
    color: '#555',
  },
  nutritionValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  button: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 2,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default Nutrition;