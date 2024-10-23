import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator,
  Image,
  Alert,
  RefreshControl,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { firebaseDB, firebaseAuth } from "../../config/firebase.config";
import { collection, query, where, getDocs, doc, setDoc, getDoc, deleteDoc, addDoc } from 'firebase/firestore';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';

const PatientListScreen = ({ navigation }) => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [newPatientEmail, setNewPatientEmail] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [appointmentDate, setAppointmentDate] = useState(new Date());
  const [appointmentTime, setAppointmentTime] = useState(new Date());
  const [appointmentNote, setAppointmentNote] = useState('');

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    try {
      const doctorPatientsRef = collection(firebaseDB, 'doctorPatients');
      const q = query(doctorPatientsRef, where('doctorId', '==', firebaseAuth.currentUser.uid));
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
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchPatients();
    }, [fetchPatients])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPatients();
    setRefreshing(false);
  }, [fetchPatients]);

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

      const relationId = `${firebaseAuth.currentUser.uid}_${patientDoc.id}`;
      const doctorPatientsRef = doc(firebaseDB, 'doctorPatients', relationId);
      await setDoc(doctorPatientsRef, {
        doctorId: firebaseAuth.currentUser.uid,
        patientId: patientDoc.id,
        createdAt: new Date()
      });

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

  const deletePatient = async (patientId) => {
    Alert.alert(
      "Delete Patient",
      "Are you sure you want to remove this patient from your list?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: async () => {
          try {
            setLoading(true);
            const relationId = `${firebaseAuth.currentUser.uid}_${patientId}`;
            const doctorPatientRef = doc(firebaseDB, 'doctorPatients', relationId);
            await deleteDoc(doctorPatientRef);
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

  
  const handleAppointment = (patient) => {
    setSelectedPatient(patient);
    setModalVisible(true);
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setAppointmentDate(selectedDate);
    }
  };

  const onTimeChange = (event, selectedTime) => {
    setShowTimePicker(false);
    if (selectedTime) {
      setAppointmentTime(selectedTime);
    }
  };
  const checkUserRole = async (userId) => {
    try {
      const userRef = doc(firebaseDB, 'users', userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data();
        console.log("User role:", userData.role);
        return userData.role;
      } else {
        console.log("No such user!");
        return null;
      }
    } catch (error) {
      console.error("Error checking user role:", error);
      return null;
    }
  };
  


  // ใช้ฟังก์ชันนี้ก่อนที่จะสร้างการนัดหมาย
  const createAppointment = async () => {
    if (!selectedPatient) return;
  
    try {
      const currentUser = firebaseAuth.currentUser;
      if (!currentUser) {
        throw new Error("ไม่พบข้อมูลผู้ใช้");
      }
  
      const userRole = await checkUserRole(currentUser.uid);
      console.log("Current user role:", userRole);
  
      if (userRole !== 'Doctor') {
        throw new Error("คุณไม่มีสิทธิ์ในการสร้างนัดหมาย");
      }
  
      const appointmentData = {
        doctorId: currentUser.uid,
        patientId: selectedPatient.id,
        patientName: selectedPatient.fullName,
        date: appointmentDate.toISOString().split('T')[0],
        time: appointmentTime.toTimeString().split(' ')[0],
        note: appointmentNote,
        createdAt: new Date()
      };
  
      console.log("Attempting to create appointment with data:", appointmentData);
  
      // สร้าง collection "appointments" ถ้ายังไม่มี
      const appointmentsRef = collection(firebaseDB, "users", currentUser.uid, "appointments");
      const newAppointmentRef = doc(appointmentsRef);
      await setDoc(newAppointmentRef, appointmentData);
  
      console.log("Appointment created with ID: ", newAppointmentRef.id);
      Alert.alert("สำเร็จ", "สร้างนัดหมายเรียบร้อยแล้ว");
      setModalVisible(false);
      setAppointmentNote('');
      
      navigation.navigate('DoctorHomePage', { refresh: true });
    } catch (error) {
      console.error("Error creating appointment:", error);
      Alert.alert("ข้อผิดพลาด", "ไม่สามารถสร้างนัดหมายได้: " + error.message);
    }
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
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.appointmentButton}
          onPress={() => handleAppointment(item)}
        >
          <Ionicons name="calendar-outline" size={24} color="#4A90E2" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => deletePatient(item.id)}
        >
          <Ionicons name="trash-outline" size={24} color="#FF6B6B" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const filteredPatients = patients.filter(patient =>
    patient.fullName ? patient.fullName.toLowerCase().includes(searchText.toLowerCase()) : false
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
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4A90E2']} />
            }
          />
        )}
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>นัดหมายสำหรับ {selectedPatient?.fullName}</Text>
            
            <TouchableOpacity style={styles.datePickerButton} onPress={() => setShowDatePicker(true)}>
              <Text>วันที่: {appointmentDate.toLocaleDateString()}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.datePickerButton} onPress={() => setShowTimePicker(true)}>
              <Text>เวลา: {appointmentTime.toLocaleTimeString()}</Text>
            </TouchableOpacity>
            
            <TextInput
              style={styles.noteInput}
              placeholder="บันทึกเพิ่มเติม"
              value={appointmentNote}
              onChangeText={setAppointmentNote}
              multiline
            />
            
            <TouchableOpacity style={styles.submitButton} onPress={createAppointment}>
              <Text style={styles.submitButtonText}>สร้างนัดหมาย</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelButtonText}>ยกเลิก</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {showDatePicker && (
        <DateTimePicker
          value={appointmentDate}
          mode="date"
          display="default"
          onChange={onDateChange}
        />
      )}
      {showTimePicker && (
        <DateTimePicker
          value={appointmentTime}
          mode="time"
          display="default"
          onChange={onTimeChange}
        />
      )}
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
    color: '#FFFFFF',
    fontFamily: 'Kanit-Bold',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    marginTop: 5,
    fontFamily: 'Kanit-Regular',
  },
  content: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 20,
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
    fontFamily: 'Kanit-Regular',
  },
  addPatientButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 5,
  },
  addPatientButtonText: {
    color: 'white',
    fontFamily: 'Kanit-Bold',
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
    fontFamily: 'Kanit-Regular',
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
    color: '#333',
    fontFamily: 'Kanit-Bold',
  },
  patientDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
    fontFamily: 'Kanit-Regular',
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
    fontFamily: 'Kanit-Regular',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appointmentButton: {
    padding: 10,
    marginRight: 10,
  },
  deleteButton: {
    padding: 10,
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
    fontFamily: 'Kanit-Regular',
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '80%',
  },
  modalTitle: {
    fontSize: 20,
    marginBottom: 15,
    textAlign: 'center',
    fontFamily: 'Kanit-Bold',
  },
  datePickerButton: {
    backgroundColor: '#F0F0F0',
    padding: 10,
    borderRadius: 5,
    width: '100%',
    marginBottom: 10,
  },
  noteInput: {
    borderWidth: 1,
    borderColor: '#CCCCCC',
    width: '100%',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    fontFamily: 'Kanit-Regular',
  },
  submitButton: {
    backgroundColor: '#4A90E2',
    padding: 10,
    borderRadius: 5,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  submitButtonText: {
    color: 'white',
    fontFamily: 'Kanit-Bold',
  },
  cancelButton: {
    backgroundColor: '#FF6B6B',
    padding: 10,
    borderRadius: 5,
    width: '100%',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: 'white',
    fontFamily: 'Kanit-Bold',
  },
});

export default PatientListScreen;