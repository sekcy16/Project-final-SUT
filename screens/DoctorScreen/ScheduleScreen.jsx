import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { Calendar } from 'react-native-calendars';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { firebaseAuth } from "../../config/firebase.config";
import moment from 'moment';

const ScheduleScreen = ({ navigation }) => {
  const [selectedDate, setSelectedDate] = useState(moment().format('YYYY-MM-DD'));
  const [tasks, setTasks] = useState([]);
  const [markedDates, setMarkedDates] = useState({});

  const db = getFirestore();
  const user = firebaseAuth.currentUser;

  useEffect(() => {
    if (user) {
      fetchTasks();
    }
  }, [user]);

  const fetchTasks = async () => {
    if (!user) return;

    const tasksRef = collection(db, `users/${user.uid}/TasksByDate`);
    const q = query(tasksRef);
    
    try {
      const querySnapshot = await getDocs(q);
      let newMarkedDates = {};
      
      querySnapshot.forEach((doc) => {
        newMarkedDates[doc.id] = { marked: true, dotColor: '#1E88E5' };
      });

      setMarkedDates(newMarkedDates);
      fetchTasksForDate(selectedDate);
    } catch (error) {
      console.error("Error fetching tasks: ", error);
    }
  };

  const fetchTasksForDate = async (date) => {
    if (!user) return;

    const tasksRef = collection(db, `users/${user.uid}/TasksByDate/${date}/tasks`);
    const q = query(tasksRef);
    
    try {
      const querySnapshot = await getDocs(q);
      const tasksData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTasks(tasksData);
    } catch (error) {
      console.error("Error fetching tasks for date: ", error);
    }
  };

  const handleDateSelect = (day) => {
    setSelectedDate(day.dateString);
    fetchTasksForDate(day.dateString);
  };

  const renderTask = ({ item }) => (
    <View style={styles.taskItem}>
      <Icon name="event" size={24} color="#1E88E5" style={styles.taskIcon} />
      <View style={styles.taskContent}>
        <Text style={styles.taskTime}>{moment(item.time, 'HH:mm:ss').format('HH:mm')}</Text>
        <Text style={styles.taskTitle}>{item.task}</Text>
        <Text style={styles.taskDescription}>{item.description}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Calendar
        onDayPress={handleDateSelect}
        markedDates={{
          ...markedDates,
          [selectedDate]: { selected: true, selectedColor: '#4CAF50', marked: markedDates[selectedDate]?.marked }
        }}
        theme={{
          backgroundColor: '#ffffff',
          calendarBackground: '#ffffff',
          textSectionTitleColor: '#1E88E5',
          selectedDayBackgroundColor: '#4CAF50',
          selectedDayTextColor: '#ffffff',
          todayTextColor: '#4CAF50',
          dayTextColor: '#2d4150',
          textDisabledColor: '#d9e1e8',
          dotColor: '#1E88E5',
          selectedDotColor: '#ffffff',
          arrowColor: '#1E88E5',
          monthTextColor: '#1E88E5',
          indicatorColor: '#1E88E5',
          textDayFontWeight: '300',
          textMonthFontWeight: 'bold',
          textDayHeaderFontWeight: '300',
          textDayFontSize: 16,
          textMonthFontSize: 18,
          textDayHeaderFontSize: 14
        }}
        style={styles.calendar}
      />

      <View style={styles.taskListContainer}>
        <Text style={styles.dateTitle}>{moment(selectedDate).format('MMMM D, YYYY')}</Text>
        {tasks.length > 0 ? (
          <FlatList
            data={tasks}
            renderItem={renderTask}
            keyExtractor={(item) => item.id}
            style={styles.taskList}
          />
        ) : (
          <Text style={styles.noTasksText}>ไม่มีงานสำหรับวันนี้</Text>
        )}
      </View>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('AddTaskScreen')}
      >
        <Icon name="add" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  calendar: {
    marginBottom: 10,
  },
  taskListContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  dateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E88E5',
    marginBottom: 15,
  },
  taskList: {
    flex: 1,
  },
  taskItem: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    alignItems: 'center',
  },
  taskIcon: {
    marginRight: 15,
  },
  taskContent: {
    flex: 1,
  },
  taskTime: {
    fontSize: 14,
    color: '#1E88E5',
    fontWeight: 'bold',
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 5,
  },
  taskDescription: {
    fontSize: 14,
    color: '#757575',
  },
  noTasksText: {
    fontSize: 16,
    color: '#757575',
    textAlign: 'center',
    marginTop: 20,
    fontStyle: 'italic',
  },
  addButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: '#4CAF50',
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