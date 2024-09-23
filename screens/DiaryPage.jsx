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
  Alert,
  Dimensions
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { app } from '../config/firebase.config';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');


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
  const [dailyCarbRecommendation, setDailyCarbRecommendation] = useState(0);
  const [mealCarbRecommendations, setMealCarbRecommendations] = useState({
    'มื้อเช้า': 0,
    'มื้อเที่ยง': 0,
    'มื้อเย็น': 0,
  });

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
  const fetchUserData = useCallback(async () => {
    try {
      const userId = auth.currentUser.uid;
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        setTdee(userData.tdee || 2700);
        
        // Get daily carb recommendation from macronutrients
        const dailyCarbs = userData.macronutrients?.carbs || 200;
        setDailyCarbRecommendation(dailyCarbs);
        
        // Distribute carbs across meals (40% lunch, 30% breakfast and dinner)
        const lunchCarbs = Math.round(dailyCarbs * 0.4);
        const otherMealsCarbs = Math.round(dailyCarbs * 0.3);
        setMealCarbRecommendations({
          'มื้อเช้า': otherMealsCarbs,
          'มื้อเที่ยง': lunchCarbs,
          'มื้อเย็น': otherMealsCarbs,
        });
      } else {
        console.log('No user data found');
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      Alert.alert('Error', 'Failed to fetch user data. Please try again.');
    }
  }, []);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

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

  const getMealColors = (mealType) => {
    const currentHour = new Date().getHours();
    const isCurrentMeal = (
      (mealType === 'มื้อเช้า' && currentHour >= 5 && currentHour < 11) ||
      (mealType === 'มื้อเที่ยง' && currentHour >= 11 && currentHour < 16) ||
      (mealType === 'มื้อเย็น' && (currentHour >= 16 || currentHour < 5))
    );

    return isCurrentMeal ? ['#FFA726', '#FB8C00'] : ['#4caf50', '#45a049'];
  };

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
      <LinearGradient
        colors={['#4caf50', '#45a049']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.dateNavigation}>
            <TouchableOpacity onPress={() => changeDate(-1)} style={styles.dateButton}>
              <Icon name="chevron-back" size={28} color="#fff" />
            </TouchableOpacity>
            <View style={styles.dateContainer}>
              <Text style={styles.dateLabel}>Date</Text>
              <Text style={styles.dateText}>{formatDate(currentDate)}</Text>
            </View>
            <TouchableOpacity onPress={() => changeDate(1)} style={styles.dateButton}>
              <Icon name="chevron-forward" size={28} color="#fff" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.summaryButton} onPress={navigateToSummary}>
            <Icon name="bar-chart" size={28} color="#fff" />
            <Text style={styles.summaryButtonText}>Summary</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
      
      <View style={styles.caloriesSummary}>
        <CalorieSummaryItem label="เป้าหมาย" value={`${tdee} Cal`} />
        <CalorieSummaryItem label="อาหาร" value={`${totalFoodCalories} Cal`} />
        <CalorieSummaryItem label="คงเหลือ" value={`${tdee - totalFoodCalories} remaining`} />
      </View>

      <ScrollView style={styles.scrollView}>
        {Object.entries(meals).map(([mealType, mealData]) => (
          <MealSection
            key={mealType}
            title={mealType}
            calories={mealData.calories}
            carbRecommendation={mealCarbRecommendations[mealType]}
            items={mealData.items}
            onAddPress={() => navigateToMealEntry(mealType)}
            onDelete={(index) => deleteFoodItem(mealType, index)}
            gradientColors={getMealColors(mealType)}
          />
        ))}
        <ExerciseSection
          calories={totalExerciseCalories}
          items={exercises}
          onAddPress={navigateToExerciseEntry}
          onDelete={deleteExerciseItem}
        />
      </ScrollView>
    </SafeAreaView>
  );
};


const CalorieSummaryItem = ({ label, value }) => (
  <View style={styles.calorieSummaryItem}>
    <Text style={styles.summaryLabel}>{label}</Text>
    <Text style={styles.summaryValue}>{value}</Text>
  </View>
);

const MealSection = ({ title, calories, carbRecommendation, items = [], onAddPress, onDelete, gradientColors }) => {
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
      <LinearGradient
        colors={gradientColors}
        style={styles.mealHeader}
      >
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
        <TouchableOpacity onPress={onAddPress} style={styles.addButton}>
          <Icon name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      <View style={styles.carbRecommendation}>
        <Text style={styles.carbRecommendationText}>
          คาร์บที่แนะนำ: {carbRecommendation} กรัม
        </Text>
        <Text style={styles.carbRecommendationText}>
          คาร์บที่รับประทานไป: {totalCarbs} กรัม
        </Text>
        <Text style={[styles.carbRecommendationText, totalCarbs > carbRecommendation ? styles.carbWarning : null]}>
          {totalCarbs > carbRecommendation ? 'เกินคำแนะนำ!' : 'อยู่ในเกณฑ์ที่แนะนำ'}
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
    <LinearGradient
      colors={['#2196F3', '#1e88e5']}
      style={styles.mealHeader}
    >
      <View style={styles.mealTitleContainer}>
        <Icon name="fitness" size={24} color="#fff" />
        <Text style={styles.mealTitle}>การออกกำลังกาย</Text>
      </View>
      <Text style={styles.mealCalories}>{calories} cal</Text>
      <TouchableOpacity onPress={onAddPress} style={styles.addButton}>
        <Icon name="add" size={24} color="#fff" />
      </TouchableOpacity>
    </LinearGradient>

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
  header: {
    paddingTop: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    paddingHorizontal: 20,
  },
  dateNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  dateButton: {
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
  },
  dateContainer: {
    alignItems: 'center',
  },
  dateLabel: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.8,
  },
  dateText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  summaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 25,
    padding: 12,
    width: width - 40, // Full width minus padding
  },
  summaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  caloriesSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginHorizontal: 16,
    marginTop: -20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  calorieSummaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontWeight: 'bold',
    color: '#4caf50',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
  },
  mealSection: {
    marginBottom: 16,
    marginHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  addButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 4,
  },
  foodItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  carbWarning: {
    color: '#ffbf00',
    fontWeight: 'bold',
  },
});

export default DiaryPage;