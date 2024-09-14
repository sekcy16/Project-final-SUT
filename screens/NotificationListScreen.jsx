import React, { useEffect, useState, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, SafeAreaView, StatusBar } from 'react-native';
import { collection, getDocs, onSnapshot, query, where, orderBy, descending, doc, updateDoc } from 'firebase/firestore';
import { firebaseDB } from '../config/firebase.config';
import { getAuth } from 'firebase/auth';

export default function NotificationListScreen({ navigation }) {
  const [notifications, setNotifications] = useState([]);
  const unsubscribeRef = useRef(null); // To store the unsubscribe function

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const userId = getAuth().currentUser?.uid;
        if (userId) {
          const q = query(collection(firebaseDB, 'Notidetails'), where('userId', '==', userId), orderBy('date', descending));
          const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const notificationsList = querySnapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));
            setNotifications(notificationsList);
          });
          unsubscribeRef.current = unsubscribe; // Store unsubscribe function
        } else {
          console.error('No user is logged in.');
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchNotifications();

    // Cleanup function to unsubscribe from listener on unmount
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current(); // Unsubscribe from listener
      }
    };
  }, []);

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

  const handleMarkAsRead = async (notificationId) => {
    try {
      const docRef = doc(firebaseDB, "Notidetails", notificationId);
      await updateDoc(docRef, { read: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.item, styles.shadow, item.read ? null : styles.unread]} // Apply unread style if not read
      onPress={() => {
        // Update notification as read in Firestore on press
        handleMarkAsRead(item.id);
        navigation.navigate('NotificationDetailScreen', { item });
      }}
    >
      <View style={styles.avatarContainer}>
        <Image source={{ uri: 'https://via.placeholder.com/50' }} style={styles.avatar} />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.date}>{formatDateTime(item.date)}</Text>
      </View>
      {item.read ? null : ( // Only render unread indicator if notification is unread
        <View style={styles.unreadIndicator}>
          {/* Add a red circle here */}
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={styles.header.backgroundColor} />
      <FlatList
        data={notifications}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={() => (
          <Text style={styles.emptyText}>No notifications found.</Text>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
  item: {
    flexDirection: 'row',
    padding: 15,
    marginHorizontal: 20,
    marginVertical: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    elevation: 5,
    alignItems: 'center', // Ensures avatar and text stay aligned
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  avatarContainer: {
    marginRight: 15,
    width: 50,  // Ensure container has the same width as avatar
    height: 50, // Ensure container has the same height as avatar
    borderRadius: 25, // Half the width/height to make it a circle
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 25, // Make the image itself a circle
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  date: {
    fontSize: 12,
    color: '#888',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#999',
  },
  header: {
    backgroundColor: '#000',
    padding: 10,
    justifyContent: 'center',
  },
  unreadIndicator: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    backgroundColor: 'red',
    borderRadius: 4,
  },
});