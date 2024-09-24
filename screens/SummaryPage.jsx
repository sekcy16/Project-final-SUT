import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView, ScrollView } from 'react-native';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';

const SummaryPage = ({ route }) => {
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
      <Icon name="fitness-outline" size={24} color="#4caf50" style={styles.exerciseIcon} />
      <View style={styles.exerciseDetails}>
        <Text style={styles.exerciseName}>{item.name}</Text>
        <Text style={styles.exerciseText}>Calories Burned: {item.calories} kcal</Text>
        <Text style={styles.exerciseText}>Duration: {item.duration} minutes</Text>
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
      <LinearGradient colors={['#4caf50', '#45a049']} style={styles.header}>
        <Text style={styles.headerText}>Summary for {new Date(date).toLocaleDateString()}</Text>
      </LinearGradient>

      <View style={styles.card}>
        <Text style={styles.cardHeader}>Nutrition Summary</Text>
        <View style={styles.caloriesSummary}>
          <Text style={styles.caloriesText}>{diary.totalCalories}</Text>
          <Text style={styles.caloriesLabel}>calories consumed</Text>
        </View>
        <Text style={styles.goalText}>Goal: {goals.tdee || 0} calories</Text>

        <MacroProgressBar title="Carbs" current={diary.totalCarbs} goal={goals.carbs || 0} color="#FFB300" />
        <MacroProgressBar title="Protein" current={diary.totalProtein} goal={goals.protein || 0} color="#2196F3" />
        <MacroProgressBar title="Fat" current={diary.totalFat} goal={goals.fat || 0} color="#FF5722" />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardHeader}>Exercise Summary</Text>
        <View style={styles.exerciseSummary}>
          <View style={styles.exerciseSummaryItem}>
            <Icon name="flame-outline" size={24} color="#4caf50" />
            <Text style={styles.exerciseSummaryText}>{diary.exercises.totalCaloriesBurned} kcal burned</Text>
          </View>
          <View style={styles.exerciseSummaryItem}>
            <Icon name="time-outline" size={24} color="#4caf50" />
            <Text style={styles.exerciseSummaryText}>{diary.exercises.totalDuration} minutes</Text>
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
  header: {
    padding: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerText: {
    fontSize: 22,
    fontWeight: 'bold',
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
    fontWeight: 'bold',
    color: '#4caf50',
    marginBottom: 15,
  },
  caloriesSummary: {
    alignItems: 'center',
    marginBottom: 10,
  },
  caloriesText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#4caf50',
  },
  caloriesLabel: {
    fontSize: 16,
    color: '#666',
  },
  goalText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
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
    color: '#4caf50',
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
    fontWeight: 'bold',
    color: '#4caf50',
  },
  exerciseText: {
    fontSize: 14,
    color: '#666',
  },
  emptyListText: {
    fontSize: 16,
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
    color: '#4caf50',
  },
  flatListContent: {
    paddingBottom: 20,
  },
});

export default SummaryPage;