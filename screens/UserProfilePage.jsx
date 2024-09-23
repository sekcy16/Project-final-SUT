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
import { firebaseAuth, firebaseDB } from "../config/firebase.config";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const ProfilePage = () => {
  const navigation = useNavigation();
  const [userData, setUserData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
      if (user) {
        fetchUserData(user.uid);
      } else {
        setUserData(null);
      }
    });

    return () => unsubscribe();
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
      await fetchUserData(user.uid);
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
        colors={['#004d00', '#006400']}
        style={styles.header}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.iconButton}
        >
          <Icon name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
      </LinearGradient>


      <View style={styles.profileSection}>
        <Image
          source={{
            uri: userData?.profilePic || "https://via.placeholder.com/100",
          }}
          style={styles.profileImage}
        />
        <Text style={styles.userName}>{userData?.fullName || "Username"}</Text>
        <Text style={styles.userEmail}>{userData?.providerData?.email || "Loading..."}</Text>

        <TouchableOpacity style={styles.editProfileButton} onPress={() => navigation.navigate("EditProfilePage")}>
          <Text style={styles.editProfileButtonText}>Edit Profile</Text>
        </TouchableOpacity>
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
          icon="water-outline"
          label="Blood Sugar"
          onPress={() => navigation.navigate("BloodSugar")}
        />
        <MenuItem 
          icon="bar-chart-outline" 
          label="Goals" 
          onPress={() => navigation.navigate("Goals")}
        />
        <MenuItem 
          icon="calendar-outline" 
          label="History"
          onPress={() => navigation.navigate("History")}
        />
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
        <MenuItem
          icon="bookmark-outline"
          label="Bookmarks"
          onPress={() => navigation.navigate("BookmarkListPage")}
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
    borderColor: "#004d00",
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#004d00",
    marginTop: 10,
  },
  userEmail: {
    fontSize: 16,
    color: "#666",
    marginTop: 5,
  },
  editProfileButton: {
    marginTop: 15,
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: "#E6F4EA",
    borderRadius: 20,
  },
  editProfileButtonText: {
    color: "#004d00",
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
    color: "#004d00",
    marginTop: 5,
    fontSize: 14,
  },
  statValue: {
    fontWeight: "bold",
    marginTop: 5,
    color: "#006400",
    fontSize: 16,
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
    marginLeft: 16,
    fontSize: 16,
    color: "#004d00",
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

export default ProfilePage;