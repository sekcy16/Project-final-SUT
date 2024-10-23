import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
} from "react-native";
import { firebaseDB, firebaseAuth } from "../config/firebase.config";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from 'expo-linear-gradient';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

const EditProfilePage = () => {
  const [userData, setUserData] = useState({
    fullName: "",
    email: "",
    weight: "",
    height: "",
    avatar: null,
  });
  const [bmi, setBmi] = useState("");
  const navigation = useNavigation();

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    calculateBMI();
  }, [userData.weight, userData.height]);

  const fetchUserData = async () => {
    try {
      const user = firebaseAuth.currentUser;
      if (user) {
        const userDocRef = doc(firebaseDB, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData({
            fullName: data.fullName || "",
            email: user.email || "",
            weight: data.weight?.toString() || "",
            height: data.height?.toString() || "",
            avatar: data.profilePic || null,
          });
        }
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      Alert.alert("Error", "Failed to load user data. Please try again.");
    }
  };

  const calculateBMI = () => {
    const weight = parseFloat(userData.weight);
    const height = parseFloat(userData.height) / 100; // Convert cm to meters
    if (weight > 0 && height > 0) {
      const calculatedBmi = (weight / (height * height)).toFixed(2);
      setBmi(calculatedBmi);
    } else {
      setBmi("");
    }
  };

  const handleSave = async () => {
    try {
      const user = firebaseAuth.currentUser;
      if (!user) return;

      const userDocRef = doc(firebaseDB, "users", user.uid);
      await updateDoc(userDocRef, {
        fullName: userData.fullName,
        weight: parseFloat(userData.weight) || 0,
        height: parseFloat(userData.height) || 0,
        profilePic: userData.avatar,
        bmi: parseFloat(bmi) || 0,
      });

      Alert.alert("Success", "Your profile has been updated.");
      navigation.goBack();
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert("Error", "Failed to update profile. Please try again.");
    }
  };

  const handleImagePick = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled) {
        const { uri } = result.assets[0];
        const downloadURL = await uploadImage(uri);
        setUserData(prev => ({ ...prev, avatar: downloadURL }));
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert("Error", "Failed to pick image. Please try again.");
    }
  };

  const uploadImage = async (uri) => {
    const response = await fetch(uri);
    const blob = await response.blob();
    const filename = uri.substring(uri.lastIndexOf('/') + 1);
    const storage = getStorage();
    const storageRef = ref(storage, `avatars/${filename}`);
    await uploadBytes(storageRef, blob);
    return await getDownloadURL(storageRef);
  };

  return (
    <LinearGradient colors={['#4A90E2', '#50E3C2']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
            <Icon name="arrow-left" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>แก้ไขโปรไฟล์</Text>
          <TouchableOpacity onPress={handleSave} style={styles.iconButton}>
            <Icon name="check" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.formSection}>
          <TouchableOpacity onPress={handleImagePick} style={styles.avatarContainer}>
            <Image source={{ uri: userData.avatar || "https://via.placeholder.com/150" }} style={styles.avatar} />
            <View style={styles.editIconContainer}>
              <Icon name="camera" size={20} color="#FFF" />
            </View>
          </TouchableOpacity>

          <InputField
            label="ชื่อ-นามสกุล"
            value={userData.fullName}
            onChangeText={(text) => setUserData(prev => ({ ...prev, fullName: text }))}
          />
          <InputField
            label="อีเมล"
            value={userData.email}
            editable={false}
          />
          <InputField
            label="น้ำหนัก (กก.)"
            value={userData.weight}
            onChangeText={(text) => setUserData(prev => ({ ...prev, weight: text }))}
            keyboardType="numeric"
          />
          <InputField
            label="ส่วนสูง (ซม.)"
            value={userData.height}
            onChangeText={(text) => setUserData(prev => ({ ...prev, height: text }))}
            keyboardType="numeric"
          />

          {bmi && <Text style={styles.bmiLabel}>BMI: {bmi}</Text>}

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>บันทึกการเปลี่ยนแปลง</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

const InputField = ({ label, value, onChangeText, editable, keyboardType }) => (
  <View style={styles.inputContainer}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={onChangeText}
      editable={editable !== false}
      keyboardType={keyboardType || 'default'}
    />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingTop: 50,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: 'Kanit-Bold',
    color: "#FFF",
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  iconButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  formSection: {
    padding: 16,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: 20,
  },
  avatarContainer: {
    alignSelf: "center",
    marginBottom: 20,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: "#FFF",
  },
  editIconContainer: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#4A90E2",
    borderRadius: 20,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: "#333",
    fontFamily: 'Kanit-Regular',
  },
  input: {
    borderWidth: 1,
    borderColor: "#CCC",
    padding: 12,
    borderRadius: 8,
    fontFamily: 'Kanit-Regular',
    backgroundColor: "#FFF",
  },
  bmiLabel: {
    fontSize: 24,
    fontFamily: 'Kanit-Bold',
    marginVertical: 16,
    color: "#4A90E2",
    alignSelf: "center",
  },
  saveButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  saveButtonText: {
    fontSize: 18,
    color: "#FFF",
    fontFamily: 'Kanit-Bold',
  },
});

export default EditProfilePage;