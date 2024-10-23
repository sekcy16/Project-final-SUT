import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, StatusBar, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { app } from '../config/firebase.config';
import { LinearGradient } from 'expo-linear-gradient';

const FoodDetail = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { foodId } = route.params;
  const [foodDetail, setFoodDetail] = useState(null);
  const db = getFirestore(app);

  useEffect(() => {
    const fetchFoodDetail = async () => {
      try {
        const foodDoc = await getDoc(doc(db, 'foodlist', foodId));
        if (foodDoc.exists()) {
          setFoodDetail(foodDoc.data());
        } else {
          console.log('No such document!');
        }
      } catch (error) {
        console.error('Error fetching food detail:', error);
      }
    };

    if (foodId) {
      fetchFoodDetail();
    }
  }, [foodId]);

  if (!foodDetail) {
    return (
      <LinearGradient colors={['#4A90E2', '#50E3C2']} style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#4A90E2', '#50E3C2']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{foodDetail.name}</Text>
        </View>

        <ScrollView style={styles.mainContent}>
          <View style={styles.foodInfoCard}>
            <Text style={styles.title}>{foodDetail.name}</Text>

            <View style={styles.nutrientBoxContainer}>
              <NutrientBox label="โปรตีน" value={`${foodDetail.protein} g`} color="#FF6F61" />
              <NutrientBox label="ไขมัน" value={`${foodDetail.fat} g`} color="#FDBE34" />
              <NutrientBox label="คาร์บ" value={`${foodDetail.carbs} g`} color="#4A90E2" />
              <NutrientBox label="น้ำตาล" value={`${foodDetail.sugar} g`} color="#66BB6A" />
            </View>



            <View style={styles.giContainer}>
              <Text style={styles.giText}>ดัชนีน้ำตาล (GI): <Text style={styles.giValue}>{foodDetail.gi}</Text></Text>
            </View>

            <View style={styles.nutrientDetailContainer}>
              <NutrientDetailItem label="คาร์โบไฮเดรต" value={`${foodDetail.carbs} g`} />
              <NutrientDetailItem label="โปรตีน" value={`${foodDetail.protein} g`} />
              <NutrientDetailItem label="ไขมัน" value={`${foodDetail.fat} g`} />
              <NutrientDetailItem label="น้ำตาล" value={`${foodDetail.sugar} g`} />
              <NutrientDetailItem label="ไฟเบอร์" value={`${foodDetail.fiber} g`} />
              <NutrientDetailItem label="โซเดียม" value={`${foodDetail.sodium} mg`} />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const NutrientBox = ({ label, value, color }) => (
  <View style={[styles.nutrientBox, { backgroundColor: color }]}>
    <Text style={styles.nutrientBoxText}>{label}</Text>
    <Text style={styles.nutrientValue}>{value}</Text>
  </View>
);

const NutrientDetailItem = ({ label, value }) => (
  <View style={styles.detailItem}>
    <Text style={styles.label}>{label}:</Text>
    <Text style={styles.value}>{value}</Text>
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
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Kanit-Bold',
    color: '#FFF',
    marginLeft: 15,
    flex: 1,
  },
  mainContent: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 20,
    paddingHorizontal: 15,
  },
  foodInfoCard: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Kanit-Bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  nutrientBoxContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  nutrientBox: {
    flex: 1,
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    marginHorizontal: 5,
  },
  nutrientBoxText: {
    fontSize: 14,
    color: '#FFF',
    fontFamily: 'Kanit-Regular',
  },
  nutrientValue: {
    fontSize: 16,
    fontFamily: 'Kanit-Bold',
    color: '#FFF',
  },
  recommendationContainer: {
    backgroundColor: 'rgba(255, 235, 153, 0.5)',
    padding: 16,
    borderRadius: 10,
    marginBottom: 16,
  },
  recommendationText: {
    fontSize: 14,
    color: '#333',
    fontFamily: 'Kanit-Regular',
  },
  giContainer: {
    backgroundColor: 'rgba(255, 243, 224, 0.5)',
    padding: 10,
    borderRadius: 10,
    marginBottom: 16,
  },
  giText: {
    fontSize: 16,
    color: '#333',
    fontFamily: 'Kanit-Regular',
  },
  giValue: {
    fontFamily: 'Kanit-Bold',
    color: '#F57C00',
  },
  nutrientDetailContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  label: {
    fontSize: 16,
    color: '#555',
    fontFamily: 'Kanit-Regular',
  },
  value: {
    fontSize: 16,
    fontFamily: 'Kanit-Bold',
    color: '#333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#FFF',
    fontFamily: 'Kanit-Regular',
  },
});

export default FoodDetail;