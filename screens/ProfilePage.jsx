import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { firebaseAuth, firebaseDB } from '../config/firebase.config';
import { doc, getDoc } from 'firebase/firestore';

const ProfilePage = () => {
  const navigation = useNavigation();
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    fetchUserData();  // Initial fetch when component mounts
  }, []);

  const fetchUserData = async () => {
    const user = firebaseAuth.currentUser;

    if (user) {
      try {
        const userDocRef = doc(firebaseDB, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          setUserData(userDoc.data());
        } else {
          console.error('No such document!');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    }
  };

  const handleSignOut = () => {
    firebaseAuth
      .signOut()
      .then(() => {
        navigation.navigate('LoginScreen');
      })
      .catch((error) => {
        console.error('Sign out error: ', error);
        Alert.alert('Error', 'Failed to sign out. Please try again.');
      });
  };

  const handleRefresh = () => {
    fetchUserData();  // Refresh the user data
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
        <TouchableOpacity
          onPress={() => navigation.navigate('EditProfilePage')}
          style={styles.editButton}
        >
          <Icon name="pencil" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.profileSection}>
      <TouchableOpacity
          style={styles.refreshButton}
          onPress={handleRefresh}
        >
          <Icon name="refresh-outline" size={28} color="#004d00" />
        </TouchableOpacity>
        <Image
          source={{ uri: userData?.profilePic || 'https://via.placeholder.com/100' }}
          style={styles.profileImage}
        />
        <Text style={styles.userName}>{userData?.fullName || 'Username'}</Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
            <Text style={styles.logoutButtonText}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.statsSection}>
        <StatItem icon="body-outline" label="Weight" value="75.5 kg" />
        <StatItem icon="resize-outline" label="Height" value="175 cm" />
        <StatItem icon="fitness-outline" label="BMI" value="24.7" />
      </View>

      <View style={styles.menuSection}>
        <MenuItem icon="person-outline" label="Personal Information" onPress={() => navigation.navigate('EditProfilePage')} />
        <MenuItem icon="bar-chart-outline" label="Goals" />
        <MenuItem icon="calendar-outline" label="History" />
        <MenuItem icon="heart-outline" label="Health" />
        <MenuItem icon="notifications-outline" label="Notifications" onPress={() => navigation.navigate('NotificationListScreen')} />
        <MenuItem icon="water-outline" label="Blood Sugar" onPress={() => navigation.navigate('BloodSugar')} />
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
    backgroundColor: '#E6F4EA',  // Light Green background for the container
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#004d00', // Dark Green for header
    borderBottomWidth: 1,
    borderBottomColor: '#003300', // Even darker Green for contrast
    borderRadius: 12,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF', // White color for header title
  },
  iconButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#006400',  // Dark Green for icon button
  },
  editButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#006400',  // Dark Green for edit button
  },
  profileSection: {
    alignItems: 'center',
    marginTop: 20,
    backgroundColor: '#FFFFFF', // White for profile section
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E6F4EA', // Light Green for border
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#004d00', // Dark Green for profile image border
  },
  refreshButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 10,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#004d00', // Dark Green for user name
    marginTop: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: 10,
  },
  logoutButton: {
    backgroundColor: '#d82701', // Red for logout button
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  logoutButtonText: {
    color: '#FFF', // White color for logout button text
    fontWeight: 'bold',
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    paddingVertical: 20,
    backgroundColor: '#FFFFFF', // White for stats section
    borderBottomWidth: 1,
    borderBottomColor: '#E6F4EA', // Light Green for border
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    color: '#004d00', // Dark Green for stat labels
    marginTop: 5,
  },
  statValue: {
    fontWeight: 'bold',
    marginTop: 5,
    color: '#006400', // Darker Green for stat values
  },
  menuSection: {
    marginTop: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F4EA', // Light Green for menu items
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E6F4EA', // Light Green for border
  },
  menuLabel: {
    flex: 1,
    marginLeft: 16,
    fontSize: 16,
    color: '#004d00', // Dark Green for menu labels
  },
});

export default ProfilePage;
