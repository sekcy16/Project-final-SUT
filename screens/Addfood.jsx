import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { firebaseDB, firebaseAuth } from '../config/firebase.config'; // Adjust the path if needed
import { collection, addDoc, getDocs, deleteDoc, doc, query, where } from 'firebase/firestore';

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

  const loadScannedFoods = async () => {
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
  };

  useFocusEffect(
    React.useCallback(() => {
      loadScannedFoods();
    }, [])
  );

  useEffect(() => {
    const addNewFood = async () => {
      
      if (route.params?.newFood) {
        const newFood = route.params.newFood;

        try {
          
          setScannedFoods((prevFoods) => [newFood, ...prevFoods]);
        } catch (error) {
          console.error('Error adding new food:', error);
        }

        navigation.setParams({ newFood: null });
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
  }, []);

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
        mealType: selectedMeal, // Assuming this comes from a state
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
      const updatedFoods = scannedFoods.filter(food => food.id !== foodToDelete.id);
      setScannedFoods(updatedFoods);
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
              <Icon name="trash-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </Animated.View>
  
          {/* Wrapping Touchable in TouchableWithoutFeedback to manage gestures properly */}
          <Animated.View
            style={[styles.historyItem, { transform: [{ translateX: pan.x }] }]}
            {...panResponder.panHandlers}
          >
            <View style={styles.historyItemContent}>
              <Text style={styles.historyItemTitle}>{food.name}</Text>
              <Text style={styles.historyItemSubtitle}>{`${food.calories} แคลอรี่, ${food.amount}`}</Text>
            </View>
  
            {/* Use TouchableWithoutFeedback to avoid gesture conflicts */}
            <TouchableWithoutFeedback onPress={() => handleAddFood(food)}>
              <View style={styles.addButton}>
                <Icon name="add" size={24} color="#FFFFFF" />
              </View>
            </TouchableWithoutFeedback>
          </Animated.View>
        </View>
      );
    }, [handleAddFood]);
  

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#2E7D32" />
        </TouchableOpacity>
      </View>

      <View style={styles.menuSelectionContainer}>
        <Text style={styles.headerTitle}>เลือกมื้ออาหาร</Text>
        <TouchableOpacity style={styles.dropdownButton} onPress={() => setIsMealModalVisible(true)}>
          <Text style={styles.dropdownText}>{selectedMeal}</Text>
          <Icon name="chevron-down" size={20} color="#2E7D32" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#757575" style={styles.searchIcon} />
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
          <Icon name="camera-outline" size={36} color="#FFFFFF" />
          <Text style={styles.scanButtonText}>สแกนอาหาร</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.scanButton} onPress={() => handleScan('QR')}>
          <Icon name="qr-code-outline" size={36} color="#FFFFFF" />
          <Text style={styles.scanButtonText}>สแกนบาร์โค้ด</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.historyContainer}>
        <View style={styles.historyHeader}>
          <Text style={styles.historyTitle}>ประวัติ</Text>
          <TouchableOpacity style={styles.sortButton}>
            <Text style={styles.sortButtonText}>ล่าสุด</Text>
            <Icon name="chevron-down" size={16} color="#2E7D32" />
          </TouchableOpacity>
        </View>
        <ScrollView
          style={styles.historyList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {scannedFoods.map((food, index) => (
            <FoodItem key={index} food={food} index={index} />
          ))}
        </ScrollView>
      </View>

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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  backButton: {
    padding: 8,
  },
  menuSelectionContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 8,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  dropdownText: {
    color: '#2E7D32',
    fontWeight: 'bold',
    fontSize: 18,
    marginRight: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 25,
    margin: 16,
    paddingHorizontal: 16,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 50,
    color: '#212121',
    fontSize: 16,
  },
  scanContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  scanButton: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    borderRadius: 16,
    padding: 16,
    width: '48%',
    elevation: 3,
  },
  scanButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
    textAlign: 'center',
  },
  historyContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  historyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212121',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortButtonText: {
    color: '#2E7D32',
    fontSize: 16,
    marginRight: 4,
  },
  historyList: {
    flex: 1,
  },
  foodItemContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  deleteButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 100,
    backgroundColor: '#FF3B30',
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
    padding: 12,
    elevation: 2,
  },
  historyItemContent: {
    flex: 1,
  },
  historyItemTitle: {
    color: '#212121',
    fontSize: 16,
    fontWeight: 'bold',
  },
  historyItemSubtitle: {
    color: '#757575',
    fontSize: 14,
    marginTop: 2,
  },
  addButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#2E7D32',
  },
  modalOption: {
    paddingVertical: 10,
    width: '100%',
    alignItems: 'center',
  },
  modalOptionText: {
    fontSize: 18,
    color: '#212121',
  },
  modalCloseButton: {
    marginTop: 20,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  modalCloseButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AddFood;