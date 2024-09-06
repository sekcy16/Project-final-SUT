import React from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // Assuming you're using Expo for icons

const PatientListScreen = ({ navigation }) => {
  const patients = [
    { id: '1', name: 'Johny', age: 40, level: 2 },
    { id: '2', name: 'Jackky', age: 37, level: 1 },
  ];

  const renderPatientItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.patientItem}
      onPress={() => navigation.navigate('PatientDetailScreen', { patientId: item.id })}
    >
      <View>
        <Text style={styles.patientName}>{item.name}</Text>
        <Text style={styles.patientDetails}>อายุ {item.age} | เบาหวานระดับ {item.level}</Text>
      </View>
      <Ionicons name="chevron-forward" size={24} color="#2196F3" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Patient List</Text>
      </View>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={24} color="#2196F3" />
        <TextInput 
          style={styles.searchInput}
          placeholder="ค้นหาคนไข้"
          placeholderTextColor="#888"
        />
      </View>
      <FlatList
        data={patients}
        renderItem={renderPatientItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer} // Add container style for FlatList
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E3F2FD", // Light blue background
  },
  header: {
    paddingVertical: 30,
    backgroundColor: '#2196F3', // Blue background for header
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    elevation: 4, // Adds shadow on Android
    shadowColor: '#000', // Shadow color for iOS
    shadowOffset: { width: 0, height: 2 }, // Shadow offset for iOS
    shadowOpacity: 0.1, // Shadow opacity for iOS
    shadowRadius: 4, // Shadow blur radius for iOS
    justifyContent: 'center', // Center content vertically
    alignItems: 'center', // Center content horizontally
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: 'white',
    marginHorizontal: 16,
    borderRadius: 5,
    elevation: 2, // Adds shadow on Android
    shadowColor: '#000', // Shadow color for iOS
    shadowOffset: { width: 0, height: 2 }, // Shadow offset for iOS
    shadowOpacity: 0.1, // Shadow opacity for iOS
    shadowRadius: 4, // Shadow blur radius for iOS
    marginTop: 10, // Space between header and search bar
    marginBottom: 15, // Space between search bar and list
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
  },
  patientItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: 'white', // Add background color to ensure shadow is visible
    marginHorizontal: 16, // Margin to add spacing between items
    marginBottom: 10, // Add margin bottom to space out each patient item
    borderRadius: 5, // Rounded corners
    elevation: 2, // Adds shadow on Android
    shadowColor: '#000', // Shadow color for iOS
    shadowOffset: { width: 0, height: 2 }, // Shadow offset for iOS
    shadowOpacity: 0.1, // Shadow opacity for iOS
    shadowRadius: 4, // Shadow blur radius for iOS
  },
  patientName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  patientDetails: {
    fontSize: 14,
    color: '#666',
  },
  listContainer: {
    paddingBottom: 20, // Optional: Adds padding to the bottom of the list
  }
});

export default PatientListScreen;
