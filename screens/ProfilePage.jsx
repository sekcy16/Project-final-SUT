import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { firebaseAuth } from '../config/firebase.config'; // Import your Firebase Auth configuration

const ProfilePage = () => {
  const navigation = useNavigation();

  const handleSignOut = () => {
    firebaseAuth.signOut()
      .then(() => {
        // Sign-out successful, navigate to LoginScreen
        navigation.navigate('LoginScreen');
      })
      .catch((error) => {
        // An error happened during sign out
        console.error('Sign out error: ', error);
        Alert.alert('Error', 'Failed to sign out. Please try again.');
      });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>โปรไฟล์</Text>
        <TouchableOpacity>
          <Icon name="settings-outline" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <View style={styles.profileSection}>
        <Image
          source={{ uri: 'https://via.placeholder.com/100' }}
          style={styles.profileImage}
        />
        <Text style={styles.userName}>ชื่อผู้ใช้</Text>
        
        {/* ปุ่มแก้ไขโปรไฟล์และออกจากระบบ */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.editButton}>
            <Text style={styles.editButtonText}>แก้ไขโปรไฟล์</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.logoutButton} 
            onPress={handleSignOut} // Attach the sign-out handler here
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
    <Icon name={icon} size={24} color="#4CAF50" />
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={styles.statValue}>{value}</Text>
  </View>
);

const MenuItem = ({ icon, label, onPress }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <Icon name={icon} size={24} color="#4CAF50" />
    <Text style={styles.menuLabel}>{label}</Text>
    <Icon name="chevron-forward-outline" size={24} color="#999" />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6FFF5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#4CAF50',
    elevation: 2,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 1,
    textAlign: 'center',
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
    marginTop: 40,
    backgroundColor: '#FFFFFF',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: 10,
  },
  editButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,  // เพิ่มระยะห่างระหว่างปุ่ม
  },
  editButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: '#D32F2F',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  logoutButtonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    paddingVertical: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    color: '#999',
    marginTop: 5,
  },
  statValue: {
    fontWeight: 'bold',
    marginTop: 5,
  },
  menuSection: {
    marginTop: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  menuLabel: {
    flex: 1,
    marginLeft: 16,
    fontSize: 16,
  },
});

export default ProfilePage;
