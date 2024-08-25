import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const DiaryPage = () => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton}>
          <Icon name="chevron-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.profileIcon}>
          <Icon name="person-circle-outline" size={24} color="#FFF" />
        </View>
      </View>

      <View style={styles.dateNavigation}>
        <TouchableOpacity style={styles.iconButton}>
          <Icon name="chevron-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.dateText}>23/7/2024</Text>
        <TouchableOpacity style={styles.iconButton}>
          <Icon name="chevron-forward" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.caloriesSummary}>
        <View style={styles.caloriesColumn}>
          <Text style={styles.summaryText}>เป้าหมาย</Text>
          <Text style={styles.caloriesText}>2,700 Calories</Text>
        </View>
        <View style={styles.caloriesColumn}>
          <Text style={styles.summaryText}>รับประทานไป</Text>
          <Text style={styles.caloriesText}>700 Calories</Text>
        </View>
        <View style={styles.caloriesColumn}>
          <Text style={styles.summaryText}>คงเหลือ</Text>
          <Text style={styles.caloriesText}>2,000 Calories</Text>
        </View>
      </View>

      <ScrollView style={styles.mealContainer}>
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
        <Icon name={title === 'มื้อเช้า' ? 'cafe' : title === 'มื้อเที่ยง' ? 'restaurant' : 'moon'} size={24} color="#FFF" />
        <Text style={styles.mealTitle}>{title}</Text>
      </View>
      <Text style={styles.mealCalories}>{calories} cal</Text>
      <TouchableOpacity>
        <Icon name="add" size={24} color="#FFF" />
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
    backgroundColor: '#E6F4EA',  // Light Green background for the container
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#004d00', // Dark Green for header
    borderBottomWidth: 1,
    borderBottomColor: '#003300', // Even darker Green for contrast
    borderRadius: 12,
    marginBottom: 16,
  },
  profileIcon: {
    padding: 10,
    backgroundColor: '#FF8C00', // Dark Orange for profile icon (contrast)
    borderRadius: 8,
  },
  iconButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FF8C00',  // Dark Orange for icon button
  },
  dateNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#004d00',  // Dark Green for date navigation
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  dateText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  caloriesSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: '#d0f0c0',  // Honeydew for summary background
    borderRadius: 8,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  caloriesColumn: {
    alignItems: 'center',
  },
  summaryText: {
    fontWeight: 'bold',
    color: '#004d00',  // Dark Green for text
  },
  caloriesText: {
    fontSize: 16,
    color: '#006400',  // Darker Green for calorie values
    marginTop: 4,
  },
  mealContainer: {
    paddingHorizontal: 16,
  },
  mealSection: {
    marginBottom: 16,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',  // White for meal sections
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#228B22',  // Forest Green for meal headers
    padding: 16,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  mealTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mealTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  mealCalories: {
    color: '#FFF',
    fontSize: 16,
  },
  foodItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#E6F4EA',  // Light Green background for food items
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#d0f0c0',  // Honeydew for borders
  },
  foodName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#004d00',  // Dark Green for food names
  },
  foodAmount: {
    color: '#006400',  // Dark Green for food amounts
  },
  foodCaloriesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  foodCalories: {
    marginRight: 8,
    fontSize: 14,
    color: '#006400',  // Dark Green for calories
  },
  emptyMeal: {
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#E6F4EA',  // Light Green background for empty meals
  },
  emptyMealText: {
    color: '#A9A9A9',  // Dark Gray for empty meal text
    fontSize: 14,
  },
});


export default DiaryPage;
