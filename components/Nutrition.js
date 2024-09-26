import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, DeviceEventEmitter } from 'react-native';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';

const Nutrition = ({ route }) => {
  const { foodName } = route.params;
  const [nutritionData, setNutritionData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchNutritionData = async () => {
      try {
        const response = await axios.post(
          'https://trackapi.nutritionix.com/v2/natural/nutrients',
          {
            query: foodName,
          },
          {
            headers: {
              'x-app-id': 'faaefb5c',
              'x-app-key': '0953bb6b7e0cbc3242fb017d9c586753',
              'Content-Type': 'application/json',
            },
          }
        );

        const data = response.data.foods[0];
        setNutritionData({
          calories: data.nf_calories,
          carbs: data.nf_total_carbohydrate,
          fat: data.nf_total_fat,
          protein: data.nf_protein,
        });
      } catch (error) {
        console.error('Error fetching nutrition data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNutritionData();
  }, [foodName]);

  const handleGoToDashboard = () => {
    // Emit the reset camera event
    DeviceEventEmitter.emit('resetCamera');
    
    // Navigate to the dashboard
    navigation.navigate('AddFood');
  };

  return (
    <View style={styles.container}>
      {isLoading ? (
        <ActivityIndicator size="large" color="#4CAF50" />
      ) : nutritionData ? (
        <View style={styles.card}>
          <Text style={styles.title}>{foodName}</Text>
          <View style={styles.nutritionContainer}>
            <Text style={styles.nutritionText}>Calories</Text>
            <Text style={styles.nutritionValue}>{nutritionData.calories} kcal</Text>
          </View>
          <View style={styles.nutritionContainer}>
            <Text style={styles.nutritionText}>Carbs</Text>
            <Text style={styles.nutritionValue}>{nutritionData.carbs}g</Text>
          </View>
          <View style={styles.nutritionContainer}>
            <Text style={styles.nutritionText}>Fat</Text>
            <Text style={styles.nutritionValue}>{nutritionData.fat}g</Text>
          </View>
          <View style={styles.nutritionContainer}>
            <Text style={styles.nutritionText}>Protein</Text>
            <Text style={styles.nutritionValue}>{nutritionData.protein}g</Text>
          </View>
        </View>
      ) : (
        <Text style={styles.errorText}>Failed to retrieve nutrition information.</Text>
      )}
      <TouchableOpacity style={styles.button} onPress={handleGoToDashboard}>
        <Text style={styles.buttonText}>Go to Home Page</Text>
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
  errorText: {
    fontSize: 18,
    color: 'red',
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