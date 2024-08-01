import { View, Text, Image, ActivityIndicator } from "react-native";
import React, { useEffect, useLayoutEffect } from "react";
import { Logo } from "../assets";
import { firebaseAuth, firebaseDB } from "../config/firebase.config";
import { SET_USER } from "../context/actions/userActions";
import { doc, getDoc } from "firebase/firestore";
import { useNavigation } from "@react-navigation/native";
import { useDispatch } from "react-redux";

const SplashScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();

  useLayoutEffect(() => {
    CheckLoggedUser();
  }, []);

  const CheckLoggedUser = async () => {
    firebaseAuth.onAuthStateChanged(async (user) => {
      if (user && user.uid) {
        try {
          const docSnap = await getDoc(doc(firebaseDB, "users", user.uid));
          if (docSnap.exists()) {
            console.log("User Data :", docSnap.data());
            dispatch(SET_USER(docSnap.data()));
          }
          setTimeout(() => {
            /// อันเก่าที่ Error navigation.replace("HealthDashboard");
            navigation.replace("Main", { screen: "HealthDashboard" });
          }, 2000);
        } catch (error) {
          console.error("Error fetching user data: ", error);
        }
      } else {
        navigation.replace("LoginScreen");
      }
    });
  };

  return (
    <View className="flex-1 items-center space-y-24 justify-center">
      <Image source={Logo} className="w-24 h-24" resizeMode="contain" />
      <ActivityIndicator size="large" color="#43C651" />
    </View>
  );
};

export default SplashScreen;
