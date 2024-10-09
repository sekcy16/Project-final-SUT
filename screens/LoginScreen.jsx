import { View, Text, Dimensions, Image, TouchableOpacity, BackHandler } from "react-native";
import React, { useState, useEffect } from "react";
import { BGimage, Logo } from "../assets";
import { UserTextinput } from "../components";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import { signInWithEmailAndPassword } from "firebase/auth";
import { firebaseAuth, firebaseDB } from "../config/firebase.config";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useDispatch } from "react-redux";
import { SET_USER } from "../context/actions/userActions";

const LoginScreen = () => {
  const screenWidth = Math.round(Dimensions.get("window").width);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [getEmailValidationStatus, setGetEmailValidationStatus] = useState(false);
  const [alert, setAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState(null);

  const navigation = useNavigation();
  const dispatch = useDispatch();
  const isFocused = useIsFocused();

  useEffect(() => {
    const backAction = () => {
      if (isFocused) {
        BackHandler.exitApp();
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, [isFocused]);

  const handleLogin = async () => {
    if (getEmailValidationStatus && email !== "") {
      try {
        const userCred = await signInWithEmailAndPassword(firebaseAuth, email, password);
        if (userCred) {
          const userDocRef = doc(firebaseDB, "users", userCred.user.uid);
          const docSnap = await getDoc(userDocRef);
          
          if (docSnap.exists()) {
            const userData = docSnap.data();
            
            // Update Last Active Timestamp
            await updateDoc(userDocRef, {
              lastActive: new Date().toISOString(),
            });
            
            dispatch(SET_USER(userData));
            
            if (userData.role === "Doctor") {
              navigation.navigate('Main', { screen: 'DoctorHomePage' });
            } else {
              navigation.navigate('Main', { screen: 'HealthDashboard' });
            }
          }
        }
      } catch (err) {
        console.error("Login error:", err);
        handleFirebaseError(err.code);
      }
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
        showAlert("Authentication Failed. Please check your credentials.");
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

      {/* Main View */}
      <View
        className="w-full h-full bg-white rounded-tl-[90px] -mt-44 flex items-center 
            justify-start py-6 px-6 space-y-6"
      >
        <Image source={Logo} className="w-16 h-16" resizeMode="contain" />

        <Text className="py-2 text-primaryText text-xl font-semibold">
          Welcome
        </Text>

        <View className="w-full flex items-center justify-center">
          {/* Alert */}
          {alert && (
            <Text className="text-base text-red-600">{alertMessage}</Text>
          )}

          {/* Email */}
          <UserTextinput
            placeholder="Email"
            isPass={false}
            setStatValue={setEmail}
            setGetEmailValidationStatus={setGetEmailValidationStatus}
          />

          {/* Password */}
          <UserTextinput
            placeholder="Password"
            isPass={true}
            setStatValue={setPassword}
          />

          {/* Login Button */}
          <TouchableOpacity
            onPress={handleLogin}
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