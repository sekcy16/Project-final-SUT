import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Button,
  Image,
} from "react-native";
import { firebaseDB, firebaseAuth } from "../config/firebase.config";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import Icon from "react-native-vector-icons/Ionicons";
import {
  EmailAuthProvider,
  updateEmail,
  reauthenticateWithCredential,
} from "firebase/auth";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { avatars } from "../utils/supports"; // Import avatars
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { LinearGradient } from "expo-linear-gradient"; // Import LinearGradient

const EditProfilePage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [avatar, setAvatar] = useState(null);
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [bmi, setBmi] = useState("");
  const [isAvatarMenu, setIsAvatarMenu] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = firebaseAuth.currentUser;
        if (user) {
          const userDocRef = doc(firebaseDB, "users", user.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const userData = userDoc.data();
            setEmail(user.email || "");
            setFullName(userData.fullName || "");
            setAvatar(userData.profilePic || avatars[0]?.image.asset.url);
            setWeight(userData.weight?.toString() || "0");
            setHeight(userData.height?.toString() || "0");
          } else {
            console.error("No such document!");
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    // Calculate BMI whenever weight or height changes
    if (weight && height) {
      const weightKg = parseFloat(weight);
      const heightM = parseFloat(height) / 100; // Convert cm to meters
      if (heightM > 0) {
        const calculatedBmi = (weightKg / (heightM * heightM)).toFixed(2);
        setBmi(calculatedBmi);
      }
    }
  }, [weight, height]);

  const handleSave = async () => {
    try {
      const user = firebaseAuth.currentUser;
      if (!user) return;

      const userDocRef = doc(firebaseDB, "users", user.uid);
      await updateDoc(userDocRef, {
        fullName,
        profilePic: avatar,
        weight: parseFloat(weight) || 0,
        height: parseFloat(height) || 0,
        bmi: parseFloat(bmi) || 0,
      });

      if (email !== user.email) {
        if (!currentPassword) {
          Alert.alert(
            "Error",
            "Please enter your current password to update the email."
          );
          return;
        }
        const credential = EmailAuthProvider.credential(
          user.email,
          currentPassword
        );
        await reauthenticateWithCredential(user, credential);
        await updateEmail(user, email);
      }

      if (password && password !== "******") {
        if (!currentPassword) {
          Alert.alert(
            "Error",
            "Please enter your current password to update your password."
          );
          return;
        }
        const credential = EmailAuthProvider.credential(
          user.email,
          currentPassword
        );
        await reauthenticateWithCredential(user, credential);
        await user.updatePassword(password);
      }

      Alert.alert("Success", "Your profile has been updated.");
      navigation.goBack();
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert("Error", "Failed to update profile. Please try again.");
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.iconButton}
        >
          <Icon name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSave} style={styles.iconButton}>
          <Icon name="checkmark" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.formSection}>
        <TouchableOpacity
          onPress={() => setIsAvatarMenu(true)}
          style={styles.avatarContainer}
        >
          <Image source={{ uri: avatar }} style={styles.avatar} />
          <View style={styles.editIconContainer}>
            <Icon name="camera" size={20} color="#FFF" />
          </View>
        </TouchableOpacity>
        {isAvatarMenu && (
          <View style={styles.avatarMenu}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {avatars.map((item) => (
                <TouchableOpacity
                  key={item._id}
                  onPress={() => handleAvatarSelection(item)}
                >
                  <Image
                    source={{ uri: item?.image.asset.url }}
                    style={styles.avatarOption}
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              onPress={handleImagePickAndUpload}
              style={styles.pickImageButton}
            >
              <Text style={styles.pickImageText}>Choose and Upload Image</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.label}>Full Name</Text>
        <TextInput
          style={styles.input}
          value={fullName}
          onChangeText={setFullName}
          placeholder="Enter your full name"
        />
        <Text style={styles.label}>Email</Text>
        <Text style={styles.input}>{email}</Text>

        <Text style={styles.label}>Current Password</Text>
        <TextInput
          style={styles.input}
          value={currentPassword}
          onChangeText={setCurrentPassword}
          placeholder="Enter your current password"
          secureTextEntry
        />

        <Text style={styles.label}>New Password</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="Enter your new password (optional)"
          secureTextEntry
        />

        <Text style={styles.label}>Weight (kg)</Text>
        <TextInput
          style={styles.input}
          value={weight}
          onChangeText={setWeight}
          placeholder="Enter your weight"
          keyboardType="numeric"
        />

        <Text style={styles.label}>Height (cm)</Text>
        <TextInput
          style={styles.input}
          value={height}
          onChangeText={setHeight}
          placeholder="Enter your height"
          keyboardType="numeric"
        />

        <Text style={styles.bmiLabel}>BMI: {bmi}</Text>

        <TouchableOpacity style={styles.cartoonButton} onPress={handleSave}>
          <Text style={styles.cartoonButtonText}>Save Changes</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E6F4EA",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#004d00",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFF",
  },
  iconButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#006400",
  },
  formSection: {
    padding: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: "#004d00",
  },
  bmiLabel: {
    fontSize: 24, // Larger font size for BMI
    fontWeight: "bold",
    marginBottom: 16,
    color: "#004d00",
    alignSelf: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#004d00",
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
  },
  avatarContainer: {
    alignSelf: "center",
    marginBottom: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "#004d00",
  },
  editIconContainer: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#006400",
    borderRadius: 20,
    padding: 4,
  },
  avatarMenu: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  avatarOption: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginHorizontal: 8,
  },
  pickImageButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#004d00",
    borderRadius: 10,
    marginLeft: 10,
  },
  pickImageText: {
    color: "#FFF",
  },
  cartoonButton: {
    backgroundColor: "#4CAF50", // A soft green color
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20, // Rounded corners
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#388E3C", // Slightly darker green border
    elevation: 4, // For shadow effect on Android
    shadowColor: "#000", // Shadow color for iOS
    shadowOffset: { width: 0, height: 4 }, // Shadow offset
    shadowOpacity: 0.3, // Shadow opacity
    shadowRadius: 6, // Shadow blur radius
  },
  cartoonButtonText: {
    fontSize: 18,
    color: "#FFF", // White text color
    fontWeight: "bold",
  },
  editIconContainer: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#50D890",
    borderRadius: 20,
    padding: 6,
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 6,
  },
});

export default EditProfilePage;
