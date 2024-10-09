import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
  Dimensions,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation } from "@react-navigation/native";
import { firebaseAuth, firebaseDB } from "../../config/firebase.config";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get('window');

const DoctorProfilePage = () => {
  const navigation = useNavigation();
  const [doctorData, setDoctorData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
      if (user) {
        fetchDoctorData(user.uid);
      } else {
        setDoctorData(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchDoctorData = async (uid) => {
    try {
      const doctorDocRef = doc(firebaseDB, "users", uid);
      const doctorDoc = await getDoc(doctorDocRef);
  
      if (doctorDoc.exists()) {
        const data = doctorDoc.data();
        setDoctorData({
          ...data,
          email: data.providerData?.email || 'ไม่พบอีเมล'
        });
      } else {
        console.error("ไม่พบเอกสารดังกล่าว!");
      }
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการดึงข้อมูลแพทย์:", error);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      "ออกจากระบบ",
      "คุณแน่ใจหรือไม่ที่ต้องการออกจากระบบ?",
      [
        {
          text: "ยกเลิก",
          style: "cancel"
        },
        { 
          text: "ตกลง", 
          onPress: () => {
            firebaseAuth
              .signOut()
              .then(() => {
                navigation.navigate("LoginScreen");
              })
              .catch((error) => {
                console.error("ข้อผิดพลาดในการออกจากระบบ: ", error);
                Alert.alert("ข้อผิดพลาด", "ไม่สามารถออกจากระบบได้ กรุณาลองอีกครั้ง");
              });
          }
        }
      ]
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    const user = firebaseAuth.currentUser;
    if (user) {
      await fetchDoctorData(user.uid);
    }
    setRefreshing(false);
  };

  const StatItem = ({ icon, label, value, color }) => (
    <View style={styles.statItem}>
      <Icon name={icon} size={28} color={color} />
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color: color }]}>{value}</Text>
    </View>
  );

  const MenuItem = ({ icon, label, onPress, color }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={[styles.menuIconContainer, { backgroundColor: color }]}>
        <Icon name={icon} size={24} color="#FFF" />
      </View>
      <Text style={styles.menuLabel}>{label}</Text>
      <Icon name="chevron-right" size={24} color="#999" />
    </TouchableOpacity>
  );

  return (
    <LinearGradient colors={["#4A90E2", "#50E3C2"]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollViewContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#1E88E5"]}
            />
          }
        >
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Icon name="arrow-left" size={24} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>โปรไฟล์แพทย์</Text>
          </View>
          
          <View style={styles.profileCard}>
            <Image
              source={{
                uri: doctorData?.profilePic || "https://via.placeholder.com/100",
              }}
              style={styles.profileImage}
            />
            <Text style={styles.doctorName}>{doctorData?.fullName || "ชื่อแพทย์"}</Text>
            <Text style={styles.specialization}>{doctorData?.specialization || "สาขาเชี่ยวชาญ"}</Text>
            <Text style={styles.doctorEmail}>{doctorData?.email || "กำลังโหลด.."}</Text>

            <TouchableOpacity
              style={styles.editProfileButton}
              onPress={() => navigation.navigate("EditDoctorProfilePage")}
            >
              <Text style={styles.editProfileButtonText}>แก้ไขโปรไฟล์</Text>
            </TouchableOpacity>
          </View>

          {/* <View style={styles.statsSection}>
            <StatItem
              icon="account-group"
              label="ผู้ป่วย"
              value={doctorData?.patientCount || "0"}
              color="#FF6B6B"
            />
            <StatItem
              icon="calendar-check"
              label="นัดหมาย"
              value={doctorData?.appointmentCount || "0"}
              color="#4ECDC4"
            />
            <StatItem
              icon="star"
              label="คะแนน"
              value={`${doctorData?.rating || "N/A"}`}
              color="#FFD93D"
            />
          </View> */}

          <View style={styles.menuSection}>
            <MenuItem
              icon="calendar-clock"
              label="ตารางนัดหมาย"
              onPress={() => navigation.navigate("Schedule")}
              color="#FF6B6B"
            />
            <MenuItem
              icon="account-group"
              label="รายชื่อผู้ป่วย"
              onPress={() => navigation.navigate("PatientListScreen")}
              color="#4ECDC4"
            />
            <MenuItem
              icon="bell-outline"
              label="การแจ้งเตือน"
              onPress={() => navigation.navigate("NotificationListScreen")}
              color="#FFD93D"
            />
            <MenuItem
              icon="bookmark-outline"
              label="บุ๊กมาร์ก"
              onPress={() => navigation.navigate("BookmarkListPage")}
              color="#6BCB77"
            />
            <MenuItem
              icon="cog-outline"
              label="การตั้งค่า"
              onPress={() => navigation.navigate("DoctorSettings")}
              color="#FF7F50"
            />
          </View>

          <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
            <Text style={styles.logoutButtonText}>ออกจากระบบ</Text>
          </TouchableOpacity>
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
    paddingBottom: 30,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    paddingTop: 50,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  headerTitle: {
    fontSize: 28,
    color: "#FFF",
    marginLeft: 16,
    fontFamily: "Kanit-Bold",
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  profileCard: {
    alignItems: "center",
    marginTop: 20,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    paddingVertical: 30,
    borderRadius: 20,
    marginHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: "#4A90E2",
  },
  doctorName: {
    fontSize: 24,
    color: "#333",
    marginTop: 15,
    fontFamily: "Kanit-Bold",
  },
  specialization: {
    fontSize: 18,
    color: "#666",
    marginTop: 5,
    fontFamily: "Kanit-Regular",
  },
  doctorEmail: {
    fontSize: 16,
    color: "#666",
    marginTop: 5,
    fontFamily: "Kanit-Regular",
  },
  editProfileButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 25,
    backgroundColor: "#4A90E2",
    borderRadius: 25,
  },
  editProfileButtonText: {
    color: "#FFF",
    fontFamily: "Kanit-Bold",
    fontSize: 16,
  },
  statsSection: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 20,
    paddingVertical: 20,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 20,
    marginHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  statItem: {
    alignItems: "center",
  },
  statLabel: {
    color: "#666",
    marginTop: 8,
    fontSize: 14,
    fontFamily: "Kanit-Regular",
  },
  statValue: {
    fontFamily: "Kanit-Bold",
    marginTop: 5,
    fontSize: 18,
  },
  menuSection: {
    marginTop: 20,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 20,
    marginHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    overflow: "hidden",
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E6E6E6",
  },
  menuLabel: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    fontFamily: "Kanit-Regular",
  },
  logoutButton: {
    marginTop: 30,
    marginHorizontal: 16,
    backgroundColor: "#FF3B30",
    paddingVertical: 15,
    borderRadius: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  logoutButtonText: {
    color: "#FFF",
    fontSize: 18,
    textAlign: "center",
    fontFamily: "Kanit-Bold",
  },
});

export default DoctorProfilePage;