// AddTaskScreen.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const AddTaskScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>เพิ่มงานใหม่</Text>
      {/* ส่วนประกอบสำหรับเพิ่มงาน */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});

export default AddTaskScreen;
