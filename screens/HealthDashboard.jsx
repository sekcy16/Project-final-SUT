import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  RefreshControl,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { SafeAreaView } from "react-native-safe-area-context";
import PagerView from "react-native-pager-view";
import { ProgressBar } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { firebaseAuth, firebaseDB } from "../config/firebase.config";
import { doc, getDoc, getDocs, collection, query, where, onSnapshot, orderBy, limit } from "firebase/firestore";
import { Svg, Path, G, Text as SvgText } from "react-native-svg";

const HealthDashboard = ({ navigation }) => {
  const [userData, setUserData] = useState(null);
  const [latestBloodSugar, setLatestBloodSugar] = useState(null);
  const [latestWeight, setLatestWeight] = useState(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  // State for calorie and macronutrient tracking
  const [caloriesAllowed, setCaloriesAllowed] = useState(0);
  const [caloriesConsumed, setCaloriesConsumed] = useState(0);
  const [proteinConsumed, setProteinConsumed] = useState(0);
  const [carbsConsumed, setCarbsConsumed] = useState(0);
  const [fatConsumed, setFatConsumed] = useState(0);
  const [proteinGoal, setProteinGoal] = useState(0);
  const [carbsGoal, setCarbsGoal] = useState(0);
  const [fatGoal, setFatGoal] = useState(0);
  const [meals, setMeals] = useState({});

  useEffect(() => {
    const unsubscribeAuth = firebaseAuth.onAuthStateChanged((user) => {
      if (user) {
        fetchUserData(user.uid);
        fetchLatestBloodSugar(user.uid);
      } else {
        setUserData(null);
        setLatestBloodSugar(null);
        setLatestWeight(null);
      }
    });
  

    // Fetch unread notifications
    const unsubscribeNotifications = onSnapshot(
      query(
        collection(firebaseDB, "Notidetails"),
        where("userId", "==", firebaseAuth.currentUser?.uid),
        where("read", "==", false)
      ),
      (querySnapshot) => {
        setUnreadNotifications(querySnapshot.size);
      }
    );

    // Load latest data when the screen is focused
    const focusListener = navigation.addListener("focus", () => {
      loadLatestData();
    });

    // Cleanup functions
    return () => {
      unsubscribeAuth();
      unsubscribeNotifications();
      navigation.removeListener("focus", focusListener);
    };
  }, [navigation]);

  const fetchUserData = async (uid) => {
    try {
      const userDocRef = doc(firebaseDB, "users", uid);
      const userDoc = await getDoc(userDocRef);
  
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserData(data);
        setCaloriesAllowed(data.tdee || 0);
        setProteinGoal(data.macronutrients?.protein || 0);
        setCarbsGoal(data.macronutrients?.carbs || 0);
        setFatGoal(data.macronutrients?.fat || 0);
        
        // เรียกฟังก์ชันเพื่อดึงข้อมูลน้ำหนักล่าสุด
        await fetchLatestWeight(uid);
      } else {
        console.error("ไม่พบเอกสารผู้ใช้!");
      }
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้:", error);
    }
  };
  
  const fetchLatestWeight = async (uid) => {
    try {
      const weightHistoryRef = collection(firebaseDB, "users", uid, "weightHistory");
      const q = query(weightHistoryRef, orderBy("date", "desc"), orderBy("time", "desc"), limit(1));
      const querySnapshot = await getDocs(q);
  
      if (!querySnapshot.empty) {
        const latestWeightData = querySnapshot.docs[0].data();
        setLatestWeight(latestWeightData.weight);
        console.log("Latest weight:", latestWeightData.weight);
      } else {
        console.log("ไม่พบข้อมูลน้ำหนัก");
        setLatestWeight(null);
      }
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการดึงข้อมูลน้ำหนักล่าสุด:", error);
      setLatestWeight(null);
    }
  };


  const fetchLatestBloodSugar = async (uid) => {
    try {
      const bloodSugarRef = collection(
        firebaseDB,
        "users",
        uid,
        "bloodSugarHistory"
      );
      const q = query(
        bloodSugarRef,
        orderBy("date", "desc"),
        orderBy("time", "desc"),
        limit(1)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const latestReading = querySnapshot.docs[0].data();
        setLatestBloodSugar(latestReading.level);
        console.log("Latest blood sugar reading:", latestReading);
      } else {
        console.log("No blood sugar readings found");
        setLatestBloodSugar(null);
      }
    } catch (error) {
      console.error("Error fetching blood sugar history:", error);
      Alert.alert("Error", "เกิดข้อผิดพลาดในการดึงข้อมูลระดับน้ำตาลในเลือด");
      setLatestBloodSugar(null);
    }
  };

  const loadLatestData = async () => {
    try {
      const user = firebaseAuth.currentUser;
      if (user) {
        await fetchLatestBloodSugar(user.uid);

        // Load average blood sugar
        const savedAverageBloodSugar = await AsyncStorage.getItem(
          "averageBloodSugarToday"
        );
        if (savedAverageBloodSugar) {
          setAverageBloodSugar(parseFloat(savedAverageBloodSugar));
        }

        // Fetch diary entries
        const diaryRef = doc(
          firebaseDB,
          "users",
          user.uid,
          "entries",
          new Date().toISOString().split("T")[0]
        );
        const diarySnap = await getDoc(diaryRef);
        if (diarySnap.exists()) {
          const diaryData = diarySnap.data();
          setMeals(diaryData.meals || getDefaultMeals());
        } else {
          console.log("ไม่พบข้อมูลไดอารี่ ใช้ข้อมูลเริ่มต้น");
          setMeals(getDefaultMeals());
        }
      } else {
        setMeals(getDefaultMeals());
      }

      // Calculate totals
      const { totalCalories, totalProtein, totalCarbs, totalFat } =
        calculateTotals(meals);

      setCaloriesConsumed(totalCalories);
      setProteinConsumed(totalProtein);
      setCarbsConsumed(totalCarbs);
      setFatConsumed(totalFat);
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการโหลดข้อมูลล่าสุด:", error);
      // Use default data in case of error
      setMeals(getDefaultMeals());
      const { totalCalories, totalProtein, totalCarbs, totalFat } =
        calculateTotals(getDefaultMeals());
      setCaloriesConsumed(totalCalories);
      setProteinConsumed(totalProtein);
      setCarbsConsumed(totalCarbs);
      setFatConsumed(totalFat);
    }
  };

  // Helper function to get default meals
  const getDefaultMeals = () => ({
    มื้อเช้า: { calories: 0, protein: 0, carbs: 0, fat: 0 },
    มื้อเที่ยง: { calories: 0, protein: 0, carbs: 0, fat: 0 },
    มื้อเย็น: { calories: 0, protein: 0, carbs: 0, fat: 0 },
  });
  // Helper function to calculate totals
  const calculateTotals = (meals) => {
    return Object.values(meals).reduce(
      (totals, meal) => ({
        totalCalories: totals.totalCalories + (meal.calories || 0),
        totalProtein: totals.totalProtein + (meal.protein || 0),
        totalCarbs: totals.totalCarbs + (meal.carbs || 0),
        totalFat: totals.totalFat + (meal.fat || 0),
      }),
      { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0 }
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    const user = firebaseAuth.currentUser;
    if (user) {
      await fetchUserData(user.uid);
      await fetchLatestBloodSugar(user.uid);
      await loadLatestData();
    }
    setRefreshing(false);
  };
  const SimplePieChart = ({ data, hasRealData }) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    let startAngle = 0;

    return (
      <View style={styles.pieChartContainer}>
        <Svg height="160" width="160" viewBox="-100 -100 200 200">
          {data.map((item, index) => {
            const percentage = item.value / total;
            const angle = percentage * 2 * Math.PI;
            const radius = 80;
            const midAngle = startAngle + angle / 2;
            const x = Math.round(Math.cos(midAngle) * radius);
            const y = Math.round(Math.sin(midAngle) * radius);

            const path = `
              M 0 0
              L ${Math.cos(startAngle) * 100} ${Math.sin(startAngle) * 100}
              A 100 100 0 ${angle > Math.PI ? 1 : 0} 1 ${
              Math.cos(startAngle + angle) * 100
            } ${Math.sin(startAngle + angle) * 100}
              Z
            `;
            startAngle += angle;

            return (
              <G key={index}>
                <Path
                  d={path}
                  fill={hasRealData ? item.color : "#E0E0E0"}
                  stroke="#FFFFFF"
                  strokeWidth="2"
                />
                {!isNaN(x) && !isNaN(y) && (
                  <SvgText
                    x={x}
                    y={y}
                    textAnchor="middle"
                    alignmentBaseline="middle"
                    fill={hasRealData ? "#FFFFFF" : "#777777"}
                    fontSize="12"
                    fontWeight="bold"
                  >
                    {`${Math.round(percentage * 100)}%`}
                  </SvgText>
                )}
              </G>
            );
          })}
        </Svg>
        <View style={styles.legendContainer}>
          {data.map((item, index) => (
            <View key={index} style={styles.legendItem}>
              <View
                style={[
                  styles.legendIconContainer,
                  { backgroundColor: hasRealData ? item.color : "#E0E0E0" },
                ]}
              >
                <Icon
                  name={item.icon}
                  size={24}
                  color={hasRealData ? "#FFF" : "#777777"}
                />
              </View>
              <Text
                style={[
                  styles.legendText,
                  { color: hasRealData ? "#333" : "#777777" },
                ]}
              >
                {item.label}
              </Text>
              <Text
                style={[
                  styles.legendValue,
                  { color: hasRealData ? "#333" : "#777777" },
                ]}
              >
                {item.value.toFixed(1)}g
              </Text>
            </View>
          ))}
        </View>
        {!hasRealData && (
          <Text style={styles.noDataText}>
            ยังไม่มีข้อมูลอาหาร กรุณาเพิ่มอาหารเพื่อดูข้อมูลจริง
          </Text>
        )}
      </View>
    );
  };

  const CalorieInfo = ({
    meals,
    caloriesAllowed,
    proteinGoal,
    carbsGoal,
    fatGoal,
  }) => {
    const [pages, setPages] = useState([]);
    const [activePage, setActivePage] = useState(0);

    useEffect(() => {
      const mealOrder = ["มื้อเช้า", "มื้อเที่ยง", "มื้อเย็น"];
      const orderedMeals = mealOrder.map((mealName) => ({
        name: mealName,
        calories: Number(meals[mealName]?.calories) || 0,
        protein: Number(meals[mealName]?.protein) || 0,
        carbs: Number(meals[mealName]?.carbs) || 0,
        fat: Number(meals[mealName]?.fat) || 0,
      }));

      const totalNutrition = orderedMeals.reduce(
        (total, meal) => ({
          calories: total.calories + meal.calories,
          protein: total.protein + meal.protein,
          carbs: total.carbs + meal.carbs,
          fat: total.fat + meal.fat,
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      );

      setPages([
        { name: "สารอาหารวันนี้", ...totalNutrition },
        ...orderedMeals,
      ]);
    }, [meals]);

    const renderNutritionInfo = (data, goals) => (
      <View style={styles.nutritionInfoContainer}>
        <NutritionRow
          label="แคลอรี่"
          value={data.calories}
          goal={goals.calories}
          unit="กิโลแคลอรี่"
          color="#FF6347"
          icon="fire"
        />
        <NutritionRow
          label="โปรตีน"
          value={data.protein}
          goal={goals.protein}
          unit="กรัม"
          color="#1E90FF"
          icon="egg-fried"
        />
        <NutritionRow
          label="คาร์บ"
          value={data.carbs}
          goal={goals.carbs}
          unit="กรัม"
          color="#32CD32"
          icon="bread-slice"
        />
        <NutritionRow
          label="ไขมัน"
          value={data.fat}
          goal={goals.fat}
          unit="กรัม"
          color="#FFD700"
          icon="oil"
        />
      </View>
    );

    const NutritionRow = ({ label, value, goal, unit, color, icon }) => {
      const isCalories = label.toLowerCase().includes("แคลอรี่");
      const isExceeded = value > goal;
      const exceedAmount = isExceeded ? value - goal : 0;
      const remaining = isExceeded ? 0 : goal - value;

      return (
        <View style={styles.nutritionRow}>
          <View style={styles.nutritionLabelContainer}>
            <Icon
              name={icon}
              size={24}
              color={color}
              style={styles.nutritionIcon}
            />
            <Text style={styles.nutritionLabel}>{label}</Text>
          </View>
          <View style={styles.nutritionValueContainer}>
            <Text style={styles.nutritionValue}>
              {value.toFixed(1)} / {goal.toFixed(1)} {unit}
            </Text>
            <ProgressBar
              progress={Math.min(value / goal, 1)}
              color={isExceeded ? "#FF0000" : color}
              style={styles.progressBar}
            />
            {isCalories && (
              <Text
                style={[
                  styles.nutritionLeft,
                  isExceeded ? styles.exceededText : null,
                ]}
              >
                {isExceeded
                  ? `เกิน ${exceedAmount.toFixed(1)} ${unit}`
                  : `เหลือ ${remaining.toFixed(1)} ${unit}`}
              </Text>
            )}
          </View>
        </View>
      );
    };

    const renderPieChart = (data, goals) => {
      const pieData = [
        {
          value: data.protein,
          color: "#1E90FF",
          label: "โปรตีน",
          icon: "egg-fried",
        },
        {
          value: data.carbs,
          color: "#32CD32",
          label: "คาร์บ",
          icon: "bread-slice",
        },
        { value: data.fat, color: "#FFD700", label: "ไขมัน", icon: "oil" },
      ].filter((item) => item.value > 0);

      const hasRealData = Object.values(meals).some(
        (meal) =>
          meal.calories > 0 ||
          meal.protein > 0 ||
          meal.carbs > 0 ||
          meal.fat > 0
      );

      return (
        <View style={styles.pieChartContainer}>
          <SimplePieChart data={pieData} hasRealData={hasRealData} />
          <Text style={styles.caloriesSummary}>
            แคลอรี่ทั้งหมด: {data.calories.toFixed(1)} /{" "}
            {goals.calories.toFixed(1)} กิโลแคลอรี่
          </Text>
        </View>
      );
    };

    return (
      <View style={styles.calorieInfoContainer}>
        <PagerView
          style={styles.pagerView}
          initialPage={0}
          onPageSelected={(e) => setActivePage(e.nativeEvent.position)}
        >
          {pages.map((page, index) => (
            <View key={index} style={styles.pageContainer}>
              <Text style={styles.pageTitleText}>{page.name}</Text>
              {index === 0
                ? renderPieChart(page, {
                    calories: Number(caloriesAllowed) || 2000, // Default value if not set
                    protein: Number(proteinGoal) || 50,
                    carbs: Number(carbsGoal) || 250,
                    fat: Number(fatGoal) || 70,
                  })
                : renderNutritionInfo(page, {
                    calories: Number(caloriesAllowed) || 2000,
                    protein: Number(proteinGoal) || 50,
                    carbs: Number(carbsGoal) || 250,
                    fat: Number(fatGoal) || 70,
                  })}
            </View>
          ))}
        </PagerView>
        <View style={styles.paginationDots}>
          {pages.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                { backgroundColor: index === activePage ? "#333" : "#CCC" },
              ]}
            />
          ))}
        </View>
      </View>
    );
  };

  const HealthCard = ({ title, value, icon, color, onPress }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: color }]}
      onPress={onPress}
    >
      <View style={styles.cardContent}>
        <Icon name={icon} size={32} color="#FFF" />
        <View style={styles.cardTextContent}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardValue}>{value}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <LinearGradient colors={["#4A90E2", "#50E3C2"]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollView}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#1E88E5"]}
            />
          }
        >
          <View style={styles.header}>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerGreeting}>สวัสดี</Text>
              <Text style={styles.headerName}>
                {userData?.fullName || "ผู้ใช้"}
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.notificationIcon,
                unreadNotifications > 0
                  ? styles.notificationIconWithBadge
                  : null,
              ]}
              onPress={() => navigation.navigate("NotificationListScreen")}
            >
              <Icon name="bell" size={24} color="#FFF" />
              {unreadNotifications > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>
                    {unreadNotifications}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.mainContent}>
            <CalorieInfo
              meals={meals}
              caloriesAllowed={caloriesAllowed}
              proteinGoal={proteinGoal}
              carbsGoal={carbsGoal}
              fatGoal={fatGoal}
            />

            <View style={styles.cardContainer}>
              <HealthCard
                title="ระดับน้ำตาลในเลือด"
                value={
                  latestBloodSugar !== null
                    ? `${latestBloodSugar} mg/dL`
                    : "ไม่มีข้อมูล"
                }
                icon="blood-bag"
                color="#FF6B6B"
                onPress={() => navigation.navigate("BloodSugar")}
              />

              <HealthCard
                title="น้ำหนัก"
                value={
                  latestWeight !== null ? `${latestWeight} KG` : "ไม่มีข้อมูล"
                }
                icon="weight"
                color="#4ECDC4"
                onPress={() => navigation.navigate("WeightProgress")}
              />
            </View>
          </View>
        </ScrollView>
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
  scrollView: {
    flexGrow: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTextContainer: {
    flexDirection: "column",
  },
  headerGreeting: {
    fontSize: 25,
    fontFamily: "Kanit-Bold",
    color: "#FFF",
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  headerText: {
    fontSize: 28,
    fontFamily: "Kanit-Bold",
    color: "#FFF",
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  headerName: {
    fontSize: 21,
    fontFamily: "Kanit-Regular",
    color: "#FFF",
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  notificationIcon: {
    padding: 10,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 20,
  },
  notificationIconWithBadge: {
    position: "relative",
  },
  notificationBadge: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "#FF4136",
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  notificationBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontFamily: "Kanit-Bold",
  },
  mainContent: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 20,
    paddingHorizontal: 15,
  },
  cardContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 20,
  },
  card: {
    width: "48%",
    marginBottom: 15,
    borderRadius: 15,
    overflow: "hidden",
    elevation: 5,
  },
  cardContent: {
    padding: 15,
    alignItems: "center",
  },
  cardTextContent: {
    marginTop: 10,
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 14,
    fontFamily: "Kanit-Bold",
    color: "#FFF",
    marginBottom: 5,
    textAlign: "center",
  },
  cardValue: {
    fontSize: 16,
    fontFamily: "Kanit-Bold",
    color: "#FFF",
  },
  calorieInfoContainer: {
    backgroundColor: "#FFF",
    borderRadius: 15,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  pagerView: {
    height: 380,
  },
  pieChartContainer: {
    alignItems: "center",
    marginTop: 10,
  },
  pageTitleText: {
    fontSize: 20,
    fontFamily: "Kanit-Bold",
    marginBottom: 15,
    textAlign: "center",
    color: "#333",
  },
  nutritionInfoContainer: {
    marginTop: 10,
  },
  nutritionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  nutritionLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "30%",
  },
  nutritionIcon: {
    marginRight: 5,
  },
  nutritionLabel: {
    fontSize: 16,
    fontFamily: "Kanit-Bold",
    color: "#333",
  },
  nutritionValueContainer: {
    width: "70%",
  },
  nutritionValue: {
    fontSize: 16,
    fontFamily: "Kanit-Regular",
    marginBottom: 5,
    color: "#333",
  },
  progressBar: {
    height: 10,
    borderRadius: 5,
    marginBottom: 5,
  },
  nutritionLeft: {
    fontSize: 14,
    fontFamily: "Kanit-Regular",
    color: "#666",
  },
  exceededText: {
    color: "#FF0000",
    fontFamily: "Kanit-Bold",
  },
  paginationDots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  legendContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginTop: 15,
  },
  legendItem: {
    alignItems: "center",
    width: "30%",
  },
  legendIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 5,
  },
  legendText: {
    fontSize: 12,
    fontFamily: "Kanit-Regular",
    textAlign: "center",
  },
  legendValue: {
    fontSize: 14,
    fontFamily: "Kanit-Bold",
    marginTop: 2,
  },
  caloriesSummary: {
    fontSize: 16,
    fontFamily: "Kanit-Bold",
    marginTop: 15,
    color: "#333",
  },
  noDataText: {
    marginTop: 10,
    fontSize: 14,
    fontFamily: "Kanit-Regular",
    color: "#777777",
    textAlign: "center",
  },
});

export default HealthDashboard;
