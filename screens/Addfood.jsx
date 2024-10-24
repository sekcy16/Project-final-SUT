import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Modal,
  Animated,
  PanResponder,
  RefreshControl,
  TouchableWithoutFeedback,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { firebaseDB, firebaseAuth } from '../config/firebase.config';
import { collection, addDoc, getDocs, deleteDoc, doc, query, where } from 'firebase/firestore';
import { LinearGradient } from 'expo-linear-gradient';

const SWIPE_THRESHOLD = -100;

const AddFood = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [selectedMeal, setSelectedMeal] = useState('มื้อเช้า');
  const [searchQuery, setSearchQuery] = useState('');
  const [scannedFoods, setScannedFoods] = useState([]);
  const [isMealModalVisible, setIsMealModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const mealOptions = ['มื้อเช้า', 'มื้อเที่ยง', 'มื้อเย็น'];

  const loadScannedFoods = useCallback(async () => {
    try {
      const userId = firebaseAuth.currentUser?.uid;

      if (!userId) {
        console.error('User is not authenticated.');
        return;
      }

      const foodHistoryQuery = query(
        collection(firebaseDB, 'foodHistory'),
        where('userId', '==', userId)
      );

      const querySnapshot = await getDocs(foodHistoryQuery);
      const foods = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      setScannedFoods(foods);
    } catch (error) {
      console.error('Error loading scanned foods:', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadScannedFoods();
    }, [loadScannedFoods])
  );

  useEffect(() => {
    const addNewFood = async () => {
      if (route.params?.newFood) {
        const newFood = route.params.newFood;
        const alreadyInFirestore = route.params.alreadyInFirestore;

        try {
          const userId = firebaseAuth.currentUser?.uid;
          if (!userId) {
            console.error('User is not authenticated.');
            return;
          }

          if (!alreadyInFirestore) {
            // Check if the food is already in Firestore
            const existingFoodQuery = query(
              collection(firebaseDB, 'foodHistory'),
              where('userId', '==', userId),
              where('name', '==', newFood.name || ''),
              where('createdAt', '==', newFood.createdAt)
            );
            const existingFoodSnapshot = await getDocs(existingFoodQuery);

            if (existingFoodSnapshot.empty) {
              // Add the new food to Firestore only if it doesn't exist
              const docRef = await addDoc(collection(firebaseDB, 'foodHistory'), newFood);
              console.log('Food added to Firestore in AddFood component');
            } else {
              console.log('Food already exists in Firestore, not adding again');
            }
          } else {
            console.log('Food was already added to Firestore in previous component');
          }

          // Update the local state with the new food
          setScannedFoods((prevFoods) => [newFood, ...prevFoods]);
        } catch (error) {
          console.error('Error processing new food:', error);
        }

        navigation.setParams({ newFood: null, alreadyInFirestore: false });
      }
    };

    addNewFood();
  }, [route.params?.newFood, navigation]);

  const handleMealSelection = (meal) => {
    setSelectedMeal(meal);
    setIsMealModalVisible(false);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadScannedFoods().then(() => setRefreshing(false));
  }, [loadScannedFoods]);

  const handleAddFood = async (food) => {
    if (isAdding) {
      console.log('Add button disabled - food is being added.');
      return;
    }

    console.log('Button clicked, adding food process started.');

    setIsAdding(true);

    if (!food || !food.name || !food.calories) {
      console.error('Food data is incomplete or missing.');
      setIsAdding(false);
      return;
    }

    try {
      console.log('Adding food:', food);
  
      // Navigate to the MealEntry screen, passing the food data
      navigation.navigate('MealEntry', {
        mealType: selectedMeal,
        date: new Date().toISOString(),
        addedFood: food,
      });
    } catch (error) {
      console.error('Error adding food:', error);
    } finally {
      setIsAdding(false);
      console.log('Food added successfully, button enabled again.');
    }
  };

  const handleScan = scanType => {
    navigation.navigate(scanType === 'AR' ? 'FoodARPage' : 'FoodQRPage');
  };

  const handleDeleteFood = async foodToDelete => {
    if (!foodToDelete || !foodToDelete.id) {
      console.error('Invalid food item:', foodToDelete);
      return;
    }

    try {
      await deleteDoc(doc(firebaseDB, 'foodHistory', foodToDelete.id));
      console.log('Food deleted successfully from Firestore');
      setScannedFoods(prevFoods => prevFoods.filter(food => food.id !== foodToDelete.id));
    } catch (error) {
      console.error('Error deleting food:', error);
    }
  };



  const FoodItem = useCallback(
    ({ food, index }) => {
      const pan = useRef(new Animated.ValueXY()).current;
      const deleteOpacity = useRef(new Animated.Value(0)).current;
  
      const panResponder = PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) => {
          // Only set pan responder for horizontal swipes, not for taps or slight movements
          return Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dy) < 10;
        },
        onPanResponderMove: (_, gestureState) => {
          if (gestureState.dx < 0) {
            // Swipe left: Animate the pan and show delete button
            Animated.event([null, { dx: pan.x }], { useNativeDriver: false })(_, gestureState);
            Animated.timing(deleteOpacity, {
              toValue: 1,
              duration: 200,
              useNativeDriver: false,
            }).start();
          }
        },
        onPanResponderRelease: (_, gestureState) => {
          // Finalize the swipe interaction
          if (gestureState.dx < SWIPE_THRESHOLD) {
            Animated.timing(pan, {
              toValue: { x: -100, y: 0 },
              duration: 200,
              useNativeDriver: false,
            }).start();
          } else {
            Animated.spring(pan, {
              toValue: { x: 0, y: 0 },
              friction: 5,
              useNativeDriver: false,
            }).start();
            Animated.timing(deleteOpacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: false,
            }).start();
          }
        },
      });
  
      return (
        <View style={styles.foodItemContainer}>
          <Animated.View style={[styles.deleteButton, { opacity: deleteOpacity }]}>
            <TouchableOpacity onPress={() => handleDeleteFood(food)}>
              <Icon name="trash-can-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </Animated.View>
  
          <Animated.View
            style={[styles.historyItem, { transform: [{ translateX: pan.x }] }]}
            {...panResponder.panHandlers}
          >
            <View style={styles.historyItemContent}>
              <Text style={styles.historyItemTitle}>{food.name}</Text>
              <Text style={styles.historyItemSubtitle}>
              {`${food.calories} kcal, ${food.amount}`}
              </Text>
            </View>
  
            <TouchableWithoutFeedback onPress={() => handleAddFood(food)}>
              <View style={styles.addButton}>
                <Icon name="plus" size={24} color="#FFFFFF" />
              </View>
            </TouchableWithoutFeedback>
          </Animated.View>
        </View>
      );
    },
    [handleAddFood]
  );
  

    return (
      <LinearGradient colors={['#4A90E2', '#50E3C2']} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Icon name="arrow-left" size={24} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>เพิ่มอาหาร</Text>
          </View>
  
          <ScrollView
            style={styles.scrollView}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#1E88E5"]} />
            }
          >
            <View style={styles.mainContent}>
              <View style={styles.menuSelectionContainer}>
                <Text style={styles.sectionTitle}>เลือกมื้ออาหาร</Text>
                <TouchableOpacity style={styles.dropdownButton} onPress={() => setIsMealModalVisible(true)}>
                  <Text style={styles.dropdownText}>{selectedMeal}</Text>
                  <Icon name="chevron-down" size={20} color="#2E7D32" />
                </TouchableOpacity>
              </View>
  
              <View style={styles.searchContainer}>
                <Icon name="magnify" size={20} color="#757575" style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="ค้นหาอาหาร"
                  placeholderTextColor="#9E9E9E"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>
  
              <View style={styles.scanContainer}>
                <TouchableOpacity style={styles.scanButton} onPress={() => handleScan('AR')}>
                  <Icon name="camera" size={36} color="#FFFFFF" />
                  <Text style={styles.scanButtonText}>สแกนอาหาร</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.scanButton} onPress={() => handleScan('QR')}>
                  <Icon name="qrcode" size={36} color="#FFFFFF" />
                  <Text style={styles.scanButtonText}>สแกนบาร์โค้ด</Text>
                </TouchableOpacity>
              </View>
  
              <View style={styles.historyContainer}>
                <View style={styles.historyHeader}>
                  <Text style={styles.sectionTitle}>ประวัติ</Text>
                  <TouchableOpacity style={styles.sortButton}>
                    <Text style={styles.sortButtonText}>ล่าสุด</Text>
                    <Icon name="chevron-down" size={16} color="#2E7D32" />
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.historyList}>
                  {scannedFoods.map((food, index) => (
                    <FoodItem key={index} food={food} index={index} />
                  ))}
                </ScrollView>
              </View>
            </View>
          </ScrollView>
  
          <Modal
            animationType="slide"
            transparent={true}
            visible={isMealModalVisible}
            onRequestClose={() => setIsMealModalVisible(false)}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>เลือกมื้ออาหาร</Text>
                {mealOptions.map((meal, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.modalOption}
                    onPress={() => handleMealSelection(meal)}
                  >
                    <Text style={styles.modalOptionText}>{meal}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setIsMealModalVisible(false)}
                >
                  <Text style={styles.modalCloseButtonText}>ปิด</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </SafeAreaView>
      </LinearGradient>
    );
  };
  
  // ส่วนของ StyleSheet แบบเต็ม:
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: 'Kanit-Bold',
    color: '#FFF',
    marginLeft: 15,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  mainContent: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 20,
    paddingHorizontal: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  menuSelectionContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Kanit-Bold',
    color: '#2D3748',
    marginBottom: 10,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EBF8FF',
    borderRadius: 15,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#BEE3F8',
  },
  dropdownText: {
    color: '#4A90E2',
    fontFamily: 'Kanit-Medium',
    fontSize: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    marginBottom: 20,
    paddingHorizontal: 16,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: '#2D3748',
    fontFamily: 'Kanit-Regular',
    fontSize: 16,
  },
  scanContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingHorizontal: 2,
  },
  scanButton: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4A90E2',
    borderRadius: 16,
    padding: 16,
    width: '48%',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 4,
  },
  scanButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Kanit-Medium',
    fontSize: 16,
    marginTop: 8,
  },
  historyContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: '#EBF8FF',
  },
  sortButtonText: {
    color: '#4A90E2',
    fontFamily: 'Kanit-Medium',
    fontSize: 14,
    marginRight: 4,
  },
  historyList: {
    flex: 1,
  },
  foodItemContainer: {
    position: 'relative',
    marginBottom: 10,
  },
  deleteButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 80,
    backgroundColor: '#FF5252',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  historyItemContent: {
    flex: 1,
    marginRight: 10,
  },
  historyItemTitle: {
    color: '#2D3748',
    fontFamily: 'Kanit-Medium',
    fontSize: 16,
  },
  historyItemSubtitle: {
    color: '#718096',
    fontFamily: 'Kanit-Regular',
    fontSize: 14,
    marginTop: 2,
  },
  addButton: {
    backgroundColor: '#4A90E2',
    borderRadius: 12,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    width: '80%',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 22,
    fontFamily: 'Kanit-Bold',
    color: '#2D3748',
    marginBottom: 20,
  },
  modalOption: {
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: '#EBF8FF',
  },
  modalOptionText: {
    fontSize: 16,
    fontFamily: 'Kanit-Medium',
    color: '#4A90E2',
    textAlign: 'center',
  },
  modalCloseButton: {
    marginTop: 15,
    backgroundColor: '#4A90E2',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 12,
    width: '100%',
  },
  modalCloseButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Kanit-Bold',
    fontSize: 16,
    textAlign: 'center',
  }
});
  export default AddFood;