import React, { useEffect, useState, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import { collection, onSnapshot, query, where, orderBy, doc, updateDoc } from 'firebase/firestore';
import { firebaseDB } from '../config/firebase.config';
import { getAuth } from 'firebase/auth';

const GradientBackground = ({ children }) => (
  <View style={styles.gradientBackground}>
    {children}
  </View>
);

export default function NotificationListScreen({ navigation }) {
  const [notifications, setNotifications] = useState([]);
  const unsubscribeRef = useRef(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const userId = getAuth().currentUser?.uid;
        if (userId) {
          const q = query(
            collection(firebaseDB, 'Notidetails'),
            where('userId', '==', userId),
            orderBy('date', 'desc')
          );
          const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const notificationsList = querySnapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));
            setNotifications(notificationsList);
          });
          unsubscribeRef.current = unsubscribe;
        } else {
          console.error('No user is logged in.');
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchNotifications();

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
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
      style={[styles.item, item.read ? styles.read : styles.unread]}
      onPress={() => {
        handleMarkAsRead(item.id);
        navigation.navigate('NotificationDetailScreen', { item });
      }}
    >
      <View style={styles.iconContainer}>
        <Text style={[styles.icon, !item.read && styles.unreadIcon]}>🔔</Text>
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.title, !item.read && styles.unreadText]}>{item.title}</Text>
        <Text style={styles.date}>{formatDateTime(item.date)}</Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );

  return (
    <GradientBackground>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Notifications</Text>
        </View>
        <FlatList
          data={notifications}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🔔</Text>
              <Text style={styles.emptyText}>No notifications yet</Text>
            </View>
          )}
        />
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  gradientBackground: {
    flex: 1,
    backgroundColor: '#E8F5E9',
  },
  container: {
    flex: 1,
  },
  header: {
    backgroundColor: '#4CAF50',
    padding: 20,
    alignItems: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
  },
  listContent: {
    paddingVertical: 10,
  },
  item: {
    flexDirection: 'row',
    padding: 15,
    marginHorizontal: 10,
    marginVertical: 5,
    backgroundColor: 'white',
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  read: {
    opacity: 0.7,
  },
  unread: {
    backgroundColor: '#C8E6C9',
  },
  iconContainer: {
    marginRight: 15,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 20,
    color: '#FFF',
  },
  unreadIcon: {
    color: '#FFEB3B',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    marginBottom: 5,
    color: '#1B5E20',
  },
  unreadText: {
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  date: {
    fontSize: 12,
    color: '#689F38',
  },
  chevron: {
    fontSize: 24,
    color: '#4CAF50',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  emptyIcon: {
    fontSize: 50,
    color: '#4CAF50',
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    color: '#4CAF50',
  },
});