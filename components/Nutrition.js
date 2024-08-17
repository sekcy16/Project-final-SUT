import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import axios from 'axios';

const Nutrition = ({ route }) => {
  const { foodName } = route.params;
  const [nutritionData, setNutritionData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

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

  return (
    <View style={styles.container}>
      {isLoading ? (
        <ActivityIndicator size="large" color="#4CAF50" />
      ) : nutritionData ? (
        <View style={styles.nutritionContainer}>
          <Text style={styles.title}>{foodName}</Text>
          <Text style={styles.nutritionText}>Calories: <Text style={styles.nutritionValue}>{nutritionData.calories}</Text></Text>
          <Text style={styles.nutritionText}>Carbs: <Text style={styles.nutritionValue}>{nutritionData.carbs}g</Text></Text>
          <Text style={styles.nutritionText}>Fat: <Text style={styles.nutritionValue}>{nutritionData.fat}g</Text></Text>
          <Text style={styles.nutritionText}>Protein: <Text style={styles.nutritionValue}>{nutritionData.protein}g</Text></Text>
        </View>
      ) : (
        <Text style={styles.errorText}>Failed to retrieve nutrition information.</Text>
      )}
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
  nutritionContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  nutritionText: {
    fontSize: 20,
    color: '#555',
    marginBottom: 10,
  },
  nutritionValue: {
    fontWeight: 'bold',
    color: '#333',
  },
  errorText: {
    fontSize: 18,
    color: '#ff6f61',
    textAlign: 'center',
  },
});

export default Nutrition;
