import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import { firebaseAuth, firebaseDB } from "../config/firebase.config";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

const ProfilePage = () => {
  const navigation = useNavigation();
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
      if (user) {
        fetchUserData(user.uid);
      } else {
        setUserData(null); // Clear the data if no user is logged in
      }
    });

    return () => unsubscribe(); // Clean up the listener on component unmount
  }, []);

  const fetchUserData = async (uid) => {
    try {
      const userDocRef = doc(firebaseDB, "users", uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        setUserData(userDoc.data());
      } else {
        console.error("No such document!");
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const handleSignOut = () => {
    firebaseAuth
      .signOut()
      .then(() => {
        navigation.navigate("LoginScreen");
      })
      .catch((error) => {
        console.error("Sign out error: ", error);
        Alert.alert("Error", "Failed to sign out. Please try again.");
      });
  };

  const handleRefresh = () => {
    const user = firebaseAuth.currentUser;
    if (user) {
      fetchUserData(user.uid); // Refresh the user data
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.iconButton}
        >
          <Icon name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <View style={styles.profileSection}>
        <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
          <Icon name="refresh-outline" size={28} color="#004d00" />
        </TouchableOpacity>
        <Image
          source={{
            uri: userData?.profilePic || "https://via.placeholder.com/100",
          }}
          style={styles.profileImage}
        />
        <Text style={styles.userName}>{userData?.fullName || "Username"}</Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
            <Text style={styles.logoutButtonText}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.statsSection}>
        <StatItem
          icon="body-outline"
          label="Weight"
          value={`${userData?.weight || "N/A"} kg`}
        />
        <StatItem
          icon="resize-outline"
          label="Height"
          value={`${userData?.height || "N/A"} cm`}
        />
        <StatItem
          icon="fitness-outline"
          label="BMI"
          value={`${userData?.bmi || "N/A"}`}
        />
      </View>

      <View style={styles.menuSection}>
        <MenuItem
          icon="person-outline"
          label="Personal Information"
          onPress={() => navigation.navigate("EditProfilePage")}
        />
        <MenuItem
          icon="water-outline"
          label="Blood Sugar"
          onPress={() => navigation.navigate("BloodSugar")}
        />
        <MenuItem icon="bar-chart-outline" label="Goals" />
        <MenuItem icon="calendar-outline" label="History" />
        <MenuItem
          icon="body-outline"
          label="Weight"
          onPress={() => navigation.navigate("WeightProgress")}
        />
        <MenuItem
          icon="notifications-outline"
          label="Notifications"
          onPress={() => navigation.navigate("NotificationListScreen")}
        />
      </View>
    </ScrollView>
  );
};

const StatItem = ({ icon, label, value }) => (
  <View style={styles.statItem}>
    <Icon name={icon} size={24} color="#004d00" />
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={styles.statValue}>{value}</Text>
  </View>
);

const MenuItem = ({ icon, label, onPress }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <Icon name={icon} size={24} color="#004d00" />
    <Text style={styles.menuLabel}>{label}</Text>
    <Icon name="chevron-forward-outline" size={24} color="#999" />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E6F4EA",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#004d00",
    borderBottomWidth: 1,
    borderBottomColor: "#003300",
    borderRadius: 12,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFF",
  },
  iconButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#006400",
  },
  profileSection: {
    alignItems: "center",
    marginTop: 20,
    backgroundColor: "#FFFFFF",
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E6F4EA",
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "#004d00",
  },
  refreshButton: {
    position: "absolute",
    top: 10,
    right: 10,
    padding: 10,
  },
  userName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#004d00",
    marginTop: 10,
  },
  buttonContainer: {
    flexDirection: "row",
    marginTop: 10,
  },
  logoutButton: {
    backgroundColor: "#d82701",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  logoutButtonText: {
    color: "#FFF",
    fontWeight: "bold",
  },
  statsSection: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 20,
    paddingVertical: 20,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E6F4EA",
  },
  statItem: {
    alignItems: "center",
  },
  statLabel: {
    color: "#004d00",
    marginTop: 5,
  },
  statValue: {
    fontWeight: "bold",
    marginTop: 5,
    color: "#006400",
  },
  menuSection: {
    marginTop: 20,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E6F4EA",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E6F4EA",
  },
  menuLabel: {
    flex: 1,
    marginLeft: 16,
    fontSize: 16,
    color: "#004d00",
  },
});

export default ProfilePage;
