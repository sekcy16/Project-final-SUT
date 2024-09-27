import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { getFirestore, collection, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { app } from '../config/firebase.config';

const FoodItem = ({ food, onAdd, onRemove, onPress, isAdded }) => (
  <TouchableOpacity style={styles.foodItemContainer} onPress={onPress}>
    <View style={styles.foodItem}>
      <View style={styles.foodInfoContainer}>
        <Text style={styles.foodName} numberOfLines={1} ellipsizeMode="tail">{food.name}</Text>
        <Text style={styles.foodAmount} numberOfLines={1} ellipsizeMode="tail">{food.amount}</Text>
      </View>
      <View style={styles.caloriesContainer}>
        <Text style={styles.calories}>{food.calories} kcal</Text>
        <TouchableOpacity style={styles.addButton} onPress={isAdded ? onRemove : onAdd}>
          <Icon name={isAdded ? "remove-circle-outline" : "add-circle-outline"} size={24} color="#4CAF50" />
        </TouchableOpacity>
      </View>
    </View>
  </TouchableOpacity>
);

const MealEntry = () => {
  const [foodList, setFoodList] = useState([]);
  const [addedFoods, setAddedFoods] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const route = useRoute();
  const navigation = useNavigation();
  const { mealType, date, addedFood } = route.params;
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
    fetchAddedFoods();
  }, []);

  useEffect(() => {
    if (addedFood) {
      addToDiary(addedFood);
    }
  }, [addedFood]);
  

  const fetchAddedFoods = async () => {
    try {
      const userId = auth.currentUser.uid;
      const diaryRef = doc(db, 'users', userId, 'entries', date.split('T')[0]);
      const docSnap = await getDoc(diaryRef);
      if (docSnap.exists()) {
        const meals = docSnap.data().meals || {};
        const currentMeal = meals[mealType] || { items: [] };
        setAddedFoods(currentMeal.items);
      }
    } catch (error) {
      console.error('Error fetching added foods:', error);
    }
  };

  const addToDiary = async (food) => {
    try {
      const userId = auth.currentUser.uid;
      const diaryRef = doc(db, 'users', userId, 'entries', date.split('T')[0]);
      
      const docSnap = await getDoc(diaryRef);
      let currentMeals = docSnap.exists() ? (docSnap.data().meals || {}) : {};
      
      if (!currentMeals[mealType]) {
        currentMeals[mealType] = { items: [], calories: 0, carbs: 0, protein: 0, fat: 0 };
      }
      
      const newItem = {
        id: food.id || `custom-${Date.now()}`, // Use existing id or create a custom one
        name: food.name,
        amount: food.amount,
        calories: parseFloat(food.calories) || 0,
        carbs: parseFloat(food.carbs) || 0,
        protein: parseFloat(food.protein) || 0,
        fat: parseFloat(food.fat) || 0
      };
  
      currentMeals[mealType].items.push(newItem);
      currentMeals[mealType].calories += newItem.calories;
      currentMeals[mealType].carbs += newItem.carbs;
      currentMeals[mealType].protein += newItem.protein;
      currentMeals[mealType].fat += newItem.fat;
  
      await setDoc(diaryRef, { 
        meals: currentMeals, 
        date: date,
        exercises: docSnap.exists() ? (docSnap.data().exercises || []) : []
      }, { merge: true });
      
      setAddedFoods([...addedFoods, newItem]);
      Alert.alert('Success', `Added ${food.name} to ${mealType}`);
    } catch (error) {
      console.error('Error adding food to diary:', error);
      Alert.alert('Error', 'Failed to add food to diary. Please try again.');
    }
  };

  const removeFromDiary = async (food) => {
    try {
      const userId = auth.currentUser.uid;
      const diaryRef = doc(db, 'users', userId, 'entries', date.split('T')[0]);
      
      const docSnap = await getDoc(diaryRef);
      let currentMeals = docSnap.exists() ? (docSnap.data().meals || {}) : {};
      
      if (currentMeals[mealType]) {
        currentMeals[mealType].items = currentMeals[mealType].items.filter(item => item.id !== food.id);
        currentMeals[mealType].calories -= food.calories;
        currentMeals[mealType].carbs -= food.carbs;
        currentMeals[mealType].protein -= food.protein;
        currentMeals[mealType].fat -= food.fat;
  
        await setDoc(diaryRef, { 
          meals: currentMeals, 
          date: date,
          exercises: docSnap.exists() ? (docSnap.data().exercises || []) : []
        }, { merge: true });
      
        setAddedFoods(addedFoods.filter(item => item.id !== food.id));
        Alert.alert('Success', `Removed ${food.name} from ${mealType}`);
      }
    } catch (error) {
      console.error('Error removing food from diary:', error);
      Alert.alert('Error', 'Failed to remove food from diary. Please try again.');
    }
  };

  const filteredFoodList = foodList.filter(food => 
    food.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isAddedFood = (food) => addedFoods.some(item => item.id === food.id);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">
          {mealType}
        </Text>
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
        {addedFoods.map((food) => (
          <FoodItem 
            key={food.id}
            food={food}
            onRemove={() => removeFromDiary(food)}
            onPress={() => {}}
            isAdded={true}
          />
        ))}
        {filteredFoodList.map((food) => (
          <FoodItem 
            key={food.id}
            food={food}
            onAdd={() => addToDiary(food)}
            onRemove={() => removeFromDiary(food)}
            onPress={() => navigation.navigate('FoodDetail', { foodId: food.id })}
            isAdded={isAddedFood(food)}
          />
        ))}
      </ScrollView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  foodItem: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  foodInfoContainer: {
    flex: 1,
    marginRight: 10,
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
    minWidth: 120, 
    justifyContent: 'flex-end',
  },
  calories: {
    fontSize: 16,
    color: '#000',
    marginRight: 16,
  },
  addButton: {
    padding: 5, 
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 16,
    marginRight: 40,
  },
});

export default MealEntry;