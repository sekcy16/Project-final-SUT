import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { LineChart } from "react-native-chart-kit"; // For the graph
import { firebaseDB } from "../../config/firebase.config"; // Import firebaseDB from your config
import { doc, getDoc } from "firebase/firestore"; // Import Firestore functions
import { collection, query, where, getDocs } from "firebase/firestore";

const PatientDetailScreen = ({ route, navigation }) => {
  const { patientId } = route.params; // Get patient ID from route parameters
  const [patientData, setPatientData] = useState(null); // State to store patient data
  const [selectedTab, setSelectedTab] = useState("bloodSugar"); // Tab state
  const [loading, setLoading] = useState(true); // Loading state
  const [weightHistory, setWeightHistory] = useState([]);

  const fetchPatientData = async () => {
    try {
      const docRef = doc(firebaseDB, "users", patientId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setPatientData(docSnap.data());
      } else {
        console.log("No such document!");
        Alert.alert("Error", "ไม่พบข้อมูลผู้ป่วยในระบบ");
      }
    } catch (error) {
      console.error("Error fetching patient data:", error.message); // ปรับปรุงการแสดงข้อผิดพลาด
      Alert.alert("Error", "เกิดข้อผิดพลาดในการดึงข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  const fetchWeightHistory = async (patientId) => {
    try {
      const weightHistoryRef = collection(
        firebaseDB,
        "users",
        patientId,
        "weightHistory"
      );
      const querySnapshot = await getDocs(weightHistoryRef);

      const weightHistoryData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      console.log("weightHistoryData:", weightHistoryData);

      return weightHistoryData;
    } catch (error) {
      console.error("Error fetching weight history:", error);
      return [];
    }
  };

  const fetchBloodSugarHistory = async () => {
    try {
      const q = query(
        collection(firebaseDB, "users", patientId, "bloodSugarHistory")
      );
      const querySnapshot = await getDocs(q);
      const bloodSugarHistory = [];

      querySnapshot.forEach((doc) => {
        bloodSugarHistory.push(doc.data());
      });

      setPatientData((prevState) => ({
        ...prevState,
        bloodSugarHistory: bloodSugarHistory,
      }));
    } catch (error) {
      console.error("Error fetching blood sugar history:", error);
      Alert.alert("Error", "เกิดข้อผิดพลาดในการดึงข้อมูลระดับน้ำตาลในเลือด");
    }
  };

  useEffect(() => {
    fetchPatientData();
    fetchBloodSugarHistory();

    fetchWeightHistory(patientId).then((data) => {
      setWeightHistory(data);
    });
  }, [patientId]);

  if (loading) {
    return (
      <ActivityIndicator
        size="large"
        color="#2196F3"
        style={{ marginTop: 20 }}
      />
    );
  }

  if (!patientData) {
    return (
      <Text style={{ textAlign: "center", marginTop: 20 }}>
        ไม่พบข้อมูลผู้ป่วย
      </Text>
    );
  }

  const renderTabContent = () => {
    switch (selectedTab) {
      case "bloodSugar":
        return (
          <View>
            <Text style={styles.statsText}>ระดับน้ำตาลในเลือด</Text>
            {patientData.bloodSugarHistory ? (
              <LineChart
                data={{
                  labels: patientData.bloodSugarHistory.map(
                    (entry) => entry.date
                  ), // ใช้วันที่จาก bloodSugarHistory
                  datasets: [
                    {
                      data: patientData.bloodSugarHistory.map(
                        (entry) => entry.level
                      ),
                    },
                  ], // ใช้ค่าระดับน้ำตาลจาก bloodSugarHistory
                }}
                width={350}
                height={200}
                chartConfig={{
                  backgroundColor: "#fff",
                  backgroundGradientFrom: "#fff",
                  backgroundGradientTo: "#fff",
                  decimalPlaces: 0,
                  alignSelf: "center", // Center the graph horizontally
                  marginVertical: 20,
                  color: (opacity = 1) => `rgba(0, 123, 255, ${opacity})`, // สีของกราฟ
                }}
                bezier
                style={styles.chart}
              />
            ) : (
              <Text style={styles.noDataText}>
                ไม่มีข้อมูลระดับน้ำตาลในเลือด
              </Text>
            )}
            <Text style={styles.historyTitle}>ประวัติ</Text>
            {patientData.bloodSugarHistory ? (
              patientData.bloodSugarHistory.map((entry, index) => (
                <View key={index} style={styles.historyItem}>
                  <Text style={styles.historyDate}>{entry.date}</Text>
                  <Text style={styles.historyValue}>
                    {entry.level} mg/dL ({entry.status})
                  </Text>

                  <Text style={styles.historyTime}>เวลาวัด: {entry.time}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.noDataText}>ไม่มีประวัติระดับน้ำตาล</Text>
            )}
          </View>
        );
      case "weight":
        return (
          <View>
            <Text style={styles.statsText}>น้ำหนัก</Text>
            {weightHistory && weightHistory.length > 0 ? (
              <LineChart
                data={{
                  labels: weightHistory.map((entry) => entry.date),
                  datasets: [
                    {
                      data: weightHistory.map((entry) => entry.weight),
                      color: (opacity = 1) => `rgba(0, 0, 255, ${opacity})`,
                      strokeWidth: 2,
                    },
                  ],
                }}
                width={350}
                height={220}
                chartConfig={{
                  backgroundColor: "#fff",
                  backgroundGradientFrom: "#fff",
                  backgroundGradientTo: "#fff",
                  decimalPlaces: 1,
                  alignSelf: "center", // Center the graph horizontally
                  marginVertical: 20,
                  color: (opacity = 1) => `rgba(0, 123, 255, ${opacity})`,
                }}
                bezier
                style={styles.chart}
              />
            ) : (
              <Text style={styles.noDataText}>ไม่มีข้อมูลน้ำหนัก</Text>
            )}

            <Text style={styles.historyTitle}>ประวัติ</Text>
            {weightHistory && weightHistory.length > 0 ? (
              weightHistory.map((entry, index) => (
                <View key={index} style={styles.historyItem}>
                  <Text style={styles.historyDate}>{entry.date}</Text>
                  <Text style={styles.historyValue}>{entry.weight} kg</Text>
                  <Text style={styles.historyTime}>เวลาวัด: {entry.time}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.noDataText}>ไม่มีประวัติน้ำหนัก</Text>
            )}
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.name}>{patientData.fullName || "No Name"}</Text>
        <Text style={styles.age}>
          อายุ {patientData.age || "N/A"} | เบาหวานระดับ{" "}
          {patientData.diabetesType || "N/A"}
        </Text>
      </View>

      <ScrollView>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tab,
              selectedTab === "bloodSugar" && styles.activeTab,
            ]}
            onPress={() => setSelectedTab("bloodSugar")}
          >
            <Text style={styles.tabText}>ระดับน้ำตาลในเลือด</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === "weight" && styles.activeTab]}
            onPress={() => setSelectedTab("weight")}
          >
            <Text style={styles.tabText}>น้ำหนัก</Text>
          </TouchableOpacity>
        </View>

        {renderTabContent()}

        <TouchableOpacity
          style={styles.button}
          onPress={() =>
            navigation.navigate("AdvicePage", {
              patientName: patientData.fullName,
              patientAge: patientData.age,
              patientLevel: patientData.diabetesType,
            })
          }
        >
          <Text style={styles.buttonText}>ให้คำแนะนำ</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#E3F2FD" },
  header: {
    padding: 20,
    backgroundColor: "#2196F3",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  name: { fontSize: 26, fontWeight: "bold", color: "white" },
  age: { fontSize: 18, color: "white", marginTop: 5 },
  tabContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    backgroundColor: "white",
  },
  tab: { flex: 1, padding: 15, alignItems: "center" },
  activeTab: { borderBottomWidth: 3, borderBottomColor: "#2196F3" },
  tabText: { fontSize: 16, color: "#333" },
  statsText: {
    fontSize: 18,
    fontWeight: "bold",
    paddingHorizontal: 20,
    marginVertical: 10,
  },
  chart: { borderRadius: 12, marginVertical: 20, marginHorizontal: 10 },
  historyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    padding: 20,
    color: "#2196F3",
  },
  historyItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 15,
    backgroundColor: "white",
    marginHorizontal: 15,
    marginBottom: 10,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  historyDate: { fontSize: 16, color: "#555" },
  historyValue: { fontSize: 16, fontWeight: "bold", color: "#333" },
  noDataText: {
    fontSize: 16,
    color: "#aaa",
    textAlign: "center",
    marginTop: 10,
  },
  button: {
    backgroundColor: "#2196F3",
    padding: 15,
    margin: 20,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: { color: "white", fontSize: 18, fontWeight: "bold" },
  chart: {
    borderRadius: 12,
    marginVertical: 20,
    marginHorizontal: 10,
    alignSelf: "center", // Center the chart horizontally
    shadowColor: "#000", // Shadow color for iOS
    shadowOpacity: 0.2, // Opacity of the shadow
    shadowOffset: { width: 0, height: 4 }, // Offset for the shadow
    shadowRadius: 6, // Blur radius for the shadow
    elevation: 8, // Elevation for Android
  },
});

export default PatientDetailScreen;
