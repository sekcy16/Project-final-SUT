import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Animated,
} from "react-native";
import { Calendar } from "react-native-calendars";
import DateTimePicker from "@react-native-community/datetimepicker";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  setDoc,
  addDoc,
} from "firebase/firestore";
import { firebaseDB, firebaseAuth } from "../config/firebase.config";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import * as Notifications from "expo-notifications";
// Set up notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const TakeMedScreen = () => {
  const navigation = useNavigation();
  const [selectedDate, setSelectedDate] = useState("");
  const [takemed, settakemed] = useState("");
  const [quantity, setQuantity] = useState(1); // New state for quantity
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
          const userRef = doc(firebaseDB, "users", currentUser.uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            const userData = userSnap.data();
            setUserRole(userData.role);
          } else {
            console.log("No such document!");
          }
        } catch (error) {
          console.error("Error fetching user role: ", error);
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

  // Function to request notification permissions
  const requestNotificationPermissions = async () => {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      Alert.alert(
        "การแจ้งเตือนถูกปิด",
        "กรุณาเปิดการแจ้งเตือนในการตั้งค่าเพื่อรับการแจ้งเตือนการกินยา"
      );
      return false;
    }
    return true;
  };

  const scheduleMedicationNotification = async (medicationData) => {
    try {
      const { takemed, quantity, date, time } = medicationData;
  
      // Create notification datetime from selected date and time
      const [hours, minutes] = time.split(":");
      const medicationTime = new Date(date);
      medicationTime.setHours(parseInt(hours, 10));
      medicationTime.setMinutes(parseInt(minutes, 10));
      medicationTime.setSeconds(0);
  
      // Create reminder time (30 minutes before)
      const reminderTime = new Date(medicationTime);
      reminderTime.setMinutes(reminderTime.getMinutes() - 2);
  
      // Check if the times are in the past
      if (medicationTime < new Date()) {
        Alert.alert("ข้อผิดพลาด", "ไม่สามารถตั้งการแจ้งเตือนสำหรับเวลาที่ผ่านมาแล้วได้");
        return null;
      }
  
      // Schedule reminder notification (30 minutes before)
      const reminderNotificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: "เตรียมตัวกินยา",
          body: `อีก 30 นาที จะถึงเวลากินยา ${takemed} จำนวน ${quantity} เม็ด`,
          data: {
            type: "medication_reminder",
            medicationId: medicationData.id,
            medication: takemed,
            quantity: quantity
          },
          sound: true,
        },
        trigger: reminderTime,
      });
  
      // Schedule main medication notification
      const medicationNotificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: "เตือนการกินยา",
          body: `ถึงเวลากินยา ${takemed} จำนวน ${quantity} เม็ด`,
          data: {
            type: "medication",
            medicationId: medicationData.id,
            medication: takemed,
            quantity: quantity
          },
          sound: true,
        },
        trigger: medicationTime,
      });
  
      return {
        reminderNotificationId,
        medicationNotificationId
      };
    } catch (error) {
      console.error("Error scheduling notification:", error);
      Alert.alert("ข้อผิดพลาด", "ไม่สามารถตั้งการแจ้งเตือนได้");
      return null;
    }
  };

  // Function to schedule repeating medication notification
  const scheduleRepeatingNotification = async (medicationData) => {
    try {
      const { takemed, quantity, time } = medicationData;
      const [hours, minutes] = time.split(":");

      // Schedule daily notification
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: "เตือนการกินยา",
          body: `ถึงเวลากินยา ${takemed} จำนวน ${quantity} เม็ด`,
          data: {
            type: "medication",
            medicationId: medicationData.id,
            medication: takemed,
            quantity: quantity,
          },
        },
        trigger: {
          hour: parseInt(hours, 10),
          minute: parseInt(minutes, 10),
          repeats: true,
        },
      });

      return notificationId;
    } catch (error) {
      console.error("Error scheduling repeating notification:", error);
      return null;
    }
  };

  const handleDateSelect = (day) => {
    setSelectedDate(day.dateString);
  };

  const handleTimeChange = (event, selectedTime) => {
    const currentTime = selectedTime || time;
    setShowTimePicker(false);
    setTime(currentTime);
  };

  // New functions for quantity handling
  const incrementQuantity = () => {
    setQuantity((prev) => prev + 1);
  };

  const decrementQuantity = () => {
    setQuantity((prev) => (prev > 1 ? prev - 1 : 1));
  };

  const handleQuantityChange = (text) => {
    const num = parseInt(text);
    if (!isNaN(num) && num > 0) {
      setQuantity(num);
    }
  };

  // Modified handleAddTakeMed function to include notification scheduling
  const handleAddTakeMed = async () => {
    if (takemed && selectedDate && quantity > 0) {
      if (userRole === "User") {
        try {
          const takemedByDateRef = doc(
            firestore,
            "users",
            currentUser.uid,
            "TakeMedDate",
            selectedDate
          );
          const takemedCollectionRef = collection(takemedByDateRef, "takemeds");

          // Add medication data to Firestore
          const docRef = await addDoc(takemedCollectionRef, {
            takemed,
            quantity,
            date: selectedDate,
            time: time.toLocaleTimeString(),
            userId: currentUser.uid,
            createdAt: new Date(),
          });

          // Prepare medication data for notification
          const medicationData = {
            id: docRef.id,
            takemed,
            quantity,
            date: selectedDate,
            time: time.toLocaleTimeString(),
          };

          // Schedule notification
          const notifications = await scheduleMedicationNotification(medicationData);

          if (notifications) {
            // Update the document with both notification IDs
            await setDoc(docRef, { 
              reminderNotificationId: notifications.reminderNotificationId,
              medicationNotificationId: notifications.medicationNotificationId 
            }, { merge: true });
          
            Alert.alert(
              "สำเร็จ", 
              "ตั้งเวลากินยาและการแจ้งเตือนสำเร็จ\nระบบจะแจ้งเตือนล่วงหน้า 30 นาที"
            );
          } else {
            Alert.alert(
              "สำเร็จบางส่วน",
              "ตั้งเวลากินยาสำเร็จ แต่ไม่สามารถตั้งการแจ้งเตือนได้"
            );
          }

          settakemed("");
          setQuantity(1);
        } catch (error) {
          console.error("Error adding TakeMed: ", error);
          Alert.alert("ข้อผิดพลาด", "ไม่สามารถเพิ่มการกินยาได้");
        }
      } else {
        Alert.alert("ข้อผิดพลาด", "คุณไม่มีสิทธิ์ในการเพิ่มการกินยา");
      }
    } else {
      Alert.alert("ข้อผิดพลาด", "กรุณากรอกข้อมูลให้ครบถ้วน");
    }
  };


  // const testNotification = async () => {
  //   try {
  //     await Notifications.scheduleNotificationAsync({
  //       content: {
  //         title: "ทดสอบการแจ้งเตือน",
  //         body: "นี่คือการทดสอบ จะแสดงใน 5 วินาที",
  //       },
  //       trigger: { seconds: 5 },
  //     });
  //     Alert.alert("สำเร็จ", "การแจ้งเตือนจะแสดงใน 5 วินาที");
  //   } catch (error) {
  //     console.error("Error scheduling test notification:", error);
  //     Alert.alert("ข้อผิดพลาด", "ไม่สามารถสร้างการแจ้งเตือนได้");
  //   }
  // };

  return (
    <LinearGradient colors={["#4A90E2", "#50E3C2"]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollViewContent}>
          <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
            {/* Header Section */}
            <View style={styles.header}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.backButton}
              >
                <Icon name="arrow-left" size={24} color="#FFF" />
              </TouchableOpacity>
              <View style={styles.headerTextContainer}>
                <Text style={styles.title}>ตั้งเวลาการกินยา</Text>
                <Text style={styles.subtitle}>
                  กรุณาเลือกวันและเวลาที่ต้องการกินยา
                </Text>
              </View>
            </View>
            {/* <TouchableOpacity
              style={styles.testButton}
              onPress={testNotification}
            >
              <Icon name="bell-ring" size={24} color="#FFF" />
              <Text style={styles.buttonText}>ทดสอบการแจ้งเตือน</Text>
            </TouchableOpacity> */}
            <View style={styles.mainCard}>
              {/* Calendar Section */}
              <View style={styles.calendarContainer}>
                <View style={styles.sectionHeader}>
                  <Icon name="calendar-clock" size={24} color="#4A90E2" />
                  <Text style={styles.sectionTitle}>เลือกวันที่</Text>
                </View>
                <Calendar
                  onDayPress={handleDateSelect}
                  markedDates={{
                    [selectedDate]: {
                      selected: true,
                      selectedColor: "#4CAF50",
                    },
                  }}
                  theme={{
                    backgroundColor: "#ffffff",
                    calendarBackground: "#ffffff",
                    textSectionTitleColor: "#4A90E2",
                    selectedDayBackgroundColor: "#4CAF50",
                    selectedDayTextColor: "#ffffff",
                    todayTextColor: "#4A90E2",
                    dayTextColor: "#2d4150",
                    textDisabledColor: "#d9e1e8",
                    dotColor: "#4CAF50",
                    selectedDotColor: "#ffffff",
                    arrowColor: "#4A90E2",
                    monthTextColor: "#4A90E2",
                    indicatorColor: "#4A90E2",
                    textDayFontFamily: "Kanit-Regular",
                    textMonthFontFamily: "Kanit-Bold",
                    textDayHeaderFontFamily: "Kanit-Regular",
                    textDayFontSize: 16,
                    textMonthFontSize: 18,
                    textDayHeaderFontSize: 14,
                  }}
                  style={styles.calendar}
                />
              </View>

              {selectedDate ? (
                <View style={styles.formContainer}>
                  {/* Time Selection Section */}
                  <View style={styles.sectionHeader}>
                    <Icon name="clock-outline" size={24} color="#4A90E2" />
                    <Text style={styles.sectionTitle}>เลือกเวลา</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.timeButton}
                    onPress={() => setShowTimePicker(true)}
                  >
                    <Icon name="clock" size={24} color="#fff" />
                    <Text style={styles.timeButtonText}>
                      {time.toLocaleTimeString()}
                    </Text>
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

                  {/* Medication Details Section */}
                  <View style={styles.sectionHeader}>
                    <Icon name="pill" size={24} color="#4A90E2" />
                    <Text style={styles.sectionTitle}>รายละเอียดการกินยา</Text>
                  </View>

                  <View style={styles.inputContainer}>
                    <Icon
                      name="medical-bag"
                      size={24}
                      color="#4A90E2"
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="ชื่อยาที่ต้องกิน"
                      value={takemed}
                      onChangeText={settakemed}
                      placeholderTextColor="#999"
                    />
                  </View>

                  <View style={styles.quantitySection}>
                    <Text style={styles.quantityLabel}>จำนวนยา (เม็ด)</Text>
                    <View style={styles.quantityContainer}>
                      <TouchableOpacity
                        onPress={decrementQuantity}
                        style={styles.quantityButton}
                      >
                        <Icon name="minus" size={24} color="#4A90E2" />
                      </TouchableOpacity>

                      <TextInput
                        style={styles.quantityInput}
                        value={quantity.toString()}
                        onChangeText={handleQuantityChange}
                        keyboardType="numeric"
                        textAlign="center"
                      />

                      <TouchableOpacity
                        onPress={incrementQuantity}
                        style={styles.quantityButton}
                      >
                        <Icon name="plus" size={24} color="#4A90E2" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Submit Button */}
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={handleAddTakeMed}
                  >
                    <Icon name="clock-check" size={24} color="#FFF" />
                    <Text style={styles.addButtonText}>ตั้งเวลากินยา</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.noDateContainer}>
                  <Icon name="calendar-alert" size={48} color="#4A90E2" />
                  <Text style={styles.noDateText}>
                    กรุณาเลือกวันที่ที่ต้องการตั้งเวลากินยา
                  </Text>
                </View>
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
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
  },
  headerTextContainer: {
    flex: 1,
  },
  backButton: {
    padding: 10,
    marginRight: 10,
  },
  title: {
    fontSize: 28,
    fontFamily: "Kanit-Bold",
    color: "#FFF",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: "Kanit-Regular",
    color: "#FFF",
    opacity: 0.8,
  },
  mainCard: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    flex: 1,
    padding: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    backgroundColor: "#F5F5F5",
    padding: 10,
    borderRadius: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Kanit-Medium",
    color: "#4A90E2",
    marginLeft: 10,
  },
  calendarContainer: {
    backgroundColor: "#FFF",
    borderRadius: 15,
    padding: 10,
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  timeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4CAF50",
    padding: 15,
    borderRadius: 15,
    marginBottom: 20,
    elevation: 2,
  },
  timeButtonText: {
    color: "#FFF",
    fontSize: 18,
    fontFamily: "Kanit-Medium",
    marginLeft: 10,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 15,
    padding: 5,
    marginBottom: 20,
  },
  inputIcon: {
    padding: 10,
  },
  input: {
    flex: 1,
    padding: 15,
    fontSize: 16,
    fontFamily: "Kanit-Regular",
  },
  quantitySection: {
    marginBottom: 20,
  },
  quantityLabel: {
    fontSize: 16,
    fontFamily: "Kanit-Medium",
    color: "#4A90E2",
    marginBottom: 10,
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 15,
    padding: 10,
  },
  quantityButton: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 15,
    elevation: 2,
  },
  quantityInput: {
    width: 80,
    textAlign: "center",
    fontSize: 24,
    fontFamily: "Kanit-Bold",
    color: "#4A90E2",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4CAF50",
    padding: 18,
    borderRadius: 15,
    elevation: 3,
  },
  addButtonText: {
    color: "#FFF",
    fontSize: 18,
    fontFamily: "Kanit-Bold",
    marginLeft: 10,
  },
  noDateContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
  },
  noDateText: {
    fontSize: 16,
    fontFamily: "Kanit-Regular",
    color: "#666",
    textAlign: "center",
    marginTop: 15,
  },
});

export default TakeMedScreen;
