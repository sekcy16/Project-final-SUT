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
import { firebaseAuth, firebaseDB } from "../config/firebase.config";
import { doc, getDoc, onSnapshot, collection, query, where } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { LinearGradient } from "expo-linear-gradient";

const ProfilePage = () => {
  const navigation = useNavigation();
  const [userData, setUserData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [unreadDoctorAdvice, setUnreadDoctorAdvice] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    let unsubscribeAuth = null;
    let unsubscribeFirestore = null;
    let unsubscribeDoctorAdvice = null;
    let unsubscribeNotifications = null;

    const setupSubscriptions = async () => {
      unsubscribeAuth = onAuthStateChanged(firebaseAuth, (user) => {
        if (user) {
          setIsAuthenticated(true);
          const userDocRef = doc(firebaseDB, "users", user.uid);
          unsubscribeFirestore = onSnapshot(userDocRef,
            (doc) => {
              if (doc.exists()) {
                setUserData(doc.data());
              } else {
                console.log("No such document!");
              }
            },
            (error) => {
              console.error("Error fetching user data:", error);
              if (error.code === 'permission-denied') {
                console.log("Permission denied. User might be logged out.");
                handleSignOut();
              }
            }
          );

          // Doctor Advice
          const doctorAdviceQuery = query(
            collection(firebaseDB, "users", user.uid, "advice"),
            where("read", "==", false)
          );
          unsubscribeDoctorAdvice = onSnapshot(doctorAdviceQuery, (querySnapshot) => {
            setUnreadDoctorAdvice(querySnapshot.size);
          });

          // Notifications
          const notificationsQuery = query(
            collection(firebaseDB, "Notidetails"),
            where("userId", "==", user.uid),
            where("read", "==", false)
          );
          unsubscribeNotifications = onSnapshot(notificationsQuery, (querySnapshot) => {
            setUnreadNotifications(querySnapshot.size);
          });

        } else {
          setIsAuthenticated(false);
          setUserData(null);
          if (unsubscribeFirestore) {
            unsubscribeFirestore();
            unsubscribeFirestore = null;
          }
          navigation.navigate("LoginScreen");
        }
      });
    };

    setupSubscriptions();

    return () => {
      if (unsubscribeAuth) unsubscribeAuth();
      if (unsubscribeFirestore) unsubscribeFirestore();
      if (unsubscribeDoctorAdvice) unsubscribeDoctorAdvice();
      if (unsubscribeNotifications) unsubscribeNotifications();
    };
  }, [navigation]);

  const handleSignOut = async () => {
    try {
      await firebaseAuth.signOut();
      setIsAuthenticated(false);
      setUserData(null);
      navigation.navigate("LoginScreen");
    } catch (error) {
      console.error("Error signing out: ", error);
      Alert.alert("Error", "Failed to sign out. Please try again.");
    }
  };


  const onRefresh = async () => {
    if (!isAuthenticated) {
      return;
    }
    setRefreshing(true);
    const user = firebaseAuth.currentUser;
    if (user) {
      try {
        const userDocRef = doc(firebaseDB, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        }
      } catch (error) {
        console.error("เกิดข้อผิดพลาดในการรีเฟรชข้อมูล:", error);
      }
    }
    setRefreshing(false);
  };

  return (
    <LinearGradient colors={["#4A90E2", "#50E3C2"]} style={styles.container}>
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
          <Text style={styles.headerTitle}>โปรไฟล์</Text>
        </View>

        <View style={styles.profileCard}>
          <Image
            source={{
              uri: userData?.profilePic || "https://via.placeholder.com/100",
            }}
            style={styles.profileImage}
          />
          <Text style={styles.userName}>
            {userData?.fullName || "ชื่อผู้ใช้"}
          </Text>
          <Text style={styles.userEmail}>
            {userData?.email || "กำลังโหลด..."}
          </Text>

          <TouchableOpacity
            style={styles.editProfileButton}
            onPress={() => navigation.navigate("EditProfilePage")}
          >
            <Text style={styles.editProfileButtonText}>แก้ไขโปรไฟล์</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsSection}>
          <StatItem
            icon="human-male-height"
            label="น้ำหนัก"
            value={`${userData?.weight || "ไม่ระบุ"} กก.`}
            color="#FF6B6B"
          />
          <StatItem
            icon="human-male-height-variant"
            label="ส่วนสูง"
            value={`${userData?.height || "ไม่ระบุ"} ซม.`}
            color="#4ECDC4"
          />
          <StatItem
            icon="scale-bathroom"
            label="BMI"
            value={`${userData?.bmi || "ไม่ระบุ"}`}
            color="#FFD93D"
          />
        </View>
        <View style={styles.menuSection}>
          <MenuItem
            icon="water-percent"
            label="น้ำตาลในเลือด"
            onPress={() => navigation.navigate("BloodSugar")}
            color="#FF6B6B"
          />
          <MenuItem
            icon="scale"
            label="น้ำหนัก"
            onPress={() => navigation.navigate("WeightProgress")}
            color="#4ECDC4"
          />
          <MenuItem
            icon="bell-outline"
            label="การแจ้งเตือน"
            onPress={() => navigation.navigate("NotificationListScreen")}
            color="#FFD93D"
            badgeCount={unreadNotifications}
          />
          <MenuItem
            icon="doctor"
            label="คำแนะนำจากหมอ"
            onPress={() => navigation.navigate("AdviceListScreen")}
            color="#42d3dc"
            badgeCount={unreadDoctorAdvice}
          />
          <MenuItem
            icon="bookmark-outline"
            label="บุ๊กมาร์ก"
            onPress={() => navigation.navigate("BookmarkListPage")}
            color="#6BCB77"
          />
          <MenuItem
            icon="account-group"
            label="รายชื่อญาติ"
            onPress={() => navigation.navigate("RelativesListScreen")}
            color="#FF7F50"
          />
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
          <Text style={styles.logoutButtonText}>ออกจากระบบ</Text>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
};

const StatItem = ({ icon, label, value, color }) => (
  <View style={styles.statItem}>
    <Icon name={icon} size={28} color={color} />
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={[styles.statValue, { color: color }]}>{value}</Text>
  </View>
);
const MenuItem = ({ icon, label, onPress, color, badgeCount = 0 }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <View style={[styles.menuIconContainer, { backgroundColor: color }]}>
      <Icon name={icon} size={24} color="#FFF" />
      {badgeCount > 0 && (
        <View style={styles.badgeContainer}>
          <Text style={styles.badgeText}>{badgeCount}</Text>
        </View>
      )}
    </View>
    <Text style={styles.menuLabel}>{label}</Text>
    <Icon name="chevron-right" size={24} color="#999" />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
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
  userName: {
    fontSize: 24,
    color: "#333",
    marginTop: 15,
    fontFamily: "Kanit-Bold",
  },
  userEmail: {
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
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
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
  badgeContainer: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: 'red',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default ProfilePage;
