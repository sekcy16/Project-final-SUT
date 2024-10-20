import { View, Text, Dimensions, Image, TouchableOpacity, BackHandler, ActivityIndicator } from "react-native";
import React, { useState, useEffect } from "react";
import { BGimage, Logo } from "../assets";
import { UserTextinput } from "../components";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import { signInWithEmailAndPassword } from "firebase/auth";
import { firebaseAuth, firebaseDB } from "../config/firebase.config";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useDispatch } from "react-redux";
import { SET_USER } from "../context/actions/userActions";
import { LinearGradient } from 'expo-linear-gradient';

const LoginScreen = () => {
  const screenWidth = Math.round(Dimensions.get("window").width);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [getEmailValidationStatus, setGetEmailValidationStatus] = useState(false);
  const [alert, setAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

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
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailRegex.test(email) && email !== "" && password !== "") {
      setIsLoading(true);
      try {
        const userCred = await signInWithEmailAndPassword(firebaseAuth, email, password);
        if (userCred) {
          const userDocRef = doc(firebaseDB, "users", userCred.user.uid);
          const docSnap = await getDoc(userDocRef);
          
          if (docSnap.exists()) {
            const userData = docSnap.data();
            
            // อัปเดตเวลาเข้าใช้งานล่าสุด
            await updateDoc(userDocRef, {
              lastActive: new Date().toISOString(),
            });
            
            dispatch(SET_USER(userData));
            
            if (userData.role === "Doctor") {
              navigation.navigate('Main', { screen: 'DoctorHomePage' });
            } else {
              navigation.navigate('Main', { screen: 'HealthDashboard' });
            }
          } else {
            console.log("ไม่พบข้อมูลผู้ใช้");
            showAlert("ไม่พบข้อมูลผู้ใช้ โปรดติดต่อผู้ดูแลระบบ");
          }
        }
      } catch (err) {
        console.error("ข้อผิดพลาดในการเข้าสู่ระบบ:", err);
        handleFirebaseError(err.code);
      } finally {
        setIsLoading(false);
      }
    } else {
      if (!emailRegex.test(email) || email === "") {
        console.log("อีเมลไม่ถูกต้องหรือว่างเปล่า");
        showAlert("กรุณากรอกอีเมลให้ถูกต้อง");
      } else if (password === "") {
        console.log("รหัสผ่านว่างเปล่า");
        showAlert("กรุณากรอกรหัสผ่าน");
      } else {
        console.log("ข้อมูลไม่ถูกต้อง");
        showAlert("กรุณาตรวจสอบอีเมลและรหัสผ่านของคุณ");
      }
    }
  };

  const handleFirebaseError = (errorCode) => {
    switch (errorCode) {
      case "auth/wrong-password":
        showAlert("รหัสผ่านไม่ถูกต้อง");
        break;
      case "auth/user-not-found":
        showAlert("ไม่พบผู้ใช้");
        break;
      case "auth/invalid-email":
        showAlert("อีเมลไม่ถูกต้อง");
        break;
      default:
        showAlert("การยืนยันตัวตนล้มเหลว โปรดตรวจสอบข้อมูลของคุณ");
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
        <Image source={Logo} className="w-32 h-32" resizeMode="contain" />

        <View className="w-full flex items-center justify-center">
          {/* Alert */}
          {alert && (
            <Text className="text-base text-red-600">{alertMessage}</Text>
          )}

          {/* Email */}
          <UserTextinput
            placeholder="อีเมล"
            isPass={false}
            setStatValue={setEmail}
            setGetEmailValidationStatus={setGetEmailValidationStatus}
          />

          {/* Password */}
          <UserTextinput
            placeholder="รหัสผ่าน"
            isPass={true}
            setStatValue={setPassword}
          />

          {/* Login Button */}
          <TouchableOpacity
            onPress={handleLogin}
            disabled={isLoading}
            className="w-full rounded-xl overflow-hidden my-3"
          >
            <LinearGradient
              colors={['#FF69B4', '#8A2BE2']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="px-4 py-2 flex items-center justify-center"
            >
              {isLoading ? (
                <ActivityIndicator size="large" color="#FFFFFF" />
              ) : (
                <Text className="py-2 text-white text-xl font-semibold">
                  เข้าสู่ระบบ
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
          <View className="w-full py-12 flex-row items-center justify-center space-x-2">
            <Text className="text-base text-primaryText">
              ยังไม่มีบัญชี?
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate("SignUpScreen")}
            >
              <Text className="text-base font-semibold text-primaryBold">
                สร้างบัญชีที่นี่
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

export default LoginScreen;