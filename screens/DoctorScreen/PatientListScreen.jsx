import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator,
  Image,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { firebaseDB, firebaseAuth as auth } from "../../config/firebase.config";
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { LinearGradient } from 'expo-linear-gradient';

const PatientListScreen = ({ navigation }) => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  
  const fetchPatients = useCallback(async (user) => {
    try {
      if (!user) {
        throw new Error("User not authenticated");
      }

      console.log("Attempting to fetch user document for UID:", user.uid);
      const userDocRef = doc(firebaseDB, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        throw new Error("User document not found");
      }

      const userData = userDocSnap.data();
      console.log("User data:", userData);

      if (userData.role !== 'Doctor') {
        throw new Error(`User role is ${userData.role}, not Doctor`);
      }

      console.log("User is confirmed as a Doctor. Fetching patients...");
      const usersCollection = collection(firebaseDB, 'users');
      const q = query(usersCollection, where('role', '==', 'User'));
      const snapshot = await getDocs(q);
      const fetchedPatients = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      console.log("Fetched patients:", fetchedPatients.length);
      setPatients(fetchedPatients);
      setError(null);
    } catch (error) {
      console.error("Error in fetchPatients:", error);
      setError(error.message);
      setPatients([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("Auth state changed. User is signed in:", user.uid);
        fetchPatients(user);
      } else {
        console.log("Auth state changed. No user signed in.");
        setError("User not authenticated");
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [fetchPatients]);
  
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPatients(auth.currentUser);
  }, [fetchPatients]);

  const filteredPatients = patients.filter(patient =>
    patient.fullName ? patient.fullName.toLowerCase().includes(searchText.toLowerCase()) : false
  );

  const renderPatientItem = ({ item }) => (
    <TouchableOpacity
      style={styles.patientItem}
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
      <Ionicons name="chevron-forward" size={24} color="#2196F3" />
    </TouchableOpacity>
  );

  return (
    <LinearGradient colors={['#4A90E2', '#50C2C9']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>รายชื่อคนไข้</Text>
        <Text style={styles.headerSubtitle}>ทั้งหมด {patients.length} คน</Text>
      </View>
      <View style={styles.content}>
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
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
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
});

export default PatientListScreen;