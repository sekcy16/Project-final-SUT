import React, { useState, useEffect, useCallback } from "react";
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
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { app } from "../config/firebase.config";

const DiaryPage = () => {
  const navigation = useNavigation();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [meals, setMeals] = useState({
    มื้อเช้า: { items: [], calories: 0, carbs: 0 },
    มื้อเที่ยง: { items: [], calories: 0, carbs: 0 },
    มื้อเย็น: { items: [], calories: 0, carbs: 0 },
  });
  const [exercises, setExercises] = useState([]);
  const [totalFoodCalories, setTotalFoodCalories] = useState(0);
  const [totalExerciseCalories, setTotalExerciseCalories] = useState(0);
  const [totalCarbs, setTotalCarbs] = useState(0);
  const [tdee, setTdee] = useState(2700);

  const db = getFirestore(app);
  const auth = getAuth(app);

  const fetchDiaryData = useCallback(async () => {
    try {
      const userId = auth.currentUser.uid;

      // Fetch diary data
      const diaryRef = doc(
        db,
        "diaries",
        userId,
        "entries",
        formatDate(currentDate)
      );
      const diarySnap = await getDoc(diaryRef);

      if (diarySnap.exists()) {
        const data = diarySnap.data();
        const fetchedMeals = data.meals || {};
        const fetchedExercises = data.exercises || [];

        // Ensure all meal types exist
        const updatedMeals = {
          มื้อเช้า: fetchedMeals["มื้อเช้า"] || {
            items: [],
            calories: 0,
            carbs: 0,
          },
          มื้อเที่ยง: fetchedMeals["มื้อเที่ยง"] || {
            items: [],
            calories: 0,
            carbs: 0,
          },
          มื้อเย็น: fetchedMeals["มื้อเย็น"] || {
            items: [],
            calories: 0,
            carbs: 0,
          },
        };

        setMeals(updatedMeals);
        setExercises(fetchedExercises);
        calculateTotals(updatedMeals, fetchedExercises);
      } else {
        resetDiaryData();
      }

      // Fetch user data, including TDEE
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        setTdee(userData.tdee || 2700);
      } else {
        console.log("No user data found");
      }
    } catch (error) {
      console.error("Error fetching diary data:", error);
      Alert.alert("Error", "Failed to fetch diary data. Please try again.");
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
      มื้อเช้า: { items: [], calories: 0, carbs: 0 },
      มื้อเที่ยง: { items: [], calories: 0, carbs: 0 },
      มื้อเย็น: { items: [], calories: 0, carbs: 0 },
    });
    setExercises([]);
    setTotalFoodCalories(0);
    setTotalExerciseCalories(0);
    setTotalCarbs(0);
  };

  const calculateTotals = (mealsData, exercisesData) => {
    let totalFoodCal = 0;
    let totalCarb = 0;

    Object.values(mealsData).forEach((meal) => {
      totalFoodCal += meal.calories || 0;
      totalCarb += meal.carbs || 0;
    });

    const totalExerciseCal = (exercisesData || []).reduce(
      (sum, exercise) => sum + (exercise.calories || 0),
      0
    );

    setTotalFoodCalories(totalFoodCal);
    setTotalExerciseCalories(totalExerciseCal);
    setTotalCarbs(totalCarb);
  };

  const navigateToMealEntry = (mealType) => {
    navigation.navigate("MealEntry", {
      mealType,
      date: currentDate.toISOString(),
    });
  };

  const navigateToExerciseEntry = () => {
    navigation.navigate("ExerciseEntry", {
      date: currentDate.toISOString(),
    });
  };

  const changeDate = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + direction);
    setCurrentDate(newDate);
  };

  const formatDate = (date) => {
    return date.toISOString().split("T")[0];
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.dateNavigation}>
            <TouchableOpacity onPress={() => changeDate(-1)}>
              <Icon name="chevron-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.dateText}>{formatDate(currentDate)}</Text>
            <TouchableOpacity onPress={() => changeDate(1)}>
              <Icon name="chevron-forward" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.caloriesSummary}>
  {/* Header row */}
  <View style={styles.summaryRow}>
    <View style={styles.column}>
      <Text style={styles.summaryText}>เป้าหมาย</Text>
    </View>
    <View style={styles.divider} />
    <View style={styles.column}>
      <Text style={styles.summaryText}>อาหาร</Text>
    </View>
    <View style={styles.divider} />
    <View style={styles.column}>
      <Text style={styles.summaryText}>คงเหลือ</Text>
    </View>
  </View>

  {/* Data row */}
  <View style={styles.summaryRow}>
    <View style={styles.column}>
      <Text style={styles.caloriesText}>{tdee} Calories</Text>
    </View>
    <View style={styles.divider} />
    <View style={styles.column}>
      <Text style={styles.caloriesText}>{totalFoodCalories} Calories</Text>
    </View>
    <View style={styles.divider} />
    <View style={styles.column}>
      <Text style={styles.caloriesText}>{tdee - totalFoodCalories} Calories</Text>
    </View>
  </View>
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
            />
          ))}
          <ExerciseSection
            calories={totalExerciseCalories}
            items={exercises}
            onAddPress={navigateToExerciseEntry}
          />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const MealSection = ({
  title,
  calories,
  carbRecommendation,
  items = [],
  onAddPress,
}) => {
  const totalCarbs = items.reduce((sum, item) => sum + (item.carbs || 0), 0);

  return (
    <View style={styles.mealSection}>
      <TouchableOpacity style={styles.mealHeader}>
        <View style={styles.mealTitleContainer}>
          <Icon
            name={
              title === "มื้อเช้า"
                ? "cafe"
                : title === "มื้อเที่ยง"
                ? "restaurant"
                : "moon"
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
            <Text style={styles.foodCarbs}>{item.carbs} กรัม</Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const ExerciseSection = ({ calories, items = [], onAddPress }) => {
  return (
    <View style={styles.mealSection}>
      <TouchableOpacity style={styles.mealHeader}>
        <View style={styles.mealTitleContainer}>
          <Icon name="barbell" size={24} color="#fff" />
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
          <Text style={styles.foodCalories}>{item.calories} cals</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#4CAF50",
  },
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f4f4f9",
  },
  header: {
    backgroundColor: "#4CAF50",
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  dateNavigation: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginHorizontal: 8,
  },
  caloriesSummary: {
    padding: 16,
    backgroundColor: "#ffffff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-evenly", // Ensures even spacing between columns
    marginBottom: 8, // Space between rows
  },
  column: {
    flex: 1, // Ensures equal space for each column
    alignItems: "center", // Center align text in each column
  },
  summaryText: {
    fontSize: 16,
    color: "#4CAF50",
    fontWeight: "600",
    textAlign: "center", // Center text
  },
  caloriesText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "bold",
    textAlign: "center", // Center text
  },
  divider: {
    width: 1, // Fixed width for the divider
    backgroundColor: "#E0E0E0", // Light grey color for the divider
    height: "80%", // Slightly shorter height than the full row
  },
  scrollView: {
    flex: 1,
  },
  mealSection: {
    marginBottom: 16,
  },
  mealHeader: {
    backgroundColor: "#81C784",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
  },
  mealTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  mealTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 8,
    color: "#fff",
  },
  mealCalories: {
    fontSize: 16,
    color: "#fff",
  },
  carbRecommendation: {
    padding: 8,
    backgroundColor: "#E8F5E9",
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    borderWidth: 1,
    borderColor: "#C8E6C9",
  },
  carbRecommendationText: {
    fontSize: 14,
    color: "#388E3C",
  },
  foodItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#f4f4f9",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  foodName: {
    fontSize: 16,
    fontWeight: "500",
  },
  foodAmount: {
    fontSize: 14,
    color: "#757575",
  },
  foodCaloriesContainer: {
    alignItems: "flex-end",
  },
  foodCalories: {
    fontSize: 16,
    fontWeight: "500",
    color: "#4CAF50",
  },
  foodCarbs: {
    fontSize: 14,
    color: "#757575",
  },
});

export default DiaryPage;
