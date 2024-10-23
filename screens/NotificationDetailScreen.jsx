import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, StatusBar } from 'react-native';
import { deleteDoc, doc } from 'firebase/firestore';
import { firebaseDB } from '../config/firebase.config';

const GradientBackground = ({ children }) => (
  <View style={styles.gradientBackground}>
    {children}
  </View>
);

export default function NotificationDetailScreen({ route, navigation }) {
  const { item } = route.params;

  const handleDelete = async () => {
    Alert.alert(
      "Delete Notification",
      "Are you sure you want to delete this notification?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(firebaseDB, 'Notidetails', item.id));
              Alert.alert("Deleted", "The notification has been deleted.");
              navigation.goBack();
            } catch (error) {
              console.error('Error deleting notification:', error);
              Alert.alert("Error", "Failed to delete the notification.");
            }
          }
        }
      ]
    );
  };

  const formatDateTime = (timestamp) => {
    if (!timestamp) return 'Unknown date';
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    });
  };

  return (
    <GradientBackground>
      <StatusBar barStyle="light-content" />
      <ScrollView>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Text style={styles.iconText}>🔔</Text>
          </View>
          <View style={styles.header}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.date}>
              🕒 {formatDateTime(item.date)}
            </Text>
          </View>
          <View style={styles.messageContainer}>
            <Text style={styles.message}>{item.message}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteIcon}>🗑️</Text>
          <Text style={styles.deleteButtonText}>Delete Notification</Text>
        </TouchableOpacity>
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  gradientBackground: {
    flex: 1,
    backgroundColor: '#E8F5E9',
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
    backgroundColor: '#4CAF50',
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
  iconText: {
    fontSize: 40,
    color: '#FFF',
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1B5E20',
    marginBottom: 10,
    textAlign: 'center',
  },
  date: {
    fontSize: 14,
    color: '#689F38',
    textAlign: 'center',
  },
  messageContainer: {
    backgroundColor: '#C8E6C9',
    borderRadius: 10,
    padding: 15,
  },
  message: {
    fontSize: 16,
    lineHeight: 24,
    color: '#2E7D32',
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
  deleteIcon: {
    marginRight: 10,
    fontSize: 24,
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});