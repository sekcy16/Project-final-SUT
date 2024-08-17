import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Image } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

const DoctorHomePage = () => {
  const navigation = useNavigation();
  const [tasks, setTasks] = useState([
    { id: 1, time: '9:00', title: 'Johny', description: 'ตรวจวัดระดับน้ำตาลในเลือด', completed: true },
    { id: 2, time: '10:00', title: 'Jackky', description: 'ตรวจอาการทั่วไปและการออกกำลังกาย', completed: true },
    { id: 3, time: '12:00', title: 'พักผ่อน', description: 'พัก', completed: true },
  ]);
  const [newTask, setNewTask] = useState('');
  const [blogs, setBlogs] = useState([]);

  useEffect(() => {
    setBlogs([
      { id: 1, title: 'แนวทางการออกกำลังกายสำหรับผู้ป่วยเบาหวาน', author: 'Dr.K', color: 'red' },
      { id: 2, title: 'วิธีจัดการความเครียด จากการออกกำลังกาย', author: 'Dr.C', color: 'green' },
      { id: 3, title: 'ไฟเบอร์คืออะไร? ทำไมทุกคนควรกินไฟเบอร์?', author: 'Dr.A', color: 'blue' },
    ]);
  }, []);

  const addTask = () => {
    if (newTask.trim() !== '') {
      setTasks([...tasks, { id: Date.now(), time: '12:00', title: newTask, description: '', completed: false }]);
      setNewTask('');
    }
  };

  const toggleTask = (id) => {
    setTasks(tasks.map(task => task.id === id ? { ...task, completed: !task.completed } : task));
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.profileContainer}>
          <Icon name="person-circle-outline" size={40} color="#FFF" />
          <Text style={styles.profileText}>Dr.KK</Text>
        </View>
        <TouchableOpacity
          style={styles.notificationIcon}
          onPress={() => navigation.navigate('NotificationList')}
        >
          <Icon name="notifications-outline" size={24} color="#000" style={styles.icon} />
        </TouchableOpacity>

      </View>

      <ScrollView style={styles.content}>
        <View style={styles.todoContainer}>
          <Text style={styles.sectionTitle}>ตารางวันนี้</Text>
          {tasks.map((task) => (
            <View key={task.id} style={styles.taskCard}>
              <Text style={styles.taskTime}>{task.time}</Text>
              <View style={styles.taskContent}>
                <Text style={[styles.taskTitle, task.completed && styles.taskCompleted]}>{task.title}</Text>
                <Text style={styles.taskDescription}>{task.description}</Text>
              </View>
              <View style={styles.taskActions}>
                <TouchableOpacity onPress={() => toggleTask(task.id)}>
                  <Icon name={task.completed ? "checkmark-circle" : "ellipse-outline"} size={24} color={task.completed ? "#4CAF50" : "#000"} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deleteTask(task.id)}>
                  <Icon name="close-circle-outline" size={24} color="#FF0000" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
          <View style={styles.addTaskContainer}>
            <TextInput
              style={styles.input}
              value={newTask}
              onChangeText={setNewTask}
              placeholder="เพิ่มงานใหม่"
              placeholderTextColor="#888"
            />
            <TouchableOpacity style={styles.addButton} onPress={addTask}>
              <Icon name="add" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.blogContainer}>
          <Text style={styles.sectionTitle}>บทความ</Text>
          {blogs.map((blog) => (
            <TouchableOpacity key={blog.id} style={styles.blogItem}>
              <View style={styles.blogContent}>
                <Text style={styles.blogTitle}>{blog.title}</Text>
                <View style={styles.blogInfo}>
                  <View style={[styles.authorIndicator, { backgroundColor: blog.color }]} />
                  <Text style={styles.blogAuthor}>{blog.author}</Text>
                </View>
              </View>
              <Icon name="bookmark-outline" size={24} color="#000" />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6FFF5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#4CAF50',
    elevation: 4, // Adding elevation for shadow effect
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  content: {
    flex: 1,
  },
  todoContainer: {
    backgroundColor: '#FFF',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 4, // Adding elevation for shadow effect
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 12,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#F9F9F9',
    borderRadius: 10,
    elevation: 2,
  },
  taskTime: {
    width: 50,
    fontSize: 14,
    color: '#555',
  },
  taskContent: {
    flex: 1,
    marginLeft: 8,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  taskCompleted: {
    color: '#4CAF50',
    textDecorationLine: 'line-through',
  },
  taskDescription: {
    fontSize: 14,
    color: '#666',
  },
  taskActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addTaskContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 5,
    padding: 10,
    marginRight: 8,
  },
  addButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 5,
    padding: 10,
  },
  blogContainer: {
    backgroundColor: '#FFF',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 4, // Adding elevation for shadow effect
  },
  blogItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  blogContent: {
    flex: 1,
  },
  blogTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  blogInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  authorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  blogAuthor: {
    fontSize: 14,
    color: '#888',
  },
  notificationIcon: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  icon: {
    width: 24,
    height: 24,
  },
});

export default DoctorHomePage;
