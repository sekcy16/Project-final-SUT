import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, Animated } from 'react-native';
import { Calendar } from 'react-native-calendars';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, doc, getDoc, setDoc, addDoc } from 'firebase/firestore';
import { firebaseDB, firebaseAuth } from "../../config/firebase.config";
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

const AddTaskScreen = () => {
  const navigation = useNavigation(); // ย้ายมาไว้ด้านบนพร้อมกับ state อื่นๆ
  const [selectedDate, setSelectedDate] = useState('');
  const [task, setTask] = useState('');
  const [description, setDescription] = useState('');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [time, setTime] = useState(new Date());
  const [userRole, setUserRole] = useState(null);
  const [fadeAnim] = useState(new Animated.Value(0));

  const auth = getAuth();
  const firestore = getFirestore();
  const currentUser = auth.currentUser;

  useEffect(() => {
    const fetchUserRole = async () => {
      if (currentUser) {
        try {
          const userDocRef = doc(firebaseDB, "users", currentUser.uid);
          const userDocSnap = await getDoc(userDocRef);
  
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            setUserRole(userData.role);
          } else {
            console.log('No such document!');
          }
        } catch (error) {
          console.error('Error fetching user role: ', error);
        }
      }
    };
  
    fetchUserRole();
    
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, [currentUser, fadeAnim]);

  const handleDateSelect = (day) => {
    setSelectedDate(day.dateString);
  };

  const handleTimeChange = (event, selectedTime) => {
    const currentTime = selectedTime || time;
    setShowTimePicker(false);
    setTime(currentTime);
  };

  const handleAddTask = async () => {
    if (task && description && selectedDate) {
      if (userRole === 'Doctor' || userRole === 'Admin') {
        try {
          const tasksByDateDocRef = doc(firestore, 'users', currentUser.uid, 'TasksByDate', selectedDate);
          const tasksCollectionRef = collection(tasksByDateDocRef, 'tasks');
          
          await addDoc(tasksCollectionRef, {
            task,
            description,
            date: selectedDate,
            time: time.toLocaleTimeString(),
            userId: currentUser.uid,
            createdAt: new Date(),
          });

          Alert.alert('สำเร็จ', 'เพิ่มงานเรียบร้อยแล้ว');
          setTask('');
          setDescription('');
        } catch (error) {
          console.error('Error adding task: ', error);
          Alert.alert('ข้อผิดพลาด', 'ไม่สามารถเพิ่มงานได้');
        }
      } else {
        Alert.alert('ข้อผิดพลาด', 'คุณไม่มีสิทธิ์ในการเพิ่มงาน');
      }
    } else {
      Alert.alert('ข้อผิดพลาด', 'กรุณากรอกข้อมูลให้ครบถ้วน');
    }
  };

  

  return (
    <LinearGradient colors={['#4A90E2', '#50E3C2']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollViewContent}>
          <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
            <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
              <Text style={styles.title}>เพิ่มงานใหม่</Text>
            </View>

            <View style={styles.card}>
              <Calendar 
                onDayPress={handleDateSelect}
                markedDates={{ 
                  [selectedDate]: { selected: true, selectedColor: '#4CAF50' },
                }}
                theme={{
                  backgroundColor: '#ffffff',
                  calendarBackground: '#ffffff',
                  textSectionTitleColor: '#4A90E2',
                  selectedDayBackgroundColor: '#4CAF50',
                  selectedDayTextColor: '#ffffff',
                  todayTextColor: '#4A90E2',
                  dayTextColor: '#2d4150',
                  textDisabledColor: '#d9e1e8',
                  dotColor: '#4CAF50',
                  selectedDotColor: '#ffffff',
                  arrowColor: '#4A90E2',
                  monthTextColor: '#4A90E2',
                  indicatorColor: '#4A90E2',
                  textDayFontFamily: 'Kanit-Regular',
                  textMonthFontFamily: 'Kanit-Bold',
                  textDayHeaderFontFamily: 'Kanit-Regular',
                  textDayFontSize: 16,
                  textMonthFontSize: 18,
                  textDayHeaderFontSize: 14
                }}
                style={styles.calendar}
              />

              {selectedDate ? (
                <View style={styles.formContainer}>
                  <Text style={styles.label}>เลือกเวลา</Text>

                  <TouchableOpacity style={styles.timeButton} onPress={() => setShowTimePicker(true)}>
                    <Icon name="access-time" size={24} color="#fff" />
                    <Text style={styles.timeButtonText}>เลือกเวลา</Text>
                  </TouchableOpacity>

                  {showTimePicker && (
                    <DateTimePicker
                      value={time}
                      mode="time"
                      is24Hour={true}
                      display="default"
                      onChange={handleTimeChange}
                    />
                  )}

                  <Text style={styles.selectedTimeText}>เวลาที่เลือก: {time.toLocaleTimeString()}</Text>

                  <TextInput
                    style={styles.input}
                    placeholder="กรอกงานที่ต้องทำ"
                    value={task}
                    onChangeText={setTask}
                    placeholderTextColor="#999"
                  />

                  <TextInput
                    style={[styles.input, styles.descriptionInput]}
                    placeholder="กรอกคำอธิบายงาน"
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    placeholderTextColor="#999"
                  />

                  <TouchableOpacity style={styles.addButton} onPress={handleAddTask}>
                    <Text style={styles.addButtonText}>เพิ่มงาน</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <Text style={styles.noDateText}>กรุณาเลือกวันที่</Text>
              )}
            </View>
          </Animated.View>
        </ScrollView>
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
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 10,
  },
  backButton: {
    marginRight: 15,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Kanit-Bold',
    color: '#FFF',
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    margin: 20,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  calendar: {
    marginBottom: 20,
    borderRadius: 15,
    overflow: 'hidden',
  },
  formContainer: {
    marginTop: 20,
  },
  label: {
    fontSize: 18,
    fontFamily: 'Kanit-Regular',
    color: '#4A90E2',
    marginBottom: 10,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 30,
    marginBottom: 20,
  },
  timeButtonText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 10,
    fontFamily: 'Kanit-Regular',
  },
  selectedTimeText: {
    fontSize: 16,
    color: '#4A90E2',
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'Kanit-Regular',
  },
  input: {
    borderWidth: 1,
    borderColor: '#B3E5FC',
    padding: 15,
    marginBottom: 20,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
    fontSize: 16,
    fontFamily: 'Kanit-Regular',
  },
  descriptionInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  addButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 10,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Kanit-Bold',
  },
  noDateText: {
    fontSize: 18,
    color: '#4A90E2',
    textAlign: 'center',
    marginTop: 20,
    fontStyle: 'italic',
    fontFamily: 'Kanit-Regular',
  },
});

export default AddTaskScreen;