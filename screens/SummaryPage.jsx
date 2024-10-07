import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView, TouchableOpacity, Dimensions } from 'react-native';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { width } = Dimensions.get('window');

const SummaryPage = ({ route, navigation }) => {
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


  const renderExerciseItem = ({ item }) => (
    <View style={styles.exerciseItem}>
      <Icon name="run" size={24} color="#4A90E2" style={styles.exerciseIcon} />
      <View style={styles.exerciseDetails}>
        <Text style={styles.exerciseName}>{item.name}</Text>
        <Text style={styles.exerciseText}>แคลอรี่ที่เผาผลาญ: {item.calories} กิโลแคลอรี่</Text>
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
      <Text style={styles.macroText}>{current}ก. / {goal}ก.</Text>
    </View>
  );

  const HeaderComponent = () => (
    <>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>สรุปข้อมูล</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardHeader}>สรุปโภชนาการ {new Date(date).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</Text>
        <View style={styles.caloriesSummary}>
          <Text style={styles.caloriesText}>{diary.totalCalories}</Text>
          <Text style={styles.caloriesLabel}>แคลอรี่ที่บริโภค</Text>
        </View>
        <Text style={styles.goalText}>เป้าหมาย: {goals.tdee || 0} แคลอรี่</Text>

        <MacroProgressBar title="คาร์โบไฮเดรต" current={diary.totalCarbs} goal={goals.carbs || 0} color="#FFB300" />
        <MacroProgressBar title="โปรตีน" current={diary.totalProtein} goal={goals.protein || 0} color="#4ECDC4" />
        <MacroProgressBar title="ไขมัน" current={diary.totalFat} goal={goals.fat || 0} color="#FF7F50" />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardHeader}>สรุปการออกกำลังกาย</Text>
        <View style={styles.exerciseSummary}>
          <View style={styles.exerciseSummaryItem}>
            <Icon name="fire" size={24} color="#FF6B6B" />
            <Text style={styles.exerciseSummaryText}>{diary.exercises.totalCaloriesBurned} กิโลแคลอรี่</Text>
            <Text style={styles.exerciseSummaryLabel}>แคลอรี่ที่เผาผลาญ</Text>
          </View>
          <View style={styles.exerciseSummaryItem}>
            <Icon name="clock-outline" size={24} color="#4ECDC4" />
            <Text style={styles.exerciseSummaryText}>{diary.exercises.totalDuration} นาที</Text>
            <Text style={styles.exerciseSummaryLabel}>เวลาทั้งหมด</Text>
          </View>
        </View>
      </View>
    </>
  );

  return (
    <LinearGradient colors={["#4A90E2", "#50E3C2"]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <FlatList
          ListHeaderComponent={HeaderComponent}
          data={diary.exercises.list}
          keyExtractor={(item, index) => index.toString()}
          renderItem={renderExerciseItem}
          ListEmptyComponent={<Text style={styles.emptyListText}>ไม่มีการบันทึกการออกกำลังกายในวันนี้</Text>}
          contentContainerStyle={styles.flatListContent}
        />
      </SafeAreaView>
    </LinearGradient>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerTitle: {
    fontSize: 28,
    color: '#FFF',
    marginLeft: 16,
    fontFamily: 'Kanit-Bold',
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    margin: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  cardHeader: {
    fontSize: 20,
    color: '#4A90E2',
    marginBottom: 15,
    fontFamily: 'Kanit-Bold',
  },
  caloriesSummary: {
    alignItems: 'center',
    marginBottom: 10,
  },
  caloriesText: {
    fontSize: 36,
    color: '#4A90E2',
    fontFamily: 'Kanit-Bold',
  },
  caloriesLabel: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'Kanit-Regular',
  },
  goalText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'Kanit-Regular',
  },
  macroProgressContainer: {
    marginBottom: 15,
  },
  macroTitle: {
    fontSize: 16,
    marginBottom: 5,
    fontFamily: 'Kanit-Bold',
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
    color: '#666',
    marginTop: 5,
    fontFamily: 'Kanit-Regular',
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
    fontSize: 18,
    color: '#4A90E2',
    marginTop: 5,
    fontFamily: 'Kanit-Bold',
  },
  exerciseSummaryLabel: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Kanit-Regular',
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    padding: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 12,
    marginHorizontal: 16,
  },
  exerciseIcon: {
    marginRight: 15,
  },
  exerciseDetails: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 18,
    color: '#4A90E2',
    fontFamily: 'Kanit-Bold',
  },
  exerciseText: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Kanit-Regular',
  },
  emptyListText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 20,
    fontFamily: 'Kanit-Regular',
  },
  flatListContent: {
    paddingBottom: 20,
  },
});

export default SummaryPage;