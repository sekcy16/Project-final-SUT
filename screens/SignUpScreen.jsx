import {
  View,
  Text,
  Dimensions,
  Image,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import React, { useState } from "react";
import { BGimage, Logo } from "../assets";
import { UserTextinput } from "../components";
import { useNavigation } from "@react-navigation/native";
import { avatars } from "../utils/supports";
import { MaterialIcons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { firebaseAuth, firebaseDB } from "../config/firebase.config";
import { doc, setDoc, collection, getDocs } from "firebase/firestore";
import { signOut } from "firebase/auth"; // Import the signOut function

const SignUpScreen = () => {
  const screenWidth = Math.round(Dimensions.get("window").width);
  const screenHeight = Math.round(Dimensions.get("window").height);

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [avatar, setAvatar] = useState(avatars[0]?.image.asset.url);
  const [isAvatarMenu, setIsAvatarMenu] = useState(false);
  const [getEmailValidationStatus, setGetEmailValidationStatus] = useState(false);

  const navigation = useNavigation();

  const handleAvatar = (item) => {
    setAvatar(item?.image.asset.url);
    setIsAvatarMenu(false);
  };
  

  // Enhanced Email Validation
  const validateEmail = (email) => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    const validDomains = ["com", "net", "org", "edu", "gov"]; // Add more valid domains if needed
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
  
        // Query Firestore to get the total count of users
        const usersCollectionRef = collection(firebaseDB, "users"); // Get a reference to the "users" collection
        const usersSnapshot = await getDocs(usersCollectionRef); // Fetch all documents in the "users" collection
        const userCount = usersSnapshot.size; // Get the number of users
  
        const uidnum = userCount + 1; // Increment by 1 for the new user
  
        const currentTime = new Date().toISOString(); // Get current timestamp
  
        const data = {
          _id: userCred?.user.uid, // UID should be stored properly
          fullName: name,
          profilePic: avatar,
          providerData: {
            ...userCred.user.providerData[0],
            email: userCred.user.email, // Ensure email is correct
            uid: userCred.user.uid, // Correct UID
            uidnum: uidnum, // Add uidnum here
          },
          role: "User",
          lastActive: currentTime, // Store the current timestamp
        };
  
        await setDoc(doc(firebaseDB, "users", userCred?.user.uid), data);
        console.log("Document successfully written!");
  
        // Sign out the user immediately after successful signup
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
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 items-center justify-start">
          <Image
            source={BGimage}
            resizeMode="cover"
            className="h-96"
            style={{ width: screenWidth }}
          />

          {isAvatarMenu && (
            <View
              className="absolute inset-0 z-10 w-full"
              style={{ width: screenWidth, height: screenHeight }}
            >
              <ScrollView>
                <BlurView
                  className="w-full h-full px-4 py-16 flex-row flex-wrap items-center justify-evenly"
                  tint="light"
                  intensity={80}
                  style={{ width: screenWidth, height: screenHeight }}
                >
                  {avatars?.map((item) => (
                    <TouchableOpacity
                      onPress={() => handleAvatar(item)}
                      key={item._id}
                      className="w-20 m-3 h-20 p-1 rounded-full border-2 border-Primary"
                    >
                      <Image
                        source={{ uri: item?.image.asset.url }}
                        className="w-full h-full"
                        resizeMode="contain"
                      />
                    </TouchableOpacity>
                  ))}
                </BlurView>
              </ScrollView>
            </View>
          )}

          <View
            className="w-full h-full bg-white rounded-tl-[90px] -mt-44 flex items-center justify-start py-6 px-6 space-y-6"
          >
            <Image source={Logo} className="w-16 h-16" resizeMode="contain" />

            <Text className="py-2 text-primaryText text-xl font-semibold">
              Register your account
            </Text>

            <View className="w-full flex items-center justify-center relative -m-4">
              <TouchableOpacity
                onPress={() => setIsAvatarMenu(true)}
                className="w-20 h-20 p-1 rounded-full border-2 border-Primary relative"
              >
                <Image
                  source={{ uri: avatar }}
                  className="w-full h-full"
                  resizeMode="contain"
                />
                <View
                  className="w-6 h-6 bg-Primary rounded-full absolute top-0 right-0 flex items-center justify-center"
                >
                  <MaterialIcons name="edit" size={18} color={"#fff"} />
                </View>
              </TouchableOpacity>
            </View>

            <View className="w-full flex items-center justify-center">
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
              <TouchableOpacity
                onPress={handleSignUp}
                className="w-full px-4 py-2 rounded-xl bg-Primary my-3 flex items-center justify-center"
              >
                <Text className="py-2 text-white text-xl font-semibold">
                  Sign Up
                </Text>
              </TouchableOpacity>
              <View className="w-full py-12 flex-row items-center justify-center space-x-2">
                <Text className="text-base text-primaryText">Have an account?</Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate("LoginScreen")}
                >
                  <Text className="text-base font-semibold text-primaryBold">
                    Login Here!
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default SignUpScreen;
