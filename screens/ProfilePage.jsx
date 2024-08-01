import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const ProfilePage = () => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity>
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
        <TouchableOpacity style={styles.editButton}>
          <Text style={styles.editButtonText}>แก้ไขโปรไฟล์</Text>
        </TouchableOpacity>
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

const MenuItem = ({ icon, label }) => (
  <TouchableOpacity style={styles.menuItem}>
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
    padding: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  profileSection: {
    alignItems: 'center',
    marginTop: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 10,
  },
  editButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 10,
  },
  editButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    paddingVertical: 20,
    backgroundColor: 'white',
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