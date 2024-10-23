import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView, 
  StatusBar 
} from 'react-native';
import { collection, onSnapshot, query, where, orderBy, doc, updateDoc } from 'firebase/firestore';
import { firebaseDB } from '../config/firebase.config';
import { getAuth } from 'firebase/auth';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';

export default function NotificationListScreen() {
  const [notifications, setNotifications] = useState([]);
  const unsubscribeRef = useRef(null);
  const navigation = useNavigation();

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
    return date.toLocaleString('th-TH', {
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
        <Icon name="bell" size={24} color={item.read ? "#FFF" : "#FFEB3B"} />
        {!item.read && <View style={styles.unreadIndicator} />}
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.title, !item.read && styles.unreadText]}>{item.title}</Text>
        <Text style={styles.date}>{formatDateTime(item.date)}</Text>
      </View>
      <Icon name="chevron-right" size={24} color="#4A90E2" />
    </TouchableOpacity>
  );

  return (
    <LinearGradient colors={['#4A90E2', '#50E3C2']} style={styles.container}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>การแจ้งเตือน</Text>
        </View>
        <FlatList
          data={notifications}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Icon name="bell-off" size={50} color="#FFF" />
              <Text style={styles.emptyText}>ไม่มีการแจ้งเตือน</Text>
            </View>
          )}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerTitle: {
    fontSize: 24,
    color: '#FFF',
    marginLeft: 16,
    fontFamily: 'Kanit-Bold',
  },
  listContent: {
    paddingVertical: 10,
  },
  item: {
    flexDirection: 'row',
    padding: 15,
    marginHorizontal: 16,
    marginVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
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
    backgroundColor: '#FFF',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    marginBottom: 5,
    color: '#333',
    fontFamily: 'Kanit-Regular',
  },
  unreadText: {
    fontFamily: 'Kanit-Bold',
    color: '#4A90E2',
  },
  date: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Kanit-Regular',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    fontSize: 18,
    color: '#FFF',
    marginTop: 10,
    fontFamily: 'Kanit-Regular',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    position: 'relative', // Add this to position the unread indicator
  },
  unreadIndicator: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF3B30',
    borderWidth: 2,
    borderColor: '#FFF',
  },
});