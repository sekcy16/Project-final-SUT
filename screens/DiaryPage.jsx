import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const DiaryPage = () => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton}>
          <Icon name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.profileIcon}>
          <Icon name="person-circle-outline" size={24} color="#fff" />
        </View>
      </View>

      <View style={styles.dateNavigation}>
        <TouchableOpacity style={styles.iconButton}>
          <Icon name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.dateText}>23/7/2024</Text>
        <TouchableOpacity style={styles.iconButton}>
          <Icon name="chevron-forward" size={24} color="#fff" />
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
    backgroundColor: '#F5F5DC',  // Light beige background
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#8FBC8F', // Soft green background for header
    borderRadius: 12,
    marginBottom: 20,// Soft green background for header
  },
  profileIcon: {
    padding: 10,
    backgroundColor: '#BDB76B', // Khaki color for profile icon
    borderRadius: 8,
  },
  iconButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#556B2F',  // Dark olive green for icon button
  },
  dateNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#8FBC8F',  // Same soft green for navigation
    padding: 8,
    marginVertical: 16,
    marginHorizontal: 16,
    borderRadius: 8,
  },
  dateText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  caloriesSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#F0E68C',  // Khaki background for summary
    marginHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  caloriesColumn: {
    alignItems: 'center',
  },
  summaryText: {
    fontWeight: 'bold',
    color: '#556B2F',  // Dark olive text for contrast
  },
  caloriesText: {
    fontSize: 16,
    color: '#6B8E23',  // Olive drab for text
    marginTop: 4,
  },
  mealContainer: {
    paddingHorizontal: 16,
  },
  mealSection: {
    marginBottom: 16,
    borderRadius: 8,
    backgroundColor: '#FAFAD2',  // Light goldenrod yellow for meal sections
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
    backgroundColor: '#8FBC8F',  // Soft green for meal headers
    padding: 16,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
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
    backgroundColor: '#FFF8DC',  // Cornsilk color for food items
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE8AA',  // Pale goldenrod for border
  },
  foodName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#556B2F',  // Dark olive for food names
  },
  foodAmount: {
    color: '#6B8E23',  // Olive drab for food amounts
  },
  foodCaloriesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  foodCalories: {
    marginRight: 8,
    fontSize: 14,
    color: '#6B8E23',  // Olive drab for calories
  },
  emptyMeal: {
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#EEE8AA',  // Pale goldenrod for empty meals
  },
  emptyMealText: {
    color: '#999',
    fontSize: 14,
  },
});

export default DiaryPage;
