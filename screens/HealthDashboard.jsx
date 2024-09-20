import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ProgressBar } from 'react-native-paper';
import { firebaseAuth, firebaseDB } from "../config/firebase.config";
import { doc, getDoc, collection, query, where, onSnapshot } from "firebase/firestore";

const HealthDashboard = ({ navigation }) => {
  const [latestBloodSugar, setLatestBloodSugar] = useState(null);
  const [latestWeight, setLatestWeight] = useState(null);
  const [carbIntake, setCarbIntake] = useState(null);
  const [exerciseMinutes, setExerciseMinutes] = useState(null);
  const [waterIntake, setWaterIntake] = useState(null);
  const [averageBloodSugar, setAverageBloodSugar] = useState(null);
  const [isNotificationListModalVisible, setIsNotificationListModalVisible] = useState(false);

  // New state variables for calorie and macronutrient tracking
  const [caloriesAllowed, setCaloriesAllowed] = useState(0);
  const [caloriesConsumed, setCaloriesConsumed] = useState(0);
  const [proteinConsumed, setProteinConsumed] = useState(0);
  const [carbsConsumed, setCarbsConsumed] = useState(0);
  const [fatConsumed, setFatConsumed] = useState(0);
  const [proteinGoal, setProteinGoal] = useState(0);
  const [carbsGoal, setCarbsGoal] = useState(0);
  const [fatGoal, setFatGoal] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    // Fetch unread notifications
    const unsubscribe = onSnapshot(
      query(collection(firebaseDB, 'Notidetails'), where('userId', '==', firebaseAuth.currentUser?.uid), where('read', '==', false)),
      (querySnapshot) => {
        setUnreadNotifications(querySnapshot.size);
      }
    );
  
    // Load latest data when the screen is focused
    const focusListener = navigation.addListener('focus', () => {
      loadLatestData();
    });
  
    // Cleanup functions
    return () => {
      unsubscribe();
      navigation.removeListener('focus', focusListener);
    };
  }, [navigation]);

  const loadLatestData = async () => {
    try {
      // Load the calorie and macronutrient data from Firebase
      const user = firebaseAuth.currentUser;
      if (user) {
        const docRef = doc(firebaseDB, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setCaloriesAllowed(data.tdee);
          setProteinGoal(data.macronutrients?.protein || 50); // Default to 50 if not set
        setCarbsGoal(data.macronutrients?.carbs || 300); // Default to 300 if not set
        setFatGoal(data.macronutrients?.fat || 70); // Default to 70 if not set
        } else {
          console.log("No such document!");
        }
      }

      // Load latest blood sugar
      const savedBloodSugarHistory = await AsyncStorage.getItem('bloodSugarHistory');
      if (savedBloodSugarHistory) {
        const bloodSugarHistory = JSON.parse(savedBloodSugarHistory);
        if (bloodSugarHistory.length > 0) {
          setLatestBloodSugar(bloodSugarHistory[0].level);
        } else {
          setLatestBloodSugar(null);
        }
      } else {
        setLatestBloodSugar(null);
      }

      // Load average blood sugar
      const savedAverageBloodSugar = await AsyncStorage.getItem('averageBloodSugarToday');
      if (savedAverageBloodSugar) {
        setAverageBloodSugar(parseFloat(savedAverageBloodSugar));
      } else {
        setAverageBloodSugar(null);
      }

      // Load latest weight
      const savedWeightHistory = await AsyncStorage.getItem('weightHistory');
      if (savedWeightHistory) {
        const weightHistory = JSON.parse(savedWeightHistory);
        if (weightHistory.length > 0) {
          setLatestWeight(weightHistory[0].weight);
        } else {
          setLatestWeight(null);
        }
      } else {
        setLatestWeight(null);
      }

      // Fetch diary entries
      const diaryRef = doc(firebaseDB, 'users', user.uid, 'entries', new Date().toISOString().split('T')[0]);
      const diarySnap = await getDoc(diaryRef);
      if (diarySnap.exists()) {
        const diaryData = diarySnap.data();
        const meals = diaryData.meals || {};

        let totalCalories = 0;
        let totalProtein = 0;
        let totalCarbs = 0;
        let totalFat = 0;

        Object.values(meals).forEach(meal => {
          totalCalories += meal.calories || 0;
          totalProtein += meal.protein || 0;
          totalCarbs += meal.carbs || 0;
          totalFat += meal.fat || 0;
        });

        setCaloriesConsumed(totalCalories);
        setProteinConsumed(totalProtein);
        setCarbsConsumed(totalCarbs);
        setFatConsumed(totalFat);
      } else {
        console.log("No diary data found!");
      }

    } catch (error) {
      console.error('Error loading latest data:', error);
    }
  };

  const CalorieInfo = () => {
    // Ensure values are numbers and provide default values if necessary
    const caloriesAllowedNumber = Number(caloriesAllowed) || 0;
    const caloriesConsumedNumber = Number(caloriesConsumed) || 0;
    const proteinConsumedNumber = Number(proteinConsumed) || 0;
    const carbsConsumedNumber = Number(carbsConsumed) || 0;
    const fatConsumedNumber = Number(fatConsumed) || 0;
  
    // Calculate the remaining amounts and percentages
    const caloriesLeft = Math.max(caloriesAllowedNumber - caloriesConsumedNumber, 0);
    const proteinLeft = Math.max(proteinGoal - proteinConsumedNumber, 0);
    const carbsLeft = Math.max(carbsGoal - carbsConsumedNumber, 0);
    const fatLeft = Math.max(fatGoal - fatConsumedNumber, 0);
  
    const caloriesPercentage = caloriesAllowedNumber > 0 ? Math.min(caloriesConsumedNumber / caloriesAllowedNumber, 1) : 0;
    const proteinPercentage = proteinGoal > 0 ? Math.min(proteinConsumedNumber / proteinGoal, 1) : 0;
    const carbsPercentage = carbsGoal > 0 ? Math.min(carbsConsumedNumber / carbsGoal, 1) : 0;
    const fatPercentage = fatGoal > 0 ? Math.min(fatConsumedNumber / fatGoal, 1) : 0;
  
    return (
      <View style={styles.calorieInfoContainer}>
        <Text style={styles.calorieInfoTitle}>Today's Nutrition</Text>
  
        <Text style={styles.calorieInfoText}>Calories: {caloriesConsumedNumber} / {caloriesAllowedNumber} kcal</Text>
        <ProgressBar progress={caloriesPercentage} color="#FF6347" style={styles.progressBar} />
        <Text style={styles.calorieInfoTextSmall}>{caloriesLeft} kcal left</Text>
  
        <Text style={styles.calorieInfoText}>Protein: {proteinConsumedNumber} / {proteinGoal} g</Text>
        <ProgressBar progress={proteinPercentage} color="#1E90FF" style={styles.progressBar} />
        <Text style={styles.calorieInfoTextSmall}>{proteinLeft}g left</Text>
  
        <Text style={styles.calorieInfoText}>Carbs: {carbsConsumedNumber} / {carbsGoal} g</Text>
        <ProgressBar progress={carbsPercentage} color="#32CD32" style={styles.progressBar} />
        <Text style={styles.calorieInfoTextSmall}>{carbsLeft}g left</Text>
  
        <Text style={styles.calorieInfoText}>Fat: {fatConsumedNumber} / {fatGoal} g</Text>
        <ProgressBar progress={fatPercentage} color="#FFD700" style={styles.progressBar} />
        <Text style={styles.calorieInfoTextSmall}>{fatLeft}g left</Text>
      </View>
    );
  };
  

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.headerText}>สวัสดี,
            คุณสมชาย</Text>
          <TouchableOpacity
            style={[
              styles.notificationIcon,
              unreadNotifications > 0 ? styles.notificationIconWithBadge : null,
            ]}
            onPress={() => navigation.navigate('NotificationListScreen')}
          >
            <Icon name="bell" size={24} color="#333" />
            {unreadNotifications > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>{unreadNotifications}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <CalorieInfo />

        <View style={styles.cardContainer}>
          <HealthCard
            title="ระดับน้ำตาลในเลือด"
            value={latestBloodSugar !== null ? `${latestBloodSugar} mg/dL` : 'ไม่มีข้อมูล'}
            icon="blood-bag"
            color="#FF6B6B"
            onPress={() => navigation.navigate('BloodSugar')}
          />
          <HealthCard
            title="ค่าเฉลี่ยน้ำตาลในเลือดวันนี้"
            value={averageBloodSugar !== null ? `${averageBloodSugar.toFixed(1)} mg/dL` : 'ไม่มีข้อมูล'}
            icon="chart-line"
            color="#9D84B7"
            onPress={() => navigation.navigate('BloodSugar')}
          />
          <HealthCard
            title="น้ำหนัก"
            value={latestWeight !== null ? `${latestWeight} KG` : 'ไม่มีข้อมูล'}
            icon="weight"
            color="#4ECDC4"
            onPress={() => navigation.navigate('WeightProgress')}
          />
          <HealthCard
            title="คาร์โบไฮเดรต"
            value={carbIntake !== null ? `${carbIntake} g` : 'ไม่มีข้อมูล'}
            icon="pasta"
            color="#FFD93D"
            onPress={() => navigation.navigate('DiaryPage')}
          />
          <HealthCard
            title="ออกกำลังกาย"
            value={exerciseMinutes !== null ? `${exerciseMinutes} นาที` : 'ไม่มีข้อมูล'}
            icon="run"
            color="#6BCB77"
            onPress={() => navigation.navigate('DiaryPage')}
          />
          <HealthCard
            title="ดื่มน้ำ"
            value={waterIntake !== null ? `${waterIntake} ml` : 'ไม่มีข้อมูล'}
            icon="cup-water"
            color="#4D96FF"
            onPress={() => navigation.navigate('WaterIntake')}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const HealthCard = ({ title, value, icon, color, onPress }) => (
  <TouchableOpacity
    style={[styles.card, { borderLeftColor: color }]}
    onPress={onPress}>
    <View style={styles.cardContent}>
      <Icon name={icon} size={32} color={color} />
      <View style={styles.cardTextContent}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardValue}>{value}</Text>
      </View>
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
  scrollView: {
    paddingVertical: 20,
    paddingHorizontal: 15,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  notificationIcon: {
    padding: 8,
    backgroundColor: '#FFF',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 2,
  },
  notificationIconWithBadge: {
    position: 'relative', // Added for badge positioning
  },
  notificationBadge: {
    position: 'absolute', // Positioned absolutely on top of the notification icon
    top: -5, // Adjust positioning as needed
    right: -5,
    backgroundColor: 'red', // Change color as desired
    borderRadius: 10, // Round corners for the badge
    padding: 5,
  },
  notificationBadgeText: {
    color: '#fff', // White text for better contrast
    fontSize: 12,
  },
  cardContainer: {
    padding: 15,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    borderLeftWidth: 5,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTextContent: {
    marginLeft: 15,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  cardValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  calorieInfoContainer: {
    marginBottom: 20,
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  calorieInfoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  calorieInfoText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
  },
  calorieInfoTextSmall: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  progressBar: {
    height: 10,
    borderRadius: 5,
    marginBottom: 15,
  },
});

export default HealthDashboard;