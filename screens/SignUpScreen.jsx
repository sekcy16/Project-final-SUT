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
import { doc, setDoc, collection, getDocs } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage"; 
import { useFocusEffect } from "@react-navigation/native";
import { BackHandler } from "react-native";

const SignUpScreen = () => {
  const screenWidth = Math.round(Dimensions.get("window").width);

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [avatar, setAvatar] = useState(avatars[0]?.image.asset.url);
  const [isAvatarMenu, setIsAvatarMenu] = useState(false);
  const [getEmailValidationStatus, setGetEmailValidationStatus] = useState(false);
  const pagerRef = React.useRef(null);


  // Additional fields
  const [diabetesType, setDiabetesType] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [age, setAge] = useState("");
  const [activityLevel, setActivityLevel] = useState("");
  const [goal, setGoal] = useState("");
  const [gender, setGender] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [bmi, setBmi] = useState(null);
  const [bmiStatus, setBmiStatus] = useState("");

  const navigation = useNavigation();

  const handleAvatar = (item) => {
    setAvatar(item?.image.asset.url);
    setIsAvatarMenu(false);
  };

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        if (currentPage === 0) {
          // If on the first page, exit the screen
          navigation.goBack();
          return true;
        } else if (pagerRef.current) {
          // If not on the first page, go back to the previous page
          pagerRef.current.setPage(currentPage - 1);
          return true;
        }
      };

      BackHandler.addEventListener("hardwareBackPress", onBackPress);

      return () => {
        BackHandler.removeEventListener("hardwareBackPress", onBackPress);
      };
    }, [currentPage, navigation])
  );

  const validateEmail = (email) => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    const validDomains = ["com", "net", "org", "edu", "gov"];
    const domain = email.split(".").pop();

    return emailPattern.test(email) && validDomains.includes(domain);
  };

  const handleSignUp = async () => {
    if (validateEmail(email) && email !== "" && getEmailValidationStatus) {
      try {
        const userCred = await createUserWithEmailAndPassword(
          firebaseAuth,
          email,
          password
        );
        console.log("User Credential:", userCred);
  
        // Query Firestore to get the total count of users
        const usersCollectionRef = collection(firebaseDB, "users"); // Get a reference to the "users" collection
        const usersSnapshot = await getDocs(usersCollectionRef); // Fetch all documents in the "users" collection
        const userCount = usersSnapshot.size; // Get the number of users
  
        const uidnum = userCount + 1; // Increment by 1 for the new user
        const currentTime = new Date().toISOString(); // Get current timestamp
  
        // Calculate BMI
        const calculatedBMI = calculateBMI(parseFloat(weight), parseFloat(height));
  
        const data = {
          _id: userCred?.user.uid,
          fullName: name,
          profilePic: avatar,
          providerData: {
            ...userCred.user.providerData[0],
            email: userCred.user.email,
            uid: userCred.user.uid,
            uidnum: uidnum, // Add uidnum here
          },
          role: "User",
          diabetesType,
          weight: parseFloat(weight),
          height: parseFloat(height),
          age: parseInt(age),
          activityLevel,
          goal,
          gender,
          bmi: calculatedBMI.bmiValue, // Save calculated BMI value
          bmiStatus: calculatedBMI.bmiStatus, // Save calculated BMI status
          lastActive: currentTime, // Store the current timestamp
        };
  
        // Save data to Firestore
        await setDoc(doc(firebaseDB, "users", userCred?.user.uid), data);
        console.log("Document successfully written!");
  
        // Sign out the user immediately after successful signup
        await signOut(firebaseAuth);
  
        // Navigate to the login screen
        Alert.alert("Success", "Account created successfully!", [
          {
            text: "OK",
            onPress: () => navigation.navigate("LoginScreen"),
          },
        ]);
      } catch (error) {
        console.error("Error signing up:", error);
  
        if (error.code === "auth/email-already-in-use") {
          Alert.alert(
            "Email Already in Use",
            "This email address is already associated with an account. Please log in or use a different email."
          );
        } else {
          Alert.alert("Error", error.message);
        }
      }
    } else {
      Alert.alert(
        "Error",
        "Please enter a valid email and complete all fields."
      );
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
          {/* Page 1: Avatar and Basic Info */}
          <ScrollView key="1" contentContainerStyle={styles.scrollViewContent}>
            <View style={styles.avatarSection}>
              <Text style={styles.avatarTitle}>Select Your Avatar</Text>
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
                placeholder="Full Name"
                isPass={false}
                setStatValue={setName}
              />
              <UserTextinput
                placeholder="Email"
                isPass={false}
                setStatValue={setEmail}
                setGetEmailValidationStatus={setGetEmailValidationStatus}
              />
              <UserTextinput
                placeholder="Password"
                isPass={true}
                setStatValue={setPassword}
              />
            </View>
          </ScrollView>

          {/* Page 2: Additional Info and BMI */}
          <ScrollView key="2" contentContainerStyle={styles.scrollViewContent}>
            <View style={styles.fieldsContainer}>
              <Text style={styles.sectionTitle}>Additional Information</Text>
              <RNPickerSelect
                onValueChange={(value) => setGender(value)}
                items={[
                  { label: "Male", value: "Male" },
                  { label: "Female", value: "Female" },
                  { label: "Other", value: "Other" },
                ]}
                placeholder={{ label: "Select Gender", value: null }}
              />
              
              <RNPickerSelect
                onValueChange={(value) => setDiabetesType(value)}
                items={[
                  { label: "Type 1", value: "Type 1" },
                  { label: "Type 2", value: "Type 2" },
                  { label: "Gestational", value: "Gestational" },
                  { label: "Other", value: "Other" },
                ]}
                placeholder={{ label: "Select Diabetes Type", value: null }}
              />
              <UserTextinput
                placeholder="Age"
                isPass={false}
                setStatValue={setAge}
              />
              <UserTextinput
                placeholder="Weight (kg)"
                isPass={false}
                setStatValue={setWeight}
                keyboardType="numeric"
              />
              <UserTextinput
                placeholder="Height (cm)"
                isPass={false}
                setStatValue={setHeight}
                keyboardType="numeric"
              />
              <RNPickerSelect
                onValueChange={(value) => setActivityLevel(value)}
                items={[
                  { label: "Sedentary", value: "Sedentary" },
                  { label: "Lightly Active", value: "Lightly Active" },
                  { label: "Moderately Active", value: "Moderately Active" },
                  { label: "Very Active", value: "Very Active" },
                ]}
                placeholder={{ label: "Select Activity Level", value: null }}
              />
              <RNPickerSelect
                onValueChange={(value) => setGoal(value)}
                items={[
                  { label: "Lose Weight", value: "Lose Weight" },
                  { label: "Maintain Weight", value: "Maintain Weight" },
                  { label: "Gain Weight", value: "Gain Weight" },
                ]}
                placeholder={{ label: "Select Goal", value: null }}
              />
            </View>

            <TouchableOpacity style={styles.calculateButton} onPress={handleCalculateBMI}>
              <Text style={styles.calculateButtonText}>Calculate BMI</Text>
            </TouchableOpacity>

            {bmi && (
              <View style={styles.bmiResult}>
                <Text style={styles.bmiText}>
                  Your BMI is: {bmi} ({bmiStatus})
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
        </PagerView>

        {currentPage === 0 && (
          <View style={styles.nextButtonContainer}>
            <TouchableOpacity
              style={styles.nextButton}
              onPress={() => {
                if (pagerRef.current) {
                  pagerRef.current.setPage(1); // Move to the second page
                }
              }}
            >
              <Text style={styles.nextButtonText}>Next</Text>
            </TouchableOpacity>
          </View>
        )}


        {currentPage === 1 && (
          <View style={styles.submitButtonContainer}>
            <TouchableOpacity style={styles.submitButton} onPress={handleSignUp}>
              <Text style={styles.submitButtonText}>Sign Up</Text>
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
  avatarTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
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
  },
  bmiResult: {
    marginTop: 20,
    alignItems: "center",
  },
  bmiText: {
    fontSize: 16,
    marginBottom: 10,
  },
  bmiIndicator: {
    width: "100%",
    height: 10,
    backgroundColor: "#E0E0E0",
    borderRadius: 5,
    position: "relative",
    marginTop: 10,
  },
  bmiMarker: {
    position: "absolute",
    width: 10,
    height: 20,
    borderRadius: 5,
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
  },
  bmiHealthBar: {
    width: '100%',
    height: 20,
    backgroundColor: '#e0e0e0',
    borderRadius: 10,
    overflow: 'hidden',
    marginTop: 10,
  },
  bmiFill: {
    height: '100%',
    borderRadius: 10,
  },
});

export default SignUpScreen;