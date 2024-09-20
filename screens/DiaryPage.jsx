import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Platform,
  Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { app } from '../config/firebase.config';

const DiaryPage = () => {
  const navigation = useNavigation();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [meals, setMeals] = useState({
    'มื้อเช้า': { items: [], calories: 0, carbs: 0 },
    'มื้อเที่ยง': { items: [], calories: 0, carbs: 0 },
    'มื้อเย็น': { items: [], calories: 0, carbs: 0 },
  });
  const [exercises, setExercises] = useState([]);
  const [totalFoodCalories, setTotalFoodCalories] = useState(0);
  const [totalExerciseCalories, setTotalExerciseCalories] = useState(0);
  const [totalCarbs, setTotalCarbs] = useState(0);
  const [tdee, setTdee] = useState(2700);

  const db = getFirestore(app);
  const auth = getAuth(app);


  const navigateToSummary = () => {
    navigation.navigate('SummaryPage', {
      date: currentDate.toISOString(),
      meals,
      exercises,
      totalFoodCalories,
      totalExerciseCalories,
      totalCarbs,
      tdee
    });
  };

  const fetchDiaryData = useCallback(async () => {
    try {
      const userId = auth.currentUser.uid;

      // Fetch diary data
      const diaryRef = doc(db, 'users', userId, 'entries', formatDate(currentDate));
      const diarySnap = await getDoc(diaryRef);

      if (diarySnap.exists()) {
        const data = diarySnap.data();
        const fetchedMeals = data.meals || {};
        const fetchedExercises = data.exercises || [];

        // Ensure all meal types exist
        const updatedMeals = {
          'มื้อเช้า': fetchedMeals['มื้อเช้า'] || { items: [], calories: 0, carbs: 0 },
          'มื้อเที่ยง': fetchedMeals['มื้อเที่ยง'] || { items: [], calories: 0, carbs: 0 },
          'มื้อเย็น': fetchedMeals['มื้อเย็น'] || { items: [], calories: 0, carbs: 0 },
        };

        setMeals(updatedMeals);
        setExercises(fetchedExercises);
        calculateTotals(updatedMeals, fetchedExercises);
      } else {
        resetDiaryData();
      }

      // Fetch user data, including TDEE
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        setTdee(userData.tdee || 2700);
      } else {
        console.log('No user data found');
      }
    } catch (error) {
      console.error("Error fetching diary data:", error);
      Alert.alert('Error', 'Failed to fetch diary data. Please try again.');
    }
  }, [currentDate]);

  useFocusEffect(
    useCallback(() => {
      fetchDiaryData();
    }, [fetchDiaryData])
  );

  useEffect(() => {
    fetchDiaryData();
  }, [fetchDiaryData]);

  const resetDiaryData = () => {
    setMeals({
      'มื้อเช้า': { items: [], calories: 0, carbs: 0 },
      'มื้อเที่ยง': { items: [], calories: 0, carbs: 0 },
      'มื้อเย็น': { items: [], calories: 0, carbs: 0 },
    });
    setExercises([]);
    setTotalFoodCalories(0);
    setTotalExerciseCalories(0);
    setTotalCarbs(0);
  };

  const calculateTotals = (mealsData, exercisesData) => {
    let totalFoodCal = 0;
    let totalCarb = 0;

    Object.values(mealsData).forEach(meal => {
      totalFoodCal += meal.calories || 0;
      totalCarb += meal.carbs || 0;
    });

    const totalExerciseCal = (exercisesData || []).reduce((sum, exercise) => sum + (exercise.calories || 0), 0);

    setTotalFoodCalories(totalFoodCal);
    setTotalExerciseCalories(totalExerciseCal);
    setTotalCarbs(totalCarb);
  };

  const navigateToMealEntry = (mealType) => {
    navigation.navigate('MealEntry', {
      mealType,
      date: currentDate.toISOString()
    });
  };

  const navigateToExerciseEntry = () => {
    navigation.navigate('ExerciseEntry', {
      date: currentDate.toISOString()
    });
  };

  const changeDate = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + direction);
    setCurrentDate(newDate);
  };

  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  const deleteFoodItem = async (mealType, index) => {
    try {
      const userId = auth.currentUser.uid;
      const diaryRef = doc(db, 'users', userId, 'entries', formatDate(currentDate));
  
      // Get current diary data
      const diarySnap = await getDoc(diaryRef);
      if (!diarySnap.exists()) return;
  
      const data = diarySnap.data();
      const currentMeals = data.meals || {};
      const updatedMeals = { ...currentMeals };
  
      if (updatedMeals[mealType]) {
        const itemToRemove = updatedMeals[mealType].items[index];
        updatedMeals[mealType].items.splice(index, 1);
  
        // Update totals correctly
        updatedMeals[mealType].calories -= itemToRemove.calories;
        updatedMeals[mealType].carbs -= itemToRemove.carbs;
        updatedMeals[mealType].fat -= itemToRemove.fat;
        updatedMeals[mealType].protein -= itemToRemove.protein;
  
        // Make sure values don't go below zero
        updatedMeals[mealType].calories = Math.max(0, updatedMeals[mealType].calories);
        updatedMeals[mealType].carbs = Math.max(0, updatedMeals[mealType].carbs);
        updatedMeals[mealType].fat = Math.max(0, updatedMeals[mealType].fat);
        updatedMeals[mealType].protein = Math.max(0, updatedMeals[mealType].protein);
  
        await setDoc(diaryRef, {
          meals: updatedMeals,
          exercises: data.exercises || []
        }, { merge: true });
  
        Alert.alert('Success', 'Food item deleted.');
        fetchDiaryData(); // Refresh diary data after deletion
      }
    } catch (error) {
      console.error('Error deleting food item:', error);
      Alert.alert('Error', 'Failed to delete food item. Please try again.');
    }
  };

  const deleteExerciseItem = async (index) => {
    try {
      const userId = auth.currentUser.uid;
      const diaryRef = doc(db, 'users', userId, 'entries', formatDate(currentDate));
  
      // Get current diary data
      const diarySnap = await getDoc(diaryRef);
      if (!diarySnap.exists()) return;
  
      const data = diarySnap.data();
      const currentExercises = data.exercises || [];
      const updatedExercises = [...currentExercises];
  
      if (updatedExercises[index]) {
        updatedExercises.splice(index, 1);
  
        await setDoc(diaryRef, {
          meals: data.meals || {},
          exercises: updatedExercises
        }, { merge: true });
  
        Alert.alert('Success', 'Exercise item deleted.');
        fetchDiaryData(); // Refresh diary data after deletion
      }
    } catch (error) {
      console.error('Error deleting exercise item:', error);
      Alert.alert('Error', 'Failed to delete exercise item. Please try again.');
    }
  
  }
  
  
  

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.dateNavigation}>
            <TouchableOpacity onPress={() => changeDate(-1)}>
              <Icon name="chevron-back" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.dateText}>{formatDate(currentDate)}</Text>
            <TouchableOpacity onPress={() => changeDate(1)}>
              <Icon name="chevron-forward" size={24} color="#000" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.summaryButton} onPress={navigateToSummary}>
            <Icon name="bar-chart" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.caloriesSummary}>
          <Text style={styles.summaryText}>เป้าหมาย</Text>
          <Text style={styles.summaryText}>อาหาร</Text>
          <Text style={styles.summaryText}>คงเหลือ</Text>
          <Text style={styles.caloriesText}>{tdee} Calories</Text>
          <Text style={styles.caloriesText}>{totalFoodCalories} Calories</Text>
          <Text style={styles.caloriesText}>{tdee - totalFoodCalories} Calories</Text>
        </View>
  
        <ScrollView style={styles.scrollView}>
          {Object.entries(meals).map(([mealType, mealData]) => (
            <MealSection
              key={mealType}
              title={mealType}
              calories={mealData.calories}
              carbRecommendation={45}
              items={mealData.items}
              onAddPress={() => navigateToMealEntry(mealType)}
              onDelete={(index) => deleteFoodItem(mealType, index)}
            />
          ))}
          <ExerciseSection
            calories={totalExerciseCalories}
            items={exercises}
            onAddPress={navigateToExerciseEntry}
            onDelete={deleteExerciseItem}
          />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
  
};

const MealSection = ({ title, calories, carbRecommendation, items = [], onAddPress, onDelete }) => {
  const totalCarbs = items.reduce((sum, item) => sum + (item.carbs || 0), 0);

  const handleDelete = (index) => {
    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this item?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          onPress: () => onDelete(index)
        }
      ]
    );
  };

  return (
    <View style={styles.mealSection}>
      <TouchableOpacity style={styles.mealHeader}>
        <View style={styles.mealTitleContainer}>
          <Icon
            name={
              title === 'มื้อเช้า'
                ? 'cafe'
                : title === 'มื้อเที่ยง'
                  ? 'restaurant'
                  : 'moon'
            }
            size={24}
            color="#fff"
          />
          <Text style={styles.mealTitle}>{title}</Text>
        </View>
        <Text style={styles.mealCalories}>{calories} cal</Text>
        <TouchableOpacity onPress={onAddPress}>
          <Icon name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </TouchableOpacity>

      <View style={styles.carbRecommendation}>
        <Text style={styles.carbRecommendationText}>
          คาร์บที่แนะนำ: {carbRecommendation} กรัม
        </Text>
        <Text style={styles.carbRecommendationText}>
          คาร์บที่รับประทานไป: {totalCarbs} กรัม
        </Text>
      </View>

      {items.map((item, index) => (
        <TouchableOpacity key={index} style={styles.foodItem}>
          <View>
            <Text style={styles.foodName}>{item.name}</Text>
            <Text style={styles.foodAmount}>{item.amount}</Text>
          </View>
          <View style={styles.foodCaloriesContainer}>
            <Text style={styles.foodCalories}>{item.calories} cals</Text>
            <Text style={styles.foodCarbs}>{item.carbs || 0} g carbs</Text>
            <TouchableOpacity onPress={() => handleDelete(index)}>
              <Icon name="ellipsis-vertical" size={18} color="#999" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      ))}
      {items.length === 0 && (
        <TouchableOpacity style={styles.emptyMeal}>
          <Text style={styles.emptyMealText}>ว่าง</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};


const ExerciseSection = ({ calories, items = [], onAddPress, onDelete }) => (
  <View style={styles.mealSection}>
    <TouchableOpacity
      style={[styles.mealHeader, { backgroundColor: '#2196F3' }]}>
      <View style={styles.mealTitleContainer}>
        <Icon name="fitness" size={24} color="#fff" />
        <Text style={styles.mealTitle}>การออกกำลังกาย</Text>
      </View>
      <Text style={styles.mealCalories}>{calories} cal</Text>
      <TouchableOpacity onPress={onAddPress}>
        <Icon name="add" size={24} color="#fff" />
      </TouchableOpacity>
    </TouchableOpacity>

    {items.map((item, index) => (
      <TouchableOpacity key={index} style={styles.foodItem}>
        <View>
          <Text style={styles.foodName}>{item.name}</Text>
          <Text style={styles.foodAmount}>{item.duration} นาที</Text>
        </View>
        <View style={styles.foodCaloriesContainer}>
          <Text style={styles.foodCalories}>{item.calories} cals</Text>
          <TouchableOpacity onPress={() => {
            Alert.alert(
              'Delete Exercise',
              'Are you sure you want to delete this exercise?',
              [
                {
                  text: 'Cancel',
                  style: 'cancel'
                },
                {
                  text: 'Delete',
                  onPress: () => onDelete(index)
                }
              ]
            );
          }}>
            <Icon name="ellipsis-vertical" size={18} color="#999" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    ))}
    {items.length === 0 && (
      <TouchableOpacity style={styles.emptyMeal}>
        <Text style={styles.emptyMealText}>ไม่มีข้อมูล</Text>
      </TouchableOpacity>
    )}
  </View>
);

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  totalCaloriesButton: {
    backgroundColor: '#4caf50',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  totalCaloriesButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  dateNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#4caf50',
    padding: 8,
  },
  dateText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  summaryButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#4caf50',
  },
  caloriesSummary: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#e8f5e9',
  },
  summaryText: {
    width: '33%',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  caloriesText: {
    width: '33%',
    textAlign: 'center',
  },
  mealSection: {
    marginBottom: 16,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#4caf50',
    padding: 16,
  },
  mealTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mealTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  mealCalories: {
    color: '#fff',
    fontSize: 16,
  },
  foodItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  foodName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  foodAmount: {
    color: '#999',
  },
  foodCaloriesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  foodCalories: {
    marginRight: 8,
  },
  emptyMeal: {
    backgroundColor: '#fff',
    padding: 16,
    alignItems: 'center',
  },
  emptyMealText: {
    color: '#999',
  },
  carbRecommendation: {
    backgroundColor: '#e8f5e9',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#c8e6c9',
  },
  carbRecommendationText: {
    fontSize: 14,
    color: '#2e7d32',
  },
  foodCarbs: {
    marginRight: 8,
    color: '#2e7d32',
  },
});


export default DiaryPage;