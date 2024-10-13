import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { firebaseDB, firebaseAuth } from "../config/firebase.config";
import { LinearGradient } from 'expo-linear-gradient';
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

const BloodSugar = ({ navigation }) => {
  const [bloodSugarLevel, setBloodSugarLevel] = useState("");
  const [history, setHistory] = useState([]);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const user = firebaseAuth.currentUser;
    if (user) {
      try {
        const bloodSugarHistoryRef = collection(firebaseDB, "users", user.uid, "bloodSugarHistory");
        const q = query(bloodSugarHistoryRef, orderBy("date", "desc"), orderBy("time", "desc"));
        const querySnapshot = await getDocs(q);

        const fetchedHistory = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        setHistory(fetchedHistory);
        updateChartData(fetchedHistory);
      } catch (error) {
        console.error("Error loading history from Firestore:", error);
        Alert.alert("Error", "Failed to load blood sugar history.");
      }
    } else {
      Alert.alert("Error", "No user is logged in.");
    }
  };

  const updateChartData = (historyData) => {
    const last7Days = historyData.slice(0, 7).map(item => parseInt(item.level, 10)).filter(level => !isNaN(level)).reverse();
    setChartData(last7Days);
  };

  const addBloodSugarEntry = async () => {
    const level = parseInt(bloodSugarLevel, 10);
    if (isNaN(level) || level < 0) {
      Alert.alert("Invalid Input", "Please enter a valid blood sugar level.");
      return;
    }

    const user = firebaseAuth.currentUser;
    if (user) {
      try {
        const now = new Date();
        const newEntry = {
          date: now.toLocaleDateString(),
          time: now.toLocaleTimeString(),
          level: level,
          status: getStatus(level),
        };

        const bloodSugarHistoryRef = collection(firebaseDB, "users", user.uid, "bloodSugarHistory");
        await addDoc(bloodSugarHistoryRef, newEntry);

        setHistory([newEntry, ...history]);
        updateChartData([newEntry, ...history]);
        setBloodSugarLevel("");
        Alert.alert("เสร็จสิ้น", "เพิ่มข้อมูลเรียบร้อย");
      } catch (error) {
        console.error("Error saving to Firestore:", error);
        Alert.alert("Error", "Failed to save blood sugar level.");
      }
    } else {
      Alert.alert("Error", "No user is logged in.");
    }
  };

  const deleteEntry = async (index, docId) => {
    const user = firebaseAuth.currentUser;
    if (user && docId) {
      try {
        await deleteDoc(doc(firebaseDB, "users", user.uid, "bloodSugarHistory", docId));
        const updatedHistory = history.filter((_, i) => i !== index);
        setHistory(updatedHistory);
        updateChartData(updatedHistory);
        Alert.alert("เสร็จสิ้น", "ลบข้อมูลเรียบร้อย");
      } catch (error) {
        console.error("Error deleting from Firestore:", error);
        Alert.alert("Error", "Failed to delete entry.");
      }
    } else {
      Alert.alert("Error", "Unable to delete entry.");
    }
  };

  const getStatus = (level) => {
    if (level < 70) return "ต่ำ";
    if (level > 100) return "สูง";
    return "ดี";
  };

  return (
    <LinearGradient colors={['#4A90E2', '#50E3C2']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerText}>ระดับน้ำตาลในเลือด</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={bloodSugarLevel}
              onChangeText={setBloodSugarLevel}
              placeholder="ใส่ระดับน้ำตาลในเลือด (mg/dL)"
              keyboardType="numeric"
              placeholderTextColor="#999"
            />
            <TouchableOpacity style={styles.addButton} onPress={addBloodSugarEntry}>
              <Icon name="plus" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.today}>
            <Text style={styles.todayText}>วันนี้</Text>
            <Text style={styles.todayValue}>{history[0]?.level || "-"} mg/dL</Text>
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
                decimalPlaces: 0,
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
            {history.map((item, index) => (
              <View key={item.id} style={styles.historyItem}>
                <View>
                  <Text style={styles.historyDate}>{item.date}</Text>
                  <Text style={styles.historyTime}>{item.time}</Text>
                </View>
                <View style={styles.historyValueContainer}>
                  <Text style={[styles.historyValue, 
                    item.status === "สูง" ? styles.highValue : 
                    item.status === "ต่ำ" ? styles.lowValue : 
                    styles.normalValue]}>
                    {item.status}
                  </Text>
                  <Text style={styles.historyLevel}>{item.level} mg/dL</Text>
                </View>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => deleteEntry(index, item.id)}
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
  today: {
    marginBottom: 20,
  },
  todayText: {
    fontSize: 18,
    marginBottom: 5,
    fontFamily: 'Kanit-Regular',
  },
  todayValue: {
    fontSize: 32,
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
  historyValueContainer: {
    alignItems: 'center',
  },
  historyValue: {
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: 'Kanit-Bold',
  },
  normalValue: {
    color: "#4CAF50",
  },
  highValue: {
    color: "#FF3B30",
  },
  lowValue: {
    color: "#FF9500",
  },
  historyLevel: {
    fontSize: 14,
    color: "#666",
    fontFamily: 'Kanit-Regular',
  },
  deleteButton: {
    padding: 5,
  },
});

export default BloodSugar;