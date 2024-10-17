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
  Switch,
} from "react-native";
import { addDoc, collection, doc, setDoc } from "firebase/firestore";
import { firebaseDB } from "../../config/firebase.config";
import { LinearGradient } from "expo-linear-gradient";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

const AdvicePage = ({ route, navigation }) => {
  const {
    patientName = "Unknown",
    patientAge = "Unknown",
    patientLevel = "Unknown",
    patientId,
  } = route.params || {};

  // State for advice sections
  const [adviceTypes, setAdviceTypes] = useState({
    eating: { enabled: false, content: "" },
    exercise: { enabled: false, content: "" },
    additional: { enabled: false, content: "" },
  });
  
  // State for notification
  const [notification, setNotification] = useState({
    title: "",
    message: "",
  });

  const toggleAdviceType = (type) => {
    setAdviceTypes(prev => ({
      ...prev,
      [type]: { ...prev[type], enabled: !prev[type].enabled }
    }));
  };

  const updateAdviceContent = (type, content) => {
    setAdviceTypes(prev => ({
      ...prev,
      [type]: { ...prev[type], content }
    }));
  };

  const handleConfirm = async () => {
    if (!patientId) {
      Alert.alert("Error", "Patient ID is missing. Cannot send advice.");
      return;
    }

    try {
      // Prepare advice data
      const adviceData = {
        date: new Date().toISOString(),
        sentBy: "Doctor",
      };

      // Only include enabled advice types
      Object.entries(adviceTypes).forEach(([type, data]) => {
        if (data.enabled && data.content.trim()) {
          adviceData[`${type}Advice`] = data.content.trim();
        }
      });

      // Check if any advice is enabled and has content
      const hasAdvice = Object.values(adviceTypes).some(
        type => type.enabled && type.content.trim()
      );

      if (!hasAdvice) {
        Alert.alert("Error", "Please enable and fill at least one advice type.");
        return;
      }

      const patientAdviceRef = doc(firebaseDB, "users", patientId, "advice", new Date().toISOString());
      await setDoc(patientAdviceRef, adviceData);

      if (notification.title.trim() && notification.message.trim()) {
        await addDoc(collection(firebaseDB, "Notidetails"), {
          title: notification.title,
          message: notification.message,
          userId: patientId, 
          sentBy: "Doctor",
          date: new Date().toISOString(),
          read: false,
        });
      }

      Alert.alert("Success", "Advice sent successfully!");
      navigation.goBack();
    } catch (error) {
      console.error("Error sending advice:", error);
      Alert.alert("Error", "Failed to send advice.");
    }
  };

  const renderAdviceSection = (type, title, icon) => (
    <View style={styles.adviceSection}>
      <View style={styles.adviceHeader}>
        <Icon name={icon} size={24} color="#1E88E5" style={styles.adviceIcon} />
        <Text style={styles.sectionTitle}>{title}</Text>
        <Switch
          value={adviceTypes[type].enabled}
          onValueChange={() => toggleAdviceType(type)}
          trackColor={{ false: "#767577", true: "#81b0ff" }}
          thumbColor={adviceTypes[type].enabled ? "#1E88E5" : "#f4f3f4"}
        />
      </View>
      {adviceTypes[type].enabled && (
        <TextInput
          style={styles.input}
          multiline
          numberOfLines={4}
          onChangeText={(content) => updateAdviceContent(type, content)}
          value={adviceTypes[type].content}
          placeholder={`Provide ${type} advice`}
          placeholderTextColor="#999"
        />
      )}
    </View>
  );

  return (
    <LinearGradient colors={["#4A90E2", "#50E3C2"]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.name}>{patientName}</Text>
            <Text style={styles.details}>
              Age: {patientAge} | Diabetes Level: {patientLevel}
            </Text>
          </View>

          <View style={styles.contentContainer}>
            {renderAdviceSection("eating", "Eating Advice", "food-apple")}
            {renderAdviceSection("exercise", "Exercise Advice", "run")}
            {renderAdviceSection("additional", "Additional Advice", "note-text")}

            <View style={styles.adviceSection}>
              <Text style={styles.sectionTitle}>Notification (Optional)</Text>
              <TextInput
                style={styles.input}
                onChangeText={(title) => setNotification(prev => ({ ...prev, title }))}
                value={notification.title}
                placeholder="Notification Title"
                placeholderTextColor="#999"
              />
              <TextInput
                style={[styles.input, { marginTop: 10 }]}
                multiline
                numberOfLines={4}
                onChangeText={(message) => setNotification(prev => ({ ...prev, message }))}
                value={notification.message}
                placeholder="Notification Message"
                placeholderTextColor="#999"
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
            <Text style={styles.buttonText}>Confirm & Send</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 20,
    paddingHorizontal: 15,
  },
  header: {
    padding: 20,
    marginBottom: 20,
  },
  name: {
    fontSize: 24,
    fontFamily: "Kanit-Bold",
    color: "#1E88E5",
  },
  details: {
    fontSize: 16,
    fontFamily: "Kanit-Regular",
    color: "#666",
  },
  contentContainer: {
    padding: 20,
  },
  adviceSection: {
    backgroundColor: "#FFF",
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  adviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  adviceIcon: {
    marginRight: 10,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 18,
    fontFamily: "Kanit-Bold",
    color: "#1E88E5",
  },
  input: {
    borderWidth: 1,
    borderColor: "#B0BEC5",
    borderRadius: 5,
    padding: 10,
    minHeight: 100,
    textAlignVertical: "top",
    fontFamily: "Kanit-Regular",
    fontSize: 16,
    color: "#333",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
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
    backgroundColor: "#1E88E5",
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
    fontFamily: "Kanit-Bold",
  },
});

export default AdvicePage;