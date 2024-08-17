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
      <Ionicons name="chevron-forward" size={24} color="black" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={24} color="gray" />
        <TextInput 
          style={styles.searchInput}
          placeholder="ค้นหาคนไข้"
          placeholderTextColor="gray"
        />
      </View>
      <FlatList
        data={patients}
        renderItem={renderPatientItem}
        keyExtractor={item => item.id}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0fff0',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: 'white',
    margin: 10,
    borderRadius: 5,
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
  },
  patientName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  patientDetails: {
    fontSize: 14,
    color: 'gray',
  },
});

export default PatientListScreen;
