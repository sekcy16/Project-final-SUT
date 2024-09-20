import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const SummaryPage = ({ route }) => {
  const { date } = route.params; // Get the date passed from DiaryPage
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
    return <Text style={styles.loadingText}>Loading...</Text>;
  }

  const renderExerciseItem = ({ item }) => (
    <View style={styles.exerciseItem}>
      <Text style={styles.exerciseName}>{item.name}</Text>
      <Text style={styles.text}>Calories Burned: {item.calories} kcal</Text>
      <Text style={styles.text}>Duration: {item.duration} minutes</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Summary for {new Date(date).toLocaleDateString()}</Text>
      <Text style={styles.header}>Nutrition Summary</Text>
      <Text style={styles.text}>Calories: {diary.totalCalories} / {goals.tdee || 0}</Text>
      <Text style={styles.text}>Carbs: {diary.totalCarbs}g / {goals.carbs || 0}g</Text>
      <Text style={styles.text}>Protein: {diary.totalProtein}g / {goals.protein || 0}g</Text>
      <Text style={styles.text}>Fat: {diary.totalFat}g / {goals.fat || 0}g</Text>

      <Text style={styles.header}>Exercise Summary</Text>
      <Text style={styles.text}>Total Calories Burned: {diary.exercises.totalCaloriesBurned} kcal</Text>
      <Text style={styles.text}>Total Duration: {diary.exercises.totalDuration} minutes</Text>
      <FlatList
        data={diary.exercises.list}
        keyExtractor={(item, index) => index.toString()}
        renderItem={renderExerciseItem}
        ListEmptyComponent={<Text style={styles.text}>No exercises recorded for this day.</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#4caf50', // Main color
  },
  text: {
    fontSize: 18,
    marginBottom: 10,
  },
  loadingText: {
    fontSize: 18,
    color: '#4caf50', // Main color
    textAlign: 'center',
    marginTop: 20,
  },
  exerciseItem: {
    marginBottom: 15,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4caf50', // Border color to match main color
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4caf50', // Main color
  },
});

export default SummaryPage;
