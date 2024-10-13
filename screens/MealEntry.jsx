import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, SafeAreaView, StatusBar, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { getFirestore, collection, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { app } from '../config/firebase.config';
import { LinearGradient } from 'expo-linear-gradient';

const FoodItem = ({ food, onAdd, onPress }) => (
  <TouchableOpacity style={styles.foodItemContainer} onPress={onPress}>
    <View style={styles.foodItem}>
      <View style={styles.foodInfoContainer}>
        <Text style={styles.foodName} numberOfLines={1} ellipsizeMode="tail">{food.name}</Text>
        <Text style={styles.foodAmount} numberOfLines={1} ellipsizeMode="tail">{food.amount}</Text>
      </View>
      <View style={styles.caloriesContainer}>
        <Text style={styles.calories}>{food.calories} แคล</Text>
        <TouchableOpacity style={styles.addButton} onPress={onAdd}>
          <Icon name="plus-circle-outline" size={24} color="#4CAF50" />
        </TouchableOpacity>
      </View>
    </View>
  </TouchableOpacity>
);

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
      const diaryRef = doc(db, 'users', userId, 'entries', date.split('T')[0]);
      
      const docSnap = await getDoc(diaryRef);
      let currentMeals = docSnap.exists() ? (docSnap.data().meals || {}) : {};
      
      if (!currentMeals[mealType]) {
        currentMeals[mealType] = { items: [], calories: 0, carbs: 0, protein: 0, fat: 0 };
      }
      
      const newItem = {
        id: food.id,
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
      
      Alert.alert('สำเร็จ', `เพิ่ม ${food.name} ไปยัง ${mealType}`);
    } catch (error) {
      console.error('Error adding food to diary:', error);
      Alert.alert('Error', 'Failed to add food to diary. Please try again.');
    }
  };

  const filteredFoodList = foodList.filter(food => 
    food.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <LinearGradient colors={['#4A90E2', '#50E3C2']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">
            {mealType}
          </Text>
        </View>

        <View style={styles.content}>
          <View style={styles.searchBar}>
            <Icon name="magnify" size={20} color="#999" />
            <TextInput 
              style={styles.searchInput}
              placeholder="ค้นหา"
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
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
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    fontFamily: 'Kanit-Bold',
  },
  content: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 25,
    paddingHorizontal: 15,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
    marginLeft: 10,
    fontFamily: 'Kanit-Regular',
  },
  foodList: {
    flex: 1,
  },
  foodItemContainer: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  foodItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
  },
  foodInfoContainer: {
    flex: 1,
    marginRight: 10,
  },
  foodName: {
    fontSize: 16,
    color: '#333',
    fontFamily: 'Kanit-Bold',
  },
  foodAmount: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Kanit-Regular',
  },
  caloriesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  calories: {
    fontSize: 16,
    color: '#333',
    marginRight: 10,
    fontFamily: 'Kanit-Regular',
  },
  addButton: {
    padding: 5,
  },
});

export default MealEntry;