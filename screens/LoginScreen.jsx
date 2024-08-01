import { View, Text, Dimensions, Image, TouchableOpacity } from "react-native";
import React, { useState } from "react";
import { BGimage, Logo } from "../assets";
import { UserTextinput } from "../components";
import { useNavigation } from "@react-navigation/native";
import { signInWithEmailAndPassword } from "firebase/auth";
import { firebaseAuth, firebaseDB } from "../config/firebase.config";
import { doc, getDoc } from "firebase/firestore";
import { useDispatch } from "react-redux";
import { SET_USER } from "../context/actions/userActions";

const LoginScreen = () => {
  const screenWidth = Math.round(Dimensions.get("window").width);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [getEmailValidationStatus, setGetEmailValidationStatus] =
    useState(false);

  const [alert, setAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState(null);

  const navigation = useNavigation();
  const dispatch = useDispatch()

  const hanldeLogin = async () => {
    if (getEmailValidationStatus && email !== "") {
      console.log("Attempting login...");
      await signInWithEmailAndPassword(firebaseAuth, email, password)
        .then((useCred) => {
          if (useCred) {
            console.log("User Id :", useCred?.user.uid);
            getDoc(doc(firebaseDB, "users", useCred?.user.uid)).then(
              (docSnap) => {
                if (docSnap.exists()) {
                  console.log("User Data :", docSnap.data());
                  dispatch(SET_USER(docSnap.data()));
                  console.log("Navigating to Main / HealthDashboard");
                  navigation.navigate('Main', { screen: 'HealthDashboard' });
                }
              }
            );
          }
        })
        .catch((err) => {
          console.log("Error :", err.message);
          handleFirebaseError(err.code);
        });
    } else {
      console.log("Email validation failed or email is empty");
      showAlert("Invalid Email Address");
    }
  };
  

  const handleFirebaseError = (errorCode) => {
    switch (errorCode) {
      case "auth/wrong-password":
        showAlert("Password Mismatch");
        break;
      case "auth/user-not-found":
        showAlert("User Not Found");
        break;
      case "auth/invalid-email":
        showAlert("Invalid Email Address");
        break;
      default:
        showAlert("Authentication Failed. Check if your E-Mail or password is correct.");
        break;
    }
  };

  const showAlert = (message) => {
    setAlert(true);
    setAlertMessage(message);
    setTimeout(() => {
      setAlert(false);
      setAlertMessage(null);
    }, 2000);
  };

  return (
    <View className="flex-1 items-center justify-start">
      <Image
        source={BGimage}
        resizeMode="cover"
        className="h-96"
        style={{ width: screenWidth }}
      />

      {/*Main View*/}

      <View
        className="w-full h-full bg-white rounded-tl-[90px] -mt-44 flex items-center 
            justify-start py-6 px-6 space-y-6"
      >
        <Image source={Logo} className="w-16 h-16" resizeMode="contain" />

        <Text className="py-2 text-primaryText text-xl font-semibold">
          Welcome
        </Text>

        <View className="w-full flex items-center justify-center">
          {/* alert */}

          {alert && (
            <Text className="text-base text-red-600">{alertMessage}</Text>
          )}

          {/* email */}
          <UserTextinput
            placeholder="Email"
            isPass={false}
            setStatValue={setEmail}
            setGetEmailValidationStatus={setGetEmailValidationStatus}
          />
          {/* password */}
          <UserTextinput
            placeholder="Password"
            isPass={true}
            setStatValue={setPassword}
          />
          {/* login button */}
          <TouchableOpacity
            onPress={hanldeLogin}
            className="w-full px-4 py-2 rounded-xl bg-Primary my-3 flex items-center justify-center"
          >
            <Text className="py-2 text-white text-xl font-semibold">
              Sign In
            </Text>
          </TouchableOpacity>
          <View className="w-full py-12 flex-row items-center justify-center space-x-2">
            <Text className="text-base text-primaryText">
              Don't have account?
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate("SignUpScreen")}
            >
              <Text className="text-base font-semibold text-primaryBold">
                Create Here
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

export default LoginScreen;
