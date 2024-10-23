import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { firebaseAuth, firebaseDB } from "../config/firebase.config";
import { collection, query, orderBy, limit, getDocs, doc } from "firebase/firestore";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";

const StepHistoryScreen = () => {
  const [stepHistory, setStepHistory] = useState([]);

  useEffect(() => {
    fetchStepHistory();
  }, []);

  const fetchStepHistory = async () => {
    const user = firebaseAuth.currentUser;
    if (user) {
      const userDocRef = doc(firebaseDB, "users", user.uid);
      const stepHistoryCollectionRef = collection(userDocRef, "stepHistory");
      const q = query(stepHistoryCollectionRef, orderBy("date", "desc"), limit(7));
      
      try {
        const querySnapshot = await getDocs(q);
        const history = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setStepHistory(history);
      } catch (error) {
        console.error("Error fetching step history: ", error);
      }
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.historyItem}>
      <Text style={styles.dateText}>{item.date}</Text>
      <Text style={styles.stepText}>{item.steps} ก้าว</Text>
    </View>
  );

  return (
    <LinearGradient colors={["#4A90E2", "#50E3C2"]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <Text style={styles.title}>ประวัติการเดิน</Text>
        <FlatList
          data={stepHistory}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
        />
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
    marginVertical: 20,
  },
  listContent: {
    padding: 16,
  },
  historyItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 10,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  stepText: {
    fontSize: 16,
  },
});

export default StepHistoryScreen;