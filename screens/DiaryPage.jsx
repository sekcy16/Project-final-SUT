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
  Dimensions,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { app } from "../config/firebase.config";
import { LinearGradient } from "expo-linear-gradient";
import { ProgressBar } from "react-native-paper";

const { width } = Dimensions.get("window");

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
  const [dailyCarbRecommendation, setDailyCarbRecommendation] = useState(0);
  const [mealCarbRecommendations, setMealCarbRecommendations] = useState({
    มื้อเช้า: 0,
    มื้อเที่ยง: 0,
    มื้อเย็น: 0,
  });
  
  const remainingCalories = tdee - totalFoodCalories;
  const isOverConsumed = remainingCalories < 0;

  const db = getFirestore(app);
  const auth = getAuth(app);
  const navigateToSummary = () => {
    navigation.navigate("SummaryPage", {
      date: formatDate(currentDate), // ใช้ฟังก์ชัน formatDate ที่มีอยู่แล้ว
      meals,
      exercises,
      totalFoodCalories,
      totalExerciseCalories,
      totalCarbs,
      tdee,
    });
  };


  const fetchUserData = useCallback(async () => {
    try {
      const userId = auth.currentUser.uid;
      const userRef = doc(db, "users", userId);
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
          มื้อเช้า: otherMealsCarbs,
          มื้อเที่ยง: lunchCarbs,
          มื้อเย็น: otherMealsCarbs,
        });
      } else {
        console.log("No user data found");
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      Alert.alert("Error", "Failed to fetch user data. Please try again.");
    }
  }, []);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const fetchDiaryData = useCallback(async () => {
    try {
      const userId = auth.currentUser.uid;

      // Fetch diary data
      const diaryRef = doc(
        db,
        "users",
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

  const getMealColors = (mealType) => {
    const currentHour = new Date().getHours();
    const isCurrentMeal =
      (mealType === "มื้อเช้า" && currentHour >= 5 && currentHour < 11) ||
      (mealType === "มื้อเที่ยง" && currentHour >= 11 && currentHour < 16) ||
      (mealType === "มื้อเย็น" && (currentHour >= 16 || currentHour < 5));

    return isCurrentMeal ? ["#FFA726", "#FB8C00"] : ["#4caf50", "#45a049"];
  };

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
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return localDate.toISOString().split('T')[0]; // ใช้ split('T') เพื่อแยกส่วนของวันที่ (2024-10-23) ออกจากเวลาที่ไม่ต้องการ (เช่น 14:00:00.000Z)
    // ส่งคืนเฉพาะส่วนวันที่ที่อยู่ก่อนตัวอักษร 'T' นั่นคือ YYYY-MM-DD
  };

  const deleteFoodItem = async (mealType, index) => {
    try {
      const userId = auth.currentUser.uid;
      const diaryRef = doc(
        db,
        "users",
        userId,
        "entries",
        formatDate(currentDate)
      );

      // Get current diary data
      const diarySnap = await getDoc(diaryRef);
      if (!diarySnap.exists()) return;

      const data = diarySnap.data();
      const currentMeals = data.meals || {}; // ดึงข้อมูล meals (ข้อมูลมื้ออาหาร) จากไดอารี่ หากไม่มีข้อมูลก็ใช้ {} เป็นค่าเริ่มต้น
      const updatedMeals = { ...currentMeals }; // ทำสำเนาของ currentMeals ไว้ใน updatedMeals เพื่อป้องกันการแก้ไขข้อมูลเดิมโดยตรง

      if (updatedMeals[mealType]) { //เช็คว่ามื้ออาหารที่ผู้ใช้ระบุ (mealType) มีข้อมูลรายการอาหารอยู่หรือไม่ หากไม่มีจะข้ามการทำงานในบล็อกนี้
        const itemToRemove = updatedMeals[mealType].items[index];
        updatedMeals[mealType].items.splice(index, 1); // ใช้ splice() เพื่อลบรายการอาหารออกจาก array ของรายการอาหารในมื้อนั้น

        // Update totals correctly
        updatedMeals[mealType].calories -= itemToRemove.calories;
        updatedMeals[mealType].carbs -= itemToRemove.carbs;
        updatedMeals[mealType].fat -= itemToRemove.fat;
        updatedMeals[mealType].protein -= itemToRemove.protein;

        // Make sure values don't go below zero
        updatedMeals[mealType].calories = Math.max(
          0,
          updatedMeals[mealType].calories
        );
        updatedMeals[mealType].carbs = Math.max(
          0,
          updatedMeals[mealType].carbs
        );
        updatedMeals[mealType].fat = Math.max(0, updatedMeals[mealType].fat);
        updatedMeals[mealType].protein = Math.max(
          0,
          updatedMeals[mealType].protein
        );

        await setDoc(
          diaryRef,
          {
            meals: updatedMeals,
            exercises: data.exercises || [],
          },
          { merge: true }
        );

        Alert.alert("Success", "Food item deleted.");
        fetchDiaryData(); // Refresh diary data after deletion
      }
    } catch (error) {
      console.error("Error deleting food item:", error);
      Alert.alert("Error", "Failed to delete food item. Please try again.");
    }
  };

  const deleteExerciseItem = async (index) => {
    try {
      const userId = auth.currentUser.uid;
      const diaryRef = doc(
        db,
        "users",
        userId,
        "entries",
        formatDate(currentDate)
      );

      // Get current diary data
      const diarySnap = await getDoc(diaryRef);
      if (!diarySnap.exists()) return;

      const data = diarySnap.data();
      const currentExercises = data.exercises || [];
      const updatedExercises = [...currentExercises];

      if (updatedExercises[index]) {
        updatedExercises.splice(index, 1);

        await setDoc(
          diaryRef,
          {
            meals: data.meals || {},
            exercises: updatedExercises,
          },
          { merge: true }
        );

        Alert.alert("Success", "Exercise item deleted.");
        fetchDiaryData(); // Refresh diary data after deletion
      }
    } catch (error) {
      console.error("Error deleting exercise item:", error);
      Alert.alert("Error", "Failed to delete exercise item. Please try again.");
    }
  };

  return (
    <LinearGradient
      colors={['#4A90E2', '#50E3C2']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View style={styles.dateNavigation}>
            <TouchableOpacity
              onPress={() => changeDate(-1)}
              style={styles.dateButton}
            >
              <Icon name="chevron-left" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.dateContainer}>
              <Text style={styles.dateText}>{formatDate(currentDate)}</Text>
            </View>
            <TouchableOpacity
              onPress={() => changeDate(1)}
              style={styles.dateButton}
            >
              <Icon name="chevron-right" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.summaryButton}
            onPress={navigateToSummary}
          >
            <Icon name="chart-bar" size={20} color="#fff" />
            <Text style={styles.summaryButtonText}>สรุป</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.mainContent}>
          <View style={styles.caloriesSummary}>
            <CalorieSummaryItem label="เป้าหมาย" value={`${tdee} แคล`} icon="target" />
            <CalorieSummaryItem label="อาหาร" value={`${totalFoodCalories} แคล`} icon="food-apple" />
            <CalorieSummaryItem 
              label="คงเหลือ" 
              value={`${Math.abs(remainingCalories)} แคล`}
              isNegative={isOverConsumed}
              icon="fire"
            />
          </View>

          {isOverConsumed && (
            <Text style={styles.warningText}>
              คุณบริโภคเกินเป้าหมายแล้ว!
            </Text>
          )}

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
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};


const CalorieSummaryItem = ({ label, value, isNegative, icon }) => (
  <View style={styles.calorieSummaryItem}>
    <Icon name={icon} size={24} color={isNegative ? "#FF6B6B" : "#4caf50"} />
    <Text style={styles.summaryLabel}>{label}</Text>
    <Text style={[
      styles.summaryValue,
      isNegative && styles.negativeValue
    ]}>
      {value}
    </Text>
  </View>
);


const MealSection = ({
  title,
  calories,
  carbRecommendation,
  items = [],
  onAddPress,
  onDelete,
  gradientColors,
}) => {
  const totalCarbs = items.reduce((sum, item) => sum + (item.carbs || 0), 0);

  const handleDelete = (index) => {
    Alert.alert("ลบรายการ", "คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้?", [
      {
        text: "ยกเลิก",
        style: "cancel",
      },
      {
        text: "ลบ",
        onPress: () => onDelete(index),
      },
    ]);
  };

  return (
    <View style={styles.mealSection}>
      <LinearGradient colors={gradientColors} style={styles.mealHeader}>
        <View style={styles.mealTitleContainer}>
          <Icon
            name={
              title === "มื้อเช้า"
                ? "food-apple"
                : title === "มื้อเที่ยง"
                ? "food"
                : "food-variant"
            }
            size={24}
            color="#fff"
          />
          <Text style={styles.mealTitle}>{title}</Text>
        </View>
        <Text style={styles.mealCalories}>{calories} แคล</Text>
        <TouchableOpacity onPress={onAddPress} style={styles.addButton}>
          <Icon name="plus" size={24} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      <View style={styles.carbRecommendation}>
        <Text style={styles.carbRecommendationText}>
          คาร์บที่แนะนำ: {carbRecommendation} กรัม
        </Text>
        <Text style={styles.carbRecommendationText}>
          คาร์บที่รับประทานไป: {totalCarbs} กรัม
        </Text>
        <Text
          style={[
            styles.carbRecommendationText,
            totalCarbs > carbRecommendation ? styles.carbWarning : null,
          ]}
        >
          {totalCarbs > carbRecommendation
            ? `เกินคำแนะนำ ${totalCarbs - carbRecommendation} กรัม!`
            : `อยู่ในเกณฑ์ที่แนะนำ (เหลืออีก ${carbRecommendation - totalCarbs} กรัม)`}
        </Text>
      </View>

      {items.map((item, index) => (
        <TouchableOpacity key={index} style={styles.foodItem}>
            <View style={styles.foodItemLeft}>
            <Text style={styles.foodName} numberOfLines={1} ellipsizeMode="tail">{item.name}</Text>
            <Text style={styles.foodAmount}>{item.amount}</Text>
          </View>
          <View style={styles.foodItemRight}>
            <Text style={styles.foodCalories}>{item.calories} แคล</Text>
            <Text style={styles.foodCarbs}>{item.carbs || 0} ก. คาร์บ</Text>
            <TouchableOpacity onPress={() => handleDelete(index)}>
              <Icon name="trash-can-outline" size={18} color="#999" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      ))}
      {items.length === 0 && (
        <View style={styles.emptyMeal}>
          <Text style={styles.emptyMealText}>ยังไม่มีรายการอาหาร</Text>
        </View>
      )}
    </View>
  );
};

const ExerciseSection = ({ calories, items = [], onAddPress, onDelete }) => (
  <View style={styles.mealSection}>
    <LinearGradient colors={["#2196F3", "#1e88e5"]} style={styles.mealHeader}>
      <View style={styles.mealTitleContainer}>
        <Icon name="run" size={24} color="#fff" />
        <Text style={styles.mealTitle}>การออกกำลังกาย</Text>
      </View>
      <Text style={styles.mealCalories}>{calories} แคล</Text>
      <TouchableOpacity onPress={onAddPress} style={styles.addButton}>
        <Icon name="plus" size={24} color="#fff" />
      </TouchableOpacity>
    </LinearGradient>

    {items.map((item, index) => (
      <TouchableOpacity key={index} style={styles.foodItem}>
        <View>
          <Text style={styles.foodName}>{item.name}</Text>
          <Text style={styles.foodAmount}>{item.duration} นาที</Text>
        </View>
        <View style={styles.foodCaloriesContainer}>
          <Text style={styles.foodCalories}>{item.calories} แคล</Text>
          <TouchableOpacity
            onPress={() => {
              Alert.alert(
                "ลบการออกกำลังกาย",
                "คุณแน่ใจหรือไม่ว่าต้องการลบรายการออกกำลังกายนี้?",
                [
                  {
                    text: "ยกเลิก",
                    style: "cancel",
                  },
                  {
                    text: "ลบ",
                    onPress: () => onDelete(index),
                  },
                ]
              );
            }}
          >
            <Icon name="dots-vertical" size={18} color="#999" />
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
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 10,
    paddingHorizontal: 15,
  },
  headerContent: {
    paddingHorizontal: 20,
  },
  dateNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateButton: {
    padding: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15,
  },
  dateContainer: {
    marginHorizontal: 10,
  },
  dateLabel: {
    color: "#fff",
    fontSize: 14,
    opacity: 0.8,
    fontFamily: "Kanit-Regular",
  },
  dateText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Kanit-Bold',
  },
  summaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  summaryButtonText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 5,
    fontFamily: 'Kanit-Bold',
  },
  mainContent: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 20,
    paddingHorizontal: 15,
  },
  caloriesSummary: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 10,
    marginBottom: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  calorieSummaryItem: {
    alignItems: "center",
  },
  summaryLabel: {
    color: "#333",
    marginTop: 4,
    fontFamily: "Kanit-Bold",
  },
  summaryValue: {
    fontSize: 16,
    fontFamily: "Kanit-Regular",
  },
  negativeValue: {
    color: '#FF6B6B',
  },
  warningText: {
    color: '#FF6B6B',
    fontSize: 16,
    fontFamily: 'Kanit-Bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  mealSection: {
    marginBottom: 16,
    backgroundColor: "#fff",
    borderRadius: 10,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  mealHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  mealTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  mealTitle: {
    color: "#fff",
    fontSize: 18,
    marginLeft: 8,
    fontFamily: "Kanit-Bold",
  },
  mealCalories: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Kanit-Regular",
  },
  addButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 20,
    padding: 4,
  },
  carbRecommendation: {
    backgroundColor: "#f5f5f5",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  carbRecommendationText: {
    fontSize: 14,
    color: "#333",
    fontFamily: "Kanit-Regular",
    marginBottom: 5,
  },
  carbProgressBar: {
    height: 6,
    borderRadius: 3,
  },
  foodItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  foodName: {
    fontSize: 16,
    fontFamily: "Kanit-Bold",
  },
  foodAmount: {
    color: "#999",
    fontFamily: "Kanit-Regular",
  },
  foodCaloriesContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  foodCalories: {
    marginRight: 8,
    fontFamily: "Kanit-Regular",
  },
  foodCarbs: {
    marginRight: 8,
    color: "#2e7d32",
    fontFamily: "Kanit-Regular",
  },
  foodItemLeft: {
    flex: 1,
    marginRight: 10,
  },
  foodItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyMeal: {
    padding: 16,
    alignItems: "center",
  },
  emptyMealText: {
    color: "#999",
    fontFamily: "Kanit-Regular",
  },
});

export default DiaryPage;
