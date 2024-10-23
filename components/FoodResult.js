import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, FlatList, BackHandler, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import { firebaseDB, firebaseAuth } from '../config/firebase.config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const FoodResult = ({ route, navigation }) => {
  const { predictions, capturedImageUri } = route.params;
  const [topPredictions, setTopPredictions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchNutritionData = async () => {
      setIsLoading(true);
      const sortedPredictions = predictions.sort((a, b) => b.value - a.value).slice(0, 10);
      const predictionsWithNutrition = await Promise.all(
        sortedPredictions.map(async (pred) => {
          try {
            const response = await axios.post(
              'https://trackapi.nutritionix.com/v2/natural/nutrients',
              { query: pred.name },
              {
                headers: {
                  'x-app-id': 'faaefb5c',
                  'x-app-key': '0953bb6b7e0cbc3242fb017d9c586753',
                  'Content-Type': 'application/json',
                },
              }
            );
            const nutritionData = response.data.foods[0];
            return {
              ...pred,
              calories: nutritionData.nf_calories,
              serving_qty: nutritionData.serving_qty,
              serving_unit: nutritionData.serving_unit,
              fat: nutritionData.nf_total_fat,
              carbs: nutritionData.nf_total_carbohydrate,
              protein: nutritionData.nf_protein,
            };
          } catch (error) {
            console.error('Error fetching nutrition data:', error);
            return { ...pred, calories: 'N/A' };
          }
        })
      );
      setTopPredictions(predictionsWithNutrition);
      setIsLoading(false);
    };

    fetchNutritionData();
  }, [predictions]);

  const handleRetake = () => {
    navigation.navigate('FoodARPage');
  };

  const handleSelectFood = async (food) => {
    const userId = firebaseAuth.currentUser?.uid;
    
    if (food.name !== undefined) {
      const foodData = {
        name: food.name,
        calories: parseFloat(food.calories) || 0,
        amount: `${food.serving_qty} ${food.serving_unit}`,
        fat: parseFloat(food.fat) || 0,
        carbs: parseFloat(food.carbs) || 0,
        protein: parseFloat(food.protein) || 0,
        userId: userId,
        createdAt: serverTimestamp(),
      };

      try {
        const docRef = await addDoc(collection(firebaseDB, 'foodHistory'), foodData);
        foodData.id = docRef.id;
        console.log('Food added to history successfully');
        navigation.navigate('AddFood', { newFood: foodData, alreadyInFirestore: true });
      } catch (error) {
        console.error('Error adding food to history:', error);
      }
    } else {
      console.error('Error: Food name is undefined.');
    }
  };

  const handleBackAction = useCallback(() => {
    navigation.navigate('AddFood');
    return true;
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      BackHandler.addEventListener('hardwareBackPress', handleBackAction);
      return () => {
        BackHandler.removeEventListener('hardwareBackPress', handleBackAction);
      };
    }, [handleBackAction])
  );

  const renderFoodItem = ({ item }) => (
    <TouchableOpacity
      style={styles.foodItem}
      onPress={() => handleSelectFood(item)}
    >
      <Text style={styles.foodName}>{item.name}</Text>
      <Text style={styles.foodInfo}>
        {(item.value * 100).toFixed(2)}% | {item.calories} Cal
      </Text>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007BFF" />
        <Text style={styles.loadingText}>Fetching nutrition data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image source={{ uri: capturedImageUri }} style={styles.image} />
      <Text style={styles.headerText}>Select the correct food:</Text>
      <FlatList
        data={topPredictions}
        renderItem={renderFoodItem}
        keyExtractor={(item, index) => index.toString()}
        style={styles.list}
      />
      <TouchableOpacity style={styles.retakeButton} onPress={handleRetake}>
        <Text style={styles.buttonText}>Retake</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#007BFF',
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 20,
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  list: {
    flex: 1,
  },
  foodItem: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    elevation: 2,
  },
  foodName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  foodInfo: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  retakeButton: {
    backgroundColor: '#007BFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default FoodResult;