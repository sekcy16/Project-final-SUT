import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, StatusBar, Animated, SafeAreaView, ActivityIndicator } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { getFirestore, collection, getDocs, query, where, orderBy } from 'firebase/firestore';
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
  const [appointments, setAppointments] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [completedAppointments, setCompletedAppointments] = useState([]);
  const [markedDates, setMarkedDates] = useState({});
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [activeTab, setActiveTab] = useState('appointments');
  const [loading, setLoading] = useState(false);

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
        fetchData();
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }).start();
      }
    }, [user, fontsLoaded, fadeAnim, selectedDate])
  );


  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await Promise.all([
        fetchAppointments(),
        fetchTasks(),
        fetchCompletedAppointments(),
      ]);
      updateMarkedDates();
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };


   const fetchAppointments = async () => {
    const appointmentsRef = collection(db, `users/${user.uid}/appointments`);
    const q = query(appointmentsRef, where("date", "==", selectedDate), orderBy("time", "asc"));
    const snapshot = await getDocs(q);
    const appointmentsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log("Appointments fetched:", appointmentsData);
    setAppointments(appointmentsData);
  };

  const fetchTasks = async () => {
    const tasksRef = collection(db, `users/${user.uid}/TasksByDate/${selectedDate}/tasks`);
    const q = query(tasksRef, orderBy("time", "asc"));
    const snapshot = await getDocs(q);
    const tasksData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log("Tasks fetched:", tasksData);
    setTasks(tasksData);
  };
  const fetchCompletedAppointments = async () => {
    const completedRef = collection(db, `users/${user.uid}/completedAppointments`);
    const q = query(completedRef, where("date", "==", selectedDate), orderBy("time", "asc"));
    const snapshot = await getDocs(q);
    const completedData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log("Completed appointments fetched:", completedData);
    setCompletedAppointments(completedData);
  };


  const updateMarkedDates = () => {
    const newMarkedDates = {};
    appointments.forEach(app => {
      newMarkedDates[app.date] = { marked: true, dotColor: '#FF6B6B' };
    });
    tasks.forEach(task => {
      if (newMarkedDates[selectedDate]) {
        newMarkedDates[selectedDate].dots = [
          { color: '#FF6B6B' },
          { color: '#4A90E2' }
        ];
      } else {
        newMarkedDates[selectedDate] = { marked: true, dotColor: '#4A90E2' };
      }
    });
    setMarkedDates(newMarkedDates);
  };

  const handleDateSelect = (day) => {
    setSelectedDate(day.dateString);
    fetchData();
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


  const renderAppointment = ({ item }) => (
    <LinearGradient
      colors={['#F8F9FA', '#E9ECEF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.itemContainer}
    >
      <View style={styles.timeContainer}>
        <Text style={styles.timeText}>{moment(item.time, 'HH:mm:ss').format('HH:mm')}</Text>
      </View>
      <View style={styles.contentContainer}>
        <Text style={styles.titleText}>{item.patientName}</Text>
        <Text style={styles.descriptionText}>{item.note || 'ไม่มีบันทึกเพิ่มเติม'}</Text>
      </View>
    </LinearGradient>
  );


const renderTask = ({ item }) => (
    <LinearGradient
      colors={['#F8F9FA', '#E9ECEF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.itemContainer}
    >
      <View style={styles.timeContainer}>
        <Text style={styles.timeText}>{moment(item.time, 'HH:mm:ss').format('HH:mm')}</Text>
      </View>
      <View style={styles.contentContainer}>
        <Text style={styles.titleText}>{item.task}</Text>
        <Text style={styles.descriptionText}>{item.description || 'ไม่มีรายละเอียด'}</Text>
      </View>
    </LinearGradient>
  );

  const renderCompletedAppointment = ({ item }) => (
    <LinearGradient
      colors={['#F8F9FA', '#E9ECEF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.itemContainer}
    >
      <View style={styles.timeContainer}>
        <Text style={styles.timeText}>{moment(item.time, 'HH:mm:ss').format('HH:mm')}</Text>
      </View>
      <View style={styles.contentContainer}>
        <Text style={styles.titleText}>{item.patientName}</Text>
        <Text style={styles.descriptionText}>ตรวจเสร็จสิ้น</Text>
      </View>
    </LinearGradient>
  );

  const TabButton = ({ title, active, onPress }) => (
    <TouchableOpacity
      style={[styles.tabButton, active && styles.activeTabButton]}
      onPress={onPress}
    >
      <Text style={[styles.tabButtonText, active && styles.activeTabButtonText]}>{title}</Text>
    </TouchableOpacity>
  );

  

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#4A90E2', '#50E3C2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>ตารางงาน</Text>
      </LinearGradient>
      <Calendar
        onDayPress={handleDateSelect}
        markedDates={{
          ...markedDates,
          [selectedDate]: { 
            ...markedDates[selectedDate],
            selected: true,
            selectedColor: '#50E3C2'
          }
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
      <View style={styles.tabContainer}>
        <TabButton
          title="นัดหมาย"
          active={activeTab === 'appointments'}
          onPress={() => setActiveTab('appointments')}
        />
        <TabButton
          title="ตารางงาน"
          active={activeTab === 'tasks'}
          onPress={() => setActiveTab('tasks')}
        />
        <TabButton
          title="ตรวจเสร็จสิ้น"
          active={activeTab === 'completed'}
          onPress={() => setActiveTab('completed')}
        />
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#4A90E2" />
      ) : (
        <FlatList
          data={
            activeTab === 'appointments' ? appointments :
            activeTab === 'tasks' ? tasks :
            completedAppointments
          }
          renderItem={
            activeTab === 'appointments' ? renderAppointment :
            activeTab === 'tasks' ? renderTask :
            renderCompletedAppointment
          }
          keyExtractor={(item) => item.id}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Icon name="event-busy" size={48} color="#CED4DA" />
              <Text style={styles.emptyText}>ไม่มีข้อมูลสำหรับวันนี้</Text>
            </View>
          )}
        />
      )}
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Kanit-Bold',
    color: '#FFFFFF',
  },
  calendar: {
    marginBottom: 10,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  tabButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: '#F1F3F5',
  },
  activeTabButton: {
    backgroundColor: '#4A90E2',
  },
  tabButtonText: {
    fontFamily: 'Kanit-Regular',
    color: '#495057',
  },
  activeTabButtonText: {
    color: '#FFFFFF',
  },
  itemContainer: {
    flexDirection: 'row',
    borderRadius: 10,
    marginHorizontal: 10,
    marginBottom: 10,
    padding: 15,
    alignItems: 'center',
  },
  timeContainer: {
    backgroundColor: '#4A90E2',
    borderRadius: 5,
    padding: 5,
    marginRight: 15,
  },
  timeText: {
    color: '#FFFFFF',
    fontFamily: 'Kanit-Bold',
    fontSize: 14,
  },
  contentContainer: {
    flex: 1,
  },
  titleText: {
    fontFamily: 'Kanit-Bold',
    fontSize: 16,
    color: '#343A40',
    marginBottom: 5,
  },
  descriptionText: {
    fontFamily: 'Kanit-Regular',
    fontSize: 14,
    color: '#6C757D',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyText: {
    fontFamily: 'Kanit-Regular',
    fontSize: 16,
    color: '#ADB5BD',
    marginTop: 10,
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