import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

const MealEntry = () => {
  const navigation = useNavigation();

  const handleFoodRecognition = () => {
    navigation.navigate('FoodARPage');
  };

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

      <View style={styles.searchBar}>
        <Icon name="search" size={20} color="#999" />
        <TextInput 
          style={styles.searchInput}
          placeholder="ค้นหา"
        />
        <Icon name="mic" size={20} color="#999" />
      </View>

      <TouchableOpacity style={styles.scanButton} onPress={handleFoodRecognition}>
        <Icon name="fast-food-outline" size={24} color="#FFF" />
        <Text style={styles.scanButtonText}>Food Recognition</Text>
      </TouchableOpacity>

      <View style={styles.mealTypeSelector}>
        <Text style={styles.mealTypeActive}>อาหารแนะนำ</Text>
        <Text style={styles.mealType}>โปรตีน</Text>
        <Text style={styles.mealType}>คาร์โบไฮเดรต</Text>
        <Text style={styles.mealType}>ไขมัน</Text>
      </View>

      <ScrollView style={styles.foodList}>
        <FoodItem name="ข้าวไรซ์ ดี" amount="100 กรัม" calories="379 cals" />
        <FoodItem name="ข้าวกล้อง ดี" amount="100 กรัม" calories="110 cals" />
        <Text style={styles.sectionTitle}>ประจำ</Text>
        <FoodItem name="แซนวิช(ปุ้ม) ดี" amount="100 กรัม" calories="127 cals" />
        <FoodItem name="แซนวิช(ปุ้ม) ดี" amount="100 กรัม" calories="127 cals" />
      </ScrollView>
    </View>
  );
};

const FoodItem = ({ name, amount, calories }) => (
  <View style={styles.foodItem}>
    <View>
      <Text style={styles.foodName}>{name}</Text>
      <Text style={styles.foodAmount}>{amount}</Text>
    </View>
    <View style={styles.caloriesContainer}>
      <Text style={styles.calories}>{calories}</Text>
      <TouchableOpacity style={styles.addItemButton}>
        <Icon name="add" size={20} color="#6B8E23" />
      </TouchableOpacity>
    </View>
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
    padding: 20,
    backgroundColor: '#8FBC8F',  // Soft green for header
    elevation: 2,
    borderBottomWidth: 1,
    borderBottomColor: '#8FBC8F',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 20,
    margin: 16,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 8,
    marginLeft: 8,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8FBC8F',  // Soft green for scan button
    borderRadius: 25,
    margin: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  scanButtonText: {
    color: '#FFF',
    marginLeft: 8,
    fontWeight: 'bold',
    fontSize: 16,
  },
  mealTypeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  mealType: {
    color: '#999',
  },
  mealTypeActive: {
    color: '#8FBC8F',  // Soft green for active meal type
    fontWeight: 'bold',
  },
  foodList: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 16,
    marginTop: 16,
    color: '#556B2F',  // Dark olive green for section title
  },
  foodItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF8DC',  // Cornsilk color for food items
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  foodName: {
    fontWeight: 'bold',
    color: '#556B2F',  // Dark olive green for food name
  },
  foodAmount: {
    color: '#6B8E23',  // Olive drab for food amount
  },
  caloriesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  calories: {
    marginRight: 8,
    color: '#6B8E23',  // Olive drab for calories
  },
  addItemButton: {
    backgroundColor: '#EEE8AA',  // Pale goldenrod for add button
    borderRadius: 15,
    padding: 4,
  },
});

export default MealEntry;
