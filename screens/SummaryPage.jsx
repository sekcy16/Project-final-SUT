import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ProgressBar } from 'react-native-paper';

const { width } = Dimensions.get('window');

const SummaryPage = ({ route }) => {
  const { date } = route.params;
  const [formattedDate, setFormattedDate] = useState('');

  const [diary, setDiary] = useState({
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
  const [goals, setGoals] = useState({
    tdee: 0,
    carbs: 0,
    protein: 0,
    fat: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const firestore = getFirestore();
  const auth = getAuth();
  const user = auth.currentUser;

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        if (!user) {
          throw new Error('ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบ');
        }
  
        const localDate = new Date(date);
        localDate.setMinutes(localDate.getMinutes() - localDate.getTimezoneOffset());
        const formattedDate = localDate.toISOString().split('T')[0];
        setFormattedDate(localDate.toLocaleDateString('th-TH', { timeZone: 'Asia/Bangkok' }));
  
        const diaryRef = doc(firestore, 'users', user.uid, 'entries', formattedDate);
        const diarySnap = await getDoc(diaryRef);
  
        if (diarySnap.exists()) {
          const diaryData = diarySnap.data();
          const meals = diaryData.meals || {};
          const exercises = diaryData.exercises || [];
  
          let totalCalories = 0;
          let totalProtein = 0;
          let totalCarbs = 0;
          let totalFat = 0;
          let totalCaloriesBurned = 0;
          let totalDuration = 0;
  
          Object.values(meals).forEach(meal => {
            totalCalories += meal.calories || 0;
            totalProtein += meal.protein || 0;
            totalCarbs += meal.carbs || 0;
            totalFat += meal.fat || 0;
          });
  
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
        }
  
        const userRef = doc(firestore, 'users', user.uid);
        const userSnap = await getDoc(userRef);
  
        if (userSnap.exists()) {
          const userData = userSnap.data();
          setGoals({
            tdee: userData.tdee || 0,
            carbs: userData.macronutrients?.carbs || 0,
            protein: userData.macronutrients?.protein || 0,
            fat: userData.macronutrients?.fat || 0,
          });
        } else {
          console.log('ไม่พบข้อมูลผู้ใช้');
        }
      } catch (error) {
        console.error('เกิดข้อผิดพลาดในการดึงข้อมูล:', error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };
  
    fetchData();
  }, [firestore, user?.uid, date]);

  const renderExerciseItem = ({ item }) => (
    <View style={styles.exerciseItem}>
      <Icon name="run" size={24} color="#4caf50" style={styles.exerciseIcon} />
      <View style={styles.exerciseDetails}>
        <Text style={styles.exerciseName}>{item.name}</Text>
        <Text style={styles.exerciseText}>แคลอรี่ที่เผาผลาญ: {item.calories || 0} แคล</Text>
        <Text style={styles.exerciseText}>ระยะเวลา: {item.duration || 0} นาที</Text>
      </View>
    </View>
  );

  const MacroProgressBar = ({ title, current, goal, color, icon }) => {
    const currentValue = typeof current === 'number' ? current : 0;
    const goalValue = typeof goal === 'number' && goal > 0 ? goal : 1; // Prevent division by zero
    const progress = Math.min(currentValue / goalValue, 1);

    return (
      <View style={styles.macroProgressContainer}>
        <View style={styles.macroTitleContainer}>
          <Icon name={icon} size={24} color={color} style={styles.macroIcon} />
          <Text style={styles.macroTitle}>{title}</Text>
        </View>
        <View style={styles.macroProgressContent}>
          <ProgressBar
            progress={progress}
            color={color}
            style={styles.progressBar}
          />
          <Text style={styles.macroText}>
            {currentValue.toFixed(1)}g / {goalValue.toFixed(1)}g
          </Text>
        </View>
      </View>
    );
  };

  const CalorieSummary = ({ consumed, goal }) => {
    const consumedValue = typeof consumed === 'number' ? consumed : 0;
    const goalValue = typeof goal === 'number' ? goal : 0;
    const remaining = goalValue - consumedValue;
    const isOverConsumed = remaining < 0;

    return (
      <View style={styles.calorieSummaryContainer}>
        <Text style={styles.calorieSummaryTitle}>สรุปแคลอรี่</Text>
        <View style={styles.calorieSummaryContent}>
          <View style={styles.calorieSummaryItem}>
            <Icon name="fire" size={24} color="#FF6347" />
            <Text style={styles.calorieSummaryLabel}>เป้าหมาย</Text>
            <Text style={styles.calorieSummaryValue}>{goalValue} แคล</Text>
          </View>
          <View style={styles.calorieSummaryItem}>
            <Icon name="food-apple" size={24} color="#4CAF50" />
            <Text style={styles.calorieSummaryLabel}>บริโภค</Text>
            <Text style={styles.calorieSummaryValue}>{consumedValue} แคล</Text>
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

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>กำลังโหลดข้อมูล...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="alert-circle-outline" size={48} color="#FF6347" />
        <Text style={styles.errorText}>เกิดข้อผิดพลาด: {error}</Text>
      </View>
    );
  }

   return (
    <LinearGradient colors={['#4A90E2', '#50E3C2']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.headerText}>สรุปข้อมูลวันที่ {formattedDate}</Text>
        </View>
        <FlatList
          ListHeaderComponent={() => (
            <View style={styles.content}>
              <CalorieSummary consumed={diary.totalCalories} goal={goals.tdee} />
              <View style={styles.card}>
                <Text style={styles.cardHeader}>สารอาหาร</Text>
                <MacroProgressBar
                  title="คาร์บ"
                  current={diary.totalCarbs}
                  goal={goals.carbs}
                  color="#FFB300"
                  icon="bread-slice"
                />
                <MacroProgressBar
                  title="โปรตีน"
                  current={diary.totalProtein}
                  goal={goals.protein}
                  color="#2196F3"
                  icon="egg-fried"
                />
                <MacroProgressBar
                  title="ไขมัน"
                  current={diary.totalFat}
                  goal={goals.fat}
                  color="#FF5722"
                  icon="oil"
                />
              </View>
  
              <View style={styles.card}>
                <Text style={styles.cardHeader}>การออกกำลังกาย</Text>
                <View style={styles.exerciseSummary}>
                  <View style={styles.exerciseSummaryItem}>
                    <Icon name="fire" size={24} color="#4caf50" />
                    <Text style={styles.exerciseSummaryText}>{diary.exercises.totalCaloriesBurned} แคล</Text>
                    <Text style={styles.exerciseSummaryLabel}>แคลอรี่ที่เผาผลาญ</Text>
                  </View>
                  <View style={styles.exerciseSummaryItem}>
                    <Icon name="clock-outline" size={24} color="#4caf50" />
                    <Text style={styles.exerciseSummaryText}>{diary.exercises.totalDuration} นาที</Text>
                    <Text style={styles.exerciseSummaryLabel}>เวลาทั้งหมด</Text>
                  </View>
                </View>
              </View>
  
              <View style={styles.card}>
                <Text style={styles.cardHeader}>รายการออกกำลังกาย</Text>
              </View>
            </View>
          )}
          data={diary.exercises.list}
          renderItem={renderExerciseItem}
          keyExtractor={(item, index) => index.toString()}
          ListEmptyComponent={<Text style={styles.emptyListText}>ไม่มีข้อมูลการออกกำลังกายในวันนี้</Text>}
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
    padding: 20,
    alignItems: 'center',
  },
  headerText: {
    fontSize: 24,
    fontFamily: 'Kanit-Bold',
    color: '#FFF',
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 20,
    paddingHorizontal: 15,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    fontSize: 20,
    fontFamily: 'Kanit-Bold',
    color: '#333',
    marginBottom: 15,
  },
  calorieSummaryContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  calorieSummaryTitle: {
    fontSize: 20,
    fontFamily: 'Kanit-Bold',
    color: '#333',
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
    marginBottom: 20,
  },
  macroTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  macroIcon: {
    marginRight: 10,
  },
  macroTitle: {
    fontSize: 16,
    fontFamily: 'Kanit-Bold',
    color: '#333',
  },
  macroProgressContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 10,
    borderRadius: 5,
  },
  macroText: {
    marginLeft: 10,
    fontSize: 14,
    fontFamily: 'Kanit-Regular',
    color: '#666',
  },
  
  exerciseSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  exerciseSummaryItem: {
    alignItems: 'center',
  },
  exerciseSummaryText: {
    fontSize: 18,
    fontFamily: 'Kanit-Bold',
    color: '#4caf50',
    marginTop: 5,
  },
  exerciseSummaryLabel: {
    fontSize: 14,
    fontFamily: 'Kanit-Regular',
    color: '#666',
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
    fontSize: 16,
    fontFamily: 'Kanit-Bold',
    color: '#333',
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
    marginTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    fontFamily: 'Kanit-Regular',
    color: '#4A90E2',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    fontFamily: 'Kanit-Regular',
    color: '#FF6347',
    textAlign: 'center',
  },
});

export default SummaryPage;