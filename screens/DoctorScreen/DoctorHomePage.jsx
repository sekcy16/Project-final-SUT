import React, { useEffect, useState, useCallback } from "react";
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
import { firebaseAuth } from "../../config/firebase.config";
import { onAuthStateChanged } from "firebase/auth";
import moment from "moment";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";

const DoctorHomePage = () => {
  const navigation = useNavigation();
  const [tasks, setTasks] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState(null);
  const [error, setError] = useState(null);
  const [summaryData, setSummaryData] = useState({
    totalPatients: 0,
    appointmentsToday: 0,
    tasksToday: 0,
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isLoading, setIsLoading] = useState({
    userData: true,
    tasks: true,
    appointments: true,
    summary: true,
  });
  const db = getFirestore();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(firebaseAuth, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserData(null);
        setUserId(null);
        setError("ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบ");
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchUserData(userId);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchTasks(userId);
      fetchAppointments(userId);
      fetchSummaryData(userId);
    }
  }, [userId]);

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
      console.error("Error fetching user data:", error);
      setError("เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้");
    } finally {
      setIsLoading(prev => ({ ...prev, userData: false }));
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

      // อัพเดท tasksToday ใน summaryData
      setSummaryData((prevData) => ({
        ...prevData,
        tasksToday: tasksData.length,
      }));
    } catch (error) {
      console.error("Error fetching tasks:", error);
      setError("เกิดข้อผิดพลาดในการดึงข้อมูลตาราง");
    } finally {
      setLoading(false);
    }
  };

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
      setAppointments(appointmentsData);
    } catch (error) {
      console.error("Error fetching appointments:", error);
    }
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

      // Count tasks today (ใช้วิธีเดียวกับ fetchTasks)
      const tasksRef = collection(
        db,
        `users/${uid}/TasksByDate/${today}/tasks`
      );
      const taskSnapshot = await getDocs(tasksRef);
      const tasksToday = taskSnapshot.size;

      setSummaryData({ totalPatients, appointmentsToday, tasksToday });
    } catch (error) {
      console.error("Error fetching summary data:", error);
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
      await fetchTasks(userId);
      // อัพเดท summaryData หลังจากลบงาน
      setSummaryData((prevData) => ({
        ...prevData,
        tasksToday: prevData.tasksToday - 1,
      }));
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };
  const handleViewAppointmentDetails = (appointment) => {
    setSelectedAppointment(appointment);
    setModalVisible(true);
  };

  const TaskCard = ({ task }) => (
    <View style={styles.taskCard}>
      <View style={styles.taskTimeContainer}>
        <Icon name="clock-outline" size={24} color="#1E88E5" />
        <Text style={styles.taskTime}>
          {moment(task.time, "HH:mm:ss").format("HH:mm")}
        </Text>
      </View>
      <View style={styles.taskContent}>
        <Text style={styles.taskTitle} numberOfLines={1}>
          {task.task}
        </Text>
        <Text style={styles.taskDescription} numberOfLines={2}>
          {task.description || "ไม่มีรายละเอียด"}
        </Text>
      </View>
      <TouchableOpacity
        onPress={() => handleDeleteTask(task.id)}
        style={styles.deleteButton}
      >
        <Icon name="delete" size={24} color="#FF5252" />
      </TouchableOpacity>
    </View>
  );

  const AppointmentCard = ({ appointment }) => (
    <TouchableOpacity
      style={styles.appointmentCard}
      onPress={() => handleViewAppointmentDetails(appointment)}
    >
      <Icon
        name="account-clock"
        size={24}
        color="#4CAF50"
        style={styles.appointmentIcon}
      />
      <View style={styles.appointmentContent}>
        <Text style={styles.appointmentTime}>
          {moment(appointment.time, "HH:mm:ss").format("HH:mm")}
        </Text>
        <Text style={styles.appointmentPatient}>{appointment.patientName}</Text>
        <Text style={styles.appointmentNote} numberOfLines={1}>
          {appointment.note || "ไม่มีบันทึกเพิ่มเติม"}
        </Text>
      </View>
      <Icon name="chevron-right" size={24} color="#BDBDBD" />
    </TouchableOpacity>
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
            <View style={styles.userInfoContainer}>
              <Text style={styles.greeting}>สวัสดี,</Text>
              <Text style={styles.userName}>
                {userData?.fullName || "คุณหมอ"}
              </Text>
              <Text style={styles.userRole}>แพทย์</Text>
            </View>
          </View>
          <View style={styles.addTaskContainer}>
            <TouchableOpacity style={styles.addTaskButton} onPress={handleAddTask}>
              <Icon name="plus" size={24} color="#FFF" />
              <Text style={styles.addTaskButtonText}>เพิ่มงาน</Text>
            </TouchableOpacity>
            <Text style={styles.addTaskHint}>เพิ่มงานใหม่ของคุณ</Text>
          </View>
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
                  tasks.map((task) => <TaskCard key={task.id} task={task} />)
                ) : (
                  <Text style={styles.noDataText}>คุณไม่มีงานสำหรับวันนี้</Text>
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
                  <Text style={styles.noDataText}>
                    ไม่มีนัดหมายสำหรับวันนี้
                  </Text>
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
              <Text style={styles.modalTitle}>รายละเอียดการนัดหมาย</Text>
              {selectedAppointment && (
                <>
                  <Text style={styles.modalText}>
                    เวลา:{" "}
                    {moment(selectedAppointment.time, "HH:mm:ss").format(
                      "HH:mm"
                    )}
                  </Text>
                  <Text style={styles.modalText}>
                    ผู้ป่วย: {selectedAppointment.patientName}
                  </Text>
                  <Text style={styles.modalText}>
                    บันทึก: {selectedAppointment.note || "ไม่มีบันทึกเพิ่มเติม"}
                  </Text>
                </>
              )}
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
    alignItems: "flex-start", // Changed from 'center' to 'flex-start'
    padding: 20,
    paddingTop: 10,
  },
  profileContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1, // Added flex to take up more space
  },
  profileImage: {
    width: 80, // Increased size
    height: 80, // Increased size
    borderRadius: 40, // Adjusted for new size
    marginRight: 20, // Increased margin
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  userInfoContainer: {
    flex: 1, // Added to allow text to take up remaining space
  },
  greeting: {
    fontSize: 18, // Increased size
    fontFamily: "Kanit-Regular",
    color: "#FFF",
    opacity: 0.9,
  },
  userName: {
    fontSize: 28, // Increased size
    fontFamily: "Kanit-Bold",
    color: "#FFF",
    marginTop: 5, // Added some spacing
  },
  userRole: {
    fontSize: 16, // Added new style for role
    fontFamily: "Kanit-Medium",
    color: "#FFF",
    opacity: 0.8,
    marginTop: 5,
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
  taskCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    elevation: 2,
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
    fontSize: 16,
    fontFamily: "Kanit-Bold",
    color: "#333",
  },
  taskDescription: {
    fontSize: 14,
    fontFamily: "Kanit-Regular",
    color: "#666",
    marginTop: 5,
  },
  deleteButton: {
    padding: 8,
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
    fontFamily: "Kanit-Light",
    color: "#888",
    marginTop: 5,
  },
  noDataText: {
    fontSize: 16,
    fontFamily: "Kanit-Regular",
    color: "#757575",
    textAlign: "center",
    marginTop: 20,
    fontStyle: "italic",
  },
  errorText: {
    fontSize: 16,
    fontFamily: "Kanit-Regular",
    color: "#FF0000",
    textAlign: "center",
    marginTop: 20,
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
    width: "80%",
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: "Kanit-Bold",
    color: "#333",
    marginBottom: 15,
  },
  modalText: {
    fontSize: 16,
    fontFamily: "Kanit-Regular",
    color: "#333",
    marginBottom: 10,
  },
  closeButton: {
    backgroundColor: "#1E88E5",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 20,
  },
  closeButtonText: {
    color: "#FFF",
    fontFamily: "Kanit-Bold",
    fontSize: 16,
  },  
  addTaskContainer: {
    alignItems: 'center',
    marginTop: 10, // Added top margin to align with larger profile section
  },
  addTaskButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
  },
  addTaskButtonText: {
    color: '#FFF',
    fontFamily: 'Kanit-Bold',
    fontSize: 16,
    marginLeft: 5,
  },
  addTaskHint: {
    color: '#FFF',
    fontFamily: 'Kanit-Regular',
    fontSize: 12,
    marginTop: 5,
    opacity: 0.8,
  },
});

export default DoctorHomePage;
