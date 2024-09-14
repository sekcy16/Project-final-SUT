import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { getFirestore, collection, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { app } from '../config/firebase.config';

const MealEntry = () => {
  const [foodList, setFoodList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const route = useRoute();
  const navigation = useNavigation();
  const { mealType, date } = route.params;
  const db = getFirestore(app);
  const auth = getAuth(app);

  useEffect(() => {
    const fetchFoodList = async () => {
      try {
        const foodCollection = await getDocs(collection(db, 'foodlist'));
        const foodData = foodCollection.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setFoodList(foodData);
      } catch (error) {
        console.error('Error fetching food list:', error);
        Alert.alert('Error', 'Failed to fetch food list. Please try again.');
      }
    };
    fetchFoodList();
  }, []);

  const addToDiary = async (food) => {
    try {
      const userId = auth.currentUser.uid;
      const diaryRef = doc(db, 'diaries', userId, 'entries', date.split('T')[0]);
      
      const docSnap = await getDoc(diaryRef);
      let currentMeals = docSnap.exists() ? (docSnap.data().meals || {}) : {};
      
      if (!currentMeals[mealType]) {
        currentMeals[mealType] = { items: [], calories: 0, carbs: 0 };
      }
      
      const newItem = {
        name: food.name,
        amount: food.amount,
        calories: food.calories || 0,
        carbs: food.carbs || 0
      };

      currentMeals[mealType].items.push(newItem);
      currentMeals[mealType].calories += newItem.calories;
      currentMeals[mealType].carbs += newItem.carbs;

      await setDoc(diaryRef, { 
        meals: currentMeals, 
        date: date,
        exercises: docSnap.exists() ? (docSnap.data().exercises || []) : []
      }, { merge: true });
      
      Alert.alert('Success', `Added ${food.name} to ${mealType}`);
      navigation.goBack();
    } catch (error) {
      console.error('Error adding food to diary:', error);
      Alert.alert('Error', 'Failed to add food to diary. Please try again.');
    }
  };

  const filteredFoodList = foodList.filter(food => 
    food.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{mealType}</Text>
      </View>

      <View style={styles.searchBar}>
        <Icon name="search" size={20} color="#999" />
        <TextInput 
          style={styles.searchInput}
          placeholder="ค้นหา"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <Icon name="mic" size={20} color="#999" />
      </View>

      <ScrollView style={styles.foodList}>
        {filteredFoodList.map((food) => (
          <FoodItem 
            key={food.id}
            food={food}
            onAdd={() => addToDiary(food)}
            onPress={() => navigation.navigate('FoodDetail', { foodId: food.id })}
          />
        ))}
      </ScrollView>
    </View>
  );
};

const FoodItem = ({ food, onAdd, onPress }) => {
  return (
    <View style={styles.foodItemContainer}>
      <TouchableOpacity style={styles.foodItem} onPress={onPress}>
        <View>
          <Text style={styles.foodName}>{food.name}</Text>
          <Text style={styles.foodAmount}>{food.amount}</Text>
        </View>
        <View style={styles.caloriesContainer}>
          <Text style={styles.calories}>{food.calories} cal</Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity style={styles.addButton} onPress={onAdd}>
        <Icon name="add-circle-outline" size={24} color="#000" />
      </TouchableOpacity>
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 8,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  scanButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#000',
  },
  mealTypeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  mealType: {
    fontSize: 16,
    color: '#666',
  },
  mealTypeActive: {
    fontSize: 16,
    color: '#000',
    fontWeight: 'bold',
  },
  foodList: {
    flex: 1,
  },
  foodItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  foodItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flex: 1,
  },
  foodName: {
    fontSize: 16,
    color: '#000',
  },
  foodAmount: {
    fontSize: 14,
    color: '#999',
  },
  caloriesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  calories: {
    fontSize: 16,
    color: '#000',
    marginRight: 16,
  },
  addButton: {
    marginLeft: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 16,
  },
});

export default MealEntry;