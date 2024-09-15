import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { app } from '../config/firebase.config'; // Ensure Firebase is initialized here

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
      <SafeAreaView style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{foodDetail.name}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{foodDetail.name}</Text>

        {/* Colored Nutrient Boxes */}
        <View style={styles.nutrientBoxContainer}>
          <View style={[styles.nutrientBox, { backgroundColor: '#FF6F61' }]}>
            <Text style={styles.nutrientBoxText}>Protein</Text>
            <Text style={styles.nutrientValue}>{foodDetail.protein} g</Text>
          </View>
          <View style={[styles.nutrientBox, { backgroundColor: '#FDBE34' }]}>
            <Text style={styles.nutrientBoxText}>Fat</Text>
            <Text style={styles.nutrientValue}>{foodDetail.fat} g</Text>
          </View>
          <View style={[styles.nutrientBox, { backgroundColor: '#4A90E2' }]}>
            <Text style={styles.nutrientBoxText}>Carbs</Text>
            <Text style={styles.nutrientValue}>{foodDetail.carbs} g</Text>
          </View>
          <View style={[styles.nutrientBox, { backgroundColor: '#66BB6A' }]}>
            <Text style={styles.nutrientBoxText}>Sugar</Text>
            <Text style={styles.nutrientValue}>{foodDetail.sugar} g</Text>
          </View>
        </View>

        {/* Recommendation Section */}
        <View style={styles.recommendationContainer}>
          <Text style={styles.recommendationText}>
            เดี๋ยวไปเพิ่ม description ในfirebase
          </Text>
        </View>

        {/* Glycemic Index Section */}
        <View style={styles.giContainer}>
          <Text style={styles.giText}>ดัชนีน้ำตาล (GI): <Text style={styles.giValue}>{foodDetail.gi}</Text></Text>
          <Text style={styles.giText}>ปริมาณน้ำตาล (GL): <Text style={styles.giValue}>{foodDetail.gl}</Text></Text>
        </View>

        {/* Nutrient Breakdown */}
        <View style={styles.nutrientDetailContainer}>
          <View style={styles.detailItem}>
            <Text style={styles.label}>คาร์โบไฮเดรต:</Text>
            <Text style={styles.value}>{foodDetail.carbs} g</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.label}>โปรตีน:</Text>
            <Text style={styles.value}>{foodDetail.protein} g</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.label}>ไขมัน:</Text>
            <Text style={styles.value}>{foodDetail.fat} g</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.label}>น้ำตาล:</Text>
            <Text style={styles.value}>{foodDetail.sugar} g</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.label}>ไฟเบอร์:</Text>
            <Text style={styles.value}>{foodDetail.fiber} g</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.label}>โซเดียม:</Text>
            <Text style={styles.value}>{foodDetail.sodium} mg</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 16,
    color: '#333',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
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
  },
  nutrientValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  recommendationContainer: {
    backgroundColor: '#FFEB99',
    padding: 16,
    borderRadius: 10,
    marginBottom: 16,
  },
  recommendationText: {
    fontSize: 14,
    color: '#333',
  },
  giContainer: {
    backgroundColor: '#FFF3E0',
    padding: 10,
    borderRadius: 10,
    marginBottom: 16,
  },
  giText: {
    fontSize: 16,
    color: '#333',
  },
  giValue: {
    fontWeight: 'bold',
    color: '#F57C00',
  },
  nutrientDetailContainer: {
    backgroundColor: '#FFF',
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
  },
  value: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
});

export default FoodDetail;
