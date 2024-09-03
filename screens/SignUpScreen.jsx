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
  StyleSheet
} from "react-native";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { UserTextinput } from "../components";
import { useNavigation } from "@react-navigation/native";
import { avatars } from "../utils/supports";
import RNPickerSelect from "react-native-picker-select";
import PagerView from 'react-native-pager-view';
import { createUserWithEmailAndPassword } from "firebase/auth";
import { firebaseAuth, firebaseDB } from "../config/firebase.config";
import { doc, setDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";

const SignUpScreen = () => {
  const screenWidth = Math.round(Dimensions.get("window").width);

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [avatar, setAvatar] = useState(avatars[0]?.image.asset.url);
  const [isAvatarMenu, setIsAvatarMenu] = useState(false);
  const [getEmailValidationStatus, setGetEmailValidationStatus] = useState(false);

  // New state variables for additional fields
  const [diabetesType, setDiabetesType] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [age, setAge] = useState("");
  const [activityLevel, setActivityLevel] = useState("");
  const [goal, setGoal] = useState("");
  const [gender, setGender] = useState(""); // New state for gender
  const [currentPage, setCurrentPage] = useState(0);

  const navigation = useNavigation();

  const handleAvatar = (item) => {
    setAvatar(item?.image.asset.url);
    setIsAvatarMenu(false);
  };

  const validateEmail = (email) => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    const validDomains = ["com", "net", "org", "edu", "gov"];
    const domain = email.split('.').pop();

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

        const data = {
          _id: userCred?.user.uid,
          fullName: name,
          profilePic: avatar,
          providerData: {
            ...userCred.user.providerData[0],
            email: userCred.user.email,
            uid: userCred.user.uid,
          },
          role: "User",
          diabetesType,
          weight: parseFloat(weight),
          height: parseFloat(height),
          age: parseInt(age),
          activityLevel,
          goal,
          gender // Add gender to the data object
        };

        await setDoc(doc(firebaseDB, "users", userCred?.user.uid), data);
        console.log("Document successfully written!");

        await signOut(firebaseAuth);

        Alert.alert("Success", "Account created successfully!", [
          {
            text: "OK",
            onPress: () => navigation.navigate("LoginScreen"),
          },
        ]);
      } catch (error) {
        console.error("Error signing up:", error);
        Alert.alert("Error", error.message);
      }
    } else {
      Alert.alert(
        "Error",
        "Please enter a valid email and complete all fields."
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        <PagerView
          style={styles.pagerView}
          initialPage={0}
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
                  <TouchableOpacity key={index} onPress={() => handleAvatar(avatarItem)}>
                    <Image
                      source={{ uri: avatarItem?.image.asset.url }}
                      style={[
                        styles.avatarImage,
                        {
                          borderWidth: avatar === avatarItem?.image.asset.url ? 2 : 0,
                          borderColor: 'blue'
                        }
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

          {/* Page 2: Additional Info */}
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
                style={pickerSelectStyles}
              />
              <RNPickerSelect
                onValueChange={(value) => setDiabetesType(value)}
                items={[
                  { label: "Type 1", value: "Type1" },
                  { label: "Type 2", value: "Type2" },
                  { label: "Pre-diabetes", value: "Pre-diabetes" },
                ]}
                placeholder={{ label: "Select Diabetes Type", value: null }}
                style={pickerSelectStyles}
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
              <UserTextinput
                placeholder="Age"
                isPass={false}
                setStatValue={setAge}
                keyboardType="numeric"
              />
              <RNPickerSelect
                onValueChange={(value) => setActivityLevel(value)}
                items={[
                  { label: "Sedentary", value: "Sedentary" },
                  { label: "Lightly Active", value: "Lightly" },
                  { label: "Moderately Active", value: "Moderately" },
                  { label: "Active", value: "Active" },
                  { label: "Very Active", value: "Very Active" },
                ]}
                placeholder={{ label: "Select Activity Level", value: null }}
                style={pickerSelectStyles}
              />
              <RNPickerSelect
                onValueChange={(value) => setGoal(value)}
                items={[
                  { label: "Lose Weight", value: "Lose Weight" },
                  { label: "Maintain Weight", value: "Maintain Weight" },
                  { label: "Gain Weight", value: "Gain Weight" },
                  { label: "Improve Blood Sugar Control", value: "Improve Blood Sugar Control" },
                  { label: "Increase Physical Activity", value: "Increase Physical Activity" },
                  { label: "Eat Healthier", value: "Eat Healthier" },
                ]}
                placeholder={{ label: "Select Goal", value: null }}
                style={pickerSelectStyles}
              />
              <TouchableOpacity
                onPress={handleSignUp}
                style={styles.signUpButton}
              >
                <Text style={styles.signUpText}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </PagerView>

        {/* Page Indicator */}
        <View style={styles.pageIndicatorContainer}>
          <View style={[styles.dot, currentPage === 0 && styles.activeDot]} />
          <View style={[styles.dot, currentPage === 1 && styles.activeDot]} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  pagerView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarTitle: {
    fontSize: 18,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  avatarScrollContainer: {
    alignItems: 'center',
  },
  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginHorizontal: 5,
  },
  fieldsContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    marginVertical: 10,
    fontWeight: 'bold',
  },
  signUpButton: {
    width: '100%',
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#007BFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  signUpText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  pageIndicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ccc',
    marginHorizontal: 5,
  },
  activeDot: {
    backgroundColor: '#007BFF',
  },
});

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 4,
    color: 'black',
    paddingRight: 30, // to ensure the text is never behind the icon
    marginBottom: 10,
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 0.5,
    borderColor: 'gray',
    borderRadius: 8,
    color: 'black',
    paddingRight: 30, // to ensure the text is never behind the icon
    marginBottom: 10,
  },
});

export default SignUpScreen;
