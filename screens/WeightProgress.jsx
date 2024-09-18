import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { firebaseDB, firebaseAuth } from "../config/firebase.config";

const WeightProgress = ({ navigation }) => {
  const [weight, setWeight] = useState("");
  const [history, setHistory] = useState([]);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const user = firebaseAuth.currentUser;

    if (user) {
      try {
        const weightHistoryRef = collection(firebaseDB, "users", user.uid, "weightHistory");
        const q = query(weightHistoryRef, orderBy("date", "desc"), orderBy("time", "desc"));
        const querySnapshot = await getDocs(q);

        const fetchedHistory = [];
        querySnapshot.forEach((doc) => {
          fetchedHistory.push({ ...doc.data(), id: doc.id });
        });

        setHistory(fetchedHistory);
        updateChartData(fetchedHistory);
      } catch (error) {
        console.error("Error loading history from Firestore:", error);
      }
    } else {
      console.error("No user is logged in");
    }
  };

  const updateChartData = (historyData) => {
    const last7Days = historyData
      .slice(-7)
      .map((item) => parseFloat(item.weight))
      .filter((weight) => !isNaN(weight));

    if (last7Days.length > 0) {
      setChartData(last7Days.reverse());
    } else {
      console.error("No valid data to update chart");
    }
  };

  const addWeightEntry = async () => {
    const weightValue = parseFloat(weight);

    if (!isNaN(weightValue) && weightValue > 0) {
      const now = new Date();
      const newEntry = {
        date: now.toLocaleDateString(),
        time: now.toLocaleTimeString(),
        weight: weightValue,
      };

      const user = firebaseAuth.currentUser;

      if (user) {
        try {
          const weightHistoryRef = collection(firebaseDB, "users", user.uid, "weightHistory");
          await addDoc(weightHistoryRef, newEntry);

          // Update the profile with the new weight
          await updateProfile(weightValue);

          const updatedHistory = [newEntry, ...history];
          setHistory(updatedHistory);
          updateChartData(updatedHistory);
          setWeight("");
        } catch (error) {
          console.error("Error saving to Firestore:", error);
        }
      } else {
        console.error("No user is logged in");
      }
    } else {
      console.error("Invalid weight value");
    }
  };

  const deleteEntry = async (index, docId) => {
    const user = firebaseAuth.currentUser;

    if (user) {
      try {
        if (!docId) {
          console.error("Document ID is undefined or null");
          return;
        }
        const docRef = doc(firebaseDB, "users", user.uid, "weightHistory", docId);
        await deleteDoc(docRef);

        const updatedHistory = history.filter((_, i) => i !== index);
        setHistory(updatedHistory);
        updateChartData(updatedHistory);
      } catch (error) {
        console.error("Error deleting from Firestore:", error);
      }
    } else {
      console.error("No user is logged in");
    }
  };

  const updateProfile = async (weight) => {
    const user = firebaseAuth.currentUser;

    if (user) {
      try {
        const userProfileRef = doc(firebaseDB, "users", user.uid);
        await updateDoc(userProfileRef, {
          weight: weight,
          lastActive: new Date().toISOString()
        });
      } catch (error) {
        console.error("Error updating profile in Firestore:", error);
      }
    } else {
      console.error("No user is logged in");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>น้ำหนักของคุณ</Text>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={weight}
          onChangeText={setWeight}
          placeholder="ใส่น้ำหนัก (kg)"
          keyboardType="numeric"
        />
        <TouchableOpacity style={styles.addButton} onPress={addWeightEntry}>
          <Text style={styles.addButtonText}>เพิ่ม</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.today}>
        <Text style={styles.todayText}>วันนี้</Text>
        <Text style={styles.todayValue}>{history[0]?.weight || "-"} kg</Text>
      </View>

      {chartData.length > 0 && (
        <LineChart
          data={{
            datasets: [{ data: chartData }],
          }}
          width={Dimensions.get("window").width - 40}
          height={220}
          chartConfig={{
            backgroundGradientFrom: "#F6FFF5",
            backgroundGradientTo: "#F6FFF5",
            color: (opacity = 1) => `rgba(0, 204, 255, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            propsForDots: {
              r: "6",
              strokeWidth: "2",
              stroke: "#00bcd4",
            },
          }}
          bezier
          style={styles.chart}
        />
      )}

      <View style={styles.history}>
        <Text style={styles.historyTitle}>ประวัติ</Text>
        {history.map((item, index) => (
          <View key={item.id} style={styles.historyItem}>
            <View style={styles.historyDetails}>
              <Text style={styles.historyDate}>{item.date}</Text>
              <Text style={styles.historyTime}>{item.time}</Text>
              <Text style={styles.historyLevel}>{item.weight} kg</Text>
            </View>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => deleteEntry(index, item.id)}
            >
              <Text style={styles.deleteButtonText}>ลบ</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: "#F6FFF5",
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    paddingBottom: 10,
  },
  headerText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#4CAF50",
  },
  inputContainer: {
    flexDirection: "row",
    marginBottom: 20,
  },
  input: {
    flex: 1,
    height: 50,
    borderColor: "#4CAF50",
    borderWidth: 2,
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 18,
    backgroundColor: "#fff",
  },
  addButton: {
    backgroundColor: "#4CAF50",
    padding: 15,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
  },
  addButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 18,
  },
  today: {
    marginBottom: 20,
    alignItems: "center",
  },
  todayText: {
    fontSize: 20,
    marginBottom: 5,
    fontWeight: "bold",
  },
  todayValue: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#4CAF50",
  },
  chart: {
    marginVertical: 20,
    borderRadius: 16,
  },
  history: {
    marginTop: 20,
  },
  historyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#4CAF50",
  },
  historyItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#fff",
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
  },
  historyDetails: {
    flex: 1,
  },
  historyDate: {
    fontSize: 16,
    color: "#333",
  },
  historyTime: {
    fontSize: 14,
    color: "#666",
  },
  historyLevel: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4CAF50",
  },
  deleteButton: {
    backgroundColor: "#FF6347",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
  },
  deleteButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default WeightProgress;
