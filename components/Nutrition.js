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
            query: foodName, // Food name goes in the request body
          },
          {
            headers: {
              'x-app-id': 'faaefb5c',
              'x-app-key': '0953bb6b7e0cbc3242fb017d9c586753',
              'Content-Type': 'application/json',
            },
          }
        );

        const data = response.data.foods[0]; // Assuming you only need the first result
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
        <View>
          <Text style={styles.title}>{foodName}</Text>
          <Text style={styles.nutritionText}>Calories: {nutritionData.calories}</Text>
          <Text style={styles.nutritionText}>Carbs: {nutritionData.carbs}g</Text>
          <Text style={styles.nutritionText}>Fat: {nutritionData.fat}g</Text>
          <Text style={styles.nutritionText}>Protein: {nutritionData.protein}g</Text>
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
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  nutritionText: {
    fontSize: 18,
    marginBottom: 10,
  },
  errorText: {
    fontSize: 18,
    color: 'red',
  },
});

export default Nutrition;
