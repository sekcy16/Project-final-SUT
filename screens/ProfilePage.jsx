import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { firebaseAuth } from '../config/firebase.config';

const ProfilePage = () => {
  const navigation = useNavigation();

  const handleSignOut = () => {
    firebaseAuth.signOut()
      .then(() => {
        navigation.navigate('LoginScreen');
      })
      .catch((error) => {
        console.error('Sign out error: ', error);
        Alert.alert('Error', 'Failed to sign out. Please try again.');
      });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>โปรไฟล์</Text>
        <TouchableOpacity style={styles.iconButton}>
          <Icon name="settings-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.profileSection}>
        <Image
          source={{ uri: 'https://via.placeholder.com/100' }}
          style={styles.profileImage}
        />
        <Text style={styles.userName}>ชื่อผู้ใช้</Text>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.editButton}>
            <Text style={styles.editButtonText}>แก้ไขโปรไฟล์</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.logoutButton} 
            onPress={handleSignOut} 
          >
            <Text style={styles.logoutButtonText}>ออกจากระบบ</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.statsSection}>
        <StatItem icon="body-outline" label="น้ำหนัก" value="75.5 kg" />
        <StatItem icon="resize-outline" label="ส่วนสูง" value="175 cm" />
        <StatItem icon="fitness-outline" label="BMI" value="24.7" />
      </View>

      <View style={styles.menuSection}>
        <MenuItem icon="person-outline" label="ข้อมูลส่วนตัว" />
        <MenuItem icon="bar-chart-outline" label="เป้าหมาย" />
        <MenuItem icon="calendar-outline" label="ประวัติ" />
        <MenuItem icon="heart-outline" label="สุขภาพ" />
        <MenuItem icon="notifications-outline" label="การแจ้งเตือน" />
        <MenuItem 
          icon="water-outline" 
          label="น้ำตาลในเลือด" 
          onPress={() => navigation.navigate('BloodSugar')}
        />
      </View>
    </ScrollView>
  );
};

const StatItem = ({ icon, label, value }) => (
  <View style={styles.statItem}>
    <Icon name={icon} size={24} color="#556B2F" />
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={styles.statValue}>{value}</Text>
  </View>
);

const MenuItem = ({ icon, label, onPress }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <Icon name={icon} size={24} color="#556B2F" />
    <Text style={styles.menuLabel}>{label}</Text>
    <Icon name="chevron-forward-outline" size={24} color="#999" />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5DC',  // Light beige background
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#8FBC8F',  // Soft green background for header
    borderBottomWidth: 1,
    borderBottomColor: '#8FBC8F',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',  // White color for header title
  },
  iconButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#556B2F',  // Dark olive green for icon buttons
  },
  profileSection: {
    alignItems: 'center',
    marginTop: 20,
    backgroundColor: '#FAFAD2',  // Light goldenrod yellow for profile section
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE8AA',  // Pale goldenrod for border
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#8FBC8F',  // Soft green for profile image border
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#556B2F',  // Dark olive green for user name
    marginTop: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: 10,
  },
  editButton: {
    backgroundColor: '#8FBC8F',  // Soft green for edit button
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
  },
  editButtonText: {
    color: '#fff',  // White color for edit button text
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: '#d82701',  // Red for logout button
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  logoutButtonText: {
    color: '#fff',  // White color for logout button text
    fontWeight: 'bold',
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    paddingVertical: 20,
    backgroundColor: '#FAFAD2',  // Light goldenrod yellow for stats section
    borderBottomWidth: 1,
    borderBottomColor: '#EEE8AA',  // Pale goldenrod for border
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    color: '#556B2F',  // Dark olive green for stat labels
    marginTop: 5,
  },
  statValue: {
    fontWeight: 'bold',
    marginTop: 5,
    color: '#6B8E23',  // Olive drab for stat values
  },
  menuSection: {
    marginTop: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8DC',  // Cornsilk color for menu items
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE8AA',  // Pale goldenrod for border
  },
  menuLabel: {
    flex: 1,
    marginLeft: 16,
    fontSize: 16,
    color: '#556B2F',  // Dark olive green for menu labels
  },
});

export default ProfilePage;
