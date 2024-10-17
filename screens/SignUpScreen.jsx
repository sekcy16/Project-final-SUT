import {
  View,
  Text,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  StyleSheet,
} from "react-native";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { UserTextinput } from "../components";
import { useNavigation } from "@react-navigation/native";
import { avatars } from "../utils/supports";
import RNPickerSelect from "react-native-picker-select";
import PagerView from "react-native-pager-view";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { firebaseAuth, firebaseDB } from "../config/firebase.config";
import { doc, setDoc, collection, addDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useFocusEffect } from "@react-navigation/native";
import { BackHandler } from "react-native";
import { Ionicons } from "@expo/vector-icons"; // ต้องติดตั้ง expo-vector-icons ก่อน

const SignUpScreen = () => {
  const screenWidth = Math.round(Dimensions.get("window").width);

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [avatar, setAvatar] = useState(avatars[0]?.image.asset.url);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [relativePhoneNumbers, setRelativePhoneNumbers] = useState([""]);
  const [getEmailValidationStatus, setGetEmailValidationStatus] =
    useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const pagerRef = React.useRef(null);

  // Additional fields
  const [diabetesType, setDiabetesType] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [age, setAge] = useState("");
  const [activityLevel, setActivityLevel] = useState("");
  const [goal, setGoal] = useState("");
  const [gender, setGender] = useState("");
  const [bmi, setBmi] = useState(null);
  const [bmiStatus, setBmiStatus] = useState("");
  const [relatives, setRelatives] = useState([{ name: "", phoneNumber: "" }]);

  const navigation = useNavigation();

  const handleAvatar = (item) => {
    setAvatar(item?.image.asset.url);
  };

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        if (currentPage === 0) {
          navigation.goBack();
          return true;
        } else if (pagerRef.current) {
          pagerRef.current.setPage(currentPage - 1);
          return true;
        }
      };

      BackHandler.addEventListener("hardwareBackPress", onBackPress);

      return () =>
        BackHandler.removeEventListener("hardwareBackPress", onBackPress);
    }, [currentPage, navigation])
  );

  // ปรับปรุงฟังก์ชัน validateEmail
  const validateEmail = (email) => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
  };
  // ปรับปรุงฟังก์ชัน validatePhoneNumber
  const validatePhoneNumber = (phone) => {
    const phonePattern = /^[0-9]{10}$/;
    return phonePattern.test(phone);
  };

  const calculateTDEE = (
    weight,
    height,
    age,
    activityLevel,
    gender,
    diabetesType
  ) => {
    // Harris-Benedict equation to calculate BMR
    let BMR;
    if (gender === "Male") {
      BMR = 88.362 + 13.397 * weight + 4.799 * height - 5.677 * age;
    } else if (gender === "Female") {
      BMR = 447.593 + 9.247 * weight + 3.098 * height - 4.33 * age;
    } else {
      // For "Other" gender, use an average of male and female equations
      BMR =
        (88.362 + 447.593) / 2 +
        11.322 * weight +
        3.9485 * height -
        5.0035 * age;
    }
  
    // Multiply BMR by activity level to get TDEE
    let activityMultiplier;
    switch (activityLevel) {
      case "Sedentary":
        activityMultiplier = 1.2;
        break;
      case "Lightly Active":
        activityMultiplier = 1.375;
        break;
      case "Moderately Active":
        activityMultiplier = 1.55;
        break;
      case "Very Active":
        activityMultiplier = 1.725;
        break;
      default:
        activityMultiplier = 1.2;
    }
  
    let TDEE = BMR * activityMultiplier;
  
    // Adjust TDEE based on diabetes type
    switch (diabetesType) {
      case "Type 2":
        TDEE *= 0.9; // Decrease by 10% to promote weight management and blood sugar control
        break;
      case "Pre-diabetes":
        TDEE *= 0.95; // Decrease by 5% to help prevent progression to Type 2 diabetes
        break;
      case "No diabetes":
        // No adjustment needed
        break;
      default:
        // No adjustment if type is unknown
    }
  
    return Math.round(TDEE);
  };
  
  const calculateMacros = (TDEE, diabetesType, goal) => {
    let carbPercentage, proteinPercentage, fatPercentage;
  
    switch (diabetesType) {
      case "Type 2":
        carbPercentage = 0.4;
        proteinPercentage = 0.3;
        fatPercentage = 0.3;
        break;
      case "Pre-diabetes":
        carbPercentage = 0.45;
        proteinPercentage = 0.25;
        fatPercentage = 0.3;
        break;
      case "No diabetes":
        carbPercentage = 0.5;
        proteinPercentage = 0.2;
        fatPercentage = 0.3;
        break;
      default:
        carbPercentage = 0.45;
        proteinPercentage = 0.25;
        fatPercentage = 0.3;
    }
  
    // Adjust macros based on goal
    if (goal === "Lose Weight") {
      carbPercentage -= 0.05;
      proteinPercentage += 0.05;
    } else if (goal === "Gain Weight") {
      carbPercentage += 0.05;
      proteinPercentage += 0.05;
      fatPercentage -= 0.1;
    }
  
    const carbs = Math.round((TDEE * carbPercentage) / 4);
    const protein = Math.round((TDEE * proteinPercentage) / 4);
    const fat = Math.round((TDEE * fatPercentage) / 9);
  
    return { carbs, protein, fat };
  };
  

  const handleSignUp = async () => {
    // ตรวจสอบข้อมูลที่จำเป็นและความถูกต้องของอีเมลและเบอร์โทร
    if (
      !name ||
      !email ||
      !password ||
      !phoneNumber ||
      !diabetesType ||
      !weight ||
      !height ||
      !age ||
      !activityLevel ||
      !goal ||
      !gender
    ) {
      Alert.alert("ข้อผิดพลาด", "กรุณากรอกข้อมูลให้ครบทุกช่อง");
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert("ข้อผิดพลาด", "กรุณากรอกอีเมลให้ถูกต้อง");
      return;
    }

    if (!validatePhoneNumber(phoneNumber)) {
      Alert.alert("ข้อผิดพลาด", "กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง (10 หลัก)");
      return;
    }

    try {
      const userCred = await createUserWithEmailAndPassword(
        firebaseAuth,
        email,
        password
      );

      const calculatedBMI = calculateBMI(
        parseFloat(weight),
        parseFloat(height)
      );
      const calculatedTDEE = calculateTDEE(
        parseFloat(weight),
        parseFloat(height),
        parseInt(age),
        activityLevel,
        gender,
        diabetesType
      );
      const calculatedMacros = calculateMacros(
        calculatedTDEE,
        diabetesType,
        goal
      );

      // กรองเฉพาะญาติที่มีข้อมูลครบถ้วน
      const validRelatives = relatives.filter(
        (relative) => relative.name && relative.phoneNumber
      );

      const userData = {
        _id: userCred?.user.uid,
        fullName: name,
        profilePic: avatar,
        email: userCred.user.email,
        phoneNumber: phoneNumber,
        role: "User",
        diabetesType,
        weight: parseFloat(weight),
        height: parseFloat(height),
        age: parseInt(age),
        activityLevel,
        goal,
        gender,
        bmi: calculatedBMI.bmiValue,
        bmiStatus: calculatedBMI.bmiStatus,
        tdee: calculatedTDEE,
        macronutrients: calculatedMacros,
        lastActive: new Date().toISOString(),
        relatives: validRelatives, // เพิ่มข้อมูลญาติเข้าไปใน user document
      };

      await setDoc(doc(firebaseDB, "users", userCred?.user.uid), userData);

      await signOut(firebaseAuth);

      Alert.alert("สำเร็จ", "สร้างบัญชีเรียบร้อยแล้ว!", [
        { text: "ตกลง", onPress: () => navigation.navigate("HealthDashboard") },
      ]);
    } catch (error) {
      console.error("Error signing up:", error);
      if (error.code === "auth/email-already-in-use") {
        Alert.alert(
          "อีเมลนี้ถูกใช้งานแล้ว",
          "กรุณาใช้อีเมลอื่นหรือเข้าสู่ระบบ"
        );
      } else {
        Alert.alert("ข้อผิดพลาด", error.message);
      }
    }
  };

  // Updated calculateBMI function to return values
  const calculateBMI = (weight, height) => {
    if (weight && height) {
      const bmiValue = (weight / Math.pow(height / 100, 2)).toFixed(1); // Calculate BMI
      setBmi(bmiValue);

      let status = "";
      if (bmiValue < 18.5) {
        status = "Underweight";
      } else if (bmiValue >= 18.5 && bmiValue < 24.9) {
        status = "Normal weight";
      } else if (bmiValue >= 25 && bmiValue < 29.9) {
        status = "Overweight";
      } else {
        status = "Obesity";
      }
      setBmiStatus(status);

      return { bmiValue, bmiStatus: status };
    }
    return { bmiValue: null, bmiStatus: "" };
  };
  const handleCalculateBMI = () => {
    calculateBMI(parseFloat(weight), parseFloat(height));
  };

  const calculateBmiFill = (bmi) => {
    const fillPercentage = Math.min(Math.max((bmi / 40) * 100, 0), 100); // Cap at 40 for max BMI
    return `${fillPercentage}%`;
  };

  const determineBmiColor = (bmi) => {
    if (bmi < 18.5) return "#FFD700"; // Yellow for underweight
    if (bmi < 24.9) return "#4CAF50"; // Green for normal weight
    if (bmi < 29.9) return "#FF8C00"; // Orange for overweight
    return "#FF0000"; // Red for obesity
  };

  const addRelativePhoneNumber = () => {
    setRelativePhoneNumbers([...relativePhoneNumbers, ""]);
  };

  const updateRelativePhoneNumber = (index, value) => {
    const updatedNumbers = [...relativePhoneNumbers];
    updatedNumbers[index] = value;
    setRelativePhoneNumbers(updatedNumbers);
  };

  const addRelative = () => {
    setRelatives([...relatives, { name: "", phoneNumber: "" }]);
  };

  const updateRelative = (index, field, value) => {
    const updatedRelatives = [...relatives];
    updatedRelatives[index][field] = value;
    setRelatives(updatedRelatives);
  };

  const removeRelative = (index) => {
    const updatedRelatives = [...relatives];
    updatedRelatives.splice(index, 1);
    setRelatives(updatedRelatives);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        <PagerView
          ref={pagerRef}
          style={styles.pagerView}
          initialPage={0}
          scrollEnabled={false}
          onPageSelected={(e) => setCurrentPage(e.nativeEvent.position)}
        >
          {/* หน้า 1: ข้อมูลพื้นฐานและเบอร์โทรผู้สมัคร */}
          <ScrollView key="1" contentContainerStyle={styles.scrollViewContent}>
            <View style={styles.avatarSection}>
              <Text style={styles.sectionTitle}>เลือกรูปประจำตัว</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.avatarScrollContainer}
              >
                {avatars.map((avatarItem, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => handleAvatar(avatarItem)}
                  >
                    <Image
                      source={{ uri: avatarItem?.image.asset.url }}
                      style={[
                        styles.avatarImage,
                        {
                          borderWidth:
                            avatar === avatarItem?.image.asset.url ? 2 : 0,
                          borderColor: "blue",
                        },
                      ]}
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <View style={styles.fieldsContainer}>
              <UserTextinput
                placeholder="ชื่อ-นามสกุล"
                isPass={false}
                setStatValue={setName}
              />
              <UserTextinput
                placeholder="อีเมล"
                isPass={false}
                setStatValue={setEmail}
                setGetEmailValidationStatus={setGetEmailValidationStatus}
              />
              <UserTextinput
                placeholder="รหัสผ่าน"
                isPass={true}
                setStatValue={setPassword}
              />
              <UserTextinput
                placeholder="เบอร์โทรศัพท์"
                isPass={false}
                setStatValue={setPhoneNumber}
                keyboardType="phone-pad"
              />
            </View>
          </ScrollView>

          {/* หน้า 2: ข้อมูลเพิ่มเติมและ BMI */}
          <ScrollView key="2" contentContainerStyle={styles.scrollViewContent}>
            <View style={styles.fieldsContainer}>
              <Text style={styles.sectionTitle}>ข้อมูลเพิ่มเติม</Text>
              <RNPickerSelect
                onValueChange={(value) => setGender(value)}
                items={[
                  { label: "ชาย", value: "ชาย" },
                  { label: "หญิง", value: "หญิง" },
                  { label: "อื่นๆ", value: "อื่นๆ" },
                ]}
                placeholder={{ label: "เลือกเพศ", value: null }}
              />
              <RNPickerSelect
                onValueChange={(value) => setDiabetesType(value)}
                items={[
                  { label: "ประเภท 2", value: "Type 2" },
                  { label: "ก่อนเบาหวาน", value: "Pre-diabetes" },
                  { label: "ไม่เป็นเบาหวาน", value: "No diabetes" },
                ]}
                placeholder={{ label: "เลือกประเภทเบาหวาน", value: null }}
              />
              <UserTextinput
                placeholder="อายุ"
                isPass={false}
                setStatValue={setAge}
                keyboardType="numeric"
              />
              <UserTextinput
                placeholder="น้ำหนัก (กก.)"
                isPass={false}
                setStatValue={setWeight}
                keyboardType="numeric"
              />
              <UserTextinput
                placeholder="ส่วนสูง (ซม.)"
                isPass={false}
                setStatValue={setHeight}
                keyboardType="numeric"
              />
              <RNPickerSelect
                onValueChange={(value) => setActivityLevel(value)}
                items={[
                  { label: "ไม่ค่อยออกกำลังกาย", value: "ไม่ค่อยออกกำลังกาย" },
                  {
                    label: "ออกกำลังกายเล็กน้อย",
                    value: "ออกกำลังกายเล็กน้อย",
                  },
                  { label: "ออกกำลังกายปานกลาง", value: "ออกกำลังกายปานกลาง" },
                  { label: "ออกกำลังกายหนัก", value: "ออกกำลังกายหนัก" },
                ]}
                placeholder={{ label: "เลือกระดับการออกกำลังกาย", value: null }}
              />
              <RNPickerSelect
                onValueChange={(value) => setGoal(value)}
                items={[
                  { label: "ลดน้ำหนัก", value: "ลดน้ำหนัก" },
                  { label: "รักษาน้ำหนัก", value: "รักษาน้ำหนัก" },
                  { label: "เพิ่มน้ำหนัก", value: "เพิ่มน้ำหนัก" },
                ]}
                placeholder={{ label: "เลือกเป้าหมาย", value: null }}
              />
            </View>
            <TouchableOpacity
              style={styles.calculateButton}
              onPress={handleCalculateBMI}
            >
              <Text style={styles.calculateButtonText}>คำนวณ BMI</Text>
            </TouchableOpacity>
            {bmi && (
              <View style={styles.bmiResult}>
                <Text style={styles.bmiText}>
                  BMI ของคุณคือ: {bmi} ({bmiStatus})
                </Text>
                <View style={styles.bmiHealthBar}>
                  <View
                    style={[
                      styles.bmiFill,
                      {
                        width: calculateBmiFill(bmi),
                        backgroundColor: determineBmiColor(bmi),
                      },
                    ]}
                  />
                </View>
              </View>
            )}
          </ScrollView>

          {/* หน้า 3: เบอร์โทรญาติ */}
          <ScrollView key="3" contentContainerStyle={styles.scrollViewContent}>
            <View style={styles.fieldsContainer}>
              <Text style={styles.sectionTitle}>ข้อมูลญาติ</Text>
              {relatives.map((relative, index) => (
                <View key={index} style={styles.relativeCard}>
                  <UserTextinput
                    placeholder="ชื่อญาติ"
                    isPass={false}
                    value={relative.name}
                    setStatValue={(value) =>
                      updateRelative(index, "name", value)
                    }
                  />
                  <UserTextinput
                    placeholder="เบอร์โทรญาติ"
                    isPass={false}
                    value={relative.phoneNumber}
                    setStatValue={(value) =>
                      updateRelative(index, "phoneNumber", value)
                    }
                    keyboardType="phone-pad"
                  />
                  {relatives.length > 1 && (
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => removeRelative(index)}
                    >
                      <Ionicons name="close-circle" size={24} color="red" />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
              <TouchableOpacity style={styles.addButton} onPress={addRelative}>
                <Text style={styles.addButtonText}>+ เพิ่มญาติ</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </PagerView>

        {currentPage < 2 && (
          <View style={styles.nextButtonContainer}>
            <TouchableOpacity
              style={styles.nextButton}
              onPress={() => {
                if (pagerRef.current) {
                  pagerRef.current.setPage(currentPage + 1);
                }
              }}
            >
              <Text style={styles.nextButtonText}>ถัดไป</Text>
            </TouchableOpacity>
          </View>
        )}

        {currentPage === 2 && (
          <View style={styles.submitButtonContainer}>
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSignUp}
            >
              <Text style={styles.submitButtonText}>สมัครสมาชิก</Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  pagerView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingVertical: 20,
    paddingHorizontal: 15,
  },
  avatarSection: {
    alignItems: "center",
    marginBottom: 20,
  },
  avatarScrollContainer: {
    flexDirection: "row",
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginHorizontal: 5,
  },
  fieldsContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    fontFamily: "Kanit-Bold",
  },
  calculateButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  calculateButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    fontFamily: "Kanit-Bold",
  },
  bmiResult: {
    marginTop: 20,
    alignItems: "center",
  },
  bmiText: {
    fontSize: 16,
    marginBottom: 10,
    fontFamily: "Kanit-Regular",
  },
  bmiHealthBar: {
    width: "100%",
    height: 20,
    backgroundColor: "#e0e0e0",
    borderRadius: 10,
    overflow: "hidden",
    marginTop: 10,
  },
  bmiFill: {
    height: "100%",
    borderRadius: 10,
  },
  nextButtonContainer: {
    paddingHorizontal: 15,
    paddingBottom: 15,
  },
  nextButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  nextButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: "Kanit-Bold",
  },
  submitButtonContainer: {
    paddingHorizontal: 15,
    paddingBottom: 15,
  },
  submitButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: "Kanit-Bold",
  },
  addButton: {
    backgroundColor: "#2196F3",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    fontFamily: "Kanit-Bold",
  },
  relativeCard: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  removeButton: {
    position: "absolute",
    top: 5,
    right: 5,
  },
  addButton: {
    backgroundColor: "#2196F3",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    fontFamily: "Kanit-Bold",
  },
});

export default SignUpScreen;
