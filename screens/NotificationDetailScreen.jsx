// NotificationDetailScreen.js
import React from 'react';
import { View, Text, ScrollView, StyleSheet, Image, TouchableOpacity } from 'react-native';

export default function NotificationDetailScreen({ route, navigation }) {
  const { item } = route.params;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image 
          source={{ uri: 'https://via.placeholder.com/50' }} 
          style={styles.avatar}
        />
        <View style={styles.headerText}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.date}>{item.date}</Text>
        </View>
        <TouchableOpacity onPress={() => {/* Handle delete */}}>
          <Text style={styles.deleteIcon}>🗑️</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.content}>
        <Text style={styles.message}>
          Dear Johny,

          Love isn't always a ray of sunshine. That's what the older girls kept
          telling her when she said she had found the perfect man. She had
          thought this was simply bitter talk on their part since they had been
          unable to find true love like hers. But now she had to face the fact that
          they may have been right. Love may not always be a ray of sunshine.
          That is unless they were referring to how the sun can burn.

          There was something in the tree. It was difficult to tell from the ground,
          but Rachel could see movement. She squinted her eyes and peered in
          the direction of the movement, trying to decipher exactly what she had
          spied. The more she peered, however, the more she thought it might be
          a figment of her imagination. Nothing seemed to move until the
          moment she began to take her eyes off the tree. Then in the corner of
          her eye, she would see the movement again and begin the process of
          staring again.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6FFF5',
  },
  header: {
    flexDirection: 'row',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  date: {
    fontSize: 14,
    color: '#999',
  },
  deleteIcon: {
    fontSize: 24,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  message: {
    fontSize: 16,
    lineHeight: 24,
  },
});
