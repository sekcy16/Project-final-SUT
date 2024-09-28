import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator,
  Image,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { firebaseDB, firebaseAuth as auth } from "../../config/firebase.config";
import { collection, query, where, getDocs, doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { LinearGradient } from 'expo-linear-gradient';

const PatientListScreen = ({ navigation }) => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [newPatientEmail, setNewPatientEmail] = useState('');

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const doctorPatientsRef = collection(firebaseDB, 'doctorPatients');
      const q = query(doctorPatientsRef, where('doctorId', '==', auth.currentUser.uid));
      const querySnapshot = await getDocs(q);

      const patientPromises = querySnapshot.docs.map(async (docSnapshot) => {
        const patientRef = doc(firebaseDB, 'users', docSnapshot.data().patientId);
        const patientDoc = await getDoc(patientRef);
        return { id: patientDoc.id, ...patientDoc.data() };
      });

      const fetchedPatients = await Promise.all(patientPromises);
      setPatients(fetchedPatients);
    } catch (error) {
      console.error("Error fetching patients:", error);
      Alert.alert("Error", "Failed to fetch patients: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const addPatient = async () => {
    if (!newPatientEmail) {
      Alert.alert("Error", "Please enter a patient email");
      return;
    }

    try {
      setLoading(true);
      const usersRef = collection(firebaseDB, 'users');
      const q = query(usersRef, where('providerData.email', '==', newPatientEmail));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        Alert.alert("Error", "No user found with this email");
        return;
      }

      const patientDoc = querySnapshot.docs[0];
      const patientData = patientDoc.data();

      if (patientData.role !== 'User') {
        Alert.alert("Error", "The email does not belong to a patient");
        return;
      }

      const relationId = `${auth.currentUser.uid}_${patientDoc.id}`;
      const doctorPatientsRef = doc(firebaseDB, 'doctorPatients', relationId);
      await setDoc(doctorPatientsRef, {
        doctorId: auth.currentUser.uid,
        patientId: patientDoc.id,
        createdAt: new Date()
      });

      // Add the new patient to the local state
      setPatients(prevPatients => [...prevPatients, { id: patientDoc.id, ...patientData }]);

      Alert.alert("Success", "Patient added successfully");
      setNewPatientEmail('');
    } catch (error) {
      console.error("Error adding patient:", error);
      Alert.alert("Error", "Failed to add patient: " + error.message);
    } finally {
      setLoading(false);
    }
  };


  const filteredPatients = patients.filter(patient =>
    patient.fullName ? patient.fullName.toLowerCase().includes(searchText.toLowerCase()) : false
  );

  const deletePatient = async (patientId) => {
    Alert.alert(
      "Delete Patient",
      "Are you sure you want to remove this patient from your list?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: async () => {
          try {
            setLoading(true);
            const relationId = `${auth.currentUser.uid}_${patientId}`;
            const doctorPatientRef = doc(firebaseDB, 'doctorPatients', relationId);
            await deleteDoc(doctorPatientRef);

            // Remove the patient from the local state
            setPatients(prevPatients => prevPatients.filter(patient => patient.id !== patientId));
            Alert.alert("Success", "Patient removed successfully");
          } catch (error) {
            console.error("Error deleting patient:", error);
            Alert.alert("Error", "Failed to remove patient: " + error.message);
          } finally {
            setLoading(false);
          }
        }}
      ]
    );
  };

  const renderPatientItem = ({ item }) => (
    <View style={styles.patientItem}>
      <TouchableOpacity
        style={styles.patientInfoContainer}
        onPress={() => navigation.navigate('PatientDetailScreen', { patientId: item.id })}
      >
        <Image
          source={{ uri: item.profilePic || 'https://via.placeholder.com/150' }}
          style={styles.patientImage}
        />
        <View style={styles.patientInfo}>
          <Text style={styles.patientName}>{item.fullName || 'No Name'}</Text>
          <Text style={styles.patientDetails}>
            อายุ: {item.age || 'N/A'} | เบาหวานระดับ: {item.diabetesType || 'N/A'}
          </Text>
          <View style={styles.patientStatus}>
            <View style={[styles.statusIndicator, { backgroundColor: item.lastCheckup ? '#4CAF50' : '#FFC107' }]} />
            <Text style={styles.statusText}>
              {item.lastCheckup ? 'ตรวจล่าสุด: ' + item.lastCheckup : 'ยังไม่เคยตรวจ'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => deletePatient(item.id)}
      >
        <Ionicons name="trash-outline" size={24} color="#FF6B6B" />
      </TouchableOpacity>
    </View>
  );
  return (
    <LinearGradient colors={['#4A90E2', '#50C2C9']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>รายชื่อคนไข้</Text>
        <Text style={styles.headerSubtitle}>ทั้งหมด {patients.length} คน</Text>
      </View>
      <View style={styles.content}>
        <View style={styles.addPatientContainer}>
          <TextInput
            style={styles.addPatientInput}
            placeholder="Enter patient email"
            value={newPatientEmail}
            onChangeText={setNewPatientEmail}
          />
          <TouchableOpacity style={styles.addPatientButton} onPress={addPatient}>
            <Text style={styles.addPatientButtonText}>Add Patient</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={24} color="#4A90E2" />
          <TextInput
            style={styles.searchInput}
            placeholder="ค้นหาคนไข้"
            placeholderTextColor="#888"
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
        {loading ? (
          <ActivityIndicator size="large" color="#4A90E2" style={{ marginTop: 20 }} />
        ) : filteredPatients.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people" size={50} color="#BDBDBD" />
            <Text style={styles.emptyStateText}>ไม่พบคนไข้</Text>
          </View>
        ) : (
          <FlatList
            data={filteredPatients}
            renderItem={renderPatientItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContainer}
          />
        )}
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    marginTop: 5,
  },
  content: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 25,
    elevation: 3,
    marginBottom: 15,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  patientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 10,
    elevation: 2,
  },
  patientImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  patientDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  patientStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 5,
  },
  statusText: {
    fontSize: 12,
    color: '#666',
  },
  listContainer: {
    paddingTop: 10,
    paddingBottom: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateText: {
    marginTop: 10,
    fontSize: 18,
    color: '#BDBDBD',
  },
  addPatientContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 15,
  },
  addPatientInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#4A90E2',
    borderRadius: 5,
    paddingHorizontal: 10,
    marginRight: 10,
  },
  addPatientButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 5,
  },
  addPatientButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  patientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 10,
    elevation: 2,
  },
  patientInfoContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteButton: {
    padding: 10,
  },
});

export default PatientListScreen;