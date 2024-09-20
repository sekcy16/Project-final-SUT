import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { firebaseDB, auth } from "../../config/firebase.config"; // Import firebaseDB and auth from your config
import { collection, query, where, getDocs } from 'firebase/firestore';

const PatientListScreen = ({ navigation }) => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [error, setError] = useState(null);  // Added error state
  
  const fetchPatients = async () => {
    try {
      // Check if auth is defined
      if (!auth) {
        throw new Error("Firebase auth is not initialized");
      }

      // Check if the current user is a doctor
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("User not authenticated");
      }

      const userDoc = await getDocs(query(collection(firebaseDB, 'users'), where('uid', '==', currentUser.uid)));
      if (userDoc.empty || userDoc.docs[0].data().role !== 'Doctor') {
        throw new Error("Only doctors can access this screen");
      }

      const usersCollection = collection(firebaseDB, 'users');
      const q = query(usersCollection, where('role', '==', 'User'));
      const snapshot = await getDocs(q);
      const fetchedPatients = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPatients(fetchedPatients);
      setError(null);
    } catch (error) {
      console.error("Error fetching patients:", error);
      setError(error.message);
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchPatients();
  }, []);

  const filteredPatients = patients.filter(patient =>
    patient.fullName ? patient.fullName.toLowerCase().includes(searchText.toLowerCase()) : false
  );

  const renderPatientItem = ({ item }) => (
    <TouchableOpacity
      style={styles.patientItem}
      onPress={() => navigation.navigate('PatientDetailScreen', { patientId: item.id })}
    >
      <View>
        <Text style={styles.patientName}>{item.fullName ? item.fullName : 'No Name'}</Text>
        <Text style={styles.patientDetails}>
          อายุ {item.age ? item.age : 'N/A'} | เบาหวานระดับ {item.diabetesType ? item.diabetesType : 'N/A'}
        </Text>
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
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#2196F3" style={{ marginTop: 20 }} />
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchPatients}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : filteredPatients.length === 0 ? (
        <Text style={styles.noDataText}>ไม่พบคนไข้</Text>
      ) : (
        <FlatList
          data={filteredPatients}
          renderItem={renderPatientItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E3F2FD",
  },
  header: {
    paddingVertical: 30,
    backgroundColor: '#2196F3',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    elevation: 4,
    justifyContent: 'center',
    alignItems: 'center',
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
    elevation: 2,
    marginTop: 10,
    marginBottom: 15,
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
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 5,
    elevation: 2,
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
    paddingBottom: 20,
  },
  errorContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  errorText: {
    textAlign: 'center',
    color: 'red',
    fontSize: 16,
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
  },
});

export default PatientListScreen;