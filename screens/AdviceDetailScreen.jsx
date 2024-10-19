import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, StatusBar } from 'react-native';
import { deleteDoc, doc } from 'firebase/firestore';
import { firebaseDB } from '../config/firebase.config';
import { getAuth } from 'firebase/auth';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const GradientBackground = ({ children }) => (
  <View style={styles.gradientBackground}>
    {children}
  </View>
);

export default function AdviceDetailScreen({ route, navigation }) {
  const { advice } = route.params;
  const userId = getAuth().currentUser?.uid;

  const handleDelete = async () => {
    Alert.alert(
      "Delete Advice",
      "Are you sure you want to delete this advice?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(firebaseDB, 'users', userId, 'advice', advice.id));
              Alert.alert("Deleted", "The advice has been deleted.");
              navigation.goBack();
            } catch (error) {
              console.error('Error deleting advice:', error);
              Alert.alert("Error", "Failed to delete the advice.");
            }
          }
        }
      ]
    );
  };

  const formatDateTime = (timestamp) => {
    if (!timestamp) return 'Unknown date';
    const date = new Date(timestamp);
    return date.toLocaleString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    });
  };

  const renderAdviceSection = (title, content, iconName) => {
    if (!content) return null;
    return (
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Icon name={iconName} size={24} color="#1E88E5" />
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        <View style={styles.sectionContent}>
          <Text style={styles.sectionText}>{content}</Text>
        </View>
      </View>
    );
  };

  return (
    <GradientBackground>
      <StatusBar barStyle="light-content" />
      <ScrollView>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Icon name="clipboard-text" size={40} color="#FFF" />
          </View>
          <View style={styles.header}>
            <Text style={styles.title}>Medical Advice</Text>
            <Text style={styles.date}>
              <Icon name="clock-outline" size={16} color="#689F38" /> {formatDateTime(advice.date)}
            </Text>
            <Text style={styles.sender}>
              <Icon name="account-outline" size={16} color="#689F38" /> {advice.sentBy || "Doctor"}
            </Text>
          </View>

          {renderAdviceSection("Eating Advice", advice.eatingAdvice, "food-apple")}
          {renderAdviceSection("Exercise Advice", advice.exerciseAdvice, "run")}
          {renderAdviceSection("Additional Advice", advice.additionalAdvice, "note-text")}
        </View>

        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Icon name="delete" size={24} color="#FFF" />
          <Text style={styles.deleteButtonText}>Delete Advice</Text>
        </TouchableOpacity>
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  gradientBackground: {
    flex: 1,
    backgroundColor: '#E3F2FD',
  },
  content: {
    margin: 16,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 5,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#1E88E5',
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: -40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  header: {
    marginBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontFamily: 'Kanit-Bold',
    color: '#1E88E5',
    marginBottom: 10,
    textAlign: 'center',
  },
  date: {
    fontSize: 14,
    color: '#689F38',
    fontFamily: 'Kanit-Regular',
    marginBottom: 5,
  },
  sender: {
    fontSize: 14,
    color: '#689F38',
    fontFamily: 'Kanit-Regular',
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Kanit-Bold',
    color: '#1E88E5',
    marginLeft: 10,
  },
  sectionContent: {
    backgroundColor: '#E3F2FD',
    borderRadius: 10,
    padding: 15,
  },
  sectionText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#1565C0',
    fontFamily: 'Kanit-Regular',
  },
  deleteButton: {
    flexDirection: 'row',
    backgroundColor: '#FF5722',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Kanit-Bold',
    marginLeft: 10,
  },
});