import React, { useState, useEffect, useRef } from "react";
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
  AppState,
  TextInput,
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
  addDoc,
  updateDoc,
} from "firebase/firestore";
import { app, firebaseAuth } from "../../config/firebase.config";
import { onAuthStateChanged } from "firebase/auth";
import moment from "moment";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Notifications from "expo-notifications";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as BackgroundFetch from "expo-background-fetch";
import * as TaskManager from "expo-task-manager";

const BACKGROUND_FETCH_TASK = "background-fetch";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  try {
    await refreshNotifications();
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error("Error in background fetch:", error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

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
  const [expoPushToken, setExpoPushToken] = useState("");
  const [notification, setNotification] = useState(false);
  const notificationListener = useRef();
  const responseListener = useRef();
  const appState = useRef(AppState.currentState);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [editedPatientName, setEditedPatientName] = useState("");
  const [editedDate, setEditedDate] = useState(new Date());
  const [editedTime, setEditedTime] = useState(new Date());
  const [editedNote, setEditedNote] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskDetailModalVisible, setTaskDetailModalVisible] = useState(false);
  const BACKGROUND_FETCH_TASK = "background-fetch";

  useEffect(() => {
    registerForPushNotificationsAsync().then((token) =>
      setExpoPushToken(token)
    );

    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        setNotification(notification);
      });

      responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        // แทนที่จะนำทางไปยัง TaskDetails หรือ AppointmentDetails
        // เราจะนำทางไปยัง ScheduleScreen แทน
        navigation.navigate("ScheduleScreen");
      });

    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        console.log("App has come to the foreground!");
        refreshNotifications();
      }
      appState.current = nextAppState;
    });

    const registerBackgroundFetch = async () => {
      try {
        await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
          minimumInterval: 15 * 60, // 15 minutes
          stopOnTerminate: false,
          startOnBoot: true,
        });
        console.log("Background fetch registered");
      } catch (err) {
        console.error("Background fetch failed to register:", err);
      }
    };

    registerBackgroundFetch();

    return () => {
      Notifications.removeNotificationSubscription(
        notificationListener.current
      );
      Notifications.removeNotificationSubscription(responseListener.current);
      subscription.remove();
      BackgroundFetch.unregisterTaskAsync(BACKGROUND_FETCH_TASK);
    };
  }, []);

  const refreshNotifications = async () => {
    if (userId) {
      const today = new Date().toISOString().split("T")[0];
      const appointmentsRef = collection(db, `users/${userId}/appointments`);
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

      for (const appointment of appointmentsData) {
        await scheduleNotification(appointment, "appointment");
      }

      const tasksRef = collection(
        db,
        `users/${userId}/TasksByDate/${today}/tasks`
      );
      const tasksSnapshot = await getDocs(tasksRef);
      const tasksData = tasksSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      for (const task of tasksData) {
        await scheduleNotification(task, "task");
      }
    }
  };

  // const testNotification = async () => {
  //   try {
  //     await Notifications.scheduleNotificationAsync({
  //       content: {
  //         title: "ทดสอบการแจ้งเตือน",
  //         body: "นี่คือการทดสอบการแจ้งเตือน จะแสดงใน 5 วินาที",
  //       },
  //       trigger: { seconds: 5 },
  //     });
  //     Alert.alert("สำเร็จ", "การแจ้งเตือนจะแสดงใน 5 วินาที");
  //   } catch (error) {
  //     console.error("Error scheduling test notification:", error);
  //     Alert.alert("ข้อผิดพลาด", "ไม่สามารถสร้างการแจ้งเตือนทดสอบได้");
  //   }
  // };

  const registerForPushNotificationsAsync = async () => {
    let token;
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      Alert.alert("Failed to get push token for push notification!");
      return;
    }
    token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log(token);
    return token;
  };

  useEffect(() => {
    const requestNotificationPermissions = async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("การแจ้งเตือนถูกปฏิเสธ", "คุณจะไม่ได้รับการแจ้งเตือน");
      }
    };
    const setupNotifications = async () => {
      try {
        await Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
          }),
        });
      } catch (error) {
        console.error("Error setting up notifications:", error);
      }
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

  // ฟังก์ชันสำหรับจัดการการแก้ไขนัดหมาย
  const handleEditAppointment = (appointment) => {
    setEditingAppointment(appointment);
    setEditedPatientName(appointment.patientName);
    setEditedDate(new Date(appointment.date));
    setEditedTime(moment(appointment.time, "HH:mm:ss").toDate());
    setEditedNote(appointment.note || "");
    setEditModalVisible(true);
  };

  // ฟังก์ชันสำหรับบันทึกการแก้ไขนัดหมาย
  const handleSaveEdit = async () => {
    if (!editingAppointment) return;

    try {
      const appointmentRef = doc(
        db,
        `users/${userId}/appointments`,
        editingAppointment.id
      );
      await updateDoc(appointmentRef, {
        patientName: editedPatientName,
        date: moment(editedDate).format("YYYY-MM-DD"),
        time: moment(editedTime).format("HH:mm:ss"),
        note: editedNote,
      });

      // อัพเดทข้อมูลใน state
      const updatedAppointments = allAppointments.map((app) =>
        app.id === editingAppointment.id
          ? {
              ...app,
              patientName: editedPatientName,
              date: moment(editedDate).format("YYYY-MM-DD"),
              time: moment(editedTime).format("HH:mm:ss"),
              note: editedNote,
            }
          : app
      );
      setAllAppointments(updatedAppointments);
      setAppointments(updatedAppointments.slice(0, 3));

      Alert.alert("สำเร็จ", "แก้ไขนัดหมายเรียบร้อยแล้ว");
      setEditModalVisible(false);
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการอัพเดทนัดหมาย: ", error);
      Alert.alert("ข้อผิดพลาด", "ไม่สามารถแก้ไขนัดหมายได้");
    }
  };

  // แก้ไขฟังก์ชัน scheduleNotification
  const scheduleNotification = async (item, type) => {
    try {
      const notificationDate = new Date(`${item.date}T${item.time}`);
      const currentTime = new Date();
  
      if (notificationDate <= currentTime) {
        return;
      }
  
      notificationDate.setMinutes(notificationDate.getMinutes() - 1);
  
      if (notificationDate <= currentTime) {
        return;
      }
  
      let title, body;
      if (type === "appointment") {
        title = "เตือนนัดหมายแพทย์";
        body = `คุณมีนัดกับ ${item.patientName} ในอีก 1 ชม`;
      } else if (type === "task") {
        title = "เตือนตารางงาน";
        body = `คุณมีงาน "${item.task}" ในอีก 1 ชม`;
      }
  
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: { type, id: item.id, date: item.date },
        },
        trigger: notificationDate,
      });
  
      console.log(
        `Notification scheduled: ${notificationId} for ${type} at ${notificationDate}`
      );
      return notificationId;
    } catch (error) {
      console.error("Error scheduling notification:", error);
      Alert.alert("ข้อผิดพลาด", "ไม่สามารถตั้งค่าการแจ้งเตือนได้");
    }
  };

  const checkScheduledNotifications = async () => {
    const scheduledNotifications =
      await Notifications.getAllScheduledNotificationsAsync();
    console.log("Scheduled notifications:", scheduledNotifications);
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
      tasksData.forEach(async (task) => {
        await scheduleNotification(task, "task");
      });
      checkScheduledNotifications(); // ตรวจสอบการแจ้งเตือนที่ถูกกำหนดไว้
    } catch (error) {
      console.error("Error fetching tasks:", error);
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

      // ตั้งค่าการแจ้งเตือนสำหรับนัดหมายวันนี้
      for (const appointment of appointmentsData) {
        await scheduleNotification(appointment, "appointment");
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
    }
  };

  const handleDeleteAppointment = async (appointmentId) => {
    Alert.alert("ยืนยันการลบ", "คุณแน่ใจหรือไม่ว่าต้องการลบนัดหมายนี้?", [
      {
        text: "ยกเลิก",
        style: "cancel",
      },
      {
        text: "ลบ",
        onPress: async () => {
          try {
            await deleteDoc(
              doc(db, `users/${userId}/appointments`, appointmentId)
            );
            setAllAppointments((prev) =>
              prev.filter((app) => app.id !== appointmentId)
            );
            setAppointments((prev) =>
              prev.filter((app) => app.id !== appointmentId)
            );

            setSummaryData((prev) => ({
              ...prev,
              appointmentsToday: Math.max(0, prev.appointmentsToday - 1),
            }));

            Alert.alert("สำเร็จ", "ลบนัดหมายเรียบร้อยแล้ว");
            fetchSummaryData(userId);
          } catch (error) {
            console.error("Error deleting appointment: ", error);
            Alert.alert("ข้อผิดพลาด", "ไม่สามารถลบนัดหมายได้");
          }
        },
      },
    ]);
  };

  // แก้ไขฟังก์ชัน handleCompleteAppointment
  const handleCompleteAppointment = async (appointment) => {
    try {
      // เพิ่มการนัดหมายลงใน completedAppointments subcollection
      const completedAppointmentsRef = collection(
        db,
        `users/${userId}/completedAppointments`
      );
      await addDoc(completedAppointmentsRef, {
        ...appointment,
        completedAt: new Date().toISOString(),
      });

      // ลบการนัดหมายออกจาก active appointments
      await deleteDoc(doc(db, `users/${userId}/appointments`, appointment.id));

      // อัปเดต state
      setAllAppointments((prev) =>
        prev.filter((app) => app.id !== appointment.id)
      );
      setAppointments((prev) =>
        prev.filter((app) => app.id !== appointment.id)
      );

      setSummaryData((prev) => ({
        ...prev,
        appointmentsToday: Math.max(0, prev.appointmentsToday - 1),
      }));

      Alert.alert("สำเร็จ", "บันทึกการเสร็จสิ้นนัดหมายเรียบร้อยแล้ว");
      fetchSummaryData(userId);
    } catch (error) {
      console.error("Error completing appointment: ", error);
      Alert.alert("ข้อผิดพลาด", "ไม่สามารถบันทึกการเสร็จสิ้นนัดหมายได้");
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

  // เพิ่มฟังก์ชันสำหรับแสดงรายละเอียดงาน
  const handleViewTaskDetail = (task) => {
    setSelectedTask(task);
    setTaskDetailModalVisible(true);
  };

  // แก้ไขฟังก์ชัน handleDeleteTask
  const handleDeleteTask = async (taskId) => {
    Alert.alert("ยืนยันการลบ", "คุณแน่ใจหรือไม่ว่าต้องการลบงานนี้?", [
      {
        text: "ยกเลิก",
        style: "cancel",
      },
      {
        text: "ลบ",
        onPress: async () => {
          try {
            const currentDate = new Date().toISOString().slice(0, 10);
            await deleteDoc(
              doc(
                db,
                `users/${userId}/TasksByDate/${currentDate}/tasks`,
                taskId
              )
            );
            fetchTasks(userId);
          } catch (error) {
            console.error("Error deleting task: ", error);
            Alert.alert("ข้อผิดพลาด", "ไม่สามารถลบงานได้");
          }
        },
      },
    ]);
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

  const TaskCard = ({ task, onDelete, onViewDetail }) => (
    <View style={styles.miniTaskCard}>
      <View style={styles.miniTaskTimeContainer}>
        <Text style={styles.miniTaskTime}>
          {moment(task.time, "HH:mm:ss").format("HH:mm")}
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
        onPress={() => onViewDetail(task)}
        style={styles.viewButton}
      >
        <Icon name="eye" size={24} color="#1E88E5" />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => onDelete(task.id)}
        style={styles.deleteButton}
      >
        <Icon name="delete" size={24} color="#FF5252" />
      </TouchableOpacity>
    </View>
  );

  // เพิ่ม TaskDetailModal component
  const TaskDetailModal = ({ visible, task, onClose }) => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>รายละเอียดงาน</Text>
          {task && (
            <>
              <Text style={styles.taskDetailTime}>
                {moment(task.time, "HH:mm:ss").format("HH:mm")}
              </Text>
              <Text style={styles.taskDetailTitle}>{task.task}</Text>
              <Text style={styles.taskDetailDescription}>
                {task.description || "ไม่มีรายละเอียด"}
              </Text>
            </>
          )}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>ปิด</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // Appointment Card component
  const AppointmentCard = ({ appointment, showActions = false }) => (
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
      {showActions && (
        <View style={styles.appointmentActions}>
          <TouchableOpacity
            onPress={() => handleEditAppointment(appointment)}
            style={styles.editButton}
          >
            <Icon name="pencil" size={24} color="#FFA000" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleCompleteAppointment(appointment)}
            style={styles.completeButton}
          >
            <Icon name="check-circle" size={24} color="#4CAF50" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleDeleteAppointment(appointment.id)}
            style={styles.deleteButton}
          >
            <Icon name="delete" size={24} color="#FF5252" />
          </TouchableOpacity>
        </View>
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
          {/* <TouchableOpacity
            style={styles.testNotificationButton}
            onPress={testNotification}
          >
            <Icon name="bell-ring" size={28} color="#FFF" />
          </TouchableOpacity> */}
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
                      <TaskCard
                        key={task.id}
                        task={task}
                        onDelete={handleDeleteTask}
                        onViewDetail={handleViewTaskDetail}
                      />
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
                      showActions={true}
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
              <Text style={styles.modalTitle}>นัดหมายทั้งหมด</Text>
              <FlatList
                data={allAppointments}
                renderItem={({ item }) => (
                  <AppointmentCard appointment={item} showActions={true} />
                )}
                keyExtractor={(item) => item.id}
                style={styles.flatList}
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

        <Modal
          animationType="slide"
          transparent={true}
          visible={editModalVisible}
          onRequestClose={() => setEditModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>แก้ไขนัดหมาย</Text>
              <TextInput
                style={styles.input}
                value={editedPatientName}
                onChangeText={setEditedPatientName}
                placeholder="ชื่อผู้ป่วย"
              />
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Text>{moment(editedDate).format("DD/MM/YYYY")}</Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={editedDate}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(false);
                    if (selectedDate) setEditedDate(selectedDate);
                  }}
                />
              )}
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => setShowTimePicker(true)}
              >
                <Text>{moment(editedTime).format("HH:mm")}</Text>
              </TouchableOpacity>
              {showTimePicker && (
                <DateTimePicker
                  value={editedTime}
                  mode="time"
                  display="default"
                  onChange={(event, selectedTime) => {
                    setShowTimePicker(false);
                    if (selectedTime) setEditedTime(selectedTime);
                  }}
                />
              )}
              <TextInput
                style={styles.input}
                value={editedNote}
                onChangeText={setEditedNote}
                placeholder="หมายเหตุ"
                multiline
              />
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveEdit}
              >
                <Text style={styles.saveButtonText}>บันทึก</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>ยกเลิก</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        <TaskDetailModal
          visible={taskDetailModalVisible}
          task={selectedTask}
          onClose={() => setTaskDetailModalVisible(false)}
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 10,
  },
  profileContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
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
    color: "#FFF", // เปลี่ยนจาก "#1E88E5" เป็น "#FFF"
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
  editButton: {
    padding: 8,
  },
  saveButton: {
    backgroundColor: "#4CAF50",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 10,
  },
  saveButtonText: {
    color: "#FFF",
    fontFamily: "Kanit-Regular",
    fontSize: 16,
  },
  datePickerButton: {
    backgroundColor: "#F0F0F0",
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
  },
  appointmentActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  // สไตล์สำหรับปุ่มแก้ไข
  editButton: {
    padding: 8,
  },
  // สไตล์สำหรับปุ่มทำเครื่องหมายว่าเสร็จสิ้น
  completeButton: {
    padding: 8,
  },
  // สไตล์สำหรับปุ่มลบ
  deleteButton: {
    padding: 8,
  },
  taskDetailTime: {
    fontSize: 18,
    fontFamily: "Kanit-Bold",
    color: "#1E88E5",
    marginBottom: 10,
  },
  taskDetailTitle: {
    fontSize: 20,
    fontFamily: "Kanit-Bold",
    color: "#333",
    marginBottom: 10,
  },
  taskDetailDescription: {
    fontSize: 16,
    fontFamily: "Kanit-Regular",
    color: "#666",
    marginBottom: 20,
  },

  viewButton: {
    padding: 8,
  },
  // testNotificationButton: {
  //   backgroundColor: "rgba(255, 255, 255, 0.2)",
  //   padding: 10,
  //   borderRadius: 20,
  //   marginLeft: 10,
  // },
});

export default DoctorHomePage;