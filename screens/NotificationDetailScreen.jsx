import React from 'react';
import { View, Text, ScrollView, StyleSheet, Image, TouchableOpacity, Alert } from 'react-native';
import { deleteDoc, doc } from 'firebase/firestore'; // For Firestore delete functionality
import { firebaseDB } from '../config/firebase.config'; // Ensure correct path to config

export default function NotificationDetailScreen({ route, navigation }) {
  const { item } = route.params;

  const handleDelete = async () => {
    try {
      await deleteDoc(doc(firebaseDB, 'Notidetails', item.id)); // Delete the document by its ID
      Alert.alert("Notification Deleted", "This notification has been deleted.");
      navigation.goBack(); // Navigate back to the list screen after deletion
    } catch (error) {
      console.error('Error deleting notification:', error);
      Alert.alert("Error", "Failed to delete the notification.");
    }
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
    <ScrollView style={styles.container}>
      {/* Notification Header */}
      <View style={styles.header}>
        <Image source={{ uri: 'https://via.placeholder.com/50' }} style={styles.avatar} />
        <View style={styles.headerContent}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.date}>{formatDateTime(item.date)}</Text>
        </View>
        <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
          <Text style={styles.deleteIcon}>❌</Text>
        </TouchableOpacity>
      </View>

      {/* Notification Message */}
      <View style={styles.content}>
        <Text style={styles.message}>{item.message}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
  header: {
    flexDirection: 'row',
    padding: 20,
    marginHorizontal: 0,
    marginTop: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 0, // No rounding at the top-left corner
    borderTopRightRadius: 0, // No rounding at the top-right corner
    borderBottomLeftRadius: 10, // Rounded bottom-left corner
    borderBottomRightRadius: 10, // Rounded bottom-right corner
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  date: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  deleteButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FDECEA',
    borderRadius: 50,
  },
  deleteIcon: {
    fontSize: 18,
    color: '#FF3B30',
  },
  content: {
    padding: 20,
  },
  message: {
    fontSize: 16,
    lineHeight: 24,
  },
});

