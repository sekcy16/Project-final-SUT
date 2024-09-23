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
import Icon from "react-native-vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import { firebaseAuth, firebaseDB } from "../../config/firebase.config";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { LinearGradient } from 'expo-linear-gradient';

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
        setDoctorData(doctorDoc.data());
      } else {
        console.error("No such document!");
      }
    } catch (error) {
      console.error("Error fetching doctor data:", error);
    }
  };


  const handleSignOut = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { 
          text: "OK", 
          onPress: () => {
            firebaseAuth
              .signOut()
              .then(() => {
                navigation.navigate("LoginScreen");
              })
              .catch((error) => {
                console.error("Sign out error: ", error);
                Alert.alert("Error", "Failed to sign out. Please try again.");
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

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#1E88E5']}
        />
      }
    >
      <LinearGradient
        colors={['#1E88E5', '#1565C0']}
        style={styles.header}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.iconButton}
        >
          <Icon name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Doctor Profile</Text>
      </LinearGradient>

      <View style={styles.profileSection}>
        <Image
          source={{
            uri: doctorData?.profilePic || "https://via.placeholder.com/100",
          }}
          style={styles.profileImage}
        />
        <Text style={styles.doctorName}>{doctorData?.fullName || "Dr. Name"}</Text>
        <Text style={styles.specialization}>{doctorData?.specialization || "Specialization"}</Text>
        <Text style={styles.doctorEmail}>{doctorData?.providerData?.email || "Loading..."}</Text>

        <TouchableOpacity style={styles.editProfileButton} onPress={() => navigation.navigate("EditDoctorProfilePage")}>
          <Text style={styles.editProfileButtonText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      
      {/* <View style={styles.statsSection}>
        <StatItem
          icon="people-outline"
          label="Patients"
          value={doctorData?.patientCount || "0"}
        />
        <StatItem
          icon="calendar-outline"
          label="Appointments"
          value={doctorData?.appointmentCount || "0"}
        />
        <StatItem
          icon="star-outline"
          label="Rating"
          value={`${doctorData?.rating || "N/A"}`}
        />
      </View> */}

      <View style={styles.menuSection}>
        <MenuItem
          icon="calendar-outline"
          label="Schedule"
          onPress={() => navigation.navigate("Schedule")}
        />
        <MenuItem
          icon="people-outline"
          label="Patient List"
          onPress={() => navigation.navigate("PatientListScreen")}
        />
        <MenuItem
          icon="notifications-outline"
          label="Notifications"
          onPress={() => navigation.navigate("NotificationListScreen")}
        />
        <MenuItem
          icon="settings-outline"
          label="Settings"
          onPress={() => navigation.navigate("DoctorSettings")}
        />
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
        <Text style={styles.logoutButtonText}>Log Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const StatItem = ({ icon, label, value }) => (
  <View style={styles.statItem}>
    <Icon name={icon} size={24} color="#1E88E5" />
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={styles.statValue}>{value}</Text>
  </View>
);

const MenuItem = ({ icon, label, onPress }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <Icon name={icon} size={24} color="#1E88E5" />
    <Text style={styles.menuLabel}>{label}</Text>
    <Icon name="chevron-forward-outline" size={24} color="#999" />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    paddingTop: 40,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFF",
    marginLeft: 16,
  },
  iconButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  profileSection: {
    alignItems: "center",
    marginTop: 20,
    backgroundColor: "#FFFFFF",
    paddingVertical: 20,
    borderRadius: 20,
    marginHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: "#1E88E5",
  },
  doctorName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginTop: 10,
  },
  specialization: {
    fontSize: 18,
    color: "#666",
    marginTop: 5,
  },
  doctorEmail: {
    fontSize: 16,
    color: "#666",
    marginTop: 5,
  },
  editProfileButton: {
    marginTop: 15,
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: "#E3F2FD",
    borderRadius: 20,
  },
  editProfileButtonText: {
    color: "#1E88E5",
    fontWeight: "600",
  },
  statsSection: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 20,
    paddingVertical: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    marginHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statItem: {
    alignItems: "center",
  },
  statLabel: {
    color: "#666",
    marginTop: 5,
    fontSize: 14,
  },
  statValue: {
    fontWeight: "bold",
    marginTop: 5,
    color: "#333",
    fontSize: 18,
  },
  menuSection: {
    marginTop: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    marginHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  menuLabel: {
    flex: 1,
    marginLeft: 16,
    fontSize: 16,
    color: "#333",
  },
  logoutButton: {
    marginTop: 30,
    marginBottom: 30,
    backgroundColor: "#FF3B30",
    paddingVertical: 15,
    borderRadius: 10,
    alignSelf: 'center',
    width: width - 32,
  },
  logoutButtonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 18,
    textAlign: 'center',
  },
});

export default DoctorProfilePage;