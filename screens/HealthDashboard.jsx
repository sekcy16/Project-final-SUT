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

const HealthDashboard = ({ navigation }) => {
  const [latestBloodSugar, setLatestBloodSugar] = useState(null);
  const [latestWeight, setLatestWeight] = useState(null);
  const [carbIntake, setCarbIntake] = useState(null);
  const [exerciseMinutes, setExerciseMinutes] = useState(null);
  const [waterIntake, setWaterIntake] = useState(null);
  const [averageBloodSugar, setAverageBloodSugar] = useState(null);
  
  // New state variables for calorie and macronutrient tracking
  const [caloriesAllowed, setCaloriesAllowed] = useState(2000);
  const [caloriesConsumed, setCaloriesConsumed] = useState(0);
  const [proteinConsumed, setProteinConsumed] = useState(0);
  const [carbsConsumed, setCarbsConsumed] = useState(0);
  const [fatConsumed, setFatConsumed] = useState(0);

  useEffect(() => {
    const focusListener = navigation.addListener('focus', () => {
      loadLatestData();
    });

    loadLatestData();

    return () => {
      navigation.removeListener('focus', focusListener);
    };
  }, [navigation]);

  const loadLatestData = async () => {
    try {
      // ... (existing data loading logic)

      // Load calorie and macronutrient data
      // This is placeholder logic. Replace with actual data loading from AsyncStorage or API
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

      setCaloriesConsumed(0);
      setProteinConsumed(150);
      setCarbsConsumed(250);
      setFatConsumed(50);
    } catch (error) {
      console.error('Error loading latest data:', error);
    }
  };

  const CalorieInfo = () => {
    // Calculate the remaining amounts and percentages
    const caloriesLeft = Math.max(caloriesAllowed - caloriesConsumed, 0);
    const proteinLeft = 150 - proteinConsumed; // Replace 150 with your protein goal
    const carbsLeft = 250 - carbsConsumed; // Replace 250 with your carbs goal
    const fatLeft = 70 - fatConsumed; // Replace 70 with your fat goal

    const caloriesPercentage = caloriesConsumed / caloriesAllowed;
    const proteinPercentage = proteinConsumed / 150; // Adjust according to your protein goal
    const carbsPercentage = carbsConsumed / 250; // Adjust according to your carbs goal
    const fatPercentage = fatConsumed / 70; // Adjust according to your fat goal

    return (
      <View style={styles.calorieInfoContainer}>
        <Text style={styles.calorieInfoTitle}>Today's Nutrition</Text>

        <Text style={styles.calorieInfoText}>Calories: {caloriesConsumed} / {caloriesAllowed} kcal</Text>
        <ProgressBar progress={caloriesPercentage} color="#FF6347" style={styles.progressBar} />
        <Text style={styles.calorieInfoTextSmall}>{caloriesLeft} kcal left</Text>

        <Text style={styles.calorieInfoText}>Protein: {proteinConsumed}g</Text>
        <ProgressBar progress={proteinPercentage} color="#1E90FF" style={styles.progressBar} />
        <Text style={styles.calorieInfoTextSmall}>{proteinLeft}g left</Text>

        <Text style={styles.calorieInfoText}>Carbs: {carbsConsumed}g</Text>
        <ProgressBar progress={carbsPercentage} color="#32CD32" style={styles.progressBar} />
        <Text style={styles.calorieInfoTextSmall}>{carbsLeft}g left</Text>

        <Text style={styles.calorieInfoText}>Fat: {fatConsumed}g</Text>
        <ProgressBar progress={fatPercentage} color="#FFD700" style={styles.progressBar} />
        <Text style={styles.calorieInfoTextSmall}>{fatLeft}g left</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.headerText}>สวัสดี, คุณสมชาย</Text>
          <TouchableOpacity
            style={styles.notificationIcon}
            onPress={() => navigation.navigate('NotificationListScreen')}>
            <Icon name="bell" size={24} color="#333" />
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
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerText: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  notificationIcon: {
    padding: 5,
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
    color: '#333',
  },
  cardValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  calorieInfoContainer: {
    backgroundColor: '#FFF',
    padding: 15,
    margin: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  calorieInfoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  calorieInfoText: {
    fontSize: 16,
    marginBottom: 5,
  },
  calorieInfoTextSmall: {
    fontSize: 14,
    color: '#888',
    marginBottom: 10,
  },
  progressBar: {
    height: 10,
    borderRadius: 5,
    marginBottom: 15,
  },
});

export default HealthDashboard;
