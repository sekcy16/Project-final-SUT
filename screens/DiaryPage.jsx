import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const DiaryPage = () => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity>
          <Icon name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <View style={styles.profileIcon}>
          <Icon name="person-circle-outline" size={24} color="#000" />
        </View>
      </View>

      <View style={styles.dateNavigation}>
        <TouchableOpacity>
          <Icon name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.dateText}>23/7/2024</Text>
        <TouchableOpacity>
          <Icon name="chevron-forward" size={24} color="#000" />
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

      <ScrollView>
        <MealSection title="มื้อเช้า" calories={700} items={[
          { name: 'Large Size Egg', amount: '3 eggs', calories: 273 },
          { name: 'Chicken Breast', amount: '100 g', calories: 273 },
          { name: 'Blueberries', amount: '100 g', calories: 92 },
        ]} />
        <MealSection title="มื้อเที่ยง" calories={0} />
        <MealSection title="มื้อเย็น" calories={0} />
      </ScrollView>
    </View>
  );
};

const MealSection = ({ title, calories, items = [] }) => (
  <View style={styles.mealSection}>
    <TouchableOpacity style={styles.mealHeader}>
      <View style={styles.mealTitleContainer}>
        <Icon name={title === 'มื้อเช้า' ? 'cafe' : title === 'มื้อเที่ยง' ? 'restaurant' : 'moon'} size={24} color="#fff" />
        <Text style={styles.mealTitle}>{title}</Text>
      </View>
      <Text style={styles.mealCalories}>{calories} cal</Text>
      <TouchableOpacity>
        <Icon name="add" size={24} color="#fff" />
      </TouchableOpacity>
    </TouchableOpacity>
    {items.map((item, index) => (
      <TouchableOpacity key={index} style={styles.foodItem}>
        <View>
          <Text style={styles.foodName}>{item.name}</Text>
          <Text style={styles.foodAmount}>{item.amount}</Text>
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
        <Text style={styles.emptyMealText}>ว่าง</Text>
      </TouchableOpacity>
    )}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  profileIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
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
});

export default DiaryPage;