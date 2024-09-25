import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  TextInput,
  ScrollView,
  Alert,
} from "react-native";
import { addDoc, collection, doc, setDoc } from "firebase/firestore";
import { firebaseDB } from "../../config/firebase.config";

const AdvicePage = ({ route, navigation }) => {
  const {
    patientName = "Unknown",
    patientAge = "Unknown",
    patientLevel = "Unknown",
    userId,
  } = route.params || {};

  const [eatingAdvice, setEatingAdvice] = useState("");
  const [exerciseAdvice, setExerciseAdvice] = useState("");
  const [additionalAdvice, setAdditionalAdvice] = useState("");
  const [notificationTitle, setNotificationTitle] = useState("");
  const [notificationMessage, setNotificationMessage] = useState("");

  const handleConfirm = async () => {
    if (!notificationTitle.trim() || !notificationMessage.trim()) {
      Alert.alert(
        "Error",
        "Both title and message are required for the notification."
      );
      return;
    }

    if (!userId) {
      Alert.alert("Error", "User ID is missing. Cannot send notification.");
      return;
    }

    try {
      // Add notification
      await addDoc(collection(firebaseDB, "Notidetails"), {
        title: notificationTitle,
        message: notificationMessage,
        userId: userId,
        sentBy: "Doctor",
        date: new Date().toISOString(),
        read: false,
      });

      // Add advice to patient's document
      const patientAdviceRef = doc(firebaseDB, "users", userId, "advice", new Date().toISOString());
      await setDoc(patientAdviceRef, {
        eatingAdvice,
        exerciseAdvice,
        additionalAdvice,
        date: new Date().toISOString(),
      });

      console.log("Advice and notification sent successfully!");

      Alert.alert(
        "Success",
        "Advice confirmed and notification sent successfully!"
      );
      navigation.goBack();
    } catch (error) {
      console.error("Error sending advice and notification:", error);
      Alert.alert("Error", "Failed to send advice and notification.");
    }
  };
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.name}>{patientName}</Text>
          <Text style={styles.details}>
            Age: {patientAge} | Diabetes Level: {patientLevel}
          </Text>
        </View>

        <View style={styles.contentContainer}>
          <View style={styles.adviceSection}>
            <Text style={styles.sectionTitle}>Eating Advice</Text>
            <TextInput
              style={styles.input}
              multiline
              numberOfLines={4}
              onChangeText={setEatingAdvice}
              value={eatingAdvice}
              placeholder="Provide advice on eating"
            />
          </View>

          <View style={styles.adviceSection}>
            <Text style={styles.sectionTitle}>Exercise Advice</Text>
            <TextInput
              style={styles.input}
              multiline
              numberOfLines={4}
              onChangeText={setExerciseAdvice}
              value={exerciseAdvice}
              placeholder="Provide advice on exercise"
            />
          </View>

          <View style={styles.adviceSection}>
            <Text style={styles.sectionTitle}>Additional Advice</Text>
            <TextInput
              style={styles.input}
              multiline
              numberOfLines={4}
              onChangeText={setAdditionalAdvice}
              value={additionalAdvice}
              placeholder="Provide additional advice"
            />
          </View>

          <View style={styles.adviceSection}>
            <Text style={styles.sectionTitle}>Notification</Text>
            <TextInput
              style={styles.input}
              onChangeText={setNotificationTitle}
              value={notificationTitle}
              placeholder="Notification Title"
            />
            <TextInput
              style={[styles.input, { marginTop: 10 }]}
              multiline
              numberOfLines={4}
              onChangeText={setNotificationMessage}
              value={notificationMessage}
              placeholder="Notification Message"
            />
          </View>
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.buttonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
          <Text style={styles.buttonText}>Confirm &amp; Send</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E8F0F2",
  },
  header: {
    backgroundColor: "#007BFF",
    padding: 20,
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
  },
  details: {
    fontSize: 16,
    color: "white",
  },
  contentContainer: {
    flex: 1,
    padding: 20,
  },
  adviceSection: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#007BFF",
  },
  input: {
    borderWidth: 1,
    borderColor: "#B0BEC5",
    borderRadius: 5,
    padding: 10,
    minHeight: 100,
    textAlignVertical: "top",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
  },
  backButton: {
    backgroundColor: "#FF6F61",
    borderRadius: 5,
    padding: 15,
    flex: 1,
    marginRight: 10,
    alignItems: "center",
  },
  confirmButton: {
    backgroundColor: "#007BFF",
    borderRadius: 5,
    padding: 15,
    flex: 1,
    marginLeft: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default AdvicePage;
