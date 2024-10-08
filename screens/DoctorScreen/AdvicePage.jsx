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

  const renderAdviceSection = (type, title) => (
    <View style={styles.adviceSection}>
      <View style={styles.adviceHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Switch
          value={adviceTypes[type].enabled}
          onValueChange={() => toggleAdviceType(type)}
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
        />
      )}
    </View>
  );

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
          {renderAdviceSection("eating", "Eating Advice")}
          {renderAdviceSection("exercise", "Exercise Advice")}
          {renderAdviceSection("additional", "Additional Advice")}

          <View style={styles.adviceSection}>
            <Text style={styles.sectionTitle}>Notification (Optional)</Text>
            <TextInput
              style={styles.input}
              onChangeText={(title) => setNotification(prev => ({ ...prev, title }))}
              value={notification.title}
              placeholder="Notification Title"
            />
            <TextInput
              style={[styles.input, { marginTop: 10 }]}
              multiline
              numberOfLines={4}
              onChangeText={(message) => setNotification(prev => ({ ...prev, message }))}
              value={notification.message}
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
          <Text style={styles.buttonText}>Confirm & Send</Text>
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
  adviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
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