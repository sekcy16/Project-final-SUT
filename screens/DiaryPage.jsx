import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Platform
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

const DiaryPage = () => {
  const navigation = useNavigation();

  const navigateToMealEntry = (mealType) => {
    navigation.navigate('MealEntry', { mealType });
  };

  const navigateToExerciseEntry = () => {
    navigation.navigate('ExerciseEntry');
  };

  const navigateToTotalCalories = () => {
    navigation.navigate('TotalCalories');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.dateNavigation}>
            <TouchableOpacity>
              <Icon name="chevron-back" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.dateText}>23/7/2024</Text>
            <TouchableOpacity>
              <Icon name="chevron-forward" size={24} color="#000" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.totalCaloriesButton}
            onPress={navigateToTotalCalories}>
            <Text style={styles.totalCaloriesButtonText}>Total Calories</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.caloriesSummary}>
          <Text style={styles.summaryText}>เป้าหมาย</Text>
          <Text style={styles.summaryText}>รับประทานไป</Text>
          <Text style={styles.summaryText}>คงเหลือ</Text>
          <Text style={styles.caloriesText}>2,700 Calories -</Text>
          <Text style={styles.caloriesText}>700 Calories =</Text>
          <Text style={styles.caloriesText}>2,000 Calories</Text>
        </View>

        <ScrollView style={styles.scrollView}>
          <MealSection
            title="มื้อเช้า"
            calories={700}
            carbRecommendation={45}
            items={[
              { name: 'ไข่ไก่', amount: '3 eggs', calories: 273, carbs: 0 },
              { name: 'ไก่ย่าง', amount: '100 g', calories: 273, carbs: 0 },
              { name: 'ข้าวกล้อง', amount: '100 g', calories: 92, carbs: 20 },
            ]}
            onAddPress={() => navigateToMealEntry('มื้อเช้า')}
          />
          <MealSection
            title="มื้อเที่ยง"
            calories={0}
            carbRecommendation={60}
            onAddPress={() => navigateToMealEntry('มื้อเที่ยง')}
          />
          <MealSection
            title="มื้อเย็น"
            calories={0}
            carbRecommendation={45}
            onAddPress={() => navigateToMealEntry('มื้อเย็น')}
          />
          <ExerciseSection
            calories={150}
            items={[{ name: 'วิ่ง', duration: 30, calories: 150 }]}
            onAddPress={navigateToExerciseEntry}
          />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const MealSection = ({ title, calories, carbRecommendation, items = [], onAddPress }) => {
  const totalCarbs = items.reduce((sum, item) => sum + (item.carbs || 0), 0);

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
            <TouchableOpacity>
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
const ExerciseSection = ({ calories, items = [], onAddPress }) => (
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
          <TouchableOpacity>
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