import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  RefreshControl,
  Modal,
  FlatList,
  Alert,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation } from "@react-navigation/native";
import {
  getFirestore,
  collection,
  query,
  orderBy,
  getDocs,
  deleteDoc,
  doc,
  getDoc,
  where,
} from "firebase/firestore";
import { app, firebaseAuth } from "../../config/firebase.config";
import { onAuthStateChanged } from "firebase/auth";
import moment from "moment";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Notifications from 'expo-notifications';


const DoctorHomePage = () => {
  const navigation = useNavigation();
  const [tasks, setTasks] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState(null);
  const [error, setError] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [summaryData, setSummaryData] = useState({
    totalPatients: 0,
    appointmentsToday: 0,
    tasksToday: 0,
  });
  const db = getFirestore(app);
  const [allTasks, setAllTasks] = useState([]);
  const [taskModalVisible, setTaskModalVisible] = useState(false);
  const [allAppointments, setAllAppointments] = useState([]);

  const sendTestNotification = async () => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "ทดสอบการแจ้งเตือน",
        body: 'นี่คือการแจ้งเตือนทดสอบ',
      },
      trigger: { seconds: 5 }, // แจ้งเตือนหลังจาก 5 วินาที
    });
    Alert.alert("ทดสอบการแจ้งเตือน", "การแจ้งเตือนจะปรากฏในอีก 5 วินาที");
  };

  useEffect(() => {
    const requestNotificationPermissions = async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('การแจ้งเตือนถูกปฏิเสธ', 'คุณจะไม่ได้รับการแจ้งเตือน');
      }
    };
  
    const setupNotifications = async () => {
      await Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });
    };

    const unsubscribeAuth = onAuthStateChanged(firebaseAuth, (user) => {
      if (user) {
        setUserId(user.uid);
        fetchUserData(user.uid);
        fetchTasks(user.uid);
        fetchAppointments(user.uid);
        fetchSummaryData(user.uid);
      } else {
        setUserData(null);
        setUserId(null);
        setError("ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบ");
      }
    });
  
    requestNotificationPermissions();
  setupNotifications();
    return () => unsubscribeAuth();
  }, []);



// แก้ไขฟังก์ชัน scheduleNotification
const scheduleNotification = async (item, type) => {
  const notificationDate = moment(`${item.date} ${item.time}`, "YYYY-MM-DD HH:mm:ss").toDate();
  const notificationTime = moment(notificationDate).subtract(15, 'minutes').toDate();

  let title, body;
  if (type === 'appointment') {
    title = "นัดหมายแพทย์";
    body = `คุณมีนัดกับ ${item.patientName} ในอีก 15 นาที`;
  } else if (type === 'task') {
    title = "ตารางงาน";
    body = `คุณมีงาน "${item.task}" ในอีก 15 นาที`;
  }

  await Notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger: notificationTime,
  });
};


  const fetchUserData = async (uid) => {
    try {
      const userDocRef = doc(db, "users", uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        setUserData(userDoc.data());
      } else {
        setError("ไม่พบข้อมูลผู้ใช้");
      }
    } catch (error) {
      setError("เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้");
    }
  };

  const fetchTasks = async (uid) => {
    try {
      const now = new Date();
      const currentDate = `${now.getFullYear()}-${String(
        now.getMonth() + 1
      ).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  
      const tasksRef = collection(
        db,
        `users/${uid}/TasksByDate/${currentDate}/tasks`
      );
      const q = query(tasksRef, orderBy("time", "asc"));
      const snapshot = await getDocs(q);
      const tasksData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTasks(tasksData);
  
      // Schedule notifications for today's tasks
      tasksData.forEach(task => scheduleNotification(task, 'task'));
    } catch (error) {
      setError("เกิดข้อผิดพลาดในการดึงข้อมูลตาราง");
    } finally {
      setLoading(false);
    }
  };
  
  // Fetching appointments
  const fetchAppointments = async (uid) => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const appointmentsRef = collection(db, `users/${uid}/appointments`);
      const q = query(
        appointmentsRef,
        where("date", "==", today),
        orderBy("time", "asc")
      );
      const snapshot = await getDocs(q);
      const appointmentsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAppointments(appointmentsData.slice(0, 3));
      setAllAppointments(appointmentsData);
      setSummaryData((prev) => ({
        ...prev,
        appointmentsToday: appointmentsData.length,
      }));
  
      // Schedule notifications for today's appointments
      appointmentsData.forEach(appointment => scheduleNotification(appointment, 'appointment'));
    } catch (error) {
      console.error("Error fetching appointments: ", error);
    }
  };

  const handleDeleteAppointment = async (appointmentId) => {
    try {
      await deleteDoc(doc(db, `users/${userId}/appointments`, appointmentId));
      setAllAppointments((prev) =>
        prev.filter((app) => app.id !== appointmentId)
      );
      setAppointments((prev) => prev.filter((app) => app.id !== appointmentId));
      
      // อัพเดท summaryData หลังจากลบนัดหมาย
      setSummaryData((prev) => ({
        ...prev,
        appointmentsToday: Math.max(0, prev.appointmentsToday - 1),
      }));
      
      Alert.alert("สำเร็จ", "ลบนัดหมายเรียบร้อยแล้ว");
      
      // เรียก fetchSummaryData เพื่ออัพเดทข้อมูลทั้งหมด
      fetchSummaryData(userId);
    } catch (error) {
      console.error("Error deleting appointment: ", error);
      Alert.alert("ข้อผิดพลาด", "ไม่สามารถลบนัดหมายได้");
    }
  };

  const handleViewAllAppointments = () => {
    setModalVisible(true);
  };

  const fetchSummaryData = async (uid) => {
    try {
      const today = new Date().toISOString().split("T")[0];
  
      // Count total patients
      const doctorPatientsRef = collection(db, "doctorPatients");
      const patientQuery = query(
        doctorPatientsRef,
        where("doctorId", "==", uid)
      );
      const patientSnapshot = await getDocs(patientQuery);
      const totalPatients = patientSnapshot.size;
  
      // Count appointments today
      const appointmentsRef = collection(db, `users/${uid}/appointments`);
      const appointmentQuery = query(
        appointmentsRef,
        where("date", "==", today)
      );
      const appointmentSnapshot = await getDocs(appointmentQuery);
      const appointmentsToday = appointmentSnapshot.size;
  
      // Count tasks today
      const tasksRef = collection(
        db,
        `users/${uid}/TasksByDate/${today}/tasks`
      );
      const taskSnapshot = await getDocs(tasksRef);
      const tasksToday = taskSnapshot.size;
  
      setSummaryData({ totalPatients, appointmentsToday, tasksToday });
    } catch (error) {
      console.error("Error fetching summary data: ", error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (userId) {
      await Promise.all([
        fetchTasks(userId),
        fetchAppointments(userId),
        fetchSummaryData(userId),
      ]);
    }
    setRefreshing(false);
  };

  const handleAddTask = () => {
    navigation.navigate("AddTaskScreen");
  };

  const handleDeleteTask = async (taskId) => {
    try {
      const currentDate = new Date().toISOString().slice(0, 10);
      await deleteDoc(
        doc(db, `users/${userId}/TasksByDate/${currentDate}/tasks`, taskId)
      );
      fetchTasks(userId);
    } catch (error) {
      console.error("Error deleting task: ", error);
    }
  };
  const fetchAllTasks = async (uid) => {
    try {
      const now = new Date();
      const currentDate = `${now.getFullYear()}-${String(
        now.getMonth() + 1
      ).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

      const tasksRef = collection(
        db,
        `users/${uid}/TasksByDate/${currentDate}/tasks`
      );
      const q = query(tasksRef, orderBy("time", "asc"));
      const snapshot = await getDocs(q);
      const tasksData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAllTasks(tasksData);
    } catch (error) {
      console.error("Error fetching all tasks:", error);
    }
  };

  const handleViewAllTasks = () => {
    fetchAllTasks(userId);
    setTaskModalVisible(true);
  };

  const TaskCard = ({ task, onDelete }) => (
    <View style={styles.miniTaskCard}>
      <View style={styles.miniTaskTimeContainer}>
        <Text style={styles.miniTaskTime}>
          {moment(task.time, "HH:mm:ss").format("hh:mm A")}
        </Text>
      </View>
      <View style={styles.miniTaskContent}>
        <Text
          style={styles.miniTaskTitle}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {task.task}
        </Text>
        <Text
          style={styles.miniTaskDescription}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {task.description || "ไม่มีรายละเอียด"}
        </Text>
      </View>
      <TouchableOpacity
        onPress={() => onDelete(task.id)}
        style={styles.deleteButton}
      >
        <Icon name="delete" size={24} color="#FF5252" />
      </TouchableOpacity>
    </View>
  );

  // Appointment Card component
  const AppointmentCard = ({ appointment, showDelete = false }) => (
    <View style={styles.appointmentCard}>
      <Icon
        name="account-clock"
        size={24}
        color="#4CAF50"
        style={styles.appointmentIcon}
      />
      <View style={styles.appointmentContent}>
        <Text style={styles.appointmentDate}>
          {moment(appointment.date).format("DD/MM/YYYY")}
        </Text>
        <Text style={styles.appointmentTime}>
          {moment(appointment.time, "HH:mm:ss").format("HH:mm")}
        </Text>
        <Text style={styles.appointmentPatient}>{appointment.patientName}</Text>
        {appointment.note && (
          <Text style={styles.appointmentNote}>
            หมายเหตุ: {appointment.note}
          </Text>
        )}
      </View>
      {showDelete && (
        <TouchableOpacity
          onPress={() => handleDeleteAppointment(appointment.id)}
          style={styles.deleteButton}
        >
          <Icon name="delete" size={24} color="#FF5252" />
        </TouchableOpacity>
      )}
    </View>
  );

  const SummaryCard = ({ icon, title, value }) => (
    <View style={styles.summaryCard}>
      <Icon name={icon} size={28} color="#1E88E5" />
      <Text style={styles.summaryTitle}>{title}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );

  return (
    <LinearGradient colors={["#4A90E2", "#50E3C2"]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View style={styles.profileContainer}>
            <Image
              source={{
                uri: userData?.profilePic || "https://via.placeholder.com/100",
              }}
              style={styles.profileImage}
            />
            <View>
              <Text style={styles.greeting}>สวัสดี,</Text>
              <Text style={styles.userName}>
                {userData?.fullName || "คุณหมอ"}
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.addIcon} onPress={handleAddTask}>
            <Icon name="plus" size={28} color="#FFF" />
          </TouchableOpacity>
        </View>
        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#1E88E5"]}
            />
          }
        >
          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : (
            <>
              <View style={styles.summaryContainer}>
                <SummaryCard
                  icon="account-group"
                  title="ผู้ป่วยทั้งหมด"
                  value={summaryData.totalPatients}
                />
                <SummaryCard
                  icon="calendar-check"
                  title="นัดหมายวันนี้"
                  value={summaryData.appointmentsToday}
                />
                <SummaryCard
                  icon="clipboard-list"
                  title="งานวันนี้"
                  value={summaryData.tasksToday}
                />
              </View>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>ตารางงานวันนี้</Text>
                {loading ? (
                  <ActivityIndicator size="large" color="#1E88E5" />
                ) : tasks.length > 0 ? (
                  <View style={styles.taskCardContainer}>
                    {tasks.slice(0, 3).map((task) => (
                      <TaskCard key={task.id} task={task} />
                    ))}
                    {tasks.length > 3 && (
                      <TouchableOpacity
                        style={styles.viewMoreButton}
                        onPress={handleViewAllTasks}
                      >
                        <Text style={styles.viewMoreButtonText}>ดูทั้งหมด</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ) : (
                  <Text style={styles.noTaskText}>คุณไม่มีงานสำหรับวันนี้</Text>
                )}
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>นัดหมายวันนี้</Text>
                {appointments.length > 0 ? (
                  appointments.map((appointment) => (
                    <AppointmentCard
                      key={appointment.id}
                      appointment={appointment}
                    />
                  ))
                ) : (
                  <Text style={styles.noAppointmentText}>
                    ไม่มีนัดหมายสำหรับวันนี้
                  </Text>
                )}
                {allAppointments.length > 3 && (
                  <TouchableOpacity
                    style={styles.viewMoreButton}
                    onPress={handleViewAllAppointments}
                  >
                    <Text style={styles.viewMoreButtonText}>
                      ดูนัดหมายทั้งหมด ({allAppointments.length})
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </>
          )}
        </ScrollView>

        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                นัดหมายทั้งหมดของวันนี้ ({allAppointments.length})
              </Text>
              <FlatList
                data={allAppointments}
                renderItem={({ item }) => (
                  <AppointmentCard appointment={item} showDelete={true} />
                )}
                keyExtractor={(item) => item.id}
              />
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>ปิด</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 10,
  },
  profileContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  greeting: {
    fontSize: 16,
    fontFamily: "Kanit-Regular",
    color: "#FFF",
    opacity: 0.8,
  },
  userName: {
    fontSize: 24,
    fontFamily: "Kanit-Bold",
    color: "#FFF",
  },
  addIcon: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    padding: 10,
    borderRadius: 20,
  },
  content: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 20,
    paddingHorizontal: 15,
  },
  summaryContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  summaryCard: {
    backgroundColor: "#FFF",
    borderRadius: 10,
    padding: 15,
    alignItems: "center",
    width: "30%",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryTitle: {
    fontSize: 12,
    fontFamily: "Kanit-Regular",
    color: "#666",
    marginTop: 5,
    textAlign: "center",
  },
  summaryValue: {
    fontSize: 18,
    fontFamily: "Kanit-Bold",
    color: "#333",
    marginTop: 5,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 22,
    fontFamily: "Kanit-Bold",
    color: "#1E88E5",
    marginBottom: 15,
  },
  taskCardContainer: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 15,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  miniTaskCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  miniTaskTimeContainer: {
    width: 70,
    marginRight: 10,
  },
  miniTaskTime: {
    fontSize: 14,
    fontFamily: "Kanit-Bold",
    color: "#1E88E5",
  },
  miniTaskContent: {
    flex: 1,
  },
  miniTaskTitle: {
    fontSize: 16,
    fontFamily: "Kanit-Regular",
    color: "#333",
  },
  miniTaskDescription: {
    fontSize: 14,
    fontFamily: "Kanit-Light",
    color: "#666",
    marginTop: 2,
  },
  viewMoreButton: {
    backgroundColor: "#1E88E5",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 10,
  },
  viewMoreButtonText: {
    color: "#1E88E5",
    fontFamily: "Kanit-Regular",
    fontSize: 14,
  },
  taskCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    marginBottom: 15,
    backgroundColor: "#FFF",
    borderRadius: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  taskTimeContainer: {
    alignItems: "center",
    marginRight: 15,
  },
  taskTime: {
    fontSize: 14,
    fontFamily: "Kanit-Bold",
    color: "#1E88E5",
    marginTop: 5,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 18,
    fontFamily: "Kanit-Bold",
    color: "#333",
    marginBottom: 5,
  },
  taskDescription: {
    fontSize: 14,
    fontFamily: "Kanit-Regular",
    color: "#757575",
  },
  deleteButton: {
    padding: 8,
  },
  noTaskText: {
    fontSize: 16,
    fontFamily: "Kanit-Regular",
    color: "#757575",
    textAlign: "center",
    marginTop: 20,
    fontStyle: "italic",
  },
  appointmentCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    elevation: 2,
  },
  appointmentIcon: {
    marginRight: 15,
  },
  appointmentContent: {
    flex: 1,
  },
  appointmentDate: {
    fontSize: 14,
    fontFamily: "Kanit-Regular",
    color: "#666",
  },
  appointmentTime: {
    fontSize: 16,
    fontFamily: "Kanit-Bold",
    color: "#333",
  },
  appointmentPatient: {
    fontSize: 14,
    fontFamily: "Kanit-Regular",
    color: "#666",
  },
  appointmentNote: {
    fontSize: 12,
    fontFamily: "Kanit-Regular",
    color: "#666",
    marginTop: 5,
  },
  noAppointmentText: {
    fontSize: 16,
    fontFamily: "Kanit-Regular",
    color: "#757575",
    textAlign: "center",
    marginTop: 10,
    fontStyle: "italic",
  },
  deleteButton: {
    padding: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderRadius: 10,
    padding: 20,
    width: "90%",
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: "Kanit-Bold",
    color: "#333",
    marginBottom: 15,
  },
  closeButton: {
    backgroundColor: "#FF5252",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 10,
  },
  closeButtonText: {
    color: "#FFF",
    fontFamily: "Kanit-Regular",
    fontSize: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
    fontFamily: "Kanit-Regular",
  },
  datePickerButton: {
    backgroundColor: "#F0F0F0",
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
  },
  addButton: {
    backgroundColor: "#4CAF50",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 10,
  },
  addButtonText: {
    color: "#FFF",
    fontFamily: "Kanit-Regular",
    fontSize: 16,
  },
  closeButton: {
    backgroundColor: "#FF5252",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 10,
  },
  closeButtonText: {
    color: "#FFF",
    fontFamily: "Kanit-Regular",
    fontSize: 16,
  },
  errorText: {
    fontSize: 16,
    fontFamily: "Kanit-Regular",
    color: "#FF0000",
    textAlign: "center",
    marginTop: 20,
  },
  viewMoreButton: {
    backgroundColor: "#1E88E5",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 10,
  },
  viewMoreButtonText: {
    color: "#FFF",
    fontFamily: "Kanit-Regular",
    fontSize: 16,
  },
  testNotificationButton: {
    backgroundColor: "#FF9800",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 20,
  },
  testNotificationButtonText: {
    color: "#FFF",
    fontFamily: "Kanit-Regular",
    fontSize: 16,
  },
});

export default DoctorHomePage;
