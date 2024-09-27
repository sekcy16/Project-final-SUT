import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Dimensions,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { LineChart } from "react-native-chart-kit";
import { LinearGradient } from 'expo-linear-gradient';
import { firebaseDB, firebaseAuth } from "../config/firebase.config";
import { collection, addDoc, getDocs, query, orderBy, deleteDoc, doc, limit } from "firebase/firestore";

const WeightProgress = ({ navigation }) => {
  const [weight, setWeight] = useState("");
  const [weightHistory, setWeightHistory] = useState([]);
  const [todayWeight, setTodayWeight] = useState(null);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    loadWeightHistory();
  }, []);

  const loadWeightHistory = async () => {
    try {
      const user = firebaseAuth.currentUser;
      if (user) {
        const weightHistoryRef = collection(firebaseDB, "users", user.uid, "weightHistory");
        const q = query(weightHistoryRef, orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);
        const history = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setWeightHistory(history);
        updateTodayWeight(history);
        updateChartData(history);
      }
    } catch (error) {
      console.error("Error loading weight history:", error);
      Alert.alert("Error", "Failed to load weight history. Please try again.");
    }
  };

  const updateTodayWeight = (history) => {
    const today = new Date().toDateString();
    const todayEntry = history.find(entry => new Date(entry.timestamp).toDateString() === today);
    setTodayWeight(todayEntry ? todayEntry.weight : null);
  };

  const updateChartData = (history) => {
    const last7Days = history.slice(0, 7).map(item => item.weight).reverse();
    setChartData(last7Days);
  };

  const addWeightEntry = async () => {
    if (weight && !isNaN(parseFloat(weight))) {
      const user = firebaseAuth.currentUser;
      if (user) {
        const newEntry = {
          weight: parseFloat(weight),
          timestamp: new Date().toISOString(),
        };
        try {
          const weightHistoryRef = collection(firebaseDB, "users", user.uid, "weightHistory");
          await addDoc(weightHistoryRef, newEntry);
          setWeight("");
          loadWeightHistory(); // Reload the history after adding a new entry
          Alert.alert("Success", "Weight entry added successfully.");
        } catch (error) {
          console.error("Error adding weight entry:", error);
          Alert.alert("Error", "Failed to add weight entry. Please try again.");
        }
      }
    } else {
      Alert.alert("Invalid Input", "Please enter a valid weight.");
    }
  };

  const deleteEntry = async (docId) => {
    const user = firebaseAuth.currentUser;
    if (user && docId) {
      try {
        await deleteDoc(doc(firebaseDB, "users", user.uid, "weightHistory", docId));
        loadWeightHistory(); // Reload the history after deleting an entry
        Alert.alert("Success", "Entry deleted successfully.");
      } catch (error) {
        console.error("Error deleting from Firestore:", error);
        Alert.alert("Error", "Failed to delete entry.");
      }
    } else {
      Alert.alert("Error", "Unable to delete entry.");
    }
  };

  return (
    <LinearGradient colors={['#4A90E2', '#50E3C2']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerText}>น้ำหนักของคุณ</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={weight}
              onChangeText={setWeight}
              placeholder="ใส่น้ำหนัก (kg)"
              keyboardType="numeric"
              placeholderTextColor="#999"
            />
            <TouchableOpacity style={styles.addButton} onPress={addWeightEntry}>
              <Icon name="plus" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.todayContainer}>
            <Text style={styles.todayLabel}>น้ำหนักวันนี้</Text>
            <Text style={styles.todayValue}>
              {todayWeight ? `${todayWeight} kg` : "ยังไม่มีข้อมูล"}
            </Text>
          </View>

          {chartData.length > 0 && (
            <LineChart
              data={{
                labels: chartData.map((_, index) => `Day ${index + 1}`),
                datasets: [{ data: chartData }],
              }}
              width={Dimensions.get("window").width - 40}
              height={220}
              chartConfig={{
                backgroundColor: "#FFF",
                backgroundGradientFrom: "#FFF",
                backgroundGradientTo: "#FFF",
                decimalPlaces: 1,
                color: (opacity = 1) => `rgba(74, 144, 226, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                style: {
                  borderRadius: 16,
                },
                propsForDots: {
                  r: "6",
                  strokeWidth: "2",
                  stroke: "#50E3C2",
                },
              }}
              bezier
              style={styles.chart}
            />
          )}

          <View style={styles.history}>
            <Text style={styles.historyTitle}>ประวัติ</Text>
            {weightHistory.map((item) => (
              <View key={item.id} style={styles.historyItem}>
                <View>
                  <Text style={styles.historyDate}>{new Date(item.timestamp).toLocaleDateString()}</Text>
                  <Text style={styles.historyTime}>{new Date(item.timestamp).toLocaleTimeString()}</Text>
                </View>
                <Text style={styles.historyValue}>{item.weight} kg</Text>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => deleteEntry(item.id)}
                >
                  <Icon name="delete-outline" size={24} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  backButton: {
    marginRight: 15,
  },
  headerText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFF",
    fontFamily: 'Kanit-Bold',
  },
  content: {
    flex: 1,
    backgroundColor: "#FFF",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
  },
  inputContainer: {
    flexDirection: "row",
    marginBottom: 20,
  },
  input: {
    flex: 1,
    height: 50,
    backgroundColor: "#F0F0F0",
    borderRadius: 25,
    paddingHorizontal: 20,
    fontSize: 16,
    fontFamily: 'Kanit-Regular',
  },
  addButton: {
    width: 50,
    height: 50,
    backgroundColor: "#4CAF50",
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  todayContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  todayLabel: {
    fontSize: 18,
    color: "#666",
    fontFamily: 'Kanit-Regular',
  },
  todayValue: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#4A90E2",
    fontFamily: 'Kanit-Bold',
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
    marginBottom: 15,
    fontFamily: 'Kanit-Bold',
  },
  historyItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#F8F8F8",
    borderRadius: 15,
    marginBottom: 10,
  },
  historyDate: {
    fontSize: 16,
    fontFamily: 'Kanit-Regular',
  },
  historyTime: {
    fontSize: 14,
    color: "#666",
    fontFamily: 'Kanit-Regular',
  },
  historyValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4A90E2",
    fontFamily: 'Kanit-Bold',
  },
  deleteButton: {
    padding: 5,
  },
});

export default WeightProgress;