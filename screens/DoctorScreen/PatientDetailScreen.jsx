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
import { LineChart } from "react-native-chart-kit";
import { firebaseDB } from "../../config/firebase.config";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from "react-native-safe-area-context";


const PatientDetailScreen = ({ route, navigation }) => {
  const { patientId } = route.params;
  const [patientData, setPatientData] = useState(null);
  const [selectedTab, setSelectedTab] = useState("bloodSugar");
  const [loading, setLoading] = useState(true);
  const [weightHistory, setWeightHistory] = useState([]);
  const [diaryEntries, setDiaryEntries] = useState([]);
  const [error, setError] = useState(null);

  const fetchPatientData = async () => {
    try {
      const docRef = doc(firebaseDB, "users", patientId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        // Ensure all required fields exist with default values
        setPatientData({
          fullName: data.fullName || "ไม่ระบุชื่อ",
          age: data.age || "ไม่ระบุ",
          diabetesType: data.diabetesType || "ไม่ระบุ",
          bloodSugarHistory: data.bloodSugarHistory || [],
          relatives: data.relatives || [],
          ...data
        });
      } else {
        setError("ไม่พบข้อมูลผู้ป่วยในระบบ");
      }
    } catch (error) {
      console.error("Error fetching patient data:", error.message);
      setError("เกิดข้อผิดพลาดในการดึงข้อมูล");
    }
  };

  const fetchWeightHistory = async (patientId) => {
    try {
      const weightHistoryRef = collection(firebaseDB, "users", patientId, "weightHistory");
      const querySnapshot = await getDocs(weightHistoryRef);

      const weightHistoryData = querySnapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
          // Ensure required fields exist
          date: doc.data().date || "ไม่ระบุวันที่",
          weight: doc.data().weight || 0,
          time: doc.data().time || "ไม่ระบุเวลา"
        }))
        .sort((a, b) => new Date(a.date) - new Date(b.date)); // Sort by date

      return weightHistoryData;
    } catch (error) {
      console.error("Error fetching weight history:", error);
      return [];
    }
  };

  const fetchBloodSugarHistory = async () => {
    try {
      const q = query(collection(firebaseDB, "users", patientId, "bloodSugarHistory"));
      const querySnapshot = await getDocs(q);
      const bloodSugarHistory = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        bloodSugarHistory.push({
          date: data.date || "ไม่ระบุวันที่",
          time: data.time || "ไม่ระบุเวลา",
          level: data.level || 0,
          status: data.status || "ไม่ระบุ"
        });
      });

      // Sort by date
      bloodSugarHistory.sort((a, b) => new Date(a.date) - new Date(b.date));

      setPatientData((prevState) => ({
        ...prevState,
        bloodSugarHistory
      }));
    } catch (error) {
      console.error("Error fetching blood sugar history:", error);
      Alert.alert("Error", "เกิดข้อผิดพลาดในการดึงข้อมูลระดับน้ำตาลในเลือด");
    }
  };

  const fetchDiaryEntries = async () => {
    try {
      const formatDate = (date) => {
        return date.toISOString().split('T')[0];
      };

      const today = new Date();
      const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

      const entriesRef = collection(firebaseDB, "users", patientId, "entries");
      const q = query(
        entriesRef,
        where("date", ">=", formatDate(oneWeekAgo)),
        where("date", "<=", formatDate(today))
      );

      const querySnapshot = await getDocs(q);
      const entries = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        entries.push({
          id: doc.id,
          date: data.date || "ไม่ระบุวันที่",
          meals: data.meals || {},
          exercises: data.exercises || []
        });
      });

      setDiaryEntries(entries);
    } catch (error) {
      console.error("Error fetching diary entries:", error);
      setDiaryEntries([]);
    }
  };

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      setError(null);
      try {
        await fetchPatientData();
        await fetchBloodSugarHistory();
        const weightData = await fetchWeightHistory(patientId);
        setWeightHistory(weightData);
        await fetchDiaryEntries();
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("เกิดข้อผิดพลาดในการดึงข้อมูล");
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [patientId]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!patientData) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>ไม่พบข้อมูลผู้ป่วย</Text>
      </View>
    );
  }


  const renderTabContent = () => {
    switch (selectedTab) {
      case "bloodSugar":
        return (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>ระดับน้ำตาลในเลือด</Text>
            {patientData?.bloodSugarHistory?.length > 0 ? (
              <LineChart
                data={{
                  labels: patientData.bloodSugarHistory.map(entry => entry.date),
                  datasets: [{
                    data: patientData.bloodSugarHistory.map(entry => Number(entry.level) || 0)
                  }]
                }}
                width={350}
                height={220}
                chartConfig={{
                  backgroundColor: "#ffffff",
                  backgroundGradientFrom: "#ffffff",
                  backgroundGradientTo: "#ffffff",
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  style: {
                    borderRadius: 16
                  },
                  propsForDots: {
                    r: "6",
                    strokeWidth: "2",
                    stroke: "#2196F3"
                  }
                }}
                bezier
                style={styles.chart}
              />
            ) : (
              <Text style={styles.noDataText}>ไม่มีข้อมูลระดับน้ำตาลในเลือด</Text>
            )}
            <Text style={styles.historyTitle}>ประวัติ</Text>
            {patientData.bloodSugarHistory ? (
              patientData.bloodSugarHistory.map((entry, index) => (
                <View key={index} style={styles.historyItem}>
                  <View style={styles.historyItemLeft}>
                    <Text style={styles.historyDate}>{entry.date}</Text>
                    <Text style={styles.historyTime}>เวลาวัด: {entry.time}</Text>
                  </View>
                  <View style={styles.historyItemRight}>
                    <Text style={styles.historyValue}>{entry.level} mg/dL</Text>
                    <Text style={[styles.historyStatus, { color: getStatusColor(entry.status) }]}>
                      {entry.status}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.noDataText}>ไม่มีประวัติระดับน้ำตาล</Text>
            )}
          </View>
        );
        case "weight":
          return (
            <View style={styles.tabContent}>
              <Text style={styles.sectionTitle}>น้ำหนัก</Text>
              {weightHistory?.length > 0 ? (
                <LineChart
                  data={{
                    labels: weightHistory.map(entry => entry.date),
                    datasets: [{
                      data: weightHistory.map(entry => Number(entry.weight) || 0)
                    }]
                  }}
                  width={350}
                  height={220}
                  chartConfig={{
                    backgroundColor: "#ffffff",
                    backgroundGradientFrom: "#ffffff",
                    backgroundGradientTo: "#ffffff",
                    decimalPlaces: 1,
                    color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                    style: {
                      borderRadius: 16
                    },
                    propsForDots: {
                      r: "6",
                      strokeWidth: "2",
                      stroke: "#2196F3"
                    }
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
        case "diary":
          return (
            <View style={styles.diaryContainer}>
              <Text style={styles.diaryTitle}>ไดอารี่อาหารและการออกกำลังกาย</Text>
              {diaryEntries?.length > 0 ? (
                diaryEntries.map((entry, index) => (
                  <View key={index} style={styles.diaryEntry}>
                  <View style={styles.diaryHeader}>
                    <Text style={styles.diaryDate}>{new Date(entry.date).toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</Text>
                  </View>
                  <View><Text style={styles.diaryCalories}>แคลอรี่รวม: {calculateTotalCalories(entry)} kcal</Text>
                  </View>
                  <View style={styles.macrosContainer}>
                    <View style={styles.macroItem}>
                      <MaterialCommunityIcons name="bread-slice" size={24} color="#FF9800" />
                      <Text style={styles.macroValue}>{calculateTotalMacro(entry, 'carbs')}g</Text>
                      <Text style={styles.macroLabel}>คาร์โบไฮเดรต</Text>
                    </View>
                    <View style={styles.macroItem}>
                      <MaterialCommunityIcons name="food-steak" size={24} color="#4CAF50" />
                      <Text style={styles.macroValue}>{calculateTotalMacro(entry, 'protein')}g</Text>
                      <Text style={styles.macroLabel}>โปรตีน</Text>
                    </View>
                    <View style={styles.macroItem}>
                      <MaterialCommunityIcons name="oil" size={24} color="#2196F3" />
                      <Text style={styles.macroValue}>{calculateTotalMacro(entry, 'fat')}g</Text>
                      <Text style={styles.macroLabel}>ไขมัน</Text>
                    </View>
                  </View>
                  <Text style={styles.sectionTitle}>มื้ออาหาร</Text>
                  {Object.entries(entry.meals).map(([mealName, mealData], mealIndex) => (
                    <View key={mealIndex} style={styles.meal}>
                      <Text style={styles.mealName}>{mealName}</Text>
                      {mealData.items.map((item, itemIndex) => (
                        <View key={itemIndex} style={styles.mealItem}>
                          <Text style={styles.itemName}>{item.name}</Text>
                          <Text style={styles.itemDetails}>{item.amount} • {item.calories} kcal</Text>
                        </View>
                      ))}
                    </View>
                  ))}
                  {entry.exercises && entry.exercises.length > 0 && (
                    <View>
                      <Text style={styles.sectionTitle}>การออกกำลังกาย</Text>
                      {entry.exercises.map((exercise, exerciseIndex) => (
                        <View key={exerciseIndex} style={styles.exerciseItem}>
                          <MaterialCommunityIcons name="run" size={24} color="#E91E63" />
                          <View style={styles.exerciseDetails}>
                            <Text style={styles.exerciseName}>{exercise.name}</Text>
                            <Text style={styles.exerciseInfo}>{exercise.duration} นาที • {exercise.calories} kcal</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              ))
            ) : (
              <Text style={styles.noDataText}>ไม่มีข้อมูลไดอารี่</Text>
            )}
          </View>
        );
        case "relatives":
        return (
          <View style={styles.relativesContainer}>
            <Text style={styles.relativesTitle}>ข้อมูลญาติ</Text>
            {patientData?.relatives?.length > 0 ? (
              patientData.relatives.map((relative, index) => (
                <View key={index} style={styles.relativeItem}>
                  <MaterialCommunityIcons name="account" size={24} color="#2196F3" />
                  <View style={styles.relativeInfo}>
                    <Text style={styles.relativeName}>{relative.name || "ไม่ระบุชื่อ"}</Text>
                    <Text style={styles.relativePhone}>{relative.phoneNumber || "ไม่ระบุเบอร์โทร"}</Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.noDataText}>ไม่มีข้อมูลญาติ</Text>
            )}
          </View>
        );

      default:
        return null;
    }
  };


  const getStatusColor = (status) => {
    switch (status) {
      case 'ต่ำ':
        return '#FF9800';
      case 'ปกติ':
        return '#4CAF50';
      case 'สูง':
        return '#F44336';
      default:
        return '#757575';
    }
  };
  const calculateTotalCalories = (entry) => {
    try {
      let total = 0;
      if (entry?.meals) {
        Object.values(entry.meals).forEach(meal => {
          if (meal?.items) {
            meal.items.forEach(item => {
              total += Number(item.calories) || 0;
            });
          }
        });
      }
      return total.toFixed(0);
    } catch (error) {
      console.error("Error calculating calories:", error);
      return "0";
    }
  };

  const calculateTotalMacro = (entry, macro) => {
    try {
      let total = 0;
      if (entry?.meals) {
        Object.values(entry.meals).forEach(meal => {
          if (meal?.items) {
            meal.items.forEach(item => {
              total += Number(item[macro]) || 0;
            });
          }
        });
      }
      return total.toFixed(1);
    } catch (error) {
      console.error(`Error calculating ${macro}:`, error);
      return "0.0";
    }
  };


  return (
    <LinearGradient colors={["#4A90E2", "#50E3C2"]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.name}>{patientData.fullName || "No Name"}</Text>
          <Text style={styles.age}>
            อายุ {patientData.age || "N/A"} | เบาหวานระดับ {patientData.diabetesType || "N/A"}
          </Text>
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === "bloodSugar" && styles.activeTab]}
            onPress={() => setSelectedTab("bloodSugar")}
          >
            <MaterialCommunityIcons
              name="water"
              size={24}
              color={selectedTab === "bloodSugar" ? "#2196F3" : "#757575"}
            />
            <Text style={[styles.tabText, selectedTab === "bloodSugar" && styles.activeTabText]}>
              น้ำตาล
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === "weight" && styles.activeTab]}
            onPress={() => setSelectedTab("weight")}
          >
            <MaterialCommunityIcons
              name="scale-bathroom"
              size={24}
              color={selectedTab === "weight" ? "#2196F3" : "#757575"}
            />
            <Text style={[styles.tabText, selectedTab === "weight" && styles.activeTabText]}>
              น้ำหนัก
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === "diary" && styles.activeTab]}
            onPress={() => setSelectedTab("diary")}
          >
            <MaterialCommunityIcons
              name="book-open-variant"
              size={24}
              color={selectedTab === "diary" ? "#2196F3" : "#757575"}
            />
            <Text style={[styles.tabText, selectedTab === "diary" && styles.activeTabText]}>
              ไดอารี่
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === "relatives" && styles.activeTab]}
            onPress={() => setSelectedTab("relatives")}
          >
            <MaterialCommunityIcons
              name="account-group"
              size={24}
              color={selectedTab === "relatives" ? "#2196F3" : "#757575"}
            />
            <Text style={[styles.tabText, selectedTab === "relatives" && styles.activeTabText]}>
              ญาติ
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {renderTabContent()}
        </ScrollView>
        <TouchableOpacity
          style={styles.adviceButton}
          onPress={() => {
            navigation.navigate("AdvicePage", {
              patientName: patientData.fullName,
              patientAge: patientData.age,
              patientLevel: patientData.diabetesType,
              patientId: patientId,
              userId: patientId,
            });
          }}
        >
         <MaterialCommunityIcons name="lightbulb-on" size={24} color="white" />
          <Text style={styles.adviceButtonText}>ให้คำแนะนำ</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </LinearGradient>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5"
  },
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  errorText: {
    fontSize: 18,
    color: '#FF5252',
    fontFamily: 'Kanit-Regular',
  },
  header: {
    padding: 20,
    backgroundColor: "#2196F3",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 4,
  },
  name: {
    fontSize: 26,
    fontFamily: 'Kanit-Bold',
    color: "white"
  },
  age: {
    fontSize: 18,
    color: "white",
    marginTop: 5
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 25,
    margin: 15,
    elevation: 2,
  },
  tab: {
    flex: 1,
    padding: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: "#2196F3"
  },
  tabText: {
    fontSize: 14,
    color: "#757575",
    marginTop: 5,
  },
  activeTabText: {
    color: "#2196F3",
    fontFamily: 'Kanit-Bold',
  },
  content: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 20,
    paddingHorizontal: 15,
  },
  tabContent: {
    padding: 15,
  },
  sectionTitle: {
    fontSize: 22,
    marginBottom: 15,
    color: "#1E88E5",
    fontFamily: 'Kanit-Bold',
  },
  chart: {
    borderRadius: 16,
    marginVertical: 20,
    alignItems: "center",
  },
  statsText: {
    fontSize: 20,
    fontFamily: 'Kanit-Bold',
    marginBottom: 15,
    color: "#333",
  },
  chart: {
    borderRadius: 16,
    marginVertical: 20,
    alignItems: "center",
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
    color: "#2196F3",
  },
  historyItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 15,
    backgroundColor: "white",
    marginBottom: 10,
    borderRadius: 10,
    elevation: 2,
  },
  historyItemLeft: {
    flex: 1,
  },
  historyItemRight: {
    alignItems: "flex-end",
  },
  historyDate: {
    fontSize: 16,
    color: "#333",
    fontFamily: 'Kanit-Regular',
  },
  historyTime: {
    fontSize: 14,
    color: "#757575",
    marginTop: 4,
    fontFamily: 'Kanit-Light',
  },
  historyValue: {
    fontSize: 18,
    color: "#2196F3",
    fontFamily: 'Kanit-Bold',
  },
  historyStatus: {
    fontSize: 14,
    marginTop: 4,
    fontFamily: 'Kanit-Regular',
  },
  noDataText: {
    fontSize: 16,
    color: "#757575",
    textAlign: "center",
    marginTop: 20,
    fontFamily: 'Kanit-Regular',
  },
  adviceButton: {
    flexDirection: "row",
    backgroundColor: "#4CAF50",
    padding: 15,
    margin: 20,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },
  adviceButtonText: {
    color: "white",
    fontSize: 18,
    fontFamily: 'Kanit-Bold',
    marginLeft: 10,
  },
  // New styles for the diary section
  diaryContainer: {
    padding: 15,
  },
  diaryTitle: {
    fontSize: 24,
    fontFamily: 'Kanit-Bold',
    color: "#333",
    marginBottom: 20,
  },
  diaryEntry: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    elevation: 3,
  },
  diaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  diaryDate: {
    fontSize: 18,
    fontFamily: 'Kanit-Bold',
    color: "#2196F3",
  },
  diaryCalories: {
    fontSize: 16,
    color: "#4CAF50",
    fontFamily: 'Kanit-Bold',
  },
  macrosContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#F5F5F5",
    borderRadius: 10,
    padding: 10,
    marginBottom: 15,
  },
  macroItem: {
    alignItems: "center",
  },
  macroValue: {
    fontSize: 18,
    fontFamily: 'Kanit-Bold',
    marginTop: 5,
  },
  macroLabel: {
    fontSize: 12,
    color: "#757575",
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Kanit-Bold',
    color: "#333",
    marginTop: 15,
    marginBottom: 10,
  },
  meal: {
    marginBottom: 15,
  },
  mealName: {
    fontSize: 18,
    fontFamily: 'Kanit-Bold',
    color: "#2196F3",
    marginBottom: 5,
  },
  mealItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 5,
  },
  itemName: {
    fontSize: 16,
    color: "#333",
  },
  itemDetails: {
    fontSize: 14,
    color: "#757575",
  },
  exerciseItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  exerciseDetails: {
    marginLeft: 10,
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontFamily: 'Kanit-Bold',
    color: "#333",
  },
  exerciseInfo: {
    fontSize: 14,
    color: "#757575",
  },
  relativesContainer: {
    padding: 15,
  },
  relativesTitle: {
    fontSize: 20,
    fontFamily: 'Kanit-Bold',
    marginBottom: 15,
    color: "#333",
  },
  relativeItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    elevation: 2,
  },
  relativeInfo: {
    marginLeft: 15,
  },
  relativeName: {
    fontSize: 18,
    fontFamily: 'Kanit-Bold',
    color: "#333",
  },
  relativePhone: {
    fontSize: 16,
    color: "#757575",
    marginTop: 5,
  },
  relativeRole: {
    fontSize: 14,
    color: "#2196F3",
    marginTop: 5,
  },
});

export default PatientDetailScreen;