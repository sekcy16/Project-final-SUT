import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const AddFood = ({ navigation }) => {
  const [selectedMeal, setSelectedMeal] = React.useState('มื้อเช้า');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#2E7D32" />
        </TouchableOpacity>
      </View>

      <View style={styles.menuSelectionContainer}>
        <Text style={styles.headerTitle}>เลือกมื้ออาหาร</Text>
        <TouchableOpacity style={styles.dropdownButton} onPress={() => {/* Toggle meal selection */}}>
          <Text style={styles.dropdownText}>{selectedMeal}</Text>
          <Icon name="chevron-down" size={20} color="#2E7D32" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#757575" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="ค้นหาอาหาร"
          placeholderTextColor="#9E9E9E"
        />
      </View>

      <View style={styles.scanContainer}>
        <TouchableOpacity style={styles.scanButton}>
          <Icon name="camera-outline" size={36} color="#FFFFFF" />
          <Text style={styles.scanButtonText}>สแกนอาหาร</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.scanButton}>
          <Icon name="barcode-outline" size={36} color="#FFFFFF" />
          <Text style={styles.scanButtonText}>สแกนบาร์โค้ด</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.historyContainer}>
        <View style={styles.historyHeader}>
          <Text style={styles.historyTitle}>ประวัติ</Text>
          <TouchableOpacity style={styles.sortButton}>
            <Text style={styles.sortButtonText}>ล่าสุด</Text>
            <Icon name="chevron-down" size={16} color="#2E7D32" />
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.historyList}>
          <TouchableOpacity style={styles.historyItem}>
            <View style={styles.historyItemContent}>
              <Text style={styles.historyItemTitle}>ต้มบ็อลแซนด์วิชแฮมและหมูทอดพริกเผา</Text>
              <Text style={styles.historyItemSubtitle}>260 แคลอรี่, 1 ชิ้น</Text>
            </View>
            <TouchableOpacity style={styles.addButton}>
              <Icon name="add" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </TouchableOpacity>
          <TouchableOpacity style={styles.historyItem}>
            <View style={styles.historyItemContent}>
              <Text style={styles.historyItemTitle}>แอปเปิ้ล</Text>
              <Text style={styles.historyItemSubtitle}>104 แคลอรี่, 1 ผลกลาง</Text>
            </View>
            <TouchableOpacity style={styles.addButton}>
              <Icon name="add" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  backButton: {
    padding: 8,
  },
  menuSelectionContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 8,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  dropdownText: {
    color: '#2E7D32',
    fontWeight: 'bold',
    fontSize: 18,
    marginRight: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 25,
    margin: 16,
    paddingHorizontal: 16,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 50,
    color: '#212121',
    fontSize: 16,
  },
  scanContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  scanButton: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    borderRadius: 16,
    padding: 16,
    width: '48%',
    elevation: 3,
  },
  scanButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
    textAlign: 'center',
  },
  historyContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  historyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212121',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortButtonText: {
    color: '#2E7D32',
    fontSize: 16,
    marginRight: 4,
  },
  historyList: {
    flex: 1,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    elevation: 2,
  },
  historyItemContent: {
    flex: 1,
  },
  historyItemTitle: {
    color: '#212121',
    fontSize: 16,
    fontWeight: 'bold',
  },
  historyItemSubtitle: {
    color: '#757575',
    fontSize: 14,
    marginTop: 2,
  },
  addButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
});

export default AddFood;