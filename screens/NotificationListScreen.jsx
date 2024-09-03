// NotificationListScreen.js
import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image,SafeAreaView } from 'react-native';

const notificationData = [
  { id: '1', title: 'Dr.KK', subtitle: 'ทดสอบหัวข้อการแจ้งเตือน', date: '10/04/2566' },
  { id: '2', title: 'Admin', subtitle: 'ทดสอบหัวข้อ อื่นๆ', date: '10/04/2566' },
];

export default function NotificationListScreen({ navigation }) {
  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.item}
      onPress={() => navigation.navigate('NotificationDetailScreen', { item })}
    >
      <Image 
        source={{ uri: 'https://via.placeholder.com/50' }} 
        style={styles.avatar}
      />
      <View style={styles.textContainer}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.subtitle}>{item.subtitle}</Text>
      </View>
      <Text style={styles.date}>{item.date}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={notificationData}
        renderItem={renderItem}
        keyExtractor={item => item.id}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor:'#F6FFF5',
  },
  item: {
    flexDirection: 'row',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    color: '#777',
  },
  date: {
    fontSize: 12,
    color: '#999',
  },
});