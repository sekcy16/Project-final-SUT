import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView, ScrollView, StatusBar, Platform } from 'react-native';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFonts } from 'expo-font';
const SummaryPage = ({ route }) => {
  const [fontsLoaded] = useFonts({
    'Kanit-Regular': require('../assets/fonts/Kanit-Regular.ttf'),
    'Kanit-Bold': require('../assets/fonts/Kanit-Bold.ttf'),
  });
  const { date } = route.params;
  const [diary, setDiary] = useState({
    totalCalories: 0,
    totalProtein: 0,
    totalCarbs: 0,
    totalFat: 0,
    exercises: []
  });
  const [goals, setGoals] = useState({});
  const firestore = getFirestore();
  const auth = getAuth();
  const user = auth.currentUser;

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!user) {
          console.log('No user logged in');
          return;
        }

        // Format the date string to match your Firestore document ID format
        const formattedDate = new Date(date).toISOString().split('T')[0];

        // Fetch diary data for the specific date
        const diaryRef = doc(firestore, 'users', user.uid, 'entries', formattedDate);
        console.log(`Fetching diary from path: ${diaryRef.path}`);
        const diarySnap = await getDoc(diaryRef);

        if (diarySnap.exists()) {
          console.log('Diary data found:', diarySnap.data());
          const diaryData = diarySnap.data();
          const meals = diaryData.meals || {};
          const exercises = diaryData.exercises || [];

          let totalCalories = 0;
          let totalProtein = 0;
          let totalCarbs = 0;
          let totalFat = 0;
          let totalCaloriesBurned = 0;
          let totalDuration = 0;

          // Aggregate data from each meal
          Object.values(meals).forEach(meal => {
            totalCalories += meal.calories || 0;
            totalProtein += meal.protein || 0;
            totalCarbs += meal.carbs || 0;
            totalFat += meal.fat || 0;
          });

          // Aggregate data from each exercise
          exercises.forEach(exercise => {
            totalCaloriesBurned += exercise.calories || 0;
            totalDuration += exercise.duration || 0;
          });

          setDiary({
            totalCalories,
            totalProtein,
            totalCarbs,
            totalFat,
            exercises: {
              list: exercises,
              totalCaloriesBurned,
              totalDuration
            }
          });
        } else {
          console.log('No diary data found for the selected date');
          // Reset diary state when no data is found
          setDiary({
            totalCalories: 0,
            totalProtein: 0,
            totalCarbs: 0,
            totalFat: 0,
            exercises: {
              list: [],
              totalCaloriesBurned: 0,
              totalDuration: 0
            }
          });
        }

        // Fetch user goals including TDEE (this doesn't change with date)
        const userRef = doc(firestore, 'users', user.uid);
        console.log(`Fetching user from path: ${userRef.path}`);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          console.log('User data found:', userSnap.data());
          const userData = userSnap.data();
          setGoals({
            tdee: userData.tdee || 0,
            carbs: userData.macronutrients?.carbs || 0,
            protein: userData.macronutrients?.protein || 0,
            fat: userData.macronutrients?.fat || 0,
          });
        } else {
          console.log('No user data found');
        }
      } catch (error) {
        console.error('Error fetching data: ', error);
      }
    };

    fetchData();
  }, [firestore, user?.uid, date]); // Add date to the dependency array

  if (!diary || !goals) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }
  const CalorieSummary = ({ consumed, goal }) => {
    const remaining = goal - consumed;
    const isOverConsumed = remaining < 0;

    return (
      <View style={styles.calorieSummaryContainer}>
        <Text style={styles.calorieSummaryTitle}>สรุปแคลอรี่</Text>
        <View style={styles.calorieSummaryContent}>
          <View style={styles.calorieSummaryItem}>
            <Icon name="fire" size={24} color="#FF6347" />
            <Text style={styles.calorieSummaryLabel}>เป้าหมาย</Text>
            <Text style={styles.calorieSummaryValue}>{goal} แคล</Text>
          </View>
          <View style={styles.calorieSummaryItem}>
            <Icon name="food-apple" size={24} color="#4CAF50" />
            <Text style={styles.calorieSummaryLabel}>บริโภค</Text>
            <Text style={styles.calorieSummaryValue}>{consumed} แคล</Text>
          </View>
          <View style={styles.calorieSummaryItem}>
            <Icon name={isOverConsumed ? "alert-circle" : "check-circle"} size={24} color={isOverConsumed ? "#FF6347" : "#4CAF50"} />
            <Text style={styles.calorieSummaryLabel}>{isOverConsumed ? "เกิน" : "เหลือ"}</Text>
            <Text style={[styles.calorieSummaryValue, isOverConsumed && styles.overConsumedText]}>
              {Math.abs(remaining)} แคล
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderExerciseItem = ({ item }) => (
    <View style={styles.exerciseItem}>
      <Icon name="run" size={24} color="#4A90E2" style={styles.exerciseIcon} />
      <View style={styles.exerciseDetails}>
        <Text style={styles.exerciseName}>{item.name}</Text>
        <Text style={styles.exerciseText}>เผาผลาญทั้งหมด: {item.calories} แคลอรี่</Text>
        <Text style={styles.exerciseText}>ระยะเวลา: {item.duration} นาที</Text>
      </View>
    </View>
  );

  const MacroProgressBar = ({ title, current, goal, color }) => (
    <View style={styles.macroProgressContainer}>
      <Text style={styles.macroTitle}>{title}</Text>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { width: `${Math.min((current / goal) * 100, 100)}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.macroText}>{current}g / {goal}g</Text>
    </View>
  );

  const HeaderComponent = () => (
    <>
      <View style={styles.statusBarPlaceholder} />
      <LinearGradient colors={['#4A90E2', '#50E3C2']} style={styles.header}>
        <Text style={styles.headerText}>สรุปของวันที่ {new Date(date).toLocaleDateString()}</Text>
      </LinearGradient>

      <CalorieSummary consumed={diary.totalCalories} goal={goals.tdee || 0} />

      <View style={styles.card}>
        <Text style={styles.cardHeader}>สารอาหาร</Text>
        <MacroProgressBar title="คาร์โบไฮเดรต" current={diary.totalCarbs} goal={goals.carbs || 0} color="#FFB300" />
        <MacroProgressBar title="โปรตีน" current={diary.totalProtein} goal={goals.protein || 0} color="#2196F3" />
        <MacroProgressBar title="ไขมัน" current={diary.totalFat} goal={goals.fat || 0} color="#FF5722" />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardHeader}>การออกกำลังกาย</Text>
        <View style={styles.exerciseSummary}>
          <View style={styles.exerciseSummaryItem}>
            <Icon name="fire" size={24} color="#4A90E2" />
            <Text style={styles.exerciseSummaryText}>{diary.exercises.totalCaloriesBurned} แคลอรี่</Text>
          </View>
          <View style={styles.exerciseSummaryItem}>
            <Icon name="clock-outline" size={24} color="#4A90E2" />
            <Text style={styles.exerciseSummaryText}>{diary.exercises.totalDuration} นาที</Text>
          </View>
        </View>
      </View>
    </>
  );

  if (!diary || !goals) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#4A90E2" barStyle="light-content" />
      <FlatList
        ListHeaderComponent={HeaderComponent}
        data={diary.exercises.list}
        keyExtractor={(item, index) => index.toString()}
        renderItem={renderExerciseItem}
        ListEmptyComponent={<Text style={styles.emptyListText}>No exercises recorded for this day.</Text>}
        contentContainerStyle={styles.flatListContent}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },  
  statusBarPlaceholder: {
    height: StatusBar.currentHeight,
    backgroundColor: '#4A90E2',
  },
  header: {
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 40 : 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerText: {
    fontSize: 22,
    fontFamily: 'Kanit-Bold',
    color: '#fff',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    margin: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    fontSize: 20,
    fontFamily: 'Kanit-Bold',
    color: '#4A90E2',
    marginBottom: 15,
  },
  calorieSummaryContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    margin: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  calorieSummaryTitle: {
    fontSize: 20,
    fontFamily: 'Kanit-Bold',
    color: '#4A90E2',
    marginBottom: 15,
  },
  calorieSummaryContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  calorieSummaryItem: {
    alignItems: 'center',
  },
  calorieSummaryLabel: {
    fontSize: 14,
    fontFamily: 'Kanit-Regular',
    color: '#666',
    marginTop: 5,
  },
  calorieSummaryValue: {
    fontSize: 18,
    fontFamily: 'Kanit-Bold',
    color: '#333',
    marginTop: 5,
  },
  overConsumedText: {
    color: '#FF6347',
  },
  macroProgressContainer: {
    marginBottom: 15,
  },
  macroTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  progressBarContainer: {
    height: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
  },
  macroText: {
    fontSize: 14,
    fontFamily: 'Kanit-Regular',
    color: '#666',
    marginTop: 5,
  },
  exerciseSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  exerciseSummaryItem: {
    alignItems: 'center',
  },
  exerciseSummaryText: {
    fontSize: 16,
    fontFamily: 'Kanit-Regular',
    color: '#4A90E2',
    marginTop: 5,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  exerciseIcon: {
    marginRight: 10,
  },
  exerciseDetails: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 18,
    fontFamily: 'Kanit-Bold',
    color: '#4A90E2',
  },
  exerciseText: {
    fontSize: 14,
    fontFamily: 'Kanit-Regular',
    color: '#666',
  },
  emptyListText: {
    fontSize: 16,
    fontFamily: 'Kanit-Regular',
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    fontSize: 18,
    fontFamily: 'Kanit-Regular',
    color: '#4A90E2',
  },
  flatListContent: {
    paddingBottom: 20,
  },
});

export default SummaryPage;