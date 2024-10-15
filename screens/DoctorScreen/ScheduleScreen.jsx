import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, StatusBar, Animated } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { firebaseAuth } from "../../config/firebase.config";
import moment from 'moment';
import 'moment/locale/th';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Font from 'expo-font';

// กำหนดค่า Locale สำหรับปฏิทิน
LocaleConfig.locales['th'] = {
  monthNames: [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ],
  monthNamesShort: ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'],
  dayNames: ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'],
  dayNamesShort: ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'],
  today: 'วันนี้'
};
LocaleConfig.defaultLocale = 'th';

moment.locale('th');

const ScheduleScreen = ({ navigation }) => {
  const [selectedDate, setSelectedDate] = useState(moment().format('YYYY-MM-DD'));
  const [tasks, setTasks] = useState([]);
  const [markedDates, setMarkedDates] = useState({});
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  const db = getFirestore();
  const user = firebaseAuth.currentUser;

  useEffect(() => {
    async function loadFonts() {
      await Font.loadAsync({
        'Kanit-Regular': require('../../assets/fonts/Kanit-Regular.ttf'),
        'Kanit-Bold': require('../../assets/fonts/Kanit-Bold.ttf'),
      });
      setFontsLoaded(true);
    }
    loadFonts();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (user && fontsLoaded) {
        fetchTasks();
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }).start();
      }
    }, [user, fontsLoaded, fadeAnim])
  );

  const fetchTasks = async () => {
    if (!user) return;
  
    const tasksRef = collection(db, `users/${user.uid}/TasksByDate`);
    
    try {
      const querySnapshot = await getDocs(tasksRef);
      let newMarkedDates = {};
      
      querySnapshot.forEach((doc) => {
        newMarkedDates[doc.id] = { marked: true, dotColor: '#FF6B6B' };
      });
  
      setMarkedDates(newMarkedDates);
      fetchTasksForDate(selectedDate);
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการดึงข้อมูลงาน: ", error);
    }
  };

  const fetchTasksForDate = async (date) => {
    if (!user) return;
  
    const tasksRef = collection(db, `users/${user.uid}/TasksByDate/${date}/tasks`);
    
    try {
      const querySnapshot = await getDocs(tasksRef);
      const tasksData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTasks(tasksData.sort((a, b) => moment(a.time, 'HH:mm:ss').diff(moment(b.time, 'HH:mm:ss'))));
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการดึงข้อมูลงานสำหรับวันที่: ", error);
    }
  };

  const handleDateSelect = (day) => {
    setSelectedDate(day.dateString);
    fetchTasksForDate(day.dateString);
  };

  const renderTask = ({ item }) => (
    <LinearGradient
      colors={['#F8F9FA', '#E9ECEF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.taskItem}
    >
      <View style={styles.taskTimeContainer}>
        <Text style={styles.taskTime}>{moment(item.time, 'HH:mm:ss').format('HH:mm')}</Text>
      </View>
      <View style={styles.taskContent}>
        <Text style={styles.taskTitle}>{item.task}</Text>
        <Text style={styles.taskDescription}>{item.description}</Text>
      </View>
      <TouchableOpacity style={styles.taskIcon}>
        <Icon name="more-vert" size={24} color="#6C757D" />
      </TouchableOpacity>
    </LinearGradient>
  );

  const renderHeader = () => (
    <>
      <Calendar
        onDayPress={handleDateSelect}
        markedDates={{
          ...markedDates,
          [selectedDate]: { selected: true, selectedColor: '#50E3C2', marked: markedDates[selectedDate]?.marked }
        }}
        theme={{
          backgroundColor: '#ffffff',
          calendarBackground: '#ffffff',
          textSectionTitleColor: '#4A90E2',
          selectedDayBackgroundColor: '#50E3C2',
          selectedDayTextColor: '#ffffff',
          todayTextColor: '#50E3C2',
          dayTextColor: '#2d4150',
          textDisabledColor: '#d9e1e8',
          dotColor: '#FF6B6B',
          selectedDotColor: '#ffffff',
          arrowColor: '#4A90E2',
          monthTextColor: '#4A90E2',
          indicatorColor: '#4A90E2',
          textDayFontFamily: 'Kanit-Regular',
          textMonthFontFamily: 'Kanit-Bold',
          textDayHeaderFontFamily: 'Kanit-Regular',
          textDayFontWeight: '300',
          textMonthFontWeight: 'bold',
          textDayHeaderFontWeight: '300',
          textDayFontSize: 16,
          textMonthFontSize: 18,
          textDayHeaderFontSize: 14
        }}
        style={styles.calendar}
      />
      <View style={styles.card}>
        <Text style={styles.dateTitle}>{moment(selectedDate).format('D MMMM YYYY')}</Text>
      </View>
    </>
  );

  const renderEmptyComponent = () => (
    <View style={styles.noTasksContainer}>
      <Icon name="event-busy" size={48} color="#CED4DA" />
      <Text style={styles.noTasksText}>ไม่มีงานสำหรับวันนี้</Text>
    </View>
  );

  if (!fontsLoaded) {
    return null; // หรือแสดงคอมโพเนนต์ Loading
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#4A90E2', '#50E3C2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>ตารางงาน</Text>
      </LinearGradient>
      <FlatList
        data={tasks}
        renderItem={renderTask}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyComponent}
        contentContainerStyle={styles.listContent}
      />
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('AddTaskScreen')}
      >
        <LinearGradient
          colors={['#50E3C2', '#4A90E2']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.addButtonGradient}
        >
          <Icon name="add" size={24} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    paddingTop: 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Kanit-Bold',
    color: '#FFFFFF',
  },
  listContent: {
    flexGrow: 1,
  },
  calendar: {
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  dateTitle: {
    fontSize: 20,
    fontFamily: 'Kanit-Bold',
    color: '#4A90E2',
    marginBottom: 15,
  },
  taskItem: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    marginHorizontal: 20,
    alignItems: 'center',
  },
  taskTimeContainer: {
    backgroundColor: '#4A90E2',
    borderRadius: 5,
    padding: 5,
    marginRight: 15,
  },
  taskTime: {
    fontSize: 14,
    color: '#FFFFFF',
    fontFamily: 'Kanit-Bold',
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontFamily: 'Kanit-Bold',
    color: '#333',
    marginBottom: 5,
  },
  taskDescription: {
    fontSize: 14,
    fontFamily: 'Kanit-Regular',
    color: '#6C757D',
  },
  taskIcon: {
    padding: 5,
  },
  noTasksContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  noTasksText: {
    fontSize: 16,
    fontFamily: 'Kanit-Regular',
    color: '#ADB5BD',
    marginTop: 10,
    fontStyle: 'italic',
  },
  addButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
  },
  addButtonGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});

export default ScheduleScreen;