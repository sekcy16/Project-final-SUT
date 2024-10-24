import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { getFirestore, collection, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { app } from '../config/firebase.config';

const ExerciseEntry = () => {
  const [exerciseList, setExerciseList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [userWeight, setUserWeight] = useState(null);
  const route = useRoute();
  const navigation = useNavigation();
  const { date } = route.params;
  const db = getFirestore(app);
  const auth = getAuth(app);

  useEffect(() => {
    const fetchExerciseList = async () => {
      try {
        const exerciseCollection = await getDocs(collection(db, 'exerciselist'));
        const exerciseData = exerciseCollection.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setExerciseList(exerciseData);
      } catch (error) {
        console.error('Error fetching exercise list:', error);
        Alert.alert('Error', 'Failed to fetch exercise list. Please try again.');
      }
    };

    const fetchUserWeight = async () => {
      try {
        const userId = auth.currentUser.uid;
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          setUserWeight(userDoc.data().weight);
        }
      } catch (error) {
        console.error('Error fetching user weight:', error);
      }
    };

    fetchExerciseList();
    fetchUserWeight();
  }, []);

  const addToDiary = async (exercise, duration) => {
    try {
      const userId = auth.currentUser.uid; // ดึง userId ของผู้ใช้ปัจจุบันที่ล็อกอินอยู่จาก Firebase Authentication
      const diaryRef = doc(db, 'users', userId, 'entries', date.split('T')[0]); // สร้างอ้างอิง (reference) ไปยังเอกสารของผู้ใช้ที่เก็บใน Firebase โดยมีโครงสร้างในคอลเลกชัน:
      
      const docSnap = await getDoc(diaryRef); // ดึงข้อมูลจาก Firebase ในเอกสารที่อ้างอิงไว้ โดยใช้ await เพื่อรอผลลัพธ์ให้เสร็จก่อนที่จะไปทำงานบรรทัดถัดไป
      let currentExercises = docSnap.exists() ? (docSnap.data().exercises || []) : []; //ถ้ามีอยู่: ดึงข้อมูลรายการการออกกำลังกาย (exercises) จากเอกสาร (ถ้าไม่มีค่า exercises จะใช้ค่าเริ่มต้นเป็น []
      let currentMeals = docSnap.exists() ? (docSnap.data().meals || {}) : {}; 
      
      const caloriesBurned = calculateCaloriesBurned(exercise.met, userWeight, duration);
      
      const newExercise = {
        name: exercise.name,
        duration: duration,
        calories: caloriesBurned
      };

      currentExercises.push(newExercise);

      await setDoc(diaryRef, { 
        exercises: currentExercises,
        meals: currentMeals,
        date: date
      }, { merge: true });
      
      Alert.alert('สำเร็จ', `เพิ่ม ${exercise.name} เรียบร้อยแล้ว`);
      navigation.goBack();
    } catch (error) {
      console.error('Error adding exercise to diary:', error);
      Alert.alert('Error', 'Failed to add exercise to diary. Please try again.');
    }
  };

  const calculateCaloriesBurned = (met, weight, duration) => {
    // MET * 3.5 * weight (kg) / 200 = calories burned per minute
    const caloriesPerMinute = (met * 3.5 * weight) / 200;
    return Math.round(caloriesPerMinute * duration);
  };

  const filteredExerciseList = exerciseList.filter(exercise => 
    exercise.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Exercise</Text>
      </View>

      <View style={styles.searchBar}>
        <Icon name="search" size={20} color="#999" />
        <TextInput 
          style={styles.searchInput}
          placeholder="Search exercises"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView style={styles.exerciseList}>
        {filteredExerciseList.map((exercise) => (
          <ExerciseItem 
            key={exercise.id}
            exercise={exercise}
            onAdd={(duration) => addToDiary(exercise, duration)}
          />
        ))}
      </ScrollView>
    </View>
  );
};

const ExerciseItem = ({ exercise, onAdd }) => {
  const [duration, setDuration] = useState('');

  const handleAdd = () => {
    if (duration && !isNaN(duration)) {
      onAdd(parseFloat(duration));
    } else {
      Alert.alert('Invalid Input', 'Please enter a valid duration in minutes.');
    }
  };

  return (
    <View style={styles.exerciseItemContainer}>
      <View style={styles.exerciseItem}>
        <Text style={styles.exerciseName}>{exercise.name}</Text>
        <Text style={styles.exerciseMet}>MET: {exercise.met}</Text>
      </View>
      <View style={styles.durationInputContainer}>
        <TextInput
          style={styles.durationInput}
          placeholder="Min"
          keyboardType="numeric"
          value={duration}
          onChangeText={setDuration}
        />
        <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
          <Icon name="add-circle-outline" size={24} color="#000" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 8,
  },
  exerciseList: {
    flex: 1,
  },
  exerciseItemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  exerciseItem: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    color: '#000',
  },
  exerciseMet: {
    fontSize: 14,
    color: '#999',
  },
  durationInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  durationInput: {
    width: 50,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 4,
    padding: 4,
    marginRight: 8,
    textAlign: 'center',
  },
  addButton: {
    padding: 4,
  },
});

export default ExerciseEntry;